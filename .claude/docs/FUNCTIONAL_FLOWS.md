# Functional Flows — Colas Transport Apps

Dette dokument beskriver cross-app flows på komponent-niveau.
Opdateres af architect-agenten ved hvert /develop-screen kald.
Opdateres manuelt når forretningsregler beskrives der ikke fremgår af kode.

---

## 🟡 Mellemnote: Backend- og integrations-arkitektur (foreløbig, 2026-06-12)

> **Interim** — afventer kickoff **mandag 15.6.2026** hvor detaljeret dataindhold defineres. Kilde: Abraham (DB-ansvarlig, Colas France). Kanonisk uddybning: memory `project_plan_integration_architecture` + `.claude/docs/MEETING_PLAN_ORACLE_FR.md`.

> **📊 Ægte data-eksport modtaget (2026-06-16):** 14 Excel-filer fra PLAN/MAUS i `Docs/Datafiler/` (gitignored — kundedata). **Kilde-feltnavnene** er dokumenteret i `Docs/Datafiler/INVENTORY.md` (committet) — brug det som facit når app-felter mappes mod kilden. `plan_app_2_dage` (51 kol.) er kerneobjektet for OrdrePlan. Mapping kilde-felt → app-felt bygges i `Docs/Datafiler/MAPPING.md` (TODO).

**Systemlandskab (Colas France, Oracle):**
- **APPS** — Oracle DB-instans der hoster skemaer: **PLAN** (system of record: ordrer, hold, materiel, recepter, forundersøgelser) + **DataHub** (integrations-spine; materialiserer jævnligt data lokalt i APPS så andre systemer kan læse via db-connectivity uden eget REST; bygger bro til Zephyr via REST). Vores nye **app-skema** lægges i APPS med GRANT til PLAN/DataHub-objekter, tilgået read-only (views).
- **Zephyr** — centralt system (REST) der modtager transaktioner fra DataHub/PLAN/MAUS.
- **MAUS** — **veje-/fabrikssystemet** (SQL-server hos leverandør, db-link over gateway til DataHub). Danner **vejninger** → DataHub → Zephyr. ⇒ **MAUS er kilden til vejedata i France-arkitekturen** (chauffør-webappens vejnings-flow, Flow 3, afhænger af dette lag).

**Vores lag:** egen database (operationelt lag) + backend. Læser PLAN read-only; opsamler feltdata (timer, vejning, billeder, bil-disponering); sender behandlede resultater retur til PLAN via **én service-konto**. Offline write-queue (kø + afvikl senere + log) bekræftet af Abraham.

**To backend-modeller (åbent — afgøres ~15.6):**
1. **Egen SQL-server** bygget af app-udvikler, db-link over gateway, udstiller web-interface ("MAUS-modellen") → vores kontrol + hurtig iteration *(foretrukket)*.
2. **PLAN_APP i APPS** bygget af Cegal, ORDS/REST, delt i INT_PLAN_APP + EXT_PLAN_APP af sikkerhedshensyn.

Begge kræver: France åbner firewall App→backend; bruger-auth via AD/Azure (France vil måske selv eje auth = "sikrest"). NB: chauffør + vognmand er **ikke** brugere i PLAN/AD → deres auth er et separat spor.

**⚠️ Afstemnings-punkt (vejedata-kilde):** France = **MAUS/DataHub**, men DK-flowet (Flow 3, Thomas) refererer **Danvægt** ved fabrikkens vægt. Forholdet MAUS ↔ Danvægt skal afklares (er Danvægt den fysiske vægt/terminal og MAUS det system der registrerer/fordeler — eller parallelle?). Vores `DATA_FIELDS`/Excel siger pt. "Danvægt".

**🛑 Database er IKKE Supabase (note 2026-06-25):** Vores operationelle lag bliver **sandsynligvis Oracle** (egen app-skema i APPS-instansen i France, samme miljø som PLAN — jf. systemlandskabet ovenfor og memory `project_hosting_database_valg`). Vi har talt om at det ender på Oracle; det endelige Postgres-vs-Oracle-valg afgøres sammen med backend-modellen (~15.6 / Jesper DK-IT). **Konsekvens for dette dokument:** alle spredte `// TODO: Erstat med Supabase`-noter og "Supabase realtime"-omtaler nedenfor er **forældet terminologi** fra prototype-fasen — læs dem som "erstat mock med den rigtige database/backend (Oracle/APPS)". Realtime-mekanismen (Supabase realtime subscriptions) er heller ikke låst og må gentænkes mod Oracle/backend (polling, DataHub-materialisering eller eget event-lag). Koden ryddes løbende; denne note er facit indtil da.

---

## 🧭 Navigations-note: TopBar-nav erstatter BottomTabBar på OrdrePlanScreen (LÅST 2026-06-29)

**Beslutning (Carsten, 2026-06-29):** På formandens `OrdrePlanScreen` flyttes top-navigationen fra den nederste `BottomTabBar` op i `TopBar` via en ny `TopBarNav`-strip. BottomTabBar fjernes fra denne skærm.

- **Bevarede nav-mål** (uændrede ruter): Kalenderoversigt → `/prototyper/gantt`, Dagens opgaver → `/prototyper/dagsoversigt`.
- **Midlertidigt fjernet:** **Beskeder**-tab (inkl. message-badge, tidligere hardcoded `messageCount={2}`), **Kontakt** og **Dokumentation**. Disse havde i BottomTabBar kun lokal `setActiveTab`-state uden rute-mål. De **genindføres når en delt app-shell etableres på tværs af apps** (formand/vognmand/chauffeur-web deler i dag TopBar-mønstret men ikke en fælles shell-komponent).
- **Fluid layout (Mulighed B):** OrdrePlan-shellens grid konverteres til fluid via `clamp()`/`minmax()`/`fr` (`gridTemplateColumns: 'clamp(220px, 22vw, 320px) minmax(0, 1fr)'`, aside `height: calc(100vh - 52px)`). **Ingen plugin, ingen `tailwind.config`-edit** — inline-værdierne er genuint viewport-beregnede.
- **⏸ Udskudt cross-app-beslutning:** Et **container-query-plugin** (`@tailwindcss/container-queries`) blev overvejet til responsiv shell men er **parkeret** som en bredere cross-app-beslutning — vurderes når delt shell + responsive-strategi tages op samlet for alle web-apps. Indtil da: Mulighed B (clamp/minmax) er kanonisk for formand-shell.
- **🌍 Cross-app-kandidat:** `TopBar` + `TopBarNav` bør flyttes til `shared/components/` når delt shell etableres (jf. COMPONENT_REGISTRY 🌍-mærkning). Indtil da bor de i `apps/formand/src/components/layout/`.

SPEC-filer: `Docs/Formand/SPEC_TopBarNav.md`, `Docs/Formand/SPEC_TopBar_NavSlot.md`, `Docs/Formand/SPEC_OrdrePlan_ShellRefactor.md`.

---

## Flow 1: Bilbestilling — Formand → Vognmand → Chauffør

**Trigger:** Formand planlægger asfalt-kørsel på en dag

### Trin 1 — Formand planlægger
**App:** formand
**Komponent:** `OrdrePlanScreen` → asfalt-kørsel sektion
**Handling:** Formand udfylder km, **kommentar til chauffør**, **forventet tidspunkt for første læs på udlægning** OG **interval mellem læs på pladsen** (minutter) per dag. Første-læs + interval er kritisk for både fabrik-notifikation (se Trin 5b) og vognmandens disponering (se Trin 3).

**"Udføres i perioden" = kun PLAN-planlagte dage (LÅST 2026-06-23):** Datovælgeren "Udføres i perioden" øverst på ordren viser **kun de dage der er planlagt på ordren i PLAN** — ikke hele ordrens teoretiske udførelsesvindue. En ordre kan sagtens udføres over **flere omgange/perioder** (jf. multi-produkt split-perioder — ét produkt kan fx udlægges i marts, et andet i maj), men dagene dukker først op i formands-appen **når de er planlagt i PLAN**. Planlægges nye dage senere, udvides datovælgeren tilsvarende. **Konsekvens for app'en:** `planDays`-listen vokser over tid og er **ikke nødvendigvis sammenhængende** — huller mellem perioder er normalt og skal vises som adskilte perioder, ikke som ét sammenhængende interval. Alle planlægnings-/udførsels-/afregnings-sektioner spejler den valgte dag i denne vælger.

**Pinnede opstarts-læs (LÅST 2026-06-10 — erstatter Første-læs-reglen 2026-05-22):** Formanden sætter eksplicit ankomsttid på pladsen for de **første 1-3 læs pr. produkt** (typisk kun produkt 1). Antallet er formandens valg (1-3, som angivet i Asfalt kørsel-rækken). Disse "pinnede" opstarts-læs sikrer at materialet kommer i en jævn strøm fra start. **Læs-nummeret er KUN opstarts-styring — ikke en rolle bilen bærer hele dagen.** Efter de pinnede læs kører bilerne i **loop** (frem og tilbage mellem fabrik og plads), indtil produktets tons er hentet. Bruges læs-nummeret som intern styring bagved er det fint; det skal bare ikke fremstå som en blivende bil-rolle.

**Interval-regel (LÅST 2026-06-10 — opdateret fra 2026-05-26):** Intervallet (i minutter, typisk 12-20) er **kadencen for loop'et og starter efter det SIDSTE pinnede læs** — ikke mellem de pinnede. De pinnede tider kan formanden sætte frit. Eksempel: pinned bil 1 på plads 07:00, pinned bil 2 på plads 08:00 (60 min mellem, formandens valg), interval 20 min → næste bil 08:20, derefter 08:40 osv. i loop. **Per produkt:** Produkt 1 har de pinnede opstarts-læs. Efterfølgende produkter kører blot med i loop'et — **sekventielt direkte** efter forrige produkts sidste-læs. *(Den tidligere mulighed for at give produkt 2+ egen starttid + interval — "Køres direkte i forlængelse af"-toggle — er FJERNET 2026-06-25.)*

**Mødetid på fabrik (LÅST 2026-06-10):** **Hver bil** får ét opstarts-ankomsttidspunkt på pladsen under indfasningen → og dermed én mødetid på fabrik: `moedetid_fabrik = ankomst_plads − køretid`, hvor køretid = Google Maps + 10%. De pinnede biler bruger formandens eksplicitte plads-tider; de øvrige biler får deres opstarts-ankomst beregnet af intervallet fra sidste pinnede læs (08:20, 08:40 …) og indgår i flowet, **indtil ALLE biler er i rotation.** Når hele flåden er fyldt ind, kører de i loop uden flere planlagte tider. Eksempel: pinned ankomst plads 07:15, køretid 36 min → mødetid fabrik 06:39.

**Bilbestilling er en ØNSKELISTE til vognmanden (LÅST 2026-06-13):** Alt formanden bestiller — antal, biltyper OG tidspunkter — er **ønsker**, ikke en bindende ordre. Vognmanden kan ikke nødvendigvis opfylde dem 1:1, og den endelige aftale forhandles **over telefonen** mellem formand og vognmand. Platformen skal derfor regne med at modtage **andre data retur** (bekræftet ≠ ønske) — andet antal, andre typer, andre tidspunkter. Konsekvenser:
- **Hver eneste bil i ønskelisten sendes med et tidspunkt** — også bil 4, 5, 6 … De pinnede biler bærer formandens eksplicitte plads-tider; de øvrige får en plads-tid fremskrevet af intervallet (jf. "Mødetid på fabrik" ovenfor). Vognmanden modtager altså en **komplet** ønskeliste hvor *hver* bil har en plads-tid — ikke kun de 3 første.
- **Unikt bil-ordrenummer pr. bil pr. dag (LÅST 2026-06-13):** Hvert bil-ønske sendes med sit eget unikke nummer i formatet `<ordrenr>-DDMMYY-NN` (fx `1212343-170326-01`). Løbenummeret **NN** nulstilles pr. dag og tæller på tværs af alle biltyper i bestillingens rækkefølge. Begrundelse: **vognmændene behandler hver bil som en separat ordre** og opretter nye ordrer pr. dag — så ét fælles ordrenummer pr. dag er ikke nok; hver bil skal kunne identificeres entydigt. Nummeret genereres når formanden sender bestillingen (backend-side i produktion) og følger bilen videre til `confirmed_vehicles[]`, fabrik (Trin 5b) og chauffør (Trin 8). I prototypen: `buildBilOrdreNumre()` i `OrdrePlanScreen.tsx`, vist som pille pr. bil-række i "Planlæg kørsel"-panelet.
- **Bekræftet data (`confirmed_vehicles[]`) er sandheden downstream** og kan afvige fra ønsket. Den vises på Udførsel-siden (se Trin 0 + Trin 7) og bruges af fabrik (Trin 5b) og chauffør (Trin 8).
- Samme princip gælder **materiel-transport** (Flow 2): formandens materiel-bestilling er et ønske; vognmandens bekræftede materiel-disponering kan afvige og vises tilsvarende.

**Kommentar til chauffør (LÅST 2026-05-22):** Feltet i bunden af bilbestillingen er omdøbt fra "Kommentar til formanden" → **"Kommentar til chauffør"**. Indholdet skal sendes sammen med ordren TIL CHAUFFØREN (synlig i chauffeur-appen — se Trin 8 / Flow 3). Formand bruger feltet til at give kørselsspecifikke instruktioner: "Brug bagvejen", "Lav støj-restriktion efter 22", "Aflæsningssted er flyttet 50m mod vest" osv.

**Forventet tons er redigerbart FØR afsendelse (LÅST 2026-06-19):** Formanden kan justere de **forventede tons op og ned** direkte i bilbestillingen **inden ordren sendes til fabrik** (UI understøtter det). Det er formandens endelige tal der sendes — det driver bilbehovs-beregningen (Anbefalet antal biler / kapacitet-dækket) og fabrik-notifikationen (Trin 5b). **EFTER afsendelse** er tons-ændringer låst til **telefon til fabrik** (jf. DATA_FIELDS § "morgenTons-update (efter send)") — den frie redigering gælder altså kun i planlægnings-/før-send-fasen. Formandens manuelle justering er adskilt fra PLAN's ekstra-bestilling (`ekstraTons`, Flow 9b), som forbliver read-only push.

**Skriver til:** `orders.asfalt_koersel[].planlagt = true`, `orders.asfalt_koersel[].kommentar_til_chauffoer`, `orders.asfalt_koersel[].foerste_laes_udlaegning_tid`, `orders.asfalt_koersel[].interval_minutter_mellem_laes`, `orders.asfalt_koersel[].biler[]` (ordnet array — index 0 = første læs).

**`biler[]`-ønske-objekt (LÅST 2026-06-13):** Hver bil i ønskelisten er ét objekt — `antal`-stepperen i UI'en udfoldes til individuelle biler ved send:
```
{
  bil_ordre_nr: string,          // <ordrenr>-DDMMYY-NN — unikt pr. bil pr. dag, løbenr NN nulstilles pr. dag
  bil_type: string,              // fx "6 Aks" | "7 Aks" | "Egen bil"
  ankomst_plads_tid: string,     // HH:MM — pinned (eksplicit) eller interval-fremskrevet (se Mødetid på fabrik)
  moedetid_fabrik: string,       // HH:MM — ankomst_plads − køretid
  egen_bil: boolean,             // true → springer vognmand over (jf. Variant: Egen bil-flow)
}
```
Vognmanden modtager dette array (én ønske-bil pr. objekt, hver med sit `bil_ordre_nr`) og svarer med `confirmed_vehicles[]` (Trin 4), der bærer samme `bil_ordre_nr` retur.

**Bilbehov-dashboard (LÅST 2026-06-10, dynamisk gjort 2026-06-25):** I "Planlæg kørsel"-panelet vises en **Bilbehov**-dashboard (beregningsoverblik der hjælper formanden disponere antal biler). **8 bokse på én række** (desktop), hvoraf **3 er editerbare** (lys gul baggrund `bg-yellow/15` + grå outline) og resten er beregnede output. Rækkefølge:

| # | Tile | Type | Indhold / Beregning |
|---|---|---|---|
| 1 | **Forventet tons** | output | `getEffectiveTons(d) = d.tonsPlanned + (d.ekstraTons?.tons ?? 0)` — originalt planlagt + PLAN-pushet ekstra-bestilling (Flow 9b). |
| 2 | **Starttidspunkt plads** | **editerbar** (prefill **06:00**) | Tidspunkt første bil er på pladsen. To-vejs bundet til Bil 1's starttid i "Starttider og intervaller". Driver runder pr. bil + Forventet sidste bil. |
| 3 | **Forventet aflæsning** | **editerbar** (prefill **15 Minutter**) | Aflæsningstid pr. bil. Indgår i rundtiden. `KørselDayParams.aflaesningstidMin`. |
| 4 | **Interval** | **editerbar** (prefill **20 Minutter**) | Kadence i loop'et (`intervalMinutes`). **Flyttet hertil fra "Starttider og intervaller"-sektionen 2026-06-25.** |
| 5 | **Anbefalet** | output | `ceil(forventet tons / (gns. tons pr. bil × runder pr. bil))`. |
| 6 | **Runder** | output | Runder pr. bil + rundtid (undertekst). Rundtid = `2 × køretid + 15 min læsning + Forventet aflæsning` — køretid = Google Maps +10%. |
| 7 | **Afstand til fabrik** | output | **Google Maps-køreafstand + 10%**. Køretid afledt af samme +10%-værdi. |
| 8 | **Forventet sidste bil** | output | Tidspunkt for forventet sidste bil/læs pr. produkt (P1, P2 …), samme prognose som Vejesedler. Beregnes nu **dynamisk** fra de 3 editerbare felter. Én række pr. produkt. |

**De 3 editerbare felter gør motoren dynamisk (LÅST 2026-06-25):** De erstatter de tidligere statiske/hardcodede værdier (start 07:00, aflæsning 15, interval). Når formanden retter dem, regnes **Anbefalet** og **Forventet sidste bil** live. Felterne er **præudfyldt** med 06:00 / 15 / 20, så der altid er et resultat — formanden retter kun ved reelle ændringer.

**+10%-bufferen er kanonisk køretid** og slår igennem i ALLE afledte tal: Afstand til fabrik, Rundtid og Anbefalet antal biler (som afhænger af runder pr. bil).

**Forventet sidste bil → markering til vognmand (LÅST 2026-06-10):** Den forventede sidste bil beregnes ikke kun til formandens Bilbehov og Vejesedler — den **markeres også til vognmanden** (cross-app), så vognmanden ved hvornår dagens kørsel forventes færdig. *(Modtager-side i vognmand-app bygges i separat sektion-pakke; kontrakt forfines der. Relaterer til sidste-læs-frigivelse.)*

**Bilbehov — delvist editerbart (opdateret 2026-06-25):** De **3 gule felter** (Starttidspunkt plads · Forventet aflæsning · Interval) redigeres direkte af formanden. De **5 hvide bokse** er ren beregning fra tonnage, fabrik (+10% køretid), rundtid og de 3 input — opdateres automatisk når formanden ændrer biler/tons/de 3 felter.

**Bilbehov — beregnings-præciseringer (2026-06-15):**

- **Multi-produkt rotation (samme biler):** Samme biler kører alle dagens produkter **sekventielt**. Produkt 2+ kører **direkte i forlængelse** af forrige produkt (lige efter forrige produkts sidste bil). "Forventet sidste bil" pr. produkt beregnes derfor sekventielt via én cursor. *(Per-produkt egen starttid/interval er fjernet 2026-06-25 — der er ikke længere et eget opstartstidspunkt pr. produkt.)*
- **avgTons fra de kørende biler:** Når biler er valgt, beregnes gns. tons/bil fra de **faktisk valgte biler** (kapaciteten er kendt). Ingen biler valgt → vis et **synligt fallback "antaget gns. 30 tons"** (ikke en skjult magisk værdi).
- **Forventet sidste bil — præudfyldt (opdateret 2026-06-25):** Tidligere tom uden input; nu er Starttidspunkt plads + Interval **præudfyldt** (06:00 / 20), så P1's sidste bil altid beregnes. P2+ beregnes sekventielt direkte efter forrige produkt (ingen egen starttid længere).
- **Kapacitet-dækket-indikator (grøn/rød) — genindført:** En pille viser **grøn "Kapacitet dækket"** når de valgte bilers kapacitet (kapacitet/runde × runder) dækker forventet tons, ellers **rød "[X] Tons mangler"**. Det er formandens live-feedback på "har jeg valgt nok biler". *(Fandtes i v1 `KoerselPanel`, forsvandt i 5-boks-dashboardet — genindføres.)* **Anbefalet antal biler er et stabilt mål** — det er IKKE Anbefalet der skifter farve, det er dækningen.

### Trin 2 — Formand ser afventende status (badge-lifecycle, LÅST 2026-06-15)
**App:** formand
**Komponent:** `VognmandBekraeftelseBadge` (pille pr. dag på Asfalt kørsel)
**Forretningsregel (3-state lifecycle, LÅST 2026-06-19):** Pillen har TRE tilstande, ikke to — den eksplicitte send-gate gør forskel på "planlagt" og "sendt":
1. **"Planlagt"** (neutral/grå) — formanden har planlagt dagens kørsel (`planlagt = true`), men har endnu IKKE sendt til vognmand.
2. **"Sendt til vognmand"** (gul) — formanden har trykket den eksplicitte **"Send til vognmand"-knap** (`sendt_til_vognmand = true`). Forbliver gul indtil data kommer RETUR. (label omdøbt 2026-06-23: tidl. "Afventer vognmand")
3. **"Bekræftet vognmand"** (grøn) — vognmandens retur-data er ankommet.

Samme 3-state gælder **materiellevering** (pr. enhed) — se Flow 2 Trin 5.

**Eksplicit afsendelses-gate — uafhængig "Send til vognmand"-knap PR. SEKTION (LÅST 2026-06-19):** Både **Asfaltkørsel** og **Materiellevering** har HVER sin egen "Send til vognmand"-knap i bunden af sin sektion. De sendes **uafhængigt** — asfaltkørsel-biler og materiellevering kan være klar på forskellige tidspunkter, og hver knap har sin egen per-dag send-state. Tilstand pr. sektion: gul **"Send til vognmand"** → grøn **"Sendt til vognmand"** (hele knappen grøn, intet ikon) + **"Ret"-link** der genåbner til redigering. Knapperne afløser den tidligere implicitte per-række "Gem/Send"-trigger: intet sendes før knappen trykkes, så formanden kan rette frit indtil da. Hver sektions 3-state-piller (Planlagt → Sendt → Bekræftet) drives af DEN sektions egen send-knap. **"Ret" er KUN muligt i "Sendt til vognmand"-tilstanden (LÅST 2026-06-19):** Når bestillingen er **bekræftet af vognmand**, deaktiveres/skjules "Ret" — formanden kan ikke længere redigere en bekræftet bestilling i app'en; ændringer aftales i stedet telefonisk med vognmand (jf. ønskeliste-reglen). For asfaltkørsel er "låst" pr. dag (alle dagens rækker bekræftet), for materiel pr. enhed. **Send-tilstanden er PR. DAG, men ÉN afledt knap (LÅST 2026-06-19):** Send-state gemmes pr. dag (`day.date` i `sendtTilVognmandDates`), men der er ÉN section-level "Send til vognmand"-knap hvis tilstand er **afledt**: knappen er gul **"Send til vognmand"** hvis der findes mindst én **planlagt-men-usendt** dag; ellers grøn **"Sendt til vognmand"**. Formanden kan planlægge én eller flere dage ad gangen og sende dem samlet — et klik markerer ALLE usendte planlagte dage som sendt. Allerede-sendte dage **sendes ikke igen**. Planlægges flere dage senere, bliver knappen gul igen (de nye usendte dage). De enkelte dag-rækkers piller (Planlagt → Sendt til vognmand → Bekræftet vognmand) viser fortsat individuel status pr. `day.date`. **Materiellevering bruger samme afledte knap, men keyet pr. ENHED (`resource-id`)** i stedet for dag (materiel er en flad enheds-liste): gul hvis der findes mindst én planlagt-men-usendt materiel-enhed → ét klik sender alle usendte enheder samlet → grøn når alle planlagte enheder er sendt; allerede-sendte enheder sendes ikke igen. Piller pr. enhed (Planlagt/Sendt til vognmand/Bekræftet vognmand) i både normal- og samleordre-mode. Samme gul→grøn-mønster bruges på "Send til fabrik"- og afregnings-knapperne (konsistens). Egen bil → fortsat auto-bekræftet ved send (se Variant: Egen bil-flow).
**Bekræftet-flip:** Når vognmandens retur-data ankommer (`confirmed_vehicles[]` populeres → `bekraeftet_af_vognmand = true`), skifter pillen til grønt **"Bekræftet af vognmand"** (Trin 6) — **samtidig** med at **Bilbestilling-tabellen under Udførsel** udfyldes med de bekræftede biler (Trin 7). Pille og Udførsel-tabel hænger sammen: samme retur-data driver begge på én gang.
**Tilstande:**
- `planlagt = true` + `sendt_til_vognmand = false` → ⚪ "Planlagt" (neutral/grå — planlagt, ikke sendt endnu)
- `sendt_til_vognmand = true` + `bekraeftet_af_vognmand = false` → 🟡 "Sendt til vognmand" (label omdøbt 2026-06-23: tidl. "Afventer vognmand")
- `bekraeftet_af_vognmand = true` → 🟢 "Bekræftet af vognmand" + Udførsel-Bilbestilling-tabel udfyldt
- Rettelse af en allerede-sendt dag (per-dag "Ret" → "Gem kørsel", ELLER "Ret"-link på den grønne section-knap) → sendt-status **nulstilles** → tilbage til ⚪ "Planlagt", og dagen skal sendes igen. Begrundelse: vognmandens kopi er forældet så snart formanden ændrer bestillingen. Gælder også **materiel pr. enhed** (Gem → enheden falder tilbage til "Planlagt"). LÅST 2026-06-23.
- Egen bil → ingen vognmand-pille (auto-bekræftet ved send — se Variant: Egen bil-flow)
**Læser:** `orders.asfalt_koersel[].planlagt` + `.sendt_til_vognmand` + `.bekraeftet_af_vognmand`

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
  bil_ordre_nr: string,          // <ordrenr>-DDMMYY-NN — matcher ønske-bilen (biler[].bil_ordre_nr)
  reg_nr: string,
  chauffoer_navn: string,
  chauffoer_tlf: string,
  bil_type: string,
  laes_nummer: number,           // 1, 2, 3… (drop-rækkefølge)
  ankomst_plads_tid: string,     // HH:MM — beregnet fra første-læs + interval
  moedetid_fabrik: string,       // HH:MM — tilbageregnet fra ankomst_plads − driveTimeMinutes
}
```
Disse felter sendes retur til formand (Trin 7) og til chauffør (Trin 8) — hver chauffør får KUN sin egen mødetid_fabrik. **`bil_ordre_nr` bærer ønske-bilens nummer videre**, så formand/fabrik/chauffør kan matche bekræftet bil mod den oprindelige ønske-bil (og opdage afvigelser i antal/type/tid).

**Leverancevej — fil-udveksling, ikke drag-and-drop (LÅST 2026-06-19):** Vognmanden disponerer i **sit eget system** og leverer disponeringen via **fil-udveksling** (CSV via SFTP for store / web-formular for små). Drag-and-drop-`VognmandDisponeringsScreen` er derfor **ud af scope** — bevaret bag `SHOW_DISPONER`-flag i prototypen, men UI-en udgår sandsynligvis. `confirmed_vehicles[]` populeres uændret fra fil/formular. Fil-kontrakten (CSV-kolonner + format-konventioner: ISO-dato `yyyy-mm-dd`, tid `HH.mm`, semikolon-separator, UTF-8) + de fire udvekslings-øjeblikke er kanonisk dokumenteret i `Docs/Vognmand/Dataudveksling-vognmand.md` § "Udvekslings-model". Vognmand-app'en (`DataudvekslingScreen`) viser kontrakten + downloadbare CSV-eksempler (bestilling + retur) og en "Opdatér"-pull af klar-data (ikke on-demand-generering).

**Webupload — "den anden dør" for små vognmænd (LÅST 2026-06-22):** Det er **fil hele vejen (CSV)** for alle vognmænd — forskellen er kun leveringskanalen: **store dropper automatisk via SFTP**, **små uploader CSV'en i vognmand-app'en** (ingen SFTP-klient at sætte op). Begge døre rammer **samme `confirmed_vehicles[]`-ingest og samme fil-kontrakt** — der er kun én kontrakt at vedligeholde. Begrundelse: små vognmænd har intet system at eksportere fra og håndlaver CSV'en i Excel → en upload i en app de allerede logger ind i er mindre arbejde (for dem og os) end SFTP-konto/-nøgle-provisionering + support, og webformularen giver straks-validering.

**Leveringskanaler + versionering + afvisning (LÅST 2026-06-25):** Kanonisk i `Docs/Vognmand/Dataudveksling-vognmand.md` § "Filudveksling". Kort:
- **Store vognmænd: automatiseret SFTP-pull hvert 15. minut.** Poller drop-mappen og henter med det samme der ligger en fil.
- **Små vognmænd: notifikation via e-mail** ("ny bestilling klar") med **upload-link** til web-formularen. (SMS-varsel kan tilføjes senere.)
- **"Kun én fil" trods rettelser:** import er **idempotent pr. `bil_ordrenummer` (seneste vinder)** + **ét stabilt filnavn pr. vognmand pr. dag** (`colas_bestilling_<vognmand-id>_<yyyy-mm-dd>.csv`, overskrives ved rettelse) + **`genereret_tidspunkt`/`version`-stempel** i header. Der opstår aldrig flere versioner i drop-mappen.
- **Rettelse trigger gen-hentning:** store ser ændret `last-modified`/version → re-puller automatisk; små får **ny e-mail** ("Bestilling opdateret — hent igen"). Begrænset af **kl-18-cutoff** dagen før (derefter telefonisk).
- **Afvisning:** mindst én blokerende fejl → **hele filen afvises** (alt-eller-intet, ingen partiel disponering), men **fejl logges pr. række** i en rapport til vognmanden. Validering: bil-ordrenummer-mønster, E.164-mobil, påkrævede felter, **biltype mod prædefineret liste**.
- **Prædefineret biltype-liste:** Colas leverer en kontrolleret biltype-liste så valg matcher databasen; ingen match = blokerende fejl. **Standard-lasteevne forsøges knyttet til listen** (forudfylder `lasteevne_tons`); kan den ikke fastlægges pr. type → lasteevne er påkrævet retur-felt. 🟡 Selve listen afventer Colas.

**Nye retur-felter pr. bil (LÅST 2026-06-25):** Ud over reg.nr/biltype/chauffør/mobil returnerer vognmanden nu også: **`lasteevne_tons`** (validerer kapacitet mod `forventet_tons`), **`raekkefoelge`** (bekræfter bilens position) og **`ankomst_fabrik`** (vognmanden returnerer den mødetid på fabrik vi sendte, så Colas kender **starttider for ALLE biler** og kan beregne hele dagens flow i formandens udførsel/kørsel). Felt-tabel i `Dataudveksling-vognmand.md` § "CSV-kolonner".

**Vognmand-login — TODO (2026-06-25):** Der findes endnu **ingen reel login-side til vognmanden** (kun prototype). Selvstændig auth-flade (adskilt fra chauffør-SMS-login) der skal **tale med Oracle-databasen** (APPS/PLAN). Skal bygges før produktion.

**Krav til webupload (prototype: `DisponeringUpload.tsx` i `dataudveksling/`):**
- **Format/parsing:** CSV, UTF-8 (BOM-tolerant), semikolon-separator, header-række. Citationstegn-håndtering (`""` = escapet `"`). Én datarække pr. bil.
- **Forventede kolonner (header, navn er bindende):** `bil_ordrenummer; reg_nr; biltype; chauffoer_navn; chauffoer_mobil`. Manglende **påkrævet** kolonne i header = global blokering af hele filen.
- **Påkrævede felter pr. række (blokerende):** `bil_ordrenummer`, `reg_nr`, `chauffoer_navn`, `chauffoer_mobil`. `biltype` = ikke-blokerende advarsel hvis tom (mappes mod Colas' biltyper).
- **Felt-validering:** `bil_ordrenummer` skal matche `<ordrenr>-DDMMYY-NN` (match-nøgle, ekko af bestilling); `chauffoer_mobil` skal være E.164 (`/^\+\d{8,15}$/`).
- **UX-flow:** vælg/træk fil → client-side parse + validering → preview-tabel med pr.-række-status (klar / advarsel / fejl) + fejltekst → opsummering (X klar · Y fejl) → "Indsend"-knap **disabled** hvis manglende kolonner, ≥1 fejlrække eller 0 gyldige rækker → success-state.
- **Produktion (TODO Supabase/backend):** client-side validering er kun forhåndstjek; **backend skal re-validere** og binde `reg_nr` til `bil_ordrenummer`-slot (samme regel som SFTP-vejen). Upload-endpoint hører til samme fil-in/ud-kanal som diskuteres i arkitektur-oplægget (`ARKITEKTUR_OPLAEG_JESPER.md`) — åbent punkt: ligger fil-kanalen i `EXT_PLAN_APP` eller som separat kanal ved siden af.

### Trin 5 — Vognmand bekræfter
**App:** vognmand
**Komponent:** `GodkendFlow` — bekræftelsesside
**Skriver til:** `orders.asfalt_koersel[].bekraeftet_af_vognmand = true`

### Trin 5b — Fabrik notificeres om afhentningstidspunkt (LÅST 2026-05-22, udvidet 2026-05-26)
**App:** (fabrik-system / integration)
**Trigger:** Formand sender bil-bestilling (eller vognmand bekræfter) — afhængigt af hvor langt fremme i flowet fabrikken skal vide besked.
**Beregning gælder hver bils opstarts-ankomst (LÅST 2026-06-10):** Fabrikken får en mødetid pr. bil pr. produkt for bilens **første ankomst** under indfasningen. De pinnede biler bruger formandens egne tider; de øvrige biler følger intervallet efter sidste pinnede læs (se Trin 1) og indgår i flowet, indtil alle biler er i rotation. Derefter loop uden flere planlagte tider.
- `moedetid_fabrik = ankomst_plads − køretid` for hver bils opstarts-ankomst
- `køretid` = Google Maps fabrik→plads + 10% (kanonisk køretid, jf. Bilbehov)
- Eksempel: pinned bil 1 plads 07:30, pinned bil 2 plads 08:00, interval 15 min, køretid 36 min:
  - Pinned bil 1: plads 07:30 → fabrik 06:54
  - Pinned bil 2: plads 08:00 → fabrik 07:24
  - Bil 3 (interval): plads 08:15 → fabrik 07:39
  - Bil 4 (interval): plads 08:30 → fabrik 07:54
  - … indtil alle biler er i rotation, derefter loop

**Skriver til:** fabrik-system får en **liste af afhentninger** (ikke én samlet tid):
  - `pickups[]: { reg_nr, chauffoer_navn, laes_nummer, pickup_time_fabrik, produkter[], samles_paa_en_bil_flag }`
  - Bygges fra `confirmed_vehicles[]` (Trin 4) når vognmand bekræfter (Trin 5) — eller fra placeholder-rækker hvis fabrik skal vide besked før vognmand-bekræftelse

**Hvorfor:** Fabrik skal kunne planlægge produktion + tilberedning så asfalten er klar når chauffør ankommer. Uden eksplicit afhentnings-tid kan fabrik ikke optimere timing eller advare om kapacitet.

**Visning i fabrik-produktionsplan (LÅST 2026-06-08):**

ProduktionsplanScreen har 5 venstre faste kolonner + horisontalt bil-spor (tidsskala) til højre per ordre.

**Venstre faste kolonner per ordre:**

| Kolonne | Bredde | Indhold | Datakilde |
|---|---|---|---|
| Info | 240px | Recept, asfalttype, udførselssted, hold/formand | `orders` |
| Bestilte Tons | 140px | "Bestilte Tons" + tons · "Morgen tons" + tons | `orders.forventetMaengde`, `morgenTons` |
| Første bil + Antal biler | 160px | "Første bil" + klokkeslæt · "Antal biler" + tal | Se nedenfor |
| Næste bil | 160px | Vejr-aflyst badge · "Næste bil" + ETA · "Interval" + tid | Live state + `interval_minutter_mellem_laes` |

**"Første bil"-tid** = `pickups[0].pickup_time_fabrik` = `foerste_laes_udlaegning_tid − driveTimeMinutes`.
**"Antal biler"** = `orders.asfalt_koersel[].biler.length` (eller `confirmed_vehicles.length` når vognmand har bekræftet).

**Data-flow:** Formand → bilbestilling (Trin 1) → `foerste_laes_udlaegning_tid` + `interval_minutter_mellem_laes` → Trin 5b-beregning → fabrik-system → fabrik-produktionsplan UI.

**Hvorfor "Første bil" OG "Næste bil":** Fabrikken skal forberede sig på ordrer der ENDNU ikke er startet. "Første bil"-feltet er statisk plan-information; "Næste bil"-feltet skifter dynamisk når faktiske scans kommer ind.

---

**Horisontalt bil-spor — statisk og dynamisk overblik (LÅST 2026-06-08):**

Til højre for venstre kolonner har vi en tidsskala (06:00, 07:00, …) med ét spor per ordre (`OrdreLaneCars`). På hver ordres spor plottes alle planlagte biler som Truck-ikoner på deres respektive mødetider — **dette er fabrikkens primære statiske overblik dagen før og om morgenen**.

**Statisk overblik (dagen før / tidlig morgen) — bil-plotting:**

Hver bil plottes på sin beregnede mødetid på fabrikken:
```
biler[n].moedetid_fabrik = foerste_laes_udlaegning_tid + (n−1) × interval_minutter − driveTimeMinutes
```

Eksempel — første læs 07:30, interval 15 min, drive-time 36 min, 3 biler:
- Bil 1 (læs 1): mødetid 06:54 → plottes ved x-pos for 06:54
- Bil 2 (læs 2): mødetid 07:09 → plottes ved x-pos for 07:09
- Bil 3 (læs 3): mødetid 07:24 → plottes ved x-pos for 07:24

**Antal biler udledes via sidste-læs-formel:**

Hvis formand ikke eksplicit har sat antal:
```
antal_biler = ceil(bestilt_tons / bilkapacitet)
```

For 75 t bestilt, 34 t kapacitet → 3 biler (sidste bil kører 7 t = sidste-læs). Genbrug eksisterende vejeseddel-sidste-læs-logik fra Flow 1 + Flow 7.

**Dynamisk overblik (dagen i gang) — live opdatering:**

Når bil scanner vægten opdateres `bil.status`:
- `planlagt` → `undervejs` (efter udvejning_lastet)
- `undervejs` → `aflaesning` (efter ankomst_udfoerselssted)
- `aflaesning` → `færdig` (efter aflaesning_slut)

For `undervejs`-biler beregnes live ETA fra faktisk timestamps. `planlagt`-biler beholder statisk mødetid indtil de selv aktiveres.

**Forskel statisk vs. dynamisk visning:**

| Tid på dagen | Hvad fabrik ser |
|---|---|
| Dagen før / tidlig morgen | Statisk plot — alle biler ved beregnede mødetider |
| Dagen i gang | Hybrid — aktive biler ved faktisk ETA, ikke-startede ved statisk mødetid |
| Dagen er afsluttet | Historisk plot — alle biler ved faktiske gennemløbs-tider |

**🟡 Implementerings-status:** Mock-data i prototype. Real-implementering kræver Trin 5b-formel der populerer `biler[]` automatisk fra formandens bestilling, live timestamp-listener, og sidste-læs-udledning. Tracking: GitHub issue **FABR-PROD-002**.

**🟡 ÅBNE SPØRGSMÅL:**
- Hvilket fabrik-system integreres der med (Danvægt? Anden ERP)? Eller skal det være en simpel webhook/API-call?
- Skal beregningen kompenseres for læsse-tid på fabrik (fx +10 min buffer)?
- Hvad sker der hvis chauffør ankommer tidligere/senere end planlagt — re-notifikation eller bare ETA-update?

### Trin 5c — Cross-app destination: PLAN / Asfalttavlen (bilbestilling)

**App:** (PLAN-ekosystem / integration)
**Trigger:** Samme som Trin 5b — formand sender bil-bestilling (eller vognmand bekræfter).

**Hvad er "Asfalttavlen":** En PLAN-visning der konsoliderer dagens asfaltbestillinger + bil-bestillinger for fabrik-mester og koordinator. PLAN er master-system; Asfalttavlen er en specifik visning/destination i PLAN-ekosystemet hvor stakeholders får ét samlet overblik over dagens kørsler. **Bemærk dataretning:** Vi sender data BÅDE ind fra PLAN (jf. Flow 9b PLAN-push, Flow 13 fabrik-skift, Flow 5/6/7 holdpakke + ordre-data) OG ud til PLAN / Asfalttavlen (dette trin + ABE-2b nedenfor).

**Skriver til PLAN / Asfalttavlen:**

| Felt | Kilde | Notes |
|---|---|---|
| `bil_ordre_nr[]` | `orders.asfalt_koersel[].biler[].bil_ordre_nr` | Unikt nr. pr. bil pr. dag (`<ordrenr>-DDMMYY-NN`). Hver bil = separat ordre i vognmandens optik |
| `antal_biler` | `orders.asfalt_koersel[].biler.length` (eller `confirmed_vehicles.length`) | Total antal biler bestilt for dagen |
| `starttid` | `orders.asfalt_koersel[].foerste_laes_udlaegning_tid` | Første læs på plads (HH:MM) |
| `interval_minutter_mellem_laes` | `orders.asfalt_koersel[].interval_minutter_mellem_laes` | Forskydning mellem efterfølgende læs |
| `moedetid_foerste_bil` | Beregnet: `foerste_laes_udlaegning_tid − factory.driveTimeMinutes` | **Mødetid på fabrik for FØRSTE bil** (HH:MM) |

**🟢 LÅST 2026-06-12 (Carsten):** Når formand har bestilt **antal biler** og angivet **første tidspunkt på fabrik**, SKAL som minimum `antal_biler` + `moedetid_foerste_bil` (mødetid på fabrik for første bil) overføres til PLAN/Asfalttavlen. Dette er minimums-udvekslingen for bilbestilling; per-bil-mødetider for de øvrige biler er fortsat under afklaring (se nedenfor).

🟡 **ÅBENT (LÅST 2026-06-10): konkret payload-format aftales med PLAN-team.** Formatet skal kunne håndtere "Egen bil"-flag (jf. Variant nedenfor), "Samles på en bil"-markeringer (jf. Flow 12), og evt. per-bil-beregnede mødetider på fabrik (jf. Trin 5b-formlen). Det er endnu uafklaret om Asfalttavlen pull'er data fra Colas via API/webhook, eller om Colas push'er ved hver send/bekræftelse.

### Trin 6 — Formand ser bekræftelse
**App:** formand
**Komponent:** `VognmandBekraeftelseBadge`
**Viser:** Grønt "Bekræftet af vognmand" badge
**Læser:** `orders.asfalt_koersel[].bekraeftet_af_vognmand`

### Trin 7 — Formand ser bildetaljer i Udførelse (Bilbestilling-tabel)
**App:** formand
**Komponent:** `OrdrePlanScreen` → Udførsel-mode → **Bilbestilling**-sektion (tabel, erstatter tidligere `BekraeftetBilKort`-mini-preview)
**Viser per bil (tabel med kolonne-overskrifter — ikke "ankomst"-prefix per række):** reg.nr · biltype · chauffør-navn · chauffør-tlf · **ankomst på plads** (HH:MM) · **mødetid fabrik** (HH:MM). Grupperet per biltype. **Expanderbar** når der er flere end 3 biler.
**Læser:** `orders.asfalt_koersel[].confirmed_vehicles[]` — alle felter inkl. læs-nummer + per-bil tider (se Trin 4)
**Note:** Formanden kan ringe direkte til chaufføren via tlf. Materiel-transport vises i tilsvarende tabel (Anlæg · Beskrivelse · Transport (reg+type) · Chauffør · Tlf · ankomst — jf. `MATERIEL_FLOW.md`).

### Trin 7b — Formand sender ordre-SMS til chauffør (LÅST 2026-06-15)
**App:** formand
**Komponent:** `OrdrePlanScreen` → Bekræftede biler-tabel → "Send ordre nu" / "Gensend ordre"-knap per bil-række
**Handling:** Sender et **konsolideret dags-link pr. chauffør** (deep-link til chauffør-webapp på dagens ordre(r)). Se Trin 8 for distribution.
**State + labels (opdateret 2026-06-23):** `ChauffoerSmsStatus` (STATUS_VOKABULAR #13). Da første SMS sendes AUTOMATISK (debounce nedenfor), er den manuelle knap reelt en gensend:
- `ikke_sendt` (debounce-vindue, endnu ikke auto-sendt): pille **"Afventer afsendelse"** + knap **"Send ordre nu"** (manuel straks-send/override).
- `sendt` (auto-sendt): pille **"Ordre sendt til chauffør ✓"** + aktiv **"Gensend ordre"**-knap (manuel gensend — fremrykket fra fase 2).
- `aendret_siden_afsendelse` (fase 2): pille **"Ordre opdateret"** + knap **"Gensend ordre"**.
**Granularitet:** ÉN SMS pr. chauffør pr. dag (nøgle: chauffør-tlf) for **asfalt-kørsel**, uanset antal ordrer/læs — respekterer at en chauffør har flere ordrer/dag. Knappen vises per bil-række, men tilstanden er per chauffør (cross-ordre-konsolidering sker i backend). **Materiel-transport har en separat regel: én SMS pr. chauffør pr. ordre** (konsoliderer flere materiel-enheder på samme bil) — se Flow 2 Trin 4b.
**Trigger:** Auto-send styret af debounce-timing (se nedenfor) + manuel straks-/gensend fra tabellen.

**Afsendelses-timing / debounce (LÅST 2026-06-15):** SMS sendes IKKE straks ved disponering — vognmanden ændrer ofte chauffør-sættet kort efter. Reglerne:
- **Initial batch — 2 timer (FAST):** Send-tidspunktet er **første disponering + 2 timer** og er fast. Ændrer vognmanden chauffør-sættet i vinduet, flytter send-tidspunktet sig IKKE — ved send-tidspunktet får de chauffører der ER disponeret netop da deres SMS ("første SMS-batch").
- **Sen erstatning — 10 minutter:** EFTER at første SMS-batch er sendt (ordren er i "notificeret"-fase), får enhver chauffør der tilføjes/skiftes (typisk nedbrud, sygdom) sin SMS efter kun **10 minutter** — så en akut indsat chauffør får besked hurtigt.
- **Ingen fast klokkeslæts-cutoff:** Fordi nogle chauffører kører aften/nat, kan vi ikke vente til fx midnat. Debouncen er altid relativ til disponering, aldrig et fast ur-tidspunkt.
- **Manuel straks-send:** Formandens **"Send ordre nu"**-knap pr. række kan altid override debouncen og sende med det samme. Ændres til **"Gensend ordre"** når status er `sendt` eller `aendret_siden_afsendelse`.
- **Granularitet:** Send-tidspunktet følger den konsoliderede dags-SMS pr. chauffør (jf. ovenfor). T0 = chaufførens første disponering på dagen.

🟡 **ÅBENT (implementering):**
- **Konsolidering vs. debounce:** Chauffør med ordrer disponeret på forskellige tidspunkter — én fast send (T0+2t) der samler alle ordrer disponeret indtil da, og sen-tilføjede ordrer trigger 10-min-gensend? Bekræft model.
- **Aften/nat lead-time:** Hvis første disponering sker <2 timer før chaufførens planlagte start, risikerer fast T0+2t at sende for sent. Skal send-tid være `min(T0 + 2t, planlagt_start − lead)`?

**Bekræftelses-pille — formand + vognmand (LÅST 2026-06-15):** Når SMS er afsendt, skal BÅDE formand og vognmand kunne se at opgaven er sendt til chaufføren:
- **Formand:** Pille på **Bekræftede biler**-tabellen (Udførsel-mode) pr. chauffør/række: **"Ordre sendt til chauffør ✓"** (drevet af `confirmed_vehicles[].sms_status = 'sendt'`). I debounce-vinduet viser pillen **"Afventer afsendelse"**. *(Pending-tilstand kræver evt. ny `ChauffoerSmsStatus`-værdi, fx `planlagt` — afklares; enum ligger i STATUS_VOKABULAR #13.)*
- **Vognmand:** Tilsvarende pille SKAL findes i vognmand-app'en ("Sendt til chauffør"), så vognmanden ved at hans disponering er kommunikeret videre til chaufføren. 🟡 **Vognmand-app er ikke designet færdig endnu — pillen NOTERES her men bygges ikke nu.**

**Reassign (nedbrud):** Ny vognmand-disponering (anden chauffør) → ny `confirmed_vehicles[]`-row ankommer → auto-SMS til den nye chauffør efter **10-min-reglen** (sen erstatning, se debounce ovenfor); den afløste af-disponeres.
**Skriver til:** `confirmed_vehicles[].sms_status: ChauffoerSmsStatus` (per chauffør-aggregeret i backend) + et scheduling-/send-tidspunkt-felt (TBD-navn) der bærer debounce-deadline.

### Trin 8 — Chauffør modtager ordre
**App:** chauffeur (React Native)
**Komponent:** `TaskCard`, `TaskDetailScreen`
**Viser:** Ordredetaljer, lokation, kontakt, OG **kommentar til chauffør** (`kommentar_til_chauffoer` fra bilbestillingen — kørselsspecifikke instruktioner fra formand). **Mødetid på fabrik** vises for chaufførens opstarts-ankomst (HH:MM) — pinnede biler følger formandens tid, øvrige biler får tiden af intervallet. Ingen blivende "læs-rolle" vises (jf. Trin 1, LÅST 2026-06-10).
**Læser:** `assigned_tasks` WHERE `driver_phone = auth.user.phone` OR `truck_plate = chauffeur.plate`, henter KUN denne chaufførs `confirmed_vehicles[]`-row (filtreret på reg_nr/tlf) — sin `moedetid_fabrik` vises prominent.
**Vigtigt:** Hver bil har en mødetid på fabrik for sin opstarts-ankomst (pinnede = formandens tider, øvrige = interval-trin) indtil alle biler er i rotation. Derefter kører chaufføren i loop uden flere planlagte tider. Chaufføren ser KUN sin egen — ikke de andre biler.
**Note:** Chauffør har et minimalt login-system (LÅST 2026-06-09) — se [[chauffeur-login]] sektion nedenfor. SMS-OTP ved ny enhed eller token-fornyelse, derefter altid direkte til forside. **Bil + konfiguration administreres dynamisk af vognmand** og opdateres on-the-fly i chauffør-app, formand-app og fabrik-app — chauffør foretager INGEN bil-valg i appen.
**Distribution (LÅST 2026-06-15):** Konsolideret **dags-SMS pr. chauffør** (LINK Mobility) med **deep-link til chauffør-webapp** på dagens ordre(r). Linket åbner appen direkte på ordren; mangler chaufføren et gyldigt 30-dages-token, kicker SMS-OTP-login ind først (login-sporet er adskilt — se [[chauffeur-login]]). Sendes auto når plan er klar + formand kan gensende fra Bilbestilling-tabellen (Trin 7b). Granularitet = én SMS pr. chauffør pr. dag (ikke per-ordre) — se [[project_chauffeur_sms_login]].
**Ordre-ændring efter afsendelse:**
- **Fase 1 (nu):** Ordre-ændringer opdateres **lydløst** i chauffør-app (linket peger på live-data — appen viser altid aktuel sandhed).
- **Fase 2 (senere):** "Ordre opdateret"-banner i chauffør-app ved væsentlige felter (mødetid, fabrik, produkt, mængde) + formand ser `aendret_siden_afsendelse` og kan gensende. `ChauffoerSmsStatus`-enum er allerede defineret med fase-2-værdien for at undgå migration.
**Aflysning:** dagsaflysning notificeres separat via vejr-/aflysnings-retur-flow — IKKE via denne SMS-knap (uden for scope).

### Variant: "Egen bil"-flow (LÅST 2026-05-22) — Formand → Chauffør (uden vognmand)

**Trigger:** Formanden vælger **"Egen bil"** som biltype i biltype-dropdown'en under Asfaltbestilling (allerede første option i listen — se [[project_dagsoversigt_business_rules]]). Egen bil = holdets/projektets egen bil, IKKE en bil fra vognmandens flåde.

**Forskelle fra standard-flow:**
- **Trin 3-6 (vognmand) SPRINGES OVER** — vognmanden modtager IKKE en bestilling, fordi bilen ikke skal disponeres af vognmand
- Bestillingen sendes DIREKTE fra formand til chauffør
- `orders.asfalt_koersel[].egen_bil = true` (nyt data-flag)
- `orders.asfalt_koersel[].bekraeftet_af_vognmand` er N/A — bestillingen er auto-bekræftet ved formand-send
- Vognmand-badge i formand-UI viser "Egen bil" (ikke "Sendt til vognmand" eller "Bekræftet af vognmand")
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

### Variant: Chauffør Login + Dynamisk bil-administration (LÅST 2026-06-09)

**Anker:** `chauffeur-login`

**Forretningsregel:** Chauffør-appen er **tynd**. Chaufføren foretager INGEN administrative valg (bil-valg, konfigurations-valg, bil-skifte) i appen. Han logger ind med SMS-OTP, og derefter er appen et passivt vindue ind i dispositionen som vognmanden ejer. Alt om bil + konfiguration administreres dynamisk af vognmand og opdateres on-the-fly på tværs af chauffør-app, formand-app og fabrik-app.

**Hvorfor tynd app:**
- Vognmanden har allerede styr på dispositioner — det er hans primære arbejde
- Chauffør Ole er Ole uanset hvilken bil han sidder i. Opgaven er knyttet til Ole, ikke til en bilsession
- Edge cases (sygdom, bil i stykker) løses naturligt via vognmandens disponering — chaufføren skal ikke "vælge" sig ud af problemer
- Færre skærme = mindre forvirring + færre fejlkilder + hurtigere udvikling

---

#### Login — SMS-OTP (sjælden, kun ved ny enhed eller token-fornyelse)

**Trigger:** Første gang chauffør åbner appen på en enhed (eller efter token-udløb / log-out).

**Flow:**
1. Chauffør indtaster mobilnummer (DK-format, +45 auto-prefix)
2. App sender 6-cifret SMS-kode via **LINK Mobility** (SMS-leverandør besluttet 2026-06-10 — se #5 [INFRA-AUTH-001] + EPIC #2). Kaldes fra eget backend-endpoint (sandsynligvis ikke Supabase Auth, da DB-valg er åbent)
3. Chauffør indtaster koden
4. Ved succes: token gemmes i `localStorage` med expiration-timestamp. Token gyldig 30 dage (webapp-fase 1) / 6 måneder (native-fase 2).
5. App refresher → direkte til forside (dashboard). Ingen mellem-skærm.

**Webapp-fase 1 (LÅST 2026-06-09):**
- Token-storage: `localStorage` med expiration-timestamp (30 dage)
- Auto-login: gyldigt token → direkte til forside, login-skærm vises ikke
- Logout: knap under brugerprofil — sletter localStorage + redirect til login
- INGEN token-revoke fra server i MVP — `localStorage`-storage er per-enhed, og expiration efter 30 dage fungerer som de-facto auto-revoke

**SMS ikke modtaget (LÅST 2026-06-09 — reduceret scope):**
- Resend-knap: aktiveres efter 30 sek cooldown, max 3 resends per session
- "Forkert nummer? Skift"-link → tilbage til mobilnummer-input
- Voice OTP, helpdesk-skærm m.m. = FASE 2

**Acceptkriterier:**
- Token mangler/udløbet: LoginScreen vises (mobilnummer → OTP → permissions) → derefter DashboardScreen ("dagens opgaver med swipe")
- Token gyldigt: SplashScreen vises ("Godmorgen" + pil) → chauffør trykker pil → DashboardScreen
- LoginScreen og SplashScreen leder begge til samme target: DashboardScreen (default landing for chauffør)
- Logout: token slettet → LoginScreen vises ved næste åbning
- Forkert kode 3 gange → lock-out 5 min (eller cooldown — afklares ved Supabase-integration)
- LoginScreen er visuelt designet som "ny splash" (samme split-layout som SplashScreen, men med SMS-login + OTP-input + permissions i bottom-left hvor godmorgen + pil sad)

**Trin 3 — Permissions (LÅST 2026-06-09 — obligatorisk del af login):**

Chauffører SKAL acceptere to permissions for at fortsætte til appen — det er ikke et valg:

| Permission | Begrundelse | Teknisk integration (Fase 1, webapp) |
|---|---|---|
| **Kamera** | Scan af vejekort på fabrik (NFC HCE i Fase 2 — kamera er fallback / fase 1-løsning til QR-scan eller fotobaseret) | `navigator.mediaDevices.getUserMedia({ video: true })` — frigør straks med `.getTracks().forEach(t => t.stop())` |
| **PWA install** | App-ikon på hjemmeskærm — uden ikon skal chauffør finde webapp via bookmark eller URL. For meget friktion ved daglig brug. | Android Chrome: `beforeinstallprompt`-event. iOS Safari: manuel instruks-modal (kan ikke trigges programmatisk) |

**UI-design:**
- To toggle-knapper i permissions-trinet
- Begge defaultes til ON (chauffør skal aktivt deaktivere hvis nødvendigt — sandsynligvis ikke en use case)
- "Færdig"-knap disabled hvis nogen er off
- Toggles låses i ON-state efter accept (kan ikke vendes off uden at gå i settings)

**Permission-flow ved klik på toggle (skal implementeres):**
1. Kamera-toggle klik → trigger `getUserMedia({ video: true })` → ved succes: toggle on, stream frigives. Ved afvisning: toggle forbliver off, fejl-besked vises
2. PWA-toggle klik → Android: trigger `beforeinstallprompt` capture-event. iOS: vis instruks-modal med screenshot/tekst om at gå via Safari share-menu → "Føj til hjemmeskærm"

**Status i prototype (2026-06-09):** Toggles er **UI-mock** — viser visuel feedback men trigger ikke reel `getUserMedia` eller `beforeinstallprompt`. Faktisk integration kommer i separat produktionskode-issue (CHAF-LOGIN-009).

**PWA-forudsætninger (kræves for at install-prompt fungerer):**
- `apps/chauffeur-web/public/manifest.json` med app-navn, ikoner, theme-color, start_url, display=standalone
- Apple-touch-icons i forskellige størrelser (180×180, 152×152, 167×167) i `public/`
- `<link rel="manifest">` + apple-specifikke meta-tags i `index.html`
- HTTPS (Netlify preview/produktion er HTTPS)

**Hvis chauffør afviser i browser-prompt (Fase 2-håndtering):**
- Kamera afvist → blokerende besked: "Kamera er nødvendigt for at scanne vejekort. Tillad kameraet i din browser-indstilling og prøv igen."
- PWA install afvist eller udsat → ikke blokerende, men toggle forbliver off. Bruger kan fortsætte (i Fase 1 — kan opdateres til blokerende i Fase 2)

**Reset af permissions:**
- Hvis chauffør har slået permissions fra i browser-settings → next login vil bede igen på trin 3
- Logout sletter ikke browser-permissions — det er en browser-level setting

---

#### Dynamisk bil-administration (LÅST 2026-06-09)

**Forretningsregel:** Alle ændringer om bil, konfiguration og tildeling sker hos **vognmanden** og propageres on-the-fly til chauffør-app, formand-app og fabrik-app. Chauffør-appen viser altid den NUVÆRENDE state — opfrisker live via Supabase realtime-subscription (eller polling i fallback).

**Vognmandens disponering er sandhedskilden:**
- `disponering` indeholder `{ chauffoer_tlf, bil_reg_nr, konfiguration, ordre_id, dato, status }`
- Chauffør-app læser `disponering WHERE chauffoer_tlf = auth.user.phone AND dato = i_dag()` → viser tilknyttede opgaver
- Når vognmand opdaterer dispositionen → alle apps får update (realtime sub eller polling)
- **Samme bil/chauffør på flere selvstændige ordrer samme dag (LÅST 2026-06-10):** En bil og chauffør kan dække flere ture på *samme* ordre (loop) — det er ÉN disponering. MEN sættes samme bil/chauffør på **flere forskellige ordrer** der IKKE er slået sammen som samleordre/samlelæs, skal vognmand rapportere bilen **pr. ordre** → én `disponering`-row pr. `ordre_id`. Chauffør-app viser alle rows for `chauffoer_tlf` (flere opgaver på dagen); hver formand ser kun sin egen ordres booking. Samleordre/samlelæs forbliver ÉN disponering med stop-liste (se Flow 11/12) — det er kun *separate* ordrer der kræver flere rows.

**Konfiguration — hvad er det:**
- En bil kan have flere mulige setups: "Normal", "Med hænger", "Med grab", "Med tipper" osv.
- Konfigurations-varianter pr. bil defineres af vognmand i bil-administrationen (se VOGN-DISP-CONFIG-001)
- Når vognmand disponerer bilen, vælger han ÉN konfiguration. Dispositionen rummer `konfiguration_id`
- Chauffør ser konfigurationen som info på opgaven, men kan IKKE ændre den
- Formand og fabrik ser ligeledes konfigurationen som info (vigtigt for fabrik: hvilket setup ankommer)

**Edge case-flows — alle løses hos vognmand:**

| Scenario | Hvad sker | Chauffør-handling |
|---|---|---|
| **Ole bliver syg kl. 12** | Ole afslutter sin igangværende opgave (eller markerer afbrudt). Vognmand tilføjer Per som ny bil/chauffør på resten af ordren i sin disponering. | Ole: ingen. Per: ser opgaven dukke op i sin app efter vognmand opdaterer |
| **Bil i stykker** | Vognmand opdaterer dispositionen til en ny bil + samme chauffør. Chauffør-app refresher (eller chauffør pull-to-refresh) → ny bil vises på opgaverne | Ingen handling |
| **Konfiguration forkert** | Chauffør ringer til vognmand → vognmand opdaterer disponering → chauffør-app refresher | Ringe til vognmand |
| **Ole sidder i en anden bil end disponeret** | Chauffør ringer til vognmand → vognmand opdaterer disponering → chauffør-app viser ny bil | Ringe til vognmand |
| **Formand afmelder chauffør** (🟡 TBD-funktionalitet) | Formand markerer chauffør som afmeldt for dagen → vognmand notificeres → vognmand finder erstatning | Ingen handling — chauffør-app viser "Du er afmeldt af formand" eller intet |
| **Realtime-nedbrud (Supabase realtime ikke virker)** | App falder tilbage til polling (fx hvert 60. sek) eller manuel pull-to-refresh | Manuel pull-to-refresh hvis nødvendigt |
| **Token udløber midt på dag** | Chauffør får besked "Session udløbet" → SMS-OTP login → tilbage til forside med samme data | Logge ind igen |
| **Ole skifter bil midt på opgave** (uden vognmand opdaterer) | App'en viser stadig den oprindelige bil. Events (tidsstempler, vejesedler) går på den oprindelige bil. Fejl-rettelse via vognmand bagefter | Ingen handling — vognmand retter bagefter |

**Datafelter (LÅST 2026-06-09):**
- `chauffoer_tlf` (auth.user.phone) — fra login, persistent
- Bil + konfiguration kommer fra `disponering`-tabellen LIVE, ikke gemt lokalt
- INGEN sessionStorage til bil/konfiguration — alt er server-side

**Realtime / dynamisk opdatering — krav:**
- Chauffør-app: subscribe til `disponering WHERE chauffoer_tlf = mig` → re-render ved ændring
- Formand-app: subscribe til `disponering WHERE ordre_id IN mine_ordrer` → re-render ved ændring
- Fabrik-app: subscribe til `disponering WHERE dato = i_dag AND bil_skal_til_min_fabrik` → re-render ved ændring
- Default mekanisme: Supabase realtime subscriptions
- Fallback: polling hvert 60. sek hvis realtime ikke tilgængelig

**Formand-afmelder-chauffør (🟡 TBD — funktionalitet ikke bygget endnu):**
- Skal kunne markere en chauffør "afmeldt af formand for resten af dagen"
- Trigger: chauffør gør noget uacceptabelt, ankommer ikke, eller skal flyttes til anden opgave
- Vognmand notificeres + skal finde erstatning
- Skal defineres som eget issue ved senere afklaring

**Out of MVP (Fase 2):**
- Push-notifikationer ved dispositions-ændringer
- Multi-device login (én chauffør på flere telefoner)
- Token revoke fra server
- Voice OTP fallback
- Helpdesk-skærm med åbningstider
- Native secure storage (Keychain / EncryptedSharedPreferences)
- Formand-afmelder-chauffør-funktionalitet

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

**Start-rækkefølge er kilde → produktfelter spejler (LÅST 2026-06-04):** Start-rækkefølge-blokken (bil 1's starttid + "Herefter interval") er **eneste indtastningssted**. Produktets felter "Første læs (på plads)" + "Interval (min)" er **read-only spejlinger**:
- Bil 1's starttid (`startTider[0]`) → vises read-only i "Første læs (på plads)" + synkroniseres til `firstLoadTime` (downstream gantt-summary m.m.)
- "Herefter interval" (`intervalMinutes`) → vises read-only i "Interval (min)"
- **Kun produkt 1** har start-rækkefølge + interval-input. Produkt 2+ kører **altid sekventielt direkte** efter forrige produkt — ingen egne start/interval-felter (per-produkt-model fjernet 2026-06-25).
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

#### Per-produkt starttid/interval — FJERNET (LÅST 2026-06-25)

**Tidligere model (LÅST 2026-06-03, nu fjernet):** Produkt 2+ kunne få sin egen starttid (`foersteLaesPaaPlads`) + eget interval (`intervalMin`) via en "Køres direkte i forlængelse af forrige produkt?" Ja/Nej-toggle, så formanden kunne lægge en pause/buffer ind mellem produkter (fx maskinflytning). **Den funktionalitet er fjernet** — ikke længere relevant.

**Nuværende model:** Produkt 2+ kører **altid sekventielt direkte** efter forrige produkts sidste-læs (svarer til den gamle toggle = Ja / default). Kun **produkt 1** har eksplicitte starttider (start-rækkefølge Bil 1/2/3) + interval (jf. dashboardet, Trin 1). Der er ingen per-produkt `foersteLaesPaaPlads`/`intervalMin` længere — datamodel (`ProduktKørselParams`), toggle-UI, helper og demo-seeds er slettet i `OrdrePlanScreen.tsx`.

**UI — vognmand/fabrik:** uændret princip — produkter vises i tidsrækkefølge, læs-nummerering fortsætter på tværs af produkter; der er blot ikke længere et bevidst tid-gab mellem produkter (sekventielt direkte).

#### Produkt-skift-sikring under eksekvering (LÅST 2026-06-03)

> **🟡 ÅBENT PUNKT (2026-06-05) — kombineret last ved overgang.** Logikken nedenfor antager et **rent sekventielt skift**: `aktivt_produkt` er ét produkt ad gangen, og A→B-skiftet sker først når A's sidste vejeseddel er udvejet. Det dækker IKKE scenariet hvor én bil tager **rest af A + noget af B i samme tur** (to vejninger / to vejesedler på ét fabriksbesøg, med fabrik-besked om begge produkter). Afklaring + signoff tracket i **#36 (`DOCS-AK-001`)**. Indtil den er låst, gælder kun ét-produkt-pr-last-modellen her.

Risiko: Når aktivt produkt skifter fra A til B, må en chauffør IKKE ende med at hente forkert produkt på fabrik. Dette løses med tre lag der hver fungerer som safety net:

**Lag 1 — Server som sandhed (udvidet 2026-06-03)**
"Aktivt produkt" beregnes server-side fra ordrens reelle tilstand — vejeseddel-drevet, ikke tons-tællings-drevet:

```
For hvert produkt på ordren:
  produkt.faerdig = (sum af UDVEJEDE vejesedler for produkt) >= produkt.tons

aktivt_produkt = første produkt i raekkefolge hvor produkt.faerdig === false
```

*(Forenklet 2026-06-25: per-produkt `foersteLaesPaaPlads` er fjernet, så produkt-skift er altid rent sekventielt — B bliver aktivt så snart A's sidste vejeseddel er udvejet. Ingen tids-buffer mellem produkter længere.)*

**Trigger-tidspunkt for produkt-skift:** I præcis det øjeblik den sidste vejeseddel for produkt A er udvejet på fabrik (status `paa_vej_til_plads` eller senere), beregnes ny `aktivt_produkt`. Næste chauffør der NFC-scanner får produkt B's instruktion.

**Chauffør er passiv:** Han kører bare runder. App + fabrik fortæller ham hvad næste læs er. Ingen tons-tælling eller tid-tjek i appen — alt er server-side.

App'en spørger serveren ved hver væsentlig handling (task-åbning, fabrik-ankomst, etc.) — ALDRIG fra cache. Hvis offline, viser app sidst-kendte tilstand med "🟡 Ikke synkroniseret"-flag og opdaterer ved første netforbindelse.

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

### Variant: Chauffør-afslutning af opgave — "Dag afsluttet" (LÅST 2026-06-03, generaliseret 2026-06-15)

**Forretningsregel (Fase 1):** Formand styrer afslutning af opgave manuelt via telefonopkald — der er INGEN digital frigivelses-kanal (ingen push, ingen system-drevet frigivelse). Formanden ringer chaufføren, chaufføren **afslutter opgaven i chauffør-app'en** ("Afslut dag"), og formanden får bekræftelsen ved at vejesedlen skifter til `dag_afsluttet` i **"Kørsel"-sektionen under Udførsel-tab** (tidl. "Vejesedler" — "Dag afsluttet"-badge, gråtonet). Eventuel app-driven push-bekræftelse udskydes til Fase 2.

**"Dag afsluttet" er den generelle stop-for-dagen-mekanisme** — samme `dag_afsluttet`-flow bruges uanset ÅRSAG til at en chauffør stopper for dagen:
- **Sidste-læs-frigivelse** — formand er dækket ift. transport, overflødige biler frigives (se variant nedenfor)
- **Formand aflyser dagen** (fx regn) — chaufføren afslutter i app
- **Bil bryder ned**
- **Chauffør bliver syg**

I alle tilfælde: formand + chauffør taler sammen → chauffør afslutter opgaven i app → formand ser "Dag afsluttet" i "Kørsel"-sektionen (Udførsel).

**Vognmand-notifikation (LÅST 2026-06-19):** Vognmanden får en **"Dag afsluttet"-besked** i vognmand-app'ens Udførsel-mode — udløses af samme `dag_afsluttet`-event uanset om chaufføren afslutter i app'en eller formanden frigiver bilen. Bilen markeres fri → kan disponeres andetsteds. Ét af de fire udvekslings-øjeblikke. Se `Docs/Vognmand/Dataudveksling-vognmand.md` § "Udvekslings-model".

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

### Variant: Hviletid — interval-valg og auto-afslut (OPDATERET 2026-06-18)

**Terminologi (LÅST 2026-06-09):** Vi bruger ordet **"hviletid"** for chaufførens lovpligtige hvile (køre-/hviletidsloven). Ordet **"pause"** er reserveret til opgave-pause (opgave-skift via opgavelisten — frosset ur).

**Vigtig skelnen — hviletid vs opgave-skift (LÅST 2026-06-09):**

| Hviletid (lovpligtig hvile) | Opgave-skift |
|---|---|
| Trigger: "Hviletid"-knap på TaskDetailScreen for AKTIV opgave | Trigger: "Skift til denne opgave"-knap i opgavelisten |
| Opgavens `TaskState` forbliver `active` (sub-state: hviletids-segment åbnes) | Forrige opgaves `TaskState` skifter til `paused`, ny opgave bliver `active` |
| Uret kører videre på opgaven, kategori = Hviletid | Uret på forrige opgave **fryser helt** — ingen tid logges |
| Auto-afslut efter valgt interval (se nedenfor) | Ingen timer |
| Hviletid tæller med i `pause_minutter` i timereg | Tæller IKKE som hviletid i timereg — kun et kontekstskift |

> **Note om data-felter:** Datafelter `pause_minutter`, `task_pause_log[]`, `pause_start`, `pause_slut` beholder deres tekniske navne for nu. Felterne kan omdøbes til `hviletid_*` ved Supabase-skema-design.

**Interval-model (LÅST 2026-06-18):** Chaufføren vælger varighed ved hviletid-start — **15 minutter / 30 minutter / 45 minutter**. Efter den valgte tid slår hviletiden automatisk fra igen (`TaskState` tilbage til `active`). Manuel "Genoptag"-knap er tilgængelig hele tiden så chauffør kan afslutte hviletid før timer udløber. Den gamle auto-prompt-model (blokerende "Er du stadig på hviletid?"-modal efter 30 min) er fjernet.

**Flow:**
1. Chauffør trykker "Hviletid" på aktiv opgave → interval-picker åbnes
2. Chauffør vælger 15 / 30 / 45 minutter
3. `onPause()` kaldes, nedtælling starter — skærmen viser MM:SS resterende tid
4. Ved udløb: `onStart()` kaldes automatisk — `TaskState` = `active` igen
5. Alternativt: chauffør trykker "Genoptag" manuelt → stopper timer, `onStart()` kaldes

**Forretningsregler:**

| Scenario | Adfærd |
|---|---|
| Timer udløber | Auto-genoptag: `TaskState` → `active`. Hviletid-perioden bevares i timereg. |
| Manuel Genoptag før udløb | Timer cancelles. `TaskState` → `active`. Perioden bevares i timereg. |
| Chauffør afslutter opgaven mens på hviletid | Timer cancelles ved opgave-afslutning. Eksisterende afslut-flow gælder. |

---

### Variant: Aktiv opgave — single-task, start-bekræftelse, baggrund-kørsel (LÅST 2026-06-08, opdateret 2026-06-09)

**Forretningsregel:** En chauffør kan kun have ÉN `active` opgave ad gangen, men kan have FLERE `paused` opgaver. `active` betyder uret kører og tid logges. `paused` betyder uret er frosset — ingen tid logges før chaufføren skifter tilbage. Reglen forhindrer at chaufføren ved et tilfælde dobbelt-starter opgaver og derved får forurenede timer. **GPS er IKKE en del af Fase 1** (se Flow 4 Trin 1 — beslutning 2026-06-08).

**Start-bekræftelse:**
- Når chauffør trykker "Start opgave" vises en blokerende modal:
  - Titel: "Start opgaven?"
  - Beskrivelse: "Når du starter, begynder vi at logge tid for denne opgave."
  - Knap 1 (sekundær): "Annuller"
  - Knap 2 (primær, grøn): "Start opgave"
- Først ved bekræftelse skifter `TaskState` til `active` og time-logging starter.

**Opgave-skift (LÅST 2026-06-09):**
Opgave-skift sker UDELUKKENDE fra opgavelisten (`TaskListScreen`) — IKKE fra `TaskDetailScreen`. Chaufføren kan skifte aktiv opgave ved at trykke "Skift til denne opgave" på enhver opgave-række der ikke allerede er aktiv (pauset eller afsluttet inden for 24 timer).

- Knap-tekst på opgaveliste-kort:
  - Pauset opgave: **"Skift til denne opgave"**
  - Afsluttet opgave (`canReopen` = inden for 24t): **"Skift til denne opgave"**
- Ved tryk vises en pause-warning-modal:
  - Titel: "Aktiv opgave sættes på pause"
  - Body: "Opgave [orderNumber] ([pickup → delivery]) sættes på pause, så du kan arbejde på den valgte opgave. Timeregistrering og vejesedler følger den aktive opgave."
  - Primær CTA: "Skift til denne opgave" → `state[A]` ← `paused`, `state[B]` ← `active`, A's ur fryser, B's ur starter (eller fortsætter hvis B var pauset)
  - Sekundær: "Annuller"
- Hvis der IKKE er en aktiv opgave på skift-tidspunktet (alle pausede eller completed), åbner den valgte opgave direkte uden modal — chaufføren skal stadig konfirmere på TaskDetailScreen via "Start opgave"-modalen.
- A's pause-periode mellem skift fra A → B → tilbage til A tæller IKKE som pause-tid i timereg (A's ur er frosset i mellemtiden).

**Pille-farver i opgavelisten (LÅST 2026-06-09):**

| Tilstand | Pille-tekst | Baggrund | Tekstfarve |
|---|---|---|---|
| `active` | "I gang" | `bg-green` (`#2E9E65`) | `text-white` |
| `paused` | "Pauset" | `bg-yellow` (`#FEEE32`) | `text-deep-teal` |
| `completed` | "Afsluttet" | `bg-error` (`#B42828`) | `text-white` |

Farverne signalerer status hierarkisk: grøn = i gang (aktiv akkumulering), gul = mellem-tilstand (frosset, kan genoptages), rød = lukket. Hviletid (sub-state inden for `active`) påvirker IKKE pille-farven — opgaven viser stadig "I gang" pille selvom hviletids-segment kører.

**Produkt-præsentation i chauffør-UI (LÅST 2026-06-09):**
Produktnavnet (`produktnavn`, fx "GAB 0/16", "SMA 11S 8mm") er det PRIMÆRE identifikationsfelt for chaufføren. Recept-koden (`recept_nr`, fx "82101H", "94101A") er en SEKUNDÆR reference til fabrikkens recept-system. Visuel rangordning på tværs af alle chauffør-skærme:

- Primær (større, fet, `text-deep-teal`): `produktnavn`
- Sekundær (mindre, `text-text-muted`): `recept_nr`

Gælder: TaskListScreen-kort, TaskDetailScreen-info, DashboardScreen-aktiv-opgave-kort, AnkommetFabrikScreen (vejning), AnkommetUdfoerselsstedScreen, SamlesPaaEnBilScreen og alle vejeseddel-relaterede skærme. Tidligere mønster (recept_nr primær, produktnavn sekundær) er udfaset 2026-06-09.

**Baggrund-kørsel:**
- Når chauffør navigerer væk fra TaskDetailScreen (fx til Beskeder, Timereg, Start-tab) BLIVER opgaven i sin nuværende state (`active` eller `paused`). Den bliver ikke pauset eller stoppet.
- Tid logges som event-timestamps + state-overgange (se Flow 4 Trin 1) — uafhængigt af om appen er i forgrunden eller baggrunden
- GPS er IKKE en del af Fase 1 (besluttet 2026-06-08 — se Flow 4 Trin 1)
- En global "aktiv opgave"-indikator (banner eller badge) skal være synlig på tværs af alle skærme så længe `state = active | paused`, så chauffør ALTID kan navigere tilbage til den aktive opgave med ét tryk.

**Forretningsregler:**

| Scenario | Adfærd |
|---|---|
| Chauffør har aktiv opgave, åbner anden opgave-detalje, trykker Start | Single-task-modal vises. INGEN state-ændring. |
| Chauffør har paused opgave, åbner anden opgave, trykker Start | Single-task-modal vises (paused tæller som aktiv). |
| Chauffør har aktiv opgave, navigerer til andre tabs | Opgave fortsætter `active`. Timestamps + state-overgange logger videre. |
| Chauffør lukker appen mens opgave er aktiv | Opgave forbliver `active` i backend; næste knap-tryk/scan registreres som normal |
| Chauffør har aktiv opgave A, afslutter den, vil starte B | Start-bekræftelses-modal vises på B (normal flow — A er nu `completed`) |
| Chauffør trykker Start opgave, fortryder i modal | INGEN state-ændring, ingen log skrevet |

**Data-konsekvens:**
- `task_logs.started_at` skrives først ved bekræftelse i start-modalen — IKKE ved knap-tryk
- Single-task-constraint enforces på client (UI-modal) OG server (DB-constraint: max én row per `chaufør_id` med `state ∈ {active, paused}` og `completed_at IS NULL`)

**🟡 Fase 2-udvidelser:**
- Native app med background-GPS for præcisions-validering
- Lokal kø + offline-sync af state-changes
- Global "aktiv opgave"-banner med tap-to-return navigation
- Hviletids push-notifikation ved interval-udløb (app i baggrunden)

---

### Variant: "Sidste læs"-frigivelse af overflødige chauffører (LÅST 2026-05-27)

**Trigger:** Når formand allokerer sidste-læs (`er_sidste_laes: true` på en vejeseddel) ELLER systemet automatisk identificerer at `sum(allokerede_tons) >= bestilt_total - bil_kapacitet` for resten af dagen.

**Forretningsregel:**
- Når sidste-læs er allokeret, er N-1 biler overflødige (hvor N er antal allokerede biler for dagen)
- 1 bil holdes **i reserve-buffer** indtil sidste-læs er aflæsset (`status = udlagt`)
- De øvrige `N - 2` biler kan frigives med det samme

**Mekanisme (Fase 1 — verbal, LÅST 2026-06-15):**

Frigivelsen sker IKKE via en digital kanal. Den følger den kanoniske **"Chauffør-afslutning af opgave"-variant** (se ovenfor):

```
1. Sidste-læs identificeres (sum_allokeret >= bestilt − bil_kapacitet)
   → Formand beslutter SELV hvilke biler der er overflødige
     (reserve-buffer: hold 1 bil tilbage til sidste-læs er udlagt)
2. Formand RINGER hver overflødig chauffør:
   "Du behøver ikke køre mere i dag — vi er dækket ift. transport."
3. Chauffør AFSLUTTER opgaven i chauffør-app'en ("Afslut dag")
4. Vejesedlen skifter til `dag_afsluttet` og vises automatisk i
   formandens "Kørsel"-sektion (Udførsel-tab) med "Dag afsluttet"-badge
```

Formanden får altså bekræftelsen via `dag_afsluttet` i "Kørsel"-sektionen — ikke via push og ikke via en vognmand-bekræftelse. Reserve-bilen frigives på samme måde (formand ringer) når sidste-læs er udlagt.

**Vognmand-notifikation (LÅST 2026-06-19):** Vognmanden får en **"Dag afsluttet"-besked** i vognmand-app'ens Udførsel-mode (samme `dag_afsluttet`-event som chauffør-afslutning/formands-frigivelse). Bilen markeres fri → kan disponeres andetsteds. Se `Docs/Vognmand/Dataudveksling-vognmand.md` § "Udvekslings-model".

**Tidsregistrering / afregning:**
- Chauffør får løn for tid frem til **opgaven afsluttes i app** ("Afslut dag"-tidspunktet)
- For akkord-biler: ingen ekstra betaling for resten af dagen — bilen er ikke længere i loop
- For time-biler: timeregistreringen lukkes ved afslutning (chauffør registrerer "Afsluttet")

**🟡 Fase 2 (fremtidig automatisering — udskudt):** App-driven frigivelse hvor systemet computer-foreslår de overflødige biler (`frigivelses_forslag`-tabel), vognmand bekræfter i en `FrigivelsesModal`, og chauffør får push + auto reserve-frigivelse når sidste-læs er udlagt. Hele dette digitale apparat (push, FrigivelsesModal, frigivelses_forslag, auto-frigivelse) er IKKE Fase 1 — det er erstattet af den verbale model ovenfor. Bevaret her som retning for senere automatisering.

**🟡 ÅBNE SPØRGSMÅL (ved implementering):**
- **Vognmand-notifikation:** ✅ LØST 2026-06-19 — "Dag afsluttet"-besked i vognmand-app'ens Udførsel-mode. Se `Docs/Vognmand/Dataudveksling-vognmand.md`.
- **Reserve-bil-valg:** Hvilken bil holdes i reserve-buffer — sidste i køen (default), tættest på fabrik, eller chauffør-præference?
- **Allerede-på-vej-til-fabrik chauffør:** Hvis en frigivet chauffør allerede har taget næste læs på fabrik → retur-flow trigges (se "Retur-flow for biler i transit ved aflysning").

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

**Cross-app status:** ✅ Implementeret i vognmand-prototyper. ✅ Implementeret 2026-06-09 på Formand-siden — se "Formand-UI: Aflys-celle i ordredetalje-rækken" nedenfor.

#### Formand-UI: Aflys-celle i ordredetalje-rækken (LÅST 2026-06-09)

**Placering:** 5. celle i ordredetalje-grid'et (`makeOrdredetaljerCard` i `OrdrePlanScreen.tsx`) ved siden af "Mængde tons / Produkt / Tykkelse / Fabrik". Grid'et er `grid-cols-5` i begge varianter (enkelt-ordre + samleordre-tabs). (LÅST 2026-06-23: "Udføres i perioden"-cellen fjernet fra ordredetaljer — redundant med top-datovælger-sektionen.)

Aflys-cellen vises i **både Planlægning-mode og Udførsel-mode** — samme `makeOrdredetaljerCard`-factory bruges, men kaldes med `cardMode='udfoersel'` + `udfoerselSelectedDate` i Udførsel.

**Komponent:** `AflysningCell` i samme fil.

**Tilstande:**

| Tilstand | Vises | Knap |
|---|---|---|
| Ingen dage aflyst | Næste ikke-aflyste dag (`formatLongDate`) som primær tekst | Rød "Aflys dag"-knap med `CloudRain`-ikon |
| 1+ dage aflyst, flere tilbage | Liste af aflyste dage (rød tekst) + årsag i `(pga. [reason-label])` | Rød "Aflys flere"-knap (kun Planlægning-mode) |
| Alle dage aflyst | Liste af aflyste dage | Ingen knap |
| Udførsel-mode + valgt dag ER aflyst | Den valgte dato + "Aflyst pga. [reason]"-pille | Ingen knap (man kan kun aflyse fra Planlægning) |

**Picker-flow:**
- Klik på "Aflys dag"/"Aflys flere" åbner inline picker i samme celle (ikke modal).
- Picker indeholder: dato-`<select>` (kun ikke-aflyste dage) + 4 årsag-knapper fra `CANCEL_REASONS` (`Regn`, `Frost`, `Underlag`, `Andet`) + "Fortryd"-knap.
- Udførsel-mode: default-valgt dato i pickeren = `selectedDate` (den dag formanden ser på). Planlægning-mode: default = første ikke-aflyste dag.
- Klik på en årsag = aflysning af valgt dato med valgt årsag (kalder `cancelDay(productId, dayId, reason)`).
- Multi-aflysning understøttes: pickeren lukker efter aflysning, cellen re-rendrer, og man kan klikke "Aflys flere" igen.

**Aflysnings-signal:** Aflyste dage vises KUN på dato-pillerne i top-datovælgeren ("Udføres i perioden"-sektionen). "Udføres i perioden"-cellen i ordredetalje-grid'et er fjernet (LÅST 2026-06-23), så rød sub-tekst med aflyste dage i den celle eksisterer ikke længere.

**Tokens:** `bg-bad/10`, `text-bad`, `font-inter text-xs font-semibold`, `px-xs py-xxs rounded-md`. Default celle-struktur (`p-sm flex flex-col h-full min-h-[96px]`) matcher de andre celler.

**Fjernet samme dato:** Den gamle X-knap (lille kryds øverst-til-højre på hver dags `ProductBoxV2`) er fjernet — aflysning sker nu udelukkende via aflys-cellen. Gammel kode bevares i `apps/formand/src/prototypes/ordre-plan/v1/ProductBoxV2.v1.tsx`.

#### Aflysnings-markeringer i formand-app (retning LÅST 2026-06-15)

En aflysning rammer flere skærme. Konsistent markering med kanonisk `StatusPill kind='aflyst'` (rød) anvendes:

1. **Dagsoversigt + Gantt** — rød "Aflyst"-badge på dagen/ordren. Gantt UDEN årsag (kun "Aflyst"); Dagsoversigt må vise "Aflyst pga. [årsag]".
2. **Bilbestilling-tabel (Udførsel)** — er den viste dag aflyst: rækker markeres "Aflyst" + "Send opgave som SMS"-knap **disabled** (ingen opgave-udsendelse for en aflyst dag).
3. **Dato-piller ("Udføres i perioden")** — aflyste dage får rød aflyst-styling (matcher passeret-dag-mønsteret).
4. **Status-bokse (Udførsel)** — afspejler at dagen er aflyst.

Status: retning låst, implementering udestår.

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

---

**Variant: Chauffør-initieret returlæs på pladsen (🟡 PROTOTYPE-OPLÆG 2026-06-19)**

Adskilt trigger fra ovenstående vejr-aflysning (som er formand-initieret, dag-niveau) og fra Flow 10 (fabrik-initieret tredjeparts-grus). Her beslutter **chaufføren selv på udførselsstedet** at køre rest-asfalt / ikke-udlagt last retur til afsender-fabrik.

- **Trigger:** Chauffør opretter returlæs via knap på **"Ankommet til plads"-skærmen** (under "Bekræft aflæsning") og — for nem genfinding — via en knap på **Order details**. Begge åbner samme modal: *"Ønsker du at oprette returlæs?"*
- **Mekanik = identisk med vejr-aflysning-returlæs ovenfor:** spejlet vejeflow — bilen **indvejes fuld** og **udvejes tom** (modsat normal: indvej tom → udvej fuld). Selve flow-strukturen (scan → bekræft → scan-udvejning → kvittering) er uændret, kun retningen vendes.
- **Vejebilag:** Vi får **også her et vejebilag — blot med negativt fortegn** (`tons: − rest-tons`), kobles til original vejeseddel via `relateret_vejeseddel_id`, oprindelig bevares (audit-trail). Samme `type: 'retur-laesset'`-konvention som vejr-aflysning-returlæs.
- **Multiprodukt-variant:** Hvis bilen har flere produkter på der skal retur, **vendes multiprodukt-flowet** (jf. `SamlesPaaEnBilScreen`): chauffør aflæsser pr. silo/produkt og får ét negativt vejebilag pr. produkt.
- **Afregningsregel (NY, LÅST 2026-06-19):**
  - **Timeløn → timeløn:** chauffør på timeløn afregnes normalt for køretiden (ud + retur).
  - **Akkord → kun ventetid:** chauffør på akkord får **ikke** akkord for returlæsset (det blev jo aldrig udlagt) — kun **ventetid** afregnes.
- **Status:** Prototype-oplæg bygges i `chauffeur-web` (enkelt + multiprodukt) tilgængeligt fra tools-/prototyper-menuen. UI-placering (Ankommet-til-plads + Order details) under iteration — visuelt sprog matcher eksisterende vejeflow-skærme. **TODO: Erstat mock med Supabase når klar** — negativt vejebilag skrives til `plan_vejebilag` på samme måde som vejr-aflysning-returen.
- **Mødetid vises ikke ved returlæs (LÅST 2026-06-23):** Mødetid på fabrik (`moedetid_fabrik`) er **kun relevant for første læs** — det læs der bærer mødetiden fra bilbestillingen (se Trin 8 / Mødetid på fabrik). Loop-læs (bilen kører frem og tilbage mellem fabrik og plads) og returlæs har **ingen mødetid** og viser den ikke i UI. `TaskDetailScreen` skjuler mødetid-blokken når `returlaesOprettet === true`.

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

### 🟢 LÅST 2026-06-23 — ETAPE-BEVIDST model (planlægningsenhed: ORDRE → ETAPE)

**Reframe:** Materiel planlægges nu **pr. ETAPE**, ikke pr. ordre. En ordre udføres i etaper (fx 3 dage i marts + 3 dage i juli); mellem etaper bruges samme materiel af en anden ordre. **PLAN sender kun planlagte datoer; kommende etaper planlægges først ~2 dage før.** Den **fulde, kanoniske model er dokumenteret i `.claude/docs/MATERIEL_FLOW.md`** (sektion "🟢 LÅST 2026-06-23 — ETAPE-BEVIDST materiel-model") — herunder kun det der ændrer dette flows trin:

- **Tre lag:** (1) **Pakken** = holdets faste SPECIFIKKE enheder (samme anlægsnr hver etape) + tilføjet materiel — **bæres automatisk videre** mellem etaper, genvælges ikke; tilføjet materiel bæres OGSÅ videre, men kan fjernes pr. etape. (2) **Transport-planen** (afhentning · dato · tid · aflæsning) er **PR. ETAPE — nulstilles hver etape**; datamodel-skift: ét transport-sæt pr. enhed pr. ETAPE (før: pr. ordre). (3) **Frigivelse er PASSIV** — ordren gør intet; maskinens placering spores i PLAN, næste ordres formand henter den via afhentnings-prefill ("seneste aflæsning i PLAN" — eksisterende mekanisme, jf. Trin 1).
- **Etape-detektion:** appen **klynger ordrens faktisk-planlagte dage**. **Weekend-/helligdags-huller bryder IKKE en etape**; et hul på **flere på-hinanden-følgende hverdage = ny etape**. Klyngnings-input = de reelle PLAN-dage (jf. Flow 1 Trin 1 "Udføres i perioden = kun PLAN-planlagte dage").
- **Kun-første-dag-planlægning:** materiel planlægges **KUN etapens første udførselsdag** (transport sigter mod ankomst til dag 1). Øvrige dage: ingen planlægning, materiellet står på pladsen.
- **Fire UX-tilstande** (materiel-sektion reagerer på `selectedPlanDate`): (1) **Etapens første dag/lead-up** → fuld transport-planlægning, afhentning prefyldt fra PLAN-placering. (2) **Midt i etape** → read-only "Materiel på pladsen (ankom [dato])". (3) **Dvale-gap mellem etaper** → "Frigivet — næste etape ikke planlagt endnu". (4) **Næste etape netop planlagt i PLAN** → "Planlæg materiel-transport for etape [N]"-opgave: pakken for-listet, transport blank; **AUTO-opret blanke transport-pladser** for pakkens enheder + **notifikation** ("Planlæg materiel for etape N") for discoverability.
- **Forudsætning uden for app-scope:** knaphedskonflikt (specifik maskine ikke ledig til næste etape) er et PLAN/disponerings-anliggende — appen antager maskinen er tilbage.
- **Cross-app:** vognmand modtager transport **pr. etape**. **🟡 ÅBENT (ikke låst):** bør materiel-SMS-konsolidering skifte fra 1 SMS/chauffør/ORDRE (Trin 4b) til **1 SMS/chauffør/ETAPE**? Afventer bekræftelse — lås ikke uden kunde-input.

### Trin 0 — Holdpakke fra PLAN
**App:** formand
**Datakilde:** PLAN
**Indhold:** Holdpakken indeholder de mennesker der skal bemande opgaven OG det materiel der skal benyttes.
**Forretningsregel:** Formand kan tilføje yderligere mennesker og materiel ud over holdpakken. Materiel tilføjes via en **"Tilføj materiel"-knap** der åbner et katalog over **fælles standard Colas-materiel hentet fra PLAN** (varenummer + beskrivelse + default transport-type). Det valgte materiel tilføjes nederst i materiel-listen (`status: ikke-planlagt`) og skal udfyldes med samme transport-felter som de øvrige enheder (afhentning, klar/lokation-tider, aflæsning, kommentar til chauffør — jf. Trin 1). Disse tilføjelser skal skrives RETUR til PLAN.
**Note:** Under "Materiel"-sektionen vises KUN materiel (ikke mennesker — de håndteres i en separat sektion).

### Trin 1 — Formand planlægger transport per materiel-enhed
**App:** formand
**Komponent:** Materiel-sektion på ordre (ikke bygget) — én linje per materiel-enhed fra holdpakken
**Handling:** For hver materiel-enhed udfylder formanden:
- **Afhentningssted** — felter: **vejnavn**, **nummer** og **postnummer**. Materiellet kommer fra en ANDEN lokation end udførselsstedet. **Prefyldes automatisk (LÅST 2026-06-15, udvidet 2026-06-25):** da hvert materiel har et **unikt varenummer** (= `anlaegsnr`) og hører til et **hold**, slås materiellets **seneste aflæsning** op i PLAN, og felterne prefyldes med dén adresse **+ pin-koordinaterne** (materiellet står hvor det sidst blev afleveret). **Findes ingen seneste aflæsning i PLAN → felterne + kort er BLANKE** — ingen fallback til udførselsstedet. Formand kan altid udfylde/overskrive. **Persistens (LÅST 2026-06-25):** når formanden sætter kort-markering + adresse på **aflæsningsstedet**, gemmes **både adresse og koordinater på varenummeret** i databasen → dén bliver næste disponerings afhentnings-prefill. Persistensen er hele mekanismen bag den passive frigivelse (jf. LÅST-boks ovenfor, lag 3).
- **Klar til afhentning** — opdelt i **to felter: dato + tid** (LÅST 2026-06-15). Hvornår materiellet er klar til at blive hentet.
- **Skal være på lokation** — opdelt i **to felter: dato + tid** (LÅST 2026-06-15). Hvornår materiellet skal være ankommet på udførselsstedet.
- **Aflæsningssted + postnummer:** Adresse på udførselssted. **Sættes også som pin på Google-kort (LÅST 2026-06-25)** — koordinaterne (`lat`/`lng`) gemmes sammen med adressen, fordi chauffør-webappen navigerer efter pin'en, ikke kun teksten. *(Kort-input genindføres i materiellevering — den tidligere stub blev fjernet 2026-06-24 under etape-omskrivningen.)*
- **Kommentar til chauffør:** Fri-tekst med transport-/håndteringsinstruktioner (samme felt-koncept som asfalt-flow, jf. Flow 1 Trin 1). *(Tidligere "Kommentar til vognmand" — rettet 2026-06-15.)*

**Flere materiel — arv af aflæsningssted (LÅST 2026-06-15):** Er der 2+ materiel-enheder, spørges hver **efterfølgende** enhed: *"Samme aflæsningssted som [1. materiel]?"* (Ja/Nej):
- **Ja** → enheden **arver aflæsningssted fra det FØRSTE materiel** (vises som "Arver aflæsningssted fra [1. materiel]" + nulstil-link).
- **Nej** (samt det første materiel selv) → manuelt aflæsningssted-felt.
Referencen er **altid det 1. materiel** (`firstResource`) — ikke det umiddelbart foregående. (Gælder kun aflæsningssted; afhentning prefyldes individuelt pr. enhed fra PLAN.)

**Google-kortudsnit (LÅST 2026-06-15, opdateret 2026-06-25 — pin er nu INPUT, ikke kun zoom):** To separate kort. Formanden kan **sætte/justere en pin** på begge, og koordinaterne (`lat`/`lng`) gemmes med adressen:
- **Afhentnings-kort:** prefyldes med pin på materiellets **seneste kendte placering** (fra PLAN, samme som afhentningsfelterne). Er placeringen blank/ukendt → intet zoom/pin endnu.
- **Aflæsnings-kort:** prefyldes med pin på **udførselsstedets adresse**; formanden kan flytte pin'en til den præcise aflæsningsplacering. **Pin'ens koordinater persisteres på varenummeret** og bliver materiellets afhentnings-prefill næste gang det disponeres. Koordinaterne flyder til chauffør-webappens Google Maps-link (Trin 4b).
- 🟡 **Genindføres:** kort-input i formandens materiellevering blev fjernet 2026-06-24 under etape-omskrivningen og skal genopbygges som **reel koordinat-input** (ikke den tidligere `bg-[#E8EFF5]`-stub — skal tokeniseres).

**Handling:** Formand trykker "Gem transport" per materiel-enhed.
**Skriver til:** `orders.materiel[]` med `{ afhentning_vejnavn, afhentning_nummer, afhentning_postnummer, klar_dato, klar_tid, lokation_dato, lokation_tid, aflæsningssted, aflæsningspostnummer, kommentar_til_chauffoer }`

**Badge-lifecycle (materiel) — afventer → bekræftet (LÅST 2026-06-15):** Parallelt med asfalt-kørsel (Flow 1 Trin 2) har **hver materiel-enhed** sin egen vognmand-pille i formandens Planlægning → Materiel-sektion (`VognmandBekraeftelseBadge`, samme stil som Asfalt kørsel):
- Pillen sættes til gult **"Sendt til vognmand"** så snart formanden trykker **"Gem transport"** på materiel-enheden (`orders.materiel[].gemt = true`) — så snart formanden gemmer/sender, ikke først når vognmanden har åbnet den. (label omdøbt 2026-06-23: tidl. "Afventer vognmand")
- Når vognmandens retur-data ankommer (`orders.materiel[].confirmed_transport` populeres → `bekraeftet_af_vognmand = true`, jf. Trin 3-4), skifter pillen til grønt **"Bekræftet af vognmand"** — **samtidig** med at materiel-bilen vises i Udførsel under **"Biler & afregning"** med "Kørt materiel"-badge (Trin 5). Samme retur-data driver pille + Udførsel-visning på én gang.

**Tilstande pr. materiel-enhed:**
- `gemt = true` + `bekraeftet_af_vognmand = false` → 🟡 "Sendt til vognmand" (label omdøbt 2026-06-23: tidl. "Afventer vognmand")
- `bekraeftet_af_vognmand = true` → 🟢 "Bekræftet af vognmand" + materiel-bil i Udførsel "Biler & afregning"

**Granularitets-forskel fra asfalt:** Materiel-pillen er **pr. materiel-enhed** (én pille pr. linje), modsat asfalt hvor pillen er **pr. dag**. En ordre kan derfor have flere materiel-enheder i forskellige tilstande samtidig (nogle afventer, andre bekræftet).

### Trin 2 — Bestilling bliver synlig hos vognmand
**App:** vognmand
**Komponent:** Materiel-sektion under `DisponeringsView` (ikke bygget) — vises som ekstra sektion UNDER asfalt-disponeringen på samme ordre
**Viser:** Alle gemte transport-data fra Trin 1 (anlæg, beskrivelse, afhentning, aflæsning)
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

### Trin 4b — Chauffør modtager + udfører materiel-opgave (LÅST 2026-06-04, flow-design 2026-06-15)
**App:** chauffeur-web (aktiv prototype) / chauffeur (RN senere)
**Komponent:** Materiel-variant af ordre-detalje-siden — **kopi/tilpasning af `TaskDetailScreen`**, visuelt adskilt fra asfalt-udførsel. Genbruger samme skærm-arkitektur (overlay, scroll-indhold, fast action bar) + design-tokens.
**Forretningsforståelse:** En materiel-opgave er en **transport-opgave**, ikke en læsse-opgave — intet indvejning/udvejning/asfalt-flow.

**Én kørsel = én chauffør med 1..n materiel-enheder (LÅST 2026-06-15):** Vognmanden afgør selv hvor meget der kan pakkes på en bil og kan sætte **samme chauffør på flere materiel** — det er ÉN kørsel. **Antagelse: optræder en chauffør flere gange på ordrens materiel, er det én samlet kørsel.** Chaufføren ser dermed ÉN opgave der rummer alle hans materiel-enheder for ordren.

**Afhentnings-rækkefølge (LÅST 2026-06-15):** Skal materiel hentes flere steder, ordnes afhentningerne efter **tidspunkt på dagen** (klar-tid) — tidligste først.

**Skærmen viser:**
- **Materiel-liste** — de enhed(er) kørslen rummer (beskrivelse + anlægsnr/varenummer). Erstatter asfalt-flowets ton/produkt-metrics.
- **Afhentninger (1..n, ordnet efter tidspunkt):** pr. stop — **afhentningssted** (adresse) + **tidspunkt**. Har formanden sat en **prik/adresse** → vis et **Google Maps-link** til den (IKKE et indlejret kort i appen). Er der ingen → vis intet kort/link.
- **Aflæsningssted(er):** udførselssted(er) — adresse. **Har formanden sat en pin på aflæsningsstedet (LÅST 2026-06-25) → vis et Google Maps-link med pin'ens `lat`/`lng`** (`maps/search?query=<lat>,<lng>`), så chaufføren ser den **eksakte** aflæsningslokation, ikke kun en adresse-tekst. Samme behandling som afhentning. Er der ingen pin → kun adresse, intet link.
- **Kommentar til chauffør** (samme felt som asfalt, Flow 1 Trin 1).
- **Kontakt:** formand (navn + tlf).
**Læser:** `orders.materiel[]` (afhentning vejnavn/nummer/postnr + klar-tid + **afhentnings-pin-koordinat**, aflæsning adresse + **aflæsnings-pin-koordinat**, beskrivelse, anlægsnr/varenummer, kommentar_til_chauffoer) + `confirmed_transport`, grupperet pr. chauffør-tlf. Begge pin-koordinater driver hver sit Google Maps-link.

**Udførsels-state (forenklet — LÅST 2026-06-15):** `idle → i gang → afsluttet`. INGEN pause/hviletid (modsat asfalt):
1. **"Start opgave"** (som asfalt) → opgaven går `i gang`.
2. Chaufføren henter materiellet (rækkefølge styret af tidspunkt) — **ingen afhentnings-bekræftelse undervejs**.
3. **"Materiel leveret"-knap pr. aflæsningssted (LÅST 2026-06-15):** chaufføren bekræfter levering når et aflæsningssted er klaret (markerer leveret → driver "Afleveret"-pillen hos formand, Trin 5). Går alt til samme udførselssted = én knap; er det delt = én knap pr. sted. Bekræftet levering vises som centreret **"Afleveret"-pille** (uden flueben).
4. **"Afslut opgave"-knap (LÅST 2026-06-15):** opgaven afsluttes EKSPLICIT via en "Afslut opgave"-knap i bunden (som de øvrige flows, med bekræftelses-modal) → `afsluttet`. Ikke auto-afslut når alle leverancer er bekræftet — chaufføren afslutter selv.

**Cross-app effekt:** Hver "Materiel leveret"-bekræftelse → formandens Udførsel får en **"Afleveret"-pille** pr. aflæsningssted (se Trin 5). *(Prototype: mock-state pr. app; produktion: cross-app via PLAN/backend.)*

**Krav:** Touch targets ≥ 44×44px (udendørs brug i bil).
**Issue:** #16 (chauffør-prototype)

**SMS-afsendelse — ÉN SMS pr. chauffør pr. ordre (LÅST 2026-06-15):** Flere materiel-enheder kan placeres på samme bil, og samme chauffør kan stå på FLERE materiel-linjer (jf. Trin 3: "samme bil kan dække flere materiel-linjer"). Der må kun sendes **ÉN SMS til chaufføren** — den konsoliderer alle de materiel-enheder han transporterer for ordren (én besked der lister alle enheder), ikke én SMS pr. enhed.
- **Konsolideringsnøgle:** `confirmed_transport.chauffoer_tlf` inden for ordrens `materiel[]`. Flere materiel-linjer med samme chauffør-tlf → én SMS.
- **Granularitet adskiller sig fra asfalt:** Asfalt-kørsel = én SMS pr. chauffør pr. **dag** (loop-kørsel, mange læs — Flow 1 Trin 7b). Materiel = én SMS pr. chauffør pr. **ordre** (diskret transport-opgave med fast afhentning/aflæsning).
- **Debounce + bekræftelses-pille:** Samme afsendelses-timing (2 timer initial / 10 min sen erstatning) og "Sendt til chauffør"-pille (formand på materiel-bil-rækken, Trin 5 + vognmand — noteret, ikke bygget) som Flow 1 Trin 7b. Genbrug mekanikken.
- **Én "Send nu"-knap pr. chauffør (LÅST 2026-06-19):** Den manuelle straks-/gensend-knap er ligesom SMS'en konsolideret — kører samme chauffør FLERE materiel-enheder (samme `chauffoer_tlf`), vises der KUN ÉN "Send nu"-knap for ham (ikke én pr. enhed), og ét klik sender den ene konsoliderede SMS. UI'et tjekker `chauffoer_tlf` på tværs af ordrens `materiel[]` og grupperer knap + pille pr. chauffør. **🟡 UI bygges nu i formand-prototypen** (var tidligere ikke dækket for materiel — kun asfalt havde Send-nu-knappen).

**Asfalt + materiel samme dag = TO adskilte SMS (LÅST 2026-06-15):** Hvis samme chauffør har BÅDE asfalt-loop-kørsel OG en materiel-transport samme dag, sendes **to adskilte SMS** — én asfalt-dags-SMS (Flow 1 Trin 7b) + én materiel-ordre-SMS (denne regel). De konsolideres IKKE, fordi det er to forskellige opgavetyper med hvert sit deep-link/kontekst.

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
- **"Afleveret"-pille pr. aflæsningssted (LÅST 2026-06-15):** Når chaufføren trykker "Materiel leveret" på et aflæsningssted (Trin 4b), får den tilsvarende levering en grøn **"Afleveret"-pille** i formandens Udførsel. Er kørslen delt på flere aflæsningssteder, vises en pille pr. sted, og rækken er først fuldt afleveret når alle steder er bekræftet. *(Prototype: mock-state; produktion: cross-app via PLAN/backend.)*
**Læser:** `orders.materiel[].bekraeftet_af_vognmand`, `orders.materiel[].confirmed_transport`, `orders.materiel[].leveret` (pr. aflæsningssted), grupperer på `chauffoer_navn + reg_nr`

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
**Trigger:** Chauffør trykker manuelt "Ankommet til fabrik" på opgaven (eller Vejning-tab i bottom menubar)

### Trin 1 — Manuel ankomst aktiverer velkomst (LÅST 2026-06-08 — geofence droppet)
**App:** chauffeur (React Native + chauffeur-web prototype)
**Komponent:** `AnkommetFabrikScreen` (sub-screen: `ankomst`)
**Trigger:** Chauffør trykker manuel knap **"Ankommet til fabrik"** i adresse-boksen på TaskDetailScreen (eller Vejning-tab i bottom menubar som global fallback)
**Viser:** "Velkommen til {fabrik.navn}" + instruktioner (kør til vægt → scan vægtens QR-kode)
**Skriver til:** `task_timestamps.ankomst_fabrik = now()`, `task_logs.ankomst_kilde = 'manuel'`

**Beslutning 2026-06-08 — geofence droppet som ankomst-trigger:**
- Geofencing er teknisk upålidelig (GPS-drift, indendørs/silo-skygge, batteri-spar-mode, varierende geofence-API på iOS vs. Android) og kan efterlade chauffør strandet hvis event ikke firer
- Manuel ankomst-knap er enkel, deterministisk, og kræver ikke GPS-tilladelse for grundflowet
- Vejeflow er stadig låst til QR-scan på vejeterminal (LÅST 2026-05-29) — manuel ankomst åbner BLOT velkomst-/scan-UI'et, ikke selve vejningen
- `task_logs.ankomst_kilde`-feltet beholdes (Fase 2): hvis vi senere tilføjer GPS-validation, kan vi differentiere `manuel` vs. `gps_valideret_manuel`

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

**🟡 Vejnings-broker (bonus-info 2026-06-12, Carsten):** Når chauffør-appen scanner QR på fabrikkens vægt, benytter **Danvægt en broker** (integrations-/message-broker) til at få vejnings-transaktionen hurtigere igennem — dvs. transaktionen kvitteres straks og videresendes/behandles **asynkront** mod de øvrige systemer (typisk via kø) i stedet for et synkront round-trip mens chaufføren venter ved vægten. Præcist indhold uafklaret — afklar med Thomas/Danvægt: hvilken broker, hvad kvitteres tilbage til app'en, latency, og forholdet til MAUS/DataHub (se Mellemnote øverst i dette dok).

**🔵 Vejnings-integration — design & udviklings-organisering (arbejdsgrundlag, 2026-06-12)**

> **GitHub Epic:** [#57 — EPIC: Vejnings-integration (QR + broker + Danvægt/MAUS)](https://github.com/carsten-cmyk/Colas_app/issues/57) — kort overblik + kunde-sign-off-anker; dette afsnit er den kanoniske detalje Epic'en henviser til.
>
> Dokumenteret her for at sikre at QR-scan + vejnings-binding **bliver bygget** — enten som del af chauffør-app-udviklingen eller som et separat integrationsspor der kobles ind når kontrakten er låst. **Anbefaling: separat spor bag en defineret seam** (se nederst).

**Kerneproblem:** Vægten måler vægt — den ved ikke hvem/hvilken ordre der står på den. QR-scanningen er **bindingen** mellem den fysiske vejning og den digitale identitet (chauffør → ordre → produkt). Alt nedenfor handler om at gøre den binding pålidelig, hurtig og robust mod fejl.

**Koreografi (ende-til-ende):**
1. Bil kører på vejebro / hen til QR-punkt
2. Chauffør (logget ind) trykker "scan QR"
3. App læser QR → `terminal_id`; validerer terminalens fabrik == ordrens fabrik
4. App sender til vejesystem via broker: `{ scan_id, chauffoer_tlf, order_id, aktivt_produkt, terminal_id, tidspunkt }`
5. Broker kvitterer straks → app: "vægt klar / venter"
6. Vejesystem binder: næste vejning på `terminal_id` → dette `scan_id`; svarer med produkt-instruktion (silo, produkt) ← **vægten er gatekeeper** (jf. Flow 1 multi-produkt)
7. Indvejning (tara) → lastning → udvejning (lastet) → netto tons
8. Vejesystem danner vejeseddel → broker → vores system; vi kobler via `scan_id`/`order_id` → opdaterer vejeseddel + status
9. App viser bekræftelse (tons, tid) → chauffør kører til plads

**Designhensyn der SKAL adresseres:**
- **Broker:** kvitterings-semantik (modtaget vs. vejning-færdig), latency (chauffør venter ved vægten), **idempotens** (`scan_id` → ingen dobbelt-vejning ved retry), leveringsgaranti (vejning må aldrig tabes/dubleres — afregning afhænger af den), fejl-fallback (broker/vægt/app nede).
- **QR:** auth kommer fra **app-sessionen**, ikke fra QR'en (statisk pr. terminal = ikke en hemmelighed). QR siger kun *hvilken vægt*. Validér terminal mod ordre.
- **🔴 Kritisk princip — vejning må ALDRIG blokeres af appen:** vægtområdet har ofte dårligt signal. Den fysiske vejning skal kunne ske uanset app-forbindelse; bindingen er best-effort + **afstembar** bagefter. Afkobl "vej altid" fra "bind til chauffør/ordre".
- **Edge-cases:** to biler scanner samtidig (kø/ordering); bil på vægt uden scan (forældreløs vejning → afstemning); scan uden bil / forkert bil (tids-vindue-mismatch); to vejninger pr. besøg (kombineret last — FF åbent punkt #36); netværk falder midt i sekvens (idempotens + status-polling).

**Udviklings-organisering (Carstens spørgsmål, 2026-06-12):** Vejnings-integrationen afhænger af eksterne parter (Danvægt/Thomas + MAUS/DataHub) hvis kontrakt **endnu ikke er låst**. Derfor:
- Chauffør-appen bygges mod en **defineret vejnings-adapter (seam/interface)** — fx `useVejning()` / `scanQr()` med **mock-implementering først**.
- Den **reelle integration (QR → broker → Danvægt/MAUS)** er et **separat udviklingsspor** der kobles ind bag samme interface når kontrakten er låst.
- Konsekvens: app-udviklingen blokeres ikke af integrationen, og integrationen kan modnes parallelt. **🟡 Beslutning at bekræfte:** separat spor + seam (anbefalet) vs. integreret i app-build.

**Asks til Danvægt/Thomas (før implementation):** broker-kontrakt (send/retur + ack + latency); korrelations-mekanisme (`scan_id`-echo vs. terminal+tids-vindue); leveringsgaranti + dedup; offline-adfærd ved vægt; gatekeeper-svar (produkt-instruktion + format); test-miljø. **+ afstemning MAUS ↔ Danvægt** (vejedata-sti: vægt → Danvægt → broker → MAUS/DataHub → vores DB).

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

### Variant: Manuel ankomst (PRIMÆR mekanisme, LÅST 2026-06-08 — opdateret fra fallback til primær samme dag)

**Forretningsregel (opdateret 2026-06-08):** Manuel ankomst-knap er nu **eneste** trigger til at åbne velkomst-/scan-UI for både fabrik og udførselssted. Geofencing er droppet pga. upålidelighed (se Flow 3 Trin 1 — "Beslutning 2026-06-08").

**To veje til at registrere ankomst:**

| Kilde | Trigger | Placering |
|---|---|---|
| **Manuel knap i adresse-boks** (primær) | Chauffør trykker "Ankommet til fabrik" / "Ankommet til plads" i adresse-boksen på TaskDetailScreen | Kontekstuel — kobler ankomst til den specifikke opgave |
| **Vejning-tab i menubaren** (genvej) | Chauffør trykker Vejning-tab nederst | Genvej til scan-flowet for den aktive opgave — uden at skulle navigere |

**UI-placering:**
- **Adresse-boks-knap:** Outline-stil (deep-teal border, transparent baggrund), label "Ankommet til fabrik" / "Ankommet til plads". Knappen forbliver synlig — chauffør kan vende tilbage og scanne QR senere hvis flowet afbrydes (state styres af QR-scan, ikke knap-tryk).
- **Vejning-tab:** Tab nederst i menubar (erstatter Beskeder i Fase 1). Ikon: Scale fra lucide-react. **Vejning-tab linker ALTID til den aktive opgaves vejnings-flow** — chauffør skal ALDRIG navigere selv for at finde den. Detaljeret logik nedenfor.

**Vejning-tab — adfærd per scenario (LÅST 2026-06-08):**

| Chauffør-tilstand | Hvad Vejning-tab åbner |
|---|---|
| Har ÉN aktiv opgave (`state ∈ {active, paused}`) | `AnkommetFabrikScreen` for **den aktive opgave** — chauffør lander direkte i det relevante step af scan-flowet (afhænger af hvor langt han er nået: ankomst → scan-vaegt → bekraeft → scan-udvejning → udvejet-bekraeft). |
| Har ÉN igangværende men ikke-aktiv opgave (`state = idle`) som er den eneste planlagte for i dag | `AnkommetFabrikScreen` for den opgave — som om chauffør lige har trykt "Ankommet til fabrik" |
| Har flere planlagte opgaver i dag, ingen aktiv | Lille modal/list: "Hvilken ordre er du på vej til at veje?" — chauffør vælger, derefter åbnes scan-flowet for valgt ordre |
| Ingen opgaver i dag | Vejning-tab er disabled (grå) eller viser tom-state "Du har ingen opgaver i dag" |

**Rationale:** Chauffør står ved vægten og skal scanne. Han skal IKKE først navigere til dashboard, finde sin opgave, åbne den, scrolle, og trykke "Ankommet til fabrik". Vejning-tab er en SHORTCUT der altid lander ham præcis hvor han skal scanne — uanset hvilken state opgaven er i. Single-task-constraint sikrer at "den aktive opgave" altid er entydig hvis han har startet en.

**Forretningsregler:**

| Scenario | Adfærd |
|---|---|
| Chauffør trykker "Ankommet til fabrik" | velkomst-UI åbnes ovenpå TaskDetailScreen. `task_timestamps.ankomst_fabrik = now()`, `ankomst_kilde = 'manuel'`. |
| Chauffør lukker velkomst-UI uden at scanne QR | Ingen vejning startet. Chauffør kan trykke knappen igen senere. `ankomst_fabrik` skrives KUN ved første tryk (idempotent). |
| Chauffør trykker manuel-knap men er faktisk ikke fremme | UI accepterer. Selve vejningen kan først starte når QR-koden på vægten scannes — det er fysisk validering. |
| Chauffør glemmer at trykke knappen | Han kommer til vægten uden velkomst-UI. Vejning kan stadig startes via Vejning-tab. |

**Data-konsekvens:**
- `task_timestamps.ankomst_fabrik` / `ankomst_udfoerselssted` — skrives ved knap-tryk (idempotent, kun første gang)
- `task_logs.ankomst_kilde: 'manuel'` — i Fase 1 er der KUN denne værdi. Feltet beholdes for Fase 2-udvidelser (`gps_valideret_manuel` hvis GPS-validation tilføjes)
- Formand ser INTET special-badge i Udførelse — manuel er normalen, ikke en undtagelse

**Vejeflow — to QR-scans pr. ordre (LÅST 2026-06-08):**
QR-scan på vejeterminal er stadig eneste måde at aktivere selve vejningen. I det nye flow scanner chauffør **to gange**:

1. **Indvejning (tom bil)** — chauffør scanner vægtens QR-kode efter han har trykt "Ankommet til fabrik". Vægtsystem registrerer tom-vægt.
2. **Udvejning (lastet bil)** — chauffør scanner vægtens QR-kode igen efter lastning. Vægtsystem beregner netto-vægt = udvejet - indvejet.

Produkt-QR (på silo) scannes ÉN gang mellem de to vej-scans for at bekræfte rigtige produkt.

**UI-constraint:** Alle elementer (banner + knapper) skal være inden for iPhone-rammens højde (852px) uden scroll-overflow.

**🟡 Fase 2-udvidelser:**
- GPS-validering: hvis GPS virker, tjek at chauffør er inden for fornuftig radius før accept (silent — kun logges, ikke blokerer)
- Statistik på "manuel ankomst uden efterfølgende QR-scan" — kan indikere chauffør glemte at scanne

---

## Flow 4: Timeregistrering og afregning (asfalt-biler + materiel)

**Status:** Planlagt — UI under planlægning (denne iteration)
**Trigger:** Chauffør afslutter dagens kørsel
**Involverede apps:** chauffeur → formand → vognmand

### Vejeseddel-vægte: Tara · Brutto · Netto — IDENTISK format på tværs af apps (🟢 LÅST 2026-06-22)
Hver vejeseddel-linje viser **tre vægte for bilen**: **Tara · Brutto · Netto** (brutto = tara + netto). Vises **begge steder i nøjagtigt samme format**:
- **Formand:** Afregning → "Bil- og tonsafregning" — pr. vejeseddel-linje.
- **Vognmand:** Afregning → expand under chauffør — pr. vejeseddel-linje.

**Kanonisk format (skal holdes identisk begge steder):** `Tara {x} · Brutto {y} · Netto {z} Tons` — hvert tal 1 decimal, dansk komma; enheden "Tons" én gang til sidst. Datakilde (mål): `plan_vejebilag` (tara/brutto/netto pr. vejning). Tara = bilens tomvægt, Brutto = vægt med last, Netto = udlagt mængde.

**Vejesedlerne er DE SAMME på tværs af Udførsel/Kørsel og Afregning (🟢 LÅST 2026-06-22):** Vejesedlerne i Udførsel → **"Kørsel"**-sektionen og i Afregning → **"Bil- og tonsafregning"** er ÉT OG SAMME datasæt (samme `plan_vejebilag`-kilde) — blot vist i forskellige kontekster. Hver vejeseddel bærer **vejeseddel-nummer (felt `vejeseddelNr`)** + tara/brutto/netto. Vejeseddel-nummeret vises som **det første element til venstre** på vejeseddel-rækken i afregningen (fx `#1042801`), konsistent med `VejeseddelRow` i Kørsel. Felt-navnet `vejeseddelNr` holdes **ens på tværs** (camelCase) — ikke to navne for samme begreb.

### Afregningsform pr. BILTYPE — blandede former + form-bevidst fordeling (🟢 LÅST 2026-06-22)

**Baggrund:** Afregningsform (akkord/time) blev tidligere valgt **pr. dag/vognmand** (ét valg for alle biler). Det flyttes til **pr. biltype**.

**Valg-hierarki:**
- Toggle ved **vognmanden bevares** og fungerer som **default** for dagen.
- Hver **biltype** har sin egen toggle der **arver** vognmand-defaulten men kan **overstyres** → fx "7 Aks" = akkord, "Sideudlægger" = time, samme dag/vognmand.
- Hver bils `afregning_type` udledes af **dens biltypes** valg.
- **Uændrede per-bil overrides til time:** 1,5-times-reglen (`aflæsset_efter_1_5t`) og materiel-biler (`er_materiel_bil`) — ligger ovenpå biltype-valget.

**Konsekvens — blandede former i samme dag/vognmand er normalen.** Afregnings-expanderen er allerede per-bil og form-bevidst (time: køretimer+ventetid+pause; akkord: tons fra vejesedler+ventetid). NYT krav:
- **Adskilte subtotaler pr. form** i afregnings-overblikket — vises **hver for sig**, aldrig summeret til ét tal, og med **separat total for HVER komponent**:
  - **Akkord:** `{N} biler · {tons} Tons · Ventetid {timer} Timer`
  - **Time:** `{M} biler · Køretimer {t} · Ventetid {t} · Hviletid {t} Timer`
  - **Navngivning (🟢 LÅST 2026-06-22):** time-afregningens tredje komponent hedder **Hviletid** (ikke "Pause" — feltet `ChauffoerAfregning.pause` omdøbt til `hviletid`).

**Form-bevidst fordeling (multilæs / samleordre, flere ordrer):**
- **Akkord-bil** der spænder over flere ordrer: fordel **tons OG ventetid** pr. ordre. Ventetid-fordelings-felt placeres **til højre for "Fordel tons"**.
- **Time-bil** på samleordre: fordel **køretimer OG ventetid** pr. ordre.
- **Fordelingen er MANUEL — vognmanden fordeler selv** (ingen auto-proportional pre-fordeling fra formand). I prototypen er felterne manuelle input.

**Build-rækkefølge:** Bygges **først på formandens afregning**; spejles til **vognmandens afregning** (expand pr. chauffør) senere — format/model holdes identisk på tværs (jf. vejeseddel-vægte ovenfor).

**🟡 ÅBENT → retning (kunde-spørgsmål, 2026-06-22):** Det formanden sender i Planlægning er en **forespørgsel** — afregningsformen pr. biltype er ikke garanteret i de biler vognmanden disponerer retur. **Foreslået løsning (Carsten):** Afregningsformen kan **vælges/bekræftes pr. BEKRÆFTET BIL i Afregningen** — dér kendes den faktiske bil/chauffør. Dermed:
- **Planlægnings-toggle** (pr. biltype) = forespørgsel/**default**.
- **Afregnings-toggle** (pr. bekræftet bil) = **autoritativ endelig form** (override af default).
- Materiel + 1,5-times-reglen forbliver tvungne overrides til time uanset.
- Endelig aftale-model (fast pr. vognmand-aftale / pr. chauffør-bil / forhandlet pr. ordre) afklares stadig med kunden — men per-bil-valget i Afregningen gør modellen robust uanset svaret.

### Trin 0 — Formand ser status-overblik i toppen af Udførelse
**App:** formand
**Komponent:** **3 status-bokse i toppen af `UdfoerselContent`** (samme dimensioner som produkt-bokse i Planlægning: `flex-col gap-xxxs items-start min-w-[150px] px-sm py-xs rounded-xl border` + 4 stacked tekst-linjer)

**Boks 1 — Biler:**
- Label "BILER" (uppercase)
- Status: `Bekræftet` (grøn fill `bg-good-bg border-good/30`) eller `Afventer` (neutral `bg-surface border-hairline`)
- Sub-status: "Vognmand har bekræftet" / "Vognmand ikke bekræftet"
- Tæller: `N biler`
- **State:** `vognmandBekraeftelse` (truthy = bekræftet)

**Bekræftet detalje i Biler-boksen (LÅST 2026-06-13):** Når vognmanden har bekræftet, viser boksen **vognmandens bekræftede data** — ikke formandens ønske. Da bekræftet kan afvige fra ønsket (jf. ønskeliste-princippet i Flow 1 Trin 1), udvides boksen til:
- **Antal bekræftet pr. biltype** som overskrift — fx `2× 6-aks · 2× kærre bekræftet` (udledt af `confirmed_vehicles[]` grupperet på `bil_type`).
- **De biler der har bekræftet tidspunkt**, listet eksplicit med reg.nr + ankomst — fx `XE 32816 · ankomst 06:30` — **maks. de 3 første** (`confirmed_vehicles[]` sorteret på `ankomst_plads_tid`/`moedetid_fabrik`, `.slice(0, 3)`). Er der flere end 3, vises diskret `+N flere`.
- Boksen skal **udvides** (bredere/højere end de øvrige) for at rumme dette — de øvrige bokse beholder kompakt 4-linjers format.
- **Datakilde:** `orders.asfalt_koersel[].confirmed_vehicles[]` (Trin 4). Falder tilbage til ønske-tal (`biler[]`) i Planlægning / før bekræftelse.

**Boks 2 — Materiel transport** (placeret UNDER/ved siden af Biler — relateret koncept):
- Label "MATERIEL TRANSPORT"
- Status: `Bekræftet` (grøn) eller `Afventer` (neutral)
- Tæller: `N enheder`
- **State:** `vognmandMaterielBekraeftelse.items.length > 0`
- **Note:** Selvom materiel-transport-biler nu vises i samme "Biler & afregning"-sektion som asfalt-biler, har materiel-transport sin egen vognmand-bekræftelses-status og derfor sin egen boks.

**Bekræftet detalje i Materiel transport-boksen (LÅST 2026-06-13):** Samme princip som Biler-boksen — materiel-bestillingen er et ønske, vognmandens bekræftede transport kan afvige. Når bekræftet, viser boksen:
- **Antal bekræftet pr. transport-type** (fx blokvogn/trailer) som overskrift.
- **De bekræftede transport-biler med tidspunkt**, reg.nr + ankomst, **maks. de 3 første** (`+N flere` ved overskydende).
- **Datakilde:** vognmandens bekræftede materiel-disponering (Flow 2 Trin 3-4). Falder tilbage til ønske-tal før bekræftelse.

**Boks 3 — Forundersøgelse:**
- Label "FORUNDERSØGELSE"
- Status: `Gennemført` (grøn fill) eller `Ikke foretaget` (**rød fill** `bg-bad-bg border-bad/30 text-bad`)
- Sub-status: "Underlag vurderet" / "Mangler vurdering"
- Detalje: "Tilfredsstillende" / "Ikke tilfredsstillende" (når gennemført)
- **State:** `underlaegsType && tilfredsstillende !== null && tilfredsstillende !== undefined`

**Note:** Bokse-rækken er det første formanden ser i Udførelse — giver hurtigt overblik over hvad der mangler at blive bekræftet eller foretaget. Når en boks bliver grøn er den respektive sektion afsluttet.

### Trin 1 — Chauffør registrerer kørsel og pauser (LÅST 2026-06-08 — GPS droppet samme dag)
**App:** chauffeur
**Komponent:** Automatisk via **event-timestamps** (knap-tryk + QR-scans) + `TaskState`-overgange i TaskDetailScreen. **GPS er IKKE en del af Fase 1.**

**Beslutning 2026-06-08 — GPS droppet:**
- **Teknisk:** Web Geolocation API virker IKKE når tabben er backgrounded eller telefonens skærm er slukket — iOS Safari suspenderer JS-eksekvering aggressivt. PWA hjælper kun marginalt. Real background-location er en native-app-funktion (Background Location iOS, Foreground Service Android).
- **Forretningsmæssigt:** Vores Fase 1 mål er en web-prototype der kan virke som produktion. Native app er Fase 2.
- **Konsekvens:** Vi udleder kørsel/ventetid fra event-timestamps i stedet for live-position. Det dækker 90% af time-registreringens behov.

**Event-timestamps der danner grundlag for time-beregning:**

| Event | Kilde | Trigger |
|---|---|---|
| `ankomst_fabrik` | "Ankommet til fabrik"-knap (adresseboks) | Manuel knap-tryk |
| `indvejning_tom` | "Scan vægtens QR kode" → "Simuler scan" | QR-scan på vejeterminal |
| `udvejning_lastet` | "Scan QR kode for udvejning" → "Simuler scan" | QR-scan på vejeterminal |
| `ankomst_udfoerselssted` | "Ankommet til plads"-knap (adresseboks) | Manuel knap-tryk |
| `aflaesning_start` | "Start aflæsning"-knap på pladsen 🟡 *(KNAP MANGLER — se nedenfor)* | Manuel knap-tryk |
| `aflaesning_slut` | "Aflæsning færdig"-knap 🟡 *(KNAP MANGLER)* | Manuel knap-tryk |
| `pause_start` / `pause_slut` | Hviletid-knap / Genoptag-knap | Hviletids-segment åbnes/lukkes (TaskState forbliver `active`) |
| `opgave_afsluttet` | "Afslut opgave"-knap | Manuel knap-tryk |

**Felter beregnet automatisk fra timestamps:**

| Felt | Beregning | Bemærkning |
|---|---|---|
| `fabrikstid_minutter` | `udvejning_lastet - indvejning_tom` | Lastning + evt. kø |
| `koeretid_til_plads_minutter` | `ankomst_udfoerselssted - udvejning_lastet` | Ren kørsel fra fabrik til plads |
| `ventetid_paa_plads_minutter` | `aflaesning_start - ankomst_udfoerselssted` | Vent på sjak/aflæsning kan begynde |
| `aflaesning_minutter` | `aflaesning_slut - aflaesning_start` | Selve aflæsningen |
| `koeretid_retur_minutter` | `next_indvejning_tom - aflaesning_slut` (eller `opgave_afsluttet`) | Returkørsel |
| `pause_minutter` | sum af `(pause_slut - pause_start)`-intervaller | Manuelle pauser |

**Ventetid-udledning (regel for kø/forsinkelse):**

- **På fabrik:** Hvis `fabrikstid_minutter > 15` minutter, så er de overskydende minutter ventetid (kø ved vejen, fabrik-forsinkelse). Normal lastetid ≈ 10-15 min.
- **På plads:** Hvis `ventetid_paa_plads_minutter > 5` minutter, er det allerede ventetid pr. definition (sjakket var ikke klar). Tærskel kan justeres.
- Formand ser disse som specificerede tids-poster i afregnings-expanderen og kan godkende eller justere.

🟡 **Manglende knapper på udførselssted (LÅST 2026-06-08):**
For at kunne udlede tid på pladsen skal vi tilføje to knapper i adresse-boksen på TaskDetailScreen (eller på en udførselsplads-sub-screen tilsvarende fabrik-scan-flowet):

1. **"Start aflæsning"** — vises efter chauffør har trykt "Ankommet til plads". Erstatter sig selv med:
2. **"Aflæsning færdig"** — vises efter Start aflæsning er trykt. Når trykt → opgaven kan afsluttes (eller chauffør kan starte næste returkørsel).

Begge knapper opfører sig som "Ankommet til plads"-knappen: outline-stil, full-width i adresseboks, trykker tilbage til scroll-content (ikke ny screen). Spejler fabrik-flowet hvor scan-vægt + scan-udvejning markerer start/slut for lastning.

**Skriver til:** `task_timestamps.{ankomst_fabrik, indvejning_tom, udvejning_lastet, ankomst_udfoerselssted, aflaesning_start, aflaesning_slut, opgave_afsluttet}`, `task_pause_log[]`

**Editable TimeRegistrationScreen (LÅST 2026-06-09):** Viser de beregnede felter (Kørsel, Ventetid, Hviletid) som liste. Chauffør KAN redigere hver kategori med "Rediger"-blyant-knap. Edit-modalen kræver:
- Timer + minutter (input-felter)
- Årsag (dropdown: GPS-fejl, Ventetid fejlregistreret, Glemt hviletid, Teknisk fejl, Andet)
- Hvis Årsag = "Andet" → fritekst-felt
- Modificerede rækker markeres med ` *` efter kategorinavnet

Formand modtager både rå-værdier (auto-beregnet fra events) og chauffør-redigerede værdier, og godkender/afviser i Udførelse-view. Edit-flowet sikrer at chauffør kan rette åbenlyse fejl (glemt hviletid-knap, GPS-glitch i Fase 2) uden at vente på formand-godkendelse. **Note:** Tidligere "read-only" regel (LÅST 2026-06-08) er erstattet af denne — beslutning 2026-06-09 fordi prototype-flowet allerede tilbyder edit og formand-review-loopet håndterer fejl effektivt nok.

**Note om Fase 2 (GPS-tilføjelse):** Når vi senere bygger native app, KAN GPS tilføjes som ekstra præcisions-lag: validere at chauffør faktisk var ved fabrik/plads ved knap-tryk, auto-detektere ventetid uden manuelt knap-tryk, ETA-baseret routing. Men Fase 1 fungerer fuldt ud uden.

**Note:** Tons-data registreres IKKE af chaufføren — de kommer fra `plan_vejebilag`-tabellen, som fabrikken/vejebilags-systemet skriver til hver gang chauffør henter asfalt. Ved akkord-afregning **joiner** formand-hooket på `plan_vejebilag` for at summere `tons` per regnr per dato. Tons ligger IKKE i `time_registreringer`.

### Trin 2 — Chauffør afslutter dag + sender afregning
**App:** chauffeur
**Komponent:** TimeRegistrationScreen (afsluttes ved sidste "Afslut opgave"-tryk)
**Handling:** Chauffør gennemgår dagens timer, tilføjer evt. kommentar, trykker "Send til formand"
**Skriver til:** `time_registreringer` (én række per chauffør per dag) med `{ kørsel_minutter, ventetid_minutter, pause_minutter?, chauffør_kommentar, godkendt_af_formand = null, status: 'afsendt' }`
**Note:** `tons_koert` skrives IKKE her — tons-data ligger i `plan_vejebilag` og join'es ind når formand åbner afregningen. **Hviletid-feltet** (tidl. "Pause" i afregnings-expanderen — omdøbt 2026-06-22; jf. terminologi-skellet hviletid vs opgave-pause i Flow 1) udfyldes kun ved asfalt-bil (ikke materiel).

### Trin 2b — Chauffør ser og retter afsluttet timeregistrering (LÅST 2026-06-08)
**App:** chauffeur
**Komponent:** TimeRegistrationScreen i `reviewMode`
**Trigger:** Chauffør åbner Timereg-tab → tapper "Se timeregistrering"-knap på en AFSLUTTET opgave-række

**Forretningsregel:** Når en chauffør har afsendt timeregistrering for en opgave, kan han stadig åbne den fra Timereg-tab for at se og rette indtil formand har godkendt den. Den er ikke "låst" før formand sætter `godkendt_af_formand = true`.

**Flow:**

```
Timereg-tab → afsluttet opgave-række → "Se timeregistrering"-knap
   ↓
TimeRegistrationScreen (reviewMode)
   - Read-only visning af afsendte tider
   - Bund-knap: "Ret tidsregistrering"
   ↓ chauffør trykker "Ret tidsregistrering"
Edit-tilstand (inde i samme screen)
   - Inputs bliver editable
   - Bund-knapper: "Annuller" + "Gem og send til formand"
   ↓ chauffør trykker "Gem og send til formand"
   - `time_registreringer.status = 'afsendt'` (nulstillet)
   - `time_registreringer.rettet_af_chauffoer_at = now()` 
   - Formand ser opdateret række i sin Udførelse-visning med "Rettet"-badge
```

**Forretningsregler:**

| Scenario | Adfærd |
|---|---|
| Chauffør åbner ikke-afsluttet opgave fra Opgaver-tab | Normal `TimeRegistrationScreen` (uden reviewMode) — viser live status, ingen "Ret"-knap |
| Chauffør åbner afsluttet opgave fra Timereg-tab via "Se timeregistrering" | `reviewMode = true` — read-only + "Ret tidsregistrering"-knap |
| Chauffør retter og sender igen | Formand ser "Rettet 2026-06-08"-badge ved siden af opgaven i sin Udførelse-visning |
| Formand har allerede godkendt timeregistrering | "Ret tidsregistrering"-knap er disabled (eller skjult). Tooltip/badge: "Godkendt — kan ikke rettes" |
| Chauffør forsøger at rette efter godkendt | UI accepterer ikke — disabled-knap. Hvis fejl skal rettes, ringer chauffør til formand som genåbner afregningen i formand-app (se Flow 4 Trin 5b) |

**Data-konsekvens:**
- `time_registreringer.rettet_af_chauffoer_at: timestamp | null` — nyt felt
- Hvis `rettet_af_chauffoer_at IS NOT NULL`: vises som "Rettet"-badge i formand-Udførelse
- Godkendt-status (`godkendt_af_formand = true`) blokerer chauffør-redigering

**🟡 Fase 2-udvidelser:**
- Audit-log af alle rettelser med før/efter-værdier
- Push-notifikation til formand når chauffør retter efter første afsendelse
- Tærskelværdier for hvor stor afvigelse der må rettes uden formand-bekræftelse

---

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
  - Asfalt-bil time-afregning → Køretimer / Ventetid / Hviletid
  - Asfalt-bil akkord → Tons kørt / Ventetid
  - **Materiel-bil (badge "Kørt materiel") → ALTID time-afregning, kun Timer + Ventetid (INGEN hviletid)**
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

### Trin 5a — Auto-godkendelse af akkord uden ventetid (LÅST 2026-06-19)
**App:** formand
**Komponent:** `AfregningContent` / Bil- og tonsafregning
**Forretningsregel:** En **akkord-afregning uden ventetid** auto-godkendes uden formand-klik. Begrundelse: ved akkord kommer tons objektivt fra vejesedlerne (`plan_vejebilag`), og kørsel + hviletid dækkes implicit af tons-raten. Når der **ikke er ventetid** (`ventetid === 0` / ikke angivet), er der **intet for formanden at vurdere manuelt** — afregningen er fuldt bestemt af vejesedlerne og kan godkendes automatisk.

**Betingelser (ALLE skal være opfyldt):**
- `effectiveType === 'akkord'` — ægte akkord, IKKE tvunget til `time` via 1,5-times-reglen (`aflæsset_efter_1_5t`) eller materiel-bil (`er_materiel_bil`).
- `ventetid` er `0` eller ikke angivet.
- Tons er endelige — ingen uafklaret multilæs-fordeling for bilen (auto-godkend må ikke låse forkerte tons).

**Skriver til:** Samme felter som Trin 5 (`godkendt_af_formand = true`, `godkendt_tidspunkt = now()`) + markør `auto_godkendt = true`.

**UI-skift:** Badge viser **"Afregning auto-godkendt"** (adskilt fra manuelt "Afregning godkendt" så formanden kan se at den ikke krævede handling). Formand kan stadig genåbne (Trin 5b).

**Reaktivt:** Tilføjer formanden ventetid > 0 efter genåbning, falder rækken ud af auto-godkendt og kræver manuel godkendelse. Manuelt godkendte rækker (`auto_godkendt = false`) auto-genåbnes aldrig.

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

### Trin 5c — Formand "Afslut dag" → dagen sendes til PLAN (LÅST 2026-06-19)
**App:** formand
**Komponent:** Grøn **"Afslut dag"-knap** i bunden af Afregning-moden (under Timeafregningen) — `AfregningContent` i `OrdrePlanScreen`.
**Forretningsregel — send til PLAN er gated på "Afslut dag":** Afregnings-/dagsdata sendes **IKKE løbende** til PLAN. **Først når formanden trykker "Afslut dag"** — og ALLE påkrævede felter er udfyldt — sendes dagen til PLAN (via service-konto, jf. integrations-arkitektur øverst).
**Validering ved klik (alt skal være udfyldt):**
- **Bil- og tonsafregning (Timeafregning)** — alle chauffør-timer udfyldt (jf. `afregning_type`)
- **Materielafregning** — alle materiel-timer udfyldt
- **KS-rapporteringer** — påkrævede skemaer (A3/A4/MKS afhængigt af krav) skal udfyldes. **🟡 Under udvikling:** KS-skemaerne har endnu ikke en completion-state (uncontrolled inputs), så indtil felterne er klar indgår KS **ikke** i den hårde validering — i stedet vises en **husker** ("Husk KS-rapportering") i Afslut dag-flowet. Når KS-felterne er færdige, skal de med i den blokerende validering.
**Mangler noget (bil-og-tons / materiel) →** modal **"Du mangler udfyldelse af …"** der konkret lister de manglende punkter; afsendelse til PLAN **blokeres**.
**Når alt er udfyldt →** dagen markeres **"Afsluttet"** (= sendt til PLAN). En **"Ret"-knap** (genåbn) lader formanden korrigere hvis han har glemt noget; efter Ret skal dagen **afsluttes igen** for at gen-sende.

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
- **Hviletid** — chaufførens lovpligtige hvile (køre-/hviletidsloven)
**Kilde:** `time_registreringer` (samme tabel chaufføren skriver til i Trin 2). Bemærk: datafelt-navnet er `pause_minutter` / `pause` af tekniske historiske grunde, men UI-kategorien hedder **Hviletid** overalt.

**To linjer i visningen:**
| Linje | Indhold |
|---|---|
| Chauffør timer | Kørsel · Ventetid · Hviletid (rå fra chauffør-app) |
| Godkendt af formand | Styret af `afregning_type`: `time` → alle tre · `akkord`/tons → **kun Ventetid** |

**Forretningsregel (time vs. tons):** Chaufføren logger ALTID de samme timer (kørsel/ventetid/hviletid) uanset afregningstype. Ved **akkord/tons** betales per tons, så formanden godkender **kun ventetid** — kørsel + hviletid dækkes implicit af tons-raten. Ved **time** godkendes alle tre.
**Mock:** `apps/vognmand/src/mocks/afregning.ts` (NY) modellerer begge linjer + `afregning_type`. Aligner med `ChauffoerAfregning` (`koretimer`/`ventetid`/`pause` — bemærk teknisk `pause`-felt-navn rummer hviletids-data).
**Adskilt fra Trin 6:** Trin 6 (godkendte afregninger til reklamation/faktura) er en ANDEN side med andet formål. Trin 6b er dag-dokumentation per chauffør.
**Også implementeret i (2026-06-19):** `VognmandKoerselScreen` Afregning-mode (prototype) viser samme regel pr. chauffør pr. dag — `time` → Køretid·Ventetid·Hviletid, `akkord` → kun Ventetid (køretid/hviletid = "—"), Tons for begge. Diff-kolonnen fjernet. Rækken er **ekspanderbar** og viser: (1) timer-sammenligning **Chauffør app vs Formand** (afvigelser markeres diskret), (2) **årsag til ændrede timer** + **chauffør-kommentar** (begge fritekst-felter fra chauffør-app, kan være tomme), (3) chaufførens vejesedler (tidspunkt · produkt · tons).

**Nye chauffør-app-felter (sendes retur til vognmand i afregning):** `aarsag` (chaufførens begrundelse hvis han justerer timer) + `chauffoer_kommentar` (fri kommentar). Begge optional. Kontrakt: `Docs/Vognmand/Dataudveksling-vognmand.md` § "Afregning — felter Colas sender retur".
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
- **A4 "Udlagt antal tons" → Afregning (🟢 LÅST 2026-06-22):** "Udlagt antal tons" registreret pr. produkt/lag i A4-skemaet (`OvrigeOplysningerSkema`) **overføres til Afregning → Udlægning → Registrer udlægning**, hvor det vises som referencetekst **"{tons} tons registreret i 4A"** ud for kvm/tons. Vises **kun ud for det produkt der er valgt** (følger Afregningens `aktivtProduktId`). Prototype: mock pr. produkt i `perProduktUdlaegning`; mål: ægte transfer fra A4-feltets per-produkt-værdi.
- **Tillægsareal (m²) → Afregning (🟢 LÅST 2026-06-22):** På samme måde vises en note **"{m²} m² tillægsareal registreret i 4A"** ud for kvm/tons i Registrer udlægning — men **kun hvis der faktisk er udlagt tillægsareal** (> 0) for det valgte produkt. Står ved siden af "tons registreret i 4A"-noten.
- **Udlægningsareal (m²) → Afregning (🟢 LÅST 2026-06-22):** Ligeledes overføres det udlagte areal fra 4A → note **"{m²} m² areal registreret i 4A"**, placeret under de to øvrige. Alle **tre referencer (tons · areal · tillægsareal)** grupperes samlet inde i Registrer udlægning-boksen hvor tons/areal angives — pr. valgt produkt.
- **A3 (ØVR. 3.a) er en SELVSTÆNDIG blanket ≠ A4 (🟢 LÅST 2026-06-22):** 3a og 4a er to FORSKELLIGE PLAN-blanketter (separate komponenter — `OvrigeOplysningerSkema3a` vs `OvrigeOplysningerSkema`). **3a-felter** (1:1 kopi fra PLAN): Strækning · **Bygherre (præudfyldes med ordrens kundenavn)** · **"Strækning kontrolleret"** (Morgen/Aften Kl. + Nej) · Produktoplysninger (produkt-navigation) · sektion "Udfyldes af EL/DL": Bygherretilsyn + Prøve udtaget ved anlæg (tilsyn) + Komprimeringskontrol bestilt + Laboratoriekontrol bestilt (alle Ja/Nej-toggles) + Bemærkninger. **4a-felter:** Stationering · Udlagt antal tons · Udlægningsareal (l×b, live-beregner) · Tillægsareal · Areal i alt · Gennemsnitsforbrug · Skitse vedlagt (toggle) · Bemærkninger. **Begge:** produkt-navigation med **default lag 1 valgt** + "Vælg produkt"-label; Gem-knap gul→grøn.
- **3a "Materialer"-undersektion (🟢 LÅST 2026-06-23):** 3a indeholder en "Materialer"-undersektion med 4 temperaturmålinger vist som 4 kolonner (grid-cols-4). Pr. måling: Uensartede (Ja/Nej-toggle), °C (tal-input, manuel), Kl (tid-input). **Automatik-model (LÅST 2026-06-23):** tidspunkterne **auto-præudfyldes ved dagens afslutning fra dagens afsluttede læs** med jævnt fordelte intervaller (prototype-seed simulerer aften/nat-udlægning: 20:30 / 22:00 / 00:00 / 03:00), og **kan rettes manuelt af formanden**. **Temperatur indtastes altid manuelt** (måles i marken). Ingen vejeseddel-kolonne på blanketten (kun Uensartede · °C · Kl pr. måling).

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

### Ekstraarbejde — kilde i PLAN, to indgange, gem-notifikation & Afregning-flag (🟢 LÅST 2026-06-22)

- **Kilde/destination i PLAN:** Ekstraarbejde registreres i PLAN's fane **"Ydelser"**. Ekstraarbejde-typerne (dropdown-værdier) kommer herfra, og de registrerede linjer skrives retur hertil. Colas-appen er indtastnings-flade i marken; PLAN ejer ydelses-registret.
- **To indgange, delt liste:** Ekstraarbejde kan tilføjes fra **både** Forundersøgelse **og** MKS-rapportering (Udførsel → KS-rapportering). De deler samme linje-liste (prototype: fælles `ekstraLinjer`-state hejst til `OrdrePlanScreen`-root; mål: `orders.forundersoegelse.ekstraarbejde[]`) — data ender samme sted uanset indgang.
- **Notifikation ved gem:** Når formanden gemmer — **"Gem forundersøgelse"** ELLER **MKS-gem** — OG der er ≥1 ekstraarbejde-linje → `notify_projektleder` udløses (mekanisme TBD: email/in-app/SMS). Gem fra begge skemaer er ligestillet. (Bemærk: i Forundersøgelse er det separate ekstraarbejde-gem fjernet — "Gem forundersøgelse" gemmer også ekstraarbejdet.)
- **Afregning-flag (cross-reference):** Når der ER registreret ekstraarbejde (betinget), vises flaget **"Der er ekstraarbejder under ydelser"** i **Afregning → Udlagt** — både som tekst ved kvm/tons-fremdriften og i et læs-only note-felt. Formål: den der afregner ved at der ligger ekstraarbejde under Ydelser i PLAN (påvirker økonomi/afregning).

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

**OPDATERING 2026-06-09:** "Tons opdateret af Fabrik"-banner ERSTATTET af synlig `EkstraBestillingBox` ved siden af det relevante produkt i Asfaltbestilling-rækken. Boksen viser +N tons + "Bekræftet fabrik"-pille (read-only fra PLAN). Telefon-flow + PLAN-pull-mekanik er uændret.

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
5. Synlig boks i formand-app (OPDATERET 2026-06-09):
   `EkstraBestillingBox` vises ved siden af det relevante produkt
   i Asfaltbestilling-rækken. Boksen viser "+N tons" + produktnavn +
   "Bekræftet kl. HH:MM" + "Bekræftet fabrik"-pille under. Read-only —
   ingen "OK, set"-knap (formand HAR allerede bestilt pr. telefon).
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

- **Formand (OPDATERET 2026-06-09)**: Genintroduceret synlig `EkstraBestillingBox` i Asfaltbestilling-rækken — placeres ved siden af det produkt PLAN-pushet ekstra-bestilling vedrører. Boksen viser KUN delta-mængden ("+N tons") + produktnavn + bekræftelses-tidspunkt. "Bekræftet fabrik"-pille (`StatusPill kind='ekstra-bekraeftet'`) under boksen markerer utvetydigt at det er PLAN-data, ikke formandens bestilling. Read-only — ingen interaktion. Eksisterende `ProductBoxV2` (Forventet/Morgen tons) er uændret og viser stadig **originalt planlagt tonsPlanned** (uden ekstra) — alle DOWNSTREAM-beregninger (Vejesedler-statusbar, Dagsoverblik, Afregning, Ordredetaljer/Mængde tons, kørsels-kapacitet) bruger `getEffectiveTons(d) = d.tonsPlanned + (d.ekstraTons?.tons ?? 0)`.
- **Formand**: ~~Info-banner "Tons opdateret af Fabrik [tidspunkt]" + "OK, set"-knap~~ — **fjernet 2026-06-09**. Den synlige boks ER bekræftelsen, banner var redundant. Banner-rendering bevaret i `apps/formand/src/prototypes/ordre-plan/v1/TonsOpdateretBanner.v1.tsx` som dokumentation.
- **Vognmand**: Ingen ny mekanik. Eksisterende tons-felt opdateres automatisk via samme data-pull-pipeline som al anden ordre-data. Vognmand ser bare nyt antal og handler.
- **Fabrik**: Samme — produktionsplan opdateres via PLAN-pull. Ingen nye notifikationer eller knapper.

**"Send til fabrik"-knappens udvidelse (LÅST 2026-06-03):**

Knappen i `OrdrePlanScreen` Asfaltbestilling-rækken udvides med fabriksnavnet nederst — bottom-aligned, lille font (`text-xxs`). Tekst-hierarki bliver:
```
[Truck-ikon]
Send til fabrik              ← font-poppins text-sm
Bestilling skal ske inden kl 11  ← font-inter text-xxs (permanent deadline-påmindelse)
[mt-auto spacer]
PROD A EAST KØGE PH          ← font-inter text-xxs (ny — bottom-aligned)
```

Fabriksnavnet hentes fra **ordrens tildelte standard-fabrik**. I prototypen hardcodes til "PROD A EAST KØGE PH" (samme værdi som mock-vejesedlerne bruger), eller læses fra `ordre.fabrik` hvis det findes på top-niveau.

**Datamodel-konsekvens (OPDATERET 2026-06-09):**

- `EkstraBestilling`-interface fjernes (uændret fra 2026-06-03)
- `ekstra_bestillinger`-tabel fjernes fra Supabase-skemaet (når relevant) (uændret)
- `ordre.produkter[].tons` forbliver det originalt planlagte tons-felt (uændret)
- ~~`tons_opdateret_af_fabrik?: { tidspunkt: string, dismissed: boolean }`~~ — **fjernet 2026-06-09**
- **NYT 2026-06-09:** `ekstraTons?: { tons: number, bekraeftetAf: 'fabrik', tidspunkt: string }` tilføjes per-dag (`DayPlan.ekstraTons`). Indeholder KUN delta-mængden — ikke totalen. Pushes fra PLAN når fabrik registrerer ekstra-bestillingen.
- **Helper `getEffectiveTons(d) = d.tonsPlanned + (d.ekstraTons?.tons ?? 0)`** bruges i alle downstream-beregninger (Vejesedler, Dagsoverblik, Afregning, Ordredetaljer/Mængde tons, kørsels-kapacitet). Pendant `getEffectiveProductTotalTons(p)` aggregerer på produkt-niveau.

**Samles på en bil — afgrænsning ift. denne ændring:**

"Samles på en bil"-checkbox forbliver **kun på PRODUKTER** (`ProductBoxV2`). Den fjernes fra ekstra-bestilling-konstruktet (som ikke længere findes). Brugs-mønstret er uændret: typisk små ordrer hvor flere produkter hentes på samme bil — trigges multi-produkt-loading-flow i chauffør-appen (9-trins fabrik-script, se `[[project_samles_paa_en_bil_marker]]` og Flow 12).

**🟢 Implementerings-status:** Spec LÅST 2026-06-03 + OPDATERING LÅST 2026-06-09. EkstraBestillingBox + "Bekræftet fabrik"-pille implementeret i `apps/formand/src/prototypes/ordre-plan/OrdrePlanScreen.tsx` (prototype). Banner-rendering arkiveret til `v1/TonsOpdateretBanner.v1.tsx`.

---

### Flow 9c: Bestillings-deadline kl 11 — "for sent"-flow (LÅST 2026-06-18)

**Forretningsregel:** En asfaltbestilling skal sendes til fabrik **inden kl 11 DAGEN FØR udlægningsdagen**, så fabrikken kan planlægge næste-dags produktion. Deadline beregnes relativt til udlægningsdagen (`selectedPlanDate`): `deadline = selectedPlanDate − 1 dag, kl 11:00`.

**For sent ≠ blokeret:** Efter deadline kan bestillingen **fortsat sendes** — den blokeres ikke. Men formanden skal **ringe til fabrikken** for at sikre produktionskapacitet. Systemet automatiserer ikke opkaldet (jf. samme telefon-workaround-princip som ved glemt morgen-bestilling).

**UI-konsekvenser (`OrdrePlanScreen` → Asfaltbestilling-rækken):**

1. **"Send til fabrik"-knappen** viser permanent status-linjen `"Bestilling skal ske inden kl 11"` (erstatter den tidligere `"N bestillinger klar"`-tælling) — fast påmindelse om deadlinen uanset om man er for sent. Disabled-state (intet at sende) viser fortsat `"Intet at sende"`.
2. **Bekræftelses-modalen** (`SendBekraeftelsesModal` / inline `showConfirmSend`) viser conditional brødtekst styret af `bestillingForSent`-flag. Bemærk: modalen vises FØR afsendelse, så teksten er formuleret i fremtid (ikke "er afsendt"):
   - **For sent:** `"Bestillingen er lavet efter kl 11. Du skal derfor ringe til fabrikken for at sikre produktionskapacitet."` — vises i **lys rød advarselsboks** (`bg-bad-bg border-bad/30 text-bad`) for at markere udfordringen tydeligt.
   - **Til tiden:** `"Ordren afsendes til fabrikken nu."` (neutral)
   - Den tidligere lock-tekst ("Når den er afsendt kan morgen tons og forventede tons ikke længere rettes...") er **fjernet**.

**Prototype-note:** `bestillingForSent` er hardkodet `true` i prototypen, så "for sent"-varianten vises pr. default uden tidssimulering. Reel beregning (`nu > deadline`) tilføjes ved Supabase/PLAN-integration.

**🟡 ÅBENT (afklares med kunde):**
- Skal en "for sent"-afsendt bestilling bære et persistent flag (fx `sent_late: true` / `needs_capacity_call`) der følger med til vognmand/fabrik/Asfalttavlen, så de ved at kapacitet ikke er bekræftet?
- Skal deadlinen være konfigurerbar pr. fabrik (forskellige fabrikker kan have forskellige cut-off-tider), eller er kl 11 global?

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

**📝 Ekstra-bestilling-konstrukt fjernet 2026-06-03** (jf. Flow 9b). Dette flow er opdateret 2026-06-09 til kun at gælde produkt-baserede multilæs via samleordre på morgen-niveau.

**LÅST 2026-05-21:** Samleordre og multilæs er DATAMÆSSIGT IDENTISKE — forskellen er kun beslutnings-niveau (morgen vs. drip). Begge bruger samme læs-, vejeseddel- og fordelings-flow.

**Trigger:**
- **Samleordre**: Formand kombinerer 2+ ordrer i Dagsoversigt → alle morgen-bestillinger for de ordrer bliver automatisk multilæs.

### Trin 0A — Samleordre-trigger (morgen, valgfrit)
**App:** formand
**Komponent:** `DagsoversigtScreen`
**Handling:** Formand markerer 2+ ordrer for samme dag via checkbox → "Kombiner"-knap → bekræftelses-modal → samleordre oprettes.
**Skriver til:** `samleordrer` med `{ id, dato, ordre_ids: [a, b], anchor_ordre_id: a }`.
**Hovedordre = anchor (LÅST 2026-06-25):** `anchor_ordre_id` sættes til den **først valgte** ordre (`a`) ved kombineringen. Den vises som **"Hovedordre"**-mærke i Connected Box og bliver liggende hele samleordrens levetid. En ordre der senere tilføjes via "+ Tilføj ordre" bliver **aldrig** hovedordre — anchor ligger fast fra oprettelsen.
**Konsekvens:** ALLE morgen-bestillinger for ordrerne på den dato sættes automatisk som multilæs med anchor + stop-liste fra samleordren.

### Trin 0B — Adskil samleordre (split / fortrydelse) — LÅST 2026-06-25
**App:** formand
**Komponent:** `DagsoversigtScreen` (kun her — split sker samme sted som kombinering)
**Hvorfor:** Formanden skal kunne adskille en samleordre igen — enten fordi han alligevel ikke kan nå begge opgaver på dagen, eller fordi sammenlægningen var en fejl. Tidligere kunne man kun kombinere, ikke splitte.

**Hvem kan trækkes ud (ren-regel):** Kun en **ren** ordre — dvs. en ordre med **0 vejesedler kørt i dag** — kan trækkes ud af samleordren. En ordre med aktivitet markeres **"I gang"** og har ingen fjern-affordance. Dette giver ingen data-konflikt fordi (a) hver vejeseddel allerede bærer sit eget `ordre_nr`, og (b) timer/tons registreres først **sidst på dagen** — altså efter et split ville være sket. Den udtrukne ordre er derfor pr. definition ren.

**Hovedordren kan aldrig trækkes ud** — den er ankeret (`anchor_ordre_id`). For at fjerne alt bruges "Ophæv samleordre".

**To affordances i Connected Box:**
- **"Fjern fra samleordre"** pr. ren, ikke-anchor ordre-række → ordren forlader gruppen og bliver standalone igen.
- **"Ophæv samleordre"** på boksen → splitter alle children på én gang.

**Bil-arv ved opløsning (LÅST 2026-06-25):** Biler er bestilt på **samleordrens eget nummer** (S-1…). Når samleordren ender med kun hovedordren tilbage — uanset om det sker ved at de andre piltes ud (kollaps) ELLER ved "Ophæv samleordre" — opløses samleordren, og **bil-bestillingen overgår til hovedordrens (anchor) nummer**. Én regel begge veje.

**Time-/tons-fordeling:** Sidst på dagen fordeles timer/tons på **de ordrer der er tilbage** i samleordren (kan være flere end anchor).

**Skriver til:** `samleordrer.ordre_ids` (fjern element) — hvis `length < 2` efter fjernelse: slet samleordre-rækken + flyt aktiv bil-bestilling til `anchor_ordre_id`. Standalone-ordren(e) går tilbage til normal `morgen_bestillinger`-flow uden multilæs-flag.

### Trin 1 — Formand ser multilæs-bestilling i Ordre-plan
**App:** formand
**Komponent:** `OrdrePlanScreen` → produkt-bokse (morgen via samleordre)
**Handling:** Produkter på dagen er pre-set som multilæs (auto fra samleordre). Formand justerer tons-fordeling mellem children. Header viser "Samleordre: X + Y".
**Skriver til:** `morgen_bestillinger` med `{ multilaes: true, andre_ordrer: [...], product_id, tons, anchor_ordre_id }`.

### Trin 2 — Formand klikker Send til fabrik
**App:** formand
**Komponent:** `OrdrePlanScreen` → bekræftelses-modal
**Handling:** Bekræft afsendelse.
**Skriver til:** `morgen_bestillinger.sent = true`. Bestillingen dispaches til fabrik OG vognmand.

### Trin 3 — Vognmand modtager bil-bestilling
**App:** vognmand
**Komponent:** `OrdreKort` / `DisponeringsView`
**Viser:** Bil-bestilling med:
  - Produkt + total tons
  - `Multilæs (N stop)`-badge
  - Anchor-udførselssted som rækkefølge #1
  - Komplet stop-liste i ordnet rækkefølge
  - Tons-andel pr. stop (fra formand's morgen-bestilling)
**Læser:** `morgen_bestillinger` JOIN `orders` for stop-adresser.
**Vigtigt:** Read-only på rækkefølgen — vognmand kan IKKE ændre. Formand bestemmer via anchor-valg.

### Trin 4 — Vognmand disponerer bil
**App:** vognmand
**Komponent:** `DisponeringsView`
**Handling:** Tildel bil + chauffør til multilæs-bestilling. Bil-bookningen "arver" hele stop-listen.
**Skriver til:** `morgen_bestillinger.confirmed_vehicle = { reg_nr, chauffoer_navn, tlf, bil_type }`.

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
morgen_bestillinger
├── id
├── ordre_id                          // anchor (for multilæs) eller den ene ordre (for puljelæs)
├── product_id
├── tons (total)
├── multilaes: bool
├── andre_ordrer: ordre_id[]          // hvis multilaes
├── puljelaes: bool                   // hvis flere produkter samme bil til samme ordre (samles-paa-en-bil)
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

**📝 Ekstra-bestilling-konstrukt fjernet 2026-06-03** (jf. Flow 9b). Dette flow er opdateret 2026-06-09 til kun at gælde produkt-baserede "samles på en bil"-markeringer.

**Terminologi-update 2026-05-22:** "Puljelæs" er omdøbt til **"Samles på en bil"** i UI. Datamodel-felter (`puljelaesFlag`, `pulje_laes`) bevares som identifikatorer i database/typer, men UI-tekst bruger den nye terminologi konsekvent.

**Trigger:** Formand sætter "Samles på en bil"-checkbox PÅ ET PRODUKT (`ProductBoxV2`) i Asfaltbestilling-rækken. Markøren betyder: "dette produkts tons skal pakkes på SAMME bil som andre produkter der også er markeret samme dag — samme ordre eller samme samleordre".

**Vigtig forskel fra tidligere model:** Puljelæs var en ordre-niveau-checkbox der pakkede ALLE ordrens produkter på én bil. Nu er det per-produkt. Formanden kan derfor have:
- Originalprodukt A + originalprodukt B på samme bil (klassisk puljelæs-pattern)
- Op til 3 produkter på samme bil hvis bilens kompartmenter tillader det

**Søsterflow til Flow 11 (multilæs/samleordre).** Forskellen er at samles-på-en-bil typisk har 1 destination (én ordre) — eller op til samleordrens stop hvis det er kombineret med samleordre-flow.

### Trin 1 — Formand markerer "Samles på en bil" på produkt
**App:** formand
**Komponent:** `OrdrePlanScreen` → `ProductBoxV2` med "Samles på en bil"-checkbox ON
**Handling:** Toggle "Samles på en bil" ON på 2+ produkter samme dag.
**Skriver til:** Produktet får `puljelaes: true` (på `morgen_bestillinger` ved send-tidspunkt).

### Trin 2 — Formand sender til fabrik
**App:** formand
**Komponent:** `OrdrePlanScreen` → bekræftelses-modal
**Skriver til:** `morgen_bestillinger.sent = true` for de markerede produkter.

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

**Detaljeret fabrik-flow ved manuel ankomst (OPDATERET 2026-06-08 — chauffør-valg):**
Når chauffør trykker "Ankommet til fabrik" på en "Samles på en bil"-task, kører chauffør-appen et struktureret loading-flow med vejning mellem hvert produkt. **Chauffør vælger selv rækkefølgen** — appen tvinger ikke en bestemt sekvens (silo-tilgængelighed eller fabriks-praktiske forhold kan kræve omorganisering).

**Flow-struktur:**

```
1. Velkomst — "Velkommen Jens. Du har 3 produkter at hente på samme bil."
2. Scan vægtens QR (tom) — én vejning før lastning starter
3. Produktvælger — liste over IKKE-lastede produkter på ordren (kun denne dag)
   ↓ chauffør vælger ét produkt
4. Bekræftelse — "Kør til Silo og last [valgt produkt]" + tabel (Silo, Forventet last, Produkt + recept-nr)
5. Scan QR for udvejning — vejning efter valgt produkt er lastet
6. [LOOP] Hvis flere produkter er ikke-lastede → tilbage til Produktvælger (kun viser resterende)
7. Afslut-bekræftelse — "Alle produkter lastet. Kør til udførselssted: [adresse]."
```

Hver vejning (én efter hvert produkt) genererer én vejeseddel pr. produkt. Chauffør behøver ikke holde regnskab med tons selv — produktvælgeren viser forventet tons per produkt, og kun produkter med `bestilt - hentet > 0` er valgbare.

**Forretningsregel — chauffør-valg:**
- Chauffør VÆLGER rækkefølge per silo-tilgængelighed
- Appen forhindrer ikke valg — alle ikke-lastede produkter er tilgængelige
- Hvert valg fjerner produktet fra listen efter scan-udvejning er gennemført
- Hvis chauffør forsøger at gå tilbage efter scan-udvejning (= vejeseddel er udstedt), er valget endeligt — appen viser bekræftelses-modal "Vejning er udstedt, du kan ikke fortryde"

**Læser:** `assigned_tasks` med `samles_paa_en_bil_products[]` (array af produkter med tons) eller fortsat `puljelaes_products[]` som data-felt.

**Sidste-læs-hybrid (LÅST 2026-06-08, special case af Flow 12):**

Når en chauffør på en almindelig single-produkt-ordre når sidste-læs (rest < bilkapacitet, fx 12 t af 34 t kapacitet), kan resten af bil-kapaciteten udnyttes til et ANDET produkt fra samme ordre (eller samme samleordre) som også skal køres samme dag.

**Trigger:** Ved scan af vægtens QR (tom-vejning) på en sidste-læs-ordre tjekker appen om der findes ANDRE produkter på samme ordre/samleordre/dato med `bestilt - hentet > 0`.

**Hvis ja:** Efter scan-vægt vises en modal:
- Titel: "Tag flere produkter med?"
- Beskrivelse: "Du har plads til X t mere på bilen. Vil du tage andre produkter med på samme tur?"
- Knap 1 (sekundær): "Nej, kun [primært produkt]" → fortsætter som single-produkt-flow
- Knap 2 (primær gul): "Ja, vælg flere produkter" → går ind i Samles på en bil-flowet med multi-produkt-loop

**Hvis nej:** Single-produkt-flow fortsætter uændret.

**Anhænger-scenarie:** Hvis chauffør har bil med hænger (kapacitet bil + hænger), kan han laste fx 12 t produkt A på bilen + 22 t produkt B i hængeren. Det ER multi-produkt-flow (Flow 12) — vognmand har bare disponeret en bil med ekstra kapacitet (hænger). Ingen særlig håndtering i chauffør-appen.

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

### ABE-2b: SendBatch → PLAN / Asfalttavlen

**From:** Formand `useAsfaltbestilling.sendAlleForSelectedDate(kommentar)` (UX-flow C1 step 9) — samme trigger som ABE-1/ABE-2.
**To:** PLAN-ekosystem → Asfalttavlen (konsoliderings-visning for fabrik-mester + koordinator). Se introduktion af "Asfalttavlen" i Flow 1 Trin 5c.
**Trigger:** Formand klikker "Send til fabrik" i `SendBekraeftelsesModal` for en `(orderId, selectedPlanDate)` — samme moment hvor `transport_orders`-rows oprettes (jf. ABE-1).

**Payload:** Som udgangspunkt samme felter som ABE-1/ABE-2 (`transport_orders`-row + joins på `recipe_code`, `recipe_name`, `factory_code`, `kommentar`, `samles_paa_en_bil`, `weather_active`), så Asfalttavlen kan vise dagens samlede bestillinger pr. fabrik/ordre. Felterne er allerede listet i ABE-1-tabellen og ABE-2 join-tabellen — duplikeres ikke her.

**🟢 LÅST 2026-06-12 (Carsten):** Asfalttavle-repræsentationen SKAL inkludere **ekstra-bestillinger pr. produkt** (hver i sin egen celle), ikke kun morgen-bestillingen. ⚠️ **Retnings-afstemning til kickoff 15.6:** ekstra tons modelleres pt. som PLAN→Colas push (Flow 9b, `EkstraBestillingBox` read-only). Afklar om ekstra-data allerede ligger i PLAN (så Asfalttavlen blot konsoliderer dem pr. celle) eller om Colas også skal sende dem op. Uanset retning: de skal fremgå **pr. produkt i egen celle** på Asfalttavlen.

🟡 **ÅBENT (LÅST 2026-06-10): konkret payload-format aftales med PLAN-team.** Format-spørgsmål der skal afklares:
- Pull vs. push: hænter Asfalttavlen data via API fra Colas (`GET /asfaltbestillinger?date=...`), eller pusher Colas ved hver send?
- Granularitet: én row pr. `transport_order`, eller aggregeret pr. `(date, order_id)` / pr. `(date, factory_code)`?
- Cancel/cascade-håndtering: skal CancelDay (ABE-5) også sendes til Asfalttavlen, så stakeholders ser at en dag er aflyst? Sandsynligvis ja.
- Multi-produkt + samles-på-en-bil: hvordan markeres når 2-3 produkter pakkes på samme bil? Skal Asfalttavlen vise dem som én "samlet bestilling" eller separate rows?
- Recept-detaljer: skal recipe_code/recipe_name med, eller kun aggregeret tons-tal pr. ordre?

**Receiver-handling (PLAN / Asfalttavlen):** Stakeholders (fabrik-mester, koordinator) får dagens bestillinger samlet visuelt. Read-only fra Colas-siden; PLAN konsoliderer på tværs af flere Colas-formænd + andre datakilder PLAN ejer.

**Cross-reference:**
- **Modsat retning (PLAN → Colas):** PLAN pusher ekstra tons til Colas-apps via Flow 9b (`EkstraBestillingBox`), fabrik-skift via Flow 13, og holdpakke/vejesedler/forundersøgelses-felter via Flow 5/6/7/8. Dataretningen er tovejs — denne ABE-2b dækker kun ud-retningen (Colas → PLAN/Asfalttavlen) for asfaltbestilling.
- Bilbestilling har tilsvarende destination — se Flow 1 Trin 5c.

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

**Payload (aflysnings-notifikation — udvidet 2026-06-15):**

| Felt | Format | Notes |
|---|---|---|
| `day_plan_id` | uuid | Identificerer hvilken bestilling |
| `order_id` | uuid | Stabil ordre-ID (kontekst) |
| `adresse` | string | Udførselssted — kontekst for vognmand |
| `dato` | date | Hvilken dag aflyses (i dag / i morgen / fremtidig) |
| `gaelder_fra` | `'hele_dagen'` \| HH:MM | **Omfang:** `'hele_dagen'` = hele dagen aflyst; HH:MM = resten af dagen fra dette tidspunkt |
| `cancelled` | boolean | true |
| `cancel_reason` | `AflysningsAarsag` | `'regn' \| 'frost' \| 'underlag' \| 'andet'` |
| `cancel_reason_note` | string \| null | Kun ved `'andet'` (afhænger af C-spg C5) |
| `beroerte_biler[]` | array | De af vognmandens disponerede biler aflysningen omfatter. Per bil: `bil_ordre_nr · reg_nr · chauffoer_navn · chauffoer_tlf · frigjort_fra` (HH:MM eller dagsstart) |
| `cancelled_at` | ISO 8601 + TZ | server-genereret |

**Omfang — `gaelder_fra` dækker alle aflysnings-states:**
- **Hele dagen / fremtidig dag aflyst** → `gaelder_fra='hele_dagen'` → alle dagens biler i `beroerte_biler[]` frigjort fra dagsstart
- **Resten af dagen** (mid-day) → `gaelder_fra=HH:MM` → kun biler med resterende arbejde efter HH:MM medtages; biler der allerede har leveret beholder deres udførte del (jf. data-bevarelse, linje 1021-1034)

**Receiver-handling (vognmand):**
1. **Hvis `transport_order` allerede eksisterer for dayId** (allerede sendt):
   - Modtagne `transport_order.status` skal cascade-aflyses (afventer beslutning i C-spg C2 — soft-delete eller separat `cancelled`-flag på row)
   - Notification til vognmand: "Bestilling for [adresse] [dato] er aflyst (årsag: [reason]) — [N] bil(er) frigjort"
   - Hver bil i `beroerte_biler[]` markeres "Frigjort fra [frigjort_fra]" i vognmand-UI → vognmand kan re-allokere bilen til andre opgaver
2. **Hvis `transport_order` IKKE eksisterer endnu** (cancelDay før send):
   - Ingen cross-app effekt — kun lokal opdatering i formand-app

**Bevarelse:** Aflysning sletter ALDRIG allerede registreret timeforbrug/leverede tons — kun fremtidigt planlagt arbejde annulleres. Se data-bevarelse-reglen (linje 1021-1034) + AflysningCell-teksten i formand-UI.

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

**From:** Formand `useAsfaltbestilling.toggleSamlesPaaEnBil(productId, dayId, samles)` (UX-flow C5)
**To:** Vognmand → Disponerings-sektion (→ derefter Chauffør-app via vognmand-disposition)
**Trigger:** Formand toggler "Samles på en bil"-checkbox.

**Payload:**

| Felt | Format | Notes |
|---|---|---|
| `day_plan_id` | uuid | Identifier |
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

Dette er minimum-felter som modtager-apps SKAL kunne læse fra Supabase når `transport_orders` + `day_plans` er populeret:

> 📝 **2026-06-09:** Ekstra-bestilling-tabellen er fjernet (jf. Flow 9b — ekstra tons håndteres nu via PLAN-push). `transport_orders.kind` er kollapset til kun `'morgen'`. Feltet bevares som union-type for fremtidig udvidelse.

```
transport_orders                                  // Source-of-truth for "sendt til fabrik"
  ├── id: uuid
  ├── order_id: uuid                              // FK
  ├── day_plan_id: uuid                           // FK
  ├── kind: 'morgen'                              // kollapset 2026-06-09 (var: 'morgen' | 'ekstra')
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
```

**Cross-app reads:**
- **Vognmand** queryer `transport_orders JOIN day_plans JOIN products JOIN orders` for sin disposition-view
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

## Flow 14: Chauffør kontaktliste — daglig aggregering (LÅST 2026-06-08)

**Status:** Prototype bygges i chauffeur-web (Kontakt-tab i bottom menubar)
**Trigger:** Chauffør åbner Kontakt-tab i bottom menubar
**App:** chauffeur (Fase 2: native), chauffeur-web (Fase 1: prototype)

**Forretningsregel:** Kontakt-tab viser **alle relevante kontaktpersoner og fabrikker** for de opgaver chaufføren skal køre på den aktuelle dag. Listen aggregeres automatisk fra dagens tasks — chauffør behøver IKKE selv at finde kontakter på tværs af opgavekort.

**Kontakt-typer der vises:**

| Rolle | Kilde | Note |
|---|---|---|
| **Formand** | `task.contacts[]` hvor `role = 'Formand'` | Den der har planlagt og styrer ordren. Primær kontakt ved problemer på pladsen. |
| **Sjakbejs** | `task.contacts[]` hvor `role = 'Sjakbejs'` | Holdets leder på pladsen (i sjakket). Chauffør ringer ofte til sjakbejs for praktiske spørgsmål om aflæsning. |
| **Projektleder** | `task.contacts[]` hvor `role = 'Projektleder'` | Vises også (relevant ved større tekniske/scope-spørgsmål). |
| **Fabrik** | `task.locations[0]` (pickup) eller `task.fabrik` | Telefonnummer til fabrikkens vejekontor. Bruges ved problemer ved indvejning/udvejning. |

**Aggregerings-regler:**

1. **Scope:** Listen viser kun kontakter fra opgaver med dato = i dag (uanset state — idle, active, paused, completed). Gårsdagens kontakter forsvinder automatisk.
2. **Deduplikering:** Hvis samme person (samme telefonnummer) optræder på flere opgaver → vises ÉN GANG. Hvis personen har forskellige roller på forskellige opgaver (sjælden, men muligt) → vises med BEGGE roller stacked.
3. **Gruppering:** Rolle-baseret. Rækkefølge: Formand → Sjakbejs → Projektleder → Fabrik. Inden for hver gruppe sorteres alfabetisk på navn.
4. **Synlighed:** Hvis chauffør ikke har opgaver i dag → vis tom-state ("Ingen kontakter i dag — du har ingen opgaver planlagt").

**UI-elementer per kontakt:**
- Navn (Poppins 600, 15px, C.textPrimary)
- Rolle (Inter 12px, C.textMuted) — hvis person har flere roller: "Formand · Sjakbejs"
- Telefonnummer som klikbart `<a href="tel:...">`-link (Inter 14px, C.deepTeal)
- Valgfri thumbnail (40x40 rund, fra `contact.imageUrl` hvis sat)

**Datakilde:**
- I Fase 1 (prototype): aggregeres fra `mockTasks` i chauffeur-web
- I Fase 2 (Supabase): hook'er `useTodaysContacts()` der joiner `tasks` → `task_contacts` → `contacts` filtreret på `task.dato = today` og `task.assigned_chauffoer_id = current_user`
- Fabrik-kontakter join'es separat fra `fabriker`-tabel via `task.pickup.fabrik_id`

**Cross-app effekt:** Ingen — kontaktlisten er læse-kun visning i chauffør-appen. Skriver intet tilbage.

**🟡 Fase 2-udvidelser:**
- Søgning/filter på lange lister (relevant hvis chauffør har 5+ opgaver)
- Tryk-og-hold for hurtig SMS i stedet for opkald
- Markér seneste kontakt øverst ("Senest ringet")

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
  │     ├── anlaegsnr: string                   // unikt varenummer — fra PLAN holdpakke
  │     ├── beskrivelse: string                 // fra PLAN holdpakke
  │     ├── afhentning_vejnavn: string          // prefyldt: seneste aflæsning i PLAN (via varenummer), ellers BLANK (ingen fallback)
  │     ├── afhentning_nummer: string
  │     ├── afhentning_postnummer: string
  │     ├── klar_dato: string                   // YYYY-MM-DD — klar til afhentning
  │     ├── klar_tid: string                    // HH:MM
  │     ├── lokation_dato: string               // YYYY-MM-DD — skal være på lokation
  │     ├── lokation_tid: string                // HH:MM
  │     ├── aflaesningssted: string             // udførselssted
  │     ├── aflaesningspostnummer: string
  │     ├── kommentar_til_chauffoer: string
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

- Chauffør har minimalt login: SMS-OTP ved ny enhed eller token-fornyelse, ellers altid direkte til forside. Bil + konfiguration kommer fra vognmandens disponering — chauffør foretager INGEN bil-valg. Se "Chauffør Login + Dynamisk bil-administration"-sektionen ovenfor
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
- **Distributions-mekanisme til chauffør — LØST 2026-06-15:** Konsolideret dags-SMS pr. chauffør (LINK Mobility) med deep-link til chauffør-webapp. Se Flow 1 Trin 7b + Trin 8. (Erstatter tidligere TBD om push/polling/event.)
- **Holdpakke kommer fra PLAN, men kan udvides af formand** — Tilføjelser (mennesker eller materiel) SKAL skrives retur til PLAN. PLAN er sandhedskilde for ressourceallokering på tværs af afdelinger
- **Holdpakke håndteres under Udførelse via to forskellige registreringer:**
  - **Mennesker (holdet):** Hver person i holdpakken får en **timeregistrering** under Udførelse (start/slut eller antal timer per dato). Bruges til løn/akkord-afregning.
  - **Materiel:** Hvert materiel registreres med **antal timer brugt** under Udførelse. Bruges til materiel-afregning/intern fakturering mellem afdelinger
  - Begge registreringer skrives retur til PLAN ved afslutning af ordren
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
  - **Ren tidsvindue+aflyst-model (LÅST 2026-06-19) — formand + vognmand er nu IDENTISKE:** stavene farves UDELUKKENDE efter tidsvindue + aflysning. **State-baserede markeringer (I gang / Planlagt / Afsluttet) er fjernet** fra formandens kalenderoversigt for renhed — så de to apps bruger præcis samme markeringer og farver.
  - `normal udførsel` → `bg-good` (grøn)
  - `nat` → `bg-deep-teal` (mørk)
  - `weekend` → **hele baren** `bg-warning` (amber) — ikke længere et `bg-bad`-overlay
  - `aflyst` → `bg-bad` (rød), én ensartet markering uden årsag i gantt (jf. aflysnings-markeringer ovenfor). Vognmand udleder aflyst **pr. dag** fra `DagDisponering.annulleretAarsag`; formand fra `order.state === 'cancelled'`.
  - **Stav-stil:** tynd afrundet pille (`h-[6px] rounded-full`), identisk i begge apps. Ingen status-kolonne.
  - **Legend (4 markeringer):** Normal udførsel · Nat · Weekend · Aflyst.
  - **Formandens menupunkt + side-overskrift hedder "Kalenderoversigt"** (tidl. "Mine opgaver" / "Opgaveoversigt").
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

### Per-dag vognmand + afregning i kørsel-planlægning (LÅST 2026-06-09)

Formanden kan vælge **én vognmand** og **afregningsform** per dag i kørselspanelet (udvidet kørsel-sektion i Planlægning-mode).

**Vognmand:**
- Default = ordrens primære vognmand (fra aftalen i PLAN)
- Kan ændres per dag — fx når en anden vognmand dækker ved sygdom
- Kilde: `vognmand`-tabel (ikke implementeret, kun mock i prototype)

**Afregning:**
- To muligheder: `akkord` og `time` (dansk: "Akkord" / "Timeløn")
- Default = `akkord`
- Gemmes per dag på `plan_dag`-posten i Supabase (ikke implementeret, kun state i prototype)

**BESLUTNING LÅST 2026-06-09 — Formandens afregningsvalg er sandheden:**
Formandens valg af afregningsform per dag er udgangspunktet for afregning per bil downstream. Dette erstatter den tidligere kilde (`vognmand.aftaler.chauffoerer[]`). Selve downstream-koblingen (til `BilAfregningExpander` / Afregning-mode) er endnu ikke implementeret i prototypen (TODO).

**Scope-afgrænsning:**
- 1,5-times-reglen er uændret: automatisk i Afregning-mode baseret på vejeseddel-flag — ingen kobling til denne toggle
- `VognmandBekraeftelse.afregning_type` og `ConfirmedTruck.afregning_type` er ikke ændret endnu — downstream-kobling sker i separat iteration

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
