# SPEC — Planlægning-sektioner (Round 3)

**Kilde:** `apps/formand/src/prototypes/ordre-plan/OrdrePlanScreen.tsx` — inline Planlægning-JSX L992–2160.
**Ny container:** `content/PlanlaegningContent.tsx` (symmetrisk med Udførsel/Afregning).
**Nye sektioner:** `content/sections/planlaegning/*.tsx`
**Type:** Extraction ORDRET. Planlægning-state er mere entangled med orkestratoren end Udførsel (deler `products`/`photos`/`transportPlaner`/`etaper`/`resources` med Udførsel+Afregning via root). → Disse felter BLIVER i orkestrator-root og trådes som props gennem `PlanlaegningContent` til sektionerne. KUN ren Planlægning-lokal state (fx `kørselExpandedId`, `opmaalingOpen`) flyttes ned i sektionerne hvis den ikke bruges andetsteds.

**Relative stier fra `sections/planlaegning/`:** `../../../components/...`, `../../../MaterielTilstande`, `../../../etape`, `../../../types`, `../../../utils`, `../../../mocks`.

---

## KRITISK nesting (ORDRET — må ikke "rettes")
Rod-container `<div className="flex flex-col gap-[48px]">` åbner L993, lukker L2159.
Inde i den:
- `PeriodeDatoVaelger` (var L999–1028).
- `<div>` L1031 wrapper: `OrdredetaljerSection` (L1037) + conditionel `Dokumentation`-`<section>` (L1044–1212) + `<hr className="my-lg border-t border-hairline" />` (L1214) + `Asfaltbestilling`-`<div className="flex flex-col gap-sm">` (L1219–1376). Wrapper-`<div>` lukker L1378.
  → DokumentationSection + AsfaltbestillingSection skal renderes INDEN i dette delte `<div>`, sammen med OrdredetaljerSection, med `<hr>` imellem. Bevar præcis denne struktur i `PlanlaegningContent`.
- `Asfalt kørsel`-`<div className="mt-lg">` (L1380–1979) — top-peer.
- `Materiellevering`-`<section>` (L1982–2157) — top-peer.

## #7 PlanlaegningContent (container — løft Planlægning-JSX ud af orkestrator)
**Fil:** `content/PlanlaegningContent.tsx`
- Modtager props symmetrisk med UdfoerselContent/AfregningContent: `products`, `selectedDate`/`onSelectDate` (= `selectedPlanDate`/`setSelectedPlanDate`), `makeOrdredetaljerCard`, `renderOrdredetaljerCollapsedPille`, `planlaegningOrdredetaljerExpanded`+toggle, `photos`/`onAddPhotos`, `transportPlaner`/`resources`/`etaper`/`materielUiState`, kørsels-state (`kørselOrders`/`kørselParams`/`startRaekkefoelge`/`startTider`/`dagVognmand`/`dagAfregning`/`bekraeftedeDagIds`/`sendtTilVognmandDates`/`kørselPlanlagtIds`/`kørselKommentar` + setters), `bekraeftedeEnhederIds`/`materielSendteEnhederIds`, `productsForSelectedDate`, `activeDays`/`planDays`, samleordre-props. (Kopier ORDRET de variabler Planlægning-JSX i dag refererer fra orkestrator-scope.)
- Render: rod-`<div className="flex flex-col gap-[48px]">` → PeriodeDatoVaelger → delt-`<div>`(OrdredetaljerSection + DokumentationSection + `<hr>` + AsfaltbestillingSection) → AsfaltKoerselSection → MateriellleveringSection.
- Orkestratoren reduceres til: state + closures (`makeOrdredetaljerCard`/`renderOrdredetaljerCollapsedPille` — BLIVER closures, trådes som props, uændret fra Fase 1) + 3-mode-switch der renderer `<PlanlaegningContent/>` / `<UdfoerselContent/>` / `<AfregningContent/>` + venstre-rail + TopBar.

## #8 DokumentationSection
**Fil:** `sections/planlaegning/DokumentationSection.tsx`
**Kilde:** L1044–1212 (`{planlaegningOrdredetaljerExpanded && (<section>…h2 "Dokumentation" L1046…)}`). Bemærk: conditionel på `planlaegningOrdredetaljerExpanded` — bevar guarden i kalderen ELLER som prop.
**State:** `opmaalingOpen`/`photosOpen`/`notesOpen`/`docsOpen`/`besigtigelseComment` kan flyttes ned (Planlægning-lokal). `photos`/`noteComments` er root-delt → props ind (`photos`, `onAddPhotos`, `noteComments`, `onAddComment`).
**Bruger:** `DocRow`, `CommentCell`, `Camera`/`Mic`/`MessageSquare`-ikoner.

## #9 AsfaltbestillingSection
**Fil:** `sections/planlaegning/AsfaltbestillingSection.tsx`
**Kilde:** L1219–1376 (`<div className="flex flex-col gap-sm">` med h2 "Asfaltbestilling" L1221).
**State:** `showConfirmSend`/`sentDayIds`/`sentKommentarer` → afgør ved extraction (sandsynligvis props fra root da send-status deles). `products` er root → prop.
**Props ind:** `products`/`productsForSelectedDate`, `selectedDate`, send-callbacks. **Bruger:** `ProductBoxV2`, `EkstraBestillingBox`.

## #10 AsfaltKoerselSection
**Fil:** `sections/planlaegning/AsfaltKoerselSection.tsx`
**Kilde:** L1380–1979 (`<div className="mt-lg">` med h2 "Asfalt kørsel" L1382).
**State:** `kørselExpandedId`/`kørselKommentar` kan flyttes ned. `kørselOrders`/`kørselParams`/`startRaekkefoelge`/`startTider`/`dagVognmand`/`dagAfregning`/`bekraeftedeDagIds`/`sendtTilVognmandDates`/`kørselPlanlagtIds` er root-delt (Afregning læser biltype-afregning herfra) → props + setters ind.
**Bruger:** `VEHICLE_TYPES`, `MOCK_VOGNMAEND`, `DEFAULT_KØRSEL_PARAMS`, `AflysningCell`.

## #11 MateriellleveringSection
**Fil:** `sections/planlaegning/MateriellleveringSection.tsx`
**Kilde:** L1982–2157 (`<section>` med h2 "Materiellevering" L1983).
**State:** `tilfoejMaterielOpen`/`materielSoeg`/`fjernModalId` kan flyttes ned. `resources`/`transportPlaner`/`etaper`/`materielUiState`/`bekraeftedeEnhederIds`/`materielSendteEnhederIds` er root → props + setters ind.
**Bruger:** `MaterielPlanlaegTilstand`, `MaterielNyEtapeTilstand`, `MaterielPaaPladsenTilstand`, `MaterielDvaleTilstand` (+ `MaterielEnhed as MaterielEnhedTilstand`-alias), `FjernModal`, `STANDARD_MATERIEL_KATALOG`, `clusterEtaper`/`getMaterielUiState`/`transportKey`/`DEMO_TRANSPORT_PLANER`.

## #12 Integration (EFTER #8–#11)
Wire PlanlaegningContent + slet flyttede blokke fra orkestratoren + tilføj `<PlanlaegningContent/>` i `activeMode === 'planlaegning'`-grenen (erstatter den inline JSX L992–2160).

## Visual Pattern Reference (ORDRET)
- **Deep-teal h2** (Udføres/Asfaltbestilling): `font-poppins font-semibold text-xl text-deep-teal leading-tight mb-sm`
- **Tekst-primary h2** (Dokumentation/Asfalt kørsel/Materiellevering): `font-poppins font-semibold text-xl text-text-primary mb-sm`
- **Boks-wrapper**: `bg-white border border-hairline rounded-xl overflow-hidden`
- **hr-skille**: `my-lg border-t border-hairline`
- **Token-violation** `gap-[48px]` (rod) + evt. `w-[Npx]` i ProductBoxV2-grid: flyt ORDRET, ret IKKE.

## Gate R3
`npm run formand:typecheck` grøn + Planlægning-mode visuelt identisk i browser (alle 4 sektioner + Ordredetaljer-collapse + samleordre-mode).
