# SPEC — TopBar (nav-slot udvidelse)

> **App:** formand
> **Type:** `layout/` (udvidelse af eksisterende `TopBar.tsx`)
> **Build-round:** 2 (afhænger af TopBarNav fra round 1)
> **Status:** Godkendt af Carsten 2026-06-29 — ingen GitHub-issue (skip besluttet)

## Hvad ændringen gør

Udvider den eksisterende `TopBar` med en valgfri midter-slot der renderer `TopBarNav` mellem logo (venstre) og avatar-pill (højre). TopBar er ikke en ny komponent — kun props + layout udvides bagudkompatibelt.

## Eksisterende komponent (genbruges — byg ikke ny)

`apps/formand/src/components/layout/TopBar.tsx` — eksisterende sticky header, `bg-deep-teal`, højde 52px. Bevares uændret i farve, højde, logo og avatar-pill.

## Props-interface (eksporteret — udvidet)

```ts
import type { TopBarNavProps } from './TopBarNav'

export interface TopBarProps {
  /** Initialer til avatar-cirkel, fx "OJ" */
  userInitials: string
  /** Kort navn vist i avatar-pill, fx "Ole J." */
  userName: string
  onSettingsPress?: () => void
  /**
   * Valgfri navigations-slot vist mellem logo og avatar.
   * Når undefined renderes ingen nav (bagudkompatibelt — eksisterende
   * brug af TopBar uden nav er uændret).
   */
  nav?: TopBarNavProps
  /**
   * Valgfri klik-handler på COLAS-logoet (fx naviger til Dagens opgaver).
   * Når sat bliver logoet en klikbar knap (min-h-touch, hover:bg-white/10,
   * aria-label "Gå til Dagens opgaver"); ellers statisk billede.
   * Bagudkompatibelt — eksisterende brug uden onLogoPress er uændret.
   */
  onLogoPress?: () => void
}
```

- `nav` er **optional** → alle eksisterende `<TopBar ... />`-kald (uden nav) virker uændret.
- Når sat: TopBar renderer `<TopBarNav {...nav} />` i midter-slotten.
- `onLogoPress` er **optional** → logoet bliver kun klikbart når sat. Tilføjet 2026-06-29 da nav-pattern blev rullet ud til Gantt (Kalenderoversigt) + Dagsoversigt (Dagens opgaver). Wires på alle 3 nav-skærme til `navigate('/prototyper/dagsoversigt')`.

## Layout-ændring

Nuværende: `flex items-center justify-between` (logo venstre, avatar højre).

Ny: tre-zone-layout så nav kan ligge i midten uden at skubbe avatar:
- Logo (venstre, fixed)
- `<TopBarNav>` (midter, `flex-1` + venstre-justeret med `ml-md` fra logo) — kun når `nav` er sat
- Avatar-pill + Settings (højre, fixed)

`justify-between` bevares; nav indsættes som element i den eksisterende `flex`-række så zonerne fordeles naturligt. Højde forbliver `52px`. Når `nav` er undefined er layoutet pixel-identisk med i dag.

## Visuelle states

| State | Visuelt |
|---|---|
| **default (uden nav)** | Identisk med nuværende TopBar |
| **default (med nav)** | Nav vist venstre for avatar, samme højde 52px |
| **loading / error** | N/A — TopBar er rent layout |

## Visual Pattern Reference

- **Header-baggrund + højde + sticky**: bevarer `apps/formand/src/components/layout/TopBar.tsx:13-16` — `bg-deep-teal ... sticky top-0 z-50`, `height: 52`.
- **Hover-mønster for nav-elementer**: nav arver TopBar Settings-knap-mønster `apps/formand/src/components/layout/TopBar.tsx:37` — `bg-white/10` / `hover:bg-white/20 transition-colors` (se SPEC_TopBarNav.md for præcis nav-token).
- **Avatar-pill bevares**: `apps/formand/src/components/layout/TopBar.tsx:26-31` uændret.

## Design-tokens

| Aspekt | Token |
|---|---|
| Header bg | `bg-deep-teal` (uændret) |
| Header højde | `52px` (uændret — eksisterende inline, ikke spacing-token) |
| Nav-afstand fra logo | `ml-md` |
| Padding | `px-sm` (uændret) |
| Gap (højre-zone) | `gap-xs` (uændret) |

## Data

Ingen.

## Bruger eksisterende komponenter

- `TopBarNav` (round 1 — se SPEC_TopBarNav.md) — renderes i nav-slot.
- `lucide-react` `Settings` (uændret).

## Registry

`TopBar` er allerede en byggesten. Opdatér registry-noten for `TopBar` post-build til at nævne den valgfri `nav`-slot. Cross-app-kandidat sammen med `TopBarNav` (delt shell — udskudt, se FUNCTIONAL_FLOWS).
