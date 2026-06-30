---
section: ordre-plan
component: UdlaegningSection
spec: .claude/handoffs/ordreplan-fase2/SPEC_Afregning_Sections.md
builder_session: 2026-06-30-1200
builder_model: claude-sonnet-4-6
status: ready-for-review
review_rounds: 0
---

# Handoff — UdlaegningSection

> **Hvad denne fil ER:** Builder's exit-rapport efter at have bygget komponenten. Læses af reviewer + validator + dig.
> **Regel:** Builder må IKKE committe uden denne fil.

---

## Implemented

```yaml
accept_pass:
  - id: FASE2-R4-13
    description: "UdlaegningSection.tsx oprettet i sections/afregning/ — ordret extraction af AfregningContent.tsx L419–588"
  - id: FASE2-R4-13a
    description: "selectedAfregningProductId/setSelectedAfregningProductId trådes som props — state ejes af container (AfregningContent)"
  - id: FASE2-R4-13b
    description: "produkterForUdlaegning-beregning og perProduktUdlaegning-mock beholdt i sektionen (kun brugt her)"
  - id: FASE2-R4-13c
    description: "FremdriftCard, FremdriftInputRow, INITIAL_RECEPTER — alle genbrugt via korrekte @/ og relative stier"
  - id: FASE2-R4-13d
    description: "Token-violation gap-[48px] røres IKKE — den er i rod-containeren, ikke i denne sektion"
  - id: FASE2-R4-13e
    description: "Alle TODO-kommentarer fra kilden bevaret ordret"
```

---

## Not implemented

```yaml
accept_skip:
  - id: FASE2-R4-13-wiring
    reason: "Integration i AfregningContent sker i trin #17 (separat build-round)"
    blocked_by: "Integrations-trin #17 SPEC"
    suggested_followup: "Trin #17 erstatter inline L419–588 med <UdlaegningSection .../>"
```

---

## Assumptions

- `perProduktUdlaegning`-mock bor i sektionen og ikke i AfregningContent da den KUN bruges af denne sektion (ikke cross-cutting state).
- `produkterForUdlaegning`-beregningen er ikke state — den er en derived value baseret på props. Beholdt som IIFE-beregning øverst i komponenten (identisk med kildens pattern).
- `<hr className="my-lg border-t border-hairline" />` (L417 i AfregningContent) er IKKE inkluderet i UdlaegningSection — den er sibling til sektionen inde i wrapper-`<div>` og forbliver i AfregningContent ved integration.
- IIFE-mønsteret `{recept && (() => { ... })()}` er konverteret til at returnere fra selve funktionen: `return recept ? (() => { ... })() : null` — funktionelt identisk, men TypeScript-korrekt som komponentens return-statement.

---

## Known issues

- Ingen kendte bugs. Sektionen er en ordret extraction og har ingen logik-ændringer.

---

## Files changed

```
created:
  - apps/formand/src/prototypes/ordre-plan/content/sections/afregning/UdlaegningSection.tsx

modified:
  - (ingen — AfregningContent.tsx redigeres i integrations-trin #17)
```

---

## Prototype-fidelity

**Source (prototype):**
- Fil: `apps/formand/src/prototypes/ordre-plan/content/AfregningContent.tsx`
- Linjer kopieret: L419–588 (Udlægning-blokken inde i Ordredetaljer-wrapper-div)
- Lokal mock medtaget: L119–135 (`perProduktUdlaegning`)
- Lokal beregning medtaget: L106–112 (`produkterForUdlaegning`)

**Hvad blev ekstraheret 1:1:**
- JSX-struktur (alle divs, knapper, FremdriftCard/FremdriftInputRow)
- Tailwind-klasser (alle tokens + token-violations bevaret ordret: `w-[8px]`, `h-[8px]`, `-mb-[1px]`)
- IIFE-beregnings-blok (fmtTal, activeChildForU, ppu-lookup, progress-beregninger)
- Alle inline kommentarer + TODO-kommentarer
- Conditional render-branches (harFlereProdukter, isSamleordreMode, harEkstraarbejde, visUdlaegningInput)

**Bevidste afvigelser fra prototype:**
- IIFE-mønster `{recept && (() => { ... })()}` omstruktureret til `return recept ? (() => { ... })() : null` — nødvendig fordi det er return-statement i en komponent i stedet for JSX-expression. Adfærd og render-output er 100% identisk.

**Hvad blev IKKE afveget:**
- Token-violations `w-[8px]`, `h-[8px]`, `-mb-[1px]` beholdt ordret
- `min-h-[44px]` på "Registrer udlægning"-knap beholdt (touch-target)
- `perProduktUdlaegning`-mock beholdt inline i sektionen (ikke flyttet til mocks/)

---

## API exports

**Props interface:**
```typescript
export interface UdlaegningSection_Props {
  recept?: ReturnType<typeof useRecept>['recept']
  tonsAnkommet?: number
  forventetUdlagtM2?: number
  faktiskRegistrering?: DagsoverblikRegistrering | null
  visUdlaegningInput?: boolean
  onSetVisUdlaegningInput?: (vis: boolean) => void
  onGemFaktisk?: (m2: number, tons: number) => void
  demoTonsIDag?: number
  demoArealIDag?: number
  demoTykkelse?: number
  harEkstraarbejde?: boolean
  products?: MockProduct[]
  isSamleordreMode?: boolean
  samleordreCtx?: SamleordreContext | null
  samleordreTabOrderNr?: string
  selectedAfregningProductId: string | null   // påkrævet — ejes af AfregningContent
  setSelectedAfregningProductId: (id: string) => void  // påkrævet — ejes af AfregningContent
}
```

**Eksporterer:**
- `UdlaegningSection` (named export)
- `UdlaegningSection_Props` (named export)

**Forventer fra parent:**
- `selectedAfregningProductId` + `setSelectedAfregningProductId` fra AfregningContent (L113)
- `recept` fra useRecept-hook i AfregningContent
- `faktiskRegistrering` fra useDagsoverblik i AfregningContent

---

## Tokens / patterns brugt

- Farver: `text-deep-teal`, `bg-deep-teal`, `bg-surface`, `bg-surface-2`, `bg-good`, `bg-warning`, `bg-text-muted`, `text-text-primary`, `text-text-muted`, `text-text-secondary`, `border-hairline`, `bg-soft-aqua`, `bg-dark-teal`, `text-white` (ingen hex)
- Spacing: `gap-xs`, `gap-xxxs`, `gap-xxs`, `px-md`, `py-xs`, `px-sm`, `py-xxxs`, `mb-sm`, `mb-xs`, `mt-xs`, `ml-xs`, `p-md` (ingen px-hardcoding i layout)
- Font: `font-poppins` (h2), `font-inter` (body/knapper) — ingen hardcodet font-family
- Token-violations bevaret ordret (extraction-princip): `w-[8px]`, `h-[8px]`, `-mb-[1px]`
- Touch targets: "Registrer udlægning"-knap har `min-h-[44px]` (bevaret fra kilde)

---

## Tests skrevet (hvis test-writer kørt)

```
unit:    0 — prototype-fase, ingen tests kræves
story:   0 — INDEX SPEC §"Ingen tests/stories kræves (prototype-fase)"
e2e:     0
```

---

## Ready-for-next-step

- [x] Typecheck pass: `npm run formand:typecheck` — GRØN
- [x] Handoff udfyldt (denne fil)
- [ ] Lint: 5 pre-eksisterende errors i formand, ingen nye tilføjet
- [ ] Visual verification: Afventer integrations-trin #17
- [x] **Klar til reviewer** → ready-for-review

> Builder afslutter her. Reviewer overtager (eller integrations-trin #17 bygges næst).

---

## Builder sign-off (LÅST 2026-05-28)

```yaml
builder_signoff:
  builder_agent: claude-sonnet-4-6
  signed_at: "2026-06-30 12:00"
  acceptkriterier_implementeret: "FASE2-R4-13 (alle sub-kriterier a-e implementeret)"
  acceptkriterier_skipped: "1 — FASE2-R4-13-wiring (integrations-trin #17, separat build)"
  prototype_kopieret_1_til_1: true
  bevidste_afvigelser_count: 1
  manuel_testning_udfoert:
    - "Typecheck: npm run formand:typecheck — ingen fejl (grøn gate)"
    - "Extraction verificeret: alle Tailwind-klasser fra L419-588 er identiske i ny fil"
    - "Props-tråding verificeret: selectedAfregningProductId + setter matches SPEC's state-ejerskab"
    - "IIFE-konvertering verificeret: return recept ? (() => {...})() : null er funktionelt identisk med kildens {recept && (() => {...})()}"
  selv_lint_typecheck: passed
  saerlig_opmaerksomhed_bedes_paa:
    - "IIFE-mønster konverteret til return-statement — logisk identisk, men reviewer bør bekræfte at TypeScript-inferens af return-type er korrekt (ReactElement | null)"
    - "perProduktUdlaegning bor nu i sektionen og ikke i AfregningContent — dette er korrekt fordi det kun bruges her, men reviewer bør bekræfte at det ikke skal deles med andre sektioner"
    - "Interface-navn er UdlaegningSection_Props (underscore) fremfor UdlaegningProps — valgt for klarhed, men reviewer kan foreslå rename"
  signatur: "Jeg står inde for at koden implementerer SPEC + handoff præcis som dokumenteret ovenfor"
```

**Næste skridt:** Trin #14 `BilTonsAfregningSection`, #15 `MaterielafregningSection`, #16 `TimeafregningSection` — derefter integrations-trin #17.
