import type { ReactNode } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

// ─── OrdredetaljerSection ─────────────────────────────────────────────────────
// Genbrugbar wrapper for "Ordredetaljer". Matcher Forundersøgelse-mønsteret:
// h2 står FRIT ovenover (ingen ramme om overskriften), og kun selve indholdet er
// indrammet. Ingen ydre kort-ramme — collapsed-pillen og spec-grid'et har hver
// deres egen rounded-xl ramme, så der er aldrig dobbelt-indramning.
// Bruges identisk i Planlægning, Udførsel og Afregning. State holdes hos kalderen.

export function OrdredetaljerSection({
  expanded,
  onToggle,
  renderCard,
  renderCollapsedPille,
}: {
  expanded: boolean
  onToggle: () => void
  renderCard: () => ReactNode
  renderCollapsedPille: () => ReactNode
}) {
  return (
    <section className="mb-sm">
      {/* Fri sektions-titel UDENFOR kortet — identisk med Forundersøgelse-h2'en.
          HELE header-rækken (overskrift + toggle) er klikbar, så man kan
          collapse/expande uanset hvor på rækken man rammer. */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-label={expanded ? 'Skjul ordredetaljer' : 'Vis ordredetaljer'}
        className="group w-full flex items-center gap-sm mb-sm text-left"
      >
        <h2 className="font-poppins font-semibold text-xl text-text-primary leading-tight group-hover:text-deep-teal transition-colors">Ordredetaljer</h2>
        <span className="flex items-center gap-xxxs font-inter text-xs font-medium text-dark-teal group-hover:text-deep-teal transition-colors">
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {expanded ? 'Skjul detaljer' : 'Vis detaljer'}
        </span>
      </button>

      {expanded ? (
        // Spec-grid har sin egen rounded-xl ramme — ingen ekstra ydre ramme.
        // Hele kortet er klikbart-til-collapse, men klik på interaktive felter
        // (dropdown, knapper, input, links i fx Aflysning-cellen) collapser IKKE.
        <div
          onClick={(e) => {
            if ((e.target as HTMLElement).closest('select, button, input, textarea, a, [role="button"], [role="combobox"]')) return
            onToggle()
          }}
          className="cursor-pointer"
        >
          {renderCard()}
        </div>
      ) : (
        // Collapsed-pille: hele kortet klikbart, samme rounded-xl ramme som spec-grid'et.
        <button
          type="button"
          onClick={onToggle}
          aria-label="Vis ordredetaljer"
          className="w-full text-left bg-surface border border-hairline rounded-xl overflow-hidden hover:bg-surface-2 transition-colors"
        >
          {renderCollapsedPille()}
        </button>
      )}
    </section>
  )
}
