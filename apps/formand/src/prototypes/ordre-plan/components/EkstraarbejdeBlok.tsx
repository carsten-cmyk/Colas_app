import { useState } from 'react'
import { ChevronDown, X } from 'lucide-react'
import type { EkstraarbejdeBlokProps } from '../types'
import { EKSTRA_OPTIONS } from '../mocks'

// ─── EkstraarbejdeBlok ───────────────────────────────────────────────────────
// Genbrugskomponent — bruges i Forundersøgelse (UdfoerselContent) og i MKS-skema.
// `open`-state er intern så de to instanser åbner/lukker uafhængigt.
// `ekstraLinjer` + `ekstraSent` er delt state (hejst til UdfoerselContent).

export function EkstraarbejdeBlok({ linjer, onAdd, onUpdate, onRemove, sent, onSend, onReset, hideSaveFooter }: EkstraarbejdeBlokProps) {
  const [open, setOpen] = useState(false)

  function handleOpen() {
    setOpen(true)
    if (linjer.length === 0) onAdd()
  }

  return (
    <div className="flex flex-col gap-sm">
      {open && (
        <div className="flex flex-col gap-sm">
          <p className="font-inter text-xxs font-semibold text-text-muted">
            Ekstraarbejde
          </p>

          {linjer.length === 0 && (
            <p className="font-inter text-xs text-text-muted italic">Ingen linjer endnu — tilføj nedenfor.</p>
          )}

          {linjer.map((linje, i) => (
            <div key={linje.id} className="grid gap-xs items-start" style={{ gridTemplateColumns: '1fr 1fr 72px 28px' }}>
              {/* Type dropdown */}
              <div className="relative">
                <select
                  value={linje.type}
                  onChange={e => onUpdate(linje.id, 'type', e.target.value)}
                  className="w-full font-inter text-xs text-text-primary bg-surface-2 border border-hairline rounded-lg px-xs py-xs pr-[24px] focus:outline-none focus:border-dark-teal focus:bg-white transition-colors appearance-none cursor-pointer"
                >
                  <option value="">Vælg type...</option>
                  {EKSTRA_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                <ChevronDown size={12} className="absolute right-xs top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              </div>

              {/* Beskrivelse */}
              <input
                type="text"
                value={linje.beskrivelse}
                onChange={e => onUpdate(linje.id, 'beskrivelse', e.target.value)}
                placeholder={`Beskrivelse linje ${i + 1}...`}
                className="font-inter text-xs text-text-primary bg-surface-2 border border-hairline rounded-lg px-xs py-xs focus:outline-none focus:border-dark-teal focus:bg-white transition-colors"
              />

              {/* Antal */}
              <div className="flex items-center border border-hairline rounded-lg overflow-hidden bg-white">
                <button
                  onClick={() => onUpdate(linje.id, 'antal', Math.max(1, linje.antal - 1))}
                  className="px-xs py-xs font-inter text-sm text-text-muted hover:bg-surface-2 transition-colors leading-none"
                >−</button>
                <span className="flex-1 text-center font-inter text-xs font-semibold text-text-primary tabular-nums">{linje.antal}</span>
                <button
                  onClick={() => onUpdate(linje.id, 'antal', linje.antal + 1)}
                  className="px-xs py-xs font-inter text-sm text-text-muted hover:bg-surface-2 transition-colors leading-none"
                >+</button>
              </div>

              {/* Fjern */}
              <button
                onClick={() => onRemove(linje.id)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-text-muted hover:text-bad hover:bg-bad-bg transition-colors mt-[2px]"
                aria-label="Fjern linje"
              >
                <X size={13} />
              </button>
            </div>
          ))}

          <button
            onClick={onAdd}
            className="inline-flex items-center gap-xs font-inter text-xs font-medium text-dark-teal border border-dashed border-dark-teal/40 rounded-lg px-sm py-xs hover:bg-soft-aqua transition-colors self-start"
          >
            Tilføj linje
          </button>

          <div className="flex items-center justify-between pt-xs mt-xs">
            {!sent && (
              <p className="font-inter text-xs text-text-muted">
                Sendes som mail til projektleder ved gem
              </p>
            )}
            {!hideSaveFooter && (
              <div className="flex items-center gap-xs ml-auto">
                <button
                  onClick={() => { onReset(); setOpen(false) }}
                  className="font-inter text-sm text-text-muted hover:text-text-primary px-xs py-xs transition-colors"
                >
                  Fortryd
                </button>
                <button
                  onClick={() => { if (linjer.length > 0) onSend() }}
                  disabled={linjer.length === 0}
                  className={[
                    'font-inter text-sm font-semibold px-md py-xs rounded-xl transition-all active:scale-[0.98]',
                    sent
                      ? 'bg-good text-white cursor-default'
                      : linjer.length === 0
                        ? 'bg-surface-2 text-text-muted cursor-not-allowed'
                        : 'bg-yellow text-deep-teal hover:opacity-90',
                  ].join(' ')}
                >
                  {sent ? 'Gemt' : 'Gem ekstraarbejde'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {!open && (
        <button
          onClick={handleOpen}
          className="self-start inline-flex items-center gap-xs font-inter text-sm font-semibold px-md py-xs rounded-xl active:scale-[0.98] transition-all bg-yellow text-deep-teal hover:opacity-90"
        >
          Tilføj ekstraarbejde
        </button>
      )}
    </div>
  )
}
