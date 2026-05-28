/**
 * PROTOTYPE — Ankomst til udførselssted skærm
 * Simulerer geofencing-ankomst + aflæsning ved udlægger.
 * Spejler AnkommetFabrikScreen-strukturen. Må ikke importeres i produktionskode.
 */
import { useState } from 'react'
import { Check, MapPin, X } from 'lucide-react'
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
} as const

// ─── Props ────────────────────────────────────────────────────────────────────
export interface AnkommetUdfoerselsstedScreenProps {
  onClose: () => void
  messageCount?: number
}

type SubScreen = 'ankomst' | 'udlaegger' | 'bekraeft'

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

export function AnkommetUdfoerselsstedScreen({ onClose, messageCount = 0 }: AnkommetUdfoerselsstedScreenProps) {
  const [subScreen, setSubScreen] = useState<SubScreen>('ankomst')
  const [activeTab] = useState<TabName>('prototyper')

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
        {/* ── Sub-skærm 1: Geofencing ankomst ── */}
        {subScreen === 'ankomst' && (
          <>
            {/* Velkomsttekst */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <p
                style={{
                  fontFamily: 'Poppins, sans-serif',
                  fontWeight: 600,
                  fontSize: 28,
                  color: C.deepTeal,
                  margin: 0,
                  textAlign: 'center',
                  lineHeight: 1.3,
                }}
              >
                Hej {MOCK.driverName}
              </p>
              <p
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 400,
                  fontSize: 15,
                  color: C.textMuted,
                  margin: 0,
                  textAlign: 'center',
                  lineHeight: 1.3,
                }}
              >
                Du er nu ankommet til udførselssted.
              </p>
            </div>

            {/* Lokationskort */}
            <div
              style={{
                backgroundColor: C.white,
                borderRadius: 12,
                border: `1px solid ${C.border}`,
                padding: '28px 20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                minHeight: 110,
              }}
            >
              <MapPin size={24} color={C.deepTeal} aria-hidden="true" />
              <p style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: 18, color: C.deepTeal, margin: 0, textAlign: 'center' }}>
                Udførselssted
              </p>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: C.textMuted, margin: 0, textAlign: 'center', lineHeight: 1.4 }}>
                {MOCK.adresse}
              </p>
            </div>

            {/* Bekræft ankomst — gul pill */}
            <button
              onClick={() => setSubScreen('udlaegger')}
              style={{
                backgroundColor: C.yellow,
                border: 'none',
                borderRadius: 50,
                height: 52,
                cursor: 'pointer',
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 600,
                fontSize: 15,
                color: C.deepTeal,
              }}
            >
              Bekræft ankomst
            </button>
          </>
        )}

        {/* ── Sub-skærm 2: Kør til udlægger og aflæs ── */}
        {subScreen === 'udlaegger' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Heading */}
            <p
              style={{
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 600,
                fontSize: 20,
                color: C.deepTeal,
                margin: 0,
                textAlign: 'center',
                lineHeight: 1.3,
              }}
            >
              Kør til udlægger og aflæs
            </p>

            {/* Instruktionskort */}
            <div
              style={{
                backgroundColor: C.white,
                borderRadius: 12,
                border: `1px solid ${C.border}`,
                padding: '28px 20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                minHeight: 110,
              }}
            >
              <p style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: 18, color: C.deepTeal, margin: 0, textAlign: 'center' }}>
                Find udlæggeren
              </p>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: C.textMuted, margin: 0, textAlign: 'center', lineHeight: 1.4 }}>
                Find udlæggeren på pladsen og aflæs asfalten dér.
              </p>
            </div>

            {/* Udlægger-info */}
            <div
              style={{
                backgroundColor: C.white,
                borderRadius: 12,
                border: `1px solid ${C.border}`,
                overflow: 'hidden',
              }}
            >
              {[
                { label: 'Ordre', value: MOCK.orderNumber },
                { label: 'Udlægger', value: MOCK.udlaegger },
              ].map((row, i, arr) => (
                <div
                  key={row.label}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '14px 16px',
                    borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : 'none',
                  }}
                >
                  <p
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: 13,
                      color: C.textMuted,
                      margin: 0,
                    }}
                  >
                    {row.label}
                  </p>
                  <p
                    style={{
                      fontFamily: 'Poppins, sans-serif',
                      fontWeight: 600,
                      fontSize: 15,
                      color: C.deepTeal,
                      margin: 0,
                    }}
                  >
                    {row.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Bekræft aflæsning — gul pill */}
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
                fontSize: 15,
                color: C.deepTeal,
                width: '100%',
              }}
            >
              Bekræft aflæsning
            </button>
          </div>
        )}

        {/* ── Sub-skærm 3: Bekræftelse ── */}
        {subScreen === 'bekraeft' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Success banner */}
            <div
              style={{
                backgroundColor: C.goodBg,
                borderRadius: 12,
                padding: '24px 20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12,
              }}
            >
              {/* Check-mark ikon — spejler udvejet-bekraeft-mønster fra AnkommetFabrikScreen */}
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  backgroundColor: C.good,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Check size={28} color={C.white} aria-hidden="true" />
              </div>
              <p
                style={{
                  fontFamily: 'Poppins, sans-serif',
                  fontWeight: 700,
                  fontSize: 24,
                  color: C.deepTeal,
                  margin: 0,
                  textAlign: 'center',
                  lineHeight: 1.2,
                }}
              >
                Tak {MOCK.driverName}
              </p>
              <p
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 15,
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

            {/* Færdig — grøn pill */}
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
                fontSize: 15,
                color: C.white,
                width: '100%',
              }}
            >
              Færdig
            </button>
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
