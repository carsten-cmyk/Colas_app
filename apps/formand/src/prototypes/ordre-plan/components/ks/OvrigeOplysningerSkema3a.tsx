import { useState } from 'react'
import type { MockProduct } from '../../types'
import { KS_INPUT_CLS, KS_LABEL_CLS } from './ksConstants'
import { JaNejToggle } from '../JaNejToggle'

/** Øvrige oplysninger til 3a — PLAN-blanket 3a */
export function OvrigeOplysningerSkema3a({
  products,
}: {
  products: MockProduct[]
  selectedDate: string
}) {
  const [produktIdx, setProduktIdx] = useState<number | null>(0)

  // Strækning kontrolleret
  const [afmTidMorgen, setAfmTidMorgen] = useState('00:00')
  const [afmTidAften, setAfmTidAften] = useState('00:00')
  const [afmNej, setAfmNej] = useState(true)

  // TODO: Erstat med Supabase når klar — Bygherre præudfyldes fra ordrens kunde (kundeVirksomhed)
  const [bygherre, setBygherre] = useState('Uddannelsescenter Syd')

  // Udfyldes af EL / DL
  const [bygherretilsyn, setBygherretilsyn] = useState('')
  const [proeveUdtaget, setProeveUdtaget] = useState<'ja' | 'nej' | null>(null)
  const [komprimering, setKomprimering] = useState<'ja' | 'nej' | null>(null)
  const [laboratoriekontrol, setLaboratoriekontrol] = useState<'ja' | 'nej' | null>(null)

  // Materialer — 4 temperaturmålinger (blanket-sektion "3. Materialer")
  // TODO: Erstat med Supabase når klar — tidspunkterne auto-præudfyldes i produktion
  // fra dagens afsluttede læs ved dagens afslutning; temperatur indtastes manuelt af formanden.
  const [materialeMaalinger, setMaterialeMaalinger] = useState<
    { uensartede: 'ja' | 'nej' | null; temperaturC: string; klokkeslaet: string }[]
  >([
    { uensartede: 'nej', temperaturC: '', klokkeslaet: '20:30' },
    { uensartede: 'nej', temperaturC: '', klokkeslaet: '22:00' },
    { uensartede: 'nej', temperaturC: '', klokkeslaet: '00:00' },
    { uensartede: 'nej', temperaturC: '', klokkeslaet: '03:00' },
  ])

  function updateMaaling(
    idx: number,
    field: 'uensartede' | 'temperaturC' | 'klokkeslaet',
    value: 'ja' | 'nej' | null | string
  ) {
    setMaterialeMaalinger(prev =>
      prev.map((m, i) => (i === idx ? { ...m, [field]: value } : m))
    )
  }

  const [saved3a, setSaved3a] = useState(false)

  return (
    <div className="space-y-md">
      <p className="font-poppins font-semibold text-sm text-text-primary">Øvrige oplysninger til 3a</p>

      {/* Øverste boks — Strækning, Bygherre, Afmærkning */}
      <fieldset className="border border-hairline rounded-lg p-sm">
        <legend className="font-poppins text-xs font-semibold text-text-primary px-xs sr-only">Generelle oplysninger</legend>
        <div className="space-y-sm mt-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-sm">
            <div className="flex flex-col gap-xxxs">
              <label className={KS_LABEL_CLS}>Strækning</label>
              <input type="text" defaultValue="" placeholder="fx Rådhuspladsen – Nørreport" className={KS_INPUT_CLS} />
            </div>
            <div className="flex flex-col gap-xxxs">
              <label className={KS_LABEL_CLS}>Bygherre</label>
              <input type="text" value={bygherre} onChange={e => setBygherre(e.target.value)} placeholder="fx Vejdirektoratet" className={KS_INPUT_CLS} />
            </div>
          </div>

          {/* Afmærkning kontrolleret */}
          <div className="flex flex-wrap items-center gap-sm">
            <span className={KS_LABEL_CLS}>Strækning kontrolleret</span>
            <div className="flex flex-wrap items-center gap-sm">
              <label className="inline-flex items-center gap-xs">
                <span className={KS_LABEL_CLS}>Morgen</span>
                <span className={KS_LABEL_CLS}>Kl.</span>
                <input
                  type="time"
                  value={afmTidMorgen}
                  onChange={e => setAfmTidMorgen(e.target.value)}
                  className={KS_INPUT_CLS + ' w-28'}
                />
              </label>
              <label className="inline-flex items-center gap-xs">
                <span className={KS_LABEL_CLS}>Aften</span>
                <span className={KS_LABEL_CLS}>Kl.</span>
                <input
                  type="time"
                  value={afmTidAften}
                  onChange={e => setAfmTidAften(e.target.value)}
                  className={KS_INPUT_CLS + ' w-28'}
                />
              </label>
              <label className="inline-flex items-center gap-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={afmNej}
                  onChange={e => setAfmNej(e.target.checked)}
                  className="accent-deep-teal w-4 h-4"
                />
                <span className={KS_LABEL_CLS}>Nej</span>
              </label>
            </div>
          </div>
        </div>
      </fieldset>

      {/* Materialer — blanket-sektion "3. Materialer": 4 temperaturmålinger som 4 kolonner */}
      <fieldset className="border border-hairline rounded-lg p-sm">
        <legend className="font-poppins text-xs font-semibold text-text-primary px-xs">Materialer</legend>
        <div className="mt-xs space-y-xs">
          {/* Række-label + 4-kolonne grid */}
          <div className="grid grid-cols-4 gap-sm">
            {materialeMaalinger.map((m, idx) => (
              <div key={idx} className="flex flex-col gap-xxxs">
                <span className={KS_LABEL_CLS + ' text-center'}>Måling {idx + 1}</span>
                {/* Uensartede — separat JaNejToggle pr. kolonne */}
                <div className="flex flex-col gap-xxxs">
                  <span className={KS_LABEL_CLS}>Uensartede</span>
                  <JaNejToggle
                    value={m.uensartede}
                    onChange={val => updateMaaling(idx, 'uensartede', val)}
                  />
                </div>
                {/* Temperatur */}
                <div className="flex flex-col gap-xxxs">
                  <label className={KS_LABEL_CLS}>°C</label>
                  <input
                    type="number"
                    value={m.temperaturC}
                    onChange={e => updateMaaling(idx, 'temperaturC', e.target.value)}
                    placeholder="–"
                    className={KS_INPUT_CLS}
                  />
                </div>
                {/* Klokkeslæt — præudfyldt med jævnt fordelte tidspunkter for aften/nat-udlægning */}
                <div className="flex flex-col gap-xxxs">
                  <label className={KS_LABEL_CLS}>Kl</label>
                  <input
                    type="time"
                    value={m.klokkeslaet}
                    onChange={e => updateMaaling(idx, 'klokkeslaet', e.target.value)}
                    className={KS_INPUT_CLS}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </fieldset>

      {/* Produktoplysninger — sektion-overskrift + segmented control */}
      <div className="space-y-xs">
        <p className="font-poppins text-xs font-semibold text-text-primary">Produktoplysninger</p>
        <div className="flex flex-col gap-xxxs">
          <span className={KS_LABEL_CLS}>Vælg produkt</span>
          <div className="flex flex-wrap bg-surface-2 rounded-md p-xxxs border border-hairline w-fit gap-xxxs">
          {products.map((p, idx) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setProduktIdx(idx)}
              className={
                'px-xs py-xxxs rounded-sm font-inter text-xxs font-semibold transition-colors ' +
                (produktIdx === idx
                  ? 'bg-dark-teal text-white'
                  : 'text-text-muted hover:bg-soft-aqua')
              }
            >
              {p.recipeCode ?? p.recipeName}
            </button>
          ))}
          </div>
        </div>
      </div>

      {/* Udfyldes af EL / DL */}
      <fieldset className="border border-hairline rounded-lg p-sm">
        <legend className="font-poppins text-xs font-semibold text-text-primary px-xs">Udfyldes af EL / DL</legend>
        <div className="space-y-sm mt-xs">
          <div className="flex flex-col gap-xxxs">
            <label className={KS_LABEL_CLS}>Bygherretilsyn</label>
            <input
              type="text"
              value={bygherretilsyn}
              onChange={e => setBygherretilsyn(e.target.value)}
              placeholder="Navn på tilsynsførende"
              className={KS_INPUT_CLS}
            />
          </div>
          <div className="flex flex-col gap-xxxs">
            <span className={KS_LABEL_CLS}>Prøve udtaget ved anlæg (tilsyn)</span>
            <JaNejToggle value={proeveUdtaget} onChange={setProeveUdtaget} />
          </div>
          <div className="flex flex-col gap-xxxs">
            <span className={KS_LABEL_CLS}>Komprimeringskontrol bestilt</span>
            <JaNejToggle value={komprimering} onChange={setKomprimering} />
          </div>
          <div className="flex flex-col gap-xxxs">
            <span className={KS_LABEL_CLS}>Laboratoriekontrol bestilt</span>
            <JaNejToggle value={laboratoriekontrol} onChange={setLaboratoriekontrol} />
          </div>
          <div className="flex flex-col gap-xxxs">
            <label className={KS_LABEL_CLS}>Bemærkninger</label>
            <textarea
              rows={3}
              defaultValue=""
              placeholder="Skriv eventuelle bemærkninger her…"
              className={KS_INPUT_CLS + ' resize-y'}
            />
          </div>
        </div>
      </fieldset>

      {/* Gem-knap */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setSaved3a(true)}
          className={
            'font-poppins font-semibold text-xs px-md py-xs rounded-md transition-colors ' +
            (saved3a
              ? 'bg-good text-white cursor-default'
              : 'bg-yellow text-deep-teal hover:opacity-90 active:scale-[0.98]')
          }
        >
          {saved3a ? 'Gemt' : 'Gem'}
        </button>
      </div>
    </div>
  )
}
