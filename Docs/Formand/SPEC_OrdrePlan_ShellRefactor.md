# SPEC — OrdrePlanScreen shell-refactor

> **App:** formand
> **Type:** `prototypes/` (shell-/layout-refactor af `OrdrePlanScreen.tsx`)
> **Build-round:** 3 (afhænger af TopBarNav + TopBar nav-slot)
> **Status:** Godkendt af Carsten 2026-06-29 — ingen GitHub-issue (skip besluttet)

## Hvad ændringen gør

Fjerner `BottomTabBar` fra `OrdrePlanScreen` og flytter navigationen op i `TopBar` via `TopBarNav`. Konverterer det faste `280px 1fr`-grid til en **fluid** layout (Mulighed B — `clamp()`/`minmax()`/`fr`, ingen plugin, ingen `tailwind.config`-edit). Frigør bund-pladsen der tidligere var reserveret til BottomTabBar (70px).

## Fluid-strategi — Mulighed B (LÅST 2026-06-29)

- **INGEN container-query-plugin.** Container-queries parkeres som udskudt cross-app-beslutning (note i FUNCTIONAL_FLOWS).
- **INGEN `tailwind.config.ts`-edit.** Fluid opnås med inline `style`-værdier (genuint runtime-/viewport-beregnede → tilladt jf. CLAUDE.md "inline style kun ved runtime-beregnede værdier").

### Eksakte grid-værdier

| Element | Værdi |
|---|---|
| Wrapper-grid `gridTemplateColumns` | `'clamp(220px, 22vw, 320px) minmax(0, 1fr)'` |
| Aside `height` | `'calc(100vh - 52px)'` (var: `calc(100vh - 52px - 70px)` — `- 70px` fjernes da BottomTabBar er væk) |
| Aside `top` (sticky) | `52` (uændret — TopBar-højde) |
| Wrapper `paddingTop` | fjernes (`44` slettes — se ændring 5) |
| Main bund-padding | `pb-lg` (token = 32px) — erstatter `pb-[120px]` (var clearance for 70px tabbar + margin) |

**Hvorfor `minmax(0, 1fr)` for main:** `1fr` alene tillader at indhold med `min-content`-bredde (brede tabeller/grids i main) sprænger kolonnen. `minmax(0, 1fr)` tvinger kolonnen til at respektere container-bredden og lade indre indhold scrolle/krympe. Direkte krav fra fluid-strategien.

## Eksakte ændringer i `apps/formand/src/prototypes/ordre-plan/OrdrePlanScreen.tsx`

### 1. Fjern imports (død kode efter refactor)
- **Linje 22**: `import { BottomTabBar } from '@/components/layout/BottomTabBar'` → SLET.
- **Linje 23**: `import type { TabName } from '@/types/navigation'` → SLET (kun brugt af BottomTabBar-state).
- **Linje 21**: `import { TopBar } from '@/components/layout/TopBar'` → BEVAR (udvides med nav-prop).

### 2. Fjern død state
- **Linje 82**: `const [activeTab, setActiveTab] = useState<TabName>('dagens-opgaver')` → SLET. `activeTab`/`setActiveTab` bruges KUN af BottomTabBar (linje 2404/2408) — bliver død kode når den fjernes. Verificér ingen anden reference før sletning.

### 3. Fjern BottomTabBar-render
- **Linje 2403-2411**: hele `<BottomTabBar activeTab=... onTabPress=... messageCount={2} />`-blokken → SLET. Inkl. `messageCount={2}` (hardcoded badge fjernes — Beskeder-badge afventer delt shell).

### 4. Indlejr nav i TopBar
- **Linje 834**: erstat
  ```tsx
  <TopBar userInitials="OJ" userName="Ole J." onSettingsPress={() => {}} />
  ```
  med TopBar + nav-prop. Nav-items + onNavigate flytter de **bevarede** navigations-mål fra den gamle BottomTabBar-`onTabPress` (linje 2406-2407):
  ```tsx
  <TopBar
    userInitials="OJ"
    userName="Ole J."
    onSettingsPress={() => {}}
    nav={{
      items: [
        { id: 'kalenderoversigt', label: 'Kalenderoversigt', to: '/prototyper/gantt' },
        { id: 'dagens-opgaver',   label: 'Dagens opgaver',   to: '/prototyper/dagsoversigt' },
      ],
      // OrdrePlan er ikke selv et nav-mål → ingen activeId
      onNavigate: (item) => navigate(item.to),
    }}
  />
  ```
  **Bevarede mål (uændret rute):** Kalenderoversigt → `/prototyper/gantt`, Dagens opgaver → `/prototyper/dagsoversigt`. **Fjernet:** beskeder/kontakt/dokumentation (havde kun `setActiveTab`, intet rute-mål).

### 5. Grid-wrapper-ændring
- **Linje 836-838**: erstat
  ```tsx
  <div className="grid" style={{ gridTemplateColumns: '280px 1fr', paddingTop: 44 }}>
  ```
  med
  ```tsx
  <div className="grid" style={{ gridTemplateColumns: 'clamp(220px, 22vw, 320px) minmax(0, 1fr)' }}>
  ```
  `paddingTop: 44` fjernes (var en arvet offset; TopBar er sticky og aside har egen `top: 52`).

### 6. Aside-højde
- **Linje 842-844**: i `<aside ... style={{ top: 52, height: 'calc(100vh - 52px - 70px)' }}>` → ændr `height` til `'calc(100vh - 52px)'`. `top: 52` bevares. Øvrige aside-klasser (`sticky border-r border-hairline ... overflow-y-auto`) uændret.

### 7. Main bund-padding
- **Linje 949**: `<main className="px-lg pb-[120px] pt-xs">` → `<main className="px-lg pb-lg pt-xs">`. Erstatter `pb-[120px]` (clearance for fjernet 70px tabbar) med token `pb-lg` (32px). `px-lg` + `pt-xs` uændret.

### Uberørt
- Indre `gridTemplateColumns`-inline-styles (linje 1427, 1742, 1872, 2017) er **content-grids inde i main** — IKKE shell. Rør ikke.
- Samleordre tilføj-ordre-navigation (linje 879) + dagsoversigt-link (linje 975) — uændret.
- `navigate()`-hook + alle andre kald — uændret.

## Visuelle states

| State | Visuelt |
|---|---|
| **default** | TopBar med nav-strip; ingen bundmenu; aside fuld højde til viewport-bund |
| **smal viewport (≥768 / tablet)** | Aside klemmer til `clamp`-min 220px, main får resten via `minmax(0,1fr)` |
| **bred viewport (desktop)** | Aside vokser til `clamp`-max 320px; main fylder resten |
| **edge: bredt indhold i main** | `minmax(0,1fr)` forhindrer kolonne-overflow; indre tabeller scroller/krymper |

## Visual Pattern Reference

- **TopBar bevares**: `apps/formand/src/components/layout/TopBar.tsx:13-16` — `bg-deep-teal sticky top-0 z-50`, højde 52px.
- **Nav aktiv-/hover-mønster**: se SPEC_TopBarNav.md (aktiv `bg-yellow` fra `BottomTabBar.tsx:81`, hover `bg-white/10` fra `TopBar.tsx:37`).
- **Aside-ramme**: bevarer `OrdrePlanScreen.tsx:842-843` — `border-r border-hairline ... overflow-y-auto`.
- **Main spacing**: bevarer `OrdrePlanScreen.tsx:949` `px-lg pt-xs`; kun bund-padding skiftes til token `pb-lg`.

## Design-tokens

| Aspekt | Token / værdi |
|---|---|
| Grid-kolonner | `clamp(220px, 22vw, 320px) minmax(0, 1fr)` (runtime-beregnet → inline tilladt) |
| Aside-højde | `calc(100vh - 52px)` (runtime → inline tilladt) |
| Main bund-padding | `pb-lg` (32px token) |
| Main side/top | `px-lg` / `pt-xs` (uændret) |

Ingen hardcoded px tilbage i shell-layoutet udover de bevidste runtime-`calc()`/`clamp()` og TopBar's eksisterende `52`-højde.

## Data

Ingen ny data. `navigate` (react-router) genbruges fra eksisterende hook i komponenten.

## Bruger eksisterende komponenter

- `TopBar` (med ny `nav`-prop — SPEC_TopBar_NavSlot.md)
- `TopBarNav` (transitivt via TopBar — SPEC_TopBarNav.md)

## Token-violation-note

`pb-[120px]` (linje 949) er en eksisterende arbitrær-værdi-violation der ryddes som del af dette refactor (→ `pb-lg`). Ingen ny violation introduceres. `52`/`44`/`calc(...)`/`clamp(...)` er bevidste runtime-/layout-værdier (tilladt per CLAUDE.md).
