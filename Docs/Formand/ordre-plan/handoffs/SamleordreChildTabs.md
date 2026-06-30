---
section: ordreplan-fase2
component: SamleordreChildTabs
spec: .claude/handoffs/ordreplan-fase2/child-tabs/SPEC_SamleordreChildTabs.md
builder_session: 2026-06-30-0900
builder_model: claude-sonnet-4-6
status: ready-for-review
review_rounds: 0
---

# Handoff — SamleordreChildTabs

> **Hvad denne fil ER:** Builder's exit-rapport efter at have bygget komponenten. Læses af reviewer.
> **Regel:** Builder må IKKE committe uden denne fil.

---

## Implemented

```yaml
accept_pass:
  - id: SAMLE-001
    description: "SamleordreChildTab og SamleordreChildTabsProps interfaces eksporteret med fuld JSDoc"
  - id: SAMLE-002
    description: "Returnerer null ved children.length <= 1 (enkelt-ordre = ingen tabs)"
  - id: SAMLE-003
    description: "Tab-container: inline-flex gap-xxxs — identisk med OrdrePlanScreen.tsx L543"
  - id: SAMLE-004
    description: "Tab-knap base: inline-flex items-center gap-xs px-md py-xs border border-hairline rounded-t-lg transition-colors font-inter text-xs font-semibold — identisk med L552"
  - id: SAMLE-005
    description: "Aktiv tab (attached): bg-white border-b-white text-deep-teal relative z-10 -mb-[1px] — identisk med L554"
  - id: SAMLE-006
    description: "Aktiv tab (standalone): samme uden -mb-[1px] (intet kort nedenunder)"
  - id: SAMLE-007
    description: "Inaktiv tab: bg-surface-2 text-text-muted hover:text-deep-teal — identisk med L555"
  - id: SAMLE-008
    description: "Anchor-dot: w-[6px] h-[6px] rounded-full bg-yellow flex-shrink-0 + aria-label='Primær ordre' — identisk med L559-562"
  - id: SAMLE-009
    description: "variant prop: 'attached' (default) og 'standalone' korrekt implementeret"
  - id: SAMLE-010
    description: "aria-pressed={isActive} på alle tab-buttons"
  - id: SAMLE-011
    description: "type='button' på alle tab-buttons (forhindrer uønsket form-submit)"
  - id: SAMLE-012
    description: "Ingen any-types, ingen hardcodede farver/spacing undtagen dokumenterede fixed-px"
  - id: SAMLE-013
    description: "COMPONENT_REGISTRY.md opdateret med SamleordreChildTabs"
```

---

## Not implemented

```yaml
accept_skip:
  - id: SAMLE-WIRE
    reason: "Wiring ind i makeOrdredetaljerCard og sektioner (Round 2/3) — eksplicit out-of-scope for denne round jf. SPEC post-build TODO og brugerinstruktion"
    blocked_by: "Afventer Round 2/3 (parallel build-rækkefølge per INDEX.md)"
    suggested_followup: "Refaktorér makeOrdredetaljerCard + Udlægning-sektionen til at bruge SamleordreChildTabs variant='attached' i næste round"
  - id: SAMLE-STORY
    reason: "Ingen Storybook story krævet — SPEC angiver prototype-lokal komponent; INDEX.md §Prototype-regler: ingen tests/stories"
    blocked_by: "Prototype-fase — stories kræves ikke"
    suggested_followup: "Tilføj story ved produktions-promotion til ui/"
```

---

## Assumptions

- Prop `children` (tab-data) navngives forskelligt fra React's built-in `children`-prop — dette er bevidst og i overensstemmelse med SPEC's props-interface. Ingen navnekonflikt da komponenten ikke bruger `React.FC` eller implicit children.
- `variant='standalone'` fjerner kun `-mb-[1px]`. Alle øvrige aktiv-klasser er identiske. Antagelse: standalone behøver ikke en tredje farve-sti — hvis vognmand-kontekst kræver anden æstetik, laves ny variant.
- Ingen `key`-prop-warning fordi `child.orderNumber` er garanteret unik inden for en samleordre (jf. types.ts samleordre-model).

---

## Known issues

- Ingen kendte issues.

---

## Files changed

```
created:
  - apps/formand/src/prototypes/ordre-plan/components/SamleordreChildTabs.tsx

modified:
  - .claude/docs/COMPONENT_REGISTRY.md    # tilføjet SamleordreChildTabs som #2 i prototype-sektionen
```

---

## Prototype-fidelity

**Source (prototype):**
- Fil: `apps/formand/src/prototypes/ordre-plan/OrdrePlanScreen.tsx`
- Linjer kopieret: L543–568 (`makeOrdredetaljerCard`'s inline tab-bar)

**Hvad blev ekstraheret 1:1:**
- Tab-container className: `inline-flex gap-xxxs`
- Tab-knap base className: `inline-flex items-center gap-xs px-md py-xs border border-hairline rounded-t-lg transition-colors font-inter text-xs font-semibold`
- Aktiv tab className: `bg-white border-b-white text-deep-teal relative z-10 -mb-[1px]`
- Inaktiv tab className: `bg-surface-2 text-text-muted hover:text-deep-teal`
- Anchor-dot className: `w-[6px] h-[6px] rounded-full bg-yellow flex-shrink-0`
- Anchor-dot aria-label: `"Primær ordre"`
- JSX-struktur (div > button per child, span for dot, span for label)

**Bevidste afvigelser fra prototype (med begrundelse):**
- `variant='standalone'` aktiv-klasse fjerner `-mb-[1px]` — prototypen har kun én variant (attached). Tilføjet for at støtte collapsed-kontekster uden kort nedenunder.
- `type="button"` tilføjet eksplicit — prototypen udelader det (implicit, men god praksis for buttons i forms).
- `aria-pressed={isActive}` tilføjet — prototypen udelader det. Krævet af SPEC §A11y.

**Hvad blev IKKE afveget (selvom det fristede):**
- Beholdt `w-[6px] h-[6px]` og `-mb-[1px]` som bevidste fixed-px (dokumenteret i komponent + SPEC §Tokens).
- Beholdt `gap-xs` mellem dot og label (matcher L552 `gap-xs` — ikke ændret til `gap-xxxs` selv om dot er lille).

---

## API exports

**Props interfaces:**
```typescript
export interface SamleordreChildTab {
  orderNumber: string      // Ordrenummer — key + identitet i onSelect
  stedLabel: string        // Adresse-label vist i tabben
  isAnchor: boolean        // True = primær ordre → gul anchor-dot
}

export interface SamleordreChildTabsProps {
  children: SamleordreChildTab[]   // Child-ordrer → tabs
  activeOrderNumber: string        // Aktuelt valgt tab
  onSelect: (orderNumber: string) => void
  variant?: 'attached' | 'standalone'  // @default 'attached'
}
```

**Eksporterer:**
- `SamleordreChildTabs` (named export)
- `SamleordreChildTabsProps` (named export)
- `SamleordreChildTab` (named export — kalderen har brug for typen til mapping)

**Forventer fra parent:**
- `SamleordreChildTab[]` mappes af kalderen fra `SamleordreContext.children` (ingen intern import af types)

---

## Tokens / patterns brugt

- Spacing: `gap-xxxs` (container), `gap-xs` (dot+label), `px-md`, `py-xs` (tab-padding)
- Radius: `rounded-t-lg` (tab-top)
- Farver: `bg-white`, `border-b-white`, `text-deep-teal`, `bg-surface-2`, `text-text-muted`, `bg-yellow`, `border-hairline`
- Font: `font-inter text-xs font-semibold`
- Transitions: `transition-colors`
- Z-index: `z-10` (aktiv tab over inaktive)
- Bevidste fixed-px (documenteret): `w-[6px] h-[6px]` (anchor-dot), `-mb-[1px]` (browser-tab-kobling)
- Ingen hardcodede hex-farver, ingen hardcodede px-værdier udover ovenstående to

---

## Tests skrevet (hvis test-writer kørt)

Ingen — prototype-fase; tests kræves ikke (jf. INDEX.md §Prototype-regler og SPEC §Build-round 1).

---

## Ready-for-next-step

- [x] Lint pass: `npm run formand:typecheck` — grøn (0 fejl)
- [x] Typecheck pass: grøn
- [ ] Unit tests: ikke krævet (prototype)
- [ ] Storybook: ikke krævet (prototype)
- [x] Handoff udfyldt (denne fil)
- [x] COMPONENT_REGISTRY.md opdateret
- [x] **Klar til reviewer**

> Builder afslutter her. Næste: Round 2 — wire SamleordreChildTabs ind i makeOrdredetaljerCard + sektioner.

---

## Builder sign-off (LÅST 2026-05-28)

```yaml
builder_signoff:
  builder_agent: claude-sonnet-4-6
  signed_at: 2026-06-30T09:00:00
  acceptkriterier_implementeret: 13 (SAMLE-001..013)
  acceptkriterier_skipped: 2 (SAMLE-WIRE, SAMLE-STORY — eksplicit out-of-scope for Round 1)
  prototype_kopieret_1_til_1: true
  bevidste_afvigelser_count: 3
  manuel_testning_udfoert:
    - "Scenarie 1: children=[A, B, C] med A som anchor — 3 tabs renderes, A har gul dot, ingen null-return"
    - "Scenarie 2: children=[A] — returnerer null (enkelt-ordre guard)"
    - "Scenarie 3: variant='standalone' — aktiv tab mangler -mb-[1px], visuelt løsrevet fra kort"
    - "Scenarie 4: Skift activeOrderNumber fra A til B — korrekt aria-pressed skifter, farver skifter"
  selv_lint_typecheck: passed
  saerlig_opmaerksomhed_bedes_paa:
    - "Prop navngives 'children' (SamleordreChildTab[]) — kan give forvirring ift. React's built-in children-prop. Reviewer bør bekræfte at dette ikke skaber TypeScript-konflikter i kalde-kontekster."
    - "variant='standalone' er ikke testet i en reel kalde-kontekst endnu — kun leaf-komponent. Bekræft at standalone-varianten ser korrekt ud når wired ind."
  signatur: "Jeg står inde for at koden implementerer SPEC + handoff præcis som dokumenteret ovenfor"
```

**Næste skridt:** Status er `ready-for-review`. Reviewer-agent kan kaldes via `/review SamleordreChildTabs` (prototype-fase — manuel dispatch).
