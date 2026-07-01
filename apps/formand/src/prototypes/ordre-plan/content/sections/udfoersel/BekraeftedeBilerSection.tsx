/**
 * PROTOTYPE — BekraeftedeBilerSection
 *
 * Extraction fra UdfoerselContent.tsx L269–672 (ORDRET — ingen redesign).
 * Viser "Bekræftede biler"-sektionen inkl. etape-bevidst materiel-transport-branch.
 *
 * Lokale states (tidligere i UdfoerselContent):
 *   smsStatusMap / materielSmsStatusMap / bilerTableExpanded / materielTableExpanded
 *
 * Props ind fra UdfoerselContent-containeren (state der ejes af container/root).
 *
 * TODO: Erstat med Supabase når klar — confirmed_vehicles[], materiel_transport[].
 */

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import {
  MaterielPaaPladsenTilstand,
  MaterielDvaleTilstand,
} from '../../../MaterielTilstande'
import type { MaterielEnhed as MaterielEnhedTilstand } from '../../../MaterielTilstande'
import { formatPhone, toE164 } from '@shared/utils/phone'
import { formatRegnr } from '@shared/utils/regnr'
import type {
  VognmandBekraeftelse,
  VognmandMaterielBekraeftelse,
  SamleordreContext,
  ChauffoerSmsStatus,
  MaterielEnhed,
} from '../../../types'
import { MATERIEL_ENHEDER } from '../../../mocks'
import type { Etape, MaterielUiState, MaterielTransportPlan } from '../../../etape'

// ─── Trin A helpers (modul-niveau — ingen closure) ───────────────────────────
// Disse bruges i Trin B til per-child filtrering i samleordre-mode.
// I Trin A er de defineret her men endnu ikke kaldt fra JSX.

/**
 * Normaliser et ordre_id til ren talstreng og sammenlign med orderNumber.
 * Robust for begge formater: 'ord-1212400' og '1212400'.
 */
export function matchOrdre(ordreId: string, orderNumber: string): boolean {
  const normalize = (s: string) => s.replace(/^ord-/i, '')
  return normalize(ordreId) === normalize(orderNumber)
}

/**
 * Returnér de biler fra `biler` hvor mindst én vejeseddel har en pre_fordeling
 * der matcher `child.orderNumber`.
 * En multilæs-bil kan matche flere børn — det er korrekt.
 */
export function bilerForChild(
  child: { orderNumber: string },
  biler: import('../../../types').ConfirmedTruck[],
): import('../../../types').ConfirmedTruck[] {
  return biler.filter(b =>
    (b.vejesedler ?? []).some(v =>
      v.pre_fordeling.some(pf => matchOrdre(pf.ordre_id, child.orderNumber))
    )
  )
}

/**
 * Returnér materiel-items der tilhører dette child.
 * Materiel-transport vises KUN på anchor-barnet (jf. beslutning FF Flow 2).
 */
export function materielForChild(
  child: { isAnchor: boolean },
  items: import('../../../types').ConfirmedMaterielItem[],
): import('../../../types').ConfirmedMaterielItem[] {
  return child.isAnchor ? items : []
}

// ─── Props ───────────────────────────────────────────────────────────────────

export interface BekraeftedeBilerSectionProps {
  /** Vognmands bekræftelse med liste af asfalt-biler og materiel-biler */
  vognmandBekraeftelse?: VognmandBekraeftelse
  /** Vognmands bekræftelse for materiel-transport */
  vognmandMaterielBekraeftelse?: VognmandMaterielBekraeftelse
  /** Etape-bevidst UX-tilstand for materiel-sektionen — afledt af selectedDate + etaper i root */
  materielUiState: MaterielUiState
  /** Valgt dato (YYYY-MM-DD) — bruges til at finde aktiv etape i 'paa-pladsen'-branch */
  selectedDate: string
  /** Klyngede etaper for ordren (fra root) */
  etaper: Etape[]
  /** Transport-planer keyed på transportKey(resourceId, etapeId) (fra root) */
  transportPlaner: Record<string, MaterielTransportPlan>
  /** True når Ordre-plan vises i samleordre-kontekst */
  isSamleordreMode?: boolean
  /** Samleordre-context med children (anchor + andre ordrer) når isSamleordreMode === true */
  samleordreCtx?: SamleordreContext | null
  /** Aktivt ordrenummer i samleordre-tab — bruges til per-child dagsoverblik */
  samleordreTabOrderNr?: string
}

// ─── Komponent ───────────────────────────────────────────────────────────────

export function BekraeftedeBilerSection({
  vognmandBekraeftelse,
  vognmandMaterielBekraeftelse,
  materielUiState,
  selectedDate,
  etaper,
  transportPlaner,
  isSamleordreMode,
  samleordreCtx,
  samleordreTabOrderNr,
}: BekraeftedeBilerSectionProps) {

  // ── SMS-status state — per regnr (nøgle). Initialiseres fra mock-data.
  // TODO: Erstat med Supabase når klar — confirmed_vehicles[].sms_status pr. (ordre, dag, reg_nr)
  const [smsStatusMap, setSmsStatusMap] = useState<Record<string, ChauffoerSmsStatus>>(() => {
    const map: Record<string, ChauffoerSmsStatus> = {}
    const biler = vognmandBekraeftelse?.biler ?? []
    for (const b of biler) {
      if (!b.er_materiel_bil) {
        map[b.regnr] = b.sms_status ?? 'ikke_sendt'
      }
    }
    return map
  })

  /** Send SMS → sætter status 'sendt' for det givne regnr. */
  function sendSms(regnr: string) {
    setSmsStatusMap(prev => ({ ...prev, [regnr]: 'sendt' }))
  }

  // ── Materiel SMS-status state — pr. chauffør-nøgle (regnr på transport-bilen).
  // Kører samme chauffør flere materiel-enheder, vises kun ÉN knap (konsolideret SMS).
  // Nøgle = regnr (unikt pr. transport-bil; samme bil = samme chauffør for materiel).
  // TODO: Erstat med Supabase når klar — materiel_transport[].sms_status pr. (ordre, dag, regnr)
  const [materielSmsStatusMap, setMaterielSmsStatusMap] = useState<Record<string, ChauffoerSmsStatus>>(() => {
    const map: Record<string, ChauffoerSmsStatus> = {}
    const items = vognmandMaterielBekraeftelse?.items ?? []
    // Første unikke regnr (øverste transport-bil) vises som 'sendt' — demo-default
    let foerste = true
    for (const item of items) {
      if (!(item.regnr in map)) {
        map[item.regnr] = foerste ? 'sendt' : 'ikke_sendt'
        foerste = false
      }
    }
    return map
  })

  /** Send materiel SMS → sætter status 'sendt' for transport-bilens regnr (dækker alle enheder på bilen). */
  function sendMaterielSms(regnr: string) {
    setMaterielSmsStatusMap(prev => ({ ...prev, [regnr]: 'sendt' }))
  }

  // ── Expand-state for tabeller (biler + materiel)
  const [bilerTableExpanded, setBilerTableExpanded] = useState(false)
  const [materielTableExpanded, setMaterielTableExpanded] = useState(false)

  // ─── Render helpers ───────────────────────────────────────────────────────

  /**
   * Renderer biler-tabel for en given liste af asfalt-biler.
   * Slice/expand-state (bilerTableExpanded) er stadig delt på komponent-niveau.
   * @param biler    - asfalt-biler (allerede filtreret og sorteret af kalderen)
   * @param keyPrefix - præfiks til React key for at undgå dublet-keys i samleordre
   */
  function renderBilerTabel(
    biler: import('../../../types').ConfirmedTruck[],
    keyPrefix: string,
  ) {
    const TABEL_DEFAULT = 3
    const bilerSorted = [...biler].sort((a, b) => (a.laes_nummer ?? 99) - (b.laes_nummer ?? 99))
    const bilerVis = bilerTableExpanded ? bilerSorted : bilerSorted.slice(0, TABEL_DEFAULT)
    const optælTyper = (typer: string[]): string => {
      const m = new Map<string, number>()
      typer.forEach(t => m.set(t, (m.get(t) ?? 0) + 1))
      return Array.from(m.entries()).map(([t, n]) => `${n}× ${t}`).join(' · ')
    }
    const bilerTypeTekst = optælTyper(biler.map(b => b.biltype))
    return (
      <div className="overflow-hidden rounded-xl border border-good/30 bg-good-bg">
        {/* Tabel-header */}
        <div className="flex items-center justify-between px-sm py-xs border-b border-good/20">
          <div className="flex items-center gap-xs">
            <span className="font-inter text-xxs font-medium tracking-widest uppercase text-text-muted">Biler</span>
          </div>
          <span className="font-poppins font-semibold text-sm text-text-primary">{bilerTypeTekst}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-good/15 bg-good-bg/60">
                <th className="text-left font-inter text-xxs font-semibold text-text-muted uppercase tracking-widest px-xs py-xxxs whitespace-nowrap">Reg.nr</th>
                <th className="text-left font-inter text-xxs font-semibold text-text-muted uppercase tracking-widest px-xs py-xxxs whitespace-nowrap">Biltype</th>
                <th className="text-left font-inter text-xxs font-semibold text-text-muted uppercase tracking-widest px-xs py-xxxs whitespace-nowrap">Chauffør</th>
                <th className="text-left font-inter text-xxs font-semibold text-text-muted uppercase tracking-widest px-xs py-xxxs whitespace-nowrap">Telefon</th>
                <th className="text-left font-inter text-xxs font-semibold text-text-muted uppercase tracking-widest px-xs py-xxxs whitespace-nowrap">Ankomst plads</th>
                <th className="text-left font-inter text-xxs font-semibold text-text-muted uppercase tracking-widest px-xs py-xxxs whitespace-nowrap">Mødetid fabrik</th>
                <th className="text-right font-inter text-xxs font-semibold text-text-muted uppercase tracking-widest px-xs py-xxxs whitespace-nowrap">SMS</th>
              </tr>
            </thead>
            <tbody>
              {bilerVis.map((b, i) => {
                const isLast = i === bilerVis.length - 1 && !(!bilerTableExpanded && bilerSorted.length > TABEL_DEFAULT)
                const smsStatus = smsStatusMap[b.regnr] ?? 'ikke_sendt'
                const erSendt = smsStatus === 'sendt'
                return (
                  <tr key={`${keyPrefix}-${b.regnr}`} className={isLast ? '' : 'border-b border-good/15'}>
                    <td className="align-middle font-inter text-xs font-semibold text-text-primary px-xs py-xs tabular-nums whitespace-nowrap">{formatRegnr(b.regnr)}</td>
                    <td className="align-middle font-inter text-xs text-text-muted px-xs py-xs whitespace-nowrap">{b.biltype}</td>
                    <td className="align-middle font-inter text-xs text-text-primary px-xs py-xs">{b.chauffoer}</td>
                    <td className="align-middle px-xs py-xs">
                      <a
                        href={`tel:${toE164(b.tlf) ?? b.tlf.replace(/\s/g, '')}`}
                        className="font-inter text-xs text-dark-teal hover:text-deep-teal transition-colors whitespace-nowrap"
                      >
                        {formatPhone(b.tlf)}
                      </a>
                    </td>
                    <td className="align-middle font-inter text-xs text-text-primary px-xs py-xs tabular-nums whitespace-nowrap">
                      {b.ankomst_plads_tid ?? '—'}
                    </td>
                    <td className="align-middle font-inter text-xs text-text-primary px-xs py-xs tabular-nums whitespace-nowrap">
                      {b.moedetid_fabrik ?? '—'}
                    </td>
                    <td className="align-middle px-xs py-xs text-right">
                      <span className="inline-flex items-center gap-xxxs justify-end">
                        {erSendt ? (
                          <>
                            <span
                              className="inline-flex items-center justify-center gap-xxxs font-inter text-xxs font-semibold text-good bg-good-bg border border-good/40 rounded-md px-xs min-h-touch min-w-touch"
                              aria-label={`Ordre sendt til chauffør ${b.chauffoer}`}
                            >
                              Ordre sendt til chauffør
                            </span>
                            <button
                              type="button"
                              onClick={() => sendSms(b.regnr)}
                              aria-label={`Gensend ordre til ${b.chauffoer}`}
                              className="inline-flex items-center justify-center gap-xxxs font-inter text-xxs font-semibold text-deep-teal bg-white border border-deep-teal/40 rounded-md px-xs hover:bg-soft-aqua hover:border-deep-teal transition-colors min-h-touch min-w-touch"
                            >
                              Gensend ordre
                            </button>
                          </>
                        ) : smsStatus === 'aendret_siden_afsendelse' ? (
                          <>
                            <span
                              className="inline-flex items-center justify-center gap-xxxs font-inter text-xxs font-semibold text-warning bg-warning-bg border border-warning/40 rounded-md px-xs min-h-touch min-w-touch"
                              aria-label={`Ordre opdateret siden afsendelse — ${b.chauffoer}`}
                            >
                              Ordre opdateret
                            </span>
                            <button
                              type="button"
                              onClick={() => sendSms(b.regnr)}
                              aria-label={`Gensend ordre til ${b.chauffoer}`}
                              className="inline-flex items-center justify-center gap-xxxs font-inter text-xxs font-semibold text-deep-teal bg-white border border-deep-teal/40 rounded-md px-xs hover:bg-soft-aqua hover:border-deep-teal transition-colors min-h-touch min-w-touch"
                            >
                              Gensend ordre
                            </button>
                          </>
                        ) : (
                          <>
                            <span
                              className="inline-flex items-center justify-center gap-xxxs font-inter text-xxs text-text-muted border border-hairline rounded-md px-xs min-h-touch min-w-touch"
                              aria-label={`Ordre afventer afsendelse — ${b.chauffoer}`}
                            >
                              Afventer afsendelse
                            </span>
                            <button
                              type="button"
                              onClick={() => sendSms(b.regnr)}
                              aria-label={`Send ordre til ${b.chauffoer} nu`}
                              className="inline-flex items-center justify-center gap-xxxs font-inter text-xxs font-semibold text-deep-teal bg-white border border-deep-teal/40 rounded-md px-xs hover:bg-soft-aqua hover:border-deep-teal transition-colors min-h-touch min-w-touch"
                            >
                              Send ordre nu
                            </button>
                          </>
                        )}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {/* Expand-knap — kun synlig når der er >3 biler */}
        {bilerSorted.length > TABEL_DEFAULT && (
          <div className="border-t border-good/15 px-xs py-xxxs">
            <button
              type="button"
              onClick={() => setBilerTableExpanded(e => !e)}
              className="w-full flex items-center justify-center gap-xxxs font-inter text-xxs font-medium text-text-muted hover:text-deep-teal transition-colors min-h-touch"
              aria-expanded={bilerTableExpanded}
            >
              {bilerTableExpanded ? (
                <>
                  <ChevronUp size={13} aria-hidden="true" /> Vis færre
                </>
              ) : (
                <>
                  <ChevronDown size={13} aria-hidden="true" /> Vis alle ({bilerSorted.length})
                </>
              )}
            </button>
          </div>
        )}
      </div>
    )
  }

  /**
   * Renderer materiel-transport-tabel for en given liste af materiel-items.
   * Slice/expand-state (materielTableExpanded) er stadig delt på komponent-niveau.
   * @param items     - materiel-items (allerede filtreret af kalderen)
   * @param keyPrefix - præfiks til React key for at undgå dublet-keys i samleordre
   */
  function renderMaterielTabel(
    items: import('../../../types').ConfirmedMaterielItem[],
    keyPrefix: string,
  ) {
    const TABEL_DEFAULT = 3
    const optælTyper = (typer: string[]): string => {
      const m = new Map<string, number>()
      typer.forEach(t => m.set(t, (m.get(t) ?? 0) + 1))
      return Array.from(m.entries()).map(([t, n]) => `${n}× ${t}`).join(' · ')
    }
    const seenRegnr = new Set<string>()
    const materielBilerUnik = items.filter(m => {
      if (seenRegnr.has(m.regnr)) return false
      seenRegnr.add(m.regnr)
      return true
    })
    const byTid = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0)
    const materielSorted = [...materielBilerUnik].sort((a, b) => byTid(a.ankomst_plads_tid ?? '', b.ankomst_plads_tid ?? ''))
    const materielVis = materielTableExpanded ? materielSorted : materielSorted.slice(0, TABEL_DEFAULT)
    const materielTypeTekst = optælTyper(items.map(m => m.transportType))
    return (
      <div className="overflow-hidden rounded-xl border border-good/30 bg-good-bg">
        <div className="flex items-center justify-between px-sm py-xs border-b border-good/20">
          <div className="flex items-center gap-xs">
            <span className="font-inter text-xxs font-medium tracking-widest uppercase text-text-muted">Materiel transport</span>
          </div>
          <span className="font-poppins font-semibold text-sm text-text-primary">{materielTypeTekst}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-good/15 bg-good-bg/60">
                <th className="text-left font-inter text-xxs font-semibold text-text-muted uppercase tracking-widest px-xs py-xxxs whitespace-nowrap">Anlæg</th>
                <th className="text-left font-inter text-xxs font-semibold text-text-muted uppercase tracking-widest px-xs py-xxxs whitespace-nowrap">Beskrivelse</th>
                <th className="text-left font-inter text-xxs font-semibold text-text-muted uppercase tracking-widest px-xs py-xxxs whitespace-nowrap">Transport</th>
                <th className="text-left font-inter text-xxs font-semibold text-text-muted uppercase tracking-widest px-xs py-xxxs whitespace-nowrap">Chauffør</th>
                <th className="text-left font-inter text-xxs font-semibold text-text-muted uppercase tracking-widest px-xs py-xxxs whitespace-nowrap">Telefon</th>
                <th className="text-left font-inter text-xxs font-semibold text-text-muted uppercase tracking-widest px-xs py-xxxs whitespace-nowrap">Ankomst</th>
                <th className="text-right font-inter text-xxs font-semibold text-text-muted uppercase tracking-widest px-xs py-xxxs whitespace-nowrap">SMS</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                // Saml alle items der hører til de synlige transport-biler (én bil kan bære flere anlæg)
                const synligeRegnr = new Set(materielVis.map(m => m.regnr))
                const synligeItems = items.filter(m => synligeRegnr.has(m.regnr))
                // Konsolideringsnøgle = regnr (unikt pr. transport-bil; samme bil = samme chauffør).
                // SMS-knap vises KUN på første række pr. regnr — øvrige rækker er tom td (rowspan emuleret).
                const seenSmsRegnr = new Set<string>()
                return synligeItems.map((m, i) => {
                  const isLast = i === synligeItems.length - 1 && !(!materielTableExpanded && materielSorted.length > TABEL_DEFAULT)
                  // Er dette den første enhed for denne transport-bil (chauffør)?
                  const erFoersteForChauffoer = !seenSmsRegnr.has(m.regnr)
                  if (erFoersteForChauffoer) seenSmsRegnr.add(m.regnr)
                  // SMS-status keyed by regnr (chauffør-niveau)
                  const materielSmsStatus = materielSmsStatusMap[m.regnr] ?? 'ikke_sendt'
                  const erSendt = materielSmsStatus === 'sendt'
                  return (
                    <tr key={`${keyPrefix}-${m.resourceId}`} className={isLast ? '' : 'border-b border-good/15'}>
                      <td className="align-middle font-inter text-xs font-semibold text-text-primary px-xs py-xs whitespace-nowrap">{m.anlaegsNr}</td>
                      <td className="align-middle font-inter text-xs text-text-primary px-xs py-xs">{m.beskrivelse}</td>
                      <td className="align-middle px-xs py-xs whitespace-nowrap">
                        <span className="font-inter text-xs tabular-nums text-text-primary">{formatRegnr(m.regnr)}</span>
                        <span className="font-inter text-xs text-text-muted ml-xxxs">({m.transportType})</span>
                      </td>
                      <td className="align-middle font-inter text-xs text-text-primary px-xs py-xs">{m.chauffoer}</td>
                      <td className="align-middle px-xs py-xs">
                        <a
                          href={`tel:${toE164(m.tlf) ?? m.tlf.replace(/\s/g, '')}`}
                          className="font-inter text-xs text-dark-teal hover:text-deep-teal transition-colors whitespace-nowrap"
                        >
                          {formatPhone(m.tlf)}
                        </a>
                      </td>
                      <td className="align-middle font-inter text-xs text-text-primary px-xs py-xs tabular-nums whitespace-nowrap">
                        {m.ankomst_plads_tid ?? '—'}
                      </td>
                      {/* SMS-kolonne — konsolideret pr. chauffør (regnr-nøgle).
                          Kun første række pr. chauffør viser knap/pille; øvrige rækker er tomme. */}
                      <td className="align-middle px-xs py-xs text-right">
                        {erFoersteForChauffoer ? (
                          <span className="inline-flex items-center gap-xxxs justify-end">
                            {erSendt ? (
                              <>
                                <span
                                  className="inline-flex items-center justify-center gap-xxxs font-inter text-xxs font-semibold text-good bg-good-bg border border-good/40 rounded-md px-xs min-h-touch min-w-touch"
                                  aria-label={`Ordre sendt til chauffør ${m.chauffoer}`}
                                >
                                  Ordre sendt til chauffør
                                </span>
                                <button
                                  type="button"
                                  onClick={() => sendMaterielSms(m.regnr)}
                                  aria-label={`Gensend ordre til ${m.chauffoer}`}
                                  className="inline-flex items-center justify-center gap-xxxs font-inter text-xxs font-semibold text-deep-teal bg-white border border-deep-teal/40 rounded-md px-xs hover:bg-soft-aqua hover:border-deep-teal transition-colors min-h-touch min-w-touch"
                                >
                                  Gensend ordre
                                </button>
                              </>
                            ) : materielSmsStatus === 'aendret_siden_afsendelse' ? (
                              <>
                                <span
                                  className="inline-flex items-center justify-center gap-xxxs font-inter text-xxs font-semibold text-warning bg-warning-bg border border-warning/40 rounded-md px-xs min-h-touch min-w-touch"
                                  aria-label={`Ordre opdateret siden afsendelse — ${m.chauffoer}`}
                                >
                                  Ordre opdateret
                                </span>
                                <button
                                  type="button"
                                  onClick={() => sendMaterielSms(m.regnr)}
                                  aria-label={`Gensend ordre til ${m.chauffoer}`}
                                  className="inline-flex items-center justify-center gap-xxxs font-inter text-xxs font-semibold text-deep-teal bg-white border border-deep-teal/40 rounded-md px-xs hover:bg-soft-aqua hover:border-deep-teal transition-colors min-h-touch min-w-touch"
                                >
                                  Gensend ordre
                                </button>
                              </>
                            ) : (
                              <>
                                <span
                                  className="inline-flex items-center justify-center gap-xxxs font-inter text-xxs text-text-muted border border-hairline rounded-md px-xs min-h-touch min-w-touch"
                                  aria-label={`Ordre afventer afsendelse — ${m.chauffoer}`}
                                >
                                  Afventer afsendelse
                                </span>
                                <button
                                  type="button"
                                  onClick={() => sendMaterielSms(m.regnr)}
                                  aria-label={`Send ordre til ${m.chauffoer} nu`}
                                  className="inline-flex items-center justify-center gap-xxxs font-inter text-xxs font-semibold text-deep-teal bg-white border border-deep-teal/40 rounded-md px-xs hover:bg-soft-aqua hover:border-deep-teal transition-colors min-h-touch min-w-touch"
                                >
                                  Send ordre nu
                                </button>
                              </>
                            )}
                          </span>
                        ) : null}
                      </td>
                    </tr>
                  )
                })
              })()}
            </tbody>
          </table>
        </div>
        {materielSorted.length > TABEL_DEFAULT && (
          <div className="border-t border-good/15 px-xs py-xxxs">
            <button
              type="button"
              onClick={() => setMaterielTableExpanded(e => !e)}
              className="w-full flex items-center justify-center gap-xxxs font-inter text-xxs font-medium text-text-muted hover:text-deep-teal transition-colors min-h-touch"
              aria-expanded={materielTableExpanded}
            >
              {materielTableExpanded ? (
                <>
                  <ChevronUp size={13} aria-hidden="true" /> Vis færre
                </>
              ) : (
                <>
                  <ChevronDown size={13} aria-hidden="true" /> Vis alle ({materielSorted.length})
                </>
              )}
            </button>
          </div>
        )}
      </div>
    )
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  // ── Samleordre-mode: fulde tabeller pr. child-ordre (Trin B — LÅST 2026-07-01) ──
  // Viser de SAMME fulde biler/materiel-tabeller som enkelt-ordre,
  // men partitioneret pr. child via bilerForChild/materielForChild.
  // Enkelt-ordre-branchen nedenfor forbliver uændret.
  if (isSamleordreMode && samleordreCtx) {
    const asfaltBilerAlle = (vognmandBekraeftelse?.biler ?? []).filter(b => !b.er_materiel_bil)
    const materielItemsAlle = vognmandMaterielBekraeftelse?.items ?? []
    return (
      <div className="flex flex-col gap-xs -mt-[48px]">
        <h2 className="font-poppins font-semibold text-xl text-deep-teal leading-tight mb-sm">Bekræftede biler</h2>
        <div className="flex flex-col gap-md">
          {samleordreCtx.children.map((child, i) => {
            const childBiler = bilerForChild(child, asfaltBilerAlle)
            const childMateriel = materielForChild(child, materielItemsAlle)
            return (
              <div key={child.orderNumber} className={i > 0 ? 'mt-md' : undefined}>
                {/* Sub-header pr. child — 1:1 kopi af MaterielleveringSection.tsx L229-242 */}
                <div className="flex items-center gap-xs mb-xs">
                  <span
                    className={[
                      'w-[8px] h-[8px] rounded-full flex-shrink-0',
                      child.isAnchor
                        ? 'bg-yellow shadow-[0_0_0_2px_rgba(254,238,50,0.35)]'
                        : 'bg-transparent border-2 border-hairline-2',
                    ].join(' ')}
                    aria-hidden="true"
                  />
                  <h3 className="font-poppins font-semibold text-md text-deep-teal">
                    {child.udfoerelseSted}
                  </h3>
                </div>
                {childBiler.length > 0
                  ? renderBilerTabel(childBiler, child.orderNumber)
                  : (
                    <div className="bg-white border border-hairline rounded-xl px-sm py-sm flex items-center gap-xs text-text-muted">
                      <span className="font-inter text-sm">Ingen bekræftede biler</span>
                    </div>
                  )}
                {child.isAnchor && childMateriel.length > 0 && renderMaterielTabel(childMateriel, child.orderNumber)}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <>
      {/* ── Status-bokse ────────────────────────────────────────────────
          Kun synlige når Ordredetaljer er expanded.
          Én toggle styrer både Ordredetaljer OG status-boksene. */}
      {/* TODO (produktion): Sektion filtreres på (selectedProductId, selectedDate) */}
      <div className="flex flex-col gap-xs -mt-[48px]">
        <h2 className="font-poppins font-semibold text-xl text-deep-teal leading-tight mb-sm">Bekræftede biler</h2>
        {/* Alle 7 bokse i ét fælles grid — samme bredde og højde via auto-rows-fr */}
        {(() => {
          // Per-child værdier når i samleordre-mode — fallback til global state for enkelt-ordre
          const activeChild = isSamleordreMode && samleordreCtx
            ? samleordreCtx.children.find(c => c.orderNumber === samleordreTabOrderNr)
            : undefined

          const displayBilerBekraeftet = activeChild !== undefined ? activeChild.vognmandBekraeftet : !!vognmandBekraeftelse
          const displayAntalMateriel = activeChild !== undefined ? activeChild.antalMateriel : (vognmandMaterielBekraeftelse?.items.length ?? 0)
          const displayMaterielBekraeftet = activeChild !== undefined ? activeChild.materielBekraeftet : !!(vognmandMaterielBekraeftelse && vognmandMaterielBekraeftelse.items.length > 0)
          // ── Bekræftet detalje (LÅST 2026-06-13) ──────────────────────────
          // Bilbestillingen er en ønskeliste; vognmandens bekræftede data kan afvige.
          // Vises kun i enkelt-ordre (samleordre har ikke per-child bil-liste i mock).
          // TODO: Erstat med Supabase — confirmed_vehicles[] pr. (ordre, dag).

          // Biler-boks: asfalt-biler (materiel-biler hører til Materiel-boksen)
          const asfaltBiler = (vognmandBekraeftelse?.biler ?? []).filter(b => !b.er_materiel_bil)
          const visBilDetalje = activeChild === undefined && displayBilerBekraeftet && asfaltBiler.length > 0

          // Materiel-boks: alle items (tabel-sortering og slice beregnes i renderMaterielTabel)
          const materielItems = vognmandMaterielBekraeftelse?.items ?? []
          const visMaterielDetalje = activeChild === undefined && displayMaterielBekraeftet && materielItems.length > 0

          return (
            <div className="flex flex-col gap-sm">
              {/* Biler — tabel i enkelt-ordre bekræftet-tilstand; status-kort ellers */}
              {/* ── Biler-tabel (bekræftet, enkelt-ordre) — FF Trin 7 + 7b (LÅST 2026-06-15) ── */}
              {visBilDetalje ? renderBilerTabel(asfaltBiler, 'single') : null}

              {/* ── Materiel transport — etape-bewidst branch (Round 3 — LÅST 2026-06-23) ─────────
                  'planlaeg' | 'ny-etape' → eksisterende tabel (transport sker denne dag)
                  'paa-pladsen'           → read-only MaterielPaaPladsenTilstand (transport afsluttet)
                  'dvale'                 → MaterielDvaleTilstand (gap mellem etaper)
                  Asfalt-biler-sektionen OVENFOR er urørt — den er IKKE etape-branchet.
                  TODO: Erstat MATERIEL_ENHEDER med Supabase-data når klar. */}
              {(materielUiState === 'paa-pladsen') ? (() => {
                // Find aktiv etape for selectedDate
                const aktivEtape = etaper.find(e => e.dates.includes(selectedDate))
                if (!aktivEtape) return null
                // Map lokale MaterielEnhed → MaterielEnhedTilstand (id, plantNumber, description)
                const tilstandEnheder: MaterielEnhedTilstand[] = MATERIEL_ENHEDER.map((m: MaterielEnhed) => ({
                  id: m.anlaegsNr,
                  plantNumber: m.anlaegsNr,
                  description: m.beskrivelse,
                }))
                return (
                  <MaterielPaaPladsenTilstand
                    resources={tilstandEnheder}
                    etape={aktivEtape}
                    transportPlaner={transportPlaner}
                  />
                )
              })() : (materielUiState === 'dvale') ? (() => {
                // Find næste etapes startdato — vis til formanden hvis planlagt
                const naestEtape = etaper.find(e => e.startDate > selectedDate)
                return (
                  <MaterielDvaleTilstand
                    naestEtapeStartDato={naestEtape?.startDate}
                  />
                )
              })() : (
              /* 'planlaeg' | 'ny-etape' — eksisterende materiel-transport-tabel (uændret) */
              /* Materiel transport — tabel i enkelt-ordre bekræftet-tilstand; status-kort ellers */
              /* ── Materiel-tabel (bekræftet, enkelt-ordre) — FF Trin 7 (LÅST 2026-06-15) ── */
              visMaterielDetalje ? renderMaterielTabel(materielItems, 'single')
              : (
                /* ── Materiel status-kort (ikke-bekræftet eller samleordre) — uændret ── */
                <div className={`flex flex-col items-start min-w-0 w-full min-h-[120px] px-sm py-xs rounded-xl border ${displayMaterielBekraeftet ? 'bg-good-bg border-good/30' : 'bg-surface border-hairline'}`}>
                  <div className="w-full flex items-center justify-between gap-xs">
                    <span className="font-inter text-xxs font-medium tracking-widest uppercase text-text-muted">Materiel transport</span>
                    {displayMaterielBekraeftet && (
                      <span className="font-inter text-xxs font-semibold text-good">Bekræftet</span>
                    )}
                  </div>
                  <div className="flex-1 flex items-end pb-xxxs">
                    <span className="font-poppins font-semibold text-xl text-text-primary tabular-nums">{displayAntalMateriel}</span>
                  </div>
                  <span className="font-inter text-xs text-text-muted min-h-[1em]">
                    {displayMaterielBekraeftet ? 'Bekræftet vognmand' : 'Afventer bekræftelse'}
                  </span>
                </div>
              /* visMaterielDetalje-ternary slutter */
              )
              /* planlaeg/ny-etape-branch slutter */
              )}
            </div>
          )
        })()}
      </div>
    </>
  )
}
