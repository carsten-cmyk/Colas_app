import { CheckCircle2 } from 'lucide-react'
import type { TimeafregningFraPlan, MaterielEnhed } from '../../../types'

// ─── MaterielafregningSection ─────────────────────────────────────────────────
// Extraction fra AfregningContent.tsx L1309–1468 (ORDRET).
// State ejes af AfregningContent-containeren og trådes ind som props.
// Ingen adfærdsændring, ingen redesign.

export interface MaterielafregningProps {
  /** Spejler om materielafregning er godkendt — cross-cutting (bruges også af validerAfregning) */
  materielAfregningGodkendt: boolean
  /** Setter — ejes af container (bruges i validerAfregning + handleAfslutDag) */
  onSetMaterielAfregningGodkendt: (v: boolean) => void

  /** Styrer om timeafregning hentes fra PLAN (Case B: timer per enhed) eller ej (Case A: samlet holdpakke) */
  timeafregningFraPlan: TimeafregningFraPlan
  /** Setter — lokalt i container (PLAN-modal-trigger bruger det) */
  onSetTimeafregningFraPlan: (v: TimeafregningFraPlan) => void

  /** Per-anlæg toggle: anlaegsNr → boolean (true = anvendt).
   *  Ejes af container — trådes ind + out via setters. */
  materielAnvendt: Record<string, boolean>
  onSetMaterielAnvendt: (updater: (prev: Record<string, boolean>) => Record<string, boolean>) => void

  /** Per-anlæg timer: anlaegsNr → number.
   *  Ejes af container. */
  materielTimer: Record<string, number>
  onSetMaterielTimer: (updater: (prev: Record<string, number>) => Record<string, number>) => void

  /** Samlet timer for hele holdpakken (Case A: timeafregningFraPlan === 'nej') */
  holdpakkeTimer: number
  onSetHoldpakkeTimer: (v: number) => void

  /** Liste af materiel-enheder fra holdpakken — fra MATERIEL_ENHEDER mock.
   *  TODO: Erstat med Supabase når klar */
  MATERIEL_ENHEDER: MaterielEnhed[]
}

export function MaterielafregningSection({
  materielAfregningGodkendt,
  onSetMaterielAfregningGodkendt,
  timeafregningFraPlan,
  onSetTimeafregningFraPlan,
  materielAnvendt,
  onSetMaterielAnvendt,
  materielTimer,
  onSetMaterielTimer,
  holdpakkeTimer,
  onSetHoldpakkeTimer,
  MATERIEL_ENHEDER,
}: MaterielafregningProps) {
  return (
    /* ── Materiel ─────────────────────────────────────────────── */
    /* TODO (produktion): Sektion (Materielafregning) filtreres på (selectedProductId, selectedDate) */
    <section>
      <div className="flex flex-wrap items-center justify-between gap-sm mb-sm">
        <div className="flex items-center gap-xs">
          <h2 className="font-poppins font-semibold text-xl text-text-primary">Materielafregning</h2>
          {materielAfregningGodkendt && (
            <span className="inline-flex items-center bg-good text-white font-inter font-semibold text-xs px-sm py-xxxs rounded-full">
              Afregning godkendt
            </span>
          )}
          {/* TODO: Fjernes — kun til demo. I produktion kommer feltet fra PLAN */}
          <span className="font-inter text-xxs text-text-muted uppercase tracking-widest">Demo:</span>
          {(['nej', 'ja'] as TimeafregningFraPlan[]).map(v => (
            <button
              key={v}
              type="button"
              onClick={() => onSetTimeafregningFraPlan(v)}
              className={[
                'font-inter text-xs px-xs py-xxxs rounded-full border transition-colors',
                timeafregningFraPlan === v
                  ? 'bg-deep-teal text-white border-deep-teal font-semibold'
                  : 'bg-surface text-text-secondary border-hairline hover:border-dark-teal',
              ].join(' ')}
            >
              Timeafregning: {v === 'ja' ? 'Ja' : 'Nej'}
            </button>
          ))}
        </div>
      </div>

      {!materielAfregningGodkendt && (
        <div className="overflow-hidden rounded-lg border border-hairline bg-surface mb-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-hairline bg-soft-aqua">
                  <th className="text-left font-inter text-xxs font-semibold text-text-muted uppercase tracking-widest px-xs py-xxxs">Anlæg</th>
                  <th className="text-left font-inter text-xxs font-semibold text-text-muted uppercase tracking-widest px-xs py-xxxs">Beskrivelse</th>
                  <th className="text-right font-inter text-xxs font-semibold text-text-muted uppercase tracking-widest px-xs py-xxxs">
                    {timeafregningFraPlan === 'nej' ? 'Anvendt' : 'Timer brugt'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {MATERIEL_ENHEDER.map((enhed, i) => {
                  const isLast = i === MATERIEL_ENHEDER.length - 1
                  return (
                    <tr
                      key={enhed.anlaegsNr}
                      className={!isLast ? 'border-b border-hairline' : ''}
                    >
                      <td className="align-middle font-inter text-xs font-semibold text-text-primary tabular-nums px-xs py-xs">{enhed.anlaegsNr}</td>
                      <td className="align-middle font-inter text-xs text-text-primary px-xs py-xs">{enhed.beskrivelse}</td>
                      <td className="align-middle px-xs py-xs text-right">
                        {timeafregningFraPlan === 'nej' ? (
                          // Case A: toggle switch
                          <div className="flex justify-end">
                            <button
                              type="button"
                              role="switch"
                              aria-checked={materielAnvendt[enhed.anlaegsNr] ?? true}
                              aria-label={`${enhed.beskrivelse} anvendt`}
                              onClick={() =>
                                onSetMaterielAnvendt(prev => ({
                                  ...prev,
                                  [enhed.anlaegsNr]: !(prev[enhed.anlaegsNr] ?? true),
                                }))
                              }
                              className={[
                                'relative inline-flex items-center w-9 h-5 rounded-full transition-colors',
                                (materielAnvendt[enhed.anlaegsNr] ?? true)
                                  ? 'bg-good'
                                  : 'bg-hairline-2',
                              ].join(' ')}
                            >
                              <span
                                className={[
                                  'inline-block w-4 h-4 rounded-full bg-white shadow transition-transform',
                                  (materielAnvendt[enhed.anlaegsNr] ?? true) ? 'translate-x-[18px]' : 'translate-x-[2px]',
                                ].join(' ')}
                              />
                            </button>
                          </div>
                        ) : (
                          // Case B: timer-input per enhed
                          <div className="flex justify-end">
                            <input
                              type="text"
                              inputMode="decimal"
                              value={materielTimer[enhed.anlaegsNr] ?? ''}
                              onChange={e =>
                                onSetMaterielTimer(prev => ({ ...prev, [enhed.anlaegsNr]: parseFloat(e.target.value) || 0 }))
                              }
                              className="bg-surface border border-hairline rounded-md px-xs py-xxxs text-xs tabular-nums w-[100px] text-right focus:outline-none focus:border-dark-teal"
                              aria-label={`Timer for ${enhed.beskrivelse}`}
                            />
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
                <tr className="border-t border-hairline">
                  <td colSpan={3} className="px-sm py-xs">
                    <div className="flex flex-wrap items-start justify-between gap-sm">
                      <div className="flex flex-col gap-xs">
                        {timeafregningFraPlan === 'nej' && (
                          <div className="flex items-center gap-xs">
                            <label className="font-inter text-xxs text-text-muted uppercase tracking-widest whitespace-nowrap">Anvendte timer for hele holdpakken</label>
                            <div className="flex items-center gap-xs">
                              <input
                                type="text"
                                inputMode="decimal"
                                value={holdpakkeTimer}
                                onChange={e => onSetHoldpakkeTimer(parseFloat(e.target.value) || 0)}
                                className="bg-surface border border-hairline rounded-md px-xs py-xxxs text-xs tabular-nums w-[120px] focus:outline-none focus:border-dark-teal"
                              />
                              <span className="font-inter text-xxs text-text-muted uppercase tracking-widest">timer</span>
                            </div>
                          </div>
                        )}
                        <span className="inline-flex items-center bg-warn-bg text-text-secondary font-inter font-medium text-xs px-sm py-xxxs rounded-full whitespace-nowrap">
                          {timeafregningFraPlan === 'nej'
                            ? 'Holdpakke fast pris — angiv samlede timer for hele pakken'
                            : 'Timeafregning — angiv timer per materiel-enhed'}
                        </span>
                      </div>
                      {!materielAfregningGodkendt && (
                        <button
                          type="button"
                          onClick={() => { onSetMaterielAfregningGodkendt(true) }}
                          className="min-h-touch shrink-0 ml-auto bg-yellow text-deep-teal font-inter font-semibold text-sm py-xxxs px-sm rounded-lg hover:opacity-90 transition-all"
                        >
                          Godkend afregning
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>
      )}

      {materielAfregningGodkendt && (
        <div className="flex items-center gap-xs px-sm py-xs bg-good-bg rounded-xl border border-good/20 mb-sm">
          <CheckCircle2 size={16} className="text-good" />
          <span className="font-inter text-xs text-text-secondary">Afregning godkendt</span>
          <button
            type="button"
            onClick={() => onSetMaterielAfregningGodkendt(false)}
            className="ml-auto font-inter text-xs text-text-muted underline cursor-pointer hover:text-text-primary"
          >
            Genåbn afregning
          </button>
        </div>
      )}
    </section>
  )
}
