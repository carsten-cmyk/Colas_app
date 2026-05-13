/**
 * PROTOTYPE — Ankomst til fabrik skærm (web-port af Expo-version)
 * Simulerer QR-scanning flow. Må ikke importeres i produktionskode.
 */
import { useState } from 'react'
import { Camera, X, CheckCircle } from 'lucide-react'
import { BottomTabBar } from '../components/BottomTabBar'
import type { TabName } from '../components/BottomTabBar'

// ─── Mock data ────────────────────────────────────────────────────────────────
const MOCK = {
  orderNumber: '1212343',
  silo: 'Silo 3',
  produkt: '82101H',
  pickup: { name: 'Køge Asfaltfabrik' },
}

// ─── Props ────────────────────────────────────────────────────────────────────
export interface AnkommetFabrikScreenProps {
  onClose: () => void
  messageCount?: number
}

type SubScreen = 'ankomst' | 'qr-scan' | 'bekraeft' | 'udvejet'

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
}

export function AnkommetFabrikScreen({ onClose, messageCount = 0 }: AnkommetFabrikScreenProps) {
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
          paddingBottom: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          justifyContent: subScreen === 'ankomst' ? 'flex-start' : 'center',
        }}
      >
        {subScreen === 'ankomst' && (
          <>
            {/* Velkomsttekst */}
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
              Velkommen til{'\n'}{MOCK.pickup.name}
            </p>

            {/* Instruktionskort 1 — Vægten */}
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
                Kør til vægten
              </p>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: C.textMuted, margin: 0, textAlign: 'center' }}>
                Bil indvejes tom
              </p>
            </div>

            {/* Instruktionskort 2 — Silo */}
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
                Kør til {MOCK.silo}
              </p>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: C.textMuted, margin: 0, textAlign: 'center', lineHeight: 1.4 }}>
                Inden lastning skal du bekræfte produkt ved at scanne QR-kode på Silo
              </p>
            </div>

            {/* Kamera knap */}
            <div
              style={{
                backgroundColor: C.white,
                borderRadius: 12,
                border: `1px solid ${C.border}`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '28px 20px',
                gap: 12,
              }}
            >
              <p style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: 18, color: C.deepTeal, margin: 0, textAlign: 'center' }}>
                Bekræft produkt
              </p>
              <button
                onClick={() => setSubScreen('qr-scan')}
                aria-label="Åbn QR-scanner"
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: '50%',
                  backgroundColor: '#F0F7FA',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Camera size={36} color={C.deepTeal} />
              </button>
              <p
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 13,
                  color: C.textMuted,
                  margin: 0,
                  textAlign: 'center',
                  lineHeight: 1.4,
                }}
              >
                Tryk på kamera-ikonet og scan QR-kode for at bekræfte produkt
              </p>
            </div>
          </>
        )}

        {subScreen === 'qr-scan' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* QR ramme */}
            <div
              style={{
                backgroundColor: C.white,
                borderRadius: 12,
                border: `1px solid ${C.border}`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '36px 20px',
                gap: 16,
              }}
            >
              <p style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: 18, color: C.deepTeal, margin: 0, textAlign: 'center' }}>
                Scan produkt QR-kode
              </p>
              <div
                style={{
                  width: 200,
                  height: 200,
                  border: `3px dashed ${C.deepTeal}`,
                  borderRadius: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 12,
                  backgroundColor: 'rgba(14,71,100,0.04)',
                }}
              >
                <Camera size={48} color={C.deepTeal} />
                <p
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: 12,
                    color: C.textMuted,
                    margin: 0,
                    textAlign: 'center',
                  }}
                >
                  Hold QR-kode inden for rammen
                </p>
              </div>
            </div>

            {/* Simuler scan — gul pill */}
            <button
              onClick={() => setSubScreen('bekraeft')}
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
              Simuler scan
            </button>

            <button
              onClick={() => setSubScreen('ankomst')}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
                fontSize: 13,
                color: C.textMuted,
                alignSelf: 'center',
              }}
            >
              Tilbage
            </button>
          </div>
        )}

        {subScreen === 'bekraeft' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Success icon */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                paddingTop: 24,
              }}
            >
              <CheckCircle size={56} color="#1F8A5B" />
              <p
                style={{
                  fontFamily: 'Poppins, sans-serif',
                  fontWeight: 600,
                  fontSize: 20,
                  color: C.textPrimary,
                  margin: 0,
                  textAlign: 'center',
                }}
              >
                Du kan nu starte lastningen
              </p>
            </div>

            {/* Bekræftelseskort */}
            <div
              style={{
                backgroundColor: C.white,
                borderRadius: 12,
                border: `1px solid ${C.border}`,
                overflow: 'hidden',
              }}
            >
              {[
                { label: 'Silo', value: MOCK.silo },
                { label: 'Produkt', value: MOCK.produkt },
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

            {/* Lastning færdig */}
            <button
              onClick={() => setSubScreen('udvejet')}
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
              Lastning færdig
            </button>
          </div>
        )}

        {subScreen === 'udvejet' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Instruktionskort — Udvejet */}
            <div
              style={{
                backgroundColor: C.white,
                borderRadius: 12,
                border: `1px solid ${C.border}`,
                padding: '36px 20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                minHeight: 140,
              }}
            >
              <p style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: 18, color: C.deepTeal, margin: 0, textAlign: 'center' }}>
                Kør til vægten og bliv udvejet
              </p>
            </div>

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
              Udvejet og på vej til udførselssted
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
