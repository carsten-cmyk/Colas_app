/**
 * PROTOTYPE — UdlaegningSection
 *
 * Extraction fra AfregningContent.tsx L419–588 (ORDRET — ingen redesign).
 * Viser "Udlægning"-sektionen i Afregning-mode — inde i Ordredetaljer-wrapper-div'en
 * som sibling til <hr>. Matches med Planlægning + Udførsel-pattern.
 *
 * Round 2 — child-tabs + 3 tweaks (SPEC: SPEC_UdlaegningSection_childtabs_tweaks.md):
 *   (a) <h2> "Udlægning" flyttes ud af boksen — over tab-rækken (som Ordredetaljer)
 *   (b) Produkt-tabs erstattet af segmented control INDE i boksen
 *   (c) "I gang · startet"-pillen fjernet
 *   (+) Adresse-child-tabs (SamleordreChildTabs variant='attached') koblet på boksen
 *       — kun i samleordre-mode med 2+ children
 *
 * State ejet af container (AfregningContent):
 *   selectedAfregningProductId / setSelectedAfregningProductId (per-produkt toggle)
 *   samleordreTabOrderNr / onSelectSamleordreTab (adresse-child-tabs)
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
import { SamleordreChildTabs } from '../../../components/SamleordreChildTabs'

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
  /** Alle produkter på ordren — bruges til per-produkt toggle */
  products?: MockProduct[]
  /** True når Ordre-plan vises i samleordre-kontekst */
  isSamleordreMode?: boolean
  /** Samleordre-context med children (anchor + andre ordrer) når isSamleordreMode === true */
  samleordreCtx?: SamleordreContext | null
  /** Ordrenummer på valgt child-ordre i samleordre-tabs */
  samleordreTabOrderNr?: string
  /**
   * Callback når brugeren skifter child-tab — ejet af container (AfregningContent).
   * Optional: container kan wire denne op til sin samleordreTabOrderNr-state.
   * Container SKAL sende denne prop for at adresse-tabs virker i samleordre-mode.
   */
  onSelectSamleordreTab?: (orderNumber: string) => void
  /** Valgt produkt-id til per-produkt toggle — ejet af container (AfregningContent) */
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
  onSelectSamleordreTab,
  selectedAfregningProductId,
  setSelectedAfregningProductId,
}: UdlaegningSection_Props) {
  // Bestemmer hvilke produkter der vises toggle for i Udlægning-sektionen.
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

    // Adresse-child-tabs: vises kun i samleordre-mode med 2+ children
    const visAdresseTabs = isSamleordreMode && samleordreCtx && samleordreCtx.children.length >= 2
    const childTabs = visAdresseTabs && samleordreCtx
      ? samleordreCtx.children.map(c => ({
          orderNumber: c.orderNumber,
          stedLabel: c.stedLabel,
          isAnchor: c.isAnchor,
        }))
      : []

    return (
      <div>
        {/* TWEAK (a): <h2> "Udlægning" FRI over tab-rækken — som Ordredetaljer
            (OrdredetaljerSection.tsx L34: font-poppins font-semibold text-xl text-text-primary).
            Sted-suffix fjernet — adressen vises nu på adresse-tab'en i samleordre-mode. */}
        <h2 className="font-poppins font-semibold text-xl text-text-primary mb-sm">
          Udlægning
        </h2>

        {/* Adresse-tabs koblet på boksen (samleordre 2+ children).
            Visual Pattern Reference — OrdrePlanScreen.tsx:543 (makeOrdredetaljerCard).
            SamleordreChildTabs returnerer null ved <= 1 child (enkelt-ordre guard). */}
        {visAdresseTabs && samleordreTabOrderNr && (
          <SamleordreChildTabs
            children={childTabs}
            activeOrderNumber={samleordreTabOrderNr}
            onSelect={(orderNumber) => onSelectSamleordreTab?.(orderNumber)}
            variant="attached"
          />
        )}

        {/* Indhold-wrapper: browser-tab-kobling til adresse-tabs (samleordre) eller fuldt afrundet (enkelt).
            Visual Pattern Reference — OrdrePlanScreen.tsx:571 — rounded-tr-xl rounded-b-xl (tabs) / rounded-xl (ingen tabs).
            p-md tilføjet for at give boksen indre luft (var implicit i den gamle struktur). */}
        <div className={`bg-white border border-hairline overflow-hidden p-md ${
          visAdresseTabs ? 'rounded-tr-xl rounded-b-xl' : 'rounded-xl'
        }`}>
          {/* TWEAK (b): Produkt-toggle INDE i boksen — erstat browser-tabs (konkurrerede visuelt med adresse-tab-rækken).
              Segmented control: vises kun ved harFlereProdukter (2+ produkter).
              Valgt-state: bg-white shadow-sm text-deep-teal (semantisk selected-token-æstetik uden hex). */}
          {harFlereProdukter && (
            <div className="flex gap-xxxs bg-surface-2 rounded-lg p-xxxs mb-sm self-start inline-flex">
              {produkterForUdlaegning.map(p => {
                const isActive = p.id === (selectedAfregningProductId ?? produkterForUdlaegning[0]?.id)
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedAfregningProductId(p.id)}
                    aria-pressed={isActive}
                    className={[
                      'inline-flex items-center px-sm py-xxxs rounded-md transition-colors font-inter text-xs font-semibold min-h-touch',
                      isActive
                        ? 'bg-white shadow-sm text-deep-teal'
                        : 'text-text-muted hover:text-deep-teal',
                    ].join(' ')}
                  >
                    {INITIAL_RECEPTER[p.recipeCode]?.navn ?? p.recipeCode}
                  </button>
                )
              })}
            </div>
          )}

          {/* TWEAK (c): "I gang · startet"-pillen FJERNET (L184–199 i original).
              childUdlaegning.noter bevares IKKE — hele banneret er fjernet jf. SPEC §Tweak(c) default. */}

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
