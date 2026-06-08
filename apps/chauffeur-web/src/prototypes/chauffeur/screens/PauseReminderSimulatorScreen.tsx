/**
 * PROTOTYPE — Pause-reminder simulator
 * Simulerer 30-minutters pause-reminder-flow (FUNCTIONAL_FLOWS Variant: Pause-reminder).
 * Justerbar timer (5s / 30s / 1 min / 30 min) så flowet kan testes uden at vente 30 min.
 * Må ikke importeres i produktionskode.
 */
import { useState, useEffect, useRef } from 'react'
import { X, Pause, Play, Clock } from 'lucide-react'

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
  softAqua: '#E8F4F8',
  boxOutline: '#D9E8EE',
  pauseBg: '#FFF7D6',
  pauseBorder: '#F2D24A',
}

type SimTaskState = 'active' | 'paused'

const DELAY_OPTIONS: { label: string; seconds: number }[] = [
  { label: '5 sek.', seconds: 5 },
  { label: '30 sek.', seconds: 30 },
  { label: '1 minut', seconds: 60 },
  { label: '30 minutter', seconds: 30 * 60 },
]

export interface PauseReminderSimulatorScreenProps {
  onClose: () => void
}

export function PauseReminderSimulatorScreen({ onClose }: PauseReminderSimulatorScreenProps) {
  const [taskState, setTaskState] = useState<SimTaskState>('active')
  const [delaySeconds, setDelaySeconds] = useState<number>(5)
  const [remaining, setRemaining] = useState<number | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [reminderCount, setReminderCount] = useState(0)
  const [eventLog, setEventLog] = useState<string[]>([])
  const tickRef = useRef<number | null>(null)

  function log(line: string) {
    const ts = new Date().toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    setEventLog(prev => [`${ts} — ${line}`, ...prev].slice(0, 8))
  }

  function clearTick() {
    if (tickRef.current !== null) {
      window.clearInterval(tickRef.current)
      tickRef.current = null
    }
  }

  function startTimer() {
    clearTick()
    setRemaining(delaySeconds)
    tickRef.current = window.setInterval(() => {
      setRemaining(prev => {
        if (prev === null) return null
        if (prev <= 1) {
          clearTick()
          setModalOpen(true)
          setReminderCount(c => c + 1)
          log('Reminder-modal vist')
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  useEffect(() => clearTick, [])

  function handlePause() {
    setTaskState('paused')
    log('Opgave sat på pause — timer startet')
    startTimer()
  }

  function handleResume() {
    setTaskState('active')
    setModalOpen(false)
    clearTick()
    setRemaining(null)
    setReminderCount(0)
    log('Opgave genoptaget')
  }

  function handleStillPaused() {
    setModalOpen(false)
    log('Bekræftet "Ja, stadig på pause" — timer nulstillet')
    startTimer()
  }

  function handleReset() {
    setTaskState('active')
    setModalOpen(false)
    clearTick()
    setRemaining(null)
    setReminderCount(0)
    setEventLog([])
  }

  const mmss = remaining !== null
    ? `${Math.floor(remaining / 60).toString().padStart(2, '0')}:${(remaining % 60).toString().padStart(2, '0')}`
    : null

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: C.bg,
        display: 'flex',
        flexDirection: 'column',
        paddingBottom: 58,
        overflowY: 'auto',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 59,
          paddingLeft: 20,
          paddingRight: 16,
          paddingBottom: 12,
        }}
      >
        <p style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: 18, color: C.deepTeal, margin: 0 }}>
          Pause-reminder simulator
        </p>
        <button
          onClick={onClose}
          aria-label="Luk"
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <X size={20} color={C.textPrimary} />
        </button>
      </div>

      {/* Intro */}
      <div style={{ padding: '0 20px 12px' }}>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: C.textMuted, margin: 0, lineHeight: 1.4 }}>
          Test 30-min pause-reminder uden at vente 30 min. Vælg en kort delay, sæt opgaven på pause, og se hvad der sker når timeren udløber.
        </p>
      </div>

      {/* Delay-vælger */}
      <div style={{ padding: '0 20px 16px' }}>
        <p style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: 13, color: C.textPrimary, margin: '0 0 8px' }}>
          Reminder-delay
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {DELAY_OPTIONS.map(opt => {
            const isActive = delaySeconds === opt.seconds
            return (
              <button
                key={opt.seconds}
                onClick={() => setDelaySeconds(opt.seconds)}
                disabled={taskState === 'paused'}
                style={{
                  height: 36,
                  padding: '0 14px',
                  borderRadius: 18,
                  border: `1px solid ${isActive ? C.deepTeal : C.border}`,
                  backgroundColor: isActive ? C.deepTeal : C.white,
                  color: isActive ? C.white : C.textPrimary,
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: taskState === 'paused' ? 'not-allowed' : 'pointer',
                  opacity: taskState === 'paused' ? 0.5 : 1,
                  minHeight: 44,
                }}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Mock-opgave-kort */}
      <div style={{ padding: '0 20px 16px' }}>
        <div
          style={{
            backgroundColor: C.white,
            borderRadius: 12,
            padding: 16,
            border: `1px solid ${C.boxOutline}`,
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <p style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: 15, color: C.textPrimary, margin: 0 }}>
              Demo-opgave
            </p>
            <span
              style={{
                padding: '4px 10px',
                borderRadius: 12,
                backgroundColor: taskState === 'paused' ? C.pauseBg : '#E6F5EC',
                color: taskState === 'paused' ? '#8A6A00' : C.green,
                fontFamily: 'Inter, sans-serif',
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: 0.2,
              }}
            >
              {taskState === 'paused' ? 'PÅ PAUSE' : 'AKTIV'}
            </span>
          </div>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: C.textMuted, margin: '0 0 12px' }}>
            Order #1212344 · 60 t · 82201H · Køge → Motorvej E20
          </p>

          {/* Countdown */}
          {taskState === 'paused' && mmss !== null && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                borderRadius: 10,
                backgroundColor: C.pauseBg,
                border: `1px solid ${C.pauseBorder}`,
                marginBottom: 12,
              }}
            >
              <Clock size={16} color="#8A6A00" />
              <div style={{ flex: 1 }}>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#8A6A00', margin: 0 }}>
                  Reminder om
                </p>
                <p style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: 17, color: C.textPrimary, margin: 0, fontVariantNumeric: 'tabular-nums' }}>
                  {mmss}
                </p>
              </div>
              {reminderCount > 0 && (
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#8A6A00' }}>
                  cyklus {reminderCount + 1}
                </span>
              )}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8 }}>
            {taskState === 'active' ? (
              <button
                onClick={handlePause}
                style={{
                  flex: 1,
                  height: 48,
                  backgroundColor: C.border,
                  color: C.textPrimary,
                  borderRadius: 12,
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'Poppins, sans-serif',
                  fontWeight: 600,
                  fontSize: 14,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  minHeight: 44,
                }}
              >
                <Pause size={16} color={C.textPrimary} />
                Pause
              </button>
            ) : (
              <button
                onClick={handleResume}
                style={{
                  flex: 1,
                  height: 48,
                  backgroundColor: C.yellow,
                  color: C.deepTeal,
                  borderRadius: 12,
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'Poppins, sans-serif',
                  fontWeight: 600,
                  fontSize: 14,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  minHeight: 44,
                }}
              >
                <Play size={16} color={C.deepTeal} />
                Genoptag opgave
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Event-log */}
      <div style={{ padding: '0 20px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <p style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: 13, color: C.textPrimary, margin: 0 }}>
            Hændelser
          </p>
          <button
            onClick={handleReset}
            style={{
              padding: '6px 12px',
              borderRadius: 14,
              border: `1px solid ${C.border}`,
              backgroundColor: C.white,
              color: C.textPrimary,
              fontFamily: 'Inter, sans-serif',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Nulstil
          </button>
        </div>
        <div
          style={{
            backgroundColor: C.white,
            borderRadius: 10,
            border: `1px solid ${C.border}`,
            padding: 12,
            minHeight: 60,
          }}
        >
          {eventLog.length === 0 ? (
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: C.textMuted, margin: 0, fontStyle: 'italic' }}>
              Ingen hændelser endnu. Tryk Pause for at starte.
            </p>
          ) : (
            eventLog.map((line, i) => (
              <p
                key={i}
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 12,
                  color: i === 0 ? C.textPrimary : C.textMuted,
                  margin: i === 0 ? '0 0 4px' : '0 0 2px',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {line}
              </p>
            ))
          )}
        </div>
      </div>

      {/* Reminder-modal */}
      {modalOpen && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 24px',
            zIndex: 20,
          }}
        >
          <div
            style={{
              backgroundColor: C.white,
              borderRadius: 24,
              padding: 20,
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: 18, color: C.deepTeal, textAlign: 'center' }}>
              Er du stadig på pause?
            </span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: C.textMuted, textAlign: 'center', lineHeight: 1.4 }}>
              Du har været på pause i 30 minutter. Bekræft venligst om du stadig er på pause, eller genoptag opgaven.
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4, width: '100%' }}>
              <button
                onClick={handleResume}
                style={{
                  height: 48,
                  backgroundColor: C.green,
                  border: 'none',
                  borderRadius: 50,
                  cursor: 'pointer',
                  fontFamily: 'Poppins, sans-serif',
                  fontWeight: 600,
                  fontSize: 14,
                  color: C.white,
                  minHeight: 44,
                }}
              >
                Genoptag opgave
              </button>
              <button
                onClick={handleStillPaused}
                style={{
                  height: 48,
                  border: `1px solid ${C.deepTeal}`,
                  borderRadius: 50,
                  background: 'transparent',
                  cursor: 'pointer',
                  fontFamily: 'Poppins, sans-serif',
                  fontWeight: 600,
                  fontSize: 14,
                  color: C.deepTeal,
                  minHeight: 44,
                }}
              >
                Ja, stadig på pause
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
