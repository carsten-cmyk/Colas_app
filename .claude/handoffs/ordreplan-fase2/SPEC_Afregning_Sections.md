# SPEC — Afregning-sektioner (Round 4)

**Container:** `apps/formand/src/prototypes/ordre-plan/content/AfregningContent.tsx` (1.637 linjer → container).
**Nye filer:** `content/sections/afregning/*.tsx`
**Type:** Extraction ORDRET. AfregningContent er tæt koblet — cross-cutting state + "Afslut dag"-CTA + valideringsmodal + PLAN-modal + `useEffect` BLIVER i containeren. Hver sektion skriver sin egen state-slice, men staten EJES af containeren og trådes som props (slice + setter). Mere prop-tråding end Udførsel — stadig 100% adfærdsuændret.

**Relative stier fra `sections/afregning/`:** `../../../components/...`, `../../../types`, `../../../utils`, `../../../mocks`. `@/` (`FremdriftCard`/`FremdriftInputRow`/`useRecept`) + `@shared` upåvirket.

Rod-container `<div className="flex flex-col gap-[48px]">` (L371, ORDRET violation). Top-struktur:
- `PeriodeDatoVaelger` (var L373–406, heading "Afregningsperiode").
- `<div>` L409 wrapper: `OrdredetaljerSection` (L410–415) + `Udlægning`-blok (h2 "Udlægning" L482, "INDE i Ordredetaljer-section som sibling til hr"). Wrapper lukker L589.
- `Bil- og tonsafregning`-blok (L591–1306).
- `Materielafregning`-`<section>` (L1309–1468).
- `Timeafregning`-`<section>` (L1472–1492).
- "Afslut dag"-CTA (L1493–1533) + valideringsmodal (L1534–1568) + PLAN-modal (L1569–1635) → BLIVER i container.

---

## #13 UdlaegningSection
**Fil:** `sections/afregning/UdlaegningSection.tsx`
**Kilde:** L419–588 (Udlægning-blokken inde i Ordredetaljer-`<div>`; h2 "Udlægning" L482). Bevar nesting: renderes inde i det delte `<div>` sammen med OrdredetaljerSection.
**State:** `selectedAfregningProductId`/`setSelectedAfregningProductId` (L113) — per-produkt tabs.
**Props ind:** `tonsAnkommet`, `forventetUdlagtM2`, `faktiskRegistrering`, `visUdlaegningInput`/`onSetVisUdlaegningInput`, `onGemFaktisk`, `demoTonsIDag`/`demoArealIDag`/`demoTykkelse`, `harEkstraarbejde`, `produkterForUdlaegning`, `recept`.
**Bruger:** `FremdriftCard`, `FremdriftInputRow`, `ProgressBar` (🟢 registry — genbrug).

## #14 BilTonsAfregningSection
**Fil:** `sections/afregning/BilTonsAfregningSection.tsx` (STØRST)
**Kilde:** L591–1306 (kommentar "Bestilte biler" L591 → h2 "Bil- og tonsafregning" L596).
**State (EJES af container, trådes som props):** `bilAfregningOverride`/`setBilAfregningOverride`, `vejeseddelFordelinger`/`setVejeseddelFordelinger`, `vejeseddelExpanded`/`setVejeseddelExpanded`, `vejeseddelVentetidFordelinger`/`setVejeseddelVentetidFordelinger`, `bilTimerFordelinger`/`setBilTimerFordelinger`, `bilVentetidFordelinger`/`setBilVentetidFordelinger`, `bilTimerFordelingOpen`/`setBilTimerFordelingOpen`, `afregningOpen`/`setAfregningOpen`, `afregningData`/`setAfregningData`.
**Props ind:** ovenstående state-slices + setters, `vognmandBekraeftelse`, `todayDay`, `biltypeAfregning`, `isSamleordreMode`/`samleordreCtx`/`samleordreTabOrderNr`.
**Bruger:** `formatPhone`/`toE164`/`formatRegnr`, `EtaBadge`/`TemperaturBadge` hvis brugt (genbrug 🟢).

## #15 MaterielafregningSection
**Fil:** `sections/afregning/MaterielafregningSection.tsx`
**Kilde:** L1309–1468 (`<section>` med h2 "Materielafregning" L1312).
**State (i container, props ind):** `materielAnvendt`/`setMaterielAnvendt`, `materielTimer`/`setMaterielTimer`, `materielAfregningGodkendt`/`setMaterielAfregningGodkendt`.
**Props ind:** ovenstående + `vognmandMaterielBekraeftelse`, `MATERIEL_ENHEDER`.

## #16 TimeafregningSection
**Fil:** `sections/afregning/TimeafregningSection.tsx`
**Kilde:** L1472–1492 (`<section>` med h2 "Timeafregning" L1474).
**State (i container, props ind):** `timeafregningFraPlan`/`setTimeafregningFraPlan`, `holdpakkeTimer`/`setHoldpakkeTimer`, `planModalOpen`/`setPlanModalOpen` (modal-toggle — modalen selv bliver i container).
**Props ind:** ovenstående.

## #17 AfregningContent → container (integrations-trin, EFTER #13–#16)
- Beholder: alle `useState` (cross-cutting), `useEffect` (L329), `useMemo`s (`afregningDays`, `produkterForUdlaegning`), `useRecept`-hook, "Afslut dag"-CTA + valideringsmodal + PLAN-modal (L1493–1635), prop-signatur UÆNDRET.
- Render: rod-`<div className="flex flex-col gap-[48px]">` →
  `<PeriodeDatoVaelger heading="Afregningsperiode" days={afregningDays} selectedDate={selectedDate} onSelectDate={onSelectDate} />`
  → delt-`<div>`(`<OrdredetaljerSection …/>` + `<UdlaegningSection …/>`)
  → `<BilTonsAfregningSection …/>`
  → `<MaterielafregningSection …/>`
  → `<TimeafregningSection …/>`
  → CTA + modaler (uændret).

## Visual Pattern Reference (ORDRET)
- **Deep-teal h2** (Afregningsperiode): `font-poppins font-semibold text-xl text-deep-teal leading-tight mb-sm`
- **Tekst-primary h2** (Udlægning/Bil-tons/Materiel/Time): `font-poppins font-semibold text-xl text-text-primary mb-sm` (nogle uden `mb-sm`)
- **Boks-wrapper**: `bg-white border border-hairline rounded-xl overflow-hidden`
- **Token-violation** `gap-[48px]`: flyt ORDRET.

## Gate R4
`npm run formand:typecheck` grøn + Afregning-mode visuelt identisk (per-produkt udlægnings-tabs, bil-/materiel-/time-afregning, "Afslut dag"-validering + modaler).
