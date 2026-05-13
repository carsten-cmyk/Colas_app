/**
 * PROTOTYPE — Opgaveliste (web-port af Expo-version)
 * Dagsoversigt med grupper, badges og genåbn-flow.
 * Må ikke importeres i produktionskode.
 */
import { useState } from 'react'
import { RefreshCw, ChevronRight, X } from 'lucide-react'
import { BottomTabBar } from '../components/BottomTabBar'
import type { TabName } from '../components/BottomTabBar'

// ─── Types ────────────────────────────────────────────────────────────────────
type TaskState = 'idle' | 'active' | 'paused' | 'completed'

type PrototypeTask = {
  id: string
  orderNumber: string
  ton: number
  produkt: string
  pickupName: string
  deliveryName: string
  meetingTime?: string
  state: TaskState
  completedAt?: string
}

type DayGroup = { date: string; tasks: PrototypeTask[] }

// ─── Mock data ────────────────────────────────────────────────────────────────
const TWENTY_HOURS_AGO = new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString()

const INITIAL_GROUPS: DayGroup[] = [
  {
    date: '12. Februar 2026',
    tasks: [
      { id: '1', orderNumber: '1212343', ton: 75, produkt: '82101H', pickupName: 'Køge Asfaltfabrik', deliveryName: 'Uddannelsescenter Syd', meetingTime: '05.30', state: 'completed', completedAt: TWENTY_HOURS_AGO },
      { id: '2', orderNumber: '1212344', ton: 60, produkt: '82201H', pickupName: 'Køge Asfaltfabrik', deliveryName: 'Motorvej E20', meetingTime: '07.00', state: 'active' },
    ],
  },
  {
    date: '13. Februar 2026',
    tasks: [
      { id: '3', orderNumber: '1212345', ton: 80, produkt: '82101H', pickupName: 'Køge Asfaltfabrik', deliveryName: 'Ringsted Centrum', meetingTime: '06.00', state: 'idle' },
    ],
  },
]

const REOPEN_REASONS = ['Forkert afsluttet', 'Manglende registrering', 'GPS-fejl', 'Teknisk fejl', 'Andet']

function canReopen(completedAt?: string): boolean {
  if (!completedAt) return false
  return Date.now() - new Date(completedAt).getTime() < 24 * 60 * 60 * 1000
}

// ─── Farver (Colas tokens) ────────────────────────────────────────────────────
const C = {
  deepTeal: '#0E4764',
  yellow: '#FEEE32',
  green: '#2E9E65',
  white: '#FFFFFF',
  bg: '#F8F8F8',
  border: '#EDEDED',
  textPrimary: '#1D1D1D',
  textMuted: '#717182',
  error: '#B42828',
  softAqua: '#E8F4F8',
  boxOutline: '#D9E8EE',
}

// ─── Props ────────────────────────────────────────────────────────────────────
export interface TaskListScreenProps {
  onClose: () => void
  messageCount?: number
}

export function TaskListScreen({ onClose, messageCount = 0 }: TaskListScreenProps) {
  const [groups, setGroups] = useState<DayGroup[]>(INITIAL_GROUPS)
  const [activeTab] = useState<TabName>('prototyper')
  const [reopenTaskId, setReopenTaskId] = useState<string | null>(null)

  const handleReopen = (taskId: string) => {
    setGroups(prev => prev.map(g => ({
      ...g,
      tasks: g.tasks.map(t =>
        t.id === taskId ? { ...t, state: 'active' as TaskState, completedAt: undefined } : t
      ),
    })))
    setReopenTaskId(null)
  }

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: C.bg,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Handle bar */}
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 59, paddingBottom: 4 }}>
        <div style={{ width: 36, height: 4, backgroundColor: '#C4C4C4', borderRadius: 2 }} />
      </div>

      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingLeft: 20,
          paddingRight: 16,
          paddingBottom: 12,
        }}
      >
        <p
          style={{
            fontFamily: 'Poppins, sans-serif',
            fontWeight: 600,
            fontSize: 18,
            color: C.deepTeal,
            margin: 0,
          }}
        >
          Opgaveliste
        </p>
        <button
          onClick={onClose}
          aria-label="Luk"
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            backgroundColor: C.border,
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <X size={16} color={C.textPrimary} />
        </button>
      </div>

      {/* Scrollable content */}
      <div
        className="scrollbar-hide"
        style={{
          flex: 1,
          overflowY: 'auto',
          paddingLeft: 20,
          paddingRight: 20,
          paddingTop: 8,
          paddingBottom: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        {groups.map(group => {
          const active = group.tasks.filter(t => t.state !== 'completed')
          const completed = group.tasks.filter(t => t.state === 'completed')
          const sorted = [...active, ...completed]
          return (
            <div key={group.date} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Datogruppe-label — uppercase, muted */}
              <span
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 600,
                  fontSize: 11,
                  color: C.textMuted,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase' as const,
                }}
              >
                {group.date}
              </span>

              {sorted.map(task => (
                <TaskEntry
                  key={task.id}
                  task={task}
                  onReopenPress={() => setReopenTaskId(task.id)}
                />
              ))}
            </div>
          )
        })}
      </div>

      {/* Bottom tab bar */}
      <BottomTabBar
        activeTab={activeTab}
        onTabPress={(tab) => { if (tab !== 'prototyper') onClose() }}
        messageCount={messageCount}
      />

      {/* Genåbn-modal — behold som den er */}
      {reopenTaskId && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.45)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
          }}
          onClick={() => setReopenTaskId(null)}
        >
          <div
            style={{
              backgroundColor: C.white,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: '16px 16px 32px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div
              style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                backgroundColor: C.boxOutline,
                alignSelf: 'center',
                marginBottom: 4,
              }}
            />

            <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: 18, color: C.deepTeal }}>
              Årsag til genåbning
            </span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: C.textMuted, marginBottom: 4 }}>
              Vælg årsag til at genåbne opgaven
            </span>

            <div style={{ backgroundColor: C.softAqua, borderRadius: 12, overflow: 'hidden' }}>
              {REOPEN_REASONS.map((reason, index) => (
                <button
                  key={reason}
                  onClick={() => handleReopen(reopenTaskId)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 16px',
                    border: 'none',
                    borderBottom: index < REOPEN_REASONS.length - 1 ? `1px solid ${C.boxOutline}` : 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: C.textPrimary }}>{reason}</span>
                  <ChevronRight size={16} color={C.textMuted} />
                </button>
              ))}
            </div>

            <button
              onClick={() => setReopenTaskId(null)}
              style={{
                height: 52,
                border: `1px solid ${C.deepTeal}`,
                borderRadius: 50,
                background: 'transparent',
                cursor: 'pointer',
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 600,
                fontSize: 15,
                color: C.deepTeal,
                marginTop: 4,
              }}
            >
              Annuller
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── TaskEntry ─────────────────────────────────────────────────────────────────
interface TaskEntryProps {
  task: PrototypeTask
  onReopenPress: () => void
}

function TaskEntry({ task, onReopenPress }: TaskEntryProps) {
  const isCompleted = task.state === 'completed'
  const isActive = task.state === 'active'
  const showReopen = isCompleted && canReopen(task.completedAt)

  return (
    <div
      style={{
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
        border: isActive ? `2px solid ${C.green}` : `1px solid ${C.border}`,
      }}
    >
      {/* Card */}
      <div
        style={{
          backgroundColor: C.white,
          padding: '16px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          paddingBottom: showReopen ? 44 : 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <span
            style={{
              fontFamily: 'Poppins, sans-serif',
              fontWeight: 600,
              fontSize: 15,
              color: C.deepTeal,
              flex: 1,
            }}
          >
            {task.deliveryName}
          </span>

          {/* Badge */}
          {isActive && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                backgroundColor: C.green,
                borderRadius: 50,
                padding: '3px 10px',
                flexShrink: 0,
              }}
            >
              <div style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: C.white }} />
              <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 11, color: C.white }}>Aktiv</span>
            </div>
          )}
          {isCompleted && (
            <div style={{ backgroundColor: C.error, borderRadius: 50, padding: '3px 10px', flexShrink: 0 }}>
              <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 11, color: C.white }}>Afsluttet</span>
            </div>
          )}
        </div>

        {/* Metrics row */}
        <div style={{ display: 'flex', gap: 20 }}>
          <div>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: C.textMuted, margin: '0 0 2px' }}>Ordre</p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 13, color: C.textPrimary, margin: 0 }}>{task.orderNumber}</p>
          </div>
          <div>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: C.textMuted, margin: '0 0 2px' }}>Produkt</p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 13, color: C.textPrimary, margin: 0 }}>{task.produkt}</p>
          </div>
          <div>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: C.textMuted, margin: '0 0 2px' }}>Tons</p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 13, color: C.textPrimary, margin: 0 }}>{task.ton}</p>
          </div>
          {task.meetingTime && (
            <div>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: C.textMuted, margin: '0 0 2px' }}>Start</p>
              <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 13, color: C.textPrimary, margin: 0 }}>{task.meetingTime}</p>
            </div>
          )}
        </div>

        {/* Fra-linje */}
        <div style={{ display: 'flex', gap: 4 }}>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: C.textMuted }}>Fra:</span>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: C.textPrimary }}>{task.pickupName}</span>
        </div>
      </div>

      {/* Completed red overlay */}
      {isCompleted && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(180,40,40,0.25)',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Genåbn chip */}
      {showReopen && (
        <button
          onClick={onReopenPress}
          aria-label="Genåbn opgave"
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            backgroundColor: 'rgba(180,40,40,0.55)',
            border: 'none',
            borderTop: '1px solid rgba(255,255,255,0.15)',
            padding: '10px 16px',
            cursor: 'pointer',
          }}
        >
          <RefreshCw size={13} color={C.white} />
          <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 12, color: C.white }}>Genåbn opgave</span>
        </button>
      )}
    </div>
  )
}
