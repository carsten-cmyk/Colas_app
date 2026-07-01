# SPEC — `scenarios.ts` (scenarie-registry)

> **Round 1** · NY fil: `apps/formand/src/prototypes/ordre-plan/scenarios.ts`
> **Type:** mock/data + typer (prototype) · ingen React · ingen tests/stories.

## Hvad filen gør (én sætning)

Pakker hvert demonstrations-scenarie (Spor A/B/C) som ét selvstændigt, fuldt-seedet `Scenario`-objekt, så `OrdrePlanScreen` kan initialisere ALT sin state fra ét bundt frem for fra spredte globale `INITIAL_*`-konstanter.

## `Scenario`-typen

Et `Scenario` bundter præcis de seeds `OrdrePlanScreen` i dag trækker globalt + inline-seeder. Alle felter er navngivet 1:1 med den state de seeder, så wiring (#4) bliver mekanisk.

```ts
export type ScenarioId = 'A' | 'B' | 'C'

export interface Scenario {
  id: ScenarioId
  /** Kort label til dev-vælger, fx "A · Samleordre + afregning" */
  label: string
  /** Én-linje forklaring vist i dev-panel */
  beskrivelse: string

  // ── Kerne-seeds (i dag globale INITIAL_*) ──────────────────────────
  products: MockProduct[]                                   // i dag INITIAL_PRODUCTS
  resources: MockResource[]                                 // i dag INITIAL_RESOURCES
  vognmandBekraeftelser: Record<string, VognmandBekraeftelse>     // i dag INITIAL_VOGNMAND_BEKRAEFTELSER
  vognmandMaterielBekraeftelse: VognmandMaterielBekraeftelse      // i dag INITIAL_VOGNMAND_MATERIEL_BEKRAEFTELSE
  materielEnheder: MaterielEnhed[]                          // i dag MATERIEL_ENHEDER
  transportPlaner: Record<string, MaterielTransportPlan>    // i dag DEMO_TRANSPORT_PLANER

  // ── Samleordre (null for enkelt-ordre = Spor B) ────────────────────
  samleordre: SamleordreContext | null                      // i dag MOCK_SAMLEORDRE | null

  // ── Inline-seedede demo-states (i dag hardcodet i useState-initial) ─
  sendtTilVognmandDates: string[]                           // i dag new Set(['2026-03-16','2026-03-17'])
  korselPlanlagtIds: string[]                               // i dag new Set(['d2-1','d2-2'])
  korselOrders: Record<string, VehicleOrder[]>              // i dag inline kørselOrders-seed
  startRaekkefoelge: Record<string, [string|null,string|null,string|null]>
  startTider: Record<string, [string|null,string|null,string|null]>

  // ── Default-dato + dvale ───────────────────────────────────────────
  defaultPlanDate: string                                   // i dag '2026-03-17'
  /** Dvale-demo-dag injiceres KUN i scenarier hvor den giver mening (Spor B). null = ingen injektion */
  demoDvaleDag: string | null                               // i dag global DEMO_DVALE_DAG = '2026-05-04'
}
```

Alle typer importeres fra eksisterende `./types` + `./etape` (`MaterielTransportPlan`). INGEN nye domæne-typer — kun container-typen `Scenario`.

## Registry-eksport

```ts
export const SCENARIOS: Record<ScenarioId, Scenario> = { A, B, C }
export const DEFAULT_SCENARIO_ID: ScenarioId = 'B'   // bagudkompatibel: B = nuværende enkelt-ordre-demo
```

## Punkt 1-svar: brækker vi `INITIAL_*` for andre brugere?

**Nej — strategi = "B genbruger, A/C bygger ovenpå":**

- **Spor B's bundt importerer de eksisterende `INITIAL_*` direkte** og refererer dem som felt-værdier:
  ```ts
  const B: Scenario = {
    id: 'B', label: 'B · Enkelt ordre + etaper', beskrivelse: '...',
    products: INITIAL_PRODUCTS,
    resources: INITIAL_RESOURCES,
    vognmandBekraeftelser: INITIAL_VOGNMAND_BEKRAEFTELSER,
    vognmandMaterielBekraeftelse: INITIAL_VOGNMAND_MATERIEL_BEKRAEFTELSE,
    materielEnheder: MATERIEL_ENHEDER,
    transportPlaner: DEMO_TRANSPORT_PLANER,
    samleordre: null,
    sendtTilVognmandDates: ['2026-03-16','2026-03-17'],
    korselPlanlagtIds: ['d2-1','d2-2'],
    korselOrders: { /* flyttet fra OrdrePlanScreen inline-seed, ordret */ },
    startRaekkefoelge: { 'd2-1': ['6 Aks','7 Aks', null] },
    startTider: { 'd2-1': ['06:39','06:54', null] },
    defaultPlanDate: '2026-03-17',
    demoDvaleDag: '2026-05-04',
  }
  ```
- `INITIAL_*`-konstanterne i `mocks.ts` **bliver stående uændret** og bevarer deres eksports. Hvis andre filer/prototyper importerer dem, virker de fortsat. Vi DUPLIKERER intet — vi REFERERER.
- A og C bygges som nye objekter i `scenarios.ts`. Hvor de deler data med B (fx kontakt-katalog, `STANDARD_MATERIEL_KATALOG`, `VEHICLE_TYPES`), genbruger de samme importer.

## Punkt 1-svar: genbrug vs. duplikering på tværs af spor

- **Genbruges (importeres):** `STANDARD_MATERIEL_KATALOG`, `VEHICLE_TYPES`, `MOCK_VOGNMAEND`, `DEFAULT_KØRSEL_PARAMS`, `INITIAL_COMMENTS`, `INITIAL_PHOTOS`, `EKSTRA_OPTIONS`, `UNDERLAG_OPTIONS`, `AARSAG_OPTIONS` — disse er katalog-data, ikke scenarie-specifikke. Forbliver i `mocks.ts`.
- **Duplikeres bevidst pr. spor (scenarie-specifikt):** `products`/`days`, `vognmandBekraeftelser` (bil-lister), `transportPlaner`, `samleordre`-children, `korselOrders`. Disse SKAL afvige pr. spor for at demonstrere de forskellige features → ingen delt kilde, hver er sin egen literal i `scenarios.ts`.
- **Helper for at undgå copy-paste-fejl i de tre transportPlaner-bundter:** en lille intern `blankTransportPlan(resourceId, etapeId)`-factory i `scenarios.ts` (ren funktion, ingen eksport nødvendig) så de mange "ikke-planlagt"-objekter ikke gentages ordret. Genbruger `transportKey` fra `etape.ts`.

## De tre bundters indhold (seed-spec)

### Fælles for A/B/C (LÅST)
- (a) startdato initierer alle 3 bestillinger: bilbestilling (`korselOrders` + `vognmandBekraeftelser`) + materielbestilling-biler (`transportPlaner` + `vognmandMaterielBekraeftelse`) + asfaltbestilling (`products[].days` med `tonsPlanned`).
- (b) 2 etaper pr. spor: produkt-dage skal klynge til præcis 2 etaper via `clusterEtaper` (etape0 + etape1 adskilt af ≥1 hverdags-hul).
- (c) under Udførsel: bekræftede biler + materielkørsel seedet på alle ordrer/børn (`vognmandBekraeftelser` har biler m. `er_materiel_bil`).

### Spor A — Samleordre + afregning
- `samleordre`: 2 børn (anchor + 1). Genbrug `MOCK_SAMLEORDRE`-strukturen som udgangspunkt.
- **Afregning skal demonstrere BÅDE i én samleordre:**
  - **1 akkord-bil m. multilæs:** én bil m. `afregning.afregning_type:'akkord'` + en vejeseddel m. `multilaes_flag:true` og `pre_fordeling` der fordeler tons på BEGGE børn (fx anchor 30t + barn-2 19.2t). Genbrug mønsteret fra `INITIAL_VOGNMAND_BEKRAEFTELSER['d2-1']` bil `CD 67 890` (vsb-2), men ret `pre_fordeling` så de to ordrer matcher Spor A's 2 børn.
  - **1 time-bil m. timer fordelt på børn:** én bil m. `afregning.afregning_type:'time'` hvor timerne demonstreres fordelt over begge børn (multilæs-time-fordeling). Tydeligt synlig = begge bil-typer optræder i samme afregnings-tabel.
- `products`: 2 etaper; mindst de recipeCodes der matcher børnenes produkter.

### Spor B — Enkelt ordre + etaper (= nuværende demo, refereret)
- `samleordre: null`.
- 2 etaper: etape0 marts (`2026-03-17/18/19`) → etape1 juli (`2026-07-06/07`) + dvale-gap. Præcis som `INITIAL_PRODUCTS` i dag.
- Asfaltkørsel-booking + materiellevering med etaper (`transportPlaner` = `DEMO_TRANSPORT_PLANER`).
- **Under afregning vises BÅDE en timeafregning OG en tonsafregning** (begge bil-typer): allerede dækket af `INITIAL_VOGNMAND_BEKRAEFTELSER['d2-1']` (akkord-biler m. tons + time-biler). Bekræft ved seed-review at mindst én `time`-bil OG mindst én `akkord`-bil er til stede på en bekræftet dag → de er det (fx `AB 12 345` time + `CD 67 890` akkord).
- `demoDvaleDag: '2026-05-04'`.

### Spor C — Samleordre + ekstrabestilling
- `samleordre`: 2 børn (anchor + 1). Samme struktur som Spor A.
- **Ekstrabestilling = formanden ringer fabrik og bestiller MERE asfalt:** seedes ved at sætte `ekstraTons` på en produkt-dag i `products[].days[]`, så `EkstraBestillingBox` dukker op ved siden af produktet i Asfaltbestilling-sektionen. (Dette er HELE betydningen — ikke MKS/ekstraarbejde.)
  - Mekanik: `day.ekstraTons = { tons: N, bekraeftetAf: 'fabrik', tidspunkt: '...' }` på startdagen. Se eksisterende `INITIAL_PRODUCTS` `d1-1`/`d2-2` for præcist format.
  - For at gøre "ekstra" tydeligt i Spor C: seed ekstraTons på startdagen for ÉT produkt, så boksen er synlig direkte ved default-dato.
- 2 etaper + bekræftede biler/materielkørsel som fælles-kravet.

## Tokens

Ren data-fil — INGEN JSX, INGEN klasser. Token-regler ikke relevante her (men `DevScenarioPanel` og wiring SKAL overholde tokens, se deres SPECs).

## TODO-kommentarer (obligatorisk i prototype-mock)

Hvert bundt får `// TODO: Erstat med PLAN/Oracle når klar — scenarie X seeds fra <tabel>`. Bemærk: "Supabase" er forældet terminologi (DB bliver Oracle/egen instance, se memory `project_hosting_database_valg`) — brug "PLAN/Oracle" i nye TODO'er.

## Eksisterende komponenter brugt

Ingen komponenter — kun typer fra `./types` + `transportKey`/`MaterielTransportPlan` fra `./etape` + katalog-konstanter fra `./mocks`.
