# UI Patterns — Formand som source of truth

Catalogue af genbrugte mønstre i formand-appen. Vognmand og andre apps skal MATCHE
disse mønstre 1:1.

Sources scanned:
- `apps/formand/src/prototypes/dagsoversigt/DagsoversigtScreen.tsx`
- `apps/formand/src/prototypes/ordre-plan/OrdrePlanScreen.tsx`
- `apps/formand/src/prototypes/gantt/GanttScreen.tsx`
- `apps/formand/src/prototypes/transportberegner/TransportberegnerScreen.tsx`
- `apps/formand/src/components/ui/VejesedlerTable.tsx`

> Token-grundlag: alle størrelser/farver kommer fra `apps/formand/tailwind.config.ts`
> (xxs/xxxs/xs/sm/md/lg spacing, yellow/dark-teal/deep-teal/light-aqua brand, good/bad/warn-bg
> semantik, hairline/hairline-2/box-outline borders, surface/surface-2/page neutral,
> text-primary/secondary/muted, soft-aqua/soft-gray accents).

---

## 0. Inkonsistens i formand (advarsel)

Disse er afvigelser INDE i formand som brugeren skal kende inden align-fasen:

- **Border-token mix**: formand bruger primært `border-hairline` (#E8E8E8), men har
  også `border-box-outline` (#EDEDED) på Gantt-card og `border-hairline-2` (#DEDEDE)
  som "stærkere" outline (dashed buttons). De er IKKE interchangeable — Gantt-card
  uses `border-box-outline`, "tilføj"-states bruger `border-hairline-2`.
- **Status-pill radius**: V3 ordre-kort bruger `rounded-full`. V1/V2 (preserved dead code)
  bruger `rounded-md`. OrdrePlanScreen-materielrækken bruger `rounded-lg`. StatusPill-
  komponenten bruger `rounded-md`. → Der er ikke ÉN radius-standard for status-pills.
  V3 (rounded-full) er den nyeste retning iflg. session-snapshot `dagsoversigt_v3_design`.
- **Status-farver i StatusPill**: bruger hardcodede hex `#E7F4EE`/`#1F8A5B` selvom
  `good-bg`/`good` tokens findes (formand/StatusPill linje 2570-2572). Mindre violation
  men eksisterer.
- **OrdreKort venstre-strip**: V3-wrapperen bruger `bg-surface-2` (skiftet fra `bg-dark-teal`
  per session-snapshot). Visuel anker er nu meget subtil — dette er en LÅST beslutning,
  ikke en inkonsistens.

---

## 1. Status-pills (badges)

Formand bruger TO niveauer af status-pill — vælg efter kontekst.

### 1a. "Soft pill" — small uppercase-feeling, ofte i rækker/cards
Klasser (eksempel "Afventer vognmand"):
```
inline-flex items-center gap-[5px] px-xs py-xxxs rounded-lg
font-inter text-xs font-semibold text-[#8A6A00] bg-yellow/25
whitespace-nowrap
```
Med leading prik: `<span class="w-[6px] h-[6px] rounded-full bg-yellow flex-shrink-0" />`

Set i:
- `OrdrePlanScreen.tsx:1706-1709` — "Afventer vognmand"
- `OrdrePlanScreen.tsx:2209-2212` — "Afventer vognmand" (materiel)
- `OrdrePlanScreen.tsx:2152-2157` — variant uden prik

### 1b. "Bekræftet vognmand" — solid grøn
```
inline-flex items-center gap-[5px] px-xs py-xxxs rounded-lg
bg-[#2E9E65] font-inter text-xs font-semibold text-white whitespace-nowrap
```
Med inline `<CheckCircle2 size={11} />` ikon foran teksten.
Set i: `OrdrePlanScreen.tsx:2204-2207`, `:1702-1705`.

### 1c. V3 ordre-kort status — `rounded-full` pill
```
px-xs py-[2px] rounded-full font-inter font-semibold text-xs flex-shrink-0
```
Med farve-kombinationer:
- `planlagt` → `bg-good-bg text-good`
- `aktiv`    → `bg-deep-teal text-white`
- `afventer` → `bg-warn-bg text-deep-teal`

Set i: `DagsoversigtScreen.tsx:574-578, 605-608`.

### 1d. StatusPill helper-komponent (sendt/aflyst/afventer)
Fixed-width `w-[160px] h-[24px] inline-flex items-center justify-center gap-[5px]`,
`rounded-md`:
- Sendt: `bg-[#E7F4EE] border border-[#1F8A5B]/25` + prik `bg-[#1F8A5B]` + tekst `text-[#1F8A5B]`
- Aflyst: `bg-bad/10 border border-bad/30 text-bad`
- Afventer: `border border-dashed border-hairline text-text-muted` (font-medium ikke -semibold)

Set i: `OrdrePlanScreen.tsx:2564-2588`.

### 1e. Gantt-state badge
```
inline-block px-[6px] py-[2px] rounded-sm font-inter font-semibold text-[9px] leading-none w-fit
```
Farver:
- `active`    → `bg-[#2E9E65] text-white`
- `planned`   → `bg-dark-teal text-white`
- `completed` → `bg-light-aqua text-deep-teal`

Set i: `GanttScreen.tsx:153-157, 350-353`.

---

## 2. CTA-knapper

### 2a. Primær (solid deep-teal pill)
```
bg-deep-teal text-white font-poppins font-semibold text-xs
px-md py-xs rounded-full
inline-flex items-center gap-xxxs hover:opacity-90 transition-opacity
```
Set i: `DagsoversigtScreen.tsx:1117, 1173` ("Planlæg samleordre", "Planlæg").

Variant — modal-knap primær: `px-md py-xs rounded-full font-poppins font-semibold text-sm
text-white bg-deep-teal` (`OrdrePlanScreen` confirm/modal-knapper).

### 2b. Sekundær (white ghost pill)
```
font-inter font-medium text-sm text-text-secondary
bg-white border border-hairline rounded-full px-md py-xs
hover:bg-surface-2 transition-colors
```
Set i: `DagsoversigtScreen.tsx:1248-1251` (modal Annullér).

### 2c. Tertiær (dashed border — "Tilføj"-state)
```
bg-white border border-dashed border-hairline-2
text-dark-teal hover:bg-soft-aqua hover:text-deep-teal hover:border-deep-teal/40
rounded-full px-sm py-xs
font-poppins font-semibold text-xs
inline-flex items-center gap-xxxs transition-colors
```
Set i: `DagsoversigtScreen.tsx:1102-1110` ("+ Tilføj ordre").

### 2d. Grøn succes-CTA ("Godkend disponering", "Bekræft afregning")

- Tokens: `bg-good text-white font-poppins font-semibold text-xs px-md py-xs rounded-full inline-flex items-center gap-xxxs hover:opacity-90 transition-opacity`
- Brug: Når en handling er en GODKENDELSE/BEKRÆFTELSE (formand godkender afregning, vognmand bekræfter disponering). Skal IKKE bruges som generel primary — kun til positive confirmations.
- Set i: formand `Bil- og tonsafregning` godkend-flow, vognmand `VognmandDisponeringsScreen` Godkend-knap, `VognmandListeScreen` Disponer-knap.

### 2e. Tilbage-link / inline action
```
flex items-center gap-xxxs px-sm py-xs
font-inter text-xs font-medium text-dark-teal
hover:text-deep-teal hover:bg-soft-aqua rounded-lg transition-colors
```
Set i: `OrdrePlanScreen.tsx:1408-1413` ("Tilbage til dagsoversigt"),
`DagsoversigtScreen.tsx:866-871` ("Annullér").

### 2f. Icon-button (w-8 h-8, navigation)
```
w-8 h-8 flex items-center justify-center rounded-lg
bg-white border border-hairline
text-text-muted hover:bg-soft-aqua hover:text-deep-teal transition-colors
```
Set i: `GanttScreen.tsx:247-264`, `DagsoversigtScreen.tsx:909-928`.

### 2g. FAB (floating action button)
```
fixed bottom-[84px] right-md z-30
flex items-center gap-xs
bg-yellow text-deep-teal rounded-full pl-sm pr-md py-sm
font-poppins font-semibold text-sm
hover:opacity-90 transition-colors shadow-lg
```
Med leading icon-circle `w-6 h-6 bg-deep-teal/20 rounded-full`.
Set i: `DagsoversigtScreen.tsx:1193-1208`.

---

## 3. Tabel-headers (th)

```tsx
<thead>
  <tr className="border-b border-hairline bg-surface-2">
    <th scope="col"
        className="text-left font-inter text-xxs font-semibold text-text-muted
                   uppercase tracking-widest px-xs py-xxxs">
      Vejeseddel
    </th>
  </tr>
</thead>
```
Set i: `VejesedlerTable.tsx:120-132`.

Grid-baseret tabel-header (non-table HTML, samme styling):
```
px-sm py-xs flex items-end font-inter text-xxs font-medium
uppercase tracking-wide text-text-muted
bg-soft-aqua border-b border-box-outline
```
Set i: `GanttScreen.tsx:278-283` (Gantt-card header).

Nøgleregler:
- Background: `bg-surface-2` (table) ELLER `bg-soft-aqua` (Gantt-card)
- Font: `font-inter text-xxs font-semibold text-text-muted uppercase tracking-widest`
- Padding: `px-xs py-xxxs` (tabel-th) eller `px-sm py-xs` (grid-cell header)

---

## 4. Tabel-rows (tr / grid row)

- Border-bottom mellem rækker: `border-b border-hairline` (tabel)
  ELLER `divide-y divide-hairline` på parent (Ordrekort i OrdrePlanScreen)
- Padding: `px-sm py-sm` (16px/16px) — fx materiel-række i OrdrePlanScreen
- Hover på interaktive rækker: `hover:bg-[#F5F5F5]` (`#F5F5F5` = `surface-2`)
  Set i `OrdrePlanScreen.tsx:2187`

Grid-baseret 3-kol "kort med ikon + content + action":
```tsx
<div className="grid items-center gap-md px-sm py-sm"
     style={{ gridTemplateColumns: '36px 1fr auto' }}>
  <div className="w-9 h-9 rounded-md bg-[#F5F5F5] flex items-center justify-center text-deep-teal">
    <Truck size={16} />
  </div>
  <div>...</div>
  <div>...</div>
</div>
```
Set i: `OrdrePlanScreen.tsx:2136-2160`.

---

## 5. Section h2 (heading-pattern)

```
font-poppins font-semibold text-xl text-deep-teal leading-tight mb-sm
```
Set i: `OrdrePlanScreen.tsx:1425`, `:1450`, `DagsoversigtScreen.tsx:882-884`.

Variant for større "page-titel":
```
font-poppins font-semibold text-2xl text-deep-teal leading-tight
```
Set i: `GanttScreen.tsx:220-222`.

Variant for sub-section (text-primary, ikke teal):
```
font-poppins font-semibold text-xl text-text-primary mb-sm
```
Set i: `OrdrePlanScreen.tsx:2109` ("Materiellevering").

Page-header eyebrow over h1:
```
font-inter text-xs font-medium text-text-muted uppercase tracking-wide
```
Set i: `DagsoversigtScreen.tsx:879-881`, `GanttScreen.tsx:217-219`.

---

## 6. Info-bokse / cards

### 6a. Standard card
```
bg-white rounded-2xl border border-hairline shadow-sm overflow-hidden
```
Set i: `DagsoversigtScreen.tsx:1054, 1140`.

### 6b. Tabel-card (Gantt + tabel-wrappers)
```
bg-white rounded-lg shadow-md overflow-hidden
```
Set i: `GanttScreen.tsx:273`, `DagsoversigtScreen.tsx:936`.

Eller med border i stedet for shadow:
```
bg-white rounded-xl border border-hairline overflow-hidden
```
Set i: `OrdrePlanScreen.tsx:1188, 2176`, `VejesedlerTable.tsx:104`.

### 6c. Modal-card
```
relative bg-white rounded-2xl shadow-lg max-w-md w-full p-lg flex flex-col gap-md
```
Set i: `DagsoversigtScreen.tsx:1227`.

### 6d. Info-banner (soft-aqua)
```
bg-soft-aqua border border-deep-teal/20 rounded-xl px-md py-sm
flex items-center justify-between gap-sm
```
Med ikon-cirkel `w-8 h-8 bg-dark-teal rounded-full` + indhold + close-knap.
Set i: `DagsoversigtScreen.tsx:840-872`.

---

## 7. Form-input + label-pattern

### 7a. Label (uppercase tracking-widest)
```
font-inter text-xxs font-medium text-text-muted uppercase tracking-widest block mb-xxxs
```
Set i: `OrdrePlanScreen.tsx:1107, 1115, 1121, 1133, 1139` (Spec-grid labels).

Variant med `font-semibold` for stærkere visuel hierarki:
```
font-inter text-xxs font-semibold text-text-muted uppercase tracking-widest mb-sm
```
Set i: `OrdrePlanScreen.tsx:3551`.

### 7b. Tekst-input
```
font-inter text-xs text-text-primary bg-white border border-hairline rounded-lg
px-xs py-xs focus:outline-none focus:border-dark-teal placeholder:text-text-muted
```
Set i: `OrdrePlanScreen.tsx:2286, 2294, 2308`.

### 7c. Textarea
Samme stiltrin + `transition-colors resize-none leading-relaxed`.
Set i: `OrdrePlanScreen.tsx:2326-2330`.

### 7d. Ja/Nej-toggle-knapper (pill-stil med valgt-state)
```
px-xs py-xxxs rounded-full font-inter text-xs font-medium border transition-colors
<valgt>   bg-dark-teal text-white border-dark-teal
<unvalgt> bg-white text-text-muted border-hairline hover:border-dark-teal hover:text-dark-teal
```
Set i: `OrdrePlanScreen.tsx:2242-2249, 2356-2363`.

---

## 8. Toggle-pille (mode-switcher)

Hovedmønster — segmented control med deep-teal active:
```tsx
<div className="inline-flex bg-white border border-hairline rounded-full p-xxxs gap-xxxs shadow-sm">
  <button className={isActive
    ? 'bg-deep-teal text-white font-poppins font-semibold text-base px-lg py-sm rounded-full'
    : 'text-text-muted font-inter font-semibold text-base px-lg py-sm rounded-full hover:text-deep-teal'}>
    Planlægning
  </button>
</div>
```
Set i: `OrdrePlanScreen.tsx:1386-1406` (Planlægning/Udførsel/Afregning).

### 8b. View-toggle (uge/14-dage/maaned) — mindre, `rounded-lg`
```tsx
<div className="flex bg-white border border-hairline rounded-lg overflow-hidden">
  <button className={isActive
    ? 'bg-deep-teal text-white px-sm py-xs font-inter text-xs font-medium'
    : 'text-text-muted hover:bg-soft-aqua px-sm py-xs font-inter text-xs font-medium'}>
    Uge
  </button>
</div>
```
Set i: `GanttScreen.tsx:228-243`, `DagsoversigtScreen.tsx:890-905`.

---

## 9. Dato-pille (date-buttons)

### 9a. Kalender-strip dag-celle (kompakt, i Gantt-header)
- Wrapper: `flex flex-col items-center py-xs relative transition-colors min-h-[44px] justify-center`
- Background-states:
  - Valgt: `bg-deep-teal`
  - Weekend (ikke valgt): `bg-surface-2 hover:bg-light-aqua`
  - Normal: `hover:bg-light-aqua` (arver fra `bg-soft-aqua` parent)
- Today-dot (når ikke valgt): `w-[26px] h-[26px] rounded-full` med inline `backgroundColor: '#2E9E65'`
- Day-num font (i wrapper-cirkel): `font-poppins font-semibold text-xs`
  - Valgt: `text-yellow`
  - Today: `text-white`
  - Andre: `text-text-secondary`
- Day-short label: `font-inter text-xxs font-medium`
- "Har opgaver"-prik: `w-[5px] h-[5px] rounded-full bg-yellow` placeret absolute bottom-[3px]

Set i: `DagsoversigtScreen.tsx:939-1006`, `GanttScreen.tsx:278-317`.

### 9b. Dato-pille (større, i Asfaltbestilling)
```
flex items-center gap-xxxs px-sm py-xs rounded-full
font-poppins font-semibold text-sm transition-colors
```
- Sendt: `bg-good text-white shadow-sm` (med inline `<CheckCircle2 />` ikon)
- Valgt: `bg-deep-teal text-white shadow-sm`
- Default: `bg-white border border-hairline text-text-muted hover:border-dark-teal hover:text-deep-teal`

Set i: `OrdrePlanScreen.tsx:1462-1480`.

---

## 10. Modal-layout

```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center px-md"
     role="dialog" aria-modal="true">
  {/* Backdrop */}
  <button onClick={close} className="absolute inset-0 bg-deep-teal/40" />
  {/* Card */}
  <div className="relative bg-white rounded-2xl shadow-lg max-w-md w-full p-lg
                  flex flex-col gap-md">
    <h2 className="font-poppins font-semibold text-lg text-deep-teal leading-tight">…</h2>
    <p className="font-inter text-sm text-text-secondary leading-relaxed">…</p>
    <div className="flex items-center justify-end gap-xs">
      {/* Sekundær først, primær sidst */}
      <button className="…sekundær — pattern 2b…">Annullér</button>
      <button className="…primær — pattern 2a…">Bekræft</button>
    </div>
  </div>
</div>
```
- Backdrop: `bg-deep-teal/40` (ikke `bg-black/40`).
- Card: `rounded-2xl shadow-lg p-lg gap-md`.
- Heading: `text-lg` (ikke xl) i modal-kontekst.

Set i: `DagsoversigtScreen.tsx:1212-1263`.

---

## 11. Anchor-prik / primær-ordre indikator

To størrelser i brug:

### 11a. Small (6×6) — i tabs og sektioner
```
w-[6px] h-[6px] rounded-full bg-yellow flex-shrink-0
```
Set i: `OrdrePlanScreen.tsx:1086-1088` (samleordre-tab anchor).

### 11b. Large (10×10) med glow — i venstre rail address-blok
```
w-[10px] h-[10px] rounded-full flex-shrink-0
bg-yellow shadow-[0_0_0_2px_rgba(254,238,50,0.35)]
```
Alternativ (ikke-anchor): `bg-transparent border-2 border-hairline-2`.
Set i: `OrdrePlanScreen.tsx:1287-1294`.

### 11c. Medium (8×8) — sub-headers i Materiel
```
w-[8px] h-[8px] rounded-full flex-shrink-0
bg-yellow shadow-[0_0_0_2px_rgba(254,238,50,0.35)]
```
Set i: `OrdrePlanScreen.tsx:2118-2126`.

---

## 12. Filter-chip (separat fra status-pill)

Når active/inactive valgmuligheder i en filter-række (fx flåde-panel hos vognmand,
men også formand bruger dette mønster):
```
font-inter text-xs font-medium px-sm py-xxxs rounded-full border transition-colors
<aktiv>   bg-deep-teal text-white border-deep-teal
<inaktiv> bg-white text-text-muted border-hairline hover:border-dark-teal hover:text-deep-teal
```
Bemærk: dette er IDENTISK pattern som 7d (Ja/Nej-toggles) — samme styling.

---

## 13. Divider og whitespace

- Mellem sektioner i content: `<hr className="my-lg border-t border-hairline" />`
- Inden for card: `border-t border-hairline pt-xs mt-xs` på child-wrapper.
- Mellem kolonner i grids: `divide-x divide-hairline` (lyse korte) eller `divide-x divide-white/10` (på mørk bg).

---

## Token-checklist for ny komponent

Inden du shipper, tjek:
- [ ] Spacing er `xxs/xxxs/xs/sm/md/lg` — ALDRIG `p-3`, `gap-4`, `py-2.5`, `px-5` etc.
- [ ] Tekst-sizes er `text-xxs/xs/sm/md/lg/xl/2xl` — ALDRIG `text-[10px]`, `text-[11px]`, `text-[9px]`.
  - Undtagelser: kun hvis pattern selv bruger arbitrary value (fx StatusPill's `py-[2px]`).
- [ ] Farver er navngivne tokens — ALDRIG `bg-orange-50`, `text-orange-600`, `bg-orange-500`.
  Hvis "orange/delvist" status: brug `bg-warn-bg` + `text-deep-teal` eller `bg-yellow` familie.
- [ ] Border-radius: `rounded-sm/md/lg/xl/2xl` eller `rounded-full`.
- [ ] Font: `font-poppins` (headings) eller `font-inter` (body) — eksplicit på hvert element.
- [ ] Box-outline-tokens: brug `border-hairline` som default, `border-hairline-2` til "tilføj"-states,
  `border-box-outline` kun til Gantt-card.
