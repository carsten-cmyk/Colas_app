# SPEC — `useScenario.ts` (scenarie-loader)

> **Round 1** · NY fil: `apps/formand/src/prototypes/ordre-plan/useScenario.ts`
> **Type:** hook (prototype) · ingen tests/stories.

## Hvad filen gør (én sætning)

Læser valgt scenarie-id fra URL (`?scenarie=A|B|C`) med bagudkompatibel fallback, og returnerer det fulde `Scenario`-bundt + aktiv id, så `OrdrePlanScreen` kan initialisere sin state fra ét sted uden at kende registry-detaljer.

## Punkt 2-svar: hvordan loader vi et bundt UDEN at omskrive hele state-init?

Princippet: **scenariet vælges ÉN gang ved mount og bliver `useState`-initial-kilden**. Vi ændrer IKKE state-arkitekturen — vi swapper kun *hvor* de initielle værdier kommer fra: fra spredte globale konstanter → fra `scenario.<felt>`.

`useScenario` returnerer et stabilt objekt. `OrdrePlanScreen` destrukturerer det og bruger felterne som `useState(scenario.products)` osv. Fordi scenarie-valget er låst ved mount (URL ændres ikke uden remount/navigation), er der ingen re-init-kompleksitet.

## Signatur

```ts
export interface UseScenarioResult {
  scenarioId: ScenarioId
  scenario: Scenario
  /** True hvis ?scenarie var sat eksplicit (styrer om dev-panel viser "default"-badge) */
  wasExplicit: boolean
}

export function useScenario(): UseScenarioResult
```

## Adfærd

1. Læs `searchParams.get('scenarie')` (genbrug `useSearchParams` fra react-router-dom — samme mønster som eksisterende `?samleordreId`/`?date`).
2. Normalisér: upper-case + valider mod `'A'|'B'|'C'`. Ugyldig/manglende → `DEFAULT_SCENARIO_ID` (`'B'`).
3. Returnér `{ scenarioId, scenario: SCENARIOS[scenarioId], wasExplicit }`.
4. Memoiser med `useMemo` på `scenarie`-param-værdien.

## Punkt 2-svar: samspil med eksisterende `?samleordreId`

I dag afgør `?samleordreId` om samleordre-mode er aktiv. Med scenarier flyttes denne beslutning ind i bundtet: **`isSamleordreMode` udledes nu af `scenario.samleordre !== null`** i stedet for af URL-param.

- **Bagudkompatibilitet:** `?samleordreId=...` bevares som ALIAS. Hvis `?samleordreId` er sat men `?scenarie` IKKE er sat, mapper vi til et samleordre-scenarie (Spor A er det kanoniske samleordre-bundt) så gamle deeplinks/③-test-links (`?samleordreId=test`) fortsat virker. Præcis mapping-regel afklares i wiring-SPEC §"URL-kompatibilitetsmatrix" — `useScenario` eksponerer kun rå scenarie-valg; alias-håndtering kan ligge enten her eller i wiring (forslag: her, så `OrdrePlanScreen` kun ser ét scenarie-resultat).

## Punkt 3-svar: hvad sker uden param?

`?scenarie` mangler → `DEFAULT_SCENARIO_ID = 'B'` → **nuværende enkelt-ordre-demo, 100% uændret**. Det er hele bagudkompatibiliteten: den eksisterende prototype-rute `/prototyper/ordre-plan` (uden params) ser identisk ud før og efter ②.

## Tokens

Ingen JSX — ikke relevant.

## Eksisterende komponenter/hooks brugt

`useSearchParams` (react-router-dom), `useMemo` (react), `SCENARIOS`/`DEFAULT_SCENARIO_ID`/`ScenarioId`/`Scenario` fra `./scenarios`.
