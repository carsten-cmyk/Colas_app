import { ChevronLeft, ChevronRight } from 'lucide-react'

// Mode-labels til visning i toggle
const MODE_LABELS: Record<PeriodeNavigatorMode, string> = {
  uge: 'Uge',
  '14-dage': '14 dage',
  maaned: 'Måned',
}

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
   * Knappen vises altid — den vises blot med teksten "I dag".
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

/**
 * PeriodeNavigator — kanonisk periode-navigator til brug på tværs af
 * fabrik/ProduktionsplanScreen, vognmand/GanttScreen og vognmand/ListeScreen.
 *
 * Controlled component: caller ejer al state. Navigatoren emitterer kun events.
 *
 * @example Fabrik — kun dag, label inline
 * ```tsx
 * <PeriodeNavigator
 *   onNavigate={dir => setSelectedDate(d => addDays(d, dir))}
 *   onToday={() => setSelectedDate(new Date())}
 *   dateLabel={formatDanskLangDato(selectedDate)}
 * />
 * ```
 *
 * @example Vognmand — mode-toggle, ekstern label
 * ```tsx
 * <PeriodeNavigator
 *   modes={['uge', '14-dage', 'maaned']}
 *   activeMode={viewMode}
 *   onModeChange={m => { setViewMode(m); setOffset(0) }}
 *   onNavigate={dir => setOffset(o => o + dir * getViewDays(viewMode))}
 *   onToday={() => setOffset(0)}
 * />
 * ```
 */
export function PeriodeNavigator({
  modes,
  activeMode,
  onModeChange,
  onNavigate,
  onToday,
  dateLabel,
  dateLabelPosition = 'inline',
  className,
  ariaLabel = 'Periode-navigation',
}: PeriodeNavigatorProps) {
  const showModeToggle = modes !== undefined && modes.length > 0
  const showDateLabel = dateLabel !== undefined && dateLabelPosition === 'inline'

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={['flex items-center gap-3', className].filter(Boolean).join(' ')}
    >
      {/* Mode-toggle — vises kun hvis modes er sat med 1+ elementer */}
      {/* Pattern: VognmandGanttScreen.tsx:184-199 */}
      {showModeToggle && (
        <div className="flex bg-white border border-hairline rounded-lg overflow-hidden">
          {modes.map(mode => (
            <button
              key={mode}
              type="button"
              onClick={() => onModeChange?.(mode)}
              aria-pressed={mode === activeMode}
              className={[
                'px-3 py-2 font-inter text-xs font-medium transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-dark-teal/30',
                mode === activeMode
                  ? 'bg-deep-teal text-white'
                  : 'text-text-muted hover:bg-soft-aqua',
              ].join(' ')}
            >
              {MODE_LABELS[mode]}
            </button>
          ))}
        </div>
      )}

      {/* Pile + I dag + dato-label gruppe */}
      {/* Pattern: ProduktionsplanScreen.tsx:1001-1024 */}
      <div className="flex items-center gap-xxxs">
        {/* Forrige-pil */}
        {/*
         * TODO: Future improvement — bump til 44×44 hvis WCAG-audit kræver det.
         * Bevaret som w-8 h-8 (32×32) for at matche eksisterende prototype-UX.
         */}
        <button
          type="button"
          onClick={() => onNavigate(-1)}
          aria-label="Forrige periode"
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-hairline text-text-muted hover:bg-soft-aqua hover:text-deep-teal transition-colors focus:outline-none focus:ring-2 focus:ring-dark-teal/30"
        >
          <ChevronLeft size={16} aria-hidden="true" />
        </button>

        {/* Inline dato-label — vises kun hvis dateLabel er sat + dateLabelPosition='inline' */}
        {/* Pattern: ProduktionsplanScreen.tsx:1008-1010 */}
        {showDateLabel && (
          <div className="px-sm py-xs font-inter text-sm font-medium bg-white border border-hairline rounded-lg text-text-primary min-w-44 text-center">
            {dateLabel}
          </div>
        )}

        {/* I dag-knap */}
        {/* Pattern: ProduktionsplanScreen.tsx:1011-1016 */}
        <button
          type="button"
          onClick={onToday}
          className="px-sm py-xs font-inter text-xs font-medium bg-white border border-hairline rounded-lg text-text-muted hover:bg-soft-aqua hover:text-deep-teal transition-colors focus:outline-none focus:ring-2 focus:ring-dark-teal/30"
        >
          I dag
        </button>

        {/* Næste-pil */}
        {/*
         * TODO: Future improvement — bump til 44×44 hvis WCAG-audit kræver det.
         * Bevaret som w-8 h-8 (32×32) for at matche eksisterende prototype-UX.
         */}
        <button
          type="button"
          onClick={() => onNavigate(1)}
          aria-label="Næste periode"
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-hairline text-text-muted hover:bg-soft-aqua hover:text-deep-teal transition-colors focus:outline-none focus:ring-2 focus:ring-dark-teal/30"
        >
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
