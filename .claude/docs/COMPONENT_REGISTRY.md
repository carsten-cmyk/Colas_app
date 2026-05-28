---
type: component-registry
status: auto-generated initial version
created: 2026-05-28
last_updated: 2026-05-28
auto_scan_source: apps/*/src/components/ + apps/*/src/hooks/ + shared/
---

# Component Registry — kanonisk oversigt

> **Hvad denne fil ER:** Single source of truth for hvilke UI-komponenter og hooks der allerede findes på tværs af apps.
> **Hvad denne fil IKKE er:** API-dokumentation (det ligger i komponenten selv som JSDoc + props-interface).

## Formål

Forhindre at architect/builder genbygger eksisterende komponenter. **Architect SKAL tjekke denne fil FØR nye SPECs produceres** (se C2 i `WORKFLOW_UPGRADES_PLANNED.md`).

## Konvention

- 🟢 **Reusable** — kan genbruges som den er
- 🟡 **App-specifik** — designet til én app, kræver tilpasning for genbrug
- 🔴 **Legacy** — kandidat til erstatning/sletning
- 🌍 **Cross-app candidate** — brugt af 2+ apps → bør flyttes til `shared/components/`

## Initial scan udført

2026-05-28 — første auto-genererede version. **Manuelt vedligeholdt fremover** (eller via Storybook-introspection senere).

---

## Formand (web)

### UI-komponenter (`apps/formand/src/components/ui/`)

| # | Komponent | Status | Beskrivelse | Brugt i |
|---|---|---|---|---|
| 1 | `EtaBadge` | 🟢 | ETA-pille med Clock/Truck-ikon + farve baseret på forsinkelses-grad (neutral/warn/bad) | Vejesedler-tabel |
| 2 | `TemperaturBadge` | 🟢 | Temperatur-pille med OK/Lav-status mod min-temperatur | Vejesedler-tabel |
| 3 | `UdlaeggerDropdown` | 🟢 | Dropdown til valg af udlægger-materiel pr. vejeseddel | Vejesedler-tabel |
| 4 | `VejeseddelRow` | 🟢 | Row-renderer for én vejeseddel — delegerer til Temperatur/Eta/status-pille | Vejesedler-tabel |
| 5 | `VejesedlerTable` | 🟢 | Komplet vejeseddel-tabel med sortering, collapsible udlagt, sum-pille | Udførsel/Vejesedler-sektion |
| 6 | `ProgressBar` | 🟢 | Generisk progress-bar med fill + label | Multiple steder |
| 7 | `DagsoverblikSection` | 🟡 | Komplet sektion til dagens overblik (Udførsel-tab) | Udførsel/Dagsoverblik |
| 8 | `FremdriftCard` | 🟡 | Kort visning af fremdrift på en ordre | Udførsel/Dagsoverblik |
| 9 | `FremdriftInputRow` | 🟡 | Input-række til registrering af faktisk udlagt | Udførsel/Dagsoverblik |
| 10 | `OrdreInfoCard` | 🟡 | Header-kort med ordre-detaljer | Multiple |

### Layout (`apps/formand/src/components/layout/`)

| # | Komponent | Status | Beskrivelse |
|---|---|---|---|
| 11 | `AppShell` | 🟡 | Hoved-shell med top + bottom-nav |
| 12 | `BottomTabBar` | 🟡 | Bottom-navigation (Dashboard/Ordre/Profil) |
| 13 | `TopBar` | 🟡 | Top-bar med logo + bruger-info |

### Hooks (`apps/formand/src/hooks/`)

| # | Hook | Returns | Brugt i |
|---|---|---|---|
| 1 | `useOrders` | `{ orders, loading, error }` | Ordre-liste + detalje-views |
| 2 | `useDagsoverblik` | Aggregat af morgen-tons + fremdrift + vejesedler | Udførsel-mode |
| 3 | `useVejesedler` | Sortede vejesedler for dagens ordre | Vejesedler-tabel |
| 4 | `useDriverTasks` | Chauffør-tasks knyttet til ordre | Bil-tracking |
| 5 | `useRecept` | Recept-opslag pr. receptkode | TemperaturBadge, multi-produkt |

---

## Chauffeur (React Native)

### UI-komponenter (`apps/chauffeur/src/components/ui/`)

| # | Komponent | Status | Beskrivelse |
|---|---|---|---|
| 1 | `ActionButton` | 🟢 | Primær CTA-knap (outdoor-optimeret, 44+px touch) |
| 2 | `ContactCard` | 🟢 | Kontakt-kort med navn, rolle, tlf, click-to-call |
| 3 | `ErrorBanner` | 🟢 | Fejl-banner med dismiss + retry |
| 4 | `InfoCard` | 🟢 | Generisk info-kort med titel + indhold |
| 5 | `LocationCard` | 🟢 | Lokations-kort med adresse + navigations-link |
| 6 | `MessageWidget` | 🟢 | Lille besked-widget med badge-count |
| 7 | `OrderMetrics` | 🟢 | Metric-grid for ordre-fremdrift (tons/læs/timer) — 🌍 **også i gps_test** |
| 8 | `ProjectImage` | 🟢 | Projekt-billede med blur-up loading |
| 9 | `SectionLabel` | 🟢 | Sektion-titel med uppercase tracking |
| 10 | `StatCard` | 🟢 | Stat-kort med tal + label — 🌍 **også i gps_test** |
| 11 | `TaskCard` | 🟢 | Task-kort for chauffør-dashboard |
| 12 | `TaskSkeleton` | 🟢 | Loading-skeleton for TaskCard |
| 13 | `TransportIcon` | 🟢 | Ikon for transport-type (lastbil/blokvogn/kran-bånd) |

### Layout (`apps/chauffeur/src/components/layout/`)

| # | Komponent | Status | Beskrivelse |
|---|---|---|---|
| 14 | `BottomTabBar` | 🟡 | Bottom-navigation (chauffør-specifik) |
| 15 | `TaskSheet` | 🟡 | Bottom-sheet til task-detaljer |

### Messages (`apps/chauffeur/src/components/messages/`)

| # | Komponent | Status | Beskrivelse |
|---|---|---|---|
| 16 | `MessageBubble` | 🟢 | Chat-boble i samtale-view |
| 17 | `MessageCard` | 🟢 | Besked-preview i liste |
| 18 | `MessageInput` | 🟢 | Input-felt med send-knap |
| 19 | `ProjectTag` | 🟢 | Projekt-tag på besked |
| 20 | `TabSwitcher` | 🟢 | Tab-skift (Inbox/Sent/Drafts) |

### Screens-komponenter (`apps/chauffeur/src/components/screens/`)

| # | Komponent | Status | Beskrivelse |
|---|---|---|---|
| 21 | `DashboardHeader` | 🟡 | Header til chauffør-dashboard |
| 22 | `ImageGrid` | 🟢 | Billede-grid til billede-galleri |
| 23 | `TaskActions` | 🟡 | Action-knapper på task-detalje |
| 24 | `TaskHeader` | 🟡 | Header til task-detalje |
| 25 | `TaskSwiper` | 🟢 | Swipe-baseret task-skift |

### Hooks (`apps/chauffeur/src/hooks/`)

| # | Hook | Returns | Brugt i |
|---|---|---|---|
| 1 | `useTask` | Task-objekt + actions | TaskDetailScreen |

---

## Chauffeur-web (web-prototype)

Currently no production-components (kun prototype-skærme i `src/prototypes/chauffeur/`).

---

## Vognmand

Currently no production-components (kun prototype-skærme i `src/prototypes/`).

---

## GPS test (eksperimental)

| # | Komponent | Status | Note |
|---|---|---|---|
| 1 | `Button` | 🔴 | Generisk knap — kandidat til erstatning med ActionButton |
| 2 | `OrderMetrics` | 🌍 | Duplikat af chauffeur's OrderMetrics |
| 3 | `StatCard` | 🌍 | Duplikat af chauffeur's StatCard |

---

## Shared (`shared/`)

### Types (`shared/types/`)

| # | Type | Beskrivelse | Brugt i apps |
|---|---|---|---|
| 1 | `Order`, `Product`, `DayPlan` (`order.ts`) | Hoved-ordre-model | formand, vognmand |
| 2 | `TaskState`, `DriverStatus` (`driver.ts`) | Chauffør-task-model | chauffeur, formand |
| 3 | `JobReport` (`jobReport.ts`) | Job-rapport-struktur | formand |
| 4 | `Documentation` (`documentation.ts`) | Dokumentations-felter | formand |

### Components (`shared/components/`)

🔴 **EKSISTERER IKKE ENDNU** — første kandidater til cross-app deling (jf. 🌍-mærkede ovenfor):
- `OrderMetrics` (brugt i chauffeur + gps_test)
- `StatCard` (brugt i chauffeur + gps_test)

### Hooks (`shared/hooks/`)

🔴 **EKSISTERER IKKE ENDNU**

---

## Cross-app-genbrug — kandidater (🌍)

| Komponent | Apps der bruger | Anbefaling |
|---|---|---|
| `OrderMetrics` | chauffeur + gps_test | Flyt til `shared/components/` |
| `StatCard` | chauffeur + gps_test | Flyt til `shared/components/` |
| `BottomTabBar` | chauffeur (RN) + formand (Web) | **DO NOT MERGE** — forskellige platforme, kun navn-overlap |

---

## Sletnings-kandidater

| Komponent | Hvorfor | Action |
|---|---|---|
| `apps/gps_test/src/components/Button.tsx` | Generisk Button — erstattet af ActionButton (RN) / nativ button (Web) | Erstat efter gps_test er afsluttet |

---

## Næste skridt

1. **Architect-agentens prompt opdateres** (C2): Skal indlæse denne fil før SPECs produceres
2. **Cross-app deling** (C3): Flyt `OrderMetrics` + `StatCard` til `shared/components/`
3. **Manual vedligeholdelse**: Når nye komponenter produceres af builder, tilføj dem her (eller bedst: byg auto-update i ind i builder-agent-hook)
4. **Storybook-introspection** (fase 2): Auto-generér fra Storybook-stories i stedet for fil-scan

---

*Auto-genereret 2026-05-28 fra `apps/*/src/components/` + `apps/*/src/hooks/` + `shared/`*
