# Agency Onboarding — Colas Transport Apps

> **Velkommen.** Læs denne side på ~5 minutter. Den fortæller HVOR du finder detaljer — ikke hele historien.

---

## 1. Hvad er Colas-projektet

Monorepo med 4 produktion-apps + 1 prototype-app der koordinerer asfalt-projekter mellem formænd, vognmænd, chauffører og fabrikker. Backend kommer på Supabase (under opsætning).

| App | Platform | Bruger | Status |
|---|---|---|---|
| `apps/formand` | Web (React + Vite) | Formand | Aktiv prototype + dev-ready sektioner |
| `apps/vognmand` | Web (React + Vite) | Vognmand | Prototype |
| `apps/chauffeur` | iOS + Android (Expo) | Chauffør | Aktiv prototype |
| `apps/chauffeur-web` | Web (preview af RN) | (intern) | Prototype |
| `apps/fabrik`, `apps/kunde` | Web | Fabrik/Kunde | Planlagt |

---

## 2. Repo-tur (de 5 vigtigste paths)

```
Colas/
├── apps/                       # Alle apps' kode
│   └── [app]/
│       ├── src/components/     # Produktion-komponenter (DONE per DEFINITION_OF_DONE)
│       ├── src/prototypes/     # UX-eksperimenter — ALDRIG import i produktion
│       ├── src/hooks/          # Data-hooks
│       ├── src/mocks/          # Mock-data (TODO: Supabase når klar)
│       └── src/types/          # App-lokale typer
├── shared/types/               # Cross-app types — SINGLE SOURCE OF TRUTH
├── Docs/[App]/[sektion]/       # Forretnings-docs per sektion (KICKOFF, CONTRACT, FLOWS, CUSTOMER_SPEC, QA, SPECs, handoffs)
└── .claude/                    # AI-agenter, workflow, section-manifests
    ├── agents/                 # Agent-definitioner (interviewer, builder, reviewer, m.fl.)
    ├── sections/[app]/         # Section-manifests — lifecycle-tracker per sektion
    └── docs/                   # FUNCTIONAL_FLOWS, STATUS_VOKABULAR, DATOFORMAT, COMPONENT_REGISTRY m.fl.
```

---

## 3. LÆS DISSE FØRST (i denne rækkefølge)

1. **[README.md](./README.md)** — projekt-overview + dev-setup
2. **[CONTRIBUTING.md](./CONTRIBUTING.md)** — branch-strategi, commit-format, PR-flow
3. **[AI_GUIDELINES.md](./AI_GUIDELINES.md)** — projekt-stil + AI-værktøjer + frosne beslutninger
4. **[DEFINITION_OF_DONE.md](./DEFINITION_OF_DONE.md)** — hvornår er noget færdigt
5. **[.claude/docs/COMPONENT_REGISTRY.md](./.claude/docs/COMPONENT_REGISTRY.md)** — eksisterende komponenter (forhindrer dobbelt-arbejde)

Når du har læst de 5: du er klar til at starte.

---

## 4. AI-agenter (vores workflow)

Projektet bruger Claude's agent-suite. Du kalder dem via slash-kommandoer eller via Claude Code:

| Agent | Når du bruger den |
|---|---|
| `/interview [sektion]` | Start ny sektion fra prototype |
| `/develop-screen [sektion]` | Plan + byg sektion til produktion |
| `/review [fil]` | Read-only review mod REVIEW_SPEC |
| `/cleanup [fil]` | Single-file cleanup (tokens, dead code) |
| `/cleanup-section [sektion]` | Sektion-niveau cleanup før live |
| `/git` | Commit i prototype-fase (auto i dev-fase) |
| `/bg "[opgave]"` | Smårettelser i baggrunden |

**Vigtigt**: I dev-fase auto-dispatcher agenterne sig selv. Du behøver kun starte loopet med `/develop-screen` — så kører builder → reviewer → builder (fix) → reviewer → test-writer automatisk.

Læs **[AI_GUIDELINES.md sektion 6](./AI_GUIDELINES.md)** for fuld agent-oversigt.

---

## 5. Git-flow

```
1. Pick en sektion (eller GitHub-issue tildelt dig)
2. git checkout -b feature/[sektion]-[komponent]   (eller feature/[ticket-ID])
3. Byg lokalt — brug Claude's agents
4. git push -u origin feature/...
5. gh pr create  (PR-template udfyldes automatisk)
6. CI kører — lint + typecheck + test + commitlint
7. Reviewer godkender (1 approver påkrævet)
8. Auto-merge til main (squash)
9. Branch slettes auto
```

**Du kan IKKE pushe direkte til main** — branch-protection blokkerer det. Alt går via PR.

---

## 6. Første-dag-tjekliste

- [ ] **Læs de 5 docs** i punkt 3 ovenfor (~30 min)
- [ ] **Få adgang** til repo + Slack + Asana (Carsten setupper)
- [ ] **Klon repo** og kør lokalt — bekræft at en app starter (`npm run formand:dev`)
- [ ] **Tjek hvilken sektion** du er tildelt → læs dens `CONTRACT.md` + section-manifest
- [ ] **Lav første "hello world"-PR** — kan være docs-rettelse eller typo-fix
- [ ] **Bekræft CI er grøn** på din PR
- [ ] **Stil spørgsmål** på Slack hvis noget er uklart

---

## 7. Hvor du får hjælp

| Hvor | Hvad |
|---|---|
| **Slack #colas-dev** | Hurtige spørgsmål, design-diskussioner |
| **Asana COL-projekt** | Tickets, backlog, sprint-planning |
| **GitHub Issues** | Bugs + feature-requests (med issue-templates) |
| **GitHub Discussions** (hvis aktiveret) | Længere arkitektur-tråde |
| **Carsten direkte** | Eskaleringer + business-logik-spørgsmål |

---

## 8. Project state — hvor er vi nu?

- 🟢 **Prototype**: Alle apps har prototyper i drift
- 🟡 **Workflow setup**: Auto-orchestration mellem agents netop færdigt 2026-05-29
- 🟡 **Asfaltbestilling**: Dev-ready (CONTRACT signed) — første sektion klar til implementation
- 🔴 **Supabase**: Endnu ikke opsat — mock-data overalt
- 🔴 **Branch-protection**: Sætter Carsten op på GitHub UI

---

## 9. Hvad du IKKE skal gøre

- ❌ Direct push til main (blokeret)
- ❌ Commit `.env`-filer
- ❌ Bryde frosne beslutninger uden CONTRACT-amendment
- ❌ Bygge nye komponenter uden at tjekke COMPONENT_REGISTRY
- ❌ Ignorere reviewer-issues — fix dem, eller marker som DISPUTED med begrundelse
- ❌ Antage at "det er bare en prototype" gælder produktion-PRs

---

## 10. Når du er klar

Spørg Carsten om:
1. Hvilken sektion eller issue du skal tage først
2. Hvor du finder den i Asana
3. Estimat-forventning (hvor mange dage)

Velkommen til Colas. 🚛

---

*Sidste opdatering: 2026-05-29 — F8 implementering*
