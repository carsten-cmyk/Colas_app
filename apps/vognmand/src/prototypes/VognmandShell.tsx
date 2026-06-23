/**
 * PROTOTYPE — Vognmand app shell
 * Topbar + venstre sidebar + content outlet.
 * Må ikke importeres i produktionskode.
 */
import { useNavigate, useLocation, Outlet } from 'react-router-dom'
import { List, ArrowLeftRight } from 'lucide-react'

type NavItem = {
  id: string
  label: string
  icon: React.ReactNode
  path: string
}

// Liste + kalender er to visninger af samme sektion (toggle i selve headeren),
// så "Aktive ordre" dækker liste, kalender OG koersel-detaljen — ét sidebar-punkt.
const NAV_ITEMS: NavItem[] = [
  { id: 'liste',         label: 'Aktive ordre',     icon: <List size={15} />,           path: '/prototyper/liste' },
  { id: 'dataudveksling', label: 'Dataudveksling',   icon: <ArrowLeftRight size={15} />, path: '/prototyper/dataudveksling' },
]

export function VognmandShell() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  return (
    <div className="min-h-screen bg-page flex flex-col">

      {/* Topbar */}
      <header className="sticky top-0 z-50 bg-deep-teal flex items-center justify-between px-sm flex-shrink-0" style={{ height: 52 }}>
        <img src="/colas-logo.png" alt="Colas" className="object-contain" style={{ height: 32 }} />
      </header>

      {/* Body: sidebar + content */}
      <div className="flex flex-1" style={{ height: 'calc(100vh - 52px)' }}>

        {/* Venstre sidebar */}
        <aside
          className="sticky top-14 flex-shrink-0 bg-page border-r border-hairline flex flex-col overflow-y-auto"
          style={{ width: 280, height: 'calc(100vh - 52px)' }}
        >
          {/* Navigation */}
          <nav className="flex flex-col gap-[2px] px-xs" style={{ paddingTop: 66 }} aria-label="Hovedmenu">
            {NAV_ITEMS.map(item => {
              const isActive = item.id === 'liste'
                ? (pathname.startsWith('/prototyper/liste')
                    || pathname.startsWith('/prototyper/gantt')
                    || pathname.startsWith('/prototyper/koersel'))
                : pathname.startsWith(item.path)
              return (
                <button
                  key={item.id}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => navigate(item.path)}
                  className={[
                    'flex items-center justify-between px-xs py-[10px] rounded-lg transition-colors text-left w-full',
                    'font-inter text-sm',
                    isActive
                      ? 'bg-white border border-hairline font-semibold text-text-primary'
                      : 'font-medium text-text-muted hover:bg-hairline hover:text-text-secondary',
                  ].join(' ')}
                >
                  <span className="flex items-center gap-xs">
                    <span className={[
                      'w-[6px] h-[6px] rounded-full flex-shrink-0 transition-all',
                      isActive
                        ? 'bg-yellow shadow-[0_0_0_3px_rgba(254,238,50,0.3)]'
                        : 'bg-text-muted opacity-40',
                    ].join(' ')} />
                    {item.label}
                  </span>
                </button>
              )
            })}
          </nav>

          {/* Transportør-info — bunden */}
          <div className="mt-auto px-md py-sm border-t border-hairline">
            <p className="font-inter text-xxs font-medium uppercase tracking-widest text-text-muted mb-xxxs">
              Transportør
            </p>
            <p className="font-poppins font-semibold text-sm text-text-primary leading-tight">
              Per Jakobsen
            </p>
            <p className="font-inter text-xs font-medium text-text-secondary mt-xxxs">Kloster A/S</p>
            <p className="font-inter text-xs text-text-muted">Helge Nielsens Alle 13</p>
            <p className="font-inter text-xs text-text-muted">8723 Løsning</p>
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
