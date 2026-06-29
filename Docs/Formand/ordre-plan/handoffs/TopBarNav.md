---
section: ordre-plan
component: TopBarNav
spec: Docs/Formand/SPEC_TopBarNav.md
builder_session: 2026-06-29-1600
builder_model: claude-sonnet-4-6
status: ready-for-review
review_rounds: 0
---

# Handoff — TopBarNav

> **Hvad denne fil ER:** Builder's exit-rapport efter at have bygget komponenten. Læses af reviewer.

---

## Implemented

```yaml
accept_pass:
  - id: TOPBAR-NAV-001
    description: "Eksporteret TopBarNavItemId type med to konstante værdier: 'kalenderoversigt' | 'dagens-opgaver'"
  - id: TOPBAR-NAV-002
    description: "Eksporteret TopBarNavItem interface med id, label og to-props"
  - id: TOPBAR-NAV-003
    description: "Eksporteret TopBarNavProps interface med items, activeId (optional) og onNavigate callback"
  - id: TOPBAR-NAV-004
    description: "Visuel state: default (ingen aktiv) — text-white/85 på transparent baggrund"
  - id: TOPBAR-NAV-005
    description: "Visuel state: hover (ikke-aktiv) — hover:bg-white/10 transition-colors"
  - id: TOPBAR-NAV-006
    description: "Visuel state: aktiv — bg-yellow text-deep-teal (fuld pill-fill)"
  - id: TOPBAR-NAV-007
    description: "Edge case: tom items[] → null (ingen tom-ramme)"
  - id: TOPBAR-NAV-008
    description: "Edge case: lang tekst — whitespace-nowrap på alle piller"
  - id: TOPBAR-NAV-009
    description: "Touch target ≥ 44px via min-h-touch"
  - id: TOPBAR-NAV-010
    description: "Font: font-inter text-xs (matcher TopBar.tsx:30)"
  - id: TOPBAR-NAV-011
    description: "Padding: px-sm py-xs via tokens"
  - id: TOPBAR-NAV-012
    description: "Gap mellem items: gap-xxs"
  - id: TOPBAR-NAV-013
    description: "Radius: rounded-md"
  - id: TOPBAR-NAV-014
    description: "Transition: transition-colors"
  - id: TOPBAR-NAV-015
    description: "aria-current='page' på aktiv knap for screen readers"
  - id: TOPBAR-NAV-016
    description: "aria-label på alle knapper (label-tekst)"
  - id: TOPBAR-NAV-017
    description: "role='navigation' + aria-label='Primær navigation' på nav-element"
  - id: TOPBAR-NAV-018
    description: "focus-ring via focus:ring-2 focus:ring-dark-teal/30"
  - id: TOPBAR-NAV-019
    description: "Storybook story med CSF3 + satisfies Meta — 7 stories (Default, AktivKalenderoversigt, AktivDagensOpgaver, TomListe, EtItem, LangtLabel, ITopBarKontekst)"
```

---

## Not implemented

```yaml
accept_skip:
  - id: TOPBAR-NAV-SKIP-001
    reason: "Beskeder, Kontakt, Dokumentation (fra gammel BottomTabBar) er bevidst udeladt per SPEC scope-afgrænsning — afventer delt app-shell"
    blocked_by: "SPEC_TopBarNav.md § Scope-afgrænsning: 'Midlertidigt fjernet — afventer delt app-shell'"
    suggested_followup: "Genindføres via SPEC_TopBar_NavSlot.md eller ny SPEC når shell etableres"
  - id: TOPBAR-NAV-SKIP-002
    reason: "Besked-badge (messageCount) fjernet — ingen rute-mål endnu"
    blocked_by: "Samme som SKIP-001"
    suggested_followup: "Tilføj badge-prop til TopBarNavItem.badge?: number når shell klar"
```

---

## Assumptions

- `onNavigate` er en callback — container (OrdrePlanScreen-shell eller lignende) er ansvarlig for den faktiske `navigate()`. TopBarNav er ren presenter.
- `activeId` bestemmes af container via URL-matching eller lokal state — TopBarNav tager ikke stilling til routing-strategi.
- `items`-arrayet er konstant (ingen async) — SPEC siger "ingen data, rent navigations-element".
- Da komponenten ikke har nogen sektion-manifest i `.claude/sections/`, er handoff placeret i `Docs/Formand/ordre-plan/handoffs/` — den etablerede struktur for OrdrePlanScreen-refactor-runden.

---

## Known issues

- Pre-eksisterende lint-fejl i `apps/formand` eslint-config: `jsx-a11y/aria-labels` er ikke et gyldigt regel-navn. Bekræftet eksisterer på `main` før disse ændringer (verifikation via `git stash`). Blokerer `formand:lint`-passet. Skal fixes separat (se SPEC-note og noten i builder signoff).

---

## Files changed

```
created:
  - apps/formand/src/components/layout/TopBarNav.tsx
  - apps/formand/src/components/layout/TopBarNav.stories.tsx
```

---

## Prototype-fidelity

**Source (prototype):** Ingen prototype-kilde. TopBarNav er en ny komponent — den erstatter BottomTabBar's funktionalitet men er designet fra bunden til vandret kontekst i TopBar.

**Visual Pattern References anvendt fra SPEC:**
- `TopBar.tsx:26` — `bg-white/10 rounded-[20px]` (avatar-pill) → brugt som hover-state reference
- `TopBar.tsx:37` — `hover:bg-white/20 transition-colors` (Settings-knap) → brugt som transition-pattern
- `TopBar.tsx:30` — `text-white/85` → idle tekst-farve
- `BottomTabBar.tsx:81` — `bg-yellow` → aktiv pill-farve (fuld fill i stedet for 4px understreg)

**Bevidste afvigelser fra prototype:**
- Ingen prototype at afvige fra — ny komponent.

**PATTERN DEVIATIONS (dokumenteret inline i koden):**
1. `hover:bg-white/10` (ikke `hover:bg-white/20` som Settings-knap) — SPEC angiver eksplicit lettere hover for nav-piller vs. ikon-knapper. Dokumenteret i kode-kommentar.
2. Fuld `bg-yellow`-fill på aktiv pille i stedet for 4px understreg (BottomTabBar.tsx:81) — vandret kontekst, ingen plads til understreg-stak. Dokumenteret i kode-kommentar.

---

## API exports

**Props interfaces:**
```typescript
export type TopBarNavItemId = 'kalenderoversigt' | 'dagens-opgaver'

export interface TopBarNavItem {
  id: TopBarNavItemId
  label: string
  to: string
}

export interface TopBarNavProps {
  items: TopBarNavItem[]
  /** undefined = ingen aktiv, fx på OrdrePlan selv */
  activeId?: TopBarNavItemId
  onNavigate: (item: TopBarNavItem) => void
}
```

**Eksporterer:**
- `TopBarNav` (named export)
- `TopBarNavProps` (interface)
- `TopBarNavItem` (interface)
- `TopBarNavItemId` (type)

**Forventer fra parent:**
- Ingen imports fra hooks eller shared types — ren presenter, alle typer er self-contained.

---

## Tokens / patterns brugt

- Farver: `text-white/85`, `bg-white/10`, `bg-yellow`, `text-deep-teal`, `bg-dark-teal` — ingen hex
- Spacing: `px-sm`, `py-xs`, `gap-xxs` — ingen hardcoded px
- Font: `font-inter text-xs font-medium` — ingen hardcoded font-family eller størrelse
- Touch target: `min-h-touch` (44px token fra tailwind.config.ts:68)
- Hover/focus: `hover:bg-white/10`, `transition-colors`, `focus:ring-2`, `focus:ring-dark-teal/30`
- Border-radius: `rounded-md`
- Whitespace: `whitespace-nowrap`

---

## Tests skrevet

```
story: 7 variants  apps/formand/src/components/layout/TopBarNav.stories.tsx
unit:  0           (test-writer's ansvar — kald /test TopBarNav)
```

---

## Ready-for-next-step

- [x] Typecheck pass: `npm run formand:typecheck` — PASSED (0 errors)
- [ ] Lint pass: `npm run formand:lint` — BLOKERET af pre-eksisterende eslint-config fejl (ikke introduceret af denne komponent — verificeret via git stash)
- [ ] Unit tests: ikke skrevet endnu (test-writer's ansvar)
- [x] Storybook story oprettet (CSF3, 7 stories)
- [x] Handoff udfyldt (denne fil)
- [x] Klar til reviewer

> Builder afslutter her. Reviewer overtager.

---

## Builder sign-off

```yaml
builder_signoff:
  builder_agent: claude-sonnet-4-6
  signed_at: 2026-06-29 16:00
  acceptkriterier_implementeret: "19 af 19 (TOPBAR-NAV-001..019)"
  acceptkriterier_skipped: "2 — se 'Not implemented' (scope-afgrænsning per SPEC, ikke fejl)"
  prototype_kopieret_1_til_1: false
  bevidste_afvigelser_count: 2
  bevidste_afvigelser:
    - "hover:bg-white/10 (ikke white/20) — SPEC angiver eksplicit lettere hover for nav-piller"
    - "Fuld bg-yellow pill-fill i stedet for 4px understreg — vandret kontekst, dokumenteret"
  manuel_testning_udfoert:
    - "Scenarie 1: ingen activeId — alle piller viser text-white/85 transparent baggrund — OK"
    - "Scenarie 2: activeId='kalenderoversigt' — første pille viser bg-yellow text-deep-teal, anden idle — OK"
    - "Scenarie 3: tom items[] — render null, ingen tom-ramme vises — OK"
    - "Scenarie 4: TypeScript-type-narrowing på TopBarNavItemId — container kan ikke sende ugyldigt id — OK"
  selv_lint_typecheck: "typecheck=passed, lint=pre-eksisterende eslint-config fejl (ikke mine ændringer)"
  saerlig_opmaerksomhed_bedes_paa:
    - "Lint-blokaden: pre-eksisterende eslint-config bruger jsx-a11y/aria-labels som ikke er et gyldigt regel-navn. Bør fixes separat men er ikke introduceret her."
    - "role='link' på button-elementer — brugt fordi de fungerer som navigation-links men er implementeret som buttons (ingen router-integration i leaf-komponenten). Reviewer bør vurdere om aria-role er korrekt, eller om button+aria-current er tilstrækkeligt."
    - "min-h-touch sikrer 44px højde, men min-w-touch er ikke sat (piller er bredere end 44px i praksis — Kalenderoversigt er ~140px bred). Reviewer kan bekræfte dette er tilstrækkeligt."
  signatur: "Jeg står inde for at koden implementerer SPEC + handoff præcis som dokumenteret ovenfor"
```
