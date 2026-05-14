import { Clock, Truck } from 'lucide-react'

export interface EtaBadgeProps {
  /** Hvilken variant der vises:
   * - 'eta': viser "ETA X min" når bil er på vej fra fabrik mod udførselssted
   * - 'paa-vej-til-fabrik': viser "På vej til fabrik" når bil er disponeret men endnu ikke har afhentet last
   */
  variant: 'eta' | 'paa-vej-til-fabrik'
  /** ETA i minutter — bruges kun når variant='eta', ignoreres ellers */
  etaMinutter?: number
}

function getEtaText(etaMinutter: number | undefined): string {
  if (etaMinutter === undefined) return 'ETA –'
  return `ETA ${etaMinutter} min`
}

export function EtaBadge({ variant, etaMinutter }: EtaBadgeProps) {
  const isEta = variant === 'eta'

  return (
    <span className="inline-flex items-center gap-xxxs bg-surface-2 text-text-secondary px-xs py-xxxs rounded-md font-inter text-xs font-medium">
      {isEta ? (
        <Clock className="w-3 h-3 text-text-secondary" aria-hidden="true" />
      ) : (
        <Truck className="w-3 h-3 text-text-secondary" aria-hidden="true" />
      )}
      {isEta ? getEtaText(etaMinutter) : 'På vej til fabrik'}
    </span>
  )
}
