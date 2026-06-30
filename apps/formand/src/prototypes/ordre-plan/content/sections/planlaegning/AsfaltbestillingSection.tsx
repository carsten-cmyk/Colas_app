/**
 * PROTOTYPE — AsfaltbestillingSection (Planlægning-mode)
 * Udskilt fra OrdrePlanScreen.tsx L1219–1376 (Fase 2, Round 3, #9).
 * Bekræftelses-modal (L2338–2409) inkluderet da den er Asfaltbestilling-eksklusiv.
 * Extraction ORDRET — adfærd 100% uændret.
 * Må ikke importeres i produktionskode.
 */
import { useState } from 'react'
import { Truck, MessageSquare, CheckCircle2 } from 'lucide-react'
import type { MockProduct, DayPlan, SamleordreContext } from '../../../types'
import { ProductBoxV2, EkstraBestillingBox } from '../../../components/ProductBoxV2'

// ─── Props ────────────────────────────────────────────────────────────────────

export interface AsfaltbestillingSectionProps {
  /**
   * Alle produkter for den valgte dag (pre-beregnet af orkestratoren via productsForSelectedDate).
   * TODO: Erstat med Supabase når klar — produktdata fra samleordre-join
   */
  productsForSelectedDate: { product: MockProduct; day: DayPlan }[]

  /** Den aktuelt valgte dato i dato-pille-stribens (ISO YYYY-MM-DD). */
  selectedPlanDate: string

  /** Id på det produkt der er i focus (aktivt fremhævet i boks-rækken). */
  activeProductId: string

  /** Sæt fokuseret produkt fra boks-klik. */
  onSetActiveProductId: (id: string) => void

  /** Updateter tons for et produkt på en dag. */
  onUpdateTons: (productId: string, dayId: string, v: number) => void

  /** Updateter morgen-tons for et produkt på en dag. */
  onUpdateMorgenTons: (productId: string, dayId: string, v: number | undefined) => void

  /**
   * Id på den dag der aktuelt er i aflysnings-tilstand (picker åben).
   * null = ingen dag aflyses pt.
   */
  cancellingDayId: string | null

  /** Åbn aflysnings-årsagspicker for en dag. */
  onCancelDay: (dayId: string) => void

  /** Afbryd aflysnings-flowet uden at aflyse. */
  onAbortCancel: () => void

  /** Bekræft aflysning med valgt årsag. */
  onConfirmCancel: (productId: string, dayId: string, reason: import('../../../types').CancelReason) => void

  /** Gendan en aflyst dag. */
  onRestoreDay: (dayId: string) => void

  /** "Samles på en bil"-flags per `${productId}__${dayId}`. */
  productSamlesFlags: Record<string, boolean>

  /** Sæt "Samles på én bil" for et produkt+dag. */
  onSetProductSamles: (productId: string, dayId: string, value: boolean) => void

  /** Samleordre-mode er aktiv (viser ordre-tags per produkt). */
  isSamleordreMode: boolean

  /** Samleordre-kontekst (children + anchor). Null hvis ikke samleordre. */
  samleordreCtx: SamleordreContext | null
}

// ─── Komponent ────────────────────────────────────────────────────────────────

export function AsfaltbestillingSection({
  productsForSelectedDate,
  selectedPlanDate,
  activeProductId,
  onSetActiveProductId,
  onUpdateTons,
  onUpdateMorgenTons,
  cancellingDayId,
  onCancelDay,
  onAbortCancel,
  onConfirmCancel,
  onRestoreDay,
  productSamlesFlags,
  onSetProductSamles,
  isSamleordreMode,
  samleordreCtx,
}: AsfaltbestillingSectionProps) {
  // ── Lokal Asfaltbestilling-state ─────────────────────────────────────────
  // Disse bruges KUN i Asfaltbestilling-flowet (verificeret: ingen referencer i
  // UdfoerselContent.tsx / AfregningContent.tsx) → flyttes ned som lokal state.

  /** Styrer om bekræftelses-modal er åben. */
  const [showConfirmSend, setShowConfirmSend] = useState(false)

  /** "Bestilling for sent"-flag. TODO: Erstat med reel beregning: nu > (selectedPlanDate − 1 dag, kl 11:00). */
  // Vises pr. DEFAULT i prototypen så flowet kan ses uden tidssimulering.
  const bestillingForSent = true

  /** Kommentar i bekræftelses-modalen. */
  const [kommentar, setKommentar] = useState('')

  /**
   * Per-dag afsendelsesgate til fabrik (keyed på ISO-dato-streng).
   * TODO: Erstat med Supabase når klar
   */
  const [fabrikSendtDates, setFabrikSendtDates] = useState<Set<string>>(new Set())

  /**
   * Track hvilke day-id'er der er sendt (individuelle produkt-dag-bokse).
   * TODO: Erstat med Supabase når klar
   */
  const [sentDayIds, setSentDayIds] = useState<Set<string>>(new Set())

  /**
   * Kommentarer der er sendt pr. dag til fabrik.
   * TODO: Erstat med Supabase når klar — kommentarer gemmes på ordren/dagen
   */
  const [sentKommentarer, setSentKommentarer] = useState<Record<string, string>>({})

  // ── Send-handler ─────────────────────────────────────────────────────────

  function sendAlleForSelectedDate() {
    const dayIds = productsForSelectedDate
      .filter(({ day }) => !sentDayIds.has(day.id))
      .map(({ day }) => day.id)
    setSentDayIds(prev => new Set([...prev, ...dayIds]))
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Bestillings-række for valgt dag ──────────────────────── */}
      {/* Produkter (én boks pr. produkt) + "Send alle"-knap */}
      {/* Samleordre: produkter samles per recipeCode på tværs af ordrer */}
      {/* TODO: Erstat med Supabase når klar — produktdata fra samleordre-join */}
      <div className="flex flex-col gap-sm">
        <h2 className="font-poppins font-semibold text-xl text-deep-teal leading-tight mb-sm">Asfaltbestilling</h2>
        {/* Datovælgeren er flyttet til toppen af Planlægning-mode (unified picker —
            se sektionen øverst). Bestillings-rækken viser produkterne for den valgte dato. */}
        {productsForSelectedDate.length === 0 && (
          <span className="font-inter text-xs text-text-muted">Ingen produkter denne dag</span>
        )}

        {/* Flow 9b (OPDATERET 2026-06-09): "Tons opdateret af Fabrik"-banner ERSTATTET
            af synlig EkstraBestillingBox + "Bekræftet fabrik"-pille per produkt med ekstra-tons.
            Se EkstraBestillingBox-komponenten.
            Bevaret som dokumentation: ./v1/TonsOpdateretBanner.v1.tsx */}

        {/* items-stretch + flex-1 på bokse: alle kolonner stretcher til samme højde
            (drevet af højeste boks). */}
        <div className="flex gap-xs flex-wrap items-stretch">
          {/* Produkt-bokse for valgt dag — status-pill under (ingen send-knap, kun statusfelt) */}
          {(() => {
            // Samleordre: beregn ordre-tags per recipeCode
            // Produkter samles per recipeCode — vises KUN ÉN gang selv om begge ordrer har det
            // TODO: Erstat med Supabase når klar
            const samleordreTags: Record<string, string[]> = {}
            if (isSamleordreMode && samleordreCtx) {
              // Byg map: recipeCode → [stedLabel] for alle ordrer der har produktet
              const rcToChildren: Record<string, { stedLabel: string }[]> = {}
              for (const child of samleordreCtx.children) {
                for (const cp of child.products) {
                  if (!rcToChildren[cp.recipeCode]) rcToChildren[cp.recipeCode] = []
                  rcToChildren[cp.recipeCode].push({ stedLabel: child.stedLabel })
                }
              }
              for (const [rc, entries] of Object.entries(rcToChildren)) {
                samleordreTags[rc] = entries.map(e => e.stedLabel)
              }
            }
            return productsForSelectedDate.flatMap(({ product, day }) => {
              const isSent = sentDayIds.has(day.id)
              const isFocused = product.id === activeProductId
              const ordreTagLabels = isSamleordreMode ? (samleordreTags[product.recipeCode] ?? [product.recipeName]) : undefined
              const nodes = [
                <div key={product.id} className="flex flex-col gap-xs">
                  <ProductBoxV2
                    product={product}
                    day={day}
                    isFocused={isFocused}
                    isSelectingReason={cancellingDayId === day.id}
                    isSent={isSent}
                    onFocus={() => onSetActiveProductId(product.id)}
                    onUpdateTons={(v) => onUpdateTons(product.id, day.id, v)}
                    onUpdateMorgenTons={(v) => onUpdateMorgenTons(product.id, day.id, v)}
                    onCancel={() => onCancelDay(day.id)}
                    onAbortCancel={() => onAbortCancel()}
                    onConfirmCancel={(r) => onConfirmCancel(product.id, day.id, r)}
                    onRestore={() => onRestoreDay(day.id)}
                    ordreTagLabels={ordreTagLabels}
                    samlesPaaEnBil={productSamlesFlags[`${product.id}__${day.id}`] ?? false}
                    onSamlesPaaEnBilChange={(v) => onSetProductSamles(product.id, day.id, v)}
                  />
                  {/* Status-pills fjernet 2026-06-19: aflyst-tilstand vises af ProductBoxV2 selv
                      (rød kant + "Aflyst"-tekst + Fortryd-link). Sendt/afventer-status
                      afspejles af den fælles "Send til fabrik"-knap nedenfor. */}
                </div>,
              ]
              // Flow 9b (OPDATERET 2026-06-09): PLAN-pushet ekstra-bestilling vises som
              // selvstændig boks ved siden af produktet — med "Bekræftet fabrik"-pille under.
              if (day.ekstraTons) {
                nodes.push(
                  <div key={`${product.id}-ekstra`} className="flex flex-col gap-xs">
                    <EkstraBestillingBox product={product} day={day} />
                    {/* "Bekræftet fabrik"-pille fjernet 2026-06-19: bekræftelsestilstand
                        håndteres nu af den fælles fabrikSendtDates-state nedenfor */}
                  </div>
                )
              }
              return nodes
            })
          })()}

          {/* "Send til fabrik" CTA — gul knap → grøn sendt-tilstand + Ret-link (samme model som bilbestilling) */}
          {productsForSelectedDate.length > 0 && (
            /* h-full + flex-1: wrapper stretcher til samme højde som items-stretch-parent.
               flex flex-col + flex-1 på boksen: boksen fylder wrapperens fulde højde → matcher ProductBoxV2. */
            <div className="relative flex flex-col gap-xs">
              {fabrikSendtDates.has(selectedPlanDate) ? (
                /* ── Sendt-tilstand: grøn ikon-boks (ingen Ret — afsendelse til fabrik er endelig) ── */
                <div className="w-[160px] min-h-[172px] flex-1 rounded-xl flex flex-col items-center justify-center gap-xs p-sm border border-good/30 bg-good/5">
                  <div className="my-auto flex flex-col items-center gap-xs">
                    <div className="w-10 h-10 rounded-full bg-good/15 flex items-center justify-center">
                      <CheckCircle2 size={20} className="text-good" />
                    </div>
                    <span className="font-poppins font-medium text-sm text-good text-center leading-tight">
                      Sendt til fabrik
                    </span>
                    <span className="font-inter text-xxs text-text-muted text-center px-xxs leading-tight">
                      PROD A EAST KØGE PH
                    </span>
                  </div>
                </div>
              ) : (
                /* ── Ikke sendt: gul boks-knap (beholder boks-form + ikon) ── */
                (() => {
                  const ikkeSendteProdukter = productsForSelectedDate.filter(({ day }) => !sentDayIds.has(day.id))
                  const disabled = ikkeSendteProdukter.length === 0
                  return (
                    <button
                      onClick={() => setShowConfirmSend(true)}
                      disabled={disabled}
                      className={[
                        'w-[160px] min-h-[172px] flex-1 rounded-xl flex flex-col items-center p-sm transition-all border',
                        disabled
                          ? 'bg-surface border-hairline opacity-40 cursor-not-allowed'
                          : 'bg-yellow border-yellow hover:opacity-90 active:scale-[0.98]',
                      ].join(' ')}
                    >
                      <div className="my-auto flex flex-col items-center gap-xs">
                        <div className={`w-10 h-10 rounded-full ${disabled ? 'bg-white' : 'bg-deep-teal/15'} flex items-center justify-center`}>
                          <Truck size={20} className="text-deep-teal" />
                        </div>
                        <span className="font-poppins font-medium text-sm text-deep-teal text-center leading-tight">
                          Send til fabrik
                        </span>
                        <span className="font-inter text-xxs text-deep-teal/70 text-center px-xxs leading-tight">
                          {disabled ? 'Intet at sende' : 'Bestilling skal ske inden kl 11'}
                        </span>
                      </div>
                      <span className="font-inter text-xxs text-deep-teal/70 text-center leading-tight">
                        PROD A EAST KØGE PH
                      </span>
                    </button>
                  )
                })()
              )}
              {/* Kommentar-/placeholder-række tages UD af flow (absolut, under boksen) så
                  send-boksen kan fylde wrapperens fulde højde og matche produktboksene. */}
              <div className="absolute top-full inset-x-0 mt-xxxs flex justify-center">
              {sentKommentarer[selectedPlanDate] ? (
                <span
                  className="group relative inline-flex items-center gap-xxxs px-xs py-xxxs font-inter text-xs font-medium text-text-muted hover:text-deep-teal cursor-help w-[180px] justify-center"
                  aria-label={`Kommentarer sendt til fabrik: ${sentKommentarer[selectedPlanDate]}`}
                >
                  <MessageSquare size={12} />
                  Kommentarer sendt til fabrik
                  <span
                    role="tooltip"
                    className="pointer-events-none absolute bottom-full right-0 mb-xxxs z-50 hidden group-hover:block bg-deep-teal text-white text-xs font-inter font-normal px-sm py-xs rounded-md shadow-lg whitespace-pre-line max-w-[280px] min-w-[180px] text-left leading-snug"
                  >
                    {sentKommentarer[selectedPlanDate]}
                  </span>
                </span>
              ) : (
                <div className="w-[180px] h-[24px]" aria-hidden="true" />
              )}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* ── Bekræftelses-modal: Send til fabrik ────────────────────── */}
      {/* Genbrug af Dagsoversigt-modal-mønster (DagsoversigtScreen linje 675-720) */}
      {/* EXTRACTION-NOTE: Modalen lå på L2338–2409 i orkestratoren men er Asfaltbestilling-eksklusiv
          (showConfirmSend + sentKommentarer + fabrikSendtDates bruges KUN her) → flyttes ind i sektionen. */}
      {showConfirmSend && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-md"
          role="dialog"
          aria-modal="true"
          aria-labelledby="send-modal-title"
        >
          <button
            type="button"
            aria-label="Luk dialog"
            onClick={() => { setShowConfirmSend(false); setKommentar('') }}
            className="absolute inset-0 bg-deep-teal/40"
          />
          <div className="relative bg-white rounded-2xl shadow-lg max-w-md w-full p-lg flex flex-col gap-md">
            <div className="flex flex-col gap-xs">
              <h2
                id="send-modal-title"
                className="font-poppins font-semibold text-lg text-deep-teal leading-tight"
              >
                Send bestilling til fabrik?
              </h2>
              {bestillingForSent ? (
                <p className="font-inter text-sm text-bad leading-relaxed bg-bad-bg border border-bad/30 rounded-lg px-sm py-xs">
                  Bestillingen er lavet efter kl 11. Du skal derfor ringe til fabrikken for at sikre produktionskapacitet.
                </p>
              ) : (
                <p className="font-inter text-sm text-text-secondary leading-relaxed">
                  Ordren afsendes til fabrikken nu.
                </p>
              )}
            </div>
            <div className="flex flex-col gap-xxs">
              <label className="font-inter font-medium text-sm text-deep-teal">
                Vil du knytte en kommentar til ordren inden afsendelse?
              </label>
              <span className="font-inter text-xs text-text-muted leading-relaxed">
                Kommentaren sendes med til fabrikken sammen med bestillingen.
              </span>
              <textarea
                value={kommentar}
                onChange={e => setKommentar(e.target.value)}
                rows={3}
                placeholder="Fx ekstra holdtid pga. mange biler i morgenmyldretid"
                className="w-full font-inter text-sm text-text-primary bg-white border border-hairline rounded-lg px-sm py-xs resize-none focus:outline-none focus:border-deep-teal transition-colors"
              />
            </div>
            <div className="flex items-center justify-end gap-xs">
              <button
                type="button"
                onClick={() => { setShowConfirmSend(false); setKommentar('') }}
                className="font-inter font-medium text-sm text-text-secondary bg-white border border-hairline rounded-lg px-md py-xs hover:bg-surface-2 transition-colors"
              >
                Annullér
              </button>
              <button
                type="button"
                onClick={() => {
                  if (kommentar.trim().length > 0) {
                    setSentKommentarer(prev => ({ ...prev, [selectedPlanDate]: kommentar.trim() }))
                  }
                  sendAlleForSelectedDate()
                  setFabrikSendtDates(prev => new Set([...prev, selectedPlanDate]))
                  setShowConfirmSend(false)
                  setKommentar('')
                }}
                className="font-poppins font-medium text-sm text-white bg-good rounded-lg px-md py-xs hover:opacity-90 transition-opacity"
              >
                Send til fabrik
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
