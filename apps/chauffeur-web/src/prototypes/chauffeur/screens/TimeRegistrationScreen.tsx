/**
 * PROTOTYPE — Timeregistrering (web-port af Expo-version)
 * Må ikke importeres i produktionskode.
 */
import { useState, useRef } from 'react'
import { X, Pencil, Mic, ChevronDown, ChevronUp, Check } from 'lucide-react'
import { BottomTabBar } from '../components/BottomTabBar'
import type { TabName } from '../components/BottomTabBar'

// ─── Mock data ────────────────────────────────────────────────────────────────
const MOCK = {
  date: '12. Februar 2026',
  projectName: 'Uddannelsescenter Syd, Lolland',
  address: 'Rødby Landevej 12, 4900 Nakskov',
  orderNumber: '1212343',
  tons: 73,
  formand: { name: 'Lars Hansen', phone: '+45 22 33 44 55' },
}

const INITIAL_ENTRIES = [
  { id: '1', category: 'Kørsel',   minutes: 180 },
  { id: '2', category: 'Ventetid', minutes: 120 },
  { id: '3', category: 'Pause',    minutes: 60 },
]

const REASONS = ['GPS-fejl', 'Ventetid fejlregistreret', 'Glemt pause', 'Teknisk fejl', 'Andet']

// ─── Types ────────────────────────────────────────────────────────────────────
type Entry = { id: string; category: string; minutes: number; modified?: boolean }
type EditState = { entry: Entry; hours: string; minutes: string; reason: string; freeText: string }
// ConfirmType reduceret — kun én sti (opgave)

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `${h}t` : `${h}t ${m}m`
}

// ─── Farver (Colas tokens) ────────────────────────────────────────────────────
const C = {
  deepTeal: '#0E4764',
  softAqua: '#E8F4F8',
  yellow: '#FEEE32',
  green: '#2E9E65',
  white: '#FFFFFF',
  bg: '#F8F8F8',
  border: '#EDEDED',
  textPrimary: '#1D1D1D',
  textMuted: '#717182',
  error: '#B42828',
  boxOutline: '#D9E8EE',
}

// ─── Props ────────────────────────────────────────────────────────────────────
export interface TimeRegistrationScreenProps {
  onClose: () => void
  messageCount?: number
}

export function TimeRegistrationScreen({ onClose, messageCount = 0 }: TimeRegistrationScreenProps) {
  const commentRef = useRef<HTMLTextAreaElement>(null)
  const [activeTab] = useState<TabName>('prototyper')
  const [entries, setEntries] = useState<Entry[]>(INITIAL_ENTRIES)
  const [comment, setComment] = useState('')
  const [editing, setEditing] = useState<EditState | null>(null)
  const [showReasonList, setShowReasonList] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [completed, setCompleted] = useState(false)

  const handleEdit = (entry: Entry) => {
    setEditing({
      entry,
      hours: String(Math.floor(entry.minutes / 60)),
      minutes: String(entry.minutes % 60),
      reason: '',
      freeText: '',
    })
    setShowReasonList(false)
  }

  const handleSave = () => {
    if (!editing) return
    const total = (parseInt(editing.hours) || 0) * 60 + (parseInt(editing.minutes) || 0)
    setEntries(prev => prev.map(e => e.id === editing.entry.id ? { ...e, minutes: total, modified: true } : e))
    setEditing(null)
  }

  const handleConfirm = () => {
    setConfirmOpen(false)
    setCompleted(true)
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
      {/* Handle bar — 59px Dynamic Island safe area */}
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <p
            style={{
              fontFamily: 'Poppins, sans-serif',
              fontWeight: 600,
              fontSize: 18,
              color: C.deepTeal,
              margin: 0,
            }}
          >
            Tidsregistrering
          </p>
          <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: 12, color: C.textMuted }}>
            {MOCK.date}
          </span>
        </div>
        {/* X-knap skjules i completed-state */}
        {!completed && (
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
        )}
      </div>

      {/* Scrollable body */}
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
          gap: 12,
          position: 'relative',
        }}
      >
        {/* Bekræftelses-VIEW — vises efter modal-bekræft */}
        {completed && (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              paddingTop: 60,
              paddingBottom: 40,
            }}
          >
            <p
              style={{
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 600,
                fontSize: 24,
                color: C.deepTeal,
                textAlign: 'center',
                margin: 0,
              }}
            >
              Opgaven er afsluttet
            </p>
            <p
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 400,
                fontSize: 14,
                color: C.textMuted,
                textAlign: 'center',
                margin: 0,
              }}
            >
              Timerne er sendt til formanden
            </p>
            <button
              onClick={onClose}
              style={{
                marginTop: 24,
                backgroundColor: C.yellow,
                border: 'none',
                borderRadius: 50,
                height: 52,
                width: '100%',
                maxWidth: 280,
                alignSelf: 'center',
                cursor: 'pointer',
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 600,
                fontSize: 15,
                color: C.deepTeal,
              }}
            >
              Til forsiden
            </button>
          </div>
        )}

        {/* Udførselssted — projektnavn + adresse */}
        {!completed && (
        <>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 600,
              fontSize: 11,
              color: C.textMuted,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            Udførselssted
          </span>
          <span
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 500,
              fontSize: 14,
              color: C.textPrimary,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {MOCK.projectName}
          </span>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: C.textMuted }}>
            {MOCK.address}
          </span>
        </div>

        {/* Summary card — 2 kolonner: Formand + Tons */}
        <div
          style={{
            backgroundColor: C.white,
            borderRadius: 12,
            border: `1px solid ${C.border}`,
            display: 'flex',
            flexDirection: 'row',
            overflow: 'hidden',
          }}
        >
          {/* Kolonne 1: Formand */}
          <div
            style={{
              flex: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              padding: '14px 12px',
            }}
          >
            <span
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: 11,
                color: C.textMuted,
              }}
            >
              Formand
            </span>
            <span
              style={{
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 600,
                fontSize: 16,
                color: C.textPrimary,
              }}
            >
              {MOCK.formand.name}
            </span>
            <span
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: 13,
                color: C.deepTeal,
              }}
            >
              {MOCK.formand.phone}
            </span>
          </div>
          {/* Kolonne 2: Tons */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              padding: '14px 0',
              borderLeft: `1px solid ${C.border}`,
            }}
          >
            <span
              style={{
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 600,
                fontSize: 18,
                color: C.textPrimary,
              }}
            >
              {MOCK.tons}
            </span>
            <span
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: 11,
                color: C.textMuted,
              }}
            >
              Tons
            </span>
          </div>
        </div>

        {/* Sektion-label */}
        <span
          style={{
            fontFamily: 'Inter, sans-serif',
            fontWeight: 600,
            fontSize: 11,
            color: C.textMuted,
            textTransform: 'uppercase' as const,
            letterSpacing: '0.06em',
            marginTop: 4,
          }}
        >
          Timeforbrug
        </span>

        {/* Timeforbrug-liste */}
        <div
          style={{
            backgroundColor: C.white,
            borderRadius: 12,
            border: `1px solid ${C.border}`,
            overflow: 'hidden',
          }}
        >
          {entries.map((entry, index) => (
            <div key={entry.id}>
              {index > 0 && (
                <div style={{ height: 1, backgroundColor: C.border, marginLeft: 16 }} />
              )}
              <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px' }}>
                <span
                  style={{
                    flex: 1,
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 500,
                    fontSize: 14,
                    color: C.textPrimary,
                  }}
                >
                  {entry.category}{entry.modified ? ' *' : ''}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 500,
                      fontSize: 14,
                      color: C.deepTeal,
                    }}
                  >
                    {formatTime(entry.minutes)}
                  </span>
                  <button
                    onClick={() => handleEdit(entry)}
                    aria-label={`Rediger ${entry.category}`}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 8,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <Pencil size={15} color={C.deepTeal} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Kommentar-felt */}
        <div
          style={{
            backgroundColor: C.white,
            borderRadius: 12,
            border: `1px solid ${C.border}`,
            display: 'flex',
            flexDirection: 'column',
            minHeight: 100,
          }}
        >
          <textarea
            ref={commentRef}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Kommentar..."
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              resize: 'none',
              padding: '12px 16px 8px',
              fontFamily: 'Inter, sans-serif',
              fontSize: 14,
              color: C.textPrimary,
              backgroundColor: 'transparent',
              minHeight: 70,
              borderRadius: 12,
            }}
          />
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 16px 10px',
            }}
          >
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: C.textMuted }}>
              {comment.length > 0 ? `${comment.length} tegn` : ''}
            </span>
            <button
              onClick={() => commentRef.current?.focus()}
              aria-label="Dikter kommentar"
              style={{
                width: 32,
                height: 32,
                backgroundColor: C.border,
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Mic size={18} color={C.deepTeal} />
            </button>
          </div>
        </div>

        {/* Knapper */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
          <button
            onClick={() => setConfirmOpen(true)}
            style={{
              backgroundColor: C.green,
              border: 'none',
              borderRadius: 50,
              height: 52,
              cursor: 'pointer',
              fontFamily: 'Poppins, sans-serif',
              fontWeight: 600,
              fontSize: 15,
              color: C.white,
            }}
          >
            Afslut opgave og send timer
          </button>
        </div>
        </>
        )}
      </div>

      {/* Bottom tab bar */}
      <BottomTabBar
        activeTab={activeTab}
        onTabPress={(tab) => { if (tab !== 'prototyper') onClose() }}
        messageCount={messageCount}
      />

      {/* Redigerings-overlay */}
      {editing && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.4)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
          }}
          onClick={() => setEditing(null)}
        >
          {/*
            Sheet er opdelt i tre niveauer:
            1. Header (titel) — fast
            2. Scrollbart indhold — vokser med Årsag-liste + fritekst
            3. Footer (Annuller/Gem) — sticky i bunden af sheeten
            maxHeight: 85vh sikrer at footer ALDRIG skubbes under viewport
          */}
          <div
            style={{
              backgroundColor: C.white,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header — fast */}
            <div style={{ padding: '20px 16px 0' }}>
              {/* fontSize 18 matcher bekræftelses-modalen (Poppins 600 18) */}
              <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: 18, color: C.deepTeal }}>
                Rediger {editing.entry.category.toLowerCase()}
              </span>
            </div>

            {/* Scrollbart indhold */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '12px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              {/* Time inputs */}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: C.textMuted }}>Timer</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={editing.hours}
                    onChange={(e) => setEditing(prev => prev ? { ...prev, hours: e.target.value } : null)}
                    maxLength={2}
                    style={{
                      width: 80,
                      backgroundColor: C.softAqua,
                      border: 'none',
                      borderRadius: 8,
                      padding: '10px 0',
                      textAlign: 'center',
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 500,
                      fontSize: 18,
                      color: C.deepTeal,
                      outline: 'none',
                    }}
                  />
                </div>
                <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: 18, color: C.deepTeal, paddingBottom: 8 }}>:</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: C.textMuted }}>Minutter</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={editing.minutes}
                    onChange={(e) => setEditing(prev => prev ? { ...prev, minutes: e.target.value } : null)}
                    maxLength={2}
                    style={{
                      width: 80,
                      backgroundColor: C.softAqua,
                      border: 'none',
                      borderRadius: 8,
                      padding: '10px 0',
                      textAlign: 'center',
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 500,
                      fontSize: 18,
                      color: C.deepTeal,
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              {/* Årsag */}
              <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 12, color: C.textMuted }}>Årsag</span>
              <button
                onClick={() => setShowReasonList(v => !v)}
                style={{
                  backgroundColor: C.softAqua,
                  border: 'none',
                  borderRadius: 8,
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                }}
              >
                <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: 14, color: editing.reason ? C.deepTeal : C.textMuted }}>
                  {editing.reason || 'Vælg årsag...'}
                </span>
                {showReasonList ? <ChevronUp size={16} color={C.deepTeal} /> : <ChevronDown size={16} color={C.deepTeal} />}
              </button>

              {showReasonList && (
                <div style={{ backgroundColor: C.softAqua, borderRadius: 8, overflow: 'hidden', border: `1px solid ${C.boxOutline}` }}>
                  {REASONS.map(r => (
                    <button
                      key={r}
                      onClick={() => {
                        setEditing(prev => prev ? { ...prev, reason: r, freeText: r !== 'Andet' ? '' : prev.freeText } : null)
                        setShowReasonList(false)
                      }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        border: 'none',
                        borderBottom: `1px solid ${C.boxOutline}`,
                        background: 'transparent',
                        cursor: 'pointer',
                      }}
                    >
                      <span
                        style={{
                          fontFamily: 'Inter, sans-serif',
                          fontSize: 14,
                          color: editing.reason === r ? C.deepTeal : C.textPrimary,
                          fontWeight: editing.reason === r ? 500 : 400,
                        }}
                      >
                        {r}
                      </span>
                      {editing.reason === r && <Check size={14} color={C.deepTeal} />}
                    </button>
                  ))}
                </div>
              )}

              {editing.reason === 'Andet' && (
                <textarea
                  placeholder="Beskriv årsag..."
                  value={editing.freeText}
                  onChange={(e) => setEditing(prev => prev ? { ...prev, freeText: e.target.value } : null)}
                  style={{
                    backgroundColor: C.softAqua,
                    border: 'none',
                    borderRadius: 8,
                    padding: '12px 16px',
                    minHeight: 60,
                    fontFamily: 'Inter, sans-serif',
                    fontSize: 14,
                    color: C.textPrimary,
                    outline: 'none',
                    resize: 'none',
                  }}
                />
              )}
            </div>

            {/* Footer — sticky i bunden af sheeten, altid synlig */}
            <div
              style={{
                padding: '8px 16px 24px',
                borderTop: `1px solid ${C.border}`,
                display: 'flex',
                gap: 10,
                backgroundColor: C.white,
              }}
            >
              <button
                onClick={() => setEditing(null)}
                style={{
                  flex: 1,
                  height: 48,
                  border: `1px solid ${C.deepTeal}`,
                  borderRadius: 50,
                  background: 'transparent',
                  cursor: 'pointer',
                  fontFamily: 'Poppins, sans-serif',
                  fontWeight: 600,
                  fontSize: 15,
                  color: C.deepTeal,
                }}
              >
                Annuller
              </button>
              <button
                onClick={handleSave}
                style={{
                  flex: 1,
                  height: 48,
                  backgroundColor: C.yellow,
                  border: 'none',
                  borderRadius: 50,
                  cursor: 'pointer',
                  fontFamily: 'Poppins, sans-serif',
                  fontWeight: 600,
                  fontSize: 15,
                  color: C.deepTeal,
                }}
              >
                Gem
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bekræftelses-dialog */}
      {confirmOpen && (
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
          onClick={() => setConfirmOpen(false)}
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
            <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: 18, color: C.deepTeal, textAlign: 'center' }}>
              Afslut opgave?
            </span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: C.textMuted, textAlign: 'center' }}>
              Er du sikker på du vil afslutte og sende data til formanden?
            </span>
            <div style={{ display: 'flex', gap: 10, marginTop: 4, width: '100%' }}>
              <button
                onClick={() => setConfirmOpen(false)}
                style={{
                  flex: 1,
                  height: 44,
                  border: `1px solid ${C.deepTeal}`,
                  borderRadius: 50,
                  background: 'transparent',
                  cursor: 'pointer',
                  fontFamily: 'Poppins, sans-serif',
                  fontWeight: 600,
                  fontSize: 14,
                  color: C.deepTeal,
                }}
              >
                Annuller
              </button>
              <button
                onClick={handleConfirm}
                style={{
                  flex: 1,
                  height: 44,
                  backgroundColor: C.green,
                  border: 'none',
                  borderRadius: 50,
                  cursor: 'pointer',
                  fontFamily: 'Poppins, sans-serif',
                  fontWeight: 600,
                  fontSize: 14,
                  color: C.white,
                }}
              >
                Afslut opgave
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
