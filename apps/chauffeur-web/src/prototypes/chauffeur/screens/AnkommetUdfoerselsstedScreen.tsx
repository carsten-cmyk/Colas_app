/**
 * PROTOTYPE — Ankomst til udførselssted skærm
 * Simulerer geofencing-ankomst + aflæsning ved udlægger.
 * Spejler AnkommetFabrikScreen-strukturen. Må ikke importeres i produktionskode.
 */
import { useState } from 'react'
import { Check, X } from 'lucide-react'
import { SAFE_AREA, FS } from '@/styles/spacing'
import { BottomTabBar } from '../components/BottomTabBar'
import type { TabName } from '../components/BottomTabBar'

// ─── Mock data ────────────────────────────────────────────────────────────────
const MOCK = {
  orderNumber: '1212343',
  driverName: 'Jens',
  adresse: 'Søndre Boulevard 44, 4900 Nakskov',
  udlaegger: 'VÖGELE 1900-3I',
  // TODO: Erstat med Google Distance Matrix + 10% lastbil-buffer (se FUNCTIONAL_FLOWS Flow 3 Trin 6)
  etaTilFabrik: 32, // minutter
  // TODO: Erstat med Supabase når klar
  udfoerselsstedAdresse: 'Søndre Boulevard 44, 4900 Nakskov',
} as const

// ─── Props ────────────────────────────────────────────────────────────────────
export interface AnkommetUdfoerselsstedScreenProps {
  onClose: () => void
  messageCount?: number
  /** Callback når chauffør bekræfter "Opret returlæs" i modalen */
  onOpretReturlaes?: () => void
}

type SubScreen = 'udlaegger' | 'bekraeft'

// ─── Farver (Colas tokens) ────────────────────────────────────────────────────
const C = {
  deepTeal: '#0E4764',
  yellow: '#FEEE32',
  green: '#2E9E65',
  good: '#1F8A5B',
  goodBg: '#E7F4EE',
  white: '#FFFFFF',
  bg: '#F8F8F8',
  border: '#EDEDED',
  textPrimary: '#1D1D1D',
  textMuted: '#717182',
}

export function AnkommetUdfoerselsstedScreen({ onClose, messageCount = 0, onOpretReturlaes }: AnkommetUdfoerselsstedScreenProps) {
  const [subScreen, setSubScreen] = useState<SubScreen>('udlaegger')
  const [activeTab] = useState<TabName>('prototyper')
  const [afslutOpgaveModalOpen, setAfslutOpgaveModalOpen] = useState(false)
  const [returlaesModalOpen, setReturlaesModalOpen] = useState(false)

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

      {/* Header — kun luk-knap */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          paddingRight: 16,
          paddingBottom: 8,
        }}
      >
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

      {/* Scrollable body */}
      <div
        className="scrollbar-hide"
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          paddingLeft: 20,
          paddingRight: 20,
          paddingTop: 8,
          paddingBottom: 57,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          justifyContent: 'center',
        }}
      >
        {/* ── Sub-skærm 1: Kør til udlægger og aflæs ── */}
        {subScreen === 'udlaegger' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Boks 1: Info om udførselssted og last */}
            <div
              style={{
                backgroundColor: C.white,
                borderRadius: 12,
                border: `1px solid ${C.border}`,
                padding: '28px 20px',
              }}
            >
              {/* Overskrift */}
              <p
                style={{
                  fontFamily: 'Poppins, sans-serif',
                  fontWeight: 600,
                  fontSize: FS.md,
                  color: C.deepTeal,
                  margin: 0,
                  textAlign: 'center',
                }}
              >
                Udførselssted
              </p>
              {/* Adresse */}
              <p
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: FS.sm,
                  color: C.textPrimary,
                  margin: 0,
                  marginTop: 4,
                  textAlign: 'center',
                }}
              >
                {MOCK.udfoerselsstedAdresse}
              </p>

              {/* Instruktion */}
              <p
                style={{
                  fontFamily: 'Poppins, sans-serif',
                  fontWeight: 600,
                  fontSize: FS.md,
                  color: C.deepTeal,
                  margin: '16px auto 0',
                  textAlign: 'center',
                }}
              >
                Kør til udlægger og aflæs
              </p>
            </div>

            {/* Bekræft aflæsning — gul pill (happy path) */}
            <button
              onClick={() => setSubScreen('bekraeft')}
              style={{
                backgroundColor: C.yellow,
                border: 'none',
                borderRadius: 50,
                minHeight: 56,
                cursor: 'pointer',
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 600,
                fontSize: FS.md,
                color: C.deepTeal,
                width: '100%',
              }}
            >
              Bekræft aflæsning
            </button>

            {/* Opret returlæs — outline-knap (sekundær, IKKE gul) */}
            <button
              onClick={() => setReturlaesModalOpen(true)}
              style={{
                backgroundColor: 'transparent',
                border: `1.5px solid ${C.deepTeal}`,
                borderRadius: 50,
                minHeight: 56,
                cursor: 'pointer',
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 600,
                fontSize: FS.md,
                color: C.deepTeal,
                width: '100%',
              }}
            >
              Opret returlæs
            </button>
          </div>
        )}

        {/* ── Sub-skærm 3: Bekræftelse ── */}
        {subScreen === 'bekraeft' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Success banner — 1:1 match med udvejet-bekraeft i AnkommetFabrikScreen */}
            <div
              style={{
                backgroundColor: C.goodBg,
                borderRadius: 12,
                border: `1px solid ${C.good}`,
                padding: '28px 20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              {/* Check-ikon-cirkel — identisk med fabrik: 36×36, C.good bg, Check 20px hvid */}
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  backgroundColor: C.good,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  alignSelf: 'center',
                  marginBottom: 12,
                  flexShrink: 0,
                }}
              >
                <Check size={20} color={C.white} />
              </div>
              <p
                style={{
                  fontFamily: 'Poppins, sans-serif',
                  fontWeight: 600,
                  fontSize: FS.md,
                  color: C.deepTeal,
                  margin: 0,
                  textAlign: 'center',
                }}
              >
                Tak {MOCK.driverName}
              </p>
              <p
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: FS.md,
                  color: C.textMuted,
                  margin: 0,
                  textAlign: 'center',
                  lineHeight: 1.5,
                }}
              >
                Vi har beregnet tiden til fabrikken til at være{' '}
                <span style={{ fontWeight: 700, color: C.deepTeal }}>
                  {/* TODO: Erstat med Google Distance Matrix + 10% lastbil-buffer (se FUNCTIONAL_FLOWS Flow 3 Trin 6) */}
                  {MOCK.etaTilFabrik} min
                </span>
                . God tur.
              </p>
            </div>

            {/* Hent næste læs — primær grøn pill */}
            <button
              onClick={onClose}
              style={{
                backgroundColor: C.green,
                border: 'none',
                borderRadius: 50,
                height: 52,
                cursor: 'pointer',
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 600,
                fontSize: FS.md,
                color: C.white,
                width: '100%',
              }}
            >
              Hent næste læs
            </button>

            {/* Afslut opgave — sekundær outline pill */}
            <button
              onClick={() => setAfslutOpgaveModalOpen(true)}
              style={{
                backgroundColor: 'transparent',
                border: `1.5px solid ${C.deepTeal}`,
                borderRadius: 50,
                height: 52,
                cursor: 'pointer',
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 600,
                fontSize: FS.md,
                color: C.deepTeal,
                width: '100%',
                marginTop: 8,
              }}
            >
              Afslut opgave
            </button>
          </div>
        )}

        {/* ── Modal: Bekræft Afslut opgave ── */}
        {afslutOpgaveModalOpen && (
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
              <span
                style={{
                  fontFamily: 'Poppins, sans-serif',
                  fontWeight: 600,
                  fontSize: FS.md,
                  color: C.deepTeal,
                  textAlign: 'center',
                }}
              >
                Afslut opgave?
              </span>
              <span
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: FS.sm,
                  color: C.textMuted,
                  textAlign: 'center',
                }}
              >
                Er du sikker på du vil afslutte opgaven?
              </span>
              <div style={{ display: 'flex', gap: 10, marginTop: 4, width: '100%' }}>
                <button
                  onClick={() => setAfslutOpgaveModalOpen(false)}
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
                  onClick={() => { setAfslutOpgaveModalOpen(false); onClose() }}
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
        {/* ── Modal: Opret returlæs ── */}
        {returlaesModalOpen && (
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
            onClick={() => setReturlaesModalOpen(false)}
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
                Ønsker du at oprette returlæs?
              </span>
              <span
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: FS.sm,
                  color: C.textMuted,
                  textAlign: 'center',
                  lineHeight: 1.5,
                }}
              >
                Rest-asfalt køres retur til fabrik. Bilen vejes ind fuld og ud tom.
              </span>
              <div style={{ display: 'flex', gap: 10, marginTop: 4, width: '100%' }}>
                <button
                  onClick={() => setReturlaesModalOpen(false)}
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
                  Annullér
                </button>
                <button
                  onClick={() => {
                    setReturlaesModalOpen(false)
                    onOpretReturlaes?.()
                  }}
                  style={{
                    flex: 1,
                    height: 44,
                    backgroundColor: C.deepTeal,
                    border: 'none',
                    borderRadius: 50,
                    cursor: 'pointer',
                    fontFamily: 'Poppins, sans-serif',
                    fontWeight: 600,
                    fontSize: FS.sm,
                    color: C.white,
                  }}
                >
                  Opret returlæs
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom tab bar */}
      <BottomTabBar
        activeTab={activeTab}
        onTabPress={(tab) => { if (tab !== 'prototyper') onClose() }}
        messageCount={messageCount}
      />
    </div>
  )
}
