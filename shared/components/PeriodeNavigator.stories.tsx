import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { PeriodeNavigator } from './PeriodeNavigator'
import type { PeriodeNavigatorMode } from './PeriodeNavigator'

const meta = {
  title: 'Shared/PeriodeNavigator',
  component: PeriodeNavigator,
  parameters: {
    layout: 'centered',
    // '#FAFAFA' = bg-page token (tailwind.config.ts → colors.page)
    backgrounds: { default: 'page', values: [{ name: 'page', value: '#FAFAFA' }] },
  },
  args: {
    // Dummy-handlers der satisfies required props — overrides i render-funktioner
    onNavigate: () => {},
    onToday: () => {},
  },
} satisfies Meta<typeof PeriodeNavigator>

export default meta
type Story = StoryObj<typeof meta>

// ---------------------------------------------------------------------------
// Hjælpe-funktioner til dato-label — matcher DATOFORMAT.md (lang dansk format)
// ---------------------------------------------------------------------------
function formatDanskLangDato(date: Date): string {
  return date.toLocaleDateString('da-DK', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

// ---------------------------------------------------------------------------
// 1. DagOnly — fabrik-use-case: ingen mode-toggle, dato-label inline
// ---------------------------------------------------------------------------

/**
 * Fabrik-use-case: kun dag-navigation, ingen view-mode-toggle.
 * `dateLabel` vises som inline boks med min-bredde 180px.
 * Klik pilene for at skifte dato.
 */
export const DagOnly: Story = {
  render: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [selectedDate, setSelectedDate] = useState(new Date('2026-06-04'))

    return (
      <PeriodeNavigator
        onNavigate={dir => setSelectedDate(d => addDays(d, dir))}
        onToday={() => setSelectedDate(new Date('2026-06-04'))}
        dateLabel={formatDanskLangDato(selectedDate)}
      />
    )
  },
}

// ---------------------------------------------------------------------------
// 2. MedModeToggleUge — vognmand-use-case, aktiv mode = uge
// ---------------------------------------------------------------------------

/**
 * Vognmand-use-case: mode-toggle med alle tre modes, aktiv = "Uge".
 * Ingen inline dato-label (label styres eksternt i page-header).
 * Klik mode-knapperne for at skifte — offset resettes automatisk.
 */
export const MedModeToggleUge: Story = {
  render: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [viewMode, setViewMode] = useState<PeriodeNavigatorMode>('uge')
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [offset, setOffset] = useState(0)

    const getViewDays = (mode: PeriodeNavigatorMode) =>
      mode === 'uge' ? 7 : mode === '14-dage' ? 14 : 30

    return (
      <div className="flex flex-col gap-xs">
        <div className="font-inter text-xs text-text-muted text-center">
          Offset: {offset} dage · Mode: {viewMode}
        </div>
        <PeriodeNavigator
          modes={['uge', '14-dage', 'maaned']}
          activeMode={viewMode}
          onModeChange={m => { setViewMode(m); setOffset(0) }}
          onNavigate={dir => setOffset(o => o + dir * getViewDays(viewMode))}
          onToday={() => setOffset(0)}
        />
      </div>
    )
  },
}

// ---------------------------------------------------------------------------
// 3. MedModeToggle14Dage — vognmand default-state
// ---------------------------------------------------------------------------

/**
 * Vognmand default: mode-toggle med aktiv = "14 dage".
 * Dette er vognmand-appens standard view-mode ved opstart.
 */
export const MedModeToggle14Dage: Story = {
  render: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [viewMode, setViewMode] = useState<PeriodeNavigatorMode>('14-dage')
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [offset, setOffset] = useState(0)

    const getViewDays = (mode: PeriodeNavigatorMode) =>
      mode === 'uge' ? 7 : mode === '14-dage' ? 14 : 30

    return (
      <div className="flex flex-col gap-xs">
        <div className="font-inter text-xs text-text-muted text-center">
          Offset: {offset} dage · Mode: {viewMode}
        </div>
        <PeriodeNavigator
          modes={['uge', '14-dage', 'maaned']}
          activeMode={viewMode}
          onModeChange={m => { setViewMode(m); setOffset(0) }}
          onNavigate={dir => setOffset(o => o + dir * getViewDays(viewMode))}
          onToday={() => setOffset(0)}
        />
      </div>
    )
  },
}

// ---------------------------------------------------------------------------
// 4. MedModeToggleMaaned
// ---------------------------------------------------------------------------

/**
 * Vognmand: mode-toggle med aktiv = "Måned".
 */
export const MedModeToggleMaaned: Story = {
  render: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [viewMode, setViewMode] = useState<PeriodeNavigatorMode>('maaned')
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [offset, setOffset] = useState(0)

    const getViewDays = (mode: PeriodeNavigatorMode) =>
      mode === 'uge' ? 7 : mode === '14-dage' ? 14 : 30

    return (
      <div className="flex flex-col gap-xs">
        <div className="font-inter text-xs text-text-muted text-center">
          Offset: {offset} dage · Mode: {viewMode}
        </div>
        <PeriodeNavigator
          modes={['uge', '14-dage', 'maaned']}
          activeMode={viewMode}
          onModeChange={m => { setViewMode(m); setOffset(0) }}
          onNavigate={dir => setOffset(o => o + dir * getViewDays(viewMode))}
          onToday={() => setOffset(0)}
        />
      </div>
    )
  },
}

// ---------------------------------------------------------------------------
// 5. MedInlineLabelOgToggle — kombineret edge case
// ---------------------------------------------------------------------------

/**
 * Edge case: både mode-toggle OG inline dato-label er aktive.
 * Normalt ikke brugt i produktionen (vognmand har ekstern label, fabrik har ingen toggle),
 * men API tillader det — og det skal renderes pænt.
 */
export const MedInlineLabelOgToggle: Story = {
  render: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [selectedDate, setSelectedDate] = useState(new Date('2026-06-04'))
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [viewMode, setViewMode] = useState<PeriodeNavigatorMode>('uge')

    return (
      <PeriodeNavigator
        modes={['uge', '14-dage', 'maaned']}
        activeMode={viewMode}
        onModeChange={m => setViewMode(m)}
        onNavigate={dir => setSelectedDate(d => addDays(d, dir))}
        onToday={() => setSelectedDate(new Date('2026-06-04'))}
        dateLabel={formatDanskLangDato(selectedDate)}
        dateLabelPosition="inline"
      />
    )
  },
}

// ---------------------------------------------------------------------------
// 6. LangLabel — test af min-w-[180px] med lang dato-tekst
// ---------------------------------------------------------------------------

/**
 * Edge case: lang dato-label som "29. december 2026".
 * Verificerer at `min-w-[180px]` holder og label-boksen ikke kollapser.
 */
export const LangLabel: Story = {
  render: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [selectedDate, setSelectedDate] = useState(new Date('2026-12-29'))

    return (
      <PeriodeNavigator
        onNavigate={dir => setSelectedDate(d => addDays(d, dir))}
        onToday={() => setSelectedDate(new Date('2026-06-04'))}
        dateLabel={formatDanskLangDato(selectedDate)}
      />
    )
  },
}

// ---------------------------------------------------------------------------
// 7. Default — ingen optional props, minimal config
// ---------------------------------------------------------------------------

/**
 * Default: ingen mode-toggle, ingen dato-label.
 * Kun pile og "I dag"-knap — alt optional udeladt.
 * Demonstrerer den minimale API-kontrakt.
 */
export const Default: Story = {}
