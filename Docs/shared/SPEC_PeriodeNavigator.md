---
type: component-spec
component: PeriodeNavigator
location: shared/components/PeriodeNavigator.tsx
status: DRAFT — afventer Carstens godkendelse af API
created: 2026-06-04
consumers: fabrik/ProduktionsplanScreen, vognmand/VognmandGanttScreen, vognmand/VognmandListeScreen
---

# PeriodeNavigator — kanonisk periode-navigator

## Formål

Erstat tre divergerende periode-navigator-implementeringer (fabrik produktionsplan, vognmand gantt, vognmand liste) med én fælles, stylguide-konform komponent.

Eliminerer drift mellem apps og garanterer at fremtidige periode-skift bruger samme API + samme visuelle udtryk.

## Designprincipper

1. **Controlled component** — caller ejer ALL state. Navigator emitterer kun events.
2. **Mode-agnostisk** — accepterer `Date` (fabrik) eller offset-baseret periode-system (vognmand) via samme `onNavigate(direction)`-callback. Caller beregner ny værdi.
3. **Sammensætningsfleksibel** — view-mode-toggle og dato-label kan tændes/slukkes uafhængigt.
4. **Token-baseret** — ingen hardcodede farver, spacing eller font-sizes.

## Props

```ts
export type PeriodeNavigatorMode = 'uge' | '14-dage' | 'maaned'

export interface PeriodeNavigatorProps {
  /**
   * Liste over tilgængelige view-modes. Hvis udeladt eller tom array →
   * mode-toggle skjules helt (fabrik-use-case: kun dag).
   */
  modes?: PeriodeNavigatorMode[]

  /**
   * Den aktuelt valgte mode. Required hvis `modes` er sat.
   */
  activeMode?: PeriodeNavigatorMode

  /**
   * Kaldes når brugeren klikker en anden mode i toggle.
   * Caller skal selv nulstille offset / state hvis det er ønsket.
   */
  onModeChange?: (mode: PeriodeNavigatorMode) => void

  /**
   * Pile-navigation. Caller beregner selv ny dato/offset baseret på direction.
   * -1 = forrige periode/dag, +1 = næste periode/dag
   */
  onNavigate: (direction: -1 | 1) => void

  /**
   * "I dag"-knappen. Caller skal selv nulstille til i dag.
   * Hvis udeladt skjules knappen ikke — den kaldes simpelthen ikke noget.
   * (Knappen er obligatorisk i alle 3 use-cases — derfor required.)
   */
  onToday: () => void

  /**
   * Valgfri dato-label rendret af komponenten selv (fabrik-use-case).
   * Hvis undefined: caller rendrer dato-label separat udenfor navigatoren
   * (vognmand-use-case: label ligger i page-header).
   *
   * Forventet format: "1. juni 2026" (lang dansk format jf. DATOFORMAT.md).
   */
  dateLabel?: string

  /**
   * Hvor dato-label placeres når `dateLabel` er sat.
   * - 'inline' (default): mellem pilene som boks (fabrik-mønstret)
   * - 'none': renderes ikke (caller har label udenfor)
   *
   * Kept som eksplicit prop for at gøre intentionen tydelig.
   */
  dateLabelPosition?: 'inline' | 'none'

  /** Optional extra className på root-wrapperen */
  className?: string

  /** Aria-label for hele navigator-gruppen (default: "Periode-navigation") */
  ariaLabel?: string
}
```

## Use-case mapping

| App / skærm | modes | activeMode | dateLabel | onNavigate beregner |
|---|---|---|---|---|
| fabrik/Produktionsplan | `undefined` (skjuler toggle) | — | `formatDanskLangDato(selectedDate)` | `setSelectedDate(d => addDays(d, direction))` |
| vognmand/Gantt | `['uge', '14-dage', 'maaned']` | `viewMode` | `undefined` (label vises i page-header) | `setOffset(o => o + direction * viewDays)` |
| vognmand/Liste | `['uge', '14-dage', 'maaned']` | `viewMode` | `undefined` | `setOffset(o => o + direction * viewDays)` |

## Visuelt layout

Komponenten er en `flex items-center gap-3`-container med op til 3 logiske grupper:

```
[mode-toggle?] · [chevron-left] [date-label-box?] [I dag] [chevron-right]
```

Mode-toggle:
- Vises kun hvis `modes` har 1+ elementer
- Stil: matcher VognmandGantt linje 184-199 — `flex bg-white border border-hairline rounded-lg overflow-hidden` + aktiv knap = `bg-deep-teal text-white`, inaktiv = `text-text-muted hover:bg-soft-aqua`
- Labels: `uge` → "Uge", `14-dage` → "14 dage", `maaned` → "Måned"

Pile + I dag-gruppe:
- `flex items-center gap-1` (=`gap-xxxs`)
- Pile: `w-8 h-8 rounded-lg bg-white border border-hairline text-text-muted hover:bg-soft-aqua hover:text-deep-teal`, ikon: `ChevronLeft/Right size={16}` fra `lucide-react`
- "I dag"-knap: `px-3 py-2 font-inter text-xs font-medium bg-white border border-hairline rounded-lg text-text-muted hover:bg-soft-aqua hover:text-deep-teal`
- Inline dato-label (når `dateLabel` sat + `dateLabelPosition='inline'`): mellem pile, før "I dag", `px-sm py-xs font-inter text-sm font-medium bg-white border border-hairline rounded-lg text-text-primary min-w-[180px] text-center`

> **Note om border-token:** Fabrik bruger `border-hairline`; vognmand bruger `border-box-outline`. Begge er meget tæt-grå (`#E8E8E8` vs `#EDEDED`). Standard for ny komponent: **`border-hairline`** (mest udbredt token, brugt af fabrik + formand). Vognmand-prototyperne får en mikro-visuel ændring som accepteres — alternativt kan vi tilføje `borderToken` prop hvis afvigelsen er kritisk. Beslutning afventer.

## Visual Pattern Reference

- **Mode-toggle**: matcher `VognmandGanttScreen.tsx:184-199` — `flex bg-white border border-hairline rounded-lg overflow-hidden` + per-button `px-3 py-2 font-inter text-xs font-medium`
- **Pile-knapper**: matcher `ProduktionsplanScreen.tsx:1001-1007` — `w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-hairline text-text-muted hover:bg-soft-aqua hover:text-deep-teal transition-colors`
- **"I dag"-knap**: matcher `ProduktionsplanScreen.tsx:1011-1016` — `px-sm py-xs font-inter text-xs font-medium bg-white border border-hairline rounded-lg text-text-muted hover:bg-soft-aqua hover:text-deep-teal`
- **Inline dato-label**: matcher `ProduktionsplanScreen.tsx:1008-1010` — `px-sm py-xs font-inter text-sm font-medium bg-white border border-hairline rounded-lg text-text-primary min-w-[180px] text-center`
- **Container**: matcher `VognmandGanttScreen.tsx:182` — `flex items-center gap-3` (på root). Mode-toggle og pile-gruppe internt har egne `gap-1`.

## Tokens brugt

| Token | Brugt til |
|---|---|
| `bg-white`, `bg-deep-teal`, `bg-soft-aqua` | Knap-baggrund / hover / aktiv state |
| `text-text-muted`, `text-deep-teal`, `text-text-primary`, `text-white` | Tekst-farver |
| `border-hairline` | Knap-border (default valg, jf. note ovenfor) |
| `rounded-lg` | Border-radius på knapper og container |
| `px-3 py-2`, `px-sm py-xs`, `gap-1`, `gap-3` | Spacing |
| `font-inter`, `text-xs`, `text-sm`, `font-medium` | Typografi |
| `w-8 h-8` | Pile-knap-størrelse |

## Accessibility

- Pile har `aria-label="Forrige periode"` / `"Næste periode"`
- Mode-toggle-knapper er `<button>`-elementer; aktiv mode markeres med `aria-pressed={true}`
- "I dag"-knap har default tekst "I dag" (Aria-label = tekst)
- Container kan modtage `ariaLabel` prop (default: "Periode-navigation"), sættes på `<div role="group">`
- Min. touch target 44×44 brydes på `w-8 h-8` (32×32) — **kendt afvigelse fra prototyperne**. Vi bevarer det for nu (matcher eksisterende UX), men noteres her som fremtidig forbedring.

## Eksempler

### 1. Fabrik — kun dag, label inline

```tsx
const [selectedDate, setSelectedDate] = useState(new Date('2026-06-01'))

<PeriodeNavigator
  onNavigate={dir => setSelectedDate(d => addDays(d, dir))}
  onToday={() => setSelectedDate(new Date('2026-06-01'))}
  dateLabel={formatDanskLangDato(selectedDate)}
/>
```

### 2. Vognmand Gantt — mode-toggle + ekstern label

```tsx
const [viewMode, setViewMode] = useState<ViewMode>('14-dage')
const [offset, setOffset] = useState(0)

<PeriodeNavigator
  modes={['uge', '14-dage', 'maaned']}
  activeMode={viewMode}
  onModeChange={m => { setViewMode(m); setOffset(0) }}
  onNavigate={dir => setOffset(o => o + dir * getViewDays(viewMode))}
  onToday={() => setOffset(0)}
/>
```

### 3. Vognmand Liste — identisk med #2

(Samme API — UI-laget er ens på tværs af to vognmand-skærme.)

## Stories (PeriodeNavigator.stories.tsx)

Påkrævede stories:

1. `DagDetail` — fabrik-use-case (ingen mode-toggle, label inline)
2. `MedModeToggleUge` — vognmand-use-case med `activeMode='uge'`
3. `MedModeToggle14Dage` — vognmand-use-case med `activeMode='14-dage'` (default for vognmand)
4. `MedModeToggleMaaned` — vognmand-use-case med `activeMode='maaned'`
5. `MedInlineLabelOgToggle` — edge-case: både toggle OG inline label (skal renderes pænt)
6. `LangLabel` — test af `min-w-[180px]` på lange labels som "29. december 2026"

## States

- **Default**: alle knapper aktive
- **Hover**: per-knap `hover:bg-soft-aqua hover:text-deep-teal`
- **Disabled**: ikke i scope for v1 (ingen brug i prototyperne)
- **Loading/error**: N/A (rene UI-controls)

## Hvad denne komponent IKKE gør

- Beregner ikke `windowStart`, `windowEnd`, `days`-array → det er caller-ansvar
- Renderer ikke Gantt-headeren eller dato-grid → kun navigator-controls
- Formaterer ikke datoer → caller leverer færdigt formateret `dateLabel`
- Indkapsler ikke "I dag"-anker (TODAY-konstant) → caller ejer hvad "i dag" betyder

## Test plan (når komponent er bygget)

- Klik på pile → `onNavigate(-1)` / `onNavigate(1)` kaldes med korrekt direction
- Klik på "I dag" → `onToday` kaldes
- Klik på mode-toggle → `onModeChange(mode)` kaldes
- `modes={[]}` eller `modes={undefined}` → mode-toggle vises ikke i DOM
- `dateLabel` sat + `dateLabelPosition='inline'` → label-box rendret med min-width
- `dateLabel` undefined → label-box rendres ikke
