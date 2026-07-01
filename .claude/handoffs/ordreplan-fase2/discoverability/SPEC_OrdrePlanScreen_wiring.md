# SPEC — `OrdrePlanScreen.tsx` wiring (scenarie-state-init)

> **Round 2** · ÆNDRET fil: `apps/formand/src/prototypes/ordre-plan/OrdrePlanScreen.tsx`
> **Type:** prototype screen-container · ingen tests/stories.

## Hvad ændringen gør (én sætning)

Erstatter direkte brug af globale `INITIAL_*`/`MOCK_SAMLEORDRE`/`DEMO_*`-konstanter i `useState`-initialisering med felter fra det valgte `Scenario`-bundt, plus monterer `DevScenarioPanel` — uden at ændre state-arkitektur eller sektion-komponenter.

## Punkt 2-svar: minimal-invasiv wiring

Øverst i komponenten:
```ts
const { scenario, scenarioId, wasExplicit } = useScenario()
```
Derefter SWAP af useState-initials (1:1, samme typer):

| I dag (linje ca.) | Bliver til |
|---|---|
| `useState<MockProduct[]>(INITIAL_PRODUCTS)` (L70) | `useState(scenario.products)` |
| `useState<MockResource[]>(INITIAL_RESOURCES)` (L90) | `useState(scenario.resources)` |
| `useState(INITIAL_VOGNMAND_BEKRAEFTELSER)` (L187) | `useState(scenario.vognmandBekraeftelser)` |
| `useState(INITIAL_VOGNMAND_MATERIEL_BEKRAEFTELSE)` (L194) | `useState(scenario.vognmandMaterielBekraeftelse)` |
| `useState({...DEMO_TRANSPORT_PLANER})` (L307) | `useState({...scenario.transportPlaner})` |
| `isSamleordreMode ? MOCK_SAMLEORDRE : null` (L59) | `scenario.samleordre` |
| `samleordreTabOrderNr` init fra `MOCK_SAMLEORDRE` (L63) | fra `scenario.samleordre?.children` (guard for null) |
| `isSamleordreMode = !!(urlSamleordreId ...)` (L56) | `const isSamleordreMode = scenario.samleordre !== null` |
| `new Set(['2026-03-16','2026-03-17'])` (L107) | `new Set(scenario.sendtTilVognmandDates)` |
| `new Set(['d2-1','d2-2'])` (L118) | `new Set(scenario.korselPlanlagtIds)` |
| inline `kørselOrders`-seed (L120-133) | `scenario.korselOrders` |
| inline `startRaekkefoelge`-seed (L136-138) | `scenario.startRaekkefoelge` |
| inline `startTider`-seed (L154-156) | `scenario.startTider` |
| `useState(initialPlanDate ?? '2026-03-17')` (L75) | `useState(initialPlanDate ?? scenario.defaultPlanDate)` |
| `materielSendteEnhederIds` seed fra `INITIAL_VOGNMAND_MATERIEL_BEKRAEFTELSE.items` (L111-114) | fra `scenario.vognmandMaterielBekraeftelse.items` |
| `materielEnheder` (hvor `MATERIEL_ENHEDER` bruges i sektioner) | `scenario.materielEnheder` (trådes som prop hvor det i dag importeres) |

> Builder: verificér linjenumre ved edit (filen er ~60k, linjer kan have skiftet). Match på symbol-navn, ikke linje.

## Punkt 4-svar: etape + startdato-koordinering

Etape-laget er allerede DERIVERET, ikke seedet: `faktiskPlanlagteDage` (useMemo over `products`) → `clusterEtaper` → `getMaterielUiState`. Fordi `products` nu kommer fra `scenario.products`, klynges etaperne automatisk korrekt pr. bundt — INGEN ny etape-kode.

Konsistens-krav pr. bundt (verificeres af builder ved seed-review, ikke ny logik):
1. `scenario.products[].days` skal klynge til præcis 2 etaper (etape0 + etape1 m. ≥1 hverdags-hul) → ellers fejler `ny-etape`/`dvale`-demoen.
2. `scenario.vognmandBekraeftelser`-nøgler (dayIds) skal pege på dage der findes i `products[].days` for samme bundt → ellers viser Udførsel tomme bekræftelser.
3. `scenario.transportPlaner`-nøgler (`transportKey(resourceId, etapeId)`) skal dække `resources × {0,1}` → ellers mangler materiel-transport i en etape. Genbrug `blankTransportPlan`-factory fra `scenarios.ts`.
4. `defaultPlanDate` skal være etape0's startdag (krav (a): startdato initierer alle 3 bestillinger) → så Asfaltbestilling + materielbestilling + bilbestilling alle er synlige ved load.

## Punkt 6-svar: `DEMO_DVALE_DAG`-injektion → indkapslet i bundtet

I dag er `DEMO_DVALE_DAG = '2026-05-04'` en hardcodet konstant i `OrdrePlanScreen` (L259) der altid injiceres i `planDays` (L260-263). **Flyt den til `scenario.demoDvaleDag`:**
```ts
const planDays = useMemo(() => {
  const extra = scenario.demoDvaleDag ? [scenario.demoDvaleDag] : []
  return [...new Set([...faktiskPlanlagteDage, ...extra])].sort()
}, [faktiskPlanlagteDage, scenario.demoDvaleDag])
```
- Spor B: `demoDvaleDag: '2026-05-04'` (bevarer dvale-demo).
- Spor A/C: sæt `demoDvaleDag` til en dag i DERES respektive etape-gap (eller `null` hvis dvale ikke er pointen i det spor). **Anbefaling:** behold dvale-demo i alle spor for konsistens, men dato pr. bundts gap. Carsten bekræfter om A/C skal have dvale-affordance overhovedet (se åbne punkter).

Dermed er dvale-affordancen ikke længere global — den hører til det bundt der definerer den. TODO-kommentaren om "fjern ved reel PLAN-feed" flytter med til hvert bundt.

## DevScenarioPanel-montering

Monteres i return-JSX (efter `<TopBar>`, inden grid eller som sidste child i root-`<div className="min-h-screen bg-page">`):
```tsx
<DevScenarioPanel
  activeId={scenarioId}
  wasExplicit={wasExplicit}
  onSelect={(id) => { setSearchParams(prev => { prev.set('scenarie', id); return prev }); /* remount via navigate/key */ }}
/>
```
Remount-strategi: enten `setSearchParams` + en `key={scenarioId}` på et indre wrapper, ELLER `navigate('/prototyper/ordre-plan?scenarie='+id)`. Builder vælger den enkleste der garanterer at alle `useState`-initials re-evalueres (scenarie-skift SKAL nulstille state). **Forslag:** `navigate` med fuld reload-semantik via `key` på OrdrePlanScreen-niveau er mest robust.

## URL-kompatibilitetsmatrix

| URL | Resultat |
|---|---|
| `/prototyper/ordre-plan` | Spor B (default) — uændret nuværende adfærd |
| `?scenarie=A` / `B` / `C` | hopper til spor |
| `?samleordreId=test` (legacy, ③-test) | mapper til samleordre-bundt (Spor A) for bagudkompatibilitet |
| `?scenarie=A&date=2026-03-17` | spor A + override af default-dato (eksisterende `?date` bevares) |
| ugyldig `?scenarie=Z` | falder tilbage til Spor B |

## Hvad der IKKE ændres (③-bekræftelse)

- **Sektion-komponenter** (`content/sections/**`, `content/*Content.tsx`) får INGEN ændringer — de modtager allerede alt via props. Wiring rører kun `OrdrePlanScreen`'s egen state-init + prop-værdierne den allerede sender ned (samme prop-navne, ny kilde).
- `SamleordreChildTabs`, `PeriodeDatoVaelger`, `ProductBoxV2`, `EkstraBestillingBox`, `MaterielTilstande`, `MaterielKort` — urørt.
- `etape.ts`-logikken — urørt (kun `DEMO_*`-konstanterne flyttes konceptuelt ind i bundterne; de eksisterende eksports kan blive stående og blot refereres af Spor B).
- `mocks.ts` `INITIAL_*` — urørt (refereres af Spor B).

## Tokens

DevScenarioPanel-montering er den eneste nye JSX → den arver panelets egne tokens (se `SPEC_DevScenarioPanel.md`). Ingen nye inline-styles i OrdrePlanScreen.

## Eksisterende komponenter/hooks brugt

`useScenario` (#2), `DevScenarioPanel` (#3), `setSearchParams`/`navigate` (react-router-dom — allerede importeret).
