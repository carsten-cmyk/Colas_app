/**
 * PROTOTYPE — BottomTabBar
 * 5 tabs: Start, Opgaver, Vejning, Timereg, Kontakt
 * Matches original React Native BottomTabBar design.
 */
import { Home, Truck, Scale, Clock, Phone, Wrench } from 'lucide-react'

export type TabName = 'start' | 'opgaver' | 'vejning' | 'timereg' | 'kontakt' | 'prototyper'

export interface BottomTabBarProps {
  activeTab: TabName
  onTabPress: (tab: TabName) => void
  messageCount?: number
}

const TABS: { name: TabName; label: string; Icon: React.ComponentType<{ size: number; color: string }> }[] = [
  { name: 'start', label: 'Start', Icon: Home },
  { name: 'opgaver', label: 'Opgaver', Icon: Truck },
  { name: 'vejning', label: 'Vejning', Icon: Scale },
  { name: 'timereg', label: 'Timereg', Icon: Clock },
  { name: 'kontakt', label: 'Kontakt', Icon: Phone },
  { name: 'prototyper', label: '...', Icon: Wrench },
]

export function BottomTabBar({ activeTab, onTabPress, messageCount: _messageCount = 0 }: BottomTabBarProps) {
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
