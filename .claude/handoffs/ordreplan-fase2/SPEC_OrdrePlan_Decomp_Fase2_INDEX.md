# SPEC — OrdrePlanScreen dekomponering, Fase 2 (sektion-nedbrydning) — INDEX + plan

**Type:** Extraction, IKKE omskrivning. JSX kopieres ORDRET, parametriseres via props. Adfærd 100% uændret.
**Fortsætter:** `.claude/handoffs/SPEC_OrdrePlan_Decomp_Fase1.md` (Fase 1 MERGED #63). Følger PRÆCIS samme stil/mønster.
**Branch:** `feature/formand-ordreplan-decomp-fase2` (oprettes fra ren main).
**Filer der brydes op (alle 3):**
- `apps/formand/src/prototypes/ordre-plan/OrdrePlanScreen.tsx` (2.420 linjer)
- `apps/formand/src/prototypes/ordre-plan/content/UdfoerselContent.tsx` (1.153 linjer)
- `apps/formand/src/prototypes/ordre-plan/content/AfregningContent.tsx` (1.637 linjer)

Prototype-fil → må aldrig importeres i produktion. Tokens-only. INGEN tests/stories kræves (prototype-fase).

---

## UFRAVIGELIGE principper (uændret fra Fase 1)

1. **Extraction, IKKE omskrivning.** Klip JSX-blok ORDRET → indsæt i ny sektion-fil → parametrisér via props. Adfærd 100% uændret.
2. **Container/Presenter.** Kun container/orkestrator importerer hooks (`useRecept`, `useVejesedler`, `useDagsoverblik`). Sektioner får data + callbacks ind via props.
3. **Tokens-only.** Flyt eksisterende token-violations ORDRET — ret dem IKKE (det er cleanup-passet bagefter). Lad `gap-[48px]`, `w-[Npx]` osv. stå uændret.
4. **Props-interface eksporteres altid** som `[Navn]Props`. Ingen `any`. JSDoc på ikke-oplagte props (kopier eksisterende JSDoc med).
5. **Bevar alias 1:1** (fx `MaterielEnhed as MaterielEnhedTilstand`). Bevar `@ts-ignore`-kommentarer hvor de findes.
6. **Relative stier:** nye sektioner i `content/sections/` skal bruge `../../etape`, `../../MaterielTilstande`, `../../components/...`, `../../types`, `../../utils`, `../../mocks`. `@/` og `@shared` er alias → upåvirket.

---

## DEN ENE REELLE DESIGN-BESLUTNING — afgjort

**Spørgsmål:** `OrdredetaljerSection` + "Udføres i perioden"/"Afregningsperiode" går igen i alle 3 modes. Fælles eller mode-lokale?

### Del A — `OrdredetaljerSection`: ALLEREDE delt. Uændret.
`OrdredetaljerSection` blev udskilt i Fase 1 til `components/OrdredetaljerSection.tsx` og importeres allerede identisk i alle 3 modes (orkestratorens Planlægning-JSX L1037, UdfoerselContent L262, AfregningContent L410). State holdes hos kalderen via `expanded`/`onToggle`/`renderCard`/`renderCollapsedPille`-props. **Ingen handling — den ER det fælles mønster.** `makeOrdredetaljerCard` + `renderOrdredetaljerCollapsedPille` forbliver closures i orkestratoren og trådes som props (uændret fra Fase 1). Fase 2 rører dem ikke.

### Del B — periode-dato-vælgeren: GØRES FÆLLES (ny `PeriodeDatoVaelger`).
**Beslutning: udskil til ÉN ny delt komponent `components/PeriodeDatoVaelger.tsx`, brugt i alle 3 modes.**

**Begrundelse (verificeret ved diff):** De tre blokke — Planlægning "Udføres i perioden" (`OrdrePlanScreen.tsx` L999–1028), Udførsel "Udføres i perioden" (`UdfoerselContent.tsx` L227–258), Afregning "Afregningsperiode" (`AfregningContent.tsx` L373–406) — er **byte-identiske** på JSX-niveau. De afviger KUN i:
- overskrift-tekst (`"Udføres i perioden"` × 2, `"Afregningsperiode"` × 1)
- kilde-array (`planDays` / `udfoerselDays` / `afregningDays`)
- valgt værdi (`selectedPlanDate` / `selectedDate`)
- onSelect-callback (`setSelectedPlanDate` / `setSelectedDate` / `onSelectDate`)

Koden siger det selv eksplicit: AfregningContent L374 `"Kopieret 1:1 fra UdfoerselContent's 'Udføres i perioden'-sektion"`. Dette er 3× duplikering af identisk markup → kanonisk extraction-kandidat. Komponenten parametriseres på `heading`, `days`, `selectedDate`, `onSelectDate`. Dette er ren extraction (ingen adfærdsændring) og passer princippet: vi flytter eksisterende JSX, opfinder intet nyt.

**COMPONENT_REGISTRY-tjek (obligatorisk, udført):** Ingen eksisterende komponent dækker dette. `PeriodeNavigator` (shared, 🌍) er en pile-baseret uge/14-dage/måned-navigator til Gantt/Liste/Produktionsplan — IKKE en horisontal dato-pille-stribe med per-dag-toggle. Ikke samme use-case → ikke genbrug. Cross-app-grep (`apps/*/src/ shared/`) finder mønsteret KUN i de 3 ordre-plan-blokke. → ny komponent berettiget.

**Scope-afgrænsning:** `PeriodeDatoVaelger` placeres i `components/` (prototype-lokal, ikke `shared/`), fordi mønsteret pt. kun findes i ordre-plan-prototypen. Når sektionen promoveres til produktion (post-prototype) revurderes 🌍-flytning. Noteret i SPEC, ikke handlet på nu. **Post-build:** tilføj `PeriodeDatoVaelger` til `COMPONENT_REGISTRY.md` (formand-prototype).

---

## Strukturelle observationer (kritiske for ren extraction)

Snittene er IKKE alle rene `<section>`-peers. To steder deler flere sektioner ét wrapper-`<div>` — ORDRET-extraction skal bevare den nesting:

1. **Orkestratoren (Planlægning):** `<div>` på L1031 ("Udlægning"-kommentar) wrapper `OrdredetaljerSection` + den conditionelle `Dokumentation`-`<section>` + `<hr>` + `Asfaltbestilling`-`<div>`, og lukker L1378. `Asfalt kørsel` (L1380) og `Materiellevering` (L1982) er SIBLINGS på top-niveau i `flex flex-col gap-[48px]`-containeren (åbner L993, lukker L2159). → Dokumentation + Asfaltbestilling skal blive inden i det wrapper-`<div>` sammen med OrdredetaljerSection. Se sektion-SPEC for præcis grænse.

2. **AfregningContent:** `<div>` på L409 wrapper `OrdredetaljerSection` + `Udlægning`-blokken (h2 L482, kommenteret "INDE i Ordredetaljer-section som sibling til hr"), lukker L589. → `Udlaegning`-sektionen er nestet sammen med Ordredetaljer i samme `<div>`, ikke en ren top-peer.

Begge content-filer + Planlægning har samme rod-container: `<div className="flex flex-col gap-[48px]">`.

---

## State-ejerskab — afgørende for prop-tråding

**UdfoerselContent (verificeret):** Hver sektions lokale `useState` bruges KUN i den sektion — ingen state deles på tværs af sektioner inden for filen. → Hver ny sektion-komponent FLYTTER sin egen `useState` med ind (selvstændige presentere med intern UI-state). Kun de props der ALLEREDE kommer udefra (fra orkestratoren) trådes videre. Container (`UdfoerselContent`) beholder kun: hooks (`useRecept`, `useVejesedler`), `udfoerselDays`-useMemo, og prop-distribution.

**AfregningContent (verificeret):** Tættere koblet. Bund-CTA "Afslut dag" + valideringsmodal (L1493–1635) LÆSER `afregningData`, `materielAfregningGodkendt`, `valideringsFejl`, `dagAfsluttet` på tværs af alle afregnings-sektioner. Hver afregnings-sektion SKRIVER sin egen state-slice (`setBilAfregningOverride`/`setVejeseddelFordelinger`… i Bil-tons; `setMaterielAnvendt`/`setMaterielAfregningGodkendt` i Materiel). → Disse cross-cutting state-felter + valideringsmodal + `useEffect` BLIVER i `AfregningContent`-containeren. De tre afregnings-sektioner får relevante state-slices + setters trådt ind som props (mere prop-tråding end Udførsel — men stadig ren extraction, ingen adfærdsændring).

---

## Mål-struktur

```
ordre-plan/
├── OrdrePlanScreen.tsx              # orkestrator: state + 3-mode-toggle. Planlægning-JSX → content/PlanlaegningContent.tsx
├── components/
│   ├── PeriodeDatoVaelger.tsx       # NY (delt) — Del B-beslutning
│   ├── OrdredetaljerSection.tsx     # UÆNDRET (Fase 1)
│   └── … (øvrige Fase 1-komponenter uændret)
└── content/
    ├── PlanlaegningContent.tsx      # NY container — løftet ud af OrdrePlanScreen
    ├── UdfoerselContent.tsx         # bliver tynd container (hooks + prop-distribution)
    ├── AfregningContent.tsx         # bliver container (hooks + cross-cutting state + CTA/modaler)
    └── sections/
        ├── planlaegning/
        │   ├── DokumentationSection.tsx
        │   ├── AsfaltbestillingSection.tsx
        │   ├── AsfaltKoerselSection.tsx
        │   └── MateriellleveringSection.tsx
        ├── udfoersel/
        │   ├── BekraeftedeBilerSection.tsx     # inkl. materiel-transport-branch
        │   ├── ForundersoegelseSection.tsx
        │   ├── KsRapporteringSection.tsx
        │   └── KoerselSection.tsx
        └── afregning/
            ├── UdlaegningSection.tsx
            ├── BilTonsAfregningSection.tsx
            ├── MaterielafregningSection.tsx
            └── TimeafregningSection.tsx
```

`PeriodeDatoVaelger` erstatter periode-blokken i alle 3 modes. `OrdredetaljerSection` forbliver toppen af både Planlægning, Udførsel og Afregning (uændret). "Udføres i perioden"/"Afregningsperiode" og Ordredetaljer udskilles IKKE til egne sektion-filer (de er hhv. ny delt komponent + allerede-delt komponent).

**Note om PlanlaegningContent:** Den inline Planlægning-JSX (`OrdrePlanScreen.tsx` ~L992–2160) løftes til en ny `content/PlanlaegningContent.tsx`-container — symmetrisk med Udførsel/Afregning. Den modtager samme stil props som de andre to (state + closures + callbacks). Dette gør orkestratoren ren (kun state + 3-mode-switch der renderer 3 content-containere). Inde i `PlanlaegningContent` udskilles de 4 sektioner.

---

## Build-rounds (gruppering så parallelle builds IKKE kolliderer på fælles filer)

Bottom-up. Hver runde har egen gate. Builders i samme runde rører IKKE samme fil.

### Round 1 — delt leaf-komponent
- **#1 `PeriodeDatoVaelger`** (`components/`) — ny delt komponent (Del B). Ingen deps udover types/utils/eksisterende imports.
- Gate R1: `formand:typecheck` grøn. Komponenten findes men er endnu ikke wired ind (de 3 modes bruger stadig deres inline-blok). Wiring sker i Round 2/3/4 per content-fil.

### Round 2 — Udførsel-sektioner (rører KUN UdfoerselContent + nye filer under sections/udfoersel/)
Parallelt (4 builders, hver sin nye fil; UdfoerselContent redigeres sekventielt af én "integrator"-builder ELLER sekventielt — se note):
- **#2 `BekraeftedeBilerSection`** (sections/udfoersel/) — inkl. materiel-transport-branch (`MaterielPaaPladsenTilstand`/`MaterielDvaleTilstand`). Flytter `smsStatusMap`/`materielSmsStatusMap`/`bilerTableExpanded`/`materielTableExpanded` med.
- **#3 `ForundersoegelseSection`** (sections/udfoersel/) — flytter forundersøgelses-state + `fileInputRef` + `onAddPhotos`-callback.
- **#4 `KsRapporteringSection`** (sections/udfoersel/) — flytter `ksExpanded`/`ksActiveTab`; bruger KS-skemaerne.
- **#5 `KoerselSection`** (sections/udfoersel/) — flytter `vejeseddel*PerOrdre`-state; bruger `VejesedlerTable` + `useVejesedler`-data.
- **#6 UdfoerselContent → tynd container** + wire `PeriodeDatoVaelger` + de 4 sektioner. (Integrations-trin — gøres EFTER #2–#5 findes.)
- Gate R2: `formand:typecheck` grøn + Udførsel-mode visuelt identisk i browser.

### Round 3 — Planlægning-sektioner (rører KUN OrdrePlanScreen/ny PlanlaegningContent + sections/planlaegning/)
- **#7 `PlanlaegningContent`** (content/) — løft Planlægning-JSX ud af orkestratoren til ny container (props-signatur symmetrisk med Udførsel/Afregning). Beholder Planlægning-lokal state der bor i orkestratoren i dag.
- **#8 `DokumentationSection`** (sections/planlaegning/) — conditionel `Dokumentation`-section. Flytter `opmaalingOpen`/`photosOpen`/`notesOpen`/`docsOpen`/`besigtigelseComment`/`noteComments`-state.
- **#9 `AsfaltbestillingSection`** (sections/planlaegning/) — produkt-bokse + EkstraBestillingBox + send-flow.
- **#10 `AsfaltKoerselSection`** (sections/planlaegning/) — kørsels-tabel + bil-ordrer + vognmand/afregning per dag.
- **#11 `MateriellleveringSection`** (sections/planlaegning/) — materiel-transport-tilstande (`MaterielPlanlaeg`/`NyEtape`/`PaaPladsen`/`Dvale`).
- **#12 PlanlaegningContent + OrdredetaljerSection-wiring + PeriodeDatoVaelger-wiring** (integration).
- Gate R3: `formand:typecheck` grøn + Planlægning-mode visuelt identisk.
- **Bemærk wrapper-`<div>`-nesting** (Dokumentation + Asfaltbestilling deler `<div>` med OrdredetaljerSection — se "Strukturelle observationer").

### Round 4 — Afregning-sektioner (rører KUN AfregningContent + sections/afregning/)
- **#13 `UdlaegningSection`** (sections/afregning/) — nestet i Ordredetaljer-`<div>`. Læser udlægnings-props (`tonsAnkommet`/`forventetUdlagtM2`/`faktiskRegistrering`/`onGemFaktisk`).
- **#14 `BilTonsAfregningSection`** (sections/afregning/) — stor. Skriver `bilAfregningOverride`/`vejeseddelFordelinger`/`bilTimerFordelinger`… → state forbliver i container, trådes som props.
- **#15 `MaterielafregningSection`** (sections/afregning/) — `materielAnvendt`/`materielTimer`/`materielAfregningGodkendt` (state i container, props ind).
- **#16 `TimeafregningSection`** (sections/afregning/) — `timeafregningFraPlan`/`holdpakkeTimer`/PLAN-modal-trigger.
- **#17 AfregningContent → container** + wire PeriodeDatoVaelger + de 4 sektioner; behold cross-cutting state + "Afslut dag"-CTA + valideringsmodal + PLAN-modal + `useEffect`.
- Gate R4: `formand:typecheck` grøn + Afregning-mode visuelt identisk.

**Parallel-note:** Round 2/3/4 er indbyrdes uafhængige (forskellige filer) og KAN køre parallelt hvis ønsket — men hvert rounds integrations-trin (#6/#12/#17) redigerer dets ene content-container og skal være sekventielt SIDST inden for sit round. Anbefaling: kør R2→R3→R4 i rækkefølge for at holde visuel-verifikation overskuelig. R1 (#1) skal være done før alle integrations-trin.

---

## Gates (pr. round)

```bash
cd /Users/carstenanthonisen/Documents/Colas && npm run formand:typecheck    # SKAL være grøn (baseline: grøn nu)
```
- Visuelt identisk i den/de berørte mode(s) — verificeres i browser af Carsten/Claude (ikke builder).
- `formand:lint` har 5 pre-eksisterende errors — IKKE Fase 2's ansvar. Lad dem stå. Tilføj INGEN nye.
- Branch + PR + Netlify-preview.

**Builder-regel:** Hvis typecheck bliver rød og ikke kan rettes uden adfærdsændring → STOP og rapportér. Commit IKKE selv (Claude/Carsten verificerer visuelt + committer).

---

## Forventet resultat (cirka)
- `OrdrePlanScreen.tsx`: 2.420 → ~600–800 linjer (kun state + closures + 3-mode-switch + venstre-rail + TopBar).
- `UdfoerselContent.tsx`: 1.153 → ~150–250 linjer (container).
- `AfregningContent.tsx`: 1.637 → ~400–500 linjer (container beholder cross-cutting state + modaler).
- 13 nye sektion/komponent-filer. Ingen adfærdsændring i nogen af de 3 modes.

## Rapportér tilbage (pr. builder)
- Hvilke filer oprettet + ca. linjeantal.
- Gate-resultat (typecheck grøn?).
- Afvigelser fra SPEC + hvorfor.
- Røde gates man måtte stoppe ved.
