/**
 * PROTOTYPE — UdlaegningSection
 *
 * Extraction fra AfregningContent.tsx L419–588 (ORDRET — ingen redesign).
 * Viser "Udlægning"-sektionen i Afregning-mode — inde i Ordredetaljer-wrapper-div'en
 * som sibling til <hr>. Matches med Planlægning + Udførsel-pattern.
 *
 * State ejet af container (AfregningContent):
 *   selectedAfregningProductId / setSelectedAfregningProductId (per-produkt tabs)
 *
 * Lokal mock (kun brugt i denne sektion):
 *   perProduktUdlaegning — TODO: Erstat med Supabase per-produkt udlægnings-data
 *
 * TODO: Erstat med Supabase når klar — data fra plan_vejebilag per recipeCode+dato.
 */

import { useRecept } from '@/hooks/useRecept'
import { FremdriftCard } from '@/components/ui/FremdriftCard'
import { FremdriftInputRow } from '@/components/ui/FremdriftInputRow'
import { INITIAL_RECEPTER } from '@/mocks/recepter'
import type { DagsoverblikRegistrering } from '@/types/order'
import type {
  MockProduct,
  SamleordreContext,
} from '../../../types'
import { formatTimestamp } from '../../../utils'

// ─── Props ───────────────────────────────────────────────────────────────────

export interface UdlaegningSection_Props {
  /** Recept-objekt fra useRecept — sektionen er kun synlig når recept er truthy */
  recept?: ReturnType<typeof useRecept>['recept']
  /** Ankomne tons — fra useDagsoverblik */
  tonsAnkommet?: number
  /** Forventet udlagt m² — fra useDagsoverblik */
  forventetUdlagtM2?: number
  /** Faktisk m²/tons-registrering — fra useDagsoverblik */
  faktiskRegistrering?: DagsoverblikRegistrering | null
  /** Viser Udlægning-inputfelter inline */
  visUdlaegningInput?: boolean
  /** Sætter visUdlaegningInput — ejet af container */
  onSetVisUdlaegningInput?: (vis: boolean) => void
  /** Gem faktisk udlagt m² + tons */
  onGemFaktisk?: (m2: number, tons: number) => void
  /** Demo-konstanter — TODO: Erstat med Supabase når klar */
  demoTonsIDag?: number
  demoArealIDag?: number
  demoTykkelse?: number
  /** Viser ekstraarbejde-flag i Udlægning-fanen — true når ekstraSent && ekstraLinjer.length > 0 */
  harEkstraarbejde?: boolean
  /** Alle produkter på ordren — bruges til per-produkt tabs */
  products?: MockProduct[]
  /** True når Ordre-plan vises i samleordre-kontekst */
  isSamleordreMode?: boolean
  /** Samleordre-context med children (anchor + andre ordrer) når isSamleordreMode === true */
  samleordreCtx?: SamleordreContext | null
  /** Ordrenummer på valgt child-ordre i samleordre-tabs */
  samleordreTabOrderNr?: string
  /** Valgt produkt-id til per-produkt tabs — ejet af container (AfregningContent) */
  selectedAfregningProductId: string | null
  /** Setter for valgt produkt-id — ejet af container */
  setSelectedAfregningProductId: (id: string) => void
}

// ─── UdlaegningSection ────────────────────────────────────────────────────────

export function UdlaegningSection({
  recept,
  tonsAnkommet,
  forventetUdlagtM2,
  faktiskRegistrering,
  visUdlaegningInput,
  onSetVisUdlaegningInput,
  onGemFaktisk,
  demoTonsIDag,
  demoArealIDag,
  demoTykkelse,
  harEkstraarbejde,
  products,
  isSamleordreMode,
  samleordreCtx,
  samleordreTabOrderNr,
  selectedAfregningProductId,
  setSelectedAfregningProductId,
}: UdlaegningSection_Props) {
  // Bestemmer hvilke produkter der vises tabs for i Udlægning-sektionen.
  // I samleordre-mode: produkter på den aktuelt valgte child-ordre (samleordreTabOrderNr).
  // I normal mode: produkter på ordren (products-prop).
  const produkterForUdlaegning = (() => {
    if (isSamleordreMode && samleordreCtx && samleordreTabOrderNr) {
      const child = samleordreCtx.children.find(c => c.orderNumber === samleordreTabOrderNr)
      return child?.products ?? []
    }
    return (products ?? []).map(p => ({ id: p.id, recipeCode: p.recipeCode, recipeName: p.recipeName }))
  })()

  // Per-produkt udlægnings-mock — TODO: Erstat med Supabase per-produkt udlægnings-data
  // Værdier er prototype-fiktive; produktion henter fra plan_vejebilag per recipeCode+dato
  const perProduktUdlaegning: Record<string, {
    tonsAnkommet: number
    forventetM2: number
    faktiskM2: number | null
    tonsIDag: number
    arealIDag: number
    tykkelseMm: number
    tonsRegistreret4A: number
    tillaegsarealM2: number
    arealRegistreret4A: number
  }> = {
    'p1': { tonsAnkommet: 68, forventetM2: 363, faktiskM2: 355, tonsIDag: 70,  arealIDag: 374,  tykkelseMm: 80, tonsRegistreret4A: 70,  tillaegsarealM2: 12, arealRegistreret4A: 540 },
    'p2': { tonsAnkommet: 243, forventetM2: 2170, faktiskM2: null, tonsIDag: 251, arealIDag: 2241, tykkelseMm: 45, tonsRegistreret4A: 251, tillaegsarealM2: 0,  arealRegistreret4A: 2170 },
    // Samleordre child-produkter (bruger samme id som SamleordreChild.products[].id)
    'sp2': { tonsAnkommet: 94, forventetM2: 839, faktiskM2: null, tonsIDag: 100, arealIDag: 893, tykkelseMm: 45, tonsRegistreret4A: 100, tillaegsarealM2: 8,  arealRegistreret4A: 839 },
    'sp3': { tonsAnkommet: 47, forventetM2: 540, faktiskM2: 510, tonsIDag: 50,  arealIDag: 574,  tykkelseMm: 40, tonsRegistreret4A: 50,  tillaegsarealM2: 0,  arealRegistreret4A: 510 },
  }

  {/* TODO (produktion): Sektion filtreres på (selectedProductId, selectedDate) */}
  return recept ? (() => {
    const fmtTal = (n: number, d = 0) => new Intl.NumberFormat('da-DK', { maximumFractionDigits: d }).format(n)
    // Per-child udlægning i samleordre-mode
    const activeChildForU = isSamleordreMode && samleordreCtx
      ? samleordreCtx.children.find(c => c.orderNumber === samleordreTabOrderNr)
      : undefined
    const childUdlaegning = activeChildForU?.udlaegningDetails

    // Per-produkt data: hent fra perProduktUdlaegning mock — fallback til globale demo-props
    // TODO: Erstat med Supabase per-produkt udlægnings-data
    const aktivtProduktId = selectedAfregningProductId ?? produkterForUdlaegning[0]?.id
    const harFlereProdukter = produkterForUdlaegning.length > 1
    const ppu = aktivtProduktId ? perProduktUdlaegning[aktivtProduktId] : undefined
    const TONS_I_DAG  = ppu?.tonsIDag  ?? demoTonsIDag  ?? 0
    const AREAL_I_DAG = ppu?.arealIDag ?? demoArealIDag ?? 0
    const TYKKELSE    = ppu?.tykkelseMm ?? demoTykkelse ?? 0
    // TODO: Erstat med Supabase per-produkt udlægnings-data — pt. bruger valgt produkt
    // sin egen mock; fallback til globale useDagsoverblik-data for p2 (SMA 11S)
    const tonsAnkommetVis    = ppu?.tonsAnkommet    ?? tonsAnkommet    ?? 0
    const forventetUdlagtVis = ppu?.forventetM2     ?? forventetUdlagtM2 ?? 0
    const faktiskUdlagtM2    = ppu?.faktiskM2 !== undefined ? ppu.faktiskM2 : (faktiskRegistrering?.faktiskM2 ?? null)

    const tonsProgress   = TONS_I_DAG  > 0 ? Math.round((tonsAnkommetVis    / TONS_I_DAG)  * 100) : 0
    const forventetProgress = AREAL_I_DAG > 0 ? Math.round((forventetUdlagtVis / AREAL_I_DAG) * 100) : 0
    const faktiskProgress   = faktiskUdlagtM2 !== null && AREAL_I_DAG > 0 ? Math.round((faktiskUdlagtM2 / AREAL_I_DAG) * 100) : 0
    const afvigelse = faktiskUdlagtM2 !== null ? Math.round(faktiskUdlagtM2 - forventetUdlagtVis) : undefined
    const faktiskVariant: 'good' | 'warn' | 'bad' = afvigelse !== undefined && afvigelse < 0 ? 'bad' : 'good'
    const tonsRegistreret4A = ppu?.tonsRegistreret4A
    const tillaegsareal4A = ppu?.tillaegsarealM2
    const arealRegistreret4A = ppu?.arealRegistreret4A

    return (
      <div>
        {/* Produkt-tabs — vises kun hvis 2+ produkter. Pattern identisk med makeOrdredetaljerCard-tabs (linje 1103-1128). */}
        {harFlereProdukter && (
          <div className="inline-flex gap-xxxs">
            {produkterForUdlaegning.map(p => {
              const isActive = p.id === (selectedAfregningProductId ?? produkterForUdlaegning[0]?.id)
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedAfregningProductId(p.id)}
                  aria-pressed={isActive}
                  className={[
                    'inline-flex items-center gap-xs px-md py-xs border border-hairline rounded-t-lg transition-colors font-inter text-xs font-semibold',
                    isActive
                      ? 'bg-deep-teal border-deep-teal text-white relative z-10 -mb-[1px]'
                      : 'bg-surface-2 text-text-muted hover:text-deep-teal',
                  ].join(' ')}
                >
                  {INITIAL_RECEPTER[p.recipeCode]?.navn ?? p.recipeCode}
                </button>
              )
            })}
          </div>
        )}
        {/* Indhold-wrapper: border-boks kun ved 2+ produkter (browser-tab-stil) */}
        <div className={harFlereProdukter ? 'bg-white border border-hairline overflow-hidden rounded-tr-xl rounded-b-xl p-md' : ''}>
          <h2 className="font-poppins font-semibold text-xl text-text-primary mb-sm">
            Udlægning
            {isSamleordreMode && activeChildForU && (
              <span className="font-inter text-sm font-normal text-text-muted ml-xs">— {activeChildForU.stedLabel}</span>
            )}
          </h2>
          {/* Per-child noter vises som info-banner i samleordre-mode */}
          {isSamleordreMode && childUdlaegning && (
            <div className="flex items-center gap-xs bg-surface border border-hairline rounded-xl px-sm py-xs mb-xs">
              <div className={`w-[8px] h-[8px] rounded-full flex-shrink-0 ${
                childUdlaegning.status === 'færdig' ? 'bg-good' :
                childUdlaegning.status === 'i-gang' ? 'bg-warning' : 'bg-text-muted'
              }`} />
              <span className="font-inter text-xs font-medium text-text-primary">
                {childUdlaegning.status === 'færdig' ? 'Færdig'
                  : childUdlaegning.status === 'i-gang' ? `I gang${childUdlaegning.startTid ? ` · startet ${childUdlaegning.startTid}` : ''}`
                  : 'Ikke startet'}
              </span>
              {childUdlaegning.noter && (
                <span className="font-inter text-xs text-text-muted">· {childUdlaegning.noter}</span>
              )}
            </div>
          )}
          {/* ── Ekstraarbejde-flag (3a) — vises kun når harEkstraarbejde === true ── */}
          {harEkstraarbejde && (
            <div className="flex justify-end mb-xs">
              <span className="inline-flex items-center gap-xxs px-sm py-xxxs rounded-full bg-soft-aqua text-deep-teal font-inter text-xxs font-semibold">
                Der er ekstraarbejder under ydelser
              </span>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-xs">
            <FremdriftCard
              variant="tons-ankommet"
              label="UDVEJET FABRIK"
              value={fmtTal(tonsAnkommetVis, 1)}
              unit=""
              subtekst={`á ${fmtTal(TONS_I_DAG)} Tons dagens plan`}
              progress={tonsProgress}
              progressVariant="good"
            />
            <FremdriftCard
              variant="forventet-udlagt"
              label="FORVENTET M2 UDLAGT"
              value={fmtTal(forventetUdlagtVis)}
              unit=""
              subtekst="beregnet fra tons × kg/m²"
              progress={forventetProgress}
              progressVariant="good"
            />
            <FremdriftCard
              variant="faktisk-udlagt"
              label="FAKTISK M2 UDLAGT"
              value={faktiskUdlagtM2 !== null ? fmtTal(faktiskUdlagtM2) : '–'}
              unit=""
              subtekst={
                faktiskRegistrering?.gemtTidspunkt
                  ? `senest gemt ${formatTimestamp(faktiskRegistrering.gemtTidspunkt)}`
                  : 'ikke registreret endnu'
              }
              progress={faktiskProgress}
              progressVariant={faktiskVariant}
              afvigelse={afvigelse}
            />
          </div>
          <div className="mt-xs">
            {/* ── Ekstraarbejde-note (3b) — read-only info-felt ved kvm/tons ── */}
            {harEkstraarbejde && (
              <div className="rounded-lg border border-hairline bg-surface-2 px-sm py-xs mb-xs font-inter text-xs text-text-secondary">
                Der er ekstraarbejder under ydelser
              </div>
            )}
            {!visUdlaegningInput ? (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => onSetVisUdlaegningInput?.(true)}
                  className="bg-dark-teal text-white font-inter font-medium text-sm px-sm py-xs rounded-lg min-h-touch hover:opacity-90 transition-all"
                >
                  Registrer udlægning
                </button>
              </div>
            ) : (
              <FremdriftInputRow
                densitet={recept.densitet}
                planTykkelse={TYKKELSE}
                initial={
                  faktiskRegistrering
                    ? { faktiskM2: faktiskRegistrering.faktiskM2!, faktiskTons: faktiskRegistrering.faktiskTons! }
                    : undefined
                }
                onSave={({ faktiskM2, faktiskTons }) => {
                  onGemFaktisk?.(faktiskM2, faktiskTons)
                  onSetVisUdlaegningInput?.(false)
                }}
                referenceLines={[
                  ...(tonsRegistreret4A !== undefined ? [`${fmtTal(tonsRegistreret4A)} tons registreret i 4A`] : []),
                  ...(arealRegistreret4A !== undefined ? [`${fmtTal(arealRegistreret4A)} m² areal registreret i 4A`] : []),
                  ...(tillaegsareal4A !== undefined && tillaegsareal4A > 0 ? [`${fmtTal(tillaegsareal4A)} m² tillægsareal registreret i 4A`] : []),
                ]}
              />
            )}
          </div>
        </div>
      </div>
    )
  })() : null
}
