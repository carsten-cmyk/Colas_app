/**
 * PROTOTYPE — Vognmand disponerings-upload ("den lille dør")
 * Små vognmænd uden eget system uploader deres disponering som CSV i browseren
 * i stedet for at sætte et SFTP-drop op. Samme fil-kontrakt som SFTP-vejen
 * (Docs/Vognmand/Dataudveksling-vognmand.md § Filformat) → samme confirmed_vehicles[].
 * Parse + validering sker client-side her; i produktion validerer/ingester backend.
 * Må ikke importeres i produktionskode.
 */
import { useRef, useState } from 'react'
import {
  UploadCloud, FileText, CheckCircle2, AlertTriangle, XCircle, X, Loader2, Send,
} from 'lucide-react'

// ── Kontrakt — disponering retur (vognmand → Colas), én række pr. bil ────────────
// Kanonisk: Docs/Vognmand/Dataudveksling-vognmand.md § "CSV-kolonner".

/** Forventede kolonner i header-rækken (rækkefølge er vejledende, navn er bindende). */
const KOLONNER = [
  'bil_ordrenummer', 'reg_nr',
  'biltype',          // TODO: valider mod Colas' prædefinerede biltype-liste når den foreligger — ukendt biltype → blokerende fejl
  'lasteevne_tons', 'raekkefoelge', 'ankomst_fabrik',
  'chauffoer_navn', 'chauffoer_mobil',
] as const
type Kolonne = (typeof KOLONNER)[number]

/** Påkrævede felter — en række uden disse afvises. */
const PAAKRAEVET: Kolonne[] = ['bil_ordrenummer', 'reg_nr', 'chauffoer_navn', 'chauffoer_mobil']

const BIL_ORDRE_MOENSTER = /^\d+-\d{6}-\d{2}$/   // <ordrenr>-DDMMYY-NN
const E164_MOENSTER = /^\+\d{8,15}$/             // +4520304050
const ANKOMST_FABRIK_MOENSTER = /^\d{2}\.\d{2}$/ // HH.mm med punktum, 24-timer (fx 06.30)

type RaekkeStatus = 'ok' | 'advarsel' | 'fejl'

interface TjekketRaekke {
  felter: Record<Kolonne, string>
  fejl: string[]        // blokerende
  advarsler: string[]   // ikke-blokerende
  status: RaekkeStatus
}

// ── CSV-parsing (UTF-8 + BOM + semikolon + citationstegn) ────────────────────────

function parseCsv(tekst: string): { headers: string[]; raekker: string[][] } {
  const renset = tekst.replace(/^﻿/, '')
  const linjer = renset.split(/\r\n|\n|\r/).filter(l => l.trim().length > 0)
  if (linjer.length === 0) return { headers: [], raekker: [] }

  const parseLinje = (linje: string): string[] => {
    const ud: string[] = []
    let aktuel = ''
    let iCitat = false
    for (let i = 0; i < linje.length; i++) {
      const tegn = linje[i]
      if (iCitat) {
        if (tegn === '"') {
          if (linje[i + 1] === '"') { aktuel += '"'; i++ } else iCitat = false
        } else aktuel += tegn
      } else if (tegn === '"') {
        iCitat = true
      } else if (tegn === ';') {
        ud.push(aktuel); aktuel = ''
      } else {
        aktuel += tegn
      }
    }
    ud.push(aktuel)
    return ud.map(s => s.trim())
  }

  return {
    headers: parseLinje(linjer[0]).map(h => h.toLowerCase()),
    raekker: linjer.slice(1).map(parseLinje),
  }
}

// ── Validering mod kontrakten ─────────────────────────────────────────────────────

function tjekRaekke(felter: Record<Kolonne, string>): TjekketRaekke {
  const fejl: string[] = []
  const advarsler: string[] = []

  for (const kol of PAAKRAEVET) {
    if (!felter[kol]) fejl.push(`Mangler ${kol}`)
  }
  if (felter.bil_ordrenummer && !BIL_ORDRE_MOENSTER.test(felter.bil_ordrenummer)) {
    fejl.push('Bil-ordrenummer har forkert format (<ordrenr>-DDMMYY-NN)')
  }
  if (felter.chauffoer_mobil && !E164_MOENSTER.test(felter.chauffoer_mobil)) {
    fejl.push('Mobilnummer skal være E.164 (fx +4520304050)')
  }
  if (!felter.biltype) {
    advarsler.push('Biltype mangler — anbefales udfyldt')
  }
  if (felter.lasteevne_tons) {
    const v = Number(felter.lasteevne_tons)
    if (!Number.isInteger(v) || v <= 0) fejl.push('Lasteevne skal være et positivt heltal (fx 32)')
  } else {
    advarsler.push('Lasteevne mangler — forventes fra biltype-liste, ellers påkrævet')
  }
  if (felter.raekkefoelge) {
    const v = Number(felter.raekkefoelge)
    if (!Number.isInteger(v) || v <= 0) fejl.push('Rækkefølge skal være et positivt heltal (fx 1)')
  }
  if (felter.ankomst_fabrik && !ANKOMST_FABRIK_MOENSTER.test(felter.ankomst_fabrik)) {
    fejl.push('Ankomst fabrik skal være HH.mm (fx 06.30)')
  }

  const status: RaekkeStatus = fejl.length > 0 ? 'fejl' : advarsler.length > 0 ? 'advarsel' : 'ok'
  return { felter, fejl, advarsler, status }
}

interface TjekResultat {
  filnavn: string
  manglendeKolonner: Kolonne[]
  raekker: TjekketRaekke[]
}

function tjekFil(filnavn: string, tekst: string): TjekResultat {
  const { headers, raekker } = parseCsv(tekst)
  const manglendeKolonner = PAAKRAEVET.filter(k => !headers.includes(k))
  const indeks = (kol: Kolonne) => headers.indexOf(kol)

  const tjekkede = raekker.map<TjekketRaekke>(celler => {
    const felter = KOLONNER.reduce((acc, kol) => {
      const i = indeks(kol)
      acc[kol] = i >= 0 ? (celler[i] ?? '') : ''
      return acc
    }, {} as Record<Kolonne, string>)
    return tjekRaekke(felter)
  })

  return { filnavn, manglendeKolonner, raekker: tjekkede }
}

// ── Komponent ──────────────────────────────────────────────────────────────────

type Fase = 'tom' | 'gennemgaaet' | 'sender' | 'sendt'

export function DisponeringUpload() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [fase, setFase] = useState<Fase>('tom')
  const [draggerOver, setDraggerOver] = useState(false)
  const [resultat, setResultat] = useState<TjekResultat | null>(null)
  const [filFejl, setFilFejl] = useState<string | null>(null)

  function haandterFil(fil: File) {
    setFilFejl(null)
    if (!fil.name.toLowerCase().endsWith('.csv')) {
      setFilFejl('Filen skal være en .csv-fil.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const tekst = String(reader.result ?? '')
      const r = tjekFil(fil.name, tekst)
      if (r.raekker.length === 0) {
        setFilFejl('Filen indeholder ingen datarækker.')
        return
      }
      setResultat(r)
      setFase('gennemgaaet')
    }
    reader.onerror = () => setFilFejl('Kunne ikke læse filen.')
    reader.readAsText(fil, 'UTF-8')
  }

  function nulstil() {
    setResultat(null)
    setFilFejl(null)
    setFase('tom')
    if (inputRef.current) inputRef.current.value = ''
  }

  function indsend() {
    setFase('sender')
    // TODO: Erstat med Supabase når klar — POST gyldige rækker → confirmed_vehicles[].
    // Samme indgang som SFTP-vejen; backend validerer igen + binder reg_nr til bil-ordrenummer.
    window.setTimeout(() => setFase('sendt'), 1000)
  }

  const antalOk = resultat?.raekker.filter(r => r.status !== 'fejl').length ?? 0
  const antalFejl = resultat?.raekker.filter(r => r.status === 'fejl').length ?? 0
  const kanIndsende =
    fase === 'gennemgaaet' &&
    resultat !== null &&
    resultat.manglendeKolonner.length === 0 &&
    antalFejl === 0 &&
    antalOk > 0

  return (
    <div className="bg-white rounded-2xl border border-hairline shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-box-outline">
        <span className="inline-flex items-center gap-xxxs font-inter text-xxs font-semibold uppercase tracking-wide border px-xs py-xxs rounded-full mb-xs bg-good-bg text-good border-good/20">
          <UploadCloud size={11} className="flex-shrink-0" />
          Indsend uden eget system
        </span>
        <h2 className="font-poppins font-semibold text-base text-deep-teal leading-snug">
          Upload din disponering
        </h2>
        <p className="font-inter text-xs text-text-muted mt-xxxs leading-relaxed">
          Har du ikke et SFTP-drop, kan du uploade disponeringen som CSV her i stedet. Brug{' '}
          <span className="font-semibold text-text-secondary">disponering.csv</span>-eksemplet ovenfor som skabelon —
          samme felter, én række pr. bil.
        </p>
      </div>

      {/* Indhold pr. fase */}
      {fase === 'sendt' ? (
        <div className="px-5 py-8 flex flex-col items-center text-center gap-xs">
          <div className="w-12 h-12 rounded-full bg-good-bg flex items-center justify-center">
            <CheckCircle2 size={26} className="text-good" />
          </div>
          <p className="font-poppins font-semibold text-base text-deep-teal">Disponering indsendt</p>
          <p className="font-inter text-xs text-text-muted max-w-sm leading-relaxed">
            {antalOk} {antalOk === 1 ? 'bil' : 'biler'} er sendt til Colas. Chaufførerne får automatisk en SMS med
            dagens ordre og link til appen.
          </p>
          <button
            onClick={nulstil}
            className="mt-xs font-poppins text-xs font-semibold px-md py-xs rounded-full bg-white border border-deep-teal/30 text-deep-teal hover:bg-soft-aqua/40 transition-colors"
          >
            Indsend en ny fil
          </button>
        </div>
      ) : (
        <>
          {/* Drop-zone (skjules når fil er gennemgået) */}
          {fase === 'tom' && (
            <div className="px-5 py-5">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDraggerOver(true) }}
                onDragLeave={() => setDraggerOver(false)}
                onDrop={e => {
                  e.preventDefault()
                  setDraggerOver(false)
                  const fil = e.dataTransfer.files?.[0]
                  if (fil) haandterFil(fil)
                }}
                className={[
                  'w-full rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-xs py-8 px-md transition-colors',
                  draggerOver
                    ? 'border-deep-teal bg-soft-aqua/50'
                    : 'border-box-outline bg-surface-2 hover:border-deep-teal/40 hover:bg-soft-aqua/30',
                ].join(' ')}
              >
                <div className="w-11 h-11 rounded-full bg-soft-aqua/70 flex items-center justify-center">
                  <UploadCloud size={20} className="text-deep-teal" />
                </div>
                <p className="font-poppins font-semibold text-sm text-deep-teal">
                  Træk din CSV hertil — eller klik for at vælge
                </p>
                <p className="font-inter text-xxs text-text-muted">UTF-8 · semikolon-separator · én række pr. bil</p>
              </button>
              <input
                ref={inputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) haandterFil(f) }}
              />
              {filFejl && (
                <p className="mt-xs font-inter text-xs text-bad flex items-center gap-xxxs">
                  <XCircle size={13} className="flex-shrink-0" /> {filFejl}
                </p>
              )}
            </div>
          )}

          {/* Gennemgang */}
          {fase !== 'tom' && resultat && (
            <div className="px-5 py-4">
              {/* Fil-linje + ryd */}
              <div className="flex items-center justify-between gap-xs mb-sm">
                <span className="inline-flex items-center gap-xs font-inter text-sm text-text-primary min-w-0">
                  <FileText size={15} className="text-deep-teal flex-shrink-0" />
                  <span className="truncate font-medium">{resultat.filnavn}</span>
                </span>
                {fase === 'gennemgaaet' && (
                  <button
                    onClick={nulstil}
                    className="inline-flex items-center gap-xxxs font-inter text-xxs text-text-muted hover:text-bad transition-colors flex-shrink-0"
                  >
                    <X size={13} /> Ryd
                  </button>
                )}
              </div>

              {/* Manglende kolonner = global blokering */}
              {resultat.manglendeKolonner.length > 0 && (
                <div className="mb-sm rounded-lg border border-bad/30 bg-bad/10 px-sm py-xs flex items-start gap-xs">
                  <XCircle size={15} className="text-bad flex-shrink-0 mt-0.5" />
                  <p className="font-inter text-xs text-text-secondary leading-relaxed">
                    Filen mangler påkrævede kolonner i header-rækken:{' '}
                    <span className="font-mono text-bad">{resultat.manglendeKolonner.join(', ')}</span>. Brug
                    skabelonen, så kolonnenavnene matcher.
                  </p>
                </div>
              )}

              {/* Opsummering */}
              <div className="flex flex-wrap gap-xs mb-sm">
                <span className="inline-flex items-center gap-xxxs font-inter text-xxs font-semibold px-xs py-xxs rounded-full bg-good-bg text-good border border-good/20">
                  <CheckCircle2 size={12} /> {antalOk} klar
                </span>
                {antalFejl > 0 && (
                  <span className="inline-flex items-center gap-xxxs font-inter text-xxs font-semibold px-xs py-xxs rounded-full bg-bad/10 text-bad border border-bad/20">
                    <XCircle size={12} /> {antalFejl} med fejl
                  </span>
                )}
              </div>

              {/* Preview-tabel */}
              <div className="rounded-xl border border-hairline overflow-hidden">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-surface-2 border-b border-hairline">
                      <th className="w-8 px-xs py-xs" />
                      {KOLONNER.map(k => (
                        <th key={k} className="text-left font-inter text-xxs font-semibold uppercase tracking-wide text-text-muted px-xs py-xs">
                          {k}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {resultat.raekker.map((r, i) => (
                      <tr
                        key={i}
                        className={[
                          'border-b border-hairline last:border-0 align-top',
                          r.status === 'fejl' ? 'bg-bad-bg' : r.status === 'advarsel' ? 'bg-warn-bg' : '',
                        ].join(' ')}
                      >
                        <td className="px-xs py-xs">
                          {r.status === 'fejl' ? (
                            <XCircle size={14} className="text-bad" />
                          ) : r.status === 'advarsel' ? (
                            <AlertTriangle size={14} className="text-text-secondary" />
                          ) : (
                            <CheckCircle2 size={14} className="text-good" />
                          )}
                        </td>
                        {KOLONNER.map(k => (
                          <td key={k} className="px-xs py-xs font-inter text-xs text-text-primary">
                            <span className={r.felter[k] ? '' : 'text-text-muted italic'}>
                              {r.felter[k] || '—'}
                            </span>
                            {/* fejl/advarsel-tekst under det første felt */}
                            {k === 'bil_ordrenummer' && (r.fejl.length > 0 || r.advarsler.length > 0) && (
                              <span className="block mt-xxxs space-y-xxxs">
                                {r.fejl.map((f, j) => (
                                  <span key={`f${j}`} className="block font-inter text-xxs text-bad">{f}</span>
                                ))}
                                {r.advarsler.map((a, j) => (
                                  <span key={`a${j}`} className="block font-inter text-xxs text-warning">{a}</span>
                                ))}
                              </span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Indsend */}
              <div className="mt-sm flex items-center justify-between gap-xs flex-wrap">
                <p className="font-inter text-xxs text-text-muted">
                  {antalFejl > 0
                    ? 'Ret rækkerne med fejl i din fil og upload igen — eller indsend kun de korrekte.'
                    : 'Alle rækker er klar til indsendelse.'}
                </p>
                <button
                  onClick={indsend}
                  disabled={fase === 'sender' || !kanIndsende}
                  className="font-poppins text-xs font-semibold px-md py-xs rounded-full bg-deep-teal text-white inline-flex items-center gap-xxxs hover:bg-dark-teal transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {fase === 'sender' ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  {fase === 'sender' ? 'Sender…' : `Indsend ${antalOk} ${antalOk === 1 ? 'bil' : 'biler'}`}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
