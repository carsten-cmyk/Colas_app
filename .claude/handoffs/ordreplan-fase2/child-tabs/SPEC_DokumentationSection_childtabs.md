---
issue: TBD
issue_id: FORMOP-SOCT-NNN
epic: TBD
status: Draft
component: DokumentationSection (MODIFIKATION)
file: content/sections/planlaegning/DokumentationSection.tsx
type: screens/ (sektion)
build_round: 2 (afhænger af #1 SamleordreChildTabs)
---

# SPEC — DokumentationSection: child-tabs øverst (per-child indhold)

## Hvad ændringen gør (én sætning)
Sætter `SamleordreChildTabs` øverst i Dokumentation-sektionen (kun i samleordre-mode med 2+ children), så Dokumentations-indholdet kan vises per valgt child.

## Nuværende tilstand
- `DokumentationSection.tsx` modtager `isSamleordreMode` + `samleordreCtx` (PlanlaegningContent L271–272) men **bruger dem IKKE** og modtager **IKKE** `samleordreTabOrderNr` eller setteren.
- Indholdet (Opmåling/Billeder/Noter) er global ordre-state, ikke per-child.

## Ændringer

### 1. Nye props (tilføj til `DokumentationSectionProps`)
```ts
isSamleordreMode?: boolean
samleordreCtx?: SamleordreContext | null
samleordreTabOrderNr?: string
onSelectSamleordreTab?: (orderNumber: string) => void
```

### 2. Render tabs øverst i `<section>` (før `<h2>`)
```tsx
{isSamleordreMode && samleordreCtx && samleordreCtx.children.length > 1 && samleordreTabOrderNr && (
  <SamleordreChildTabs
    children={samleordreCtx.children}
    activeOrderNr={samleordreTabOrderNr}
    onSelect={(nr) => onSelectSamleordreTab?.(nr)}
  />
)}
```
Boks-wrapperen (`bg-white border ... rounded-xl`, L67) får `rounded-tr-xl rounded-b-xl` når tabs vises (matcher makeOrdredetaljerCard-mønster) — ellers `rounded-xl` (uændret).

### 3. Per-child indhold — SCOPE-BESLUTNING (afventer Carsten, se spørgsmål 3)
**ANBEFALING: Fase A (tabs + header-suffix, IKKE per-child data endnu).**
- `SamleordreChild` har **ingen** dokumentations-felter (ingen per-child fotos/noter/opmåling).
- Mindste ærlige leverance: vis tabs + "— {stedLabel}"-suffix i toggle-headeren, men behold global mock-data som indhold (samme `photos`/`noteComments` for alle children). Dette matcher den oprindelige feature ("bring child-tabs til toppen") uden at opfinde mock.
- **Flag:** Hvis Carsten vil have ægte per-child fotos/noter, kræver det NYE felter på `SamleordreChild` (`dokumentationDetails: { photoCount, noteCount, ... }`) — det er en mock-udvidelse, dokumenteres som separat sub-beslutning. Anbefaling: ikke nu (Dokumentation er mindst kritisk per-child).

### Ikke-samleordre fallback
`isSamleordreMode === false` → tab-gaten er falsk → ingen tabs, boks beholder `rounded-xl`, indhold 100% uændret. BEKRÆFTET.

## Visual Pattern Reference
- **Tabs**: `SamleordreChildTabs` (se SPEC #1) — matcher `OrdrePlanScreen.tsx:543–568`.
- **Sektion-overskrift**: uændret `DokumentationSection.tsx:65` — `font-poppins font-semibold text-xl text-text-primary mb-sm`.
- **Boks-wrapper**: `DokumentationSection.tsx:67` — `bg-white border border-hairline rounded-xl overflow-hidden` → ved tabs: `rounded-tr-xl rounded-b-xl`.

## Prop-threading (upstream)
PlanlaegningContent SKAL videregive `samleordreTabOrderNr` + `onSelectSamleordreTab` → kræver at OrdrePlanScreen tråder `samleordreTabOrderNr` + `setSamleordreTabOrderNr` ned til `<PlanlaegningContent>` (gør det IKKE i dag — se INDEX prop-threading-tabel).

## Tokens / eksisterende komponenter
Bruger `SamleordreChildTabs`. Ingen nye tokens.
