import { useState } from 'react'
import { CloudRain, X } from 'lucide-react'
import type { MockProduct, DayPlan, CancelReason } from '../types'
import { CANCEL_REASONS } from '../mocks'
import { formatTime } from '../utils'

// ─── ProductBoxV2 ─────────────────────────────────────────────────────────────
// Boks for ét produkt på den valgte dag — afløser DayPillV2 i dato-først-modellen.
// Beholder dimensions (w-[160px] min-h-[172px]) + felt-mønster (Forventet/Morgen) +
// vejr/aflys-knapper fra DayPillV2 — kun header-rækken og signatur er ny.

export function ProductBoxV2({
  product, day, isFocused, isSelectingReason, isSent,
  onFocus, onUpdateTons, onUpdateMorgenTons,
  onCancel: _onCancel, onAbortCancel, onConfirmCancel, onRestore,
  ordreTagLabels,
  samlesPaaEnBil, onSamlesPaaEnBilChange,
}: {
  product: MockProduct
  day: DayPlan
  isFocused: boolean
  isSelectingReason: boolean
  isSent: boolean                      // når true: Forventet + Morgen tons låst (read-only)
  onFocus: () => void
  onUpdateTons: (v: number) => void
  onUpdateMorgenTons: (v: number | undefined) => void
  /** Tidligere: åbn årsags-picker fra X-knap. X-knap fjernet 2026-06-09 — bevares for bagudkompat indtil call-sites er ryddet. */
  onCancel: () => void
  onAbortCancel: () => void            // luk årsags-picker uden at aflyse
  onConfirmCancel: (r: CancelReason) => void
  onRestore: () => void
  /** Samleordre: labels for de ordrer dette produkt tilhører, fx ['Søvej', 'Strandvejen'] */
  ordreTagLabels?: string[]
  /** Angiver om dette produkt/dag skal samles på én bil */
  samlesPaaEnBil?: boolean
  /** Callback ved ændring af "Samles på en bil" */
  onSamlesPaaEnBilChange?: (v: boolean) => void
}) {
  const [weatherActive, setWeatherActive] = useState(false)

  if (day.cancelled) {
    return (
      <div className="w-[160px] min-h-[172px] flex-1 bg-white rounded-xl border border-bad/30 flex flex-col items-center justify-center gap-xxxs opacity-60 p-sm">
        <p className="font-poppins font-semibold text-sm text-text-muted">{product.recipeName}</p>
        <p className="font-inter text-xxs text-text-muted">{product.recipeCode}</p>
        <p className="font-inter font-semibold text-xs text-bad mt-xxxs">Aflyst</p>
        {day.cancelReason && <p className="font-inter text-xxs text-text-muted capitalize">{day.cancelReason}</p>}
        <button onClick={onRestore} className="mt-xxxs font-inter text-xxs text-dark-teal underline">Fortryd</button>
      </div>
    )
  }

  if (isSelectingReason) {
    return (
      <div className="w-[160px] min-h-[172px] flex-1 bg-white rounded-xl border border-bad/20 p-xs flex flex-col gap-xxxs shadow-md">
        <div className="flex items-center justify-between mb-xxxs">
          <p className="font-inter text-xxs font-medium text-text-muted">Årsag til aflysning</p>
          {/* Fortryd hvis krydset blev klikket ved en fejl */}
          <button
            type="button"
            onClick={onAbortCancel}
            aria-label="Fortryd aflysning"
            className="w-5 h-5 rounded-full flex items-center justify-center text-text-muted hover:bg-[#F5F5F5] hover:text-text-primary transition-colors"
          >
            <X size={12} />
          </button>
        </div>
        {CANCEL_REASONS.map(r => (
          <button key={r.value} onClick={() => onConfirmCancel(r.value)}
            className="w-full text-left px-xs py-[6px] rounded-lg font-inter text-xs text-text-secondary hover:bg-[#F5F5F5] hover:text-text-primary transition-colors">
            {r.label}
          </button>
        ))}
        <button
          type="button"
          onClick={onAbortCancel}
          className="mt-auto w-full text-center px-xs py-[6px] rounded-lg font-inter text-xs font-medium text-dark-teal hover:bg-soft-aqua transition-colors"
        >
          Fortryd
        </button>
      </div>
    )
  }

  return (
    <div
      onClick={onFocus}
      className={[
        'relative w-[160px] min-h-[172px] flex-1 bg-white rounded-xl flex flex-col p-sm pb-lg gap-xs transition-all border cursor-pointer',
        isFocused ? 'border-dark-teal ring-1 ring-dark-teal/20' : 'border-hairline hover:border-hairline-2',
      ].join(' ')}>
      {/* Tidligere X-knap til aflysning er fjernet 2026-06-09 — aflysning sker nu via
          AFLYSNING-celle i ordredetalje-grid'et. Gammel kode bevares i v1-folder:
          ./v1/ProductBoxV2.v1.tsx */}

      {/* Vejr-knap — z-10 så den ligger foran morgen-tons boksen (samme placering) */}
      <div className="absolute bottom-[12px] right-[8px] z-10 group/weather">
        <button
          onClick={() => setWeatherActive(w => !w)}
          className={[
            'w-7 h-7 rounded-lg flex items-center justify-center border transition-all',
            weatherActive
              ? 'bg-dark-teal text-white border-dark-teal'
              : 'bg-[#F5F5F5] text-dark-teal border-hairline hover:bg-dark-teal hover:text-white hover:border-dark-teal',
          ].join(' ')}
          aria-label="Markér vejrrisiko"
          aria-pressed={weatherActive}
        >
          <CloudRain size={14} />
        </button>
        <div className="absolute bottom-full right-0 mb-xxxs opacity-0 group-hover/weather:opacity-100 transition-opacity pointer-events-none">
          <span className="whitespace-nowrap bg-[#1D1D1D] text-white font-inter text-xxs px-xs py-xxxs rounded-md">
            Minus regn
          </span>
        </div>
      </div>

      {/* Produkt-header — klikbar for fokus (driver Spec-grid). */}
      <button
        onClick={onFocus}
        aria-pressed={isFocused}
        className="flex flex-col items-start text-left pr-md"
      >
        <span className="font-poppins font-semibold text-sm text-text-primary leading-tight">{product.recipeName}</span>
        <span className="font-inter text-xxs text-text-muted">{product.thicknessMm} mm</span>
        {/* Samleordre: ordre-tags der viser hvilke ordrer dette produkt tilhører */}
        {ordreTagLabels && ordreTagLabels.length > 0 && (
          <div className="flex flex-wrap gap-xxxs mt-xxxs">
            {ordreTagLabels.map(label => (
              <span
                key={label}
                className="bg-soft-aqua text-deep-teal font-inter text-xxs px-xs py-xxxs rounded-full inline-flex items-center gap-xxxs"
              >
                {label}
              </span>
            ))}
          </div>
        )}
      </button>

      {/* Spacer — skubber Forventet + Morgen + checkbox til bunden, så de
          aligner på tværs af bokse uanset header-højde (med/uden ordre-tags). */}
      <div className="flex-1" />

      {/* Forventet — låses efter send (per unified planning model) */}
      <div>
        <span className="font-inter text-xxs text-text-muted uppercase tracking-widest block mb-xxxs">Forventet</span>
        <div className={[
          'flex items-center gap-xxxs border rounded-lg px-xs py-xxxs transition-colors',
          isSent
            ? 'bg-[#F5F5F5] border-hairline opacity-70 cursor-not-allowed'
            : 'bg-[#F5F5F5] border-hairline focus-within:border-dark-teal focus-within:bg-white',
        ].join(' ')}>
          <input
            type="number"
            value={day.tonsPlanned || ''}
            onChange={e => onUpdateTons(Math.max(0, parseInt(e.target.value, 10) || 0))}
            disabled={isSent}
            readOnly={isSent}
            className="font-poppins font-semibold text-lg text-text-primary bg-transparent border-none outline-none w-full tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none disabled:cursor-not-allowed"
            placeholder="0"
          />
          <span className="font-inter text-xxs text-text-muted flex-shrink-0">tons</span>
        </div>
      </div>

      {/* Morgen — låses efter send (per unified planning model) */}
      <div>
        <span className="font-inter text-xxs text-text-muted uppercase tracking-widest block mb-xxxs">Morgen tons</span>
        <div className={[
          'flex items-center gap-xxxs border rounded-lg px-xs py-xxxs transition-colors',
          isSent
            ? 'bg-[#E7F4EE] border-[#1F8A5B]/25 opacity-70 cursor-not-allowed'
            : day.morgenTons == null
              ? 'bg-[#FBECEA] border-[#C8372D]/25 focus-within:border-dark-teal focus-within:bg-white'
              : 'bg-[#E7F4EE] border-[#1F8A5B]/25 focus-within:border-dark-teal focus-within:bg-white',
        ].join(' ')}>
          <input
            type="number"
            value={day.morgenTons ?? ''}
            onChange={e => {
              const v = parseInt(e.target.value, 10)
              onUpdateMorgenTons(isNaN(v) ? undefined : Math.max(0, v))
            }}
            disabled={isSent}
            readOnly={isSent}
            className="font-poppins font-semibold text-lg text-text-primary bg-transparent border-none outline-none w-full tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none disabled:cursor-not-allowed"
            placeholder="–"
          />
          <span className="font-inter text-xxs text-text-muted flex-shrink-0">tons</span>
        </div>
      </div>

      {/* "Samles på en bil"-checkbox — per produkt+dag (sidder direkte efter Morgen — bottom-aligned via flex-1 spacer øverst) */}
      <label className="inline-flex items-center gap-xxxs cursor-pointer">
        <input
          type="checkbox"
          checked={samlesPaaEnBil ?? false}
          onChange={e => onSamlesPaaEnBilChange?.(e.target.checked)}
          disabled={isSent}
          className="w-3 h-3 accent-deep-teal disabled:cursor-not-allowed"
        />
        <span className="font-inter text-xxs text-text-muted">Samles på en bil</span>
      </label>

    </div>
  )
}

// ─── EkstraBestillingBox ─────────────────────────────────────────────────────
// Flow 9b (OPDATERET 2026-06-09): Synlig boks ved siden af produktet i Asfaltbestilling-
// rækken når PLAN har pushet en ekstra-bestilling fra fabrik (formand ringer fabrik →
// fabrik indfører i PLAN → app'en pull'er). Boksen viser KUN delta-mængden — totalen
// sammensættes via getEffectiveTons() i alle downstream-beregninger (Vejesedler,
// Dagsoverblik, Afregning, Ordredetaljer/Mængde tons).
// Dimensioner matcher ProductBoxV2 (w-[160px] min-h-[172px]) så de aligner i rækken.

export function EkstraBestillingBox({ product, day }: { product: MockProduct; day: DayPlan }) {
  if (!day.ekstraTons) return null
  return (
    // Layout speljer ProductBoxV2 EKSAKT: p-sm pb-lg + gap-xs + flex-1 spacer + 3 sektioner
    // (label+input-boks, label+timestamp, usynligt checkbox-placeholder) så "Ekstra"-labelen
    // lander på samme højde som "Forventet"-labelen i naboboksen.
    <div className="relative w-[160px] min-h-[172px] flex-1 bg-warning rounded-xl border border-warning flex flex-col p-sm pb-lg gap-xs">
      {/* Header — matcher ProductBoxV2 header-blok (recipeName + tykkelse) */}
      <div className="flex flex-col items-start text-left pr-md">
        <span className="font-poppins font-semibold text-sm text-text-primary leading-tight">
          {product.recipeName}
        </span>
        <span className="font-inter text-xxs text-text-muted">{product.thicknessMm} mm</span>
      </div>

      {/* Spacer — matcher ProductBoxV2's flex-1 spacer */}
      <div className="flex-1" />

      {/* "Forventet"-equivalent: "Ekstra"-label + +N tons inder-boks */}
      <div>
        <span className="font-inter text-xxs text-text-muted uppercase tracking-widest block mb-xxxs">Ekstra</span>
        <div className="flex items-center gap-xxxs border border-hairline rounded-lg px-xs py-xxxs bg-white/60">
          <span className="font-poppins font-semibold text-lg text-text-primary tabular-nums w-full">
            +{day.ekstraTons.tons}
          </span>
          <span className="font-inter text-xxs text-text-muted flex-shrink-0">tons</span>
        </div>
      </div>

      {/* "Morgen"-equivalent: Bekræftet-label + timestamp i input-stilet boks (samme højde som Morgen-boks i ProductBoxV2) */}
      <div>
        <span className="font-inter text-xxs text-text-muted uppercase tracking-widest block mb-xxxs">Bekræftet</span>
        <div className="flex items-center gap-xxxs border border-hairline rounded-lg px-xs py-xxxs bg-white/60">
          <span className="font-poppins font-semibold text-md text-text-primary tabular-nums w-full">
            kl. {formatTime(day.ekstraTons.tidspunkt)}
          </span>
        </div>
      </div>

      {/* "Samles på en bil"-equivalent: usynlig checkbox-label med EKSAKT samme højde */}
      <label className="invisible inline-flex items-center gap-xxxs" aria-hidden="true">
        <input type="checkbox" disabled />
        <span className="font-inter text-xxs">Samles på en bil</span>
      </label>
    </div>
  )
}
