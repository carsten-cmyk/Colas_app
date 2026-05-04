import {
  ListChecks,
  ClipboardList,
  MessageSquare,
  Users,
  FolderOpen,
} from 'lucide-react'
import type { TabName } from '@/types/navigation'

export type { TabName }

export interface BottomTabBarProps {
  activeTab: TabName
  onTabPress: (tab: TabName) => void
  /** Badge-antal for Beskeder-tab */
  messageCount?: number
}

const TABS: { name: TabName; label: string }[] = [
  { name: 'mine-opgaver',   label: 'Opgave oversigt'   },
  { name: 'dagens-opgaver', label: 'Dagens opgaver' },
  { name: 'beskeder',       label: 'Beskeder'       },
  { name: 'kontakt',        label: 'Kontakt'        },
  { name: 'dokumentation',  label: 'Dokumentation'  },
]

function TabIcon({ name }: { name: TabName }) {
  switch (name) {
    case 'mine-opgaver':   return <ListChecks size={20} />
    case 'dagens-opgaver': return <ClipboardList size={20} />
    case 'beskeder':       return <MessageSquare size={20} />
    case 'kontakt':        return <Users size={20} />
    case 'dokumentation':  return <FolderOpen size={20} />
    default:
      // Exhaustiveness check — TypeScript fejler her hvis ny TabName tilføjes uden case
      return ((_: never) => null)(name)
  }
}

export function BottomTabBar({ activeTab, onTabPress, messageCount = 0 }: BottomTabBarProps) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-deep-teal rounded-t-2xl flex z-50 shadow-md"
      style={{ height: 70 }}
      role="tablist"
      aria-label="Bundmenu"
    >
      {TABS.map(tab => {
        const isActive = tab.name === activeTab
        const showBadge = tab.name === 'beskeder' && messageCount > 0

        return (
          <button
            key={tab.name}
            role="tab"
            aria-selected={isActive}
            aria-label={tab.label}
            onClick={() => onTabPress(tab.name)}
            style={{ opacity: isActive ? 1 : 0.5 }}
            className="flex-1 flex flex-col items-center justify-end pb-[10px] gap-xxs border-none bg-transparent cursor-pointer min-h-[44px] relative transition-opacity"
          >
            {/* Ikon */}
            <div className="relative text-white">
              <TabIcon name={tab.name} />
              {showBadge && (
                <span
                  className="absolute -top-1 -right-2 bg-error text-white rounded-[10px] px-[5px] font-inter font-bold leading-none"
                  style={{ fontSize: 9, paddingTop: 1, paddingBottom: 1 }}
                  aria-label={`${messageCount} ulæste beskeder`}
                >
                  {messageCount}
                </span>
              )}
            </div>

            {/* Label + aktiv indikator — grupperet så indikatoren følger labelbredden */}
            <div className="flex flex-col items-center gap-xxxs">
              <span className="font-inter text-xxs text-white leading-none whitespace-nowrap">
                {tab.label}
              </span>
              <div className={`h-[4px] w-full rounded-sm ${isActive ? 'bg-yellow' : ''}`} />
            </div>
          </button>
        )
      })}
    </nav>
  )
}
