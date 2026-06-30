import type { TimeafregningFraPlan } from '../../../types'

// ─── TimeafregningSection ─────────────────────────────────────────────────────
// Placeholder-sektion — selve timeafregningen håndteres i PLAN (åbnes via knap).
// Kilde: AfregningContent.tsx L1472–1491 (extraction ORDRET).
// State ejes af AfregningContent-containeren og trådes som props.
// TODO (produktion): Sektion filtreres på (selectedProductId, selectedDate)

export interface TimeafregningProps {
  /** Fra-PLAN-toggle — 'ja' = timer hentes fra PLAN, 'nej' = manuelt */
  timeafregningFraPlan: TimeafregningFraPlan
  setTimeafregningFraPlan: (value: TimeafregningFraPlan) => void
  /** Holdpakke-timer — bruges i BilTonsAfregningSection; trådes her for symmetri med SPEC */
  holdpakkeTimer: number
  setHoldpakkeTimer: (value: number) => void
  /** Åbner PLAN-modal i AfregningContent-containeren */
  onOpenPlanModal: () => void
}

export function TimeafregningSection({
  onOpenPlanModal,
}: TimeafregningProps) {
  return (
    <section>
      <div className="flex items-center mb-sm">
        <h2 className="font-poppins font-semibold text-xl text-text-primary">Timeafregning</h2>
      </div>

      <div className="overflow-hidden rounded-lg border border-hairline bg-surface">
        <div className="flex flex-col items-center justify-center gap-md px-md py-lg">
          <p className="font-inter text-sm text-text-secondary text-center">
            Timeafregning for hold. Bemærk at knap åbner PLAN.
          </p>
          <button
            type="button"
            onClick={onOpenPlanModal}
            className="font-poppins font-semibold text-xs px-md py-xs rounded-full bg-yellow text-deep-teal inline-flex items-center gap-xxxs hover:opacity-90 transition-opacity"
          >
            PLAN
          </button>
        </div>
      </div>
    </section>
  )
}
