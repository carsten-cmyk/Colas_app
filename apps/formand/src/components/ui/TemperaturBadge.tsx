import { useRef, useState } from 'react'

export interface TemperaturBadgeProps {
  /** Registreret temperatur i °C. `null` = ikke registreret endnu → vis inputfelt */
  temperatur: number | null
  /** Minimumstemperatur for OK-status — fra ordre/dag */
  minTemperatur: number
  /** Kald når formand gemmer en ny temperatur (Enter eller blur) */
  onSave: (temperatur: number) => void
  /**
   * Deaktiverer komponenten — viser "–" tekst uden interaktion.
   * Bruges fx hvis vejeseddel er undervejs eller afleveret.
   */
  disabled?: boolean
}

type Pill = 'OK' | 'Lav'

function StatusPill({ status }: { status: Pill }) {
  const isOk = status === 'OK'
  return (
    <span
      role="status"
      aria-label={`Temperaturstatus: ${status}`}
      className={[
        'inline-flex items-center px-sm py-xxxs rounded-full',
        'font-inter font-semibold text-xxs leading-none',
        isOk
          ? 'bg-good-bg text-good border border-good/30'
          : 'bg-warn-bg text-text-primary border border-hairline',
      ].join(' ')}
    >
      {status}
    </span>
  )
}

export function TemperaturBadge({
  temperatur,
  minTemperatur,
  onSave,
  disabled = false,
}: TemperaturBadgeProps) {
  /** Styrer om vi er i redigeringstilstand (også brugt til at redigere eksisterende værdi) */
  const [editing, setEditing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Disabled + ingen registreret temperatur → vis stille "–"
  if (disabled && temperatur === null) {
    return (
      <span className="font-inter text-sm text-text-muted" aria-label="Temperatur ikke registreret">
        –
      </span>
    )
  }

  // Vis registreret værdi — klik åbner redigering igen
  if (temperatur !== null && !editing) {
    const status: Pill = temperatur < minTemperatur ? 'Lav' : 'OK'
    return (
      <button
        type="button"
        disabled={disabled}
        aria-disabled={disabled}
        onClick={() => {
          if (!disabled) setEditing(true)
        }}
        className={[
          'flex items-center gap-xs bg-transparent border-none p-0 cursor-pointer',
          'focus-visible:ring-2 focus-visible:ring-dark-teal/30 rounded-sm outline-none',
          'min-h-[44px] min-w-[44px]',
          disabled ? 'cursor-default' : '',
        ].join(' ')}
        aria-label={`Temperatur ${temperatur} grader Celsius — klik for at redigere`}
      >
        <span
          className="font-inter text-xs font-medium text-text-primary tabular-nums"
          aria-hidden="true"
        >
          {temperatur} °C
        </span>
        <StatusPill status={status} />
      </button>
    )
  }

  // Inputtilstand — enten temperatur === null eller editing === true
  function handleCommit(rawValue: string) {
    const parsed = parseFloat(rawValue)
    if (!isNaN(parsed) && rawValue.trim() !== '') {
      onSave(parsed)
      setEditing(false)
    } else {
      // Ugyldig eller tom — annullér redigering hvis vi havde en eksisterende værdi
      setEditing(false)
    }
  }

  return (
    <div className="flex items-center gap-xxxs">
      <input
        ref={inputRef}
        type="text"
        inputMode="decimal"
        min={0}
        max={300}
        step="any"
        defaultValue={temperatur ?? undefined}
        placeholder="–"
        disabled={disabled}
        aria-label="Indtast temperatur i grader Celsius"
        className={[
          'w-16 px-xs py-xxxs rounded-md border border-hairline',
          'bg-surface text-xs text-text-primary font-inter tabular-nums',
          'min-h-[44px]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow',
          'placeholder:text-text-muted',
          disabled ? 'text-text-muted cursor-not-allowed' : '',
        ].join(' ')}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.currentTarget.blur()
          }
          if (e.key === 'Escape') {
            setEditing(false)
          }
        }}
        onBlur={(e) => {
          handleCommit(e.currentTarget.value)
        }}
        // eslint-disable-next-line jsx-a11y/no-autofocus
        autoFocus={editing}
      />
      <span className="font-inter text-xs text-text-muted" aria-hidden="true">
        °C
      </span>
    </div>
  )
}
