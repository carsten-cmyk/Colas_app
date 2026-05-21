import { Layers } from 'lucide-react'
import type { Vejeseddel, Recept } from '../../types/order'
import type { UdlaeggerEnhed } from '../../types/udlaegger'
import { TemperaturBadge } from './TemperaturBadge'
import { EtaBadge } from './EtaBadge'
import { UdlaeggerDropdown } from './UdlaeggerDropdown'

export interface VejeseddelRowProps {
  /** Selve vejeseddel-rækken — status-feltet er kanonisk kilde til sub-komponent-valg */
  vejeseddel: Vejeseddel
  /**
   * Recept præ-løst af parent fra vejeseddel.receptkode.
   * Hvis undefined vises receptkode som fallback — eller "–" hvis begge mangler.
   */
  recept?: Recept
  /** Minimumstemperatur i °C — bruges til TemperaturBadge OK/Lav-status */
  minTemperatur: number
  /** Udlægger-liste fra ordren — filtreres internt på anlaegsNr-prefix "9-" af UdlaeggerDropdown */
  udlaeggerliste: UdlaeggerEnhed[]
  /** Kald når formand gemmer en temperatur — parent skriver til plan_vejebilag.temperatur */
  onTemperatur: (vejeseddelId: string, temperatur: number) => void
  /** Kald når formand vælger udlægger */
  onUdlaegger: (vejeseddelId: string, materielNr: string) => void
}

/** Vis "–" i muted-farve for tomme værdier */
function Dash() {
  return <span className="text-text-muted">–</span>
}

/** Status/Temp-kolonne delegerer til korrekt sub-komponent baseret på vejeseddel.status */
function StatusKolonne({
  vejeseddel,
  minTemperatur,
  onTemperatur,
}: {
  vejeseddel: Vejeseddel
  minTemperatur: number
  onTemperatur: (vejeseddelId: string, temperatur: number) => void
}) {
  switch (vejeseddel.status) {
    case 'ankommet':
      return (
        <TemperaturBadge
          temperatur={vejeseddel.temperatur}
          minTemperatur={minTemperatur}
          onSave={(temp) => onTemperatur(vejeseddel.id, temp)}
        />
      )
    case 'undervejs':
      return (
        <EtaBadge
          variant="eta"
          etaMinutter={vejeseddel.etaMinutter ?? undefined}
          forventetEtaMinutter={vejeseddel.forventetEtaMinutter ?? undefined}
        />
      )
    case 'paa-vej-til-fabrik':
      return <EtaBadge variant="paa-vej-til-fabrik" />
  }
}

/** Produkt-kolonne: recept.navn → receptkode (muted) → "–" */
function ProduktCelle({
  recept,
  receptkode,
}: {
  recept?: Recept
  receptkode: string | null
}) {
  if (recept) {
    return <span>{recept.navn}</span>
  }
  if (receptkode) {
    return <span className="text-text-muted">{receptkode}</span>
  }
  return <Dash />
}

/** Læs-type badge — markerer multilæs (gul, kræver fordeling) eller puljelæs (blå, ingen fordeling) */
function LaesTypeBadge({ multilaes, puljelaes }: { multilaes?: boolean; puljelaes?: boolean }) {
  if (multilaes) {
    return (
      <span className="inline-flex items-center gap-xxxs px-xs py-xxxs rounded-md bg-warn-bg border border-yellow text-deep-teal font-inter font-semibold text-xxs uppercase tracking-wider">
        <Layers size={10} />
        Multilæs
      </span>
    )
  }
  if (puljelaes) {
    return (
      <span className="inline-flex items-center gap-xxxs px-xs py-xxxs rounded-md bg-soft-aqua border border-dark-teal/30 text-deep-teal font-inter font-semibold text-xxs uppercase tracking-wider">
        <Layers size={10} />
        Puljelæs
      </span>
    )
  }
  return null
}

export function VejeseddelRow({
  vejeseddel,
  recept,
  minTemperatur,
  udlaeggerliste,
  onTemperatur,
  onUdlaegger,
}: VejeseddelRowProps) {
  const erAnkommet = vejeseddel.status === 'ankommet'

  return (
    <tr className="border-b border-hairline hover:bg-surface-2 transition-colors">
      {/* Vejeseddel */}
      <td className="font-inter text-xs font-semibold text-text-primary px-xs py-xs tabular-nums">
        {vejeseddel.vejeseddelNr ?? <Dash />}
      </td>

      {/* Nummerplade */}
      <td className="font-inter text-xs text-text-primary px-xs py-xs tabular-nums">
        {vejeseddel.regnr}
      </td>

      {/* Chauffør */}
      <td className="font-inter text-xs text-text-primary px-xs py-xs">
        {vejeseddel.chauffoerNavn}
      </td>

      {/* Produkt + læs-type badge (multilæs/puljelæs) */}
      <td className="font-inter text-xs text-text-primary px-xs py-xs">
        <div className="flex items-center gap-xs flex-wrap">
          <ProduktCelle recept={recept} receptkode={vejeseddel.receptkode} />
          <LaesTypeBadge multilaes={vejeseddel.multilaesFlag} puljelaes={vejeseddel.puljelaesFlag} />
        </div>
      </td>

      {/* Fabrik */}
      <td className="font-inter text-xs text-text-primary px-xs py-xs">
        {vejeseddel.fabrikNavn ?? <Dash />}
      </td>

      {/* Tons */}
      <td className="font-inter text-xs text-text-primary px-xs py-xs tabular-nums">
        {vejeseddel.tons !== null ? vejeseddel.tons : <Dash />}
      </td>

      {/* Udlægger */}
      <td className="px-xs py-xs">
        <UdlaeggerDropdown
          materielListe={udlaeggerliste}
          selected={vejeseddel.valgtUdlaeggerMaterielNr}
          onChange={(materielNr) => onUdlaegger(vejeseddel.id, materielNr)}
          disabled={!erAnkommet}
        />
      </td>

      {/* Status/Temp */}
      <td className="px-xs py-xs">
        <StatusKolonne
          vejeseddel={vejeseddel}
          minTemperatur={minTemperatur}
          onTemperatur={onTemperatur}
        />
      </td>
    </tr>
  )
}
