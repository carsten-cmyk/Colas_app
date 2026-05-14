export interface ProgressBarProps {
  /**
   * Aktuel fremgang i procent.
   * - 0–100: normal progression
   * - >100: overskridelse — fill clampes visuelt til 150 % men aria-valuenow bevares
   * - <0: behandles som 0
   */
  value: number
  /** Farve-variant — styrer fill-farven på baren */
  variant: 'good' | 'warn' | 'bad'
  /** Valgfri label vist over baren, fx "65 t af 90 t" */
  label?: string
  /** Valgfri subtekst vist under baren, fx "á 1.040 t total" */
  subtekst?: string
  /**
   * Valgfri ARIA-label til skærmlæsere.
   * Falder tilbage til `label` hvis ikke sat.
   */
  ariaLabel?: string
}

/**
 * Variant → Tailwind fill-klasse.
 *
 * `warn` bruger `bg-yellow` frem for `bg-warn-bg` (#FFF6CC) fordi warn-bg er for
 * lys til at give tilstrækkelig kontrast som progress-fill på den hvide track.
 */
const variantFillClass: Record<ProgressBarProps['variant'], string> = {
  good: 'bg-good',
  warn: 'bg-yellow',
  bad: 'bg-bad',
}

/**
 * Beregner den visuelle bredde af fill-elementet.
 * - Negativ input clampes til 0 %
 * - Værdier over 100 clampes til 150 % (overskridelses-indikation, ikke ubegrænset)
 */
function computeFillWidth(value: number): string {
  if (value <= 0) return '0%'
  if (value > 100) return '150%'
  return `${value}%`
}

export function ProgressBar({
  value,
  variant,
  label,
  subtekst,
  ariaLabel,
}: ProgressBarProps) {
  const fillWidth = computeFillWidth(value)
  const fillClass = variantFillClass[variant]
  const effectiveAriaLabel = ariaLabel ?? label

  return (
    <div className="flex flex-col gap-xxxs w-full">
      {label !== undefined && (
        <span className="font-inter text-xs text-text-secondary">{label}</span>
      )}

      {/* Track */}
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={effectiveAriaLabel}
        className="h-2 w-full rounded-full bg-surface-2 overflow-hidden"
      >
        {/* Fill — inline width er den eneste tilladte inline-style her (runtime-beregnet) */}
        <div
          className={`h-full rounded-full ${fillClass} transition-[width] duration-300`}
          style={{ width: fillWidth }}
        />
      </div>

      {subtekst !== undefined && (
        <span className="font-inter text-xxs text-text-muted">{subtekst}</span>
      )}
    </div>
  )
}
