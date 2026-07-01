/**
 * PROTOTYPE — Dev-only scenarie-vælger for OrdrePlanScreen.
 *
 * Flydende panel (nederst-venstre) hvor man hopper direkte til Spor A/B/C uden at
 * kende den "magiske" `?scenarie`-URL-param. Panelet SKRIVER blot param'en og lader
 * wiring remounte skærmen.
 *
 * BEVIDST dev-chrome: ser med vilje anderledes ud end produktions-UI (warn-palette)
 * så det aldrig forveksles med formandens rigtige nav. Kun tokens — ingen hex/px.
 * Rendres kun i DEV (import.meta.env.DEV) + lever under src/prototypes/ → dobbelt guard.
 *
 * Må ALDRIG importeres i produktionskode.
 */
import { useState } from 'react'
import { FlaskConical, X } from 'lucide-react'
import { SCENARIOS, type ScenarioId } from '../scenarios'

export interface DevScenarioPanelProps {
  /** Aktivt scenarie-id (fra useScenario) */
  activeId: ScenarioId
  /** True hvis valgt via eksplicit param — styrer "default"-hint */
  wasExplicit: boolean
  /** Kaldes når bruger vælger et spor — wiring sætter ?scenarie + remounter */
  onSelect: (id: ScenarioId) => void
}

export function DevScenarioPanel({ activeId, wasExplicit, onSelect }: DevScenarioPanelProps) {
  const [expanded, setExpanded] = useState(false)

  // Dobbelt guard: aldrig i prod-build (prototype-hub'en kan teoretisk bygges prod).
  if (!import.meta.env.DEV) return null

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="fixed bottom-md left-md z-50 flex min-h-touch items-center gap-xs rounded-xl border border-warning bg-warn-bg px-sm shadow-md"
      >
        <FlaskConical className="h-4 w-4 text-bad" />
        <span className="font-poppins text-xs font-semibold text-text-primary">
          DEV · Scenarie {activeId}
        </span>
      </button>
    )
  }

  return (
    <div className="fixed bottom-md left-md z-50 w-72 rounded-xl border border-warning bg-warn-bg p-sm shadow-md">
      <div className="mb-xs flex items-center justify-between">
        <div className="flex items-center gap-xs">
          <FlaskConical className="h-4 w-4 text-bad" />
          <span className="font-poppins text-xs font-semibold text-text-primary">
            DEV · Scenarie-vælger
          </span>
        </div>
        <button
          type="button"
          onClick={() => setExpanded(false)}
          aria-label="Luk scenarie-vælger"
          className="flex min-h-touch min-w-touch items-center justify-center"
        >
          <X className="h-4 w-4 text-text-muted" />
        </button>
      </div>

      {!wasExplicit && (
        <p className="mb-xs font-inter text-xxs text-text-muted">
          (default — ingen ?scenarie i URL)
        </p>
      )}

      <div className="flex flex-col gap-xxs">
        {(Object.keys(SCENARIOS) as ScenarioId[]).map((id) => {
          const s = SCENARIOS[id]
          const isActive = id === activeId
          return (
            <button
              key={id}
              type="button"
              onClick={() => {
                onSelect(id)
                setExpanded(false)
              }}
              className={`flex min-h-touch flex-col items-start rounded-md px-xs py-xxs text-left ${
                isActive ? 'bg-surface' : 'bg-transparent'
              }`}
            >
              <span className="font-inter text-sm font-semibold text-text-primary">
                {s.label}
              </span>
              <span className="font-inter text-xxs text-text-muted">{s.beskrivelse}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
