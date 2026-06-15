# Materiel-flow — Formand ↔ Vognmand

> Dokumenterer det komplette cross-app flow for materiel-transport.
> Opdateres når nye dele bygges.
> **Sidst opdateret:** 2026-06-15

---

## Overblik

Materieltransport er en del af den **samme ordre** som asfalt-kørsel på vognmandens side.
Formanden planlægger afhentning og aflæsning per maskine. Vognmanden disponerer transport
og bekræfter tilbage. Formanden ser bekræftelsen som badge i Planlægning og som tabel i Udførelse.

---

## Dataflow

```
PLAN-system
  └── MaterielLinje (anlægsNr, beskrivelse, transportType)
        │
        ▼
Formand — Planlægning → Materiellevering
  - "Tilføj materiel"-knap åbner katalog over fælles standard Colas-materiel (hentet fra PLAN);
    valgt enhed tilføjes nederst i listen (ikke-planlagt) og udfyldes som de øvrige
  - Afhentningssted (vejnavn, nummer, postnummer) — materiellet kommer fra en anden
    lokation; prefyldes fra seneste aflæsning i PLAN (via unikt varenummer),
    ellers BLANK (ingen fallback til udførselssted)
  - Aflæsningsadresse (udførselssted). Ved 2+ materiel spørges hver efterfølgende
    enhed "Samme aflæsningssted som 1. materiel?" → Ja = arver fra 1. materiel, Nej = manuelt
  - Klar til afhentning: to felter (dato + tid)
  - Skal være på lokation: to felter (dato + tid)
  - Kommentar til chauffør (tidl. "kommentar til vognmand" — rettet 2026-06-15)
  - To kort: afhentnings-kort zoomer på seneste kendte adresse; aflæsnings-kort zoomer på udførselssted
  - Trykker "Gem transport" → sender linje til vognmand
        │
        ▼
Vognmand — Disponering (samme ordre som asfalt-kørsel)
  - Materiel-linjer vises UNDER dag-tabellen for asfalt-kørsel
  - Vognmanden drag-and-drop: trækker bil/transport fra flåde-panel
    hen over en materiel-linje
  - Samme bil/blokvogn kan tildeles flere linjer
  - Trykker "Godkend disponering og bekræft kørsel til formand"
    → bekræfter BÅDE asfalt-biler OG materiel-transport
        │
        ▼
Formand — Planlægning → Materiellevering (badge per maskine)
  - Grønt "Bekræftet af vognmand" badge
  - Gult "Afventer vognmand" badge (hvis planlagt men ikke bekræftet)

Formand — Udførelse → Materiel (ny sektion)
  - Tabel: Anlæg / Beskrivelse / Transport (reg+type) / Chauffør / Tlf
```

---

## Prototype-tilstand (mock-data)

### Formand (OrdrePlanScreen.tsx)

| Konstant/type | Formål |
|---|---|
| `VognmandMaterielBekraeftelse` | Interface for bekræftelse fra vognmand |
| `ConfirmedMaterielItem` | Én bekræftet maskine med transport-info |
| `INITIAL_VOGNMAND_MATERIEL_BEKRAEFTELSE` | Mock — alle 3 maskiner bekræftet med BL77331 |
| `vognmandMaterielBekraeftelse` state | Holdes i `OrdrePlanScreen`, sendes til `UdfoerselContent` |

**Badge-logik i Planlægning → Materiel:**
```
r.status === 'planlagt' && vognmandMaterielBekraeftelse.items.some(it => it.resourceId === r.id)
  → grønt "Bekræftet af vognmand" badge

r.status === 'planlagt' && ingen match i items
  → gult "Afventer vognmand" badge

r.status === 'ikke-planlagt'
  → "Planlæg transport"-knap (ingen badge)
```

### Vognmand (VognmandDisponeringsScreen.tsx)

| State | Formål |
|---|---|
| `materielMap: Record<string, string>` | materielId → bil reg |
| `dragOverMaterielId` | Hvilken linje der hover under drag |

**Pre-populering:**
`materielMap` initialiseres med `BL77331` (Blokvogn · Lars Pedersen) på alle linjer.
I produktion: initialiseres tom — vognmanden disponerer manuelt.

**Drag-and-drop:**
Samme `dataTransfer.getData('text/reg')` som asfalt-biler.
Samme `TruckCard` i flåde-panelet bruges til begge.

### Vognmand (ordrer.ts + types/vognmand.ts)

```ts
interface MaterielLinje {
  id: string
  anlaegsNr: string
  beskrivelse: string
  transportType: string   // "Blokvogn" / "Kran-bånd"
  afhentning: string      // adresse (eller pin-koordinater — fremtidig feature)
  aflæsning: string       // adresse (eller pin-koordinater — fremtidig feature)
}

// Tilføjet på Ordre:
materiel?: MaterielLinje[]
```

Mock-data på `o1` (Nakskov): 3 linjer — HAMM HD10 VT, VÖGELE 1900-3I, HAMM DV70VV.

---

## Manglende til produktion

### 1. Vognmand — Godkend-knap bekræfter kun asfalt-biler
I prototypen trykker vognmanden "Godkend disponering og bekræft kørsel til formand"
som markerer ordren som godkendt. I produktion skal bekræftelsen indeholde:
- Asfalt-biler per dag (som nu)
- Materiel-transport: `{ materielId, reg, chauffoerNavn, tlf }` per linje

Supabase-trigger sender bekræftelse til formand-siden og opdaterer begge badge-sæt.

### 2. Formand — Planlæg transport sender til vognmand
Når formand trykker "Gem transport" på en maskine skal det:
1. Oprette en `MaterielLinje` på ordren i Supabase
2. Sætte maskinens status til "afventer vognmand"
3. Vognmandens disponerings-view opdateres via Supabase Realtime

### 3. "Afventer vognmand"-tilstand i prototype er kun delvis
Nuværende mock har alle maskiner som bekræftet. For at teste "afventer"-tilstanden:
ændr `INITIAL_VOGNMAND_MATERIEL_BEKRAEFTELSE.items` til kun at indeholde r1.

### 4. Kort/pin til afhentning og aflæsning
Fremtidig feature: formanden kan sætte en pin på et kort over udførselsstedet.
Hvis ingen pin er sat bruges adressen som fritekst.
Felter: `afhentningLat`, `afhentningLng`, `aflæsningLat`, `aflæsningLng` (nullable).

### 5. Samme bil på flere materiel-linjer
Prototypen tillader allerede dette (materielMap er Record<materielId, reg> ikke Set).
I produktion: ingen validering nødvendig — det er forventet adfærd.

---

## Relevante filer

| Fil | Hvad der er ændret |
|---|---|
| `apps/formand/src/prototypes/ordre-plan/OrdrePlanScreen.tsx` | `VognmandMaterielBekraeftelse` type, mock, badges, Udførelse-sektion |
| `apps/vognmand/src/prototypes/disponering/VognmandDisponeringsScreen.tsx` | `materielMap` state, Materiel-sektion med drag-and-drop |
| `apps/vognmand/src/types/vognmand.ts` | `MaterielLinje` interface, `materiel?` på `Ordre` |
| `apps/vognmand/src/mocks/ordrer.ts` | `MOCK_MATERIEL_O1`, tilføjet på o1 |
| `apps/vognmand/src/mocks/biler.ts` | Blokvogn `BL77331 · Lars Pedersen` tilføjet |
