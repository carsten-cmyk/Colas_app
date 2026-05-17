import { Clock, Truck } from 'lucide-react'

export interface EtaBadgeProps {
  /** Hvilken variant der vises:
   * - 'eta': viser "ETA X min" når bil er på vej fra fabrik mod udførselssted
   * - 'paa-vej-til-fabrik': viser "På vej til fabrik" når bil er disponeret men endnu ikke har afhentet last
   */
  variant: 'eta' | 'paa-vej-til-fabrik'
  /** ETA i minutter — bruges kun når variant='eta', ignoreres ellers */
  etaMinutter?: number
  /** Forventet ETA i minutter tildelt ved disponering — bruges til forsinkelse-beregning (kun variant='eta') */
  forventetEtaMinutter?: number
}

type ForsinkelseStatus = 'neutral' | 'warn' | 'bad'

function beregnForsinkelseStatus(eta?: number, forventet?: number): ForsinkelseStatus {
  if (eta === undefined || forventet === undefined || forventet === 0) return 'neutral'
  const overskridelse = (eta - forventet) / forventet
  if (overskridelse > 0.5) return 'bad'
  if (overskridelse > 0.25) return 'warn'
  return 'neutral'
}

function getEtaText(etaMinutter: number | undefined): string {
  if (etaMinutter === undefined) return 'ETA –'
  return `ETA ${etaMinutter} min`
}

const statusKlasser: Record<ForsinkelseStatus, string> = {
  neutral: 'bg-surface-2 text-text-secondary',
  warn: 'bg-warn-bg text-text-primary',
  bad: 'bg-bad-bg text-bad',
}

export function EtaBadge({ variant, etaMinutter, forventetEtaMinutter }: EtaBadgeProps) {
  const isEta = variant === 'eta'
  const forsinkelseStatus = isEta
    ? beregnForsinkelseStatus(etaMinutter, forventetEtaMinutter)
    : 'neutral'

  const farver = statusKlasser[forsinkelseStatus]

  return (
    <span
      className={[
        'inline-flex items-center gap-xxxs px-xs py-xxxs rounded-md font-inter text-xs font-medium',
        farver,
      ].join(' ')}
    >
      {isEta ? (
        <Clock className="w-3 h-3" aria-hidden="true" />
      ) : (
        <Truck className="w-3 h-3 text-text-secondary" aria-hidden="true" />
      )}
      {isEta ? getEtaText(etaMinutter) : 'På vej til fabrik'}
    </span>
  )
}
