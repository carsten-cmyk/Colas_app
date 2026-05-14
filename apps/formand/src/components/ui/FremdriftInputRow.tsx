import { useState, useId, useEffect } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FremdriftInputRowValues {
  /** Faktisk udlagt m² */
  faktiskM2: number
  /** Faktisk udlagte tons */
  faktiskTons: number
}

export interface FremdriftInputRowProps {
  /** Densitet i kg/m³ fra recept — fx 2400 for SMA 11S */
  densitet: number
  /** Planlagt tykkelse i mm fra ordre — bruges til ±%-sammenligning */
  planTykkelse: number
  /** Initiale værdier — fx senest gemte registrering */
  initial?: FremdriftInputRowValues
  /** Kald når formand trykker "Gem" — sender begge værdier */
  onSave: (values: FremdriftInputRowValues) => void
  /** Valgfri disable — fx hvis dagen er afsluttet */
  disabled?: boolean
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Beregner faktisk tykkelse i mm: tons × 1_000_000 / (m² × densitet_kg_per_m³). Returnerer null ved ugyldige divisorer. */
function beregnTykkelse(tons: number, m2: number, densitet: number): number | null {
  if (m2 <= 0 || densitet <= 0) return null
  return (tons * 1_000_000) / (m2 * densitet)
}

/**
 * Formaterer afvigelsesprocent med tegn.
 * Minustegn bruger U+2212 (matematisk minustegn).
 */
function formaterAfvigelse(pct: number): string {
  const rounded = Math.round(pct * 10) / 10
  if (rounded > 0) return `+${rounded.toFixed(1)}%`
  if (rounded < 0) return `−${Math.abs(rounded).toFixed(1)}%`
  return '±0%'
}

/** Formaterer tykkelse: heltal vises uden decimal, ellers 1 decimal */
function formaterTykkelse(mm: number): string {
  return Number.isInteger(mm) ? `${mm}` : mm.toFixed(1)
}

/** Returnerer true hvis inputværdien er et positivt tal */
function erPositivtTal(value: string): boolean {
  const n = parseFloat(value)
  return !isNaN(n) && isFinite(n) && n > 0
}

// ─── Komponent ────────────────────────────────────────────────────────────────

export function FremdriftInputRow({
  densitet,
  planTykkelse,
  initial,
  onSave,
  disabled = false,
}: FremdriftInputRowProps) {
  const m2Id = useId()
  const tonsId = useId()

  const [m2Value, setM2Value] = useState<string>(
    initial ? String(initial.faktiskM2) : ''
  )
  const [tonsValue, setTonsValue] = useState<string>(
    initial ? String(initial.faktiskTons) : ''
  )
  const [gemt, setGemt] = useState(false)

  const m2Gyldig = erPositivtTal(m2Value)
  const tonsGyldig = erPositivtTal(tonsValue)
  const kanGemme = m2Gyldig && tonsGyldig && !disabled

  // Live-beregning: vises så snart begge felter er gyldige
  const visBeregning = m2Gyldig && tonsGyldig
  const tykkelse = visBeregning
    ? beregnTykkelse(parseFloat(tonsValue), parseFloat(m2Value), densitet)
    : null
  const afvigelsePct =
    tykkelse !== null
      ? ((tykkelse - planTykkelse) / planTykkelse) * 100
      : null

  useEffect(() => {
    if (!gemt) return
    const timer = setTimeout(() => setGemt(false), 2000)
    return () => clearTimeout(timer)
  }, [gemt])

  function handleGem() {
    if (!kanGemme) return
    const m2 = parseFloat(m2Value)
    const tons = parseFloat(tonsValue)
    // TODO: Erstat med Supabase når klar — gem til dagsoverblik_registreringer
    onSave({ faktiskM2: m2, faktiskTons: tons })
    setGemt(true)
  }

  return (
    <div className="flex flex-col gap-xs px-sm py-sm rounded-xl border border-hairline bg-surface">
      {/* Input-række */}
      <div className="flex items-end gap-sm flex-wrap">
        {/* m²-felt */}
        <div className="flex flex-col gap-xxs">
          <label
            htmlFor={m2Id}
            className="font-inter text-xxs text-text-muted uppercase tracking-wider"
          >
            kvm
          </label>
          <input
            id={m2Id}
            type="text"
            inputMode="decimal"
            placeholder="kvm"
            value={m2Value}
            onChange={(e) => {
              setM2Value(e.target.value)
              setGemt(false)
            }}
            disabled={disabled}
            aria-label="Faktisk udlagt m²"
            className="w-24 px-xs py-xxxs rounded-md border border-hairline bg-surface text-sm text-text-primary font-inter tabular-nums min-h-[44px] focus:outline-none focus:ring-2 focus:ring-dark-teal/30 disabled:opacity-40 disabled:cursor-not-allowed [appearance:textfield]"
          />
        </div>

        {/* Tons-felt */}
        <div className="flex flex-col gap-xxs">
          <label
            htmlFor={tonsId}
            className="font-inter text-xxs text-text-muted uppercase tracking-wider"
          >
            tons
          </label>
          <input
            id={tonsId}
            type="text"
            inputMode="decimal"
            placeholder="tons"
            value={tonsValue}
            onChange={(e) => {
              setTonsValue(e.target.value)
              setGemt(false)
            }}
            disabled={disabled}
            aria-label="Faktisk udlagte tons"
            className="w-24 px-xs py-xxxs rounded-md border border-hairline bg-surface text-sm text-text-primary font-inter tabular-nums min-h-[44px] focus:outline-none focus:ring-2 focus:ring-dark-teal/30 disabled:opacity-40 disabled:cursor-not-allowed [appearance:textfield]"
          />
        </div>

        {/* Gem-knap */}
        <button
          type="button"
          onClick={handleGem}
          disabled={!kanGemme}
          aria-disabled={!kanGemme}
          aria-label="Gem faktisk udlagt"
          className="px-sm py-xs rounded-lg bg-yellow text-text-primary font-inter font-semibold text-sm min-h-[44px] hover:brightness-95 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {gemt ? 'Gemt ✓' : 'Gem'}
        </button>
      </div>

      {/* Beregnet tykkelse-linje */}
      <p
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="font-inter text-xs text-text-secondary"
      >
        {visBeregning && tykkelse !== null && afvigelsePct !== null ? (
          <>
            Faktisk tykkelse:{' '}
            <span className="tabular-nums font-inter font-medium text-text-primary">
              {formaterTykkelse(tykkelse)} mm
            </span>{' '}
            · plan {planTykkelse} mm · {formaterAfvigelse(afvigelsePct)}
          </>
        ) : (
          <>Faktisk tykkelse: &ndash;</>
        )}
      </p>
    </div>
  )
}
