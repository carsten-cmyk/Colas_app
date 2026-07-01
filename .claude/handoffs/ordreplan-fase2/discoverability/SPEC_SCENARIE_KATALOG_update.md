# SPEC — `SCENARIE_KATALOG.md` opdatering

> **Round 3** · ÆNDRET fil: `.claude/docs/SCENARIE_KATALOG.md`
> **Type:** docs.

## Hvad ændringen gør (én sætning)

Tilføjer de 3 spor (A/B/C) som kanoniske entries med scenarie-id som entry-point, og opdaterer TODO-listen så reorg-punkterne markeres done.

## Punkt 5-svar: 3 kanoniske entries (format pr. eksisterende katalog-skema)

Tilføj under "## Entries" en ny sektion `### OrdrePlan — scenarie-bundter (formand)` med tre entries:

### Spor A — Samleordre + afregning
| Felt | Indhold |
|---|---|
| **Flow** | FF Flow 4 (afregning) + Flow 3 (samleordre) |
| **App + skærm** | formand → `OrdrePlanScreen` (alle 3 modes) |
| **Sådan ses det** | `/prototyper/ordre-plan?scenarie=A` ELLER dev-panel → "A". Afregning-mode viser 1 akkord-bil m. multilæs (tons fordelt på 2 børn) + 1 time-bil (timer fordelt på børn) i samme samleordre-afregning |
| **Mock-kilde** | `scenarios.ts` → `SCENARIOS.A` (`vognmandBekraeftelser` m. multilæs-`pre_fordeling` over 2 børn) |
| **Contract/regel** | akkord/time pr. biltype; multilæs-tonsfordeling pr. ordre; samleordre = 2 børn |

### Spor B — Enkelt ordre + etaper (default)
| Felt | Indhold |
|---|---|
| **Flow** | FF Flow 1/2 (planlægning + materiel-etape) |
| **App + skærm** | formand → `OrdrePlanScreen` |
| **Sådan ses det** | `/prototyper/ordre-plan` (default, ingen param) ELLER `?scenarie=B`. 2 etaper (marts→juli), dvale via dato 4. maj 2026. Afregning viser BÅDE time- og tonsafregning |
| **Mock-kilde** | `scenarios.ts` → `SCENARIOS.B` (refererer `INITIAL_*` + `DEMO_TRANSPORT_PLANER`); `demoDvaleDag: '2026-05-04'` |
| **Contract/regel** | planlægningsenhed = ETAPE; passiv frigivelse; weekend-tolerant klyngning |

### Spor C — Samleordre + ekstrabestilling
| Felt | Indhold |
|---|---|
| **Flow** | FF Flow 9b (PLAN-push / ekstra asfalt-bestilling) + Flow 3 (samleordre) |
| **App + skærm** | formand → `OrdrePlanScreen` (Planlægning-mode → Asfaltbestilling) |
| **Sådan ses det** | `?scenarie=C` ELLER dev-panel → "C". På startdagen vises en ekstra `EkstraBestillingBox` ved siden af produktet = formanden har ringet fabrik og bestilt MERE asfalt |
| **Mock-kilde** | `scenarios.ts` → `SCENARIOS.C` (`products[].days[].ekstraTons` seedet på startdag) |
| **Contract/regel** | ekstrabestilling = ekstra asfalt-volumen bekræftet af fabrik (IKKE MKS/ekstraarbejde) |

Tilføj indledende note i katalog-toppen: **"Dev-vælger: `?scenarie=A|B|C` eller flydende DEV-panel nederst-venstre. Default (ingen param) = Spor B."**

## Punkt 5-svar: TODO-oprydning

I "## TODO"-sektionen:
- `[x]` Brug dette som SPEC for Niveau 3 mock-reorg → markér done (② leverede `scenarios.ts`).
- `[x]` Overvej "scenarie-vælger" i prototypen (dev-only) → markér done (`DevScenarioPanel`).
- Opdatér `[ ] Fjern DEMO_DVALE_DAG-injektionen ...` → omformulér: "DEMO_DVALE_DAG er nu indkapslet pr. scenarie-bundt (`scenario.demoDvaleDag`); fjern helt når reel PLAN-dato-feed + næste-etape-notifikation er på plads."
- `[ ] Udfyld katalog for øvrige store flows (asfaltbestilling, afregning, KS, forundersøgelse, bilbestilling)` → behold (delvist dækket nu via spor-entries; KS/forundersøgelse stadig udestående).

## Tokens

Docs — ikke relevant.

## Eksisterende komponenter brugt

Ingen.
