import type { UdlaeggerEnhed } from '../../types/udlaegger'

export interface UdlaeggerDropdownProps {
  /** Hele materiel-listen på ordren — filtreres internt på anlaegsNr-prefix "9-" */
  materielListe: UdlaeggerEnhed[]
  /** Aktuelt valgt udlægger-anlægsnummer — null = intet valgt */
  selected: string | null
  /** Kald når formand vælger en udlægger */
  onChange: (materielnr: string) => void
  /** Disable hele dropdownen (fx for undervejs-/på-vej-til-fabrik-rækker) */
  disabled?: boolean
  /** Valgfri placeholder-tekst der vises som første option */
  placeholder?: string
}

export function UdlaeggerDropdown({
  materielListe,
  selected,
  onChange,
  disabled = false,
  placeholder = 'Vælg udlægger',
}: UdlaeggerDropdownProps) {
  const udlaeggere = materielListe.filter((m) => m.anlaegsNr.startsWith('9-'))
  const ingenUdlaeggere = udlaeggere.length === 0

  return (
    <select
      aria-label="Vælg udlægger"
      value={selected ?? ''}
      disabled={disabled || ingenUdlaeggere}
      title={
        disabled
          ? 'Tilgængelig når læsset er ankommet'
          : ingenUdlaeggere
            ? 'Ingen udlæggere registreret på denne ordre'
            : undefined
      }
      onChange={(e) => onChange(e.target.value)}
      className={[
        'w-full max-w-[200px]',
        'px-xs py-xxxs',
        'rounded-md',
        'border border-hairline',
        'bg-surface',
        'font-inter text-xs text-text-primary',
        'min-h-[44px]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow',
        'disabled:bg-surface-2 disabled:text-text-muted disabled:cursor-not-allowed',
        'transition-colors',
      ].join(' ')}
    >
      {ingenUdlaeggere ? (
        <option value="" disabled>
          Ingen udlæggere registreret
        </option>
      ) : (
        <>
          <option value="" disabled>
            {placeholder}
          </option>
          {udlaeggere.map((u) => (
            <option key={u.anlaegsNr} value={u.anlaegsNr}>
              {u.anlaegsNr} · {u.beskrivelse}
            </option>
          ))}
        </>
      )}
    </select>
  )
}
