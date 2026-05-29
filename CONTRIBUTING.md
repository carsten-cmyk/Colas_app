# Bidragsguide — Colas Transport Apps

> **Status**: LÅST 2026-05-29 (komplet revision). For agency-onboarding, start på [AGENCY_ONBOARDING.md](./AGENCY_ONBOARDING.md).

---

## 1. Kom i gang

```bash
git clone https://github.com/carsten-cmyk/Colas_app.git
cd Colas
npm install
cd apps/formand && npm install
cd ../chauffeur && npm install
cp apps/formand/.env.example apps/formand/.env.local
```

Start en app:
```bash
npm run formand:dev          # port 5174
npm run vognmand:dev         # port 5175
npm run chauffeur-web:dev    # port 5176
```

---

## 2. Branch-strategi

Vi bruger **trunk-based development med squash-merge**.

```
main                         — produktion, altid stabil. PROTECTED (kan ikke pushes direkte til)
feature/[sektion]-[komponent] — nye komponenter (fx feature/asfaltbestilling-StatusPill)
feature/[ticket-ID]          — task fra Asana (fx feature/COL-123-bilnedbrud)
fix/[sektion]-[issue-id]     — bugfixes (fx fix/asfaltbestilling-I-007)
docs/[topic]                 — rene docs-ændringer
chore/[topic]                — config, tooling, setup
hotfix/[issue]               — akutte prod-fixes
```

**Opret branch fra main**:
```bash
git checkout main
git pull
git checkout -b feature/asfaltbestilling-StatusPill
```

---

## 3. Commit-format (CI-håndhævet)

**Conventional Commits** — håndhævet af commitlint i CI.

```
type(scope): subject

[optional body]

[optional footer(s)]
```

**Tilladte types**: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `style`, `perf`, `ci`, `build`, `revert`

**Scope-konvention**:
- Single app: `feat(formand): ...`
- App + sektion: `feat(formand/asfaltbestilling): ...`
- Workflow: `chore(workflow): ...`
- Tværgående: `docs: ...` (uden scope)

**Eksempler**:
```
feat(formand/asfaltbestilling): add SendBekraeftelsesModal
fix(vognmand): correct disponering-state when sidste-læs is allocated
docs: update DEFINITION_OF_DONE with cleanup-step
chore(workflow): B8 git-agent upgrade
```

**Subject-regler**:
- ≤100 tegn
- Imperativ (`add`, ikke `added`)
- Dansk og engelsk OK — vælg det der bedst beskriver ændringen

---

## 4. Pull Request-flow

### Du må IKKE pushe direkte til `main` — branch-protection blokkerer.

**Standard flow**:

1. **Opret feature-branch** fra main (jf. punkt 2)
2. **Byg + committ** lokalt
3. **Push til remote**:
   ```bash
   git push -u origin feature/asfaltbestilling-StatusPill
   ```
4. **Åbn PR**:
   ```bash
   gh pr create --fill
   ```
   eller via GitHub UI. PR-template udfyldes automatisk.

5. **CI kører automatisk** — lint + typecheck + test + commitlint + build
6. **Reviewer auto-assignes** via CODEOWNERS
7. **Reviewer godkender** (1 approving review påkrævet)
8. **Auto-merge** sker når alle gates er grønne (squash til main)
9. **Branch slettes automatisk**

### PR-template

`.github/pull_request_template.md` udfyldes automatisk når du åbner PR. Udfyld ALLE sektioner — tomme tjeklister = PR afvises ved review.

### Auto-merge

Aktiveret pr. default. Sker når:
- ✅ 1 approving review
- ✅ Alle CI-checks grønne
- ✅ Ingen ulæste conversations
- ✅ Branch up-to-date med main

---

## 5. Code review

### Hvem reviewer

- **Carsten** (`@carsten-cmyk`) — alle PRs i transition-periode
- **Agency-leads** — domain-specifikke PRs (per CODEOWNERS)
- **Reviewer-agent** (Claude) — kan auto-køre inline-kommentarer (kommer i fase 2)

### Hvad reviewer tjekker

- Følger `DEFINITION_OF_DONE.md` (komponent-niveau)
- Følger `AI_GUIDELINES.md` (projekt-stil)
- Tokens overholdt (ingen hex, ingen raw px)
- Tests dækker accept-kriterier fra CONTRACT
- Handoff-fil med builder-signoff er committet
- Cross-app effekter dokumenteret i FUNCTIONAL_FLOWS hvis nye

### Hvis reviewer beder om ændringer

1. Læs feedback grundigt
2. Lav ændringer i samme branch
3. Push igen — CI re-kører
4. Marker conversation som "resolved" når du har addresseret den
5. Re-request review

---

## 6. Sektion-arbejde (workflow)

Hvis du arbejder på en hel sektion (ikke kun en komponent):

```
1. Tjek section-manifest: .claude/sections/[app]/[sektion].md
2. Tjek STATUS.md: Docs/[App]/[sektion]/STATUS.md
3. Læs CONTRACT.md (frozen acceptkriterier)
4. Brug Claude's agents:
   /develop-screen [sektion] [app]    → architect planlægger
   Auto-loop kører: builder → reviewer → ... → test-writer
5. Når sektion DONE (jf. DEFINITION_OF_DONE.md):
   /cleanup-section [sektion] [app]   → cleanup-rapport produceres
6. Carsten godkender cleanup → marker section_phase: live
```

Læs **[AI_GUIDELINES.md](./AI_GUIDELINES.md)** for agent-suite detaljer.

---

## 7. Tests

```bash
npm run [app]:test           # unit + integration
npm run [app]:test:e2e       # e2e (når sat op)
npm run [app]:typecheck      # TypeScript
npm run [app]:lint           # ESLint
```

**Coverage-mål**: 80% lines / 80% functions / 70% branches.

CI håndhæver alle 4 før merge.

---

## 8. Lokal pre-commit hook (anbefalet)

For at fange fejl FØR push:

```bash
# Installer husky + lint-staged (en gang for repoet)
npm install --save-dev husky lint-staged
npx husky init
```

Tilføj i `.husky/pre-commit`:
```bash
npx lint-staged
```

---

## 9. Hvad du IKKE må

- ❌ Direct push til `main`
- ❌ Force push til shared branches (`main`, eller `feature/*` brugt af andre)
- ❌ Commit `.env` eller secrets
- ❌ Skip CI med `--no-verify`
- ❌ Merge egen PR uden review
- ❌ Bryde frosne beslutninger uden CONTRACT-amendment (jf. AI_GUIDELINES.md §3)

---

## 10. Spørgsmål

- **Slack** #colas-dev
- **GitHub Issues** — brug templates i `.github/ISSUE_TEMPLATE/`
- **Asana** COL-projekt
- **Direkte til Carsten** ved eskaleringer

---

*Sidste opdatering: 2026-05-29 — F4 implementering (komplet revision af branch-strategi + PR-flow)*
