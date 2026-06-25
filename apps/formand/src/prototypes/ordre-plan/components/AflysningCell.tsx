import { useState } from 'react'
import { CloudRain } from 'lucide-react'
import type { MockProduct, CancelReason } from '../types'
import { CANCEL_REASONS } from '../mocks'
import { formatLongDate } from '@/utils/date'

// den ikke er aflyst, ellers første aktive dag.
export function AflysningCell({
  product,
  udfoerselSelectedDate,
  pickerOpenForDayId,
  onOpenPicker,
  onClosePicker,
  onCancelDay,
}: {
  product: MockProduct
  /** Aktuelt valgt dato (bruges som default i pickeren — gælder alle modes) */
  udfoerselSelectedDate?: string
  /** dayId som pickeren er åben for — null hvis lukket */
  pickerOpenForDayId: string | null
  onOpenPicker: (defaultDayId: string) => void
  onClosePicker: () => void
  onCancelDay: (dayId: string, reason: CancelReason) => void
}) {
  // Lokal state: valgt dag + valgt årsag i pickeren (vælg → bekræft med OK)
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null)
  const [selectedReason, setSelectedReason] = useState<CancelReason | null>(null)

  const sortedDays = [...product.days].sort((a, b) => a.date.localeCompare(b.date))
  const cancelledDays = sortedDays.filter(d => d.cancelled)
  const aktiveDays = sortedDays.filter(d => !d.cancelled)
  const isOpen = pickerOpenForDayId !== null

  // Default-valgt dag når pickeren åbnes: aktuelt valgt dato hvis aktiv, ellers første aktive
  const selectedDateDay = udfoerselSelectedDate
    ? sortedDays.find(d => d.date === udfoerselSelectedDate)
    : null
  const defaultDayId = selectedDateDay && !selectedDateDay.cancelled
    ? selectedDateDay.id
    : aktiveDays[0]?.id

  function closePicker() {
    setSelectedDayId(null)
    setSelectedReason(null)
    onClosePicker()
  }

  function openPicker() {
    if (!defaultDayId) return
    setSelectedDayId(defaultDayId)
    setSelectedReason(null)
    onOpenPicker(defaultDayId)
  }

  function confirmCancel(dayId: string) {
    if (!selectedReason) return
    onCancelDay(dayId, selectedReason) // parent lukker pickeren
    setSelectedDayId(null)
    setSelectedReason(null)
  }

  // ── Picker (åben) — vælg dato → vælg årsag → OK ─────────────────────────────
  if (isOpen) {
    const pickerOptions = aktiveDays.length > 0 ? aktiveDays : sortedDays
    const currentDayId = selectedDayId ?? pickerOpenForDayId ?? pickerOptions[0]?.id ?? ''
    return (
      <div className="mt-auto flex flex-col gap-xs">
        <div className="flex flex-col gap-xxxs">
          <span className="font-inter text-xxs font-medium text-text-muted">Vælg dato</span>
          <select
            value={currentDayId}
            onChange={(e) => setSelectedDayId(e.target.value)}
            className="w-full px-xs py-xxs rounded-md border border-hairline font-inter text-xs bg-white"
          >
            {pickerOptions.map(d => (
              <option key={d.id} value={d.id}>
                {formatLongDate(d.date)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-xxxs">
          <span className="font-inter text-xxs font-medium text-text-muted">Vælg årsag</span>
          <div className="flex flex-wrap gap-xxxs">
            {CANCEL_REASONS.map(r => {
              const aktiv = selectedReason === r.value
              return (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setSelectedReason(r.value)}
                  aria-pressed={aktiv}
                  className={[
                    'px-xs py-xxs rounded-md font-inter text-xxs font-medium transition-colors border',
                    aktiv
                      ? 'bg-bad/10 text-bad border-bad/40'
                      : 'bg-surface-2 text-text-secondary border-transparent hover:bg-bad/10 hover:text-bad',
                  ].join(' ')}
                >
                  {r.label}
                </button>
              )
            })}
          </div>
        </div>
        <p className="font-inter text-xxs text-text-muted leading-snug">
          Aflysning gælder fra det valgte tidspunkt og resten af dagen. Allerede registreret timeforbrug og tons gemmes.
        </p>
        <div className="flex items-center gap-xs">
          <button
            type="button"
            disabled={!selectedReason || !currentDayId}
            onClick={() => confirmCancel(currentDayId)}
            className="flex-1 inline-flex items-center justify-center px-sm py-xs rounded-md bg-bad text-white font-inter text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            OK
          </button>
          <button
            type="button"
            onClick={closePicker}
            className="flex-1 inline-flex items-center justify-center px-sm py-xs rounded-md bg-white border border-hairline text-text-secondary font-inter text-xs font-semibold hover:border-dark-teal hover:text-deep-teal transition-colors"
          >
            Fortryd
          </button>
        </div>
      </div>
    )
  }

  // ── Tilstand A: ingen aflyste dage ──────────────────────────────────────────
  if (cancelledDays.length === 0) {
    return (
      <div className="mt-auto flex flex-col gap-xs">
        {defaultDayId && (
          <button
            type="button"
            onClick={openPicker}
            className="inline-flex items-center gap-xxxs w-fit px-xs py-xxs rounded-md bg-bad/10 text-bad font-inter text-xs font-semibold hover:bg-bad/20 transition-colors"
          >
            <CloudRain size={12} />
            Aflys dag
          </button>
        )}
      </div>
    )
  }

  // ── Tilstand B+C: 1+ dage aflyst (med eller uden flere tilbage) ─────────────
  const visAflysFlereKnap = aktiveDays.length > 0
  return (
    <div className="mt-auto flex flex-col gap-xs">
      <div className="flex flex-col gap-xxxs">
        {cancelledDays.map(d => {
          const reasonLabel = CANCEL_REASONS.find(r => r.value === d.cancelReason)?.label
          return (
            <div key={d.id} className="flex flex-col">
              <span className="font-inter text-xs text-bad font-semibold">
                {formatLongDate(d.date)}
              </span>
              {reasonLabel && (
                <span className="font-inter text-xxs text-text-muted">(pga. {reasonLabel})</span>
              )}
            </div>
          )
        })}
      </div>
      {visAflysFlereKnap && defaultDayId && (
        <button
          type="button"
          onClick={openPicker}
          className="inline-flex items-center gap-xxxs w-fit px-xs py-xxs rounded-md bg-bad/10 text-bad font-inter text-xs font-semibold hover:bg-bad/20 transition-colors"
        >
          <CloudRain size={12} />
          Aflys flere
        </button>
      )}
    </div>
  )
}
