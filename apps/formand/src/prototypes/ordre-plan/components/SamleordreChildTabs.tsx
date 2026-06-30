/**
 * SamleordreChildTabs — tab-række til at skifte mellem child-ordrer i en samleordre.
 *
 * Extraction af det tab-mønster der tidligere stod inline i makeOrdredetaljerCard
 * (OrdrePlanScreen.tsx L543–568). Visuelt identisk med kilden — klasser kopieret 1:1.
 *
 * Rendering-kontrakt:
 *   Komponenten renderer KUN tab-rækken (<div> med tab-<button>s).
 *   Kortet/tabellen nedenunder ejes af KALDEREN og skal have:
 *     - `rounded-tr-xl rounded-b-xl` når tabs vises (variant='attached')
 *     - `rounded-xl` ved enkelt-ordre (komponenten returnerer null)
 *   Returnerer null når children.length <= 1 (enkelt-ordre — ingen tabs).
 *
 * Bevidste fixed-px (bevaret fra original — dokumenteret i SPEC §Tokens):
 *   - `w-[6px] h-[6px]` — anchor-dot-dimension matcher eksisterende prototype-konvention
 *   - `-mb-[1px]` — browser-tab-koblingen, identisk med makeOrdredetaljerCard L554
 */

export interface SamleordreChildTab {
  /** Ordrenummer — bruges som key og som identitet i onSelect */
  orderNumber: string
  /** Adresse-label vist i tabben (fx "Søvej", "Strandvejen") */
  stedLabel: string
  /** True for primær/anchor-ordren — viser gul anchor-dot */
  isAnchor: boolean
}

export interface SamleordreChildTabsProps {
  /** Child-ordrer der bliver til tabs (rækkefølge = visningsrækkefølge) */
  children: SamleordreChildTab[]
  /** Ordrenummer på den aktuelt valgte tab */
  activeOrderNumber: string
  /** Kaldes når en tab vælges */
  onSelect: (orderNumber: string) => void
  /**
   * Visuel variant:
   * - 'attached'  → tab-rækken danner kortets øverste kant. Aktiv tab har
   *   bg-white + border-b-white + -mb-[1px] så den "smelter" ind i kortet.
   *   Bruges af makeOrdredetaljerCard OG Udlægning-sektionen.
   * - 'standalone' → løsrevet tab-bar uden kort-kobling (fald-back / collapsed).
   * @default 'attached'
   */
  variant?: 'attached' | 'standalone'
}

/**
 * Tab-række der lader brugeren skifte mellem child-ordrerne i en samleordre.
 * Returnerer null ved enkelt-ordre (children.length <= 1).
 */
export function SamleordreChildTabs({
  children,
  activeOrderNumber,
  onSelect,
  variant = 'attached',
}: SamleordreChildTabsProps) {
  // Enkelt-ordre: ingen tabs — kalderen bruger fuldt rounded-xl på kortet
  if (children.length <= 1) return null

  return (
    // Tab-container: matches OrdrePlanScreen.tsx:543 — `inline-flex gap-xxxs`
    <div className="inline-flex gap-xxxs">
      {children.map(child => {
        const isActive = child.orderNumber === activeOrderNumber

        // Aktiv-klasse afhænger af variant:
        //   'attached'   → -mb-[1px] kobler tab visuelt til kort nedenunder
        //   'standalone' → ingen -mb-[1px] (intet kort at smelte ind i)
        const activeClass =
          variant === 'attached'
            ? 'bg-white border-b-white text-deep-teal relative z-10 -mb-[1px]'
            : 'bg-white border-b-white text-deep-teal relative z-10'

        return (
          <button
            key={child.orderNumber}
            type="button"
            onClick={() => onSelect(child.orderNumber)}
            aria-pressed={isActive}
            className={[
              // Tab-knap base: matches OrdrePlanScreen.tsx:552
              'inline-flex items-center gap-xs px-md py-xs border border-hairline rounded-t-lg transition-colors font-inter text-xs font-semibold',
              isActive
                ? activeClass
                // Inaktiv: matches OrdrePlanScreen.tsx:555
                : 'bg-surface-2 text-text-muted hover:text-deep-teal',
            ].join(' ')}
          >
            {child.isAnchor && (
              // Anchor-dot: matches OrdrePlanScreen.tsx:559-562 (PATTERNS.md §11a)
              // PATTERN NOTE: w-[6px] h-[6px] er bevidst fixed-px — matcher eksisterende
              // prototype-konvention for små dots, bevares for visuel paritet.
              <span
                className="w-[6px] h-[6px] rounded-full bg-yellow flex-shrink-0"
                aria-label="Primær ordre"
              />
            )}
            <span>{child.stedLabel}</span>
          </button>
        )
      })}
    </div>
  )
}
