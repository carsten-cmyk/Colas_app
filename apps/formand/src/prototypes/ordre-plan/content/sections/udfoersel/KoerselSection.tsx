import { useState } from 'react'
import { VejesedlerTable } from '@/components/ui/VejesedlerTable'
import { INITIAL_RECEPTER } from '@/mocks/recepter'
import { INITIAL_UDLAEGGERE } from '@/mocks/udlaeggere'
import type { Vejeseddel } from '@/types/order'
import type { MockProduct, SamleordreContext } from '../../../types'
import { getEffectiveTons } from '../../../utils'

// ── KoerselSectionProps ───────────────────────────────────────────────────────

export interface KoerselSectionProps {
  /** Vejesedler for dagens ordre — fra useVejesedler-hook i container. TODO: Erstat med Supabase når klar */
  vejesedler: Vejeseddel[]
  /** Minimum-temperatur fra aktiv recept — fra useRecept-hook i container. TODO: Erstat med Supabase når klar */
  minTemperatur: number
  /** Alle produkter i ordren — til aktivt-produkt-filter + estimat-beregning */
  products: MockProduct[]
  /** Valgt dato i Udførelse-mode — bruges til at filtrere aktive produkter */
  selectedDate: string
  /** True når Ordre-plan vises i samleordre-kontekst */
  isSamleordreMode?: boolean
  /** Samleordre-context med children (anchor + andre ordrer) når isSamleordreMode === true */
  samleordreCtx?: SamleordreContext | null
}

// ── KoerselSection ────────────────────────────────────────────────────────────

/**
 * Kørsel-sektionen i Udfoersel-mode.
 * Tidl. "Vejesedler" — datanavnet Vejeseddel beholdes internt.
 *
 * Extraction fra UdfoerselContent.tsx L1062–1146 (ORDRET).
 * State der flyttes med ind: vejeseddelSelectedOrdre, vejeseddelTempPerOrdre, vejeseddelUdlaeggerPerOrdre.
 * Props ind: vejesedler (hook i container), minTemperatur (hook i container), products, selectedDate,
 *            isSamleordreMode, samleordreCtx.
 */
export function KoerselSection({
  vejesedler,
  minTemperatur,
  products,
  selectedDate,
  isSamleordreMode,
  samleordreCtx,
}: KoerselSectionProps) {
  // ── Samleordre per-ordre vejeseddel-state ────────────────────────────────────
  // Kun aktiv i samleordre-mode: formanden kan logge temperatur + udlægger separat pr. ordre pr. vejeseddel.
  // Default: anchor-ordre (første child med isAnchor). TODO: Erstat med Supabase når klar
  const [vejeseddelSelectedOrdre, setVejeseddelSelectedOrdre] = useState<Record<string, string>>({})
  const [vejeseddelTempPerOrdre, setVejeseddelTempPerOrdre] = useState<Record<string, Record<string, number>>>({})
  const [vejeseddelUdlaeggerPerOrdre, setVejeseddelUdlaeggerPerOrdre] = useState<Record<string, Record<string, string>>>({})

  /** Returnerer aktuelt valgt ordrenummer for en vejeseddel — fallback til anchor-child */
  function getSelectedOrdreForVs(vsId: string): string {
    return (
      vejeseddelSelectedOrdre[vsId] ??
      samleordreCtx?.children.find((c) => c.isAnchor)?.orderNumber ??
      samleordreCtx?.children[0]?.orderNumber ??
      ''
    )
  }

  return (
    <>
      {/* ── Kørsel (synlig overskrift; tidl. "Vejesedler" — datanavnet Vejeseddel beholdes internt) ── */}
      {/* TODO (produktion): Sektion filtreres på (selectedProductId, selectedDate) */}
      <section>
        <div className="flex items-center justify-between mb-sm">
          <h2 className="font-poppins font-semibold text-xl text-text-primary">Kørsel</h2>
          {/* Kompakt produkt-statusbar — pulje-læs-guard (Carsten 2026-06-05) */}
          {/* Logik: 1 aktivt produkt på dato → vis, 2+ → skjul (pulje-læs-risiko), 0 → skjul */}
          {/* TODO: Erstat med Supabase ordre-estimat pr. dag når klar */}
          {(() => {
            const aktiveProdukter = products.filter((p) =>
              p.days.some((d) => d.date === selectedDate && !d.cancelled)
            )
            if (aktiveProdukter.length !== 1) return null

            const produkt = aktiveProdukter[0]
            const dagsplan = produkt.days.find((d) => d.date === selectedDate && !d.cancelled)
            // effective tons = planlagt + evt. ekstra fra PLAN
            const estimat = dagsplan ? getEffectiveTons(dagsplan) : produkt.tonsTotal
            const udlagt = vejesedler
              .filter((v) => v.receptkode === produkt.recipeCode && v.status === 'udlagt')
              .reduce((sum, v) => sum + (v.tons ?? 0), 0)
            const pct = estimat > 0 ? Math.min(100, Math.round((udlagt / estimat) * 100)) : 0
            const produktNavn = INITIAL_RECEPTER[produkt.recipeCode]?.navn ?? produkt.recipeCode

            return (
              <div className="inline-flex items-center gap-xs bg-surface-2 rounded-full px-md py-xs">
                <span className="font-inter text-xxs font-semibold uppercase tracking-widest text-text-muted">
                  Status
                </span>
                <span className="font-poppins text-xs font-semibold text-text-primary">
                  {produktNavn}
                </span>
                <div className="h-2 w-28 bg-white rounded-full overflow-hidden">
                  <div
                    className="h-full bg-good rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="font-poppins text-xs font-semibold text-text-secondary whitespace-nowrap">
                  {udlagt % 1 === 0 ? udlagt : udlagt.toFixed(1)} Tons af {estimat} Tons · {pct}%
                </span>
              </div>
            )
          })()}
        </div>
        <VejesedlerTable
          vejesedler={vejesedler}
          recepter={INITIAL_RECEPTER}
          minTemperatur={minTemperatur}
          udlaeggerliste={INITIAL_UDLAEGGERE}
          onTemperatur={(vsId, temp) => {
            if (isSamleordreMode && samleordreCtx) {
              // Samleordre-mode: skriv temperatur til den valgte ordre på denne vejeseddel
              const ordreNr = getSelectedOrdreForVs(vsId)
              setVejeseddelTempPerOrdre(prev => ({
                ...prev,
                [vsId]: { ...(prev[vsId] ?? {}), [ordreNr]: temp },
              }))
            }
            // TODO (produktion): skriv retur til PLAN pr. ordre
          }}
          onUdlaegger={(vsId, materielNr) => {
            if (isSamleordreMode && samleordreCtx) {
              // Samleordre-mode: skriv udlægger-valg til den valgte ordre på denne vejeseddel
              const ordreNr = getSelectedOrdreForVs(vsId)
              setVejeseddelUdlaeggerPerOrdre(prev => ({
                ...prev,
                [vsId]: { ...(prev[vsId] ?? {}), [ordreNr]: materielNr },
              }))
            }
            // TODO (produktion): opdater vejeseddel pr. ordre
          }}
          samleordreChildren={
            isSamleordreMode && samleordreCtx && samleordreCtx.children.length > 1
              ? samleordreCtx.children.map(c => ({ orderNumber: c.orderNumber, stedLabel: c.stedLabel }))
              : undefined
          }
          vejeseddelSelectedOrdre={vejeseddelSelectedOrdre}
          onSelectOrdreForVs={(vsId, orderNumber) =>
            setVejeseddelSelectedOrdre(prev => ({ ...prev, [vsId]: orderNumber }))
          }
          vejeseddelTempPerOrdre={vejeseddelTempPerOrdre}
          vejeseddelUdlaeggerPerOrdre={vejeseddelUdlaeggerPerOrdre}
        />
      </section>
    </>
  )
}
