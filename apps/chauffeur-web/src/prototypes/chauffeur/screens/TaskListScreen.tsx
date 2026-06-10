/**
 * PROTOTYPE — Opgaveliste (web-port af Expo-version)
 * Dagsoversigt med grupper, badges og pause-warning-flow.
 * Må ikke importeres i produktionskode.
 */
import { useState } from 'react'
import { RefreshCw, X } from 'lucide-react'
import { SAFE_AREA, FS } from '@/styles/spacing'
import { BottomTabBar } from '../components/BottomTabBar'
import type { TabName } from '../components/BottomTabBar'

// ─── Types ────────────────────────────────────────────────────────────────────
type TaskState = 'idle' | 'active' | 'paused' | 'completed'

type PrototypeTask = {
  id: string
  orderNumber: string
  ton: number
  produkt: string
  recept_nr?: string
  produktnavn?: string
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
      { id: '1', orderNumber: '1212343', ton: 75, produkt: '82101H', recept_nr: '82101H', produktnavn: 'AB 11T 22mm', pickupName: 'Køge Asfaltfabrik', deliveryName: 'Uddannelsescenter Syd', meetingTime: '05.30', state: 'completed', completedAt: TWENTY_HOURS_AGO },
      { id: '2', orderNumber: '1212344', ton: 60, produkt: '82201H', recept_nr: '82201H', produktnavn: 'GAB 0/16', pickupName: 'Køge Asfaltfabrik', deliveryName: 'Motorvej E20', meetingTime: '07.00', state: 'active' },
      // TODO: Erstat med Supabase når klar
      { id: '4', orderNumber: '1212346', ton: 50, produkt: '82301H', recept_nr: '82301H', produktnavn: 'PA 8', pickupName: 'Køge Asfaltfabrik', deliveryName: 'Slagelse Nord', meetingTime: '08.30', state: 'paused' },
    ],
  },
  {
    date: '13. Februar 2026',
    tasks: [
      { id: '3', orderNumber: '1212345', ton: 80, produkt: '82101H', recept_nr: '82101H', produktnavn: 'AB 11T 22mm', pickupName: 'Køge Asfaltfabrik', deliveryName: 'Ringsted Centrum', meetingTime: '06.00', state: 'idle' },
    ],
  },
]

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
  // Tilføjet: lys gul baggrund til timereg-banner (svarer til goodBg-mønsteret men gul)
  warnBg: '#FFF7D6',
}

// ─── Props ────────────────────────────────────────────────────────────────────
export interface TaskListScreenProps {
  onClose: () => void
  messageCount?: number
  /** Når sand: ændrer titel til "Timeregistrering" og viser banner-besked øverst */
  timeregMode?: boolean
  /** Callback når bruger trykker på et opgavekort — giver task-id tilbage */
  onTaskPress?: (taskId: string) => void
  /** Callback når bruger trykker "Se timeregistrering" på et afsluttet kort i timeregMode */
  onViewTimereg?: (taskId: string) => void
}

export function TaskListScreen({ onClose, messageCount = 0, timeregMode = false, onTaskPress, onViewTimereg }: TaskListScreenProps) {
  const [groups, setGroups] = useState<DayGroup[]>(INITIAL_GROUPS)
  const [activeTab] = useState<TabName>('prototyper')
  // ID på den opgave brugeren ønsker at åbne/genoptage — bruges til pause-warning
  const [pendingActivateId, setPendingActivateId] = useState<string | null>(null)

  const allTasks = groups.flatMap(g => g.tasks)
  const activeOrPausedTask = allTasks.find(t => t.state === 'active')

  // Aktivér en opgave direkte (ingen aktiv opgave i vejen)
  const activateTask = (taskId: string) => {
    setGroups(prev => prev.map(g => ({
      ...g,
      tasks: g.tasks.map(t =>
        t.id === taskId ? { ...t, state: 'active' as TaskState, completedAt: undefined } : t
      ),
    })))
  }

  // Brugeren trykker "Åbn opgave" eller "Genoptag opgave"
  const handleOpenTask = (taskId: string) => {
    const currentlyActive = allTasks.find(t => t.state === 'active')
    if (!currentlyActive) {
      // Ingen aktiv opgave — åbn direkte
      activateTask(taskId)
    } else {
      // Vis pause-warning med info om den aktive opgave
      setPendingActivateId(taskId)
    }
  }

  // Bruger bekræfter i pause-warning modal
  const handleConfirmActivate = () => {
    if (!pendingActivateId) return
    const idToActivate = pendingActivateId
    // Én samlet setState: sæt aktive til 'paused', sæt valgte til 'active'
    setGroups(prev => prev.map(g => ({
      ...g,
      tasks: g.tasks.map(t => {
        if (t.state === 'active') return { ...t, state: 'paused' as TaskState }
        if (t.id === idToActivate) return { ...t, state: 'active' as TaskState, completedAt: undefined }
        return t
      }),
    })))
    setPendingActivateId(null)
  }

  const handleCancelActivate = () => {
    setPendingActivateId(null)
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
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: SAFE_AREA.top, paddingBottom: 4 }}>
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
            fontSize: FS.md,
            color: C.deepTeal,
            margin: 0,
          }}
        >
          {timeregMode ? 'Timeregistrering' : 'Opgaveliste'}
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
        {/* Timereg-banner — kun synlig i timeregMode */}
        {timeregMode && (
          <div
            style={{
              backgroundColor: C.warnBg,
              borderRadius: 12,
              padding: '12px 16px',
              marginBottom: 12,
            }}
          >
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: FS.sm, color: C.deepTeal, margin: 0, lineHeight: 1.5 }}>
              {activeOrPausedTask
                ? 'Timeregistrering for aktive ordre vises når opgaven afsluttes.'
                : 'Du har ingen opgaver i gang.'}
            </p>
          </div>
        )}

        {groups.map(group => {
          // Sortering: active/idle → paused → completed
          const active = group.tasks.filter(t => t.state !== 'completed' && t.state !== 'paused')
          const paused = group.tasks.filter(t => t.state === 'paused')
          const completed = group.tasks.filter(t => t.state === 'completed')
          const sorted = [...active, ...paused, ...completed]
          return (
            <div key={group.date} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Datogruppe-label — uppercase, muted */}
              <span
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 600,
                  fontSize: FS.xxs,
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
                  onOpenPress={() => handleOpenTask(task.id)}
                  onPress={onTaskPress ? () => onTaskPress(task.id) : undefined}
                  timeregMode={timeregMode}
                  onViewTimereg={onViewTimereg ? () => onViewTimereg(task.id) : undefined}
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

      {/* Pause-warning modal — vises når en opgave skal åbnes men en anden allerede er aktiv */}
      {pendingActivateId && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.45)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            paddingBottom: 58,
          }}
          onClick={handleCancelActivate}
        >
          <div
            style={{
              backgroundColor: C.white,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: '16px 16px 32px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
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

            <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: FS.md, color: C.deepTeal, textAlign: 'center', alignSelf: 'center' }}>
              Aktiv opgave sættes på pause
            </span>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <p
                style={{
                  margin: 0,
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 600,
                  fontSize: FS.sm,
                  color: C.textPrimary,
                  textAlign: 'center',
                }}
              >
                Din nuværende aktive opgave sættes på pause.
              </p>
              <p
                style={{
                  margin: 0,
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 400,
                  fontSize: FS.sm,
                  color: C.textMuted,
                  textAlign: 'center',
                  lineHeight: 1.5,
                }}
              >
                Timeregistrering og vejesedler følger den aktive opgave.
              </p>
            </div>

            <button
              onClick={handleConfirmActivate}
              style={{
                width: '100%',
                height: 52,
                border: 'none',
                borderRadius: 50,
                backgroundColor: C.deepTeal,
                cursor: 'pointer',
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 600,
                fontSize: FS.md,
                color: C.white,
              }}
            >
              Skift til denne opgave
            </button>

            <button
              onClick={handleCancelActivate}
              style={{
                width: '100%',
                height: 52,
                border: `1px solid ${C.deepTeal}`,
                borderRadius: 50,
                background: 'transparent',
                cursor: 'pointer',
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 600,
                fontSize: FS.md,
                color: C.deepTeal,
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
  /** Callback når bruger trykker "Åbn opgave" (completed) eller "Genoptag opgave" (paused) */
  onOpenPress: () => void
  /** Callback når kortet klikkes — åbner TaskDetailScreen */
  onPress?: () => void
  /** Når sand: afsluttede kort viser "Se timeregistrering"-knap i stedet for "Åbn opgave"-chip */
  timeregMode?: boolean
  /** Callback når bruger trykker "Se timeregistrering" */
  onViewTimereg?: () => void
}

function TaskEntry({ task, onOpenPress, onPress, timeregMode = false, onViewTimereg }: TaskEntryProps) {
  const isCompleted = task.state === 'completed'
  const isActive = task.state === 'active'
  const isPaused = task.state === 'paused'
  // Vis "Åbn opgave"-chip kun på completed i normal mode
  const showOpen = isCompleted && canReopen(task.completedAt) && !timeregMode
  // Vis "Genoptag opgave"-chip på pausede opgaver i normal mode
  const showResume = isPaused && !timeregMode
  // Vis "Se timeregistrering"-knap kun i timeregMode på afsluttede opgaver
  const showViewTimereg = isCompleted && timeregMode
  const receptNr = task.recept_nr ?? task.produkt

  const hasBottomAction = showOpen || showResume || showViewTimereg

  return (
    <div
      onClick={onPress}
      style={{
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
        border: `1px solid ${C.border}`,
        // Completed-kort: let dæmpet — pausede kort forbliver fuldt synlige
        opacity: isCompleted ? 0.65 : 1,
        cursor: onPress ? 'pointer' : 'default',
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
          paddingBottom: hasBottomAction ? 44 : 16,
        }}
      >
        {/* Top-række: ordrenummer + badge */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <span
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: FS.xs,
              color: C.textMuted,
              marginBottom: 4,
            }}
          >
            Ordrenummer {task.orderNumber}
          </span>

          {/* "I gang"-badge — grøn baggrund (C.green), hvid tekst */}
          {isActive && (
            <div
              style={{
                backgroundColor: C.green,
                borderRadius: 12,
                padding: '4px 10px',
                flexShrink: 0,
              }}
            >
              <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: FS.xs, color: C.white }}>I gang</span>
            </div>
          )}
          {/* "Pauset"-badge — gul baggrund (C.yellow), deepTeal tekst */}
          {isPaused && (
            <div
              style={{
                backgroundColor: C.yellow,
                borderRadius: 12,
                padding: '4px 10px',
                flexShrink: 0,
              }}
            >
              <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: FS.xs, color: C.deepTeal }}>Pauset</span>
            </div>
          )}
          {/* "Afsluttet"-badge — rød (C.error baggrund, C.white tekst) */}
          {isCompleted && (
            <div
              style={{
                backgroundColor: C.error,
                borderRadius: 12,
                padding: '4px 10px',
                flexShrink: 0,
              }}
            >
              <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: FS.xs, color: C.white }}>Afsluttet</span>
            </div>
          )}
        </div>

        {/* Produktnavn + tons på samme linje (primær), recept_nr under (sekundær) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, marginTop: -4, width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span
              style={{
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 600,
                fontSize: FS.md,
                color: C.deepTeal,
                lineHeight: 1.2,
              }}
            >
              {task.produktnavn ?? receptNr}
            </span>
            <span
              style={{
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 600,
                fontSize: FS.md,
                color: C.deepTeal,
                lineHeight: 1.2,
              }}
            >
              {task.ton} Tons
            </span>
          </div>
          <span
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: FS.xs,
              color: C.textMuted,
              marginTop: 1,
            }}
          >
            {receptNr}
          </span>
        </div>

        {/* Rute-linje */}
        <p
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: FS.sm,
            color: C.textMuted,
            margin: 0,
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
          }}
        >
          {task.pickupName} → {task.deliveryName}
        </p>

        {/* Mødetid */}
        {task.meetingTime && (
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: FS.xs, color: C.textMuted, margin: 0 }}>
            Møde kl. {task.meetingTime}
          </p>
        )}
      </div>

      {/* "Åbn opgave"-chip — completed-kort (renamed fra "Genåbn") */}
      {showOpen && (
        <button
          onClick={(e) => { e.stopPropagation(); onOpenPress() }}
          aria-label="Åbn opgave"
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            backgroundColor: C.softAqua,
            border: 'none',
            borderTop: `1px solid ${C.border}`,
            padding: '10px 16px',
            cursor: 'pointer',
          }}
        >
          <RefreshCw size={13} color={C.deepTeal} />
          <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: FS.xs, color: C.deepTeal }}>Skift til denne opgave</span>
        </button>
      )}

      {/* "Skift til denne opgave"-chip — paused-kort, samme styling som completed-chip */}
      {showResume && (
        <button
          onClick={(e) => { e.stopPropagation(); onOpenPress() }}
          aria-label="Skift til denne opgave"
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            backgroundColor: C.softAqua,
            border: 'none',
            borderTop: `1px solid ${C.border}`,
            padding: '10px 16px',
            cursor: 'pointer',
          }}
        >
          <RefreshCw size={13} color={C.deepTeal} />
          <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: FS.xs, color: C.deepTeal }}>Skift til denne opgave</span>
        </button>
      )}

      {/* "Se timeregistrering"-knap — vises KUN i timeregMode på afsluttede kort */}
      {showViewTimereg && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            borderTop: `1px solid ${C.border}`,
            padding: '6px 12px',
            backgroundColor: C.white,
          }}
        >
          <button
            onClick={(e) => { e.stopPropagation(); onViewTimereg?.() }}
            aria-label="Se timeregistrering"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              backgroundColor: 'transparent',
              border: `1px solid ${C.deepTeal}`,
              borderRadius: 8,
              padding: '6px 12px',
              minHeight: 44,
              cursor: 'pointer',
            }}
          >
            <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: FS.xs, color: C.deepTeal }}>
              Se timeregistrering
            </span>
          </button>
        </div>
      )}
    </div>
  )
}
