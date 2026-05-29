# Branch Protection Setup — Engangshandling for Carsten

> **Hvad**: Step-by-step vejledning til at konfigurere branch-protection på `main` via GitHub UI.
> **Hvorfor**: Forhindrer direct push til `main` + sikrer PR-flow før agency lukkes ind.
> **Status**: PENDING — Carsten skal udføre dette i GitHub-UI inden agency starter.

---

## Hvorfor branch-protection?

Uden protection kan alle med write-adgang pushe direkte til `main`. Det er OK i solo-projekter, men når agency arbejder med os:
- PRs SKAL gå gennem review (CODEOWNERS + 1 approver)
- CI SKAL være grøn før merge
- Ingen forced-pushes til main (risiko for tabt historik)

---

## Trin-for-trin (GitHub UI)

### 1. Gå til repo-settings

1. Åbn https://github.com/carsten-cmyk/Colas_app
2. Klik **Settings**-fanen (øverst, tæt på "Code", "Issues", "Pull requests")
3. I venstre sidebar, klik **Branches** under "Code and automation"

### 2. Tilføj branch-protection-rule for `main`

1. Klik **Add branch protection rule** (eller **Add rule**)
2. **Branch name pattern**: `main`

### 3. Konfigurer reglerne — kopier disse værdier eksakt

#### ✅ Protect matching branches

- ☑️ **Require a pull request before merging**
  - ☑️ Require approvals: **1**
  - ☑️ Dismiss stale pull request approvals when new commits are pushed
  - ☑️ Require review from Code Owners
  - ☐ Restrict who can dismiss pull request reviews (lad være tom)
  - ☐ Allow specified actors to bypass required pull requests (lad være tom)

- ☑️ **Require status checks to pass before merging**
  - ☑️ Require branches to be up to date before merging
  - **Status checks required** — søg og tilføj:
    - `commitlint`
    - `token-check`
    - `formand`
    - `vognmand`
    - `chauffeur-web`
    - `chauffeur`

  (Hvis nogle ikke vises, har CI ikke kørt endnu. Lav først en PR der trigger CI, så vis kommer status-checks frem som tilgængelige.)

- ☑️ **Require conversation resolution before merging**
- ☑️ **Require signed commits** (anbefalet — kræver at agency-folk har GPG-keys)
  - Hvis dette er for stort barrier for agency, kan punktet droppes nu og tilføjes senere
- ☑️ **Require linear history** (matcher squash-merge-policy)
- ☐ Require deployments to succeed (ikke nu — uden CD)
- ☐ Lock branch (kun hvis vi vil pause udvikling)
- ☐ Do not allow bypassing the above settings (slå TIL hvis du IKKE selv skal kunne bypasse — anbefales for paranoid mode)

#### Restrict who can push (CRITICAL — agency-lockout)

- ☑️ **Restrict who can push to matching branches**
  - Tilføj: kun `@carsten-cmyk` (kan udvides med agency-lead senere)
  - Det forhindrer at agency kan pushe direkte selvom rules er opfyldt

- ☑️ **Restrict force pushes**
  - ☑️ Block force pushes
- ☑️ **Restrict deletions**
  - ☑️ Block branch deletion

### 4. Auto-merge & merge-strategi

I **Settings → General → Pull Requests** (også på samme settings-side, scroll ned):

- ☑️ **Allow squash merging** (✅ DEFAULT)
- ☐ Allow merge commits (lad være slukket)
- ☐ Allow rebase merging (lad være slukket)
- ☑️ **Default commit message for squash merging**: "Pull request title and description"
- ☑️ **Always suggest updating pull request branches**
- ☑️ **Allow auto-merge**
- ☑️ **Automatically delete head branches** (rydder op efter merge)

### 5. Gem

Klik **Create** (eller **Save changes**) nederst.

---

## Verificér setup

1. **Test 1**: Prøv at pushe direkte til main fra terminal:
   ```bash
   git checkout main
   echo "test" >> README.md
   git add README.md
   git commit -m "test: should fail"
   git push origin main
   ```
   Forventet resultat: **FEJL** — `remote: error: GH006: Protected branch update failed for refs/heads/main`

   Hvis det IKKE fejler — protection er ikke aktiv. Tjek settings igen.

   Husk at fjerne test-commit'en lokalt: `git reset --hard HEAD~1`

2. **Test 2**: Opret PR fra feature-branch — skal kunne merges KUN når:
   - 1 reviewer har godkendt
   - Alle status-checks er grønne
   - Conversation er resolved

---

## Agency-lockout-test (når agency er aktiv)

Senere, når en agency-bruger er tilføjet til repo:
1. Bekræft de IKKE er i "Restrict who can push"-listen
2. Lad dem prøve at åbne PR + merge — skal kun virke hvis Carsten godkender
3. Bekræft du (Carsten) kan slå dem helt ud ved at fjerne dem fra repo-Collaborators

---

## Hvis du senere vil give agency-lead merge-rettigheder

1. Tilføj dem til **Restrict who can push**-listen
2. Add som CODEOWNERS for specifikke paths (rediger `.github/CODEOWNERS`)
3. Sæt evt. ekstra approver-krav for kritiske paths (fx `shared/types/`)

---

## Status-tracking

Når dette er gennemført:

- [ ] Branch protection sat op på `main`
- [ ] Status-checks tilføjet
- [ ] Restrict who can push = kun Carsten
- [ ] Auto-merge enabled
- [ ] Squash-merge er default
- [ ] Test 1 verifikation (direct-push fejler)
- [ ] Test 2 verifikation (PR-flow virker)

Marker section-manifest som agency-klar når alle bokse er ticked:
```yaml
agency_ready: true
agency_ready_date: yyyy-mm-dd
```

---

*Sidste opdatering: 2026-05-29 — F9 dokumentation*
