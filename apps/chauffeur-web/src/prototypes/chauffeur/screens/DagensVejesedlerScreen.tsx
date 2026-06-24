/**
 * PROTOTYPE — Dagens vejesedler
 * variant="tab": vises som vejning-tab (BottomTabBar synlig, ingen retur-knap).
 * variant="overlay": vises som overlay over tidsregistrering (retur-knap synlig, ingen BottomTabBar).
 * Header + metric-kort + liste-kort spejler TaskDetailScreen (linje 156-218, 220-313, 392-448).
 * Må ikke importeres i produktionskode.
 */
import { FileCheck2, ChevronLeft } from 'lucide-react'
import { SAFE_AREA, FS, SP } from '@/styles/spacing'
import { DAGENS_VEJESEDLER } from '@/mocks/dagensVejesedler'
import type { Vejeseddel } from '@/types/task'
import { BottomTabBar } from '../components/BottomTabBar'
import type { TabName } from '../components/BottomTabBar'

// ─── Farver (Colas tokens — identiske med TaskDetailScreen) ──────────────────
const C = {
  deepTeal: '#0E4764',
  white: '#FFFFFF',
  bg: '#F8F8F8',
  border: '#EDEDED',
  textPrimary: '#1D1D1D',
  textMuted: '#717182',
  handleBar: '#C4C4C4',
} as const

// ─── Dato-hjælper ──────────────────────────────────────────────────────────────
function formatDanskDato(date: Date): string {
  return date.toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' })
}

export interface DagensVejesedlerScreenProps {
  onClose?: () => void
  /** Antal ulæste beskeder — videregivet til BottomTabBar */
  messageCount?: number
  /** Aktiv tab — videregivet til BottomTabBar så den kan navigere */
  onTabPress?: (tab: TabName) => void
  /**
   * 'tab': vejning-tab — BottomTabBar synlig, ingen retur-knap.
   * 'overlay': overlay over tidsregistrering — retur-knap synlig, ingen BottomTabBar.
   */
  variant?: 'tab' | 'overlay'
  /** Vejeseddel-liste. Default: DAGENS_VEJESEDLER */
  vejesedler?: Vejeseddel[]
  /** Overskrift i headeren. Default: 'Dagens vejesedler' */
  title?: string
  /**
   * Dato-undertekst i headeren.
   * undefined/ikke-sat = vis dagens dato (default).
   * null = skjul dato-underteksten (fx ved ordre-vejesedler).
   */
  dato?: string | null
}

export function DagensVejesedlerScreen({
  onClose,
  messageCount = 0,
  onTabPress,
  variant = 'tab',
  vejesedler = DAGENS_VEJESEDLER,
  title = 'Dagens vejesedler',
  dato,
}: DagensVejesedlerScreenProps) {
  const datoTekst = dato !== undefined ? dato : formatDanskDato(new Date())
  const nettoSum = vejesedler.reduce((sum, v) => sum + v.tons, 0)
  const isOverlay = variant === 'overlay'

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
      {/* ── Handle bar — spejl TaskDetailScreen linje 156-159 ───────────────── */}
      {/* TOP-CLEARANCE: max() sikrer at Dynamic Island (49px) ryddes i iPhone-rammen på desktop
          (hvor env(safe-area-inset-top) = 0). På rigtig enhed vinder den reelle inset (typisk 59px). */}
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: `max(${SAFE_AREA.top}, 52px)`, paddingBottom: 4 }}>
        <div style={{ width: 36, height: 4, backgroundColor: C.handleBar, borderRadius: 2 }} />
      </div>

      {/* ── Header — spejl TaskDetailScreen linje 161-200 ───────────────────── */}
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
              fontSize: FS.sm,
              color: C.textPrimary,
              margin: 0,
            }}
          >
            {title}
          </p>
          {datoTekst !== null && (
            <span
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: FS.xxs,
                color: C.textMuted,
              }}
            >
              {datoTekst}
            </span>
          )}
        </div>
        {/* Retur-knap vises kun i overlay-variant — 32×32 rund knap, kopieret fra TaskDetailScreen linje 183-199 */}
        {isOverlay && (
          <button
            onClick={onClose}
            aria-label="Tilbage"
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
            <ChevronLeft size={16} color={C.textPrimary} />
          </button>
        )}
      </div>

      {/* ── Scroll-body — spejl TaskDetailScreen linje 204-218 ──────────────── */}
      <div
        className="scrollbar-hide"
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          paddingLeft: 20,
          paddingRight: 20,
          paddingTop: 8,
          paddingBottom: isOverlay ? 16 : 58 + SP.sm,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {/* ── Metric-kort — spejl TaskDetailScreen linje 220-313 ────────────── */}
        {/* To kolonner: Vejesedler (antal) | Tons netto (sum) */}
        <div
          style={{
            backgroundColor: C.white,
            borderRadius: 12,
            border: `1px solid ${C.border}`,
            overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex' }}>
            {/* Kolonne 1: Vejesedler */}
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
                Vejesedler
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
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {vejesedler.length}
              </p>
            </div>
            {/* Kolonne 2: Tons netto */}
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
                Tons netto
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
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {nettoSum.toFixed(1)}
              </p>
            </div>
          </div>
        </div>

        {/* ── Sektions-label ────────────────────────────────────────────────── */}
        <span
          style={{
            fontFamily: 'Inter, sans-serif',
            fontWeight: 600,
            fontSize: FS.xxs,
            color: C.textMuted,
            textTransform: 'uppercase' as const,
            letterSpacing: '0.06em',
          }}
        >
          Vejesedler
        </span>

        {/* ── Vejeseddel-liste — hvidt afrundet kort ────────────────────────── */}
        {/* PATTERN: Rækkemønster kopieret 1:1 fra TaskDetailScreen.tsx linje 392-448 */}
        <div
          style={{
            backgroundColor: C.white,
            borderRadius: 12,
            border: `1px solid ${C.border}`,
            overflow: 'hidden',
          }}
        >
          {vejesedler.length === 0 ? (
            <div style={{ padding: `${SP.sm}px`, textAlign: 'center' }}>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: FS.sm, color: C.textMuted }}>
                Ingen vejesedler endnu
              </span>
            </div>
          ) : null}
          {vejesedler.map((v, index) => {
            const brutto = v.tara + v.tons
            return (
              <div
                key={v.vejeseddelNr}
                style={{
                  padding: `${SP.xs}px ${SP.sm}px`,
                  borderTop: index > 0 ? `1px solid ${C.border}` : undefined,
                  display: 'flex',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: SP.xs,
                }}
              >
                <FileCheck2 size={12} color={C.textMuted} style={{ flexShrink: 0 }} />
                <span
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: FS.xxs,
                    fontWeight: 600,
                    color: C.deepTeal,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  Vejeseddel {v.vejeseddelNr}
                </span>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: FS.xxs, color: C.textMuted }}>·</span>
                <span
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: FS.xxs,
                    color: C.textMuted,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {v.tidspunkt}
                </span>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: FS.xxs, color: C.textMuted }}>
                  {v.produkt}
                </span>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: FS.xxs, color: C.textMuted }}>·</span>
                <span
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: FS.xxs,
                    fontWeight: 600,
                    color: C.textPrimary,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  Tara {v.tara} · Brutto {brutto.toFixed(1)} · Netto {v.tons} Tons
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── BottomTabBar — kun i tab-variant ────────────────────────────────── */}
      {!isOverlay && (
        <BottomTabBar
          activeTab="vejning"
          onTabPress={onTabPress ?? (() => undefined)}
          messageCount={messageCount}
        />
      )}
    </div>
  )
}
