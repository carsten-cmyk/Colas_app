# Datoformat — Kanonisk reference

**Status:** 🟢 LÅST 2026-05-26
**Gælder for:** Alle apps + shared utilities + Supabase storage

> Denne fil er **single source of truth** for datoformatering på tværs af monorepoet. Konvertering mellem storage og display sker i ÉN utility — ikke spredt i komponenter.

---

## Regelsæt

### Storage (DB + intern kode)

**Format:** ISO 8601 — `yyyy-mm-dd` (fx `2026-03-16`)
**Type i TypeScript:** `string` (ikke `Date`-object — undgår tidszone-bugs)
**Begrundelse:** Locale-independent, sortable, Supabase-default

```ts
// ✅
const dato: string = '2026-03-16'
const dato_med_tid: string = '2026-03-16T07:00:00+01:00'  // ISO med TZ

// ❌
const dato = new Date('2026-03-16')  // tidszone-fælder
const dato = '16-03-2026'             // ikke-ISO i kode
```

---

### UI display

| Kontekst | Format | Eksempel | Helper |
|---|---|---|---|
| **Default** | `D. måned ÅÅÅÅ` | `16. marts 2026` | `formatLongDate(iso)` |
| **Planlægnings-view m. ugedag** | `ugedag D. måned ÅÅÅÅ` | `mandag 16. marts 2026` | `formatLongDateWithDay(iso)` |
| **Kompakt** (tabel-celler, badges) | `D. mmm` | `16. mar` | `formatShortDate(iso)` |
| **Range — same month** | `D.-D. måned ÅÅÅÅ` | `16.-20. marts 2026` | `formatDateRange(start, end)` |
| **Range — cross-month** | `D. måned - D. måned ÅÅÅÅ` | `28. februar - 3. marts 2026` | `formatDateRange(start, end)` |
| **Range — cross-year** | `D. måned ÅÅÅÅ - D. måned ÅÅÅÅ` | `28. december 2025 - 3. januar 2026` | `formatDateRange(start, end)` |
| **Kalender-grid-header** | `ugedag-forkortelse D` | `ma 16` | `formatCalendarHeader(iso)` |
| **Input/picker-display** | `dd-mm-åååå` | `16-03-2026` | `formatNumericDanish(iso)` |
| **Tid** | `HH.mm` (24-timer, punktum-separator) | `07.00`, `14.30` | `formatTime(iso)` |
| **Dato+tid** | `D. måned ÅÅÅÅ kl. HH.mm` | `16. marts 2026 kl. 07.00` | `formatDateTime(iso)` |

---

### Hvornår ugedag — kontekst-baseret regel

**Ugedag PÅ** (`mandag 16. marts 2026`):
- Planlægnings-views (Asfaltkørsel, Dagsoversigt, Gantt, Disponering)
- Dagsoverblik / faktisk-input-skærme
- Steder hvor det er kritisk hvilken ugedag det er

**Ugedag AF** (`16. marts 2026`):
- Ordre-info-cards og headers
- Audit-logs / historik
- Bekræftelses-modaler
- Referencer i prose ("ordren fra 16. marts 2026")

**Tvivlstilfælde:** Default-AF. Tilføj kun ugedag hvis brugeren har en planlægnings-opgave knyttet til datoen.

---

### Casing

**Ugedage:** **lille bogstav** — `mandag`, `tirsdag`, `onsdag`, `torsdag`, `fredag`, `lørdag`, `søndag`
**Måneder:** **lille bogstav** — `januar`, `februar`, ..., `december`
**Begrundelse:** Dansk skriftnorm — ugedage og måneder er ikke proprier.

**Undtagelse:** Hvis datoen står som første ord i en kort label (ikke prose), kan stort bogstav bruges:
- ✅ `Mandag 16. marts 2026` (label på dagskort i kalender)
- ✅ `mandag 16. marts 2026` (prose: "Næste pause er mandag 16. marts 2026")

Default for nye komponenter: **lille bogstav**.

---

### Ugedags-forkortelser (kun kalender-grid)

| Fuld | Forkortelse |
|---|---|
| mandag | ma |
| tirsdag | ti |
| onsdag | on |
| torsdag | to |
| fredag | fr |
| lørdag | lø |
| søndag | sø |

---

### Forbudte formater

| Format | Hvorfor forbudt |
|---|---|
| `16/3` | Tvetydig (DD/MM eller MM/DD?), ikke dansk standard |
| `16/03` | Samme problem |
| `16/3-2026` | Dansk typewriter-style — inkonsistent med resten |
| `16-3-2026` | Mangler nullen i måned |
| `03/16/2026` | US-format — aldrig dansk UI |
| `Mar 16, 2026` | Engelsk |
| `2026-03-16` | ISO-format i UI (kun storage) |
| `D. mmm` med ugedag-prefix uden årstal i kontekst hvor år er kritisk | Tvetydig |

---

## Helper-utilities

**Placering:** `apps/[app]/src/utils/dateFormat.ts` (per app, indtil shared utility er etableret)

```ts
// Påkrævet API (samme i hver app indtil konsolidering):
formatLongDate(iso: string): string                    // "16. marts 2026"
formatLongDateWithDay(iso: string): string             // "mandag 16. marts 2026"
formatShortDate(iso: string): string                   // "16. mar"
formatDateRange(startIso: string, endIso: string): string  // håndterer same-day/cross-month/cross-year
formatCalendarHeader(iso: string): string              // "ma 16"
formatNumericDanish(iso: string): string               // "16-03-2026"
formatTime(iso: string): string                        // "07.00"
formatDateTime(iso: string): string                    // "16. marts 2026 kl. 07.00"

// Parse-helper for input-felter:
parseNumericDanish(input: string): string | null       // "16-03-2026" → "2026-03-16" eller null
```

---

## Uge-numre

Kunder taler "uge 18, mandag" i nogle kontekster. Indtil videre:
- **Vis:** `Uge 18 · mandag 5. maj 2026` når uge-konteksten er primær (sjælden)
- **Storage:** Stadig ISO-dato — uge-nummer beregnes via helper `getISOWeek(iso)`
- **ISO 8601:** Brug ISO uge-nummering (mandag = ugens første dag) — IKKE US-konvention

Hvis uge-baserede visninger bliver almindelige, etableres egen sektion her.

---

## Refactor-plan

**Eksisterende `formatLongDate` helpers** i prototyper (OrdrePlanScreen, DagsoversigtScreen) matcher allerede dette regelsæt for default-formatet. Tilføjelser:

1. `formatLongDateWithDay` — ny helper (lille bogstav ugedag)
2. `formatNumericDanish` — ny helper til input-display
3. `parseNumericDanish` — ny helper til input-parsing
4. `formatTime` + `formatDateTime` — formaliser punktum-separator

Refactor sker inkrementelt per sektion. Hvor en prototype bruger lokal date-format-logik, skal interview-agent flagge og architect inkludere konsolidering i SPEC.

---

## Ændringslog

| Dato | Ændring | Ansvarlig |
|---|---|---|
| 2026-05-26 | Initial låsning af regelsæt — context-baseret ugedag, lille bogstav, alle formater specificeret | Carsten |
| 2026-05-22 | Default lang-format `16. marts 2026` etableret (tidligere memory, nu konsolideret her) | Carsten |
