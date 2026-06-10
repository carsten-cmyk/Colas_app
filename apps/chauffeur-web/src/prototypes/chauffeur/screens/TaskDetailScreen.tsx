/**
 * PROTOTYPE — Opgave-detaljeskærm (fuld-skærms-layout)
 * Viser ordre-metrics, lokationer, information, formand-kontakt og handlingsknapper.
 */
import { useState } from 'react'
import { X, MapPin, ArrowDown, ArrowUp } from 'lucide-react'
import type { Task, TaskState } from '@/types/task'
import { SAFE_AREA, FS } from '@/styles/spacing'

// ─── Farver (Colas tokens) ────────────────────────────────────────────────────
const C = {
  deepTeal: '#0E4764',
  white: '#FFFFFF',
  bg: '#F8F8F8',
  border: '#EDEDED',
  textPrimary: '#1D1D1D',
  textMuted: '#717182',
  danger: '#C8372D',
  dangerBg: '#FBECEA',
  dangerBorder: '#F4C5C2',
  pickupBg: '#F0F7FA',
  deliveryIconColor: '#1F8A5B',
  deliveryBg: '#E7F4EE',
  avatarBg: '#A0C7D7',
  handleBar: '#C4C4C4',
  green: '#1F8A5B',
  yellow: '#FEEE32',
}

export interface TaskDetailScreenProps {
  task: Task
  taskState: TaskState
  onClose: () => void
  onStart: () => void
  onPause: () => void
  onComplete: () => void
  /** Anden opgave der allerede er active eller paused — bruges til single-task-constraint */
  otherActiveTask?: { id: string; orderNumber: string; produkt: string } | null
  /** Navigér til den anden aktive opgave */
  onGoToOtherTask?: (taskId: string) => void
  /** Åbn ankomst-bekræftelses-skærm for fabrik eller plads */
  onArrivalConfirm?: (destination: 'fabrik' | 'plads') => void
}

export function TaskDetailScreen({
  task,
  taskState,
  onClose,
  onStart,
  onPause,
  onComplete,
  otherActiveTask,
  onGoToOtherTask,
  onArrivalConfirm,
}: TaskDetailScreenProps) {
  const [pauseConfirmOpen, setPauseConfirmOpen] = useState(false)
  const [completeConfirmOpen, setCompleteConfirmOpen] = useState(false)
  const [startConfirmOpen, setStartConfirmOpen] = useState(false)
  const [alreadyActiveOpen, setAlreadyActiveOpen] = useState(false)
  const [pickup, delivery] = task.locations
  const infoAlerts = task.alerts.filter(a => a.type !== 'traffic')
  const dangerAlerts = task.alerts.filter(a => a.type === 'traffic')
  const hasAlerts = !!task.formandNote || infoAlerts.length > 0 || dangerAlerts.length > 0

  // Find formand — fallback til første kontakt
  const formandContact =
    task.contacts.find(c => c.role.toLowerCase().includes('formand')) ??
    task.contacts[0] ??
    null

  // ─── Delte stil-konstanter ──────────────────────────────────────────────────
  const sectionLabel: React.CSSProperties = {
    fontFamily: 'Inter, sans-serif',
    fontWeight: 600,
    fontSize: FS.xxs,
    color: C.textMuted,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    margin: 0,
  }

  const card: React.CSSProperties = {
    backgroundColor: C.white,
    borderRadius: 20,
    border: `1px solid ${C.border}`,
    padding: 16,
  }

  return (
    // ─── Root — fuld skærm (matcher AnkommetFabrikScreen / TimeRegistrationScreen) ──
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: C.bg,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Handle bar — 59px Dynamic Island safe area */}
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: SAFE_AREA.top, paddingBottom: 4 }}>
        <div style={{ width: 36, height: 4, backgroundColor: C.handleBar, borderRadius: 2 }} />
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
            fontSize: FS.sm,
            color: C.textPrimary,
            margin: 0,
          }}
        >
          Ordrenummer {task.orderNumber}
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

      {/* Scrollable body — paddingBottom = action-bar height (69px: 1px border + 8px top + 52px btn + 8px bottom) + 16px clear air = 85px.
          Reduceres til 16 når action-bar er skjult (completed state). */}
      <div
        className="scrollbar-hide"
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          paddingLeft: 20,
          paddingRight: 20,
          paddingTop: 8,
          paddingBottom: taskState === 'completed' ? 16 : 88,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {/* Order metrics — 2 rækker: Ton+Produkt øverst, Formand fuld bredde nederst */}
        <div
          style={{
            backgroundColor: C.white,
            borderRadius: 12,
            border: `1px solid ${C.border}`,
            overflow: 'hidden',
          }}
        >
          {/* Række 1: Produkt | Ton */}
          <div style={{ display: 'flex' }}>
            {/* Produkt */}
            <div
              style={{
                flex: 1,
                padding: '14px 13px',
                borderRight: `1px solid ${C.border}`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <p
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: FS.xxs,
                  color: C.textMuted,
                  margin: '0 0 2px 0',
                  textAlign: 'center',
                }}
              >
                Produkt
              </p>
              <p
                style={{
                  fontFamily: 'Poppins, sans-serif',
                  fontWeight: 600,
                  fontSize: FS.xl,
                  color: C.textPrimary,
                  margin: 0,
                  lineHeight: 1.2,
                  textAlign: 'center',
                }}
              >
                {task.produktnavn ?? (task.recept_nr ?? task.produkt)}
              </p>
              <p
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 400,
                  fontSize: FS.xxs,
                  color: C.textMuted,
                  margin: '2px 0 0 0',
                  textAlign: 'center',
                }}
              >
                {task.recept_nr ?? task.produkt}
              </p>
            </div>

            {/* Ton */}
            <div
              style={{
                flex: 1,
                padding: '14px 13px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <p
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: FS.xxs,
                  color: C.textMuted,
                  margin: '0 0 2px 0',
                  textAlign: 'center',
                }}
              >
                Ton
              </p>
              <p
                style={{
                  fontFamily: 'Poppins, sans-serif',
                  fontWeight: 600,
                  fontSize: FS.xl,
                  color: C.textPrimary,
                  margin: 0,
                  lineHeight: 1.2,
                  textAlign: 'center',
                }}
              >
                {task.bestilt_total != null
                  ? String(Math.max(task.bestilt_total - (task.hentet ?? 0), 0))
                  : String(task.ton)}
              </p>
            </div>
          </div>

          {formandContact && (
            <div
              style={{
                borderTop: `1px solid ${C.border}`,
                padding: '12px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: 0,
              }}
            >
              {/* Række 1 — labels */}
              <div style={{ display: 'flex' }}>
                <span
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: FS.xxs,
                    lineHeight: 1,
                    color: C.textMuted,
                  }}
                >
                  Formand
                </span>
                <span
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: FS.xxs,
                    lineHeight: 1,
                    color: C.textMuted,
                  }}
                >
                  Tlf
                </span>
              </div>
              {/* Række 2 — værdier */}
              <div style={{ display: 'flex', alignItems: 'baseline' }}>
                <span
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    fontFamily: 'Poppins, sans-serif',
                    fontWeight: 600,
                    fontSize: FS.md,
                    lineHeight: 1.1,
                    color: C.textPrimary,
                  }}
                >
                  {formandContact.name}
                </span>
                <a
                  href={`tel:${formandContact.phone.replace(/\s/g, '')}`}
                  aria-label={`Ring til ${formandContact.name}`}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: FS.sm,
                    lineHeight: 1.1,
                    color: C.deepTeal,
                    textDecoration: 'none',
                    padding: '8px 0',
                  }}
                >
                  {formandContact.phone}
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Locations */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {/* Pickup */}
          {pickup && (
            <div
              style={{
                backgroundColor: C.white,
                borderRadius: 12,
                border: `1px solid ${C.border}`,
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Location-række: ikon + tekst + mødetid */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pickup.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    backgroundColor: C.pickupBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    textDecoration: 'none',
                  }}
                >
                  <MapPin size={16} color={C.deepTeal} />
                </a>
                <div style={{ flex: 1 }}>
                  <p
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: FS.xxs,
                      fontWeight: 600,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase' as const,
                      color: C.textMuted,
                      margin: '0 0 2px 0',
                    }}
                  >
                    Afhenting
                  </p>
                  <p
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 600,
                      fontSize: FS.md,
                      color: C.textPrimary,
                      margin: '0 0 2px 0',
                    }}
                  >
                    {pickup.name}
                  </p>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pickup.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: FS.sm,
                      color: C.textMuted,
                      margin: 0,
                      textDecoration: 'none',
                    }}
                  >
                    {pickup.address}
                  </a>
                </div>
                {pickup.meetingTime && (
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p
                      style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: FS.xxs,
                        color: C.textMuted,
                        margin: '0 0 2px 0',
                      }}
                    >
                      Mødetid
                    </p>
                    <p
                      style={{
                        fontFamily: 'Poppins, sans-serif',
                        fontWeight: 600,
                        fontSize: FS.lg,
                        color: C.textPrimary,
                        margin: 0,
                      }}
                    >
                      {pickup.meetingTime}
                    </p>
                  </div>
                )}
              </div>
              {/* Ankomst-knap — fuld boks-bredde, ny række under location-rækken */}
              <button
                onClick={() => onArrivalConfirm?.('fabrik')}
                style={{
                  marginTop: 10,
                  width: '100%',
                  height: 32,
                  minHeight: 36,
                  backgroundColor: 'transparent',
                  border: `1px solid ${C.deepTeal}`,
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontFamily: 'Poppins, sans-serif',
                  fontWeight: 600,
                  fontSize: FS.xs,
                  color: C.deepTeal,
                }}
              >
                Ankommet til fabrik
              </button>
            </div>
          )}

          {/* Transport icon */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                backgroundColor: C.border,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
              }}
            >
              <ArrowUp size={12} color={C.textMuted} />
              <ArrowDown size={12} color={C.textMuted} />
            </div>
          </div>

          {/* Delivery */}
          {delivery && (
            <div
              style={{
                backgroundColor: C.white,
                borderRadius: 12,
                border: `1px solid ${C.border}`,
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Location-række: ikon + tekst */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(delivery.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    backgroundColor: C.deliveryBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    textDecoration: 'none',
                  }}
                >
                  <MapPin size={16} color={C.deliveryIconColor} />
                </a>
                <div style={{ flex: 1 }}>
                  <p
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: FS.xxs,
                      fontWeight: 600,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase' as const,
                      color: C.textMuted,
                      margin: '0 0 2px 0',
                    }}
                  >
                    Udførselssted
                  </p>
                  <p
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 600,
                      fontSize: FS.md,
                      color: C.textPrimary,
                      margin: '0 0 2px 0',
                    }}
                  >
                    {delivery.name}
                  </p>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(delivery.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: FS.sm,
                      color: C.textMuted,
                      margin: 0,
                      textDecoration: 'none',
                    }}
                  >
                    {delivery.address}
                  </a>
                </div>
              </div>
              {/* Ankomst-knap — fuld boks-bredde, ny række under location-rækken */}
              <button
                onClick={() => onArrivalConfirm?.('plads')}
                style={{
                  marginTop: 10,
                  width: '100%',
                  height: 32,
                  minHeight: 36,
                  backgroundColor: 'transparent',
                  border: `1px solid ${C.deepTeal}`,
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontFamily: 'Poppins, sans-serif',
                  fontWeight: 600,
                  fontSize: FS.xs,
                  color: C.deepTeal,
                }}
              >
                Ankommet til plads
              </button>
            </div>
          )}
        </div>

        {/* ─── Boks 1 — Information (stationær, fuld bredde) ──────────────────────
            Viser formandNote (neutral, øverst) + infoAlerts (neutral) + dangerAlerts (rød).
            Skjules hvis hverken formandNote, infoAlerts eller dangerAlerts er til stede. */}
        {hasAlerts && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <p style={sectionLabel}>Information</p>
            <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* formandNote — neutral grå, vises øverst hvis defineret */}
              {task.formandNote && (
                <div>
                  <p
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: FS.sm,
                      color: C.textPrimary,
                      margin: 0,
                      lineHeight: 1.5,
                    }}
                  >
                    {task.formandNote}
                  </p>
                  {(infoAlerts.length > 0 || dangerAlerts.length > 0) && (
                    <div style={{ height: 1, backgroundColor: C.border, marginTop: 10 }} />
                  )}
                </div>
              )}
              {infoAlerts.map((alert, i) => (
                <div key={alert.id}>
                  {i > 0 && (
                    <div style={{ height: 1, backgroundColor: C.border, marginBottom: 10 }} />
                  )}
                  <p
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: FS.sm,
                      color: C.textPrimary,
                      margin: 0,
                      lineHeight: 1.5,
                    }}
                  >
                    {alert.message}
                  </p>
                </div>
              ))}
              {dangerAlerts.length > 0 && infoAlerts.length > 0 && (
                <div style={{ height: 1, backgroundColor: C.border }} />
              )}
              {dangerAlerts.map((alert, i) => (
                <div key={alert.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  {i > 0 && (
                    <div style={{ height: 1, backgroundColor: C.dangerBorder, marginBottom: 10 }} />
                  )}
                  {/* Rød dot som type-indikator for trafikvarsel */}
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      backgroundColor: C.danger,
                      flexShrink: 0,
                      marginTop: 5,
                    }}
                  />
                  <p
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: FS.sm,
                      color: C.danger,
                      margin: 0,
                      lineHeight: 1.5,
                      flex: 1,
                    }}
                  >
                    {alert.message}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Formand-boks fjernet — kontaktinfo nu i metrics-cardet ovenfor */}
      </div>

      {/* ─── Fixed action-bar — skjules ved completed state ─────────────────────
          Altid synlig over BottomTabBar (58px) uanset scroll-position og task-state.
          position: absolute er relativ til root-div (position: absolute, inset: 0). */}
      {taskState !== 'completed' && (
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 58,
          backgroundColor: C.white,
          borderTop: `1px solid ${C.border}`,
          paddingTop: 8,
          paddingBottom: 8,
          paddingLeft: 20,
          paddingRight: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {taskState === 'idle' && (
          <button
            onClick={() => {
              if (otherActiveTask) setAlreadyActiveOpen(true)
              else setStartConfirmOpen(true)
            }}
            style={{
              height: 52,
              backgroundColor: C.green,
              color: C.white,
              borderRadius: 12,
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'Poppins, sans-serif',
              fontWeight: 600,
              fontSize: FS.md,
            }}
          >
            Start opgave
          </button>
        )}
        {taskState === 'active' && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setPauseConfirmOpen(true)}
              style={{
                flex: 1,
                height: 52,
                backgroundColor: C.border,
                color: C.textPrimary,
                borderRadius: 12,
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 600,
                fontSize: FS.md,
              }}
            >
              Hviletid
            </button>
            <button
              onClick={() => setCompleteConfirmOpen(true)}
              style={{
                flex: 1,
                height: 52,
                backgroundColor: C.yellow,
                color: C.deepTeal,
                borderRadius: 12,
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 600,
                fontSize: FS.md,
              }}
            >
              Afslut opgave
            </button>
          </div>
        )}
        {taskState === 'paused' && (
          <button
            onClick={onStart}
            style={{
              height: 52,
              backgroundColor: C.yellow,
              color: C.deepTeal,
              borderRadius: 12,
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'Poppins, sans-serif',
              fontWeight: 600,
              fontSize: FS.md,
            }}
          >
            Genoptag opgave
          </button>
        )}
      </div>
      )}

      {/* Pause-bekræftelses-modal — unified pattern fra TimeRegistrationScreen linje 682-752 */}
      {pauseConfirmOpen && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 24px',
          }}
          onClick={() => setPauseConfirmOpen(false)}
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
            onClick={(e) => e.stopPropagation()}
          >
            <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: FS.md, color: C.deepTeal, textAlign: 'center' }}>
              Start hviletid?
            </span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: FS.sm, color: C.textMuted, textAlign: 'center' }}>
              Bekræft at du tager hviletid. Tryk Genoptag når du er klar til at fortsætte.
            </span>
            <div style={{ display: 'flex', gap: 10, marginTop: 4, width: '100%' }}>
              <button
                onClick={() => setPauseConfirmOpen(false)}
                style={{
                  flex: 1,
                  height: 44,
                  border: `1px solid ${C.deepTeal}`,
                  borderRadius: 50,
                  background: 'transparent',
                  cursor: 'pointer',
                  fontFamily: 'Poppins, sans-serif',
                  fontWeight: 600,
                  fontSize: FS.sm,
                  color: C.deepTeal,
                }}
              >
                Annuller
              </button>
              <button
                onClick={() => { onPause(); setPauseConfirmOpen(false) }}
                style={{
                  flex: 1,
                  height: 44,
                  backgroundColor: C.green,
                  border: 'none',
                  borderRadius: 50,
                  cursor: 'pointer',
                  fontFamily: 'Poppins, sans-serif',
                  fontWeight: 600,
                  fontSize: FS.sm,
                  color: C.white,
                }}
              >
                Hviletid
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Afslut-bekræftelses-modal — spejlet fra pause-modal-mønster */}
      {completeConfirmOpen && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 24px',
          }}
          onClick={() => setCompleteConfirmOpen(false)}
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
            onClick={(e) => e.stopPropagation()}
          >
            <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: FS.md, color: C.deepTeal, textAlign: 'center' }}>
              Afslut opgave?
            </span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: FS.sm, color: C.textMuted, textAlign: 'center' }}>
              Er du sikker på du vil afslutte opgaven?
            </span>
            <div style={{ display: 'flex', gap: 10, marginTop: 4, width: '100%' }}>
              <button
                onClick={() => setCompleteConfirmOpen(false)}
                style={{
                  flex: 1,
                  height: 44,
                  border: `1px solid ${C.deepTeal}`,
                  borderRadius: 50,
                  background: 'transparent',
                  cursor: 'pointer',
                  fontFamily: 'Poppins, sans-serif',
                  fontWeight: 600,
                  fontSize: FS.sm,
                  color: C.deepTeal,
                }}
              >
                Annuller
              </button>
              <button
                onClick={() => { onComplete(); setCompleteConfirmOpen(false) }}
                style={{
                  flex: 1,
                  height: 44,
                  backgroundColor: C.green,
                  border: 'none',
                  borderRadius: 50,
                  cursor: 'pointer',
                  fontFamily: 'Poppins, sans-serif',
                  fontWeight: 600,
                  fontSize: FS.sm,
                  color: C.white,
                }}
              >
                Afslut opgave
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Start-bekræftelses-modal — spejlet fra pause-modal-mønster */}
      {startConfirmOpen && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 24px',
          }}
          onClick={() => setStartConfirmOpen(false)}
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
            onClick={(e) => e.stopPropagation()}
          >
            <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: FS.md, color: C.deepTeal, textAlign: 'center' }}>
              Start opgaven?
            </span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: FS.sm, color: C.textMuted, textAlign: 'center' }}>
              Når du starter, begynder vi at logge tid og GPS for denne opgave.
            </span>
            <div style={{ display: 'flex', gap: 10, marginTop: 4, width: '100%' }}>
              <button
                onClick={() => setStartConfirmOpen(false)}
                style={{
                  flex: 1,
                  height: 44,
                  border: `1px solid ${C.deepTeal}`,
                  borderRadius: 50,
                  background: 'transparent',
                  cursor: 'pointer',
                  fontFamily: 'Poppins, sans-serif',
                  fontWeight: 600,
                  fontSize: FS.sm,
                  color: C.deepTeal,
                }}
              >
                Annuller
              </button>
              <button
                onClick={() => { onStart(); setStartConfirmOpen(false) }}
                style={{
                  flex: 1,
                  height: 44,
                  backgroundColor: C.green,
                  border: 'none',
                  borderRadius: 50,
                  cursor: 'pointer',
                  fontFamily: 'Poppins, sans-serif',
                  fontWeight: 600,
                  fontSize: FS.sm,
                  color: C.white,
                }}
              >
                Start opgave
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Already-active-modal — single-task-constraint */}
      {alreadyActiveOpen && otherActiveTask && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 24px',
          }}
          onClick={() => setAlreadyActiveOpen(false)}
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
            onClick={(e) => e.stopPropagation()}
          >
            <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: FS.md, color: C.deepTeal, textAlign: 'center' }}>
              Du har allerede en aktiv opgave
            </span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: FS.sm, color: C.textMuted, textAlign: 'center' }}>
              Du arbejder på opgave {otherActiveTask.orderNumber} · {otherActiveTask.produkt}. Afslut den først før du starter en ny.
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4, width: '100%' }}>
              <button
                onClick={() => { if (onGoToOtherTask) onGoToOtherTask(otherActiveTask.id); setAlreadyActiveOpen(false) }}
                style={{
                  width: '100%',
                  height: 44,
                  backgroundColor: C.green,
                  border: 'none',
                  borderRadius: 50,
                  cursor: 'pointer',
                  fontFamily: 'Poppins, sans-serif',
                  fontWeight: 600,
                  fontSize: FS.sm,
                  color: C.white,
                }}
              >
                Gå til aktiv opgave
              </button>
              <button
                onClick={() => setAlreadyActiveOpen(false)}
                style={{
                  width: '100%',
                  height: 44,
                  border: `1px solid ${C.deepTeal}`,
                  borderRadius: 50,
                  background: 'transparent',
                  cursor: 'pointer',
                  fontFamily: 'Poppins, sans-serif',
                  fontWeight: 600,
                  fontSize: FS.sm,
                  color: C.deepTeal,
                }}
              >
                Bliv her
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
