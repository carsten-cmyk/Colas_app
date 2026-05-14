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
**Handling:** Formand udfylder km og kommentar per dag
**Skriver til:** `orders.asfalt_koersel[].planlagt = true`, `orders.asfalt_koersel[].kommentar`

### Trin 2 — Formand ser afventende status
**App:** formand
**Komponent:** `VognmandBekraeftelseBadge`
**Viser:** Gult "Afventer vognmand" badge når kørsel er planlagt men ikke bekræftet
**Læser:** `orders.asfalt_koersel[].confirmed_vehicles` (tom = afventer)

### Trin 3 — Vognmand ser bestilling
**App:** vognmand
**Komponent:** `OrdreKort` (liste-view), `DisponeringsView` (gantt/kalender)
**Viser:** Ordre med asfalt-kørsel linjer, åben/disponeret status
**Læser:** `orders` WHERE `asfalt_koersel[].planlagt = true`

### Trin 4 — Vognmand disponerer bil
**App:** vognmand
**Komponent:** `DisponeringsView` — drag-and-drop bil hen over kørsel-linje
**Skriver til:** `orders.asfalt_koersel[].confirmed_vehicles[]` med `{ reg_nr, chauffoer_navn, tlf, bil_type }`

### Trin 5 — Vognmand bekræfter
**App:** vognmand
**Komponent:** `GodkendFlow` — bekræftelsesside
**Skriver til:** `orders.asfalt_koersel[].bekraeftet_af_vognmand = true`

### Trin 6 — Formand ser bekræftelse
**App:** formand
**Komponent:** `VognmandBekraeftelseBadge`
**Viser:** Grønt "Bekræftet af vognmand" badge
**Læser:** `orders.asfalt_koersel[].bekraeftet_af_vognmand`

### Trin 7 — Formand ser bildetaljer i Udførelse
**App:** formand
**Komponent:** `BekraeftetBilKort` (Udførelse → Forundersøgelse sektion)
**Viser:** reg.nr, chauffør, tlf, biltype
**Læser:** `orders.asfalt_koersel[].confirmed_vehicles[]`

### Trin 8 — Chauffør modtager ordre
**App:** chauffeur (React Native)
**Komponent:** `TaskCard`, `TaskDetailScreen`
**Viser:** Ordredetaljer, lokation, kontakt
**Læser:** `assigned_tasks` WHERE `driver_phone = auth.user.phone` OR `truck_plate = chauffeur.plate`
**Note:** Chauffør identificeres via tlf-nummer og nummerplade — ikke login
**TBD:** Distributions-mekanisme — push-notifikation, polling, eller event på reg.nr? Skal afklares før prod.

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

### Trin 5 — Udvejning + afgang fra fabrik
**App:** chauffeur
**Komponent:** `AnkommetFabrikScreen` (sub-screen: `udvejet`)
**Handling:** Chauffør udvejes med last på vægt; trykker "Udvejet og på vej til udførselssted"
**Skriver til:** `task_timestamps.afgang_fabrik = now()`, `task_logs.last_tons = tons` (fra vægt-system)

### Trin 6 — ETA beregnes til formand + udførselssted
**App:** beregnes server-side, vises i formand + fabrik (kommende)
**Komponent:**
  - `formand`: ETA-badge på ordre — "Asfalt forventet kl. 14:32"
  - `fabrik` (kommende): Liste over kommende lastbiler med ETA
**Beregning:**
  - `eta_udfoerselssted = afgang_fabrik + køretid(fabrik → udførselssted)`
  - `eta_fabrik = afgang_udfoerselssted + køretid(udførselssted → fabrik)` (omvendt retning, til fabrik-view)
**Note:** Køretid hentes fra GPS-historik eller maps-API (TBD)

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

### Trin 2 — Status afgøres af GPS + afhentet-flag
**Datakilde:** chauffør-app (GPS) + vognmandsmodul (disponering)
**Forretningsregel:**
- `status='ankommet'` ⇔ vejeseddel modtaget i Colas (har `vejeseddelNr` + `tons`)
- `status='undervejs'` ⇔ bil har forladt fabrik (`afgang_fabrik` sat) men `vejeseddelNr=null`
- `status='paa-vej-til-fabrik'` ⇔ bil er disponeret men ikke afhentet endnu (`afgang_fabrik=null` OG `ankomst_fabrik=null`)
**Note:** `status` er eksplicit på `Vejeseddel`-typen — hooken sætter det baseret på data, men UI-komponenter læser KUN `status`-feltet (single source of truth).

### Trin 3 — Sortering i tabel
**Komponent:** `VejesedlerTable`
**Sortering:**
1. Ankomne — DESC på `modtagetTidspunkt` (nyeste øverst)
2. Undervejs — ASC på `etaMinutter` (kortest ETA øverst)
3. På vej til fabrik — original rækkefølge

### Trin 4 — Per-række delegation
**Komponent:** `VejeseddelRow` (delegerer baseret på `status`)
- `ankommet` → `<TemperaturBadge>` + `<UdlaeggerDropdown>` (aktiv)
- `undervejs` → `<EtaBadge variant="eta">` + `<UdlaeggerDropdown disabled>`
- `paa-vej-til-fabrik` → `<EtaBadge variant="paa-vej-til-fabrik">` + `<UdlaeggerDropdown disabled>`

### Trin 5 — ETA beregnes løbende
**App:** chauffør-app → formand (formidlet via PLAN/server)
**Beregning (v1):** `etaMinutter = afstand_km × 1 min/km`
**Datakilde:** GPS-position fra chauffør-app til ordrens udførselssted
**Note:** Simpel formel i v1; kan udvides med maps-API (køretid baseret på trafik) senere.

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
- **Dagsoverblik-registrering er en enkelt række per ordre/dato** — `dagsoverblik_registreringer` har én række per `(ordrenummer, dato)`. Hver "Gem" overskriver tidligere værdier; ingen historik gemmes i v1 (kan tilføjes ved Supabase-koblingen via en separat `dagsoverblik_historik`-tabel hvis nødvendigt)
