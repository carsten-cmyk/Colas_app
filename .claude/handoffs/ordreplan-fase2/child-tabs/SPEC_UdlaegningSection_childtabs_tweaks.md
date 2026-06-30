---
issue: (oprettes efter "byg")
issue_id: (FORMPL-SAMLE-NNN — tildeles ved issue-creation)
epic: (parent Epic — oprettes efter "byg")
status: Draft (afventer "byg")
---

# SPEC — UdlaegningSection: child-tabs på tabellen + 3 layout-tweaks

> **Feature:** ③ Samleordre child-tabs (OrdrePlan, app: formand)
> **Type:** ændring til eksisterende `content/sections/afregning/UdlaegningSection.tsx`
> **Build-round:** 2 (afhænger af `SamleordreChildTabs` — Round 1)
> **Fil:** `apps/formand/src/prototypes/ordre-plan/content/sections/afregning/UdlaegningSection.tsx`

## Hvad ændringen gør (én sætning)

Udlægning-sektionen får adresse-baserede child-tabs **fysisk koblet til toppen af Udlægnings-boksen** (samme "browser-tab"-mønster som `makeOrdredetaljerCard`), så formanden kan skifte mellem hver samleordre-childs udlægningstabel via dens adresse — plus tre generelle layout-tweaks der gælder begge modes.

## Carstens ordrette ønske

> "jeg vil faktisk gerne have tabs med hver ordres adresse koblet på tabellen som vi gør på ordredetaljer."

Konkret: tab-rækken danner Udlægnings-boksens øverste kant (boksen `rounded-tr-xl rounded-b-xl`, aktiv tab `-mb-[1px]` så den smelter ind i boksen), og indholdet (Udlægnings-tabellen/FremdriftCard-grid'et) skifter pr. valgt child nedenunder. IKKE en løsrevet tab-bar med luft under.

## Ændring 1 — Adresse-child-tabs koblet på tabellen (samleordre)

- **Genbrug `SamleordreChildTabs`** (Round 1) med `variant='attached'` — IKKE et nyt inline-tab-mønster.
- Tab-labels = `child.stedLabel` (adresse) + gul anchor-dot for `isAnchor` — identisk med Ordredetaljer-fanerne.
- Tab-rækken sidder fysisk fastgjort til toppen af Udlægnings-boksen. Boksen skal være `bg-white border border-hairline overflow-hidden rounded-tr-xl rounded-b-xl` når tabs vises (matcher makeOrdredetaljerCard L571).
- Valgt child styres af eksisterende prop `samleordreTabOrderNr` (allerede ind i sektionen, UdlaegningSection_Props L57–58). Tab-skift skal kalde tilbage til container så `samleordreTabOrderNr` opdateres — **tilføj prop** `onSelectSamleordreChild?: (orderNumber: string) => void` (container/AfregningContent ejer state'en, jf. Container/Presenter-pattern). Indholdet remounter/genberegner pr. valgt child (eksisterende `activeChildForU`/`produkterForUdlaegning`-logik L89–95 + L121–124 driver allerede dette).
- **Kun samleordre:** vises når `isSamleordreMode && samleordreCtx && children.length >= 2`. Ved enkelt-ordre (`children.length <= 1`): `SamleordreChildTabs` returnerer `null`, og boksen er fuldt afrundet (`rounded-xl`) — uændret adfærd.

### Forhold til de eksisterende produkt-tabs

Sektionen har i dag **produkt-tabs** (L151–174, aktiv-stil `bg-deep-teal text-white`). Disse er en ANDEN akse end adresse-tabs. Efter Tweak (b) nedenfor bliver produktvalg en **toggle inde i boksen** — ikke længere browser-tabs på toppen. Den eneste browser-tab-række på toppen af boksen er adresse-child-tabs (samleordre). Resultat:

- Samleordre: adresse-tabs på toppen (attached) → vælg child → inde i boksen kan man toggle mellem childens produkter.
- Enkelt-ordre: ingen tabs på toppen → inde i boksen toggle mellem ordrens produkter (hvis 2+).

## Ændring 2 — De 3 layout-tweaks (gælder BEGGE modes)

Disse er generelle forbedringer og gælder både samleordre og enkelt-ordre:

**(a) `<h2>` "Udlægning" ud af boksen.** Overskriften flyttes til at stå OVER tab-rækken (som Ordredetaljer, hvor "Ordredetaljer"-titlen står over fanerne — OrdredetaljerSection.tsx L34). Sted-suffix (`— {stedLabel}`) bliver overflødigt på `<h2>` når adresse-tab'ene selv viser adressen → **fjern sted-suffix fra `<h2>`** (nuværende L179–181). I samleordre er adressen nu på den aktive tab; i enkelt-ordre er der ingen adresse at vise.

**(b) Produktvalg → toggle inde i boksen.** De nuværende produkt-tabs (L151–174, browser-tab-stil) erstattes af en kompakt toggle/segmented control INDE i boksen (over FremdriftCard-grid'et), så produkt-aksen ikke konkurrerer visuelt med adresse-tab-rækken på toppen. Toggle vises kun ved `harFlereProdukter` (2+ produkter). Brug eksisterende toggle-æstetik (segmented control) fra design-system; ingen ny farve-beslutning — semantisk valgt-state token.

**(c) Fjern "I gang · startet"-pillen.** Den per-child status-banner (L184–199) der viser `Færdig` / `I gang · startet HH:MM` / `Ikke startet` fjernes. (Noter-delen håndteres i samme oprydning — afklar i handoff om `childUdlaegning.noter` skal bevares som ren note uden status-dot, eller fjernes helt; default: fjern hele banneret L184–199.)

## Visuelle states

| State | Adfærd |
|---|---|
| Samleordre, 2+ children | Adresse-tabs (attached) på toppen af boksen; `<h2>` over tabs uden suffix |
| Samleordre, 1 child / enkelt-ordre | Ingen adresse-tabs; boks fuldt `rounded-xl`; `<h2>` over boksen |
| 2+ produkter på valgt child/ordre | Produkt-toggle inde i boksen over FremdriftCard-grid |
| 1 produkt | Ingen produkt-toggle |
| `recept` falsy | Sektion returnerer `null` (uændret) |
| `visUdlaegningInput` | FremdriftInputRow vises (uændret) |

## Data den skal bruge

Uændret datakilde — `perProduktUdlaegning`-mock (L99–115) + props (`tonsAnkommet`, `forventetUdlagtM2`, `faktiskRegistrering`, `samleordreCtx`, `samleordreTabOrderNr`). Ny callback-prop `onSelectSamleordreChild`. TODO: Erstat med Supabase per-produkt udlægnings-data (uændret kommentar).

## Tokens

- Boks-wrapper: `bg-white border border-hairline overflow-hidden rounded-tr-xl rounded-b-xl` (tabs) / `rounded-xl` (ingen tabs) + `p-md`
- `<h2>`: `font-poppins font-semibold text-xl text-text-primary mb-sm`
- Produkt-toggle: segmented-control-tokens fra design-system (valgt = semantisk valgt-token; ingen hex)

Ingen hardcodede værdier. Eksisterende `-mb-[1px]` (browser-tab-kobling) bevares via `SamleordreChildTabs`.

## Visual Pattern Reference

Ændringen SKAL matche `makeOrdredetaljerCard`'s tab-på-kort-kobling:

- **`<h2>` over tabs**: matcher Ordredetaljer-overskrift `OrdredetaljerSection.tsx:34` — `font-poppins font-semibold text-xl text-text-primary` (placeret over tab-rækken, ikke i boksen)
- **Adresse-tab-række (attached)**: matcher `OrdrePlanScreen.tsx:543` (`inline-flex gap-xxxs`) + aktiv-stil `OrdrePlanScreen.tsx:554` (`bg-white border-b-white text-deep-teal relative z-10 -mb-[1px]`) — via `SamleordreChildTabs variant='attached'`
- **Anchor-dot i tab**: matcher `OrdrePlanScreen.tsx:559–562` — `w-[6px] h-[6px] rounded-full bg-yellow`
- **Boks-kobling**: matcher `OrdrePlanScreen.tsx:571` — `rounded-tr-xl rounded-b-xl` (tabs) / `rounded-xl` (ingen tabs)
- **FremdriftCard-grid**: uændret `OrdrePlanScreen`/UdlaegningSection L208 — `grid grid-cols-1 md:grid-cols-3 gap-xs`

> **Match-bekræftelse:** Adresse-tab'ene bruger Ordredetaljer-fanernes HVIDE aktiv-stil (`bg-white border-b-white text-deep-teal`) — IKKE den nuværende Udlægning-produkt-tab-stil (`bg-deep-teal text-white`, L165). Det er den eksplicitte visuelle paritet Carsten beder om ("som vi gør på ordredetaljer").

## Eksisterende komponenter den bruger

- `SamleordreChildTabs` (Round 1) — `variant='attached'`
- `FremdriftCard`, `FremdriftInputRow` (uændret)
- `useRecept`-hook (uændret)

## Afklaring 1 — udskudt (bekræftet)

Dokumentation + KS-rapportering: Fase A = child-tabs + sted-suffix i overskrift + delt indhold-mock (remount pr. child). Ægte per-child mock-felter for Dok+KS er en separat, udskudt beslutning og påvirker IKKE denne SPEC.
