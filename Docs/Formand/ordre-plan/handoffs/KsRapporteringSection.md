---
section: ordreplan-fase2
component: KsRapporteringSection
spec: .claude/handoffs/ordreplan-fase2/SPEC_Udfoersel_Sections.md
builder_session: 2026-06-30-0900
builder_model: claude-sonnet-4-6
status: ready-for-review
review_rounds: 0
---

# Handoff — KsRapporteringSection

> **Hvad denne fil ER:** Builder's exit-rapport efter at have bygget komponenten. Læses af reviewer + validator + dig.
> **Regel:** Builder må IKKE committe uden denne fil.

---

## Implemented

```yaml
accept_pass:
  - id: KS-001
    description: "KS-rapportering sektionen ekstraheret ORDRET fra UdfoerselContent.tsx L921–1058"
  - id: KS-002
    description: "Intern state (ksExpanded, ksActiveTab) flyttes med ind i sektionskomponenten"
  - id: KS-003
    description: "Krav-gate (entreprisekontrol/temperaturmaaling union) bevaret 1:1 — skjuler hele sektionen hvis ingen krav"
  - id: KS-004
    description: "showAllTabs-logik bevaret — niveau 2 viser A3 + A4 + MKS; niveau 1 kun MKS"
  - id: KS-005
    description: "Importerer eksisterende KS-skemaer (MksSkema, OvrigeOplysningerSkema3a, OvrigeOplysningerSkema) — genbygger dem ikke"
  - id: KS-006
    description: "Eksporteret KsRapporteringProps interface med JSDoc på alle ikke-oplagte props"
  - id: KS-007
    description: "onResetEkstra-prop tilføjet for at erstatte setEkstraLinjer([]) + setEkstraSent(false) closure der ellers ikke kan trådes direkte"
```

---

## Not implemented

```yaml
accept_skip:
  - id: KS-N/A
    reason: "Prototype-fase — ingen validation contract. SPEC er extraction-spec, ikke functional-spec. Alle SPEC-krav er dækket."
```

---

## Assumptions

- `onResetEkstra`-prop erstatter inline `setEkstraLinjer([])` + `setEkstraSent(false)` fra originalen. Originalen kalder to setters der begge ejes af containeren (nu `UdfoerselContent`). Container leverer én kombineret callback ved integrerings-trin #6 — dette er den reneste extraction uden at afsløre `setEkstraLinjer`-setter.
- KS-sektionen er wrappet i `<>...</>` (Fragment) fremfor direkte `{(() => {...})()}` på øverste niveau — dette fordi komponenten returnerer JSX (ikke en container-blok). Adfærd identisk.
- `detailsExpanded`-gaten (L273 i kilden) er IKKE en del af denne komponent — den styres af containeren (UdfoerselContent). `KsRapporteringSection` vil i integrations-trin #6 renderes betinget af `detailsExpanded` fra containeren. Det er korrekt separation.

---

## Known issues

- Ingen kendte issues. `hover:border-hairline-2` klassen på collapse-knappen (L953 i kilden) er en token der muligvis ikke eksisterer i tailwind-config — den er kopieret ORDRET fra prototype (token-violations flyttes uændret, jf. SPEC-princip 3).

---

## Files changed

```
created:
  - apps/formand/src/prototypes/ordre-plan/content/sections/udfoersel/KsRapporteringSection.tsx
  - Docs/Formand/ordre-plan/handoffs/KsRapporteringSection.md (denne fil)

modified:
  - (ingen — UdfoerselContent.tsx redigeres IKKE; wiring sker i integrations-trin #6)
```

---

## Prototype-fidelity

**Source (prototype):**
- Fil: `apps/formand/src/prototypes/ordre-plan/content/UdfoerselContent.tsx`
- Linjer kopieret: L921–1058 (KS-rapportering blok inkl. IIFE og lukke-tags)

**Hvad blev ekstraheret 1:1:**
- Hele `{(() => {...})()}`-blokken med entreprisekontrol/temperaturmaaling-gate
- JSX-struktur: `<section>`, h2, collapse-knap, preview-tekst, status-pille, chevron, tab-rækken, tab-content, alle 3 KS-skema-kald
- Alle Tailwind-klasser (token-violations som `hover:border-hairline-2` bevaret uændret)
- Kommentar-blokke (inkl. TODO-kommentar om Supabase)

**Bevidste afvigelser fra prototype (med begrundelse):**
- `onReset`-callback i MksSkema `ekstraarbejde`-prop: originalen bruger `() => { setEkstraLinjer([]); setEkstraSent(false) }` — en inline closure over container-state. Sektionskomponenten kan ikke have adgang til `setEkstraLinjer`-setteren fra container, så dette foldes ind i `onResetEkstra`-prop. Funktionelt identisk når container implementerer `onResetEkstra: () => { setEkstraLinjer([]); setEkstraSent(false) }`.
- Fragment-wrapper `<>...</>` tilføjet som retur-element (originalen var en IIFE direkte i JSX — her returnerer funktionen JSX).

**Hvad blev IKKE afveget:**
- Alle Tailwind-klasser kopieret ordret inkl. evt. ikke-eksisterende `hover:border-hairline-2`
- `{detailsExpanded && ...}`-gaten er IKKE kopieret ind — den hører til containeren, ikke denne komponent

---

## API exports

**Props interface:**
```typescript
export interface KsRapporteringProps {
  products: MockProduct[]
  selectedDate: string
  ekstraLinjer: EkstraLinje[]
  addEkstraLinje: () => void
  updateEkstraLinje: (id: string, field: keyof EkstraLinje, value: string | number) => void
  removeEkstraLinje: (id: string) => void
  ekstraSent: boolean
  setEkstraSent: (b: boolean) => void
  onResetEkstra: () => void
}
```

**Eksporterer:**
- `KsRapporteringSection` (named)
- `KsRapporteringProps` (named interface)

**Forventer fra parent (via props):**
- `MockProduct` fra `../../../types`
- `EkstraLinje` fra `../../../types`

**Importerer direkte (ikke via props):**
- `OvrigeOplysningerSkema3a` fra `../../../components/ks/OvrigeOplysningerSkema3a`
- `OvrigeOplysningerSkema` fra `../../../components/ks/OvrigeOplysningerSkema`
- `MksSkema` fra `../../../components/ks/MksSkema`

---

## Tokens / patterns brugt

- Farver: `bg-surface`, `border-hairline`, `text-text-primary`, `text-text-muted`, `text-deep-teal`, `bg-bad-bg`, `text-bad`, `bg-white`, `bg-surface-2` — ingen hex
- Spacing: `px-md`, `py-sm`, `p-md`, `pt-sm`, `gap-xs`, `gap-xxxs`, `mb-sm`, `px-sm`, `py-xxxs`, `-mb-[1px]` — `-mb-[1px]` er prototype-mønster (tab-border-trick), kopieret ORDRET
- Font: `font-poppins` (h2), `font-inter` (labels, tabs) — ingen hardcoded font-family
- Touch targets: collapse-knap er `w-full` med `py-sm` — tilstrækkelig højde
- `hover:border-hairline-2`: kopieret fra prototype, token-violation flyttes uændret (SPEC-princip 3)

---

## Tests skrevet

Ingen (prototype-fase — ikke krævet per SPEC INDEX).

---

## Ready-for-next-step

- [x] Typecheck pass: `npm run formand:typecheck` — GRØN
- [x] Handoff udfyldt (denne fil)
- [ ] Lint — 5 pre-eksisterende errors i formand:lint, ikke Fase 2's ansvar
- [ ] Storybook — ikke krævet i prototype-fase
- [x] Klar til reviewer

---

## Builder sign-off (LÅST 2026-05-28)

```yaml
builder_signoff:
  builder_agent: claude-sonnet-4-6
  signed_at: "2026-06-30 09:15"
  acceptkriterier_implementeret: "7 af 7 (KS-001..007)"
  acceptkriterier_skipped: "0"
  prototype_kopieret_1_til_1: true
  bevidste_afvigelser_count: 2
  manuel_testning_udfoert:
    - "Typecheck grøn — ingen TypeScript-fejl indført"
    - "Filafgrænsning verificeret mod UdfoerselContent L921–1058 — alle linjer dækket"
    - "Import-stier verificeret — relative stier fra sections/udfoersel/ korrekte (../../../components/ks/...)"
    - "onResetEkstra-prop-signatur verificeret mod EkstraarbejdeBlokProps.onReset — typer matcher"
  selv_lint_typecheck: passed
  saerlig_opmaerksomhed_bedes_paa:
    - "onResetEkstra-prop er en enkelt afvigelse fra original-closuren — reviewer bør bekræfte at integrations-trin #6 implementerer den korrekt"
    - "detailsExpanded-gaten (L273 i UdfoerselContent) wrapper BÅDE BekraeftedeBilerSection, ForundersoegelseSection og KsRapporteringSection i kilden — reviewer bør bekræfte at integrations-trin #6 placerer KsRapporteringSection korrekt inden for gaten"
  signatur: "Jeg står inde for at koden implementerer SPEC + handoff præcis som dokumenteret ovenfor"
```

**Næste skridt:** Status `ready-for-review`. Integrations-trin #6 (UdfoerselContent → tynd container) wirer sektionen ind med korrekt prop-tråding.
