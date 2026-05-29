# Agency Phone Briefing — Talking Points

> **Brug**: Telefonsamtale med agency-kandidat, ~30-45 min.
> **Mål**: Få afklaret om de er den rette match, og om de forstår vores setup.
> **Status**: 2026-05-29.

---

## Projektet — 30 sekunders pitch

Colas Danmark A/S monorepo. **4 web-apps + 1 RN-app** der koordinerer asfaltprojekter mellem formænd, vognmænd, chauffører og fabrikker. Backend: Supabase (under opsætning, alt mock pt.). Vi er **prototype-færdige**, klar til at refactore til produktion.

---

## Setup — talking points

### Stack
- **Web**: React 18 + TypeScript strict + Vite + Tailwind + Vitest + Storybook
- **Mobile**: Expo + React Native + TypeScript
- **Backend**: Supabase (planlagt — kommer parallelt)
- **CI**: GitHub Actions med lint + typecheck + test + commitlint + token-check
- **Deploy**: Netlify (web) + Expo EAS (mobil)

### Workflow
- **Trunk-based** med squash-merge — ingen develop-branch
- **PR-only** for alt arbejde (branch-protection sættes op før agency starter)
- **Conventional commits** CI-håndhævet
- **1 approver påkrævet** + auto-merge ved grøn CI
- **CODEOWNERS** auto-assigner reviewer

### AI-agent-suite (vores stack — Claude)
Vi har bygget en agent-orchestreret workflow:

| Agent | Rolle |
|---|---|
| interviewer | Scoper sektion, drafter contract |
| architect | Planlægger build-rounds + SPECs |
| builder | Bygger én komponent ad gangen |
| reviewer | Reviewer mod SPEC, signoff |
| test-writer | Skriver tests efter godkendelse |
| cleanup | File- + sektion-niveau cleanup |
| git-agent | Commits + PRs |

Auto-loop: builder → reviewer → builder (fix) → reviewer → test-writer (max 3 rounds, så eskalering).

---

## Hvad bureauet får pr. sektion

Vi har **fuldt scopede sektioner klar**. Når bureauet får tildelt fx Asfaltbestilling, får de en pakke i `Docs/Formand/asfaltbestilling/`:

- `KICKOFF.md` — forretnings-scope + brugerhistorier (~250 linjer)
- `CONTRACT.md` — testbare acceptkriterier (~1200 linjer, signed FROZEN)
- `FLOWS.md` — UX-flows (9 stk for Asfaltbestilling)
- `CUSTOMER_SPEC.md` — kunde-vendt læselig version
- `STATUS.md` — løbende status (agency vedligeholder)
- Section-manifest med komponent-scope (10 komponenter) + build-rounds

**Vigtig**: De refactorer fra eksisterende prototype — ikke greenfield. Prototypens line-numbers er angivet i section-manifestet.

---

## Frosne regler (UFRAVIGELIGT — talk om disse)

- **Tokens** — ingen hex, ingen raw px (også i prototyper)
- **Container/Presenter-pattern** — container ejer state, presenter modtager props
- **Mock-data i `src/mocks/`** med `// TODO: Erstat med Supabase når klar`
- **Status-vokabular**: dansk + ASCII + snake_case
- **Datoformat**: ISO storage + "16. marts 2026" UI
- **Tons-format**: komma som decimal i UI (24,5 t)

**Talking point**: Vi har låst mange beslutninger op-front så bureauet ikke skal opfinde stil under arbejdet. Det giver hurtigere onboarding og ensartet output.

---

## Definition of Done

| Niveau | Krav |
|---|---|
| **Komponent** | TypeScript + lint + 80% test coverage + Storybook + handoff m. signoff + reviewer-signoff GODKENDT |
| **Sektion** | Alle komponenter done + e2e-tests + cleanup-rapport + Carsten + kunde signed |
| **PR** | CI grøn + 1 approver + conversations resolved |

---

## Platform-krav (PARALLEL TIL feature-arbejde)

Disse er **cross-cutting**, ikke sektion-specifikke. Talking point: agency skal kunne håndtere de typer arbejde også, ikke kun feature-builds.

| Kategori | Eksempler |
|---|---|
| **Observability** | Sentry/Crashlytics, performance-monitoring |
| **Resilience** | Offline-håndtering, dårlig forbindelse, background/foreground-state |
| **Mobile** | Push-notifikationer, deep links, app-ikon/splash, iOS/Android-version |
| **A11y + i18n** | WCAG 2.1 AA, kontrast for outdoor, evt. polsk/engelsk-localization |
| **Security** | RLS-policies (når Supabase live), XSS-sanitization |
| **DevOps** | Netlify pipelines (klar), Expo EAS (mangler) |

Fuld liste: `PLATFORM_REQUIREMENTS.md` (~40 konkrete tasks klar til Asana-import).

---

## Spørgsmål at stille til agency

### Erfaring med stacken
- React + TypeScript strict mode — hvor seniorlevels?
- React Native + Expo — har de tidligere builds i App Store / Google Play?
- Supabase — har de arbejdet med RLS-policies + edge-functions?
- Tailwind + design-token-systemer

### Workflow-fit
- Komfortable med PR-only flow + 1-approver?
- Erfaring med conventional commits?
- Bruger de selv AI-værktøjer (Claude, Cursor, Copilot)?
- Hvordan håndterer de auto-orchestrated workflows (vores agent-loop)?

### Mobile-specifik
- Erfaring med push-notifikationer (FCM/APN)?
- Offline-first apps + sync-konflikter?
- App Store + Google Play release-processer?

### Kapacitet
- Hvor mange devs er allokeret?
- Senior/junior-fordeling?
- Hvor hurtigt kan de starte?
- Hvilke timezones?
- Daglig overlap med dansk arbejdstid?

### Kommunikation
- Slack OK?
- Asana for tickets OK?
- Daily standup eller async?
- Sprint-længde de foretrækker?

### Praktisk
- Pricing-model (fixed pr. sektion vs. hourly vs. retainer)
- Hvad er deres typiske onboarding-tid?
- Hvem er kontaktpersonen (agency-lead)?

---

## Hvad du IKKE skal love endnu

- ❌ Specifik launch-dato (Supabase-setup-tid afhænger af agency-allokering)
- ❌ Specifik scope ud over Asfaltbestilling (afhænger af pilot-resultat)
- ❌ Adgang til repo før branch-protection er aktiveret
- ❌ Direkte ejer-rettigheder før agency-aftaler er underskrevet

---

## Hvad du KAN love

- ✅ Klar scope pr. sektion (ikke vage "vi finder ud af det")
- ✅ Konkrete kvalitetsbarer (DEFINITION_OF_DONE)
- ✅ AI-agent-stack der reducerer onboarding-friktion
- ✅ Documenteret workflow (CONTRIBUTING + AGENCY_ONBOARDING)
- ✅ Quick feedback via PR-flow + Slack

---

## Næste skridt EFTER samtalen

Hvis match:
1. Send `AGENCY_ONBOARDING.md` + `AI_GUIDELINES.md` + `CONTRIBUTING.md` + `DEFINITION_OF_DONE.md` + `PLATFORM_REQUIREMENTS.md` til agency-lead som forberedelse
2. Aktivér branch-protection (`BRANCH_PROTECTION_SETUP.md`)
3. Tilføj agency-lead som GitHub-collaborator (read-access først)
4. Test PR-flow med agency-lead på en lille docs-PR
5. Tildel Asfaltbestilling som første sektion
6. Daily-checkin i Slack første uge

Hvis ikke match:
- Tak for tiden + bevar dem som backup-kontakt
- Fortsæt søgning

---

*Sidste opdatering: 2026-05-29*
