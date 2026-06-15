# Datafelter — Colas Apps

> Reverse engineered fra prototype-kode.
> Opdateres løbende når nye sektioner bygges.
> Formål: IT-leveranceliste over felter der skal leveres fra backend/PLAN-system.

**Sidst opdateret:** 2026-05-12
**Dækker:** Formand (komplet prototype), Chauffør (kommer), Vognmand (kommer)

---

## Formand App

### Sidebar (altid synlig)

| Felt | Format | Kilde |
|---|---|---|
| Udførselssted — adresse | Tekst | PLAN |
| Udførselssted — postnr + by | Tekst | PLAN |
| Ordrenummer | Tekst | PLAN |
| Projektleder — navn | Tekst | PLAN |
| Projektleder — telefon | Telefonnr | PLAN |
| Fabrik — navn | Tekst | PLAN |
| Fabrik — telefon | Telefonnr | PLAN |
| Kundekontakt — virksomhed | Tekst | PLAN |
| Kundekontakt — navn | Tekst | PLAN |
| Kundekontakt — telefon | Telefonnr | PLAN |

---

### Produkt-tabs

| Felt | Format | Kilde |
|---|---|---|
| Receptkode | Tekst (fx `82101H`) | PLAN |
| Produktnavn | Tekst (fx `SMA 11S`) | PLAN |
| Tykkelse | Tal (mm) | PLAN |
| Tons total | Tal (tons) | PLAN |
| Startdato | Dato | Formand |
| Slutdato | Dato | Formand |

---

### Sektion: Asfaltbestilling (Planlægning-tab)

> **Status:** Interview-fase B — feltkortlægning pr. komponent
> **Prototype-source:** `apps/formand/src/prototypes/ordre-plan/OrdrePlanScreen.tsx#L1440-L1634`
> **Interview-rev:** 2026-05-26
> **Cross-cutting:** Status-enums = `TransportOrderStatus` + `ProduktTilstand` + `AflysningsAarsag` (se STATUS_VOKABULAR.md). Dato-storage = ISO. Dato-display via `formatLongDate`/`formatLongDateWithDay`.
> **Refactor-noter fra prototype:**
> - `productSamlesFlags: Record<\`${productId}__${dayId}\`, boolean>` → flyttes ind på `DayPlan.samlesPaaEnBil: boolean`
> - `weatherActive` (local useState i ProductBoxV2) → flyttes ind på `DayPlan.weatherActive: boolean` (persisteret)
> - CancelReason `'regn' | 'frost' | 'underlag' | 'andet'` matcher allerede `AflysningsAarsag` 1:1 — ingen mapping nødvendig
> - StatusPill `'sendt' | 'aflyst' | 'afventer'` er UI-derived — ikke en persisteret enum. Beregnes fra `day.cancelled` + `sentDayIds.has(day.id)` + `day.morgenTons != null`

---

#### Type: `DayPlan` (per produkt, per dag)

> Persisteret per produkt+dato. Storage-enhed for hele dagens planlægnings-tilstand.

| Felt | Type | Required | Default | Validation | Kilde | Cross-app |
|---|---|---|---|---|---|---|
| `id` | `string` | ✅ | server-genereret | UUID | System | — |
| `productId` | `string` | ✅ | parent | FK → product | System | — |
| `day` | `number` | ✅ | beregnet | ≥ 1 (ordinal nr. i produktets dag-spænd) | Derived | — |
| `date` | `string` (ISO `yyyy-mm-dd`) | ✅ | parent.startDate | Lovligt ISO, inden for `product.startDate..endDate` | Formand | → vognmand, → fabrik, → udfoersel-dagsoverblik |
| `tonsPlanned` | `number` | ✅ | 0 | ≥ 0, heltal, ≤ resterende tons på produkt | Formand | → vognmand (kapacitet) |
| `morgenTons` | `number \| undefined` | ❌ | `undefined` | ≥ 0, heltal, typisk ≤ `tonsPlanned` (advarsel ikke blocker) | Formand | → fabrik (faktisk bestilling), → udfoersel-dagsoverblik (default for "faktisk udlagt") |
| `cancelled` | `boolean` | ✅ | `false` | — | Formand | → vognmand, → fabrik |
| `cancelReason` | `AflysningsAarsag \| undefined` | ❌ | `undefined` | Kun hvis `cancelled === true`. Enum: `'regn' \| 'frost' \| 'underlag' \| 'andet'` | Formand | → fabrik (info) |
| `samlesPaaEnBil` | `boolean` | ✅ | `false` | — | Formand | → fabrik, → vognmand, → chauffør (multi-produkt-loading-flow) |
| `weatherActive` | `boolean` | ✅ | `false` | — | Formand | → fabrik, → vognmand (info — kan påvirke "minus regn"-fradrag) |

**Beregnet/derived state (ikke gemt på DayPlan, kun i UI):**

| Felt | Type | Beregnes som |
|---|---|---|
| `isSent` | `boolean` | `sentDayIds.has(day.id)` — flyttes til Supabase `transport_orders` med `status === 'bekraeftet' \| 'afventer'` |
| `pillKind` | `'sendt' \| 'aflyst' \| 'afventer'` | `cancelled` → `'aflyst'`; `isSent` → `'sendt'`; ellers `'afventer'` |
| `afventerLabel` | `string` | `morgenTons == null` → `'Indtast morgen'`; ellers `'Klar til afsendelse'` |

**Supabase mapping (TODO):**
```sql
-- TODO: Erstat med Supabase når klar
day_plans (
  id uuid pk,
  product_id uuid fk,
  date date not null,
  tons_planned int not null default 0,
  morgen_tons int null,
  cancelled boolean not null default false,
  cancel_reason text check (cancel_reason in ('regn','frost','underlag','andet')) null,
  samles_paa_en_bil boolean not null default false,
  weather_active boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
)
```

---

#### Type: `EkstraBestilling`

> Drip-bestilling oprettet løbende på dagen ud over morgen-bestillingen. Persisteret pr. ekstra-ordre.

| Felt | Type | Required | Default | Validation | Kilde | Cross-app |
|---|---|---|---|---|---|---|
| `id` | `string` | ✅ | server-genereret | UUID | System | — |
| `orderId` | `string` | ✅ | parent | FK → order | System | — |
| `date` | `string` (ISO) | ✅ | `selectedPlanDate` | Lovligt ISO, samme dag som morgen-bestilling | Formand | → fabrik, → vognmand |
| `productId` | `string` | ✅ (ved send) | `''` (placeholder) | Skal være sat før `sent`-kald | Formand | → fabrik |
| `tons` | `number` | ✅ | 0 | > 0 ved `sent` (validation gate) | Formand | → fabrik |
| `samlesPaaEnBil` | `boolean` | ✅ | `false` | — | Formand | → fabrik, → vognmand, → chauffør |
| `puljelaes` | `boolean` | ✅ | `false` | Data-flag bevaret for vejeseddel-kompatibilitet — IKKE vist i UI. **Spørgsmål B6: Beholdes på Supabase eller dropper vi det helt?** | System | → vejesedler (afregning) |
| `multilaes` | `boolean` | ✅ | `false` | Data-flag bevaret for vejeseddel-kompatibilitet — IKKE vist i UI. **Spørgsmål B6: Beholdes på Supabase eller dropper vi det helt?** | System | → vejesedler (afregning) |
| `andreOrdrer` | `string[]` | ✅ | `[]` | Cross-ordre fordeling — pt. tomt array. **Spørgsmål B7: Hører dette på `EkstraBestilling` eller på `Samleordre`?** | Derived/Formand | → afregning |
| `sent` | `boolean` | ✅ | `false` | — | System (sættes ved Send til fabrik) | → fabrik |

**Supabase mapping (TODO):**
```sql
-- TODO: Erstat med Supabase når klar
ekstra_bestillinger (
  id uuid pk,
  order_id uuid fk,
  product_id uuid fk null,            -- nullable indtil productId er valgt
  date date not null,
  tons int not null default 0,
  samles_paa_en_bil boolean not null default false,
  puljelaes boolean not null default false,  -- afventer B6
  multilaes boolean not null default false,  -- afventer B6
  sent boolean not null default false,
  sent_at timestamptz null,
  created_at timestamptz default now()
)
```

---

#### Type: `TransportOrder` (UI-derived per produkt+dag — sendt til fabrik)

> Repræsenterer afsendt bestilling. UI læser status via `sentDayIds: Set<string>` i prototypen, men i produktion er det en row i Supabase.

| Felt | Type | Required | Default | Validation | Kilde | Cross-app |
|---|---|---|---|---|---|---|
| `id` | `string` | ✅ | server-genereret | UUID | System | — |
| `dayPlanId` | `string \| null` | conditional | — | Required for morgen-bestilling; null for ekstra-bestilling | System | — |
| `ekstraBestillingId` | `string \| null` | conditional | — | Required for ekstra-bestilling; null for morgen | System | — |
| `orderId` | `string` | ✅ | parent | FK → order | System | — |
| `date` | `string` (ISO) | ✅ | — | Lovligt ISO | Derived | → fabrik, → vognmand, → udfoersel-dagsoverblik |
| `kind` | `'morgen' \| 'ekstra'` | ✅ | — | — | Derived | — |
| `tons` | `number` | ✅ | — | `morgenTons` for kind='morgen', `tons` for kind='ekstra'. > 0 | Derived | → fabrik |
| `productId` | `string` | ✅ | — | FK → product | Derived | → fabrik |
| `status` | `TransportOrderStatus` | ✅ | `'afventer'` | Enum: `'afventer' \| 'bekraeftet'` (se STATUS_VOKABULAR.md §5) | System | → vognmand, → fabrik, → udfoersel-dagsoverblik |
| `kommentar` | `string \| null` | ❌ | `null` | Per-DAG kommentar (delt for alle bestillinger sendt samme batch). Max 500 tegn | Formand | → fabrik |
| `sentAt` | `string` (ISO 8601 m. TZ) | ✅ | server-genereret | Tidspunkt for afsendelse | System | → fabrik, → vognmand |
| `confirmedAt` | `string \| null` | ❌ | `null` | Sættes når fabrik/vognmand bekræfter | System | ← fabrik |

> **Bemærk:** Prototypen bruger `sentDayIds: Set<string>` og `sentKommentarer: Record<date, string>` som UI-state. I produktion bliver det rækker i `transport_orders` med eksplicit `status` + `kommentar`. **Vigtig refactor-note for architect:** Hooken må eksponere `isSent(dayId)`/`statusFor(dayId)` queries — ikke selve Set'en.

---

#### Type: `AsfaltKoerselDag` (per ordre, per dag) — første-læs + interval-model (LÅST 2026-05-26)

> Asfalt-kørselsbestilling der sendes til vognmand. En row per dag per ordre. Vognmand returnerer placerede biler i `confirmed_vehicles[]` med per-bil læs-nummer + mødetid fabrik (tilbageregnet fra første-læs + interval + GPS-drive-time).
> **Cross-app:** Formand → Vognmand → Chauffør (se FUNCTIONAL_FLOWS Flow 1).

| Felt | Type | Required | Default | Validation | Kilde | Cross-app |
|---|---|---|---|---|---|---|
| `orderId` | `string` | ✅ | parent | FK → order | System | — |
| `date` | `string` (ISO) | ✅ | — | Lovligt ISO | Formand | → vognmand, → fabrik, → chauffør |
| `bestilte_biler` | `number` | ✅ | 0 | ≥ 0, heltal | Formand | → vognmand |
| `biler` | `BilOenske[]` | ✅ | `[]` | Ønske-liste — `bestilte_biler`-stepperen udfoldes til individuelle biler ved send, hver med unikt `bil_ordre_nr` (`<ordrenr>-DDMMYY-NN`). Vognmand behandler hver bil som separat ordre | Formand (genereret ved send) | → vognmand, → fabrik |
| `foerste_laes_udlaegning_tid` | `string` (HH:MM) | ✅ | — | Lovligt HH:MM | Formand | → vognmand, → fabrik (Trin 5b), → chauffør |
| `interval_minutter_mellem_laes` | `number` | ✅ | — | > 0, heltal, typisk 12-20 | Formand | → vognmand (per-bil ankomst-tid), → fabrik (per-bil pickup), → chauffør (per-læs mødetid) |
| `kommentar_til_chauffoer` | `string \| null` | ❌ | `null` | Max 500 tegn | Formand | → chauffør (Flow 1 Trin 8) |
| `egen_bil` | `boolean` | ✅ | `false` | Hvis `true`: vognmand-flow springes over (se Flow 1 Variant) | Formand | → chauffør (direkte) |
| `bekraeftet_af_vognmand` | `boolean` | ✅ | `false` | Sættes når vognmand bekræfter (Trin 5) | Vognmand | → formand (badge), → fabrik |
| `aendret_af_formand` | `boolean` | ✅ | `false` | Markerer ændring efter vognmand-bekræftelse | Formand | → vognmand (gul status) |
| `confirmed_vehicles` | `ConfirmedVehicle[]` | ✅ | `[]` | Per-bil retur-data fra vognmand (se type nedenfor) | Vognmand | → formand, → chauffør, → fabrik |

#### Type: `ConfirmedVehicle` (per placeret bil i en asfalt-kørsel)

> Returdata fra vognmand til formand når bil placeres i drop-zone. Hver chauffør får KUN sin egen row sendt til chauffør-appen.

| Felt | Type | Required | Default | Validation | Kilde | Cross-app |
|---|---|---|---|---|---|---|
| `bil_ordre_nr` | `string` | ✅ | — | `<ordrenr>-DDMMYY-NN` — matcher ønske-bilen (`AsfaltKoerselDag.biler[].bil_ordre_nr`) så bekræftet bil kan kobles til oprindeligt ønske | Genereret ved send (formand-backend), bæres retur af vognmand | → formand, → chauffør, → fabrik |
| `reg_nr` | `string` | ✅ | — | Gyldig nummerplade (DK-format) | Vognmand | → formand, → chauffør, → fabrik |
| `chauffoer_navn` | `string` | ✅ | — | Fulde navn | Vognmand | → formand, → fabrik |
| `chauffoer_tlf` | `string` | ✅ | — | DK mobil (8 cifre, +45 valgfri) | Vognmand | → formand (ring direkte) |
| `bil_type` | `string` | ✅ | — | Fx "6-aks", "Egen bil" | Vognmand | → formand |
| `laes_nummer` | `number` | ✅ | — | ≥ 1, heltal. Bestemt af drop-rækkefølge i vognmand's disponering. Omberegnes hvis en bil fjernes | Vognmand (derived: array-index + 1) | → formand, → chauffør ("Du er 2. læs"), → fabrik |
| `ankomst_plads_tid` | `string` (HH:MM) | ✅ | — | Beregnet: `foerste_laes_udlaegning_tid + (laes_nummer−1) × interval_minutter_mellem_laes` | Derived | → formand, → fabrik |
| `moedetid_fabrik` | `string` (HH:MM) | ✅ | — | Beregnet: `ankomst_plads_tid − orders.factory.driveTimeMinutes` | Derived | → formand, → chauffør (HOVED-INFO), → fabrik |
| `sms_status` | `ChauffoerSmsStatus` | ✅ | `'ikke_sendt'` | Enum (STATUS_VOKABULAR #13): `ikke_sendt`/`sendt`/`aendret_siden_afsendelse`. Per chauffør-aggregeret i backend (nøgle: `chauffoer_tlf`) — én dags-SMS pr. chauffør | Formand (send-handling) eller auto når plan klar | → chauffør (deep-link distribution, FF Trin 7b/8) |

**Supabase mapping (TODO):**
```sql
-- TODO: Erstat med Supabase når klar
asfalt_koersel (
  id uuid pk,
  order_id uuid fk,
  date date not null,
  bestilte_biler int not null default 0,
  foerste_laes_udlaegning_tid time not null,
  interval_minutter_mellem_laes int not null,
  kommentar_til_chauffoer text null,
  egen_bil boolean not null default false,
  bekraeftet_af_vognmand boolean not null default false,
  aendret_af_formand boolean not null default false,
  created_at timestamptz default now(),
  unique (order_id, date)
);

-- Ønske-liste: én row pr. bestilt bil (bestilte_biler-stepperen udfoldet)
bil_oenske (
  id uuid pk,
  asfalt_koersel_id uuid fk,
  bil_ordre_nr text not null,   -- <ordrenr>-DDMMYY-NN, unikt pr. bil pr. dag
  bil_type text not null,
  ankomst_plads_tid time not null,
  moedetid_fabrik time not null,
  egen_bil boolean not null default false,
  created_at timestamptz default now(),
  unique (asfalt_koersel_id, bil_ordre_nr)
);

confirmed_vehicles (
  id uuid pk,
  asfalt_koersel_id uuid fk,
  bil_ordre_nr text not null,   -- matcher bil_oenske.bil_ordre_nr (ønske ↔ bekræftet)
  reg_nr text not null,
  chauffoer_navn text not null,
  chauffoer_tlf text not null,
  bil_type text not null,
  laes_nummer int not null check (laes_nummer >= 1),
  ankomst_plads_tid time not null,
  moedetid_fabrik time not null,
  sms_status text not null default 'ikke_sendt'
    check (sms_status in ('ikke_sendt','sendt','aendret_siden_afsendelse')),
  created_at timestamptz default now(),
  unique (asfalt_koersel_id, laes_nummer)
);
```

**Supabase mapping (TODO):**
```sql
-- TODO: Erstat med Supabase når klar
transport_orders (
  id uuid pk,
  order_id uuid fk,
  day_plan_id uuid fk null,
  ekstra_bestilling_id uuid fk null,
  date date not null,
  kind text check (kind in ('morgen','ekstra')) not null,
  tons int not null,
  product_id uuid fk not null,
  status text check (status in ('afventer','bekraeftet')) not null default 'afventer',
  kommentar text null,
  sent_at timestamptz not null,
  confirmed_at timestamptz null,
  check (
    (kind = 'morgen' and day_plan_id is not null and ekstra_bestilling_id is null)
    or
    (kind = 'ekstra' and ekstra_bestilling_id is not null and day_plan_id is null)
  )
)
```

---

#### Komponent: `AsfaltbestillingSection` (Container)

**Ejer state via hooks** — importerer `useAsfaltbestilling` + `useEkstraBestilling`. Modtager kun ordre-context som props udefra.

**Props ind (fra parent — OrdrePlanScreen):**

| Felt | Type | Required | Beskrivelse |
|---|---|---|---|
| `orderId` | `string` | ✅ | Identificerer ordren (driver hook-queries) |
| `isSamleordreMode` | `boolean` | ✅ | Aktivér samleordre-visning |
| `samleordreCtx` | `SamleordreContext \| null` | conditional | Required hvis `isSamleordreMode`. Definerer ordre-tags på produktbokse |
| `activeProductId` | `string` | ✅ | Driver fokus-styling — controlled fra parent (deles med Spec-grid) |
| `onActiveProductIdChange` | `(id: string) => void` | ✅ | Callback når bruger klikker produkt-header |
| `selectedPlanDate` | `string` (ISO) | ✅ | Den valgte dato i dato-pille-rækken — controlled fra parent |
| `onSelectedPlanDateChange` | `(date: string) => void` | ✅ | Callback ved dato-skift |

> **Designvalg:** `activeProductId` og `selectedPlanDate` er **controlled fra parent** fordi andre sektioner (Ordredetaljer-spec-grid, Kørsel) også reagerer på dem. Container ejer ikke disse — den propagerer kun.

**Lokal container-state (kun visuelt — ikke persisteret):**
- `cancellingDayId: string | null` — hvilken dag er i "vælg aflysnings-årsag"-mode
- `showConfirmSend: boolean` — modal-visibility

**Children rendret:**
1. `<DatePillsRow>` med dato-piller
2. Empty-state-besked `"Ingen produkter denne dag"` (når `productsForSelectedDate.length === 0`)
3. `<ProductBoxV2>` × n
4. `<StatusPill>` under hver ProductBoxV2
5. `<EkstraBestillingBox>` × m
6. `<StatusPill>` under hver EkstraBestillingBox
7. `<EkstraBestillingCTA>` (dashed-border "+ Ekstra"-knap)
8. `<SendTilFabrikCTA>` (gul "Send til fabrik"-knap m. kommentar-tooltip)
9. `<SendBekraeftelsesModal>` (conditional på `showConfirmSend`)

---

#### Komponent: `DatePillsRow` (Presenter)

**Props ind:**

| Felt | Type | Required | Default | Validation | Beskrivelse |
|---|---|---|---|---|---|
| `dates` | `string[]` (ISO) | ✅ | — | Array af lovlige ISO-datoer, sorteret ASC | Datoer der har mindst ét ikke-aflyst produkt |
| `selectedDate` | `string` (ISO) | ✅ | — | Skal være i `dates` | Den aktuelt valgte dato |
| `sentStateByDate` | `Record<string, 'all-sent' \| 'partial' \| 'none'>` | ✅ | `{}` | — | Per-dato status — om alle/nogen/ingen produkter er sendt |

**Callbacks ud:**

| Callback | Signatur | Beskrivelse |
|---|---|---|
| `onSelect` | `(date: string) => void` | Bruger klikker en pille |

**Display:**
- Hver pille viser `formatLongDate(date)` — fx `16. marts 2026`
- `aria-label` = `formatLongDate(date)` + (hvis sendt) `" (afsendt)"`
- 3 visuelle tilstande: `selected` (deep-teal bg), `all-sent` (good/grøn bg + check-ikon), `default` (hvid m. border)

> **Empty state** flyttes ud af denne komponent (Fase A-beslutning). Container håndterer `productsForSelectedDate.length === 0`-tilfældet selv.

---

#### Komponent: `ProductBoxV2` (Presenter — 7 visual modes)

**Props ind:**

| Felt | Type | Required | Default | Validation | Beskrivelse |
|---|---|---|---|---|---|
| `product` | `MockProduct` | ✅ | — | — | Hele produkt-objektet (læser `recipeName`, `recipeCode`, `thicknessMm`) |
| `day` | `DayPlan` | ✅ | — | — | Hele dag-objektet (læser `tonsPlanned`, `morgenTons`, `cancelled`, `cancelReason`, `samlesPaaEnBil`, `weatherActive`) |
| `isFocused` | `boolean` | ✅ | — | — | Visuel fokus-ring (dark-teal border) |
| `isSelectingReason` | `boolean` | ✅ | — | — | Visning af aflysnings-årsags-picker |
| `isSent` | `boolean` | ✅ | — | — | Låser Forventet + Morgen tons + checkbox (read-only) |
| `ordreTagLabels` | `string[] \| undefined` | ❌ | `undefined` | Hver label max 30 tegn | Samleordre: ordre-tags vist under produkt-navn |

**Callbacks ud:**

| Callback | Signatur | Beskrivelse |
|---|---|---|
| `onFocus` | `() => void` | Bruger klikker produkt-header (driver Spec-grid) |
| `onUpdateTons` | `(v: number) => void` | Forventet tons ændret. v ≥ 0, heltal |
| `onUpdateMorgenTons` | `(v: number \| undefined) => void` | Morgen tons ændret. `undefined` = ryddet |
| `onToggleWeather` | `(active: boolean) => void` | Vejr-toggle skiftet (A4-beslutning: bobler ud, ikke local) |
| `onToggleSamlesPaaEnBil` | `(samles: boolean) => void` | "Samles på en bil"-checkbox skiftet (A5: `day.samlesPaaEnBil`) |
| `onCancel` | `() => void` | "X" øverst højre klikket — åbn årsags-picker |
| `onAbortCancel` | `() => void` | Luk årsags-picker uden at aflyse |
| `onConfirmCancel` | `(reason: AflysningsAarsag) => void` | Årsag valgt — bekræft aflysning |
| `onRestore` | `() => void` | "Fortryd" på aflyst-tilstand klikket |

**7 visual modes:**
1. **Aflyst** (`day.cancelled`) — opacity-60, bad-border, recipe-name + "Aflyst" + årsag + "Fortryd"-link
2. **Reason-picker** (`isSelectingReason`) — 4 årsags-knapper + X-fortryd
3. **Default** (alle andre) — hvid kort med 7 sub-elementer:
   - X-aflys-knap (top right)
   - Vejr-toggle (bottom right, z-10) — 2 modes: inactive (`#F5F5F5`) / active (`bg-dark-teal`)
   - Produkt-header (klikbar) m. evt. ordre-tags
   - Forventet tons input (locked når `isSent`)
   - Morgen tons input m. 2 modes: empty (rød-bg) / udfyldt (grøn-bg). Locked når `isSent`
   - "Samles på en bil"-checkbox (locked når `isSent`)
4. **Sent + aktiv** (`isSent === true`) — alle inputs locked, dropper sub-tilstand af mode 3

> **Validation rules:**
> - `tonsPlanned` ≥ 0 (clamped via `Math.max(0, ...)`)
> - `morgenTons` ≥ 0 eller `undefined`
> - Ingen submit-validering på selve boksen — den lever på `SendTilFabrikCTA`/`SendBekraeftelsesModal`

---

#### Komponent: `EkstraBestillingBox` (Presenter)

**Props ind:**

| Felt | Type | Required | Default | Validation | Beskrivelse |
|---|---|---|---|---|---|
| `ekstra` | `EkstraBestilling` | ✅ | — | — | Hele ekstra-objektet |
| `products` | `MockProduct[]` | ✅ | — | Min. 1 element | Til produkt-dropdown |

**Callbacks ud:**

| Callback | Signatur | Beskrivelse |
|---|---|---|
| `onUpdate` | `(patch: Partial<EkstraBestilling>) => void` | Partial-update af felt (tons, productId, samlesPaaEnBil) |
| `onRemove` | `() => void` | Slet ekstra-bestilling |

**2 visual modes:**
1. **Sendt** (`ekstra.sent`) — read-only m. E-badge, produkt-navn, tons + evt. "Samles på en bil"-indikator
2. **Default** — X-slet, E-badge, tons-input, produkt-dropdown, "Samles på en bil"-checkbox

> **Validation rules:**
> - `tons` ≥ 0 (clamped via `Math.max`)
> - `productId` må være `''` (placeholder "Vælg") indtil send-trigger; så er det validation-blocker
> - I "sent"-mode er alt locked

---

#### Komponent: `StatusPill` (Presenter)

**Props ind:**

| Felt | Type | Required | Default | Validation | Beskrivelse |
|---|---|---|---|---|---|
| `kind` | `'sendt' \| 'aflyst' \| 'afventer'` | ✅ | — | Enum | UI-derived state |
| `afventerLabel` | `string \| undefined` | ❌ | `'Afventer'` | — | Vises kun ved kind='afventer'. Typiske værdier: `'Indtast morgen'`, `'Klar til afsendelse'`, `'Indtast tons'` |

**Callbacks ud:** Ingen — pure visual.

**3 visual modes:**
1. `sendt` — `bg-good-bg`, dot + "Sendt til fabrik"
2. `aflyst` — `bg-bad/10`, "Aflyst"
3. `afventer` — dashed border, dynamisk label

> **Vigtigt:** `kind` er **ikke** en persisteret enum. Den beregnes per render i container fra `day.cancelled` + `sentDayIds` + `morgenTons`. Bruges ikke i Supabase.

---

#### Komponent: `EkstraBestillingCTA` (Presenter — NY ift. prototype)

> Ekstrakteret fra inline-JSX L1565-L1580 — den dashed-border "+ Ekstra"-boks.

**Props ind:**

| Felt | Type | Required | Default | Validation | Beskrivelse |
|---|---|---|---|---|---|
| (ingen) | — | — | — | — | Komponenten har ingen reelle props. Kunne tage en `disabled?: boolean` hvis vi vil deaktivere når dagen er fuldt aflyst — **B8** |

**Callbacks ud:**

| Callback | Signatur | Beskrivelse |
|---|---|---|
| `onClick` | `() => void` | Opretter ny tom ekstra-bestilling |

> **Højde-alignment:** Skal matche ProductBoxV2's højde (160px × min-h-172px) + tom 24px placeholder under (matcher StatusPill-højden).

---

#### Komponent: `SendTilFabrikCTA` (Presenter)

**Props ind:**

| Felt | Type | Required | Default | Validation | Beskrivelse |
|---|---|---|---|---|---|
| `disabled` | `boolean` | ✅ | — | — | True når intet er klar til at sende |
| `totalIkkeSendt` | `number` | ✅ | — | ≥ 0 | Tæller til knap-tekst ("3 bestillinger klar") |
| `sentKommentar` | `string \| null` | ❌ | `null` | Max 500 tegn | Kommentar gemt fra forrige send (vist som tooltip under knap) |

**Callbacks ud:**

| Callback | Signatur | Beskrivelse |
|---|---|---|
| `onClick` | `() => void` | Åbn `SendBekraeftelsesModal` (sætter `showConfirmSend=true` i container) |

> **Bemærk:** Selve "Send"-logikken sker ikke her — den udløses af modal'ens "Send til fabrik"-knap. CTA'ens job er at åbne modalen + vise tooltip med tidligere kommentar.

---

#### Komponent: `SendBekraeftelsesModal` (Presenter — NY som egen komponent)

> Ekstrakt af L2480-L2545. Egen komponent med lokal kommentar-state (ikke bobler hver tasten op til container).

**Props ind:**

| Felt | Type | Required | Default | Validation | Beskrivelse |
|---|---|---|---|---|---|
| `open` | `boolean` | ✅ | — | — | Modal-visibility |

**Callbacks ud:**

| Callback | Signatur | Beskrivelse |
|---|---|---|
| `onCancel` | `() => void` | Bruger trykker "Annullér" eller backdrop |
| `onConfirm` | `(kommentar: string) => void` | Bruger trykker "Send til fabrik". `kommentar` er trimmed, kan være `''` |

**Lokal state (ikke prop):**
- `kommentar: string` — local useState; reset til `''` ved open/close

**Validation rules:**
- `kommentar.length ≤ 500` (UI-soft-limit; backend håndhæver)
- Trim før `onConfirm` kaldes
- Tom string er gyldigt (= ingen kommentar gemt)

---

#### Hook: `useAsfaltbestilling(orderId)`

**Returnerer:**

| Felt | Type | Beskrivelse |
|---|---|---|
| `products` | `MockProduct[]` | Alle produkter på ordren (inkl. deres `days[]`) |
| `activeProductId` | `string` | Aktuelt fokuseret produkt (drives også af Spec-grid) |
| `setActiveProductId` | `(id: string) => void` | Manuelt skift af fokus |
| `selectedPlanDate` | `string` (ISO) | Den aktuelt valgte dato |
| `setSelectedPlanDate` | `(date: string) => void` | Manuelt skift af dato |
| `planDays` | `string[]` (ISO) | Alle datoer i ordrens dag-spænd (inkl. dage uden produkter) — beregnet |
| `productsForSelectedDate` | `Array<{ product: MockProduct, day: DayPlan }>` | Filtreret til valgt dato |
| `orderStartDate` | `string` (ISO) | Min af alle produkters startDate — derived |
| `orderEndDate` | `string` (ISO) | Max af alle produkters endDate — derived |
| `sentStateByDate` | `Record<string, 'all-sent' \| 'partial' \| 'none'>` | Per-dato afsendelses-status — derived |
| `isDaySent` | `(dayId: string) => boolean` | Query: er denne dag sendt? |
| `updateTons` | `(productId, dayId, tons: number) => void` | Action: opdater tonsPlanned |
| `updateMorgenTons` | `(productId, dayId, tons: number \| undefined) => void` | Action: opdater morgenTons |
| `cancelDay` | `(productId, dayId, reason: AflysningsAarsag) => void` | Action: aflys dag |
| `restoreDay` | `(productId, dayId) => void` | Action: fortryd aflysning |
| `toggleWeather` | `(productId, dayId, active: boolean) => void` | Action: A4 — sæt `day.weatherActive` |
| `toggleSamlesPaaEnBil` | `(productId, dayId, samles: boolean) => void` | Action: A5 — sæt `day.samlesPaaEnBil` |
| `sendAlleForSelectedDate` | `(kommentar: string) => Promise<void>` | Action: send alle ikke-sendte morgen-bestillinger + ikke-sendte ekstra-bestillinger for `selectedPlanDate`. Persisterer `kommentar` på dagens transport_orders |
| `kommentarForDate` | `(date: string) => string \| null` | Query: returnér gemt kommentar for sendt dato |
| `loading` | `boolean` | Standard data-hook contract |
| `error` | `Error \| null` | Standard data-hook contract |

**Side-effects (intern):**
- Auto-skift af `activeProductId` når current ikke matcher nogen produkt på `selectedPlanDate` (jf. Fase A-beslutning: lever HER, ikke i container)
- Write-queue ved offline (per `project_offline_strategi`)

**Cross-app writes** udløst af `sendAlleForSelectedDate`:
- → fabrik (transport_orders rækker)
- → vognmand (afventer disponering)
- → udfoersel-dagsoverblik (default for "faktisk udlagt"-feltet)

---

#### Hook: `useEkstraBestilling(orderId, selectedDate)`

**Returnerer:**

| Felt | Type | Beskrivelse |
|---|---|---|
| `ekstraForSelectedDate` | `EkstraBestilling[]` | Filtreret til `selectedDate` |
| `addEkstra` | `() => void` | Action: opret tom ekstra med default-values |
| `updateEkstra` | `(id: string, patch: Partial<EkstraBestilling>) => void` | Action: partial update |
| `removeEkstra` | `(id: string) => void` | Action: slet |
| `isEkstraSent` | `(id: string) => boolean` | Query: er denne sendt? |
| `loading` | `boolean` | Standard data-hook contract |
| `error` | `Error \| null` | Standard data-hook contract |

> **Bemærk:** `useEkstraBestilling.sendAll` findes IKKE som separat action. `useAsfaltbestilling.sendAlleForSelectedDate` håndterer både morgen- og ekstra-bestillinger atomisk (samme batch, samme kommentar).

> **Spørgsmål B9:** Skal de to hooks slås sammen til én `useAsfaltbestilling`-hook? Argumenter for: send-action er på tværs af morgen + ekstra. Argumenter mod: scope-separation, ekstra-bestilling kan testes isoleret.

---

### Status-enum mappings (Asfaltbestilling)

| Prototype-string | Persisteret enum | Notes |
|---|---|---|
| `CancelReason = 'regn' \| 'frost' \| 'underlag' \| 'andet'` | `AflysningsAarsag` (STATUS_VOKABULAR §8) | 1:1 match, ingen refactor nødvendig |
| StatusPill `kind = 'sendt' \| 'aflyst' \| 'afventer'` | UI-derived — IKKE persisteret | Beregnes per render |
| `transport_order.status = 'afventer' \| 'bekraeftet'` | `TransportOrderStatus` (STATUS_VOKABULAR §5) | Bruges af vognmand/fabrik til at vise om bestillingen er bekræftet |
| `product.state` (implicit i prototype) | `ProduktTilstand` (STATUS_VOKABULAR §7) | Refactor: i shared/types skal `Product.state` være `'afventer' \| 'aktiv' \| 'afsluttet'` (eksisterer ikke på MockProduct i prototype — afventer Supabase-mapping) |

---

### Datofelter (Asfaltbestilling) — storage vs. display

| Felt | Storage | Display-helper |
|---|---|---|
| `DayPlan.date` | ISO `yyyy-mm-dd` | `formatLongDate` i dato-piller |
| `EkstraBestilling.date` | ISO `yyyy-mm-dd` | (vises ikke direkte — implicit fra container's `selectedPlanDate`) |
| `TransportOrder.date` | ISO `yyyy-mm-dd` | `formatLongDate` (vises i fabrik-kø + vognmand-disponering) |
| `TransportOrder.sentAt` | ISO 8601 + TZ (`2026-03-16T07:42:00+01:00`) | `formatDateTime` for audit-trail |
| `TransportOrder.confirmedAt` | ISO 8601 + TZ | `formatDateTime` |
| `product.startDate`, `product.endDate` | ISO `yyyy-mm-dd` | `formatDateRange` i Spec-grid |

> **Ingen af felterne bruger ugedag-on i denne sektion** — dato-piller er allerede dag-orienterede pga. pille-format. **Spørgsmål B10:** Skal pillerne vise ugedag-prefix (fx `mandag 16. marts`)? DATOFORMAT siger "Planlægnings-view = ugedag PÅ", men prototypen viser uden. Beslut: Følg DATOFORMAT-reglen (ugedag PÅ) eller behold prototype-form?

---

### Cross-app effekter — sammenfatning

| Trigger | Modtager | Hvad sendes |
|---|---|---|
| `sendAlleForSelectedDate(kommentar)` | fabrik | Per produkt+dag: `productId`, `recipeCode`, `recipeName`, `tons`, `date`, `factory.code`, `kommentar`, `samlesPaaEnBil`, `weatherActive` |
| `sendAlleForSelectedDate(kommentar)` | vognmand | Aggregeret per dato: `date`, `factory`, biltype-behov (afventer kørsels-beregner — særskilt sektion) |
| `cancelDay(productId, dayId, reason)` | fabrik + vognmand | Notification + `cancelReason` |
| `toggleSamlesPaaEnBil` | chauffør (via vognmand → chauffør-app) | Multi-produkt-loading-flow-indikator |
| `toggleWeather` | fabrik + vognmand | "Minus regn"-status — kan påvirke afregning/leverings-prioritet |
| `morgenTons`-update (efter send) | — | **Locked** — kun via telefon til fabrik. Ingen automatisk re-send. |

> Cross-app flows skal opdateres i `FUNCTIONAL_FLOWS.md` af architect i dev-fasen. Interview-output (denne fil) er kilde.

---

### Sektion: Planlægning — Produktoversigt

| Felt | Format | Kilde |
|---|---|---|
| Mængde | Tal (tons) | PLAN |
| Receptkode | Tekst | PLAN |
| Produktnavn | Tekst | PLAN |
| Tykkelse | Tal (mm) | PLAN |
| Areal | Tal (m²) | PLAN |
| Fabrik — navn | Tekst | PLAN |
| Fabrik — køretid | Tal (min) | PLAN |
| Aktivitetsbeskrivelse | Tekst (fx `GAB I at levere og udlægge, 80mm`) | PLAN |
| Krav til samlinger | Tekst (fx `Klæbet` / `Ikke klæbet`) | PLAN |
| Ekstra temperaturmålinger | Boolean (Ja/Nej) | PLAN |
| Entreprisekontrol | Enum: `1` / `2` | PLAN |

**Entreprisekontrol — adfærd i appen:**

| Værdi | Konsekvens |
|---|---|
| `1` | A3 og A4 (kvalitetskontrol) vises under Udførelse → Kvalitetssikring |
| `2` | A3, A4 **og** MKS vises under Udførelse → Kvalitetssikring |

> Formularer A3, A4, MKS bygges i en fremtidig sprint. Entreprisekontrol-værdien læses fra PLAN og gemmes på ordren i Supabase, så Udførelse-siden kan reagere på den dynamisk.

---

### Sektion: Dagfordeling

**Per dag:**

| Felt | Format | Kilde |
|---|---|---|
| Dato | Dato | Beregnet (fra startdato) |
| Ugedag | Tekst | Beregnet |
| Tons planlagt | Tal (tons) | Formand |
| Morgen tons | Tal (tons) | Formand |
| Aflyst | Boolean | Formand |
| Aflysningsårsag | Enum: Regn / Frost / Underlag / Andet | Formand |
| Bestilt til fabrik | Boolean | Formand |

**Aggregeret:**

| Felt | Format | Kilde |
|---|---|---|
| Tons fordelt i alt | Tal (tons) | Beregnet |
| Resterende tons | Tal (tons) | Beregnet |
| Antal dage med morgen tons bekræftet | Tal | Beregnet |

---

### Sektion: Dokumentation

| Felt | Format | Kilde |
|---|---|---|
| Opmåling — fil | PDF / billede | Formand upload |
| Opmåling — filnavn | Tekst | Formand upload |
| Opmåling — filstørrelse | Bytes | Beregnet |
| Billedmateriale — billeder | Filer (image/*) | Formand (kamera / upload) |
| Note — forfatter initialer | Tekst (fx `OJ`) | System (bruger) |
| Note — forfatter navn | Tekst | System (bruger) |
| Note — tidsstempel | ISO 8601 | System |
| Note — tekst | Fritekst | Formand |

---

### Sektion: Materiellevering

**Per maskine:**

| Felt | Format | Kilde |
|---|---|---|
| Anlægsnummer | Tekst (fx `5-0034`) | PLAN |
| Beskrivelse | Tekst (fx `HAMM HD10 VT`) | PLAN |
| Transporttype | Enum: Blokvogn / Kran-Bånd / Egen kørsel | PLAN |
| Status | Enum: Planlagt / Ikke planlagt | Formand |
| Udlånt | Boolean | Formand |
| Afhentningsadresse | Tekst | Formand |
| Afhentning — postnr | Tekst | Formand |
| Klar til afhentning | Dato / tid | Formand |
| Leveringsdato | Dato | Formand |
| Fakturaordre | Tekst | Formand |
| Kommentar til vognmand | Fritekst | Formand |
| Afhentningspin — lat/lng | Koordinater | Formand (kort — fremtidig feature) |
| Aflæsningspin — lat/lng | Koordinater | Formand (kort — fremtidig feature) |

**Formand → Vognmand flow (Materiel):**

Sendes per materiel-enhed som separat linje til vognmandens løsning.

| Felt | Format |
|---|---|
| Anlægsnummer | Tekst |
| Beskrivelse | Tekst |
| Afhentningsadresse | Tekst (eller pin-koordinater) |
| Aflæsningsadresse | Tekst (eller pin-koordinater) |
| Klar til afhentning | ISO 8601 |
| Skal være på lokation | ISO 8601 |
| Kommentar | Fritekst |

**Vognmand → Formand (bekræftelse materiel):**

| Felt | Format |
|---|---|
| Bekræftet | Boolean |
| Transport — reg.nr | Tekst |
| Transport — type | Tekst (fx Blokvogn) |
| Chauffør — navn + tlf | Tekst |
| Bekræftet tidspunkt | ISO 8601 |

---

### Sektion: Kørsel (Transportberegner)

**Inputparametre per dag:**

| Felt | Format | Kilde |
|---|---|---|
| Biltype | Enum: 6 Aks / 7 Aks / Forvogn / Forvogn+Kærre / Grab / Sneglebil / Snegl m. kærre / Sideudlægger | Formand |
| Antal biler per type | Tal | Formand |
| Første læs (Grab) | Boolean | Formand |
| Køretid fabrik→plads | Tal (min) | PLAN (driveTimeMinutes) |
| Lastetid | Tal (min) | Formand / standard |
| Aflæssetid | Tal (min) | Formand / standard |
| Interval mellem biler | Tal (min) | Formand / standard |
| Første læs-tidspunkt | Tid (HH:MM) | Formand |
| Seneste læs-tidspunkt | Tid (HH:MM) | Formand |
| Pause — tidspunkt | Tid (HH:MM) | Formand |
| Pause — varighed | Tal (min) | Formand |

**Beregnet output:**

| Felt | Format | Kilde |
|---|---|---|
| Estimeret antal biler | Tal | Beregnet |
| Estimeret tons per tur | Tal (tons) | Beregnet |
| Total kapacitet | Tal (tons) | Beregnet |
| Estimeret sluttid | Tid (HH:MM) | Beregnet |

---

### Sektion: Udførelse — Ekstraarbejde

| Felt | Format | Kilde |
|---|---|---|
| Type | Enum (25 typer — se liste nedenfor) | Formand |
| Beskrivelse | Fritekst per linje | Formand |
| Antal | Tal (stk.) | Formand |

**Typer (dropdown):**
Regulering af fast rendestensrist, Regulering af fast stophane, Regulering af fast Ø 300, Regulering af fast Ø 600 dæksel, Regulering af flydende rist, Regulering af flydende stophane, Regulering af flydende Ø 300 dæksel, Regulering af flydende Ø 600 dæksel, Udskiftning af dæksel excl. brøndgods, Udskiftning af dæksel incl. brøndgods, Udskiftning af rist excl. brøndgods, Udskiftning af rist incl. brøndgods, Ø 300 flydende rendestensrist, Ø 300 overtopstykke (beton) 30/50/100 mm, Ø 325 kombinringe (plast), Ø 475 mellemlægsskiver, Ø 600 dæksel (40t), Ø 600 flydende karm (40t), Ø 600 kombinringe (plast), Ø 600 topringe (beton) h. 30/50/100 mm, Ø 750 mellemlægsskiver

**Adfærd ved gem:** Sendes automatisk som mail til projektleder (Henrik Thor) — TODO: kræver mail-integration eller Supabase trigger

---

### Sektion: Udførelse — Forundersøgelse

| Felt | Format | Kilde |
|---|---|---|
| Underlags type(r) | Multiselect: Asfalt / Grus / Beton / Fræset / Andet | Formand |
| Underlag — fritekst (ved Andet) | Tekst | Formand |
| Tilfredsstillende | Boolean (Ja/Nej) | Formand |
| Årsager | Multiselect: Revner / Sporkørt / Krakeleret / Ujævn / Sætninger / Snavs / Blød / Græs/ukrudt | Formand |
| Aftalt med | Fritekst | Formand |
| Forbehold | Fritekst | PLAN (preudfyldt) + Formand (redigerbar) |
| Billeder | Filer (image/*) | Formand (kamera / upload) |

---

### Gantt-oversigt (Mine opgaver)

**Per ordre:**

| Felt | Format | Kilde |
|---|---|---|
| Ordrenummer | Tekst | PLAN |
| Projektnavn | Tekst | PLAN |
| Ordrestatus | Enum: Aktiv / Planlagt / Afsluttet | PLAN / beregnet |
| Startdato | Dato | PLAN |
| Slutdato | Dato | PLAN |
| Tons total | Tal (tons) | PLAN |
| Tons leveret | Tal (tons) | System (real-time fra chauffør-app) |

---

## Chauffør App

> Kommer — reverse engineering afventer

---

## Vognmand App

> Kommer — reverse engineering afventer

---

---

## Formand → Vognmand flow (Asfalt kørsel)

### Trigger
Formand trykker **"Gem kørsel"** på en given dag i Asfalt kørsel-sektionen (Planlægning-mode).

### Hvad der sker
1. Bestillingen oprettes som en **åben ordre på vognmandens side** — vises i vognmandens liste som "Afventer disponering"
2. Ordren indeholder: dato, fabrik, adresse, biltype(r) + antal, første læs-tidspunkt, interval, kommentar til vognmand
3. Vognmanden **disponerer** — tildeler konkrete biler + chauffører til ordren
4. Når vognmand trykker "Bekræft og send":
   - Bestillingen markeres **"Bekræftet af vognmand"** på formandens side
   - Badge vises på den pågældende dag i **Planlægning → Asfalt kørsel**
   - Den bekræftede bilbestilling (reg.nr, chauffør, tlf, biltype, tons) vises på **Udførelse-siden** under Forundersøgelse-sektionen

### Felter der sendes fra formand → vognmand

| Felt | Format |
|---|---|
| Dato | ISO dato |
| Fabrik | Navn + adresse |
| Udførselssted | Adresse |
| Biltype(r) | Enum + antal per type |
| Første læs | Tid (HH:MM) |
| Interval | Tal (min) |
| Afstand | Tal (km) |
| Kommentar | Fritekst |

### Felter der sendes fra vognmand → formand (bekræftelse)

| Felt | Format |
|---|---|
| Bekræftet | Boolean |
| Biler | Array: reg.nr + chaufførnavn + tlf + biltype |
| Bekræftet tidspunkt | ISO 8601 |

### UI-markering
- **Planlægning → Asfalt kørsel:** Grønt badge "Bekræftet af vognmand" på dagen
- **Udførelse → under Forundersøgelse:** Kort med bekræftede biler (reg.nr, chauffør, tlf)
- **Ikke bekræftet:** Gult "Afventer vognmand"-badge

---

## Noter til IT

- **PLAN-felter:** Læses fra eksisterende PLAN-system via integration (ikke defineret endnu)
- **Formand-felter:** Gemmes i Supabase — skema ikke defineret endnu
- **Billeder/filer:** Kræver Supabase Storage
- **Real-time tons leveret:** Kræver integration med chauffør-appen via Supabase Realtime
- **Beregnede felter:** Beregnes i frontend — kræver ikke backend-lagring

---

## IT-arkitektur plan

### Rækkefølge (ikke afviges)

```
1. Prototype færdig (alle 3 apps)
2. Send DATA_FIELDS.md til Jesper Nielsen → bed om bekræftelse på felter
3. Data-kontrakt aftalt (hvilke felter kan PLAN levere, i hvilket format)
4. Supabase skema designes ud fra bekræftet kontrakt
5. Supabase seedet med rigtige testdata fra PLAN-udtræk
6. Produktionskode skrives (prototype → prod) mod Supabase
7. Go-live
```

### Leveranceopdeling (til eksterne DB-folk)

**Fase 1 — Læse-felter fra PLAN** (eksternt DB-team)
Alle felter markeret med kilde = PLAN i tabellerne ovenfor.
Leveres som API eller dataudtræk i aftalt format.

**Fase 2 — Skrive-felter** (vi bygger selv i Supabase)
Alle felter markeret med kilde = Formand / System / Beregnet.
Uafhængig af fase 1 — kan startes parallelt når skema er aftalt.

### Første skridt mod Jesper Nielsen

Send DATA_FIELDS.md og stil dette spørgsmål:

> "Kan I bekræfte hvilke af disse felter I kan levere fra PLAN, i hvilket format,
> og hvilke felter I ikke har? Vi behøver ikke udtræk endnu — kun en bekræftelse
> på hvad der er tilgængeligt, så vi kan designe databaseskemaet korrekt."

### Typiske dataproblemer at tjekke for

- Datoformat: PLAN bruger måske `YYYYMMDD` — vi forventer ISO 8601
- Tons-definitioner: inkluderer PLAN spild i `tonsTotal`?
- Tomme felter: felter der "altid er udfyldt" i teorien men er tomme i praksis
- Feltnavne: `WO_NR` i PLAN hedder `ordrenummer` hos os — mapping-tabel nødvendig
