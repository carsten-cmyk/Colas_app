---
section: [section-slug]            # fx asfaltbestilling
app: [formand|vognmand|chauffeur|chauffeur-web|fabrik|kunde]
tab: [planlaegning|udfoersel|afregning|—]   # tab i app hvis relevant
current_phase: prototype           # prototype → dev → test → live
owner: Carsten
created: yyyy-mm-dd
last_updated: yyyy-mm-dd
---

# Section Manifest — [Sektionsnavn]

> **Hvad denne fil ER:** Lifecycle-tracker for sektionen på tværs af phases. Single index over alle artefakter (kickoff, contract, SPECs, handoffs, validation runs).
> **Hvad denne fil IKKE er:** Forretnings-scope (det ligger i kickoff) eller accept-kriterier (det ligger i contract).

---

## Status

| Phase | Status | Dato | Notes |
|---|---|---|---|
| Prototype | `[ikke-startet \| i-gang \| godkendt]` | | |
| Dev | `[ikke-startet \| i-gang \| done]` | | |
| Test | `[ikke-startet \| i-gang \| done]` | | |
| Live | `[ikke-startet \| i-gang \| done]` | | |

**Cross-cutting blockers tjekket:**
- [ ] Status-vokabular låst (eller ikke relevant)
- [ ] Datoformat låst (eller ikke relevant)
- [ ] Multi-produkt-på-bil låst (eller ikke relevant)

---

## Prototype-reference

- **Fil(er):** `apps/[app]/src/prototypes/[path]/[file].tsx#L[start]-L[end]`
- **Live URL:** `[netlify-url hvis deployed]`
- **Screenshots:** `.claude/screenshots/[section]/` *(hvis vedlagt)*

---

## Komponent-scope

> Fyldes ud i interviewer Fase A. Hver komponent får senere en SPEC.
> **Rolle-konvention:** Container ejer state via hook(s). Presenter modtager props ind, sender callbacks ud (ingen direkte hook-import). Hook ejer logik. Util er pure functions.

| Komponent | Rolle | Status | SPEC | Handoff | Builder-signoff | Reviewer-signoff | Rounds |
|---|---|---|---|---|---|---|---|
| `[SektionWrapper]` | Container | not-started | `Docs/[App]/[sektion-slug]/SPEC_[Navn].md` | `Docs/[App]/[sektion-slug]/handoffs/[Navn].md` | — | — | 0 |
| `[ChildA]` | Presenter | not-started | ... | ... | — | — | 0 |
| `[useSektion]` | Hook | not-started | ... | ... | — | — | 0 |

**Sub-sektioner / sub-flows (hvis relevant):**
- `[fx Send til fabrik-modal]`
- `[fx Aflys-årsag picker]`

---

## Build-order (dependency graph)

> Builders kører IKKE alle parallelt. Architect deklarerer rounds — hver round skal være grøn (lint+typecheck+test) før næste starter.

```
Round 1 (foundation — parallel):
  - shared/types/[domain].ts
  - apps/[app]/src/hooks/use[Sektion].ts
  - apps/[app]/src/mocks/[sektion].ts

Round 2 (presentere uden afhængigheder — parallel):
  - [StatusPill, simple badges, dato-piller]

Round 3 (presentere der bruger Round 2 — parallel):
  - [ProductBox, EkstraBestillingBox, SendCTA]

Round 4 (container — sidste):
  - [SektionWrapper]  — wirer alle Round 2+3 sammen via Round 1's hook
```

**Hvorfor:** Forhindrer duplikerede typer, race-conditions på shared/types, og spaghetti hvor presenter A importerer fra presenter B.

---

## Cross-section dependencies

> Hvad denne sektion LÆSER fra / SKRIVER til andre sektioner.

| Type | Sektion | Relation |
|---|---|---|
| reads-from | `[fx ordre-detaljer]` | `[fx læser ordrenr + projektleder]` |
| writes-to | `[fx udfoersel-dagsoverblik]` | `[fx morgenTons → faktisk-input default]` |
| blocks | `[fx afregning]` | `[fx afregning kan ikke køre før produkter er sendt]` |

---

## Artefakter

> **Konvention (LÅST 2026-05-28):** Alle sektion-docs ligger i `Docs/[App]/[sektion-slug]/`. Se [[workflow-upgrades-planned]] C4.

| Type | Fil | Status |
|---|---|---|
| Kickoff | `Docs/[App]/[sektion-slug]/KICKOFF.md` | not-started |
| Validation contract | `Docs/[App]/[sektion-slug]/CONTRACT.md` | not-started |
| Customer-facing spec | `Docs/[App]/[sektion-slug]/CUSTOMER_SPEC.md` | not-started |
| Kunde-Q&A | `Docs/[App]/[sektion-slug]/QA.md` | not-started |
| UX-flows | `Docs/[App]/[sektion-slug]/FLOWS.md` | not-started |
| SPECs | `Docs/[App]/[sektion-slug]/SPEC_*.md` | 0/N |
| Handoffs | `Docs/[App]/[sektion-slug]/handoffs/*.md` | 0/N |
| Review reports | `Docs/[App]/[sektion-slug]/handoffs/REVIEW_REPORT_*.md` | 0/N |
| Lessons learned | `Docs/[App]/[sektion-slug]/LESSONS_LEARNED.md` | not-started |
| Validation history | `.claude/validation-history/[section]-*.md` | 0 runs |

---

## Produktions-paths (fyldes ud under dev-fase)

| Type | Path |
|---|---|
| Components | `apps/[app]/src/components/ui/...` |
| Pages | `apps/[app]/src/pages/...` |
| Hooks | `apps/[app]/src/hooks/...` |
| Types | `shared/types/...` |
| E2E tests | `apps/[app]/e2e/[section].spec.ts` |

---

## Deployment

| Env | URL | Last deploy |
|---|---|---|
| Dev | `[dev.formandsapp.netlify.app/...]` | — |
| Test | `[test.formandsapp.netlify.app/...]` | — |
| Live | `[formandsapp.netlify.app/...]` | — |

---

## Roller der bruger sektionen

| Rolle | Adgang | Notes |
|---|---|---|
| Formand | full | |
| Vognmand | read-only / hidden / ... | |
| Chauffør | hidden | |
| Fabrik | read-only | |
| Kunde | hidden | |

---

## Notes

> Fri tekst — beslutninger, åbne tråde, links til memory/Slack/Monday.

---

## Executive summary (udfyldes af interviewer i Fase A)

> **Skal stå øverst i CONTRACT.md når den produceres** — ½-side resumé så reviewers ikke skal læse 1000+ linjer for at forstå sektionen.

**Forretningsformål** (1-2 sætninger):
[Hvad sektionen løser for kunden]

**Scope (3-5 bullets):**
- [Hvad er IN]
- [Hvad er IN]
- [Hvad er IN]

**10 vigtigste invariants:**
1. [Ufravigelig regel 1]
2. [...]

**In-flight risks (kendte usikkerheder):**
- [Risiko 1 + mitigation]
- [Risiko 2 + mitigation]

**Sign-off-status:**
- Carsten: [✓ / pending — dato]
- Kunde: [✓ / pending — dato]

---

## Lessons learned (udfyldes ved sektion-afslutning)

> **Skal stå nederst i CONTRACT.md (eller separat LESSONS_LEARNED.md) når sektionen markeres `live`.**
> Selvlærende loop — mønstre der gentager sig 2x promoveres til dette template eller PATTERNS.md.

### Hvad gik godt
- [Konkret eksempel — fx "SPECs var detaljerede nok til at builder ikke skulle gætte"]

### Hvad gik galt / kunne gøres bedre
- [Konkret eksempel — fx "Vi manglede a11y-spec; builder skulle gætte ARIA-labels"]

### Gentagne huller (kandidat til template-promotion)
- [Mønster der dukker op flere gange — fx "Performance-budgets glemmes altid"]

### Forbedringer der bør indarbejdes i `_template.md`
- [Konkret tilføjelse]

### Action items
- [ ] [Konkret opfølgning + ejer + dato]

---

## Sign-off audit-trail (udfyldes løbende — kolonner per komponent)

> Vises som tabel når komponenter har gennemløbet review-loop. Bruges af reviewer-agent + git-agent til audit.

| Komponent | Builder-signoff | Reviewer-signoff | Review-rounds | Status |
|---|---|---|---|---|
| `[Komponent1]` | YYYY-MM-DD (model) | YYYY-MM-DD (model) | 1 | GODKENDT |
| `[Komponent2]` | — | — | 0 | not-started |

---

## Review-loop tracker (udfyldes løbende)

> Stigning ved hver builder→reviewer→builder-iteration. Hard-gate ved 3 rounds → eskalering til Carsten.

| Komponent | Round 1 | Round 2 | Round 3 | Eskalering |
|---|---|---|---|---|
| `[Komponent1]` | I-001, I-002 | I-001 RESOLVED, I-002 DISPUTED | — | — |

-
