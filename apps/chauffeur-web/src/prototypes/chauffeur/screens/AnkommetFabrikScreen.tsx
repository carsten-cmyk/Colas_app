/**
 * PROTOTYPE — Ankomst til fabrik skærm (web-port af Expo-version)
 * Simulerer QR-scanning flow. Må ikke importeres i produktionskode.
 */
import { useState } from 'react'
import { Camera, X, Check } from 'lucide-react'
import { BottomTabBar } from '../components/BottomTabBar'
import type { TabName } from '../components/BottomTabBar'

// ─── Mock data ────────────────────────────────────────────────────────────────
const MOCK = {
  orderNumber: '1212343',
  silo: 'Silo 3',
  ton: 34,
  produkt: 'SMA 11S',
  recept_nr: '94101A',         // TODO: Erstat med Supabase når klar
  produktnavn: 'SMA 11S 8mm',  // TODO: Erstat med Supabase når klar
  pickup: { name: 'Køge Asfaltfabrik' },
  bilKapacitet: 34,      // bilens lasteevne i tons
  erSidsteLaes: false,   // sæt til true for at simulere sidste-læs flow
  sidsteLaesStr: 10,     // sidste-læs-størrelse i tons (kun relevant hvis erSidsteLaes)
  udfoerselsstedAdresse: 'Søvej 6 D, 4900 Nakskov',  // TODO: Erstat med Supabase når klar
}

// ─── Props ────────────────────────────────────────────────────────────────────
export interface AnkommetFabrikScreenProps {
  onClose: () => void
  messageCount?: number
}

// A) SubScreen-type — flow er nu scan-vaegt → bekraeft direkte (indvejet fjernet)
type SubScreen = 'ankomst' | 'scan-vaegt' | 'bekraeft' | 'scan-udvejning' | 'udvejet-bekraeft'

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
          paddingBottom: 57,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          justifyContent: 'center',
        }}
      >
        {/* B) ankomst-side — to trin-bokse med tal-cirkler */}
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
                Hej Jens,
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
                Velkommen til {MOCK.pickup.name}
              </p>
            </div>

            {/* Trin 1 — Kør til vægten */}
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
              {/* Tal-cirkel 1 */}
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  backgroundColor: C.deepTeal,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  alignSelf: 'center',
                  marginBottom: 12,
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    fontFamily: 'Poppins, sans-serif',
                    fontWeight: 700,
                    fontSize: 18,
                    color: C.white,
                    lineHeight: 1,
                  }}
                >
                  1
                </span>
              </div>
              <p style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: 18, color: C.deepTeal, margin: 0, textAlign: 'center' }}>
                Kør til vægten
              </p>
            </div>

            {/* Trin 2 — Scan vægtens QR-kode (knap flyttes INDE i boksen) */}
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
              {/* Tal-cirkel 2 */}
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  backgroundColor: C.deepTeal,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  alignSelf: 'center',
                  marginBottom: 12,
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    fontFamily: 'Poppins, sans-serif',
                    fontWeight: 700,
                    fontSize: 18,
                    color: C.white,
                    lineHeight: 1,
                  }}
                >
                  2
                </span>
              </div>
              <p style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: 18, color: C.deepTeal, margin: 0, textAlign: 'center' }}>
                Scan vægtens QR-kode
              </p>
              <button
                onClick={() => setSubScreen('scan-vaegt')}
                style={{
                  backgroundColor: C.yellow,
                  border: 'none',
                  borderRadius: 50,
                  height: 52,
                  width: '100%',
                  marginTop: 8,
                  cursor: 'pointer',
                  fontFamily: 'Poppins, sans-serif',
                  fontWeight: 600,
                  fontSize: 15,
                  color: C.deepTeal,
                }}
              >
                Åbn scanner
              </button>
            </div>
          </>
        )}

        {/* C) NY sub-screen scan-vaegt — kopieret 1:1 fra qr-scan-blokken */}
        {subScreen === 'scan-vaegt' && (
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
                Scan vægtens QR kode
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

        {/* F) bekraeft-side — trin-cirkel-mønster identisk med ankomst-siden */}
        {subScreen === 'bekraeft' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* F.1) Boks 1 — Kør til Silo og start lastningen */}
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
              {/* Tal-cirkel 1 — identisk styling med ankomst-siden */}
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  backgroundColor: C.deepTeal,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  alignSelf: 'center',
                  marginBottom: 12,
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    fontFamily: 'Poppins, sans-serif',
                    fontWeight: 700,
                    fontSize: 18,
                    color: C.white,
                    lineHeight: 1,
                  }}
                >
                  1
                </span>
              </div>
              <p style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: 18, color: C.deepTeal, margin: 0, textAlign: 'center' }}>
                Kør til Silo og start lastningen
              </p>

              {/* Tabel-rækker smeltet ind i boks 1 — ingen ydre boks-styling */}
              <div style={{ width: '100%', marginTop: 8 }}>
                {(
                  [
                    { label: 'Silo', value: 'Se silo på vægten' },
                    {
                      label: 'Forventet last',
                      value: MOCK.erSidsteLaes
                        ? `${MOCK.sidsteLaesStr} Tons (sidste læs)`
                        : `${MOCK.bilKapacitet} Tons`,
                    },
                    { label: 'Produkt', value: { primary: MOCK.recept_nr, secondary: MOCK.produktnavn } },
                  ] as { label: string; value: string | { primary: string; secondary: string } }[]
                ).map((row, i, arr) => (
                  <div
                    key={row.label}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '14px 0',
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
                    {typeof row.value === 'string' ? (
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
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <p
                          style={{
                            fontFamily: 'Poppins, sans-serif',
                            fontWeight: 600,
                            fontSize: 16,
                            color: C.deepTeal,
                            margin: 0,
                            lineHeight: 1.2,
                          }}
                        >
                          {row.value.primary}
                        </p>
                        <p
                          style={{
                            fontFamily: 'Inter, sans-serif',
                            fontSize: 11,
                            color: C.textMuted,
                            margin: 0,
                            lineHeight: 1.2,
                          }}
                        >
                          {row.value.secondary}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* F.2) Boks 2 — Kør til vægten og bliv udvejet */}
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
              {/* Tal-cirkel 2 — identisk styling med ankomst-siden */}
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  backgroundColor: C.deepTeal,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  alignSelf: 'center',
                  marginBottom: 12,
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    fontFamily: 'Poppins, sans-serif',
                    fontWeight: 700,
                    fontSize: 18,
                    color: C.white,
                    lineHeight: 1,
                  }}
                >
                  2
                </span>
              </div>
              <p style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: 18, color: C.deepTeal, margin: 0, textAlign: 'center' }}>
                Kør til vægten og bliv udvejet
              </p>
              <button
                onClick={() => setSubScreen('scan-udvejning')}
                style={{
                  backgroundColor: C.yellow,
                  border: 'none',
                  borderRadius: 50,
                  height: 52,
                  width: '100%',
                  marginTop: 8,
                  cursor: 'pointer',
                  fontFamily: 'Poppins, sans-serif',
                  fontWeight: 600,
                  fontSize: 15,
                  color: C.deepTeal,
                }}
              >
                Scan QR kode for udvejning
              </button>
            </div>

          </div>
        )}

        {/* G) udvejet-blok SLETTET — erstattet af scan-udvejning nedenfor */}

        {/* H) NY sub-screen scan-udvejning — kopieret 1:1 fra qr-scan-blokken */}
        {subScreen === 'scan-udvejning' && (
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
                Scan QR kode for udvejning
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
              onClick={() => setSubScreen('udvejet-bekraeft')}
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
              onClick={() => setSubScreen('bekraeft')}
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

        {/* I) udvejet-bekraeft-side — ÉN grøn boks med check-ikon, tabel og knap */}
        {subScreen === 'udvejet-bekraeft' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Samlet bekræftelsesboks — identisk struktur med bekraeft-sidens bokse, men goodBg + check-ikon */}
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
              {/* Check-ikon-cirkel — samme dimensioner og position som tal-cirkel i bekraeft-bokse */}
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

              {/* Overskrift — identisk styling med bokstitler i bekraeft */}
              <p style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: 18, color: C.deepTeal, margin: 0, textAlign: 'center' }}>
                Udvejning bekræftet
              </p>

              {/* Tabel-rækker — identisk rendering med bekraeft-sidens tabel */}
              <div style={{ width: '100%', marginTop: 8 }}>
                {(
                  [
                    { label: 'Silo', value: MOCK.silo },
                    { label: 'Antal tons', value: `${MOCK.bilKapacitet} Tons` },
                    { label: 'Produkt', value: { primary: MOCK.recept_nr, secondary: MOCK.produktnavn } },
                  ] as { label: string; value: string | { primary: string; secondary: string } }[]
                ).map((row, i, arr) => (
                  <div
                    key={row.label}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '14px 0',
                      borderBottom: i < arr.length - 1 ? `1px solid ${C.good}` : 'none',
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
                    {typeof row.value === 'string' ? (
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
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <p
                          style={{
                            fontFamily: 'Poppins, sans-serif',
                            fontWeight: 600,
                            fontSize: 16,
                            color: C.deepTeal,
                            margin: 0,
                            lineHeight: 1.2,
                          }}
                        >
                          {row.value.primary}
                        </p>
                        <p
                          style={{
                            fontFamily: 'Inter, sans-serif',
                            fontSize: 11,
                            color: C.textMuted,
                            margin: 0,
                            lineHeight: 1.2,
                          }}
                        >
                          {row.value.secondary}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Destination */}
              <p
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 13,
                  color: C.textMuted,
                  margin: '8px 0 0',
                  textAlign: 'center',
                }}
              >
                Kør til udførselssted: {MOCK.udfoerselsstedAdresse}
              </p>

              {/* Afslut vejning — inde i boksen, under tabellen */}
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
                  marginTop: 16,
                }}
              >
                Afslut vejning
              </button>
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
