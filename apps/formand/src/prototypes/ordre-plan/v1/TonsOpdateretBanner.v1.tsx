/**
 * PROTOTYPE v1 — Bevaret historik
 *
 * Denne fil indeholder den FJERNEDE "Tons opdateret af Fabrik"-banner-blok
 * fra OrdrePlanScreen.tsx (Asfaltbestilling-rækken).
 *
 * Fjernet: 2026-06-09
 * Erstattet af: EkstraBestillingBox + "Bekræftet fabrik"-pille (StatusPill kind='ekstra-bekraeftet')
 *               i produkt-rækken — boksen ER nu bekræftelsen (jf. FUNCTIONAL_FLOWS Flow 9b
 *               og sessionsbeslutning 2026-06-09).
 *
 * Hvorfor erstattet:
 *  - Banner sad øverst i rækken og var ikke koblet visuelt til det relevante produkt.
 *  - "OK, set"-knappen var unødvendig friktion — formanden HAR bestilt ekstra tons
 *    pr. telefon, så at acknowledge er duplikering.
 *  - En synlig boks med "+N tons" + "Bekræftet fabrik"-pille gør det utvetydigt
 *    at PLAN har bekræftet og hvad delta er.
 *
 * Reference — den gamle banner-JSX (statisk komponent, ikke importeret nogen steder):
 */

interface V1TonsOpdateretBannerProps {
  /** ISO-tidspunkt fra PLAN — formattet som "i dag kl. HH:MM" */
  tidspunkt: string
  /** Callback når formand klikker "OK, set" — dismisser banneret */
  onDismiss: () => void
}

/** @deprecated Fjernet 2026-06-09. Bevares som dokumentation. */
export function TonsOpdateretBannerV1({ tidspunkt, onDismiss }: V1TonsOpdateretBannerProps) {
  const kl = new Date(tidspunkt).toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })
  return (
    <div className="flex items-center gap-xs px-sm py-xs rounded-md bg-warn-bg border border-warning mb-xs">
      {/* Info-ikon (lucide-react) — fjernet fra import-listen i OrdrePlanScreen.tsx ved oprydning */}
      <div className="min-w-0">
        <span className="font-inter text-sm font-medium text-text-primary leading-tight block">
          Tons opdateret af Fabrik
        </span>
        <span className="font-inter text-xxs text-text-muted leading-tight">
          i dag kl. {kl}
        </span>
      </div>
      <button
        onClick={onDismiss}
        className="ml-auto inline-flex items-center gap-xxxs px-xs py-xxxs rounded-md bg-deep-teal text-white font-inter text-xxs font-semibold whitespace-nowrap flex-shrink-0"
      >
        OK, set
      </button>
    </div>
  )
}
