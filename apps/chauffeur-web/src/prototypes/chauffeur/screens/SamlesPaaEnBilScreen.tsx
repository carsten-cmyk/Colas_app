/**
 * PROTOTYPE — Samles på en bil screen (Flow 12)
 * Multi-produkt vejning-loop: chauffør henter flere produkter på samme bil.
 * Må ikke importeres i produktionskode.
 */
import { useState } from 'react'
import { Camera, X, Check, ChevronRight } from 'lucide-react'
import { SAFE_AREA, FS } from '@/styles/spacing'
import { BottomTabBar } from '../components/BottomTabBar'
import type { TabName } from '../components/BottomTabBar'

// ─── Mock data ────────────────────────────────────────────────────────────────
// TODO: Erstat med Supabase når klar
const MOCK = {
  orderNumber: '1212343',
  destinationAdresse: 'Søvej 6 D, 4900 Nakskov',
  bilKapacitet: 34,
  produkter: [
    { id: 'p1', recept_nr: '94101A', produktnavn: 'SMA 11S 8mm', tons: 12, silo: 'Silo 3' },
    { id: 'p2', recept_nr: '71105B', produktnavn: 'AB 11T 22mm', tons: 10, silo: 'Silo 5' },
    { id: 'p3', recept_nr: '82201H', produktnavn: 'GAB 0/16', tons: 8, silo: 'Silo 2' },
  ],
}

// ─── Props ────────────────────────────────────────────────────────────────────
export interface SamlesPaaEnBilScreenProps {
  onClose: () => void
  /** Antal ulæste beskeder til BottomTabBar */
  messageCount?: number
}

type SubScreen = 'ankomst' | 'scan-vaegt' | 'produktvalg' | 'bekraeft' | 'scan-udvejning' | 'afslut'

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
}

export function SamlesPaaEnBilScreen({ onClose, messageCount = 0 }: SamlesPaaEnBilScreenProps) {
  const [subScreen, setSubScreen] = useState<SubScreen>('ankomst')
  const [lastede, setLastede] = useState<Set<string>>(new Set())
  const [valgtProdukt, setValgtProdukt] = useState<string | null>(null)
  const [activeTab] = useState<TabName>('prototyper')

  const resterende = MOCK.produkter.filter(p => !lastede.has(p.id))
  const valgt = MOCK.produkter.find(p => p.id === valgtProdukt) ?? null

  // Hjælpefunktion: genbrugt trin-cirkel (identisk med AnkommetFabrikScreen)
  function TrinCirkel({ tal }: { tal: number }) {
    return (
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
          {tal}
        </span>
      </div>
    )
  }

  // Hjælpefunktion: hvid boks (identisk med AnkommetFabrikScreen-boks-styling)
  function Boks({ children }: { children: React.ReactNode }) {
    return (
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
        {children}
      </div>
    )
  }

  // Hjælpefunktion: gul pill-knap (identisk med AnkommetFabrikScreen)
  function GulPill({ label, onClick }: { label: string; onClick: () => void }) {
    return (
      <button
        onClick={onClick}
        style={{
          backgroundColor: C.yellow,
          border: 'none',
          borderRadius: 50,
          height: 56,
          width: '100%',
          marginTop: 8,
          cursor: 'pointer',
          fontFamily: 'Poppins, sans-serif',
          fontWeight: 600,
          fontSize: FS.md,
          color: C.deepTeal,
          minHeight: 56,
        }}
      >
        {label}
      </button>
    )
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

        {/* A) ankomst — velkomst + to trin-bokse */}
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
                Hej Jens,
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
                Du har {MOCK.produkter.length} produkter at hente på samme bil
              </p>
            </div>

            {/* Trin 1 — Kør til vægten */}
            <Boks>
              <TrinCirkel tal={1} />
              <p style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: FS.md, color: C.deepTeal, margin: 0, textAlign: 'center' }}>
                Kør til vægten
              </p>
            </Boks>

            {/* Trin 2 — Scan vægtens QR-kode */}
            <Boks>
              <TrinCirkel tal={2} />
              <p style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: FS.md, color: C.deepTeal, margin: 0, textAlign: 'center' }}>
                Scan vægtens QR-kode
              </p>
              <GulPill label="Åbn scanner" onClick={() => setSubScreen('scan-vaegt')} />
            </Boks>
          </>
        )}

        {/* B) scan-vaegt — kopieret 1:1 fra AnkommetFabrikScreen's scan-vaegt */}
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
              <p style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: FS.md, color: C.deepTeal, margin: 0, textAlign: 'center' }}>
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

            {/* Simuler scan — gul pill */}
            <button
              onClick={() => setSubScreen('produktvalg')}
              style={{
                backgroundColor: C.yellow,
                border: 'none',
                borderRadius: 50,
                height: 56,
                cursor: 'pointer',
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 600,
                fontSize: FS.md,
                color: C.deepTeal,
                minHeight: 56,
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
                minHeight: 44,
              }}
            >
              Tilbage
            </button>
          </div>
        )}

        {/* C) produktvalg — liste af resterende produkter */}
        {subScreen === 'produktvalg' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* Overskrift */}
            <div style={{ marginBottom: 8 }}>
              <p
                style={{
                  fontFamily: 'Poppins, sans-serif',
                  fontWeight: 600,
                  fontSize: FS.xl,
                  color: C.deepTeal,
                  margin: '0 0 4px 0',
                }}
              >
                Vælg produkt
              </p>
              <p
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: FS.sm,
                  color: C.textMuted,
                  margin: 0,
                }}
              >
                {resterende.length} {resterende.length === 1 ? 'produkt' : 'produkter'} tilbage at hente
              </p>
            </div>

            {/* Produkt-kort */}
            {resterende.map(p => (
              <button
                key={p.id}
                onClick={() => { setValgtProdukt(p.id); setSubScreen('bekraeft') }}
                style={{
                  backgroundColor: C.white,
                  borderRadius: 12,
                  border: `1px solid ${C.border}`,
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  minHeight: 72,
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <p
                    style={{
                      fontFamily: 'Poppins, sans-serif',
                      fontWeight: 600,
                      fontSize: FS.md,
                      color: C.textPrimary,
                      margin: 0,
                    }}
                  >
                    {p.produktnavn}
                  </p>
                  <p
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: FS.xs,
                      color: C.textMuted,
                      margin: 0,
                    }}
                  >
                    {p.recept_nr}
                  </p>
                  <p
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: FS.sm,
                      color: C.deepTeal,
                      margin: 0,
                    }}
                  >
                    {p.tons} Tons
                  </p>
                </div>
                <ChevronRight size={20} color={C.textMuted} aria-label="Vælg produkt" />
              </button>
            ))}
          </div>
        )}

        {/* D) bekraeft — to trin-bokse med tabel og scan-knap */}
        {subScreen === 'bekraeft' && valgt && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Boks 1 — Kør til Silo og start lastningen */}
            <Boks>
              <TrinCirkel tal={1} />
              <p style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: FS.md, color: C.deepTeal, margin: 0, textAlign: 'center' }}>
                Kør til Silo og start lastningen
              </p>

              {/* Tabel */}
              <div style={{ width: '100%', marginTop: 8 }}>
                {[
                  { label: 'Silo', valueNode: <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: FS.md, color: C.deepTeal }}>{valgt.silo}</span> },
                  {
                    label: 'Forventet last',
                    valueNode: <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: FS.md, color: C.deepTeal }}>{valgt.tons} Tons</span>,
                  },
                  {
                    label: 'Produkt',
                    valueNode: (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: FS.md, color: C.deepTeal }}>{valgt.produktnavn}</span>
                        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: FS.xxs, color: C.textMuted }}>{valgt.recept_nr}</span>
                      </div>
                    ),
                  },
                ].map((row, i, arr) => (
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
                    {row.valueNode}
                  </div>
                ))}
              </div>
            </Boks>

            {/* Boks 2 — Kør til vægten og bliv udvejet */}
            <Boks>
              <TrinCirkel tal={2} />
              <p style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: FS.md, color: C.deepTeal, margin: 0, textAlign: 'center' }}>
                Kør til vægten og bliv udvejet
              </p>
              <GulPill label="Scan QR kode for udvejning" onClick={() => setSubScreen('scan-udvejning')} />
            </Boks>

          </div>
        )}

        {/* E) scan-udvejning — kopieret fra AnkommetFabrikScreen med loop-logik */}
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
              <p style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: FS.md, color: C.deepTeal, margin: 0, textAlign: 'center' }}>
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

            {/* Simuler scan — loop-logik: tjek FØR setState om dette er det sidst produkt */}
            <button
              onClick={() => {
                if (!valgtProdukt) return
                // Beregn næste-lastede-sæt synkront for at undgå stale closure
                const næsteLastede = new Set([...lastede, valgtProdukt])
                setLastede(næsteLastede)
                setValgtProdukt(null)
                // Alle produkter lastet → afslut, ellers → nyt produktvalg
                setSubScreen(næsteLastede.size === MOCK.produkter.length ? 'afslut' : 'produktvalg')
              }}
              style={{
                backgroundColor: C.yellow,
                border: 'none',
                borderRadius: 50,
                height: 56,
                cursor: 'pointer',
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 600,
                fontSize: FS.md,
                color: C.deepTeal,
                minHeight: 56,
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
                minHeight: 44,
              }}
            >
              Tilbage
            </button>
          </div>
        )}

        {/* F) afslut — grøn bekræftelses-boks med alle lastede produkter */}
        {subScreen === 'afslut' && (
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
              {/* Check-ikon-cirkel — identisk styling med AnkommetFabrikScreen's udvejet-bekraeft */}
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
                Alle produkter lastet
              </p>

              {/* Liste over lastede produkter */}
              <div style={{ width: '100%', marginTop: 8 }}>
                {MOCK.produkter.map((p, i, arr) => (
                  <div
                    key={p.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '14px 0',
                      borderBottom: i < arr.length - 1 ? `1px solid ${C.good}` : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <p style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: FS.sm, color: C.deepTeal, margin: 0 }}>
                        {p.produktnavn}
                      </p>
                      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: FS.xxs, color: C.textMuted, margin: 0 }}>
                        {p.recept_nr}
                      </p>
                    </div>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: FS.sm, color: C.textMuted, margin: 0 }}>
                      {p.tons} Tons
                    </p>
                  </div>
                ))}
              </div>

              {/* Destination */}
              <p
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: FS.sm,
                  color: C.textMuted,
                  margin: '8px 0 0',
                  textAlign: 'center',
                }}
              >
                Kør til udførselssted: {MOCK.destinationAdresse}
              </p>

              {/* Afslut vejning — grøn knap inde i boksen */}
              <button
                onClick={onClose}
                style={{
                  backgroundColor: C.green,
                  border: 'none',
                  borderRadius: 50,
                  height: 56,
                  cursor: 'pointer',
                  fontFamily: 'Poppins, sans-serif',
                  fontWeight: 600,
                  fontSize: FS.md,
                  color: C.white,
                  width: '100%',
                  marginTop: 16,
                  minHeight: 56,
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
