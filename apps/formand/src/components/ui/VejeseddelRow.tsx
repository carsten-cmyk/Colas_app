import { Layers, Factory } from 'lucide-react'
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
  /**
   * Samleordre-children — kun sat når visning er i samleordre-kontekst med 2+ ordrer.
   * Når sat vises en dropdown som lader formanden vælge hvilken ordre raden logger for.
   * TODO: Erstat med Supabase når klar
   */
  samleordreChildren?: { orderNumber: string; stedLabel: string }[]
  /**
   * Aktuelt valgt ordrenummer for denne vejeseddel-row.
   * Styrer hvilken ordres temperatur + udlægger der vises og redigeres.
   */
  selectedOrdre?: string
  /** Kald når formand skifter ordre i dropdown — parent opdaterer vejeseddelSelectedOrdre */
  onSelectOrdre?: (vejeseddelId: string, orderNumber: string) => void
  /**
   * Per-ordre temperaturer keyed by ordrenummer.
   * Bruges i stedet for vejeseddel.temperatur når i samleordre-mode.
   * TODO: Erstat med Supabase når klar
   */
  tempPerOrdre?: Record<string, number>
  /**
   * Per-ordre udlægger-valg keyed by ordrenummer.
   * Bruges i stedet for vejeseddel.valgtUdlaeggerMaterielNr når i samleordre-mode.
   * TODO: Erstat med Supabase når klar
   */
  udlaeggerPerOrdre?: Record<string, string>
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
  /** Overskriver vejeseddel.temperatur — bruges i samleordre-mode til per-ordre temperatur */
  temperaturOverride,
}: {
  vejeseddel: Vejeseddel
  minTemperatur: number
  onTemperatur: (vejeseddelId: string, temperatur: number) => void
  temperaturOverride?: number | null
}) {
  switch (vejeseddel.status) {
    case 'udlagt':
    case 'aflaesning':
      return (
        <TemperaturBadge
          temperatur={temperaturOverride !== undefined ? temperaturOverride : vejeseddel.temperatur}
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
    case 'paa_fabrik':
      return (
        <span className="inline-flex items-center gap-xxxs px-xs py-xxxs rounded-md font-inter text-xs font-medium bg-soft-aqua/60 text-deep-teal">
          <Factory className="w-3 h-3" aria-hidden="true" />
          På fabrik
        </span>
      )
    case 'paa_vej_til_fabrik':
      return <EtaBadge variant="paa-vej-til-fabrik" />
    case 'dag_afsluttet':
      return (
        <span className="font-inter text-xxs font-semibold px-xs py-xxxs rounded-full bg-surface-2 text-text-muted">
          Dag afsluttet
        </span>
      )
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

/** Læs-type badge — markerer "Samles på en bil" (puljelæs, blå, ingen fordeling).
 * Multilæs fjernet som visuel kategori — det er implicit i samleordre-kontekst.
 * multilaes-prop bevares i signaturen men vises ikke — feltet eksisterer stadig i Vejeseddel-typen.
 */
function LaesTypeBadge({ puljelaes }: { multilaes?: boolean; puljelaes?: boolean }) {
  // multilaes: Bevares som dataprop men ikke længere brugt visuelt — kontekstuelt indlejret i samleordre-mode
  if (puljelaes) {
    return (
      <span className="inline-flex items-center gap-xxxs px-xs py-xxxs rounded-md bg-soft-aqua border border-dark-teal/30 text-deep-teal font-inter font-semibold text-xxs uppercase tracking-wider">
        <Layers size={10} />
        Samles på en bil
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
  samleordreChildren,
  selectedOrdre,
  onSelectOrdre,
  tempPerOrdre,
  udlaeggerPerOrdre,
}: VejeseddelRowProps) {
  const erAnkommet = vejeseddel.status === 'udlagt' || vejeseddel.status === 'aflaesning'

  // Samleordre-mode: brug per-ordre værdier hvis tilgængeligt, ellers fallback til vejeseddel-felter
  const erSamleordreMode = !!(samleordreChildren && samleordreChildren.length > 1)
  const temperaturVis = erSamleordreMode && selectedOrdre
    ? (tempPerOrdre?.[selectedOrdre] ?? null)
    : vejeseddel.temperatur
  const udlaeggerValgt = erSamleordreMode && selectedOrdre
    ? (udlaeggerPerOrdre?.[selectedOrdre] ?? null)
    : vejeseddel.valgtUdlaeggerMaterielNr

  return (
    <tr className={[
      'border-b border-hairline hover:bg-surface-2 transition-colors',
      vejeseddel.status === 'dag_afsluttet' ? 'opacity-60' : '',
      vejeseddel.er_sidste_laes ? 'bg-yellow/15' : '',
    ].filter(Boolean).join(' ')}>
      {/* Vejeseddel */}
      <td className="font-inter text-xs font-semibold text-text-primary px-xs py-xs tabular-nums">
        {vejeseddel.vejeseddelNr ?? <Dash />}
      </td>

      {/* Nummerplade + evt. "Forventet sidste læs"-pille */}
      <td className="font-inter text-xs text-text-primary px-xs py-xs tabular-nums">
        <span className="inline-flex items-center gap-xs">
          {vejeseddel.regnr}
          {vejeseddel.er_sidste_laes && (
            <span
              className="font-inter text-xxs font-semibold px-xs py-xxxs rounded-full bg-yellow text-deep-teal whitespace-nowrap"
              title="Forventet sidste læs — estimat for bil med rest-mængde indtil faktisk afhentet"
            >
              Forventet sidste læs
            </span>
          )}
        </span>
      </td>

      {/* Chauffør */}
      <td className="font-inter text-xs text-text-primary px-xs py-xs">
        {vejeseddel.chauffoerNavn}
      </td>

      {/* Telefon — klikbart tel-link med min. 44px touch target via py-xs */}
      <td className="font-inter text-xs px-xs py-xs">
        {vejeseddel.chauffoerTelefon ? (
          <a
            href={`tel:${vejeseddel.chauffoerTelefon.replace(/\s/g, '')}`}
            className="text-deep-teal hover:underline"
            aria-label={`Ring til ${vejeseddel.chauffoerNavn}: ${vejeseddel.chauffoerTelefon}`}
          >
            {vejeseddel.chauffoerTelefon}
          </a>
        ) : (
          <Dash />
        )}
      </td>

      {/* Produkt + læs-type badge (puljelæs = "Samles på en bil") */}
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

      {/* Udlægger — med ordre-dropdown over feltet i samleordre-mode */}
      <td className="px-xs py-xs">
        <div className="flex flex-col gap-xxxs">
          {erSamleordreMode && (
            <select
              value={selectedOrdre ?? ''}
              onChange={(e) => onSelectOrdre?.(vejeseddel.id, e.target.value)}
              className="font-inter text-xs text-deep-teal bg-white border border-hairline rounded-md px-xs py-xxxs hover:border-deep-teal/40 focus:outline-none focus:border-deep-teal transition-colors"
              aria-label="Vælg ordre for denne vejeseddel"
            >
              {samleordreChildren!.map((c) => (
                <option key={c.orderNumber} value={c.orderNumber}>
                  {c.stedLabel}
                </option>
              ))}
            </select>
          )}
          <UdlaeggerDropdown
            materielListe={udlaeggerliste}
            selected={udlaeggerValgt}
            onChange={(materielNr) => onUdlaegger(vejeseddel.id, materielNr)}
            disabled={!erAnkommet}
          />
        </div>
      </td>

      {/* Status/Temp */}
      <td className="px-xs py-xs">
        <StatusKolonne
          vejeseddel={vejeseddel}
          minTemperatur={minTemperatur}
          onTemperatur={onTemperatur}
          temperaturOverride={erSamleordreMode ? temperaturVis : undefined}
        />
      </td>
    </tr>
  )
}
