# Project Status — Colas Transport Apps

**Last updated**: 2026-05-11
**Current phase**: Vognmand — Gantt prototype fase 1 i gang

---

## Naeste skridt (denne session)

### Vognmand — Gantt prototype (aktiv)
1. **Reviewer Gantt-prototypen** med bruger — justeringer efter feedback
2. **Disponerings-view** (DayScreen) — bygges efter Gantt er godkendt
3. **Navigation** fra Gantt-celle → disponerings-view (TODO-placeholders i kode)

### Formand (parkeret)
1. **Upgrade OrdrePlanScreen prototype** — `/upgrade-prototype OrdrePlanScreen formand`
2. **Skrive foerste tests** — BottomTabBar + TopBar komponenter
3. **Koble Netlify til GitHub** — bruger goer dette i browseren (se nedenfor)

---

## Faerdiggjort

### 2026-05-04 — Agency setup + CI/CD + deploy

- [x] CLAUDE.md omskrevet: alle 5 apps, korrekte doc-referencer, workflow-guide
- [x] Alle slash-kommandoer oprettet i `.claude/commands/`:
  - `/review` — korer REVIEW_SPEC med CRITICAL/RECOMMENDED/NICE-TO-HAVE output
  - `/new-component [Navn] [app]` — scaffold komponent + story + test
  - `/new-page [Navn] [app] [route]` — scaffold side + hook + route
  - `/new-hook [useNavn] [app]` — scaffold data-hook + test
  - `/audit-tokens [mappe]` — find hardcodede vaerdier
  - `/status` — vis projekt-status
  - `/cleanup [fil]` — fjern doed kode, flyt logik til hooks, fix tokens
  - `/test [fil]` — skriv komponent/hook tests
  - `/upgrade-prototype [Navn] [app]` — prototype → produktion workflow
- [x] DESIGN_SYSTEM.md omskrevet med faktiske Colas tokens (tailwind.config.ts)
- [x] OFFLINE_STRATEGY.md oprettet: useOnlineStatus, TanStack Query patterns, optimistic UI
- [x] WORKFLOW.md + STARTUP.md som session-referenceguider
- [x] README.md — professionel med arkitekturdiagram og app-tabel
- [x] CONTRIBUTING.md — branching, commit-format, PR-workflow, quality gates
- [x] `.github/workflows/ci.yml` — GitHub Actions: formand (typecheck+lint+test+build) + chauffeur (typecheck)
- [x] `.github/pull_request_template.md` — PR-tjekliste
- [x] `apps/formand/.env.example` — VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
- [x] `apps/formand/vitest.config.ts` — jsdom, coverage 80%/70%, excluder prototypes
- [x] `apps/formand/eslint.config.js` — TypeScript + react-hooks + jsx-a11y
- [x] `apps/formand/.prettierrc` — semi:false, singleQuote:true
- [x] Typer i `apps/formand/src/types/`:
  - `order.ts` — Order, Product, DayPlan, Factory, Resource, TransportPlan, ScheduleRow, m.fl.
  - `driver.ts` — Driver, DriverTask, TaskState, DriverStatus
  - `documentation.ts` — HaendelsesDokumentation
  - `jobReport.ts` — JobReportEntry
- [x] Mock-data i `apps/formand/src/mocks/`: orders.ts + drivers.ts
- [x] Hooks i `apps/formand/src/hooks/`: useOrders.ts + useDriverTasks.ts
- [x] Typer spejlet i `shared/types/` (single source of truth)
- [x] `netlify.toml` ved repo-rod — base=apps/formand, peger paa dist/
- [x] Kode pushet til GitHub: `carsten-cmyk/Colas_app`

### Tidligere (Chauffeur app)

- [x] SplashScreen, Dashboard, BottomTabBar, TaskSwiper, TaskCard
- [x] Beskeder-sektion (MessagesListScreen, ConversationScreen, NewMessageScreen)
- [x] Storybook v10 sat op
- [x] GPS test MVP (gps_test app)

---

## Netlify — mangler (bruger skal gore i browser)

For at `colastransportapp.netlify.app` viser formand-prototypen:
1. Ga til Netlify dashboard → Sites → colastransportapp
2. Site settings → Build & deploy → Link to Git repository
3. Vaelg: GitHub → carsten-cmyk/Colas_app
4. `netlify.toml` haandterer resten automatisk (base, command, publish)

---

## Tech debt / prototype gaps (Formand)

- [ ] `OrdrePlanScreen` er prototype — skal opgraderes til produktionskode
- [ ] Ingen tests endnu — start med BottomTabBar + TopBar
- [ ] Ingen Storybook stories endnu
- [ ] Al data er mock — Supabase ikke tilkoblet
- [ ] `.env.local` mangler (bruger skal oprette fra `.env.example`)

---

## Miljoeer (planlagt)

| Miljoe | Branch | Supabase | Netlify |
|---|---|---|---|
| Dev | `develop` | dev-projekt | auto-deploy ved push |
| Staging | `staging` | staging-projekt | auto-deploy ved push |
| Prod | `main` | prod-projekt | auto-deploy ved push |

Oprettes efter moede med Colas (Colas-ejede konti).

---

## Naestekommende

- [ ] Supabase schema baseret paa datamodel (order.ts + driver.ts)
- [ ] Autentifikation (email/password)
- [ ] Dagsoversigt (/) — naeste skraem efter OrdrePlanScreen
- [x] Vognmand-app (apps/vognmand/) — bootstrapped, Gantt-prototype korer paa port 5177

### Vognmand — prototype (2026-05-11)
- [x] App-shell med topbar (Colas-logo, height 52) + sidebar (280px, bg-page)
- [x] Sidebar: Transportør-info i bunden, menu: Aktive ordre + Ordre arkiv
- [x] Aktive ordre (liste-view): kort per ordre, dag-tabel med kolonner, Disponer-knap (grøn)
- [x] Kalender view (Gantt): uge/14-dage/måned toggle, periode-navigation
- [x] View-toggle på begge sider: Aktive ordre ↔ Kalender view
- [x] Typer udvidet: mødetidFabrik, tidFabrikTilPlads, kommentar, TidligereKørtBil
- [x] Kører på port 5177

### Næste: Disponerings-view
- [ ] Klik på "Disponer" → ordre-detalje med biltildeling per dag
- [ ] Spec afklares med bruger
