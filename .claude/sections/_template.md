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

| Komponent | Rolle | Status | SPEC | Handoff |
|---|---|---|---|---|
| `[SektionWrapper]` | Container | not-started | `Docs/[App]/SPEC_[Navn].md` | `.claude/handoffs/[section]-[komponent].md` |
| `[ChildA]` | Presenter | not-started | ... | ... |
| `[useSektion]` | Hook | not-started | ... | ... |

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

| Type | Fil | Status |
|---|---|---|
| Kickoff | `Docs/[App]/KICKOFF_[Sektion].md` | not-started |
| Validation contract | `Docs/[App]/CONTRACT_[Sektion].md` | not-started |
| SPECs | `Docs/[App]/SPEC_*.md` | 0/N |
| Handoffs | `.claude/handoffs/[section]-*.md` | 0/N |
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

-
