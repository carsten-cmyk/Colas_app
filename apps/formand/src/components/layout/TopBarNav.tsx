/**
 * TopBarNav — vandret navigations-strip til TopBar.
 *
 * Erstatter BottomTabBar for primær-navigation (Kalenderoversigt, Dagens opgaver).
 * Leaf-komponent: modtager items + activeId som props, sender klik opad via onNavigate.
 * Container (OrdrePlanScreen-shell) ejer ruter og navigate().
 *
 * Visual Pattern References:
 * - bg-white/10 hover-baggrund: TopBar.tsx:26 (avatar-pill) + TopBar.tsx:37 (Settings-knap)
 * - hover:bg-white/10 transition-colors: TopBar.tsx:37 (lettere end Settings hover:bg-white/20 — nav er tekst-pille)
 * - bg-yellow aktiv: BottomTabBar.tsx:81 — fuldt pill-fill i stedet for 4px understreg (vandret kontekst)
 * - text-white/85 idle: TopBar.tsx:30
 * - font-inter text-xs: TopBar.tsx:30
 */

export type TopBarNavItemId = 'kalenderoversigt' | 'dagens-opgaver'

export interface TopBarNavItem {
  /** Stabil id til aktiv-markering + key */
  id: TopBarNavItemId
  /** Synligt label, fx "Kalenderoversigt" */
  label: string
  /** Rute der navigeres til ved klik */
  to: string
}

export interface TopBarNavProps {
  /** Navigations-elementer i visningsrækkefølge */
  items: TopBarNavItem[]
  /**
   * Id på det aktive element.
   * undefined = ingen aktiv, fx når brugeren befinder sig på OrdrePlan-skærmen selv.
   */
  activeId?: TopBarNavItemId
  /** Kaldes ved klik på et element — container håndterer navigate() */
  onNavigate: (item: TopBarNavItem) => void
}

/**
 * Returnerer de Tailwind-klasser der udgør en nav-pille afhængigt af aktiv-state.
 * Adskilt fra JSX for læsbarhed og nem test af klasse-logik.
 */
function pillClasses(isActive: boolean): string {
  const base =
    'flex items-center justify-center px-sm rounded-md transition-colors whitespace-nowrap min-h-touch font-inter text-xs font-medium cursor-pointer border-none focus:outline-none focus:ring-2 focus:ring-dark-teal/30'

  if (isActive) {
    // PATTERN: bg-yellow aktiv — matcher BottomTabBar.tsx:81 bg-yellow-indikator,
    // men som fuld pill-fill (vandret kontekst, ingen plads til understreg-stak).
    return `${base} bg-yellow text-deep-teal`
  }

  // PATTERN: hover:bg-white/10 — lettere end Settings-knap hover:bg-white/20 (TopBar.tsx:37)
  // fordi nav-piller er bredere tekst-elementer, ikke kompakte ikon-knapper.
  return `${base} text-white/85 hover:bg-white/10`
}

export function TopBarNav({ items, activeId, onNavigate }: TopBarNavProps) {
  // Edge case: tom items[] → render ingenting (ingen tom-ramme, jf. SPEC)
  if (items.length === 0) {
    return null
  }

  return (
    <nav
      className="flex items-center gap-xxs"
      aria-label="Primær navigation"
      role="navigation"
    >
      {items.map((item) => {
        const isActive = item.id === activeId

        return (
          <button
            key={item.id}
            type="button"
            role="link"
            aria-current={isActive ? 'page' : undefined}
            aria-label={item.label}
            onClick={() => onNavigate(item)}
            className={pillClasses(isActive)}
          >
            {item.label}
          </button>
        )
      })}
    </nav>
  )
}
