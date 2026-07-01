import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { OvrigeOplysningerSkema3a } from '../../../components/ks/OvrigeOplysningerSkema3a'
import { OvrigeOplysningerSkema } from '../../../components/ks/OvrigeOplysningerSkema'
import { MksSkema } from '../../../components/ks/MksSkema'
import { SamleordreChildTabs } from '../../../components/SamleordreChildTabs'
import type { MockProduct, EkstraLinje, SamleordreContext } from '../../../types'

export interface KsRapporteringProps {
  /** Alle produkter i ordren — bruges til entreprisekontrol/temperaturmaaling-gate + sendes til KS-skemaerne */
  products: MockProduct[]
  /** Valgt dato — sendes videre til alle 3 KS-skemaer */
  selectedDate: string
  /** Ekstralinjer — løftet til OrdrePlanScreen-root, delt med AfregningContent */
  ekstraLinjer: EkstraLinje[]
  /** Tilføj ekstra-linje — closure fra container */
  addEkstraLinje: () => void
  /** Opdatér ekstra-linje — closure fra container */
  updateEkstraLinje: (id: string, field: keyof EkstraLinje, value: string | number) => void
  /** Fjern ekstra-linje — closure fra container */
  removeEkstraLinje: (id: string) => void
  /** Om ekstraarbejde er sendt (godkendt) — løftet til root */
  ekstraSent: boolean
  /** Setter for ekstraSent — løftet til root */
  setEkstraSent: (b: boolean) => void
  /** Reset ekstralinjer + ekstraSent — samlet callback fra container (erstatter setEkstraLinjer([]) + setEkstraSent(false)) */
  onResetEkstra: () => void
  // ── Samleordre child-tabs (Fase 2, Round 2) ─────────────────────────────────
  /** Samleordre-kontekst — children bruges til at bygge child-tab-rækken */
  samleordreCtx?: SamleordreContext | null
  /** Ordrenummer på aktuelt valgt child-tab — delt state fra root */
  samleordreTabOrderNr?: string
  /** Callback når bruger skifter child-tab — løfter valg til root */
  onSelectSamleordreTab?: (orderNumber: string) => void
  /** True når ordren er en samleordre med 2+ children — gater child-tab-blokken */
  isSamleordreMode?: boolean
}

export function KsRapporteringSection({
  products,
  selectedDate,
  ekstraLinjer,
  addEkstraLinje,
  updateEkstraLinje,
  removeEkstraLinje,
  ekstraSent,
  setEkstraSent,
  onResetEkstra,
  samleordreCtx,
  samleordreTabOrderNr,
  onSelectSamleordreTab,
  isSamleordreMode,
}: KsRapporteringProps) {
  // ── KS-rapportering state ────────────────────────────────────────────────────
  const [ksExpanded, setKsExpanded] = useState(false)
  const [ksActiveTab, setKsActiveTab] = useState<'a3' | 'a4' | 'mks'>('mks')

  // ── KS-rapportering ──────────────────────────────────────────────────────
  //     Conditional: vises kun når mindst ét produkt har entreprisekontrol eller
  //     temperaturmaaling sat (1 eller 2). Union på tværs af alle produkter —
  //     strengeste vinder (2 > 1 > undefined).
  //     TODO: Erstat med Supabase når klar — hent fra PLAN-system pr. produkt
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <>
      {(() => {
        // Beregn union af krav på tværs af alle produkter — strengeste vinder
        const maxEntreprisekontrol = products.reduce<1 | 2 | undefined>((max, p) => {
          if (p.entreprisekontrol === 2) return 2
          if (p.entreprisekontrol === 1 && max !== 2) return 1
          return max
        }, undefined)
        const maxTemperaturmaaling = products.reduce<1 | 2 | undefined>((max, p) => {
          if (p.temperaturmaaling === 2) return 2
          if (p.temperaturmaaling === 1 && max !== 2) return 1
          return max
        }, undefined)

        // Ingen krav → skjul hele sektionen
        if (!maxEntreprisekontrol && !maxTemperaturmaaling) return null

        // Niveau 2 (mindst ét produkt kræver det) → alle 3 tabs
        const showAllTabs = maxEntreprisekontrol === 2 || maxTemperaturmaaling === 2

        // ── Samleordre: child-tabs + sted-suffix ────────────────────────────────
        // Gate: kun ved samleordre med 2+ children (enkelt-ordre = ingen tabs)
        const showChildTabs =
          isSamleordreMode === true &&
          samleordreCtx != null &&
          samleordreCtx.children.length > 1 &&
          samleordreTabOrderNr != null

        // Aktiv child til header-suffix
        const activeChild = showChildTabs
          ? samleordreCtx?.children.find(c => c.orderNumber === samleordreTabOrderNr)
          : undefined

        // Tab-data: kun felterne SamleordreChildTabs forventer
        const childTabData = showChildTabs
          ? (samleordreCtx?.children ?? []).map(c => ({
              orderNumber: c.orderNumber,
              stedLabel: c.stedLabel,
              isAnchor: c.isAnchor,
            }))
          : []

        return (
          <section>
            {/* PATTERN MATCH: font-poppins font-semibold text-xl text-text-primary mb-sm — KsRapporteringSection.tsx:73 */}
            <h2 className="font-poppins font-semibold text-xl text-text-primary mb-sm">
              KS-rapportering{activeChild ? ` — ${activeChild.stedLabel}` : ''}
            </h2>
            {/* Child-tabs — vises direkte under h2, over boks (attached-variant kobler sig til boksen nedenunder) */}
            {showChildTabs && (
              <div className="mb-sm">
                <SamleordreChildTabs
                  children={childTabData}
                  activeOrderNumber={samleordreTabOrderNr!}
                  onSelect={(nr) => onSelectSamleordreTab?.(nr)}
                  variant="attached"
                />
              </div>
            )}
            <div className="w-full bg-surface border border-hairline rounded-2xl shadow-sm overflow-hidden mb-sm">
              <button
                type="button"
                onClick={() => setKsExpanded(o => !o)}
                className="w-full flex items-start justify-between px-md py-sm cursor-pointer hover:border-hairline-2 transition-colors"
                aria-expanded={ksExpanded}
              >
                {/* Venstre: collapsed preview-tekst */}
                <div className="flex flex-col gap-xxxs items-start">
                  {!ksExpanded && (
                    <div className="text-xs text-text-muted font-inter italic">
                      {showAllTabs ? 'A3, A4, MKS skal udfyldes' : 'MKS skal udfyldes'}
                    </div>
                  )}
                </div>

                {/* Højre: status-pille + chevron */}
                <div className="flex items-center gap-xs">
                  {!ksExpanded && (
                    <span className="inline-flex items-center px-sm py-xxxs rounded-full text-xxs font-medium bg-bad-bg text-bad border border-bad/30">
                      Mangler vurdering
                    </span>
                  )}
                  {ksExpanded ? <ChevronUp size={20} className="text-text-muted" /> : <ChevronDown size={20} className="text-text-muted" />}
                </div>
              </button>

            {ksExpanded && (
              <div className="p-md pt-sm">
                {/* Tab-rækken — identisk styling med makeOrdredetaljerCard-tabs (linje 1102-1128) */}
                <div className="inline-flex gap-xxxs">
                  {showAllTabs && (
                    <>
                      <button
                        onClick={() => setKsActiveTab('a3')}
                        aria-pressed={ksActiveTab === 'a3'}
                        className={[
                          'inline-flex items-center gap-xs px-md py-xs border border-hairline rounded-t-lg transition-colors font-inter text-xs font-semibold',
                          ksActiveTab === 'a3'
                            ? 'bg-white border-b-white text-deep-teal relative z-10 -mb-[1px]'
                            : 'bg-surface-2 text-text-muted hover:text-deep-teal',
                        ].join(' ')}
                      >
                        3a
                      </button>
                      <button
                        onClick={() => setKsActiveTab('a4')}
                        aria-pressed={ksActiveTab === 'a4'}
                        className={[
                          'inline-flex items-center gap-xs px-md py-xs border border-hairline rounded-t-lg transition-colors font-inter text-xs font-semibold',
                          ksActiveTab === 'a4'
                            ? 'bg-white border-b-white text-deep-teal relative z-10 -mb-[1px]'
                            : 'bg-surface-2 text-text-muted hover:text-deep-teal',
                        ].join(' ')}
                      >
                        4a
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setKsActiveTab('mks')}
                    aria-pressed={ksActiveTab === 'mks'}
                    className={[
                      'inline-flex items-center gap-xs px-md py-xs border border-hairline rounded-t-lg transition-colors font-inter text-xs font-semibold',
                      ksActiveTab === 'mks'
                        ? 'bg-white border-b-white text-deep-teal relative z-10 -mb-[1px]'
                        : 'bg-surface-2 text-text-muted hover:text-deep-teal',
                    ].join(' ')}
                  >
                    MKS
                  </button>
                </div>

                {/* Tab-content — box-pattern identisk med Udlægning-tab-content.
                    key={samleordreTabOrderNr}: remount pr. child-skift → frisk intern skema-state pr. child (Fase A).
                    Ægte per-child KS-data kræver SamleordreChild.ksDetails + MockProduct[] pr. child → separat sub-issue. */}
                <div
                  key={samleordreTabOrderNr}
                  className="bg-white border border-hairline overflow-hidden rounded-tr-xl rounded-b-xl p-md space-y-md"
                >
                  {ksActiveTab === 'a3' && showAllTabs && (
                    <OvrigeOplysningerSkema3a
                      products={products}
                      selectedDate={selectedDate}
                    />
                  )}
                  {ksActiveTab === 'a4' && showAllTabs && (
                    <OvrigeOplysningerSkema
                      variant="4a"
                      products={products}
                      selectedDate={selectedDate}
                    />
                  )}
                  {ksActiveTab === 'mks' && (
                    <MksSkema
                      products={products}
                      selectedDate={selectedDate}
                      ekstraarbejde={{
                        linjer: ekstraLinjer,
                        onAdd: addEkstraLinje,
                        onUpdate: updateEkstraLinje,
                        onRemove: removeEkstraLinje,
                        sent: ekstraSent,
                        onSend: () => { if (ekstraLinjer.length > 0) setEkstraSent(true) },
                        onReset: onResetEkstra,
                      }}
                    />
                  )}
                </div>
              </div>
            )}
            </div>
          </section>
        )
      })()}
    </>
  )
}
