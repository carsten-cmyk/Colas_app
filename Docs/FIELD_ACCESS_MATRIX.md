---
title: Field Access Matrix
status: Draft — reverse-engineered fra prototype + interview-output
last_updated: 2026-05-29
scope: Alle 4 roller — formand · vognmand · chauffør · fabrik
sources:
  - .claude/docs/DATA_FIELDS.md (komponent-feltkortlægning)
  - .claude/docs/FUNCTIONAL_FLOWS.md (cross-app stakeholders + writes)
  - .claude/docs/STATUS_VOKABULAR.md (enum-værdier)
  - apps/formand/src/types/order.ts + jobReport.ts + driver.ts
  - apps/vognmand/src/types/vognmand.ts
  - shared/types/*
  - apps/formand/src/mocks/vejesedler.ts + recepter.ts + udlaeggere.ts
  - apps/vognmand/src/mocks/ordrer.ts + biler.ts
---

# Field Access Matrix — Colas Apps

## Hvad denne fil ER

En **omfattende oversigt over alle data-felter** i Colas-løsningen, kategoriseret per rolle (formand, vognmand, chauffør, fabrik) med læse/skrive-rettigheder (R/W/N/—).

Bruges som:
- **Kontrakt-input** til Supabase RLS-policies (row-level security).
- **Kilde** for IT-leverance (hvilken rolle skal levere/modtage hvilke felter).
- **Konsistens-check** mellem prototype-typer og funktionelle flows.

## Hvad denne fil IKKE er

- **Ikke et Supabase-skema** — felter listes konceptuelt; faktisk DB-skema låses i et separat dokument når kontrakt er signed.
- **Ikke en API-spec** — endpoints/format defineres separat.
- **Ikke en UI-spec** — det er ren data-fokus, ikke komponenter.
- **Ikke en mapping mod PLAN** — PLAN-integration har sit eget kontrakt-dokument (afventer Jesper Nielsen).

## Værdier i rolle-kolonnerne

| Symbol | Betyder |
|---|---|
| **W** | Rollen kan **skrive** feltet (har edit-rettighed) |
| **R** | Rollen kan **læse** feltet (read-only) |
| **N** | Felt eksisterer ikke for rollen (ikke synligt) |
| **—** | Ikke relevant for rollen (felt findes konceptuelt, men rollen interagerer ikke med det) |

Rolle-kolonnerne følger dataflow-rækkefølgen: **Formand → Vognmand → Chauffør → Fabrik**.

> **Fabrik-app** er endnu ikke bygget — `Fabrik`-kolonnen reflekterer den planlagte modtager-rolle baseret på Flow 1 Trin 5b, Flow 3, Flow 12, og ABE-2 i FUNCTIONAL_FLOWS.md.

---

## 1. Ordre (overordnet)

> Kerne-entitet — repræsenterer en arbejdsordre fra PLAN. Læses af alle roller; kun PLAN skriver til ordre-kerne-felter.

| Felt | Type | Formand | Vognmand | Chauffør | Fabrik | Note |
|---|---|---|---|---|---|---|
| `id` | UUID | R | R | R | R | System-genereret |
| `orderNumber` / `ordrenr` | string | R | R | R | R | Fra PLAN (fx `1212343`) |
| `customer` | string | R | N | N | N | PLAN — kun synligt i formand-sidebar |
| `projectName` / `titel` | string | R | R | R | R | PLAN |
| `district` / `lokation` | string | R | R | R | R | PLAN |
| `foreman` | string (holdnr) | R | R | — | — | PLAN |
| `contactPM` (projektleder) | Contact | R | — | — | — | PLAN |
| `comments` (forbehold) | string | R/W | — | — | — | PLAN-init + formand-edit |
| `state` / `OrdreTilstand` | `planlagt \| aktiv \| afsluttet` | R | R | R | R | System-beregnet |
| `district` | string | R | R | — | — | PLAN |
| `udforselssted` (adresse + postnr) | string | R | R | R | R | PLAN — vises i sidebar, vognmand-disponering, chauffør-task |
| `tidsvindue` | `aften \| nat \| weekend` | R | R | R (fase 2) | — | PLAN — ikke editable i Colas-apps |
| `factory.id` | string | R | R | R | W (eget id) | PLAN initial; fabrik kan ændres via Flow 13 |
| `factory.code` | string | R | R | R | R | PLAN |
| `factory.name` | string | R | R | R | R | PLAN |
| `factory.driveTimeMinutes` | number | R | R | R | R | Beregnet (Google Distance Matrix), opdateres ved fabrik-skift |
| `factory_change_log[]` | array | R | R | — | — | Audit-trail ved fabrik-skift (Flow 13) |
| `holdpakke.mennesker[]` | array | R/W | — | — | — | PLAN initial; formand kan tilføje (skrives retur til PLAN) |
| `holdpakke.materiel_ids[]` | string[] | R/W | — | — | — | PLAN initial; formand kan tilføje |
| `timeafregning` | `ja \| nej` | R | — | — | — | PLAN (styrer materiel-flow i Flow 2 Trin 7) |
| `jobnummer` | string | R | R | — | — | PLAN |

---

## 2. Produkt + DayPlan (asfaltbestilling-niveau)

> Produkt = recept der skal udlægges. DayPlan = én dag's planlægning per produkt (Asfaltbestilling-sektion).

### Produkt

| Felt | Type | Formand | Vognmand | Chauffør | Fabrik | Note |
|---|---|---|---|---|---|---|
| `id` | UUID | R | R | R | R | System |
| `activityName` | string | R | — | — | — | PLAN (fx "GAB I at levere og udlægge, 80mm") |
| `recipeCode` | string | R | R | R | R | PLAN (fx "82101H") |
| `recipeName` | string | R | R | R | R | PLAN (fx "SMA 11S") |
| `m2` | number | R | — | — | — | PLAN — areal |
| `kgPerM2` | number | R | — | — | — | PLAN (via Recept) |
| `kgPerM3` / `densitet` | number | R | — | — | — | PLAN (via Recept) |
| `thicknessMm` | number | R | — | — | — | PLAN |
| `tonsTotal` | number | R | R | — | R | PLAN |
| `startDate` | ISO date | W | R | — | — | Formand sætter under Planlægning |
| `endDate` | ISO date | W | R | — | — | Formand sætter under Planlægning |
| `state` / `ProduktTilstand` | `afventer \| aktiv \| afsluttet` | R | R | — | R | System-beregnet |
| `factory` (ref) | Factory | R | R | R | R | PLAN — peger på order.factory |
| `entreprisekontrol` | `1 \| 2` | R | — | — | — | PLAN — styrer skema-krav (Flow 5) |
| `temperaturmaaling` | `1 \| 2` | R | — | — | — | PLAN — styrer skema-krav (Flow 5) |
| `samlinger_krav` | string | R | — | — | — | PLAN (fx "Klæbet") |
| `ekstra_temperaturmaalinger` | boolean | R | — | — | — | PLAN |

### DayPlan (per produkt, per dag)

| Felt | Type | Formand | Vognmand | Chauffør | Fabrik | Note |
|---|---|---|---|---|---|---|
| `id` | UUID | R | R | — | R | System |
| `productId` | UUID (FK) | R | R | — | R | System |
| `day` | number (ordinal) | R | — | — | — | Beregnet |
| `date` | ISO date | W | R | R | R | Formand — selectedPlanDate |
| `tonsPlanned` | number | W | R | — | R | Formand input |
| `morgenTons` | number \| null | W | R | — | W (vejning) | Formand input; faktisk udlagt-default; fabrik fylder via vejning |
| `tonsDelivered` | number | R | — | — | R | System-beregnet fra vejesedler |
| `cancelled` | boolean | W | R | R | R | Formand aflyser |
| `cancelReason` / `AflysningsAarsag` | `regn \| frost \| underlag \| andet` | W | R | — | R | Kun hvis cancelled=true |
| `cancel_reason_note` | string \| null | W | R | — | R | KUN ved `andet` — afventer C5 |
| `samlesPaaEnBil` | boolean | W | R | R | R | Formand checkbox (cross-app downstream) |
| `weatherActive` | boolean | W | R | — | R | Formand toggle (informativt for vognmand/fabrik) |

---

## 3. EkstraBestilling (drip-bestilling)

> Bestilling oprettet i løbet af dagen ud over morgen-bestillingen. Persisteret per ekstra-ordre.

| Felt | Type | Formand | Vognmand | Chauffør | Fabrik | Note |
|---|---|---|---|---|---|---|
| `id` | UUID | R | R | — | R | System |
| `orderId` | UUID | R | R | — | R | FK |
| `productId` | UUID \| null | W | R | — | R | Nullable indtil bruger vælger |
| `date` | ISO date | W | R | R | R | = formand's selectedPlanDate |
| `tons` | number | W | R | — | R | Formand input |
| `samlesPaaEnBil` | boolean | W | R | R | R | Formand checkbox |
| `puljelaes` | boolean | R (data-only) | R | — | R | Data-flag, ikke i UI (B6 afventer) |
| `multilaes` | boolean | R (data-only) | R | — | R | Data-flag, ikke i UI |
| `andreOrdrer` | UUID[] | W (multilæs) | R | — | R | Cross-ordre fordeling, kun multilæs |
| `sent` | boolean | W (via send) | R | — | R | System ved Send til fabrik |
| `sent_at` | ISO 8601 + TZ | — (server) | R | — | R | Server-genereret |

---

## 4. TransportOrder / AsfaltKoersel (Formand → Vognmand + Fabrik)

> UI-derived per produkt+dag — repræsenterer den afsendte bestilling.

### TransportOrder (row per bestilling)

| Felt | Type | Formand | Vognmand | Chauffør | Fabrik | Note |
|---|---|---|---|---|---|---|
| `id` | UUID | R | R | — | R | System |
| `dayPlanId` | UUID \| null | R | R | — | R | FK (morgen=set, ekstra=null) |
| `ekstraBestillingId` | UUID \| null | R | R | — | R | FK (ekstra=set, morgen=null) |
| `orderId` | UUID | R | R | — | R | FK |
| `productId` | UUID | R | R | — | R | FK |
| `date` | ISO date | R | R | — | R | — |
| `kind` | `morgen \| ekstra` | R | R | — | R | Derived |
| `tons` | number | R | R | — | R | Fra dayPlan.morgenTons / ekstra.tons |
| `status` / `TransportOrderStatus` | `afventer \| bekraeftet` | R | R/W | — | R/W | Vognmand/fabrik bekræfter |
| `kommentar` | string \| null (delt batch) | W | R | — | R | Formand — max 500 tegn |
| `sentAt` | ISO 8601 + TZ | — | R | — | R | Server |
| `confirmedAt` | ISO 8601 \| null | R | W | — | W | Sættes ved bekræftelse |

### AsfaltKoersel (én per ordre per dag — bil-bestilling)

| Felt | Type | Formand | Vognmand | Chauffør | Fabrik | Note |
|---|---|---|---|---|---|---|
| `orderId` | UUID | R | R | R | R | FK |
| `date` | ISO date | W | R | R | R | — |
| `bestilte_biler` | number | W | R | — | — | Formand antal |
| `foerste_laes_udlaegning_tid` | HH:MM | W | R | R | R | Formand — kritisk for fabrik+vognmand+chauffør |
| `interval_minutter_mellem_laes` | number | W | R | R | R | Formand — typisk 12-20 min |
| `kommentar_til_chauffoer` | string \| null | W | R | R | — | Formand — max 500 tegn, vises i chauffør-app |
| `egen_bil` | boolean | W | — | R | R | Hvis true: vognmand-flow springes over |
| `bekraeftet_af_vognmand` | boolean | R | W | — | R | Vognmand sætter ved bekræft |
| `aendret_af_formand` | boolean | W | R | — | — | Markerer ændring efter vognmand-bekræftelse (gul DagStatus) |
| `planlagt` | boolean | W | R | — | — | Formand markerer som klar |
| `confirmed_vehicles[]` | ConfirmedVehicle[] | R | W | R (egen) | R | Per-bil retur-data fra vognmand |

---

## 5. ConfirmedVehicle (per placeret bil)

> Returdata fra vognmand til formand når en bil placeres i drop-zonen. Hver chauffør modtager KUN sin egen row.

| Felt | Type | Formand | Vognmand | Chauffør | Fabrik | Note |
|---|---|---|---|---|---|---|
| `reg_nr` | string | R | W | R (egen) | R | Vognmand vælger ved disponering |
| `chauffoer_navn` | string | R | W | R (egen) | R | Vognmand vælger |
| `chauffoer_tlf` | string (DK mobil) | R | W | R (egen) | R | Vognmand vælger — formand ringer direkte |
| `bil_type` | string | R | W | R (egen) | R | Fx "6-aks", "Egen bil" |
| `laes_nummer` | number ≥ 1 | R | R (derived) | R (egen) | R | Drop-rækkefølge i vognmand-disponering |
| `ankomst_plads_tid` | HH:MM | R | R (derived) | R (egen) | R | Beregnet: `foerste_laes + (n-1) × interval` |
| `moedetid_fabrik` | HH:MM | R | R (derived) | R (egen, HOVED-INFO) | R | Beregnet: `ankomst_plads − driveTimeMinutes` |
| `afregning_type` | `time \| akkord \| null` | R | W | — | — | Fra vognmand-aftale (Flow 4) |
| `afregning_type_kilde` | `vognmand \| fallback` | R | R | — | — | Hvor typen kom fra |
| `dag_afsluttet_kl` | ISO 8601 \| null | R | W (Flow SL-2) | R (egen) | R | Sættes ved sidste-læs-frigivelse |

---

## 6. Vejeseddel

> Afledt view: `plan_vejebilag` (PLAN/fabrik) + GPS-status (chauffør) + temperatur (formand). Status og temperatur er Colas-write; resten er PLAN/fabrik-write.

| Felt | Type | Formand | Vognmand | Chauffør | Fabrik | Note |
|---|---|---|---|---|---|---|
| `id` | UUID | R | R | R | R | System — = `plan_vejebilag.id` når vejebilag findes |
| `vejeseddelNr` | string \| null | R | R | R | W | Fra fabrik-system (vejebilag_nr) |
| `ordrenummer` | string | R | R | R | R | PLAN |
| `regnr` | string | R | R | R (egen) | W (måler) | Fra `plan_vejebilag.regnr` (= confirmed_vehicles.reg_nr) |
| `chauffoerNavn` | string | R | R | R (egen) | R | Opslag fra vognmand |
| `chauffoer_tlf` | string | R | R | R (egen) | R | Backup-identifier |
| `receptkode` | string \| null | R | R | R | W | Fra `plan_vejebilag.produkt` |
| `fabrikId` | string | R | R | R | R | Fra `plan_vejebilag.fabrik_id` |
| `fabrikNavn` | string \| null | R | R | R | R | Opslag |
| `silo_id` | string | — | — | R | W | Fra QR-scan + fabrik |
| `tons` | number \| null | R | — | R | W | Fabrik måler (udvejet − indvejet) |
| `tidspunkt` / `modtagetTidspunkt` | ISO 8601 \| null | R | R | R | W | Fra vejebilag-system |
| `status` / `VejeseddelStatus` | `paa_vej_til_fabrik \| paa_fabrik \| undervejs \| aflaesning \| dag_afsluttet \| udlagt` | R | R | W (events) | R | Hook beregner fra GPS + events |
| `temperatur` | number \| null | W | R | R (fase 2) | — | Formand registrerer (write-back til PLAN, Flow 9). Fase 2: chauffør |
| `valgtUdlaeggerMaterielNr` | string \| null | W | — | — | — | Formand vælger (Flow 8 Trin 6) |
| `etaMinutter` | number \| null | R | R | R | R | Beregnet (Google Distance Matrix +10%) |
| `forventetEtaMinutter` | number \| null | R | R | R | R | Snapshot ved disponering, til EtaBadge-farve |
| `multilaesFlag` | boolean | R | R | R | R | Bil leverer samme produkt til 2+ ordrer |
| `puljelaesFlag` | boolean | R | R | R | R | Bil har flere produkter til samme ordre |
| `er_sidste_laes` | boolean | W | W | R | R | Vognmand markerer ved sidste-læs (også via auto-beregning) |
| `fordeling[]` | `{ordre_id, tons}[]` | W (multilæs) | — | — | — | Formand fordeler ved dagens slut (Flow 11 Trin 8) |

---

## 7. Bil (vognmandens flåde)

> Vognmandens flåde — løsrevet fra ordre, koblet via `confirmed_vehicles[]`.

| Felt | Type | Formand | Vognmand | Chauffør | Fabrik | Note |
|---|---|---|---|---|---|---|
| `reg` / `reg_nr` | string | R (via CV) | W | R (egen) | R | Vognmand vedligeholder |
| `biltype` (fuld streng) | string | R | W | R (egen) | R | fx "6 Aks · 32 tons" |
| `type` (kategori) | `6-aks \| 4-aks \| andet` | R | W | — | R | Til filtrering |
| `tons` (kapacitet) | number | R | W | R (egen) | R | Vises på chauffør-fabrik-skærm (Flow 3) |
| `chaufførId` | UUID | — | W | — | — | Standard-tildeling |
| `chaufførNavn` | string (cached) | R (via CV) | W | R (egen) | R | Cachet visning |
| `aktiv` | boolean | — | W | — | — | Aktiv/inaktiv i flåde |

---

## 8. Chauffør (driver)

> Drivers identificeres via tlf + nummerplade (ingen login i v1).

| Felt | Type | Formand | Vognmand | Chauffør | Fabrik | Note |
|---|---|---|---|---|---|---|
| `id` | UUID | — | R | R (egen) | — | System |
| `navn` / `name` | string | R (via CV) | W | R (egen) | R | Vognmand vedligeholder |
| `mobil` / `phone` | string | R (via CV) | W | R (egen) | R | Identifier — `auth.user.phone` i chauffør-app |
| `vehicleType` | string | R | R | R (egen) | R | Bil-type chaufføren kører |
| `aktiv` | boolean | — | W | — | — | — |
| `imageUrl` | string \| null | R (via CV) | W | R (egen) | — | Profilbillede |
| `status` / `ChauffoerStatus` / `DriverStatus` | `koerer \| paa_fabrik \| paa_plads \| afsluttet` | R | R | W (events) | R | UI-beregnet fra GPS-events |

---

## 9. Recept (produkt-specifikation)

> PLAN — produktkatalog. Læses af alle roller, skrives ikke af nogen Colas-rolle.

| Felt | Type | Formand | Vognmand | Chauffør | Fabrik | Note |
|---|---|---|---|---|---|---|
| `kode` | string | R | R | R | R | fx "82101H" |
| `navn` | string | R | R | R | R | fx "SMA 11S" |
| `kg_per_m2` | number | R | — | — | R | Til m² ↔ tons-beregning |
| `densitet` | number (heltal) | R | — | — | R | kg/m³, til tykkelse-beregning |
| `min_temperatur` | number (°C) | R | — | — | R | Fallback for TemperaturBadge OK/Lav |

---

## 10. Forundersøgelse (Udførelse — formand-eksklusivt)

> Felter kommer fra PLAN-dropdowns; formand vurderer og skriver retur til PLAN.

| Felt | Type | Formand | Vognmand | Chauffør | Fabrik | Note |
|---|---|---|---|---|---|---|
| `underlag` | string (fra dropdown) | W | — | — | — | Multi-select |
| `underlag_fritekst` | string \| null | W | — | — | — | Kun ved "Andet" |
| `tilstand_ok` | boolean \| null | W | — | — | — | Ja/Nej |
| `aarsager[]` | string[] (multi-select) | W | — | — | — | Kun hvis tilstand_ok=false |
| `aftalt_med` | string | W | — | — | — | Fritekst |
| `forbehold` | string | R/W | — | — | — | PLAN-init + formand-edit |
| `billeder[]` | `{ url, uploaded_at, tag }[]` | W | — | — | — | Tag="forundersoegelse" |
| `ekstraarbejde[]` | `{ type, kommentar, antal }[]` | W | — | — | — | Type fra dropdown (~25 typer); trigger notif til PM |
| `afsluttet` | boolean | W | — | — | — | Trigger sync_to_plan + notify_projektleder |

---

## 11. Time-registrering / Afregning

> Chauffør registrerer; formand godkender; vognmand ser kun godkendte.

| Felt | Type | Formand | Vognmand | Chauffør | Fabrik | Note |
|---|---|---|---|---|---|---|
| `id` | UUID | R | R | R (egen) | — | System |
| `chauffoer_id` / `tlf` | string | R | R | R (egen) | — | — |
| `regnr` | string | R | R | R (egen) | — | Til materiel = transport-bilens regnr |
| `dato` | ISO date | R | R | W | — | — |
| `dayId` | UUID | R | R | R | — | Matcher dailyPlan[].day |
| `ordrenummer` | string | R | R | R | — | — |
| `kategori` | `asfalt-bil \| materiel` | R | R | R | — | Bestemmer felter |
| `afregning_type` | `time \| akkord` | R (edit ved override) | R/W | R | — | Fra confirmed_vehicles[].afregning_type |
| `materiel_ids[]` | string[] | R | R | — | — | Kun materiel-kategori |
| `timer_koersel` | number \| null | W (edit) | R | W | — | Time-afregning |
| `timer_ventetid` | number | W (edit) | R | W | — | — |
| `timer_pause` | number \| null | W (edit) | R | W | — | KUN asfalt-bil + time |
| `tons_koert` (akkord) | number | R (join) | R | — | R (via vejebilag) | Joines fra `plan_vejebilag` per (regnr, dato) |
| `returlaes.timer` | number | W | R | — | — | NY 2026-05-27 — kun formand |
| `returlaes.kommentar` | string \| null | W | R | — | — | NY 2026-05-27 |
| `returlaes.registreret_af_formand` | boolean | W | R | — | — | Audit |
| `returlaes.registreret_tidspunkt` | ISO 8601 | W (server) | R | — | — | — |
| `chauffoer_kommentar` | string \| null | R | R | W | — | Chauffør skriver |
| `formand_kommentar` | string \| null | W | R | — | — | Ved evt. afvisning (ikke i v1) |
| `godkendt_af_formand` | boolean \| null | W | R (kun true) | — | — | null=afventer, true=godkendt |
| `godkendt_af` | string \| null | W (formand-navn) | R | — | — | — |
| `godkendt_tidspunkt` | ISO 8601 \| null | W (server) | R | — | — | — |
| `genaabnet_tidspunkt` | ISO 8601 \| null | W | R | — | — | Trin 5b |

### DriverHours (legacy summary)

| Felt | Type | Formand | Vognmand | Chauffør | Fabrik | Note |
|---|---|---|---|---|---|---|
| `drivingHours` | number | R | R | R | — | Summary-felt |
| `waitingHours` | number | R | R | R | — | — |
| `breakHours` | number | R | R | R | — | — |
| `tripCount` | number | R | R | R | — | — |
| `tonsTotal` | number | R | R | R | — | — |
| `approved` | boolean | W | R | — | — | — |

### CrewHours (holdpakke-mennesker)

| Felt | Type | Formand | Vognmand | Chauffør | Fabrik | Note |
|---|---|---|---|---|---|---|
| `employee` | string | R/W | — | — | — | PLAN initial + formand kan tilføje |
| `role` | string | R | — | — | — | PLAN |
| `hours` | number | W | — | — | — | Formand registrerer per dato |
| `approved` | boolean | W | — | — | — | — |

---

## 12. Materiel-transport + Materiel-anvendelse

> To koncepter: (a) transporten af materiellet til/fra plads (Flow 2), (b) timer brugt PÅ materiellet (Flow 2 Trin 7).

### MaterielLinje / orders.materiel[]

| Felt | Type | Formand | Vognmand | Chauffør | Fabrik | Note |
|---|---|---|---|---|---|---|
| `id` | UUID | R | R | — | — | System |
| `anlaegsNr` / `anlaegsnr` | string | R | R | R | — | PLAN holdpakke |
| `beskrivelse` | string | R | R | R | — | PLAN holdpakke |
| `transportType` | `blokvogn \| kran-baand \| egen-korsel` | W | R | R | — | Formand vælger |
| `udlaant` | boolean | W | — | — | — | — |
| `ordrenummer_betaler` | string \| null | W | R | — | — | Hvis udlånt fra anden afdeling |
| `afhentningssted` (adresse) | string | W | R | R | — | Auto-udfyld hvis ordrenummer_betaler kendt |
| `postnummer` | string | W | R | R | — | — |
| `aflaesningssted` | string | W | R | R | — | Udførselssted |
| `aflaesningspostnummer` | string | W | R | R | — | — |
| `afhentningspin_lat_lng` | `{lat, lng}` | W | R | R | — | Fremtid (pin på kort) |
| `aflaesningspin_lat_lng` | `{lat, lng}` | W | R | R | — | Fremtid |
| `klar_til_afhentning` | ISO 8601 | W | R | R | — | — |
| `leveringsdato` | ISO 8601 | W | R | R | — | — |
| `fakturaordre` | string | W | — | — | — | — |
| `kommentar_til_vognmand` | string | W | R | — | — | Fritekst |
| `gemt` | boolean | W | R | — | — | Formand trykker "Gem transport" |
| `bekraeftet_af_vognmand` | boolean | R | W | — | — | True når vognmand sætter bil på |
| `confirmed_transport.bil_type` | string | R | W | R | — | — |
| `confirmed_transport.chauffoer_navn` | string | R | W | R (egen) | — | — |
| `confirmed_transport.chauffoer_tlf` | string | R | W | R (egen) | — | — |
| `state` / `MaterielTransportTilstand` | `planlagt \| bestilt \| bekraeftet` | R | R/W | — | — | — |
| `direction` | `ud \| hjem` | W | R | R | — | Dag 1 / sidste dag |

### MaterielAnvendelse (timer brugt PÅ materiellet)

| Felt | Type | Formand | Vognmand | Chauffør | Fabrik | Note |
|---|---|---|---|---|---|---|
| `holdpakke_timer_total` | number | W | — | — | — | Brugt når timeafregning='nej' |
| `materiel[].anlaegsnr` | string | R | — | — | — | — |
| `materiel[].anvendt` | boolean | W | — | — | — | Brugt når timeafregning='nej' |
| `materiel[].timer_brugt` | number | W | — | — | — | Brugt når timeafregning='ja' |

---

## 13. Dagsoverblik & Fremdrift

> Formand-eksklusiv registrering i Udførelse-mode.

### DagsoverblikRegistrering

| Felt | Type | Formand | Vognmand | Chauffør | Fabrik | Note |
|---|---|---|---|---|---|---|
| `id` | UUID | R | — | — | — | System |
| `ordrenummer` | string | R | — | — | — | — |
| `dato` | ISO date | R | — | — | — | — |
| `faktiskM2` | number \| null | W | — | — | — | Formand input |
| `faktiskTons` | number \| null | W | — | — | — | Formand input |
| `faktisk_tykkelse_mm` | number (beregnet) | R | — | — | — | `tons × 1_000_000 / (m² × densitet)` |
| `gemtTidspunkt` | ISO 8601 \| null | W (server) | — | — | — | — |
| `gemt_af` | string | W (server) | — | — | — | Formand-navn |

### FremdriftCards (UI-derived, ikke persisteret)

| Felt | Type | Formand | Vognmand | Chauffør | Fabrik | Note |
|---|---|---|---|---|---|---|
| `tonsAnkommet` | number | R | — | — | — | SUM(plan_vejebilag.tons) for dagen |
| `forventetUdlagtM2` | number | R | — | — | — | Beregnet fra tonsAnkommet + kg_per_m2 |
| `afvigelse_m2` | number | R | — | — | — | faktisk_m2 − forventet_udlagt_m2 |

---

## 14. Dokumentation & Noter

> Formand-eksklusivt under Planlægning → Dokumentation.

| Felt | Type | Formand | Vognmand | Chauffør | Fabrik | Note |
|---|---|---|---|---|---|---|
| `opmaaling.fil` (PDF/billede) | binary | W | — | — | — | Upload |
| `opmaaling.filnavn` | string | W | — | — | — | — |
| `opmaaling.filstoerrelse` | bytes | R (beregnet) | — | — | — | — |
| `billedmateriale.billeder[]` | files | W | — | — | — | Kamera / upload |
| `note.id` | UUID | R | — | — | — | System |
| `note.forfatter_initialer` | string | W (system) | — | — | — | Fx "OJ" |
| `note.forfatter_navn` | string | W (system) | — | — | — | — |
| `note.tidsstempel` | ISO 8601 | W (server) | — | — | — | — |
| `note.tekst` | string | W | — | — | — | Fritekst |
| `HændelsesDokumentation.beskrivelse` | string | W | — | — | — | — |
| `HændelsesDokumentation.billeder[]` | string[] (URLs) | W | — | — | — | Supabase Storage |
| `HændelsesDokumentation.oprettetAf` | string | W (system) | — | — | — | Formand-navn |

---

## 15. Vognmand-disponering — DagDisponering (Vognmand UI-state)

> Vognmand-app's view af en bestilling, før den bliver til `confirmed_vehicles`.

| Felt | Type | Formand | Vognmand | Chauffør | Fabrik | Note |
|---|---|---|---|---|---|---|
| `dato` | ISO date | R | R | R | R | — |
| `bestilteBiler` | number | W | R | — | — | Fra formand |
| `disponeredeBiler` | number | R | W (beregnet) | — | — | Vognmand-derived |
| `aendretAfFormand` | boolean | W | R | — | — | Driver gul DagStatus |
| `mødetidFabrik` | HH:MM | R | R (derived) | R (egen) | R | Pr. bil — beregnet |
| `tidFabrikTilPlads` | number (min) | R | R | — | R | Snapshot af driveTimeMinutes |
| `kommentar` | string \| null | W | R | — | — | Vognmand-orienteret kommentar |
| `førsteLæsPåPlads` | HH:MM | W | R | R | R | = `foerste_laes_udlaegning_tid` |
| `intervalMinutter` | number | W | R | R | R | = `interval_minutter_mellem_laes` |
| `DagStatus` (UI-only) | `roed \| orange \| groen \| gul` | — | R (derived) | — | — | Vognmand-UI |
| `tidligereKørte[]` | array | — | R | — | — | History — vognmand-only |

---

## 16. Chauffør-app — TaskTimestamps + TaskLogs

> Chauffør registrerer GPS-events; data læses af formand til ETA og afregning.

### TaskTimestamps (per task/læs)

| Felt | Type | Formand | Vognmand | Chauffør | Fabrik | Note |
|---|---|---|---|---|---|---|
| `ankomst_fabrik` | ISO 8601 | R | R | W (GPS geofence) | R | — |
| `qr_scannet` | ISO 8601 | R | — | W (manuel) | R | Silo-bekræftelse |
| `afgang_fabrik` | ISO 8601 | R | R | W (event) | R | "Afslut vejning"-klik |
| `ankomst_udfoerselssted` | ISO 8601 | R | R | W (GPS geofence) | R | — |
| `afgang_udfoerselssted` | ISO 8601 | R | R | W (event) | R | — |

### TaskLogs (per task/læs)

| Felt | Type | Formand | Vognmand | Chauffør | Fabrik | Note |
|---|---|---|---|---|---|---|
| `silo_bekraeftet` | string (silo-id) | R | — | W | R | Fra QR-scan |
| `last_tons` | number | R | R | R | W | Fra vægt-system |
| `koersel_minutter` | number | R | R | W | — | GPS-derived |
| `pause_minutter` | number | R | R | W | — | — |
| `opgave_minutter` | number | R | R | W | — | — |

### TaskState / DriverTask

| Felt | Type | Formand | Vognmand | Chauffør | Fabrik | Note |
|---|---|---|---|---|---|---|
| `state` / `TaskTilstand` | `ikke_startet \| aktiv \| pauset \| afsluttet` | R | R | W | R | — |
| `tripsToday` | number | R | R | R (egen) | R | — |
| `tonsDelivered` | number | R | R | R (egen) | R | — |
| `lastUpdatedAt` | ISO 8601 | R | R | W | R | — |

---

## 17. Frigivelses-flow (sidste-læs)

> NY 2026-05-27 — Flow 1 Variant. Bil frigives når sidste-læs er allokeret.

| Felt | Type | Formand | Vognmand | Chauffør | Fabrik | Note |
|---|---|---|---|---|---|---|
| `frigivelses_forslag.ordre_id` | UUID | W (system) | R | — | — | — |
| `frigivelses_forslag.dato` | ISO date | W (system) | R | — | — | — |
| `frigivelses_forslag.foreslaaede_reg_nr[]` | string[] | W (system) | R | — | — | System-beregnet |
| `frigivelses_forslag.reserve_reg_nr` | string | W (system) | R | — | — | — |
| `frigivelses_forslag.status` | `afventer_vognmand \| bekraeftet \| afvist` | R | W | — | — | — |
| `assigned_tasks.status='dag_afsluttet'` | enum | R | R | R (push) | R | Triggrer push til chauffør |

---

## 18. Plan-vejebilag (PLAN — fabrik/vejebilags-system kilde)

> Read-only fra Colas' side, undtagen `temperatur` + `valgt_udlaegger_materielnr` (write-back fra formand).

| Felt | Type | Formand | Vognmand | Chauffør | Fabrik | Note |
|---|---|---|---|---|---|---|
| `id` | UUID | R | R | R | R | System |
| `regnr` | string | R | R | R | W | Fabrik måler |
| `chauffoer_tlf` | string | R | R | R | W | Backup-identifier |
| `ordrenummer` | string | R | R | R | W | — |
| `dato` | date | R | R | R | W | — |
| `tidspunkt` | ISO 8601 | R | R | R | W | — |
| `fabrik_id` | string | R | R | R | W | — |
| `silo_id` | string | — | — | R | W | — |
| `produkt` (receptkode) | string | R | R | R | W | — |
| `tons` | number | R | R | R | W | Udvejet − indvejet |
| `vejebilag_nr` | string | R | R | R | W | Reference fra fabrik-system |
| `temperatur` | number \| null | W | R | R (fase 2) | — | Colas write-back til PLAN |
| `valgt_udlaegger_materielnr` | string \| null | W | — | — | — | Colas write-back |

---

## 19. Afregninger (Colas → vognmand månedlig)

| Felt | Type | Formand | Vognmand | Chauffør | Fabrik | Note |
|---|---|---|---|---|---|---|
| `periode` | month | R | R | — | — | — |
| `chauffoer_id` | UUID | R | R | — | — | — |
| `afregnede_timer` | number | R | R | — | — | Kun godkendte |
| `beloeb` | number | R | R | — | — | — |

---

## 20. AssignedTasks (chauffør-app data-payload)

> Den filtrerede slice som chauffør-appen modtager — KUN egen task.

| Felt | Type | Formand | Vognmand | Chauffør | Fabrik | Note |
|---|---|---|---|---|---|---|
| `driver_phone` | string | R | R | R (egen) | — | Filter-nøgle |
| `truck_plate` | string | R | R | R (egen) | — | Filter-nøgle |
| `multilaes_stops[]` | array | R | R | R (egen) | — | Stop-rækkefølge for multilæs |
| `multilaes_stops[].afleveret_tons` | number | R | — | W | — | Chauffør registrerer på dagen |
| `multilaes_stops[].afleveret_tid` | ISO 8601 | R | — | W | — | — |
| `samles_paa_en_bil_products[]` | array | R | R | R (egen) | R | Multi-produkt-loading-flow (9-trins) |

---

## 21. JobReport (efterkalkulation — legacy)

> Brugt i prototype-rapportering; antagelig erstattet af time_registreringer + vejebilag-aggregater.

| Felt | Type | Formand | Vognmand | Chauffør | Fabrik | Note |
|---|---|---|---|---|---|---|
| `orderId` | UUID | R | R | — | — | — |
| `day` | number | R | R | — | — | — |
| `vehicleType` | string | R | R | — | — | — |
| `drivingHours` | number | R | R | R | — | — |
| `waitingHours` | number | R | R | R | — | — |
| `accordTons` | number | R | R | — | — | — |
| `comment` | string \| null | W | R | — | — | — |

---

## Opsummering

### Roller efter write-bredde (felter rollen skriver til)

1. **Formand** — bredeste write-rolle. Skriver til:
   - DayPlan + EkstraBestilling + AsfaltKoersel (planlægning)
   - Forundersøgelse + Dagsoverblik + Dokumentation (Udførelse)
   - Vejeseddel.temperatur + valgtUdlaeggerMaterielNr (write-back til PLAN)
   - TimeRegistrering.godkendt_af_formand + returlaes (afregning)
   - MaterielLinje + MaterielAnvendelse (transport + timer)
   - Holdpakke-udvidelse (skrives retur til PLAN)
2. **Vognmand** — disponerings-rolle. Skriver primært til:
   - ConfirmedVehicle (reg_nr, chauffoer, bil_type, afregning_type)
   - TransportOrder.status + confirmed_at
   - AsfaltKoersel.bekraeftet_af_vognmand
   - MaterielLinje.confirmed_transport
   - Bil + Chauffør (flåde-vedligehold)
   - er_sidste_laes + dag_afsluttet_kl (sidste-læs-flow)
3. **Chauffør** — event-rolle. Skriver:
   - TaskTimestamps + TaskLogs (GPS-events + manuelle klik)
   - TimeRegistrering (kørsel/ventetid/pause + kommentar)
   - VejeseddelStatus (via events: "Afslut vejning", geofence)
   - Multilæs-stops afleveret-data
   - **Fase 2:** Vejeseddel.temperatur (overtages fra formand)
4. **Fabrik** — vejning + skiftende skemafri. Skriver:
   - `plan_vejebilag` (alle vejning-relaterede felter undtagen temperatur)
   - Vejeseddel-payload til chauffør (kommende fabrik-app)

### Felter som INGEN Colas-rolle skriver (PLAN-only)

- `Order.orderNumber`, `customer`, `projectName`, `district`, `foreman`, `contactPM`
- `Product.recipeCode`, `recipeName`, `m2`, `kgPerM2`, `kgPerM3`, `tonsTotal`, `activityName`
- `Product.entreprisekontrol`, `temperaturmaaling`, `samlinger_krav`
- `Order.timeafregning`, `tidsvindue`, `jobnummer`
- `Factory.code`, `name`, `driveTimeMinutes` (PLAN initial; opdateres ved fabrik-skift via Flow 13)
- `Recept.*` (hele recept-katalog)
- Forundersøgelse-dropdown-værdier (underlags-typer, årsager, ekstraarbejde-typer)

### CONTRACT-låste enum-værdier (STATUS_VOKABULAR.md)

Alle felter typed som `TaskTilstand`, `VejeseddelStatus`, `TransportPlanStatus`, `MaterielTransportTilstand`, `TransportOrderStatus`, `OrdreTilstand`, `ProduktTilstand`, `AflysningsAarsag`, `ForsinkelseStatus`, `DagStatus`, `ChauffoerStatus` er låst 2026-05-26 (med `dag_afsluttet`-udvidelse 2026-05-27 for VejeseddelStatus).

---

## Uoverensstemmelser mellem kilder

Følgende felter har inkonsistens mellem DATA_FIELDS.md, FUNCTIONAL_FLOWS.md og type-deklarationer — afventer architect-beslutning før produktion:

1. **`Order.state` / `OrdreTilstand`** — Type-fil `shared/types/order.ts` bruger engelsk (`planned | active | completed`); STATUS_VOKABULAR siger dansk (`planlagt | aktiv | afsluttet`). Refactor-plan eksplicit nævnt i STATUS_VOKABULAR §Refactor-plan.

2. **`Product.state` / `ProduktTilstand`** — Type-fil bruger engelsk (`pending | active | completed`); STATUS_VOKABULAR siger dansk (`afventer | aktiv | afsluttet`).

3. **`TransportPlan.status`** — Type-fil bruger `'beregnet' | 'sendt-til-vognmand' | 'bekræftet'` (kebab + æ); STATUS_VOKABULAR siger snake_case ASCII (`beregnet | sendt_til_vognmand | bekraeftet`).

4. **`ScheduleRow.status`** — Type-fil bruger `'planlagt' | 'på-vej' | 'læsser' | 'ankommet' | 'afsluttet'` (kebab + å/æ); STATUS_VOKABULAR siger ScheduleRow konsolideres ind i `VejeseddelStatus`.

5. **`MaterielTransport.state`** — Type-fil bruger `'planlagt' | 'bestilt' | 'bekræftet'` (æ); STATUS_VOKABULAR siger ASCII (`planlagt | bestilt | bekraeftet`).

6. **`TransportOrder.status`** — Type-fil bruger `'afventer' | 'bekræftet'` (æ); STATUS_VOKABULAR §5 siger ASCII (`afventer | bekraeftet`).

7. **`TaskState`** — `shared/types/driver.ts` bruger engelsk (`idle | active | paused | completed`); STATUS_VOKABULAR §1 siger dansk (`ikke_startet | aktiv | pauset | afsluttet`).

8. **`DriverStatus`** — `shared/types/driver.ts` bruger `'korer' | 'pa-fabrik' | 'pa-plads' | 'afsluttet'` (kebab + manglende `oe`-transliteration); STATUS_VOKABULAR §11 siger `koerer | paa_fabrik | paa_plads | afsluttet`.

9. **`EkstraBestilling.puljelaes` / `multilaes`** — DATA_FIELDS markerer disse som "data-only, ikke i UI" og åbent spørgsmål B6 om hvorvidt de skal bevares i Supabase. Beslutning udestår.

10. **`EkstraBestilling.andreOrdrer`** — DATA_FIELDS B7: skal feltet ligge på `EkstraBestilling` eller på `Samleordre`? Afventer afklaring.

11. **`samleordrer`-tabel** — FUNCTIONAL_FLOWS Flow 11 nævner `samleordrer { id, dato, ordre_ids[], anchor_ordre_id }`, men ingen TypeScript-type findes endnu i `shared/types/` eller `apps/formand/src/types/`. Mangler typedeklaration før build.

12. **`assigned_tasks`-tabel** — Refereres i flere flows (Flow 1 Trin 8, Flow 11, Flow 12) men har ingen TypeScript-type. Skema implicit: `{ driver_phone, truck_plate, multilaes_stops[], samles_paa_en_bil_products[], status, … }` — afventer eksplicit definition.

13. **`returlaes`-felt** — Tilføjet til `time_registreringer` i FUNCTIONAL_FLOWS Trin 4a (LÅST 2026-05-27), men ingen TypeScript-type i `apps/formand/src/types/` afspejler det endnu. Refactor-task.

14. **`task_timestamps` + `task_logs`** — Refereres i flere flows som separate tabeller, men ingen TypeScript-typer findes. Implicit skema fra FUNCTIONAL_FLOWS datamodel-sektion — skal formaliseres.

---

## TBD-felter (specifikation udestår)

> Felter hvor scope er kendt men detail-skemaet endnu ikke låst.

### Kritiske (blokerende for build)

1. **`samleordrer`-skema** — Hele tabellen er TBD: `{ id, dato, ordre_ids[], anchor_ordre_id }` skal formaliseres som TypeScript-type + Supabase-skema før Flow 11 kan implementeres.

2. **`assigned_tasks`-skema** — Skal defineres eksplicit (driver-app-payload) før chauffør-app's task-distribution kan bygges. FlowsForeneretsåvist: `{ driver_phone, truck_plate, multilaes_stops[], samles_paa_en_bil_products[], status, factory_id, factory_address, … }`.

3. **`task_timestamps` + `task_logs`-skema** — Implicit i Flow 3 + Flow 4, men formel TypeScript-type mangler.

4. **`afregninger`-skema** — Kun grov struktur i FUNCTIONAL_FLOWS datamodel: `{ periode, chauffoer_id, afregnede_timer, beloeb }`. Detaljer (linjer pr. ordre, vejebilag-link, akkord vs. time-breakdown) er TBD.

### Vigtige (kan starte uden, men trænger til at blive låst snart)

5. **Distributions-mekanisme til chauffør** — Flow 1 Trin 8 har eksplicit TBD: push, polling eller event på reg.nr? Felt på `assigned_tasks` (`push_token`, `distribution_method`?) er TBD.

6. **Fabrik-system-integration** — Flow 1 Trin 5b åbne spørgsmål: hvilket fabrik-system (Danvægt? Anden ERP?) — påvirker payload-format for `pickups[]`-listen.

7. **Vejebilag-temperatur write-back-mekanisme** — Flow 9: `plan_vejebilag.temperatur` skrives RETUR til PLAN. Sync-mekanisme (webhook? batch? real-time?) er TBD.

8. **`forundersoegelse.afsluttet`-trigger** — Flow 6 Trin 6: notifikation til projektleder ved ekstraarbejde. Mekanisme (email / in-app / SMS) er TBD.

### Mindre kritiske (kan løses i senere fase)

9. **Geofence-radius pr. fabrik** — Default 200m nævnes i Flow 3 Trin 1, men er TBD per fabrik. Felt `fabrik.geofence_radius_m` eksisterer i datamodel.

10. **Vejebilag → chauffør indvejet-vægt sync** — Flow 3 Trin 2: "Hvordan synkroniseres vægt-data tilbage til chauffør/ordre?" — TBD.

11. **Læser-frekvens NFC HCE** — Sidste forretningsregel i FUNCTIONAL_FLOWS: afventer kunde-bekræftelse på at Danvægt-læseren er 13,56 MHz NFC. Hvis bekræftet, tilkommer felter på chauffør-app: `nfc_kort_id` + `nfc_kort_gyldig_til`.

12. **Egen-bil chauffør-kilde** — Flow 1 Variant Trin EB-1: oprettes manuelt af formand eller arves fra holdpakken? Beslutning udestår — påvirker write-rettigheder på `confirmed_vehicles` for egen-bil.

13. **Returlæs (Flow 10)** — Hele entiteten `Returopgave` afventer kunde-input på 10 åbne spørgsmål. Skema TBD.

14. **Forundersøgelse → PLAN write-back-mekanisme** — Flow 6 Trin 6.

15. **Materiel-pin-koordinater** — `afhentningspin_lat_lng` + `aflaesningspin_lat_lng` er markeret som "fremtidig feature" i DATA_FIELDS.

---

## Antal felter pr. entitet (grov optælling)

| # | Entitet | Felter | Note |
|---|---|---|---|
| 1 | Ordre | 22 | Inkl. factory + holdpakke + tidsvindue |
| 2 | Produkt + DayPlan | 27 | Produkt(15) + DayPlan(12) |
| 3 | EkstraBestilling | 11 | |
| 4 | TransportOrder + AsfaltKoersel | 25 | TransportOrder(12) + AsfaltKoersel(13) |
| 5 | ConfirmedVehicle | 10 | |
| 6 | Vejeseddel | 23 | |
| 7 | Bil | 7 | |
| 8 | Chauffør | 7 | |
| 9 | Recept | 5 | |
| 10 | Forundersøgelse | 9 | |
| 11 | Time-registrering + DriverHours + CrewHours | 24 | TimeReg(16) + DriverHours(6) + CrewHours(4) |
| 12 | Materiel-transport + anvendelse | 22 | MaterielLinje(18) + Anvendelse(4) |
| 13 | Dagsoverblik & Fremdrift | 11 | DagsoverblikReg(8) + FremdriftCards(3) |
| 14 | Dokumentation & Noter | 13 | |
| 15 | Vognmand DagDisponering | 11 | |
| 16 | TaskTimestamps + TaskLogs + TaskState | 13 | |
| 17 | Frigivelses-flow | 6 | |
| 18 | PlanVejebilag | 13 | |
| 19 | Afregninger | 4 | |
| 20 | AssignedTasks | 6 | |
| 21 | JobReport | 7 | |

**Total: ca. 276 felter på tværs af 21 entiteter.**

> **Note:** Optællingen er grov — nogle felter er nesterede strukturer der kunne tælles dybere; andre er UI-derived og persisteres ikke. Brug tabellerne ovenfor som autoritativ kilde, ikke totals.
