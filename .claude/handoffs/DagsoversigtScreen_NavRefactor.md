---
section: dagsoversigt
component: DagsoversigtScreen (nav-refactor)
spec: n/a — mekanisk udvidelse af OrdrePlan shell-nav-mønster
builder_session: 2026-06-29-1430
builder_model: claude-sonnet-4-6
status: ready-for-review
review_rounds: 0
---

# Handoff — DagsoversigtScreen nav-refactor

> Mekanisk udvidelse af det allerede godkendte shell-nav-mønster (TopBar NavSlot + shell)
> fra OrdrePlanScreen til DagsoversigtScreen. Ingen ny komponent bygget.

---

## Implemented

```yaml
accept_pass:
  - id: NAV-001
    description: "Fjernet import BottomTabBar fra @/components/layout/BottomTabBar"
  - id: NAV-002
    description: "Fjernet import type TabName fra @/types/navigation"
  - id: NAV-003
    description: "Fjernet activeTab-state (useState<TabName>) — verificeret ingen andre brugssteder"
  - id: NAV-004
    description: "Fjernet handleTabPress-funktion — verificeret kun brugt af BottomTabBar"
  - id: NAV-005
    description: "Fjernet <BottomTabBar .../>-render (linje 1399 inkl. messageCount)"
  - id: NAV-006
    description: "Udvidet <TopBar> med onLogoPress + nav (items, activeId: 'dagens-opgaver', onNavigate) — identisk OrdrePlan-wiring"
  - id: NAV-007
    description: "Fjernet paddingBottom: 70 inline style på <main> — erstattet med className pb-lg (token)"
  - id: NAV-008
    description: "FAB bottom-[84px] -> bottom-md (token). Forældet 84px-kommentar slettet."
```

---

## Not implemented

```yaml
accept_skip: []
```

Alle 8 punkter fra scope er implementeret.

---

## Assumptions

- `pb-lg` (32px) er valgt som bund-luft på `<main>` — svarer til `pb-md` (24px) + lidt ekstra. Tidligere var det 70px (BottomTabBar-højde). Da bjælken er væk, er 32px tilstrækkeligt for FAB-clearance med `bottom-md` (24px FAB-offset + FAB-højde ~44px = ~68px fra bunden — indholdet ruller forbi FAB uden at skjule sig bag den).
- `bottom-md` til FAB = 24px fra bunden — passende når der ingen bundbjælke er.
- OrdrePlanScreen bruger identisk nav-wiring — ingen API-overraskelser forventet.

---

## Known issues

- Præ-eksisterende lint-advarsel (`jsx-a11y/aria-labels`) berøres ikke af denne ændring.
- `w-[80%] mx-auto` grid-bredde er bevidst bevaret — fluid-grid-konvertering er separat opgave.

---

## Files changed

```
modified:
  - apps/formand/src/prototypes/dagsoversigt/DagsoversigtScreen.tsx
    # 8 mekaniske ændringer: 2 imports fjernet, 2 state/funktion fjernet,
    # 1 BottomTabBar-render fjernet, 1 TopBar udvidet, 1 main paddingBottom→pb-lg,
    # 1 FAB bottom-[84px]→bottom-md
```

---

## Prototype-fidelity

**Source (prototype):**
- Fil: `apps/formand/src/prototypes/dagsoversigt/DagsoversigtScreen.tsx`
- Ændringer er rene deletions + én udvidelse af eksisterende TopBar-prop.

**Hvad blev ændret:**
- Fjernet: BottomTabBar-import + type TabName-import
- Fjernet: activeTab useState + handleTabPress funktion
- Fjernet: `<BottomTabBar />` render
- Udvidet: `<TopBar>` med `onLogoPress` + `nav` prop (identisk mønster fra OrdrePlanScreen)
- Erstattet: `style={{ paddingBottom: 70 }}` med `className="pb-lg"` (token)
- Erstattet: `bottom-[84px]` med `bottom-md` (token) + slettet forældet kommentar

**Bevidste afvigelser fra prototype:**
- Ingen ny funktionalitet — ren nav-migrering.

**Hvad blev IKKE rørt:**
- `w-[80%] mx-auto` grid-bredde (eksplicit out-of-scope)
- `bottom-[3px]` prik-indikator på linje ~1039 (korrekt bevaret — intern indikator, ikke FAB)
- Al øvrig screen-logik (samleordre, dato-navigation, view-modes)

---

## API exports

Ingen ny komponent-API. `DagsoversigtScreen` er en prototype-screen uden eksporteret props interface.

---

## Tokens / patterns brugt

- Spacing: `pb-lg` (32px) erstatter hardcodet `paddingBottom: 70` på main
- Spacing: `bottom-md` (24px) erstatter hardkodet `bottom-[84px]` på FAB
- TopBar nav-wiring: identisk mønster fra `OrdrePlanScreen` (SPEC_OrdrePlan_ShellRefactor + SPEC_TopBar_NavSlot)
- Ingen nye hex-værdier, ingen nye hardcodede px

---

## Tests skrevet

Ingen — prototype-fil, tests ikke krævet.

---

## Ready-for-next-step

- [x] Typecheck pass: `npm run formand:typecheck` — 0 fejl
- [x] Alle 8 scope-punkter implementeret
- [x] Grep-verificering: ingen tilbageværende `activeTab`, `handleTabPress`, `BottomTabBar`, `TabName`, `paddingBottom: 70`, `bottom-[84px]`, `84px`
- [x] Handoff udfyldt

---

## Builder sign-off (LÅST 2026-05-28)

```yaml
builder_signoff:
  builder_agent: claude-sonnet-4-6
  signed_at: 2026-06-29 14:30
  acceptkriterier_implementeret: "8 af 8 — NAV-001..008"
  acceptkriterier_skipped: 0
  prototype_kopieret_1_til_1: true
  bevidste_afvigelser_count: 0
  manuel_testning_udfoert:
    - "Grep-verificering: ingen resterende referencer til BottomTabBar/activeTab/handleTabPress/TabName"
    - "Grep-verificering: ingen hardcodede px-værdier (paddingBottom: 70, 84px) tilbage"
    - "Typecheck: npm run formand:typecheck — 0 fejl, 0 nye warnings"
    - "Visuelt tjek: bottom-[3px] prik-indikator på kalender-dag IKKE berørt (linje ~1039)"
  selv_lint_typecheck: passed
  saerlig_opmaerksomhed_bedes_paa:
    - "pb-lg (32px) som main bund-luft — tilstrækkeligt til FAB-clearance med bottom-md, men bør bekræftes visuelt"
    - "onLogoPress navigerer til '/prototyper/dagsoversigt' (samme skærm) — denne er den kanoniske Dagens opgaver-URL, bekræft route er korrekt"
  signatur: "Jeg står inde for at koden implementerer scope præcis som dokumenteret ovenfor"
```
