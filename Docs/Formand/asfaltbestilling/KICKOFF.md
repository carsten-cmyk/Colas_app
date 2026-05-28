---
section: asfaltbestilling
app: formand
tab: planlaegning
phase: dev-ready
created: 2026-05-26
last_updated: 2026-05-26
status: signed
---

# Section Kickoff — Asfaltbestilling (Formand · Planlægning-tab)

> **Hvad denne fil ER:** Forretnings-scope og strategisk overblik for Asfaltbestilling-sektionen. Den fortæller HVORFOR vi bygger sektionen nu, HVAD den dækker, HVEM den serverer, og HVAD den IKKE må dække.
>
> **Hvad denne fil IKKE er:** Komponent-decomposition (det er `.claude/sections/formand/asfaltbestilling.md`), datafelter (det er `.claude/docs/DATA_FIELDS.md`), UX-flows (det er `Docs/Formand/asfaltbestilling/FLOWS.md`) eller accept-kriterier (det er `CONTRACT.md`).

---

## Identitet

- **Sektion:** Asfaltbestilling
- **App:** Formand
- **Skærm/sti:** `/ordre/:id` → Planlægning-tab → Asfaltbestilling-sektion
- **Arkitekt:** claude/architect (handoff efter sign-off)
- **Dato:** 2026-05-26
- **Prototype-reference:** `apps/formand/src/prototypes/ordre-plan/OrdrePlanScreen.tsx#L1440-L1640` + handlers L957-L1046 + send-modal L2480-L2545

---

## 1. Hvorfor bygges denne sektion nu?

**Forretningsmotivation:**

1. **Kerne-arbejdsgangen for formanden.** Asfaltbestilling er det første touch-point hver morgen — formanden beslutter hvad fabrikken skal producere, hvad vognmanden skal disponere, og hvad chaufføren skal køre. Uden denne sektion er resten af appen blokeret.
2. **Eneste sektion der producerer `transport_orders` cross-app.** Vognmand, fabrik, dagsoverblik og afregning bygger alle på rækker oprettet HER. Hvis kontrakten ikke er låst nu, må modtager-sektionerne re-bygges senere.
3. **Multi-produkt-modellen kræver det.** De låste kerne-konklusioner (SMA marts + GAB maj, `samles_paa_en_bil`-flag, M/R/A/P-badges) skal cementeres i dataflowet — bestilling-rækken er stedet hvor flaget sættes.
4. **Offline-strategi-pilot.** Sektionen er den første der får write-queue + optimistic UI. Mønstret bliver skabelon for resten af Formand.

**Sektionen er klar til dev-fase fordi:**
- Status-vokabular ✅ låst 2026-05-26
- Datoformat ✅ låst 2026-05-26
- Multi-produkt-kerne ✅ låst 2026-05-19 (4 opfølgnings-spg. = `TBD-refinement`, ikke blocker)
- Prototype-UX godkendt af kunde 2026-05-22

---

## 2. Scope

### 2.1 — In scope

- Visning af planlagte produkter for valgt dato (`DatePillsRow` → `ProductBoxV2` × n)
- Indtastning af `tonsPlanned` (Forventet) + `morgenTons` (faktisk bestilling)
- Aflysning af enkelt produkt-dag med årsag (`AflysningsAarsag`: regn / frost / underlag / andet)
- Restore (fortryd-aflysning) — kun lokalt, kræver manuel re-send hvis dagen tidligere var afsendt
- Vejr-toggle (informativt flag — ingen automatik)
- "Samles på en bil"-checkbox (driver multi-produkt-loading-flow)
- Ekstra-bestilling (drip-orders ud over morgen) med produkt-dropdown + tons + samles-flag
- "Send til fabrik"-flow med kommentar-felt og bekræftelses-modal
- Atomisk batch-send pr. (orderId, selectedPlanDate)
- Optimistic UI med 5s timeout + rollback
- Offline-write-queue
- Cross-app writes til fabrik, vognmand, Formand.Udførsel-dagsoverblik, Formand.AsfaltKoersel (ABE-1 til ABE-8)
- Sum-warning (`sum(tonsPlanned) > tonsTotal` → soft warning i modal)

### 2.2 — Out of scope

- **Historik / audit-log:** Hvem har sendt hvad hvornår — vises ikke i denne sektion. Hvis nødvendigt, separat audit-view.
- **Edit-cascade efter send:** `morgenTons`, `tonsPlanned`, `samlesPaaEnBil` på sendt række er LOCKED. Rettelser sker pr. telefon til fabrik. Undtagelse: vejr-toggle + aflysning er stadig tilladt på sendt række.
- **Afregnings-logik:** `puljelaes`, `multilaes`, `andreOrdrer` bevares som data-flags i `ekstra_bestillinger`-tabellen, men UI'en for dem hører til Afregning-sektionen (kommer senere).
- **Bil-disponering (AsfaltKoersel):** Separat sektion. Asfaltbestilling sender kun "klar til bilbestilling"-signalet via ABE-4.
- **Vognmand-, fabrik-, chauffør-UI:** Disse er konsumenter af `transport_orders`. Bygges i separate sektion-pakker. Asfaltbestilling låser kontrakten — modtager-apps følger.
- **"Bekræftet af fabrik"-state:** `transport_orders.confirmed_at` kan være sat, men visualisering hører til Kørsel-sektionen, ikke Asfaltbestilling (jf. C11).
- **Direkte 403/redirect for ikke-formand-roller:** Hele Formand-appen er bag rolle-auth. Lokal sektion-niveau-tjek dækkes af app-level auth — ikke dette interview.
- **Multi-formand-konflikt-UX:** Server-side optimistic locking + standard 409 → toast + refetch. Specifik konflikt-UI hører til en tværgående auth/sync-sektion.

### 2.3 — Brugerhistorier (happy paths)

1. **Send morgen-bestilling for én dag.** Som formand vil jeg på <30 sekunder kunne indtaste morgen-tons for dagens produkter og sende batch'en til fabrik+vognmand, så de kan begynde produktion og disposition.
2. **Drip-bestilling ud over morgen.** Som formand vil jeg på <20 sekunder kunne tilføje en ekstra bestilling sent på dagen (når jeg ser at vi når mere end planlagt), så fabrikken modtager den supplerende produktion-ordre.
3. **Aflys en dag pga. regn.** Som formand vil jeg på <10 sekunder kunne aflyse et produkt for en specifik dag med årsag "regn", så fabrik+vognmand automatisk får besked og kan frigive ressourcer.

---

## 3. Stakeholders og roller

| Rolle | Adgang | Ansvar i flowet |
|---|---|---|
| **Formand** | Fuld read/write | Ejer sektionen. Alle 9 flows (C1-C9). Eneste rolle der ser UI'en. |
| **Vognmand** | Ingen (read-only-derived) | Modtager `transport_orders` + flag via ABE-1, ABE-5, ABE-7, ABE-8. Disponerer biler. |
| **Fabrik** | Ingen (read-only-derived) | Modtager `transport_orders` via ABE-2, ABE-6, ABE-8. Producerer. |
| **Chauffør** | Ingen | Modtager `samlesPaaEnBil`-derived multi-produkt-loading-flow via vognmand → chauffør-app (ABE-7 downstream). |
| **Kunde** | Ingen | Skjult. |
| **Formand.Udførsel-dagsoverblik** (samme app) | Read-only intern | Læser `morgenTons` som default for "faktisk udlagt"-feltet (ABE-3). |
| **Formand.AsfaltKoersel** (samme app) | Read-only intern | Læser "dagen klar til bilbestilling"-signal (ABE-4). |

---

## 4. Komponent-overblik (10 komponenter)

> **Detaljer:** `.claude/sections/formand/asfaltbestilling.md` og `.claude/docs/DATA_FIELDS.md`.

| # | Komponent | Rolle | Kort beskrivelse |
|---|---|---|---|
| 1 | `AsfaltbestillingSection` | Container | Ejer hooks (`useAsfaltbestilling` + `useEkstraBestilling`), wirer alt sammen, håndterer modal-state |
| 2 | `DatePillsRow` | Presenter | Vandret række af dato-piller med `formatLongDateWithDay` + sendt-indikator |
| 3 | `ProductBoxV2` | Presenter | Produkt-boks med 7 visuelle modes (default / fokus / sendt / aflyst / reason-picker / med-tags / vejr-aktiv) |
| 4 | `EkstraBestillingBox` | Presenter | Drip-ordre-boks med 2 modes (default / sendt) |
| 5 | `StatusPill` | Presenter | UI-derived pille: sendt / aflyst / afventer |
| 6 | `EkstraBestillingCTA` | Presenter | Dashed-border "+ Ekstra"-knap (kun synlig når `productsForSelectedDate.length > 0`) |
| 7 | `SendTilFabrikCTA` | Presenter | Gul "Send til fabrik"-knap med kommentar-tooltip + disabled-state |
| 8 | `SendBekraeftelsesModal` | Presenter | Bekræftelses-modal med kommentar-textarea + sum-warning + atomic confirm |
| 9 | `useAsfaltbestilling(orderId)` | Hook | Ejer DayPlan-state, planDays-beregning, auto-skift af activeProductId, `sendAlleForSelectedDate` (orkestrerer cross-hook send) |
| 10 | `useEkstraBestilling(orderId, selectedDate)` | Hook | Ejer EkstraBestilling-state, eksponerer `markSent(ids)` til atomic batch fra useAsfaltbestilling |

**Sub-flows (interne modes, ikke separate komponenter):**
- `CancelReasonPicker` — inde i `ProductBoxV2`'s "Reason-picker"-mode (ikke egen komponent)
- Empty-state `"Ingen produkter denne dag"` — rendres direkte i container (ikke egen komponent)

---

## 5. Cross-app produkt-status

> Asfaltbestilling er **producent** for `transport_orders`-rækker. Modtager-apps bygges senere; kontrakten låses her.

| Modtager | Status | Hvor i flowet |
|---|---|---|
| **Vognmand.Disponering** | Eksisterer som prototype — kontrakt skal matches ved Supabase-integration | ABE-1, ABE-5, ABE-7, ABE-8 |
| **Fabrik.OrdreKoe** | Kommende sektion — ikke bygget endnu | ABE-2, ABE-6, ABE-8 |
| **Formand.Udførsel.Dagsoverblik** | Eksisterer som prototype — pre-fill-flow skal forbindes | ABE-3 |
| **Formand.Planlægning.AsfaltKoersel** | Eksisterer som prototype — "klar til bilbestilling"-signal skal forbindes | ABE-4 |
| **Chauffør (downstream via vognmand)** | Eksisterer delvist — multi-produkt-loading-flow (9-trins) skal aktiveres når `samles_paa_en_bil=true` | ABE-7 downstream |

**Kontrakt-resumé** (fra `FUNCTIONAL_FLOWS.md` ABE-sektion):
- 3 tabeller skrives: `transport_orders` (source-of-truth for "sendt"), `day_plans` (source-of-truth for "planlagt"), `ekstra_bestillinger` (drip-bestillinger)
- 8 cross-app events: ABE-1 til ABE-8
- Alle writes går via `// TODO: Erstat med Supabase`-stubs indtil Supabase-integration

---

## 6. Dependencies

### 6.1 — Sektionen LÆSER fra (skal være live/dev)

| Sektion | App | Status | Hvad læses |
|---|---|---|---|
| `ordre-detaljer` | Formand | live/prototype | `ordreNr`, `projektleder`, `recipeCode`, `recipeName`, `thicknessMm`, `tonsTotal`, `startDate`, `endDate`, `factory.code` |
| `samleordre` | Formand | prototype | Ordre-tags på produkt-bokse i samleordre-mode |

### 6.2 — Sektionen SKRIVER til (alle bygges senere)

| Sektion | App | Trigger | Cross-app-flow |
|---|---|---|---|
| `vognmand-disponering` | Vognmand | Send-batch | ABE-1 |
| `fabrik-ordre-koe` | Fabrik | Send-batch | ABE-2 |
| `udfoersel-dagsoverblik` | Formand | Send-batch (kind=`'morgen'`) | ABE-3 |
| `asfalt-koersel` | Formand | Send-batch (kind=`'morgen'`) | ABE-4 |
| `vognmand-disponering` | Vognmand | CancelDay | ABE-5 |
| `fabrik-ordre-koe` | Fabrik | CancelDay | ABE-6 |
| `vognmand-disponering` (+ chauffør downstream) | Vognmand + Chauffør | ToggleSamlesPaaEnBil | ABE-7 |
| `vognmand-disponering` + `fabrik-ordre-koe` | Vognmand + Fabrik | ToggleWeather | ABE-8 |

### 6.3 — Sektionen BLOKERER

| Sektion | App | Hvorfor |
|---|---|---|
| `afregning` | Formand | Afregning kan ikke køre før produkter er sendt + leveret. Asfaltbestilling skal definere `transport_orders` før afregnings-flow kan defineres. |
| `vognmand-disponering` (Supabase-integration) | Vognmand | Vognmand kan ikke skifte fra mock til Supabase før `transport_orders`-skemaet er låst her. |

---

## 7. Open questions / TBD-refinement

> Disse er kendte spørgsmål der IKKE blokerer dev-start, men skal afklares enten under build eller i post-dev-iteration.

### 7.1 — Multi-produkt opfølgnings-spg. (fra `project_locked_decisions_pending`)

| # | Spørgsmål | Impact |
|---|---|---|
| MP-1 | Hvordan vises "kombineret samleordre" (flere ordrer på samme bil) i vognmand-UI? | Påvirker IKKE Asfaltbestilling — kun receiver-rendering |
| MP-2 | Hvilke kombinationer af produkter (recepter) må samles på én bil? Regel-tabel? | Påvirker IKKE Asfaltbestillings UI — kun valideringer der evt. tilføjes senere |
| MP-3 | Default-vejning per produkt på fabrik når `samles_paa_en_bil=true` — auto eller manuel? | Påvirker IKKE Asfaltbestilling — kun chauffør/fabrik-flow |
| MP-4 | Cross-ordre-fordeling (`ekstra_bestilling.andreOrdrer`) — hvem populerer det? Formand i Asfaltbestilling, eller derived ved afregning? | **Påvirker bestilling-UI potentielt.** Beslut før build hvis det skal være en UI-feature. |

### 7.2 — Spørgsmål der opstod ved samling af helheden (D-spørgsmål — nye)

| # | Spørgsmål | Foreslået default |
|---|---|---|
| D1 | Skal `cancel_reason_note` (fritekst ved `'andet'`) have max-længde i UI? | Default 200 tegn (jf. C5-default). Bekræft. |
| D2 | Skal "Send til fabrik"-knappen vise loading-spinner under in-flight batch (5s window)? | Ja, disabled + spinner. Forhindrer dobbelt-klik. |
| D3 | Skal `sentStateByDate` opdateres optimistisk ved send (før server-ack), så dato-pillen straks bliver grøn? | Ja, optimistisk. Rollback ved fejl. |
| D4 | Når write-queue replayer ved reconnect og server afviser én row i en batch — partial rollback eller fuld rollback? | **Fuld rollback** (batch er atomar jf. invariant 4). Toast: "X bestillinger nåede ikke frem — prøv igen". |
| D5 | Hvor i UI'en vises offline-banner — øverst i hele appen eller kun i denne sektion? | App-niveau (`<OfflineBanner />` i AppShell — eksisterer allerede). Sektion behøver ikke ekstra banner. |

---

## 8. Risk register

| # | Risiko | Sandsynlighed | Konsekvens | Mitigation |
|---|---|---|---|---|
| R1 | Optimistic UI rollback efter 5s timeout giver bruger forvirring ("Jeg klikkede send — hvad skete der?") | Medium | Medium | Tydelig toast med årsag + "Prøv igen"-knap + bevar formularens state ved rollback |
| R2 | Atomic batch-fejl ved offline → write-queue → reconnect — én row fejler → hele batch'en rulles tilbage → frustration | Medium | Høj | Backend skal levere row-niveau-error-respons. UI viser præcis hvilken row der fejlede + suggest manuel fix |
| R3 | Race-condition: to formænd på samme ordre sender batch samtidig | Lav | Medium | Server unique constraint på `(day_plan_id) WHERE kind='morgen'` + 409 → toast + auto-refetch |
| R4 | Multi-produkt-MP-4 (cross-ordre-fordeling) viser sig at kræve UI-felt vi ikke planlagde | Lav | Medium | Påvirker `ekstra_bestillinger`-skema. Afklar MP-4 før build hvis muligt; ellers iteration post-launch |
| R5 | Sum-warning (`sum(tonsPlanned) > tonsTotal`) ignoreres af formænd som soft warning → over-bestilling | Lav | Lav | Soft-warning er bevidst valg (jf. B13). Mitigation: vis warning både per-produkt og total i modal. Audit-log over-bestillinger. |
| R6 | Cascade-aflysning ved `cancelDay` på sendt dag → vognmand har allerede sendt chauffør → kritisk tab af koordination | Lav | Høj | Cross-app modtager (vognmand) får real-time notification + skal vise kritisk advarsel hvis bil allerede er dispatched. Hører til vognmand-sektionens contract. |
| R7 | `restoreDay`-bug i prototype (bruger `activeProductId` for self-lookup) gentager sig | Lav | Lav | Eksplicit angivet i CONTRACT (AC) + architect SPEC. Builder skal kopiere fra prototype MED fix. |
| R8 | Dato-piller forsvinder når alle produkter aflyses → formand mister adgang til at restore'e | Medium | Medium | C6-default: skift til nærmeste fremtidige dato. Hvis ingen — vis "Alle dage aflyst"-empty-state + global restore-genvej. |

---

## 9. Succes-kriterier (højt niveau)

> Målbare outcomes der definerer "sektionen er live + virker". Bekræftes ved demo + live-data.

| # | Kriterium | Hvordan måles |
|---|---|---|
| S1 | Formand kan sende dagens bestilling på <30 sekunder (fra åbning af sektion til "sendt"-toast) | Stopur i demo + telemetri når live |
| S2 | 0 cross-app-write-fejl ved valid input (alle ABE-1..8 producerer rækker i modtager-tabeller) | Integration-test + manuel demo |
| S3 | 100% af aflysninger har en låst `AflysningsAarsag` (ingen "tomme" cancels) | E2E-test + RLS/DB-constraint |
| S4 | Offline-write-queue + reconnect replay virker for alle skrive-actions i sektionen | E2E offline-suite |
| S5 | Atomic batch: ingen partial-state (alle sendt eller ingen) ved fejl midt i batch | Backend integration-test |
| S6 | Optimistic UI giver visuel feedback inden for 100ms efter klik (klik → produkt-boks låst → fra ~100ms) | E2E performance-måling |
| S7 | Touch-targets ≥ 44×44px (tilgængelighed) | Manuel audit + automated check |
| S8 | Token-violations: 0 (ingen hardcoded farver eller fontstørrelser) | `/token-check` |
| S9 | Coverage ≥ 80% lines / 70% branches på hooks + container | `npm run formand:test --coverage` |

---

## 10. Definition of Done

- [ ] Alle 10 komponenter bygget jf. SPECs (med korrekt visuel match til prototype)
- [ ] Lint + typecheck + tests grønne på alle 4 rounds
- [ ] Coverage ≥ 80/70 på `useAsfaltbestilling`, `useEkstraBestilling`, `AsfaltbestillingSection`
- [ ] Token-check ren (`/token-check apps/formand/src/components/sections/AsfaltbestillingSection.tsx`)
- [ ] Font-alias respekteret (`font-poppins` for prototype-fallback)
- [ ] `FUNCTIONAL_FLOWS.md` ABE-1..8 stadig matcher implementeret kode
- [ ] Cross-app effekter verificeret (manuel demo eller integration-test mod vognmand-prototype)
- [ ] Mock-fjernelse: alle `// TODO: Erstat med Supabase`-stubs forberedt til Supabase-skift (eksplicit kommenteret)
- [ ] Offline-opførsel testet via DevTools throttle
- [ ] Demo med kunde (Carsten + projektleder)
- [ ] Section-manifest `current_phase: live`

---

**Godkendt af Carsten:** `[ ] Dato: yyyy-mm-dd`
**Build-start:** `[ ] Dato: yyyy-mm-dd`
**Sektion afsluttet:** `[ ] Dato: yyyy-mm-dd`
