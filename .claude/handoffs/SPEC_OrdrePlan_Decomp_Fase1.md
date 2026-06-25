# SPEC — OrdrePlanScreen dekomponering, Fase 1 (mekanisk udklipning)

**Fil:** `apps/formand/src/prototypes/ordre-plan/OrdrePlanScreen.tsx` (7.844 linjer)
**Branch:** `feature/formand-ordreplan-decomp` (allerede oprettet + checked out)
**Type:** REN klip-og-indsæt. Logik, state, props, adfærd: **100% uændret.**
**IKKE i scope:** container/presenter-omskrivning, løft af de 124 `useState`, prop-oprydning, dead-code-fjernelse, sektion-nedbrydning af content-filer (= Fase 2). Gør INTET af det.

Prototype-fil → må aldrig importeres i produktion. Intern reorg er fri.

## Beslutninger (afgjort)
- KS-konstanter `KS_INPUT_CLS`/`KS_LABEL_CLS` → `components/ks/ksConstants.ts`.
- INGEN barrel-filer — eksplicitte imports.
- Commit IKKE (builder-regel) — rapportér tilbage, Claude verificerer visuelt + committer.

## Mål-struktur
```
ordre-plan/
├── OrdrePlanScreen.tsx      # orkestrator: state + 3-mode-toggle + HELE Planlægning-JSX (bliver her)
├── types.ts
├── utils.ts
├── mocks.ts
├── content/
│   ├── UdfoerselContent.tsx
│   └── AfregningContent.tsx
└── components/
    ├── OrdredetaljerSection.tsx · AflysningCell.tsx · ProductBoxV2.tsx
    ├── EkstraBestillingBox.tsx · CommentCell.tsx · DocRow.tsx · FjernModal.tsx
    ├── ForCheckbox.tsx · JaNejToggle.tsx · EkstraarbejdeBlok.tsx
    └── ks/ → OvrigeOplysningerSkema3a.tsx · OvrigeOplysningerSkema.tsx · MksSkema.tsx · ksConstants.ts
```
`PlanlaegningContent` udskilles IKKE (Fase 2). `makeOrdredetaljerCard` + `renderOrdredetaljerCollapsedPille` BLIVER i orkestratoren (closures over root-state) og sendes som props ned — uændret.

## Fil-flytte-kort (linjenr = nuværende i OrdrePlanScreen.tsx)

### → types.ts (alle ~28 typer, alle `export`)
CancelReason(53), DayPlan(55–81), MockProduct(101–127), MockResource(128–136), VehicleOrder(137–144), KørselPause(164–169), KørselDayParams(170–182), AndenOrdre(215–224 — dead, flyt med), NoteComment(350–357), MockPhoto(375), SamleordreChild(386–436), SamleordreContext(437–441), OrderMode(565), UnderlagType(567), UnderlaegsAarsag(568), PreFordeling(573–579), Vejeseddel(580–604), ChauffoerSmsStatus(605), AfregningType(607), ChauffoerAfregning(609–627), ConfirmedTruck(628–649), VognmandBekraeftelse(650–655), ConfirmedMaterielItem(656–673), VognmandMaterielBekraeftelse(674–686), EkstraLinje(4121–4127), EkstraarbejdeBlokProps(4609–4620), TimeafregningFraPlan(5103), MaterielEnhed(5106–5112).

### → utils.ts (afhænger kun af types)
getEffectiveTons(82–86), formatTime(87–95), getEffectiveProductTotalTons(96–100), DA_MONTHS(542), formatTimestamp(546–553), TODAY(554), dateToString(556–564).

### → mocks.ts (afhænger kun af types)
STANDARD_MATERIEL_KATALOG(145–163), VEHICLE_TYPES(183–194), MOCK_VOGNMAEND(195–199), DEFAULT_VOGNMAND_ID(200), DEFAULT_KØRSEL_PARAMS(202–214), ANDRE_ORDRER_FOR_DATO(225–269 — `@ts-ignore` L224 FØLGER MED), INITIAL_PRODUCTS(270–330), INITIAL_RESOURCES(331–339), CANCEL_REASONS(340–349), INITIAL_COMMENTS(358–374), INITIAL_PHOTOS(377–385), MOCK_SAMLEORDRE(442–541), INITIAL_VOGNMAND_MATERIEL_BEKRAEFTELSE(687–740), INITIAL_VOGNMAND_BEKRAEFTELSER(741–1148), EKSTRA_OPTIONS(4093–4120), UNDERLAG_OPTIONS(4128–4135), AARSAG_OPTIONS(4136–4148), MATERIEL_ENHEDER(5113–5118).

### → components/ks/
- ksConstants.ts: KS_INPUT_CLS(4174), KS_LABEL_CLS(4175)
- OvrigeOplysningerSkema3a.tsx: OvrigeOplysningerSkema3a(4179–4408)
- OvrigeOplysningerSkema.tsx: OvrigeOplysningerSkema (4a)(4409–4608)
- MksSkema.tsx: MksSkema(4776–5102)

### → components/
OrdredetaljerSection(1149–1208), AflysningCell(3571–3748), ProductBoxV2(3749–3954), EkstraBestillingBox(3955–4004), CommentCell(4005–4029), DocRow(4030–4064), FjernModal(4065–4092), ForCheckbox(4149–4173), JaNejToggle(4746–4775), EkstraarbejdeBlok(4621–4745).

### → content/
UdfoerselContent(5119–6237), AfregningContent(6238–7843=EOF).

### Bliver i OrdrePlanScreen.tsx
Fil-header(1–6) + eksterne imports(7–48, opdateret med interne imports) + OrdrePlanScreen(1209–3570) inkl. 124 useState, makeOrdredetaljerCard(1717), renderOrdredetaljerCollapsedPille(1942), 3-mode-toggle + Planlægning-JSX.

## Import-wiring — afhængigheds-retning (ingen cykler)
```
types        → (intet internt)
utils        → types
mocks        → types
ks/ksConstants → (intet)
components/* → types, utils, mocks, ks/ksConstants, eksterne
content/*    → types, utils, mocks, components/*, ks/*, ../etape, ../MaterielTilstande, @/-hooks, @shared
OrdrePlanScreen → alt ovenstående
```
**OBS relative stier:** når `UdfoerselContent`/`AfregningContent` flyttes til `content/`-undermappe, skal `./etape` → `../etape` og `./MaterielTilstande` → `../MaterielTilstande`. Tilsvarende for components i undermapper. `@/` og `@shared` er alias → upåvirket.

## Eksekverings-rækkefølge (bottom-up — hovedfilen forbliver grøn efter hvert trin)
1. types.ts → **GATE A**
2. utils.ts → GATE A
3. mocks.ts → **GATE A** (typecheck)
4. ks/ksConstants.ts + 3 KS-skemaer → GATE B
5. øvrige components/ (ProductBoxV2, OrdredetaljerSection, AflysningCell, EkstraBestillingBox, CommentCell, DocRow, FjernModal, ForCheckbox, JaNejToggle, EkstraarbejdeBlok) → **GATE B**
6. content/UdfoerselContent.tsx → **GATE C**
7. content/AfregningContent.tsx → GATE C
8. ryd OrdrePlanScreen.tsx (slet flyttede blokke, tilføj interne imports) → **GATE D**

**Teknik pr. trin:** klip blok → indsæt i ny fil m. `export` → i OrdrePlanScreen (+ content) tilføj `import` af det flyttede symbol, så filen aldrig er rød. Selve sletningen af de nu-dublerede blokke i OrdrePlanScreen sker i trin 8.

## Verifikations-GATE efter HVERT trin
```bash
cd /Users/carstenanthonisen/Documents/Colas && npm run formand:typecheck
cd /Users/carstenanthonisen/Documents/Colas && npx eslint <ny-fil> apps/formand/src/prototypes/ordre-plan/OrdrePlanScreen.tsx
```
**Hvis typecheck eller eslint bliver RØD:** ret det med det samme. Kan du ikke rette det → **STOP og rapportér** (push ikke videre med en rød fil). Visuel verifikation (browser) gør Claude bagefter — det er IKKE din opgave.

## Risici (fra architect)
1. `@ts-ignore TS6133` (L224) + `ANDRE_ORDRER_FOR_DATO`/`AndenOrdre` er dead code — flyt MED inkl. ts-ignore-kommentar; slet ikke.
2. Navne-kollision: lokal `MaterielEnhed`(5106) vs. importeret `MaterielEnhed as MaterielEnhedTilstand`(./MaterielTilstande L45) — bevar alias 1:1.
3. `KS_INPUT_CLS`/`KS_LABEL_CLS` bruges 26+41 gange på tværs af de 3 KS-skemaer → én delt `ks/ksConstants.ts`.
4. `samleordreTabOrderNr` + øvrige props tråder ned i begge content-filer — kopiér prop-signaturer ord-for-ord, tab ikke et felt.
5. `makeOrdredetaljerCard`/`renderOrdredetaljerCollapsedPille` er closures over root-state → BLIVER i orkestratoren, sendes som props. Flyt dem IKKE.
6. Kommentar-referencer til `./v1/*.v1.tsx` (fx L3831) er rene kommentarer — lad stå.
7. `MaterielTilstande.tsx` + `etape.ts` er allerede udskilt — kun relative stier skal justeres pr. undermappe (let at glemme; GATE C fanger det).

## Forventet resultat
OrdrePlanScreen.tsx: 7.844 → ~2.450 linjer. Ingen adfærdsændring.

## Rapportér tilbage
- Hvilke filer oprettet + ca. linjeantal hver.
- Endeligt linjeantal i OrdrePlanScreen.tsx.
- Gate-resultater (typecheck + eslint grønne ved hvert gate?).
- Eventuelle afvigelser fra planen + hvorfor.
- Eventuelle røde gates du måtte stoppe ved.
