import type { ReactNode } from 'react'
import { TopBar } from '@/components/layout/TopBar'

export type OrderMode = 'planlægning' | 'udførelse' | 'evaluering'

export interface AppShellRailProps {
  /** Udførselssted — vises som h1 i rail */
  address: string
  /** Ordre-nummer, fx "1212343" */
  orderNumber: string
  /** Aktiv fase */
  activeMode: OrderMode
  onModeChange: (mode: OrderMode) => void
  /** Valgfrit ekstra indhold i bunden af rail (meta, alerts) */
  railFooter?: ReactNode
}

export interface AppShellProps extends AppShellRailProps {
  userInitials: string
  userName: string
  onSettingsPress?: () => void
  children: ReactNode
}

const MODES: { value: OrderMode; label: string; step: string }[] = [
  { value: 'planlægning', label: 'Planlægning', step: 'Trin 1/3' },
  { value: 'udførelse',   label: 'Udførelse',   step: 'Trin 2/3' },
  { value: 'evaluering',  label: 'Evaluering',  step: 'Trin 3/3' },
]

function Rail({ address, orderNumber, activeMode, onModeChange, railFooter }: AppShellRailProps) {
  return (
    <aside className="sticky top-[88px] self-start flex flex-col gap-md">
      {/* Titel */}
      <div>
        <span className="font-inter text-xxs font-medium text-text-muted uppercase tracking-widest block mb-xxxs">
          Udførselssted · #{orderNumber}
        </span>
        <h1 className="font-poppins font-semibold text-xl text-text-primary leading-tight">
          {address}
        </h1>
      </div>

      {/* Mode-navigation */}
      <nav className="flex flex-col gap-[2px]" aria-label="Ordre-faser">
        {MODES.map(mode => {
          const isActive = mode.value === activeMode
          return (
            <button
              key={mode.value}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => onModeChange(mode.value)}
              className={[
                'flex items-center justify-between px-xs py-[10px] rounded-lg',
                'font-inter text-sm transition-colors text-left',
                isActive
                  ? 'bg-surface font-semibold text-text-primary shadow-[inset_0_0_0_1px] shadow-hairline'
                  : 'font-medium text-text-muted hover:bg-surface-2 hover:text-text-secondary',
              ].join(' ')}
            >
              <span className="flex items-center gap-xs">
                <span
                  className={[
                    'w-[6px] h-[6px] rounded-full flex-shrink-0',
                    isActive ? 'bg-yellow shadow-[0_0_0_3px_rgba(254,238,50,0.25)]' : 'bg-text-muted opacity-40',
                  ].join(' ')}
                />
                {mode.label}
              </span>
              {isActive && (
                <span className="font-inter text-xxs text-text-muted font-medium">{mode.step}</span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Valgfrit rail-footer (meta-info, alerts osv.) */}
      {railFooter && (
        <div className="pt-md border-t border-hairline">
          {railFooter}
        </div>
      )}
    </aside>
  )
}

/**
 * AppShell — to-kolonne desktop-layout til formand-webappen.
 * Venstre rail: ordre-info + mode-navigation.
 * Højre: side-specifikt indhold via children.
 */
export function AppShell({
  userInitials,
  userName,
  onSettingsPress,
  address,
  orderNumber,
  activeMode,
  onModeChange,
  railFooter,
  children,
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-page">
      <TopBar
        userInitials={userInitials}
        userName={userName}
        onSettingsPress={onSettingsPress}
      />

      <div
        className="max-w-[1280px] mx-auto px-md py-lg
                   grid grid-cols-[280px_1fr] gap-lg"
      >
        <Rail
          address={address}
          orderNumber={orderNumber}
          activeMode={activeMode}
          onModeChange={onModeChange}
          railFooter={railFooter}
        />

        <main className="flex flex-col gap-[48px] pb-[96px]">
          {children}
        </main>
      </div>
    </div>
  )
}
