import { formatLongDate } from '@/utils/date'
import { dateToString, TODAY } from '../utils'

export interface PeriodeDatoVaelgerProps {
  /** Overskrift over dato-pillerne, fx "Udføres i perioden" eller "Afregningsperiode" */
  heading: string
  /** ISO-datostrenge (YYYY-MM-DD), allerede sorteret af kalderen */
  days: string[]
  /** Den aktuelt valgte ISO-dato */
  selectedDate: string
  /** Callback når brugeren klikker en dato-pille */
  onSelectDate: (d: string) => void
}

/**
 * Horisontal stribe af dato-piller for en ordres planlagte dage.
 * Valgt dag highlightes, passerede dage gennemstreges.
 * Returnerer null hvis days er tom (guard svarer til {days.length > 0 && ...} hos kalderen).
 *
 * Extraction af 3× byte-identisk inline-blok fra:
 * - OrdrePlanScreen.tsx L999–1028
 * - content/UdfoerselContent.tsx L227–258
 * - content/AfregningContent.tsx L373–406
 */
export function PeriodeDatoVaelger({ heading, days, selectedDate, onSelectDate }: PeriodeDatoVaelgerProps) {
  if (days.length === 0) return null

  return (
    <section>
      <h2 className="font-poppins font-semibold text-xl text-deep-teal leading-tight mb-sm">{heading}</h2>
      <div className="flex items-center gap-xs flex-wrap">
        {days.map(ds => {
          const isSelected = ds === selectedDate
          // Dato-pille-konvention (2026-06-05): passerede dage → hvid + gennemstreget
          const isPast = ds < dateToString(TODAY)
          return (
            <button
              key={ds}
              onClick={() => onSelectDate(ds)}
              aria-pressed={isSelected}
              aria-label={`${formatLongDate(ds)}${isPast ? ' (overstået)' : ''}`}
              className={[
                'flex items-center gap-xxxs px-sm py-xs rounded-full font-poppins font-semibold text-sm transition-colors',
                isSelected
                  ? 'bg-deep-teal text-white shadow-sm'
                  : isPast
                    ? 'bg-white border border-hairline text-text-muted line-through hover:border-dark-teal'
                    : 'bg-white border border-hairline text-text-muted hover:border-dark-teal hover:text-deep-teal',
              ].join(' ')}
            >
              {formatLongDate(ds)}
            </button>
          )
        })}
      </div>
    </section>
  )
}
