# Status-vokabular — Kanonisk reference

**Status:** 🟢 LÅST 2026-05-26
**Gælder for:** Alle apps (formand, vognmand, chauffeur-web, chauffeur, fabrik, kunde) + shared/types + Supabase enums

> Denne fil er **single source of truth** for alle status-enums på tværs af monorepoet. Ingen kode, mocks eller DB-skema må afvige uden eksplicit beslutning + opdatering af denne fil.

---

## Konventioner

1. **Sprog:** Dansk i hele kodebasen (også engelske rester refaktoreres ud)
2. **Diakritika:** ASCII — ingen æ/ø/å i enum-værdier. Brug transliteration: `ø → oe`, `å → aa`, `æ → ae`
3. **Casing:** `snake_case` for sammensatte værdier
4. **Scope:** Separate enums per domain (ikke én delt "ConfirmationStatus" eller lignende)
5. **Undtagelse:** UI-only enums der aldrig persisteres må være engelske (se `ForsinkelseStatus` nedenfor)

---

## Katalog

### 1. `TaskTilstand` — Chauffør-app task-lifecycle

```ts
type TaskTilstand = 'ikke_startet' | 'aktiv' | 'pauset' | 'afsluttet'
```

| Værdi | Betyder |
|---|---|
| `ikke_startet` | Opgave tildelt chauffør, ikke påbegyndt |
| `aktiv` | Chauffør har startet opgaven |
| `pauset` | Midlertidigt på pause |
| `afsluttet` | Opgave gennemført |

---

### 2. `VejeseddelStatus` — Vejeseddel + ScheduleRow (konsolideret, opdateret 2026-05-27)

```ts
type VejeseddelStatus =
  | 'paa_vej_til_fabrik'  // bil på vej til fabrik (første gang ELLER returlæs)
  | 'paa_fabrik'          // ankommet fabrik, indvejning/læsning/udvejning i gang
  | 'undervejs'           // afsluttet vejning på fabrik, kører mod plads (ETA aktiv)
  | 'aflaesning'          // ankommet plads, læsser af
  | 'dag_afsluttet'       // NY 2026-05-27 — bilens planlagte næste-tur er overflødiggjort (sidste-læs taget af anden bil)
  | 'udlagt'              // udlagt + temp-målt (slut-tilstand)
```

**Lifecycle:**
```
paa_vej_til_fabrik → paa_fabrik → undervejs (ETA-status) → aflaesning → udlagt
        │                 ↑                                                  ↓
        │                 └─────── returlæs (bil tilbage til fabrik) ────────┘
        │
        └──→ dag_afsluttet  (sidegren — sidste-læs taget af anden bil, ingen returlæs)
```

| Værdi | Betyder | Trigger |
|---|---|---|
| `paa_vej_til_fabrik` | Bil på vej til fabrik (første læs eller returlæs) | Chauffør klikker "Kør til fabrik" |
| `paa_fabrik` | Bil på fabrik — indvejning, læsning eller udvejning | Geofence ankomst fabrik |
| `undervejs` | ETA-fase — bil kører mod udførselssted, ETA-tid synlig | Chauffør klikker "Afslut vejning" på fabrik |
| `aflaesning` | Bil ankommet plads, læsser af | Geofence ankomst udførselssted |
| `dag_afsluttet` | Bilens planlagte næste-tur er overflødiggjort (sidste-læs taget af anden bil) | Formand disponerer sidste-læs-bil → andre biler markeres `dag_afsluttet` |
| `udlagt` | Udlagt + temp-målt — slut-tilstand i visning | Formand/chauffør registrerer temperatur + afsluttet |

> **Bemærk:**
> - Tidligere separat `ScheduleRowStatus` er konsolideret ind i denne enum 2026-05-26.
> - Enum forenklet 2026-05-27: gamle værdier `planlagt`/`laesser`/`ankommet`/`afsluttet` udfases. `laesser` → `paa_fabrik`, `ankommet` → `udlagt` (med temp-målt-implikation), `planlagt`/`afsluttet` droppet (UI-fokus på aktive biler — vejeseddel eksisterer kun når chauffør er aktiv, og slutstand er `udlagt`).
> - ETA-tid (i minutter eller HH:MM) er kun relevant ved status `undervejs`. Beregnes via Google Distance Matrix API (se [[flow-3-trin-6-eta-beregning]]).

---

### 3. `TransportPlanStatus` — Formand → vognmand plan

```ts
type TransportPlanStatus = 'beregnet' | 'sendt_til_vognmand' | 'bekraeftet'
```

| Værdi | Betyder |
|---|---|
| `beregnet` | Plan beregnet i formand-app, ikke sendt |
| `sendt_til_vognmand` | Plan transmitteret til vognmand-modul |
| `bekraeftet` | Vognmand har bekræftet biler |

---

### 4. `MaterielTransportTilstand` — Materiel-transport

```ts
type MaterielTransportTilstand = 'planlagt' | 'bestilt' | 'bekraeftet'
```

| Værdi | Betyder |
|---|---|
| `planlagt` | Materiel-transport planlagt |
| `bestilt` | Bestilt hos vognmand |
| `bekraeftet` | Vognmand har bekræftet |

---

### 5. `TransportOrderStatus` — Transport-bestilling

```ts
type TransportOrderStatus = 'afventer' | 'bekraeftet'
```

| Værdi | Betyder |
|---|---|
| `afventer` | Bestilling afventer bekræftelse |
| `bekraeftet` | Bestilling bekræftet |

---

### 6. `OrdreTilstand` — Ordre-lifecycle (shared/types)

```ts
type OrdreTilstand = 'planlagt' | 'aktiv' | 'afsluttet'
```

| Værdi | Betyder |
|---|---|
| `planlagt` | Ordre i planlægning, ikke startet |
| `aktiv` | Ordre i gang |
| `afsluttet` | Ordre færdig |

---

### 7. `ProduktTilstand` — Produkt-lifecycle på ordren

```ts
type ProduktTilstand = 'afventer' | 'aktiv' | 'afsluttet'
```

| Værdi | Betyder |
|---|---|
| `afventer` | Produkt afventer planlægning eller start |
| `aktiv` | Produkt under udlægning |
| `afsluttet` | Produkt færdigt |

---

### 8. `AflysningsAarsag` — DayPlan aflysnings-årsag

```ts
type AflysningsAarsag = 'regn' | 'frost' | 'underlag' | 'andet'
```

| Værdi | Betyder |
|---|---|
| `regn` | Aflyst pga. regn |
| `frost` | Aflyst pga. frost |
| `underlag` | Aflyst pga. dårligt underlag |
| `andet` | Anden årsag (kræver fritekst) |

---

### 9. `ForsinkelseStatus` — UI-only (EtaBadge)

```ts
type ForsinkelseStatus = 'neutral' | 'warn' | 'bad'
```

> **Undtagelse:** Denne enum er engelsk fordi den er **UI-only** og aldrig persisteres til DB. Den mapper til farver/ikoner i `EtaBadge`-komponenten.

| Værdi | Betyder | Visuelt |
|---|---|---|
| `neutral` | ETA matcher forventet | Grøn/neutral |
| `warn` | 25-50% forsinkelse | Gul/orange |
| `bad` | >50% forsinkelse | Rød |

---

### 10. `DagStatus` — Vognmand UI dagsstatus (farve-baseret)

```ts
type DagStatus = 'roed' | 'orange' | 'groen' | 'gul'
```

| Værdi | Betyder |
|---|---|
| `roed` | Ingen biler disponeret |
| `orange` | Delvis disponeret |
| `groen` | Fuldt disponeret |
| `gul` | Ændret af formand (kræver vognmand-action) |

---

### 11. `ChauffoerStatus` — Chauffør driftstatus

```ts
type ChauffoerStatus = 'koerer' | 'paa_fabrik' | 'paa_plads' | 'afsluttet'
```

| Værdi | Betyder |
|---|---|
| `koerer` | Chauffør kører (i transit) |
| `paa_fabrik` | På fabrik (læsser eller venter) |
| `paa_plads` | På aflæsningssted |
| `afsluttet` | Dagstransport afsluttet |

---

## Hvor håndhæves dette?

- **Supabase:** Postgres `CHECK`-constraints eller `enum`-types per tabel
- **TypeScript:** Union-typer i `shared/types/` — apps importerer fra `shared/types/`, aldrig lokale duplikater
- **Display-mapping:** `apps/[app]/src/utils/statusLabels.ts` mapper enum-værdi → dansk display-tekst med korrekte æ/ø/å (fx `paa_vej_til_fabrik` → `På vej til fabrik`)

---

## Refactor-plan

Refactor af eksisterende kode sker **inkrementelt per sektion** i dev-fasen — ikke som big-bang. Interviewer-agenten flagger nuværende værdier mod dette katalog i Fase B (datafelter), og architect inkluderer mapping i SPECs.

**Hvor refactor specifikt skal ske** (kortlagt 2026-05-26):
- `shared/types/order.ts` — `Order.state`, `Product.state` (engelsk → dansk)
- `shared/types/driver.ts` — `TaskState` (engelsk → dansk), `DriverStatus` (`korer` → `koerer`, `pa-fabrik` → `paa_fabrik`)
- `apps/formand/src/types/order.ts` — `ScheduleRow.status` (drop, brug `VejeseddelStatus`), kebab-case → snake_case overalt
- `apps/formand/src/mocks/vejesedler.ts` — `paa-vej-til-fabrik` → `paa_vej_til_fabrik`
- Alle prototype-filer i `apps/*/src/prototypes/` — inline status-typer skal udskiftes med shared import

---

## Ændringslog

| Dato | Ændring | Ansvarlig |
|---|---|---|
| 2026-05-26 | Initial låsning af alle 11 enums | Carsten |
| 2026-05-27 | `VejeseddelStatus` udvidet med `dag_afsluttet` (sidegren fra `paa_vej_til_fabrik`) | builder |
