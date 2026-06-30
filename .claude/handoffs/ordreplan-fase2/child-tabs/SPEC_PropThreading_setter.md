---
issue: TBD
issue_id: FORMOP-SOCT-NNN
epic: TBD
status: Draft
component: Prop-threading (orchestrator + 3 content-containere)
files: OrdrePlanScreen.tsx, content/PlanlaegningContent.tsx, content/UdfoerselContent.tsx, content/AfregningContent.tsx
type: layout/orchestrator wiring
build_round: 1 (foundation — sektionerne i Round 2 afhænger af dette)
---

# SPEC — Prop-threading: udbred samleordre-tab-state til de 4 sektioner

## Problem
De nye child-tabs i sektionerne SKAL kunne SKIFTE child → de skal kalde `setSamleordreTabOrderNr`. I dag bor `[samleordreTabOrderNr, setSamleordreTabOrderNr]` i OrdrePlanScreen (L62) og **setteren bruges kun lokalt i `makeOrdredetaljerCard` (L549)**. Den er IKKE trådet ned til nogen content-container.

Desuden mangler nogle sektioner endda `samleordreTabOrderNr` (læse-værdien):
| Container | `samleordreTabOrderNr` i dag | `setSamleordreTabOrderNr` i dag |
|---|---|---|
| PlanlaegningContent (→ Dokumentation) | ❌ NEJ | ❌ NEJ |
| UdfoerselContent (→ Forundersøgelse, KS) | ✅ JA (L1051) | ❌ NEJ |
| AfregningContent (→ Udlægning) | ✅ JA (L1090-ish) | ❌ NEJ |

## Ændringer (Round 1)

### 1. OrdrePlanScreen.tsx — send setter + (manglende) value ned
- `<PlanlaegningContent>` (L963): tilføj `samleordreTabOrderNr={samleordreTabOrderNr}` + `onSelectSamleordreTab={setSamleordreTabOrderNr}`.
- `<UdfoerselContent>` (L1038): tilføj `onSelectSamleordreTab={setSamleordreTabOrderNr}`.
- `<AfregningContent>` (L1067): tilføj `onSelectSamleordreTab={setSamleordreTabOrderNr}`.

> Navngivning: vi eksponerer setteren som callback-prop `onSelectSamleordreTab: (orderNumber: string) => void` (ikke rå setter) — matcher app-konvention (`onSelect…`, `onSet…`) og holder containerne agnostiske.

### 2. PlanlaegningContent.tsx — nye props + videregiv til DokumentationSection
- Tilføj til props-type: `samleordreTabOrderNr?: string`, `onSelectSamleordreTab?: (orderNumber: string) => void`.
- Videregiv til `<DokumentationSection>` (L244-blokken): `samleordreTabOrderNr` + `onSelectSamleordreTab`. (`isSamleordreMode`/`samleordreCtx` sendes allerede.)

### 3. UdfoerselContent.tsx — ny prop + videregiv
- Tilføj `onSelectSamleordreTab?: (orderNumber: string) => void` til props.
- Videregiv til `<ForundersoegelseSection>` (L141) + til `<KsRapporteringSection>` (L153) sammen med `isSamleordreMode`/`samleordreCtx`/`samleordreTabOrderNr` (KS får INTET samleordre i dag → tilføj alle 4).

### 4. AfregningContent.tsx — ny prop + videregiv
- Tilføj `onSelectSamleordreTab?: (orderNumber: string) => void`.
- Videregiv til `<UdlaegningSection>` (L377).

## Delt vs per-sektion state — BESLUTNING (spørgsmål 1)
**ANBEFALING: ÉN delt `samleordreTabOrderNr` (skift i én sektion = skift i alle + Ordredetaljer).**

Begrundelse:
1. Ordredetaljer-kortet (makeOrdredetaljerCard) bruger ALLEREDE den delte `samleordreTabOrderNr`, og Forundersøgelse/Udlægning/Kørsel læser allerede den samme. Per-sektion-state ville bryde den eksisterende sammenhæng.
2. Mental model: formanden arbejder på ÉN child-ordre ad gangen ("nu kigger jeg på Søvej"). At skifte child i Forundersøgelse men ikke i Udlægning ville være forvirrende.
3. Mindre state, mindre prop-threading, ingen ny state-ejer.
4. Sektionerne er i forskellige modes (Dokumentation=Planlægning; Forundersøgelse/KS=Udførsel; Udlægning=Afregning) → man ser sjældent to samtidig, men delt state gør at child-valget "huskes" når man skifter mode. Ønskeligt.

→ Ingen ny state oprettes. Genbrug eksisterende root-state.

## Gate
- typecheck grøn efter Round 1 (ingen visuel ændring forventet — kun props der endnu ikke forbruges; sektionerne forbruger dem i Round 2).
- Round 1 alene ændrer INTET visuelt. Verificér: alle 3 modes renderer identisk.

## Tokens / komponenter
Ingen. Ren wiring.
