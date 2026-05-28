---
type: workflow-improvement-plan
status: draft — afventer implementering
created: 2026-05-28
last_updated: 2026-05-28
owner: Carsten
---

# Workflow-opgraderinger — planlagte tiltag

> **Hvad denne fil er:** Samlet plan over alle workflow- og dokumentations-forbedringer der skal implementeres i dev-flowet (prototype → produktion).
> **Sammenhæng:** Disse upgrades supplerer `WORKFLOW_PROTOTYPE_TIL_PRODUKTION.md` og styrker `_template.md` for sektioner.

---

## A. Dokumentations-forbedringer

### A1. Executive summary i top af CONTRACT
**Hvad:** Hver `CONTRACT_[Sektion].md` får en ½-sides resumé i toppen.
**Indhold:** Forretningsformål · scope-bullets · 10 vigtigste invariants · in-flight risks · sign-off-status.
**Hvorfor:** Review/onboarding kan tage 80% af forståelsen på 1 minut uden at læse 1200+ linjer.
**Implementering:** Opdatér interviewer-agentens contract-output-skabelon.
**Prioritet:** 🟢 Must-have

### A2. Lessons learned per sektion
**Hvad:** Sektion sluttes med `LESSONS_LEARNED_[Sektion].md` (eller bundsektion i CONTRACT).
**Indhold:** Hvad gik godt · hvad gik galt · gentagne huller (fx "a11y mangler altid") · forbedringer til template.
**Hvorfor:** Selvlærende loop — næste sektion arver erfaringer fra forrige.
**Implementering:**
- Tilføj `LESSONS_LEARNED`-skabelon i `.claude/sections/_template.md`
- Mønstre der gentager sig 2x promoveres til `_template.md` direkte
- Eller flyttes til `PATTERNS.md` / `CONTRACT_INVARIANTS.md` som kanoniske krav
**Prioritet:** 🟢 Must-have

### A3. CUSTOMER_SPEC.md (allerede piloteret)
**Hvad:** Printbar funktionsbeskrivelse på 4 A4-sider til kunde-sign-off.
**Status:** Pilot kørt på Asfaltbestilling 2026-05-27 — afventer evaluering.
**Næste skridt:** Hvis pilot virker, opdater interviewer til at producere `CUSTOMER_SPEC.md` automatisk.
**Prioritet:** 🟡 Should-have (afhænger af pilot-feedback)

### A4. QA_*.md spørgsmålsdokument (allerede piloteret)
**Hvad:** Samling af åbne spørgsmål til kundemøde med kontekst + valg + svar-felter.
**Status:** Pilot kørt på Asfaltbestilling 2026-05-27.
**Prioritet:** 🟡 Should-have

---

## B. Sign-off workflow (det nye flow)

### B1. Builder-signoff i handoff
**Hvad:** Når builder er færdig, udfyldes formel sign-off-blok i `.claude/handoffs/[sektion]-[komponent].md`.
**Indhold:**
- "Jeg har implementeret X kriterier fra SPEC (linje-mapping fra ASF-XXX-IDs til kode-linjer)"
- "Jeg har bevidst afveget på Y med begrundelse Z"
- "Jeg er usikker på A, B — særligt opmærksomhed bedes"
- "Jeg har testet manuelt: scenarie 1, 2, 3"
- "Lint + typecheck er grøn"
- Signatur: builder-agentens model + tidsstempel
**Implementering:** Udvid handoff-template med sign-off-blok.
**Prioritet:** 🟢 Must-have

### B2. Automatisk dispatch til reviewer
**Hvad:** Når builder skriver sin sign-off, dispatches reviewer-agenten **automatisk** med builder-handoff som input.
**Hvorfor:** Ingen ventetid, ingen manuel intervention fra Carsten, klar audit-trail.
**Implementering:**
- Hook i builder-agent: ved succesfuld sign-off, kald reviewer-agent med komponent-ID
- Eller `/develop-screen`-orkestreringen kobler builder → reviewer automatisk
**Prioritet:** 🟢 Must-have

### B3. Reviewer-signoff + issue-rapport
**Hvad:** Reviewer producerer `REVIEW_REPORT_[sektion]-[komponent].md` med stabil format.
**Indhold:**
- "Reviewet mod SPEC (ASF-XXX) + builder-handoff"
- Issues fundet med stabile IDs:
  - **I-001 CRITICAL**: beskrivelse + linje-ref
  - **I-002 RECOMMENDED**: ...
  - **I-003 NICE-TO-HAVE**: ...
- Samlet status: **GODKENDT** / **AFVIST** / **AFVENTER FIX**
- Signatur: reviewer-agentens model + tidsstempel
**Prioritet:** 🟢 Must-have

### B4. Automatisk retur-loop til builder ved issues
**Hvad:** Hvis reviewer-status er **AFVENTER FIX**, dispatches builder-agenten **automatisk** igen med eksplicit issue-liste.
**Builder-output efter fix-loop:**
- "Fixed: I-001, I-002"
- "Disputed: I-003 — begrundelse: ..."
- Opdateret builder-signoff
**Reviewer re-reviewer KUN de ID'er builder rapporterede**:
- Status per issue: **RESOLVED** / **NEEDS-REWORK** / **DISPUTED-ACCEPTED**
**Implementering:** Loop-orkestrator i `/develop-screen` eller dedikeret `/fix [komponent]`-kommando.
**Prioritet:** 🟢 Must-have

### B5. Loop-counter + max-rounds gate
**Hvad:** Antal review-rounds spores i section-manifest. Efter **max 3 loops** eskaleres til Carsten.
**Hvorfor:** Forhindrer infinite ping-pong mellem builder og reviewer hvis de er uenige.
**Implementering:**
- Felt i section-manifest: `review_rounds_per_komponent: { [komp]: 0 }`
- Stigning ved hver retur til builder
- Hard-gate ved 3 — pause workflow, notér til Carsten
**Prioritet:** 🟢 Must-have

### B6. GATE: ingen progression til test-writer før alle CRITICAL er RESOLVED
**Hvad:** Test-writer-agenten kører **kun** når reviewer-status er **GODKENDT** (alle CRITICAL-issues RESOLVED eller DISPUTED-ACCEPTED).
**Hvorfor:** Tests skrevet mod brækket kode er værdiløse.
**Implementering:** Tjek i `/develop-screen`-flow før test-writer dispatches.
**Prioritet:** 🟢 Must-have

### B7. Sektion-manifest udvides med sign-off-kolonner
**Hvad:** Komponent-tabellen får 2 nye kolonner: `builder_signoff_dato` + `reviewer_signoff_dato`.
**Hvorfor:** Audit-trail per komponent — hvis noget brækker i prod, kan vi spore hvem der signerede.
**Prioritet:** 🟢 Must-have

### B8. Smart git-agent (opgraderet)
**Hvad:** Eksisterende `git-agent` opgraderes fra "kør på explicit `/git`-kommando" til intelligent commit-håndtering i implementations-fasen.
**Capabilities tilføjet:**
- **Auto-trigger**: efter `reviewer_signoff = GODKENDT` på en komponent → automatisk commit-forslag pr. komponent
- **Smart grouping**: commits grupperes per sektion + komponent + lifecycle-fase (ikke per filendelse)
- **Auto-tag**: ved sektion `live`-status → tag `[sektion]-v1.0` på commit
- **Gate**: kan IKKE pushe til `main` hvis section-manifest ikke har status `live` (forhindrer halvfærdig kode i prod)
- **Prototype-undtagelse**: i prototype-fase styrer Carsten selv commits manuelt (`/git`), smart-features kun aktiv i dev/test/live-faser
**Implementering:** Opdatér `.claude/agents/git-agent.md` med ny mode-switch baseret på section-phase.
**Prioritet:** 🟢 Must-have inden implementering starter (Carsten har eksplicit bedt om denne nu — 2026-05-28)

---

## C. Komponent-genbrug

### C1. COMPONENT_REGISTRY.md
**Hvad:** Ny `.claude/docs/COMPONENT_REGISTRY.md` med tabel over alle eksisterende komponenter.
**Kolonner:** Komponent · App · Path · Beskrivelse · Genbrugt af.
**Hvorfor:** Forhindrer at architect/builder genbygger eksisterende komponenter (`StatusPill`, `DatePillsRow`, `OfflineBanner` osv.).
**Implementering:**
- Auto-generér første version via scan af `apps/*/src/components/`
- Manuelt vedligeholdt fremover (eller via Storybook-introspection senere)
**Prioritet:** 🟡 Should-have

### C2. Architect tjekker registry FØR SPEC laves
**Hvad:** Architect-agentens prompt udvides med: "Tjek `COMPONENT_REGISTRY.md` FØRST før du foreslår nye komponenter."
**Hvorfor:** Skaber genbrug ad hoc i stedet for parallelle implementations.
**Prioritet:** 🟡 Should-have (afhænger af C1)

### C3. Cross-app komponent-deling
**Hvad:** Når en komponent er brugt i 2+ apps, flyttes til `shared/components/`.
**Implementering:** Refactor-trigger i registry når `Genbrugt af`-kolonnen viser ≥2 apps.
**Prioritet:** 🟢 Nice-to-have

---

## C4. Folder-struktur per sektion

**Hvad:** Hver sektion får sin egen mappe der samler ALT dokumentation.

**Foreslået struktur:**
```
Docs/[App]/[sektion-slug]/
  ├── KICKOFF.md
  ├── CONTRACT.md            (med executive summary + lessons learned)
  ├── FLOWS.md
  ├── CUSTOMER_SPEC.md
  ├── QA.md                  (kunde-spørgsmål)
  ├── LESSONS_LEARNED.md     (efter sektion er live — eller bund af CONTRACT)
  ├── SPEC_[Komponent1].md
  ├── SPEC_[Komponent2].md
  └── handoffs/
        ├── [Komponent1].md
        ├── [Komponent2].md
        └── REVIEW_REPORT_[Komponent1].md
```

**Hvorfor:**
- Med 25 sektioner = 100+ filer i `Docs/Formand/` flade-rod → ulæseligt
- Mappe-isolering gør sektion-arbejde fokuseret
- Lettere at slette/arkivere når en sektion går live (move til `Docs/[App]/_archive/`)
- Match-cleaner section-manifest-paths
- Handoffs flyttes fra `.claude/handoffs/` (central) til sektion-mappe — alt om Asfaltbestilling er samlet

**Migration:**
- Nuværende: `Docs/Formand/asfaltbestilling/KICKOFF.md`, `Docs/Formand/asfaltbestilling/CONTRACT.md`, …
- Ny: `Docs/Formand/asfaltbestilling/KICKOFF.md`, `Docs/Formand/asfaltbestilling/CONTRACT.md`, …
- Section-manifestet opdateres med nye paths

**Implementering:**
- Engangs-script eller manuelt flyt af eksisterende Asfaltbestilling-filer
- Opdatér interviewer-agent + architect-agent til at bruge ny path-konvention
- Opdatér `.claude/sections/_template.md` artefakt-paths

**Prioritet:** 🟢 Must-have (gør det FØR vi tager næste sektion)

---

## C5. Sektions-cleanup (sidste trin før "live")

**Hvad:** Udvid eksisterende `cleanup-agent` med en **sektion-mode** der køres som obligatorisk sidste trin før sektionen markeres `live` i section-manifestet.

**Scope — hvad cleanup-agenten skal rense:**

**Folder-cleanup:**
- Orphan-filer i sektion-mappen (refereres ikke fra section-manifest)
- Duplicate docs (fx gammel `SPEC_*.md` der er erstattet af nyere)
- Tomme/forældede handoffs efter reviewer-godkendelse
- Screenshots i `.claude/screenshots/[sektion]/` der ikke længere matcher live-UI

**Kode-cleanup:**
- Dead code: ubrugte komponenter, ubrugte hooks, ubrugte util-funktioner
- Dead imports (allerede dækket af lint, men dobbelt-tjek)
- Prototype-filer der nu er erstattet af produktion-kode (kandidater til arkivering, ikke sletning — prototype bevares som UX-reference)
- Inline mock-data der skal flyttes til `src/mocks/`
- Inline typer der skal flyttes til `src/types/`
- Mock-data med `// TODO: Erstat med Supabase når klar`-kommentarer — tjek om Supabase nu ER klar
- Token-violations (eksisterende cleanup-funktion)

**Cross-app-tjek:**
- Komponenter brugt i 2+ apps → flag til flytning til `shared/components/` (jf. C3)
- Duplikerede typer i `apps/*/src/types/` → konsolidér til `shared/types/`

**Cleanup-rapport:**
- `CLEANUP_REPORT_[Sektion].md` i sektion-mappen
- Liste over hvad der blev fundet + handling (slettet / arkiveret / flagget)
- Carsten skal godkende sletning (ikke automatisk for risikable handlinger)

**Implementering:**
- Udvid `.claude/agents/cleanup-agent.md` med ny sektion-mode
- Ny kommando: `/cleanup-section [sektion] [app]`
- Tilføj checkbox til section-manifest: `[ ] Sektion-cleanup udført før live`
- Gate i `/develop-screen`-flow: kan ikke markere sektion `live` før cleanup-rapport er signeret

**Prioritet:** 🟢 Must-have (sidste trin i lifecycle)

---

## E. External integrations (backlog → dev-flow automation)

> **Vision:** Når et backlog-item flyttes til "In Development" i Monday/Linear/Jira → automatisk trigger til interviewer-agenten der læser ticket-tekst + producerer plan baseret på agentens kendskab til kodebasen.

### E1. MCP-integration til Monday/Linear/Jira
**Hvad:** Anthropic MCP-server eller off-the-shelf integration der lader agenten læse tickets.
**Capabilities:**
- Læse ticket-titel, beskrivelse, labels, assignee, status
- Mapping: ticket-felter → section-manifest-felter
- Cross-reference: ticket-ID → sektion-slug (manuel første gang, derefter persisteret)
**Prioritet:** 🟡 Should-have (efter B-blokkens auto-loop er etableret)

### E2. Slack-notifikationer ved milestones
**Hvad:** Bot der sender DM/kanal-notifikation ved:
- Builder-signoff udført
- Reviewer-godkendt
- Issues fundet (CRITICAL — kræver opmærksomhed)
- Sektion markeret `live`
- Max-rounds-loop-grænse nået (eskalering)
**Implementering:** Slack MCP + post-hook fra `git-agent` / `reviewer-agent`.
**Prioritet:** 🟡 Should-have (mindste indsats, størst værdi for sync)

### E3. Webhook-trigger ved status-skift på backlog-item
**Hvad:** Webhook-listener på server der fanger ticket "moved to In Development".
**Flow:**
1. Ticket-status skifter → webhook fyrer
2. Listener kalder interviewer-agent med ticket-ID som input
3. Agent læser ticket + scoper sektion + drafter KICKOFF
4. Slack DM til Carsten: "Klar til `/interview` på ticket #COL-123 — udkast ligger her"
5. Carsten reviewer + signerer → /develop-screen
**Implementering:** Kræver hosted listener (Cloudflare Worker, Vercel function eller lign.).
**Prioritet:** 🟢 Nice-to-have (efter E1 + E2 fungerer)

### E4. Cross-reference ticket → section-manifest
**Hvad:** Hver sektion får ticket-ID i frontmatter.
**Frontmatter-tilføjelse:**
```yaml
---
section: asfaltbestilling
ticket: COL-123          # Monday/Linear/Jira reference
external_url: https://...
---
```
**Hvorfor:** Tovejs-link mellem code og PM-tool. Når ticket lukkes, kan agenten automatisk arkivere sektion-mappen.
**Prioritet:** 🟡 Should-have

---

## D. Implementation-roadmap

**Foreslået rækkefølge** (kortest værdiskabende først):

| Step | Hvad | Estimat |
|---|---|---|
| 0 | **B8** (smart git-agent opgradering — eksplicit bedt af Carsten) | ~30 min — STARTER NU |
| 1 | **C4** (folder-struktur per sektion + migration af Asfaltbestilling) | ~30 min |
| 2 | A1 + A2 (executive summary + lessons learned i `_template.md`) | ~30 min |
| 3 | B1 + B3 (builder + reviewer signoff-templates) | ~30 min |
| 4 | C1 (auto-genér COMPONENT_REGISTRY fra apps/*/src/) | ~20 min |
| 5 | B4 + B5 + B6 (auto-loop + max-rounds + gate til test-writer) | ~1-2 timer (kræver agent-orchestration-ændringer) |
| 6 | B2 (auto-dispatch builder → reviewer) | ~1 time |
| 7 | B7 (sektion-manifest udvides) | ~15 min |
| 8 | C2 + C3 (architect tjekker registry + cross-app deling) | ~30 min |
| 9 | A3 + A4 evaluering (CUSTOMER_SPEC + QA på pilot Asfaltbestilling) | afhænger af kunde-feedback |
| 10 | **C5** (udvid cleanup-agent med sektion-mode + `/cleanup-section`-kommando) | ~45 min |

**Total estimat**: ~7 timers udviklings-arbejde for hele workflow-opgraderingen.

---

## E. Test af det nye flow

Når alle workflow-upgrades er på plads, kør **Asfaltbestilling** som **end-to-end-pilot** af det nye flow:

1. Architect laver SPECs med executive summary
2. Builder bygger Round 1, signerer auto
3. Reviewer reviewer auto, finder fx 2 CRITICAL issues
4. Builder retter auto, signerer igen
5. Reviewer godkender
6. Test-writer kører
7. Lessons-learned skrives bagefter — feedes ind i `_template.md`

Hvis flow'et virker problemfrit, brug det på alle ~25 sektioner.

---

## F. Tracking

Når disse upgrades er implementeret, opdatér denne fil med `status: implemented` + dato per item. Brug `rule-list` (se [[feedback-business-rules-list]]) til at få overblik over alle låste forretnings-regler + workflow-status.

---

*Dokument-version: 2026-05-28 · draft*
