/**
 * PROTOTYPE — Vognmand Dataudveksling
 * Beskriver hvad Colas sender (formandens output) og hvad vi forventer retur,
 * samt SFTP-fil-udvekslingen og hvornår/hvordan den trigges.
 * Kontrakt: Docs/Vognmand/Dataudveksling-vognmand.md.
 * Må ikke importeres i produktionskode.
 */
import { useState } from 'react'
import {
  ArrowDownLeft, ArrowUpRight, Server, Clock, ShieldCheck, RefreshCw, CheckCircle2, Download,
} from 'lucide-react'
import { DisponeringUpload } from './DisponeringUpload'

// ── Felt-definitioner — TODO: Erstat med Supabase når klar ──────────────────────

interface Felt {
  navn: string
  forklaring: string
  /** Maskin-venligt CSV-kolonnenavn (header-rækken) */
  kolonne: string
  /** Eksempel på formatet — vises som chip + bruges i CSV-eksemplet */
  eksempel: string
  paakraevet?: boolean
}

/** Det Colas (formanden) sender — jf. Dataudveksling-vognmand.md afsnit 1 */
const FORMAND_OUTPUT: Felt[] = [
  { navn: 'Bil-ordrenummer (pr. bil)', kolonne: 'bil_ordrenummer', eksempel: '1212343-170326-01', forklaring: 'Unik match-nøgle <ordrenr>-DDMMYY-NN — nulstilles pr. dag, én pr. bil', paakraevet: true },
  { navn: 'Ordrenummer', kolonne: 'ordrenummer', eksempel: '1212343', forklaring: 'Reference på moderordren' },
  { navn: 'Dato', kolonne: 'dato', eksempel: '2026-03-17', forklaring: 'ISO-format YYYY-MM-DD — dagen kørslen udføres' },
  { navn: 'Fabrik', kolonne: 'fabrik', eksempel: 'PROD A · KØGE PH', forklaring: 'Hvor materialet hentes' },
  { navn: 'Produkt', kolonne: 'produkt', eksempel: 'AB 11t', forklaring: 'Asfaltproduktets kode' },
  { navn: 'Forventede Tons', kolonne: 'forventet_tons', eksempel: '96', forklaring: 'Forventede Tons for bilen/produktet (heltal)' },
  { navn: 'Aflæsningssted', kolonne: 'aflaesningssted', eksempel: 'Søndre Boulevard 44, 4900 Nakskov', forklaring: 'Adressen på pladsen hvor der lægges ud' },
  { navn: 'Forventet antal biler', kolonne: 'forventet_antal_biler', eksempel: '3', forklaring: 'Colas vejledende beregning af dagens behov' },
  { navn: 'Ankomst på plads', kolonne: 'ankomst_plads', eksempel: '07.15', forklaring: 'HH.mm (24-timer, punktum) — ankomsttid på pladsen for denne bil' },
  { navn: 'Mødetid på fabrik', kolonne: 'moedetid_fabrik', eksempel: '06.30', forklaring: 'HH.mm (24-timer, punktum) — beregnet mødetid til bilens første ankomst' },
  { navn: 'Afregningsform', kolonne: 'afregningsform', eksempel: 'Akkord', forklaring: 'Akkord eller Timeløn' },
  { navn: 'Kommentar til chauffør', kolonne: 'kommentar', eksempel: 'Smal adgangsvej', forklaring: 'Kørselsspecifikke instruktioner (kan være tom)' },
]

/** Det vi forventer retur fra vognmanden — jf. afsnit 2 */
const VOGNMAND_RETUR: Felt[] = [
  { navn: 'Bil-ordrenummer', kolonne: 'bil_ordrenummer', eksempel: '1212343-170326-01', forklaring: 'Echo af match-nøglen vi sendte — kobler bilen til den rigtige bestilling', paakraevet: true },
  { navn: 'Reelt reg.nr', kolonne: 'reg_nr', eksempel: 'XE32114', forklaring: 'Bilens faktiske registreringsnummer — bærer al udførsels-/afregningsdata', paakraevet: true },
  { navn: 'Biltype', kolonne: 'biltype', eksempel: 'Sættevogn', forklaring: 'Vælges fra Colas’ prædefinerede biltype-liste, så den matcher vores database — ingen match → filen afvises', paakraevet: true },
  { navn: 'Lasteevne (Tons)', kolonne: 'lasteevne_tons', eksempel: '32', forklaring: 'Bilens kapacitet i Tons — så vi kan validere samlet kapacitet mod forventede Tons. Forudfyldes fra biltype-listen hvor muligt; ellers påkrævet fra dig' },
  { navn: 'Rækkefølge', kolonne: 'raekkefoelge', eksempel: '1', forklaring: 'Bilens position i dagens rækkefølge — bekræfter starttiden (kan udledes af løbenummeret i bil-ordrenummeret)' },
  { navn: 'Ankomst fabrik (retur)', kolonne: 'ankomst_fabrik', eksempel: '06.30', forklaring: 'HH.mm — du returnerer den mødetid på fabrik vi sendte, så vi kender starttider for ALLE biler og kan beregne hele dagens flow' },
  { navn: 'Chaufførens navn', kolonne: 'chauffoer_navn', eksempel: 'Lars Pedersen', forklaring: 'Vises til formand + chauffør' },
  { navn: 'Chaufførens mobilnummer', kolonne: 'chauffoer_mobil', eksempel: '+4520304050', forklaring: 'SMS + app-link sendes hertil — hele flowet falder hvis det mangler', paakraevet: true },
]

// ── CSV-eksempel — to ekstra demo-rækker pr. fil (UTF-8, semikolon-separator) ────
// TODO: Erstat med Supabase når klar — eksempelfilen genereres server-side pr. vognmand.

const BESTILLING_DEMO_RAEKKER: Record<string, string>[] = [
  { bil_ordrenummer: '1212343-170326-01', ordrenummer: '1212343', dato: '2026-03-17', fabrik: 'PROD A · KØGE PH', produkt: 'AB 11t', forventet_tons: '96', aflaesningssted: 'Søndre Boulevard 44, 4900 Nakskov', forventet_antal_biler: '3', ankomst_plads: '07.15', moedetid_fabrik: '06.30', afregningsform: 'Akkord', kommentar: 'Smal adgangsvej' },
  { bil_ordrenummer: '1212343-170326-02', ordrenummer: '1212343', dato: '2026-03-17', fabrik: 'PROD A · KØGE PH', produkt: 'AB 11t', forventet_tons: '90', aflaesningssted: 'Søndre Boulevard 44, 4900 Nakskov', forventet_antal_biler: '3', ankomst_plads: '07.30', moedetid_fabrik: '06.45', afregningsform: 'Akkord', kommentar: '' },
]

const RETUR_DEMO_RAEKKER: Record<string, string>[] = [
  { bil_ordrenummer: '1212343-170326-01', reg_nr: 'XE32114', biltype: 'Sættevogn', lasteevne_tons: '32', raekkefoelge: '1', ankomst_fabrik: '06.30', chauffoer_navn: 'Lars Pedersen', chauffoer_mobil: '+4520304050' },
  { bil_ordrenummer: '1212343-170326-02', reg_nr: 'AB54231', biltype: 'Påhængsvogn (drejekrans)', lasteevne_tons: '28', raekkefoelge: '2', ankomst_fabrik: '06.45', chauffoer_navn: 'Brian Nielsen', chauffoer_mobil: '+4520304051' },
]

/** Byg CSV-tekst (UTF-8 BOM + semikolon + CRLF) og trig download i browseren. */
function downloadCsv(filnavn: string, felter: Felt[], raekker: Record<string, string>[]) {
  const headers = felter.map(f => f.kolonne)
  const escape = (v: string) => (/[";\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)
  const linjer = [
    headers.join(';'),
    ...raekker.map(r => headers.map(h => escape(r[h] ?? '')).join(';')),
  ]
  const indhold = '﻿' + linjer.join('\r\n')   // BOM så Excel læser danske tegn
  const blob = new Blob([indhold], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filnavn
  a.click()
  URL.revokeObjectURL(url)
}

// ── Felt-boks ────────────────────────────────────────────────────────────────────

interface FeltBoksProps {
  titel: string
  undertekst: string
  retning: 'modtaget' | 'retur'
  felter: Felt[]
  onDownload: () => void
  downloadLabel: string
}

function FeltBoks({ titel, undertekst, retning, felter, onDownload, downloadLabel }: FeltBoksProps) {
  const erModtaget = retning === 'modtaget'
  const Icon = erModtaget ? ArrowDownLeft : ArrowUpRight
  const accent = erModtaget
    ? 'bg-soft-aqua/60 text-deep-teal border-light-aqua'
    : 'bg-good-bg text-good border-good/20'
  return (
    <div className="bg-white rounded-2xl border border-hairline shadow-sm overflow-hidden flex flex-col">
      <div className="px-5 pt-5 pb-4 border-b border-box-outline">
        <span className={`inline-flex items-center gap-xxxs font-inter text-xxs font-semibold uppercase tracking-wide border px-xs py-xxs rounded-full mb-xs ${accent}`}>
          <Icon size={11} className="flex-shrink-0" />
          {erModtaget ? 'Modtaget fra Colas' : 'Sendt retur fra vognmand'}
        </span>
        <h2 className="font-poppins font-semibold text-base text-deep-teal leading-snug">{titel}</h2>
        <p className="font-inter text-xs text-text-muted mt-xxxs">{undertekst}</p>
      </div>
      <div className="divide-y divide-hairline flex-1">
        {felter.map(f => (
          <div key={f.navn} className="px-5 py-3">
            <div className="flex items-center gap-xs flex-wrap">
              <p className="font-inter text-sm font-semibold text-text-primary">{f.navn}</p>
              <span className="font-inter text-xxs text-text-muted">{f.kolonne}</span>
              {f.paakraevet && (
                <span className="font-inter text-xxs font-semibold uppercase tracking-wide text-bad bg-bad/10 px-xs py-xxs rounded-full">
                  Påkrævet
                </span>
              )}
            </div>
            <p className="font-inter text-xs text-text-muted leading-relaxed mt-xxxs">{f.forklaring}</p>
            <div className="mt-xs flex items-center gap-xs">
              <span className="font-inter text-xxs font-semibold uppercase tracking-wide text-text-muted flex-shrink-0">Eksempel</span>
              <code className="font-mono text-xs text-deep-teal bg-surface-2 border border-hairline rounded-md px-xs py-xxs break-all">
                {f.eksempel || '(tom)'}
              </code>
            </div>
          </div>
        ))}
      </div>
      <div className="px-5 py-3 border-t border-box-outline">
        <button
          onClick={onDownload}
          className="w-full font-poppins text-xs font-semibold px-md py-xs rounded-full bg-white border border-deep-teal/30 text-deep-teal inline-flex items-center justify-center gap-xxxs hover:bg-soft-aqua/40 transition-colors"
        >
          <Download size={14} />
          {downloadLabel}
        </button>
      </div>
    </div>
  )
}

// ── Skærm ──────────────────────────────────────────────────────────────────────

export function DataudvekslingScreen() {
  const [henter, setHenter] = useState(false)
  const [sidstHentet, setSidstHentet] = useState<string | null>('I dag kl. 06.12')

  function handleOpdater() {
    setHenter(true)
    // TODO: Erstat med Supabase når klar — pull af klar-bestillinger for denne vognmand.
    // Henter KUN det der allerede ligger klar (ingen server-generering on-demand).
    window.setTimeout(() => {
      setHenter(false)
      setSidstHentet('Lige nu')
    }, 900)
  }

  return (
    <div className="bg-page min-h-full">
      <div className="max-w-5xl mx-auto px-md pt-md pb-lg">

        {/* Header + Opdatér */}
        <div className="mb-md flex items-end justify-between gap-4">
          <div>
            <h1 className="font-poppins font-semibold text-2xl text-deep-teal leading-tight">Dataudveksling</h1>
            <p className="font-inter text-xs text-text-muted mt-0.5">
              Hvad Colas sender, og hvad vi forventer retur fra dig.
            </p>
          </div>
          <div className="flex flex-col items-end gap-xxxs flex-shrink-0">
            <button
              onClick={handleOpdater}
              disabled={henter}
              className="font-poppins text-xs font-semibold px-md py-xs rounded-full bg-deep-teal text-white inline-flex items-center gap-xxxs hover:bg-dark-teal transition-colors disabled:opacity-60"
            >
              <RefreshCw size={14} className={henter ? 'animate-spin' : ''} />
              {henter ? 'Henter…' : 'Opdatér'}
            </button>
            {sidstHentet && (
              <span className="font-inter text-xxs text-text-muted">Sidst hentet: {sidstHentet}</span>
            )}
          </div>
        </div>

        {/* To bokse: output + retur */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-md mb-md">
          <FeltBoks
            titel="Formandens output"
            undertekst="Sendes pr. kørselsbestilling dagen før"
            retning="modtaget"
            felter={FORMAND_OUTPUT}
            downloadLabel="Download eksempel — bestilling.csv"
            onDownload={() => downloadCsv('colas-bestilling-eksempel.csv', FORMAND_OUTPUT, BESTILLING_DEMO_RAEKKER)}
          />
          <FeltBoks
            titel="Forventet retur fra vognmand"
            undertekst="Sendes pr. bil, du sætter på dagen"
            retning="retur"
            felter={VOGNMAND_RETUR}
            downloadLabel="Download eksempel — disponering.csv"
            onDownload={() => downloadCsv('vognmand-disponering-eksempel.csv', VOGNMAND_RETUR, RETUR_DEMO_RAEKKER)}
          />
        </div>

        {/* Filudveksling — SFTP */}
        <div className="bg-white rounded-2xl border border-hairline shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-surface-2 border-b border-hairline">
            <p className="font-inter text-xs font-semibold uppercase tracking-widest text-text-muted">
              Sådan udveksles filerne
            </p>
          </div>
          <div className="px-5 py-4 grid grid-cols-1 md:grid-cols-3 gap-md">
            <InfoBlok Icon={Server} titel="To kanaler — samme fil">
              Store vognmænd med eget system: krypteret SFTP-drop-mappe, der poller og henter automatisk hvert
              15. minut. Små vognmænd uden system: e-mail-notifikation med upload-link til web-formularen nedenfor.
              Samme CSV-kontrakt begge veje.
            </InfoBlok>
            <InfoBlok Icon={Clock} titel="Kun én fil — seneste vinder">
              Bestillingen ligger som ét stabilt filnavn pr. vognmand pr. dag og overskrives ved rettelser — der
              opstår aldrig flere versioner. Import sker pr. bil-ordrenummer, så seneste fil vinder. Rettelser før
              kl. 18 dagen før trigger ny hentning (SFTP-poll / ny e-mail); derefter aftales ændringer telefonisk.
            </InfoBlok>
            <InfoBlok Icon={ShieldCheck} titel="Sikkerhed">
              SFTP (ikke FTP), da filen indeholder persondata (chaufførnavn + mobil). Drop-endpoint i EU og
              databehandleraftale pr. vognmand.
            </InfoBlok>
          </div>

          {/* Format-konventioner */}
          <div className="px-5 py-4 border-t border-box-outline">
            <p className="font-inter text-xxs font-semibold uppercase tracking-widest text-text-muted mb-xs">
              Format-konventioner
            </p>
            <div className="flex flex-wrap gap-xs">
              {[
                { k: 'Dato', v: '2026-03-17 (ISO)' },
                { k: 'Tid', v: '07.15 (HH.mm)' },
                { k: 'Tons', v: '96 (heltal)' },
                { k: 'Telefon', v: '+4512121212 (E.164)' },
                { k: 'Separator', v: 'semikolon ;' },
                { k: 'Tegnsæt', v: 'UTF-8' },
              ].map(({ k, v }) => (
                <span key={k} className="inline-flex items-center gap-xxxs font-inter text-xxs text-text-secondary bg-surface-2 border border-hairline rounded-md px-xs py-xxs">
                  <span className="font-semibold text-text-muted uppercase tracking-wide">{k}</span>
                  <code className="font-mono text-deep-teal">{v}</code>
                </span>
              ))}
            </div>
          </div>

          {/* Opdatér-forklaring */}
          <div className="px-5 py-4 border-t border-box-outline bg-soft-aqua/40 flex items-start gap-xs">
            <CheckCircle2 size={16} className="text-good flex-shrink-0 mt-0.5" />
            <p className="font-inter text-xs text-text-secondary leading-relaxed">
              <span className="font-semibold text-text-primary">Opdatér-knappen</span> henter de bestillinger, der
              allerede ligger klar til dig hos Colas — den genererer ikke noget on-demand. Er der intet nyt endnu,
              har formanden ikke sendt for den pågældende dag. Selve fil-leveringen sker automatisk; knappen er kun
              en manuel genindlæsning.
            </p>
          </div>
        </div>

        {/* Den anden dør — webupload for små vognmænd uden SFTP */}
        <div className="mt-md">
          <DisponeringUpload />
        </div>

      </div>
    </div>
  )
}

function InfoBlok({ Icon, titel, children }: { Icon: typeof Server; titel: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-xs mb-xs">
        <div className="w-8 h-8 rounded-lg bg-soft-aqua/60 flex items-center justify-center flex-shrink-0">
          <Icon size={15} className="text-deep-teal" />
        </div>
        <p className="font-poppins font-semibold text-sm text-deep-teal">{titel}</p>
      </div>
      <p className="font-inter text-xs text-text-secondary leading-relaxed">{children}</p>
    </div>
  )
}
