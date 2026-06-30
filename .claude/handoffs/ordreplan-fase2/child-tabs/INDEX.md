---
feature: ③ Samleordre child-tabs (OrdrePlan Fase 2)
app: formand
status: PLAN — afventer Carstens godkendelse (ingen kode, ingen builder)
created: 2026-06-30
prototype: apps/formand/src/prototypes/ordre-plan/
---

# INDEX — ③ Samleordre child-tabs

Bring child-tabs (én tab pr. udførselssted/child-ordre) til TOPPEN af 4 sektioner, drevet af ÉN delt tab-komponent + delt tab-state. Plus 3 Udlægning-tweaks.

## SPEC-filer
1. `SPEC_SamleordreChildTabs.md` — NY leaf-komponent (den ene tab-komponent)
2. `SPEC_PropThreading_setter.md` — Round 1: tråd `setSamleordreTabOrderNr` ned til containere
3. `SPEC_DokumentationSection_childtabs.md` — Planlægning
4. `SPEC_ForundersoegelseSection_childtabs.md` — Udførsel
5. `SPEC_KsRapporteringSection_childtabs.md` — Udførsel
6. `SPEC_UdlaegningSection_childtabs_tweaks.md` — Afregning + 3 tweaks

## Build-rækkefølge
- **Round 1 (parallelt OK):** #1 SamleordreChildTabs · #2 Prop-threading
- **Round 2 (parallelt OK, alle afhænger af Round 1):** Dokumentation · Forundersøgelse · KS · Udlægning
- **Round 3:** Refaktorér makeOrdredetaljerCard til at bruge SamleordreChildTabs (kan slås sammen med #1).

## Visual Pattern Inventory (kanonisk tab-æstetik — alle nye tabs SKAL matche)
Kilde: `OrdrePlanScreen.tsx:543–568` (eksisterende samleordre-tab-bar).

| Element | Klasser | Kilde |
|---|---|---|
| Tab-container | `inline-flex gap-xxxs` | L543 |
| Tab-knap | `inline-flex items-center gap-xs px-md py-xs border border-hairline rounded-t-lg transition-colors font-inter text-xs font-semibold` | L552 |
| Aktiv tab | `bg-white border-b-white text-deep-teal relative z-10 -mb-[1px]` | L554 |
| Inaktiv tab | `bg-surface-2 text-text-muted hover:text-deep-teal` | L555 |
| Anchor-prik | `w-[6px] h-[6px] rounded-full bg-yellow flex-shrink-0` | L559-562 (PATTERNS.md §11a) |
| Boks under tabs | `bg-white border border-hairline overflow-hidden rounded-tr-xl rounded-b-xl` | L571 |

Bemærk: produkt-tabs (Udlægning L153-174) og KS-skema-tabs (KS L108-155) bruger en ANDEN aktiv-farve (`bg-deep-teal text-white`). Child-tabs bruger white-active. De to niveauer skelnes bevidst visuelt.

## Svar på de 5 centrale spørgsmål

**1. Delt vs per-sektion tab-state → DELT.** Genbrug eksisterende root `samleordreTabOrderNr`. Ordredetaljer + Forundersøgelse + Udlægning + Kørsel læser den allerede; per-sektion ville bryde sammenhæng + tilføje state. Skift i én sektion = skift overalt. Detaljer i `SPEC_PropThreading_setter.md`.

**2. SamleordreChildTabs-komponent.** Props: `children` (subset), `activeOrderNr`, `onSelect`, `variant?` (kun `'attached'` nu). Placering: prototype-lokal `components/` (samleordre er rent formand-intern; PeriodeDatoVaelger-præcedens). makeOrdredetaljerCard-inline-tabs REFAKTORERES til at bruge den (IN SCOPE) → kun ÉN tab-komponent. Detaljer i `SPEC_SamleordreChildTabs.md`.

**3. Per-child indhold pr. sektion.**
- **Forundersøgelse + Udlægning:** EKSISTERENDE per-child mock bruges (`forundersoegelseDetails`, `udlaegningDetails` på `SamleordreChild`). Ingen ny mock. ✅
- **Dokumentation + KS:** `SamleordreChild` har INGEN dokumentations-/KS-felter. ANBEFALING = Fase A: tabs + header-suffix + remount pr. child (`key={tabOrderNr}`), men behold delt indhold-mock. Ægte per-child data = NYE mock-felter → separat sub-beslutning (flagget, ikke nu). ⚠️ Carsten bekræfter scope.

**4. Ikke-samleordre fallback.** Alle tabs gated på `isSamleordreMode && children.length > 1`. Falsk → ingen tabs, sektioner uændret. Bekræftet i hver SPEC. ✅

**5. Udlægning-tweaks.** (a) `<h2>` flyttes UD af boksen. (b) produkt-browser-tabs → in-box segment-toggle. (c) "I gang·startet"-pille (childUdlaegning info-banner L184-199) slettes. Detaljer + JSX-referencer i `SPEC_UdlaegningSection_childtabs_tweaks.md`. ⚠️ Bekræft: tweaks (a)+(b) gælder begge modes (generel forbedring).

## Prototype-regler
Tokens-only (kendte bevarede violations: `w-[6px]`, `-mb-[1px]` — flagget, ikke introduceret af denne feature). Inline mock OK. Ingen tests/stories. Ingen Supabase.

## Cross-app dataflow
Ingen. Rent formand-internt UI. FUNCTIONAL_FLOWS opdateres IKKE.

## Kendt dead-code-flag (cleanup)
Efter Udlægning tweak (c): `childUdlaegning`-variablen bliver ubrugt → fjern eller cleanup-agent fanger.
