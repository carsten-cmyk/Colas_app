// ─── Types ───────────────────────────────────────────────────────────────────

export type CancelReason = 'regn' | 'frost' | 'underlag' | 'andet'

export interface DayPlan {
  id: string
  day: number
  date: string         // YYYY-MM-DD
  tonsPlanned: number
  morgenTons?: number  // morgen-bekræftelse
  cancelled: boolean
  cancelReason?: CancelReason
  /**
   * Flow 9b (OPDATERET 2026-06-09): PLAN-pushet ekstra-bestilling fra fabrik.
   * Indeholder KUN delta-mængden — ikke totalen. Vises som synlig
   * `EkstraBestillingBox` ved siden af produktet i Asfaltbestilling-rækken.
   * Tons lægges OVENI tonsPlanned i alle downstream-beregninger via getEffectiveTons().
   */
  // TODO: Erstat med Supabase når klar — hent fra plan_dag_opdatering-tabel
  ekstraTons?: {
    tons: number              // delta — KUN ekstra-mængden, ikke totalen
    bekraeftetAf: 'fabrik'
    tidspunkt: string         // ISO — hvornår PLAN registrerede
  }
}

export interface MockProduct {
  id: string
  recipeCode: string
  recipeName: string
  activityName: string
  m2: number
  thicknessMm: number
  tonsTotal: number
  factory: { code: string; name: string; driveTimeMinutes: number }
  estimatedTrucks: number
  estimatedTonsPerTruck: number
  days: DayPlan[]
  startDate?: string
  endDate?: string
  // Felter fra PLAN — kilde: PLAN-system
  kravTilSamlinger?: string           // fx "Klæbet" / "Ikke klæbet"
  ekstraTemperaturmaalinger?: boolean // Ja/Nej
  // TODO: Erstat med Supabase når klar — A3/A4/MKS-skemaer oprettes senere under Udførelse-menupunktet.
  // Entreprisekontrol og Temperaturmåling kommer fra PLAN og styrer skema-krav:
  //   værdi 1 → kun MKS skal udfyldes
  //   værdi 2 → A3, A4, MKS skal udfyldes
  //   undefined → intet skema-krav
  // Når begge felter er sat, vises union af krav (strengeste vinder).
  entreprisekontrol?: 1 | 2
  temperaturmaaling?: 1 | 2
}

export interface MockResource {
  id: string
  plantNumber: string
  description: string
  transportTag: 'blokvogn' | 'kran-baand' | 'egen-korsel'
  status: 'planlagt' | 'ikke-planlagt'
}


export interface VehicleOrder {
  id: string
  type: string
  antal: number
  afregning_type?: 'time' | 'akkord'
}

export interface KørselPause {
  id: string
  time: string
  durationMin: number
}

export interface KørselDayParams {
  driveMinutes: number
  loadMinutes: number
  deliverMinutes: number
  intervalMinutes?: number
  firstLoadTime?: string
  lastLoadTime: string
  pauses: KørselPause[]
  /** Minutter pr. aflæsning på pladsen — editerbart, prefill 15 */
  aflaesningstidMin?: number
}

// ─── Andre ordrer på dagen (for multilæs-picker + ordre-pille-strip) ──────
// Inline mock — matcher Dagsoversigt for de relevante datoer (alle bortset fra denne ordre 1212343).
// TODO: Erstat med Supabase — andre ordrer for samme formand og dato.
export interface AndenOrdre {
  id: string
  orderNumber: string
  jobnummer: string
  udfoerelseSted: string   // adresse + by — vises i ordre-pille-strip
  products: { id: string; recipeCode: string; recipeName: string }[]
}

export interface NoteComment {
  id: string
  initials: 'OJ' | 'HT'
  name: string
  timestamp: string
  text: string
}

export interface MockPhoto { id: string; color: string; label: string; source?: string; url?: string }

// ─── Samleordre mock-data ─────────────────────────────────────────────────────
// TODO: Erstat med Supabase når klar — samleordrer fra samleordrer-tabel

export interface SamleordreChild {
  orderNumber: string
  jobnummer: string
  udfoerelseSted: string
  /** Kort stedangivelse til tab-label (fx "Søvej" eller "Strandvejen") */
  stedLabel: string
  isAnchor: boolean
  products: {
    id: string
    recipeCode: string
    recipeName: string
    tonsTotal: number
  }[]
  resources: MockResource[]
  projektleder: string
  projektlederTlf: string
  fabrik: string
  fabrikTlf: string
  kundeVirksomhed: string
  kundekontakt: string
  kundekontaktTlf: string
  /** Antal biler planlagt for denne ordre */
  antalBiler: number
  /** Om vognmand har bekræftet biler for denne ordre */
  vognmandBekraeftet: boolean
  /** Antal materiel-stykker til transport for denne ordre */
  antalMateriel: number
  /** Om vognmand har bekræftet materiel-transport for denne ordre */
  materielBekraeftet: boolean
  /** Om forundersøgelse er foretaget OG tilfredsstillende */
  forundersoegelseOK: boolean
  /** Status for forundersøgelse — 'OK' | 'IKKE_OK' | 'MANGLER' */
  forundersoegelseStatus: 'OK' | 'IKKE_OK' | 'MANGLER'
  /** Per-child Forundersøgelse-detaljer — vises i Udførsel-mode */
  // TODO: Erstat med Supabase når klar — hent fra forundersoegelse-tabel pr. ordre
  forundersoegelseDetails?: {
    underlaegsType: 'asfalt' | 'beton' | 'grus' | null
    tilfredsstillende: boolean | null
    besigtigelseComment: string
    photoCount: number
  }
  /** Per-child Udlægning-detaljer — vises i Udførsel-mode */
  // TODO: Erstat med Supabase når klar — hent fra udlaegning-tabel pr. ordre
  udlaegningDetails?: {
    status: 'ikke-startet' | 'i-gang' | 'færdig'
    startTid?: string
    sluttId?: string
    noter: string
  }
}

export interface SamleordreContext {
  id: string
  children: SamleordreChild[]
}

// ─── Types (mode) ─────────────────────────────────────────────────────────────

export type OrderMode = 'planlaegning' | 'udfoersel' | 'afregning'

export type UnderlagType = 'asfalt' | 'grus' | 'beton' | 'fraeset' | 'andet'
export type UnderlaegsAarsag = 'revner' | 'sporkoert' | 'krakeleret' | 'ujaevn' | 'saetninger' | 'snavs' | 'bloed' | 'graes-ukrudt'

// ─── Vejeseddel types (inline prototype) ──────────────────────────────────────
// TODO: Erstat med Supabase når klar — data fra plan_vejebilag-tabel

export interface PreFordeling {
  ordre_id: string
  ordre_label: string     // fx "1212343 · Søvej 6D"
  tons: number
  is_anchor: boolean      // anchor-ordre vises først med gul prik
}

export interface Vejeseddel {
  id: string
  // TODO: Erstat med Supabase når klar — fra plan_vejebilag (vejeseddel-/bilagsnummer)
  vejeseddelNr: string       // fx "1042801"
  product_code: string        // fx "ABB 11"
  product_name: string        // fx "ABB 11 toplag"
  netto_tons: number
  // TODO: Erstat med Supabase når klar — tara/brutto fra plan_vejebilag
  tara_tons: number           // bils tomvægt (typisk 14-15 tons pr. 6-7 aks bil)
  multilaes_flag: boolean
  puljelaes_flag: boolean
  aflæsset_efter_1_5t: boolean  // for akkord-biler: om 1.5-times-reglen er trådt i kraft
  /**
   * Puljelæs-gruppe-id: vejesedler med samme bil + samme læs_id tilhører én pulje.
   * Undefined for normale læs og multilæs.
   * TODO: Erstat med Supabase når klar — fra plan_vejebilag.laes_id
   */
  laes_id?: string
  // pre-mock fordeling (vises som initial state for multilæs)
  pre_fordeling: PreFordeling[]
}

// ─── Afregning types (inline prototype) ──────────────────────────────────────

/** STATUS_VOKABULAR #13 — LÅST 2026-06-15. Fase 2: aendret_siden_afsendelse bruges ikke endnu. */
export type ChauffoerSmsStatus = 'ikke_sendt' | 'sendt' | 'aendret_siden_afsendelse'

export type AfregningType = 'time' | 'akkord'

export interface ChauffoerAfregning {
  chauffoer_navn: string
  reg_nr?: string                // null for materiel
  afregning_type?: AfregningType // undefined → fallback time + banner
  // Prædufyldte fra chauffør-app (alle valgfrie)
  // TODO: Erstat med Supabase når klar — afregning_type kommer fra vognmand.aftaler.chauffoerer[], timer fra chauffeur-app, tons fra plan_vejebilag-tabel
  koretimer?: number
  ventetid?: number
  hviletid?: number
  tons_koert?: number            // fra PLAN vejebilag (mock for nu)
  chauffoer_kommentar?: string
  // State
  godkendt_af_formand: boolean
  godkendt_tidspunkt?: string
  /** Sat af auto-godkend-logik (FF Flow 4 Trin 5a): akkord uden ventetid auto-godkendes.
   *  false/undefined = manuelt godkendt eller ikke godkendt endnu. */
  auto_godkendt?: boolean
}

export interface ConfirmedTruck {
  regnr: string
  chauffoer: string
  tlf: string
  biltype: string
  /** HH:MM — bekræftet ankomst på plads fra vognmand (jf. FF Flow 1 Trin 4). */
  ankomst_plads_tid?: string
  /** Læs-nummer 1, 2, 3… — bestemt af drop-rækkefølge i vognmands disponering (jf. FF Trin 4). */
  laes_nummer?: number
  /** HH:MM — tilbageregnet mødetid på fabrik (jf. FF Trin 4: ankomst_plads − driveTimeMinutes). */
  moedetid_fabrik?: string
  /** SMS-status til chauffør (STATUS_VOKABULAR #13). Default: 'ikke_sendt'. */
  sms_status?: ChauffoerSmsStatus
  afregning?: Omit<ChauffoerAfregning, 'chauffoer_navn' | 'reg_nr'>
  /** Sat til true for biler der kører materiel (blokvogn, kran-bånd etc.) */
  er_materiel_bil?: boolean
  /** Liste over materiel-beskrivelser bilen kører, fx ['HAMM HD10 VT', 'VÖGELE 1900-3I'] */
  koert_materiel?: string[]
  /** Vejesedler for bilen — én pr. produkt, arvet fra plan_vejebilag */
  vejesedler?: Vejeseddel[]
}

export interface VognmandBekraeftelse {
  dayId: string
  biler: ConfirmedTruck[]
  bekraeftetTidspunkt: string // "DD. måned · HH:MM" — via formatTimestamp()
}

export interface ConfirmedMaterielItem {
  resourceId: string
  anlaegsNr: string
  beskrivelse: string
  regnr: string
  chauffoer: string
  tlf: string
  transportType: string
  /** HH:MM — bekræftet ankomst på plads fra vognmand (jf. FF Flow 2). Maks. de 3 første vises i Udførsel-dashboardet. */
  ankomst_plads_tid?: string
  // Afregning — kun første materiel-enhed per chauffør bærer afregning
  // TODO: Erstat med Supabase når klar — afregning_type kommer fra vognmand.aftaler.chauffoerer[], timer fra chauffeur-app, tons fra plan_vejebilag-tabel
  afregning_type?: AfregningType
  afregning_timer?: number
  afregning_ventetid?: number
  afregning_chauffoer_kommentar?: string
}

export interface VognmandMaterielBekraeftelse {
  items: ConfirmedMaterielItem[]
  bekraeftetTidspunkt: string
}

export interface EkstraLinje {
  id: string
  type: string
  beskrivelse: string
  antal: number
}

export interface EkstraarbejdeBlokProps {
  linjer: EkstraLinje[]
  onAdd: () => void
  onUpdate: (id: string, field: keyof EkstraLinje, value: string | number) => void
  onRemove: (id: string) => void
  sent: boolean
  onSend: () => void
  onReset: () => void
  /** Skjul Fortryd + "Gem ekstraarbejde"-knapper — bruges i Forundersøgelse hvor "Gem forundersøgelse" samler begge. */
  hideSaveFooter?: boolean
}

// PLAN-felt — styrer timeafregnings-flow for materiel-sektionen
// TODO: Erstat med Supabase når klar — timeafregning-feltet kommer fra orders.plan_timeafregning
export type TimeafregningFraPlan = 'ja' | 'nej'

// Materiel-enhed (anlæg fra holdpakken) — genbruger anlægsinfo fra INITIAL_VOGNMAND_MATERIEL_BEKRAEFTELSE
export interface MaterielEnhed {
  anlaegsNr: string
  beskrivelse: string
}
