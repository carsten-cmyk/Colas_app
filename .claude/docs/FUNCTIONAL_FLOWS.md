# Functional Flows — Colas Transport Apps

Dette dokument beskriver cross-app flows på komponent-niveau.
Opdateres af architect-agenten ved hvert /develop-screen kald.
Opdateres manuelt når forretningsregler beskrives der ikke fremgår af kode.

---

## Flow 1: Bilbestilling — Formand → Vognmand → Chauffør

**Trigger:** Formand planlægger asfalt-kørsel på en dag

### Trin 1 — Formand planlægger
**App:** formand
**Komponent:** `OrdrePlanScreen` → asfalt-kørsel sektion
**Handling:** Formand udfylder km, **kommentar til chauffør**, **forventet tidspunkt for første læs på udlægning** OG **interval mellem læs på pladsen** (minutter) per dag. Første-læs + interval er kritisk for både fabrik-notifikation (se Trin 5b) og vognmandens disponering (se Trin 3).

**Første-læs-regel (LÅST 2026-05-22):** Den FØRSTE bil formanden tilføjer til asfalt-kørselsbestillingen er pr. definition "første-læs"-bilen. Rækkefølgen i bestillingen er semantisk — første bil = første læs, anden bil = andet læs osv. Formanden behøver ikke vælge eksplicit. Information forventes synlig overfor vognmanden i hans disponerings-view (se Trin 3).

**Interval-regel (LÅST 2026-05-26):** Formanden angiver et **interval i minutter** mellem hvert efterfølgende læs på pladsen (typisk 12-20 min). Bilerne skal ikke alle stå klar på fabrikken kl. X — de skal **forskydes** så de ankommer pladsen i en jævn strøm. Vognmandens disponering bruger intervallet til at beregne ankomst-tid pr. bil → tilbageregnet til mødetid på fabrik pr. bil (afhænger af `driveTimeMinutes` fra fabrik til plads). Eksempel: første læs på plads 07:15, interval 15 min, fabrik→plads 36 min → bil 1 fabrik 06:39 / bil 2 fabrik 06:54 / bil 3 fabrik 07:09.

**Kommentar til chauffør (LÅST 2026-05-22):** Feltet i bunden af bilbestillingen er omdøbt fra "Kommentar til formanden" → **"Kommentar til chauffør"**. Indholdet skal sendes sammen med ordren TIL CHAUFFØREN (synlig i chauffeur-appen — se Trin 8 / Flow 3). Formand bruger feltet til at give kørselsspecifikke instruktioner: "Brug bagvejen", "Lav støj-restriktion efter 22", "Aflæsningssted er flyttet 50m mod vest" osv.

**Skriver til:** `orders.asfalt_koersel[].planlagt = true`, `orders.asfalt_koersel[].kommentar_til_chauffoer`, `orders.asfalt_koersel[].foerste_laes_udlaegning_tid`, `orders.asfalt_koersel[].interval_minutter_mellem_laes`, `orders.asfalt_koersel[].biler[]` (ordnet array — index 0 = første læs)

### Trin 2 — Formand ser afventende status
**App:** formand
**Komponent:** `VognmandBekraeftelseBadge`
**Viser:** Gult "Afventer vognmand" badge når kørsel er planlagt men ikke bekræftet
**Læser:** `orders.asfalt_koersel[].confirmed_vehicles` (tom = afventer)

### Trin 3 — Vognmand ser bestilling med første-læs + interval
**App:** vognmand
**Komponent:** `OrdreKort` (liste-view + gantt), `VognmandDisponeringsScreen` (drag-and-drop)
**Viser:** Ordre med asfalt-kørsel linjer, åben/disponeret status. Formandens **første-læs på plads** + **interval** er tydeligt synlige PÅ ordre-kortet (liste + gantt) — IKKE skjult bag klik. Eksempel: `Første læs 07:15 · +15 min`.
**Læser:** `orders` WHERE `asfalt_koersel[].planlagt = true`

**Visuel markering på ordre-kort (LÅST 2026-05-22, udvidet 2026-05-26):**
- "Første læs"-tid + interval vises som lille rubrik på kortet med clock/stopwatch-ikon
- I disponerings-view's dag-tabel: kolonnen "Mødetid" er erstattet af **"Første læs · interval"** — celle viser fx `07:15 · +15 min`

**Per-bil læs-nummer (LÅST 2026-05-26):**
Når vognmanden trækker biler ind i drop-zonen, får hver placeret bil automatisk:
- **Læs-nummer-badge** ("1. læs", "2. læs", "3. læs"…) baseret på drop-rækkefølge
- **Ankomst-tid på plads**: `ankomstPlads = førsteLæsPåPlads + (index) × intervalMinutter`
- **Tilbageregnet mødetid på fabrik** (i tooltip eller sekundær linje): `mødetidFabrik = ankomstPlads − driveTimeMinutes`
- Eksempel chip: `[1. læs] 🚛 XE32114 · Lars · 07:15`  (tooltip: `1. læs · plads 07:15 · fabrik 06:39`)
- Læs-nummer **omberegnes automatisk** hvis vognmand fjerner en bil i midten (array-index bestemmer)

### Trin 4 — Vognmand disponerer bil
**App:** vognmand
**Komponent:** `VognmandDisponeringsScreen` — drag-and-drop bil hen over dag-række
**Skriver til:** `orders.asfalt_koersel[].confirmed_vehicles[]` med per-bil objekt:
```
{
  reg_nr: string,
  chauffoer_navn: string,
  chauffoer_tlf: string,
  bil_type: string,
  laes_nummer: number,           // 1, 2, 3… (drop-rækkefølge)
  ankomst_plads_tid: string,     // HH:MM — beregnet fra første-læs + interval
  moedetid_fabrik: string,       // HH:MM — tilbageregnet fra ankomst_plads − driveTimeMinutes
}
```
Disse felter sendes retur til formand (Trin 7) og til chauffør (Trin 8) — hver chauffør får KUN sin egen mødetid_fabrik.

### Trin 5 — Vognmand bekræfter
**App:** vognmand
**Komponent:** `GodkendFlow` — bekræftelsesside
**Skriver til:** `orders.asfalt_koersel[].bekraeftet_af_vognmand = true`

### Trin 5b — Fabrik notificeres om afhentningstidspunkt (LÅST 2026-05-22, udvidet 2026-05-26)
**App:** (fabrik-system / integration)
**Trigger:** Formand sender bil-bestilling (eller vognmand bekræfter) — afhængigt af hvor langt fremme i flowet fabrikken skal vide besked.
**Beregning per bil (efter interval-modellen LÅST 2026-05-26):**
- `ankomst_plads_n = foerste_laes_udlaegning_tid + (n−1) × interval_minutter_mellem_laes`
- `moedetid_fabrik_n = ankomst_plads_n − driveTimeMinutes`
- `driveTimeMinutes` hentes fra `orders.factory.driveTimeMinutes`
- Eksempel: første læs på plads 07:30, interval 15 min, drive time 36 min:
  - Bil 1 (1. læs): plads 07:30 → fabrik 06:54
  - Bil 2 (2. læs): plads 07:45 → fabrik 07:09
  - Bil 3 (3. læs): plads 08:00 → fabrik 07:24

**Skriver til:** fabrik-system får en **liste af afhentninger** (ikke én samlet tid):
  - `pickups[]: { reg_nr, chauffoer_navn, laes_nummer, pickup_time_fabrik, produkter[], samles_paa_en_bil_flag }`
  - Bygges fra `confirmed_vehicles[]` (Trin 4) når vognmand bekræfter (Trin 5) — eller fra placeholder-rækker hvis fabrik skal vide besked før vognmand-bekræftelse

**Hvorfor:** Fabrik skal kunne planlægge produktion + tilberedning så asfalten er klar når chauffør ankommer. Uden eksplicit afhentnings-tid kan fabrik ikke optimere timing eller advare om kapacitet.

**🟡 ÅBNE SPØRGSMÅL:**
- Hvilket fabrik-system integreres der med (Danvægt? Anden ERP)? Eller skal det være en simpel webhook/API-call?
- Skal beregningen kompenseres for læsse-tid på fabrik (fx +10 min buffer)?
- Hvad sker der hvis chauffør ankommer tidligere/senere end planlagt — re-notifikation eller bare ETA-update?

### Trin 6 — Formand ser bekræftelse
**App:** formand
**Komponent:** `VognmandBekraeftelseBadge`
**Viser:** Grønt "Bekræftet af vognmand" badge
**Læser:** `orders.asfalt_koersel[].bekraeftet_af_vognmand`

### Trin 7 — Formand ser bildetaljer i Udførelse
**App:** formand
**Komponent:** `BekraeftetBilKort` (Udførelse → Forundersøgelse sektion)
**Viser per bil:** reg.nr, chauffør-navn, chauffør-tlf, biltype, **læs-nummer** ("1. læs", "2. læs"…), **ankomst på plads** (HH:MM), **mødetid fabrik** (HH:MM)
**Læser:** `orders.asfalt_koersel[].confirmed_vehicles[]` — alle felter inkl. læs-nummer + per-bil tider (se Trin 4)
**Note:** Formanden kan ringe direkte til chaufføren via tlf og se hvilken læs-rolle bilen har, så han kan koordinere ved afvigelser.

### Trin 8 — Chauffør modtager ordre
**App:** chauffeur (React Native)
**Komponent:** `TaskCard`, `TaskDetailScreen`
**Viser:** Ordredetaljer, lokation, kontakt, **chaufførens egen mødetid på fabrik** (HH:MM — afhængig af læs-nummer), **læs-nummer** ("Du er 2. læs"), OG **kommentar til chauffør** (`kommentar_til_chauffoer` fra bilbestillingen — kørselsspecifikke instruktioner fra formand).
**Læser:** `assigned_tasks` WHERE `driver_phone = auth.user.phone` OR `truck_plate = chauffeur.plate`, henter KUN denne chaufførs `confirmed_vehicles[]`-row (filtreret på reg_nr/tlf) — sin **moedetid_fabrik** + **laes_nummer** vises prominent.
**Vigtigt:** Mødetiden på fabrik er **forskellig pr. læs-nummer** — 1. læs møder først, 2. læs møder `intervalMinutter` senere osv. Chaufføren ser KUN sin egen — ikke de andre biler.
**Note:** Chauffør identificeres via tlf-nummer og nummerplade — ikke login.
**TBD:** Distributions-mekanisme — push-notifikation, polling, eller event på reg.nr? Skal afklares før prod.

### Variant: "Egen bil"-flow (LÅST 2026-05-22) — Formand → Chauffør (uden vognmand)

**Trigger:** Formanden vælger **"Egen bil"** som biltype i biltype-dropdown'en under Asfaltbestilling (allerede første option i listen — se [[project_dagsoversigt_business_rules]]). Egen bil = holdets/projektets egen bil, IKKE en bil fra vognmandens flåde.

**Forskelle fra standard-flow:**
- **Trin 3-6 (vognmand) SPRINGES OVER** — vognmanden modtager IKKE en bestilling, fordi bilen ikke skal disponeres af vognmand
- Bestillingen sendes DIREKTE fra formand til chauffør
- `orders.asfalt_koersel[].egen_bil = true` (nyt data-flag)
- `orders.asfalt_koersel[].bekraeftet_af_vognmand` er N/A — bestillingen er auto-bekræftet ved formand-send
- Vognmand-badge i formand-UI viser "Egen bil" (ikke "Afventer vognmand" eller "Bekræftet af vognmand")
- Trin 5b (fabrik-notifikation) gælder STADIG — fabrik skal vide hvornår egen bil ankommer, samme beregning, kun chauffør-data udfyldes fra formand i stedet for vognmand

**Trin EB-1 — Formand vælger Egen bil + chauffør**
**App:** formand
**Komponent:** `OrdrePlanScreen` → Asfaltbestilling biltype-dropdown
**Handling:** Formand vælger "Egen bil" + vælger/tilknytter chauffør. Felter til reg.nr + chauffør dukker op når Egen bil er valgt — bestillingen kan ikke disponeres af vognmand.
**Skriver til:** `orders.asfalt_koersel[].egen_bil = true`, `orders.asfalt_koersel[].confirmed_vehicles[]` med `{ reg_nr, chauffoer_navn, tlf, bil_type: 'egen_bil' }` (auto-fyldt selvom vognmand ikke er involveret).

**🟡 SPØRGSMÅL TIL IMPLEMENTERING:** Skal egne chauffører **oprettes manuelt af formand** ELLER **arves automatisk fra holdpakken** (ordrens tilknyttede medarbejdere — se Flow 2 Trin 0)? Brugeren afklarer dette inden Egen-bil-flow implementeres. **HUSK at spørge ved start af implementering.**

**Trin EB-2 — Ordren sendes direkte til chauffør-app**
**App:** chauffeur (React Native)
**Komponent:** `TaskCard`, `TaskDetailScreen` (samme som Trin 8)
**Distribution:** Push-notifikation direkte til chauffør-tlf — ingen vognmand-disponering imellem.
**Læser:** `assigned_tasks` WHERE `driver_phone = auth.user.phone` AND `egen_bil = true`
**Viser:** Identisk task-UI som vognmand-disponeret bil, men med eventuel "Egen bil"-indikator hvis relevant (TBD om dette er nødvendigt — chaufføren ved jo at det er hans egen bil).
**Forudsætning (LÅST 2026-05-22):** App er ALTID installeret hos egne chauffører (forretningskrav). Ingen verifikation eller fallback-flow nødvendigt.

**Trin EB-3 — Resten af flowet kører normalt, med ÉN forskel: afregning altid på timer**
Fabrik-notifikation (Trin 5b), Ankomst til fabrik (Flow 3) fungerer som normalt.

**Afregning (LÅST 2026-05-22):** Egen bil afregnes **ALTID på timer** — IKKE akkord. Ingen 1,5-times-regel relevant fordi der ikke er en akkord-aftale med en ekstern vognmand at beskytte. Bilen er intern, så timeregistrering er den eneste afregningsform.

Konkret i `BilAfregning`-expanderen (Udførelse-mode):
- `effectiveType = 'time'` hardcoded for `egen_bil = true`-biler
- Ingen toggle eller selector — afregningstypen er ikke valgbar
- Timer registreres normalt af chauffør (Flow 4 Trin 1-2), formand godkender (Flow 4 Trin 5)
- Time-fordeling på samleordre-ordrer fungerer som normalt for time-biler (se [[project-unified-planning-model]])

**Datamodel-tilføjelse:**
```
orders.asfalt_koersel[].egen_bil: boolean (default false)
```

**🟡 ÅBENT SPØRGSMÅL (skal stilles ved implementering):**
- **Chauffør-kilde:** Oprettes manuelt af formand vs. arves fra holdpakken? Brugeren afklarer.

---

### Variant: "Sidste læs"-frigivelse af overflødige chauffører (LÅST 2026-05-27)

**Trigger:** Når formand allokerer sidste-læs (`er_sidste_laes: true` på en vejeseddel) ELLER systemet automatisk identificerer at `sum(allokerede_tons) >= bestilt_total - bil_kapacitet` for resten af dagen.

**Forretningsregel:**
- Når sidste-læs er allokeret, er N-1 biler overflødige (hvor N er antal allokerede biler for dagen)
- 1 bil holdes **i reserve-buffer** indtil sidste-læs er aflæsset (`status = udlagt`)
- De øvrige `N - 2` biler kan frigives med det samme

**Trin SL-1 — System foreslår frigivelse**
**App:** formand (computation) → vognmand (notifikation)
**Trigger:** `er_sidste_laes: true` er sat på en vejeseddel (`paa_vej_til_fabrik`-status)
**Beregning:**
- `overfloedige_biler = N_allokerede - 1 (sidste-læs) - 1 (reserve)`
- Reserve-bil = den bil hvis næste-tur normalt ville være LIGE EFTER sidste-læs (sidste i køen)
**Skriver til:** `frigivelses_forslag` (Supabase-tabel):
  - `ordre_id`, `dato`, `foreslaaede_reg_nr: string[]` (de overflødige), `reserve_reg_nr: string`, `status: 'afventer_vognmand'`

**Trin SL-2 — Vognmand modtager notifikation + bekræfter**
**App:** vognmand
**Komponent:** `FrigivelsesModal` (NY) — modal eller toast i `VognmandShell`
**Viser:** Liste over biler der kan frigives + reserve-bil markeret. CTA: "Frigiv X biler" + "Behold for nu" (afvis).
**Handling:** Vognmand klikker "Frigiv X biler"
**Skriver til:**
- `frigivelses_forslag.status = 'bekraeftet'`
- For hver frigivet bil: `confirmed_vehicles[].dag_afsluttet_kl = now()`
- Vejeseddel for hver frigivet bil opdateres: `status = 'dag_afsluttet'`

**Trin SL-3 — Chauffør modtager besked**
**App:** chauffeur (React Native)
**Komponent:** Push-notifikation + `DagAfsluttetScreen` (NY) eller banner på TaskDetailScreen
**Distribution:** Push til chauffør-tlf (samme mekanisme som task-distribution)
**Indhold:** "Dagens kørsel afsluttet — du kan køre hjem. Tak for indsatsen."
**Læser:** `assigned_tasks` WHERE `truck_plate = chauffeur.plate` AND `status = 'dag_afsluttet'`

**Trin SL-4 — Reserve-bil frigives når sidste-læs er aflæsset**
**App:** formand (computation) → vognmand → chauffør (automatisk via Trin SL-2 + SL-3)
**Trigger:** Sidste-læs-vejeseddel skifter status til `udlagt`
**Handling:** System sender automatisk frigivelses-besked til reserve-bilen (uden vognmand-bekræftelse — reserve-perioden er afsluttet, ingen risiko tilbage)
**Skriver til:** Reserve-bilens `confirmed_vehicles[].dag_afsluttet_kl = now()` + vejeseddel `status = 'dag_afsluttet'`

**Visuelle effekter (cross-app):**
- **Formand**: Frigivne biler skifter til `dag_afsluttet`-status i Vejesedler-tabellen (gråtonet styling)
- **Vognmand**: Bil-disponering viser "Dag afsluttet"-badge på frigivne biler
- **Chauffør**: Push + status-skift fra `paa_vej_til_fabrik` → `dag_afsluttet`. Bilen kan parkeres, ingen flere ture.

**Tidsregistrering / afregning:**
- Chauffør får løn for tid frem til **afmelding modtaget** (ikke frem til vognmands bekræftelse — vognmand kan være sløv)
- For akkord-biler: ingen ekstra betaling for resten af dagen — bilen er ikke længere i loop
- For time-biler: timeregistreringen lukkes ved afmelding (chauffør får besked om at registrere "Afsluttet")

**Afvisnings-flow (vognmand siger nej):**
- Hvis vognmand klikker "Behold for nu" i Trin SL-2, sker INGEN afmelding
- Biler fortsætter i loop indtil sidste-læs er aflæsset
- Når `udlagt` triggers, viser systemet ny notifikation: "Dagens mål nået — vil du afmelde resterende biler?"

**🟡 ÅBNE SPØRGSMÅL (ved implementering):**
- **Allerede-på-vej-til-fabrik chauffører:** Hvad hvis chauffør modtager afmelding mens han ER på vej til fabrik? Skal han vende om, parkere, eller fortsætte til fabrik og blive afmeldt der? Default: chauffør beslutter selv om han har lyst at vende om (giver mening for kort afstand) eller fortsætte (lang afstand). UX-detalje besluttes ved implementering.
- **Push fejler:** Hvad sker hvis push-notifikation ikke når frem (telefonen er offline)? Fallback: chauffør får besked ved næste app-åbning + SMS hvis kritisk.
- **Reserve-bil-valg:** Skal reserve-bilen vælges baseret på position (tættest på fabrik), læs-nummer (sidste i køen), eller chauffør-præference? Default: sidste i køen (mindst forstyrrelse).
- **Afvisnings-konsekvens:** Hvis vognmand AFVISER frigivelse første gang og sidste-læs senere fejler, har vi tabt tid på automatik vs. manuel. Skal afvisning logges + advare hvis sidste-læs fejler bagefter?

---

## Flow 2: Materiel-transport — Formand → Vognmand

**Status:** Planlagt, ikke bygget endnu
**Trigger:** Ordre kommer fra PLAN med en **holdpakke** (mennesker + materiel). Formand åbner Materiel-sektionen på ordren for at planlægge transport.

### Trin 0 — Holdpakke fra PLAN
**App:** formand
**Datakilde:** PLAN
**Indhold:** Holdpakken indeholder de mennesker der skal bemande opgaven OG det materiel der skal benyttes.
**Forretningsregel:** Formand kan tilføje yderligere mennesker og materiel — disse tilføjelser skal skrives RETUR til PLAN.
**Note:** Under "Materiel"-sektionen vises KUN materiel (ikke mennesker — de håndteres i en separat sektion).

### Trin 1 — Formand planlægger transport per materiel-enhed
**App:** formand
**Komponent:** Materiel-sektion på ordre (ikke bygget) — én linje per materiel-enhed fra holdpakken
**Handling:** For hver materiel-enhed udfylder formanden:
- **Ordrenummer (valgfrit):** Hvis materiellet er udlånt fra en anden afdeling, indtastes ordrenummer på dén ordre — det er den ordre der betaler for transporten til denne ordres lokation. (Info-felt — ingen valideringsblokering.)
- **Afhentningssted + postnummer:** Adresse hvor materiellet hentes
- **Aflæsningssted + postnummer:** Adresse på udførselssted (kan også sættes som pin på kort — fremtidig feature)
**Auto-udfyld:** Hvis det indtastede ordrenummer er kendt i systemet, præudfyldes afhentningsadresse + postnummer automatisk fra dén ordres lokation. Formand kan altid overskrive.
**Handling:** Formand trykker "Gem transport" per materiel-enhed.
**Skriver til:** `orders.materiel[]` med `{ ordrenummer_betaler?, afhentningssted, postnummer, aflæsningssted, aflæsningspostnummer }`

### Trin 2 — Bestilling bliver synlig hos vognmand
**App:** vognmand
**Komponent:** Materiel-sektion under `DisponeringsView` (ikke bygget) — vises som ekstra sektion UNDER asfalt-disponeringen på samme ordre
**Viser:** Alle gemte transport-data fra Trin 1 (anlæg, beskrivelse, afhentning, aflæsning, betaler-ordrenummer hvis sat)
**Læser:** `orders.materiel[]` WHERE `gemt = true`

### Trin 3 — Vognmand disponerer transport
**App:** vognmand
**Komponent:** Materiel-sektion under `DisponeringsView` (ikke bygget)
**Handling:** Vognmand trækker blokvogn/transport hen over materiel-linje og tildeler chauffør
**Note:** Samme bil kan dække flere materiel-linjer (kapacitet er svær at vurdere)
**Skriver til:** `orders.materiel[].confirmed_transport` med `{ bil_type, chauffoer_navn, chauffoer_tlf }`

### Trin 4 — Vognmand bekræfter
**App:** vognmand
**Handling:** Når en bil er sat på materiel-linjen, betragtes den som **bekræftet** (samme model som asfalt-kørsel).
**Skriver til:** `orders.materiel[].bekraeftet_af_vognmand = true`

### Trin 5 — Formand ser bekræftelse + transport-detaljer
**App:** formand
**Komponent:** Bil-række i sektionen **"Biler & afregning"** i Udførelse (samme sektion som asfalt-biler)
**Forretningsregel:** Materiel-transport-biler vises IKKE i en separat sektion. Bilen der kører materiel er blot endnu en bil i flåden — den får et **badge "Kørt materiel"** + en lille linje under bil-rækken der lister de materiel-enheder den har hauleret.
**Viser per bil-række:**
- Reg.nr (fra `confirmed_transport.bil_type` eller separat reg-felt)
- Chauffør-navn, chauffør-tlf
- Biltype (fx "Blokvogn", "Kran-bånd")
- Badge: **"Kørt materiel"** (skiller den visuelt fra asfalt-biler — `bg-warn-bg`)
- Materiel-info under rækken: `+ HAMM HD10 VT, VÖGELE 1900-3I` (`text-xs text-text-muted`)
**Læser:** `orders.materiel[].bekraeftet_af_vognmand`, `orders.materiel[].confirmed_transport`, grupperer på `chauffoer_navn + reg_nr`

### Trin 6 — Formand afregner materiel-bil (samme flow som asfalt-bil)
**App:** formand
**Komponent:** Samme expander-mekanisme som asfalt-bil-afregning i "Biler & afregning"
**Forskel fra asfalt-bil:**
- `afregning_type` tvinges til `time` (ingen akkord-mulighed)
- **Ingen pause-felt** — kun `timer` + `ventetid`
- Resten af flowet er identisk (prædufyldt, godkend, genåbn — se Flow 4)

### Trin 7 — Formand registrerer anvendte timer på materiellet selv (Materiel-sektion)
**App:** formand
**Komponent:** Selvstændig "Materiel"-sektion under Udførelse (separat fra "Biler & afregning", placeret UMIDDELBART under den)
**Forretningsforståelse:** Dette handler om hvor mange timer SELVE MATERIELLET (anlægs-niveau: HAMM HD10, VÖGELE 1900-3I etc.) blev brugt på ordren — IKKE chauffør-afregning. Bruges til intern fakturering mellem afdelinger / materiel-allokering.

**PLAN-felt der styrer flow:** `orders.timeafregning: 'ja' | 'nej'` (kommer fra PLAN per ordre)

**Default tilstand:** Sektionen er **lukket** som default — alt timer-input + checkboxes er skjult bag en **"Lav afregning"-badge** (samme mønster som bil-afregning i "Biler & afregning"). Klik på badgen åbner expanderen inline.

**Case A — `timeafregning = 'nej'` (Fast pris / holdpakke-niveau):**
- Én samlet input ØVERST i expanderen: "Anvendte timer for hele holdpakken"
- Materiel-rækker viser kun anlæg + beskrivelse + simpel checkbox "Anvendt" (hvid baggrund, grå outline, sort flueben — default checked)
- Skriver: `materiel_anvendelse.holdpakke_timer_total`, `materiel_anvendelse.materiel[].anvendt: boolean`

**Case B — `timeafregning = 'ja'` (Per-materiel timer):**
- Ingen samlet input
- Hver materiel-række har sin egen "Timer brugt"-input
- Skriver: `materiel_anvendelse.materiel[].timer_brugt: number`

**Godkend-flow:** Nederst i expanderen er en **"Godkend afregning"-knap** (samme stil som bil-afregning). Klik → direkte godkendelse, badge skifter til grøn "Afregning godkendt", felter låses, **"Genåbn afregning"-link** vises hvis fejl/justering nødvendig.

**Test-toggle (prototype-only):** I prototypen er der pill-knapper "Timeafregning: Nej / Ja" til at skifte mellem case A og B uden kode-redigering. Fjernes ved Supabase-integration når feltet kommer fra PLAN.

**Note:** Tidligere PLAN-system viste timer-bokse per materiel-enhed selv ved fast pris (legacy/uoverskueligt). Vores system rydder op: ved fast pris vises kun én samlet input + bekræftelses-checkboxes.

---

## Flow 3: Ankomst til fabrik (chauffeur)

**Status:** Prototype bygget i chauffeur-web (`AnkommetFabrikScreen.tsx`), ikke bygget i native app
**Trigger:** Chauffør nærmer sig fabrik — GPS-position krydser geofence

### Trin 1 — Geofence aktiverer velkomst
**App:** chauffeur (React Native, native GPS)
**Komponent:** `AnkommetFabrikScreen` (sub-screen: `ankomst`)
**Trigger:** GPS-position indenfor geofence-radius af fabrik (radius TBD — fx 200m)
**Viser:** "Velkommen til {fabrik.navn}" + instruktioner (kør til vægt → kør til silo)
**Skriver til:** `task_timestamps.ankomst_fabrik = now()`
**Note:** Geofence-koordinater hentes fra `fabrik`-tabel; fungerer offline via cached koordinater.

### Trin 2 — Indvejning tom
**App:** chauffeur
**Komponent:** Instruktionskort "Kør til vægten — Bil indvejes tom"
**Handling:** Chauffør kører på vægt; tom-vægt registreres i fabriksystem (ikke chauffør-app)
**TBD:** Hvordan synkroniseres vægt-data tilbage til chauffør/ordre?

### Trin 3 — QR-scan ved silo
**App:** chauffeur
**Komponent:** `AnkommetFabrikScreen` (sub-screen: `qr-scan`)
**Handling:** Chauffør scanner QR-kode placeret ved silo — sikrer at chauffør er ved RETTE silo for produktet på ordren
**Læser:** `orders.produkt` + QR-payload (silo-id)
**Validerer:** silo-id matcher produkt på ordren — ellers fejl
**Skriver til:** `task_timestamps.qr_scannet = now()`, `task_logs.silo_bekraeftet = silo_id`

### Trin 4 — Bekræftelse + lastning
**App:** chauffeur
**Komponent:** `AnkommetFabrikScreen` (sub-screen: `bekraeft`)
**Viser:** Success-banner "Du kan nu starte lastningen" + silo + produkt
**Handling:** Chauffør trykker "Lastning færdig" når silo er tømt og bil er læsset

**LÅST 2026-05-27 — Bilens kapacitet vises:**
- På "Du kan nu starte lastningen"-skærmen vises bilens kapacitet (tons-rummelighed) tydeligt så chaufføren ved hvor meget han kan/skal læsse
- Kapaciteten kommer fra bil-disponeringen (vognmand-data: `bil.tons` eller tilsvarende kapacitets-felt)
- Værdien matches mod faktisk udvejet last på "Udvejning bekræftet"-skærmen — eventuel afvigelse signalerer at last er mindre end kapacitet (rest til evt. returlæs eller bare sidste-læs)
- Eksempel: 34 t kapacitet vises på lastnings-skærm → efter læsning udvejes 34 t (eller mindre hvis sidste-læs/rest)

### Trin 5 — Udvejning + afgang fra fabrik
**App:** chauffeur
**Komponent:** `AnkommetFabrikScreen` (sub-screen: `udvejet`)
**Handling:** Chauffør udvejes med last på vægt; trykker "Udvejet og på vej til udførselssted"
**Skriver til:** `task_timestamps.afgang_fabrik = now()`, `task_logs.last_tons = tons` (fra vægt-system)

### Trin 6 — ETA beregnes til formand + udførselssted (LÅST 2026-05-27)
**App:** beregnes server-side, vises i formand + fabrik (kommende)
**Komponent:**
  - `formand`: ETA-badge på vejeseddel i Udførsel/Vejesedler-tabel (status `undervejs`) — fx "ETA 09:42" eller "12 min"
  - `fabrik` (kommende): Liste over kommende lastbiler med ETA

**Status-overgang:** Vejeseddel skifter fra `paa_fabrik` → `undervejs` når chauffør klikker **"Afslut vejning"** på fabrik (sidste udvejning). ETA-tid bliver synlig fra dette tidspunkt.

**Beregning (LÅST 2026-05-27):**
- Primær: **Google Distance Matrix API** — kald med `origins=fabrik_coords`, `destinations=udfoersel_coords`, `mode=driving`, `departure_time=now`, `traffic_model=best_guess`. Returnerer `duration_in_traffic` (sekunder, inkl. live trafik).
- Lastbil-buffer: **+10%** oven i Google's bil-tid for at kompensere for lastbil-hastighed (lavere top-fart, accelerations-/decelerations-profil).
- Formel: `eta_minutter = ceil(duration_in_traffic_seconds × 1.10 / 60)`
- ETA-klokkeslæt: `eta_klokkeslaet = afgang_fabrik + eta_minutter`

**Returvej (returlæs-flow):**
- `eta_fabrik = afgang_udfoerselssted + køretid(udførselssted → fabrik)` — samme Google-kald, omvendt retning + +10% buffer

**API-aftale:**
- Google Maps Platform — Distance Matrix API. Free tier: $200/måned credit (≈ 40.000 calls). Vores volumen er meget under det.
- API-key skal være `MAPS_DISTANCE_MATRIX_KEY` i env, kald sker server-side (ikke browser — beskyt key).
- Fallback hvis API-kald fejler: brug `km × 1 min`-approximation (eksisterende prototype-formel) som degraderet beregning.

**Note:** I prototypen bruges fortsat den simple `km × 1 min`-formel via en util-funktion `estimateEta(origin, dest)` — denne udskiftes med Google-kaldet når API-key er konfigureret i produktion. Util'en isolerer beregningen så ombytningen er triviel.

**Cross-app effekt:**
- Vejeseddel-status: `undervejs` med `eta_minutter` + `eta_klokkeslaet` synlig i formand `VejesedlerTable` (se Flow 8 / Udførsel/Vejesedler-sektionen)
- Næste status-overgang: `undervejs` → `aflaesning` når geofence triggers ankomst udførselssted

---

## Flow 4: Timeregistrering og afregning (asfalt-biler + materiel)

**Status:** Planlagt — UI under planlægning (denne iteration)
**Trigger:** Chauffør afslutter dagens kørsel
**Involverede apps:** chauffeur → formand → vognmand

### Trin 0 — Formand ser status-overblik i toppen af Udførelse
**App:** formand
**Komponent:** **3 status-bokse i toppen af `UdfoerselContent`** (samme dimensioner som produkt-bokse i Planlægning: `flex-col gap-xxxs items-start min-w-[150px] px-sm py-xs rounded-xl border` + 4 stacked tekst-linjer)

**Boks 1 — Biler:**
- Label "BILER" (uppercase)
- Status: `Bekræftet` (grøn fill `bg-good-bg border-good/30`) eller `Afventer` (neutral `bg-surface border-hairline`)
- Sub-status: "Vognmand har bekræftet" / "Vognmand ikke bekræftet"
- Tæller: `N biler`
- **State:** `vognmandBekraeftelse` (truthy = bekræftet)

**Boks 2 — Materiel transport** (placeret UNDER/ved siden af Biler — relateret koncept):
- Label "MATERIEL TRANSPORT"
- Status: `Bekræftet` (grøn) eller `Afventer` (neutral)
- Tæller: `N enheder`
- **State:** `vognmandMaterielBekraeftelse.items.length > 0`
- **Note:** Selvom materiel-transport-biler nu vises i samme "Biler & afregning"-sektion som asfalt-biler, har materiel-transport sin egen vognmand-bekræftelses-status og derfor sin egen boks.

**Boks 3 — Forundersøgelse:**
- Label "FORUNDERSØGELSE"
- Status: `Gennemført` (grøn fill) eller `Ikke foretaget` (**rød fill** `bg-bad-bg border-bad/30 text-bad`)
- Sub-status: "Underlag vurderet" / "Mangler vurdering"
- Detalje: "Tilfredsstillende" / "Ikke tilfredsstillende" (når gennemført)
- **State:** `underlaegsType && tilfredsstillende !== null && tilfredsstillende !== undefined`

**Note:** Bokse-rækken er det første formanden ser i Udførelse — giver hurtigt overblik over hvad der mangler at blive bekræftet eller foretaget. Når en boks bliver grøn er den respektive sektion afsluttet.

### Trin 1 — Chauffør registrerer kørsel og pauser
**App:** chauffeur
**Komponent:** TBD — formentlig ny `TidsregistreringScreen` eller automatisk via GPS + state-changes
**Handling:** Chauffør markerer start/pause/slut på opgave; GPS supplerer med faktisk kørsel
**Skriver til:** `task_logs.kørsel_minutter`, `task_logs.pause_minutter`, `task_logs.opgave_minutter`
**Note:** Tons-data registreres IKKE af chaufføren — de kommer fra `plan_vejebilag`-tabellen, som fabrikken/vejebilags-systemet skriver til hver gang chauffør henter asfalt. Ved akkord-afregning **joiner** formand-hooket på `plan_vejebilag` for at summere `tons` per regnr per dato. Tons ligger IKKE i `time_registreringer`.

### Trin 2 — Chauffør afslutter dag + sender afregning
**App:** chauffeur
**Komponent:** Afslut-dag-skærm (ikke bygget endnu)
**Handling:** Chauffør gennemgår dagens timer, tilføjer evt. kommentar, trykker "Send til formand"
**Skriver til:** `time_registreringer` (én række per chauffør per dag) med `{ kørsel_minutter, ventetid_minutter, pause_minutter?, chauffør_kommentar, godkendt_af_formand = null }`
**Note:** `tons_koert` skrives IKKE her — tons-data ligger i `plan_vejebilag` og join'es ind når formand åbner afregningen. Pause-feltet udfyldes kun ved asfalt-bil (ikke materiel).

### Trin 3 — Formand ser afventende afregninger i Udførelse
**App:** formand
**Komponent:** **Én samlet sektion "Biler & afregning"** — asfalt-biler OG materiel-transport-biler vises i samme tabel
**Placering:** Udførelse-mode → "Biler & afregning"-sektion (tidligere to separate sektioner "Bestilte biler" + "Materiel" — nu sammenflettet)
**Forretningsregel:** Materiel-transport-biler er stadig blot biler med reg.nr/chauffør/tlf/type. De vises i samme tabel som asfalt-biler, men markeres med et badge **"Kørt materiel"** + en lille linje med materiel-info under bil-rækken (fx `+ HAMM HD10 VT, VÖGELE 1900-3I`)
**Viser:** Kolonne "AFREGNING" på hver række med `AfregningBadge`:
- **Afventer chauffør** (gråt) — chauffør har endnu ikke sendt timer
- **Lav afregning** (gul, klikbar) — timer sendt, klar til godkendelse
- **Afregning godkendt** (grøn) — formand har godkendt
**Læser:** `time_registreringer` WHERE `orderId = current_order` AND `dayId = today`

### Trin 4 — Formand åbner afregnings-expander
**App:** formand
**Komponent:** Inline expander under bil-rækken i "Biler & afregning"-sektionen (samme komponent for asfalt og materiel)
**Viser:**
- **Type-pill** (time/akkord) — fra vognmand-systemet (kun synlig på asfalt-biler — materiel er altid time)
- **Felter:**
  - Asfalt-bil time-afregning → Køretimer / Ventetid / Pause
  - Asfalt-bil akkord → Tons kørt / Ventetid
  - **Materiel-bil (badge "Kørt materiel") → ALTID time-afregning, kun Timer + Ventetid (INGEN pause)**
- **Chauffør-kommentar** (`ChauffoerKommentarBox`) — vises **nederst i expanderen, efter Godkend-knappen**
- **Forretningsregel:** Hvis chauffør kører flere materiel-enheder på samme bil/reg.nr → ÉN samlet afregning per chauffør (gruppering på `regnr`), IKKE per materiel-enhed.
**Handling:** Formand kan redigere felter — eller godkende direkte hvis de stemmer.

### Trin 4a — Returlæs-timer (LÅST 2026-05-27)
**App:** formand
**Komponent:** `ReturlaesRow` (NY) — vises i bil-afregnings-expander under de eksisterende køretimer fra app
**Forretningsregel:** Når en chauffør slutter dagen med rest-asfalt på bilen ELLER materiel der skal retur til fabrikken, registrerer formanden ekstra timer for chaufførens retur-kørsel. Det er chaufførens kompensation for at køre tomt tilbage.

**UI-detaljer:**
- Knap **"+ Returlæs"** vises som default i bunden af expanderen (under eksisterende køretimer-række)
- Ved klik: ny række med felt for **timer** (decimal-tal, fx 1,5) + valgfri kommentar-felt + **× fjern**-knap
- Etiket: "Returlæs (rest asfalt eller materiel retur til fabrik)"
- Værdien LÆGGES TIL den samlede afregning (chauffør får løn for køretimer + returlæs-timer)
- **Kun formand kan tilføje** — chauffør har ikke selv mulighed for at indberette returlæs-timer (formand er den der ved at retur-kørslen var nødvendig)

**Hvorfor manuel + ikke automatisk fra GPS:**
- GPS kan ikke skelne mellem "kører hjem efter arbejde" og "kører til fabrik med returlæs"
- Formand har konteksten — han ved om bilen havde rest-asfalt eller materiel med
- Manuel registrering = klar audit-trail for afregning

**Skriver til:** `time_registreringer.returlaes` med `{ timer: number, kommentar?: string, registreret_af_formand: bool, registreret_tidspunkt: timestamp }`. Null hvis ingen returlæs.

**UI-rækkefølge i expanderen:**
1. Køretimer (fra chauffør-app)
2. Ventetid (fra chauffør-app)
3. Pause (fra chauffør-app — kun asfalt-time)
4. **Returlæs** (NY — manuel formand-indtastning)
5. Total-linje
6. Chauffør-kommentar
7. Godkend-knap

### Trin 5 — Formand godkender afregning (direkte, ingen modal)
**App:** formand
**Komponent:** `GodkendAfregningButton` inde i expander
**Handling:** Klik på "Godkend afregning" → direkte godkendelse uden bekræftelses-modal
**Skriver til:**
- `time_registreringer.godkendt_af_formand = true`
- `time_registreringer.godkendt_tidspunkt = now()`
- `time_registreringer.godkendt_af = formand_navn`
- Eventuelt opdaterede timer-værdier hvis formand har redigeret
**UI-skift:** Badge skifter til grøn "Afregning godkendt", felter låses (read-only i expander). Header viser ✓ + tidspunkt. "Godkend"-knap erstattes med **"Genåbn afregning"-link**.

### Trin 5b — Formand genåbner afregning (hvis fejl/justering nødvendig)
**App:** formand
**Komponent:** "Genåbn afregning"-link i `BilAfregningExpander` / `MaterielAfregningExpander` (godkendt-tilstand)
**Handling:** Klik → expanderen åbnes til redigering igen
**Skriver til:**
- `time_registreringer.godkendt_af_formand = false`
- `time_registreringer.godkendt_tidspunkt = null`
- `time_registreringer.genaabnet_tidspunkt = now()`
**UI-skift:** Badge skifter tilbage til gul "Lav afregning", felter editable igen. Lille muted-tekst "Genåbnet [tidspunkt]" gemmes til historik.

**Note:** Ingen afvis-flow i v1 — formand kan kun godkende eller genåbne. Formel "Afvis"-knap kommer i senere iteration.

### Trin 6 — Vognmand ser godkendte afregninger i portal
**App:** vognmand
**Komponent:** TBD — sammenligningsside med chauffør-timer vs. afregning fra Colas (ikke bygget endnu)
**Viser:** Kun afregninger hvor `godkendt_af_formand = true` — afregninger der afventer formand er IKKE synlige
**Brug:** Vognmand sammenligner godkendte afregninger med Colas' faktura — bruger eventuelle afvigelser som reklamationsgrundlag
**Læser:** `time_registreringer` WHERE `godkendt_af_formand = true` JOIN `afregninger`

### Afregningstype-styring
**Hvor markeres time vs. akkord?**
Afregningstypen `time|akkord` sættes på **AFTALEN mellem Colas og den enkelte vognmand** (ikke pr. bil). Standard: time-afregning. Andre typer (tons-afregning, turaftale) konfigureres i vognmand-aftalen og arves automatisk af alle biler vognmanden disponerer til ordren.

Afregningstypen flyder ind på ordren via `confirmed_vehicles[].afregning_type`. **Antagelse i v1:** Vognmand leverer typen — ingen manuel formand-override i UI.

**Datafelt at tilføje:** `confirmed_vehicles[].afregning_type: 'time' | 'akkord' | null`

### Tons-kilde (akkord-afregning)
- Tons-data ligger i `plan_vejebilag`-tabellen — registreres af fabrikkens vejebilags-system hver gang chauffør henter asfalt
- `useChauffoerTimer`-hooket JOINer `plan_vejebilag` på `(regnr, dato)` og summerer `tons` for at få total `tonsKoert`
- Tons ligger IKKE i `time_registreringer` — den tabel rummer kun timer/ventetid/pause/kommentar

### Materiel — to separate sektioner i Udførelse
1. **"Biler & afregning"** — indeholder ALLE biler inkl. materiel-transport-biler (blokvogn, kran-bånd). Materiel-transport-biler markeres med badge "Kørt materiel".
2. **"Materiel"** — separat sektion under "Biler & afregning". Handler om timer brugt på SELVE MATERIELLET (anlæg-niveau, ikke chauffør). Styres af `orders.timeafregning: 'ja' | 'nej'` fra PLAN:
   - **Nej** → én samlet input "Anvendte timer for hele holdpakken" + materiel-rækker med kun "Anvendt"-checkboxes
   - **Ja** → individuel "Timer brugt"-input per materiel-enhed

### Materiel-bil — forretningsregel for placering og gruppering
- **Materiel-transport-biler vises i samme sektion som asfalt-biler** ("Biler & afregning") — IKKE i en separat sektion. En blokvogn der kører materiel er bare en bil med reg.nr, chauffør, tlf, biltype som alle andre.
- Materiel-bilen markeres visuelt med et badge **"Kørt materiel"** + en lille linje under rækken der lister de hauleret materiel-enheder (fx `+ HAMM HD10 VT, VÖGELE 1900-3I`)
- Materiel-afregning er **kun time** (aldrig akkord)
- Materiel-afregning har **ingen pause-felt** (pause er asfalt-specifikt). Kun køretimer + ventetid
- Hvis samme chauffør kører flere materiel-enheder på samme reg.nr → ÉN samlet afregning per chauffør (gruppering ved render-tid)
- `time_registreringer` for materiel skrives som én række per chauffør-key (regnr+dayId), IKKE per materiel-enhed

---

## Flow 5: Entreprisekontrol & Temperaturmåling → Skema-krav

**Status:** Visning bygget i `OrdrePlanScreen` (prototype). A3/A4/MKS-skemaer under Udførelse er ikke bygget endnu.
**Trigger:** Ordre kommer fra PLAN med `entreprisekontrol`- og/eller `temperaturmaaling`-værdi (1 eller 2)

### Trin 1 — Formand ser skema-krav på OrdrePlanScreen
**App:** formand
**Komponent:** `OrdrePlanScreen` → Planlægning-sektion → produkt-faktafelter
**Viser:** Én række "Entreprisekontrol og temperatur" med union af skema-krav fra begge felter:
- Værdi `1` (på enten ét eller begge felter, og ingen `2`) → "Følgende skal udfyldes: MKS"
- Værdi `2` (på mindst ét felt) → "Følgende skal udfyldes: A3, A4, MKS"
- Begge felter undefined → "–"
**Læser:** `orders.produkter[].entreprisekontrol`, `orders.produkter[].temperaturmaaling`
**Forretningsregel:** De to felter fusioneres til ét visningsfelt. Strengeste krav vinder: `2` (A3+A4+MKS) > `1` (kun MKS) > undefined.

### Trin 2 — Formand udfylder skemaer i Udførelse-menu
**Status:** Ikke bygget endnu
**App:** formand
**Komponent:** Udførelse-menupunkt → A3-skema, A4-skema, MKS-skema (planlagt)
**Note:** A3/A4 udfyldes kun når mindst ét af felterne har værdi `2`. MKS udfyldes ved enhver værdi `1` eller `2`.

---

## Flow 6: Forundersøgelse — Udførelse → PLAN + Projektleder

**Status:** Bygget (prototype) i Udførelse → Forundersøgelse-sektion. Synkronisering retur til PLAN og notifikation til projektleder er ikke koblet endnu.
**Trigger:** Formand åbner Udførelse-mode → Forundersøgelse-sektion på en ordre.

### Trin 1 — Formand modtager felter fra PLAN
**App:** formand
**Datakilde:** PLAN
**Indhold:** Alle felter (underlag-muligheder, årsager, ekstraarbejde-typer) er prædefinerede og hentes fra PLAN — formand vælger fra dropdowns, opretter ikke selv typer.
**Komponent:** Udførelse → Forundersøgelse-sektion (bygget i `OrdrePlanScreen` prototype)

### Trin 2 — Formand vurderer underlag
**App:** formand
**Komponent:** Underlag-dropdown + tilstand Ja/Nej
**Handling:**
- Vælger **underlag** fra dropdown (fx asfalt, beton, grus — værdier fra PLAN)
- Markerer om underlaget er **tilfredsstillende** at arbejde med (Ja / Nej)
- Hvis **Nej**: vælger en eller flere **årsager** via flueben (multi-select fra PLAN) + skriver "**Aftalt med**" som fritekst (hvem aftaler man at fortsætte med?)
**Skriver til:** `orders.forundersoegelse.{ underlag, tilstand_ok, årsager[], aftalt_med }`

### Trin 3 — Formand skriver forbehold
**App:** formand
**Komponent:** Forbehold-fritekstfelt
**Handling:** Frit kommentarfelt — formand logger eventuelle bemærkninger om forundersøgelsen.
**Skriver til:** `orders.forundersoegelse.forbehold`

### Trin 4 — Formand uploader billeder
**App:** formand
**Komponent:** Billede-upload (file input)
**Handling:** Uploader ét eller flere billeder af forundersøgelsen (fx underlag, skader, område).
**Skriver til:** `orders.forundersoegelse.billeder[]` MED tag `"forundersoegelse"`
**Forretningsregel:** Samme billeder synkroniseres automatisk til **Dokumentation-sektionen under Planlægning**. Billederne bærer tag/badge "Forundersøgelse" så det er tydeligt hvor de stammer fra.

### Trin 5 — Formand tilføjer ekstraarbejde (hvis underlag ikke matcher aftalt)
**App:** formand
**Komponent:** Ekstraarbejde-sektion (inline ekspanderende)
**Handling:** Hvis underlag eller aftaler afviger fra det oprindeligt aftalte, tilføjer formanden ekstraarbejds-linjer:
- Vælger **ekstraarbejde-type** fra dropdown (værdier fra PLAN — ca. 25 typer i prototypen)
- Skriver **kommentar** per linje (fritekst)
- Angiver **antal** (mængde)
**Skriver til:** `orders.forundersoegelse.ekstraarbejde[]` med `{ type, kommentar, antal }`

### Trin 6 — Forundersøgelse afsluttes
**App:** formand
**Status:** Synkronisering ikke bygget endnu
**Handling:** Når formanden er færdig med Forundersøgelse, skal:
- **PLAN modtager data retur:** underlag-vurdering, årsager, aftalt-med, forbehold, billeder, ekstraarbejde-linjer
- **Projektleder notificeres** hvis der er tilføjet ekstraarbejde-linjer (notifikations-mekanisme TBD — email/in-app/SMS)
**Skriver til:** `orders.forundersoegelse.afsluttet = true`, trigger `sync_to_plan` + `notify_projektleder`

---

## Flow 7: Dagens overblik — fremdrift & faktisk udlagt

**Status:** Planlagt (denne iteration). UI under bygning i Udførelse → `DagsoverblikSection`.
**Trigger:** Formand åbner Udførelse-mode på en ordre.
**Involverede apps:** formand (læs/skriv), PLAN (læs)

### Trin 1 — Statisk dagsinfo læses fra ordre + recept
**App:** formand
**Komponent:** `DagsoverblikSection` → Rad 1 (4 × `OrdreInfoCard`)
**Viser:** Areal i dag, Produkt (recept-navn + kode), Tykkelse, Tons i dag
**Beregning:**
- `arealIDag = (tonsIDag × 1000) / (kg_per_m2 fra recept)`
- `tonsIDag` er formandents angivne tons pr. dag (set under Planlægning)
**Læser:** `orders.dailyPlan[].tonsPerDag`, `orders.produkter[].tykkelse`, `recepter[receptkode]` (navn, densitet, kg/m²)

### Trin 2 — Fremdrift opdateres løbende fra vejesedler
**App:** formand
**Komponent:** `DagsoverblikSection` → Rad 2 (`FremdriftCard` × 3)
**Beregning:**
- `tonsAnkommet = SUM(plan_vejebilag.tons WHERE ordrenummer = current AND dato = today AND status='ankommet')`
- `forventetUdlagtM2 = (tonsAnkommet × 1000) / kg_per_m2_fra_recept`
- Begge progressbars: `value / dagsmål × 100`
**Læser:** `plan_vejebilag` (filter på dato + ordrenummer), `recepter`
**Note:** Vejesedler kommer fra PLAN med ~10 min forsinkelse — fremdrift er ikke real-time.

### Trin 3 — Formand registrerer faktisk udlagt
**App:** formand
**Komponent:** `DagsoverblikSection` → `FremdriftInputRow`
**Handling:** Formand indtaster `faktiskM2` + `faktiskTons` og trykker "Gem". Typisk ved dagens afslutning, men kan opdateres løbende.
**Beregning (faktisk tykkelse, mm):**
```
tykkelse_mm = tons × 1_000_000 / (m² × densitet_kg_per_m3)
```
hvor `densitet_kg_per_m3` er heltal fra `recepter[receptkode].densitet` (fx 2400 for SMA 11S).
**Skriver til:** `dagsoverblik_registreringer` (én række per ordre per dato — overskrives ved hver gem)

### Trin 4 — Afvigelses-farve på "Faktisk udlagt"
**App:** formand
**Komponent:** `FremdriftCard` (variant=`faktisk-udlagt`)
**Forretningsregel:**
- `afvigelse = faktisk_m2 − forventet_udlagt_m2`
- Vis afvigelse KUN hvis `afvigelse !== 0`
- Symmetrisk farve baseret på fortegn:
  - `afvigelse > 0` → `+X m²` i `text-good` (grøn)
  - `afvigelse < 0` → `−X m²` i `text-bad` (rød) — minus-tegn er U+2212
- Ingen absolut-værdi tærskler — fortegnet alene styrer farven

### Trin 5 — Data flyder retur til PLAN (planlagt)
**App:** formand → PLAN
**Status:** Ikke bygget endnu
**Skriver til PLAN:** `dagsoverblik_registreringer.faktisk_m2`, `dagsoverblik_registreringer.faktisk_tons` mirrors retur til PLAN ved dagens afslutning — bruges til entreprisekontrol og slutafregning.

---

## Flow 8: Vejesedler — PLAN → Formand visning

**Status:** Planlagt (denne iteration). UI under bygning i Udførelse → `VejesedlerTable`.
**Trigger:** Formand åbner Udførelse-mode. Tabel renderes med alle læs for dagens ordre.
**Involverede apps:** PLAN (kilde), vognmandsmodul (disponering), chauffør-app (GPS), formand (visning + registrering)

### Trin 1 — Vejesedler hentes fra PLAN
**App:** formand
**Komponent:** `VejesedlerTable` → henter via hook (TBD: `useDagensVejesedler(ordreId, dato)`)
**Læser:** `plan_vejebilag` WHERE `ordrenummer = current AND dato = today`
**Note:** PLAN har ~10 min forsinkelse — viser ikke real-time. Hooket skal poll'e eller bruge Supabase realtime når koblet.

### Trin 2 — Status afgøres af GPS + chauffør-events (OPDATERET 2026-05-27)
**Datakilde:** chauffør-app (GPS + manuelle events) + vognmandsmodul (disponering)
**Forretningsregel — 5-status-flow:**

| Status | Trigger | Datasignal |
|---|---|---|
| `paa_vej_til_fabrik` | Chauffør klikker "Kør til fabrik" eller bil er disponeret men ikke ankommet | `afgang_fra_plads = now()` eller initial-state |
| `paa_fabrik` | Geofence ankomst fabrik (indvejning/læsning/udvejning sker) | `ankomst_fabrik` sat, `afgang_fabrik = null` |
| `undervejs` | Chauffør klikker **"Afslut vejning"** efter sidste udvejning på fabrik. ETA-tid bliver synlig. | `afgang_fabrik` sat, `eta_minutter` beregnet via Google Distance Matrix +10% (se Flow 3 Trin 6) |
| `aflaesning` | Geofence ankomst udførselssted | `ankomst_udfoersel` sat, `aflaesset = false` |
| `udlagt` | Formand/chauffør registrerer temperatur + afsluttet | `aflaesset = true`, `temperatur` sat |

**Note:** `status` er eksplicit på `Vejeseddel`-typen — hooken sætter det baseret på datasignalerne ovenfor, men UI-komponenter læser KUN `status`-feltet (single source of truth). Se [[status_vokabular#VejeseddelStatus]] for kanonisk enum.

**UI-gruppering i `VejesedlerTable` (LÅST 2026-05-27):**
- **Aktive biler (top)**: `paa_vej_til_fabrik`, `paa_fabrik`, `undervejs`, `aflaesning` — vises altid synligt så formand kan følge fremdrift
- **Collapsible-sektion (bund)**: `udlagt` — sammenfoldet som default for at fokusere på aktive biler. Header viser count: `▸ Udlagt + temp-målt (3)`

**Udlægger-kolonne (LÅST 2026-05-27):**
- Udlægger-data følger med i datasættet fra PLAN — `vejeseddel.valgtUdlaeggerMaterielNr` (kan være null indtil formand vælger på aflæsning/udlagt)
- **Conditional column rendering**: Hvis INGEN vejeseddel i listen har en udlægger valgt (alle `valgtUdlaeggerMaterielNr === null`), skal udlægger-kolonnen **slet ikke vises** i tabellen
- Når mindst én vejeseddel har en udlægger valgt, vises kolonnen for ALLE rækker — uvalgte viser deres `<UdlaeggerDropdown>` for at lade formand vælge
- Implementation-note: tjek `vejesedler.some(v => v.valgtUdlaeggerMaterielNr !== null)` for at afgøre column-rendering. TODO: Erstat med Supabase når klar — udlægger-data kommer fra `plan_vejebilag.udlaegger_materiel_nr` (eller settes lokalt af formand)

**Tons-summary (LÅST 2026-05-27):**
- Sum-pille over tons-kolonnen: `{modtaget_total} t modtaget`
- `modtaget_total = sum(tons WHERE status !== 'paa_vej_til_fabrik')` — dvs. alle vejesedler hvor bilen HAR været på fabrik (uanset hvor i flowet den er nu, inkl. udlagt)

### Trin 3 — Sortering i tabel
**Komponent:** `VejesedlerTable`
**Sortering:**
1. Ankomne — DESC på `modtagetTidspunkt` (nyeste øverst)
2. Undervejs — ASC på `etaMinutter` (kortest ETA øverst)
3. På vej til fabrik — original rækkefølge

### Trin 4 — Per-række delegation (OPDATERET 2026-05-27 — 5 statusser)
**Komponent:** `VejeseddelRow` (delegerer baseret på `status`)
- `paa_vej_til_fabrik` → status-pill "På vej til fabrik" + `<UdlaeggerDropdown disabled>`
- `paa_fabrik` → status-pill "På fabrik" + `<UdlaeggerDropdown disabled>`
- `undervejs` → `<EtaBadge variant="eta">` (viser ETA-tid) + `<UdlaeggerDropdown disabled>`
- `aflaesning` → status-pill "Aflæsning" + `<UdlaeggerDropdown>` (aktiv — udlægger vælges nu)
- `udlagt` → `<TemperaturBadge>` + `<UdlaeggerDropdown>` (aktiv — temperatur registreres)

### Trin 5 — ETA beregnes løbende (OPDATERET 2026-05-27 — Google Distance Matrix)
**App:** server-side beregning baseret på chauffør-events
**Beregning (LÅST 2026-05-27):** Se Flow 3 Trin 6 — Google Distance Matrix API + 10% lastbil-buffer.
- Prototype-fallback: `etaMinutter = afstand_km × 1 min/km` via util `estimateEta(origin, dest)` (udskiftes med Google-kald når API-key konfigureret)
- Triggertidspunkt: ETA bliver synlig når status skifter fra `paa_fabrik` → `undervejs` (chauffør klikker "Afslut vejning")
**Datakilde:** GPS-position fra chauffør-app + Google Distance Matrix duration_in_traffic

### Trin 5a — Forsinkelse-detektion + conditional formatting på EtaBadge
**App:** formand
**Komponent:** `EtaBadge` (i `VejeseddelRow` på undervejs-læs)
**Datafelter på `Vejeseddel`:**
- `forventetEtaMinutter` — original ETA tildelt ved disponering (snapshot)
- `etaMinutter` — live opdateret ETA fra chauffør-app GPS

**Forretningsregel — farve-tærskler:**
| Overskridelse | Status | Visning |
|---|---|---|
| ≤ 25% (eta indenfor 1.25× forventet) | Neutral | `bg-surface-2 text-text-secondary` (grå pille) |
| 25–50% (eta 1.25–1.5× forventet) | Warn | `bg-warn-bg text-text-primary` (gul pille) |
| > 50% (eta > 1.5× forventet) | Bad | `bg-bad-bg text-bad` (rød pille) |

**Beregning:** `overskridelse = (etaMinutter − forventetEtaMinutter) / forventetEtaMinutter`

**Hvorfor TREND og ikke INSTANT speed:** GPS-noise (stoplys, kø, stop) ville give falske positive ved instant-speed-tærskel som "< 1 min/km". Trend mod forventet ETA er robust mod kortvarige stop og fanger reel forsinkelse pålideligt.

**Fallback:** Hvis `forventetEtaMinutter === null` (legacy data eller ikke-snapshot), vises neutral grå.

### Trin 6 — Udlægger-valg
**App:** formand
**Komponent:** `UdlaeggerDropdown` (i `VejeseddelRow`)
**Filtrering:** Materiel-listen på ordren filtreres til poster med `materielNr.startsWith('9-')` (udlægger-konventionen)
**Handling:** Formand vælger udlægger per læs — bruges til at korrelere hvilken udlægger der lagde hvilken last
**Skriver til:** `plan_vejebilag.valgt_udlaegger_materielnr` (nyt felt) eller separat `vejeseddel_udlaegger`-mapping (afgør ved Supabase-koblingen)

---

## Flow 9: Temperatur — Formand → PLAN (write-back)

**Status:** Planlagt (denne iteration). Forretningskritisk: dette er ét af de få flows hvor Colas skriver retur til PLAN.
**Trigger:** Formand registrerer eller ændrer temperatur på en ankommen vejeseddel.
**Involverede apps:** formand (skrivning), PLAN (modtager update)

### Trin 1 — Formand indtaster temperatur
**App:** formand
**Komponent:** `TemperaturBadge` (i `VejeseddelRow` på ankomne læs)
**Handling:** Inputfelt vises hvis `temperatur === null`. Formand indtaster i °C. Gem ved Enter eller blur.

### Trin 2 — Validering mod minimumstemperatur
**Komponent:** `TemperaturBadge`
**Forretningsregel:**
- `temperatur >= minTemperatur` → grøn `OK`-pill
- `temperatur < minTemperatur` → gul `Lav`-pill (advarsel — formand ser at læsset er køligere end aftalt)
**Datakilde for minTemperatur:** Ordre/dag-niveau (formand indtaster minimumstemperatur for ordren) ELLER `recepter[receptkode].minTemperatur` som fallback.

### Trin 3 — Temperatur skrives RETUR til PLAN
**App:** formand → PLAN
**Datafelt:** `plan_vejebilag.temperatur` (på den oprindelige vejebilag-række — IKKE en ny tabel)
**Vigtigt:** Dette er den modsatte retning af det normale PLAN→Colas-flow. PLAN er single source of truth for vejebilag-data; temperaturen tilføjes som ekstra felt på den eksisterende række.
**Note:** Andre vejebilag-felter (`tons`, `regnr`, `chauffoer_tlf`, `tidspunkt`, `vejebilag_nr`) skrives IKKE af Colas — kun `temperatur`.

### Trin 4 — Live UI-opdatering
**Komponent:** `TemperaturBadge`
**Handling:** Efter gem skifter komponenten fra input-tilstand til registreret-tilstand (værdi + pill). Klik på værdien åbner input igen til redigering — formand kan opdatere fri.

### Trin 5 — Fase 2 (ikke i MVP)
**Forretningsønske:** Temperaturregistrering flyttes til chauffør-app så formanden kan stå i marken. UI-mønstret i `TemperaturBadge` skal designes med tanke på dette — datafeltet (`plan_vejebilag.temperatur`) er det samme uanset hvem der skriver.

---

## Flow 10: Returlæs — Fabrik → Vognmand → Chauffør (UNDER AFKLARING)

**Status:** Diskussion pågår med kunde. Detaljer + åbne spørgsmål i `.claude/docs/discussions/returlaes.md`.

**Kerne-koncept:** Fabrik kan oprette en **returopgave** og tildele den til en vognmands-chauffør der kører tomt fra et udførselssted. Opgaven er udenfor Colas-ordren og afregnes af fabrikken. Sidestillet entitet med `Læs` — IKKE en del af `Ordre`.

**Per-rolle (foreløbig):**
- **Formand:** Lille `R`-mærke på chaufførens "på vej til fabrik"-pille i Gantt. Ingen disponering.
- **Vognmand:** Tidsblok i disponerings-Gantt med bestiller + sats. Read-only på selve opgaven.
- **Chauffør:** Fuld task på telefonen (stiplet kant + R-ikon). Accept/afvis + udfør.
- **Fabrik:** Opretter + tildeler (fabrik-app — senere fase).

**Synliggør i chaufførens disponible tid:** `Læs ∪ Returopgaver` — ikke kun Læs.

**Trin udfyldes når kunde har svaret på de 10 åbne spørgsmål** (accept-flow, konflikthåndtering, økonomi-synlighed, matching-mekanisme, m.fl. — se diskussionsdokumentet).

---

## Flow 11: Multilæs (inkl. samleordre) — Formand → Vognmand → Chauffør → Vejning

**LÅST 2026-05-21:** Samleordre og multilæs er DATAMÆSSIGT IDENTISKE — forskellen er kun beslutnings-niveau (morgen vs. drip). Begge bruger samme læs-, vejeseddel- og fordelings-flow.

**To triggers:**
- **A. Multilæs på ekstra-bestilling**: Formand opretter ekstra-bestilling med multilæs ON i Ordre-plan og vælger 2+ ordrer
- **B. Samleordre**: Formand kombinerer 2+ ordrer i Dagsoversigt → alle morgen-bestillinger for de ordrer bliver automatisk multilæs

### Trin 0A — Samleordre-trigger (morgen, valgfrit)
**App:** formand
**Komponent:** `DagsoversigtScreen`
**Handling:** Formand markerer 2+ ordrer for samme dag via checkbox → "Kombiner"-knap → bekræftelses-modal → samleordre oprettes.
**Skriver til:** `samleordrer` med `{ id, dato, ordre_ids: [a, b], anchor_ordre_id: a }`.
**Konsekvens:** ALLE morgen-bestillinger for ordrerne på den dato sættes automatisk som multilæs med anchor + stop-liste fra samleordren.

### Trin 1 — Formand opretter/ser multilæs-bestilling i Ordre-plan
**App:** formand
**Komponent:** `OrdrePlanScreen` → `EkstraBestillingBox` (drip) eller produkt-bokse (morgen via samleordre)
**Handling A (drip):** Tilføj ekstra-bestilling. Toggle multilæs ON. Vælg andre ordrer via checkbox-liste. Vælg produkt fra union-dropdown. Indtast tons.
**Handling B (samleordre):** Produkter på dagen er pre-set som multilæs (auto fra samleordre). Formand justerer tons-fordeling mellem children. Header viser "Samleordre: X + Y".
**Skriver til:** `ekstra_bestillinger` (A) eller `morgen_bestillinger` (B) med `{ multilaes: true, andre_ordrer: [...], product_id, tons, anchor_ordre_id }`.

### Trin 2 — Formand klikker Send til fabrik
**App:** formand
**Komponent:** `OrdrePlanScreen` → bekræftelses-modal
**Handling:** Bekræft afsendelse.
**Skriver til:** `ekstra_bestillinger.sent = true`. Bestillingen dispaches til fabrik OG vognmand.

### Trin 3 — Vognmand modtager bil-bestilling
**App:** vognmand
**Komponent:** `OrdreKort` / `DisponeringsView`
**Viser:** Bil-bestilling med:
  - Produkt + total tons
  - `Multilæs (N stop)`-badge
  - Anchor-udførselssted som rækkefølge #1
  - Komplet stop-liste i ordnet rækkefølge
  - Tons-andel pr. stop (fra formand's morgen-bestilling)
**Læser:** `ekstra_bestillinger` JOIN `orders` for stop-adresser.
**Vigtigt:** Read-only på rækkefølgen — vognmand kan IKKE ændre. Formand bestemmer via anchor-valg.

### Trin 4 — Vognmand disponerer bil
**App:** vognmand
**Komponent:** `DisponeringsView`
**Handling:** Tildel bil + chauffør til multilæs-bestilling. Bil-bookningen "arver" hele stop-listen.
**Skriver til:** `ekstra_bestillinger.confirmed_vehicle = { reg_nr, chauffoer_navn, tlf, bil_type }`.

### Trin 5 — Chauffør får multi-stop task
**App:** chauffeur
**Komponent:** `TaskCard` / `TaskDetailScreen` (kommende multi-stop UI)
**Viser:** Task med stop-rækkefølge:
  - Stop 1: anchor (med ordre-info, tons)
  - Stop 2-N: øvrige stops i rækkefølge
**Læser:** `assigned_tasks` med `multilaes_stops[]`.
**Uden anchor + stop-liste i bil-bestillingen kan chauffør-app intet vise** — datakæden er ufravigelig.

### Trin 6 — Chauffør aflæsser stop for stop
**App:** chauffeur
**Handling:** Markér hvert stop som "Aflæsset" når levering er sket. Tons-andel pr. stop kan justeres på dagen hvis nødvendigt (kunden ville have mere/mindre).
**Skriver til:** `multilaes_stops[].afleveret_tons`, `multilaes_stops[].afleveret_tid`.

### Trin 7 — Vejning på fabrik
**App:** (fabrik-system, udenfor Colas-apps)
**Handling:** Pr. produkt på bilen genereres ÉN vejeseddel ved vejning (chauffør vejer tom, læsser, vejer; tara, læsser produkt 2, vejer).
**Skriver til:** `vejesedler` pr. produkt med `{ product_id, netto_tons, multilaes_flag: true, læs_id }`.

### Trin 8 — Formand fordeler tons + timer ved dagens slut
**App:** formand
**Komponent:** `OrdrePlanScreen` → Udførelse-mode → `BilAfregning` expander
**Handling:**
  - Bil-rækken viser vejesedlerne under sig (én pr. produkt)
  - Multilæs-vejesedler har "Fordel"-expander → manuel tons-input pr. ordre + rest-counter
  - Timer går til anchor-ordre som default; formand kan flytte via radio
  - Hvis akkord-bil og 1,5-times-reglen er trådt i kraft → automatisk forslag om skift til timeløn for hele dagen, formand bekræfter
**Skriver til:** `vejesedler[].fordeling[]` med `{ ordre_id, tons }` per ordre. `bil_afregning.timer_pr_ordre[]`.

### Datamodel-noter

```
ekstra_bestillinger
├── id
├── ordre_id                          // anchor (for multilæs) eller den ene ordre (for puljelæs)
├── product_id
├── tons (total)
├── multilaes: bool
├── andre_ordrer: ordre_id[]          // hvis multilaes
├── puljelaes: bool                   // hvis flere produkter samme bil til samme ordre
├── sent: bool
├── confirmed_vehicle: { reg_nr, ... }
└── multilaes_stops[]                 // ordnet rækkefølge med tons-andel (kun multilæs)

vejesedler
├── id
├── læs_id                            // én læs = én bil-tur
├── product_id
├── netto_tons
├── multilaes_flag: bool              // hvis tons skal fordeles på flere ordrer
└── fordeling[]: { ordre_id, tons }   // udfyldes af formand (multilæs) eller auto (puljelæs/single)
```

---

## Flow 12: "Samles på en bil" (tidligere Puljelæs) — Formand → Vognmand → Chauffør → Vejning

**Terminologi-update 2026-05-22:** "Puljelæs" er omdøbt til **"Samles på en bil"** i UI. Datamodel-felter (`puljelaesFlag`, `pulje_laes`) bevares som identifikatorer i database/typer, men UI-tekst bruger den nye terminologi konsekvent.

**Trigger:** Formand sætter "Samles på en bil"-checkbox PÅ ET PRODUKT (ProductBoxV2) eller PÅ EN EKSTRA-BESTILLING (EkstraBestillingBox) i Asfaltbestilling-rækken. Markøren betyder: "dette produkts tons skal pakkes på SAMME bil som andre produkter der også er markeret samme dag — samme ordre eller samme samleordre".

**Vigtig forskel fra tidligere model:** Puljelæs var en ordre-niveau-checkbox der pakkede ALLE ordrens produkter på én bil. Nu er det per-produkt på alle produkter — også ekstra-bestillinger. Formanden kan derfor have:
- Originalprodukt A + originalprodukt B på samme bil (klassisk puljelæs-pattern)
- Ekstra-bestilling C der samkøres med original A
- Op til 3 produkter på samme bil hvis bilens kompartmenter tillader det

**Søsterflow til Flow 11 (multilæs/samleordre).** Forskellen er at samles-på-en-bil typisk har 1 destination (én ordre) — eller op til samleordrens stop hvis det er kombineret med samleordre-flow.

### Trin 1 — Formand opretter puljelæs-bestilling
**App:** formand
**Komponent:** `OrdrePlanScreen` → `EkstraBestillingBox` med puljelæs-toggle ON
**Handling:** Toggle puljelæs ON (kan også være ON proaktivt før 2. produkt er oprettet). Indtast produkt og tons.
**Skriver til:** `ekstra_bestillinger` med `{ puljelaes: true, multilaes: false, product_id, tons, ordre_id }`.

### Trin 2 — Formand sender til fabrik
**App:** formand
**Komponent:** `OrdrePlanScreen` → bekræftelses-modal
**Skriver til:** `ekstra_bestillinger.sent = true`.

### Trin 3 — Vognmand modtager bil-bestilling med "Samles på en bil"-markering
**App:** vognmand
**Komponent:** `OrdreKort` / `DisponeringsView`
**Viser:** Bil-bestilling med:
  - **"Samles på en bil"-markering (TBD design)** — info-only for vognmanden så han ved at bilen skal kunne håndtere flere produkter. Han ændrer IKKE rækkefølgen, men kan bruge info'en til at vælge en bil med flere kompartmenter (op til 3 produkter samtidig)
  - Én eller flere udførselsadresser (afhænger af om det er kombineret med samleordre)
  - Liste over produkter med hver deres tons
**Vognmand booker bil/chauffør** — ingen rækkefølge-beslutning nødvendig på vognmand-niveau.

**🟡 ÅBENT DESIGN-SPØRGSMÅL:** Hvordan markeres "Samles på en bil" overfor vognmanden visuelt? Forslag: en chip/badge "Samles på en bil · 3 produkter" på bil-kortet, evt. med liste over kompartmenter når man åbner. Skal designes som del af vognmand-prototypens disponerings-view.

### Trin 4 — Chauffør får udvidet fabrik-task med multi-produkt-loading-flow
**App:** chauffeur
**Viser:** Task med ÉN eller flere destinationer + "Samles på en bil"-markering der signalerer multi-produkt-loading-flow ved fabrik.

**Detaljeret fabrik-flow ved geofence-ankomst (LÅST 2026-05-22):**
Når chauffør krydser geofence ved fabrik for en "Samles på en bil"-task, kører chauffør-appen et struktureret loading-flow med vejning mellem hvert produkt:

1. **Velkomst** — "Velkommen Jens. Du har 3 produkter at hente på samme bil."
2. **Vej tom** — "Kør på vægten og vej bilen tom."
3. **Last produkt 1** — "Last [produktnavn 1] — [tons]t."
4. **Vej efter produkt 1** — "Kør på vægten og vej."
5. **Last produkt 2** — "Last [produktnavn 2] — [tons]t."
6. **Vej efter produkt 2** — "Kør på vægten og vej."
7. **Last produkt 3** (hvis relevant) — "Last [produktnavn 3] — [tons]t."
8. **Vej efter produkt 3** — "Kør på vægten og vej."
9. **Afgang** — "Kør til udførselssted: [adresse]."

Hver vejning genererer én vejeseddel pr. produkt (via fabrik-system). Chaufføren behøver ikke holde regnskab med tons selv — appen guider gennem trinene.

**Læser:** `assigned_tasks` med `samles_paa_en_bil_products[]` (array af produkter med tons) eller fortsat `puljelaes_products[]` som data-felt.

### Trin 5 — Vejning pr. produkt
**App:** (fabrik-system)
**Handling:** 1 vejeseddel udskrives PR. PRODUKT på bilen.
**Skriver til:** `vejesedler` med `{ product_id, netto_tons, multilaes_flag: false, læs_id }`.

### Trin 6 — Formand ved dagens slut: bilafregning arver tons
**App:** formand
**Komponent:** `OrdrePlanScreen` → Udførelse-mode → `BilAfregning` expander
**Handling:**
  - Vejesedlerne (1 pr. produkt) listes under bilen
  - INGEN fordelings-expander — tons går automatisk til ordren
  - Time-bil: timer indtastes manuelt som normalt
  - Akkord-bil: bilen arver tons fra vejesedlerne, × sats = beløb
  - 1,5-times-reglen gælder fortsat (akkord → time hvis triggered)
**Skriver til:** `vejesedler[].fordeling[]` med `{ ordre_id, tons }` — auto-udfyldt for puljelæs (single ordre).

---

## Asfaltbestilling — Formand → Vognmand + Fabrik + Dagsoverblik

> **Section:** `asfaltbestilling` (Formand · Planlægning-tab)
> **Source-of-truth:** `Docs/Formand/asfaltbestilling/FLOWS.md` (UX-flows C1-C9)
> **Komponent-scope:** `.claude/sections/formand/asfaltbestilling.md`
> **Datafelter:** `.claude/docs/DATA_FIELDS.md` → sektion "Asfaltbestilling"
>
> Disse flows beskriver de cross-app skrivninger der udløses fra Asfaltbestilling-sektionens hook-actions. Sektionen er **producent**; modtager-apps (fabrik, vognmand, udforsel-dagsoverblik) bygges i separate sektion-pakker — kontrakten låses her.
>
> **Prefix-konvention:** ABE-N (Asfalt-Bestilling-Event)

---

### ABE-1: SendBatch → Vognmand.Disponering

**From:** Formand `useAsfaltbestilling.sendAlleForSelectedDate(kommentar)` (UX-flow C1 step 9)
**To:** Vognmand → Disponerings-sektion (eksisterende DisponeringsView, se Flow 1 Trin 3)
**Trigger:** Formand klikker "Send til fabrik" i `SendBekraeftelsesModal` for en `(orderId, selectedPlanDate)`.

**Payload (per `transport_orders` row, kind=`'morgen'` ELLER `'ekstra'`):**

| Felt | Format | Notes |
|---|---|---|
| `order_id` | uuid | FK til orders |
| `date` | ISO `yyyy-mm-dd` | = `selectedPlanDate` |
| `kind` | `'morgen' \| 'ekstra'` | Skelner morgen-bestilling fra drip-bestilling |
| `tons` | int | `morgenTons` for morgen, `tons` for ekstra |
| `product_id` | uuid | FK til products |
| `samles_paa_en_bil` | boolean | Read fra DayPlan eller EkstraBestilling |
| `weather_active` | boolean | Read fra DayPlan; altid false for ekstra (felt ikke på EkstraBestilling) |
| `kommentar` | string \| null | Delt streng for hele batch'en — samme for alle rows fra samme send |
| `sent_at` | ISO 8601 + TZ | server-genereret |
| `status` | `TransportOrderStatus` | Default `'afventer'` |

**Aggregeret per dato til vognmand-UI:**
- Liste-card "Afventer disponering" pr. `(date, order_id)` — også når der er multiple produkter
- Hver bestilling-row vises som linje under card'en med recipe-name + tons + samles-flag + weather-flag

**Receiver-handling (vognmand):**
1. Ny "Afventer disponering"-opgave dukker op i listen for `date`
2. Vognmand disponerer bil(er) (jf. Flow 1 Trin 4) — sætter `confirmed_vehicles[]`
3. Når bekræftet → `transport_orders.status = 'bekraeftet'`, `confirmed_at = now()`
4. **Hvis `samles_paa_en_bil = true`** på flere rows samme dato + samme order → vognmand opfordres (UI-hint) til at allokere én bil til alle (jf. Flow 12)
5. **Hvis `weather_active = true`** → informativt flag i UI; ingen automatisk re-disponering

**Race / konflikt:**
- Server-side unique constraint på `(day_plan_id) WHERE kind='morgen'` forhindrer dobbelt-send for samme dag.
- Hvis vognmand allerede har disponeret bil og formand sender opdatering (`weather_active` toggle efter send) → vognmand får notification men bil bevares.

---

### ABE-2: SendBatch → Fabrik.OrdreKoe

**From:** Formand `useAsfaltbestilling.sendAlleForSelectedDate(kommentar)` (UX-flow C1 step 9)
**To:** Fabrik → Ordre-kø-sektion (kommende fabrik-app)
**Trigger:** Samme som ABE-1.

**Payload:** Samme `transport_orders`-row som ABE-1. Fabrik læser også:

| Ekstra-felt fra join | Format | Notes |
|---|---|---|
| `recipeCode` | string | Fra `products.recipe_code` |
| `recipeName` | string | Fra `products.recipe_name` |
| `factory_code` | string | Fra `orders.factory_code` |
| `kommentar` | string \| null | Fra `transport_orders.kommentar` |

**Receiver-handling (fabrik):**
1. Ny linje i ordre-køen sorteret efter `sent_at` ASC
2. Fabrik ser `kommentar` som tooltip eller udfoldelig sektion under linjen
3. Fabrik kvitterer modtagelse (ikke nødvendigvis i v1 — TBD om fabrik også opdaterer `confirmed_at`)
4. **Hvis `samles_paa_en_bil = true`** → multi-produkt-loading-flow forberedes (jf. Flow 12)
5. **Hvis `weather_active = true`** → flag vises i køen, informativt

**Race / konflikt:**
- Fabrik-app er kommende — i v1 sendes data men der er ingen fabrik-UI der konsumerer. Kontrakten skal holde stand når fabrik-app bygges.

---

### ABE-3: SendBatch → Formand.UdfoerselDagsoverblik

**From:** Formand `useAsfaltbestilling.sendAlleForSelectedDate(kommentar)` (UX-flow C1 step 9)
**To:** Formand → Udførsel-mode → DagsoverblikSection (samme app, anden sektion)
**Trigger:** Samme som ABE-1, men kun for `kind='morgen'`-rows.

**Payload (intern formand-sync):**

| Felt | Format | Notes |
|---|---|---|
| `order_id` | uuid | — |
| `date` | ISO | — |
| `product_id` | uuid | — |
| `morgen_tons` | int | Default-værdi for "faktisk udlagt"-input |

**Receiver-handling (Formand Udførsel-mode):**
1. Når formand åbner Dagsoverblik for `(order_id, date)` → "faktisk udlagt"-input for `product_id` er pre-fyldt med `morgen_tons`
2. Formand kan stadig overskrive
3. Hvis morgen-bestilling ændres efter send (kun via cancelDay → ny send) → default opdateres (men brugerens manuelle override bevares hvis allerede sat)

**Race / konflikt:**
- Hvis formand allerede har skrevet "faktisk udlagt" → pre-fill overskriver IKKE den manuelle værdi
- Ren read-relation: dagsoverblik læser `transport_orders` via query, ingen tovejs-write

---

### ABE-4: SendBatch → Formand.AsfaltKoersel

**From:** Formand `useAsfaltbestilling.sendAlleForSelectedDate(kommentar)` (UX-flow C1 step 9)
**To:** Formand → Planlægning-tab → AsfaltKoersel-sektion (samme skærm, anden sektion under Asfaltbestilling)
**Trigger:** Samme som ABE-1, kun for `kind='morgen'`.

**Payload (intern UI-sync):**

| Felt | Notes |
|---|---|
| `date` | Markér dagen som "klar til bilbestilling" i Asfalt kørsel-sektionen |
| `total_tons_for_date` | Aggregeret morgen-tons (alle produkter) → starter forudfyldning af biltype-beregneren |

**Receiver-handling (AsfaltKoersel-sektion):**
1. Dagen markeres "klar til bilbestilling" — UI-cue om at formand nu skal disponere biler (jf. Flow 1 Trin 1)
2. Hvis formand allerede har planlagt biler → ingen ændring
3. Hvis tons-aggregatet ændres efter send (cancelDay + ny send) → bil-beregner får signal om at re-validere kapacitet (TBD: notification eller silent re-calc)

**Race / konflikt:**
- Begge sektioner er på samme skærm → re-render synkront via fælles parent-state (`OrdrePlanScreen`).
- Ved offline: AsfaltKoersel kan stadig planlægge biler baseret på cached tons.

---

### ABE-5: CancelDay → Vognmand.Disponering

**From:** Formand `useAsfaltbestilling.cancelDay(productId, dayId, reason)` (UX-flow C2)
**To:** Vognmand → Disponerings-sektion
**Trigger:** Formand vælger en aflysnings-årsag i `ProductBoxV2` reason-picker.

**Payload:**

| Felt | Format | Notes |
|---|---|---|
| `day_plan_id` | uuid | Identificerer hvilken bestilling |
| `cancelled` | boolean | true |
| `cancel_reason` | `AflysningsAarsag` | `'regn' \| 'frost' \| 'underlag' \| 'andet'` |
| `cancel_reason_note` | string \| null | Kun ved `'andet'` (afhænger af C-spg C5) |
| `cancelled_at` | ISO 8601 + TZ | server-genereret |

**Receiver-handling (vognmand):**
1. **Hvis `transport_order` allerede eksisterer for dayId** (allerede sendt):
   - Modtagne `transport_order.status` skal cascade-aflyses (afventer beslutning i C-spg C2 — soft-delete eller separat `cancelled`-flag på row)
   - Notification til vognmand: "Dagens bestilling for [adresse] er aflyst (årsag: [reason])"
   - Hvis vognmand allerede har disponeret bil → bil markeres som "Frigjort" i vognmand-UI; vognmand kan re-allokere bilen til andre opgaver
2. **Hvis `transport_order` IKKE eksisterer endnu** (cancelDay før send):
   - Ingen cross-app effekt — kun lokal opdatering i formand-app

**Race / konflikt:**
- Hvis vognmand er midt i at bekræfte bilen samtidig med formand aflyser → server håndterer optimistic locking. Den der vinder, vinder. Formand får refetch + advarsel.

---

### ABE-6: CancelDay → Fabrik.OrdreKoe

**From:** Formand `useAsfaltbestilling.cancelDay(productId, dayId, reason)` (UX-flow C2)
**To:** Fabrik → Ordre-kø-sektion
**Trigger:** Samme som ABE-5.

**Payload:** Samme `day_plans.cancelled=true`-event.

**Receiver-handling (fabrik):**
1. **Hvis `transport_order` allerede eksisterer**:
   - Row markeres som aflyst i kø-view (visuel: bad-styling, "Aflyst — [reason]" label)
   - Hvis fabrik ikke har påbegyndt loading → fjern fra aktiv kø
   - Hvis fabrik er i gang med loading → kritisk advarsel (særskilt UX-design TBD i fabrik-sektion)
2. **Hvis `transport_order` IKKE eksisterer** → ingen effekt

**Race / konflikt:**
- Hvis fabrik er midt i loading + formand aflyser → fabrik vinder (loading kan ikke rulles tilbage). Vejeseddel oprettes alligevel. Formand notificeres via toast.

---

### ABE-7: ToggleSamlesPaaEnBil → Vognmand.Disponering (+ downstream Chauffør)

**From:** Formand `useAsfaltbestilling.toggleSamlesPaaEnBil(productId, dayId, samles)` eller `useEkstraBestilling.updateEkstra(id, { samlesPaaEnBil })` (UX-flow C5)
**To:** Vognmand → Disponerings-sektion (→ derefter Chauffør-app via vognmand-disposition)
**Trigger:** Formand toggler "Samles på en bil"-checkbox.

**Payload:**

| Felt | Format | Notes |
|---|---|---|
| `day_plan_id` eller `ekstra_bestilling_id` | uuid | Identifier |
| `samles_paa_en_bil` | boolean | Ny værdi |

**Receiver-handling (vognmand):**
1. **Flag-opdatering før send** (mens dagen er `'afventer'`): Flag persisteres til DB; vognmand ser det først når `transport_order` ankommer ved Send-batch
2. **Flag-opdatering efter send** (`isSent === true`) — sker **kun** hvis Carsten beslutter at tillade dette (jf. C-spg C8). **Default: ikke tilladt — checkbox locked på sendt row.**
3. Vognmand-UI: produkt-row får "Samles på en bil"-indikator (visuel pattern fra Flow 12)
4. **Hvis vognmand allokerer én bil til flere `samles_paa_en_bil=true`-rows på samme dato + samme order**:
   - Multi-produkt-loading-flow trigges i chauffør-app når bilen ankommer fabrik (9-trins flow jf. `project_samles_paa_en_bil_marker`)

**Receiver-handling (chauffør — downstream via vognmand-disposition):**
- Chauffør-app modtager udvidet fabrik-task: "Læs produkt 1: [recipe] [tons], silo [X]; læs produkt 2: [recipe] [tons], silo [Y]"
- Vejning sker pr. produkt på fabrik (jf. Flow 12 Trin 5)

**Race / konflikt:**
- Hvis vognmand allerede har disponeret bil baseret på `samles=false` og formand toggler til `true` → vognmand får notification + UI-hint om at konsolidere
- Reverse: hvis `samles=true → false` efter disposition → vognmand bør re-vurdere

---

### ABE-8: ToggleWeather → Vognmand.Disponering + Fabrik.OrdreKoe

**From:** Formand `useAsfaltbestilling.toggleWeather(productId, dayId, active)` (UX-flow C4)
**To:** Vognmand → Disponerings-sektion OG Fabrik → Ordre-kø
**Trigger:** Formand toggler vejr-ikon på `ProductBoxV2`.

**Payload:**

| Felt | Format | Notes |
|---|---|---|
| `day_plan_id` | uuid | — |
| `weather_active` | boolean | Ny værdi |

**Receiver-handling (vognmand):**
1. Vognmand-UI viser informativt "Vejr-påvirket"-flag på row'en
2. **Ingen automatisk re-disponering** — vejr er pure information jf. B12
3. Vognmand kan manuelt beslutte at flytte bil, ringe til formand, eller acceptere

**Receiver-handling (fabrik):**
1. Fabrik-kø viser flag
2. **Ingen automatisk "minus regn"-fradrag** — afregnings-logikken bestemmes manuelt af formand i Udførsel-mode (jf. project_offline_strategi / afregningsregler i Flow 4)
3. Fabrik kan stadig levere som planlagt

**Race / konflikt:**
- Tilladt at toggle efter send (jf. C-spg C7 default = tilladt)
- Idempotent: gentaget toggle = ingen ekstra side-effekter

---

## Asfaltbestilling — Modeller modtaget af modtager-apps (kontrakt-resumé)

Dette er minimum-felter som modtager-apps SKAL kunne læse fra Supabase når `transport_orders` + `day_plans` + `ekstra_bestillinger` er populeret:

```
transport_orders                                  // Source-of-truth for "sendt til fabrik"
  ├── id: uuid
  ├── order_id: uuid                              // FK
  ├── day_plan_id: uuid | null                    // FK (morgen) eller null (ekstra)
  ├── ekstra_bestilling_id: uuid | null           // FK (ekstra) eller null (morgen)
  ├── kind: 'morgen' | 'ekstra'
  ├── product_id: uuid                            // FK
  ├── date: date                                  // dato bestillingen er for
  ├── tons: int                                   // ≥ 0
  ├── status: 'afventer' | 'bekraeftet'           // TransportOrderStatus
  ├── kommentar: text | null                      // delt pr. (order_id, date)-batch
  ├── sent_at: timestamptz                        // immutable efter set
  └── confirmed_at: timestamptz | null            // sættes af fabrik/vognmand

day_plans                                          // Source-of-truth for "planlagt"
  ├── id: uuid
  ├── product_id: uuid                             // FK
  ├── date: date
  ├── tons_planned: int                            // ≥ 0
  ├── morgen_tons: int | null                      // formand's morgen-input
  ├── cancelled: boolean                           // false default
  ├── cancel_reason: 'regn'|'frost'|'underlag'|'andet' | null
  ├── cancel_reason_note: text | null              // KUN hvis cancel_reason='andet' (C-spg C5)
  ├── samles_paa_en_bil: boolean                   // false default
  └── weather_active: boolean                      // false default

ekstra_bestillinger                                // Drip-bestillinger
  ├── id: uuid
  ├── order_id: uuid                                // FK
  ├── product_id: uuid | null                       // null indtil bruger vælger
  ├── date: date                                    // = formand's selectedPlanDate ved oprettelse
  ├── tons: int                                     // ≥ 0
  ├── samles_paa_en_bil: boolean                    // false default
  ├── puljelaes: boolean                            // false default — DATA-ONLY (ikke UI på bestilling)
  ├── multilaes: boolean                            // false default — DATA-ONLY
  ├── sent: boolean                                 // false default
  └── sent_at: timestamptz | null
```

**Cross-app reads:**
- **Vognmand** queryer `transport_orders JOIN day_plans JOIN ekstra_bestillinger JOIN products JOIN orders` for sin disposition-view
- **Fabrik** queryer samme set for sin ordre-kø
- **Formand Udførsel-mode (Dagsoverblik)** queryer `transport_orders WHERE kind='morgen' AND date=?` for pre-fill af "faktisk udlagt"
- **Chauffør** modtager opgaver via `assigned_tasks[]` der peger på `transport_orders` (downstream af vognmand-disposition)

---

## Flow 13: Fabrik-skift fra PLAN — info til formand + auto-genberegning (LÅST 2026-05-27)

**Status:** Design låst — implementering afventer
**Trigger:** Fabrik X får nedbrud, PLAN tildeler ordren til Fabrik Y i stedet
**Kilde:** PLAN er single source of truth — apps reagerer på PLAN-push, initierer ikke skiftet selv

### Trin 1 — PLAN pusher ny fabrik
**App:** server / sync-lag
**Trigger:** Fabrik-personale eller PLAN-bruger registrerer nedbrud + omfordeler ordren til ny fabrik
**Skriver til:** `orders.factory.id = nyt_fabrik_id`, `orders.factory.driveTimeMinutes = nyt_drive_time` (genberegnet via Google Distance Matrix på ny rute), `orders.factory_change_log[] = { gammel_fabrik, ny_fabrik, tidspunkt, aarsag }`

### Trin 2 — Formand notificeres
**App:** formand
**Komponent:** Toast eller banner på OrdrePlanScreen (NY — kommer)
**Visning:** "Fabrik ændret til [Fabrik Y] kl [tidspunkt] · [årsag fra PLAN]"
**Handling:** **Kun info** — ingen bekræftelse kræves. Fabrikken ringer parallelt til formand for verbal bekræftelse uden for systemet.
**Læser:** `orders.factory_change_log[]` (seneste entry)

### Trin 3 — Vognmand auto-opdateres
**App:** vognmand
**Komponent:** Disponerings-view + ordre-kort (LIVE-opdatering)
**Visning:** Ny fabrik-info i ordre-header. Mødetid-fabrik pr. bil genberegnes automatisk fra ny `driveTimeMinutes` (samme formel som første-læs + interval-modellen — se Flow 1 Trin 5b)
**Handling:** Vognmand ser ændringen, kan justere disponering manuelt hvis nødvendigt — ingen tvang

### Trin 4 — Chauffør får ny navigation
**App:** chauffeur (React Native)
**Komponent:** Push-notifikation + TaskDetailScreen opdateres
**Distribution:** Push direkte til chauffør-tlf med ny adresse
**Visning ift. status:**
- `paa_vej_til_fabrik`: navigation skifter til ny fabrik-adresse, ETA genberegnes
- `paa_fabrik` (på OLD fabrik): chauffør færdiggør sin nuværende last på OLD fabrik (kører læs som planlagt). Kun NÆSTE læs henter på NEW fabrik
- `undervejs`/`aflaesning`/`udlagt`: upåvirket (læs er allerede påvej til/på pladsen)
**Læser:** `assigned_tasks` med opdateret `factory_id` + `factory_address`

### Trin 5 — Vejesedler upåvirket (LÅST 2026-05-27)
- Vejesedler fra OLD fabrik beholdes uændret — de blev jo leveret derfra
- Nye vejesedler får ny `fabrikId` automatisk fra opdateret ordre-state
- **Ingen visuel markering pr. vejeseddel om hvilken fabrik den kom fra** — modtaget-summen optæller tons uden hensyn til fabrik
- Vejesedler-tabel viser bare det datasæt der kommer ind

**Cross-app stakeholders:**
| Rolle | Action | Hvornår |
|---|---|---|
| Fabrik (PLAN) | Initierer skiftet | Trin 1 |
| Fabrik (verbal) | Ringer formand for at sikre besked er modtaget | Parallelt Trin 2 |
| Formand | Informeres (banner/toast) — ingen action påkrævet | Trin 2 |
| Vognmand | Ser opdaterede tider, kan justere | Trin 3 |
| Chauffør | Får ny navigation + push | Trin 4 |

**🟡 ÅBNE SPØRGSMÅL (implementering):**
- **Recept-kompatibilitet**: Kan NEW fabrik altid producere samme produkt? Hvis ikke — hvem fanger det? Sandsynligvis PLAN, men UI-advarsel ville være rart
- **Bil allerede ved OLD fabrik**: Skal chauffør se en advarsel om at NÆSTE læs er ny fabrik, eller bare modtage push når sin nuværende læs er udvejet?
- **Log-visning**: Skal `factory_change_log` være synlig i formand-UI (historik over hvilke fabrikker der har leveret)? Sandsynligvis ja — relevant for ordre-historik

---

## Datamodel — nøglerelationer

```
orders
  ├── asfalt_koersel[]
  │     ├── planlagt: boolean
  │     ├── kommentar: string
  │     ├── bekraeftet_af_vognmand: boolean
  │     └── confirmed_vehicles[]
  │           ├── reg_nr: string
  │           ├── chauffoer_navn: string
  │           ├── tlf: string
  │           └── bil_type: string
  ├── materiel[]
  │     ├── anlaegsnr: string                   // fra PLAN holdpakke
  │     ├── beskrivelse: string                 // fra PLAN holdpakke
  │     ├── ordrenummer_betaler: string | null  // hvis udlånt fra anden afd. — betaler for transport
  │     ├── afhentningssted: string             // auto-udfyldt hvis ordrenummer_betaler er kendt
  │     ├── postnummer: string
  │     ├── aflaesningssted: string
  │     ├── aflaesningspostnummer: string
  │     ├── gemt: boolean                       // formand har trykket "Gem transport"
  │     ├── bekraeftet_af_vognmand: boolean     // true når vognmand har sat en bil på
  │     └── confirmed_transport
  │           ├── bil_type: string              // valgt af vognmand
  │           ├── chauffoer_navn: string        // valgt af vognmand
  │           └── chauffoer_tlf: string
  ├── holdpakke                                 // fra PLAN — kan udvides af formand, skrives retur
  │     ├── mennesker[]
  │     │     ├── navn: string
  │     │     └── rolle: string
  │     └── materiel_ids[]                      // referencer til orders.materiel[]
  ├── timeafregning: 'ja' | 'nej'               // fra PLAN — styrer materiel-timer-flow (Flow 2 Trin 7)
  ├── materiel_anvendelse
  │     ├── holdpakke_timer_total: number       // brugt når timeafregning = 'nej' (én samlet værdi)
  │     └── materiel[]
  │           ├── anlaegsnr: string
  │           ├── anvendt: boolean              // bruges når timeafregning = 'nej' (bekræftes brugt)
  │           └── timer_brugt: number           // bruges når timeafregning = 'ja' (per enhed)
  ├── forundersoegelse
  │     ├── underlag: string                    // valgt fra PLAN-dropdown
  │     ├── tilstand_ok: boolean
  │     ├── årsager[]: string                   // multi-select fra PLAN, kun hvis tilstand_ok = false
  │     ├── aftalt_med: string                  // fritekst
  │     ├── forbehold: string                   // fritekst
  │     ├── billeder[]
  │     │     ├── url: string
  │     │     ├── uploaded_at: datetime
  │     │     └── tag: "forundersoegelse"       // synkes til orders.dokumentation[] med samme tag
  │     ├── ekstraarbejde[]
  │     │     ├── type: string                  // fra PLAN-dropdown
  │     │     ├── kommentar: string
  │     │     └── antal: number
  │     └── afsluttet: boolean                  // trigger sync_to_plan + notify_projektleder
  ├── assigned_tasks[]
  │     ├── driver_phone: string
  │     ├── truck_plate: string
  │     └── task_timestamps
  │           ├── ankomst_fabrik: datetime    // geofence-trigger
  │           ├── qr_scannet: datetime        // silo bekræftet
  │           ├── afgang_fabrik: datetime     // udvejet
  │           ├── ankomst_udfoerselssted: datetime
  │           └── afgang_udfoerselssted: datetime
  └── task_logs[]
        ├── silo_bekraeftet: string           // silo-id fra QR
        ├── last_tons: number                 // fra vægt
        ├── kørsel_minutter: number
        ├── pause_minutter: number
        └── opgave_minutter: number

fabrik
  ├── id: string
  ├── navn: string
  ├── geofence_lat: number
  ├── geofence_lng: number
  ├── geofence_radius_m: number               // fx 200m
  └── siloer[]
        ├── silo_id: string
        ├── produkt: string
        └── qr_payload: string

time_registreringer
  ├── id: string
  ├── chauffoer_id / tlf: string
  ├── regnr: string                          // til materiel = transport-bilens regnr
  ├── dato: date
  ├── dayId: string                          // matcher orders.dailyPlan[].day
  ├── ordrenummer: string
  ├── kategori: 'asfalt-bil' | 'materiel'
  ├── afregning_type: 'time' | 'akkord'      // fra confirmed_vehicles[].afregning_type, fallback = 'time'
  ├── afregning_type_kilde: 'vognmand' | 'fallback' // hvor kom typen fra
  ├── materiel_ids: string[]                 // kun ved kategori='materiel' — dækker enheder
  ├── timer_kørsel: number | null            // time-afregning
  ├── timer_ventetid: number
  ├── timer_pause: number | null             // KUN asfalt-bil + time. Materiel har INTET pause-felt
  ├── chauffør_kommentar: string | null
  ├── godkendt_af_formand: boolean | null    // null = afventer
  ├── godkendt_af: string | null             // formand-navn
  ├── godkendt_tidspunkt: datetime | null
  ├── genaabnet_tidspunkt: datetime | null   // sat hvis formand har genåbnet en tidligere godkendt afregning
  └── formand_kommentar: string | null       // ved evt. afvisning (afvis-flow ikke i v1)

plan_vejebilag                                // PLAN — registreres af fabrik/vejebilags-system
  ├── id: string
  ├── regnr: string                          // bil-regnr (= confirmed_vehicles.regnr)
  ├── chauffoer_tlf: string                  // backup-identifier
  ├── ordrenummer: string                    // hvilken ordre tonsene tilhører
  ├── dato: date                             // dagen lastet
  ├── tidspunkt: datetime                    // præcist tidspunkt for vejebilag
  ├── fabrik_id: string
  ├── silo_id: string
  ├── produkt: string                        // asfalttype (receptkode — fx "82101H")
  ├── tons: number                           // last-vægt (udvejet - indvejet)
  ├── vejebilag_nr: string                   // reference fra fabrik-system
  ├── temperatur: number | null              // °C — SKRIVES RETUR FRA COLAS (Flow 9). null = ikke registreret endnu
  └── valgt_udlaegger_materielnr: string | null // fx "9-0009" — formand vælger i UdlaeggerDropdown (Flow 8 Trin 6)
// JOIN-regel for akkord-afregning:
//   SELECT regnr, SUM(tons) AS tons_dag
//   FROM plan_vejebilag
//   WHERE regnr = :regnr AND dato = :dato AND ordrenummer = :ordrenummer
//   GROUP BY regnr
// WRITE-BACK: Colas skriver KUN `temperatur` og `valgt_udlaegger_materielnr` retur til PLAN.
//   Alle øvrige felter er read-only fra Colas' side — PLAN/fabrik-system er kilden.

recepter                                      // PLAN — produktkatalog
  ├── kode: string                           // fx "82101H"
  ├── navn: string                           // fx "SMA 11S"
  ├── densitet: number                       // kg/m³ — heltal (fx 2400 for SMA 11S)
  ├── kg_per_m2: number                      // brugt til beregning af m² ↔ tons
  └── min_temperatur: number                 // °C — fallback hvis ordre/dag ikke har egen min
// BRUGES TIL:
//   - tonsIDag → arealIDag via kg_per_m2
//   - tonsAnkommet → forventet_udlagt_m2 via kg_per_m2
//   - faktisk tykkelse-beregning via densitet (Flow 7 Trin 3)
//   - TemperaturBadge OK/Lav-grænse via min_temperatur

vejeseddel                                    // afledt view i Colas (kombination af plan_vejebilag + status)
  ├── id: string                             // = plan_vejebilag.id når vejebilag findes, ellers temp-id
  ├── vejeseddel_nr: string | null           // = plan_vejebilag.vejebilag_nr, null hvis ikke modtaget endnu
  ├── regnr: string
  ├── chauffoer_navn: string                 // opslag fra vognmandsmodul
  ├── receptkode: string | null              // = plan_vejebilag.produkt
  ├── fabrik_id: string | null
  ├── fabrik_navn: string | null             // opslag fra fabriksstamdata
  ├── tons: number | null                    // = plan_vejebilag.tons
  ├── modtaget_tidspunkt: datetime | null    // = plan_vejebilag.tidspunkt
  ├── status: 'ankommet' | 'undervejs' | 'paa-vej-til-fabrik'  // KANONISK — sat af hook
  ├── temperatur: number | null              // = plan_vejebilag.temperatur
  ├── valgt_udlaegger_materielnr: string | null // = plan_vejebilag.valgt_udlaegger_materielnr
  └── eta_minutter: number | null            // beregnet fra GPS-position (chauffør-app)
// STATUS-AFLEDNING:
//   ankommet           ⇔ vejeseddel_nr != null OG tons != null
//   undervejs          ⇔ afgang_fabrik != null OG vejeseddel_nr == null
//   paa-vej-til-fabrik ⇔ afgang_fabrik == null OG ankomst_fabrik == null

dagsoverblik_registreringer                   // Colas — formands manuelle registrering af faktisk udlagt
  ├── id: string
  ├── ordrenummer: string
  ├── dato: date
  ├── faktisk_m2: number                     // formand indtaster i FremdriftInputRow
  ├── faktisk_tons: number                   // formand indtaster i FremdriftInputRow
  ├── faktisk_tykkelse_mm: number            // beregnet: tons × 1_000_000 / (m² × densitet)
  ├── gemt_tidspunkt: datetime               // sidst gemt
  └── gemt_af: string                        // formand-navn
// ÉN række per (ordrenummer, dato) — overskrives ved hver gem.
// MIRRORS RETUR TIL PLAN ved dagens afslutning (Flow 7 Trin 5 — ikke bygget endnu).

afregninger                                   // fra Colas til vognmand
  ├── periode: month
  ├── chauffoer_id / tlf: string
  ├── afregnede_timer: number
  └── beløb: number
```

---

## Forretningsregler (ikke-åbenlyse)

- Chauffør identificeres via tlf-nummer OG nummerplade — der er ikke et login-system for chauffører
- Én bil kan dække flere materiel-linjer på samme ordre (kapacitet vurderes manuelt af vognmand)
- Asfalt og materiel er separate sektioner på samme ordre — hvert har sit eget bekræftelsesbadge
- Vognmand ser materiel-linjer som en ekstra sektion UNDER asfalt-disponeringen — ikke som separat ordre
- **Geofence aktiverer velkomst** — chaufføren skal ikke selv markere ankomst; GPS udløser når radius krydses (default 200m, TBD per fabrik)
- **QR-koden ved silo er en safety-check** — hvis silo-id i QR ikke matcher produkt på ordren, må chauffør IKKE laste. Forhindrer fejl-læs af forkert asfalttype
- **Timestamps er sandhedskilde for ETA og afregning** — `ankomst_fabrik`, `afgang_fabrik`, `ankomst_udfoerselssted`, `afgang_udfoerselssted` bruges både til real-time ETA og til efterfølgende timeregistrering
- **ETA går to veje**:
  - Til **formand**: når chauffør forlader fabrik → forventet ankomst på udførselssted
  - Til **fabrik** (kommende app): når chauffør forlader udførselssted → forventet næste ankomst på fabrik (så fabrik kan planlægge silo-tømning)
- **Timeregistrering = kørsel + pauser** — beregnes automatisk fra GPS + state-changes, ikke manuelt. Formand godkender; vognmand bruger godkendte timer som sammenligning mod Colas' afregning
- **Afregningstype styrer felter i formand-UI** — `afregning_type` på `confirmed_vehicles[]` afgør om afregnings-formen viser køretimer/pause (time) eller tons kørt (akkord). Hvis vognmand-systemet ikke leverer typen: fallback til `time` med warning + manuel override (manuel override ikke bygget i første iteration)
- **Materiel afregnes per chauffør, ikke per materiel-enhed** — kører én chauffør 3 materiel-enheder på samme transport-bil, oprettes 1 afregningsrække der dækker alle 3. Materiel er ALTID time-afregning (aldrig akkord)
- **Vognmand ser kun godkendte afregninger** — vognmand-portal viser KUN `time_registreringer` hvor `godkendt_af_formand = true`. Afventende afregninger er usynlige for vognmand
- **Distributions-mekanisme til chauffør er ikke afklaret** — Flow 1 trin 8 har TBD. Push, polling eller event på reg.nr skal besluttes inden prod
- **Holdpakke kommer fra PLAN, men kan udvides af formand** — Tilføjelser (mennesker eller materiel) SKAL skrives retur til PLAN. PLAN er sandhedskilde for ressourceallokering på tværs af afdelinger
- **Holdpakke håndteres under Udførelse via to forskellige registreringer:**
  - **Mennesker (holdet):** Hver person i holdpakken får en **timeregistrering** under Udførelse (start/slut eller antal timer per dato). Bruges til løn/akkord-afregning.
  - **Materiel:** Hvert materiel registreres med **antal timer brugt** under Udførelse. Bruges til materiel-afregning/intern fakturering mellem afdelinger
  - Begge registreringer skrives retur til PLAN ved afslutning af ordren
- **Udlånt materiel betaler-ordrenummer** — Hvis et materiel er lånt fra en anden afdeling, kan formanden indtaste den ordres ordrenummer. Det er den ordre der dækker transportomkostningen. Feltet er valgfrit og rent informativt — det blokerer ikke gem-flowet, men hvis ordrenummeret er kendt i systemet, præudfyldes afhentningsadresse + postnummer automatisk
- **Bekræftet-boks pr. materiel** — Når vognmand har sat bil på en materiel-linje, oprettes en bekræftet-boks i formand-appen med: anlæg, beskrivelse, transport (biltype), chauffør (navn), chauffør-tlf. Samme indhold vises i Udførelse-sektionen
- **Forundersøgelse-felter kommer fra PLAN** — Underlag-typer, årsager og ekstraarbejde-typer er IKKE fri-tekst; de er prædefinerede lister fra PLAN. Kun "Aftalt med", "Forbehold" og kommentar-felterne på ekstraarbejde er fri-tekst
- **Forundersøgelse-billeder synker til Dokumentation** — Billeder uploadet i Forundersøgelse vises også automatisk under Dokumentation (Planlægning) med badge/tag "Forundersøgelse" så kilden er tydelig
- **Ekstraarbejde trigger notifikation til projektleder** — Hvis formand tilføjer ekstraarbejde-linjer, SKAL projektleder notificeres ved afslutning af Forundersøgelse (notifikations-mekanisme TBD). Ekstraarbejde påvirker økonomi og kræver godkendelse
- **Vejeseddel-status er kanonisk** — Status (`'ankommet' | 'undervejs' | 'paa-vej-til-fabrik'`) er et eksplicit felt på `Vejeseddel`-typen. Hooken sætter feltet baseret på GPS + afhentet-flag, men UI-komponenter (`VejeseddelRow`, `VejesedlerTable`) læser KUN `status`-feltet og delegerer på det — ingen kombination af flags i komponenter
- **Densitet er kg/m³ som heltal** — `recepter.densitet` er altid heltal (fx 2400 for SMA 11S). Faktisk tykkelse beregnes som `tons × 1_000_000 / (m² × densitet)` og giver tykkelse i mm. Vigtigt at densiteten ikke forveksles med kg/m² (som bruges til areal-beregning fra tons)
- **Afvigelses-farve er symmetrisk på fortegn** — I `FremdriftCard` (variant=`faktisk-udlagt`): `+X m²` → grøn (`text-good`), `−X m²` → rød (`text-bad`). Ingen tærskel-baseret farveskift; KUN fortegnet styrer farven. Afvigelse vises kun hvis `!== 0`. Minus-tegn er U+2212 (`−`)
- **Temperatur skrives RETUR til PLAN** — Det normale flow er PLAN → Colas, men `plan_vejebilag.temperatur` er en undtagelse: Colas (formand) er kilden, PLAN er destinationen. Datafeltet sidder på den oprindelige vejebilag-række — IKKE i en ny tabel. Når temperaturmåling i fase 2 flyttes til chauffør-app, ændrer datafeltet sig ikke, kun hvem der skriver
- **Udlægger-konvention** — Udlæggere identificeres på materielnummer-prefix `9-` (fx `9-0009 VÖGELE 1900-3I`). `UdlaeggerDropdown` filtrerer materiel-listen på dette prefix. Andre materielnumre (fx `7-` tromler) er ikke udlæggere
- **ETA-forsinkelse er TREND-baseret, ikke instant speed** — `EtaBadge` farve-formattering baseres på `(etaMinutter − forventetEtaMinutter) / forventetEtaMinutter`. Tærskler: ≤25% = neutral (grå), 25–50% = warn (gul), >50% = bad (rød). Det fanger reel forsinkelse pålideligt og undgår falske positive fra GPS-noise (stoplys, kortvarige stop). Se Flow 8 Trin 5a for detaljer
- **Dagsoverblik-registrering er en enkelt række per ordre/dato** — `dagsoverblik_registreringer` har én række per `(ordrenummer, dato)`. Hver "Gem" overskriver tidligere værdier; ingen historik gemmes i v1 (kan tilføjes ved Supabase-koblingen via en separat `dagsoverblik_historik`-tabel hvis nødvendigt)
- **Aften-, nat- og weekend-udførelse er en ordre-attribut fra PLAN** — Nogle ordrer skal udføres uden for normal arbejdstid. Feltet `tidsvindue?: 'aften' | 'nat' | 'weekend'` sidder på `Ordre`-typen (cross-app: både formand og vognmand). Det kommer fra PLAN på samme måde som `jobnummer` og kan IKKE redigeres i Colas-apps. Visuelt mønster i Gantt (formand + vognmand bruger SAMME regler):
  - `aften` → hele baren rendres `bg-warning` (gul) på tværs af bar-duration, uanset state (planlagt/aktiv/færdig)
  - `nat` → hele baren rendres `bg-deep-teal` (mørk) på tværs af bar-duration
  - `weekend` → bar'en beholder sin state-farve; `bg-bad` (rød) overlay rendres KUN på de cell-segmenter der falder på lørdag/søndag (ikke på hverdage indenfor bar-spanet)
  - Legenden vises under Gantt-kortet sammen med state-forklaringerne
  - Chauffør-app surfacer feltet i fase 2 (TBD: badge på ordre-kort eller i task-detail). Vognmand bruger feltet til disponering — fx undgå chauffører der ikke vil/kan tage natarbejde
- **Helligdage skal markeres som weekend i Gantt (produktion)** — Prototypens weekend-tint (`bg-surface-2`/`bg-good-bg` på dag-headers + cells) skal i produktion udvides til en dansk kalender med mærkedage: nytårsdag, skærtorsdag, langfredag, 2. påskedag, store bededag, Kr. himmelfartsdag, 2. pinsedag, juleaften, juledag, 2. juledag, nytårsaftensdag. Helligdage skal rendres med SAMME visuelle stil som weekender. Konsekvens for `tidsvindue: 'weekend'`-overlay: bør udvides til at dække helligdage også (TBD ved Supabase-kobling — kræver enten helligdagskalender-tabel eller server-side beregning)
- **Chauffør-app erstatter Danvægt-vejekort via NFC HCE (antagelse, afventer kunde-bekræftelse)** — Den planlagte arkitektur er at chauffør-appen fungerer som virtuelt NFC-kort: chaufføren holder telefonen hen til Danvægt-læseren, der identificerer ham som med dagens fysiske kort. Teknik: **Host Card Emulation (HCE)** på Android, Apple Wallet-pass på iOS. **Forudsætning:** Danvægt-læseren skal bruge **13,56 MHz NFC (ISO 14443-A/B)**. "RFID" er bredt — kun NFC-frekvensen kan emuleres. Hvis læseren er 125 kHz LF-RFID eller UHF, virker det IKKE og kræver hardware-skift hos Danvægt. Konsekvenser ved positiv bekræftelse: (1) chauffør-app skal hver morgen hente et nyt "kort-ID" via PLAN-integration (svarer til dagens kort-omkodning), (2) backup-flow nødvendigt for glemt telefon/fladt batteri/NFC-fejl, (3) iOS-flåde kræver Apple Wallet-pass-integration eller standardisering på Android. Se `Docs/Formand/AFKLARING_Multi-produkt_og_Vejekort.md` Q23-29 for åbne spørgsmål.
