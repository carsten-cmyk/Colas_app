/**
 * PROTOTYPE — BilTonsAfregningSection
 *
 * Extraction fra AfregningContent.tsx L591–1306 (ORDRET — ingen redesign).
 * Viser "Bil- og tonsafregning"-sektionen:
 *   - Biltabel med chauffør/regnr/biltype/kategori/afregning-kolonne
 *   - Ekspanderbar afregnings-række per bil med:
 *     - Afregningsform-override (akkord/timeløn pr. bil)
 *     - 1,5-times-regel banner
 *     - Afregnings-felter (timer/ventetid/hviletid for time; tons/ventetid for akkord)
 *     - Timer-fordeling på samleordre-children (time-biler)
 *     - Vejesedler med multilæs fordeling (tons + ventetid per ordre)
 *     - Chauffør-kommentar (read-only)
 *   - Subtotaler pr. afregningsform (akkord/time)
 *
 * State EJES af container (AfregningContent) og trådes ind som props.
 * Helpers (beregnAfregningEligibility, toggleAfregning, updateAfregningField,
 *           godkendAfregning, genaabnAfregning) trådes ind som callbacks.
 *
 * TODO: Erstat med Supabase når klar — confirmed_vehicles[], vejebilag-tabel, afregning_data-tabel.
 */

import {
  ChevronDown, ChevronUp, CheckCircle2, Layers, MessageSquare, AlertTriangle,
} from 'lucide-react'
import { Fragment } from 'react'
import { formatPhone, toE164 } from '@shared/utils/phone'
import { formatRegnr } from '@shared/utils/regnr'
import type {
  VognmandBekraeftelse,
  DayPlan,
  SamleordreContext,
  ChauffoerAfregning,
  AfregningType,
} from '../../../types'

// ─── Props ───────────────────────────────────────────────────────────────────

export interface BilTonsAfregningsSectionProps {
  /** Dagens dag-plan — sektionen vises kun når todayDay er sat */
  todayDay?: DayPlan
  /** Vognmands bekræftelse med liste af asfalt-biler og materiel-biler */
  vognmandBekraeftelse?: VognmandBekraeftelse
  /** True når Ordre-plan vises i samleordre-kontekst */
  isSamleordreMode?: boolean
  /** Samleordre-context med children (anchor + andre ordrer) når isSamleordreMode === true */
  samleordreCtx?: SamleordreContext | null
  /** Aktivt ordrenummer i samleordre-tab */
  samleordreTabOrderNr?: string
  /** Fase 2: biltype→afregningsform fra Planlægningens kørselOrders for dagen */
  biltypeAfregning?: Record<string, 'time' | 'akkord'>

  // ── Cross-cutting state (EJES af container) ──────────────────────────────────
  /** Per-bil override af afregningsform — key = bil.regnr */
  bilAfregningOverride: Record<string, AfregningType>
  setBilAfregningOverride: React.Dispatch<React.SetStateAction<Record<string, AfregningType>>>

  /** Vejeseddel-fordeling state — key = vejeseddel.id */
  vejeseddelFordelinger: Record<string, { ordre_id: string; tons: number }[]>
  setVejeseddelFordelinger: React.Dispatch<React.SetStateAction<Record<string, { ordre_id: string; tons: number }[]>>>

  /** Hvilke vejesedler er ekspanderede */
  vejeseddelExpanded: Set<string>
  setVejeseddelExpanded: React.Dispatch<React.SetStateAction<Set<string>>>

  /** Vejeseddel ventetids-fordeling per ordre */
  vejeseddelVentetidFordelinger: Record<string, Record<string, number>>
  setVejeseddelVentetidFordelinger: React.Dispatch<React.SetStateAction<Record<string, Record<string, number>>>>

  /** Timer-fordeling på samleordre-children — key = bil.regnr */
  bilTimerFordelinger: Record<string, Record<string, number>>
  setBilTimerFordelinger: React.Dispatch<React.SetStateAction<Record<string, Record<string, number>>>>

  /** Ventetids-fordeling på samleordre-children — key = bil.regnr */
  bilVentetidFordelinger: Record<string, Record<string, number>>
  setBilVentetidFordelinger: React.Dispatch<React.SetStateAction<Record<string, Record<string, number>>>>

  /** Hvilke bil-timer-fordelinger er åbne */
  bilTimerFordelingOpen: Set<string>
  setBilTimerFordelingOpen: React.Dispatch<React.SetStateAction<Set<string>>>

  /** Hvilke afregnings-rækker er åbne */
  afregningOpen: Set<string>
  setAfregningOpen: React.Dispatch<React.SetStateAction<Set<string>>>

  /** Afregnings-data per bil-nøgle (regnr) */
  afregningData: Record<string, ChauffoerAfregning>
  setAfregningData: React.Dispatch<React.SetStateAction<Record<string, ChauffoerAfregning>>>

  // ── Callbacks fra container ────────────────────────────────────────────────
  /** Beregner effectiveType + manglerFordeling + kanAutoGodkendes for én bil */
  beregnAfregningEligibility: (
    bil: import('../../../types').ConfirmedTruck,
    afrData: ChauffoerAfregning | undefined,
    vejeseddelFordelingerMap: Record<string, { ordre_id: string; tons: number }[]>,
  ) => { effectiveType: AfregningType; manglerFordeling: boolean; kanAutoGodkendes: boolean }
  /** Toggler åben/lukket for en afregnings-række */
  toggleAfregning: (key: string) => void
  /** Opdaterer ét felt i afregningData for en bil */
  updateAfregningField: (key: string, field: keyof ChauffoerAfregning, value: number | string | boolean | undefined | null) => void
  /** Sætter godkendt_af_formand=true + lukker rækken */
  godkendAfregning: (key: string) => void
  /** Genåbner en godkendt afregning */
  genaabnAfregning: (key: string) => void
  /** Formatter timestamp til visning (fra container's formatTimestamp util) */
  formatTimestamp: (d: Date) => string
}

// ─── Komponent ───────────────────────────────────────────────────────────────

export function BilTonsAfregningSection({
  todayDay,
  vognmandBekraeftelse,
  isSamleordreMode,
  samleordreCtx,
  samleordreTabOrderNr: _samleordreTabOrderNr,
  biltypeAfregning,
  bilAfregningOverride,
  setBilAfregningOverride,
  vejeseddelFordelinger,
  setVejeseddelFordelinger,
  vejeseddelExpanded,
  setVejeseddelExpanded,
  vejeseddelVentetidFordelinger,
  setVejeseddelVentetidFordelinger,
  bilTimerFordelinger,
  setBilTimerFordelinger,
  bilVentetidFordelinger,
  setBilVentetidFordelinger,
  bilTimerFordelingOpen,
  setBilTimerFordelingOpen,
  afregningOpen,
  afregningData,
  beregnAfregningEligibility,
  toggleAfregning,
  updateAfregningField,
  godkendAfregning,
  genaabnAfregning,
}: BilTonsAfregningsSectionProps) {
  if (!todayDay) return null

  return (
    <section>
      <div className="mb-sm">
        <h2 className="font-poppins font-semibold text-xl text-text-primary">Bil- og tonsafregning</h2>
      </div>

      {vognmandBekraeftelse ? (
        <div className="overflow-hidden rounded-lg border border-hairline bg-surface">
          <table className="w-full">
                <thead>
                  <tr className="border-b border-hairline bg-soft-aqua">
                    <th className="text-left font-inter text-xxs font-semibold text-text-muted uppercase tracking-widest px-xs py-xxxs">Reg.nr.</th>
                    <th className="text-left font-inter text-xxs font-semibold text-text-muted uppercase tracking-widest px-xs py-xxxs">Chauffør</th>
                    <th className="text-left font-inter text-xxs font-semibold text-text-muted uppercase tracking-widest px-xs py-xxxs">Tlf.</th>
                    <th className="text-left font-inter text-xxs font-semibold text-text-muted uppercase tracking-widest px-xs py-xxxs">Biltype</th>
                    <th className="text-left font-inter text-xxs font-semibold text-text-muted uppercase tracking-widest px-xs py-xxxs">Kategori</th>
                    <th className="text-left font-inter text-xxs font-semibold text-text-muted uppercase tracking-widest px-xs py-xxxs">Indeholder</th>
                    <th className="text-right font-inter text-xxs font-semibold text-text-muted uppercase tracking-widest px-xs py-xxxs">Afregning</th>
                  </tr>
                </thead>
                <tbody>
                  {vognmandBekraeftelse.biler.map((bil, i) => {
                    const afregKey = bil.regnr
                    const afrData = afregningData[afregKey]
                    const isOpen = afregningOpen.has(afregKey)
                    const isGodkendt = afrData?.godkendt_af_formand ?? false
                    const bilVejesedlerCollapsed = bil.vejesedler ?? []
                    // 1,5-times-reglen: akkord-bil der ikke er aflæsset inden 1,5t → HELE dagens kørsel er timebaseret.
                    // Reglen er firm — ingen override. Flaget sidder på vejesedlerne (aflæsset_efter_1_5t).
                    // Fase 2: base-form = per-bil override → biltype→afregning-map (Planlægning) → afrData → 'time'
                    const baseType: AfregningType = bilAfregningOverride[afregKey] ?? biltypeAfregning?.[bil.biltype] ?? afrData?.afregning_type ?? 'time'
                    const isTimeForcedBy15Min = !bil.er_materiel_bil
                      && baseType === 'akkord'
                      && bilVejesedlerCollapsed.some(vs => vs.aflæsset_efter_1_5t)
                    // Materiel-biler afregnes ALTID på time. Akkord-biler med 1,5-times-overskridelse tvinges til time.
                    const effectiveType: AfregningType =
                      bil.er_materiel_bil || isTimeForcedBy15Min ? 'time' : baseType
                    const isLast = i === vognmandBekraeftelse.biler.length - 1

                    // ── Fordeling-blokering (collapsed) — Multilæs fjernet som visuel kategori ──────────
                    // harMultilaes bevares til fordeling-logik (mangler fordeling) men vises IKKE som badge
                    const harMultilaes = bilVejesedlerCollapsed.some(vs => vs.multilaes_flag)
                    const harPuljelaes = bilVejesedlerCollapsed.some(vs => vs.puljelaes_flag)
                    // Mangler fordeling: mindst én vejeseddel med multilaes_flag har sum != netto_tons
                    const manglerFordeling = harMultilaes && bilVejesedlerCollapsed.some(vs => {
                      if (!vs.multilaes_flag) return false
                      const fordeling = vejeseddelFordelinger[vs.id]
                        ?? vs.pre_fordeling.map(pf => ({ ordre_id: pf.ordre_id, tons: pf.tons }))
                      const sum = fordeling.reduce((s, f) => s + f.tons, 0)
                      return Math.abs(vs.netto_tons - sum) >= 0.05
                    })

                    return (
                      <Fragment key={afregKey}>
                        <tr key={bil.regnr} className={(!isLast || isOpen) ? 'border-b border-hairline' : ''}>
                          <td className="align-middle font-inter text-xs font-semibold text-text-primary px-xs py-xs tabular-nums">{formatRegnr(bil.regnr)}</td>
                          <td className="align-middle font-inter text-xs text-text-primary px-xs py-xs">{bil.chauffoer}</td>
                          <td className="align-middle px-xs py-xs">
                            <a href={`tel:${toE164(bil.tlf) ?? bil.tlf.replace(/\s/g, '')}`} className="font-inter text-xs text-dark-teal hover:text-deep-teal transition-colors">
                              {formatPhone(bil.tlf)}
                            </a>
                          </td>
                          <td className="align-middle px-xs py-xs">
                            <span className="font-inter text-xs text-text-muted">{bil.biltype}</span>
                          </td>
                          <td className="align-middle px-xs py-xs">
                            {bil.er_materiel_bil ? (
                              <span className="inline-flex items-center gap-xxxs bg-warn-bg text-text-secondary font-inter font-semibold text-xxs px-xs py-xxxs rounded-md uppercase tracking-wider">
                                Kørt materiel
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-xxxs bg-soft-aqua text-deep-teal font-inter font-semibold text-xxs px-xs py-xxxs rounded-md uppercase tracking-wider">
                                Asfaltkørsel
                              </span>
                            )}
                          </td>
                          {/* D. Læs-type kolonne — rød "Mangler fordeling" trumfer alt.
                              Multilæs fjernet som visuel kategori — kolonne viser kun fordeling-status og "Samles på en bil" (puljelæs). */}
                          <td className="align-middle px-xs py-xs">
                            {!isOpen && manglerFordeling ? (
                              <span className="inline-flex items-center gap-xxxs bg-bad/10 border border-bad text-bad font-inter font-semibold text-xxs px-xs py-xxxs rounded-md">
                                <AlertTriangle size={10} className="flex-shrink-0" aria-label="Mangler fordeling" />
                                Mangler fordeling
                              </span>
                            ) : harPuljelaes ? (
                              <span className="inline-flex items-center gap-xxxs bg-soft-aqua text-deep-teal font-inter font-semibold text-xxs px-xs py-xxxs rounded-md uppercase tracking-wider">
                                Samles på en bil
                              </span>
                            ) : null}
                          </td>
                          <td className="align-middle px-xs py-xs text-right">
                            {isGodkendt ? (
                              // Godkendt (auto el. manuel) → kollapset: grøn pille + "Vis afregning"-toggle
                              <div className="inline-flex items-center gap-xs">
                                {/* Fast min-bredde (bevidst fixed) så 'Auto-godkendt' og 'Godkendt' er lige lange */}
                                <span className="inline-flex items-center justify-center min-w-[112px] px-xs py-xxxs rounded-md bg-good text-white font-inter font-semibold text-xs">
                                  {afrData?.auto_godkendt ? 'Auto-godkendt' : 'Godkendt'}
                                </span>
                                <button
                                  onClick={() => toggleAfregning(afregKey)}
                                  className="inline-flex items-center gap-xxxs border border-hairline text-dark-teal font-inter font-semibold text-xs py-xxxs px-xs rounded-md hover:bg-surface-2 transition-colors"
                                >
                                  {isOpen ? 'Skjul' : 'Vis afregning'}
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => toggleAfregning(afregKey)}
                                className="inline-flex items-center gap-xxxs bg-yellow text-deep-teal font-inter font-semibold text-xs py-xxxs px-xs rounded-md hover:opacity-90 transition-opacity"
                              >
                                {isOpen ? 'Luk' : 'Lav afregning'}
                              </button>
                            )}
                          </td>
                        </tr>
                        {isOpen && (() => {
                          // ── Vejeseddel-hjælpere ──────────────────────────────────
                          const bilVejesedler = bil.vejesedler ?? []
                          // Dagens kørte tons = sum af alle vejesedler på bilen
                          const inheritedTons = bilVejesedler.reduce((s, vs) => s + vs.netto_tons, 0)
                          // 1,5-times-reglen er trådt i kraft hvis isTimeForcedBy15Min (beregnet i outer scope).
                          // effectiveType er allerede 'time' i dette tilfælde — vi viser banneret baseret på flaget.
                          const has1_5tRule = isTimeForcedBy15Min
                          const displayType: AfregningType = effectiveType

                          // B. Fordelings-blokering for godkend-knap:
                          // Multilæs-vejesedler der mangler komplet fordeling (sum != netto_tons)
                          // Puljelæs blokerer IKKE — tons går direkte til én ordre
                          const manglerFordelingExpanded = bilVejesedler.some(vs => {
                            if (!vs.multilaes_flag) return false
                            const fordeling = vejeseddelFordelinger[vs.id]
                              ?? vs.pre_fordeling.map(pf => ({ ordre_id: pf.ordre_id, tons: pf.tons }))
                            const sum = fordeling.reduce((s, f) => s + f.tons, 0)
                            return Math.abs(vs.netto_tons - sum) >= 0.05
                          })

                          return (
                          <tr key={`${bil.regnr}-expand`} className={!isLast ? 'border-b border-hairline' : ''}>
                            <td colSpan={7} className="px-xs pb-xs pt-xxxs">
                              <div className="bg-soft-aqua rounded-lg p-sm mt-xxxs border border-hairline">

                                {/* ── Afregningsform-override (pr. bil) ───────────── */}
                                {/* Formanden kan overstyre Planlægningens biltype-default her.
                                    Toggle vises altid, men låses når materiel-tvang eller 1,5-times-regel er aktiv. */}
                                {(() => {
                                  const isLocked = bil.er_materiel_bil || isTimeForcedBy15Min
                                  const lockReason = bil.er_materiel_bil
                                    ? 'Materiel — altid timeløn'
                                    : 'Over 1,5-times-reglen — tvunget timeløn'
                                  // baseType (beregnet i outer scope) reflekterer override-opslaget INDEN materiel/1,5t-tvang
                                  const toggleValue: AfregningType = baseType
                                  return (
                                    <div className="flex items-center gap-xs mb-sm">
                                      <span className="font-inter text-xxs text-text-muted uppercase tracking-widest">Afregningsform</span>
                                      <div className={[
                                        'flex bg-surface-2 rounded-md p-xxxs border border-hairline w-fit',
                                        isLocked ? 'opacity-60' : '',
                                      ].join(' ')}>
                                        {(['akkord', 'time'] as const).map(type => {
                                          const isActive = toggleValue === type
                                          const label = type === 'akkord' ? 'Akkord' : 'Timeløn'
                                          return (
                                            <button
                                              key={type}
                                              disabled={isLocked || isGodkendt}
                                              aria-pressed={isActive}
                                              onClick={() => !isLocked && !isGodkendt && setBilAfregningOverride(prev => ({ ...prev, [afregKey]: type }))}
                                              className={[
                                                'px-xs py-xxxs rounded-sm font-inter text-xxs font-semibold transition-colors',
                                                isActive
                                                  ? 'bg-dark-teal text-white'
                                                  : 'text-text-muted hover:bg-soft-aqua',
                                                isLocked ? 'cursor-not-allowed' : '',
                                              ].join(' ')}
                                            >
                                              {label}
                                            </button>
                                          )
                                        })}
                                      </div>
                                      {isLocked && (
                                        <span className="font-inter text-xxs text-text-muted italic">{lockReason}</span>
                                      )}
                                    </div>
                                  )
                                })()}

                                {/* ── 1,5-times-regel banner (akkord-biler) ──────── */}
                                {has1_5tRule && (
                                  <div className="inline-flex items-center gap-xs bg-warn-bg border border-yellow px-sm py-xs rounded-lg mb-sm">
                                    <AlertTriangle size={14} className="text-warning flex-shrink-0" />
                                    <span className="font-inter text-xs font-medium text-deep-teal">
                                      1,5-times-reglen trådte i kraft for denne bil
                                    </span>
                                  </div>
                                )}

                                {/* ── Afregnings-felter ──────────────────────────── */}
                                <div className="flex flex-wrap gap-xs items-end">
                                  {displayType === 'time' ? (
                                    <>
                                      <div className="flex flex-col gap-xxxs">
                                        <label className="font-inter text-xxs text-text-muted uppercase tracking-widest">
                                          {bil.er_materiel_bil ? 'Timer' : 'Køretimer'}
                                        </label>
                                        <input
                                          type="number"
                                          step="0.5"
                                          value={afrData?.koretimer ?? ''}
                                          disabled={isGodkendt}
                                          onChange={e => updateAfregningField(afregKey, 'koretimer', parseFloat(e.target.value) || 0)}
                                          className="bg-surface border border-hairline rounded-md px-xs py-xxxs text-sm tabular-nums w-[120px] focus:outline-none focus:border-dark-teal disabled:opacity-60"
                                        />
                                      </div>
                                      <div className="flex flex-col gap-xxxs">
                                        <label className="font-inter text-xxs text-text-muted uppercase tracking-widest">Ventetid</label>
                                        <input
                                          type="number"
                                          step="0.5"
                                          value={afrData?.ventetid ?? ''}
                                          disabled={isGodkendt}
                                          onChange={e => updateAfregningField(afregKey, 'ventetid', parseFloat(e.target.value) || 0)}
                                          className="bg-surface border border-hairline rounded-md px-xs py-xxxs text-sm tabular-nums w-[120px] focus:outline-none focus:border-dark-teal disabled:opacity-60"
                                        />
                                      </div>
                                      {/* Hviletid-felt kun for asfalt-biler — ikke relevant for materiel */}
                                      {!bil.er_materiel_bil && (
                                        <div className="flex flex-col gap-xxxs">
                                          <label className="font-inter text-xxs text-text-muted uppercase tracking-widest">Hviletid</label>
                                          <input
                                            type="number"
                                            step="0.5"
                                            value={afrData?.hviletid ?? ''}
                                            disabled={isGodkendt}
                                            onChange={e => updateAfregningField(afregKey, 'hviletid', parseFloat(e.target.value) || 0)}
                                            className="bg-surface border border-hairline rounded-md px-xs py-xxxs text-sm tabular-nums w-[120px] focus:outline-none focus:border-dark-teal disabled:opacity-60"
                                          />
                                        </div>
                                      )}
                                    </>
                                  ) : (
                                    <>
                                      {/* A. Akkord — Tons arves fra vejesedler (read-only). Label: "Dagens kørte tons" */}
                                      {bilVejesedler.length > 0 ? (
                                        <div className="flex flex-col gap-xxxs">
                                          <label className="font-inter text-xxs text-text-muted uppercase tracking-widest">Dagens kørte tons</label>
                                          <div className="flex items-center gap-xs bg-surface border border-hairline rounded-md px-xs py-xxxs w-fit whitespace-nowrap">
                                            <Layers size={12} className="text-text-muted flex-shrink-0" />
                                            <span className="font-inter text-sm tabular-nums font-semibold text-text-primary">{inheritedTons.toFixed(1).replace('.', ',')} Tons</span>
                                            <span className="font-inter text-xxs text-text-muted">(fra vejesedler)</span>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="flex flex-col gap-xxxs">
                                          <label className="font-inter text-xxs text-text-muted uppercase tracking-widest">Tons kørt</label>
                                          <input
                                            type="number"
                                            value={afrData?.tons_koert ?? ''}
                                            disabled={isGodkendt}
                                            pattern="[0-9]*[.,]?[0-9]*"
                                            onChange={e => {
                                              // F. Filtrer non-numeric input
                                              const raw = e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.')
                                              updateAfregningField(afregKey, 'tons_koert', parseFloat(raw) || 0)
                                            }}
                                            className="bg-surface border border-hairline rounded-md px-xs py-xxxs text-sm tabular-nums w-[120px] focus:outline-none focus:border-dark-teal disabled:opacity-60 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                          />
                                        </div>
                                      )}
                                      {/* A. "Akkord-sats"-blokken er fjernet — økonomi er ikke formands domæne */}
                                      <div className="flex flex-col gap-xxxs">
                                        <label className="font-inter text-xxs text-text-muted uppercase tracking-widest">Ventetid</label>
                                        <input
                                          type="number"
                                          step="0.5"
                                          value={afrData?.ventetid ?? ''}
                                          disabled={isGodkendt}
                                          onChange={e => updateAfregningField(afregKey, 'ventetid', parseFloat(e.target.value) || 0)}
                                          className="bg-surface border border-hairline rounded-md px-xs py-xxxs text-sm tabular-nums w-[120px] focus:outline-none focus:border-dark-teal disabled:opacity-60"
                                        />
                                      </div>
                                    </>
                                  )}

                                  {isGodkendt ? (
                                    <div className="flex flex-col gap-xxxs ml-xs">
                                      <span className="font-inter text-xxs text-text-muted">{afrData?.godkendt_tidspunkt}</span>
                                      <button
                                        onClick={() => genaabnAfregning(afregKey)}
                                        className="font-inter text-xs text-text-muted underline cursor-pointer hover:text-text-primary transition-colors"
                                      >
                                        Genåbn afregning
                                      </button>
                                    </div>
                                  ) : (
                                    // B. Godkend-knap disables med tooltip hvis multilæs-fordeling mangler
                                    <div className="relative self-end" title={manglerFordelingExpanded ? 'Tons skal fordeles først' : undefined}>
                                      <button
                                        onClick={() => { if (!manglerFordelingExpanded) godkendAfregning(afregKey) }}
                                        disabled={manglerFordelingExpanded}
                                        aria-disabled={manglerFordelingExpanded}
                                        className={[
                                          'inline-flex items-center gap-xs font-inter font-medium text-sm px-sm py-xxxs rounded-lg transition-opacity',
                                          manglerFordelingExpanded
                                            ? 'bg-surface border border-hairline text-text-muted cursor-not-allowed opacity-50'
                                            : 'bg-yellow text-deep-teal font-semibold hover:opacity-90',
                                        ].join(' ')}
                                      >
                                        <CheckCircle2 size={14} />
                                        Godkend afregning
                                      </button>
                                    </div>
                                  )}
                                </div>

                                {/* TODO: Fase 2 — returlæs (manuel formand-registrering) flyttes hertil */}

                                {/* A. "Beregnet beløb pr. ordre"-sektionen er fjernet — økonomi er ikke formands domæne */}

                                {/* ── Timer-fordeling (time-biler på samleordre med 2+ children) ── */}
                                {displayType === 'time' && isSamleordreMode && samleordreCtx && samleordreCtx.children.length >= 2 && (() => {
                                  const koretimer = afrData?.koretimer ?? 0
                                  const ventetid = afrData?.ventetid ?? 0
                                  const isTimerOpen = bilTimerFordelingOpen.has(afregKey)
                                  // Initialisér fordeling: alt på anchor, resten 0
                                  const anchorChild = samleordreCtx.children.find(c => c.isAnchor) ?? samleordreCtx.children[0]
                                  const currentKoretimer: Record<string, number> = bilTimerFordelinger[afregKey]
                                    ?? Object.fromEntries(samleordreCtx.children.map(c => [
                                      c.orderNumber,
                                      c.orderNumber === anchorChild.orderNumber ? koretimer : 0,
                                    ]))
                                  const currentVentetid: Record<string, number> = bilVentetidFordelinger[afregKey]
                                    ?? Object.fromEntries(samleordreCtx.children.map(c => [
                                      c.orderNumber,
                                      c.orderNumber === anchorChild.orderNumber ? ventetid : 0,
                                    ]))
                                  const koretimerSum = Object.values(currentKoretimer).reduce((s, t) => s + t, 0)
                                  const ventetidSum = Object.values(currentVentetid).reduce((s, t) => s + t, 0)
                                  const koretimerRest = koretimer - koretimerSum
                                  const ventetidRest = ventetid - ventetidSum
                                  const koretimerMatch = Math.abs(koretimerRest) < 0.05
                                  const ventetidMatch = Math.abs(ventetidRest) < 0.05

                                  return (
                                    <div className="mt-sm border-t border-hairline pt-sm">
                                      {/* Overskrift + toggle-knap — samme mønster som "Fordel tons"-knap på vejeseddel */}
                                      <div className="flex items-center justify-between mb-xs">
                                        <span className="font-inter text-xxs text-text-muted uppercase tracking-widest">
                                          Fordel timer på ordrer
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => setBilTimerFordelingOpen(prev => {
                                            const next = new Set(prev)
                                            if (next.has(afregKey)) next.delete(afregKey); else next.add(afregKey)
                                            return next
                                          })}
                                          className="inline-flex items-center gap-xxxs font-inter text-xs text-deep-teal font-semibold hover:opacity-80 transition-opacity whitespace-nowrap min-h-[28px] px-xs"
                                        >
                                          {isTimerOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                          {isTimerOpen ? 'Skjul' : 'Fordel timer'}
                                        </button>
                                      </div>

                                      {isTimerOpen && (
                                        <div className="bg-surface border border-hairline rounded-md overflow-hidden">
                                          <div className="px-xs pb-xs pt-xs bg-soft-aqua">
                                            {/* Kolonne-labels */}
                                            <div className="flex items-center gap-xs mb-xxxs">
                                              <div className="w-2 h-2 flex-shrink-0" />
                                              <span className="font-inter text-xs flex-1 min-w-0" />
                                              <span className="font-inter text-xxs text-text-muted uppercase tracking-widest w-[90px] text-center">Køretimer</span>
                                              <span className="font-inter text-xxs text-text-muted uppercase tracking-widest w-[90px] text-center">Ventetid</span>
                                            </div>
                                            <div className="flex flex-col gap-xs">
                                              {samleordreCtx.children
                                                .slice()
                                                .sort((a, b) => (a.isAnchor ? -1 : b.isAnchor ? 1 : 0))
                                                .map((child) => {
                                                  const childKoretimer = currentKoretimer[child.orderNumber] ?? 0
                                                  const childVentetid = currentVentetid[child.orderNumber] ?? 0
                                                  return (
                                                    <div key={child.orderNumber} className="flex items-center gap-xs">
                                                      {/* Anchor-markering: gul prik — præcis som tons-fordeling */}
                                                      <div className={[
                                                        'w-2 h-2 rounded-full flex-shrink-0',
                                                        child.isAnchor ? 'bg-yellow' : 'bg-hairline-2',
                                                      ].join(' ')} title={child.isAnchor ? 'Anchor-ordre' : ''} />
                                                      <span className={[
                                                        'font-inter text-xs flex-1 min-w-0 truncate',
                                                        child.isAnchor ? 'font-semibold text-text-primary' : 'text-text-secondary',
                                                      ].join(' ')}>
                                                        {child.orderNumber} · {child.stedLabel}
                                                      </span>
                                                      {/* Køretimer-input */}
                                                      <input
                                                        type="number"
                                                        value={childKoretimer}
                                                        disabled={isGodkendt}
                                                        step="0.5"
                                                        pattern="[0-9]*[.,]?[0-9]*"
                                                        onChange={e => {
                                                          const raw = e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.')
                                                          const newVal = parseFloat(raw) || 0
                                                          setBilTimerFordelinger(prev => {
                                                            const current = prev[afregKey]
                                                              ?? Object.fromEntries(samleordreCtx.children.map(c => [
                                                                c.orderNumber,
                                                                c.orderNumber === anchorChild.orderNumber ? koretimer : 0,
                                                              ]))
                                                            return { ...prev, [afregKey]: { ...current, [child.orderNumber]: newVal } }
                                                          })
                                                        }}
                                                        className="bg-surface border border-hairline rounded-md px-xs py-xxxs text-xs tabular-nums w-[90px] text-right focus:outline-none focus:border-dark-teal disabled:opacity-60 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                                        aria-label={`Køretimer til ${child.orderNumber} · ${child.stedLabel}`}
                                                      />
                                                      {/* Ventetid-input */}
                                                      <input
                                                        type="number"
                                                        value={childVentetid}
                                                        disabled={isGodkendt}
                                                        step="0.5"
                                                        pattern="[0-9]*[.,]?[0-9]*"
                                                        onChange={e => {
                                                          const raw = e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.')
                                                          const newVal = parseFloat(raw) || 0
                                                          setBilVentetidFordelinger(prev => {
                                                            const current = prev[afregKey]
                                                              ?? Object.fromEntries(samleordreCtx.children.map(c => [
                                                                c.orderNumber,
                                                                c.orderNumber === anchorChild.orderNumber ? ventetid : 0,
                                                              ]))
                                                            return { ...prev, [afregKey]: { ...current, [child.orderNumber]: newVal } }
                                                          })
                                                        }}
                                                        className="bg-surface border border-hairline rounded-md px-xs py-xxxs text-xs tabular-nums w-[90px] text-right focus:outline-none focus:border-dark-teal disabled:opacity-60 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                                        aria-label={`Ventetid til ${child.orderNumber} · ${child.stedLabel}`}
                                                      />
                                                    </div>
                                                  )
                                                })}
                                            </div>
                                            {/* To sum-counters — køretimer og ventetid hver for sig */}
                                            <div className="flex justify-end gap-md mt-xs">
                                              <span className={[
                                                'font-inter text-xs tabular-nums font-semibold',
                                                koretimerMatch ? 'text-good' : 'text-bad',
                                              ].join(' ')}>
                                                {koretimerMatch ? (
                                                  <>Køretimer: {koretimerSum.toFixed(1)}/{koretimer.toFixed(1)} Timer</>
                                                ) : (
                                                  <>Køretimer: {koretimerSum.toFixed(1)}/{koretimer.toFixed(1)} Timer (rest {koretimerRest > 0 ? '+' : ''}{koretimerRest.toFixed(1)})</>
                                                )}
                                              </span>
                                              <span className={[
                                                'font-inter text-xs tabular-nums font-semibold',
                                                ventetidMatch ? 'text-good' : 'text-bad',
                                              ].join(' ')}>
                                                {ventetidMatch ? (
                                                  <>Ventetid: {ventetidSum.toFixed(1)}/{ventetid.toFixed(1)} Timer</>
                                                ) : (
                                                  <>Ventetid: {ventetidSum.toFixed(1)}/{ventetid.toFixed(1)} Timer (rest {ventetidRest > 0 ? '+' : ''}{ventetidRest.toFixed(1)})</>
                                                )}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )
                                })()}

                                {/* ── Vejesedler under afregnings-felterne ─────── */}
                                {/* Alle vejesedler rendres ens — badgen signalerer "Samles på en bil" (puljelæs). Multilæs fjernet som visuel kategori. Ingen gruppering. */}
                                {bilVejesedler.length > 0 && (
                                  <div className="mt-sm border-t border-hairline pt-sm">
                                    <span className="font-inter text-xxs text-text-muted uppercase tracking-widest block mb-xs">Vejesedler</span>
                                    <div className="flex flex-col gap-xs">

                                      {bilVejesedler.map(vs => {
                                        const isVsExpanded = vejeseddelExpanded.has(vs.id)
                                        // Fordeling-state for multilæs: fra lokal state eller pre_fordeling
                                        const fordeling = vejeseddelFordelinger[vs.id]
                                          ?? vs.pre_fordeling.map(pf => ({ ordre_id: pf.ordre_id, tons: pf.tons }))
                                        const fordelingSum = fordeling.reduce((s, f) => s + f.tons, 0)
                                        const rest = vs.netto_tons - fordelingSum
                                        const sumMatch = Math.abs(rest) < 0.05

                                        return (
                                          <div key={vs.id} className="bg-surface border border-hairline rounded-md overflow-hidden">
                                            {/* Vejeseddel-række — grid med kolonner der aligner badge med "Indeholder"-kolonnen og Fordel-knap med "Afregning"-kolonnen */}
                                            <div
                                              className="grid items-center gap-xs px-xs py-xxxs"
                                              style={{ gridTemplateColumns: 'minmax(140px, auto) 1fr 140px 140px' }}
                                            >
                                              <div className="flex items-center gap-xs min-w-0">
                                                <span className="font-inter text-xs font-semibold text-text-primary tabular-nums">{vs.vejeseddelNr}</span>
                                                <span className="font-inter text-xs font-semibold text-text-primary tabular-nums">{vs.product_code}</span>
                                                <span className="font-inter text-xs text-text-muted truncate">{vs.product_name}</span>
                                              </div>
                                              <div className="flex items-center justify-end gap-md tabular-nums whitespace-nowrap">
                                                <span className="font-inter text-xs text-text-muted">Tara <span className="text-text-secondary">{vs.tara_tons.toFixed(1).replace('.', ',')}</span></span>
                                                <span className="font-inter text-xs text-text-muted">Brutto <span className="text-text-secondary">{(vs.tara_tons + vs.netto_tons).toFixed(1).replace('.', ',')}</span></span>
                                                <span className="font-inter text-xs text-text-muted">Netto <span className="font-semibold text-text-primary">{vs.netto_tons.toFixed(1).replace('.', ',')} Tons</span></span>
                                              </div>
                                              {/* Badge alignet med "Indeholder"-kolonnen */}
                                              <div className="w-fit">
                                                {/* Multilæs fjernet som visuel kategori — kun puljelæs ("Samles på en bil") vises */}
                                                {vs.puljelaes_flag && (
                                                  <span className="inline-flex items-center gap-xxxs bg-soft-aqua text-deep-teal font-inter font-semibold text-xxs px-xs py-xxxs rounded-md uppercase tracking-wider whitespace-nowrap">
                                                    Samles på en bil
                                                  </span>
                                                )}
                                              </div>
                                              {/* Fordel-knap alignet med "Afregning"-kolonnen */}
                                              <div>
                                                {vs.multilaes_flag && (
                                                  <button
                                                    type="button"
                                                    onClick={() => setVejeseddelExpanded(prev => {
                                                      const next = new Set(prev)
                                                      if (next.has(vs.id)) next.delete(vs.id); else next.add(vs.id)
                                                      return next
                                                    })}
                                                    className="inline-flex items-center gap-xxxs font-inter text-xs text-deep-teal font-semibold hover:opacity-80 transition-opacity whitespace-nowrap min-h-[28px] px-xs"
                                                  >
                                                    {isVsExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                                    Fordel tons og timer
                                                  </button>
                                                )}
                                              </div>
                                            </div>

                                            {/* Fordeling-expander — multilaes_flag er dataflag, badge er fjernet som visuel kategori */}
                                            {vs.multilaes_flag && isVsExpanded && (
                                              <div className="border-t border-hairline px-xs pb-xs pt-xs bg-soft-aqua">
                                                <div className="flex flex-col gap-xs">
                                                  {vs.pre_fordeling
                                                    .sort((a, b) => (a.is_anchor ? -1 : b.is_anchor ? 1 : 0))
                                                    .map((pf, idx) => {
                                                      const currentTons = fordeling.find(f => f.ordre_id === pf.ordre_id)?.tons ?? 0
                                                      return (
                                                        <div key={pf.ordre_id} className="flex items-center gap-xs">
                                                          {/* Anchor-markering: gul prik */}
                                                          <div className={[
                                                            'w-2 h-2 rounded-full flex-shrink-0',
                                                            pf.is_anchor ? 'bg-yellow' : 'bg-hairline-2',
                                                          ].join(' ')} title={pf.is_anchor ? 'Primær ordre' : ''} />
                                                          <span className={[
                                                            'font-inter text-xs flex-1 min-w-0 truncate',
                                                            idx === 0 ? 'font-semibold text-text-primary' : 'text-text-secondary',
                                                          ].join(' ')}>
                                                            {pf.ordre_label}
                                                          </span>
                                                          {/* F. Input-felter: ingen stepper-arrows, numeric-only filter */}
                                                          <input
                                                            type="number"
                                                            value={currentTons}
                                                            disabled={isGodkendt}
                                                            pattern="[0-9]*[.,]?[0-9]*"
                                                            onChange={e => {
                                                              const raw = e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.')
                                                              const newTons = parseFloat(raw) || 0
                                                              setVejeseddelFordelinger(prev => {
                                                                const current = prev[vs.id] ?? vs.pre_fordeling.map(p => ({ ordre_id: p.ordre_id, tons: p.tons }))
                                                                return {
                                                                  ...prev,
                                                                  [vs.id]: current.map(f =>
                                                                    f.ordre_id === pf.ordre_id ? { ...f, tons: newTons } : f
                                                                  ),
                                                                }
                                                              })
                                                            }}
                                                            className="bg-surface border border-hairline rounded-md px-xs py-xxxs text-xs tabular-nums w-[90px] text-right focus:outline-none focus:border-dark-teal disabled:opacity-60 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                                            aria-label={`Tons til ${pf.ordre_label}`}
                                                          />
                                                          <span className="font-inter text-xs text-text-muted">Tons</span>
                                                          <input
                                                            type="number"
                                                            value={vejeseddelVentetidFordelinger[vs.id]?.[pf.ordre_id] ?? 0}
                                                            disabled={isGodkendt}
                                                            pattern="[0-9]*[.,]?[0-9]*"
                                                            onChange={e => {
                                                              const raw = e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.')
                                                              const newTimer = parseFloat(raw) || 0
                                                              setVejeseddelVentetidFordelinger(prev => ({
                                                                ...prev,
                                                                [vs.id]: {
                                                                  ...(prev[vs.id] ?? {}),
                                                                  [pf.ordre_id]: newTimer,
                                                                },
                                                              }))
                                                            }}
                                                            className="bg-surface border border-hairline rounded-md px-xs py-xxxs text-xs tabular-nums w-[90px] text-right focus:outline-none focus:border-dark-teal disabled:opacity-60 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                                            aria-label={`Ventetid til ${pf.ordre_label}`}
                                                          />
                                                          <span className="font-inter text-xs text-text-muted">Timer</span>
                                                        </div>
                                                      )
                                                    })}
                                                </div>
                                                {/* E. Sum-counter: til højre under det sidste input-felt */}
                                                <div className="flex justify-end mt-xs gap-md">
                                                  {/* Tons sum */}
                                                  <span className={[
                                                    'font-inter text-xs tabular-nums font-semibold',
                                                    sumMatch ? 'text-good' : 'text-bad',
                                                  ].join(' ')}>
                                                    {sumMatch ? (
                                                      <>Sum: {fordelingSum.toFixed(1)}/{vs.netto_tons.toFixed(1)} Tons</>
                                                    ) : (
                                                      <>Sum: {fordelingSum.toFixed(1)}/{vs.netto_tons.toFixed(1)} Tons (rest {rest > 0 ? '+' : ''}{rest.toFixed(1)} Tons)</>
                                                    )}
                                                  </span>
                                                  {/* Ventetid sum */}
                                                  {(() => {
                                                    const ventetidMap = vejeseddelVentetidFordelinger[vs.id] ?? {}
                                                    const ventetidSum = vs.pre_fordeling.reduce((s, pf) => s + (ventetidMap[pf.ordre_id] ?? 0), 0)
                                                    const totalVentetid = afrData?.ventetid ?? 0
                                                    const ventetidMatch = Math.abs(ventetidSum - totalVentetid) < 0.05
                                                    const ventetidRest = totalVentetid - ventetidSum
                                                    return (
                                                      <span className={[
                                                        'font-inter text-xs tabular-nums font-semibold',
                                                        ventetidMatch ? 'text-good' : 'text-bad',
                                                      ].join(' ')}>
                                                        {ventetidMatch ? (
                                                          <>Ventetid: {ventetidSum.toFixed(1)}/{totalVentetid.toFixed(1)} Timer</>
                                                        ) : (
                                                          <>Ventetid: {ventetidSum.toFixed(1)}/{totalVentetid.toFixed(1)} Timer (rest {ventetidRest > 0 ? '+' : ''}{ventetidRest.toFixed(1)} Timer)</>
                                                        )}
                                                      </span>
                                                    )
                                                  })()}
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        )
                                      })}
                                    </div>
                                  </div>
                                )}

                                {/* Chauffør-kommentar læs-only */}
                                {afrData?.chauffoer_kommentar && (
                                  <div className="flex items-start gap-xs bg-warn-bg p-xs rounded-md mt-sm">
                                    <MessageSquare size={13} className="text-text-secondary flex-shrink-0 mt-[1px]" />
                                    <span className="font-inter text-xs italic text-text-secondary">{afrData.chauffoer_kommentar}</span>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                          )
                        })()}
                      </Fragment>
                    )
                  })}
                </tbody>
              </table>
          {/* ── Subtotaler pr. afregningsform ─────────────────────────────────────── */}
          {/* Beregnes via beregnAfregningEligibility (single source of truth for effectiveType). */}
          {/* Reagerer automatisk når per-bil override eller 1,5-times-regel ændres. */}
          {/* Komponenter summeres separat: akkord→(tons, ventetid) / time→(køretimer, ventetid, hviletid) */}
          {(() => {
            const fmtTal = (n: number, d = 0) => new Intl.NumberFormat('da-DK', { maximumFractionDigits: d }).format(n)
            let akkordBiler = 0
            let akkordTons = 0
            let akkordVentetid = 0
            let timeBiler = 0
            let timeKoretimer = 0
            let timeVentetid = 0
            let timeHviletid = 0
            for (const bil of vognmandBekraeftelse.biler) {
              const afrData = afregningData[bil.regnr]
              const { effectiveType } = beregnAfregningEligibility(bil, afrData, vejeseddelFordelinger)
              if (effectiveType === 'akkord') {
                akkordBiler++
                akkordTons += (bil.vejesedler ?? []).reduce((s, vs) => s + vs.netto_tons, 0)
                akkordVentetid += afrData?.ventetid ?? 0
              } else {
                timeBiler++
                timeKoretimer += afrData?.koretimer ?? 0
                timeVentetid += afrData?.ventetid ?? 0
                timeHviletid += afrData?.hviletid ?? 0
              }
            }
            return (
              <div className="flex flex-wrap gap-xs px-xs py-xs border-t border-hairline bg-surface-2">
                {/* Akkord-pille: tons + ventetid */}
                <span className="inline-flex flex-wrap items-center gap-xs px-sm py-xxxs rounded-lg bg-surface border border-hairline font-inter text-xs text-deep-teal">
                  <span className="font-semibold">Akkord</span>
                  <span className="text-text-muted">·</span>
                  <span>{akkordBiler} {akkordBiler === 1 ? 'bil' : 'biler'}</span>
                  <span className="text-text-muted">·</span>
                  <span>{fmtTal(akkordTons, 1)} Tons</span>
                  <span className="text-text-muted">·</span>
                  <span>Ventetid {fmtTal(akkordVentetid, 1)} Timer</span>
                </span>
                {/* Time-pille: køretimer + ventetid + hviletid hver for sig */}
                <span className="inline-flex flex-wrap items-center gap-xs px-sm py-xxxs rounded-lg bg-surface border border-hairline font-inter text-xs text-text-secondary">
                  <span className="font-semibold">Time</span>
                  <span className="text-text-muted">·</span>
                  <span>{timeBiler} {timeBiler === 1 ? 'bil' : 'biler'}</span>
                  <span className="text-text-muted">·</span>
                  <span>Køretimer {fmtTal(timeKoretimer, 1)}</span>
                  <span className="text-text-muted">·</span>
                  <span>Ventetid {fmtTal(timeVentetid, 1)}</span>
                  <span className="text-text-muted">·</span>
                  <span>Hviletid {fmtTal(timeHviletid, 1)} Timer</span>
                </span>
              </div>
            )
          })()}
        </div>
      ) : (
        <p className="font-inter text-xs text-text-muted px-sm pb-sm">
          Bilbestillingen er sendt — vognmanden disponerer og bekræfter snarest.
        </p>
      )}
    </section>
  )
}
