---
issue: TBD
issue_id: FORMOP-SOCT-NNN
epic: TBD
status: Draft
component: ForundersoegelseSection (MODIFIKATION)
file: content/sections/udfoersel/ForundersoegelseSection.tsx
type: screens/ (sektion)
build_round: 2 (afhænger af #1 SamleordreChildTabs)
---

# SPEC — ForundersoegelseSection: child-tabs øverst (per-child indhold)

## Hvad ændringen gør (én sætning)
Sætter `SamleordreChildTabs` øverst i Forundersøgelse-sektionen og bruger den ALLEREDE eksisterende per-child læsning (`forundersoegelseDetails`) som indhold pr. valgt child.

## Nuværende tilstand (allerede halvt per-child)
- Modtager allerede `isSamleordreMode`, `samleordreCtx`, `samleordreTabOrderNr` (UdfoerselContent L144–146).
- Viser allerede "— {stedLabel}" i `<h2>` (L101–106) OG læser per-child `forundersoegelseDetails` i collapsed preview (L118–126).
- **Mangler kun:** den synlige tab-bar øverst (i dag skifter man child via Ordredetaljer-rækkens tabs; feature vil have tabs direkte på sektionen).

## Ændringer

### 1. Render tabs øverst i `<section>` (før `<h2>`, L97)
```tsx
{isSamleordreMode && samleordreCtx && samleordreCtx.children.length > 1 && samleordreTabOrderNr && (
  <SamleordreChildTabs
    children={samleordreCtx.children}
    activeOrderNr={samleordreTabOrderNr}
    onSelect={(nr) => onSelectSamleordreTab?.(nr)}
  />
)}
```
Når tabs vises, får boks-wrapperen (L109 `rounded-2xl`) tab-tilpassede hjørner. **Note:** boksen bruger i dag `rounded-2xl` (ikke `rounded-xl`). For visuel konsistens med tab-anchoring sættes top-venstre kant flush når tabs vises: `rounded-tr-2xl rounded-b-2xl`. (Behold `2xl`-radius for at matche sektionens eksisterende æstetik — afviger bevidst fra makeOrdredetaljer's `xl`; sektionen er allerede `2xl`.)

### 2. Header-suffix
"— {stedLabel}" i `<h2>` (L101–106) BEHOLDES uændret (redundant med tabs men harmløst; alternativt fjernes for renhed — ANBEFALING: behold, da Udlægning også beholder sit suffix → konsistens). Carsten kan bede om fjernelse.

### 3. Per-child indhold
INGEN ny mock nødvendig. `forundersoegelseDetails` (underlaegsType, tilfredsstillende, besigtigelseComment, photoCount) findes allerede på `SamleordreChild` og bruges allerede i preview (L121–126). Ny tab-bar driver bare `samleordreTabOrderNr` direkte i stedet for via Ordredetaljer-rækken.

### Ikke-samleordre fallback
Tab-gate falsk → ingen tabs, alle eksisterende `isSamleordreMode`-betingede grene falder tilbage til global state (uændret adfærd). BEKRÆFTET.

## Visual Pattern Reference
- **Tabs**: `SamleordreChildTabs` — matcher `OrdrePlanScreen.tsx:543–568`.
- **Sektion-overskrift**: uændret `ForundersoegelseSection.tsx:99` — `font-poppins font-semibold text-xl text-text-primary mb-sm`.
- **Boks-wrapper**: `ForundersoegelseSection.tsx:109` — `w-full bg-surface border border-hairline rounded-2xl shadow-sm overflow-hidden mb-sm`.

## Prop-threading (upstream)
Kræver ny `onSelectSamleordreTab`-prop på sektionen + UdfoerselContent + at OrdrePlanScreen tråder `setSamleordreTabOrderNr` til `<UdfoerselContent>` (i dag trådes kun `samleordreTabOrderNr`, ikke setteren — se INDEX).

## Tokens / eksisterende komponenter
Bruger `SamleordreChildTabs`. Ingen nye tokens.
