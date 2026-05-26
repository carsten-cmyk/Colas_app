Brug interviewer-agenten til at scope en sektion fra prototype til dev-fase.

Brugerens sektion: $ARGUMENTS

## Hvad du (Claude) skal gøre

1. **Parse argumenter** — forventet format: `[sektion-slug] [app]` fx `asfaltbestilling formand`. Hvis tab er relevant, accepter tredje argument: `asfaltbestilling formand planlaegning`. Hvis app mangler, spørg brugeren via `AskUserQuestion`.

2. **Tjek om sektion-manifest eksisterer** i `.claude/sections/[app]/[section].md`:
   - Hvis JA → læs den, vis nuværende status, spørg om vi starter forfra eller fortsætter
   - Hvis NEJ → fortsæt

3. **Bed brugeren om input** via `AskUserQuestion`:
   - Prototype fil-path (påkrævet)
   - Line-range i prototype-filen (anbefalet)
   - Kort tekst-beskrivelse af sektionen (påkrævet)
   - Screenshots vedlagt? Hvis ja, hvor (sti i `.claude/screenshots/[section]/`)

4. **Dispatch til interviewer-agent** via Agent-tool med:
   - subagent_type: `"interviewer"`
   - Brugerens input
   - **Eksplicit instruks:** "Kør Fase A først, vis output til brugeren, vent på accept FØR Fase B starter. Samme for B → C → D."

5. **Når interviewer leverer output:**
   - Vis section-manifest, kickoff, contract-draft
   - List åbne spørgsmål
   - Hvis contract status = `BLOCKED` → vis hvilke cross-cutting blockers stopper hvilke kriterier. Foreslå at låse blockers først.
   - Hvis contract status = `DRAFT` → bed brugeren om sign-off via `AskUserQuestion`

6. **Ved sign-off:**
   - Opdatér contract status → `SIGNED-yyyy-mm-dd` + FROZEN
   - Opdatér section-manifest: `current_phase: dev`
   - Foreslå næste skridt: `/develop-screen [sektion] [app]`

## Hvornår IKKE bruge `/interview`

- Sektionen er allerede i build (current_phase: dev) → brug `/develop-screen` direkte
- Lille rettelse i eksisterende komponent → brug `/bg`
- Ny komponent uden hel sektion → brug `/new-component`

## Output-pakke

Interviewer producerer:
- `.claude/sections/[app]/[section].md` (manifest)
- `.claude/docs/DATA_FIELDS.md` (opdateret)
- `Docs/[App]/KICKOFF_[Sektion].md` (kickoff)
- `Docs/[App]/CONTRACT_[Sektion].md` (validation contract — DRAFT eller BLOCKED)
- Liste af åbne spørgsmål
