---
section: asfaltbestilling
app: formand
tab: planlaegning
phase: interview-C
created: 2026-05-26
last_updated: 2026-05-26
status: draft
---

# UX-flows — Asfaltbestilling (Formand · Planlægning-tab)

> **Hvad denne fil ER:** Detaljerede UX-flows for Asfaltbestilling-sektionen — én reference for hvad der sker hvor i UI'en, hvilke hooks/actions der kaldes, og hvilke cross-app writes der udløses.
>
> **Hvad denne fil IKKE er:** Acceptkriterier (det er Fase D / CONTRACT_Asfaltbestilling.md) eller forretnings-scope (det er kickoff'en).
>
> **Læs sammen med:**
> - `.claude/sections/formand/asfaltbestilling.md` — komponent-scope
> - `.claude/docs/DATA_FIELDS.md` (sektion: Asfaltbestilling) — felter pr. komponent + Supabase-mapping
> - `.claude/docs/STATUS_VOKABULAR.md` — enums brugt herunder
> - `.claude/docs/DATOFORMAT.md` — display-helpers
> - `.claude/docs/FUNCTIONAL_FLOWS.md` (sektion: Asfaltbestilling) — cross-app flows ABE-1 til ABE-8
>
> **Prototype-source:** `apps/formand/src/prototypes/ordre-plan/OrdrePlanScreen.tsx#L1440-L1634` + handlers L957-L1046 + send-modal L2480-L2545.

---

## Aktører i flowene

| Aktør | Rolle |
|---|---|
| **Formand** | Eneste rolle der interagerer direkte med sektionen. Ejer alle skrive-actions. |
| **Vognmand** | Modtager `transport_orders` + flag-opdateringer. Ser ikke selve sektionen. |
| **Fabrik** | Modtager `transport_orders` + flag-opdateringer. Ser ikke selve sektionen. |
| **Chauffør** | Modtager `samlesPaaEnBil`-derived multi-produkt-loading-flow via vognmand → chauffør-app. |
| **`udfoersel-dagsoverblik`** (formand-sektion) | Læser `morgenTons` som default for "faktisk udlagt". |

> **Cross-app skrivninger** sker fra `useAsfaltbestilling`-hookens actions via `// TODO: Erstat med Supabase`-stubs. Modtager-apps bygges i separate sektion-pakker — kontrakten låses her.

---

## Globale invariants

Disse gælder på tværs af alle flows. Brydes én af dem → bug.

1. **`activeProductId` og `selectedPlanDate` er controlled fra parent** (`OrdrePlanScreen`). Container ejer dem ikke — den propagerer kun via callbacks.
2. **Auto-skift af `activeProductId`** sker i `useAsfaltbestilling` (ikke i container) når current ikke matcher noget produkt på `selectedPlanDate`. Driver først efter render (useEffect).
3. **`isSent`-state låser inputs** på `ProductBoxV2` (Forventet tons + Morgen tons + samles-checkbox bliver read-only) og på `EkstraBestillingBox` (alt locked). `cancelDay` + `restoreDay` er stadig tilladt på sendte rækker (formand kan aflyse en sendt dag).
4. **Send-batch er atomar** per `(orderId, selectedPlanDate)`: alle ikke-sendte morgen-bestillinger + alle ikke-sendte ekstra-bestillinger med `tons > 0` sendes sammen. Hvis batch fejler, ingen `transport_orders` oprettes — `sentDayIds`/`ekstra.sent` opdateres ikke.
5. **Kommentar er pr. (orderId, date)-batch**, ikke pr. row. Samme `kommentar`-streng gemmes på alle `transport_orders` der oprettes i batch'en.
6. **Aflysning nulstiller `tonsPlanned`** (`tonsPlanned: 0`) men bevarer `morgenTons` for audit. `restoreDay` bringer ikke `tonsPlanned` tilbage — formand skal genindtaste.
7. **Sum-validering `sum(tonsPlanned) ≤ tonsTotal`** = soft warning. Tillader gem.
8. **Datovisning** følger `formatLongDateWithDay` (B10-beslutning) — `mandag 16. marts 2026` på dato-piller.

---

## Flow C1 — Bestil-flow (Send til fabrik)

> **Primær happy path.** Formand klargør og afsender dagens bestilling.

### Trigger
Formand er på `OrdrePlanScreen` i Planlægning-mode, har valgt en dato i `DatePillsRow` hvor `productsForSelectedDate.length > 0` og mindst ét produkt har `morgenTons != null` (ellers er det stadig muligt men SendCTA er irrelevant).

### Stepwise UI-flow

| Step | UI-handling | Komponent | Synlig effekt |
|---|---|---|---|
| 1 | Formand vælger dato i pille-rækken | `DatePillsRow` | `selectedPlanDate` opdateres; produkt-bokse + ekstra-bokse for dagen renderes |
| 2 | Formand klikker på `ProductBoxV2`-header (vælger fokus-produkt) | `ProductBoxV2` (Default-mode) | `isFocused=true` på boksen, Spec-grid switcher til dette produkt |
| 3 | Formand indtaster Forventet tons | `ProductBoxV2` → Forventet-input | `day.tonsPlanned` opdateres optimistisk i UI |
| 4 | Formand indtaster Morgen tons | `ProductBoxV2` → Morgen-input | Morgen-input skifter fra rød (empty) til grøn (udfyldt); `StatusPill` skifter fra `'Indtast morgen'` til `'Klar til afsendelse'` |
| 5 *(valgfri)* | Formand toggler "Samles på en bil"-checkbox | `ProductBoxV2` → checkbox | `day.samlesPaaEnBil` skifter; ingen anden UI-effekt (informativt) |
| 6 *(valgfri)* | Formand toggler vejr-ikon | `ProductBoxV2` → vejr-toggle | `day.weatherActive` skifter; ikon-styling skifter mellem `bg-[#F5F5F5]` og `bg-dark-teal` |
| 7 | Formand klikker "Send til fabrik"-CTA | `SendTilFabrikCTA` | `showConfirmSend=true` i container → modal åbnes |
| 8 | Formand skriver evt. kommentar i modalen | `SendBekraeftelsesModal` → textarea | Lokal `kommentar`-state opdateres (ikke bobler op før confirm) |
| 9 | Formand klikker "Send til fabrik" i modal | `SendBekraeftelsesModal` → primær knap | `onConfirm(kommentar.trim())` kaldes → container kalder `sendAlleForSelectedDate(kommentar)` |
| 10 | Modal lukker, side opdateres | `AsfaltbestillingSection` | Sendte produkt-bokse + ekstra-bokse skifter til `isSent=true` (inputs låses, layout uændret); `StatusPill` skifter til `kind='sendt'`; dato-pillen skifter til grøn `all-sent` hvis alle dagens produkter nu er afsendt; kommentar-tooltip vises under CTA |

### State-mutations (i `useAsfaltbestilling`)

```ts
sendAlleForSelectedDate(kommentar: string): Promise<void>
  → For hver { product, day } in productsForSelectedDate hvor !isDaySent(day.id):
      INSERT transport_orders (
        order_id = orderId,
        day_plan_id = day.id,
        kind = 'morgen',
        tons = day.morgenTons,            // ≥ 0
        product_id = product.id,
        date = selectedPlanDate,
        status = 'afventer',
        kommentar = kommentar || null,
        sent_at = now()
      )
  → For hver eb in ekstraForSelectedDate hvor !eb.sent && eb.tons > 0 && eb.productId !== '':
      INSERT transport_orders (
        order_id = orderId,
        ekstra_bestilling_id = eb.id,
        kind = 'ekstra',
        tons = eb.tons,
        product_id = eb.productId,
        date = selectedPlanDate,
        status = 'afventer',
        kommentar = kommentar || null,
        sent_at = now()
      )
      UPDATE ekstra_bestillinger SET sent = true, sent_at = now() WHERE id = eb.id
```

`sendAlleForSelectedDate` er **atomar**. Hvis nogen INSERT fejler → rollback → ingen ekstra.sent opdateres → side viser stadig "ikke sendt"-tilstand + error-state.

### Cross-app writes

| Modtager | Trigger | Payload | Receiver-handling | FUNCTIONAL_FLOWS-ref |
|---|---|---|---|---|
| Vognmand.Disponering | `transport_orders` INSERT | `{ order_id, date, kind, tons, product_id, samles_paa_en_bil, weather_active, kommentar }` (aggregeret per date) | Ny "Afventer disponering"-opgave dukker op i vognmandens liste for dagen | **ABE-1** |
| Fabrik.OrdreKoe | `transport_orders` INSERT | Hver row som ny linje | Ordre-linje dukker op i fabrikkens kø-view (sorteret efter `sent_at`) | **ABE-2** |
| Formand.UdfoerselDagsoverblik | `transport_orders` INSERT (kind=`'morgen'`) | `{ date, product_id, tons }` → bliver default for "faktisk udlagt"-feltet | Pre-fyldt "faktisk udlagt"-input på dagsoverblik-skærmen for samme dato + produkt | **ABE-3** |
| Formand.AsfaltKoersel | `transport_orders` INSERT (kind=`'morgen'`) | `{ date }` → trigger "Bekræft biler"-flow hvis ikke allerede gjort | Asfalt-kørsel-sektionen markerer dagen som "klar til bilbestilling" | **ABE-4** |

### Edge cases

| Case | Adfærd |
|---|---|
| Ingen produkter på dagen | CTA + EkstraCTA skjult (`productsForSelectedDate.length === 0`). Empty-state `"Ingen produkter denne dag"` vist. |
| Alle produkter aflyst på dagen | CTA renderes med `disabled=true` ("Intet at sende") fordi `totalIkkeSendt === 0` (aflyste tæller ikke). EkstraCTA stadig synlig (B8-beslutning). |
| Alle allerede sendt | CTA renderes med `disabled=true` ("Intet at sende"). Modal kan ikke åbnes. |
| Modal åben, formand klikker backdrop | `onCancel()` → `showConfirmSend=false`, kommentar-state ryddes lokalt. Ingen mutations. |
| Modal åben, formand klikker Annullér | Samme som backdrop. |
| Tom kommentar | Tillades. `kommentar = ''` → `null` i DB (jf. spec). Tooltip vises ikke ved næste render. |
| Ekstra-bestilling med `productId === ''` | Skips i batch (ikke gyldig). Andre rows sendes; en gyldig "sentDayIds + sent-ekstra"-delta opnås. **Validation gate** kan tilføjes i Fase D der blokerer hele send'en hvis nogen ekstra mangler produkt. *(C-spg)* |
| Ekstra-bestilling med `tons === 0` | Skips i batch (jf. prototype-filter `eb.tons > 0`). Forbliver `sent=false`. |
| Offline ved klik på "Send til fabrik" | Batch køes via write-queue (`project_offline_strategi`). UI viser optimistisk "sendt"-state + `OfflineBanner`. Ved reconnect: replay og sync. Hvis backend afviser → rollback + error-toast. *(C-spg om konflikt-håndtering)* |
| Sum > total advarsel aktiveret | Warning vises i modal (Fase D-detalje). Send tillades stadig (soft, jf. B13). |
| Race: to formænd sender samme batch samtidigt | Server-side håndteres via unique constraint på `(day_plan_id)` for kind=`'morgen'`. Den anden får conflict → toast + auto-refresh. |
| Race: formand klikker Send mens batch er in-flight | CTA bliver `disabled` mellem klik og batch-svar (loading-state). Forhindrer dobbelt-send. |

### Status-vokabular brugt

- `TransportOrderStatus` = `'afventer'` ved INSERT
- `StatusPill.kind` = `'sendt'` UI-derived efter `isDaySent(day.id) === true`
- Ingen `AflysningsAarsag`/`ProduktTilstand` muteres i dette flow

---

## Flow C2 — Aflys-produkt-dag-flow

> Formand opdager at en specifik dag ikke skal udlægges (vejr, underlag, fejl).

### Trigger
Formand klikker "X"-knap øverst højre på `ProductBoxV2` (Default-mode eller Sent+aktiv-mode).

### Stepwise UI-flow

| Step | UI-handling | Komponent | Synlig effekt |
|---|---|---|---|
| 1 | Klik X-knap | `ProductBoxV2` (Default) | Container sætter `cancellingDayId = day.id` → boksen skifter til **Reason-picker**-mode |
| 2 | Picker viser 4 årsags-knapper | `ProductBoxV2` (Reason-picker) | Knapper: Regn, Frost, Underlag, Andet. X-fortryd til at lukke uden valg. |
| 3 | Formand klikker en årsag | `ProductBoxV2` → onConfirmCancel | `cancelDay(productId, dayId, reason)` kaldes; picker lukker |
| 4 | Boks skifter til **Aflyst**-mode | `ProductBoxV2` (Aflyst) | Opacity-60, bad-border, viser recipe-name + "Aflyst" + årsag-label + "Fortryd"-link |
| 5 | `StatusPill` skifter til `kind='aflyst'` | `StatusPill` | `bg-bad/10` + "Aflyst"-tekst |
| 6 | Dato-pille kan skifte hvis alle produkter på dagen er aflyste | `DatePillsRow` | Dato forsvinder fra pille-rækken (filter `!d.cancelled` på L1454) — formand mister adgang til dagen indtil mindst ét produkt restoreres. **Vigtigt edge case** *(C-spg)* |

### State-mutations

```ts
cancelDay(productId: string, dayId: string, reason: AflysningsAarsag): void
  → UPDATE day_plans SET
      cancelled = true,
      cancel_reason = reason,
      tons_planned = 0           // jf. prototype: nulstilles
    WHERE id = dayId
  → setCancellingDayId(null)     // luk picker
```

`morgenTons` bevares (audit) — formand kan se hvad der var planlagt før aflysning ved at restore'e.

### Cross-app writes

| Modtager | Trigger | Payload | Receiver-handling | FUNCTIONAL_FLOWS-ref |
|---|---|---|---|---|
| Vognmand.Disponering | `day_plans.cancelled=true` på allerede-sendt dag | `{ day_plan_id, date, cancel_reason }` | Hvis dagen var afsendt: annullér tilhørende `transport_order` (sæt status til afledt aflyst-state ELLER slet — TBD *(C-spg)*). Vognmand får notification. | **ABE-5** |
| Fabrik.OrdreKoe | Samme | Samme | Hvis dagen var afsendt: fjern fra kø eller marker som aflyst. Hvis ikke afsendt: ingen effekt (fabrik så aldrig rowen). | **ABE-6** |

### Edge cases

| Case | Adfærd |
|---|---|
| Aflys en allerede sendt dag | Tilladt. `cancelDay` virker stadig — `transport_order` skal cascade-aflyses cross-app (**C-spg: hvad er reverse-flow?**). |
| Picker åben, formand klikker X-fortryd (ikke "Fortryd"-link, men picker-cancel) | `onAbortCancel()` → `cancellingDayId=null`. Boks tilbage til forrige mode (Default eller Sent). |
| Picker åben, formand klikker andet sted | Picker forbliver åben. Ingen blur-luk i prototypen. **Beslut:** Skal vi tilføje blur-luk? *(C-spg)* |
| Picker åben på én boks, formand klikker X på en anden boks | Container sætter `cancellingDayId` til NY dayId — gammel picker lukker, ny åbner. Kun én picker ad gangen. |
| Sidste ikke-aflyste produkt på dagen aflyses | Dato-pillen forsvinder fra `DatePillsRow` (filter `!d.cancelled`). Container's auto-skift af `selectedPlanDate` (ikke implementeret i prototype) skal i Dev-fase håndtere dette. **C-spg:** Bevarer vi `selectedPlanDate` eller skifter vi automatisk til næste lovlige dato? |
| Offline | `cancelDay` køes via write-queue. UI viser aflyst-tilstand optimistisk. Ved reconnect: hvis server siger nej → rollback + toast. |
| `reason === 'andet'` | I prototypen er der ikke fritekst-felt. **C-spg:** Skal "Andet" kræve fritekst-årsag (best-practice for audit)? `AflysningsAarsag = 'andet'` kunne ledsages af `day.cancel_reason_note: string \| null`. |

### Status-vokabular brugt

- `AflysningsAarsag` skrives på `day_plans.cancel_reason`
- `StatusPill.kind` = `'aflyst'` UI-derived
- `transport_orders.status` muteres IKKE direkte i denne sektion — det er cross-app modtagers job (**C-spg om cascade-design**)

---

## Flow C3 — Fortryd-aflysning-flow

> Formand har aflyst en dag ved en fejl og vil reaktivere den.

### Trigger
Formand klikker "Fortryd"-link i Aflyst-mode på `ProductBoxV2`.

### Stepwise UI-flow

| Step | UI-handling | Komponent | Synlig effekt |
|---|---|---|---|
| 1 | Klik "Fortryd"-link | `ProductBoxV2` (Aflyst-mode) | `onRestore()` → `restoreDay(dayId)` |
| 2 | Boks skifter til Default-mode | `ProductBoxV2` (Default) | Hvid kort, inputs aktive. **`tonsPlanned` er stadig 0** (nulstillet ved aflysning) — formand skal genindtaste. `morgenTons` er bevaret hvis den var sat før aflysning. |
| 3 | `StatusPill` skifter til `kind='afventer'` | `StatusPill` | Afventer-label afhænger af `morgenTons` (`'Indtast morgen'` eller `'Klar til afsendelse'`) |
| 4 | Dato-pille genoptræder | `DatePillsRow` | Dagen er nu tilbage i pille-rækken |

### State-mutations

```ts
restoreDay(dayId: string): void
  → UPDATE day_plans SET
      cancelled = false,
      cancel_reason = NULL
    WHERE id = dayId
  // tons_planned forbliver 0 — formand skal genindtaste
```

> **Bug i prototype:** `restoreDay(dayId)` bruger `activeProductId` til at filtrere produktet (`p.id === activeProductId`) i stedet for at slå op via `dayId` direkte. Det fejler hvis brugeren har skiftet fokus til et andet produkt mellem klik på X og klik på Fortryd. **Architect skal fixe i Dev-fasen** — `restoreDay` bør tage `(productId, dayId)` eller blot `(dayId)` og slå produktet op fra dayId.

### Cross-app writes

| Modtager | Trigger | Payload | Receiver-handling | FUNCTIONAL_FLOWS-ref |
|---|---|---|---|---|
| Vognmand.Disponering | `day_plans.cancelled=false` på dag der tidligere blev cascade-aflyst | `{ day_plan_id, date }` | Hvis dagen var sendt før aflysning: **uncancel cascade**? Eller skal formand re-send'e manuelt? *(C-spg — kritisk)* | (afventer beslutning) |
| Fabrik.OrdreKoe | Samme | Samme | Samme | (afventer beslutning) |

**Anbefaling til Carsten:** Behold simpel model — `restoreDay` reaktiverer kun lokalt. Formand skal eksplicit re-send'e via "Send til fabrik" hvis dagen tidligere var afsendt og skal nå fabrik igen. Det matcher den nuværende lov-tekst "rettelser efter send sker pr. telefon".

### Edge cases

| Case | Adfærd |
|---|---|
| Restore på en dag der aldrig var sendt | Trivielt. Tilbage til normal planlægning. |
| Restore på en dag der var sendt + aflyst | Se C-spg ovenfor. Behold simpel: status går tilbage til `'afventer'` (`isSent=false`?) eller forbliver `'sendt'`. **Beslut.** |
| Restore på en dag hvor `morgenTons` var sat før aflysning | Bevares. Formand kan re-send'e direkte uden at indtaste igen (medmindre vi vil tvinge re-input — **C-spg**). |
| Restore mens en anden formand har redigeret dagen | Race. Server returnerer 409 → toast + refetch. |

### Status-vokabular brugt

- Ingen enum-mutationer cross-app i simpel model
- `StatusPill.kind` skifter til `'afventer'` UI-derived

---

## Flow C4 — Vejr-toggle-flow

> Formand markerer at dagens vejr har påvirket udlægningen (informativt — ingen automatisk effekt jf. B12).

### Trigger
Formand klikker vejr-ikon nederst-højre på `ProductBoxV2` (Default-mode).

### Stepwise UI-flow

| Step | UI-handling | Komponent | Synlig effekt |
|---|---|---|---|
| 1 | Klik vejr-ikon | `ProductBoxV2` → vejr-toggle | `onToggleWeather(!day.weatherActive)` |
| 2 | Ikon-styling skifter | `ProductBoxV2` | Inactive: `bg-[#F5F5F5]` + grå ikon. Active: `bg-dark-teal` + hvid ikon. |
| 3 | Persisteres på `day_plans.weather_active` | (hook) | Sync til Supabase |

### State-mutations

```ts
toggleWeather(productId: string, dayId: string, active: boolean): void
  → UPDATE day_plans SET weather_active = active WHERE id = dayId
```

> **Refactor-note:** I prototypen er `weatherActive` lokal useState INDE i ProductBoxV2. Fase A flyttede den ud på `day` (controlled prop), og hook'en persisterer.

### Cross-app writes

| Modtager | Trigger | Payload | Receiver-handling | FUNCTIONAL_FLOWS-ref |
|---|---|---|---|---|
| Vognmand.Disponering | `weather_active` ændret på sendt eller usendt dag | `{ day_plan_id, weather_active }` | Vognmand ser informativt flag i dispostions-UI ("Vejr-påvirket"). Ingen automatisk re-disponering. | **ABE-8** |
| Fabrik.OrdreKoe | Samme | Samme | Fabrik ser flag i køen. Ingen automatisk effekt (intet "minus regn"-fradrag automatisk — kun manuel reference). | **ABE-8** |

### Edge cases

| Case | Adfærd |
|---|---|
| Toggle på sendt dag | Tilladt. Cross-app modtager opdatering. Skal vi tillade det? Prototypen tillader det implicit (vejr-toggle er ikke låst af `isSent`-prop). **C-spg:** Skal vejr-toggle være låst når `isSent`? Argument for at tillade: vejr kan skifte sent på dagen og formand vil markere efter send. Argument mod: data-konsistens. **Beslutning:** Tillad (lås IKKE). Vejr-tilstand kan ændre sig efter bestilling. |
| Toggle på aflyst dag | Boksen er i Aflyst-mode → toggle er ikke synlig. Ikke muligt. |
| Offline | Toggle køes. UI optimistisk. Ved reconnect: replay. |

### Status-vokabular brugt

- Ingen enum-mutationer
- `day.weatherActive` er boolean

---

## Flow C5 — Samles-på-en-bil-flow

> Formand markerer at dagens produkt-bestilling kan konsolideres på én bil sammen med øvrige `samlesPaaEnBil`-produkter (multi-produkt-loading-flow).

### Trigger
Formand klikker "Samles på en bil"-checkbox i `ProductBoxV2` (Default-mode) eller `EkstraBestillingBox` (Default-mode).

### Stepwise UI-flow

| Step | UI-handling | Komponent | Synlig effekt |
|---|---|---|---|
| 1 | Klik checkbox | `ProductBoxV2` ELLER `EkstraBestillingBox` | `onToggleSamlesPaaEnBil(!day.samlesPaaEnBil)` ELLER `onUpdate({ samlesPaaEnBil: !eb.samlesPaaEnBil })` |
| 2 | Checkbox-styling skifter | (samme) | Standard checkbox visual feedback |
| 3 | Persisteres på `day_plans.samles_paa_en_bil` eller `ekstra_bestillinger.samles_paa_en_bil` | (hook) | Sync til Supabase |

### State-mutations

```ts
toggleSamlesPaaEnBil(productId: string, dayId: string, samles: boolean): void
  → UPDATE day_plans SET samles_paa_en_bil = samles WHERE id = dayId

// ELLER for ekstra:
updateEkstra(id: string, { samlesPaaEnBil: true })
  → UPDATE ekstra_bestillinger SET samles_paa_en_bil = true WHERE id = id
```

### Cross-app writes

| Modtager | Trigger | Payload | Receiver-handling | FUNCTIONAL_FLOWS-ref |
|---|---|---|---|---|
| Vognmand.Disponering | `samles_paa_en_bil=true` ændret | `{ day_plan_id eller ekstra_bestilling_id, samles_paa_en_bil }` | Vognmand ser indikator i dispositions-view → husker at allokere én bil til flere produkter (jf. eksisterende Flow 12 "Samles på en bil"). | **ABE-7** |
| Chauffør (via vognmand → chauffør-app) | Når vognmand bekræfter bilen | Multi-produkt-loading-flow aktiveres i fabrik-task | Chauffør får udvidet fabrik-task med 9-trins multi-produkt-loading (jf. `project_samles_paa_en_bil_marker`). | **ABE-7** (downstream) |

### Edge cases

| Case | Adfærd |
|---|---|
| Toggle på sendt dag | Locked (`isSent === true` → checkbox read-only jf. Fase A). **C-spg:** Skal det tillades at toggle efter send? Argument for: planlægningsændring. Argument mod: bil er allerede disponeret af vognmand. **Default: locked.** |
| Toggle på aflyst dag | Boksen er i Aflyst-mode → checkbox ikke synlig. Ikke muligt. |
| Kun ét `samlesPaaEnBil=true`-produkt på dagen | Vognmand ser flag men har ingen anden bil at konsolidere med. Informativt; ingen fejl. |
| Tre produkter `samlesPaaEnBil=true` med tons > bil-kapacitet | Vognmand-side håndterer. Informationen kommer dertil. Asfaltbestillings-sektionen blokerer ikke. |
| Offline | Toggle køes. |

### Status-vokabular brugt

- Ingen enum-mutationer
- `day.samlesPaaEnBil` / `ekstra.samlesPaaEnBil` er boolean

---

## Flow C6 — Ekstra-bestilling-flow

> Formand opretter en supplerende bestilling på dagen (drip-bestilling efter morgen).

### Trigger
Formand klikker "+ Ekstra"-CTA (`EkstraBestillingCTA`).

### Stepwise UI-flow

| Step | UI-handling | Komponent | Synlig effekt |
|---|---|---|---|
| 1 | Klik "+ Ekstra" | `EkstraBestillingCTA` | `onClick()` → `addEkstra()` |
| 2 | Tom `EkstraBestilling`-row dukker op | `EkstraBestillingBox` (Default-mode) | E-badge, tom tons-input, produkt-dropdown med "Vælg"-placeholder, "Samles på en bil"-checkbox |
| 3 | Formand vælger produkt fra dropdown | `EkstraBestillingBox` → dropdown | `onUpdate({ productId })` |
| 4 | Formand indtaster tons | `EkstraBestillingBox` → tons-input | `onUpdate({ tons })` |
| 5 *(valgfri)* | Formand toggler "Samles på en bil" | `EkstraBestillingBox` → checkbox | `onUpdate({ samlesPaaEnBil })` |
| 6 | `StatusPill` opdaterer | `StatusPill` | `kind='afventer'`; `afventerLabel='Indtast tons'` hvis `tons <= 0`, ellers `'Klar til afsendelse'` |
| 7 | Ved næste klik på "Send til fabrik" | (se Flow C1) | Ekstra inkluderes i batch hvis `tons > 0` og `productId !== ''` |

### State-mutations

```ts
addEkstra(): void
  → INSERT ekstra_bestillinger (
      id = uuid(),
      order_id = orderId,
      date = selectedPlanDate,
      product_id = NULL,        // placeholder indtil valgt
      tons = 0,
      samles_paa_en_bil = false,
      puljelaes = false,        // data-flag, ikke vist i UI
      multilaes = false,        // data-flag, ikke vist i UI
      sent = false
    )

updateEkstra(id: string, patch: Partial<EkstraBestilling>): void
  → UPDATE ekstra_bestillinger SET ...patch WHERE id = id
```

> **Default-værdier B6+B7:** `puljelaes=false`, `multilaes=false`, `andreOrdrer=[]` skrives som data-only-flags. Aldrig redigerbare i denne sektions UI.

### Cross-app writes

| Modtager | Trigger | Payload | Receiver-handling | FUNCTIONAL_FLOWS-ref |
|---|---|---|---|---|
| (ingen) | Selve `addEkstra` udløser intet cross-app | — | Cross-app sker først ved Send-batch (Flow C1). | — |

### Edge cases

| Case | Adfærd |
|---|---|
| Ingen produkter på dagen | EkstraCTA er skjult (`productsForSelectedDate.length > 0`-gate jf. B8). Formand kan ikke oprette ekstra. |
| Alle produkter på dagen er aflyste men ikke deleted | `productsForSelectedDate.length > 0` er stadig sand → CTA synlig (B8: altid synlig når der er produkter på dagen, også hvis alle er aflyste). Formand kan oprette ekstra for et nyt valgt produkt. |
| Formand opretter flere ekstra-rows før udfyldning | OK. Hver row har egen lokal state. Send-batch filtrerer `eb.tons > 0`. |
| Formand vælger samme produkt som en morgen-bestilling allerede dækker | Tilladt. Ekstra er additivt — fabrik modtager to separate `transport_orders` (én `kind='morgen'`, én `kind='ekstra'`). |
| Formand vælger produkt der ikke findes på dagen | `EkstraBestillingBox.products` er `MockProduct[]` for ordren (ikke filtreret på dato). Tilladt at vælge hvilket som helst af ordrens produkter. |
| Offline | INSERT køes. UI viser optimistisk. |

### Status-vokabular brugt

- Ingen enum-mutationer i selve add-flowet
- `EkstraBestilling.sent` er boolean (data-flag — IKKE en persisteret status-enum)
- Ved send: `transport_orders.status = 'afventer'` (se Flow C1)

---

## Flow C7 — Sletning-af-ekstra-flow

> Formand fortryder en ekstra-bestilling før den sendes.

### Trigger
Formand klikker "X"-knap øverst på `EkstraBestillingBox` (Default-mode).

### Stepwise UI-flow

| Step | UI-handling | Komponent | Synlig effekt |
|---|---|---|---|
| 1 | Klik X | `EkstraBestillingBox` | `onRemove()` → `removeEkstra(id)` |
| 2 | Row forsvinder fra UI | `AsfaltbestillingSection` | Layout reflower; status-pill følger med ud |

### State-mutations

```ts
removeEkstra(id: string): void
  → DELETE FROM ekstra_bestillinger WHERE id = id
```

### Cross-app writes

| Modtager | Trigger | Payload | Receiver-handling | FUNCTIONAL_FLOWS-ref |
|---|---|---|---|---|
| (ingen) | Selve `removeEkstra` udløser intet hvis row aldrig var sendt | — | — | — |

### Edge cases

| Case | Adfærd |
|---|---|
| Slet ikke-sendt ekstra | Trivielt. Row væk. |
| Slet sendt ekstra | I sent-mode er X-knap IKKE synlig (jf. Fase A: `EkstraBestillingBox` "Sendt"-mode er read-only). Ikke muligt. **Bekræft:** Skal vi tillade sletning af sendt ekstra? Default nej — formand skal ringe til fabrik. |
| Slet under in-flight send | Race-condition: row er i batch men deletes lokalt. Server-side: hvis row allerede er INSERTet som `transport_order`, må slet ikke cascade. **C-spg om locking-strategi.** |
| Offline | DELETE køes. |

### Status-vokabular brugt

- Ingen enum-mutationer

---

## Flow C8 — Dato-pille-skift-flow

> Formand navigerer mellem dage i sektionen.

### Trigger
Formand klikker en dato-pille i `DatePillsRow`.

### Stepwise UI-flow

| Step | UI-handling | Komponent | Synlig effekt |
|---|---|---|---|
| 1 | Klik pille | `DatePillsRow` | `onSelect(date)` → parent's `setSelectedPlanDate(date)` |
| 2 | `selectedPlanDate` opdateres | `AsfaltbestillingSection` (container) | Re-render. `productsForSelectedDate` rekalkuleres. Produkt-bokse + ekstra-bokse for ny dato vises. |
| 3 | Auto-skift af activeProductId hvis nødvendigt | `useAsfaltbestilling` (useEffect) | Hvis `activeProductId` ikke matcher noget produkt på ny dato → skifter til første produkt på dagen. Spec-grid følger med. |
| 4 | Pille-styling opdaterer | `DatePillsRow` | Ny pille `bg-deep-teal`; tidligere pille tilbage til default eller `bg-good` hvis dagen er fuldt sendt. |

### State-mutations

```ts
setSelectedPlanDate(date: string): void
  → Parent state opdateres (controlled fra OrdrePlanScreen)
  → Hook useEffect: hvis !productsForSelectedDate.some(p => p.id === activeProductId)
       → setActiveProductId(productsForSelectedDate[0].product.id)
```

Ingen DB-mutations — rent UI-navigation.

### Cross-app writes

Ingen.

### Edge cases

| Case | Adfærd |
|---|---|
| Klik pille der allerede er valgt | No-op. `setSelectedPlanDate` kaldes med samme værdi. Ingen re-fetch. |
| Klik pille på dag uden produkter | Ikke muligt: kun dage med mindst ét ikke-aflyst produkt er i pille-rækken (filter L1454). |
| Alle produkter på den tidligere dag aflyses → dato forsvinder fra rækken | Container's auto-skift af `selectedPlanDate` (NY logik i Dev-fase) skal vælge "nærmeste tilgængelige dato" — TBD: forrige? næste? Første i rækken? **C-spg.** |
| `planDays` tom (produkt uden dag-spænd) | `DatePillsRow` skjules (`planDays.length > 0`-gate). |
| Race: bruger klikker pille mens en anden mutation er in-flight | Tilladt. Pille-skift er pure local state. |

### Status-vokabular brugt

- Ingen.

---

## Flow C9 — Read-only-efter-send-flow

> Adfærd efter en bestilling er afsendt. Ikke et bruger-trigger flow, men en tilstand der gælder for sendte rows.

### Trigger
`transport_order` eksisterer for `(day_plan_id eller ekstra_bestilling_id)` → `isSent === true` UI-derived.

### Stepwise UI-flow

| Step | Hvad sker | Komponent | Visuel effekt |
|---|---|---|---|
| 1 | `ProductBoxV2` rendres med `isSent={true}` | `ProductBoxV2` (Sent+aktiv) | Forventet-input, Morgen-input, "Samles på en bil"-checkbox alle locked (read-only, dæmpet styling — Fase A-beslutning). Vejr-toggle og X-aflys-knap forbliver aktive jf. C4/C2. |
| 2 | `EkstraBestillingBox` rendres med `ekstra.sent=true` | `EkstraBestillingBox` (Sendt-mode) | Hele boksen read-only: tons + produkt-dropdown + samles-checkbox alle locked. X-slet-knap skjules. E-badge + "Samles på en bil"-indikator vist hvis sat. |
| 3 | `StatusPill` viser `kind='sendt'` | `StatusPill` | `bg-good-bg` + dot + "Sendt til fabrik" |
| 4 | Dato-pillen kan blive grøn `all-sent` | `DatePillsRow` | Hvis alle ikke-aflyste produkter på dagen er sendt → `bg-good` + CheckCircle2-ikon |
| 5 | Kommentar-tooltip vises under SendCTA | `SendTilFabrikCTA` | `sentKommentar` for `selectedPlanDate` hentes via `useAsfaltbestilling.kommentarForDate(date)` → vises som hover-tooltip |
| 6 | CTA muligvis disabled | `SendTilFabrikCTA` | Hvis `totalIkkeSendt === 0` (alle sendt + ingen ekstra med tons > 0) → `disabled=true` ("Intet at sende") |

### Tilladte handlinger på sendt row

| Handling | Tilladt? | Cross-app effekt |
|---|---|---|
| Aflys (X-knap) | Ja | Cascade til fabrik/vognmand (Flow C2) — **C-spg om semantics** |
| Vejr-toggle | Ja (C4) | Opdatering til vognmand/fabrik |
| Ændre `tonsPlanned` | Nej (locked) | — |
| Ændre `morgenTons` | Nej (locked) | — |
| Toggle `samlesPaaEnBil` | Nej (locked jf. Fase A) — **C-spg: bekræft** | — |
| Klik produkt-header (fokus) | Ja | Spec-grid skifter |

### State-mutations

Ingen direkte. Read-only-tilstand er rent UI-projeret fra `isDaySent`/`isEkstraSent`.

### Cross-app writes

Ingen direkte i denne tilstand (de skete ved send).

### Edge cases

| Case | Adfærd |
|---|---|
| Sendt + aflyst row | Aflyst-mode vinder over Sent-mode. Visuel: Aflyst-styling. Status-pill: `'aflyst'`. |
| Sendt + offline | Cached fra forrige session. UI viser sentstate korrekt. Mutations queued. |
| Sendt men `transport_order.confirmed_at != null` (fabrik har bekræftet) | UI ændrer ikke. **C-spg:** Skal vi vise "Bekræftet af fabrik"-state separat fra "Sendt"? Eller er det irrelevant i denne sektion (vises kun i kørsel/afregning)? |
| Kommentar-tooltip når `sentKommentar === ''` eller `null` | Tooltip-element skjules; tom 24px placeholder rendres (L1626) så højde matcher andre kolonner. |

### Status-vokabular brugt

- `TransportOrderStatus = 'afventer'` (default ved send) eller `'bekraeftet'` (sat af fabrik/vognmand)
- `StatusPill.kind = 'sendt'` UI-derived så længe `isDaySent === true && !day.cancelled`

---

## Sammenfatning — alle hook-actions

| Action | Hook | Trigger-flow | Cross-app flow(s) |
|---|---|---|---|
| `updateTons(productId, dayId, tons)` | `useAsfaltbestilling` | C1 step 3 | — (kun ved Send) |
| `updateMorgenTons(productId, dayId, tons \| undefined)` | `useAsfaltbestilling` | C1 step 4 | — (kun ved Send) |
| `toggleSamlesPaaEnBil(productId, dayId, samles)` | `useAsfaltbestilling` | C5 | ABE-7 |
| `toggleWeather(productId, dayId, active)` | `useAsfaltbestilling` | C4 | ABE-8 |
| `cancelDay(productId, dayId, reason)` | `useAsfaltbestilling` | C2 | ABE-5, ABE-6 |
| `restoreDay(dayId)` | `useAsfaltbestilling` | C3 | (afventer cascade-design) |
| `sendAlleForSelectedDate(kommentar)` | `useAsfaltbestilling` | C1 step 9 | ABE-1, ABE-2, ABE-3, ABE-4 |
| `addEkstra()` | `useEkstraBestilling` | C6 step 1 | — |
| `updateEkstra(id, patch)` | `useEkstraBestilling` | C6 step 3-5 | — |
| `removeEkstra(id)` | `useEkstraBestilling` | C7 | — |
| `setActiveProductId(id)` | (controlled parent) | C1 step 2, C8 step 3 | — |
| `setSelectedPlanDate(date)` | (controlled parent) | C8 step 1 | — |

---

## Roller — adgang og synlighed

| Rolle | Læser sektionen? | Kan ændre? | Anvendelse |
|---|---|---|---|
| Formand | Ja, fuld adgang | Alle 9 flows | Ejer sektionen |
| Vognmand | Nej (ikke samme UI) | Ingen | Modtager `transport_orders` + flag via ABE-1, ABE-5, ABE-7, ABE-8 |
| Chauffør | Nej | Ingen | Modtager `samlesPaaEnBil`-derived flow via vognmand → chauffør-app (ABE-7 downstream) |
| Fabrik | Nej (ikke samme UI) | Ingen | Modtager `transport_orders` via ABE-2, ABE-6, ABE-8 |
| Kunde | Skjult | Ingen | — |

**URL-tilgang fra forkert rolle:** Hele Formand-appen er bag rolle-auth. Vognmand/Chauffør/Fabrik/Kunde kan ikke ramme `/ordre-plan/:id` direkte. **C-spg:** Hvad er konkret 403-håndtering? Redirect til egen app-rod? — afklares i auth-sektion separat.

---

## Åbne C-spørgsmål (skal besvares før eller i Fase D)

| ID | Spørgsmål | Default-forslag |
|---|---|---|
| **C1** | Ekstra-bestilling med `productId === ''` ved Send — skip eller blokér hele batch? | **Skip** (matcher prototype). Vis warning-toast efter send: "1 ekstra-bestilling blev ikke sendt — mangler produkt". |
| **C2** | Cascade ved `cancelDay` på allerede sendt dag — hvad sker med eksisterende `transport_order`? | **Cascade-aflysning:** Modtager-app får notification + row markeres som annulleret (separat status eller soft-delete?). Behøver beslutning fra fabrik/vognmand-side. |
| **C3** | Cascade ved `restoreDay` på en dag der tidligere var sendt+aflyst — re-aktiveres `transport_order` automatisk? | **Nej.** Formand re-send'er manuelt. Holder modellen simpel. |
| **C4** | Blur-luk for aflysnings-årsags-picker? | **Ja**, klik udenfor lukker picker uden at aflyse. Matcher modal-pattern. |
| **C5** | `AflysningsAarsag = 'andet'` — kræv fritekst-note? | **Ja**, tilføj `day.cancel_reason_note: string \| null` (max 200 tegn). Audit-værdi. |
| **C6** | Dato-pille forsvinder når alle produkter aflyses — hvad skifter `selectedPlanDate` til? | **Nærmeste fremtidige dato i `planDays`** der har et ikke-aflyst produkt. Falder tilbage til forrige dato hvis ingen fremad. |
| **C7** | Vejr-toggle efter send — låst eller tilladt? | **Tilladt** (informativt, kan opdateres på dagen). |
| **C8** | Samles-toggle efter send — låst eller tilladt? | **Låst** (vognmand har allerede disponeret baseret på flag). |
| **C9** | Sletning af sendt ekstra-bestilling tilladt? | **Nej**, X-knap skjult. Formand ringer til fabrik. |
| **C10** | `restoreDay`-bug: bruger `activeProductId` til at finde produktet. Skal `restoreDay` ændres til at tage `(productId, dayId)` eller `(dayId)` med self-lookup? | **`restoreDay(dayId)`** med self-lookup. Architect fixer i SPEC. |
| **C11** | `transport_orders.confirmed_at != null` — vises "Bekræftet af fabrik" i denne sektion? | **Nej** — bekræftelse vises i Kørsel-sektion. Asfaltbestilling viser kun "Sendt". |
| **C12** | Sum-validering `sum(tonsPlanned) ≤ tonsTotal` — hvor vises warning? | **I send-bekræftelses-modal** (én linje hvis triggered). Ikke per-row. Tillader send (soft jf. B13). |
| **C13** | Optimistisk UI ved send — hvor længe viser vi sentstate hvis backend afviser? | **Optimistisk i 5s**, derefter rollback + error-toast hvis ingen ack. Standard write-queue-pattern. |
| **C14** | Skal `sendAlleForSelectedDate` returnere `Promise<{ sentDayIds, sentEkstraIds, skipped: [...] }>` så UI kan vise præcis hvad der lykkedes? | **Ja**, for at understøtte C1's skip-warning. |

---

## Refactor-noter fra prototype (uddybning af Fase B-noter)

- **`productSamlesFlags: Record<\`${productId}__${dayId}\`, boolean>`** → flyttes ind på `DayPlan.samlesPaaEnBil`. Container bortfalder den lokale state.
- **`weatherActive` lokal i ProductBoxV2** → flyttes ind på `DayPlan.weatherActive`. Bobler via `onToggleWeather` callback.
- **`sentDayIds: Set<string>` + `sentKommentarer: Record<date, string>`** → flyttes ind på `transport_orders`-tabellen. Hook eksponerer `isDaySent(dayId)` + `kommentarForDate(date)` queries.
- **`cancellingDayId: string | null`** + **`showConfirmSend: boolean`** forbliver lokal container-state (rent UI-modal).
- **`restoreDay`-bug** (Flow C3 note) — fixes med self-lookup.
- **Dato-piller** opdateres til `formatLongDateWithDay` (jf. B10).
