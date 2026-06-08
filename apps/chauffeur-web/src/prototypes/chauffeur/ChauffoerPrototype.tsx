/**
 * PROTOTYPE — Chauffør App (state machine)
 * Kører inde i iPhone-rammen. Håndterer al navigation og skærm-tilstand.
 * Må ikke importeres i produktionskode.
 */
import { useState } from 'react'
import type { TaskState } from '@/types/task'
import type { Conversation } from '@/types/messages'
import { mockTasks } from '@/mocks/tasks'
import { mockConversations } from '@/mocks/messages'
import { SplashScreen } from './screens/SplashScreen'
import { DashboardScreen } from './screens/DashboardScreen'
import { TaskDetailScreen } from './screens/TaskDetailScreen'
import { ConversationScreen } from './screens/ConversationScreen'
import { AnkommetFabrikScreen } from './screens/AnkommetFabrikScreen'
import { SamlesPaaEnBilScreen } from './screens/SamlesPaaEnBilScreen'
import { AnkommetUdfoerselsstedScreen } from './screens/AnkommetUdfoerselsstedScreen'
import { TimeRegistrationScreen } from './screens/TimeRegistrationScreen'
import { TaskListScreen } from './screens/TaskListScreen'
import { KontakterScreen } from './screens/KontakterScreen'
import { PauseReminderSimulatorScreen } from './screens/PauseReminderSimulatorScreen'
import { BottomTabBar } from './components/BottomTabBar'
import type { TabName } from './components/BottomTabBar'

type AppScreen = 'splash' | 'app'
type PrototypeSubScreen = 'ankomst' | 'ankomst-plads' | 'timereg' | 'opgaveliste' | 'pause-reminder' | 'samles-paa-en-bil' | null

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

  function handleTabPress(tab: TabName) {
    setActiveTab(tab)
    setSelectedTaskId(null)
    setSelectedConversation(null)
    setPrototypeSubScreen(null)
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
        />
      )}

      {/* Opgaver tab */}
      {activeTab === 'opgaver' && (
        <TaskListScreen
          onClose={() => setActiveTab('start')}
          messageCount={MESSAGE_COUNT}
          onTaskPress={(id) => setSelectedTaskId(id)}
        />
      )}

      {/* Vejning tab — åbner welcome/scan-UI som manuel fallback */}
      {activeTab === 'vejning' && (
        <>
          <AnkommetFabrikScreen onClose={() => setActiveTab('start')} messageCount={MESSAGE_COUNT} />
          <BottomTabBar activeTab={activeTab} onTabPress={handleTabPress} messageCount={MESSAGE_COUNT} />
        </>
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
              fontSize: 16,
              color: '#717182',
              margin: 0,
            }}
          >
            Tidsregistrering
          </p>
          <p
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: 13,
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
              paddingTop: 67,
              paddingLeft: 22,
              paddingRight: 22,
              paddingBottom: 16,
            }}
          >
            <p
              style={{
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 600,
                fontSize: 22,
                color: '#1D1D1D',
                margin: '0 0 20px 0',
              }}
            >
              Prototyper
            </p>
            {[
              { title: 'Ankomst til fabrik', desc: 'QR-scanning ved siloanlæg', screen: 'ankomst' as PrototypeSubScreen },
              { title: 'Ankomst til udførselssted', desc: 'Geofencing ved plads + aflæsning', screen: 'ankomst-plads' as PrototypeSubScreen },
              { title: 'Timeregistrering', desc: 'Oversigt over dagsforbrug', screen: 'timereg' as PrototypeSubScreen },
              { title: 'Opgaveliste', desc: 'Dagsoversigt over opgaver', screen: 'opgaveliste' as PrototypeSubScreen },
              { title: 'Pause-reminder (30 min)', desc: 'Simulér modal der popper op efter længere pause', screen: 'pause-reminder' as PrototypeSubScreen },
              { title: 'Samles på en bil (multi-produkt)', desc: 'Flow 12 — flere produkter på samme bil med vejning mellem hvert', screen: 'samles-paa-en-bil' as PrototypeSubScreen },
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
                    fontSize: 15,
                    color: '#1D1D1D',
                    margin: 0,
                  }}
                >
                  {item.title}
                </p>
                <p
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: 13,
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
      {isPrototyperTab && prototypeSubScreen === 'ankomst' && (
        <AnkommetFabrikScreen onClose={() => setPrototypeSubScreen(null)} messageCount={MESSAGE_COUNT} />
      )}
      {isPrototyperTab && prototypeSubScreen === 'ankomst-plads' && (
        <AnkommetUdfoerselsstedScreen onClose={() => setPrototypeSubScreen(null)} messageCount={MESSAGE_COUNT} />
      )}
      {prototypeSubScreen === 'timereg' && (
        <TimeRegistrationScreen
          onClose={() => {
            setPrototypeSubScreen(null)
            setActiveTab('start')
          }}
          messageCount={MESSAGE_COUNT}
        />
      )}
      {isPrototyperTab && prototypeSubScreen === 'opgaveliste' && (
        <TaskListScreen onClose={() => setPrototypeSubScreen(null)} messageCount={MESSAGE_COUNT} />
      )}
      {isPrototyperTab && prototypeSubScreen === 'pause-reminder' && (
        <>
          <PauseReminderSimulatorScreen onClose={() => setPrototypeSubScreen(null)} />
          <BottomTabBar activeTab={activeTab} onTabPress={handleTabPress} messageCount={MESSAGE_COUNT} />
        </>
      )}
      {isPrototyperTab && prototypeSubScreen === 'samles-paa-en-bil' && (
        <SamlesPaaEnBilScreen onClose={() => setPrototypeSubScreen(null)} messageCount={MESSAGE_COUNT} />
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
        />
      )}

      {/* Ankomst-screens — overlejrer TaskDetailScreen. selectedTaskId nulstilles IKKE,
          så brugeren returnerer til opgaven når ankomst-screen lukkes. */}
      {arrivalScreen === 'fabrik' && (
        <AnkommetFabrikScreen onClose={() => setArrivalScreen(null)} messageCount={MESSAGE_COUNT} />
      )}
      {arrivalScreen === 'plads' && (
        <AnkommetUdfoerselsstedScreen onClose={() => setArrivalScreen(null)} messageCount={MESSAGE_COUNT} />
      )}

      {/* Se timeregistrering overlay — åbnes fra timereg-tab på afsluttede opgaver */}
      {viewingTimeregFor && (
        <TimeRegistrationScreen
          onClose={() => setViewingTimeregFor(null)}
          messageCount={MESSAGE_COUNT}
          reviewMode
        />
      )}

      {/* Conversation overlay (slides over messages list) */}
      {selectedConversation && (
        <ConversationScreen
          conversation={selectedConversation}
          onBack={() => setSelectedConversation(null)}
        />
      )}
    </div>
  )
}
