/**
 * PROTOTYPE — DokumentationSection (Planlægning-mode)
 * Udskilt fra OrdrePlanScreen.tsx L1044–1212 (Fase 2, Round 3, #8).
 * Extraction ORDRET — adfærd 100% uændret.
 * Må ikke importeres i produktionskode.
 */
import { useState } from 'react'
import {
  Plus,
  ChevronDown,
  Mic,
  Camera,
} from 'lucide-react'
import type { MockPhoto, NoteComment } from '../../../types'
import { DocRow } from '../../../components/DocRow'

// ─── Props ────────────────────────────────────────────────────────────────────

export interface DokumentationSectionProps {
  /**
   * Guard fra kalderen: sektionen renderes kun når Ordredetaljer er udvidet.
   * Kopieret fra den conditionelle wrapper `{planlaegningOrdredetaljerExpanded && ...}` i orkestratoren.
   */
  visible: boolean

  /** Root-delt: alle billeder knyttet til ordren (inkl. forundersøgelsesfotoer). */
  photos: MockPhoto[]

  /** Callback der tilføjer nye fotos til root-state i orkestratoren. */
  onAddPhotos: (newPhotos: MockPhoto[]) => void

  /** Callback der fjerner et foto fra root-state (bruges i foto-grid). */
  onRemovePhoto: (id: string) => void

  /** Root-delt: noter/kommentarer til ordren. */
  noteComments: NoteComment[]

  /** Callback der tilføjer en ny note til root-state i orkestratoren. */
  onAddComment: (comment: NoteComment) => void
}

// ─── Komponent ────────────────────────────────────────────────────────────────

export function DokumentationSection({
  visible,
  photos,
  onAddPhotos,
  onRemovePhoto,
  noteComments,
  onAddComment,
}: DokumentationSectionProps) {
  // Planlægning-lokal state — bruges KUN i denne sektion (L123–127 i orkestrator).
  const [opmaalingOpen, setOpmaalingOpen] = useState(false)
  const [photosOpen, setPhotosOpen] = useState(false)
  const [notesOpen, setNotesOpen] = useState(false)
  const [docsOpen, setDocsOpen] = useState(false)
  const [besigtigelseComment, setBesigtigelseComment] = useState('')

  if (!visible) return null

  // ─── JSX — ORDRET fra OrdrePlanScreen.tsx L1044–1212 ──────────────────────
  // Wrapper-`{planlaegningOrdredetaljerExpanded && ...}` er erstattet af `visible`-prop.
  return (
    <section>
      <h2 className="font-poppins font-semibold text-xl text-text-primary mb-sm">Dokumentation</h2>

      <div className="bg-white border border-hairline rounded-xl overflow-hidden">
        {/* Toggle-header */}
        <button
          onClick={() => setDocsOpen(o => !o)}
          className="w-full flex items-center justify-between px-sm py-sm hover:bg-[#F5F5F5] transition-colors"
        >
          <span className="flex items-center gap-md">
            <span className="font-poppins font-semibold text-sm text-text-primary">Dokumentation</span>
            <span className="flex items-center gap-sm font-inter text-xs text-text-muted">
              {[
                { label: 'Opmåling', ok: true },
                { label: 'Billeder', ok: true },
                { label: 'Noter', ok: false },
              ].map(item => (
                <span key={item.label} className="flex items-center gap-xxxs">
                  <span className={`w-[6px] h-[6px] rounded-full flex-shrink-0 ${item.ok ? 'bg-[#1F8A5B]' : 'bg-[#C8372D]'}`} />
                  <span className={item.ok ? 'text-text-muted' : 'text-[#C8372D] font-medium'}>{item.label}</span>
                </span>
              ))}
            </span>
          </span>
          <ChevronDown size={16} className={`text-text-muted transition-transform ${docsOpen ? 'rotate-180' : ''}`} />
        </button>

        {docsOpen && (
          <div className="border-t border-hairline">

            {/* Opmåling */}
            <DocRow
              title="Opmåling af område"
              meta="PDF · 2,1 MB"
              status="ok"
              open={opmaalingOpen}
              onToggle={() => setOpmaalingOpen(o => !o)}
            >
              <div className="flex flex-col gap-sm">
                <img src="/opmaalings-kort.png" alt="Opmåling af område" className="w-full rounded-lg border border-hairline grayscale-[30%]" />
                <label className="flex items-center justify-center gap-xs border border-dashed border-hairline-2 rounded-lg py-sm cursor-pointer hover:border-dark-teal hover:bg-[#F5F9FA] transition-colors group">
                  <input type="file" accept=".pdf,.png,.jpg,.jpeg" className="hidden"
                    onChange={e => { if (e.target.files?.length) { /* TODO: håndter upload */ } }}
                  />
                  <Plus size={14} className="text-text-muted group-hover:text-dark-teal transition-colors" />
                  <span className="font-inter text-xs text-text-muted group-hover:text-dark-teal transition-colors">Upload fil (PDF eller billede)</span>
                </label>
              </div>
            </DocRow>

            {/* Billeder */}
            <DocRow
              title="Billedmateriale"
              meta={`${photos.length} billeder`}
              status="ok"
              open={photosOpen}
              onToggle={() => setPhotosOpen(o => !o)}
            >
              <div className="grid grid-cols-4 gap-xs">
                {photos.map(photo => (
                  <div key={photo.id} className={`aspect-square rounded-lg ${photo.color} flex flex-col items-center justify-center relative group border border-hairline overflow-hidden`}>
                    <span className="font-inter text-xxs text-text-muted text-center px-xxxs leading-tight">{photo.label}</span>
                    {photo.source === 'forundersoegelse' && (
                      <span className="absolute bottom-0 left-0 right-0 bg-dark-teal/80 font-inter text-[9px] font-semibold text-white text-center py-[2px] leading-none">
                        Forundersøgelse
                      </span>
                    )}
                    <button
                      onClick={() => onRemovePhoto(photo.id)}
                      className="absolute top-[4px] right-[4px] w-[16px] h-[16px] bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      {/* PATTERN: X-ikon — bruger inline SVG da X ikke importeres i denne fil */}
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-bad"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                ))}
                <label className="aspect-square rounded-lg border border-dashed border-hairline-2 flex flex-col items-center justify-center cursor-pointer hover:border-text-muted hover:bg-[#F5F5F5] transition-colors">
                  <input type="file" accept="image/*" capture="environment" className="hidden"
                    onChange={e => {
                      if (e.target.files?.length) {
                        onAddPhotos([{ id: `ph${Date.now()}`, color: 'bg-yellow/20', label: `Foto ${photos.length + 1}` }])
                      }
                    }}
                  />
                  <Camera size={16} className="text-text-muted" />
                  <span className="font-inter text-xxs text-text-muted mt-xxxs">Kamera</span>
                </label>
                <label className="aspect-square rounded-lg border border-dashed border-hairline-2 flex flex-col items-center justify-center cursor-pointer hover:border-text-muted hover:bg-[#F5F5F5] transition-colors">
                  <input type="file" accept="image/*" className="hidden"
                    onChange={e => {
                      if (e.target.files?.length) {
                        onAddPhotos([{ id: `ph${Date.now()}`, color: 'bg-light-aqua/30', label: `Foto ${photos.length + 1}` }])
                      }
                    }}
                  />
                  <Plus size={16} className="text-text-muted" />
                  <span className="font-inter text-xxs text-text-muted mt-xxxs">Upload</span>
                </label>
              </div>
            </DocRow>

            {/* Noter */}
            <DocRow
              title="Noter til opgave"
              meta={`${noteComments.length} noter`}
              status="bad"
              open={notesOpen}
              onToggle={() => setNotesOpen(o => !o)}
              isLast
            >
              <div className="flex flex-col gap-sm">
                {noteComments.map(c => (
                  <div key={c.id} className="flex gap-xs">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${c.initials === 'OJ' ? 'bg-deep-teal' : 'bg-[#F5F5F5]'}`}>
                      <span className={`font-inter font-bold text-[9px] ${c.initials === 'OJ' ? 'text-white' : 'text-deep-teal'}`}>{c.initials}</span>
                    </div>
                    <div className="flex-1 bg-[#F5F5F5] rounded-xl px-xs py-xs">
                      <div className="flex items-baseline gap-xs mb-xxxs">
                        <b className="font-inter font-semibold text-xs text-text-primary">{c.name}</b>
                        <time className="font-inter text-xxs text-text-muted">{c.timestamp}</time>
                      </div>
                      <p className="font-inter text-xs text-text-secondary leading-relaxed">{c.text}</p>
                    </div>
                  </div>
                ))}
                <div className="flex gap-xs">
                  <div className="w-7 h-7 rounded-full bg-deep-teal flex items-center justify-center flex-shrink-0">
                    <span className="font-inter font-bold text-[9px] text-white">OJ</span>
                  </div>
                  <div className="flex-1">
                    <div className="relative">
                      <textarea
                        value={besigtigelseComment}
                        onChange={e => setBesigtigelseComment(e.target.value)}
                        placeholder="Tilføj bemærkning..."
                        rows={2}
                        className="w-full rounded-xl border border-hairline bg-white px-xs py-xs pr-[40px]
                                   font-inter text-xs text-text-primary placeholder:text-text-muted
                                   focus:outline-none focus:border-dark-teal resize-none"
                      />
                      <button
                        className="absolute bottom-[10px] right-[10px] w-7 h-7 rounded-full bg-dark-teal
                                   flex items-center justify-center hover:bg-deep-teal transition-colors"
                        aria-label="Dikter bemærkning"
                      >
                        <Mic size={12} className="text-white" />
                      </button>
                    </div>
                    {besigtigelseComment.trim().length > 0 && (
                      <button
                        onClick={() => {
                          onAddComment({
                            id: `nc${Date.now()}`,
                            initials: 'OJ',
                            name: 'Ole Jensen',
                            timestamp: 'Nu',
                            text: besigtigelseComment.trim(),
                          })
                          setBesigtigelseComment('')
                        }}
                        className="mt-xxxs self-end float-right bg-dark-teal text-white font-inter font-semibold text-xxs px-sm py-xxxs rounded-lg hover:bg-deep-teal transition-colors"
                      >
                        Gem
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </DocRow>

          </div>
        )}
      </div>
    </section>
  )
}
