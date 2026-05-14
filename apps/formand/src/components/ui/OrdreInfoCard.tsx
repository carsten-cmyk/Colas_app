// TODO: Overvej at ekstrahere et fælles StatusBox-mønster sammen med
// status-bokse for Biler/Materiel/Forundersøgelse når layout er låst.

export interface OrdreInfoCardProps {
  /** Uppercase-label øverst — fx "AREAL I DAG" */
  label: string
  /** Hoved-værdi — string for at understøtte både tal og tekst ("SMA 11S", "5.420").
   *  Brug "–" som placeholder når værdien endnu ikke er beregnet. */
  value: string
  /** Valgfri enhed der vises efter value — fx "m²", "mm", "t" */
  unit?: string
  /** Valgfri undertekst — fx "á 31.200 m²", "82101H" */
  subtekst?: string
  /** Valgfri ARIA-label på wrapperen.
   *  Falder tilbage til en samlet streng af label + value + unit hvis ikke sat. */
  ariaLabel?: string
}

export function OrdreInfoCard({ label, value, unit, subtekst, ariaLabel }: OrdreInfoCardProps) {
  const computedAriaLabel =
    ariaLabel ?? [label, value, unit].filter(Boolean).join(' ')

  return (
    <div
      className="flex flex-col gap-xxxs items-start min-w-0 w-full h-full p-sm rounded-xl border border-hairline bg-surface"
      aria-label={computedAriaLabel}
    >
      {/* Label */}
      <span className="font-inter text-xxs font-medium tracking-widest uppercase text-text-muted">
        {label}
      </span>

      {/* Value + valgfri enhed */}
      <div className="flex items-baseline gap-xxs">
        <span className="font-poppins text-xl font-semibold text-text-primary tabular-nums">
          {value}
        </span>
        {unit !== undefined && (
          <span className="font-inter text-xs text-text-muted">
            {unit}
          </span>
        )}
      </div>

      {/* Valgfri undertekst */}
      {subtekst !== undefined && (
        <span className="font-inter text-xs text-text-muted">
          {subtekst}
        </span>
      )}
    </div>
  )
}
