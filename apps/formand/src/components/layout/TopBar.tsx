import { Settings } from 'lucide-react'
import type { TopBarNavProps } from './TopBarNav'
import { TopBarNav } from './TopBarNav'

export interface TopBarProps {
  /** Initialer til avatar-cirkel, fx "OJ" */
  userInitials: string
  /** Kort navn vist i avatar-pill, fx "Ole J." */
  userName: string
  onSettingsPress?: () => void
  /**
   * Valgfri navigations-slot vist mellem logo og avatar.
   * Når undefined renderes ingen nav (bagudkompatibelt — eksisterende
   * brug af TopBar uden nav er uændret).
   */
  nav?: TopBarNavProps
  /**
   * Valgfri klik-handler på COLAS-logoet (fx naviger til Dagens opgaver).
   * Når sat bliver logoet en klikbar knap; ellers et statisk billede
   * (bagudkompatibelt — eksisterende brug uden onLogoPress er uændret).
   */
  onLogoPress?: () => void
}

export function TopBar({ userInitials, userName, onSettingsPress, nav, onLogoPress }: TopBarProps) {
  const logo = (
    <img
      src="/colas-logo.png"
      alt="Colas"
      className="object-contain"
      style={{ height: 32 }}
    />
  )

  return (
    <header
      className="bg-deep-teal flex items-center justify-between px-sm sticky top-0 z-50"
      style={{ height: 52 }}
    >
      {onLogoPress ? (
        <button
          onClick={onLogoPress}
          aria-label="Gå til Dagens opgaver"
          className="flex items-center min-h-touch -mx-xxxs px-xxxs rounded-md hover:bg-white/10 transition-colors"
        >
          {logo}
        </button>
      ) : (
        logo
      )}

      {/* Nav-slot: renderes kun når nav-prop er sat — bagudkompatibelt */}
      {nav && (
        <div className="flex-1 ml-md">
          <TopBarNav {...nav} />
        </div>
      )}

      <div className="flex items-center gap-xs">
        {/* Avatar pill */}
        <div className="flex items-center gap-xs bg-white/10 rounded-[20px] px-xs py-xxxs">
          <div className="w-[26px] h-[26px] rounded-full bg-dark-teal flex items-center justify-center flex-shrink-0">
            <span className="font-inter font-bold text-xxs text-white">{userInitials}</span>
          </div>
          <span className="font-inter text-xs text-white/85">{userName}</span>
        </div>

        {/* Settings */}
        {onSettingsPress && (
          <button
            onClick={onSettingsPress}
            className="w-[34px] h-[34px] bg-white/10 rounded-md flex items-center justify-center hover:bg-white/20 transition-colors"
            aria-label="Indstillinger"
          >
            <Settings size={16} className="text-white" />
          </button>
        )}
      </div>
    </header>
  )
}
