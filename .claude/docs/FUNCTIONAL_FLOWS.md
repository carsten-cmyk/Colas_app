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

### Variant: Multi-produkt — sekventiel kørsel per produkt (LÅST 2026-06-03)

**Forretningsregel:** En asfaltbestilling kan indeholde flere produkter (fx 180t SMA 11S + 120t GAB 0/16). Bilerne kører **sekventielt per produkt**, aldrig flettet. Det ene produkt køres helt færdig (inkl. sidste-læs-rest) før næste produkt påbegyndes.

**Eksempel-flow** (ordre med 180t SMA 11S + 120t GAB 0/16, bil-kapacitet ≈25t):

1. Bil 1, 2, 3, 4, 5, 6, 7 kører **SMA 11S** sekventielt (7 × 25t = 175t)
2. Bil 8 kører **sidste læs SMA**: rest 5t (mindre end fuld lastvogn)
3. Bil 9 starter på **GAB 0/16** fra bunden — fuldt læs
4. Bil 10, 11, 12 fortsætter GAB sekventielt
5. Bil 13 kører **sidste læs GAB**: rest 20t

**Konsekvenser for beregninger:**

- **"Forventet sidste læs" er per produkt** — IKKE én tid per ordre. Beregnes:
  - `forventet_sidste_laes[produkt] = (ceil(produkt.tons / bil_kapacitet) − 1) × interval + foerste_laes_paa_plads + akkumuleret_offset_fra_tidligere_produkter`
  - For første produkt: `akkumuleret_offset = 0`
  - For produkt N: `akkumuleret_offset = sum(antal_biler_for_produkt[1..N-1]) × interval`
- **UI-pille** i `VejeseddelRow` hedder `Forventet sidste læs` (ikke "Sidste læs") indtil chauffør faktisk har afhentet med `er_sidste_laes: true` — først da bliver det realiseret sidste læs
- **Sidste-læs-frigivelses-flow** (Variant ovenfor) trigges PER PRODUKT — overflødige biler kan frigives når sidste-læs af det igangværende produkt er allokeret, OG der ikke er flere produkter i køen. Hvis næste produkt afventer, holdes flåden intakt.

**Datamodel-konsekvens:**
```
orders.produkter[]: {
  produkt_id: string,
  asfalttype: string,
  recept: string,
  tons: number,
  raekkefolge: number,           // 1, 2, 3 — kørselsrækkefølge
  status: 'venter' | 'aktiv' | 'faerdig',
  sidste_laes_vejeseddel_id?: string,  // sættes når sidste-læs er identificeret
}
```

**UI-konsekvens i `OrdrePlanScreen` / `UdfoerselContent`:**
- Vejesedler-tabellen grupperes per produkt (én sektion per produkt, sorteret efter `raekkefolge`)
- "Forventet sidste læs"-pille vises på den sidste planlagte bil per produkt — kan blive til "Sidste læs" når faktisk afhentet
- Cross-app: vognmandens disponering og fabrikkens produktionsplan respekterer rækkefølge (én asfalttype produceres ad gangen i fabrik)

**🟡 Åbne spørgsmål:**
- Hvad sker hvis sidste-læs af produkt A er fejlbehæftet (fx bilen taber læs) — skal vi køre en ekstra runde af produkt A før vi skifter til B, eller justere planen?
- Skal formand kunne ændre `raekkefolge` på produkter (fx hvis kunden ringer og prioriterer GAB først)? Antagelse: ja, men kun indtil første-læs er afgang fra fabrik.

#### Start-rækkefølge — formandens anbefaling af de første 3 læs (LÅST 2026-06-03)

**Forretningsregel:** Formand kan angive en anbefalet biltype-rækkefølge for de **3 første læs** på en dag. Anbefalingen gælder kun biltyper (ikke specifikke køretøjer) og er IKKE hård låsning hos vognmand. Vognmand kan afvige, men forventes at ringe og forhandle hvis han ikke kan/vil følge anbefalingen.

**Hvorfor 3?** Det er antallet vi har brug for til at få intervaller ordentligt i gang om morgenen. Efter de 3 første kører flåden i steady state og rækkefølge er mindre kritisk.

**Datamodel-udvidelse** (på `DayPlan` eller per-dag-bil-bestillings-niveau):

```ts
startRaekkefoelge?: [string | null, string | null, string | null]
// Array af længde 3. Værdier:
// - biltype-streng (fx 'Grab', 'Træk', 'Solo') = anbefalet biltype på den position
// - null = ingen anbefaling for den position
// Tomme positioner er gyldige — formand kan vælge fx kun Nr. 1 + 3 uden Nr. 2.

startTider?: [string | null, string | null, string | null]
// NYT (LÅST 2026-06-04): Parallelt array af længde 3 — konkret starttidspunkt (HH:mm)
// per position. Knyttet 1:1 til startRaekkefoelge-positionen.
// - Nr. 1's tid = ordrens starttidspunkt (se ordreoversigt-regel nedenfor)
// - null = ingen tid angivet for den position
```

**Interval — flyttet ind i Start-rækkefølge-blokken (LÅST 2026-06-04):** Interval-feltet ("Herefter interval") er flyttet op UNDER Nr. 3 i Start-rækkefølge-blokken og styrer kadencen for læs EFTER de 3 eksplicit timede positioner. Det bruger samme underliggende interval-felt som hidtil (`intervalMinutes`/`intervalMin`) — ingen ny interval-datamodel. **"Første læs"-feltet bevares** på sin nuværende plads og fungerer som fallback når formand IKKE har angivet start-rækkefølge med tid.

> ⚠️ **Reconcilering med "Per-produkt kørselsfelter" (nedenfor):** For multi-produkt-ordrer er interval i dag PER PRODUKT (`produkt.intervalMin`). Når interval flyttes til dag-niveau "Herefter interval", gælder per-position-modellen også multi-produkt (besluttet 2026-06-04). Hvis dag-niveau-konsolidering kolliderer med per-produkt-sekventiel-logikken, beholdes per-produkt-interval urørt og afvigelsen noteres her ved implementering.

**Start-rækkefølge er kilde → produktfelter spejler (LÅST 2026-06-04):** Start-rækkefølge-blokken (bil 1's starttid + "Herefter interval") er **eneste indtastningssted**. Produktets felter "Første læs (på plads)" + "Interval (min)" er **read-only spejlinger**:
- Bil 1's starttid (`startTider[0]`) → vises read-only i "Første læs (på plads)" + synkroniseres til `firstLoadTime` (downstream gantt-summary m.m.)
- "Herefter interval" (`intervalMinutes`) → vises read-only i "Interval (min)"
- **Kun produkt 1** spejler. Multi-produkt produkt 2+ beholder sine egne redigerbare felter + Ja/Nej-toggle (den låste per-produkt-model — urørt).
- **Validering:** Mangler bil 1's tid og/eller interval, vises en **gul alert** (`bg-warn-bg border-warning`) ved produktet: "Du skal udfylde {første læs / interval / begge}". Alert'en er adaptiv (nævner kun det der mangler).

**Afstand til fabrik + drivetid (LÅST 2026-06-04):** "Afstand til fabrik"-feltet ligger i Bilbehov-kolonnen (højre side af Start-rækkefølge-blokken) som et redigerbart km-input. Køretiden afledes som **drivetid = km × 1 min** og vises ved siden af (fx "36 km · 36 min").
- **Kilde:** km-værdien kommer fra **Google Maps-integrationen** (køreafstand fabrik → udførelsessted). I prototypen er den mocket via `GOOGLE_KM` (default 36).
- **Override:** Formand kan redigere km manuelt; afviger værdien fra Google-tallet vises et "Google: X km"-hint. `// TODO: Erstat med Supabase/Google API når klar`.
- **Bruges af:** `roundTime` (rundtid = km × 2 + 15 min læsning + 15 min aflæsning) og "Forventet sidste bil"-beregningen.

**Tidligere `foersteLaes: boolean` på `VehicleOrder` udgår** — feltet slettes fra både type og UI. Ingen migration nødvendig (prototype).

**UI — formand-side (Asfaltkørsel-sektion i OrdrePlanScreen):**

Bil-listen forbliver uændret (Grab × 3, Træk × 2 etc.). UNDER bil-listen (efter "Tilføj biltype"-knappen) tilføjes en ny blok:

```
Start-rækkefølge (anbefaling til vognmand)
─────────────────────────────────────────
Vælg de 3 første biler i rækkefølge.
Anbefalingen er ikke bindende — vognmand kan afvige.

  Nr. 1:  [Vælg biltype ▼]   [ 06:39 ]
  Nr. 2:  [Vælg biltype ▼]   [ 06:54 ]
  Nr. 3:  [Vælg biltype ▼]   [   —   ]
  Herefter interval:  [ 15 ] min
```

- Hver slot er en `<select>` der viser:
  - Placeholder "Ingen anbefaling"
  - Optionerne = de unikke biltyper fra dagens bil-bestilling (kun typer der har antal > 0)
- **Til højre for hver dropdown** står et `<input type="time">` = starttidspunkt for den position (skrives til `startTider[pos]`)
- **Under Nr. 3** står "Herefter interval"-feltet (number + "min") — flyttet hertil fra den tidligere separate "Første læs + Interval"-blok. "Første læs"-feltet bliver dog stående nedenfor som fallback.
- Slots kan udfyldes uafhængigt (sekventielt ikke krævet — Nr. 1 og 3 uden Nr. 2 er gyldigt)
- Hvis dagen har < 3 biler bestilt totalt, vises kun det relevante antal slots
- **Egen bil-flow**: Hele blokken skjules (ikke relevant — én chauffør, ingen rækkefølge-koordinering)

**UI — vognmand-side (VognmandDisponeringsScreen):**

Over disponerings-tabellen vises en anbefalings-banner når formand har sat `startRaekkefoelge`:

```
┌─ Formand anbefaler start-rækkefølge ──────────────────────────┐
│ Nr. 1: Grab — 06:39    Nr. 2: Træk — 06:54    Nr. 3: —        │
│ Herefter interval: 15 min                                     │
│ Du kan afvige — ring til formand hvis det ikke kan lade sig   │
│ gøre.                                                          │
└────────────────────────────────────────────────────────────────┘
```

Banner-stil: `bg-soft-aqua border border-light-aqua rounded-md px-md py-xs`. Tekstniveauer: header `font-poppins text-sm font-medium text-deep-teal`, anbefalings-pilles `text-xs`, fodnote `text-xxs text-text-muted`.

**NYT (LÅST 2026-06-04):** Banneret viser nu **starttidspunkt** ved hver Nr. (fra `startTider`) + en linje med **"Herefter interval: X min"**. Det er samme blå boks som hidtil — informationen udvides blot. Fodnoten "Du kan afvige…" beholdes.

For de første 3 læs-positioner i tabellen vises også en lille **anbefalings-pille** ved siden af "X. læs"-badgen: `(anbef. Grab)` i `text-xxs text-text-muted`. Når vognmand har tildelt en bil til positionen, og typen matcher anbefalingen → pille forsvinder (eller skifter til ✓). Hvis han har valgt anden biltype → pille beholder originalen som påmindelse.

**Starttidspunkt i vognmandens ordreoversigt (LÅST 2026-06-04):** Det starttidspunkt vognmanden ser på ordre-niveau (ordreoversigt/liste + disponerings-header) følger denne regel:
- Hvis formand HAR angivet start-rækkefølge med tid → **Nr. 1's starttidspunkt** (`startTider[0]`) er ordrens starttidspunkt
- Hvis ingen start-rækkefølge/tid er valgt → fallback til **første læs** (`førsteLæsPåPlads`)

Dette gælder alle steder vognmanden viser starttidspunkt for ordren (disponering, liste, evt. gantt) så tallet er konsistent på tværs af skærme.

**Cross-app status:** ✅ Spec låst. Implementering dispatches (formand + vognmand prototype-buildere kører 2026-06-04, issue-fri /bg).

**Edge cases:**

| Situation | Håndtering |
|---|---|
| Færre end 3 biler bestilt | Vis kun de relevante slots (1 eller 2). Egen bil-flow: blokken skjules helt. |
| Formand vælger ingen anbefaling | Vognmand-banner skjules. Disponering fungerer som hidtil. |
| Vognmand vælger anden biltype end anbefaling | Lille muted "(anbef. X)"-pille forbliver som påmindelse. Ingen blokering. |
| Vognmand kan ikke skaffe anbefalet biltype | Telefonopkald til formand → formand opdaterer eller accepterer afvigelse. |
| Samme biltype valgt flere gange (fx Grab på Nr. 1 og Nr. 3) | Gyldigt — Grab × 3 i bestillingen tillader dette. UI tjekker IKKE for unikke værdier. |

---

#### Per-produkt kørselsfelter — formand styrer overgange (LÅST 2026-06-03)

**Forretningsregel:** Ordrer med flere produkter har typisk en "under-asfalt" først og "top-lag" oveni — med eventuelt en reparations-pause imellem. Formand definerer overgangen ved at sætte felter PER PRODUKT i Asfaltkørsel-sektionen i stedet for ét fælles sæt for hele dagen.

**Felter per produkt:**
```ts
produkt: {
  // ... eksisterende felter (tons, recept, raekkefolge, status)
  foersteLaesPaaPlads?: string   // HH:mm — første læs på plads for DETTE produkt
                                  // null = "starter når forrige produkt er færdigt"
  intervalMin?: number            // minutter mellem læs for DETTE produkt
                                  // Hvert produkt kan have eget interval
}
```

**Default-adfærd:**
- Hvis `foersteLaesPaaPlads === null` → produkt N starter når produkt N-1's sidste vejeseddel er udvejet på fabrik (sekventielt direkte)
- Hvis udfyldt → produkt N starter på den angivne tid (eller efter forrige produkt, hvad der kommer SENEST)

**UI — formand (Asfaltkørsel-sektion):**
- Hvis ordren har 1 produkt: nuværende layout uændret (ét fælles felt-sæt)
- Hvis ordren har 2+ produkter: ét felt-sæt PER produkt, stablet vertikalt med produkt-header
- Reparations-pauser er IMPLICITTE (intet pause-felt) — formand sætter bare en senere start-tid på næste produkt så bliver gabet automatisk synligt

**UI-mønster: Ja/Nej-toggle for produkt 2+ (LÅST 2026-06-03)**

Det hyppigste tilfælde er sekventiel kørsel uden tids-buffer mellem produkter. For at undgå unødig kompleksitet i den almindelige case, bruges et toggle-mønster:

- **Produkt 1 (index 0)**: viser felter (Første læs + Interval) **altid** — det er det første produkt og kræver start-tid
- **Produkt 2 og frem (index ≥ 1)**: viser **toggle** "Køres direkte efter forrige produkt?" med Ja/Nej:
  - **Ja (default)**: felter er skjult. Server-side betyder dette `foersteLaesPaaPlads === null` → sekventielt direkte efter forrige produkts sidste-læs.
  - **Nej**: felter udvides (Første læs + Interval) så formand kan angive specifik start-tid (med buffer-periode imellem)

**Toggle-tilstand er afledt direkte af data**, ikke separat state:
- `ppParams.foersteLaesPaaPlads === null` ⟺ toggle = Ja
- `ppParams.foersteLaesPaaPlads !== null` ⟺ toggle = Nej

**Toggle-switching:**
- Ja → Nej: `foersteLaesPaaPlads` sættes til en sensible default (forrige produkts tid + 2 timer; fallback `10:00`)
- Nej → Ja: `foersteLaesPaaPlads` sættes til `null`

**Hvorfor toggle-mønstret (UX-rationale):**
- 95% af multi-produkt-ordrer kører sekventielt — toggle gør den almindelige case 0-klik
- Felter dukker kun op når formand bevidst vil have buffer → mindre visuel støj
- Eksplicit toggle gør det klart at "ingen tid sat" = bevidst valgt, ikke glemt input
- Default = Ja matcher tons-drevet aktivt-produkt-logik på serveren (se "Produkt-skift-sikring under eksekvering")

**UI — vognmand (Disponering):**
- Disponerings-tabellen viser produkt-bånd i tidsrækkefølge
- Tid-gab mellem produkter er synligt som tom-zone i tidslinjen
- Læs-nummerering fortsætter på tværs af produkter (ikke nulstilles per produkt)

**UI — fabrik (Produktionsplan):**
- Tidslinjen viser produktion-skift med eventuelt tid-gab
- Fabriksmesteren ved at de skal stoppe produktion mellem to forskellige recepter

**🟡 Åbne spørgsmål:**
- Hvad hvis produkt 1 bliver forsinket og dermed forsinker produkt 2's planlagte start? Antagelse: produkt 2's `foersteLaesPaaPlads` fungerer som "tidligst start" — hvis produkt 1 sluttede senere, så fortsætter B sekventielt fra produkt 1's faktiske slut.
- Skal formand kunne ændre `foersteLaesPaaPlads` mens dagen kører? Antagelse: ja, men kun for produkter der IKKE er startet endnu.

#### Produkt-skift-sikring under eksekvering (LÅST 2026-06-03)

> **🟡 ÅBENT PUNKT (2026-06-05) — kombineret last ved overgang.** Logikken nedenfor antager et **rent sekventielt skift**: `aktivt_produkt` er ét produkt ad gangen, og A→B-skiftet sker først når A's sidste vejeseddel er udvejet. Det dækker IKKE scenariet hvor én bil tager **rest af A + noget af B i samme tur** (to vejninger / to vejesedler på ét fabriksbesøg, med fabrik-besked om begge produkter). Afklaring + signoff tracket i **#36 (`DOCS-AK-001`)**. Indtil den er låst, gælder kun ét-produkt-pr-last-modellen her.

Risiko: Når aktivt produkt skifter fra A til B, må en chauffør IKKE ende med at hente forkert produkt på fabrik. Dette løses med tre lag der hver fungerer som safety net:

**Lag 1 — Server som sandhed (udvidet 2026-06-03)**
"Aktivt produkt" beregnes server-side fra ordrens reelle tilstand — vejeseddel-drevet, ikke tons-tællings-drevet:

```
For hvert produkt på ordren:
  produkt.faerdig = (sum af UDVEJEDE vejesedler for produkt) >= produkt.tons

aktivt_produkt = første produkt i raekkefolge hvor:
  - produkt.faerdig === false   AND
  - (produkt.foersteLaesPaaPlads === null
     ELLER nuværende_tid >= produkt.foersteLaesPaaPlads − driveTimeMinutes)
```

**Trigger-tidspunkt for produkt-skift:** I præcis det øjeblik den sidste vejeseddel for produkt A er udvejet på fabrik (status `paa_vej_til_plads` eller senere), beregnes ny `aktivt_produkt`. Næste chauffør der NFC-scanner får produkt B's instruktion.

**Chauffør er passiv:** Han kører bare runder. App + fabrik fortæller ham hvad næste læs er. Ingen tons-tælling eller tid-tjek i appen — alt er server-side.

App'en spørger serveren ved hver væsentlig handling (task-åbning, fabrik-ankomst, etc.) — ALDRIG fra cache. Hvis offline, viser app sidst-kendte tilstand med "🟡 Ikke synkroniseret"-flag og opdaterer ved første netforbindelse.

**Buffer-periode** (når produkt A er færdig FØR produkt B's start-tid):
- Aktivt produkt = null
- Chauffør-app viser banner: "Vent — næste læs (produkt B) starter kl. HH:mm. Du kan tage pause."
- Først når `nuværende_tid >= produkt_B.foersteLaesPaaPlads − driveTimeMinutes` bliver B aktivt

**Lag 2 — Fabrik-scanning er final source of truth**
Når chauffør NFC-scanner ved Danvægt-læseren, fortæller fabrik-systemet HAM hvad han skal hente: silo X, produkt B, recept Y. Selv hvis hans app stadig viser produkt A (telefon offline, push fejlet, cache stale), så er fabrik-skærmens instruktion korrekt. App'en opdaterer sig efter scanning. Konsekvens: en chauffør kan ALDRIG ende med at hente forkert produkt — fabrikkens vejekortlæser er gatekeeper.

**Lag 3 — Produkt-skift-banner i chauffør-appen**
Når server registrerer at produkt A er afsluttet (sidste-læs A udvejet på fabrik), pushes besked til alle aktive chauffører på ordren:
> "Produkt-skift: Næste læs er nu **GAB 0/16** (var: SMA 11S). Tjek silo-nummer ved ankomst fabrik."

Næste-læs-kortet i appen får visuelt update: ny farve på produkt-pille, nyt silo-nummer, ny recept. Hvis chauffør er undervejs til fabrik når skiftet sker, ser han det inden ankomst.

**Tre lag = tre safety nets:**
- Hvis push fejler → app polling fanger ved næste sync
- Hvis app polling fejler → fabrik-scanning fanger ved ankomst
- Hvis chauffør ignorerer banner → fabriksmester ser ham komme og kan korrigere mundtligt

---

### Variant: Chauffør-afslutning af opgave (LÅST 2026-06-03)

**Forretningsregel (Fase 1):** Formand styrer afslutning af opgave manuelt via telefonopkald. Ingen automatisk frigivelse i Fase 1 — eventuel app-driven push-bekræftelse udskydes til Fase 2.

**Flow:**

```
1. Sidste-læs identificeres (sum_allokeret >= bestilt - bil_kapacitet)
   → Sidste-læs-frigivelses-variant trigges (se nedenfor)
2. Formand ringer hver chauffør efterhånden som han kan frigive dem
   → "Vi er igennem opgaven. Du kan stoppe for i dag.
      Vil du afslutte opgaven i appen?"
3. Chauffør åbner sin app → trykker "Afslut dag" på den aktive opgave
4. Vejesedlen for chaufførens næste planlagte tur (der ikke kommer)
   får status: 'dag_afsluttet'
5. Vejesedlen vises automatisk i formandens VejesedlerTable
   med eksisterende "Dag afsluttet"-badge — gråtonet,
   ikke bag collapsible (se VejesedlerTable.tsx behandling)
```

**Genbrug af eksisterende mekanik:**
- `Vejeseddel.status = 'dag_afsluttet'` enum eksisterer allerede (`apps/formand/src/types/order.ts:211`)
- Mock-data har eksempler (`apps/formand/src/mocks/vejesedler.ts:198, 216, 239`)
- `VejesedlerTable.tsx` håndterer allerede gruppering + visning (`linje 72-83`)
- Ingen nye UI-elementer kræves — kun NY trigger fra chauffør-app

**Multi-produkt: chauffør frigives først når HELE ordren er færdig**
Hvis en chauffør er på produkt A og produkt B venter, kører han videre på produkt B (sekventielt, jf. multi-produkt-reglen ovenfor). Frigivelse via formand sker først når sidste-læs af SIDSTE produkt er identificeret.

**Edge cases:**

| Situation | Håndtering (Fase 1) |
|---|---|
| Chauffør glemmer at trykke "Afslut dag" | Formand ser ingen `dag_afsluttet`-badge på vejesedlen → ringer igen. Manuel oversight. |
| Chauffør har allerede taget næste læs på fabrik | Retur-flow trigges (se "Retur-flow for biler i transit" ovenfor) |
| Chauffør er undervejs men ikke ved fabrik | Formand siger "kør hjem". Chauffør lukker i app. Vejeseddel-status `dag_afsluttet`. |
| Formand glemmer at ringe | Chauffør kan ende med at køre til fabrik for endnu et læs. Fabriks-NFC-scan fanger det (server siger "ordre færdig, intet næste læs"). Chauffør får besked + kontakter formand. |

**🟡 Fase 2-udvidelser (forskudt):**
- App-driven frigivelse: formand klikker "Frigiv chauffør" → push til chauffør → bekræft-task
- Automatisk påmindelse til formand hvis chauffør ikke bekræfter inden N min
- Auto-frigivelse hvis sidste-læs er udlagt og chauffør har ingen aktiv læs-task

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

### Variant: Formand aflyser en dag pga. regn (LÅST 2026-06-03)

**Forretningsregel:** Når formanden markerer en dag på asfaltbestillingen som aflyst pga. regn (via minus-regn-flag eller dedikeret aflys-handling), skal vognmanden se det tydeligt på sin ordre.

**Trigger:** Formand toggler aflysnings-status på dag-niveau i `OrdrePlanScreen` → `dag.annulleretAarsag = 'vejr'` propagerer til vognmandens mock/datalag.

**Vognmand-visning:**

- **Liste-view** (`VognmandListeScreen`): På den aflyste dag-række — hele rækken får baggrund `bg-warn-bg` (pale yellow). I "Kommentar"-kolonnen vises en prominent pille:
  ```
  inline-flex items-center gap-xxxs px-xs py-xxs rounded-md
  bg-yellow text-deep-teal
  font-poppins font-semibold text-xs uppercase tracking-wide
  ```
  med `CloudRain`-ikon + tekst "Ordre annulleret pga. vejr". Evt. eksisterende `dag.kommentar`-tekst vises under pillen i `font-inter text-xxs text-text-muted`.

- **Disponerings-view** (`VognmandDisponeringsScreen` på `/disponering/[ordreId]`): Dag-rækken får samme `bg-warn-bg` baggrund + samme vejr-pille under dato-teksten. Identisk token-sæt som liste-view så vognmanden genkender markeringen på tværs af skærme.

**Data-model:**
```ts
type DagDisponering = {
  // ... eksisterende felter
  annulleretAarsag?: 'vejr'  // streng-union, kan udvides
}
```

Feltet er optional. `undefined` = ikke aflyst. Streng-union fremfor boolean så vi senere kan udvide til `'kunde-aflysning' | 'fabrik-nedbrud' | etc.` uden migration.

**Cross-app status:** ✅ Implementeret i vognmand-prototyper. Formand-side mangler — aflysning sker pt. ved manuel mock-data-edit, ikke via UI-handling fra formanden. Næste skridt: Formand skal kunne aflyse en dag fra sit OrdrePlanScreen og se status-feedback når aflysningen er propageret.

#### Data-bevarelse ved dag-aflysning (LÅST 2026-06-03)

**Hovedregel:** Aflysning er på DAG-niveau, ikke ordre-niveau. Ordre-ID er stabilt gennem hele forløbet. Al data der er logget på den aflyste dag op til aflysningstidspunktet skal BEVARES og gennemgå normal afregning. Aflysningen påvirker kun den **fremtidige planlægning** for dagen, ikke det allerede udførte.

**Bevarede data på den aflyste dag (still goes through afregning):**

| Datatype | Kilde | Afregningsflow |
|---|---|---|
| Chauffør-timer | Chauffør-app (registreret før aflysning) | Formand godkender i Udførelse/Afregning som normalt |
| Bil-afregning (bil + tons) | Chauffør-app + vejekort | Tons der ER kørt indgår i akkord/time-afregning |
| Tons-data | Vejekort fra fabrik (faktisk leveret) | Indgår i normal afregning og rapportering |
| Materiel-afregning | Formand registrerer per dag på Materiel-sektionen | Logges på dagen som normalt |

Alt det her er IKKE optional cleanup — det er obligatorisk audit-trail. Formanden skal kunne lukke afregning for den arbejdede del af dagen INDEN ordren replanlægges.

**Datamodel: Booking vs. Ordre (LÅST 2026-06-03)**

To begreber på forskellige niveauer:

- **Ordre** = den varige enhed (entreprise-niveau). Stabilt ordre-ID gennem hele forløbet inkl. aflysninger. Akkumulerer historik på tværs af bookings.
- **Booking** = et planlægnings-artefakt for en specifik dag: bil-bestilling + asfalt-bestilling + materielplan. Har egen lifecycle: `planlagt → bekræftet → udført` ELLER `aflyst-vejr`.

Aflysning **sletter ikke** ordren — den lukker booking'en og opretter en ny. Eksekveret data (timer, kørte tons, materiel) bliver hængende på ORDREN, ikke på booking'en, så det overlever booking-lifecycle.

**Replanlægnings-flow (PLAN → Formand → Vognmand + Fabrik):**

1. **Trigger:** Formand markerer dag som aflyst (vejr) → booking-status sættes til `aflyst-vejr`
2. **Booking lukkes** — bliver synlig i historik men forsvinder fra "aktive opgaver" hos vognmand. Den oprindelige booking REDIGERES IKKE — den lukkes som den var, så audit-trailen er klar.
3. **PLAN-system reagerer:** PLAN flytter uafsluttede leverancer (resterende asfalt-mængde, holdpakke for dagen) til ny dato og sender opdaterede data tilbage til formand
4. **Formand modtager nye data** for samme ordre — UI viser "Genplanlagt fra [oprindelig dato] pga. vejr" på den nye dag
5. **Formand opretter ny booking på samme ordre** for den nye dato:
   - Ny bil-bestilling for resterende mængde
   - Ny asfalt-bestilling fra fabrik
   - Samme ordre-ID — separat booking-ID
6. **Cross-app notifikation** (vigtigt — propageres til begge sider):
   - **Vognmand**: Eksisterende `ændretAfFormand`-badge (samme mekanik som ved andre formand-ændringer) tændes på ordren. Vognmand ser den lukkede booking i historik + den nye booking til disponering. Han skal disponere fra bunden — ingen automatisk overførsel af tidligere disponering.
   - **Fabrik**: Modtager nye instrukser om biler og tons for den nye dato (fabrik-mester ser den i sin produktionsplan). Den oprindelige asfalt-bestilling forsvinder fra fabrik's aktive plan på den aflyste dato.

**UX-princip:** "Slet booking + opret ny" frem for "tilpas booking" — fordi:
- Aflysning er ikke en delvis ændring; det er en komplet planlægnings-reset
- Tilpasning ville overskrive den oprindelige bookings data (mister audit-trail)
- Vognmand undgår at gætte hvad der stadig gælder af hans disponering
- Klar visuel signal: gammel forsvinder, ny dukker op

**Retur-flow for biler i transit ved aflysning (LÅST 2026-06-03)**

Hvis dagen aflyses mens nogle biler allerede har taget læs på fabrik og er undervejs (eller venter på pladsen uden at have udlagt), skal læsset returneres til fabrik. Asfaltens kvalitet falder hurtigt, så vi kan ikke bare lade bilerne vente.

**Forretningsregler:**

1. **Kun biler MED læs der IKKE er udlagt** indgår i retur-flow. Hvis chauffør allerede har udlagt læsset på pladsen, er det leveret — formand giver bare besked "stop for i dag, vi tager resten i morgen", og dagens udlagte afregnes normalt.
2. **Formand identificerer og markerer biler individuelt** — én ad gangen efter telefonisk samtale med hver chauffør. Ingen bulk-action; det er for nuanceret (hver bil kan være i forskellig position).
3. **Retur-task kan ikke afvises af chauffør** — formandens beslutning står. Chauffør får task i app og udfører.
4. **Retur sker samme dag** — ingen overnatning. Læs returneres til afsender-fabrik (samme fabrik som læsset blev hentet på).
5. **Materiel håndteres IKKE** i retur-flow. Materiel-biler/-trailere står på pladsen eller hvor de er, indtil arbejdet genoptages næste dag. Det er fysisk acceptabelt (modsat asfalt der stivner).
6. **Fabrik-side beslutning om genbrug** — fabriksmesteren beslutter pr. produkt om returneret asfalt genbruges, kasseres eller blandes. App'ens rolle er at DOKUMENTERE returen via vejeseddel; ikke at træffe genbrugs-beslutning.

**Flow-trin:**

```
1. Aflysning besluttes af formand (dag-niveau)
2. Formand identificerer biler i transit / på plads uden udlæg
3. PER BIL: Formand ringer chauffør → bekræfter retur
4. Formand markerer i app: original vejeseddel får `retur_initieret = true`
   → system genererer retur-task til chauffør
5. Chauffør modtager task: "Kør retur til fabrik [X] med læs"
   - Kan ikke afvises
6. Chauffør udfører retur:
   a. Ankomst fabrik → indvejer bil fuld (genbrug af eksisterende vejeflow)
   b. Aflæsser i fabrik efter instruks fra fabriksmester (silo / spild)
   c. Udvejer tom
7. System genererer modparts-vejeseddel:
   - type: 'retur-laesset'
   - tons: negative (− original tons)
   - kobles til original vejeseddel via `relateret_vejeseddel_id`
   - oprindelig vejeseddel bevares uændret (audit-trail)
8. Tons-bogføring:
   - Net leveret = sum(positive vejesedler) − sum(retur-vejesedler)
   - Ikke-leverede tons flyttes til replanlægning via PLAN
9. Chaufførens timer afregnes normalt (kørsel ud + retur = normal kørselstid, ingen returlæs-tillæg — det blev jo aldrig udlagt på plads)
```

**Datamodel:**

```ts
type Vejeseddel = {
  // ... eksisterende felter
  type?: 'normal' | 'retur-laesset'    // default 'normal'
  retur_initieret?: boolean             // formand har markeret denne til retur
  retur_initieret_tidspunkt?: string    // ISO
  retur_initieret_af?: string           // formand-navn
  relateret_vejeseddel_id?: string      // peger på original ved type='retur-laesset'
}
```

**UI-konsekvenser:**

- **Formand**: På vejesedler-listen får hver oprindelig vejeseddel en "Send retur"-handling (kun synlig hvis bilen IKKE har udlagt OG dagen er aflyst). Klik åbner bekræftelses-dialog ("Har du talt med chauffør [X]?") → marker vejeseddel + generér retur-task.
- **Formand**: Retur-vejesedler vises i listen med `bg-warn-bg` + `-X tons` i rødt + ikon der signalerer "retur".
- **Chauffør**: Ny task-type "Retur til fabrik" — kan ikke afvises, samme veje-flow som normal afhentning men spejlet ("indvejer fuld → aflæsser → udvejer tom" i stedet for "indvejer tom → læsser → udvejer fuld").
- **Fabrik**: Indkommende retur-bil vises i produktionsplan-tidslinjen som en BLÅ pille med "RETUR"-label (eller tilsvarende kontrast til normal-piller). Fabriksmester får ikon/notifikation om at beslutte genbrug/spild — men app'en kræver ikke aktiv handling for at lukke flowet.

**🟡 Implementerings-status (2026-06-03):** Spec låst. **Kode-implementering venter til næste session.** Pille-rename ("Sidste læs" → "Forventet sidste læs") og returlæs-fjernelse er allerede gennemført i denne session som forberedelse.

**Badge-lifecycle — hvornår forsvinder "Ændret af formand"? (LÅST 2026-06-03)**

Eksplicit bekræftelse fjerner badge — ingen "har set"-tracking. Hver app er ansvarlig for sit eget signal:

| App | Trigger der fjerner badge |
|---|---|
| **Vognmand** | Vognmand re-disponerer biler på den nye booking OG trykker "Bekræft ordre" (samme handling der allerede lukker `ændretAfFormand`-flag i normal-flow Trin 5). Ingen automatisk dismiss — vognmand skal aktivt acceptere ændringen. |
| **Fabrik** | ~~Eksplicit "OK, set"-knap~~ — **fjernet 2026-06-05**: Aflyst-vejr-badge er permanent visuel indikator. Ingen brugerhandling kræves fra fabriksmester. Badge + advarsels-baggrund forbliver synlig hele dagen (jf. UI-tweak i ProduktionsplanScreen.tsx). |

Begge apps har **uafhængig lifecycle** — vognmand kan have bekræftet uden at fabrik har, og omvendt. Hver app rydder sit eget signal.

**2026-06-05: Fabrik produktionsplan layout-justeringer:**
- Minus-regn-ikon flyttet fra øverst-i-info-kolonnen til inline med recept-nummer (forhindrer at ikonet skubber tekstrækker ned)
- "OK, set"-knap på aflyst-vejr-ordrer fjernet — aflysning er permanent visuel indikator, ingen brugerhandling kræves

Hvis dagen udløber (overgang til historik) uden bekræftelse → badge forsvinder automatisk fra aktive lister, men markeringen forbliver i historik som "håndteret uden bekræftelse".

**Historik-bevarelse på ordren:**

Ordren er en **append-only log** af dage. Hver dag har sin egen sektion med:
- Status (planlagt / udført / aflyst-vejr / aflyst-andet)
- Bestilte biler + tons for den dag
- Faktisk udførte timer + leverede tons
- Afregnings-status (afventer godkendelse / godkendt)
- Eventuelle bemærkninger

**Tidligere udførte dage** (både den aflyste dag op til aflysning, og dage før) skal forblive synlige på deres faktiske udførselsdato med deres afregningsdata — uanset om senere dage på ordren bliver aflyst eller replanlagt. Der slettes IKKE noget.

**UI-konsekvens:**
- Ordrekortet viser dage kronologisk
- Aflyste dage: `bg-warn-bg` + vejr-pille (som beskrevet ovenfor) + den arbejdede dels afregning forbliver synlig
- Replanlagte nye dage: markeret som "Genplanlagt" indtil ny bestilling er bekræftet
- Historik kan ikke redigeres (afregning er låst efter godkendelse)

**Cross-app status:** 🟡 ÅBNT — Data-bevarelse er besluttet 2026-06-03, men implementering kræver:
- PLAN-integration (modtage genplanlægnings-data)
- Append-only dag-struktur i mock-data (`Ordre.dage[]` med per-dag-status og locked afregning)
- Formand-UI til at se "historik vs. ny planlægning" på samme ordre
- Vognmand-UI til at se historik af tidligere udførte dage på en ordre der har haft aflysning

**Åbne spørgsmål:**
- Hvad sker hvis chaufføren stadig var på vej til fabrik kl. 09:00 da aflysningen kom kl. 08:55? Skal hans transport-timer dækkes selvom han ikke nåede at hente læs?
- Hvad hvis materiellet allerede er kørt ud på pladsen — skal returkørsel logges separat?
- Skal aflyste dage have en "ÅRSAG"-felt der er mere granuleret end bare 'vejr' (fx kunde-aflysning, fabrik-nedbrud)?
- Kan en aflysning REVERSERES samme dag hvis vejret skifter (fx aflyst kl. 06:30, vejret klarer op kl. 09:00 og man kan arbejde alligevel)?

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

**Per-materiel expandable + arvet info (LÅST 2026-06-04):** Materiel der køres på blokvogn skal hos vognmanden vise den FULDE transport-info per enhed — **arvet 1:1 fra formandens materiellevering-planlægning** (Trin 1's expandable). Hver materiel-enhed kan **foldes ud individuelt** (samme expand-mønster som formand/planlægning) og viser:
- **Afhentningssted + postnummer** og **Aflæsningssted + postnummer** (arvet fra `orders.materiel[]`)
- Øvrige info-felter fra formandens expandable (beskrivelse, anlæg, kommentar)
- **Google-kort** for både afhentning og aflæsning (samme kort-integration/placeholder som formand-prototypen)

Formål: vognmanden får tilstrækkelig kontekst til at disponere korrekt blokvogn/chauffør UDEN at gætte. Ingen ny data skrives her — det er ren read/visning af formandens felter.
**Issue:** #15 (vognmand-prototype)

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

### Trin 4b — Chauffør modtager materiel-opgave (egen udførsels-variant) (LÅST 2026-06-04)
**App:** chauffeur / chauffeur-web
**Komponent:** Materiel-/blokvogns-variant af udførselssiden (ikke bygget) — **visuelt adskilt** fra den normale asfalt-udførsel (`AnkommetUdfoerselsstedScreen`)
**Forretningsforståelse:** En materiel-opgave er en **transport-opgave**, ikke en læsse-opgave. Chaufføren henter materiel ét sted og afleverer det et andet — han kører IKKE asfalt fra fabrik til plads. Derfor intet indvejning/udvejning/asfalt-flow.
**Viser:**
- **Afhentningssted** + adresse og **Aflæsningssted** + adresse — prominent
- **Google-kort/navigation** til begge adresser
- Materiel-enhed(er) der skal transporteres (anlæg + beskrivelse)
- Evt. **kommentar til chauffør** (samme felt som asfalt-flow, se Flow 1 Trin 1)
**Læser:** `orders.materiel[]` (afhentningssted, aflæsningssted, postnumre, beskrivelse, anlæg, kommentar), `confirmed_transport`
**Krav:** Touch targets ≥ 44×44px (udendørs brug i bil).
**Issue:** #16 (chauffør-prototype)

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

### Trin 3 — QR-scan på vejeterminal (LÅST 2026-05-29)
**App:** chauffeur
**Komponent:** `AnkommetFabrikScreen` (sub-screen: `qr-scan`)
**Handling:** Chauffør scanner unik QR-kode på vejeterminalen. Appen sender signal til vejesystem som starter vejesekvensen (indvejning).

**Beslutning 2026-05-29 (Thomas, ansvarlig for fabrikker + vejesystem):**
- **NFC HCE er DROPPET** — Danvægt's kortlæser er RFID på frekvenser der ikke er telefon-kompatible
- **QR-scan på vejeterminal er valgt** — ingen hardware-udskiftning hos fabrikkerne
- **App-bruger-adgangs-baseret** — ikke telefon-specifik binding
- **Cross-platform** — virker på både iOS og Android

**Læser:** `orders.produkt` + QR-payload (terminal-id)
**Validerer:** terminal-id matcher fabrik på ordren — ellers fejl
**Skriver til:** `task_timestamps.qr_scannet = now()`, `task_logs.terminal_bekraeftet = terminal_id`
**Aktiverer:** Vejesystem starter vejesekvens (indvejning klar — chauffør kører på vægt)

**🟡 Åbne tekniske spørgsmål til Thomas** (afklares før implementation):
- QR-format: URL eller signeret JSON-token?
- Security: time-bound token? Bruger-auth ved scan? Forhindr deling af QR-billede?
- Backend API-kontrakt mellem chauffør-app og vejesystem (REST/webhook/event)
- Offline-fallback: hvad sker når vejesystem er nede?

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

### Trin 4a — Returlæs-timer (🚫 FLYTTET TIL FASE 2 — 2026-06-03)

**Status (LÅST 2026-06-03):** Returlæs-funktionalitet er **fjernet fra Fase 1**. Håndteres udenfor app i første omgang (manuel registrering hos vognmand eller via eksisterende time-rapport). Genoptages i Fase 2 — se "Fase 2 udvidelser"-sektion nederst i dokumentet.

**Tidligere låst spec bevares nedenfor som reference til Fase 2-implementering** — men UI + datafelter SKAL fjernes fra Fase 1-koden:

~~**Forretningsregel:** Når en chauffør slutter dagen med rest-asfalt på bilen ELLER materiel der skal retur til fabrikken, registrerer formanden ekstra timer for chaufførens retur-kørsel. Det er chaufførens kompensation for at køre tomt tilbage.~~

~~**UI-detaljer:**~~
- ~~Knap **"+ Returlæs"** vises som default i bunden af expanderen (under eksisterende køretimer-række)~~
- ~~Ved klik: ny række med felt for **timer** (decimal-tal, fx 1,5) + valgfri kommentar-felt + **× fjern**-knap~~
- ~~Etiket: "Returlæs (rest asfalt eller materiel retur til fabrik)"~~
- ~~Værdien LÆGGES TIL den samlede afregning (chauffør får løn for køretimer + returlæs-timer)~~
- ~~**Kun formand kan tilføje** — chauffør har ikke selv mulighed for at indberette returlæs-timer~~

~~**Skriver til:** `time_registreringer.returlaes` med `{ timer: number, kommentar?: string, registreret_af_formand: bool, registreret_tidspunkt: timestamp }`.~~

**Fjernet fra Fase 1-kode:**
- `Afregning.returlaes_timer` (type-felt)
- `Afregning.returlaes_kommentar` (type-felt)
- "+ Returlæs"-knap + relateret UI i `OrdrePlanScreen` (afregnings-expander)
- `updateAfregningField`-kald for `returlaes_timer` / `returlaes_kommentar`

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

### Trin 6b — Vognmand ser chauffør-timer i Chauffør-overblik (Færdselsstyrelse-dokumentation) (LÅST 2026-06-04)
**App:** vognmand
**Komponent:** Chauffør-overblik (`/prototyper/chauffoer-overblik`) → foldud per chauffør → **Sektion 1: Timer** (issue #14 [VOGN-DAGO-003])
**Formål:** Vognmanden skal kunne dokumentere kørslen overfor **Færdselsstyrelsen** — derfor vises chaufførens egen registrering SAMMEN med formandens godkendte tal. **Kun timer, aldrig beløb.**

**Chaufførens registrering (GPS-baseret, 3 felter):**
- **Kørsel** — inkl. læsning + aflæsning (registreres ved ankomst fabrik/plads); folder ind i kørsel, ikke separate felter
- **Ventetid** — chauffør holder stille og venter på at komme til udlægger eller ind på fabrik
- **Pause**
**Kilde:** `time_registreringer` (samme tabel chaufføren skriver til i Trin 2)

**To linjer i visningen:**
| Linje | Indhold |
|---|---|
| Chauffør timer | Kørsel · Ventetid · Pause (rå fra chauffør-app) |
| Godkendt af formand | Styret af `afregning_type`: `time` → alle tre · `akkord`/tons → **kun Ventetid** |

**Forretningsregel (time vs. tons):** Chaufføren logger ALTID de samme timer (kørsel/ventetid/pause) uanset afregningstype. Ved **akkord/tons** betales per tons, så formanden godkender **kun ventetid** — kørsel + pause dækkes implicit af tons-raten. Ved **time** godkendes alle tre.
**Mock:** `apps/vognmand/src/mocks/afregning.ts` (NY) modellerer begge linjer + `afregning_type`. Aligner med `ChauffoerAfregning` (`koretimer`/`ventetid`/`pause`).
**Adskilt fra Trin 6:** Trin 6 (godkendte afregninger til reklamation/faktura) er en ANDEN side med andet formål. Trin 6b er dag-dokumentation per chauffør.
**Issue:** #14

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

### Afregning — Timeafregning-sektion (2026-06-05)
- Ny sektion under Materielafregning på Afregning-modus
- Box med tekst "Timeafregning for hold. Bemærk at knap åbner PLAN."
- Centreret gul knap "PLAN" → åbner PLAN-system (deep-link/ny fane i produktion)
- Placeholder-sektion — selve time-registreringen håndteres i PLAN, ikke i formand-app
- PLAN-knap åbner mock-modal med forenklet visning af PLAN's TIMEREGISTRERING-skærm (placeholder, ikke funktionel)

### Afregning — Udlægning per produkt (2026-06-05)
- Udlægning-sektionen splittes nu per produkt på Afregning-modus
- Produkt-tabs øverst (samme styling som samleordre-tabs på Ordredetaljer)
- Tabs vises kun hvis ordren har 2+ produkter (1 produkt → ingen tabs, ingen indre boks)
- I samleordre-mode: child-tabs ovenpå (Ordredetaljer) + produkt-tabs på Udlægning — nested
- FremdriftCards (tons-ankommet, forventet-udlagt, faktisk-udlagt) filtreres på valgt produkt
- Også gældende for puljelæs (samme-bil-flere-produkter): hver produkt har sin egen udlægnings-visning
- Datakilde: `perProduktUdlaegning`-mock i `AfregningContent` — TODO: Erstat med Supabase per-produkt udlægnings-data

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
**Status:** Bygget (prototype, 2026-06-05) i `UdfoerselContent` — expandable sektion "KS-rapportering" placeret umiddelbart efter Forundersøgelse-sektionen.
**App:** formand
**Komponent:** `UdfoerselContent` → "KS-rapportering" sektion med 3 tabs: A3 (ØVR. 3.a), A4 (ØVR. 4.a), MKS
**Note:** A3/A4 vises kun når mindst ét produkt har `entreprisekontrol === 2` eller `temperaturmaaling === 2`. MKS vises ved enhver værdi `1` eller `2`. Hele sektionen skjules hvis ingen krav.

### Udførsel — KS-rapportering (2026-06-05)
- Ny expandable sektion under Forundersøgelse på `UdfoerselContent`
- 3 KS-skemaer som tabs: A3 (ØVR. 3.a) · A4 (ØVR. 4.a) · MKS
- A3 og A4 har identisk struktur via helper `OvrigeOplysningerSkema` — lag-form med produkt + stationering + areal (l×b + tillæg) + read-only beregnede felter (areal i alt, gennemsnitsforbrug) + bemærkninger
- MKS har komplekst skema via helper `MksSkema`: vejr som dropdowns (vind/regn/vejoverflade), klæbning (intakt-radio + type-dropdown + mængde), udlægning-krav (samlinger/profil/jævnhed) + konstateret (rivninger/svedninger/driftsstop), færdiggørelse (rensning + ingen-krav-checkbox + aftalt-med)
- **Conditional visibility:** Union på tværs af alle produkter — strengeste vinder:
  - `entreprisekontrol/temperaturmaaling === 1` (og ingen `2`) → kun MKS-tab vises
  - `entreprisekontrol/temperaturmaaling === 2` på mindst ét produkt → alle 3 tabs vises
  - Begge felter `undefined` → hele sektionen skjules
- Visuel mockup uden state-persist — inputs bruger `defaultValue`/placeholder
- Default tab: `'mks'` (MKS er altid det første krav)
- Collapsed-look matcher Forundersøgelse-pattern: hvid box-wrapper (`bg-surface border border-hairline rounded-2xl shadow-sm`) + "Mangler vurdering"-status-pille i højre side
- Status-pille er pt. konstant "Mangler vurdering" (visuel mockup, ingen state-tracking endnu)

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

### Vejeseddel-tabel — telefon-kolonne (2026-06-04)
- Chauffør-telefonnummer vises som klikbart `tel:`-link umiddelbart til højre for chaufførnavn-kolonnen
- Datakilde: `Vejeseddel.chauffoerTelefon` (optional string, E.164 eller dansk lang-format `+45 XX XX XX XX`)
- Fallback: `—` (em-dash) hvis feltet er undefined
- TODO: Erstat med Supabase `chauffør_tlf`-felt når klar

### Vejeseddel-tabel — produkt-statusbar i header-række (2026-06-04, OPDATERET 2026-06-05)
- **Placering:** Kompakt pille i Vejesedler-sektionens header-række (højre for `<h2>Vejesedler</h2>`) — IKKE inde i VejesedlerTable
- **Synlighed:** Kun når præcis 1 produkt er aktivt på den valgte dato (`days.some(d => d.date === selectedDate && !d.cancelled)`)
- **Pulje-læs-guard:** 2+ produkter aktive samtidigt → pille skjules (datamodel kan ikke splitte tons mellem produkter endnu)
- 0 aktive → ingen pille
- **Format:** `Status · [Produktnavn] · {udlagt} t af {estimat} t · {%}` + horisontal progress-bar (inline, bg-good)
- **Datakilde:** `MockProduct.days[selectedDate].tonsPlanned` som estimat, `Vejeseddel.tons` (filtreret på `receptkode === recipeCode + status='udlagt'`) som udlagt
- `estimat` = `dagsplan.tonsPlanned` — fallback til `produkt.tonsTotal`
- Produktnavn: fra `INITIAL_RECEPTER[recipeCode].navn` — fallback til recipeCode
- TODO: Erstat med Supabase ordre-estimat pr. dag når klar

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

## Flow 9b: Ekstra tons på dagen — Formand → Fabrik (telefon) → PLAN → Apps (LÅST 2026-06-03)

**Beslutning (LÅST 2026-06-03):** Funktionen "Ekstra bestilling" i `OrdrePlanScreen` Asfaltbestilling-rækken **fjernes** fra Fase 1. Hvis formand har brug for ekstra tons på dagen — fx fordi kunden vil have ekstra meter, eller plan-fejl undervejs — ringer han direkte til fabrikken og bestiller mundtligt. PLAN-systemet opdateres med de nye forventede tons, og data-pull til apps sker automatisk.

**Hvorfor fjernet:**
- App-baseret ekstra-bestilling kompliccerede data-modellen (separate `ekstra_bestillinger`-objekter)
- Fabrik skal alligevel bekræfte mundtligt at kapacitet er ledig
- Telefonopkald er allerede del af workflow → minimal ekstra friktion
- PLAN er allerede source-of-truth for tons-figurer; det er renere at lade PLAN holde de officielle tal

**Flow:**

```
1. Formand opdager behov for ekstra tons på dagen
2. Formand ringer fabrik direkte → bekræfter mundtligt om kapacitet er ledig
   - Hvis fabrik kan IKKE levere: telefonopkaldet håndterer afvisningen.
     App'en ser intet — formand finder anden løsning udenfor app.
3. Fabrik opdaterer PLAN med nye tons-figurer for dagen
   (eller PLAN opdateres manuelt af formand/koordinator)
4. PLAN pusher opdaterede tons til formand-app
   - Felter ramt: ordre.produkter[].tons stiger (eller dag.tonsForventet)
   - Eksisterende produkt-boks viser ny værdi
5. Banner-markering i formand-app:
   "Tons opdateret af Fabrik" — vises som info-banner øverst i
   Asfaltbestilling-rækken indtil formand klikker "OK, set"
6. Vejeseddel-listen udvides automatisk
   - Flere tons → flere planlagte vejesedler genereret
   - "Forventet sidste læs"-pille flyttes til ny sidste bil per produkt
7. Vognmand ser opdaterede tons naturligt i sin liste
   - INGEN "Ændret af formand"-badge — fordi det IKKE er formand
     der ændrede; det er PLAN der pusher ny realitet
   - Vognmand opdaterer disponering hvis flere biler behoves
8. Fabrik ser opdateret produktionsplan med ny tons-total
   (samme PLAN-pull-mekanik som anden plan-data)
```

**UI-konsekvenser:**

- **Formand**: Fjernet UI: `EkstraBestillingBox`, "+ Ekstra"-knap, ekstra-bestilling-state, ekstra-bestilling-mock. Bevaret: Eksisterende produkt-bokse (`ProductBoxV2`) — det er her tons-stigningen vises.
- **Formand**: Ny info-banner i Asfaltbestilling-rækken når PLAN har opdateret tons — tekst "Tons opdateret af Fabrik [tidspunkt]" + lille "OK, set"-knap der dismisser banneret. Banner persisterer indtil dismissed.
- **Vognmand**: Ingen ny mekanik. Eksisterende tons-felt opdateres automatisk via samme data-pull-pipeline som al anden ordre-data. Vognmand ser bare nyt antal og handler.
- **Fabrik**: Samme — produktionsplan opdateres via PLAN-pull. Ingen nye notifikationer eller knapper.

**"Send til fabrik"-knappens udvidelse (LÅST 2026-06-03):**

Knappen i `OrdrePlanScreen` Asfaltbestilling-rækken udvides med fabriksnavnet nederst — bottom-aligned, lille font (`text-xxs`). Tekst-hierarki bliver:
```
[Truck-ikon]
Send til fabrik          ← font-poppins text-sm
N bestillinger klar      ← font-inter text-xxs (eksisterende status)
[mt-auto spacer]
PROD A EAST KØGE PH      ← font-inter text-xxs (ny — bottom-aligned)
```

Fabriksnavnet hentes fra **ordrens tildelte standard-fabrik**. I prototypen hardcodes til "PROD A EAST KØGE PH" (samme værdi som mock-vejesedlerne bruger), eller læses fra `ordre.fabrik` hvis det findes på top-niveau.

**Datamodel-konsekvens (kun deletion):**

- `EkstraBestilling`-interface fjernes
- `ekstra_bestillinger`-tabel fjernes fra Supabase-skemaet (når relevant)
- `ordre.produkter[].tons` bliver eneste tons-felt (ingen separat ekstra-tons-felt)
- `tons_opdateret_af_fabrik?: { tidspunkt: string, dismissed: boolean }` tilføjes per-dag for banner-tracking

**Samles på en bil — afgrænsning ift. denne ændring:**

"Samles på en bil"-checkbox forbliver **kun på PRODUKTER** (`ProductBoxV2`). Den fjernes fra ekstra-bestilling-konstruktet (som ikke længere findes). Brugs-mønstret er uændret: typisk små ordrer hvor flere produkter hentes på samme bil — trigges multi-produkt-loading-flow i chauffør-appen (9-trins fabrik-script, se `[[project_samles_paa_en_bil_marker]]` og Flow 12).

**🟡 Implementerings-status:** Spec LÅST 2026-06-03. Kode-ændring dispatches efter denne sektion.

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

---

## Fase 2 udvidelser

Funktionalitet der er IDENTIFICERET og delvist DESIGNET, men ikke skal i Fase 1. Håndteres udenfor app eller via eksisterende systemer i første omgang. Reaktiveres i Fase 2 efter feedback fra brugere på Fase 1.

### F2-1: Returlæs-flow (forskudt fra 2026-06-03)

**Original status:** LÅST 2026-05-27 (Flow 4 Trin 4a) — fuld UI-spec + datamodel klar.

**Hvorfor flyttet til Fase 2:**
- Returlæs er en relativ sjælden hændelse (rest-asfalt eller materiel der skal retur)
- Manuel registrering i Fase 1 sker udenfor app (vognmand-time-rapport eller telefonisk)
- Fase 1-fokus er på de daglige hyppige flows; returlæs er et "afregningstillæg" der kan tilføjes senere uden brud

**Fase 2-scope:**
- Genaktivér UI i `BilAfregningExpander` / `MaterielAfregningExpander` (formand-side)
- Datafelt `time_registreringer.returlaes: { timer, kommentar, registreret_af_formand, registreret_tidspunkt }`
- "+ Returlæs"-knap, gen-formand-only registrering, total-linje inkluderer returlæs-timer
- Se gennemstreget spec i Flow 4 Trin 4a for fuld detalje

**Bevarede åbne spørgsmål til Fase 2:**
- Skal chaufføren kunne FORESLÅ returlæs-timer (formand godkender)? — overvejes ved Fase 2-genstart
- Skal returlæs-timer have egen sats (anden end normale køretimer)?
- Hvordan håndteres returlæs der spænder over midnat?

### F2-2: (placeholder for fremtidige udvidelser)

Tilføj nye Fase 2-items her efterhånden som de identificeres og udskydes.

---

## UI-konventioner

### Dato-pille-konvention (2026-06-05)

Anvendes på **Asfaltbestilling-piller** og **"Udføres i perioden"-piller** — visuelt ens på tværs af begge sektioner.

- 2026-06-05: "Udføres i perioden" flyttet UD af Ordredetaljer-sektionen til at være FØRSTE sektion på Udførsel-mode (ovenover Ordredetaljer). Giver hurtigere adgang til dag-navigation.

| Tilstand | Styling |
|---|---|
| Aktuel dag (selected) | `bg-deep-teal text-white shadow-sm` |
| Passeret dag | `bg-white border border-hairline text-text-muted line-through hover:border-dark-teal` |
| Fremtidig dag | `bg-white border border-hairline text-text-muted hover:border-dark-teal hover:text-deep-teal` |
| Alle dage afsendt (kun Asfaltbestilling) | `bg-good text-white shadow-sm` + `CheckCircle2`-ikon |

`isPast` beregnes som `ds < dateToString(TODAY)`. Aria-label for passerede datoer: `"[dato] (overstået)"`. `isAllSent` har prioritet over `isPast` i Asfaltbestilling.

### OrderStatus-pille-konvention (2026-06-05)
- "Afventer planlægning" → gul (`bg-yellow`/`bg-warn-bg`)
- "Planlagt" → lysegrøn (`bg-good-bg`/`bg-good/20` + `text-good`)
- "I gang" → mørkegrøn (`bg-good` + `text-white`)
- Konsistent på tværs af Dagsoversigt + Gantt + alle fremtidige status-piller for ordrer
- Kanonisk: `.claude/docs/STATUS_VOKABULAR.md` § `OrderStatus`

### Enheds-konvention — fulde ord (LÅST 2026-06-05)

På tværs af ALLE Colas-apps skal UI bruge fulde enhedsnavne, IKKE forkortelser.

| Korrekt | Forkert |
|---|---|
| `25 Tons` | `25 t`, `25t`, `25 ton` |
| `147 Tons af 250 Tons` | `147 t af 250 t` |
| `2,5 Timer` | `2,5 h`, `2,5 t` |
| `15 Minutter` | `15 min`, `15 m` |

**Undtagelser:**
- Klokkeslæt `HH:MM` bevares
- CSS-enheder (`px`, `rem`, `%`) er ikke berørt
- Tekniske felter (fx min-temperatur) vurderes case-by-case

**Konsekvens:**
- Storybook-labels skal følge reglen
- JSDoc-eksempler skal følge reglen
- Reviewer flagger forkortelser som issue selv i prototype-kode

Cleanup af eksisterende "t"/"h"/"min" forkortelser er sporet via separat GitHub-issue.
