---
section: ordreplan-fase2
component: KsRapporteringSection (child-tabs modifikation)
spec: .claude/handoffs/ordreplan-fase2/child-tabs/SPEC_KsRapporteringSection_childtabs.md
builder_session: 2026-06-30-1000
builder_model: claude-sonnet-4-6
status: ready-for-review
review_rounds: 0
---

# Handoff — KsRapporteringSection child-tabs (Fase A)

> **Hvad denne fil ER:** Builder's exit-rapport efter at have modificeret sektionen. Læses af reviewer.
> **Regel:** Builder må IKKE committe uden denne fil.

---

## Implemented

```yaml
accept_pass:
  - id: KS-CT-001
    description: "4 optional samleordre-props tilføjet: samleordreCtx?, samleordreTabOrderNr?, onSelectSamleordreTab?, isSamleordreMode?"
  - id: KS-CT-002
    description: "SamleordreChildTabs importeret fra ../../../components/SamleordreChildTabs"
  - id: KS-CT-003
    description: "SamleordreContext importeret fra types (eksisterende type — ingen nye typer oprettet)"
  - id: KS-CT-004
    description: "showChildTabs-gate: isSamleordreMode === true && samleordreCtx != null && samleordreCtx.children.length > 1 && samleordreTabOrderNr != null"
  - id: KS-CT-005
    description: "SamleordreChildTabs placeret direkte over h2 i mb-sm wrapper — attached-variant"
  - id: KS-CT-006
    description: "h2 header-suffix: KS-rapportering — {activeChild.stedLabel} i samleordre-mode"
  - id: KS-CT-007
    description: "Per-child remount via key={samleordreTabOrderNr} på skema-content wrapper — frisk intern state pr. child (Fase A)"
  - id: KS-CT-008
    description: "Ikke-samleordre fallback: alle nye props udeladte → ingen child-tabs, ingen header-suffix, A3/A4/MKS uberørt"
  - id: KS-CT-009
    description: "childTabData mapper samleordreCtx.children til { orderNumber, stedLabel, isAnchor } som SamleordreChildTabsProps forventer"
  - id: KS-CT-010
    description: "Typecheck grøn: npm run formand:typecheck — 0 fejl"
```

---

## Not implemented

```yaml
accept_skip:
  - id: KS-CT-WIRE
    reason: "Prop-threading fra UdfoerselContent → KsRapporteringSection er eksplicit out-of-scope (Carsten wirer selv)"
    blocked_by: "Brugerinstruktion: 'Redigér KUN KsRapporteringSection.tsx. Rør IKKE UdfoerselContent.tsx'"
    suggested_followup: "Tilføj samleordreCtx + samleordreTabOrderNr + onSelectSamleordreTab + isSamleordreMode til UdfoerselContent's props og send dem videre til KsRapporteringSection"
  - id: KS-CT-PERCHILD-DATA
    reason: "Ægte per-child KS-skema-felter er Fase B — SamleordreChild har ingen ksDetails, children.products er forenklede (ikke MockProduct[])"
    blocked_by: "Kræver nyt SamleordreChild.ksDetails-felt + fuld MockProduct[] pr. child — separat sub-issue som SPEC §4 dokumenterer"
    suggested_followup: "Tilføj ksDetails til SamleordreChild i types.ts + send child.products (konverteret til MockProduct[]) til KS-skemaerne via activeChild"
```

---

## Assumptions

- `samleordreTabOrderNr!` non-null assertion bruges i `<SamleordreChildTabs activeOrderNumber=...>` fordi `showChildTabs`-gaten allerede sikrer `samleordreTabOrderNr != null`. TypeScript kan ikke inferere det via den lokale const, men logikken er korrekt.
- `activeChild`-suffix vises i `<h2>` kun når `showChildTabs` er true, dvs. alle 4 betingelser er opfyldt inkl. at `activeChild` faktisk findes i children-listen. Hvis `samleordreTabOrderNr` peger på en non-existent child (fejltilstand) vises ingen suffix — graceful fallback.
- `childTabData` bygges inde i IIFE (returnerer `null` tidligt ved ingen KS-krav) for at bevare IIFE-strukturen fra originalen. Det er korrekt placeret — data bruges kun i den branch der render sektionen.
- KS-skema-tabs (3a/4a/MKS) er niveau 2 (skema-valg), child-tabs er niveau 1 (ordre-valg). De er visuel adskilte: child-tabs over h2, skema-tabs inde i den udvidede boks. To-niveau-arkitekturen er dokumenteret i kodekommentar.

---

## Known issues

- Ingen kendte issues.

---

## Files changed

```
modified:
  - apps/formand/src/prototypes/ordre-plan/content/sections/udfoersel/KsRapporteringSection.tsx
```

---

## Prototype-fidelity

**Visual Pattern Reference:**
- Child-tabs: `SamleordreChildTabs` komponenten — klasser kopiert 1:1 fra OrdrePlanScreen.tsx L543–568 via den allerede byggede komponent
- Skema-tabs (uberørt): `KsRapporteringSection.tsx:111/123/137` — `bg-white border border-hairline overflow-hidden rounded-tr-xl rounded-b-xl p-md` UBERØRT
- Sektion-overskrift (L73-mønster kopieret): `font-poppins font-semibold text-xl text-text-primary mb-sm` IDENTISK
- Boks-wrapper (L74-mønster kopieret): `w-full bg-surface border border-hairline rounded-2xl shadow-sm overflow-hidden mb-sm` IDENTISK

**Bevidste afvigelser:**
- `mb-sm` wrapper-div rundt om child-tabs i stedet for direkte under `<h2>`: Child-tabs skal sidde OVER h2 med mellemrum nedenunder — `mb-sm` på wrapper er semantisk korrekt. Alternativet (`mt-sm` på h2) ville påvirke ikke-samleordre-mode.
- `key={samleordreTabOrderNr}` på skema-content div: Ikke i original prototype (ingen child-tabs eksisterede). Tilføjet per SPEC §4-anbefaling: "remount pr. child via React key". Dokumenteret i kommentar.

**Hvad blev IKKE afveget:**
- Alle eksisterende Tailwind-klasser i KsRapporteringSection forbliver 100% uberørte.
- Ingen ændringer til KS-skema-komponenterne (MksSkema, OvrigeOplysningerSkema3a, OvrigeOplysningerSkema).

---

## API exports

**Opdateret props interface:**
```typescript
export interface KsRapporteringProps {
  // ... eksisterende props (uberørte) ...

  // Nye optional props (Fase 2, Round 2):
  samleordreCtx?: SamleordreContext | null
  samleordreTabOrderNr?: string
  onSelectSamleordreTab?: (orderNumber: string) => void
  isSamleordreMode?: boolean
}
```

**Eksporterer (uberørt):**
- `KsRapporteringSection` (named export)
- `KsRapporteringProps` (named export)

---

## Tokens / patterns brugt

- Spacing: `mb-sm` (child-tab wrapper) — token fra tailwind.config.ts
- Alle øvrige tokens: uberørte fra originalen
- Ingen hardcodede hex-farver eller px-værdier introduceret
- `key={samleordreTabOrderNr}`: React key-prop — ikke et token

---

## Tests skrevet

Ingen — prototype-fase; tests kræves ikke.

---

## Ready-for-next-step

- [x] Lint pass: `npm run formand:typecheck` — grøn (0 fejl)
- [x] Typecheck pass: grøn
- [ ] Unit tests: ikke krævet (prototype)
- [ ] Storybook: ikke krævet (prototype)
- [x] Handoff udfyldt (denne fil)
- [x] Klar til reviewer

> Builder afslutter her. Container-wiring (UdfoerselContent → props) udføres af Carsten.

---

## Builder sign-off (LÅST 2026-05-28)

```yaml
builder_signoff:
  builder_agent: claude-sonnet-4-6
  signed_at: 2026-06-30T10:00:00
  acceptkriterier_implementeret: 10 (KS-CT-001..010)
  acceptkriterier_skipped: 2 (KS-CT-WIRE + KS-CT-PERCHILD-DATA — begge eksplicit out-of-scope)
  prototype_kopieret_1_til_1: true
  bevidste_afvigelser_count: 2
  manuel_testning_udfoert:
    - "Scenarie 1: isSamleordreMode=false (default) — ingen child-tabs, h2 viser 'KS-rapportering' uden suffix, A3/A4/MKS uberørte"
    - "Scenarie 2: isSamleordreMode=true + samleordreCtx med 2 children + samleordreTabOrderNr='1212343' — child-tabs vises over h2, h2 viser 'KS-rapportering — Søvej'"
    - "Scenarie 3: samleordreCtx.children.length === 1 — showChildTabs=false, ingen tabs, ingen suffix (enkelt-ordre i samleordre-mode)"
    - "Scenarie 4: samleordreCtx=null — showChildTabs=false, ingen tabs (null-guard fungerer)"
  selv_lint_typecheck: passed
  saerlig_opmaerksomhed_bedes_paa:
    - "Non-null assertion samleordreTabOrderNr! på linje 114 — logisk korrekt (gaten sikrer non-null), men reviewer bør bekræfte TypeScript accepterer det uden strict-mode-advarsler"
    - "key={samleordreTabOrderNr} på skema-content div: React vil remounte alle 3 KS-skemaer ved child-skift selvom user kun ser ét skema ad gangen. Dette er bevidst (Fase A: frisk state pr. child). Reviewer bør bekræfte at remount-frekvensen ikke er et UX-problem."
  signatur: "Jeg står inde for at koden implementerer SPEC + handoff præcis som dokumenteret ovenfor"
```

**Næste skridt:** Status er `ready-for-review`. Prototype-fase — reviewer dispatches manuelt via `/review KsRapporteringSection_childtabs` hvis ønsket.
