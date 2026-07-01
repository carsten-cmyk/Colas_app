/**
 * PROTOTYPE — MaterielleveringSection
 *
 * Extraction fra OrdrePlanScreen.tsx L1982–2157 (Fase 2, Round 3, #11).
 * JSX kopieret ORDRET — ingen redesign, ingen adfærdsændring.
 * Se SPEC: .claude/handoffs/ordreplan-fase2/SPEC_Planlaegning_Sections.md #11
 *
 * Lokal UI-state (tilfoejMaterielOpen, materielSoeg, fjernModalId) flyttes hertil —
 * de bruges KUN inden for denne sektion.
 * Root-delt state (resources, transportPlaner, etaper, materielUiState,
 * bekraeftedeEnhederIds, materielSendteEnhederIds, samleordreCtx, isSamleordreMode,
 * selectedPlanDate) trådes ind som props + callbacks.
 *
 * Må ikke importeres i produktionskode.
 */

import { useState } from 'react'
import { Truck, Plus } from 'lucide-react'
import {
  type Etape,
  type MaterielTransportPlan,
  transportKey,
} from '../../../etape'
import type { TransportPlanPatch, MaterielEnhed as MaterielEnhedTilstand } from '../../../MaterielTilstande'
import {
  MaterielPlanlaegTilstand,
  MaterielNyEtapeTilstand,
  MaterielPaaPladsenTilstand,
  MaterielDvaleTilstand,
} from '../../../MaterielTilstande'
import type { MaterielUiState } from '../../../etape'
import { FjernModal } from '../../../components/FjernModal'
import { STANDARD_MATERIEL_KATALOG } from '../../../mocks'
import type { MockResource, SamleordreContext } from '../../../types'

// ─── Props ────────────────────────────────────────────────────────────────────

export interface MaterielleveringSectionProps {
  /** Alle maskine-ressourcer på ordren */
  resources: MockResource[]
  /** Transport-planer keyed på transportKey(resourceId, etapeId) */
  transportPlaner: Record<string, MaterielTransportPlan>
  /** Alle etaper klynget fra faktisk-planlagte dage */
  etaper: Etape[]
  /** Afledt UX-tilstand for den valgte dag */
  materielUiState: MaterielUiState
  /** Subset af resources filtreret til MaterielEnhed-format (ingen 'egen-korsel') */
  materielResources: MaterielEnhedTilstand[]
  /** Den etape der indeholder selectedPlanDate — undefined i dvale-gap */
  aktivEtape: Etape | undefined
  /** Valgt dag i dato-strimlen (YYYY-MM-DD) */
  selectedPlanDate: string
  /** Set af transportKey-nøgler der er bekræftet af vognmand */
  bekraeftedeEnhederIds: Set<string>
  /** Set af transportKey-nøgler der er sendt til vognmand */
  materielSendteEnhederIds: Set<string>
  /** Er ordren en samleordre */
  isSamleordreMode: boolean
  /** Samleordre-context — undefined i normal mode */
  samleordreCtx: SamleordreContext | null
  /** Handler: opdater ét felt på én transport-plan */
  onTransportChange: (resourceId: string, etapeId: number, patch: TransportPlanPatch) => void
  /** Handler: gem + marker transport som planlagt for én enhed i én etape */
  onTransportGem: (resourceId: string, etapeId: number) => void
  /** Handler: send alle planlagte usendte enheder i etapen til vognmand */
  onMaterielSend: (etape: Etape) => void
  /** Handler: fjern en ressource fra ordren permanent */
  onFjernResource: (resourceId: string) => void
  /** Handler: tilføj en ny ressource fra katalog — katalogets items har ikke id-felt */
  onTilfoejResource: (katalogItem: { plantNumber: string; description: string; transportTag: MockResource['transportTag'] }) => void
}

// ─── Komponent ────────────────────────────────────────────────────────────────

export function MaterielleveringSection({
  resources,
  transportPlaner,
  etaper,
  materielUiState,
  materielResources,
  aktivEtape,
  selectedPlanDate,
  bekraeftedeEnhederIds,
  materielSendteEnhederIds,
  isSamleordreMode,
  samleordreCtx,
  onTransportChange,
  onTransportGem,
  onMaterielSend,
  onFjernResource,
  onTilfoejResource,
}: MaterielleveringSectionProps) {
  // ── Lokal UI-state (kun brugt inden for denne sektion) ──────────────────────
  const [tilfoejMaterielOpen, setTilfoejMaterielOpen] = useState(false)
  const [materielSoeg, setMaterielSoeg] = useState('')
  const [fjernModalId, setFjernModalId] = useState<string | null>(null)

  const fjernModalResource = fjernModalId ? resources.find(r => r.id === fjernModalId) : null

  // ─── JSX (kopieret ORDRET fra OrdrePlanScreen.tsx L1982–2157) ───────────────

  return (
    <>
      {/* ── Materiel ─────────────────────────────────────────── */}
      <section>
        <h2 className="font-poppins font-semibold text-xl text-text-primary mb-sm">Materiellevering</h2>

        {/* Ny-etape container-niveau notifikation.
            NOTE: MaterielNyEtapeTilstand (presenter) indeholder allerede et internt
            warn-bg-banner med samme budskab ("Planlæg materiel-transport for etape N").
            Det banner er synligt øverst i presenter-kortet, umiddelbart under denne
            overskrift — et yderligere container-banner her ville være redundant.
            Vi stoler på presenter-banneret og tilføjer i stedet kun en diskret
            sektion-label-tilføjelse via mb-justering nedenfor.
            Kilde: Round 4b-opgave, kriterium (b). */}
        {!isSamleordreMode && materielUiState === 'ny-etape' && (
          <p className="font-inter text-xs text-text-muted mb-xs">
            Ny etape planlagt — materiel-transport skal planlægges
          </p>
        )}

        {/* Samleordre: vis sub-header pr. ordre */}
        {isSamleordreMode && samleordreCtx && (
          <>
            {samleordreCtx.children.map((child, childIdx) => (
              <div key={child.orderNumber} className={childIdx > 0 ? 'mt-md' : undefined}>
                {/* Sub-header pr. ordre */}
                <div className="flex items-center gap-xs mb-xs">
                  <span
                    className={[
                      'w-[8px] h-[8px] rounded-full flex-shrink-0',
                      child.isAnchor
                        ? 'bg-yellow shadow-[0_0_0_2px_rgba(254,238,50,0.35)]'
                        : 'bg-transparent border-2 border-hairline-2',
                    ].join(' ')}
                    aria-hidden="true"
                  />
                  <h3 className="font-poppins font-semibold text-md text-deep-teal">
                    {child.udfoerelseSted}
                  </h3>
                </div>

                {child.resources.length > 0 ? (
                  <div className="bg-white border border-hairline rounded-xl overflow-hidden mb-sm">
                    {child.resources.map((r, i) => (
                      <div key={r.id} className={i < child.resources.length - 1 ? 'border-b border-hairline' : ''}>
                        <div
                          className="grid items-center gap-md px-sm py-sm"
                          style={{ gridTemplateColumns: '36px 1fr auto' }}
                        >
                          <div className="w-9 h-9 rounded-md bg-soft-aqua flex items-center justify-center text-deep-teal">
                            <Truck size={16} />
                          </div>
                          <div>
                            <p className="font-inter text-sm font-medium text-text-primary">{r.description}</p>
                            <div className="flex items-center gap-xs mt-xxxs">
                              <span className="font-inter text-xs text-text-muted tabular-nums">{r.plantNumber}</span>
                            </div>
                          </div>
                          <div>
                            {/* Vognmand status badge — 3-state — re-keyed til transportKey(resourceId, etapeId) (Round 4a). */}
                            {(() => {
                              const etapeId = aktivEtape?.id ?? 0
                              const key = transportKey(r.id, etapeId)
                              if (r.status !== 'planlagt') {
                                return (
                                  <span className="inline-flex items-center px-xs py-xxxs rounded-lg font-inter text-xs font-semibold whitespace-nowrap bg-surface-2 text-text-muted">
                                    Ikke planlagt
                                  </span>
                                )
                              }
                              if (bekraeftedeEnhederIds.has(key)) {
                                return (
                                  <span className="inline-flex items-center px-xs py-xxxs rounded-lg bg-good-bg font-inter text-xs font-semibold text-good whitespace-nowrap">
                                    Sendt til vognmand
                                  </span>
                                )
                              }
                              if (materielSendteEnhederIds.has(key)) {
                                return (
                                  <span className="inline-flex items-center px-xs py-xxxs rounded-lg bg-good-bg font-inter text-xs font-semibold text-good whitespace-nowrap">
                                    Sendt til vognmand
                                  </span>
                                )
                              }
                              return (
                                <span className="inline-flex items-center px-xs py-xxxs rounded-lg bg-warn-bg font-inter text-xs font-semibold text-text-secondary whitespace-nowrap">
                                  Planlagt
                                </span>
                              )
                            })()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white border border-hairline rounded-xl px-sm py-sm mb-sm flex items-center gap-xs text-text-muted">
                    <span className="font-inter text-sm">Ingen materiel planlagt</span>
                  </div>
                )}
              </div>
            ))}
          </>
        )}

        {/* Normal mode: etape-bevidste presentere (Round 4a) */}
        {!isSamleordreMode && (() => {
          // Brancher på materielUiState — afledt af selectedPlanDate + etaper
          if (materielUiState === 'planlaeg' && aktivEtape) {
            return (
              <>
                <MaterielPlanlaegTilstand
                  resources={materielResources}
                  etape={aktivEtape}
                  transportPlaner={transportPlaner}
                  onChange={(resourceId, patch) =>
                    onTransportChange(resourceId, aktivEtape.id, patch)
                  }
                  onGem={(resourceId) =>
                    onTransportGem(resourceId, aktivEtape.id)
                  }
                  onSend={() => onMaterielSend(aktivEtape)}
                />
                <button
                  type="button"
                  onClick={() => { setTilfoejMaterielOpen(true); setMaterielSoeg('') }}
                  className="w-full flex items-center justify-center gap-xs py-xs font-inter text-sm text-text-muted border border-hairline rounded-xl bg-surface hover:bg-surface-2 transition-colors mt-xxxs"
                >
                  <Plus size={14} aria-hidden="true" />
                  Tilføj materiel
                </button>
              </>
            )
          }
          if (materielUiState === 'ny-etape' && aktivEtape) {
            return (
              <>
                <MaterielNyEtapeTilstand
                  resources={materielResources}
                  etape={aktivEtape}
                  transportPlaner={transportPlaner}
                  onChange={(resourceId, patch) =>
                    onTransportChange(resourceId, aktivEtape.id, patch)
                  }
                  onGem={(resourceId) =>
                    onTransportGem(resourceId, aktivEtape.id)
                  }
                  onSend={() => onMaterielSend(aktivEtape)}
                />
                <button
                  type="button"
                  onClick={() => { setTilfoejMaterielOpen(true); setMaterielSoeg('') }}
                  className="w-full flex items-center justify-center gap-xs py-xs font-inter text-sm text-text-muted border border-hairline rounded-xl bg-surface hover:bg-surface-2 transition-colors mt-xxxs"
                >
                  <Plus size={14} aria-hidden="true" />
                  Tilføj materiel
                </button>
              </>
            )
          }
          if (materielUiState === 'paa-pladsen' && aktivEtape) {
            return (
              <MaterielPaaPladsenTilstand
                resources={materielResources}
                etape={aktivEtape}
                transportPlaner={transportPlaner}
              />
            )
          }
          // dvale (gap mellem etaper eller dag uden etape)
          const naestEtape = etaper.find(e => e.firstDay > selectedPlanDate)
          return (
            <MaterielDvaleTilstand
              naestEtapeStartDato={naestEtape?.firstDay}
            />
          )
        })()}

      </section>

      {/* ── Tilføj materiel modal (kopieret ORDRET fra OrdrePlanScreen.tsx L2249–2334) ── */}
      {tilfoejMaterielOpen && (() => {
        const soegLower = materielSoeg.toLowerCase()
        const filtered = STANDARD_MATERIEL_KATALOG.filter(m =>
          m.description.toLowerCase().includes(soegLower) ||
          m.plantNumber.toLowerCase().includes(soegLower)
        )
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center px-md"
            role="dialog"
            aria-modal="true"
            aria-labelledby="tilfoej-materiel-modal-title"
          >
            {/* Luk på klik udenfor */}
            <button
              type="button"
              aria-label="Luk dialog"
              onClick={() => setTilfoejMaterielOpen(false)}
              className="absolute inset-0 bg-deep-teal/40"
            />
            <div className="relative bg-white rounded-2xl shadow-lg w-full max-w-md flex flex-col gap-md p-lg max-h-[80vh]">
              {/* Header */}
              <div className="flex items-center justify-between gap-sm">
                <h2
                  id="tilfoej-materiel-modal-title"
                  className="font-poppins font-semibold text-lg text-deep-teal leading-tight"
                >
                  Tilføj materiel
                </h2>
                <button
                  type="button"
                  aria-label="Luk"
                  onClick={() => setTilfoejMaterielOpen(false)}
                  className="flex items-center justify-center w-[44px] h-[44px] rounded-xl border border-hairline text-text-muted hover:text-text-primary hover:border-hairline-2 transition-colors"
                >
                  ✕
                </button>
              </div>
              {/* Søgefelt */}
              <input
                type="search"
                placeholder="Søg på navn eller anlægsnr."
                value={materielSoeg}
                onChange={e => setMaterielSoeg(e.target.value)}
                className="w-full font-inter text-sm text-text-primary bg-white border border-hairline rounded-lg px-sm py-xs focus:outline-none focus:border-deep-teal transition-colors"
              />
              {/* Katalog-liste */}
              <div className="flex flex-col divide-y divide-hairline overflow-y-auto -mx-lg px-lg">
                {filtered.length === 0 && (
                  <p className="font-inter text-sm text-text-muted py-sm text-center">Ingen maskiner matcher søgningen.</p>
                )}
                {filtered.map(mat => (
                  <button
                    key={mat.plantNumber}
                    type="button"
                    onClick={() => {
                      onTilfoejResource(mat)
                      setTilfoejMaterielOpen(false)
                    }}
                    className="flex items-center justify-between gap-sm py-xs min-h-touch text-left hover:bg-surface-2 transition-colors rounded-lg -mx-xs px-xs"
                  >
                    <div className="flex flex-col gap-xxs min-w-0">
                      <span className="font-inter text-sm font-semibold text-text-primary truncate">{mat.description}</span>
                      <span className="font-inter text-xxs text-text-muted">{mat.plantNumber}</span>
                    </div>
                  </button>
                ))}
              </div>
              {/* Annuller-knap */}
              <button
                type="button"
                onClick={() => setTilfoejMaterielOpen(false)}
                className="w-full py-xs rounded-xl border border-hairline font-inter font-semibold text-sm text-text-secondary hover:border-hairline-2 transition-colors"
              >
                Annuller
              </button>
            </div>
          </div>
        )
      })()}

      {/* ── Fjern maskine modal (kopieret ORDRET fra OrdrePlanScreen.tsx L2240–2248) ── */}
      {fjernModalResource && (
        <FjernModal
          resource={fjernModalResource}
          onConfirm={() => onFjernResource(fjernModalResource.id)}
          onCancel={() => setFjernModalId(null)}
        />
      )}
    </>
  )
}
