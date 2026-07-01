# ② Discoverability — INDEX (OrdrePlan Fase 2)

> **Status:** 🟡 PLAN — afventer Carstens godkendelse. INGEN kode skrevet.
> **Fase:** Prototype (tokens-only, inline mock OK, INGEN tests/stories).
> **Spor i Fase 2:** ① sektion-nedbrydning ✅ · Trin 2 cleanup ✅ · ③ samleordre child-tabs ✅ · **② discoverability ← HER**

## Hvad ② løser

Features i OrdrePlan-prototypen er gemt implicit pr. mock-værdi: en bestemt dato/URL-param udløser en bestemt UI-tilstand. Uden en bro mellem **flow ↔ entry-point ↔ mock ↔ contract** er en feature de facto usynlig. I dag loader skærmen ÉN global enkelt-ordre (`INITIAL_*`) og overlejrer `MOCK_SAMLEORDRE` når `?samleordreId` er sat.

**Mål:** pak hvert demonstrations-scenarie som et SELVSTÆNDIGT mock-bundt + en dev-vælger der hopper direkte til et scenarie via `?scenarie=A|B|C`.

## Leverancer (SPEC pr. fil)

| # | Fil | Type | SPEC |
|---|---|---|---|
| 1 | `scenarios.ts` | NY — registry + typer | `SPEC_scenarios_registry.md` |
| 2 | `useScenario.ts` | NY — loader-hook | `SPEC_useScenario_hook.md` |
| 3 | `components/DevScenarioPanel.tsx` | NY — dev-only UI | `SPEC_DevScenarioPanel.md` |
| 4 | `OrdrePlanScreen.tsx` | ÆNDRET — state-init wiring | `SPEC_OrdrePlanScreen_wiring.md` |
| 5 | `.claude/docs/SCENARIE_KATALOG.md` | ÆNDRET — 3 kanoniske entries | `SPEC_SCENARIE_KATALOG_update.md` |

## Build-rounds (forslag)

- **Round 1 (foundation):** `scenarios.ts` (#1) + `useScenario.ts` (#2). Ingen UI. Gate: typecheck grøn, alle 3 bundter type-checker mod eksisterende typer.
- **Round 2 (wiring + UI):** `OrdrePlanScreen.tsx` (#4) state-init fra valgt bundt + `DevScenarioPanel.tsx` (#3). Gate: typecheck grøn + browser-verificeret alle 3 spor renderer + default (ingen param) = Spor B uændret.
- **Round 3 (katalog):** `SCENARIE_KATALOG.md` (#5). Ren docs.

#1 og #2 kan IKKE bygges parallelt (#2 importerer #1's typer). #3 afhænger af #2. → reelt sekventielt: R1 (#1→#2) · R2 (#4 + #3 parallelt efter R1) · R3 (#5).

## Bekræftelse: ③-arbejdet (sektion-komponenter) berøres IKKE

Sektion-komponenterne (`content/sections/**`, `SamleordreChildTabs`, `PeriodeDatoVaelger`, `ProductBoxV2` osv.) får INGEN ændringer. De er allerede props-drevne og uvidende om hvor seeds kommer fra. Scenarie-laget sidder UDELUKKENDE i `OrdrePlanScreen`'s state-initialisering + de to nye filer + den nye dev-UI. Se `SPEC_OrdrePlanScreen_wiring.md` §"Hvad der IKKE ændres".
