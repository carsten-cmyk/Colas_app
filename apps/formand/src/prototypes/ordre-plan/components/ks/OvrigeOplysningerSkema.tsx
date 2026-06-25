import { useState } from 'react'
import type { MockProduct } from '../../types'
import { KS_INPUT_CLS, KS_LABEL_CLS } from './ksConstants'
import { JaNejToggle } from '../JaNejToggle'

/** A3 / A4 — Øvrige oplysninger (ØVR. 3.a og ØVR. 4.a) — identisk struktur, kun label varierer */
export function OvrigeOplysningerSkema({
  variant,
  products,
  selectedDate: _selectedDate,
}: {
  variant: '3a' | '4a'
  products: MockProduct[]
  /** YYYY-MM-DD — bevaret i props-interface for fremtidig brug */
  selectedDate: string
}) {
  // Produkt-navigation — 0 = første produkt valgt som default
  const [lagProduktIdx, setLagProduktIdx] = useState<number | null>(0)

  // Live-beregnede felter — TODO: Erstat med Supabase når klar
  const [udlagtTons, setUdlagtTons] = useState('48.5')
  const [laengde, setLaengde] = useState('120')
  const [bredde, setBredde] = useState('4.5')
  const [tillaeg, setTillaeg] = useState('12')
  const areal = (parseFloat(laengde) || 0) * (parseFloat(bredde) || 0)
  const arealIalt = areal + (parseFloat(tillaeg) || 0)
  const gennsnForbrug = arealIalt > 0 ? ((parseFloat(udlagtTons) || 0) * 1000) / arealIalt : 0

  const [skitseVedlagt, setSkitseVedlagt] = useState<'ja' | 'nej' | null>('nej')
  const [ovrSaved, setOvrSaved] = useState(false)
  const lagLegend = lagProduktIdx === null ? '0. Lag' : `${lagProduktIdx + 1}. Lag`
  const felterAktive = lagProduktIdx !== null

  return (
    <div className="space-y-md">
      <p className="font-poppins font-semibold text-sm text-text-primary">
        Øvrige oplysninger til {variant}
      </p>

      {/* Lag-fieldset med produkt-navigation */}
      <fieldset className="border border-hairline rounded-lg p-sm">
        <legend className="font-poppins text-xs font-semibold text-text-primary px-xs">{lagLegend}</legend>
        <div className="space-y-sm mt-xs">

          {/* Produkt-navigation — segmented control, ét produkt pr. knap */}
          <div className="flex flex-col gap-xxxs">
            <span className={KS_LABEL_CLS}>Vælg produkt</span>
            <div className="flex flex-wrap bg-surface-2 rounded-md p-xxxs border border-hairline w-fit gap-xxxs">
            {products.map((p, idx) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setLagProduktIdx(idx)}
                className={
                  'px-xs py-xxxs rounded-sm font-inter text-xxs font-semibold transition-colors ' +
                  (lagProduktIdx === idx
                    ? 'bg-dark-teal text-white'
                    : 'text-text-muted hover:bg-soft-aqua')
                }
              >
                {p.recipeCode ?? p.recipeName}
              </button>
            ))}
            </div>
          </div>

          {/* Felter — disabled + dæmpet når intet produkt er valgt */}
          <div className={felterAktive ? undefined : 'opacity-60 pointer-events-none'}>
            <div className="space-y-sm">

              {/* Stationering */}
              <div className="flex flex-col gap-xxxs">
                <label className={KS_LABEL_CLS}>Stationering</label>
                <input
                  type="text"
                  defaultValue=""
                  placeholder="fx 0+000 – 0+120"
                  disabled={!felterAktive}
                  className={KS_INPUT_CLS}
                />
              </div>

              {/* Udlagt antal tons */}
              <div className="flex flex-col gap-xxxs">
                <label className={KS_LABEL_CLS}>Udlagt antal tons</label>
                <input
                  type="number"
                  value={udlagtTons}
                  onChange={e => setUdlagtTons(e.target.value)}
                  step="0.1"
                  min="0"
                  disabled={!felterAktive}
                  className={KS_INPUT_CLS + ' w-32'}
                />
              </div>

              {/* Udlægningsareal */}
              <div className="flex flex-col gap-xxxs">
                <label className={KS_LABEL_CLS}>Udlægningsareal (l × b)</label>
                <div className="flex items-center gap-xs">
                  <input
                    type="number"
                    value={laengde}
                    onChange={e => setLaengde(e.target.value)}
                    step="0.1"
                    min="0"
                    placeholder="Længde"
                    disabled={!felterAktive}
                    className={KS_INPUT_CLS + ' w-24'}
                  />
                  <span className="font-inter text-xs text-text-muted">×</span>
                  <input
                    type="number"
                    value={bredde}
                    onChange={e => setBredde(e.target.value)}
                    step="0.01"
                    min="0"
                    placeholder="Bredde"
                    disabled={!felterAktive}
                    className={KS_INPUT_CLS + ' w-24'}
                  />
                  <span className="font-inter text-xs text-text-muted shrink-0">
                    → {areal.toFixed(1).replace('.', ',')} m²
                  </span>
                </div>
              </div>

              {/* Tillægsareal */}
              <div className="flex flex-col gap-xxxs">
                <label className={KS_LABEL_CLS}>Tillægsareal (m²)</label>
                <input
                  type="number"
                  value={tillaeg}
                  onChange={e => setTillaeg(e.target.value)}
                  step="0.1"
                  min="0"
                  disabled={!felterAktive}
                  className={KS_INPUT_CLS + ' w-32'}
                />
              </div>

              {/* Read-only beregnede felter */}
              <div className="grid grid-cols-2 gap-sm">
                <div className="flex flex-col gap-xxxs">
                  <span className={KS_LABEL_CLS}>Areal i alt</span>
                  <span className="font-inter text-xs font-semibold text-text-primary">
                    {arealIalt.toFixed(1).replace('.', ',')} m²
                  </span>
                </div>
                <div className="flex flex-col gap-xxxs">
                  <span className={KS_LABEL_CLS}>Gennemsnitsforbrug</span>
                  <span className="font-inter text-xs font-semibold text-text-primary">
                    {gennsnForbrug.toFixed(1).replace('.', ',')} kg/m²
                  </span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </fieldset>

      {/* Skitse vedlagt */}
      <fieldset className="border border-hairline rounded-lg p-sm">
        <legend className="font-poppins text-xs font-semibold text-text-primary px-xs">Skitse vedlagt</legend>
        <div className="mt-xs">
          <JaNejToggle value={skitseVedlagt} onChange={setSkitseVedlagt} />
        </div>
      </fieldset>

      {/* Bemærkninger */}
      <fieldset className="border border-hairline rounded-lg p-sm">
        <legend className="font-poppins text-xs font-semibold text-text-primary px-xs">Bemærkninger</legend>
        <textarea
          defaultValue=""
          placeholder="Skriv eventuelle bemærkninger her…"
          rows={3}
          className={KS_INPUT_CLS + ' mt-xs resize-none'}
        />
      </fieldset>

      {/* Gem-knap */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setOvrSaved(true)}
          className={
            'font-poppins font-semibold text-xs px-md py-xs rounded-md transition-colors ' +
            (ovrSaved
              ? 'bg-good text-white cursor-default'
              : 'bg-yellow text-deep-teal hover:opacity-90 active:scale-[0.98]')
          }
        >
          {ovrSaved ? 'Gemt' : 'Gem'}
        </button>
      </div>
    </div>
  )
}
