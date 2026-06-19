/**
 * PROTOTYPE — Bil-profil modal
 * Rediger nummerplade, biltype, default chauffør og aktiv-status.
 * Kan oprette ny chauffør inline. Kan slette bil med bekræftelse.
 * Må ikke importeres i produktionskode.
 */
import { useState } from 'react'
import { X } from 'lucide-react'
import { BILTYPER } from '@/mocks/biler'
import { formatPhone } from '@shared/utils/phone'
import type { Bil, Chauffør } from '@/mocks/biler'

interface BilProfilModalProps {
  bil: Bil | null                   // null = ny bil
  chauffoerer: Chauffør[]
  onSave: (data: Omit<Bil, 'type' | 'tons'> & { reg: string }) => void
  onDelete: (reg: string) => void
  onSaveChauf: (c: Omit<Chauffør, 'id'>) => string  // returnerer nyt id
  onClose: () => void
}

export function BilProfilModal({
  bil,
  chauffoerer,
  onSave,
  onDelete,
  onSaveChauf,
  onClose,
}: BilProfilModalProps) {
  const isNew = bil === null

  const [form, setForm] = useState({
    reg:         bil?.reg         ?? '',
    biltype:     bil?.biltype     ?? BILTYPER[0],
    chaufførId:  bil?.chaufførId  ?? (chauffoerer[0]?.id ?? ''),
    aktiv:       bil?.aktiv       ?? true,
  })

  const [confirmDel, setConfirmDel] = useState(false)
  const [visNyChauf, setVisNyChauf] = useState(false)
  const [nyChauf, setNyChauf] = useState({ navn: '', mobil: '+45' })

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm(f => ({ ...f, [k]: v }))
  }

  function handleSaveChauf() {
    if (!nyChauf.navn.trim()) return
    const id = onSaveChauf({ navn: nyChauf.navn.trim(), mobil: nyChauf.mobil.trim(), aktiv: true })
    set('chaufførId', id)
    setVisNyChauf(false)
    setNyChauf({ navn: '', mobil: '+45' })
  }

  function handleSave() {
    const chauffør = chauffoerer.find(c => c.id === form.chaufførId)
    onSave({
      reg:          form.reg.toUpperCase(),
      biltype:      form.biltype,
      chaufførId:   form.chaufførId,
      chaufførNavn: chauffør?.navn ?? '',
      aktiv:        form.aktiv,
    })
    onClose()
  }

  const aktiveChauffører = chauffoerer.filter(c => c.aktiv)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-hairline">
          <h2 className="font-poppins font-semibold text-lg text-deep-teal">
            {isNew ? 'Ny bil' : `Bil-profil · ${bil.reg}`}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:bg-surface-2 hover:text-text-secondary transition-colors"
            aria-label="Luk"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-4">

          {/* Nummerplade + Biltype */}
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="font-inter text-[11px] font-semibold uppercase tracking-widest text-text-muted">
                Nummerplade
              </span>
              <input
                type="text"
                value={form.reg}
                onChange={e => set('reg', e.target.value.toUpperCase())}
                placeholder="XE 32 114"
                className="bg-white border border-box-outline rounded-lg px-3 py-2 font-inter text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-deep-teal/20 focus:border-deep-teal/40 transition"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="font-inter text-[11px] font-semibold uppercase tracking-widest text-text-muted">
                Hænger
              </span>
              <select
                value={form.biltype}
                onChange={e => set('biltype', e.target.value)}
                className="bg-white border border-box-outline rounded-lg px-3 py-2 font-inter text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-deep-teal/20 focus:border-deep-teal/40 transition"
              >
                {BILTYPER.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </label>
          </div>

          {/* Default chauffør */}
          <div className="flex flex-col gap-1.5">
            <span className="font-inter text-[11px] font-semibold uppercase tracking-widest text-text-muted">
              Default chauffør
            </span>
            <div className="flex gap-2">
              <select
                value={form.chaufførId}
                onChange={e => {
                  if (e.target.value === '__ny') setVisNyChauf(true)
                  else set('chaufførId', e.target.value)
                }}
                className="flex-1 bg-white border border-box-outline rounded-lg px-3 py-2 font-inter text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-deep-teal/20 focus:border-deep-teal/40 transition"
              >
                {aktiveChauffører.map(c => (
                  <option key={c.id} value={c.id}>{c.navn} · {formatPhone(c.mobil)}</option>
                ))}
                <option value="__ny">+ Opret ny chauffør</option>
              </select>
              <button
                onClick={() => setVisNyChauf(true)}
                className="px-3 py-2 font-inter text-xs font-medium bg-white border border-box-outline rounded-lg text-text-secondary hover:bg-surface-2 transition-colors whitespace-nowrap"
              >
                + Ny
              </button>
            </div>
          </div>

          {/* Inline: opret ny chauffør */}
          {visNyChauf && (
            <div className="bg-surface-2 rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="font-inter text-xs font-semibold text-text-primary">Opret ny chauffør</span>
                <button
                  onClick={() => setVisNyChauf(false)}
                  className="w-6 h-6 flex items-center justify-center rounded text-text-muted hover:text-text-secondary"
                >
                  <X size={13} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1">
                  <span className="font-inter text-[11px] font-semibold uppercase tracking-widest text-text-muted">Navn</span>
                  <input
                    type="text"
                    value={nyChauf.navn}
                    onChange={e => setNyChauf(c => ({ ...c, navn: e.target.value }))}
                    placeholder="Fx Brian K."
                    className="bg-white border border-box-outline rounded-lg px-3 py-2 font-inter text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-deep-teal/20 transition"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="font-inter text-[11px] font-semibold uppercase tracking-widest text-text-muted">Mobilnummer</span>
                  <input
                    type="text"
                    value={nyChauf.mobil}
                    onChange={e => setNyChauf(c => ({ ...c, mobil: e.target.value }))}
                    placeholder="+4520304050"
                    className="bg-white border border-box-outline rounded-lg px-3 py-2 font-inter text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-deep-teal/20 transition"
                  />
                </label>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setVisNyChauf(false)}
                  className="px-3 py-2 font-inter text-xs font-medium text-text-muted hover:text-text-secondary transition-colors"
                >
                  Annullér
                </button>
                <button
                  onClick={handleSaveChauf}
                  disabled={!nyChauf.navn.trim()}
                  className="px-4 py-2 font-inter text-xs font-semibold bg-deep-teal text-white rounded-lg hover:bg-deep-teal/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Opret
                </button>
              </div>
            </div>
          )}

          {/* Bil aktiv toggle */}
          <div className="flex items-center justify-between bg-surface-2 rounded-xl px-4 py-3">
            <div>
              <p className="font-inter text-sm font-semibold text-text-primary">Bil aktiv</p>
              <p className="font-inter text-xs text-text-muted mt-0.5">Inaktive biler vises ikke i flåden</p>
            </div>
            <button
              role="switch"
              aria-checked={form.aktiv}
              onClick={() => set('aktiv', !form.aktiv)}
              className={[
                'relative w-9 h-5 rounded-full transition-colors flex-shrink-0',
                form.aktiv ? 'bg-good' : 'bg-hairline',
              ].join(' ')}
            >
              <span className={[
                'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all',
                form.aktiv ? 'left-[18px]' : 'left-0.5',
              ].join(' ')} />
            </button>
          </div>

          {/* Slet bil */}
          {!isNew && !confirmDel && (
            <button
              onClick={() => setConfirmDel(true)}
              className="self-start font-inter text-xs font-medium text-bad border border-bad/20 bg-bad/5 hover:bg-bad/10 px-3 py-2 rounded-lg transition-colors"
            >
              Slet bil
            </button>
          )}

          {confirmDel && (
            <div className="bg-bad/5 border border-bad/20 rounded-xl p-4">
              <p className="font-inter text-sm text-bad mb-3">
                Slet {bil?.reg}? Bilen fjernes fra flåden, men eksisterende disponeringer bevares.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmDel(false)}
                  className="px-3 py-2 font-inter text-xs font-medium text-text-muted hover:text-text-secondary transition-colors"
                >
                  Annullér
                </button>
                <button
                  onClick={() => { if (bil) onDelete(bil.reg); onClose() }}
                  className="px-4 py-2 font-inter text-xs font-semibold bg-bad text-white rounded-lg hover:bg-bad/90 transition-colors"
                >
                  Ja, slet
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-hairline bg-surface-2/50">
          <button
            onClick={onClose}
            className="px-4 py-2 font-inter text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
          >
            Annullér
          </button>
          <button
            onClick={handleSave}
            disabled={!form.reg.trim()}
            className="px-5 py-2 font-inter text-sm font-semibold bg-deep-teal text-white rounded-lg hover:bg-deep-teal/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Gem
          </button>
        </div>
      </div>
    </div>
  )
}
