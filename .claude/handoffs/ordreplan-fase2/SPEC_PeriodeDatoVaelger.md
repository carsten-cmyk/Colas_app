# SPEC — PeriodeDatoVaelger (Round 1, delt komponent)

**Fil:** `apps/formand/src/prototypes/ordre-plan/components/PeriodeDatoVaelger.tsx`
**Type:** Extraction af 3× byte-identisk inline-blok → 1 delt parametriseret komponent. Adfærd 100% uændret.
**Hvad den gør:** Horisontal stribe af dato-piller for en ordres planlagte dage; valgt dag highlightes, passerede dage gennemstreges. Klik vælger dag.

## Kilde (ORDRET kopi — de tre er identiske bortset fra heading/array/value/callback)
- Planlægning: `OrdrePlanScreen.tsx` L999–1028 (`planDays`, `selectedPlanDate`, `setSelectedPlanDate`, heading "Udføres i perioden")
- Udførsel: `content/UdfoerselContent.tsx` L227–258 (`udfoerselDays`, `selectedDate`, `setSelectedDate`, heading "Udføres i perioden")
- Afregning: `content/AfregningContent.tsx` L373–406 (`afregningDays`, `selectedDate`, `onSelectDate`, heading "Afregningsperiode")

Brug Udførsel-varianten (L229–257 inderside) som kanonisk markup-kilde. Den ydre `{days.length > 0 && (...)}`-guard bliver i kalderen ELLER i komponenten (vælg: i komponenten — returnér `null` hvis `days.length === 0`).

## Props (eksportér `PeriodeDatoVaelgerProps`)
```
heading: string            // "Udføres i perioden" | "Afregningsperiode"
days: string[]             // ISO-datoer, allerede sorteret af kalderen
selectedDate: string       // valgt ISO-dato
onSelectDate: (d: string) => void
```
Ingen `any`. Importér `formatLongDate` fra `@/utils/date`, `dateToString`+`TODAY` fra `../utils` (komponenten ligger i `components/` → `../utils`, `@/`-alias upåvirket).

## Visual Pattern Reference (ORDRET — kopier klasserne, ret intet)
- **Sektion-overskrift (h2)**: `font-poppins font-semibold text-xl text-deep-teal leading-tight mb-sm` (UdfoerselContent.tsx:230)
- **Pille-container**: `flex items-center gap-xs flex-wrap` (UdfoerselContent.tsx:231)
- **Dato-pille (base)**: `flex items-center gap-xxxs px-sm py-xs rounded-full font-poppins font-semibold text-sm transition-colors` (UdfoerselContent.tsx:243)
- **Valgt**: `bg-deep-teal text-white shadow-sm`
- **Passeret**: `bg-white border border-hairline text-text-muted line-through hover:border-dark-teal`
- **Fremtidig**: `bg-white border border-hairline text-text-muted hover:border-dark-teal hover:text-deep-teal`
- `aria-pressed={isSelected}`, `aria-label={`${formatLongDate(ds)}${isPast ? ' (overstået)' : ''}`}`

## Tokens
Kun ovenstående token-klasser. Ingen hex/px. (Ingen violations i kilden — ren kopi.)

## Bruger
`formatLongDate`, `dateToString`, `TODAY`. Ingen andre komponenter.

## Wiring (sker i integrations-trin #6/#12/#17 — ikke her)
Hver kalder erstatter sin inline `<section>…</section>`-blok med:
`<PeriodeDatoVaelger heading="…" days={…Days} selectedDate={…} onSelectDate={…} />`

## Post-build
Tilføj `PeriodeDatoVaelger` til `COMPONENT_REGISTRY.md` (formand-prototype, 🟡 prototype-lokal — kandidat til shared ved produktions-promotion).
