import type { ProgressBarProps } from './ProgressBar'
import { ProgressBar } from './ProgressBar'

export interface FremdriftCardProps {
  /** Hvilken af de 3 varianter — styrer om afvigelse vises */
  variant: 'tons-ankommet' | 'forventet-udlagt' | 'faktisk-udlagt'
  /** Uppercase-label øverst — fx "TONS ANKOMMET" */
  label: string
  /** Hoved-værdi som string — fx "65", "1.420", "–" */
  value: string
  /** Enhed efter value — fx "t", "m²" */
  unit: string
  /** Undertekst under progressbaren — fx "á 312 t dagens plan" */
  subtekst: string
  /** Progress 0–100+ — overskridelse er tilladt */
  progress: number
  /** Farve-variant for progressbaren */
  progressVariant: ProgressBarProps['variant']
  /**
   * Afvigelse i samme enhed som value.
   * Vises KUN når `variant='faktisk-udlagt'` og afvigelse !== 0.
   * Positiv (+) = over forventet → `text-good` (grøn)
   * Negativ (−) = under forventet → `text-bad` (rød)
   * 0 → skjult (no-op)
   */
  afvigelse?: number
  /** Valgfri ARIA-label på wrapperen */
  ariaLabel?: string
}

export function FremdriftCard({
  variant,
  label,
  value,
  unit,
  subtekst,
  progress,
  progressVariant,
  afvigelse,
  ariaLabel,
}: FremdriftCardProps) {
  const computedAriaLabel =
    ariaLabel ?? [label, value, unit].filter(Boolean).join(' ')

  const visAfvigelse =
    variant === 'faktisk-udlagt' &&
    afvigelse !== undefined &&
    afvigelse !== 0

  const afvigelsePositiv = afvigelse !== undefined && afvigelse > 0

  return (
    <div
      className="flex flex-col gap-xxs items-stretch min-w-[200px] p-sm rounded-xl border border-hairline bg-surface"
      aria-label={computedAriaLabel}
    >
      {/* Label */}
      <span className="font-inter text-xxs font-medium tracking-widest uppercase text-text-muted">
        {label}
      </span>

      {/* Value + enhed */}
      <div className="flex items-baseline gap-xxs">
        <span className="font-poppins text-xl font-semibold text-text-primary tabular-nums">
          {value}
        </span>
        {unit && (
          <span className="font-inter text-xs text-text-muted">
            {unit}
          </span>
        )}
      </div>

      {/* ProgressBar — inline width er runtime-beregnet (tilladt) */}
      <ProgressBar value={progress} variant={progressVariant} />

      {/* Subtekst */}
      <span className="font-inter text-xs text-text-muted">
        {subtekst}
      </span>

      {/* Afvigelse — kun for faktisk-udlagt, kun hvis !== 0 */}
      {visAfvigelse && (
        <span
          className={`font-inter text-xs font-medium ${
            afvigelsePositiv ? 'text-good' : 'text-bad'
          }`}
        >
          {afvigelsePositiv
            ? `+${afvigelse} ${unit} i forhold til forventet`
            : `−${Math.abs(afvigelse!)} ${unit} i forhold til forventet`}
        </span>
      )}
    </div>
  )
}
