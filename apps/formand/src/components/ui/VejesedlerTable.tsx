import type { Vejeseddel, Recept } from '../../types/order'
import type { UdlaeggerEnhed } from '../../types/udlaegger'
import { VejeseddelRow } from './VejeseddelRow'

export interface VejesedlerTableProps {
  /** Alle vejesedler for dagens ordre — sorteres internt efter status og tid */
  vejesedler: Vejeseddel[]
  /** Recept-opslag pr. receptkode — parent leverer pre-løst map */
  recepter: Record<string, Recept>
  /** Minimumstemperatur for dagen i °C — bruges af TemperaturBadge til OK/Lav-status */
  minTemperatur: number
  /** Udlægger-liste fra ordren — videresendes til hver VejeseddelRow */
  udlaeggerliste: UdlaeggerEnhed[]
  /**
   * Fabriksnavne opslag: fabrik_id → navn.
   * Kan være tom — VejeseddelRow bruger fabrikNavn fra vejeseddel som fallback.
   */
  fabriksNavne?: Record<string, string>
  /** Kald når formand gemmer en temperatur — bobles fra VejeseddelRow → TemperaturBadge */
  onTemperatur: (vejeseddelId: string, temp: number) => void
  /** Kald når formand vælger udlægger — bobles fra VejeseddelRow → UdlaeggerDropdown */
  onUdlaegger: (vejeseddelId: string, materielNr: string) => void
  /**
   * Samleordre-children — kun sat når i samleordre-kontekst med 2+ ordrer.
   * Aktiverer ordre-dropdown på hver row.
   * TODO: Erstat med Supabase når klar
   */
  samleordreChildren?: { orderNumber: string; stedLabel: string }[]
  /**
   * Aktuelt valgt ordrenummer per vejeseddel-id.
   * Parent ejer state — TODO: Erstat med Supabase når klar
   */
  vejeseddelSelectedOrdre?: Record<string, string>
  /** Kald når formand skifter ordre-dropdown på en vejeseddel-row */
  onSelectOrdreForVs?: (vsId: string, orderNumber: string) => void
  /**
   * Per-ordre temperaturer: vejeseddelId → ordrenummer → temperatur.
   * TODO: Erstat med Supabase når klar
   */
  vejeseddelTempPerOrdre?: Record<string, Record<string, number>>
  /**
   * Per-ordre udlægger-valg: vejeseddelId → ordrenummer → materielNr.
   * TODO: Erstat med Supabase når klar
   */
  vejeseddelUdlaeggerPerOrdre?: Record<string, Record<string, string>>
}

/**
 * Sorterer vejesedler efter forretningsregel:
 * 1. Ankomne — nyeste modtagetTidspunkt øverst (DESC). Undefined timestamp i bunden.
 * 2. Undervejs — kortest etaMinutter øverst (ASC). null/undefined i bunden.
 * 3. På vej til fabrik — original rækkefølge bevaret.
 *
 * Ren funktion — kan testes isoleret.
 */
export function sorterVejesedler(vejesedler: Vejeseddel[]): Vejeseddel[] {
  const ankomne = vejesedler
    .filter((v) => v.status === 'ankommet')
    .sort((a, b) => {
      const ta = a.modtagetTidspunkt ? new Date(a.modtagetTidspunkt).getTime() : 0
      const tb = b.modtagetTidspunkt ? new Date(b.modtagetTidspunkt).getTime() : 0
      return tb - ta
    })

  const undervejs = vejesedler
    .filter((v) => v.status === 'undervejs')
    .sort((a, b) => (a.etaMinutter ?? Infinity) - (b.etaMinutter ?? Infinity))

  const paaVej = vejesedler.filter((v) => v.status === 'paa-vej-til-fabrik')

  // TODO: v2 — overvej separator-rækker mellem statusgrupper for visuel klarhed
  return [...ankomne, ...undervejs, ...paaVej]
}

const HEADER_KOLONNER = [
  'Vejeseddel',
  'Nummerplade',
  'Chauffør',
  'Produkt',
  'Fabrik',
  'Tons',
  'Udlægger',
  'Status / Temp.',
] as const

export function VejesedlerTable({
  vejesedler,
  recepter,
  minTemperatur,
  udlaeggerliste,
  fabriksNavne, // TODO: Videresend til VejeseddelRow når fabriks-opslag er implementeret
  onTemperatur,
  onUdlaegger,
  samleordreChildren,
  vejeseddelSelectedOrdre,
  onSelectOrdreForVs,
  vejeseddelTempPerOrdre,
  vejeseddelUdlaeggerPerOrdre,
}: VejesedlerTableProps) {
  void fabriksNavne
  const sorterteVejesedler = sorterVejesedler(vejesedler)

  return (
    <div className="overflow-hidden rounded-lg border border-hairline bg-surface">
      {vejesedler.length === 0 ? (
        <div
          className="px-sm py-md text-center"
          role="status"
          aria-live="polite"
        >
          <p className="text-text-muted text-sm font-inter">
            Ingen vejesedler endnu i dag
          </p>
          <p className="text-text-muted text-xs font-inter mt-xxxs">
            Læs ankommer automatisk fra PLAN — typisk 10 min forsinkelse
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-hairline bg-surface-2">
              {HEADER_KOLONNER.map((label) => (
                <th
                  key={label}
                  scope="col"
                  className="text-left font-inter text-xxs font-semibold text-text-muted uppercase tracking-widest px-xs py-xxxs"
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorterteVejesedler.map((vejeseddel) => (
              <VejeseddelRow
                key={vejeseddel.id}
                vejeseddel={vejeseddel}
                recept={
                  vejeseddel.receptkode
                    ? recepter[vejeseddel.receptkode]
                    : undefined
                }
                minTemperatur={minTemperatur}
                udlaeggerliste={udlaeggerliste}
                onTemperatur={onTemperatur}
                onUdlaegger={onUdlaegger}
                samleordreChildren={samleordreChildren}
                selectedOrdre={vejeseddelSelectedOrdre?.[vejeseddel.id]}
                onSelectOrdre={onSelectOrdreForVs}
                tempPerOrdre={vejeseddelTempPerOrdre?.[vejeseddel.id]}
                udlaeggerPerOrdre={vejeseddelUdlaeggerPerOrdre?.[vejeseddel.id]}
              />
            ))}
          </tbody>
        </table>
        </div>
      )}
    </div>
  )
}
