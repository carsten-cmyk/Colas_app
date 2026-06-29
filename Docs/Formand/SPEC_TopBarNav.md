# SPEC — TopBarNav

> **App:** formand
> **Type:** `layout/` (sub-komponent til TopBar)
> **Build-round:** 1 (leaf — ingen interne komponent-dependencies)
> **Status:** Godkendt af Carsten 2026-06-29 — ingen GitHub-issue (skip besluttet)

## Hvad komponenten gør

Vandret navigations-strip der vises inde i `TopBar` (mellem logo og avatar-pill) og lader formanden hoppe til de øvrige top-skærme (Kalenderoversigt, Dagens opgaver). Erstatter den nederste `BottomTabBar` på `OrdrePlanScreen`.

## Scope-afgrænsning (LÅST 2026-06-29)

Kun de to navigations-mål der har et faktisk rute-mål i dag bevares:

| Label | Rute |
|---|---|
| Kalenderoversigt | `/prototyper/gantt` |
| Dagens opgaver | `/prototyper/dagsoversigt` |

**Midlertidigt fjernet** (afventer delt app-shell — se FUNCTIONAL_FLOWS-noten): `Beskeder` (+ message-badge), `Kontakt`, `Dokumentation`. Disse var i `BottomTabBar` men havde ingen rute-mål (kun `setActiveTab` lokal state). De genindføres når den delte shell etableres på tværs af apps.

## Props-interface (eksporteret)

```ts
export type TopBarNavItemId = 'kalenderoversigt' | 'dagens-opgaver'

export interface TopBarNavItem {
  /** Stabil id til aktiv-markering + key */
  id: TopBarNavItemId
  /** Synligt label, fx "Kalenderoversigt" */
  label: string
  /** Rute der navigeres til ved klik */
  to: string
}

export interface TopBarNavProps {
  /** Navigations-elementer i visningsrækkefølge */
  items: TopBarNavItem[]
  /** Id på det aktive element (undefined = ingen aktiv, fx på OrdrePlan selv) */
  activeId?: TopBarNavItemId
  /** Kaldes ved klik på et element — container håndterer navigate() */
  onNavigate: (item: TopBarNavItem) => void
}
```

- Ingen `any`. Items leveres som prop (container ejer ruter/navigate — presenteren er ren).
- JSDoc på `activeId` (semantisk: kan være undefined).

## Visuelle states

| State | Visuelt |
|---|---|
| **default** (ikke-aktiv) | `text-white/85`, transparent baggrund |
| **hover** (ikke-aktiv) | `bg-white/10` (matcher TopBar avatar-pill + Settings-knap hover-mønster) |
| **aktiv** | `bg-yellow text-deep-teal` (matcher BottomTabBar aktiv-indikator-farve `bg-yellow`) |
| **loading** | N/A — rent navigations-element, ingen async data |
| **error** | N/A |
| **edge: tom items[]** | Renderer ingenting (ingen tom-ramme) |
| **edge: langt label** | `whitespace-nowrap` — ingen wrap (matcher BottomTabBar label) |

## Visual Pattern Reference

- **Pill-baggrund + radius (idle/hover)**: matcher TopBar avatar-pill `apps/formand/src/components/layout/TopBar.tsx:26` — `bg-white/10 rounded-[20px]`. Nav-knapper genbruger `bg-white/10` til hover og `rounded-md` (token) til form.
- **Hover-transition**: matcher TopBar Settings-knap `apps/formand/src/components/layout/TopBar.tsx:37` — `hover:bg-white/20 transition-colors`. Nav bruger `hover:bg-white/10 transition-colors` (lettere, da nav er tekst-pille, ikke ikon-knap).
- **Aktiv-farve**: matcher BottomTabBar aktiv-indikator `apps/formand/src/components/layout/BottomTabBar.tsx:81` — `bg-yellow`. Hvor BottomTabBar brugte en 4px gul understreg under label, bruger TopBarNav fuld `bg-yellow`-fyld på den aktive pille (vandret kontekst, ingen plads til understreg-stak).
- **Tekst-farve idle**: matcher TopBar `apps/formand/src/components/layout/TopBar.tsx:30` — `text-white/85`.
- **Font**: matcher TopBar/BottomTabBar — `font-inter text-xs` (TopBar.tsx:30, BottomTabBar.tsx:78 bruger `text-xxs`; nav løftes til `text-xs` da elementerne er bredere og primær-navigation).

## Design-tokens (valgt — ingen hardcoded værdier)

| Aspekt | Token |
|---|---|
| Touch target | `min-h-touch` (44px) — knap-højde sikres ≥44px (CLAUDE.md-krav) |
| Font | `font-inter text-xs` |
| Tekst idle | `text-white/85` |
| Tekst aktiv | `text-deep-teal` |
| Baggrund aktiv | `bg-yellow` |
| Baggrund hover | `bg-white/10` |
| Radius | `rounded-md` |
| Padding | `px-sm py-xs` |
| Gap mellem items | `gap-xxs` |
| Transition | `transition-colors` |

**Bemærk touch-højde:** `text-xs` + `py-xs` (8px×2 = 16px + ~16px linje = ~32px). `min-h-touch` påkræves for at nå 44px (CLAUDE.md: touch targets ≥44×44 uden undtagelse, gælder også når app åbnes på tablet).

## Data

Ingen. Rent præsentations-/navigations-element. `items` leveres af container (OrdrePlanScreen-shell).

## Bruger eksisterende komponenter

Ingen. Leaf-komponent. Bruges AF `TopBar` (se SPEC_TopBar_NavSlot.md).

## Registry

Ny komponent. Ikke i `COMPONENT_REGISTRY.md` i dag. Flag: tilføj `TopBarNav` til registry post-build (formand `layout/`). Cross-app-kandidat (🌍): når delt app-shell etableres bør TopBar+TopBarNav flyttes til `shared/components/` — noteret som udskudt cross-app-beslutning i FUNCTIONAL_FLOWS.
