---
issue: TBD
issue_id: FORMOP-SOCT-NNN
epic: TBD
status: Draft
component: KsRapporteringSection (MODIFIKATION)
file: content/sections/udfoersel/KsRapporteringSection.tsx
type: screens/ (sektion)
build_round: 2 (afhænger af #1 SamleordreChildTabs)
---

# SPEC — KsRapporteringSection: child-tabs øverst (per-child indhold)

## Hvad ændringen gør (én sætning)
Sætter `SamleordreChildTabs` øverst i KS-rapportering (kun samleordre-mode, 2+ children), så KS-skemaerne (A3/A4/MKS) udfyldes pr. valgt child-ordre.

## Nuværende tilstand
- `KsRapporteringSection` modtager **INGEN** samleordre-props (UdfoerselContent L153 sender intet samleordre-relateret).
- Bruger allerede sine EGNE interne tabs (A3/A4/MKS, `ksActiveTab`) — disse er PER-SKEMA, ikke per-child. De forbliver uberørte.
- KS-krav udledes fra `products` (entreprisekontrol/temperaturmaaling union).

## Ændringer

### 1. Nye props
```ts
isSamleordreMode?: boolean
samleordreCtx?: SamleordreContext | null
samleordreTabOrderNr?: string
onSelectSamleordreTab?: (orderNumber: string) => void
```

### 2. Child-tabs øverst (uden for/over `<section>`-indholdet, før `<h2>` L73)
```tsx
{isSamleordreMode && samleordreCtx && samleordreCtx.children.length > 1 && samleordreTabOrderNr && (
  <SamleordreChildTabs
    children={samleordreCtx.children}
    activeOrderNr={samleordreTabOrderNr}
    onSelect={(nr) => onSelectSamleordreTab?.(nr)}
  />
)}
```
**Vigtigt — to tab-niveauer:** Child-tabs (denne — hvilken ordre) ligger ØVERST; A3/A4/MKS-tabs (eksisterende — hvilket skema) ligger inde i den udvidede boks. Visuelt skel: child-tabs har white-active (`SamleordreChildTabs`); skema-tabs har teal-active. De to niveauer må ikke forveksles → child-tabs får et lille mellemrum (`mb-sm` på et wrapper-div eller tabs sidder direkte over `<h2>`). ANBEFALING: child-tabs direkte over `<h2>KS-rapportering — {stedLabel}</h2>`.

### 3. Header-suffix
Tilføj "— {stedLabel}" til `<h2>` (L73) i samleordre-mode (samme mønster som Forundersøgelse/Udlægning) så aktiv ordre er tydelig.

### 4. Per-child indhold — SCOPE-BESLUTNING (afventer Carsten, se spørgsmål 3)
- KS-skemaerne (`MksSkema`, `OvrigeOplysningerSkema`, `OvrigeOplysningerSkema3a`) tager i dag `products` + `selectedDate` og holder egen intern state.
- `SamleordreChild` har **ingen** KS-skema-felter, og children deler ikke `products`-objekterne 1:1 (child.products er forenklede `{id, recipeCode, recipeName, tonsTotal}` — ikke fulde `MockProduct` med entreprisekontrol/temperaturmaaling).
- **ANBEFALING: Fase A (tabs + header-suffix, skema-state forbliver pr. nu fælles).** Ægte per-child KS-skemaer kræver enten (a) fulde `MockProduct[]` pr. child, eller (b) nye KS-felter på `SamleordreChild`. Begge er mock-udvidelser → separat beslutning. Mindste ærlige leverance = tabs synlige + header viser hvilken ordre; skema-indhold remounter pr. child-skift via React `key={samleordreTabOrderNr}` på skema-wrapper, så hver child får friske felter (uden delt mock-state lækker mellem children).
- **Flag:** Hvis ægte per-child KS-data ønskes → ny `SamleordreChild.ksDetails` + child.products skal være `MockProduct[]`. Dokumenteres som separat sub-issue.

### Ikke-samleordre fallback
Tab-gate falsk → ingen child-tabs, ingen header-suffix; A3/A4/MKS-tabs + skema-state uændret. BEKRÆFTET.

## Visual Pattern Reference
- **Child-tabs**: `SamleordreChildTabs` (white-active) — matcher `OrdrePlanScreen.tsx:543–568`.
- **Skema-tabs (eksisterende, uberørt)**: `KsRapporteringSection.tsx:111/123/137` (teal-active) — `bg-white border border-hairline overflow-hidden rounded-tr-xl rounded-b-xl p-md`.
- **Sektion-overskrift**: `KsRapporteringSection.tsx:73` — `font-poppins font-semibold text-xl text-text-primary mb-sm`.
- **Boks-wrapper**: `KsRapporteringSection.tsx:74` — `w-full bg-surface border border-hairline rounded-2xl shadow-sm overflow-hidden mb-sm`.

## Prop-threading (upstream)
Kræver: nye props på sektionen + UdfoerselContent skal sende dem (sender pt. INTET samleordre til KS) + OrdrePlanScreen tråder `setSamleordreTabOrderNr` til UdfoerselContent.

## Tokens / eksisterende komponenter
Bruger `SamleordreChildTabs` + eksisterende KS-skemaer (`MksSkema`, `OvrigeOplysningerSkema`, `OvrigeOplysningerSkema3a`). Ingen nye tokens.
