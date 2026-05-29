# Platform Requirements — Colas Transport Apps

> **Hvad**: Cross-cutting tekniske krav der gælder ALLE apps og sektioner — IKKE feature-arbejde.
> **Hvorfor**: Sektion-arbejde (CONTRACT.md, FLOWS.md) dækker forretningsfunktioner. Disse platform-krav er ortogonale og skal håndteres separat.
> **Status**: Klar til at importere som Asana-epics + tasks 2026-05-29.

---

## Sådan bruges denne fil

- **Asana-mapping**: Hver linje under "Tasks" bliver én Asana-task. Epic = kategorinavn.
- **Ownership**: Carsten assigner ejere efterhånden som agency-aftaler er på plads.
- **Definition of Done**: Hver task har sine egne acceptkriterier — afkrydses når task er komplet.
- **Sammenhæng med sektion-arbejde**: Platform-tasks kører **parallelt** med sektion-arbejde. En sektion kan godt være `live` selvom enkelte platform-tasks endnu ikke er færdige (fx Sentry kan komme senere) — men kritiske krav (a11y, push, offline) bør være på plads før første live-release.

---

## A. Observability

### A1. Crash-rapportering — Sentry (Web) + Crashlytics/Sentry (RN)

**Why**: Vi skal vide om der sker uventede fejl i produktion uden at brugerne rapporterer det.

**Tasks**:
- [ ] A1.1 — Vælg leverandør: Sentry til Web, Sentry RN eller Firebase Crashlytics til RN
- [ ] A1.2 — Opret konto + projekter (1 pr. app)
- [ ] A1.3 — Integrér SDK i `apps/formand`, `apps/vognmand`, `apps/chauffeur-web`
- [ ] A1.4 — Integrér i `apps/chauffeur` (RN)
- [ ] A1.5 — Source map upload til Sentry i CI/CD
- [ ] A1.6 — Slack-alert ved nye crashes
- [ ] A1.7 — Dashboard sat op + nøgletal defineret

**DoD**: Test-crash i preview-env vises i Sentry inden for 1 min. Crashes grupperes korrekt. Stack-trace er læsbar.

### A2. Performance-monitoring

**Why**: Vejarbejde sker i felten — bruger-oplevet ydelse ift. dårlig forbindelse er kritisk.

**Tasks**:
- [ ] A2.1 — Definér nøglemetrics (TTI, INP, LCP for web; cold-start, frame-rate for RN)
- [ ] A2.2 — Sentry Performance Monitoring eller alternativ
- [ ] A2.3 — Performance-budget pr. app (CONTRACT-amendment i alle apps)

**DoD**: Sentry rapporterer P50/P95 for nøglemetrics. Slack-alert hvis P95 overstiger budget.

### A3. Structured logging

**Why**: Når support spørger "hvad skete kl. 09:32 hos chauffør X?" skal vi kunne svare.

**Tasks**:
- [ ] A3.1 — Logging-bibliotek (pino eller console-wrapper med levels)
- [ ] A3.2 — Logs sendes til Sentry breadcrumbs eller separat log-aggregator
- [ ] A3.3 — Kritiske bruger-actions logges altid (send-til-fabrik, godkend-bil, etc.)

**DoD**: Search-bar finder logs pr. bruger-id + tidspunkt. PII (CPR, fuldt navn) maskeres.

---

## B. Resilience (offline + dårlig forbindelse)

### B1. Offline-håndtering — chauffør

**Why**: Asfaltvejarbejde foregår langt fra master. Chauffør SKAL kunne registrere ankomst, læsse, levere uden net.

**Tasks**:
- [ ] B1.1 — Strategi: Read-only cache + write-queue + auto-sync når online
- [ ] B1.2 — Service Worker / RN persistent storage til cached data
- [ ] B1.3 — Write-queue med retry-logik (eksponentiel backoff)
- [ ] B1.4 — Sync-status UI: "5 ændringer venter på upload"
- [ ] B1.5 — Konflikt-håndtering: last-write-wins eller server-side merge?
- [ ] B1.6 — Test-scenarier: airplane mode → 10 actions → reconnect → alt synced

**DoD**: Chauffør kan udføre fuld dag offline (ankomst → læsse → levere → afslut) og data synces korrekt når forbindelse er tilbage.

### B2. Offline-håndtering — formand

**Why**: Formand på byggeplads har samme dårlige forbindelse som chauffør.

**Tasks**:
- [ ] B2.1 — Asfaltbestilling SKAL kunne sendes offline (write-queue)
- [ ] B2.2 — Read: vejesedler-data caches lokalt (TTL 1 dag)
- [ ] B2.3 — Sync-status banner: "Offline — ændringer venter"
- [ ] B2.4 — Auto-retry når forbindelse er tilbage

**DoD**: Formand kan udfylde og sende bestillinger uden internet. Data flyver væk når forbindelsen er tilbage.

### B3. Performance under dårlig forbindelse

**Why**: Selv med forbindelse er båndbredden ofte minimal i felten.

**Tasks**:
- [ ] B3.1 — Lazy-load route-baserede chunks
- [ ] B3.2 — Billed-optimering (WebP, srcset, max 100KB pr. billede)
- [ ] B3.3 — Aggressive caching headers på statiske assets
- [ ] B3.4 — Skeleton-loaders ved alle data-fetches
- [ ] B3.5 — Test på throttled 3G-forbindelse

**DoD**: Initial load < 5s på simuleret 3G. Subsequent loads < 1s.

### B4. Background/foreground-state

**Why**: Chauffør lukker app, åbner timer senere — must work correctly.

**Tasks**:
- [ ] B4.1 — Refresh token-håndtering ved foreground
- [ ] B4.2 — Cached data invalidation efter X minutter background
- [ ] B4.3 — Genoptag i samme state (samme skærm/task)
- [ ] B4.4 — Test: lukke app i 4 timer + åbne = forventet adfærd

**DoD**: Bruger oplever ingen "frosset" eller "gået i stå"-app efter foreground-skift.

---

## C. Mobile-specifik (Chauffør-app)

### C1. Push-notifikationer

**Why**: Chauffør skal varsles om nye opgaver, vejr-aflysninger, "dag afsluttet", etc.

**Tasks**:
- [ ] C1.1 — Vælg leverandør: Expo Notifications eller Firebase FCM direkte
- [ ] C1.2 — APN-cert (iOS) + FCM-key (Android) konfigureret
- [ ] C1.3 — Permission-flow ved første launch + i Settings
- [ ] C1.4 — Topic-baseret routing (chauffør-id → notifikationer)
- [ ] C1.5 — Test: notifikation når app er foreground / background / killed
- [ ] C1.6 — Notifikations-historik i app (i tilfælde af missed)

**DoD**: Notifikation når frem inden for 30s i 99% af tilfælde. Klik på notifikation åbner korrekt skærm.

### C2. Deep links / universal links

**Why**: Link fra email/SMS til specifik opgave skal åbne app direkte.

**Tasks**:
- [ ] C2.1 — Universal links (iOS) + App Links (Android) konfigureret
- [ ] C2.2 — Domain ownership-fil deployed
- [ ] C2.3 — Link-handler routing til korrekt skærm
- [ ] C2.4 — Fallback til web hvis app ikke installeret

**DoD**: `https://colas.dk/task/[id]` åbner enten app eller web — aldrig en 404.

### C3. App-assets (ikon, splash, launch screens)

**Why**: Produktion kræver alle tætheder + alle målestørrelser.

**Tasks**:
- [ ] C3.1 — App-ikon (iOS: 1024x1024 + alle scaled. Android: adaptive icon)
- [ ] C3.2 — Splash screen (iOS LaunchScreen + Android splash-API)
- [ ] C3.3 — Launch screens i alle tætheder (1x, 2x, 3x for iOS)
- [ ] C3.4 — Mørk/lys-tema for ikon hvis relevant
- [ ] C3.5 — Expo splash.config.json + adaptive-icon.png

**DoD**: App-ikon ser rent ud på alle iOS + Android-enheder. Ingen "default" Expo-ikon i nogen build.

### C4. iOS/Android version-opdateringer

**Why**: Vi skal kunne update'e platform-deps uden nedbrud.

**Tasks**:
- [ ] C4.1 — Test-matrix dokumenteret (iOS 15+, Android 11+)
- [ ] C4.2 — Beta-program (TestFlight + Google Play Internal)
- [ ] C4.3 — Strategi for forced upgrade vs. graceful degradation
- [ ] C4.4 — Minimum-version-tjek ved app-start

**DoD**: Når Apple/Google udgiver ny iOS/Android-version, har vi en proces til at teste + reagere inden for 1 uge.

---

## D. Accessibility & internationalization

### D1. Localization

**Why**: Mulighed for udenlandske chauffører (polsk, baltisk, etc.) — afventer kunde-beslutning.

**Tasks**:
- [ ] D1.1 — Kunde-beslutning: kun dansk eller også engelsk/polsk?
- [ ] D1.2 — Hvis multi-lang: i18n-framework (react-i18next eller Lingui)
- [ ] D1.3 — String-extraction fra alle komponenter
- [ ] D1.4 — Sprog-vælger i Settings
- [ ] D1.5 — Dato/tal/valuta-formatering pr. locale

**DoD**: App fungerer fejlfrit på dansk. Andre sprog: per kundens beslutning.

### D2. Accessibility (a11y)

**Why**: Chauffører er ofte ældre, ude i sollys, bruger handsker. Apps SKAL være tilgængelige.

**Tasks**:
- [ ] D2.1 — WCAG 2.1 AA-audit på første sektion
- [ ] D2.2 — Kontrast: minimum 4.5:1 på text (testes via tooling)
- [ ] D2.3 — Touch targets: minimum 44×44px (allerede i AI_GUIDELINES)
- [ ] D2.4 — Farveblind-test: rød/grøn-blindhed mod status-pille-farver
- [ ] D2.5 — Skærmlæser-support (VoiceOver iOS, TalkBack Android)
- [ ] D2.6 — Keyboard-navigation på web-apps
- [ ] D2.7 — Outdoor-mode: høj kontrast-tema?

**DoD**: Accessibility-audit grøn på alle live-sektioner. Farveblind-test passes.

---

## E. Security

### E1. Auth-flow

**Why**: Hver app skal kun give adgang til relevante data + funktioner.

**Tasks**:
- [ ] E1.1 — Supabase Auth setup (når Supabase er klar)
- [ ] E1.2 — Login-flows pr. app (PIN, magic-link, eller andet)
- [ ] E1.3 — Token-refresh-håndtering
- [ ] E1.4 — Logout-flow + clear cache

**DoD**: Auth er bestået security-review.

### E2. RLS-policies

**Why**: Supabase Row Level Security skal være på ALLE tabeller.

**Tasks**:
- [ ] E2.1 — Policy pr. tabel når Supabase-skema er låst
- [ ] E2.2 — Test: bruger A kan IKKE læse bruger B's data
- [ ] E2.3 — Migration-script i `supabase/migrations/`

**DoD**: Penetration-test bekræfter at RLS er korrekt sat op.

### E3. Input-sanitization + XSS-beskyttelse

**Why**: Fritekst-felter (kommentar, ekstraarbejde-tekst) skal ikke kunne injecte HTML/JS.

**Tasks**:
- [ ] E3.1 — Aldrig `dangerouslySetInnerHTML` på user-content
- [ ] E3.2 — Server-side max-length validering på alle fritekst
- [ ] E3.3 — Audit alle eksisterende fritekst-input

**DoD**: XSS-payload i kommentar-felt rendres som plain text — aldrig som HTML.

---

## F. DevOps & Release

### F1. Deploy-pipelines

**Tasks**:
- [ ] F1.1 — Netlify deploy-config pr. web-app (allerede sat op for formand/vognmand)
- [ ] F1.2 — Preview-URLs pr. PR-branch (auto)
- [ ] F1.3 — Production-deploy ved merge til main
- [ ] F1.4 — Expo EAS build pipeline til chauffør (RN)
- [ ] F1.5 — TestFlight + Google Play Internal til beta-distribution

**DoD**: Hver PR får preview-URL. Main = live deploy. Mobile beta = 1-klik build.

### F2. Secrets-management

**Tasks**:
- [ ] F2.1 — Netlify env-vars (per app)
- [ ] F2.2 — Expo Secrets (chauffeur)
- [ ] F2.3 — GitHub Secrets til CI
- [ ] F2.4 — Rotation-procedure dokumenteret

**DoD**: Ingen secrets i git-historik (verificér med git-secrets-scan).

### F3. Release-management

**Tasks**:
- [ ] F3.1 — Semver-policy (major.minor.patch)
- [ ] F3.2 — Changelog auto-genereret fra conventional commits
- [ ] F3.3 — Release-tags på main (allerede konfigureret i git-agent)
- [ ] F3.4 — Rollback-strategi pr. app

**DoD**: Hver release har dokumenteret hvad der er ændret + hvordan rollback udføres.

---

## Status-overblik

| Kategori | Kritisk for live? | Status |
|---|---|---|
| A. Observability | 🟡 Nice-to-have for v1, must for v2 | Ikke startet |
| B. Resilience | 🔴 Kritisk for chauffør-app | Ikke startet |
| C. Mobile-specifik | 🔴 Kritisk for chauffør-app | Delvist (assets mangler) |
| D. A11y & i18n | 🟡 Skal afklares med kunde | Ikke startet |
| E. Security | 🔴 Kritisk inden første live-deploy | Afventer Supabase |
| F. DevOps | 🟢 Delvist på plads | Netlify klar, RN mangler |

---

## Næste skridt

1. **Carsten** opretter Asana-epics for A, B, C, D, E, F
2. Hver task bliver én Asana-ticket med ovenstående DoD
3. Prioritér: B (resilience) + C (mobile) først — de er afhængige af agency-arbejde
4. Sentry (A) + accessibility (D) kan komme parallelt
5. Security (E) blokerer ikke før Supabase er klar

---

*Sidste opdatering: 2026-05-29 — initial version. Opdater pr. kvartal.*
