# Scenarie-katalog (Niveau 1) — discoverability for prototyper

**Status:** 🟡 STUB oprettet 2026-06-23. Vokser pr. feature. Mål: en udvikler/reviewer skal ALDRIG skulle lede efter en feature i prototypen.

> **Dev-vælger (OrdrePlan):** `?scenarie=A|B|C` eller det flydende DEV-panel nederst-venstre. Default (ingen param) = Spor B. Se `scenarios.ts` + `useScenario.ts` i `apps/formand/src/prototypes/ordre-plan/`.

## Problemet dette løser

Features gemmes implicit pr. mock-værdi (fx en bestemt dato udløser en bestemt UI-tilstand). Uden en bro mellem **flow ↔ prototype-entry-point ↔ mock-felt ↔ contract** er en feature de facto usynlig for andre end den der byggede den. Dette katalog er broen.

Hænger sammen med den planlagte **Niveau 3 mock-reorg** (samle spredte `dayId`-keyed `useState`-seeds til selvstændige scenarie-objekter) — dette katalog bliver SPEC for den reorg. Se også afregnings-konsolidering ("én afregning pr. type").

## Format pr. entry

| Felt | Indhold |
|---|---|
| **Flow** | FF-reference (Flow N / MATERIEL_FLOW etc.) |
| **App + skærm** | Hvor i prototypen |
| **Sådan ses det** | Konkret handling: hvilken dato/værdi/toggle udløser hvilken tilstand |
| **Mock-kilde** | Hvilket seed/konstant driver det (fil + symbol) |
| **Contract/regel** | LÅST-regel det implementerer |

---

## Entries

### OrdrePlan — scenarie-bundter (formand)

Tre selvstændige, fuldt-seedede mock-bundter (Spor A/B/C) i `scenarios.ts`. Hvert bundt initialiserer ALT `OrdrePlanScreen`-state fra ét sted. Vælg via `?scenarie=X` eller DEV-panelet.

#### Spor A — Samleordre + afregning
| Felt | Indhold |
|---|---|
| **Flow** | FF Flow 4 (afregning) + Flow 3 (samleordre) |
| **App + skærm** | formand → `OrdrePlanScreen` (alle 3 modes) |
| **Sådan ses det** | `/prototyper/ordre-plan?scenarie=A` ELLER DEV-panel → "A". Afregning-mode viser 1 akkord-bil m. multilæs (tons fordelt på 2 børn) + 1 time-bil (timer fordelt på børn) i samme samleordre-afregning. Kalundborg (Skovvej + Havnegade), april + september |
| **Mock-kilde** | `scenarios.ts` → `SCENARIOS.A` (`vognmandBekraeftelser` m. multilæs-`pre_fordeling` over 2 børn) |
| **Contract/regel** | akkord/time pr. biltype; multilæs-tonsfordeling pr. ordre; samleordre = 2 børn |

#### Spor B — Enkelt ordre + etaper (default)
| Felt | Indhold |
|---|---|
| **Flow** | FF Flow 1/2 (planlægning + materiel-etape) |
| **App + skærm** | formand → `OrdrePlanScreen` |
| **Sådan ses det** | `/prototyper/ordre-plan` (default, ingen param) ELLER `?scenarie=B`. Enkelt ordre (Søvej, Nakskov), 2 etaper (marts→juli), dvale via dato 4. maj 2026. Afregning viser BÅDE time- og tonsafregning |
| **Mock-kilde** | `scenarios.ts` → `SCENARIOS.B` (refererer `INITIAL_*` + `DEMO_TRANSPORT_PLANER`); `demoDvaleDag: '2026-05-04'` |
| **Contract/regel** | planlægningsenhed = ETAPE; passiv frigivelse; weekend-tolerant klyngning |

#### Spor C — Samleordre + ekstrabestilling
| Felt | Indhold |
|---|---|
| **Flow** | FF Flow 9b (PLAN-push / ekstra asfalt-bestilling) + Flow 3 (samleordre) |
| **App + skærm** | formand → `OrdrePlanScreen` (Planlægning-mode → Asfaltbestilling) |
| **Sådan ses det** | `?scenarie=C` ELLER DEV-panel → "C". På startdagen (8. juni 2026) vises en ekstra `EkstraBestillingBox` (+8 tons, bekræftet kl. 08:15) ved siden af produktet = formanden har ringet fabrik og bestilt MERE asfalt. Slagelse (Ringgaden + Boulevarden), juni + november |
| **Mock-kilde** | `scenarios.ts` → `SCENARIOS.C` (`products[].days[].ekstraTons` seedet på startdag) |
| **Contract/regel** | ekstrabestilling = ekstra asfalt-volumen bekræftet af fabrik (IKKE MKS/ekstraarbejde) |

### Materiel — etape-bevidste tilstande (formand)

- **Flow:** `MATERIEL_FLOW.md` "🟢 LÅST 2026-06-23 — ETAPE-BEVIDST materiel-model" + FF Flow 2
- **App + skærm:** formand → `OrdrePlanScreen` (Planlægning- og Udførsel-mode) → materiel-sektion
- **Sådan ses det:** Materiel-sektionen skifter tilstand efter hvilken dag der er valgt i top-datovælgeren:
  - **16. marts 2026** → `planlaeg` (etape 0, første dag — fuld transport-planlægning)
  - **17.–19. marts** → `paa-pladsen` (read-only "på pladsen")
  - **4. maj** → `dvale` (frigivet — gap mellem etaper; `DEMO_DVALE_DAG` injiceret i datovælgeren som demo-affordance, se nedenfor)
  - **6. juli** → `ny-etape` (etape 1, første dag — banner + auto-oprettede blanke pladser)
  - **7. juli** → `paa-pladsen`
- **⚠️ Demo-affordance:** `DEMO_DVALE_DAG = '2026-05-04'` injiceres i `planDays` (OrdrePlanScreen ~L1463) så `dvale` kan nås via datovælgeren. I PRODUKTION opstår dvale naturligt (dag uden planlagte produkter / via næste-etape-notifikation) — datovælgeren viser kun PLAN-dage. TODO i koden.
- **Mock-kilde:** `INITIAL_PRODUCTS` (produkt-dage marts + juli) + `etape.ts` (`clusterEtaper`, `getMaterielUiState`) + `transportPlaner`-state (seedet fra `DEMO_TRANSPORT_PLANER`)
- **Contract/regel:** planlægningsenhed = ETAPE (ikke ordre); transport pr. enhed × etape; passiv frigivelse via PLAN-lokation; kun-første-dag-planlægning; weekend-tolerant etape-klyngning

### Returlæs — ingen mødetid (chauffeur-web)

- **Flow:** FF Flow 14 (Returlæs) + mødetid-note ~L1167
- **App + skærm:** chauffeur-web → `TaskDetailScreen` (returlæs-tilstand) / `ReturlaesScreen`
- **Sådan ses det:** Opret returlæs på en opgave → afhentnings-boksen bliver "Retur til" og mødetid-blokken forsvinder (mødetid kun relevant for første læs)
- **Mock-kilde:** `returlaesOprettetForTask` i `ChauffoerPrototype` + `pickup.meetingTime`-guard
- **Contract/regel:** mødetid (mødetid fabrik) kun for første læs der bærer den i feed'et; loop-læs + returlæs har ingen

---

## TODO — senere oprydning + sammenhængende flows

- [x] Bekræft materiel dato→tilstand-map efter Round 4c ✅ 2026-06-23
- [ ] `DEMO_DVALE_DAG` er nu indkapslet pr. scenarie-bundt (`scenario.demoDvaleDag`); fjern helt når reel PLAN-dato-feed + næste-etape-notifikation er på plads
- [ ] Udfyld katalog for de øvrige store flows (KS, forundersøgelse) — asfaltbestilling/afregning/bilbestilling nu delvist dækket via spor-entries A/B/C
- [x] Brug dette som SPEC for Niveau 3 mock-reorg (selvstændige scenarie-objekter) ✅ 2026-07-01 (② leverede `scenarios.ts`)
- [x] Overvej en "scenarie-vælger" i prototypen (dev-only) der hopper direkte til et scenarie ✅ 2026-07-01 (`DevScenarioPanel`)
