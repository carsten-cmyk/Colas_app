/**
 * PROTOTYPE — Scenarie-loader for OrdrePlanScreen
 *
 * Læser valgt scenarie-id fra URL (`?scenarie=A|B|C`) med bagudkompatibel fallback
 * og returnerer det fulde `Scenario`-bundt, så `OrdrePlanScreen` kan initialisere ALT
 * sin state fra ét sted uden at kende registry-detaljer.
 *
 * Scenariet vælges ÉN gang ved mount og bliver `useState`-initial-kilden i OrdrePlanScreen.
 * URL'en ændres ikke uden remount/navigation → ingen re-init-kompleksitet.
 *
 * TODO: Erstat med PLAN/Oracle når klar — scenarie-begrebet er en prototype-affordance;
 * i produktion loades ét konkret ordre-bundt fra ruten (orderId/samleordreId).
 */
import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  SCENARIOS,
  DEFAULT_SCENARIO_ID,
  type Scenario,
  type ScenarioId,
} from './scenarios'

export interface UseScenarioResult {
  scenarioId: ScenarioId
  scenario: Scenario
  /** True hvis ?scenarie var sat eksplicit (styrer om dev-panel viser "default"-badge) */
  wasExplicit: boolean
}

/** Det kanoniske samleordre-bundt som legacy `?samleordreId`-deeplinks mapper til. */
const SAMLEORDRE_ALIAS_ID: ScenarioId = 'A'

function normalizeScenarioId(raw: string | null): ScenarioId | null {
  if (!raw) return null
  const upper = raw.toUpperCase()
  return upper === 'A' || upper === 'B' || upper === 'C' ? (upper as ScenarioId) : null
}

/**
 * Returnerer det aktive scenarie-bundt.
 *
 * Prioritet:
 *   1. `?scenarie=A|B|C` (primær entry-point — bookmarkable + deeplinkbar)
 *   2. `?samleordreId=...` (legacy ③-test/deeplink) → mapper til samleordre-bundt (Spor A)
 *   3. intet param → `DEFAULT_SCENARIO_ID` (Spor B — 100% uændret nuværende demo)
 */
export function useScenario(): UseScenarioResult {
  const [searchParams] = useSearchParams()
  const scenarieParam = searchParams.get('scenarie')
  const samleordreParam = searchParams.get('samleordreId')

  return useMemo<UseScenarioResult>(() => {
    const explicit = normalizeScenarioId(scenarieParam)
    if (explicit) {
      return { scenarioId: explicit, scenario: SCENARIOS[explicit], wasExplicit: true }
    }
    // Legacy-alias: gamle samleordre-deeplinks fortsætter med at virke.
    if (samleordreParam) {
      return {
        scenarioId: SAMLEORDRE_ALIAS_ID,
        scenario: SCENARIOS[SAMLEORDRE_ALIAS_ID],
        wasExplicit: false,
      }
    }
    return {
      scenarioId: DEFAULT_SCENARIO_ID,
      scenario: SCENARIOS[DEFAULT_SCENARIO_ID],
      wasExplicit: false,
    }
  }, [scenarieParam, samleordreParam])
}
