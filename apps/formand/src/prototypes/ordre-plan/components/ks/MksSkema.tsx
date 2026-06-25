import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { MockProduct, EkstraarbejdeBlokProps } from '../../types'
import { KS_INPUT_CLS, KS_LABEL_CLS } from './ksConstants'
import { JaNejToggle } from '../JaNejToggle'
import { EkstraarbejdeBlok } from '../EkstraarbejdeBlok'

export function MksSkema({
  products,
  selectedDate: _selectedDate,
  ekstraarbejde,
}: {
  products: MockProduct[]
  selectedDate: string
  /** Delt ekstraarbejde-state fra UdfoerselContent — vises i eget fieldset under Færdiggørelse */
  ekstraarbejde: EkstraarbejdeBlokProps
}) {
  // Ingen state-persist — visuel mockup, TODO: Erstat med Supabase når klar
  void products // bruges ikke direkte i mockup, men sendes med for fremtidig Supabase-binding

  // Controlled state for toggles (kun toggles + årsag er controlled — øvrige felter forbliver uncontrolled)
  const [intakt, setIntakt] = useState<'ja' | 'nej' | null>(null)
  const [aarsag, setAarsag] = useState('')
  const [aarsagDirty, setAarsagDirty] = useState(false)

  // Klæbning type — default emulsion, aldrig null
  const [klæbningType, setKlæbningType] = useState<'emulsion' | 'andet'>('emulsion')
  const [klæbningAndet, setKlæbningAndet] = useState('')
  const [klæbningAndetDirty, setKlæbningAndetDirty] = useState(false)

  const [kravSamlinger, setKravSamlinger] = useState<'ja' | 'nej' | null>(null)
  const [kravProfil, setKravProfil] = useState<'ja' | 'nej' | null>(null)
  const [mksSaved, setMksSaved] = useState(false)
  const [kravJaevnhed, setKravJaevnhed] = useState<'ja' | 'nej' | null>(null)

  const [konstRivninger, setKonstRivninger] = useState<'ja' | 'nej' | null>(null)
  const [konstSvedninger, setKonstSvedninger] = useState<'ja' | 'nej' | null>(null)
  const [konstDriftsstop, setKonstDriftsstop] = useState<'ja' | 'nej' | null>(null)

  const [rensningDaeksler, setRensningDaeksler] = useState<'ja' | 'nej' | null>(null)
  const [rensningDandfang, setRensningDandfang] = useState<'ja' | 'nej' | null>(null)

  // Valideringsfejl: vis kun fejl når bruger har valgt Nej OG har rørt feltet
  const visAarsagFejl = intakt === 'nej' && (aarsagDirty || aarsag.length > 0) && aarsag.trim() === ''

  // Valideringsfejl for Hvis Andet: vis først efter bruger har rørt feltet (Emulsion er default → ingen fejl ved start)
  const visAndetFejl = klæbningType === 'andet' && klæbningAndetDirty && klæbningAndet.trim() === ''

  return (
    <div className="space-y-md">
      <p className="font-poppins font-semibold text-sm text-text-primary">Oplysninger til brug for MKS</p>

      {/* Vejrforhold */}
      <fieldset className="border border-hairline rounded-lg p-sm">
        <legend className="font-poppins text-xs font-semibold text-text-primary px-xs">Vejrforhold</legend>
        {/* Mobile-first: stak på smal skærm, 2-kolonne fra tablet (sm ≥640) og op */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-sm mt-xs">

          {/* Lufttemperatur + klokkeslæt */}
          <div className="flex flex-col gap-xxxs">
            <label className={KS_LABEL_CLS}>Lufttemperatur (°C)</label>
            <input type="number" defaultValue="" placeholder="fx 18" step="0.1" className={KS_INPUT_CLS} />
          </div>
          <div className="flex flex-col gap-xxxs">
            <label className={KS_LABEL_CLS}>Kl.</label>
            <input type="time" defaultValue="" className={KS_INPUT_CLS} />
          </div>

          {/* Vind */}
          <div className="flex flex-col gap-xxxs">
            <label className={KS_LABEL_CLS}>Vind</label>
            <div className="relative">
              <select defaultValue="" className={KS_INPUT_CLS + ' appearance-none pr-[24px]'}>
                <option value="" disabled>— Vælg —</option>
                {['Stærk', 'Svag', 'Skiftende', 'Ingen'].map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
              <ChevronDown size={12} className="absolute right-xs top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
            </div>
          </div>

          {/* Regn */}
          <div className="flex flex-col gap-xxxs">
            <label className={KS_LABEL_CLS}>Regn</label>
            <div className="relative">
              <select defaultValue="" className={KS_INPUT_CLS + ' appearance-none pr-[24px]'}>
                <option value="" disabled>— Vælg —</option>
                {['Stærk', 'Svag', 'Skiftende', 'Ingen'].map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
              <ChevronDown size={12} className="absolute right-xs top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
            </div>
          </div>

          {/* Vejoverfladens tilstand */}
          <div className="col-span-1 sm:col-span-2 flex flex-col gap-xxxs">
            <label className={KS_LABEL_CLS}>Vejoverfladens tilstand</label>
            <div className="relative">
              <select defaultValue="" className={KS_INPUT_CLS + ' appearance-none pr-[24px]'}>
                <option value="" disabled>— Vælg —</option>
                {['Tør', 'Våd', 'Optørrende'].map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
              <ChevronDown size={12} className="absolute right-xs top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
            </div>
          </div>
        </div>
      </fieldset>

      {/* Klæbning */}
      <fieldset className="border border-hairline rounded-lg p-sm">
        <legend className="font-poppins text-xs font-semibold text-text-primary px-xs">Klæbning</legend>
        <div className="space-y-sm mt-xs">

          {/* 2-kolonne gruppe: Klæbning intakt (venstre) + Type (højre) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">

            {/* Kolonne 1: Klæbning intakt + Årsag */}
            <div className="flex flex-col gap-xs">
              <div className="flex items-center gap-md">
                <span className={KS_LABEL_CLS + ' shrink-0'}>Klæbning intakt</span>
                <JaNejToggle value={intakt} onChange={v => { setIntakt(v); if (v !== 'nej') setAarsagDirty(false) }} />
              </div>
              <div className="flex flex-col gap-xxxs">
                <span className={KS_LABEL_CLS}>Årsag{intakt === 'nej' ? ' *' : ''}</span>
                <textarea
                  rows={2}
                  value={aarsag}
                  onChange={e => setAarsag(e.target.value)}
                  onBlur={() => { if (intakt === 'nej') setAarsagDirty(true) }}
                  placeholder="Beskriv årsag…"
                  className={KS_INPUT_CLS + ' resize-y' + (visAarsagFejl ? ' border-bad' : '')}
                />
                {visAarsagFejl && (
                  <span className="font-inter text-xxs text-bad">
                    Årsag skal udfyldes når klæbning ikke er intakt
                  </span>
                )}
              </div>
            </div>

            {/* Kolonne 2: Type + Hvis Andet */}
            <div className="flex flex-col gap-xs">
              <div className="flex items-center gap-md">
                <label className={KS_LABEL_CLS + ' shrink-0'}>Type</label>
                {/* OptionToggle: samme styling som JaNejToggle, options Emulsion/Andet, default emulsion */}
                <div className="flex bg-surface-2 rounded-md p-xxxs border border-hairline w-fit">
                  {(['emulsion', 'andet'] as const).map(opt => {
                    const isActive = klæbningType === opt
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => {
                          setKlæbningType(opt)
                          if (opt !== 'andet') setKlæbningAndetDirty(false)
                        }}
                        aria-pressed={isActive}
                        className={[
                          'px-xs py-xxxs rounded-sm font-inter text-xxs font-semibold transition-colors',
                          isActive ? 'bg-dark-teal text-white' : 'text-text-muted hover:bg-soft-aqua',
                        ].join(' ')}
                      >
                        {opt === 'emulsion' ? 'Emulsion' : 'Andet'}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div className="flex flex-col gap-xxxs">
                <label className={KS_LABEL_CLS}>Hvis Andet{klæbningType === 'andet' ? ' *' : ''}</label>
                <textarea
                  rows={2}
                  value={klæbningAndet}
                  onChange={e => setKlæbningAndet(e.target.value)}
                  onBlur={() => { if (klæbningType === 'andet') setKlæbningAndetDirty(true) }}
                  placeholder="Specificér…"
                  className={KS_INPUT_CLS + ' resize-y' + (visAndetFejl ? ' border-bad' : '')}
                />
                {visAndetFejl && (
                  <span className="font-inter text-xxs text-bad">
                    Specifikation skal udfyldes når type er Andet
                  </span>
                )}
              </div>
            </div>

          </div>

          {/* Mængde */}
          <div className="flex items-center gap-xs">
            <div className="flex flex-col gap-xxxs flex-1 max-w-[140px]">
              <label className={KS_LABEL_CLS}>Mængde (Kg/m²)</label>
              <input type="number" defaultValue="" step="0.01" min="0" placeholder="0,00" className={KS_INPUT_CLS} />
            </div>
          </div>
        </div>
      </fieldset>

      {/* Udlægning + konstateret */}
      <fieldset className="border border-hairline rounded-lg p-sm">
        <legend className="font-poppins text-xs font-semibold text-text-primary px-xs">Udlægning og konstateret</legend>
        <div className="mt-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-lg gap-y-xs">
            {/* Venstre: Krav opfyldt */}
            <div className="space-y-xs">
              <p className="font-inter text-xs font-semibold text-text-muted">Krav opfyldt</p>
              {([
                { label: 'Samlinger', value: kravSamlinger, set: setKravSamlinger },
                { label: 'Profil',    value: kravProfil,    set: setKravProfil    },
                { label: 'Jævnhed',  value: kravJaevnhed,  set: setKravJaevnhed  },
              ] as const).map(({ label, value, set }) => (
                <div key={label} className="flex items-center gap-sm">
                  <span className={KS_LABEL_CLS + ' w-20 shrink-0'}>{label}</span>
                  <JaNejToggle value={value} onChange={set} />
                </div>
              ))}
            </div>

            {/* Højre: Er der konstateret */}
            <div className="space-y-xs">
              <p className="font-inter text-xs font-semibold text-text-muted">Er der konstateret</p>
              {([
                { label: 'Rivninger',  value: konstRivninger,  set: setKonstRivninger  },
                { label: 'Svedninger', value: konstSvedninger, set: setKonstSvedninger },
                { label: 'Driftsstop', value: konstDriftsstop, set: setKonstDriftsstop },
              ] as const).map(({ label, value, set }) => (
                <div key={label} className="flex items-center gap-sm">
                  <span className={KS_LABEL_CLS + ' w-20 shrink-0'}>{label}</span>
                  <JaNejToggle value={value} onChange={set} />
                </div>
              ))}
            </div>
          </div>

          {/* Forklaring — spænder over begge kolonner */}
          <div className="flex flex-col gap-xxxs mt-sm">
            <label className={KS_LABEL_CLS}>Forklaring</label>
            <input
              type="text"
              defaultValue=""
              placeholder="Beskriv eventuelle afvigelser…"
              className={KS_INPUT_CLS}
            />
          </div>
        </div>
      </fieldset>

      {/* Færdiggørelse */}
      <fieldset className="border border-hairline rounded-lg p-sm">
        <legend className="font-poppins text-xs font-semibold text-text-primary px-xs">Færdiggørelse</legend>
        <div className="space-y-xs mt-xs">
          {/* Toggles i fælles grid: kolonne 1 sizer til længste tekst → begge toggles
              står justeret under hinanden, tæt på teksten (ikke ved yderkanten). */}
          <div className="grid grid-cols-[auto_auto] gap-x-md gap-y-xs items-center w-fit">
            {([
              { label: 'Rensning af dæksler og riste', value: rensningDaeksler, set: setRensningDaeksler },
              { label: 'Rensning af sandfang',          value: rensningDandfang, set: setRensningDandfang },
            ] as const).flatMap(({ label, value, set }) => [
              <span key={`${label}-label`} className={KS_LABEL_CLS}>{label}</span>,
              <JaNejToggle key={`${label}-toggle`} value={value} onChange={set} />,
            ])}
          </div>

          {/* Ingen MKS krav */}
          <div className="flex items-center gap-xs">
            <input
              type="checkbox"
              id="mks-ingen-krav"
              className="accent-deep-teal w-4 h-4 rounded"
            />
            <label htmlFor="mks-ingen-krav" className="font-inter text-xs text-text-primary cursor-pointer">
              Ingen MKS krav
            </label>
          </div>

          {/* Aftalt med */}
          <div className="flex flex-col gap-xxxs">
            <label htmlFor="mks-aftalt-med" className={KS_LABEL_CLS}>Aftalt med</label>
            <input
              id="mks-aftalt-med"
              type="text"
              defaultValue=""
              placeholder="Navn på kontaktperson…"
              className={KS_INPUT_CLS}
            />
          </div>
        </div>
      </fieldset>

      {/* Ekstraarbejde */}
      <fieldset className="border border-hairline rounded-lg p-sm">
        <legend className="font-poppins text-xs font-semibold text-text-primary px-xs">Ekstraarbejde</legend>
        <div className="mt-xs">
          <EkstraarbejdeBlok {...ekstraarbejde} />
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
          onClick={() => setMksSaved(true)}
          className={
            mksSaved
              ? 'font-poppins font-semibold text-xs px-md py-xs rounded-md transition-colors bg-good text-white cursor-default'
              : 'font-poppins font-semibold text-xs px-md py-xs rounded-md transition-colors bg-yellow text-deep-teal hover:opacity-90 active:scale-[0.98]'
          }
        >
          {mksSaved ? 'Gemt' : 'Gem'}
        </button>
      </div>
    </div>
  )
}
