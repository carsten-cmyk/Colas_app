---
section: ordre-plan
component: OrdrePlanScreen (shell-refactor)
spec: Docs/Formand/SPEC_OrdrePlan_ShellRefactor.md
builder_session: 2026-06-29-1200
builder_model: claude-sonnet-4-6
status: ready-for-review
review_rounds: 0
---

# Handoff — OrdrePlanScreen shell-refactor (Round 3)

> **Hvad denne fil ER:** Builder's exit-rapport for shell-refactoren der fjerner BottomTabBar og
> indfører fluid layout + TopBar-navigation i OrdrePlanScreen.
> Build-round 3. Round 1 = TopBarNav, Round 2 = TopBar nav-slot.

---

## Implemented

```yaml
accept_pass:
  - id: SHELL-001
    description: "BottomTabBar-import fjernet (linje 22)"
  - id: SHELL-002
    description: "TabName-import fjernet (linje 23) — var kun brugt af activeTab-state"
  - id: SHELL-003
    description: "activeTab + setActiveTab state fjernet — verificeret at ingen anden reference
                  eksisterede i filen inden sletning"
  - id: SHELL-004
    description: "BottomTabBar-render-blok fjernet (linje 2403-2411 inkl. messageCount={2})"
  - id: SHELL-005
    description: "TopBar udvidet med nav-prop: 2 items (Kalenderoversigt → /prototyper/gantt,
                  Dagens opgaver → /prototyper/dagsoversigt). Navigations-mål bevaret 1:1
                  fra den fjernede BottomTabBar-onTabPress. Ingen activeId (OrdrePlan er
                  ikke selv et nav-mål)"
  - id: SHELL-006
    description: "Grid wrapper: '280px 1fr' → 'clamp(220px, 22vw, 320px) minmax(0, 1fr)'.
                  paddingTop: 44 fjernet (var arvet offset; aside har egen top: 52)"
  - id: SHELL-007
    description: "Aside height: 'calc(100vh - 52px - 70px)' → 'calc(100vh - 52px)'.
                  top: 52 og alle aside-klasser uændret"
  - id: SHELL-008
    description: "Main: pb-[120px] → pb-lg (token = 32px). px-lg og pt-xs uændret"
```

---

## Not implemented

```yaml
accept_skip: []
```

Alle 7 SPEC-ændringer er implementeret.

---

## Assumptions

- `mine-opgaver`-tab (BottomTabBar) navigerede til `/prototyper/gantt` — dette er kortlagt
  som "Kalenderoversigt" i TopBarNav. Navne-skiftet er intentionelt jf. SPEC §4.
- `beskeder`, `kontakt`, `dokumentation`-tabs i BottomTabBar havde ingen rute-mål
  (kun `setActiveTab`) — fjernet uden erstatning jf. SPEC §4 ("Fjernet").
- Interne content-grids (linje 1427, 1742, 1872, 2017) er ikke rørte — disse er
  data-grids inde i `<main>`, ikke shell-layout.
- `messageCount={2}` (hardcodet badge) er fjernet — Beskeder-badge afventer delt shell
  jf. SPEC §3.

---

## Known issues

- Ingen nye issues identificeret.
- Præ-eksisterende eslint jsx-a11y/aria-labels violations i filen er uændrede
  (ikke en del af dette refactor).

---

## Files changed

```
modified:
  - apps/formand/src/prototypes/ordre-plan/OrdrePlanScreen.tsx
    # Linje 22-23: import-fjernelse (BottomTabBar + TabName)
    # Linje 82: state-fjernelse (activeTab/setActiveTab)
    # Linje 834: TopBar udvidet med nav-prop
    # Linje 838: grid fluid-konvertering + paddingTop-fjernelse
    # Linje 844: aside height -70px fjernet
    # Linje 949: pb-[120px] → pb-lg
    # Linje 2403-2411: BottomTabBar-render-blok fjernet
```

---

## Prototype-fidelity

**Source:** `apps/formand/src/prototypes/ordre-plan/OrdrePlanScreen.tsx`

**Hvad blev ændret 1:1 iht. SPEC:**
- Alle 7 SPEC-ændringer eksekveret nøjagtigt som beskrevet i linje-for-linje spec.
- Navigations-mål bevaret uændret fra BottomTabBar.

**Bevidste afvigelser fra den tidligere prototype:**

| # | Afvigelse | Begrundelse |
|---|---|---|
| 1 | BottomTabBar fjernet | SPEC + bruger-godkendelse 2026-06-29 |
| 2 | `280px 1fr` → `clamp(220px, 22vw, 320px) minmax(0, 1fr)` | Fluid layout — Mulighed B låst 2026-06-29 |
| 3 | `calc(100vh - 52px - 70px)` → `calc(100vh - 52px)` | BottomTabBar (70px) er fjernet |
| 4 | `pb-[120px]` → `pb-lg` | Token-violation rettet (clearance for tabbar ikke mere nødvendig) |
| 5 | `paddingTop: 44` fjernet | Arvet offset uden funktion efter TopBar er sticky |

**Hvad IKKE afveg (selvom det fristede):**
- `top: 52` i aside bevaret som runtime-value (inline style) — ikke omskrevet til token
  fordi det er genuint runtime-beregnet og matcher TopBar's faktiske højde.

---

## API exports

Ingen ny public API. `OrdrePlanScreen` eksporterer det samme funktionssignatur som før.

---

## Tokens / patterns brugt

- Grid-kolonner: `clamp(220px, 22vw, 320px) minmax(0, 1fr)` — inline style (runtime-beregnet, tilladt)
- Aside-højde: `calc(100vh - 52px)` — inline style (runtime-beregnet, tilladt)
- Main bund-padding: `pb-lg` (token = 32px)
- Main side + top: `px-lg` / `pt-xs` (uændret tokens)
- Ingen hex-farver, ingen hardcodede px i Tailwind-klasser

---

## Tests skrevet

Ingen — dette er en prototype-fil. Tests er test-writer's ansvar efter review.

---

## Ready-for-next-step

- [x] Typecheck pass: `npm run formand:typecheck` — 0 fejl
- [x] Alle 7 SPEC-ændringer verificeret (grep bekræfter ingen spor af fjernede symboler)
- [x] Navigations-mål verificeret mod original BottomTabBar-onTabPress
- [x] Interne content-grids uberørte (linje 1427, 1742, 1872, 2017)
- [x] Handoff udfyldt (denne fil)
- [x] Klar til reviewer

> Builder afslutter her. Reviewer overtager.

---

## Builder sign-off

```yaml
builder_signoff:
  builder_agent: claude-sonnet-4-6
  signed_at: "2026-06-29 12:00"
  acceptkriterier_implementeret: "8 af 8 (SHELL-001..008)"
  acceptkriterier_skipped: 0
  prototype_kopieret_1_til_1: false
  bevidste_afvigelser_count: 5
  # Alle 5 afvigelser er intentionelle og dokumenterede i Prototype-fidelity ovenfor.
  manuel_testning_udfoert:
    - "Grep-søgning bekræfter 0 resterende referencer til BottomTabBar, activeTab, setActiveTab, TabName, pb-[120px], 280px 1fr, paddingTop: 44, calc(100vh - 52px - 70px)"
    - "Grep-søgning bekræfter tilstedeværelse af nav-prop i TopBar-render, clamp-grid, calc(100vh - 52px), pb-lg"
    - "Navigations-mål verificeret: mine-opgaver→gantt (nu Kalenderoversigt), dagens-opgaver→dagsoversigt — begge stier uændret"
    - "Interne content-grids (linje 1427, 1742, 1872, 2017) bekræftet uberørte via grep"
  selv_lint_typecheck: passed
  saerlig_opmaerksomhed_bedes_paa:
    - "Reviewer bør verificere i browser at aside nu fylder fuld viewport-højde (ingen hvid bundlinje) — kan ikke maskinelt tjekkes"
    - "Reviewer bør verificere at fluid aside-bredde (clamp 220-320px) ikke klemmer indhold på smalle viewports"
    - "TopBarNav viser ingen activeId — OrdrePlan har ingen nav-mål. Reviewer bør bekræfte at dette er korrekt UX (ingen pill markeret)"
  signatur: "Jeg står inde for at koden implementerer SPEC + handoff præcis som dokumenteret ovenfor"
```

**Næste skridt:** Status sat til `ready-for-review`. Reviewer-agent kald manuelt via `/review OrdrePlanShellRefactor` (prototype-fase).
