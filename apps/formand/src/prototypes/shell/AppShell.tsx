/**
 * PROTOTYPE — AppShell
 * Viser TopBar + BottomTabBar med placeholder-indhold per tab.
 * Må ikke importeres i produktionskode.
 * Når godkendt → byg ordentligt i src/components/layout/AppShell.tsx
 */
import { useState } from 'react'
import { TopBar } from '@/components/layout/TopBar'
import { BottomTabBar } from '@/components/layout/BottomTabBar'
import type { TabName } from '@/types/navigation'

const TAB_CONTENT: Record<TabName, string> = {
  'mine-opgaver':   'Gantt-oversigt bygges i næste sprint',
  'dagens-opgaver': 'Ordre-detalje bygges i næste sprint',
  'beskeder':       'Beskeder — kommer',
  'kontakt':        'Kontaktpersoner — kommer',
  'dokumentation':  'Dokumentation — kommer',
}

export function AppShell() {
  const [activeTab, setActiveTab] = useState<TabName>('mine-opgaver')

  return (
    <div className="min-h-screen bg-soft-aqua">
      <TopBar
        userInitials="OJ"
        userName="Ole J."
        onSettingsPress={() => alert('Indstillinger')}
      />

      <main
        className="flex items-center justify-center"
        style={{ minHeight: 'calc(100vh - 52px - 70px)' }}
      >
        <div className="text-center px-sm">
          <p className="font-poppins font-semibold text-md text-deep-teal mb-xxxs">
            {activeTab.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
          </p>
          <p className="font-inter text-sm text-text-muted">
            {TAB_CONTENT[activeTab]}
          </p>
        </div>
      </main>

      <BottomTabBar
        activeTab={activeTab}
        onTabPress={setActiveTab}
        messageCount={2}
      />
    </div>
  )
}
