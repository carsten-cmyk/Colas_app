/**
 * PROTOTYPE — Chauffør App (state machine)
 * Kører inde i iPhone-rammen. Håndterer al navigation og skærm-tilstand.
 * Må ikke importeres i produktionskode.
 */
import { useState } from 'react'
import type { TaskState, Vejeseddel } from '@/types/task'
import type { Conversation } from '@/types/messages'
import type { MaterielTask } from '@/types/materielTask'
import { mockTasks } from '@/mocks/tasks'
import { mockConversations } from '@/mocks/messages'
import { MATERIEL_TASKS } from '@/mocks/materielTasks'
import { DAGENS_VEJESEDLER } from '@/mocks/dagensVejesedler'
import { SAFE_AREA, FS } from '@/styles/spacing'
import { SplashScreen } from './screens/SplashScreen'
import { DashboardScreen } from './screens/DashboardScreen'
import { TaskDetailScreen } from './screens/TaskDetailScreen'
import { MaterielTaskDetailScreen } from './screens/MaterielTaskDetailScreen'
import { ConversationScreen } from './screens/ConversationScreen'
import { AnkommetFabrikScreen } from './screens/AnkommetFabrikScreen'
import { SamlesPaaEnBilScreen } from './screens/SamlesPaaEnBilScreen'
import { AnkommetUdfoerselsstedScreen } from './screens/AnkommetUdfoerselsstedScreen'
import { ReturlaesScreen } from './screens/ReturlaesScreen'
import { ReturlaesMultiScreen } from './screens/ReturlaesMultiScreen'
import { TimeRegistrationScreen } from './screens/TimeRegistrationScreen'
import { TaskListScreen } from './screens/TaskListScreen'
import { KontakterScreen } from './screens/KontakterScreen'
import { DagensVejesedlerScreen } from './screens/DagensVejesedlerScreen'
import { BottomTabBar } from './components/BottomTabBar'
import type { TabName } from './components/BottomTabBar'

type AppScreen = 'splash' | 'app'
type PrototypeSubScreen = 'timereg' | 'samles-paa-en-bil' | 'returlaes' | 'returlaes-multi' | null

const MESSAGE_COUNT = mockConversations.filter(
  c => !c.lastMessage.isRead && c.lastMessage.senderId !== 'me'
).length

export function ChauffoerPrototype() {
  const [screen, setScreen] = useState<AppScreen>('splash')
  const [activeTab, setActiveTab] = useState<TabName>('start')
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [taskStates, setTaskStates] = useState<Record<string, TaskState>>({})
  const [prototypeSubScreen, setPrototypeSubScreen] = useState<PrototypeSubScreen>(null)
  const [arrivalScreen, setArrivalScreen] = useState<'fabrik' | 'plads' | null>(null)
  const [viewingTimeregFor, setViewingTimeregFor] = useState<string | null>(null)
  // Delt returlæs-state — sættes af begge indgange (TaskDetailScreen + AnkommetUdfoerselsstedScreen)
  // TODO: Erstat med Supabase når klar
  const [returlaesOprettetForTask, setReturlaesOprettetForTask] = useState<Record<string, boolean>>({})
  // Vejeseddel-overlay — payload-baseret så overlayet kan vise enten dagens eller en ordres vejesedler
  // TODO: Erstat med Supabase når klar
  const [vejesedlerView, setVejesedlerView] = useState<{ vejesedler: Vejeseddel[]; title: string; dato: string | null } | null>(null)

  function danskDatoIdAg(): string {
    return new Date().toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  // ── Materiel-state (parallelt ID-rum — rører ikke asfalt-logik) ─────────────
  const [materielTasks, setMaterielTasks] = useState<MaterielTask[]>(MATERIEL_TASKS)
  const [selectedMaterielTaskId, setSelectedMaterielTaskId] = useState<string | null>(null)

  const selectedTask = selectedTaskId ? (mockTasks.find(t => t.id === selectedTaskId) ?? null) : null
  const currentTaskState: TaskState = selectedTask
    ? (taskStates[selectedTask.id] ?? selectedTask.state)
    : 'idle'

  const otherActiveTaskId = selectedTaskId
    ? Object.entries(taskStates).find(([id, s]) => id !== selectedTaskId && (s === 'active' || s === 'paused'))?.[0]
    : undefined
  const otherActiveTask = otherActiveTaskId
    ? mockTasks.find(t => t.id === otherActiveTaskId) ?? null
    : null

  // ── Materiel-handlers ────────────────────────────────────────────────────────
  const handleSelectMaterielTask = (id: string) => setSelectedMaterielTaskId(id)

  function handleCloseMaterielTask() {
    setSelectedMaterielTaskId(null)
  }

  function handleMaterielStart(taskId: string) {
    setMaterielTasks(prev =>
      prev.map(t => t.id === taskId ? { ...t, state: 'i-gang' } : t)
    )
  }

  function handleMaterielDeliver(taskId: string, dropoffId: string) {
    setMaterielTasks(prev =>
      prev.map(t => {
        if (t.id !== taskId) return t
        const updatedDropoffs = t.dropoffs.map(d =>
          d.id === dropoffId ? { ...d, leveret: true } : d
        )
        // Auto-afslut fjernet — afslutning sker KUN via "Afslut opgave"-knappen
        return { ...t, dropoffs: updatedDropoffs }
      })
    )
  }

  function handleMaterielComplete(taskId: string) {
    setMaterielTasks(prev =>
      prev.map(t => t.id === taskId ? { ...t, state: 'afsluttet' } : t)
    )
    setSelectedMaterielTaskId(null)
  }

  function handleTabPress(tab: TabName) {
    setActiveTab(tab)
    setSelectedTaskId(null)
    setSelectedConversation(null)
    setPrototypeSubScreen(null)
    setSelectedMaterielTaskId(null)
  }

  function handleTaskStart() {
    if (!selectedTask) return
    setTaskStates(prev => ({ ...prev, [selectedTask.id]: 'active' }))
  }

  function handleTaskPause() {
    if (!selectedTask) return
    setTaskStates(prev => ({ ...prev, [selectedTask.id]: 'paused' }))
  }

  function handleTaskComplete() {
    if (!selectedTask) return
    setTaskStates(prev => ({ ...prev, [selectedTask.id]: 'completed' }))
    setSelectedTaskId(null)
    setPrototypeSubScreen('timereg')
  }

  if (screen === 'splash') {
    return <SplashScreen onStart={() => setScreen('app')} />
  }

  const isPlaceholderTab = false // timereg er nu wired — ingen placeholder-tabs tilbage
  const isPrototyperTab = activeTab === 'prototyper'

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>

      {/* Start tab */}
      {activeTab === 'start' && (
        <DashboardScreen
          tasks={mockTasks}
          messageCount={MESSAGE_COUNT}
          activeTab={activeTab}
          onTabPress={handleTabPress}
          onTaskPress={id => setSelectedTaskId(id)}
          // Bibeholdes — peger nu på vejning-tab, beskeder er fjernet i Fase 1
          onMessagesPress={() => handleTabPress('vejning')}
          materielTasks={materielTasks}
          onSelectMaterielTask={handleSelectMaterielTask}
        />
      )}

      {/* Opgaver tab */}
      {activeTab === 'opgaver' && (
        <TaskListScreen
          onClose={() => setActiveTab('start')}
          messageCount={MESSAGE_COUNT}
          onTaskPress={(id) => setSelectedTaskId(id)}
          materielTasks={materielTasks}
          onSelectMaterielTask={handleSelectMaterielTask}
        />
      )}

      {/* Vejesedler tab — viser dagens vejesedler (AnkommetFabrikScreen bevaret som prototype-blok) */}
      {activeTab === 'vejning' && (
        <DagensVejesedlerScreen
          variant="tab"
          onClose={() => setActiveTab('start')}
          messageCount={MESSAGE_COUNT}
          onTabPress={handleTabPress}
        />
      )}

      {/* Timereg tab — åbner TaskListScreen i timeregMode */}
      {activeTab === 'timereg' && (
        <TaskListScreen
          onClose={() => setActiveTab('start')}
          messageCount={MESSAGE_COUNT}
          timeregMode
          onTaskPress={(id) => setSelectedTaskId(id)}
          onViewTimereg={(taskId) => setViewingTimeregFor(taskId)}
        />
      )}

      {/* Placeholder tabs */}
      {isPlaceholderTab && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: '#F8F8F8',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            paddingBottom: 58,
          }}
        >
          <p
            style={{
              fontFamily: 'Poppins, sans-serif',
              fontWeight: 600,
              fontSize: FS.md,
              color: '#717182',
              margin: 0,
            }}
          >
            Tidsregistrering
          </p>
          <p
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: FS.sm,
              color: '#C4C4C4',
              margin: '4px 0 0',
            }}
          >
            Kommer snart
          </p>
          <BottomTabBar activeTab={activeTab} onTabPress={handleTabPress} messageCount={MESSAGE_COUNT} />
        </div>
      )}

      {/* Kontakter tab */}
      {activeTab === 'kontakt' && (
        <KontakterScreen
          tasks={mockTasks}
          onClose={() => setActiveTab('start')}
          activeTab={activeTab}
          onTabPress={handleTabPress}
          messageCount={MESSAGE_COUNT}
        />
      )}

      {/* Prototyper tab — hub */}
      {isPrototyperTab && !prototypeSubScreen && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: '#F8F8F8',
            display: 'flex',
            flexDirection: 'column',
            paddingBottom: 58,
            overflowY: 'auto',
          }}
        >
          <div
            style={{
              paddingTop: `calc(${SAFE_AREA.top} + 8px)`,
              paddingLeft: 22,
              paddingRight: 22,
              paddingBottom: 16,
            }}
          >
            <p
              style={{
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 600,
                fontSize: FS.xl,
                color: '#1D1D1D',
                margin: '0 0 20px 0',
              }}
            >
              Prototyper
            </p>
            {[
              { title: 'Samles på en bil (multi-produkt)', desc: 'Flow 12 — flere produkter på samme bil med vejning mellem hvert', screen: 'samles-paa-en-bil' as PrototypeSubScreen },
              { title: 'Returlæs (enkelt)', desc: 'Flow 14 — rest-asfalt returneres til fabrik, spejlet vejeflow (enkelt produkt)', screen: 'returlaes' as PrototypeSubScreen },
              { title: 'Returlæs (multiprodukt)', desc: 'Flow 14b — rest-asfalt returneres til fabrik, ét negativt vejebilag pr. produkt', screen: 'returlaes-multi' as PrototypeSubScreen },
            ].map((item) => (
              <button
                key={item.title}
                aria-label={item.title}
                onClick={() => setPrototypeSubScreen(item.screen)}
                style={{
                  width: '100%',
                  backgroundColor: '#FFFFFF',
                  borderRadius: 12,
                  padding: '16px 20px',
                  marginBottom: 12,
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                  minHeight: 44,
                }}
              >
                <p
                  style={{
                    fontFamily: 'Poppins, sans-serif',
                    fontWeight: 600,
                    fontSize: FS.md,
                    color: '#1D1D1D',
                    margin: 0,
                  }}
                >
                  {item.title}
                </p>
                <p
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: FS.sm,
                    color: '#717182',
                    margin: 0,
                  }}
                >
                  {item.desc}
                </p>
              </button>
            ))}
          </div>
          <BottomTabBar activeTab={activeTab} onTabPress={handleTabPress} messageCount={MESSAGE_COUNT} />
        </div>
      )}

      {/* Prototype sub-screens */}
      {prototypeSubScreen === 'timereg' && (
        <TimeRegistrationScreen
          onClose={() => {
            setPrototypeSubScreen(null)
            setActiveTab('start')
          }}
          messageCount={MESSAGE_COUNT}
          onViewVejesedler={() => setVejesedlerView({ vejesedler: DAGENS_VEJESEDLER, title: 'Dagens vejesedler', dato: danskDatoIdAg() })}
        />
      )}
      {isPrototyperTab && prototypeSubScreen === 'samles-paa-en-bil' && (
        <SamlesPaaEnBilScreen onClose={() => setPrototypeSubScreen(null)} messageCount={MESSAGE_COUNT} />
      )}
      {prototypeSubScreen === 'returlaes' && (
        <ReturlaesScreen onClose={() => setPrototypeSubScreen(null)} messageCount={MESSAGE_COUNT} />
      )}
      {prototypeSubScreen === 'returlaes-multi' && (
        <ReturlaesMultiScreen onClose={() => setPrototypeSubScreen(null)} messageCount={MESSAGE_COUNT} />
      )}

      {/* Task detail overlay (slides over dashboard) */}
      {selectedTask && (
        <TaskDetailScreen
          task={selectedTask}
          taskState={currentTaskState}
          onClose={() => setSelectedTaskId(null)}
          onStart={handleTaskStart}
          onPause={handleTaskPause}
          onComplete={handleTaskComplete}
          otherActiveTask={otherActiveTask ? { id: otherActiveTask.id, orderNumber: otherActiveTask.orderNumber, produkt: otherActiveTask.produkt } : null}
          onGoToOtherTask={(id) => setSelectedTaskId(id)}
          onArrivalConfirm={(dest) => setArrivalScreen(dest)}
          onViewVejesedler={() => selectedTask && setVejesedlerView({ vejesedler: selectedTask.vejesedler ?? [], title: `Vejesedler — ordre ${selectedTask.orderNumber}`, dato: null })}
          returlaesOprettet={selectedTask ? (returlaesOprettetForTask[selectedTask.id] ?? false) : false}
          onOpretReturlaes={() => {
            if (selectedTask) {
              setReturlaesOprettetForTask(prev => ({ ...prev, [selectedTask.id]: true }))
            }
            setPrototypeSubScreen('returlaes')
          }}
        />
      )}

      {/* Ankomst-screens — overlejrer TaskDetailScreen. selectedTaskId nulstilles IKKE,
          så brugeren returnerer til opgaven når ankomst-screen lukkes. */}
      {arrivalScreen === 'fabrik' && (
        <AnkommetFabrikScreen onClose={() => setArrivalScreen(null)} messageCount={MESSAGE_COUNT} />
      )}
      {arrivalScreen === 'plads' && (
        <AnkommetUdfoerselsstedScreen
          onClose={() => setArrivalScreen(null)}
          messageCount={MESSAGE_COUNT}
          onOpretReturlaes={() => {
            if (selectedTaskId) {
              setReturlaesOprettetForTask(prev => ({ ...prev, [selectedTaskId]: true }))
            }
            setArrivalScreen(null)
            setPrototypeSubScreen('returlaes')
          }}
        />
      )}

      {/* Se timeregistrering overlay — åbnes fra timereg-tab på afsluttede opgaver */}
      {viewingTimeregFor && (
        <TimeRegistrationScreen
          onClose={() => setViewingTimeregFor(null)}
          messageCount={MESSAGE_COUNT}
          reviewMode
          onViewVejesedler={() => setVejesedlerView({ vejesedler: DAGENS_VEJESEDLER, title: 'Dagens vejesedler', dato: danskDatoIdAg() })}
        />
      )}

      {/* Vejeseddel-overlay — lægger sig oven på aktiv skærm (tidsreg eller TaskDetail); retur-knap afslører skærmen under */}
      {vejesedlerView && (
        <DagensVejesedlerScreen
          variant="overlay"
          vejesedler={vejesedlerView.vejesedler}
          title={vejesedlerView.title}
          dato={vejesedlerView.dato}
          onClose={() => setVejesedlerView(null)}
          messageCount={MESSAGE_COUNT}
        />
      )}

      {/* Conversation overlay (slides over messages list) */}
      {selectedConversation && (
        <ConversationScreen
          conversation={selectedConversation}
          onBack={() => setSelectedConversation(null)}
        />
      )}

      {/* Materiel task detail overlay — parallelt med asfalt-overlay */}
      {(() => {
        const materielTask = materielTasks.find(t => t.id === selectedMaterielTaskId)
        return materielTask ? (
          <MaterielTaskDetailScreen
            task={materielTask}
            taskState={materielTask.state}
            onClose={handleCloseMaterielTask}
            onStart={() => handleMaterielStart(materielTask.id)}
            onDeliver={(dropoffId) => handleMaterielDeliver(materielTask.id, dropoffId)}
            onComplete={() => handleMaterielComplete(materielTask.id)}
          />
        ) : null
      })()}
    </div>
  )
}
