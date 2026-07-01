import { useState, useRef } from 'react'
import { ChevronDown, ChevronUp, Camera, Plus } from 'lucide-react'
import { EkstraarbejdeBlok } from '../../../components/EkstraarbejdeBlok'
import { ForCheckbox } from '../../../components/ForCheckbox'
import { JaNejToggle } from '../../../components/JaNejToggle'
import { SamleordreChildTabs } from '../../../components/SamleordreChildTabs'
import { UNDERLAG_OPTIONS, AARSAG_OPTIONS } from '../../../mocks'
import type {
  MockPhoto,
  SamleordreContext,
  EkstraLinje,
  UnderlagType,
  UnderlaegsAarsag,
} from '../../../types'

export interface ForundersoegelsesSectionProps {
  /** Fotos taget under forundersøgelsen — løftet til root */
  forundersoegelseFotos: MockPhoto[]
  /** Callback der tilføjer nye fotos — løftet til root */
  onAddPhotos: (p: MockPhoto[]) => void
  /** True når Ordre-plan vises i samleordre-kontekst */
  isSamleordreMode?: boolean
  /** Samleordre-context med children (anchor + andre ordrer) når isSamleordreMode === true */
  samleordreCtx?: SamleordreContext | null
  /** Aktivt ordrenummer i samleordre-tab — bruges til per-child preview i Forundersøgelse-header */
  samleordreTabOrderNr?: string
  /**
   * Callback der skifter aktivt child-ordrenummer — løftes opad til container.
   * Optional så typecheck er grøn inden container-wiring er færdig.
   */
  onSelectSamleordreTab?: (orderNumber: string) => void
  /** Ekstralinjer — løftet til root så AfregningContent kan aflæse dem */
  ekstraLinjer: EkstraLinje[]
  setEkstraLinjer: React.Dispatch<React.SetStateAction<EkstraLinje[]>>
  /** Om ekstraarbejde er sendt (godkendt) — løftet til root */
  ekstraSent: boolean
  setEkstraSent: (b: boolean) => void
}

export function ForundersoegelseSection({
  forundersoegelseFotos,
  onAddPhotos,
  isSamleordreMode,
  samleordreCtx,
  samleordreTabOrderNr,
  onSelectSamleordreTab,
  ekstraLinjer,
  setEkstraLinjer,
  ekstraSent,
  setEkstraSent,
}: ForundersoegelsesSectionProps) {
  const [underlaegsType, setUnderlaegsType] = useState<UnderlagType | ''>('asfalt')
  const [underlaegsAndet, setUnderlaegsAndet] = useState('')
  const [tilfredsstillende, setTilfredsstillende] = useState<boolean | null>(null)
  const [underlaegsAarsager, setUnderlaegsAarsager] = useState<Set<UnderlaegsAarsag>>(new Set())
  const [aftaltMed, setAftaltMed] = useState('')
  const [forbehold, setForbehold] = useState('')
  const [saved, setSaved] = useState(false)
  const [forundersoegelseOpen, setForundersoegelseOpen] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const PHOTO_COLORS = ['bg-dark-teal/20', 'bg-yellow/20', 'bg-light-aqua/40']

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    const newPhotos: MockPhoto[] = files.map((file, i) => ({
      id: `fo-${Date.now()}-${i}`,
      color: PHOTO_COLORS[(forundersoegelseFotos.length + i) % PHOTO_COLORS.length],
      label: file.name.replace(/\.[^.]+$/, ''),
      source: 'forundersoegelse',
      url: URL.createObjectURL(file),
    }))
    onAddPhotos(newPhotos)
    // Reset så samme fil kan vælges igen
    e.target.value = ''
  }

  function toggleAarsag(a: UnderlaegsAarsag) {
    setUnderlaegsAarsager(prev => {
      const next = new Set(prev)
      if (next.has(a)) next.delete(a); else next.add(a)
      return next
    })
    setSaved(false)
  }

  function addEkstraLinje() {
    setEkstraLinjer(prev => [...prev, { id: `el-${Date.now()}`, type: '', beskrivelse: '', antal: 1 }])
  }

  function updateEkstraLinje(id: string, field: keyof EkstraLinje, value: string | number) {
    setEkstraLinjer(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l))
    setEkstraSent(false)
  }

  function removeEkstraLinje(id: string) {
    setEkstraLinjer(prev => prev.filter(l => l.id !== id))
  }

  // Beregn om tab-blokken skal vises — bruges til betinget afrunding af boks-wrapper
  const showChildTabs = Boolean(
    isSamleordreMode && samleordreCtx && samleordreCtx.children.length > 1 && samleordreTabOrderNr
  )

  return (
    // TODO (produktion): Sektion filtreres på (selectedProductId, selectedDate)
    <section>
      {/* Header: vis aktiv child-sted i samleordre-mode så formanden ser hvilken ordre detaljer tilhører */}
      <h2 className="font-poppins font-semibold text-xl text-text-primary mb-sm">
        Forundersøgelse
      </h2>
      {/* Child-tabs — kun i samleordre-mode med 2+ children.
          PATTERN: variant='attached' kobler tab-rækken visuelt til boks-wrapperen nedenunder
          via -mb-[1px] på aktiv tab (SamleordreChildTabs intern klasse). */}
      {showChildTabs && samleordreCtx && samleordreTabOrderNr && (
        <SamleordreChildTabs
          children={samleordreCtx.children.map(c => ({
            orderNumber: c.orderNumber,
            stedLabel: c.stedLabel,
            isAnchor: c.isAnchor,
          }))}
          activeOrderNumber={samleordreTabOrderNr}
          onSelect={(nr: string) => onSelectSamleordreTab?.(nr)}
          variant="attached"
        />
      )}
      {/* Hint-banner fjernet — aktiv ordre er synlig via tabs på Ordredetaljer-rækken */}
      {/*
        PATTERN: Når tabs vises oven over boksen, fjernes det øverste venstre hjørne (første tab
        sidder venstre-justeret). Det øverste højre hjørne beholdes (rounded-tr-2xl).
        Matcher SPEC §1 "rounded-tr-2xl rounded-b-2xl" — bevidst afvigelse fra default rounded-2xl.
        PATTERN DEVIATION: SPEC nævner rounded-tr-2xl rounded-b-2xl men sektionen bruger allerede
        2xl-radius (ikke xl som makeOrdredetaljerCard) — beholder 2xl for konsistens med sektionens
        eksisterende æstetik. Enkelt-ordre (ingen tabs) → fuld rounded-2xl (uændret).
      */}
      <div className={`w-full bg-surface border border-hairline shadow-sm overflow-hidden mb-sm ${showChildTabs ? 'rounded-tr-2xl rounded-b-2xl' : 'rounded-2xl'}`}>
        <button
          type="button"
          onClick={() => setForundersoegelseOpen(o => !o)}
          className="w-full flex items-start justify-between px-md py-sm cursor-pointer hover:border-hairline-2 transition-colors"
          aria-expanded={forundersoegelseOpen}
        >
          {/* Collapsed preview — per-child i samleordre-mode, global i enkelt-ordre */}
          {(() => {
            const activeChildForF = isSamleordreMode && samleordreCtx
              ? samleordreCtx.children.find(c => c.orderNumber === samleordreTabOrderNr)
              : undefined
            const childDetails = activeChildForF?.forundersoegelseDetails
            // I samleordre-mode bruger vi per-child details til preview; globale felter bruges kun i enkelt-ordre
            const displayUnderlaegsType = childDetails !== undefined ? childDetails.underlaegsType : underlaegsType
            const displayTilfredsstillende = childDetails !== undefined ? childDetails.tilfredsstillende : tilfredsstillende
            const displayPhotoCount = childDetails !== undefined ? childDetails.photoCount : forundersoegelseFotos.length
            const displayComment = childDetails !== undefined ? childDetails.besigtigelseComment : ''
            const displayVurderet = displayUnderlaegsType !== null && displayUnderlaegsType !== undefined && displayUnderlaegsType !== ''
              && displayTilfredsstillende !== null && displayTilfredsstillende !== undefined
            return (
              <>
                <div className="flex flex-col gap-xxxs items-start">
                  {!forundersoegelseOpen && (
                    <div className="text-xs text-text-muted font-inter">
                      {displayUnderlaegsType ? (
                        <>
                          <span className="font-semibold text-text-secondary">
                            {displayUnderlaegsType === 'asfalt' ? 'Asfalt'
                              : displayUnderlaegsType === 'beton' ? 'Beton'
                              : displayUnderlaegsType === 'grus' ? 'Grus'
                              : displayUnderlaegsType}
                          </span>
                          {' · '}
                          {displayTilfredsstillende === true ? 'Tilfredsstillende' : displayTilfredsstillende === false ? 'Ikke tilfredsstillende' : 'Tilstand ikke vurderet'}
                          {' · '}
                          {displayPhotoCount} {displayPhotoCount === 1 ? 'billede' : 'billeder'}
                          {displayComment ? <> · {displayComment}</> : null}
                          {!childDetails && ekstraLinjer.length > 0 && <> · {ekstraLinjer.length} ekstraarbejde</>}
                        </>
                      ) : (
                        <span className="italic">Ikke udfyldt endnu</span>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-xs">
                  {!forundersoegelseOpen && (
                    displayVurderet ? (
                      <span className="inline-flex items-center px-sm py-xxxs rounded-full text-xxs font-medium bg-good-bg text-good border border-good/30">
                        Vurderet
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-sm py-xxxs rounded-full text-xxs font-medium bg-bad-bg text-bad border border-bad/30">
                        Mangler vurdering
                      </span>
                    )
                  )}
                  {forundersoegelseOpen ? <ChevronUp size={20} className="text-text-muted" /> : <ChevronDown size={20} className="text-text-muted" />}
                </div>
              </>
            )
          })()}
        </button>

      {forundersoegelseOpen && <div className="flex flex-col gap-sm p-md pt-sm">

        {/* ── Række 1: Underlag + Tilstand ─────────────────────── */}
        <div className="grid grid-cols-2 rounded-xl border border-hairline overflow-hidden">

          {/* Underlag dropdown */}
          <div className="p-md">
            <p className="font-inter text-xxs font-semibold text-text-muted uppercase tracking-widest mb-sm">
              Underlag / Bund
            </p>
            <div className="relative">
              <select
                value={underlaegsType}
                onChange={e => { setUnderlaegsType(e.target.value as UnderlagType); setSaved(false) }}
                className="w-full font-inter text-sm text-text-primary bg-white border border-hairline rounded-xl px-sm py-xs pr-[32px] focus:outline-none focus:border-dark-teal transition-colors appearance-none cursor-pointer"
              >
                <option value="">Vælg underlag...</option>
                {UNDERLAG_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-xs top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
            </div>
            {underlaegsType === 'andet' && (
              <input
                type="text"
                value={underlaegsAndet}
                onChange={e => { setUnderlaegsAndet(e.target.value); setSaved(false) }}
                placeholder="Beskriv underlag..."
                className="mt-xs w-full font-inter text-sm text-text-primary bg-white border border-hairline rounded-xl px-sm py-xs focus:outline-none focus:border-dark-teal transition-colors"
              />
            )}
          </div>

          {/* Tilstand */}
          <div className="p-md">
            <p className="font-inter text-xxs font-semibold text-text-muted uppercase tracking-widest mb-sm">
              Underlagets tilstand
            </p>
            <div className="flex items-center gap-xs mb-xs">
              <span className="font-inter text-sm text-text-secondary">Tilfredsstillende:</span>
              <JaNejToggle
                value={tilfredsstillende === true ? 'ja' : tilfredsstillende === false ? 'nej' : null}
                onChange={v => { setTilfredsstillende(v === 'ja'); setSaved(false) }}
              />
            </div>

            {tilfredsstillende === false && (
              <div className="flex flex-col gap-sm pt-sm">
                <div>
                  <p className="font-inter text-xxs font-medium text-text-muted mb-xs">Årsag:</p>
                  <div className="grid grid-cols-2 gap-xs">
                    {AARSAG_OPTIONS.map(opt => (
                      <label key={opt.value} className="flex items-center gap-xs cursor-pointer">
                        <ForCheckbox
                          checked={underlaegsAarsager.has(opt.value)}
                          onChange={() => toggleAarsag(opt.value)}
                        />
                        <span className="font-inter text-xs text-text-primary select-none">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <input
                  type="text"
                  value={aftaltMed}
                  onChange={e => { setAftaltMed(e.target.value); setSaved(false) }}
                  placeholder="Aftalt med (navn / firma)..."
                  className="w-full font-inter text-sm text-text-primary bg-white border border-hairline rounded-xl px-sm py-xs focus:outline-none focus:border-dark-teal transition-colors"
                />
              </div>
            )}
          </div>
        </div>

        {/* ── Række 2: Forbehold (fuld bredde) ─────────────────── */}
        <div>
          <p className="font-inter text-xxs font-semibold text-text-muted uppercase tracking-widest mb-sm">
            Forbehold
          </p>
          <textarea
            value={forbehold}
            onChange={e => { setForbehold(e.target.value); setSaved(false) }}
            rows={3}
            placeholder="Beskriv evt. forbehold for ordren..."
            className="w-full font-inter text-sm text-text-primary bg-white border border-hairline rounded-xl px-sm py-xs focus:outline-none focus:border-dark-teal transition-colors resize-none leading-relaxed mb-xs"
          />
          <div className="flex gap-xs bg-[#F5F9FA] border border-dark-teal/15 rounded-xl px-sm py-xs">
            <span className="font-inter text-xxs font-semibold text-dark-teal uppercase tracking-widest flex-shrink-0 mt-[1px]">Eks.</span>
            <p className="font-inter text-xs text-text-muted leading-relaxed italic">
              Bæreevnen af den eksisterende belægning der efterfølgende kan forårsage sætninger og revnedannelse i den nye asfaltbelægning.
            </p>
          </div>
        </div>

        {/* ── Række 3: Billeder (fuld bredde) ───────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-sm">
            <p className="font-inter text-xxs font-semibold text-text-muted uppercase tracking-widest">Billeder</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
          <div className="flex flex-wrap gap-xs">
            {forundersoegelseFotos.map(foto => (
              <div
                key={foto.id}
                className="w-[76px] h-[76px] rounded-xl border border-hairline overflow-hidden flex-shrink-0"
              >
                {foto.url ? (
                  <img src={foto.url} alt={foto.label} className="w-full h-full object-cover" />
                ) : (
                  <div className={`w-full h-full ${foto.color} flex flex-col items-center justify-center gap-xxxs`}>
                    <Camera size={14} className="text-text-muted" />
                    <span className="font-inter text-xxs text-text-muted text-center px-xxxs leading-tight">{foto.label}</span>
                  </div>
                )}
              </div>
            ))}
            <div
              onClick={() => fileInputRef.current?.click()}
              role="button"
              aria-label="Tilføj billede"
              className="w-[76px] h-[76px] rounded-xl border-2 border-dashed border-hairline-2 flex flex-col items-center justify-center gap-xxxs cursor-pointer hover:border-dark-teal hover:bg-[#F5F9FA] transition-colors group flex-shrink-0"
            >
              <Plus size={18} className="text-text-muted group-hover:text-dark-teal transition-colors" />
              <span className="font-inter text-xxs text-text-muted group-hover:text-dark-teal transition-colors leading-tight text-center">
                Tilføj
              </span>
            </div>
          </div>
        </div>

        {/* ── Ekstraarbejde (delt state — se også MKS-skema) ──────── */}
        <EkstraarbejdeBlok
          linjer={ekstraLinjer}
          onAdd={addEkstraLinje}
          onUpdate={updateEkstraLinje}
          onRemove={removeEkstraLinje}
          sent={ekstraSent}
          onSend={() => { if (ekstraLinjer.length > 0) setEkstraSent(true) }}
          onReset={() => { setEkstraLinjer([]); setEkstraSent(false) }}
          hideSaveFooter
        />

        {/* ── Footer ────────────────────────────────────────────── */}
        <div className="flex items-center justify-end gap-sm">
          <button
            onClick={() => { setSaved(true); if (ekstraLinjer.length > 0) setEkstraSent(true) }}
            className={[
              'font-inter text-sm font-semibold px-md py-xs rounded-xl transition-all active:scale-[0.98]',
              saved
                ? 'bg-good text-white cursor-default'
                : 'bg-yellow text-deep-teal hover:opacity-90',
            ].join(' ')}
          >
            {saved ? 'Gemt' : 'Gem forundersøgelse'}
          </button>
        </div>

      </div>}
      </div>
    </section>
  )
}
