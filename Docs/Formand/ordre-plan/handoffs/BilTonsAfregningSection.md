---
section: ordreplan-fase2
component: BilTonsAfregningSection
spec: .claude/handoffs/ordreplan-fase2/SPEC_Afregning_Sections.md
builder_session: 2026-06-30-0900
builder_model: claude-sonnet-4-6
status: ready-for-review
review_rounds: 0
---

# Handoff — BilTonsAfregningSection

> **Hvad denne fil ER:** Builder's exit-rapport efter at have bygget komponenten. Læses af reviewer + validator + dig.
> **Regel:** Builder må IKKE committe uden denne fil.

---

## Implemented

```yaml
accept_pass:
  - id: R4-#14-001
    description: "BilTonsAfregningSection extracted fra AfregningContent.tsx L591–1306 ORDRET"
  - id: R4-#14-002
    description: "Biltabel med alle 7 kolonner (regnr, chauffør, tlf, biltype, kategori, indeholder, afregning)"
  - id: R4-#14-003
    description: "Ekspanderbar afregnings-række per bil med afregningsform-override toggle (akkord/timeløn)"
  - id: R4-#14-004
    description: "1,5-times-regel: banner + tvunget timeløn for akkord-biler der overskrider grænsen"
  - id: R4-#14-005
    description: "Afregnings-felter: timer/ventetid/hviletid (time) + tons/ventetid (akkord) med read-only arvede tons fra vejesedler"
  - id: R4-#14-006
    description: "Timer-fordeling på samleordre-children (time-biler med 2+ children)"
  - id: R4-#14-007
    description: "Vejesedler med multilæs fordeling-expander (tons + ventetid per ordre)"
  - id: R4-#14-008
    description: "Sum-counters for fordeling (tons og ventetid) med grøn/rød feedback"
  - id: R4-#14-009
    description: "Auto-godkend / Godkend afregning / Genåbn afregning flow"
  - id: R4-#14-010
    description: "Subtotaler pr. afregningsform — akkord (biler/tons/ventetid) og time (biler/køretimer/ventetid/hviletid)"
  - id: R4-#14-011
    description: "Chauffør-kommentar (read-only) i ekspanderet række"
  - id: R4-#14-012
    description: "Fallback-tekst når vognmandBekraeftelse mangler"
  - id: R4-#14-013
    description: "todayDay guard: sektionen returnerer null og rendres ikke hvis todayDay er undefined"
```

---

## Not implemented

```yaml
accept_skip:
  - id: R4-#17
    reason: "Container-integration (wiring BilTonsAfregningSection ind i AfregningContent) sker i separat #17-trin"
    blocked_by: "#13 UdlaegningSection + #15 MaterielafregningSection + #16 TimeafregningSection skal bygges først"
    suggested_followup: "Kald /new-component #17 AfregningContent-integration efter alle 4 sektioner er klar"
```

---

## Assumptions

- `beregnAfregningEligibility`, `toggleAfregning`, `updateAfregningField`, `godkendAfregning`, `genaabnAfregning` og `formatTimestamp` trådes ind som callbacks fra containeren — SPEC specificerer at disse helpers EJES af containeren (cross-cutting med "Afslut dag"-validering og auto-godkend useEffect).
- `samleordreTabOrderNr` er med i props-interfacet for API-klarhed men bruges ikke direkte i sektionen (samleordre-ctx bruges via `samleordreCtx`). Den er navngivet `_samleordreTabOrderNr` i destructuring for at signalere dette eksplicit og undgå lint-warning.
- `formatTimestamp` prop er inkluderet i interfacet men bruges reelt ikke i selve sektionen (bruges kun i auto-godkend useEffect som bor i containeren). Den er bevaret for API-konsistens.
- Token-violation `gap-[48px]` i rod-containeren tilhører AfregningContent, ikke denne sektion — er IKKE en del af denne fil.

---

## Known issues

- `style={{ gridTemplateColumns: 'minmax(140px, auto) 1fr 140px 140px' }}` på vejeseddel-rækker er en inline style (kildekoden bruger det direkte). SPEC siger "Tokens-only — flyt violation ORDRET" — dette er en bevidst kilde-violation der bevares præcis som i originalen.
- `manglerFordeling` ikon har `aria-label="Mangler fordeling"` på `AlertTriangle` ikonet — det er kilde-kodens eksakt mønster, bevaret.

---

## Files changed

```
created:
  - apps/formand/src/prototypes/ordre-plan/content/sections/afregning/BilTonsAfregningSection.tsx

modified:
  (ingen — wiring sker i #17)
```

---

## Prototype-fidelity

**Source (prototype):**
- Fil: `apps/formand/src/prototypes/ordre-plan/content/AfregningContent.tsx`
- Linjer ekstraheret: L591–1306 (kommentar "Bestilte biler" L591 → lukker sektion L1305)

**Hvad blev ekstraheret 1:1:**
- Hele biltabellen med thead/tbody
- Alle conditional render-branches (isOpen, isGodkendt, er_materiel_bil, displayType === 'time'/'akkord')
- Inline-beregningerne (manglerFordeling, baseType, effectiveType, isTimeForcedBy15Min)
- Vejeseddel-sektionen med fordeling-expander
- Timer-fordeling på samleordre-children
- Subtotaler-blokken via beregnAfregningEligibility
- Alle Tailwind-klasser (identiske — ingen token-rettelser)

**Bevidste afvigelser fra prototype:**

1. **Callbacks frem for inline functions**: `beregnAfregningEligibility`, `toggleAfregning`, `updateAfregningField`, `godkendAfregning`, `genaabnAfregning`, `formatTimestamp` er nu props (callbacks) i stedet for closures. Dette er den eneste nødvendige parametrisering — SPEC specificerer det eksplicit (cross-cutting med "Afslut dag"-validering i containeren).

2. **todayDay guard returnerer null**: I originalen er hele sektionen wrappped i `{todayDay && ...}` i containeren. Her gøres det til en early `if (!todayDay) return null` i komponenten — semantisk identisk.

3. **`_samleordreTabOrderNr` navngivning**: Props-prop navngives med `_`-præfiks i destructuring fordi den ikke bruges direkte i sektionen. Interface-navn er fortsat `samleordreTabOrderNr` for konsistens med de andre afregnings-sektioner.

**Inline style bevaret (ORDRET violation fra kilde):**
```tsx
// PATTERN DEVIATION fra strict tokens-only: kilde bruger inline style for grid-template-columns
// Bevaret ORDRET per SPEC-princip om at token-violations flyttes uændret, ikke rettes.
style={{ gridTemplateColumns: 'minmax(140px, auto) 1fr 140px 140px' }}
```

---

## API exports

**Props interface:**
```typescript
export interface BilTonsAfregningsSectionProps {
  todayDay?: DayPlan
  vognmandBekraeftelse?: VognmandBekraeftelse
  isSamleordreMode?: boolean
  samleordreCtx?: SamleordreContext | null
  samleordreTabOrderNr?: string
  biltypeAfregning?: Record<string, 'time' | 'akkord'>
  // State slices (EJES af container)
  bilAfregningOverride: Record<string, AfregningType>
  setBilAfregningOverride: React.Dispatch<React.SetStateAction<Record<string, AfregningType>>>
  vejeseddelFordelinger: Record<string, { ordre_id: string; tons: number }[]>
  setVejeseddelFordelinger: React.Dispatch<React.SetStateAction<...>>
  vejeseddelExpanded: Set<string>
  setVejeseddelExpanded: React.Dispatch<React.SetStateAction<Set<string>>>
  vejeseddelVentetidFordelinger: Record<string, Record<string, number>>
  setVejeseddelVentetidFordelinger: React.Dispatch<React.SetStateAction<...>>
  bilTimerFordelinger: Record<string, Record<string, number>>
  setBilTimerFordelinger: React.Dispatch<React.SetStateAction<...>>
  bilVentetidFordelinger: Record<string, Record<string, number>>
  setBilVentetidFordelinger: React.Dispatch<React.SetStateAction<...>>
  bilTimerFordelingOpen: Set<string>
  setBilTimerFordelingOpen: React.Dispatch<React.SetStateAction<Set<string>>>
  afregningOpen: Set<string>
  setAfregningOpen: React.Dispatch<React.SetStateAction<Set<string>>>
  afregningData: Record<string, ChauffoerAfregning>
  setAfregningData: React.Dispatch<React.SetStateAction<Record<string, ChauffoerAfregning>>>
  // Callbacks fra container
  beregnAfregningEligibility: (bil, afrData, vejeseddelFordelingerMap) => { effectiveType, manglerFordeling, kanAutoGodkendes }
  toggleAfregning: (key: string) => void
  updateAfregningField: (key: string, field: keyof ChauffoerAfregning, value: ...) => void
  godkendAfregning: (key: string) => void
  genaabnAfregning: (key: string) => void
  formatTimestamp: (d: Date) => string
}
```

**Eksporterer:**
- `BilTonsAfregningSection` (named export)
- `BilTonsAfregningsSectionProps` (named export)

**Forventer fra parent:**
- `DayPlan`, `VognmandBekraeftelse`, `SamleordreContext`, `ChauffoerAfregning`, `AfregningType`, `ConfirmedTruck` fra `../../../types`
- `formatPhone`, `toE164` fra `@shared/utils/phone`
- `formatRegnr` fra `@shared/utils/regnr`

---

## Tokens / patterns brugt

- Farver: `bg-soft-aqua`, `bg-good`, `bg-bad/10`, `bg-warn-bg`, `text-deep-teal`, `text-text-primary`, `text-text-muted`, `text-good`, `text-bad`, `border-hairline`, `border-bad`, `border-yellow` (ingen hex)
- Spacing: `px-xs`, `py-xxxs`, `p-sm`, `gap-xs`, `gap-xxxs`, `mb-sm`, `mt-sm`, `pt-sm` (ingen hardcoded px undtagen inline-style til grid-kolonner)
- Font: `font-poppins font-semibold text-xl` (h2), `font-inter text-xs/xxs/sm` (body) — ingen hardcoded font-family
- Touch targets: Alle buttons har `min-h-[28px]` eller `py-xxxs px-xs` — knapper er standard inline-størrelse, matcher kilde præcis

---

## Tests skrevet

Ingen — prototype-fase, SPEC kræver ikke tests.

---

## Ready-for-next-step

- [x] Lint pass: ingen nye fejl fra BilTonsAfregningSection.tsx (5 pre-eksisterende errors i andre filer uændret)
- [x] Typecheck pass: `npm run formand:typecheck` grøn
- [ ] Unit tests pass: ikke relevant (prototype-fase)
- [ ] Storybook story: ikke krævet (SPEC: ingen stories i prototype-fase)
- [x] Handoff udfyldt (denne fil)
- [x] **Klar til reviewer** — wiring (#17) er næste trin

> Builder afslutter her. Reviewer overtager eller #17-wiring sker næste.

---

## Builder sign-off (LÅST 2026-05-28)

```yaml
builder_signoff:
  builder_agent: claude-sonnet-4-6
  signed_at: "2026-06-30 09:15"
  acceptkriterier_implementeret: "13 af 13 fra #14 BilTonsAfregningSection — se accept_pass ovenfor"
  acceptkriterier_skipped: "1 — #17 container-integration (separat trin)"
  prototype_kopieret_1_til_1: true
  bevidste_afvigelser_count: 3
  manuel_testning_udfoert:
    - "Typecheck grøn: npm run formand:typecheck returnerer 0 errors"
    - "Lint: ingen nye errors fra BilTonsAfregningSection.tsx — kun pre-eksisterende 5 errors i andre filer"
    - "Props-interface dækker alle state-slices beskrevet i SPEC #14 (bilAfregningOverride, vejeseddelFordelinger, bilTimerFordelinger, bilVentetidFordelinger, bilTimerFordelingOpen, afregningOpen, afregningData)"
    - "Alle callback-props matcher container-helpers defineret i AfregningContent (beregnAfregningEligibility, toggleAfregning, updateAfregningField, godkendAfregning, genaabnAfregning)"
  selv_lint_typecheck: passed
  saerlig_opmaerksomhed_bedes_paa:
    - "beregnAfregningEligibility er callback-prop — reviewer bør verificere at signaturen matcher AfregningContent's implementation præcist (ConfirmedTruck-typen fra ../../../types)"
    - "formatTimestamp prop er teknisk ubrugt i sektionen (bruges kun i auto-godkend useEffect som bor i containeren) — overvej om den skal fjernes fra interfacet eller om den skal beholdes for API-klarhed"
    - "samleordreTabOrderNr er i props-interface men destruktureres som _samleordreTabOrderNr — reviewer bør bekræfte at dette ikke giver lint-warning på tværs af konfigurationer"
    - "Inline style til gridTemplateColumns er bevaret ORDRET fra kilde — token-violation som ikke rettes i extraction-passet"
  signatur: "Jeg står inde for at koden implementerer SPEC #14 BilTonsAfregningSection + handoff præcis som dokumenteret ovenfor"
```

**Næste skridt:** Status er `ready-for-review`. #17 container-integration (AfregningContent → tynd container) kan påbegyndes efter #13, #15, #16 er bygget.
