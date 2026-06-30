# SPEC — Udførsel-sektioner (Round 2)

**Container:** `apps/formand/src/prototypes/ordre-plan/content/UdfoerselContent.tsx` (1.153 linjer → tynd container)
**Nye filer:** `content/sections/udfoersel/*.tsx`
**Type:** Extraction ORDRET. Hver sektion FLYTTER sin egen lokale `useState` med ind (state er sektion-lokal — verificeret, ingen deling på tværs). Container beholder: hooks + `udfoerselDays`-useMemo + prop-distribution.
**Relative stier fra `sections/udfoersel/`:** `../../../components/...`, `../../../MaterielTilstande`, `../../../etape`, `../../../types`, `../../../utils`, `../../../mocks`. `@/` + `@shared` upåvirket.

Rod-container er `<div className="flex flex-col gap-[48px]">` (L225, ORDRET — token-violation `gap-[48px]` flyttes uændret). Top-peers i rækkefølge: PeriodeDatoVaelger (var L227–258) · OrdredetaljerSection (L262–268, uændret Fase 1-komponent) · BekraeftedeBilerSection · ForundersoegelseSection · KsRapporteringSection · KoerselSection.

---

## #2 BekraeftedeBilerSection
**Fil:** `sections/udfoersel/BekraeftedeBilerSection.tsx`
**Kilde:** L269–672 (kommentar-blok "Status-bokse" L269 → h2 "Bekræftede biler" L276 → frem til Forundersøgelse-`<section>` L673). **Inkl. materiel-transport-branch** L457–490+ (`materielUiState`-switch: `'paa-pladsen'`→`MaterielPaaPladsenTilstand`, `'dvale'`→`MaterielDvaleTilstand`, ellers eksisterende materiel-tabel).
**Flytter med (state):** `smsStatusMap`/`setSmsStatusMap` (L127), `materielSmsStatusMap`/`setMaterielSmsStatusMap` (L147), `bilerTableExpanded`/`setBilerTableExpanded` (L167), `materielTableExpanded`/`setMaterielTableExpanded` (L168).
**Props ind:** `vognmandBekraeftelse`, `vognmandMaterielBekraeftelse`, `materielUiState`, `etaper`, `transportPlaner`, `isSamleordreMode`, `samleordreCtx`, `samleordreTabOrderNr`. (Kopier prop-typer ORDRET fra UdfoerselContent-signaturen.)
**Bruger:** `MaterielPaaPladsenTilstand`, `MaterielDvaleTilstand` (+ `MaterielEnhed as MaterielEnhedTilstand`-alias bevares), `formatPhone`/`toE164`/`formatRegnr`.

## #3 ForundersoegelseSection
**Fil:** `sections/udfoersel/ForundersoegelseSection.tsx`
**Kilde:** L673–918 (`<section>` med h2 "Forundersøgelse" L675).
**Flytter med (state):** `underlaegsType`/`underlaegsAndet`/`tilfredsstillende`/`underlaegsAarsager`/`aftaltMed`/`forbehold`/`saved`/`forundersoegelseOpen` + setters (L91–98), `fileInputRef` (L194).
**Props ind:** `forundersoegelseFotos` (`MockPhoto[]`), `onAddPhotos`, `isSamleordreMode`, `samleordreCtx`, `samleordreTabOrderNr`.
**Bruger:** `ForCheckbox`, `JaNejToggle`, `UNDERLAG_OPTIONS`, `AARSAG_OPTIONS`.

## #4 KsRapporteringSection
**Fil:** `sections/udfoersel/KsRapporteringSection.tsx`
**Kilde:** L921–1061 (kommentar "KS-rapportering" L921 → h2 L948 → frem til Kørsel-kommentar L1062).
**Flytter med (state):** `ksExpanded`/`setKsExpanded` (L101), `ksActiveTab`/`setKsActiveTab` (L102).
**Props ind:** (afgør ved extraction — sandsynligvis ingen udefra; selvstændig). Hvis sektionen læser `recept`/produkt-data fra container → træd ind som props.
**Bruger:** `OvrigeOplysningerSkema3a`, `OvrigeOplysningerSkema`, `MksSkema` (+ ksConstants via skemaerne).

## #5 KoerselSection
**Fil:** `sections/udfoersel/KoerselSection.tsx`
**Kilde:** L1062–1147 (`<section>` med h2 "Kørsel" L1066 → frem til "Bil- og tonsafregning"-kommentar L1148 + `</div>` L1151).
**Flytter med (state):** `vejeseddelSelectedOrdre`/`vejeseddelTempPerOrdre`/`vejeseddelUdlaeggerPerOrdre` + setters (L108–110).
**Props ind:** `vejesedler` (fra `useVejesedler` i container — hook BLIVER i container, data trådes ind), `isSamleordreMode`, `samleordreCtx`.
**Bruger:** `VejesedlerTable`, `EtaBadge`/`TemperaturBadge`/`UdlaeggerDropdown` (via VejesedlerTable — genbrug, 🟢 registry).

---

## #6 UdfoerselContent → tynd container (integrations-trin, EFTER #2–#5)
- Beholder imports af hooks (`useRecept`, `useVejesedler`), `INITIAL_RECEPTER`/`INITIAL_UDLAEGGERE`, `udfoerselDays`-useMemo (L214), prop-signaturen UÆNDRET (orkestratoren kalder den uændret).
- Render: rod-`<div className="flex flex-col gap-[48px]">` med:
  `<PeriodeDatoVaelger heading="Udføres i perioden" days={udfoerselDays} selectedDate={selectedDate} onSelectDate={setSelectedDate} />`
  → `<OrdredetaljerSection … />` (uændret)
  → `<BekraeftedeBilerSection … />`
  → `<ForundersoegelseSection … />`
  → `<KsRapporteringSection … />`
  → `<KoerselSection … />`
- Flyt KUN de state-deklarationer der nu bor i sektionerne UD af containeren. Behold state der bruges af flere/af container.

## Visual Pattern Reference (alle Udførsel-sektioner — ORDRET, ret intet)
- **Deep-teal h2** (Udføres/Bekræftede biler): `font-poppins font-semibold text-xl text-deep-teal leading-tight mb-sm`
- **Tekst-primary h2** (Forundersøgelse/KS/Kørsel): `font-poppins font-semibold text-xl text-text-primary mb-sm` (Kørsel uden `mb-sm`)
- **Kort/boks-wrapper**: `bg-white border border-hairline rounded-xl overflow-hidden` (gengår i alle sektioner)
- **Tabel-header/celle, badges**: kopier ORDRET fra kilde-linjerne.

## Gate R2
`npm run formand:typecheck` grøn + Udførsel-mode visuelt identisk i browser.
