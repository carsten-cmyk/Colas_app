/**
 * PROTOTYPE — BottomTabBar
 * 5 tabs: Start, Opgaver, Beskeder, Timereg, Kontakt
 * Matches original React Native BottomTabBar design.
 */
import { Home, Truck, Mail, Clock, Phone, Wrench } from 'lucide-react'

export type TabName = 'start' | 'opgaver' | 'beskeder' | 'timereg' | 'kontakt' | 'prototyper'

export interface BottomTabBarProps {
  activeTab: TabName
  onTabPress: (tab: TabName) => void
  messageCount?: number
}

const TABS: { name: TabName; label: string; Icon: React.ComponentType<{ size: number; color: string }> }[] = [
  { name: 'start', label: 'Start', Icon: Home },
  { name: 'opgaver', label: 'Opgaver', Icon: Truck },
  { name: 'beskeder', label: 'Beskeder', Icon: Mail },
  { name: 'timereg', label: 'Timereg', Icon: Clock },
  { name: 'kontakt', label: 'Kontakt', Icon: Phone },
  { name: 'prototyper', label: '...', Icon: Wrench },
]

export function BottomTabBar({ activeTab, onTabPress, messageCount = 0 }: BottomTabBarProps) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 58,
        backgroundColor: '#0B3950',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        display: 'flex',
        flexDirection: 'row',
        zIndex: 10,
      }}
    >
      {TABS.map((tab) => {
        const isActive = tab.name === activeTab
        return (
          <button
            key={tab.name}
            onClick={() => onTabPress(tab.name)}
            aria-label={tab.label}
            aria-selected={isActive}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 2,
              paddingBottom: 2,
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              opacity: isActive ? 1 : 0.5,
              minHeight: 44,
              position: 'relative',
              outline: 'none',
            }}
          >
            <div style={{ position: 'relative' }}>
              <tab.Icon size={20} color="#FFFFFF" />
              {tab.name === 'beskeder' && messageCount > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    top: -4,
                    right: -6,
                    minWidth: 14,
                    height: 14,
                    backgroundColor: '#FEEE32',
                    borderRadius: 7,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 2px',
                  }}
                >
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      color: '#1D1D1D',
                      fontFamily: 'Inter, sans-serif',
                      lineHeight: 1,
                    }}
                  >
                    {messageCount}
                  </span>
                </div>
              )}
            </div>
            <span
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: 10,
                color: '#FFFFFF',
                lineHeight: 1,
              }}
            >
              {tab.label}
            </span>
            {/* Active indicator bar */}
            <div
              style={{
                height: 4,
                width: 32,
                borderRadius: 4,
                backgroundColor: isActive ? '#FEEE32' : 'transparent',
              }}
            />
          </button>
        )
      })}
    </div>
  )
}
