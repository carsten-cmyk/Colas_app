/**
 * PROTOTYPE v1 — Bevaret historik
 *
 * Denne fil indeholder den FJERNEDE X-knap-blok fra ProductBoxV2 i
 * ../OrdrePlanScreen.tsx.
 *
 * Fjernet: 2026-06-09
 * Erstattet af: AFLYSNING-celle (6. kolonne) i ordredetalje-grid'et inde i
 *               makeOrdredetaljerCard() — komponent AflysningCell.
 *
 * Hvorfor fjernet:
 *  - X-knappen lå som et lille kryds øverst-til-højre på hver dags ProductBoxV2
 *    og var ikke opdagelig for formanden.
 *  - Den nye AFLYSNING-celle gør aflysning til en eksplicit, datostyret handling
 *    der virker i både Planlægning- og Udførsel-mode.
 *
 * Bevaret HER kun som UX-historik. Må IKKE importeres i produktion eller i den
 * aktive prototype.
 */
import { X } from 'lucide-react'

interface LegacyAflysKnapProps {
  onCancel: () => void
}

/** Den fjernede X-knap fra ProductBoxV2 (linje ~2915-2923 i OrdrePlanScreen.tsx). */
export function LegacyAflysKnap({ onCancel }: LegacyAflysKnapProps) {
  return (
    <button
      onClick={onCancel}
      aria-label="Aflys dag"
      className="absolute top-[8px] right-[8px] w-5 h-5 rounded-full flex items-center justify-center text-text-muted hover:bg-bad/10 hover:text-bad transition-colors"
    >
      <X size={12} />
    </button>
  )
}
