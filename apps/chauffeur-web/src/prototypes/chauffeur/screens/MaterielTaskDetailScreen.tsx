/**
 * PROTOTYPE — Materiel-opgave-detaljeskærm (fuld-skærms-layout)
 * Viser materiel-enheder, afhentninger (sorteret efter tid), aflæsningssteder
 * med leveringsknapper/-pile, formand-note og formand-kontakt.
 *
 * Overlay-arkitektur: position:absolute inset:0 — matcher TaskDetailScreen.tsx 1:1.
 */
import { useState } from 'react'
import { X, MapPin, ArrowDown, ArrowUp } from 'lucide-react'
import type { MaterielTask, MaterielTaskState } from '@/types/materielTask'
import { SAFE_AREA, FS } from '@/styles/spacing'

// ─── Farver (Colas tokens — kopieret fra TaskDetailScreen.tsx) ───────────────
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
} as const

export interface MaterielTaskDetailScreenProps {
  task: MaterielTask
  taskState: MaterielTaskState
  onClose: () => void
  onStart: () => void
  /** Kalder parent med id på det dropoff der skal markeres leveret */
  onDeliver: (dropoffId: string) => void
  /** Kalder parent når chauffør trykker "Afslut opgave" og bekræfter */
  onComplete: () => void
}

export function MaterielTaskDetailScreen({
  task,
  taskState,
  onClose,
  onStart,
  onDeliver,
  onComplete,
}: MaterielTaskDetailScreenProps) {
  const [startConfirmOpen, setStartConfirmOpen] = useState(false)
  const [completeConfirmOpen, setCompleteConfirmOpen] = useState(false)
  const [deliverConfirmId, setDeliverConfirmId] = useState<string | null>(null)

  // Sortér pickups defensivt efter tid (HH.MM → numerisk sammenligning er safe)
  const sortedPickups = [...task.pickups].sort((a, b) => a.tid.localeCompare(b.tid))

  // ─── Delte stil-konstanter (spejlet fra TaskDetailScreen.tsx) ────────────
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

  // Pending levering til bekræftelses-modal
  const pendingDropoff = deliverConfirmId
    ? task.dropoffs.find((d) => d.id === deliverConfirmId)
    : null

  return (
    // ─── Root — fuld skærm (matcher TaskDetailScreen.tsx:89-98) ─────────────
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: C.bg,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Handle bar — Dynamic Island safe area (TaskDetailScreen.tsx:100-103) */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          paddingTop: SAFE_AREA.top,
          paddingBottom: 4,
        }}
      >
        <div
          style={{ width: 36, height: 4, backgroundColor: C.handleBar, borderRadius: 2 }}
        />
      </div>

      {/* Header (TaskDetailScreen.tsx:105-144) */}
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

      {/* Scrollable body — paddingBottom = action-bar (69px) + 16px luft = 85px.
          Ved afsluttet: 16px (ingen action-bar). */}
      <div
        className="scrollbar-hide"
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          paddingLeft: 20,
          paddingRight: 20,
          paddingTop: 8,
          paddingBottom: taskState === 'afsluttet' ? 16 : 88,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {/* ─── Materiel-liste-kort ─────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <p style={sectionLabel}>Materiel</p>
          <div
            style={{
              backgroundColor: C.white,
              borderRadius: 12,
              border: `1px solid ${C.border}`,
              overflow: 'hidden',
            }}
          >
            {task.units.map((unit, i) => (
              <div
                key={`${unit.anlaegsnr}-${i}`}
                style={{
                  padding: '12px 16px',
                  borderTop: i > 0 ? `1px solid ${C.border}` : undefined,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <p
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 600,
                    fontSize: FS.md,
                    color: C.textPrimary,
                    margin: 0,
                    flex: 1,
                  }}
                >
                  {unit.beskrivelse}
                </p>
                <p
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: FS.sm,
                    color: C.textMuted,
                    margin: 0,
                    flexShrink: 0,
                  }}
                >
                  {unit.anlaegsnr}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Formand-boks — umiddelbart under materiel-liste (TaskDetailScreen.tsx:262-333) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <p style={sectionLabel}>Formand</p>
          <div
            style={{
              backgroundColor: C.white,
              borderRadius: 12,
              border: `1px solid ${C.border}`,
              overflow: 'hidden',
            }}
          >
            {/* Række 1 — labels */}
            <div style={{ display: 'flex', padding: '10px 16px 0 16px' }}>
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
            <div style={{ display: 'flex', alignItems: 'baseline', padding: '4px 16px 12px 16px' }}>
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
                {task.formand.name}
              </span>
              <a
                href={`tel:${task.formand.phone.replace(/\s/g, '')}`}
                aria-label={`Ring til ${task.formand.name}`}
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
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: 44,
                }}
              >
                {task.formand.phone}
              </a>
            </div>
          </div>
        </div>

        {/* ─── Afhentning(er) ──────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <p style={sectionLabel}>
            {sortedPickups.length > 1 ? 'Afhentninger' : 'Afhentning'}
          </p>
          {sortedPickups.map((pickup, i) => (
            <div
              key={`pickup-${i}`}
              style={{
                backgroundColor: C.white,
                borderRadius: 12,
                border: `1px solid ${C.border}`,
                padding: '12px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
              }}
            >
              {/* MapPin-ikon — altid vist */}
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  backgroundColor: C.pickupBg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <MapPin size={18} color={C.deepTeal} />
              </div>

              {/* Tekst + labeled maps-link */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 600,
                    fontSize: FS.md,
                    color: C.textPrimary,
                    margin: '0 0 2px 0',
                  }}
                >
                  {pickup.sted}
                </p>
                <p
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: FS.sm,
                    color: C.textMuted,
                    margin: 0,
                  }}
                >
                  {pickup.adresse}
                </p>
                {/* Labeled maps-link — KUN hvis mapsQuery er sat */}
                {pickup.mapsQuery && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pickup.mapsQuery)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      marginTop: 6,
                      minHeight: 44,
                      fontFamily: 'Inter, sans-serif',
                      fontSize: FS.sm,
                      color: C.deepTeal,
                      textDecoration: 'underline',
                      textUnderlineOffset: 2,
                    }}
                  >
                    <MapPin size={14} color={C.deepTeal} />
                    Se afhentningslokation
                  </a>
                )}
              </div>

              {/* Tidspunkt — fremhævet (TaskDetailScreen.tsx:411-434 meetingTime-mønster) */}
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <p
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: FS.xxs,
                    color: C.textMuted,
                    margin: '0 0 2px 0',
                  }}
                >
                  Tid
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
                  {pickup.tid}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* ─── Transport-ikon (TaskDetailScreen.tsx:459-477) ──────────────── */}
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

        {/* ─── Aflæsningssted(er) ──────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <p style={sectionLabel}>
            {task.dropoffs.length > 1 ? 'Aflæsningssteder' : 'Aflæsningssted'}
          </p>
          {task.dropoffs.map((dropoff) => (
            <div
              key={dropoff.id}
              style={{
                backgroundColor: C.white,
                borderRadius: 12,
                border: `1px solid ${C.border}`,
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              {/* Location-række */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                {/* MapPin-ikon — altid vist */}
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    backgroundColor: C.deliveryBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <MapPin size={18} color={C.deliveryIconColor} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 600,
                      fontSize: FS.md,
                      color: C.textPrimary,
                      margin: '0 0 2px 0',
                    }}
                  >
                    {dropoff.sted}
                  </p>
                  <p
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: FS.sm,
                      color: C.textMuted,
                      margin: 0,
                    }}
                  >
                    {dropoff.adresse}
                  </p>
                  {/* Labeled maps-link — KUN hvis mapsQuery er sat */}
                  {dropoff.mapsQuery && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(dropoff.mapsQuery)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        marginTop: 6,
                        minHeight: 44,
                        fontFamily: 'Inter, sans-serif',
                        fontSize: FS.sm,
                        color: C.deliveryIconColor,
                        textDecoration: 'underline',
                        textUnderlineOffset: 2,
                      }}
                    >
                      <MapPin size={14} color={C.deliveryIconColor} />
                      Se aflæsningslokation
                    </a>
                  )}
                </div>
              </div>

              {/* Leveringsknap / afleveret-pille */}
              {taskState === 'i-gang' && !dropoff.leveret && (
                <button
                  onClick={() => setDeliverConfirmId(dropoff.id)}
                  style={{
                    width: '100%',
                    height: 44,
                    minHeight: 44,
                    backgroundColor: C.green,
                    color: C.white,
                    borderRadius: 10,
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'Poppins, sans-serif',
                    fontWeight: 600,
                    fontSize: FS.md,
                  }}
                >
                  Materiel leveret
                </button>
              )}
              {/* Afleveret-pille: centreret, ingen flueben */}
              {dropoff.leveret && (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                  }}
                >
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: C.deliveryBg,
                      color: C.deliveryIconColor,
                      borderRadius: 50,
                      paddingTop: 6,
                      paddingBottom: 6,
                      paddingLeft: 16,
                      paddingRight: 16,
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 600,
                      fontSize: FS.sm,
                    }}
                  >
                    Afleveret
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ─── Kommentar til chauffør (TaskDetailScreen.tsx:576-655 information-mønster) */}
        {task.formandNote && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <p style={sectionLabel}>Information</p>
            <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: 10 }}>
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
            </div>
          </div>
        )}
      </div>

      {/* ─── Fixed action-bar (TaskDetailScreen.tsx:660-759) ────────────────
          idle   → "Start opgave" (grøn, h:52).
          i-gang → "Afslut opgave" (gul, h:52) — afslutning KUN via denne knap.
          afsluttet → action-bar skjult. */}
      {taskState !== 'afsluttet' && (
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
          }}
        >
          {taskState === 'idle' && (
            <button
              onClick={() => setStartConfirmOpen(true)}
              style={{
                width: '100%',
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
          {taskState === 'i-gang' && (
            <button
              onClick={() => setCompleteConfirmOpen(true)}
              style={{
                width: '100%',
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
          )}
        </div>
      )}

      {/* ─── Afslut-bekræftelses-modal (spejlet fra TaskDetailScreen.tsx:834-905) */}
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
            <span
              style={{
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 600,
                fontSize: FS.md,
                color: C.deepTeal,
                textAlign: 'center',
              }}
            >
              Afslut opgaven?
            </span>
            <span
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: FS.sm,
                color: C.textMuted,
                textAlign: 'center',
              }}
            >
              Er du sikker på du vil afslutte materielopgaven?
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
                onClick={() => {
                  onComplete()
                  setCompleteConfirmOpen(false)
                }}
                style={{
                  flex: 1,
                  height: 44,
                  backgroundColor: C.yellow,
                  border: 'none',
                  borderRadius: 50,
                  cursor: 'pointer',
                  fontFamily: 'Poppins, sans-serif',
                  fontWeight: 600,
                  fontSize: FS.sm,
                  color: C.deepTeal,
                }}
              >
                Afslut opgave
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Start-bekræftelses-modal (TaskDetailScreen.tsx:908-978) ─────── */}
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
            <span
              style={{
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 600,
                fontSize: FS.md,
                color: C.deepTeal,
                textAlign: 'center',
              }}
            >
              Start opgaven?
            </span>
            <span
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: FS.sm,
                color: C.textMuted,
                textAlign: 'center',
              }}
            >
              Bekræft at du er klar til at starte materielkørslen.
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
                onClick={() => {
                  onStart()
                  setStartConfirmOpen(false)
                }}
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

      {/* ─── Leverings-bekræftelses-modal ───────────────────────────────────
          Genbrug af pause-modal-mønster (TaskDetailScreen.tsx:762-832). */}
      {deliverConfirmId && pendingDropoff && (
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
          onClick={() => setDeliverConfirmId(null)}
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
            <span
              style={{
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 600,
                fontSize: FS.md,
                color: C.deepTeal,
                textAlign: 'center',
              }}
            >
              Bekræft levering på {pendingDropoff.sted}?
            </span>
            <span
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: FS.sm,
                color: C.textMuted,
                textAlign: 'center',
              }}
            >
              Bekræft at materiellet er afleveret på {pendingDropoff.sted}.
            </span>
            <div style={{ display: 'flex', gap: 10, marginTop: 4, width: '100%' }}>
              <button
                onClick={() => setDeliverConfirmId(null)}
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
                onClick={() => {
                  onDeliver(deliverConfirmId)
                  setDeliverConfirmId(null)
                }}
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
                Bekræft levering
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
