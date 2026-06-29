---
section: formand-nav-layout-refactor
component: TopBar (nav-slot udvidelse)
spec: Docs/Formand/SPEC_TopBar_NavSlot.md
builder_session: 2026-06-29-1500
builder_model: claude-sonnet-4-6
status: ready-for-review
review_rounds: 0
---

# Handoff — TopBar (nav-slot udvidelse)

> **Build-round:** 2 (afhænger af TopBarNav fra round 1)
> **Hvad denne fil ER:** Builder's exit-rapport. Læses af reviewer.

---

## Implemented

```yaml
accept_pass:
  - id: NAVSLOT-001
    description: "nav?: TopBarNavProps prop tilføjet til TopBarProps interface — optional, fuldt dokumenteret med JSDoc"
  - id: NAVSLOT-002
    description: "TopBarNav renderes med {...nav} spread i flex-1 ml-md slot mellem logo og avatar — kun når nav er sat"
  - id: NAVSLOT-003
    description: "Bagudkompatibilitet: nav er undefined som default, eksisterende kald i AppShell + prototype-skærme er pixel-identiske med tidligere"
  - id: NAVSLOT-004
    description: "TopBar.stories.tsx udvidet med 4 nye stories: MedNav, MedNavKalenderAktiv, MedNavDagensOpgaverAktiv, MedNavTomItems"
  - id: NAVSLOT-005
    description: "Typecheck passerer: npm run formand:typecheck — 0 fejl, 0 warnings"
```

---

## Not implemented

```yaml
accept_skip: []
```

Ingen SPEC-krav udeladt.

---

## Assumptions

- `justify-between` bevares på `<header>` — med `flex-1` på nav-wrapper trækker nav den midterste plads naturligt uden at fortrænge avatar-pill til højre.
- `ml-md` (24px) fra logo til nav-slot, som SPEC angiver.
- Ingen ekstra wrapper nødvendig om `<TopBarNav>` — `flex-1` på `<div>` er tilstrækkeligt for korrekt mellemzone-layout.

---

## Known issues

- Hvis nav-pilletekster er meget lange og viewport smallere end ~600px kan avatar presses. TopBar er kun i brug på desktop-app (formand) — ikke et problem i praksis. Noteret til eventuel responsive-audit.

---

## Files changed

```
modified:
  - apps/formand/src/components/layout/TopBar.tsx    # nav-prop + TopBarNav import + nav-slot
  - apps/formand/src/components/layout/TopBar.stories.tsx  # 4 nye nav-slot stories
```

---

## Prototype-fidelity

**Source:** Eksisterende `TopBar.tsx` — ikke udtrukket fra prototype, men direkte udvidelse af produktionskode.

**Hvad blev bevaret 1:1:**
- `className="bg-deep-teal flex items-center justify-between px-sm sticky top-0 z-50"` (header)
- `style={{ height: 52 }}` (inline højde-token uændret — SPEC bekræfter dette er korrekt)
- Logo-sektion (L25-30) uændret
- Avatar-pill (L41-46) uændret
- Settings-knap (L49-57) uændret

**Bevidste afvigelser:**
- Ingen.

---

## API exports

**Opdateret props interface:**
```typescript
export interface TopBarProps {
  /** Initialer til avatar-cirkel, fx "OJ" */
  userInitials: string
  /** Kort navn vist i avatar-pill, fx "Ole J." */
  userName: string
  onSettingsPress?: () => void
  /**
   * Valgfri navigations-slot vist mellem logo og avatar.
   * Når undefined renderes ingen nav (bagudkompatibelt).
   */
  nav?: TopBarNavProps
}
```

**Eksporterer:**
- `TopBar` (function)
- `TopBarProps` (interface)

**Importerer:**
- `TopBarNavProps` og `TopBarNav` fra `./TopBarNav`

---

## Tokens / patterns brugt

- Header bg: `bg-deep-teal` (uændret)
- Header højde: `style={{ height: 52 }}` (inline — SPEC angiver dette er korrekt, ikke spacing-token)
- Nav wrapper: `flex-1 ml-md` (`ml-md` = 24px fra tailwind spacing-token)
- Padding: `px-sm` (uændret)
- Gap: `gap-xs` (uændret, højre-zone)
- Ingen hex-farver, ingen hardcodede px-spacing i nye klasser

---

## Ready-for-next-step

- [x] Typecheck pass: `npm run formand:typecheck` — 0 fejl
- [ ] Lint (præ-eksisterende eslint-config-fejl i formand — udelades jf. instruktion)
- [x] Storybook story: 4 nye stories for nav-slot
- [x] Handoff udfyldt (denne fil)
- [x] Klar til reviewer

---

## Builder sign-off (LÅST 2026-05-28)

```yaml
builder_signoff:
  builder_agent: claude-sonnet-4-6
  signed_at: 2026-06-29 15:05
  acceptkriterier_implementeret: 5 af 5 (NAVSLOT-001..005)
  acceptkriterier_skipped: 0
  prototype_kopieret_1_til_1: false  # udvidelse af eksisterende produktionskode, ikke prototype-ekstraktion
  bevidste_afvigelser_count: 0
  manuel_testning_udfoert:
    - "Scenarie 1: <TopBar userInitials='OJ' userName='Ole J.' /> (uden nav) — layout identisk med pre-change, avatar højre, ingen nav-zone"
    - "Scenarie 2: <TopBar nav={{ items: [...], activeId: 'kalenderoversigt', onNavigate: fn }} .../> — nav vist ml-md fra logo, avatar bevaret højre"
    - "Scenarie 3: nav={{ items: [] }} — TopBarNav returnerer null, nav-wrapper renderes men tom, ingen visuel artefakt"
    - "Scenarie 4: AppShell.tsx kalder TopBar uden nav-prop — ingen TypeScript-fejl, layout uændret"
  selv_lint_typecheck: passed  # typecheck ren; lint præ-eksisterende fejl ignoreret jf. task-instruktion
  saerlig_opmaerksomhed_bedes_paa:
    - "flex-1 på nav-wrapper: sikrer midter-zone bruger tilgængelig plads, men avatar-pill er ikke fixed-width — ved meget lange nav-labels kan højre-zone presses. Reviewer bør vurdere om avatar-pill skal have flex-shrink-0 eller min-w-fit"
    - "justify-between på header forbliver — dette fungerer korrekt med tre elementer (logo, nav-wrapper, avatar-group), men hvis nav er undefined og kun to elementer er til stede, fordeles de stadig med justify-between (logo venstre, avatar højre) — korrekt adfærd"
  signatur: "Jeg står inde for at koden implementerer SPEC + handoff præcis som dokumenteret ovenfor"
```

**Næste skridt:** Status `ready-for-review`. Round 3 container kan nu bruge `<TopBar nav={...} />` til at montere TopBarNav i OrdrePlanScreen-shell.
