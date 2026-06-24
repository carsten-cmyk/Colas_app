# Materiel-flow — Formand ↔ Vognmand

> Dokumenterer det komplette cross-app flow for materiel-transport.
> Opdateres når nye dele bygges.
> **Sidst opdateret:** 2026-06-23

---

## 🟢 LÅST 2026-06-23 — ETAPE-BEVIDST materiel-model (planlægningsenhed: ORDRE → ETAPE)

> **Beslutning truffet med Carsten 2026-06-23.** Erstatter den tidligere flade, ordre-bundne
> materiel-model (ét sæt afhentnings-/leverings-datoer pr. enhed pr. ORDRE). Resten af dette
> dokument beskriver det eksisterende flow pr. enkelt-etape; denne sektion er den overordnede,
> kanoniske ramme materiel-håndteringen nu skal bygges efter.

### Problemet med den flade model

I dag behandles materiel som **permanent bundet til én ordre**: en flad enheds-liste med ét sæt
afhentnings-/leverings-datoer. Det bryder sammen fordi materiel er en **delt, knap ressource** der
**vandrer mellem ordrer mellem etaper**. En ordre udføres typisk i **etaper** (fx 3 dage i marts +
3 dage i juli); i mellemperioden bruges samme materiel af en ANDEN ordre. PLAN sender kun de
**PLANLAGTE** datoer, og **kommende etaper planlægges først ~2 dage før** de skal udføres.

### Reframe: planlægningsenheden for materiel skifter fra ORDRE → ETAPE

Materiel planlægges nu **pr. etape**, ikke pr. ordre. Modellen har **tre lag**:

#### Lag 1 — Pakken (holdets faste materiel)
- Pakken = holdets **faste, SPECIFIKKE fysiske enheder** (samme anlægsnr hver etape) + evt. **tilføjet materiel**.
- Følger **ordren/holdet på tværs af etaper**. Den **genvælges ikke** — den **bæres automatisk videre** til næste etape.
- **Tilføjet materiel bæres OGSÅ videre** til næste etapes pakke (men kan **fjernes pr. etape**).
- Pakken er altså etape-invariant indhold; det er kun TRANSPORTEN af pakken der er etape-variabel (lag 2).

#### Lag 2 — Transport-planen (PR. ETAPE)
- Transport-planen = **afhentning · dato · tid · aflæsning**.
- Den er **PR. ETAPE** — **nulstilles hver etape**.
- **Datamodel-skift:** i dag ét transport-sæt pr. enhed pr. ORDRE → nyt = **ét transport-sæt pr. enhed pr. ETAPE**.

#### Lag 3 — Frigivelse (PASSIV)
- Ordren gør **intet aktivt** for at frigive materiel.
- Den specifikke maskines placering **spores i PLAN**; **næste ordres formand henter den** via afhentnings-prefill
  ("seneste aflæsning i PLAN" — **eksisterende mekanisme**, jf. Trin 1 prefill nedenfor).
- Mellem etaper står ordrens **materiel-sektion i dvale**.

### Etape-detektion (weekend-tolerant klyngning)

Appen **klynger ordrens faktisk-planlagte dage** til etaper:
- **Weekend-/helligdags-huller bryder IKKE en etape.**
- Et hul på **flere på-hinanden-følgende hverdage** = **ny etape**.
- Realistisk ser appen normalt **kun den aktuelle etape ad gangen** (PLAN planlægger næste etape ~2 dage før).

> **Bemærk afhængighed:** Etape-klyngning kræver **ordrens faktisk-planlagte dage** (ikke det contiguous
> orderStart→orderEnd-fill `planDays` udregner i dag). Dette spejler den eksisterende LÅST-regel
> "Udføres i perioden = kun PLAN-planlagte dage" (FF Flow 1 Trin 1, 2026-06-23). Klyngnings-inputtet
> skal være de reelle PLAN-dage.

### Kun-første-dag-planlægning

Materiel planlægges **KUN etapens første udførselsdag** — transport sigter mod **ankomst til dag 1**.
Øvrige dage i etapen: **ingen planlægning**, materiellet står bare på pladsen.

### Fire UX-tilstande (materiel-sektion reagerer på `selectedPlanDate`)

Materiel-sektionen er ikke længere én statisk liste — den **reagerer på den valgte dag** i den unified
datovælger (`selectedPlanDate`) og viser én af fire tilstande, afhængig af hvor dagen ligger ift. etaperne:

1. **Etapens første dag** (el. lead-up når PLAN har planlagt etapen) → **fuld transport-planlægning**;
   afhentning **prefyldt** fra maskinens nuværende PLAN-placering.
2. **Midt i etape** → **read-only "Materiel på pladsen (ankom [dato])"**.
3. **Dvale-gap mellem etaper** → **"Frigivet — næste etape ikke planlagt endnu"**.
4. **Næste etape netop planlagt i PLAN** → frisk **"Planlæg materiel-transport for etape [N]"-opgave**:
   pakken **for-listet**, transport **blank**. **AUTO-opret blanke transport-pladser** for pakkens enheder
   + **notifikation til formanden** ("Planlæg materiel for etape N") for discoverability.

### Forudsætning uden for app-scope

**Knaphedskonflikt** (den specifikke maskine ikke ledig til næste etape) er et **PLAN/disponerings-anliggende**
— **appen antager maskinen er tilbage**. Noteres som forudsætning; appen håndterer ikke ressource-allokerings-
konflikter.

### Cross-app: vognmand modtager transport PR. ETAPE

Vognmanden modtager nu materiel-transport **pr. etape** (ikke pr. ordre). Bestillingen for etape N er en
selvstændig transport-ordre med egne afhentnings-/aflæsnings-datoer.

> **🟡 ÅBENT — SMS-konsolidering pr. etape:** I dag konsolideres materiel-SMS til **1 SMS pr. chauffør pr.
> ORDRE** (FF Flow 2 Trin 4b, LÅST 2026-06-15). Med etape-modellen er det sandsynligt at det bør blive
> **1 SMS pr. chauffør pr. ETAPE** (én transport-opgave pr. etape med egen afhentning/aflæsning). **Ikke
> låst** — afventer bekræftelse. Lås IKKE uden Carsten/kunde-input.

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
