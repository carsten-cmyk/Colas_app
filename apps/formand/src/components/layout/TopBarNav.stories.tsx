import type { Meta, StoryObj } from '@storybook/react'
import { TopBarNav } from './TopBarNav'
import type { TopBarNavItem } from './TopBarNav'

// Standard items brugt på tværs af stories
const DEFAULT_ITEMS: TopBarNavItem[] = [
  { id: 'kalenderoversigt', label: 'Kalenderoversigt', to: '/prototyper/gantt' },
  { id: 'dagens-opgaver',   label: 'Dagens opgaver',   to: '/prototyper/dagsoversigt' },
]

const meta = {
  title: 'Layout/TopBarNav',
  component: TopBarNav,
  parameters: {
    // Vises på mørk TopBar-baggrund for at se idle/hover/aktiv states korrekt
    layout: 'padded',
    backgrounds: {
      default: 'deep-teal',
      values: [
        { name: 'deep-teal', value: '#0B3950' },
        { name: 'white',     value: '#ffffff'  },
      ],
    },
  },
  args: {
    items: DEFAULT_ITEMS,
    onNavigate: (item) => console.log('navigate →', item.to),
  },
} satisfies Meta<typeof TopBarNav>

export default meta
type Story = StoryObj<typeof meta>

// ── Default: ingen aktiv (OrdrePlan-kontekst) ──────────────────────────────
export const Default: Story = {
  args: {
    activeId: undefined,
  },
}

// ── Aktiv: Kalenderoversigt ────────────────────────────────────────────────
export const AktivKalenderoversigt: Story = {
  args: {
    activeId: 'kalenderoversigt',
  },
}

// ── Aktiv: Dagens opgaver ──────────────────────────────────────────────────
export const AktivDagensOpgaver: Story = {
  args: {
    activeId: 'dagens-opgaver',
  },
}

// ── Edge: tom items-liste → ingenting vises ────────────────────────────────
export const TomListe: Story = {
  args: {
    items: [],
    activeId: undefined,
  },
}

// ── Edge: ét enkelt item ───────────────────────────────────────────────────
export const EtItem: Story = {
  args: {
    items: [
      { id: 'kalenderoversigt', label: 'Kalenderoversigt', to: '/prototyper/gantt' },
    ],
    activeId: 'kalenderoversigt',
  },
}

// ── Edge: langt label (whitespace-nowrap må ikke bræde) ───────────────────
export const LangtLabel: Story = {
  args: {
    items: [
      { id: 'kalenderoversigt', label: 'Meget langt navigations-label som tester nowrap', to: '/prototyper/gantt' },
      { id: 'dagens-opgaver',   label: 'Endnu et langt label her',                         to: '/prototyper/dagsoversigt' },
    ],
    activeId: 'kalenderoversigt',
  },
}

// ── I TopBar-kontekst (simuleret) ─────────────────────────────────────────
export const ITopBarKontekst: Story = {
  decorators: [
    (Story) => (
      <div
        className="flex items-center justify-between px-sm bg-deep-teal"
        style={{ height: 52 }}
      >
        {/* Colas-logo-placeholder */}
        <div className="font-inter font-bold text-white text-sm">COLAS</div>
        {/* TopBarNav centreret */}
        <Story />
        {/* Avatar-pill-placeholder */}
        <div className="flex items-center gap-xs bg-white/10 rounded-[20px] px-xs py-xxxs">
          <div className="w-[26px] h-[26px] rounded-full bg-dark-teal flex items-center justify-center">
            <span className="font-inter font-bold text-xxs text-white">OJ</span>
          </div>
          <span className="font-inter text-xs text-white/85">Ole J.</span>
        </div>
      </div>
    ),
  ],
  args: {
    activeId: 'kalenderoversigt',
  },
  parameters: {
    layout: 'fullscreen',
  },
}
