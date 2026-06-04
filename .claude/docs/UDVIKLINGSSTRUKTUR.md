# Udviklingsstruktur — Colas Transport Apps

> **Status**: LÅST 2026-06-04
> **Formål**: Definere de to faser (prototype + udvikling) og hvordan issues, agenter og kode hænger sammen.
> **Kanonisk reference**: Alle agenter og slash-kommandoer skal følge denne struktur.

---

## To-fase-modellen

```
┌─────────────────────────────────────────────────────────────┐
│  PROTOTYPE-FASE                                              │
│  ─────────────                                               │
│                                                              │
│  1. Du + Claude: dialog om feature                           │
│     "Hvordan skal SMS-OTP login fungere?"                    │
│     "Hvad sker hvis SMS ikke kommer?"                        │
│     ↓                                                        │
│  2. Når vi er enige → opret issue(s)                         │
│     [CHAF-LOGIN-001] som Epic                                │
│     [CHAF-LOGIN-005] som Idé (åbent spørgsmål)               │
│     ↓                                                        │
│  3. /bg eller direkte implementering i src/prototypes/       │
│     ↓                                                        │
│  4. UX-feedback fra kunde på prototype                       │
│     ↓                                                        │
│  5. Issue-status: Backlog → Done (men sektion ikke aktiv)    │
└─────────────────────────────────────────────────────────────┘

      ↓ Sektion er UX-godkendt, klar til produktion

┌─────────────────────────────────────────────────────────────┐
│  UDVIKLINGS-FASE                                             │
│  ───────────────                                             │
│                                                              │
│  1. Du vælger sektion: "asfaltbestilling formand"            │
│     /develop-screen asfaltbestilling formand                 │
│     ↓                                                        │
│  2. Arkitekt læser:                                          │
│     - Prototype-koden (din UX-låste version)                 │
│     - CONTRACT.md (forretningsregler)                        │
│     - Prototype-issues (alle beslutninger vi har gjort)      │
│     - FUNCTIONAL_FLOWS                                       │
│     ↓                                                        │
│  3. Arkitekt foreslår Epic + sub-tasks:                      │
│     [FORMPL-ASB-001] Asfaltbestilling implementation (Epic)  │
│       ├─ [FORMPL-ASB-002] Round 1: types + hooks + mocks     │
│       ├─ [FORMPL-ASB-003] Round 2: DatePickerRow (atomic)    │
│       ├─ [FORMPL-ASB-004] Round 2: ProductBoxV2 (atomic)     │
│       ├─ [FORMPL-ASB-005] Round 2: SendTilFabrikButton       │
│       ├─ [FORMPL-ASB-006] Round 3: PlanlaegningContainer     │
│       └─ ...                                                 │
│     ↓                                                        │
│  4. Du godkender plan (eller ber arkitekten justere)         │
│     ↓                                                        │
│  5. Auto-dispatch byggere → reviewer → test-writer → PR      │
│     Hver komponent får sit eget issue + status-flow:         │
│     Backlog → Plan → Build → Review → Test → Klar → Done     │
└─────────────────────────────────────────────────────────────┘
```

---

## To subtle pointer der gør det elegant

### 1. Prototype-issues serverer som arkitekt-input

Når arkitekten kører `/develop-screen asfaltbestilling formand`, læser den ALLE issues med `sektion:asfaltbestilling`-label (uanset status). Det giver hele beslutnings-historikken:

- Hvad blev valgt og hvorfor
- Hvad blev udskudt til Fase 2
- Hvad er stadig åbne spørgsmål

Det er din kollektive hukommelse fra prototype-iterations-fasen, omdannet til input til den formelle dev-plan.

### 2. Sub-tasks følger architect's build-rounds

Arkitekten har en kanonisk strategi (jf. workflow-docs):

- **Round 1**: Foundation (types, hooks, mocks)
- **Round 2**: Atomic presentere (genbrugbare små komponenter)
- **Round 3**: Komplekse presentere
- **Round 4**: Container (samler det hele)

Hvert "round" bliver én eller flere sub-issues.

---

## Beslutninger låst 2026-06-04

### Beslutning 1: Pilot Milepæl 2 på arkitekt-agenten (Option B)

Opdatér KUN `architect`-agenten til at auto-oprette Epic + sub-issues. Resten af agenterne (builder, reviewer, test-writer, git-agent) kører som hidtil i pilot-fasen:

- De skriver handoff-filer lokalt som før
- Du kommenterer manuelt på issues efter hver fase
- Når pilot-flowet er valideret (typisk efter Asfaltbestilling-piloten), udvider vi til alle agenter

**Hvorfor pilot frem for full Milepæl 2:**
- Lavere risiko — én ændring at debugge ad gangen
- Validér flow før vi automatiserer hele kæden
- Hurtig feedback-loop hvis noget skal justeres

### Beslutning 2: Prototype-issues holdes TYNDE (Option A)

Prototype-issue beskriver KUN:
- **Forretningsbeslutningen** (hvad valgte vi, hvorfor)
- **Resultatet** (hvad blev implementeret i prototypen, hvilke filer)

IKKE inkluderet i prototype-issue:
- Implementeringsdetaljer (props, datamodel, tokens-mapping)
- SPEC-niveau detaljer (de skrives af arkitekten i dev-fasen)
- Code-skeleton eller pseudokode

**Hvorfor tyndt:**
- Prototype-fasen handler om hurtig iteration — ikke om at skrive specs
- Implementeringsdetaljer kan ændre sig mellem prototype og produktion
- Arkitekten kan altid læse prototype-koden + issuet sammen og udlede detaljerne
- Lavere overhead → flere issues bliver oprettet → bedre audit-trail

---

## Issue-naming i begge faser

Format: `[{APP}{MODE}-{SECTION}-{NNN}] beskrivelse`

Se `.claude/docs/ISSUE_NAMING.md` for fuld konvention.

**Prototype-issues** og **udviklings-issues** bruger samme ID-format. Forskellen er kun:
- Prototype-issues lever typisk i status: `Idé`, `Backlog`, `Done` (med sektion stadig prototype)
- Udviklings-issues går gennem alle 9 statusser: `Backlog → Plan → Build → Review → Test → Klar til merge → Done`

---

## Hvad ligger HVOR

| Type | Lokation | Eksempel |
|---|---|---|
| Forretnings-flow (regler) | `.claude/docs/FUNCTIONAL_FLOWS.md` | Multi-produkt sekventiel kørsel |
| Workflow-proces (denne fil) | `.claude/docs/UDVIKLINGSSTRUKTUR.md` | To-fase-modellen |
| Sektion-manifest | `.claude/sections/[app]/[sektion].md` | Per-sektion lifecycle-status |
| SPEC-filer | `Docs/[App]/[sektion]/SPEC_[Komp].md` | Komponent-implementations-detaljer |
| CONTRACT | `Docs/[App]/[sektion]/CONTRACT.md` | Frozen forretningsregler |
| Issue-naming | `.claude/docs/ISSUE_NAMING.md` | ID-konvention |
| GitHub Project | https://github.com/users/carsten-cmyk/projects/1 | Kanban-board over alle issues |

---

## Næste skridt

1. **Implementér Beslutning 1**: Opdatér `.claude/agents/architect.md` med GitHub-integration (auto-opret Epic + sub-issues via `gh`-CLI)
2. **Pilot på Asfaltbestilling**: Kør `/develop-screen asfaltbestilling formand` første gang — bekræft Epic + sub-issues oprettes korrekt
3. **Udvid til andre agenter** (Milepæl 2.5): Når pilot er valideret, udvid `builder`, `reviewer`, `test-writer`, `git-agent` til at kommentere på issues og opdatere status automatisk
