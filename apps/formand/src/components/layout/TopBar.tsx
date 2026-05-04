import { Settings } from 'lucide-react'

export interface TopBarProps {
  /** Initialer til avatar-cirkel, fx "OJ" */
  userInitials: string
  /** Kort navn vist i avatar-pill, fx "Ole J." */
  userName: string
  onSettingsPress?: () => void
}

export function TopBar({ userInitials, userName, onSettingsPress }: TopBarProps) {
  return (
    <header
      className="bg-deep-teal flex items-center justify-between px-sm sticky top-0 z-50"
      style={{ height: 52 }}
    >
      <img
        src="/colas-logo.png"
        alt="Colas"
        className="object-contain"
        style={{ height: 32 }}
      />

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
