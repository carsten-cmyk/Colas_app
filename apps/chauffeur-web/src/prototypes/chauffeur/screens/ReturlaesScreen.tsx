/**
 * PROTOTYPE — Returlæs-skærm (enkelt produkt, Flow 14)
 * SPEJLET vejeflow: bil indvejes FULD → aflæsses ved silo → bil udvejes TOM.
 * Vejebilag genereres med NEGATIVT fortegn (−X tons).
 * Må ikke importeres i produktionskode.
 */
import { useState } from 'react'
import { Camera, X, Check } from 'lucide-react'
import { SAFE_AREA, FS } from '@/styles/spacing'
import { BottomTabBar } from '../components/BottomTabBar'
import type { TabName } from '../components/BottomTabBar'

// ─── Mock data ────────────────────────────────────────────────────────────────
// TODO: Erstat med Supabase når klar
const MOCK = {
  orderNumber: '1212343',
  silo: 'Silo 3',
  restTons: 8,           // rest-asfalt der returneres (negativt på vejebilag)
  produkt: 'SMA 11S',
  recept_nr: '94101A',
  produktnavn: 'SMA 11S 8mm',
  pickup: { name: 'Køge Asfaltfabrik' },
  driverName: 'Jens',
  udfoerselsstedAdresse: 'Søndre Boulevard 44, 4900 Nakskov',
}

// ─── Props ────────────────────────────────────────────────────────────────────
export interface ReturlaesScreenProps {
  onClose: () => void
  messageCount?: number
}

// SPEJLET flow: ankomst (fuld bil) → scan-vaegt (indvej fuld) → bekraeft (aflæs ved silo) → scan-udvejning (udvej tom) → kvittering
type SubScreen = 'ankomst' | 'scan-vaegt' | 'bekraeft' | 'scan-udvejning' | 'kvittering'

// ─── Farver (Colas tokens — identisk palette med AnkommetFabrikScreen) ────────
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
  // Bruges til negativt vejebilag (returlæs)
  danger: '#C8372D',
  dangerBg: '#FBECEA',
  dangerBorder: '#F4C5C2',
}

export function ReturlaesScreen({ onClose, messageCount = 0 }: ReturlaesScreenProps) {
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
      {/* Handle bar — identisk med AnkommetFabrikScreen */}
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: SAFE_AREA.top, paddingBottom: 4 }}>
        <div style={{ width: 36, height: 4, backgroundColor: '#C4C4C4', borderRadius: 2 }} />
      </div>

      {/* Header — kun luk-knap, identisk med AnkommetFabrikScreen */}
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

      {/* Scrollable body — identisk med AnkommetFabrikScreen */}
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
        {/* A) ankomst — SPEJLET: bil er FULD, skal indvejes */}
        {subScreen === 'ankomst' && (
          <>
            {/* Velkomsttekst */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <p
                style={{
                  fontFamily: 'Poppins, sans-serif',
                  fontWeight: 600,
                  fontSize: FS['2xl'],
                  color: C.deepTeal,
                  margin: 0,
                  textAlign: 'center',
                  lineHeight: 1.3,
                }}
              >
                Hej {MOCK.driverName},
              </p>
              <p
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 400,
                  fontSize: FS.md,
                  color: C.textMuted,
                  margin: 0,
                  textAlign: 'center',
                  lineHeight: 1.3,
                }}
              >
                Returlæs til {MOCK.pickup.name}
              </p>
              <p
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 400,
                  fontSize: FS.sm,
                  color: C.textMuted,
                  margin: 0,
                  marginTop: 6,
                  textAlign: 'center',
                  lineHeight: 1.3,
                }}
              >
                Bilen indvejes fuld og køres til silo.
                <br />
                Herefter udvejes bilen tom.
              </p>
            </div>

            {/* Trin 1 — Kør til vægten (FULD bil = indvejning) */}
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
                    fontSize: FS.md,
                    color: C.white,
                    lineHeight: 1,
                  }}
                >
                  1
                </span>
              </div>
              <p style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: FS.md, color: C.deepTeal, margin: 0, textAlign: 'center' }}>
                Kør til vægten (fuld bil)
              </p>
            </div>

            {/* Trin 2 — Scan vægtens QR-kode for indvejning */}
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
                    fontSize: FS.md,
                    color: C.white,
                    lineHeight: 1,
                  }}
                >
                  2
                </span>
              </div>
              <p style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: FS.md, color: C.deepTeal, margin: 0, textAlign: 'center' }}>
                Scan vægtens QR-kode (indvejning)
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
                  fontSize: FS.md,
                  color: C.deepTeal,
                }}
              >
                Åbn scanner
              </button>
            </div>
          </>
        )}

        {/* B) scan-vaegt — indvejning af fuld bil (kopieret fra AnkommetFabrikScreen) */}
        {subScreen === 'scan-vaegt' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
              <p style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: FS.md, color: C.deepTeal, margin: 0, textAlign: 'center' }}>
                Scan vægtens QR kode (indvejning fuld bil)
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
                    fontSize: FS.xs,
                    color: C.textMuted,
                    margin: 0,
                    textAlign: 'center',
                  }}
                >
                  Hold QR-kode inden for rammen
                </p>
              </div>
            </div>

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
                fontSize: FS.md,
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
                fontSize: FS.sm,
                color: C.textMuted,
                alignSelf: 'center',
              }}
            >
              Tilbage
            </button>
          </div>
        )}

        {/* C) bekraeft — SPEJLET: kør til silo og AFLÆS (ikke last) */}
        {subScreen === 'bekraeft' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Boks 1 — Kør til silo og aflæs efter fabriksmesterens instruks */}
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
                    fontSize: FS.md,
                    color: C.white,
                    lineHeight: 1,
                  }}
                >
                  1
                </span>
              </div>
              {/* SPEJLET tekst: aflæs (ikke last) */}
              <p style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: FS.md, color: C.deepTeal, margin: 0, textAlign: 'center' }}>
                Kør til silo og aflæs efter fabriksmesterens instruks
              </p>

              <div style={{ width: '100%', marginTop: 8 }}>
                {(
                  [
                    { label: 'Silo', value: MOCK.silo },
                    { label: 'Rest-asfalt', value: `${MOCK.restTons} Tons` },
                    { label: 'Produkt', value: { primary: MOCK.produktnavn, secondary: MOCK.recept_nr } },
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
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: FS.sm, color: C.textMuted, margin: 0 }}>
                      {row.label}
                    </p>
                    {typeof row.value === 'string' ? (
                      <p style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: FS.md, color: C.deepTeal, margin: 0 }}>
                        {row.value}
                      </p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <p style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: FS.md, color: C.deepTeal, margin: 0, lineHeight: 1.2 }}>
                          {row.value.primary}
                        </p>
                        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: FS.xxs, color: C.textMuted, margin: 0, lineHeight: 1.2 }}>
                          {row.value.secondary}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Boks 2 — SPEJLET: kør til vægten og bliv UDVEJET (tom bil) */}
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
                    fontSize: FS.md,
                    color: C.white,
                    lineHeight: 1,
                  }}
                >
                  2
                </span>
              </div>
              {/* SPEJLET tekst: udvejning af tom bil */}
              <p style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: FS.md, color: C.deepTeal, margin: 0, textAlign: 'center' }}>
                Kør til vægten og bliv udvejet (tom bil)
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
                  fontSize: FS.md,
                  color: C.deepTeal,
                }}
              >
                Scan QR kode for udvejning
              </button>
            </div>

          </div>
        )}

        {/* D) scan-udvejning — udvejning af tom bil (kopieret fra AnkommetFabrikScreen) */}
        {subScreen === 'scan-udvejning' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
              <p style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: FS.md, color: C.deepTeal, margin: 0, textAlign: 'center' }}>
                Scan QR kode for udvejning (tom bil)
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
                    fontSize: FS.xs,
                    color: C.textMuted,
                    margin: 0,
                    textAlign: 'center',
                  }}
                >
                  Hold QR-kode inden for rammen
                </p>
              </div>
            </div>

            <button
              onClick={() => setSubScreen('kvittering')}
              style={{
                backgroundColor: C.yellow,
                border: 'none',
                borderRadius: 50,
                height: 52,
                cursor: 'pointer',
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 600,
                fontSize: FS.md,
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
                fontSize: FS.sm,
                color: C.textMuted,
                alignSelf: 'center',
              }}
            >
              Tilbage
            </button>
          </div>
        )}

        {/* E) kvittering — SPEJLET: negativt vejebilag (−X tons i rødt) */}
        {subScreen === 'kvittering' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
              {/* Check-ikon-cirkel — identisk med udvejet-bekraeft i AnkommetFabrikScreen */}
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

              <p style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: FS.md, color: C.deepTeal, margin: 0, textAlign: 'center' }}>
                Returlæs registreret
              </p>

              {/* Tabel med vejebilag-data */}
              <div style={{ width: '100%', marginTop: 8 }}>
                {/* Silo */}
                {[
                  { label: 'Silo', value: MOCK.silo },
                  { label: 'Produkt', value: `${MOCK.produktnavn} · ${MOCK.recept_nr}` },
                ].map((row) => (
                  <div
                    key={row.label}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '14px 0',
                      borderBottom: `1px solid ${C.good}`,
                    }}
                  >
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: FS.sm, color: C.textMuted, margin: 0 }}>
                      {row.label}
                    </p>
                    <p style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: FS.md, color: C.deepTeal, margin: 0 }}>
                      {row.value}
                    </p>
                  </div>
                ))}
                {/* Vejebilag — negativt fortegn i rødt */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '14px 0',
                  }}
                >
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: FS.sm, color: C.textMuted, margin: 0 }}>
                    Vejebilag
                  </p>
                  {/* NEGATIVT fortegn — rødt (C.danger), returlæs konvention */}
                  <p style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: FS.md, color: C.danger, margin: 0 }}>
                    −{MOCK.restTons} Tons
                  </p>
                </div>
              </div>

              <p
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: FS.sm,
                  color: C.textMuted,
                  margin: '8px 0 0',
                  textAlign: 'center',
                }}
              >
                Vejebilag med negativt fortegn er sendt til afregning.
              </p>

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
                  marginTop: 16,
                }}
              >
                Afslut returlæs
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
