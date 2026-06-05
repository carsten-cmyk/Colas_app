import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
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
 * Sorterer vejesedler efter forretningsregel (tættest-på-færdig øverst, afsluttede sidst):
 * 1. aflaesning — ankommet plads, læsser af (tættest på færdig)
 * 2. undervejs — kortest etaMinutter øverst (ASC). null/undefined i bunden af gruppen.
 * 3. paa_fabrik — ved fabrik, indvejning/læsning aktiv
 * 4. paa_vej_til_fabrik — disponeret, afventer afhentning (længst fra færdig)
 * 5. dag_afsluttet — bilens næste-tur overflødiggjort (gråtonet i listen, IKKE bag collapsible)
 * 6. udlagt — afsluttede læs (nyeste modtagetTidspunkt øverst, DESC) — bag collapsible
 *
 * Ren funktion — kan testes isoleret.
 */
export function sorterVejesedler(vejesedler: Vejeseddel[]): Vejeseddel[] {
  const paaFabrik = vejesedler.filter((v) => v.status === 'paa_fabrik')

  const aflaesning = vejesedler.filter((v) => v.status === 'aflaesning')

  const undervejs = vejesedler
    .filter((v) => v.status === 'undervejs')
    .sort((a, b) => (a.etaMinutter ?? Infinity) - (b.etaMinutter ?? Infinity))

  const paaVej = vejesedler.filter((v) => v.status === 'paa_vej_til_fabrik')

  const dagAfsluttet = vejesedler.filter((v) => v.status === 'dag_afsluttet')

  const udlagte = vejesedler
    .filter((v) => v.status === 'udlagt')
    .sort((a, b) => {
      const ta = a.modtagetTidspunkt ? new Date(a.modtagetTidspunkt).getTime() : 0
      const tb = b.modtagetTidspunkt ? new Date(b.modtagetTidspunkt).getTime() : 0
      return tb - ta
    })

  // TODO: v2 — overvej separator-rækker mellem statusgrupper for visuel klarhed
  return [...aflaesning, ...undervejs, ...paaFabrik, ...paaVej, ...dagAfsluttet, ...udlagte]
}

const HEADER_KOLONNER = [
  'Vejeseddel',
  'Nummerplade',
  'Chauffør',
  'Telefon',
  'Produkt',
  'Fabrik',
  'Tons',
  'Udlægger',
  'Status / Temp.',
] as const

/**
 * Beregner total tons modtaget (alle statusser undtagen paa_vej_til_fabrik).
 * Filtrerer værdier der HAR været på fabrik — undtaget de biler der endnu ikke er ankommet.
 */
export function beregnModtagetTotal(vejesedler: Vejeseddel[]): number {
  return vejesedler
    .filter((v) => v.status !== 'paa_vej_til_fabrik')
    .reduce((sum, v) => sum + (v.tons ?? 0), 0)
}

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
  // Collapsible state for udlagte rækker — sammenfoldet som default
  const [udlagteExpanded, setUdlagteExpanded] = useState(false)

  const sorterteVejesedler = sorterVejesedler(vejesedler)
  // Split i aktive (vises altid) + udlagte (bag collapsible)
  const aktive = sorterteVejesedler.filter((v) => v.status !== 'udlagt')
  const udlagte = sorterteVejesedler.filter((v) => v.status === 'udlagt')

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
        <>
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
              {aktive.map((vejeseddel) => (
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
          {udlagte.length > 0 && (
            <>
              <button
                type="button"
                onClick={() => setUdlagteExpanded((prev) => !prev)}
                className="w-full flex items-center justify-start gap-xs py-xs px-sm border-t border-hairline bg-surface-2 hover:bg-hairline transition-colors"
              >
                <ChevronRight
                  size={14}
                  aria-hidden="true"
                  className={`text-text-muted transition-transform ${udlagteExpanded ? 'rotate-90' : ''}`}
                />
                <span className="font-inter text-xs font-semibold text-text-secondary">
                  Udlagt + temp-målt ({udlagte.length})
                </span>
              </button>
              {udlagteExpanded && (
                <div className="overflow-x-auto">
                <table className="w-full">
                  <tbody>
                    {udlagte.map((vejeseddel) => (
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
            </>
          )}
        </>
      )}
    </div>
  )
}
