# PRD — Formand Webapp
**App:** Colas Formand Web App
**Platform:** Web (desktop + tablet)
**Primær bruger:** Ole Jensen — Formand, asfaltplads
**Status:** Prototype-fase, ikke bygget
**Sidst opdateret:** 2026-03-16

---

## 1. Formål

Ole Jensen koordinerer en asfaltplads. I dag gør han det med telefon, papir og et ældre desktop-system (PLAN). Formand-appen erstatter den manuelle del: han skal på ét sted kunne planlægge biler og tons, se hvad der kører i realtid, og aflevere en jobrapport til efterkalkulation — uden at ringe.

Tre faser appen dækker:
1. **Planlægning** — aftenen før eller morgen: fordel tons på dage, bestil biler
2. **Eksekvering** — realtid på pladsen: se hvem kører, hvad er leveret, hvad mangler
3. **Evaluering** — efter jobbet: faktisk vs. planlagt (timer, tons, ventetid)

---

## 2. Brugere

| Person | Rolle | Kontekst |
|---|---|---|
| Ole Jensen | Formand | Tablet på pladsen, travl, afbrydes løbende |
| Henrik Thor | Projektleder | Desktop, ser fremdrift på tværs af projekter |
| Lars Dich-Johansen / Mads Zinglersen | Asfalt & Salg | Desktop, efterkalkulation og rapportering |

**Ole er den primære bruger.** Han er på pladsen — ikke kontoret. Tablet + touch er hans kontekst. Data skal stå klart uden brug af mental beregning.

---

## 3. Ordrestruktur (fra PLAN)

En ordre har **tre niveauer:**

```
Ordre (1212343 — Uddannelsescenter Syd, Søvej 6D, Nakskov)
├── Produkt 1: 23001B — 200t, 67m², 295mm tykkelse
│   ├── Dag 1: 100t
│   └── Dag 2: 100t
└── Produkt 2: 82101H — 752t, 4017m², 187mm tykkelse
    ├── Dag 1: 250t
    ├── Dag 2: 250t
    └── Dag 3: 252t
```

Produkter lægges sekventielt — produkt 2 lægges ovenpå produkt 1. Hvert produkt har:
- Receptkode + navn (fx `23001B`, `82101H`)
- Fabrik (kode + navn + køretid, fx `29000-PROD A EAST KØGE PH, ~36 min`)
- Mængde i m² + tons + tykkelse (kg/m², kg/m³)
- Dagfordeling (Dag1/Dag2/Dag3 i tons)

---

## 4. Transporttyper

**Asfalt-transport** (cyklisk, hele dagen):
- 7-akslet sættevogn eller båndtrailer
- Kører frem/tilbage fabrik↔plads hele dagen
- Kapacitet per tur: ~ X tons (afhænger af vogntype)

**Materiel-transport** (én gang):
- Dag 1: HAMM HD10, VÖGELE 1900-3I mv. fragtes ud på blokvogn
- Sidste dag: materiel køres tilbage

---

## 5. Screens (v1 scope)

### 5.1 Dagsoversigt — `/`

Hoved-skærm. Viser Ole hvad der sker **i dag**.

**Indhold:**
- Dato + aktivt ordrenummer + projektnavn
- Aktivt produkt: receptkode + navn + fabrik
- Tons-progress: `leveret / planlagt i dag` (fx `180t / 250t`)
- Antal biler aktive nu
- Forventet sluttid baseret på nuværende rate

**Sektioner (chauffører):**
- **Kører nu** — chauffører der er undervejs eller på pladsen
- **Venter** — ikke startet endnu
- **Afsluttet** — har leveret og stoppet

**Hvert chaufførkort viser:**
- Navn
- Antal leverede ture i dag
- Sidst set / sidst opdateret
- Status-badge: Kører / På fabrik / På plads / Afsluttet

---

### 5.2 Ordre-detalje — `/ordre/:id`

Tre-delt skærm styret af mode-navigation øverst.

**Mode-navigation:**
Segmented control med tre tilstande: `Planlægning | Udførsel | Evaluering`.
Aktiv mode markeres med gul baggrund (samme token som app-wide gult). Inaktive modes: mørk teal baggrund, hvid/50 tekst.

**Header (fælles for alle modes):**
- Ordrenummer
- Mode-navigation
- Fire info-bokse: Kunde · Beskrivelse · Projektleder · Seneste beskeder

**Planlægnings-mode** (se SCREENS.md §2a for fuld spec):
Siden er opdelt i fire navngivne sektioner med store overskrifter:
1. **Udlægning** — produkt-tabs + stats-kort (inkl. datointerval + antal dage) + dagfordeling
2. **Materiel** — maskiner + transport af materiel
3. **Dokumentation** — opmåling, billedmateriale, noter til opgave
4. **Transport** — forventet transport + "Beregn køreplan"-knap

**Udførsel-mode:** (sprint 2 — ikke bygget)
Real-time overblik: næste bil, biler på vej, tons leveret i dag.

**Evaluerings-mode:** (sprint 3 — ikke bygget)
Tilbud vs. faktisk: tons, dage, timer, biler.

---

### 5.3 Jobrapport — `/ordre/:id/rapport`

Udfyldes/godkendes efter jobbet. Input til efterkalkulation.

**Indhold:**
- Per dag + per vogntype:
  - Faktiske køretimer
  - Ventetimer
  - Akkord-tons
- Afvigelser + kommentarer
- Eksporter / send til sagsansvarlig

---

## 6. Datamodel

```ts
// types/order.ts

export interface Order {
  id: string
  orderNumber: string          // Arbejdsordre nr, fx "1212343"
  customer: string
  projectName: string          // Projekt + etape
  district: string
  foreman: string              // Holdnr/formand
  contactPM: Contact           // Projektleder + tlf
  comments?: string            // Forbehold
  products: Product[]
  resources: Resource[]
  state: 'planned' | 'active' | 'completed'
}

export interface Product {
  id: string
  activityName: string         // fx "GAB I at levere og udlægge, 80mm"
  recipeCode: string           // fx "23001B"
  recipeName: string           // fx "GAB I"
  factory: Factory
  m2: number
  kgPerM2: number
  kgPerM3: number
  tonsTotal: number
  startDate?: string           // ISO dato — "Dato for udlægning" fra
  endDate?: string             // ISO dato — "Dato for udlægning" til
  dailyPlan: DayPlan[]         // Fordeling per dag — regenereres når startDate+endDate ændres
  state: 'pending' | 'active' | 'completed'
}

export interface NoteComment {
  id: string
  authorId: string             // fx formandnr
  authorInitials: string       // fx "OJ"
  authorName: string           // fx "Ole Jensen"
  timestamp: string            // ISO 8601
  text: string
  // TODO: Erstat med Supabase når klar
}

export interface DayPlan {
  day: number                  // 1, 2, 3 ...
  tonsPlanned: number
  tonsDelivered?: number       // Fyldes ud under/efter eksekvering
}

export interface Factory {
  code: string                 // fx "29000"
  name: string                 // fx "PROD A EAST KØGE PH"
  driveTimeMinutes: number     // Fabrik → plads
}

export interface Resource {
  plantNumber: string          // Anlægsnr
  description: string          // fx "HAMM HD10 VT"
  type: 'asphalt-truck' | 'equipment' | 'crane' | 'other'
  vehicleType?: string         // Vogntype (sættevogn, båndtrailer osv.)
  capacityTonsPerTrip?: number
}

export interface Contact {
  name: string
  role: string
  phone: string
  imageUrl?: string
}

// types/driver.ts — TODO: Erstat med Supabase når klar
export interface Driver {
  id: string
  name: string
  imageUrl?: string
  phone: string
  vehicleType: string
}

// types/task.ts — aligned med chauffeur-appens Task type
export type TaskState = 'idle' | 'active' | 'paused' | 'completed'

export interface DriverTask {
  id: string
  orderId: string
  driver: Driver
  state: TaskState
  tripsToday: number           // Antal ture leveret i dag
  tonsDelivered: number        // Tons leveret i dag
  lastUpdatedAt?: string       // ISO 8601
  startedAt?: string
  completedAt?: string
}

// types/jobReport.ts
export interface JobReportEntry {
  orderId: string
  day: number
  vehicleType: string
  drivingHours: number         // Faktiske køretimer
  waitingHours: number         // Ventetimer
  accordTons: number           // Akkord-tons
  comment?: string
}
```

---

## 7. Navigation

- **React Router v6** — filbaseret routing via `src/pages/`
- Layout-komponent wrapper alle sider med sidebar-navigation
- Ingen state-based navigation (i modsætning til chauffeur-appen)

---

## 8. Design system — UFRAVIGELIG BESLUTNING

Formand-appen bruger **chauffeur-appens design system**. Alle tokens er defineret i
`apps/formand/tailwind.config.ts` og afspejler `apps/chauffeur/src/config/theme.js` præcist.

| Element | Beslutning |
|---|---|
| Farver | Chauffeur-appens palette: `deep-teal`, `dark-teal`, `yellow`, `light-aqua` osv. |
| Typografi | Poppins (overskrifter) + Inter (brødtekst) |
| Ikoner | Lucide React |
| Spacing/radius | Identisk med chauffeur-appen |
| Navigation | Bottom tab bar-mønster fra chauffeur-appen, tilpasset web |

Eksisterende HTML-prototyper og `SCREENS.md`/`ARCHITECTURE.md` er **UX/feature-reference** —
brug dem til at forstå flows og indhold. Brug **aldrig** deres farver eller typografi i koden.

---

## 9. Tekniske krav

- **Framework:** React 18 + TypeScript (strict mode)
- **Styling:** Tailwind CSS — kun tokens fra `tailwind.config.ts`, aldrig hardcodede værdier
- **Data:** Mock-data indtil Supabase er klar — `// TODO: Erstat med Supabase når klar`
- **Build:** Vite 5
- **Storybook:** Alle UI-komponenter skal have en story med alle variants
- **Responsive:** Desktop (1280px+), tablet (768px–1279px)

---

## 10. Dokumentation af hændelser

Formanden skal kunne dokumentere hændelser direkte fra appen — tilknyttet en specifik ordre.

**Trigger:** "Dokumentér"-knap i Eksekverings-mode + Dokumentations-tab

**Flow:**
1. Formand er inde på en ordre
2. Trykker "Dokumentér" → åbner dokumentations-panel
3. Tager billede med tablet-kamera (web: `<input type="file" accept="image/*" capture="environment">`)
4. Tilføjer fri-tekst beskrivelse
5. Gemmer — tilknyttet ordren automatisk

**Datamodel:**
```ts
// types/documentation.ts
export interface HændelsesDokumentation {
  id: string
  ordreId: string
  beskrivelse: string
  billeder: string[]        // URLs / base64 indtil Supabase Storage
  oprettetAf: string        // formandnavn
  tidspunkt: string         // ISO 8601
  // TODO: Erstat med Supabase Storage når klar
}
```

**Scope:** Sprint 2 — bygges når Eksekverings-mode er på plads.

---

## 11. Materiel-transport planlægning — TIL DISKUSSION

> **Status:** Ikke implementeret. Konceptet er beskrevet herunder — kræver afklaring før sprint-planlægning.

### Koncept

Formand planlægger materiel-transport separat fra asfalt-transporten. Flowet er:

1. **Se planlagt materiel** — formanden ser listen over materiel tilknyttet ordren (fx HAMM HD10 VT, VÖGELE 1900-3I)
2. **Tilføj materiel** — kan tilføje yderligere maskiner manuelt
3. **Vurder transportbehov** — formanden bestemmer transporttype per maskine:
   - Blokvogn (tung transport, bestilles hos vognmand)
   - Kran-Bånd
   - Egen kørsel
4. **Beskriv lasten** — en transportbeskrivelse genereres, fx:
   > "HAMM HD10 VT (2.220 kg) og VÖGELE 1900-3I hentes og afleveres på blokvogn"
5. **Bekræft bestilling** — efter bekræftelse markeres materiel-kortet med status "Blokvogn bestilt"

### Åbne spørgsmål til diskussion

- Hvem modtager bestillingen — samme vognmand som asfalt-transport, eller separat?
- Skal returtransport (sidste dag) planlægges som et separat step, eller automatisk fra dag 1-planlægning?
- Kan formanden se vognmandens bekræftelse i appen, eller sker det via telefon?
- Skal hvert materiel have sin vægt registreret, eller er beskrivelsen fri tekst?
- Er dette en del af Planlægnings-mode, eller en separat "Materiel"-fane?

### Datamodel (udkast)

```ts
export interface MaterielTransport {
  id: string
  orderId: string
  materielIds: string[]        // Hvilke maskiner der skal med
  description: string          // Fri beskrivelse, fx "HAMM HD10 VT og VÖGELE 1900-3I"
  transportType: 'blokvogn' | 'kran-baand' | 'egen-korsel'
  direction: 'ud' | 'hjem'     // Dag 1 = ud, sidste dag = hjem
  plannedDate: string          // ISO dato
  state: 'planlagt' | 'bestilt' | 'bekræftet'
  // TODO: Kobles til vognmand-app når flow er afklaret
}
```

---

## 12. Ikke i scope (v1)

- Live GPS-tracking på kort
- Push-notifikationer
- Integration med PLAN-systemet (manuel overgang)
- Brugeradministration / login
- Offline-support
- Vognmand-integration (ordrebestilling)
