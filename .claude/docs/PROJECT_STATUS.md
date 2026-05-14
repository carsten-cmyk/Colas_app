# Project Status — Colas Transport Apps

**Last updated**: 2026-05-13
**Current phase**: Chauffør web-prototype (aktiv)

---

## Naeste skridt (næste session)

### Chauffør web-prototype — NÆSTE: Deploy til Netlify ⭐
`apps/chauffeur-web` er bygget og klar. Kør: `npm run chauffeur-web:dev`

**Tilbage:**
1. Opret Netlify site `colas-chauffoer.netlify.app` — tilføj `netlify.toml` i apps/chauffeur-web
2. Sæt `VITE_DEMO_PIN` env var i Netlify dashboard
3. (Valgfrit) Port timereg-skærm fra `apps/chauffeur/src/prototypes/timereg/TimeRegistrationScreen.tsx`

### Formand — Udførelse-mode (parkeret)
1. **Sektion 2 i Udførelse** — Live overblik: næste bil-banner + biler-tabel + statusser (På vej/Ankommer/Læsser/Venter), Erstat-knap
2. **Sektion 3 i Udførelse** — Afslut dag: Godkend timer / Afvigelse / Dokumentér

### Materiel → Vognmand flow (klar til prototype)

**Flow:**
1. Formand planlægger afhentningssted + aflæsningssted per materiel-enhed (adresse, eller pin på kort over udførselssted)
2. Hver materiel-enhed sendes som **separat linje** til vognmandens løsning
3. Vognmanden disponerer ved at trække en blokvogn/transport hen over en materiel-linje — samme bil kan trækkes til flere linjer (da kapacitet er svær at vurdere)
4. Når materiel er disponeret bekræfter vognmanden — badge og Udførelse-sektion opdateres som ved biler

**UI:**
- **Planlægning → Materiel**: Badge "Bekræftet af vognmand" / "Afventer vognmand" per materiel-enhed (samme stil som Asfalt kørsel)
- **Udførelse**: Ny sektion "Materiel" (samme layout som "Bestilte biler") med bekræftede transport-oplysninger

**Ordre-struktur — afklaret:**
- Formand: Materiel og Asfalt kørsel forbliver separate sektioner på samme ordre — hvert får sit eget "Bekræftet af vognmand"-badge
- Vognmand: Materiel-linjer vises som en ekstra sektion UNDER Asfalt kørsel-disponeringen på den pågældende ordre — ikke som separat ordre. Vognmanden disponerer begge dele på ét sted.

**Kort/pin:** Hvis ingen pin er sat på kortet vises blot adressen. Kort-funktionalitet er en fremtidig feature.

### Ideer til næste fase

- **Forundersøgelse — mobil visning**: Forundersøgelse egner sig til en dedikeret mobiloptimeret side/view, så formanden kan tage sin telefon frem på pladsen, fotografere underlag og udfylde felter. Kan bygges som en responsiv webapp-rute (`/forundersoegelse/:ordreId`) med fuld-skærm kamera-adgang.
  - **Kamera**: `<input type="file" accept="image/*" capture="environment">` — åbner bagkameraet direkte, virker i alle mobilbrowsere inkl. Safari på iOS uden native app. Kræver HTTPS (opfyldt via Netlify). Valgt frem for `getUserMedia` da live preview er overkill til dette formål.
  - **Mikrofon**: Web Speech API (`SpeechRecognition`) virker i Chrome/Safari på mobil som webapp. Mikrofon-ikon på Forbehold og Aftalt med-felterne. Vises kun hvis `window.SpeechRecognition` / `window.webkitSpeechRecognition` er tilgængeligt.

### Formand (parkeret)
- Skrive første tests — BottomTabBar + TopBar komponenter
- Upgrade OrdrePlanScreen prototype til produktionskode

---

## Faerdiggjort

### 2026-05-13 — Agency setup

- [x] 6 specialiserede agenter i `.claude/agents/`: architect, builder, reviewer, test-writer, cleanup-agent, git-agent
- [x] `FUNCTIONAL_FLOWS.md` oprettet med bil-tildeling flow + materiel-flow (planlagt)
- [x] `CLAUDE.md` revideret: chauffeur-web tilføjet, vognmand live, agent-tabel, ny token-regel for prototyper
- [x] Nye kommandoer: `/develop-screen`, `/git`, `/token-check`
- [x] Eksisterende kommandoer opgraderet til agent-delegation
- [x] `STARTUP.md` simplificeret — ingen manuel paste
- [ ] `chauffeur-web` token-audit (klar til test med `/token-check`)

### 2026-05-13 — Chauffør web-prototype

- [x] `apps/chauffeur-web` — Vite/React/Tailwind, identisk setup som formand/vognmand
- [x] PIN-login (identisk design med formand + vognmand)
- [x] iPhone 14 Pro CSS-ramme (393×852px, Dynamic Island, home indicator, side buttons)
- [x] SplashScreen — split layout, hero-billede, gul stribe, hilsen + start-knap
- [x] DashboardScreen — Colas logo, billedgitter, TaskSwiper med snap-scroll
- [x] TaskDetailScreen — bund-ark med ordre-metrics, lokationer, info/kontakt/alarm-kort, handlingsknapper
- [x] MessagesListScreen — indbakke/arkiv tabs, samtale-kort
- [x] ConversationScreen — chat-bobler, projekt-banner, send-input
- [x] BottomTabBar — 5 tabs med aktiv-indikator og ulæst-badge
- [x] State-baseret navigation (identisk med original React Native app)
- [x] `publicDir: '../formand/public'` — deler hero-worker.png + colas-logo.png
- [x] `npm run chauffeur-web:dev` tilføjet til rod-package.json
- [ ] Netlify deploy (`colas-chauffoer.netlify.app`) — mangler netlify.toml

### 2026-05-13 — Vognmand bekræftelse UI

- [x] Grønt "Bekræftet af vognmand" badge på dag i Asfalt kørsel (Planlægning)
- [x] Gult "Afventer vognmand" badge når kørsel er planlagt men ikke bekræftet
- [x] Bekræftet bilbestilling-kort på Udførelse → Forundersøgelse (reg.nr, chauffør, tlf, biltype)
- [x] "Afventer bekræftelse fra vognmand"-tilstand med pulserende gul dot
- [x] VognmandBekraeftelse type + INITIAL_VOGNMAND_BEKRAEFTELSER mock-data
- [x] Forudfyldte kørselordre (d2-1 + d2-2) + kørselPlanlagtIds til demo

### 2026-05-12 — Formand Udførelse-mode + datafelt-dokumentation

- [x] Udførelse-mode oprettet med mode-switch (Planlægning / Udførelse / Evaluering)
- [x] Sektion 1: Forundersøgelse — underlag dropdown, tilstand Ja/Nej, årsager, forbehold, billeder
- [x] Billeder fra Forundersøgelse synkerer til Dokumentation med "Forundersøgelse"-badge
- [x] Ekstraarbejde — ekspanderer inline, 25 typer, linje-niveau beskrivelse + antal, sendes til projektleder
- [x] Asfalt kørsel — km-input (km × 1 = minutter), kommentar til vognmand per dag
- [x] DATA_FIELDS.md — komplet feltliste + formand→vognmand flow + IT-arkitekturplan
- [x] Live på Netlify: formandsapp.netlify.app

### 2026-05-11 — Vognmand prototype FÆRDIG + live

- [x] App-shell: topbar + sidebar (Aktive ordre m. badge, Ordre arkiv)
- [x] Liste-view: ordrekort, dag-tabel, filter-tabs (Åbne/Disponeret/Alle)
- [x] Gantt/Kalender-view: uge/14-dage/måned, navigation
- [x] Disponerings-view: flåde-panel erstatter sidebar, drag-and-drop, præudfyld fra tidl. kørte
- [x] Bil-profil modal: rediger bil, opret chauffør, slet bil
- [x] Godkend-flow: bekræftelsesside + tab-navigation tilbage
- [x] PIN-login (identisk design med formand)
- [x] Live på Netlify: colas-vognmand.netlify.app

### 2026-05-04 — Agency setup + CI/CD + deploy

- [x] CLAUDE.md omskrevet: alle 5 apps, korrekte doc-referencer, workflow-guide
- [x] Alle slash-kommandoer oprettet i `.claude/commands/`
- [x] DESIGN_SYSTEM.md, OFFLINE_STRATEGY.md, WORKFLOW.md, STARTUP.md
- [x] README.md, CONTRIBUTING.md, CI/CD (GitHub Actions)
- [x] Typer, mock-data, hooks i formand-app
- [x] netlify.toml + formand live på formandsapp.netlify.app

### Tidligere (Chauffeur app)

- [x] SplashScreen, Dashboard, BottomTabBar, TaskSwiper, TaskCard
- [x] Beskeder-sektion
- [x] Storybook v10

---

## Tech debt / prototype gaps

### Formand
- [ ] `OrdrePlanScreen` er prototype — skal opgraderes til produktionskode
- [ ] Ingen tests endnu
- [ ] Al data er mock — Supabase ikke tilkoblet

### Vognmand
- [ ] disponeringState.ts er module-level Set — skal erstattes med Supabase realtime
- [ ] Bil-profil gem er kun lokalt i session — ingen persistens
- [ ] Ingen tests

---

## Miljoeer (planlagt)

| Miljoe | Branch | Supabase | Netlify |
|---|---|---|---|
| Dev | `develop` | dev-projekt | auto-deploy ved push |
| Staging | `staging` | staging-projekt | auto-deploy ved push |
| Prod | `main` | prod-projekt | auto-deploy ved push |
