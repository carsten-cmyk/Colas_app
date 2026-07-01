/**
 * PROTOTYPE — Etape-bevidste materiel-presentere
 *
 * Fire rene, controlled komponenter der svarer til de fire UX-tilstande fra
 * `getMaterielUiState`. Ingen intern state (undtagen UI-lokal expand/collapse).
 * Data ind via props; mutations ud via callbacks. WIRES IKKE ind i container her
 * (det sker i Round 4).
 *
 * Bygget mod MaterielTransportPlan-modellen (LÅST 2026-06-23).
 * TODO: Erstat mock-brug med Supabase når klar.
 */

import React, { useState } from 'react'
import { Truck } from 'lucide-react'
import {
  type Etape,
  type MaterielTransportPlan,
  transportKey,
} from './etape'
import { MaterielKort } from './MaterielKort'

// ─── Delt hjælper: lang dansk dato-format ────────────────────────────────────

/** Formaterer YYYY-MM-DD til "16. marts 2026" */
function formatLangDato(isoDate: string): string {
  if (!isoDate) return '—'
  const d = new Date(isoDate + 'T00:00:00')
  return d.toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' })
}

// ─── Delt hjælper: 3-state badge ─────────────────────────────────────────────

interface VognmandBadgeProps {
  plan: MaterielTransportPlan | undefined
}

/**
 * Viser transportplanens vognmand-status som en 3-state pille.
 * Genbrugsdel fra OrdrePlanScreen ~L3100-3117 med token-rensning.
 *
 * - ikke-planlagt: neutral grå
 * - planlagt + sendt:   gul/warn-bg (token: warn-bg, text-text-secondary)
 * - planlagt + bekræftet: grøn (token: good-bg, text-good / good)
 * - planlagt + ikke sendt: lys grå (token: surface-2, text-text-muted)
 */
function VognmandBadge({ plan }: VognmandBadgeProps) {
  if (!plan || plan.status === 'ikke-planlagt') {
    return (
      <span className="inline-flex items-center px-xs py-xxxs rounded-lg bg-surface-2 font-inter text-xs font-semibold text-text-muted whitespace-nowrap">
        Ikke planlagt
      </span>
    )
  }
  if (plan.sendt) {
    // Lys grøn (bg-good-bg/text-good) — matcher Asfalt kørsel's "Sendt til vognmand"-pille.
    return (
      <span className="inline-flex items-center px-xs py-xxxs rounded-lg bg-good-bg font-inter text-xs font-semibold text-good whitespace-nowrap">
        Sendt til vognmand
      </span>
    )
  }
  // Planlagt (gemt, endnu ikke sendt) — lys gul (warn-bg) så den skiller sig fra
  // grå "Ikke planlagt" og grøn "Sendt til vognmand".
  return (
    <span className="inline-flex items-center px-xs py-xxxs rounded-lg bg-warn-bg font-inter text-xs font-semibold text-text-secondary whitespace-nowrap">
      Planlagt
    </span>
  )
}

// ─── Delt hjælper: Truck-række ────────────────────────────────────────────────

interface TruckRijProps {
  description: string
  plantNumber: string
  /** Vises i højre kolonne */
  badge: React.ReactNode
  /** Valgfrit: indhold der vises under rækken (expand-panel) */
  expanded?: React.ReactNode
  /** Giver separator-border under rækken? */
  hasBorder?: boolean
}

/**
 * Genbruger det eksakte grid-mønster fra OrdrePlanScreen ~L3145-3195:
 * `gridTemplateColumns: '36px 1fr auto'` med Truck-ikon, navn/anlægsNr og badge.
 * Inline style bruges udelukkende til computed grid — ikke farver/spacing.
 */
function TruckRij({ description, plantNumber, badge, expanded, hasBorder = false }: TruckRijProps) {
  return (
    <div className={hasBorder ? 'border-b border-hairline' : ''}>
      <div
        className="grid items-center gap-md px-sm py-sm"
        style={{ gridTemplateColumns: '36px 1fr auto' }}
      >
        <div className="w-9 h-9 rounded-md bg-soft-aqua flex items-center justify-center text-deep-teal">
          <Truck size={16} aria-hidden="true" />
        </div>
        <div>
          <p className="font-inter text-sm font-medium text-text-primary">{description}</p>
          <div className="flex items-center gap-xs mt-xxxs">
            <span className="font-inter text-xs text-text-muted tabular-nums">{plantNumber}</span>
          </div>
        </div>
        <div>{badge}</div>
      </div>
      {expanded}
    </div>
  )
}

// ─── Delt intern sub-komponent: transport-form ────────────────────────────────
// Deles af MaterielPlanlaegTilstand og MaterielNyEtapeTilstand for at undgå
// kode-duplikering. Controlled: data ind, patch-callback ud.

/** Patch-type: kun de felter der ændres */
export type TransportPlanPatch = Partial<
  Omit<MaterielTransportPlan, 'resourceId' | 'etapeId'>
>

interface TransportFormProps {
  resourceId: string
  plan: MaterielTransportPlan
  /** Første materiel-enhed i listen (aflæsning-arv-reference) */
  foersteEnhed: { id: string; description: string; plan: MaterielTransportPlan } | null
  onChange: (resourceId: string, patch: TransportPlanPatch) => void
  onGem: (resourceId: string) => void
  onAnnuller: () => void
}

function TransportForm({
  resourceId,
  plan,
  foersteEnhed,
  onChange,
  onGem,
  onAnnuller,
}: TransportFormProps) {
  // Lokal UI state: "Samme aflæsningssted som 1. materiel?" valg
  const [sammeAflaesning, setSammeAflaesning] = useState<boolean | null>(null)
  const erFoerste = foersteEnhed === null || foersteEnhed.id === resourceId

  function patch(field: TransportPlanPatch) {
    onChange(resourceId, field)
  }

  return (
    <div className="mx-sm mb-lg rounded-xl border border-dark-teal/20 bg-soft-aqua shadow-md flex flex-col gap-md p-md">

      {/* Afhentning */}
      <div className="flex flex-col gap-xs">
        <p className="font-inter text-xs font-semibold text-text-primary">Afhentningssted</p>

        <div className="grid grid-cols-2 gap-xs">
          <div className="flex flex-col gap-xxxs col-span-2">
            <label className="font-inter text-xxs text-text-muted">Vejnavn og nummer</label>
            <div className="grid grid-cols-2 gap-xs">
              <input
                type="text"
                value={plan.afhentning.vejnavn}
                onChange={e => patch({ afhentning: { ...plan.afhentning, vejnavn: e.target.value } })}
                placeholder="Vejnavn"
                className="font-inter text-xs text-text-primary bg-surface border border-hairline rounded-lg px-xs py-xs focus:outline-none focus:border-dark-teal placeholder:text-text-muted"
              />
              <input
                type="text"
                value={plan.afhentning.nummer}
                onChange={e => patch({ afhentning: { ...plan.afhentning, nummer: e.target.value } })}
                placeholder="Nr."
                className="font-inter text-xs text-text-primary bg-surface border border-hairline rounded-lg px-xs py-xs focus:outline-none focus:border-dark-teal placeholder:text-text-muted"
              />
            </div>
          </div>
          <div className="flex flex-col gap-xxxs">
            <label className="font-inter text-xxs text-text-muted">Postnummer</label>
            <input
              type="text"
              value={plan.afhentning.postnr}
              onChange={e => patch({ afhentning: { ...plan.afhentning, postnr: e.target.value } })}
              placeholder="0000"
              className="font-inter text-xs text-text-primary bg-surface border border-hairline rounded-lg px-xs py-xs focus:outline-none focus:border-dark-teal placeholder:text-text-muted"
            />
          </div>
        </div>

        {/* Kort — afhentningssted */}
        <MaterielKort
          label="afhentningssted"
          koordinat={plan.afhentning.koordinat}
          onChange={k => patch({ afhentning: { ...plan.afhentning, koordinat: k } })}
        />

        {/* Klar til afhentning */}
        <div className="flex flex-col gap-xxxs">
          <label className="font-inter text-xxs text-text-muted font-semibold">Klar til afhentning</label>
          <div className="grid grid-cols-2 gap-xs">
            <div className="flex flex-col gap-xxxs">
              <label className="font-inter text-xxs text-text-muted">Dato</label>
              <input
                type="date"
                value={plan.klar.dato}
                onChange={e => patch({ klar: { ...plan.klar, dato: e.target.value } })}
                className="font-inter text-xs text-text-primary bg-surface border border-hairline rounded-lg px-xs py-xs focus:outline-none focus:border-dark-teal"
              />
            </div>
            <div className="flex flex-col gap-xxxs">
              <label className="font-inter text-xxs text-text-muted">Klokkeslæt</label>
              <input
                type="time"
                value={plan.klar.tid}
                onChange={e => patch({ klar: { ...plan.klar, tid: e.target.value } })}
                className="font-inter text-xs text-text-primary bg-surface border border-hairline rounded-lg px-xs py-xs focus:outline-none focus:border-dark-teal"
              />
            </div>
          </div>
        </div>

        {/* Skal være på lokation */}
        <div className="flex flex-col gap-xxxs">
          <label className="font-inter text-xxs text-text-muted font-semibold">Skal være på lokation</label>
          <div className="grid grid-cols-2 gap-xs">
            <div className="flex flex-col gap-xxxs">
              <label className="font-inter text-xxs text-text-muted">Dato</label>
              <input
                type="date"
                value={plan.lokation.dato}
                onChange={e => patch({ lokation: { ...plan.lokation, dato: e.target.value } })}
                className="font-inter text-xs text-text-primary bg-surface border border-hairline rounded-lg px-xs py-xs focus:outline-none focus:border-dark-teal"
              />
            </div>
            <div className="flex flex-col gap-xxxs">
              <label className="font-inter text-xxs text-text-muted">Klokkeslæt</label>
              <input
                type="time"
                value={plan.lokation.tid}
                onChange={e => patch({ lokation: { ...plan.lokation, tid: e.target.value } })}
                className="font-inter text-xs text-text-primary bg-surface border border-hairline rounded-lg px-xs py-xs focus:outline-none focus:border-dark-teal"
              />
            </div>
          </div>
        </div>
      </div>

      <hr className="border-hairline" />

      {/* Aflæsning */}
      <div className="flex flex-col gap-xs">
        <p className="font-inter text-xs font-semibold text-text-primary">Aflæsningssted</p>

        {/* Fra 2. enhed: spørg om samme aflæsning som 1. materiel */}
        {!erFoerste && sammeAflaesning === null && (
          <div className="flex items-center gap-sm bg-surface border border-hairline rounded-xl px-sm py-xs">
            <span className="font-inter text-xs text-text-secondary flex-1">
              Samme aflæsningssted som{' '}
              <span className="font-medium text-text-primary">
                {foersteEnhed!.description}
              </span>
              ?
            </span>
            <div className="flex bg-surface border border-hairline rounded-md p-xxxs gap-xxxs">
              <button
                type="button"
                onClick={() => setSammeAflaesning(true)}
                className="px-sm py-xxxs rounded-sm font-inter text-xs font-semibold text-text-muted hover:bg-soft-aqua transition-colors min-h-touch min-w-[44px]"
              >
                Ja
              </button>
              <button
                type="button"
                onClick={() => setSammeAflaesning(false)}
                className="px-sm py-xxxs rounded-sm font-inter text-xs font-semibold text-text-muted hover:bg-soft-aqua transition-colors min-h-touch min-w-[44px]"
              >
                Nej
              </button>
            </div>
          </div>
        )}

        {/* Arvet aflæsningssted */}
        {!erFoerste && sammeAflaesning === true && (
          <div className="flex items-center justify-between bg-good-bg border border-good/20 rounded-xl px-sm py-xs">
            <div className="flex items-center gap-xs">
              {/* Lille farvet dot — inline w/h er pixels men er en ikonisk dekorativ prik, ikke layout */}
              <span
                className="w-xxs h-xxs rounded-full bg-good flex-shrink-0"
                aria-hidden="true"
                style={{ width: 6, height: 6 }}
              />
              <span className="font-inter text-xs text-text-secondary">
                Arver aflæsningssted fra{' '}
                <span className="font-medium text-text-primary">
                  {foersteEnhed!.description}
                </span>
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSammeAflaesning(null)}
              className="font-inter text-xxs text-text-muted hover:text-text-primary transition-colors min-h-touch flex items-center"
            >
              Ændre
            </button>
          </div>
        )}

        {/* Manuel aflæsning: altid for 1. enhed eller ved "Nej" */}
        {(erFoerste || sammeAflaesning === false) && (
          <>
            <div className="flex flex-col gap-xxxs">
              <label className="font-inter text-xxs text-text-muted">Aflæsningsadresse</label>
              <input
                type="text"
                value={plan.aflaesning}
                onChange={e => patch({ aflaesning: e.target.value })}
                placeholder="Vejnavn, nr., postnr."
                className="font-inter text-xs text-text-primary bg-surface border border-hairline rounded-lg px-xs py-xs focus:outline-none focus:border-dark-teal placeholder:text-text-muted"
              />
            </div>

            {/* Kort — aflæsningssted (kun i manuel gren; arve-grenen arver koordinat fra 1. enhed) */}
            <MaterielKort
              label="aflæsningssted"
              koordinat={plan.aflaesningKoordinat}
              onChange={k => patch({ aflaesningKoordinat: k })}
            />
          </>
        )}
      </div>

      {/* Kommentar */}
      <div className="flex flex-col gap-xxxs">
        <label className="font-inter text-xxs text-text-muted">Kommentar til chauffør</label>
        <textarea
          value={plan.kommentar}
          onChange={e => patch({ kommentar: e.target.value })}
          rows={2}
          placeholder="Særlige forhold, adgang, tidsvinduer..."
          className="w-full font-inter text-xs text-text-primary bg-surface border border-hairline rounded-lg px-xs py-xs focus:outline-none focus:border-dark-teal transition-colors resize-none leading-relaxed"
        />
      </div>

      {/* Gem / Annullér */}
      <div className="flex justify-end gap-xs pt-xxxs">
        <button
          type="button"
          onClick={onAnnuller}
          className="font-inter text-xs text-text-muted hover:text-text-primary px-xs py-xxxs min-h-touch flex items-center"
        >
          Annullér
        </button>
        <button
          type="button"
          onClick={() => onGem(resourceId)}
          className="font-inter text-xs font-semibold text-deep-teal bg-yellow px-sm py-xxxs rounded-lg hover:opacity-90 min-h-touch flex items-center"
        >
          Gem transport
        </button>
      </div>
    </div>
  )
}

// ─── Fælles resource-type til de fire presentere ─────────────────────────────

/** Én enhed i materiel-pakken (subset af MockResource — kun de felter vi bruger) */
export interface MaterielEnhed {
  id: string
  plantNumber: string
  description: string
}

// ════════════════════════════════════════════════════════════════════════════════
// TILSTAND 1: MaterielPlanlaegTilstand (state = 'planlaeg')
// Etapens første dag — fuld transport-planlægning pr. enhed.
// ════════════════════════════════════════════════════════════════════════════════

export interface MaterielPlanlaegTilstandProps {
  /** Pakke-enhederne for denne ordre */
  resources: MaterielEnhed[]
  /** Den aktuelle etape — bruges kun til ID, men videregivet for type-sikkerhed */
  etape: Etape
  /** Transport-planer keyed på transportKey(resourceId, etapeId) */
  transportPlaner: Record<string, MaterielTransportPlan>
  /** Kald når bruger ændrer et felt på en plans transport-plan */
  onChange: (resourceId: string, patch: TransportPlanPatch) => void
  /** Kald når bruger trykker "Gem transport" på én enhed */
  onGem: (resourceId: string) => void
  /** Kald når bruger trykker "Send til vognmand" (section-level) */
  onSend: () => void
}

export function MaterielPlanlaegTilstand({
  resources,
  etape,
  transportPlaner,
  onChange,
  onGem,
  onSend,
}: MaterielPlanlaegTilstandProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const foersteEnhed = resources[0] ?? null
  const foerstePlan = foersteEnhed
    ? (transportPlaner[transportKey(foersteEnhed.id, etape.id)] ?? null)
    : null

  // Send-knap: gul hvis mindst én planlagt+usendt, grøn (disabled) hvis alle sendt
  const planlagteEnheder = resources.filter(r => {
    const p = transportPlaner[transportKey(r.id, etape.id)]
    return p?.status === 'planlagt'
  })
  const usendteEnheder = planlagteEnheder.filter(r => {
    const p = transportPlaner[transportKey(r.id, etape.id)]
    return p && !p.sendt
  })
  const harPlanlagte = planlagteEnheder.length > 0
  const harUsendte = usendteEnheder.length > 0

  return (
    <div className="bg-surface border border-hairline rounded-xl overflow-hidden mb-sm">
      {resources.map((r, i) => {
        const plan = transportPlaner[transportKey(r.id, etape.id)]
        const isExpanded = expandedId === r.id
        const hasBorder = i < resources.length - 1 || isExpanded

        const rowBadge = isExpanded ? null : <VognmandBadge plan={plan} />
        const actionBadge =
          plan?.status === 'planlagt' && !isExpanded ? (
            <div className="flex items-center gap-xs">
              <VognmandBadge plan={plan} />
              <button
                type="button"
                onClick={() => setExpandedId(r.id)}
                className="inline-flex items-center justify-center gap-xxxs font-inter text-xs font-semibold text-white bg-dark-teal px-sm py-xxxs rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap min-h-touch min-w-[135px]"
              >
                Ret transport
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() =>
                isExpanded
                  ? (onGem(r.id), setExpandedId(null))
                  : setExpandedId(r.id)
              }
              className={`inline-flex items-center justify-center gap-xxxs font-inter text-xs font-semibold px-sm py-xxxs rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap min-h-touch min-w-[135px] ${isExpanded ? 'bg-yellow text-deep-teal' : 'bg-dark-teal text-white'}`}
            >
              {isExpanded ? 'Gem transport' : 'Planlæg transport'}
            </button>
          )

        return (
          <TruckRij
            key={r.id}
            description={r.description}
            plantNumber={r.plantNumber}
            badge={actionBadge ?? rowBadge}
            hasBorder={hasBorder}
            expanded={
              isExpanded && plan ? (
                <TransportForm
                  resourceId={r.id}
                  plan={plan}
                  foersteEnhed={
                    foersteEnhed && foerstePlan && foersteEnhed.id !== r.id
                      ? { id: foersteEnhed.id, description: foersteEnhed.description, plan: foerstePlan }
                      : null
                  }
                  onChange={onChange}
                  onGem={id => { onGem(id); setExpandedId(null) }}
                  onAnnuller={() => setExpandedId(null)}
                />
              ) : undefined
            }
          />
        )
      })}

      {/* Section-level send-knap */}
      {harPlanlagte && (
        <div className="border-t border-hairline px-sm py-sm flex items-center justify-between">
          {harUsendte ? (
            <button
              type="button"
              onClick={onSend}
              className="inline-flex items-center gap-xxxs font-inter text-xs font-semibold text-deep-teal bg-yellow px-sm py-xxxs rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap min-h-touch"
            >
              Send til vognmand
            </button>
          ) : (
            <button
              type="button"
              disabled
              className="inline-flex items-center gap-xxxs font-inter text-xs font-semibold text-white bg-good px-sm py-xxxs rounded-lg min-h-touch cursor-default"
            >
              Sendt til vognmand
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════════
// TILSTAND 2: MaterielPaaPladsenTilstand (state = 'paa-pladsen')
// Midt i etape efter første dag — read-only.
// ════════════════════════════════════════════════════════════════════════════════

export interface MaterielPaaPladsenTilstandProps {
  resources: MaterielEnhed[]
  etape: Etape
  transportPlaner: Record<string, MaterielTransportPlan>
}

export function MaterielPaaPladsenTilstand({
  resources,
  etape,
  transportPlaner,
}: MaterielPaaPladsenTilstandProps) {
  return (
    <div className="bg-surface border border-hairline rounded-xl overflow-hidden mb-sm">
      {resources.map((r, i) => {
        const plan = transportPlaner[transportKey(r.id, etape.id)]
        const ankomstDato = plan?.lokation.dato ? formatLangDato(plan.lokation.dato) : null
        const badge = (
          <span className="inline-flex items-center px-xs py-xxxs rounded-lg bg-good-bg font-inter text-xs font-semibold text-good whitespace-nowrap">
            På pladsen
          </span>
        )
        return (
          <TruckRij
            key={r.id}
            description={r.description}
            plantNumber={r.plantNumber}
            badge={badge}
            hasBorder={i < resources.length - 1}
            expanded={
              ankomstDato ? (
                <div className="px-sm pb-sm">
                  <p className="font-inter text-xs text-text-muted">
                    Ankom {ankomstDato}
                  </p>
                </div>
              ) : undefined
            }
          />
        )
      })}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════════
// TILSTAND 3: MaterielDvaleTilstand (state = 'dvale')
// Gap-dag mellem etaper — rolig/neutral tom-tilstand.
// ════════════════════════════════════════════════════════════════════════════════

export interface MaterielDvaleTilstandProps {
  /** Valgfrit: vises hvis næste etapes første dag er kendt */
  naestEtapeStartDato?: string
}

export function MaterielDvaleTilstand({ naestEtapeStartDato }: MaterielDvaleTilstandProps) {
  return (
    <div className="bg-surface border border-hairline rounded-xl px-sm py-md mb-sm flex flex-col items-center gap-xs text-center">
      <p className="font-inter text-sm font-medium text-text-primary">
        Frigivet — næste etape ikke planlagt endnu
      </p>
      <p className="font-inter text-xs text-text-muted max-w-xs">
        Materiellet bruges af en anden ordre i mellemperioden. Planlægning åbner
        når PLAN planlægger næste etape.
      </p>
      {naestEtapeStartDato && (
        <p className="font-inter text-xs text-text-muted">
          Næste etape starter {formatLangDato(naestEtapeStartDato)}.
        </p>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════════
// TILSTAND 4: MaterielNyEtapeTilstand (state = 'ny-etape')
// Første dag i en efterfølgende etape — frisk planlægning med banner.
// Genbrug af TransportForm (dele med tilstand 1) for at undgå dublering.
// ════════════════════════════════════════════════════════════════════════════════

export interface MaterielNyEtapeTilstandProps {
  resources: MaterielEnhed[]
  /** Den nye etape — etape.id > 0 */
  etape: Etape
  /**
   * Transport-planer for den nye etape.
   * Alle transport-planer forventes at have status 'ikke-planlagt' (blank).
   */
  transportPlaner: Record<string, MaterielTransportPlan>
  onChange: (resourceId: string, patch: TransportPlanPatch) => void
  onGem: (resourceId: string) => void
  onSend: () => void
}

export function MaterielNyEtapeTilstand({
  resources,
  etape,
  transportPlaner,
  onChange,
  onGem,
  onSend,
}: MaterielNyEtapeTilstandProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const foersteEnhed = resources[0] ?? null
  const foerstePlan = foersteEnhed
    ? (transportPlaner[transportKey(foersteEnhed.id, etape.id)] ?? null)
    : null

  const planlagteEnheder = resources.filter(r => {
    const p = transportPlaner[transportKey(r.id, etape.id)]
    return p?.status === 'planlagt'
  })
  const usendteEnheder = planlagteEnheder.filter(r => {
    const p = transportPlaner[transportKey(r.id, etape.id)]
    return p && !p.sendt
  })
  const harPlanlagte = planlagteEnheder.length > 0
  const harUsendte = usendteEnheder.length > 0

  return (
    <div className="mb-sm">
      {/* Banner — ingen ikoner jf. feedback */}
      <div className="bg-warn-bg border border-hairline rounded-xl px-sm py-sm mb-xs">
        <p className="font-inter text-sm font-semibold text-text-primary">
          Planlæg materiel-transport for etape {etape.id + 1}
        </p>
        <p className="font-inter text-xs text-text-muted mt-xxxs">
          Pakken er båret videre fra forrige etape. Planlæg ny transport til{' '}
          {formatLangDato(etape.firstDay)}.
        </p>
      </div>

      <div className="bg-surface border border-hairline rounded-xl overflow-hidden">
        {resources.map((r, i) => {
          const plan = transportPlaner[transportKey(r.id, etape.id)]
          const isExpanded = expandedId === r.id
          const hasBorder = i < resources.length - 1 || isExpanded

          const actionBadge =
            plan?.status === 'planlagt' && !isExpanded ? (
              <div className="flex items-center gap-xs">
                <VognmandBadge plan={plan} />
                <button
                  type="button"
                  onClick={() => setExpandedId(r.id)}
                  className="inline-flex items-center justify-center gap-xxxs font-inter text-xs font-semibold text-white bg-dark-teal px-sm py-xxxs rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap min-h-touch min-w-[135px]"
                >
                  Ret transport
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() =>
                  isExpanded
                    ? (onGem(r.id), setExpandedId(null))
                    : setExpandedId(r.id)
                }
                className={`inline-flex items-center justify-center gap-xxxs font-inter text-xs font-semibold px-sm py-xxxs rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap min-h-touch min-w-[135px] ${isExpanded ? 'bg-yellow text-deep-teal' : 'bg-dark-teal text-white'}`}
              >
                {isExpanded ? 'Gem transport' : 'Planlæg transport'}
              </button>
            )

          return (
            <TruckRij
              key={r.id}
              description={r.description}
              plantNumber={r.plantNumber}
              badge={actionBadge}
              hasBorder={hasBorder}
              expanded={
                isExpanded && plan ? (
                  <TransportForm
                    resourceId={r.id}
                    plan={plan}
                    foersteEnhed={
                      foersteEnhed && foerstePlan && foersteEnhed.id !== r.id
                        ? { id: foersteEnhed.id, description: foersteEnhed.description, plan: foerstePlan }
                        : null
                    }
                    onChange={onChange}
                    onGem={id => { onGem(id); setExpandedId(null) }}
                    onAnnuller={() => setExpandedId(null)}
                  />
                ) : undefined
              }
            />
          )
        })}

        {/* Section-level send-knap */}
        {harPlanlagte && (
          <div className="border-t border-hairline px-sm py-sm flex items-center justify-between">
            {harUsendte ? (
              <button
                type="button"
                onClick={onSend}
                className="inline-flex items-center gap-xxxs font-inter text-xs font-semibold text-deep-teal bg-yellow px-sm py-xxxs rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap min-h-touch"
              >
                Send til vognmand
              </button>
            ) : (
              <button
                type="button"
                disabled
                className="inline-flex items-center gap-xxxs font-inter text-xs font-semibold text-white bg-good px-sm py-xxxs rounded-lg min-h-touch cursor-default"
              >
                Sendt til vognmand
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
