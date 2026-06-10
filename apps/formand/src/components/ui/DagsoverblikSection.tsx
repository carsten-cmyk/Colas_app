import { OrdreInfoCard } from './OrdreInfoCard'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DagsoverblikSectionProps {
  // === Rad 1 — statiske ordreinfo-felter ===
  /** Dagens planlagte areal i m² (beregnet i parent fra tons/dag × 1000 / kg/m²) */
  arealIDag: number
  /** Recept-navn (fx "SMA 11S") + kode (fx "82101H") */
  produkt: { navn: string; kode: string }
  /** Planlagt tykkelse i mm */
  tykkelse: number
  /** Dagens forventede tons */
  tonsIDag: number
  /** Hele ordrens areal i m² */
  ordreTotalArealM2: number
  /** Hele ordrens tons */
  ordreTotalTons: number
}

// ─── Format-helpers ───────────────────────────────────────────────────────────

/** Dansk tal-formatering med punktum som tusindtals-separator */
function fmtTal(n: number, maxFractionDigits = 0): string {
  return new Intl.NumberFormat('da-DK', {
    maximumFractionDigits: maxFractionDigits,
  }).format(n)
}

// ─── Komponent ────────────────────────────────────────────────────────────────

export function DagsoverblikSection({
  arealIDag,
  produkt,
  tykkelse,
  tonsIDag,
  ordreTotalArealM2,
  ordreTotalTons,
}: DagsoverblikSectionProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-xs">
      <OrdreInfoCard
        label="AREAL I DAG"
        value={fmtTal(arealIDag)}
        unit="m²"
        subtekst={`á ${fmtTal(ordreTotalArealM2)} m²`}
      />
      <OrdreInfoCard
        label="PRODUKT"
        value={produkt.navn}
        subtekst={produkt.kode}
      />
      <OrdreInfoCard
        label="TYKKELSE"
        value={fmtTal(tykkelse)}
        unit="mm"
      />
      <OrdreInfoCard
        label="TONS I DAG"
        value={fmtTal(tonsIDag)}
        unit="Tons"
        subtekst={`á ${fmtTal(ordreTotalTons)} Tons`}
      />
    </div>
  )
}
