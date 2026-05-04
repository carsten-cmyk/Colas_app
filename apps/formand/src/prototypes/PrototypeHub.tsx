/**
 * PROTOTYPE — Hub for alle formand-prototyper.
 * Må ikke importeres i produktionskode.
 * Når en prototype er godkendt → byg den ordentligt i src/pages/
 */
import { Routes, Route, Link } from 'react-router-dom'
import { ChevronRight, Layout, CalendarDays, ClipboardList, Truck } from 'lucide-react'
import { AppShell } from './shell/AppShell'
import { GanttScreen } from './gantt/GanttScreen'
import { OrdrePlanScreen } from './ordre-plan/OrdrePlanScreen'
import { TransportberegnerScreen } from './transportberegner/TransportberegnerScreen'

interface Prototype {
  id: string
  title: string
  description: string
  path: string
  icon: React.ReactNode
  sprint: number
}

const PROTOTYPES: Prototype[] = [
  {
    id: 'shell',
    title: 'AppShell',
    description: 'TopBar + BottomTabBar — navigation-rammen for hele appen.',
    path: 'shell',
    icon: <Layout size={22} className="text-deep-teal" />,
    sprint: 1,
  },
  {
    id: 'gantt',
    title: 'Mine opgaver (Gantt)',
    description: '14-dages Gantt-oversigt over ordrer — 3 dage tilbage, 11 frem.',
    path: 'gantt',
    icon: <CalendarDays size={22} className="text-deep-teal" />,
    sprint: 1,
  },
  {
    id: 'ordre-plan',
    title: 'Ordre — Planlægning',
    description: 'Dagfordeling, materiel og transport for én ordre.',
    path: 'ordre-plan',
    icon: <ClipboardList size={22} className="text-deep-teal" />,
    sprint: 1,
  },
  {
    id: 'transportberegner',
    title: 'Transportberegner',
    description: 'Beregner antal lastbiler og daglig køreplan for asfaltleverancer.',
    path: 'transportberegner',
    icon: <Truck size={22} className="text-deep-teal" />,
    sprint: 1,
  },
]

export function PrototypeHub() {
  return (
    <Routes>
      <Route path="/" element={<PrototypeList />} />
      <Route path="shell" element={<AppShell />} />
      <Route path="gantt" element={<GanttScreen />} />
      <Route path="ordre-plan" element={<OrdrePlanScreen />} />
      <Route path="transportberegner" element={<TransportberegnerScreen />} />
    </Routes>
  )
}

function PrototypeList() {
  const sprint1 = PROTOTYPES.filter(p => p.sprint === 1)

  return (
    <div className="min-h-screen bg-dark-teal">
      <div className="max-w-2xl mx-auto px-sm py-md">
        <h1 className="font-poppins font-semibold text-xl text-white mb-xxxs">
          Prototyper
        </h1>
        <p className="font-inter text-sm text-light-aqua mb-md">
          Sprint 1 — tryk for at starte en simulering
        </p>

        <div className="flex flex-col gap-xs">
          {sprint1.map(proto => (
            <Link
              key={proto.id}
              to={proto.path}
              className="flex items-center gap-sm bg-soft-aqua rounded-lg px-sm py-sm hover:bg-white transition-colors no-underline"
            >
              <div className="w-[44px] h-[44px] bg-white rounded-md flex items-center justify-center flex-shrink-0 shadow-md">
                {proto.icon}
              </div>
              <div className="flex-1 min-w-0 gap-xxxs flex flex-col">
                <p className="font-poppins font-semibold text-md text-deep-teal leading-tight">
                  {proto.title}
                </p>
                <p className="font-inter text-xs text-text-muted leading-tight">
                  {proto.description}
                </p>
              </div>
              <ChevronRight size={18} className="text-light-aqua flex-shrink-0" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
