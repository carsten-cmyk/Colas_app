# Colas Formandsapp — Arkitektur & Datamodel

> **REFERENCE-DOC — ikke tech-spec.**
> Brug dette dokument til at forstå datamodel og systemflow.
> Tech stack er besluttet: **React 18 + TypeScript + Vite + Tailwind CSS** (ikke React Native/Expo).
> Design system følger **chauffeur-appens** palette og tokens.
> Autoritativ spec: `Docs/formand/PRD.md`, `Docs/formand/REVIEW_SPEC.md`, `apps/formand/tailwind.config.ts`.

## Fire roller / views
Appen har fire brugerroller med forskelligt view på samme data:

```
/?role=formand    — planlægger, koordinerer, godkender
/?role=vognmand   — modtager transportordre, tildeler biler
/?role=chauffør   — modtager køreplan, registrerer timer
/?role=fabrik     — read-only produktions-dashboard
```

## Systemflow

```
FORMAND
  │
  ├─ Ser ordre fra PLAN (API integration)
  ├─ Planlægger dage og tons per produkt
  ├─ Kører transportberegning
  ├─ Sender transportordre →
  │
VOGNMAND
  │
  ├─ Modtager krav (dato, antal biler, type, starttid)
  ├─ Tildeler nummerplader + chauffører
  ├─ Bekræfter →
  │
CHAUFFØR APP
  │
  ├─ Modtager køreplan (fabrik-tid, plads-tid, antal læs)
  ├─ Registrerer kørsel, ventetid, pause
  ├─ Timer sendes automatisk til godkendelse →
  │
FORMAND (godkendelse)
  │
  └─ Godkender timer → EVALUERING

FABRIK (parallel, read-only)
  └─ Ser alle ordrer der leveres fra denne fabrik i dag
```

## Datamodel

### Ordre
```typescript
interface Ordre {
  id: string                    // "1212343"
  arbejdsordreNr: string        // "529521"
  kundeNavn: string
  leveringsAdresse: string
  distrikt: string
  sagsansvarlig: string
  holdNr: string
  formand: string
  projektleder: { navn: string; tlf: string }
  produkter: Produkt[]
  materiel: Materiel[]
  status: 'ikke-planlagt' | 'planlagt' | 'igang' | 'afsluttet'
  noter: string
}
```

### Produkt (Recept/Aktivitet)
```typescript
interface Produkt {
  receptKode: string            // "23001B"
  receptNavn: string            // "GAB I Prisreguleret GMA 40/60"
  fabrikKode: string            // "29000-PROD A EAST KØGE PH"
  fabrikNavn: string
  fabrikKoretid: number         // minutter
  mængdeM2: number
  tykkelse: number              // mm
  kgPerM2: number
  tonsTotal: number
  dage: ProduktDag[]
}
```

### ProduktDag
```typescript
interface ProduktDag {
  dato: Date
  tons: number
  done: boolean
  cancelled: boolean
  cancelledÅrsag?: 'regn' | 'frost' | 'underlag' | 'andet'
  today: boolean
  transportPlan?: TransportPlan
}
```

### Materiel
```typescript
interface Materiel {
  anlægsNr: string              // "D8302463"
  beskrivelse: string           // "HAMM HD10 VT 2220 KG"
  transportType: 'blokvogn' | 'kran-bånd' | 'egen-kørsel'
  afmeldt: boolean
  afmeldtTidspunkt?: Date
}
```

### TransportPlan
```typescript
interface TransportPlan {
  dato: Date
  ordreId: string
  produktKode: string
  tonsIDag: number
  starttid: string              // "06:00"
  interval: number              // minutter mellem biler
  køretid: number               // minutter fabrik→plads
  lässetid: number              // default 10 min
  aflässetid: number            // default 10 min
  anbefaletAntalBiler: number
  anbefaletBilType: string
  køreplan: KøreplanRæd[]
  status: 'beregnet' | 'sendt-til-vognmand' | 'bekræftet'
}
```

### KøreplanRæd
```typescript
interface KøreplanRæd {
  bilNr: number
  nummerplade?: string          // tildeles af vognmand
  chauffør?: string
  tlf?: string
  fabrikAfgang: string          // "06:00"
  pladsAnkomst: string          // "06:36"
  pladsAfgang: string           // "06:46"
  fabrikAnkomst: string         // "07:22"
  ventetidHold: number          // minutter holdet venter
  ventetidChauffør: number      // minutter chauffør venter
  ventetidFabrik: number        // minutter ved fabrik
  tons: number
  status?: 'planlagt' | 'på-vej' | 'læsser' | 'ankommet' | 'afsluttet'
}
```

### VognmandOrdre
```typescript
interface VognmandOrdre {
  id: string
  dato: Date
  ordreId: string
  projektNavn: string
  leveringsAdresse: string
  fabrik: string
  antalBiler: number
  bilType: string
  starttid: string
  interval: number
  tonsTotal: number
  status: 'afventer' | 'bekræftet'
  biler: { nummerplade: string; chauffør: string; tlf: string }[]
}
```

### ChaufførTimer
```typescript
interface ChaufførTimer {
  dato: Date
  ordreId: string
  nummerplade: string
  chauffør: string
  tlf: string
  kørseltimer: number
  ventetimer: number
  pausetimer: number
  antalLæs: number
  tonsTotal: number
  godkendt: boolean
}
```

### HoldTimer
```typescript
interface HoldTimer {
  dato: Date
  ordreId: string
  medarbejder: string
  rolle: string
  timer: number
  godkendt: boolean
}
```

## Teknisk stack (anbefalet)
- **Frontend:** React Native / Expo (tablet + mobil)
- **Backend:** Node.js / Express eller Supabase
- **Realtime:** Supabase Realtime eller WebSockets (GPS, status)
- **Maps:** Google Maps API (køretid fabrik↔plads)
- **PLAN integration:** REST API eller fil-eksport fra eksisterende system

## Prototype
Nuværende prototype er en single HTML-fil (formandsapp_v3.html) med fake data.
Den dækker: Gantt-oversigt, Planlægning, Eksekvering, Evaluering for formand-rollen.
