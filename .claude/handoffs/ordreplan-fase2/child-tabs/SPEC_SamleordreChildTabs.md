---
issue: (oprettes efter "byg")
issue_id: (FORMPL-SAMLE-NNN — tildeles ved issue-creation)
epic: (parent Epic — oprettes efter "byg")
status: Draft (afventer "byg")
---

# SPEC — SamleordreChildTabs

> **Feature:** ③ Samleordre child-tabs (OrdrePlan, app: formand)
> **Type:** `components/` (screen-specifik for ordre-plan — kandidat til `ui/` ved promotion)
> **Build-round:** 1 (leaf — ingen interne dependencies)

## Hvad komponenten gør

En genbrugbar tab-række der lader brugeren skifte mellem child-ordrerne i en samleordre. Hver tab labels med child-ordrens **adresse** (`stedLabel`) og en gul anchor-dot for primær-ordren. Komponenten understøtter to visuelle varianter via `variant`-prop: `'attached'` (tab-rækken er fysisk koblet til toppen af kortet/tabellen nedenunder — "browser-tab"-mønster) og `'standalone'` (løsrevet tab-bar, fx i collapsed-kontekster).

Denne komponent **konsoliderer** det tab-mønster der i dag står duplikeret to+ steder i prototypen:
- `makeOrdredetaljerCard` (OrdrePlanScreen.tsx L540–571) — samleordre Ordredetaljer-faner
- Udlægning-sektionen (UdlaegningSection.tsx L151–174) — i dag produkt-tabs, skal udvides med adresse-tabs (se `SPEC_UdlaegningSection_childtabs_tweaks.md`)

## Genbrug-begrundelse (COMPONENT_REGISTRY-tjek)

COMPONENT_REGISTRY indeholder ingen eksisterende kanonisk tab-komponent. Det "browser-tab"-mønster findes i dag inline i `makeOrdredetaljerCard`. I stedet for at tilføje et tredje inline-duplikat, ekstraheres mønsteret til `SamleordreChildTabs`, og **både `makeOrdredetaljerCard` OG Udlægning-sektionen skal bruge samme komponent + samme `variant='attached'`**. Post-build: tilføj `SamleordreChildTabs` til COMPONENT_REGISTRY (flag: screen-specifik nu, cross-app-kandidat senere hvis vognmand får samleordre-visning).

## Props interface

```ts
export interface SamleordreChildTab {
  /** Ordrenummer — bruges som key og som identitet i onSelect */
  orderNumber: string
  /** Adresse-label vist i tabben (fx "Søvej", "Strandvejen") */
  stedLabel: string
  /** True for primær/anchor-ordren — viser gul anchor-dot */
  isAnchor: boolean
}

export interface SamleordreChildTabsProps {
  /** Child-ordrer der bliver til tabs (rækkefølge = visningsrækkefølge) */
  children: SamleordreChildTab[]
  /** Ordrenummer på den aktuelt valgte tab */
  activeOrderNumber: string
  /** Kaldes når en tab vælges */
  onSelect: (orderNumber: string) => void
  /**
   * Visuel variant:
   * - 'attached'  → tab-rækken danner kortets øverste kant. Aktiv tab har
   *   bg-white + border-b-white + -mb-[1px] så den "smelter" ind i kortet.
   *   Bruges af makeOrdredetaljerCard OG Udlægning-sektionen.
   * - 'standalone' → løsrevet tab-bar uden kort-kobling (fald-back / collapsed).
   * @default 'attached'
   */
  variant?: 'attached' | 'standalone'
}
```

> **Rendering-kontrakt:** Komponenten renderer KUN tab-rækken (`<div>` med tab-`<button>`s). Selve kortet/tabellen nedenunder ejes af kalderen og skal have hjørne-klasserne `rounded-tr-xl rounded-b-xl` (når tabs vises) så `variant='attached'`-koblingen virker. Komponenten renderer ALDRIG selv ved `children.length <= 1` → returnér `null` (enkelt-ordre = ingen tabs; kalderen gør kortet fuldt `rounded-xl`).

## Visuelle states

| State | Adfærd |
|---|---|
| `children.length <= 1` | Returnér `null` — ingen tabs (enkelt-ordre). |
| `children.length >= 2` | Render én tab pr. child i `inline-flex gap-xxxs`. |
| Aktiv tab (`variant='attached'`) | `bg-white border-b-white text-deep-teal relative z-10 -mb-[1px]` |
| Inaktiv tab | `bg-surface-2 text-text-muted hover:text-deep-teal` |
| Anchor-child | Gul dot `w-[6px] h-[6px] rounded-full bg-yellow flex-shrink-0` før label, `aria-label="Primær ordre"` |
| `variant='standalone'` | Samme tab-styling, men uden `-mb-[1px]`-koblingen (ingen kort nedenunder). |

A11y: `aria-pressed={isActive}` på hver tab-`<button>`. Tabs er `<button type="button">` — touch target følger eksisterende `px-md py-xs` (matcher Ordredetaljer-fanerne; disse er kompakte browser-tabs, ikke primær-CTA'er).

## Data den skal bruge

Ingen egen data — alt kommer via props. Kalderen mapper fra `SamleordreContext.children` (types.ts L112–166) til `SamleordreChildTab[]`. Ingen Supabase/mock-afhængighed i komponenten selv.

## Tokens

- Spacing: `gap-xxxs`, `px-md`, `py-xs`
- Radius: `rounded-t-lg` (tab-top)
- Farver: `bg-white`, `border-b-white`, `text-deep-teal`, `bg-surface-2`, `text-text-muted`, `bg-yellow`, `border-hairline`
- Font: `font-inter text-xs font-semibold`

Ingen hardcodede værdier undtagen anchor-dot-dimension `w-[6px] h-[6px]` (eksisterende prototype-konvention for små dots — bevares uændret for visuel paritet med Ordredetaljer-fanerne) og `-mb-[1px]` (browser-tab-koblingen — bevidst 1px-overlap, identisk med makeOrdredetaljerCard L554).

## Visual Pattern Reference

Komponenten ER ekstraktionen af makeOrdredetaljerCard's tab-mønster — den SKAL være visuelt identisk:

- **Tab-container**: matcher `OrdrePlanScreen.tsx:543` — `inline-flex gap-xxxs`
- **Tab-button (base)**: matcher `OrdrePlanScreen.tsx:551–552` — `inline-flex items-center gap-xs px-md py-xs border border-hairline rounded-t-lg transition-colors font-inter text-xs font-semibold`
- **Tab-button (aktiv, attached)**: matcher `OrdrePlanScreen.tsx:554` — `bg-white border-b-white text-deep-teal relative z-10 -mb-[1px]`
- **Tab-button (inaktiv)**: matcher `OrdrePlanScreen.tsx:555` — `bg-surface-2 text-text-muted hover:text-deep-teal`
- **Anchor-dot**: matcher `OrdrePlanScreen.tsx:559–562` — `w-[6px] h-[6px] rounded-full bg-yellow flex-shrink-0` + `aria-label="Primær ordre"`
- **Kort-kobling (ejes af kalder)**: matcher `OrdrePlanScreen.tsx:571` — `rounded-tr-xl rounded-b-xl` når tabs vises; `rounded-xl` ved enkelt-ordre

> Bemærk: Udlægning-sektionens nuværende produkt-tabs bruger en *anden* aktiv-stil (`bg-deep-teal text-white`, UdlaegningSection.tsx L165). Adresse-tab'ene SKAL bruge `attached`-variantens hvide stil (Ordredetaljer-mønsteret) — IKKE den mørke produkt-tab-stil. Se Udlægning-SPEC for hvordan adresse-tabs og produkt-toggle adskilles.

## Eksisterende komponenter den bruger

Ingen (leaf-komponent).

## Post-build TODO

- [ ] Tilføj `SamleordreChildTabs` til `.claude/docs/COMPONENT_REGISTRY.md`
- [ ] Refaktorér `makeOrdredetaljerCard` (OrdrePlanScreen.tsx L540–571) til at bruge `SamleordreChildTabs variant='attached'` (dokumentér i handoff at Ordredetaljer nu deler komponent)
- [ ] Sikr at Udlægning-sektionen bruger `variant='attached'` (samme som Ordredetaljer)
