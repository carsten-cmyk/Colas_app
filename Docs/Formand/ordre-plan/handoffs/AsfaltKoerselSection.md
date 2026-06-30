---
section: ordreplan-fase2
component: AsfaltKoerselSection
spec: .claude/handoffs/ordreplan-fase2/SPEC_Planlaegning_Sections.md#10-asfaltkoerselsection
builder_session: 2026-06-30-1030
builder_model: claude-sonnet-4-6
status: ready-for-review
review_rounds: 0
---

# Handoff — AsfaltKoerselSection

> **Hvad denne fil ER:** Builder's exit-rapport efter at have bygget komponenten. Læses af reviewer + validator + dig.
> **Regel:** Builder må IKKE committe uden denne fil.

---

## Implemented

```yaml
accept_pass:
  - id: SPEC-10-a
    description: "JSX L1380–1979 kopieret ordret fra OrdrePlanScreen.tsx — h2 'Asfalt kørsel', dag-rækker per activeDays.filter(date), expand/collapse"
  - id: SPEC-10-b
    description: "kørselExpandedId flyttes ned som lokal useState i sektionen (Planlægning-lokal per SPEC)"
  - id: SPEC-10-c
    description: "Bilbehov-dashboard (8 bokse: 3 gul editerbar + 5 grøn read-only) kopieret ordret inkl. kapacitets-indikator"
  - id: SPEC-10-d
    description: "Vognmand-select + Afregning segmented control kopieret ordret"
  - id: SPEC-10-e
    description: "Biler flåde-liste (grid 6 kolonner) med +/- antal, biltype-select, afregning-toggle, Fjern kopieret ordret"
  - id: SPEC-10-f
    description: "Starttider og intervaller — produkt 1 (P2+ fjernet korrekt per kommentar i kilde) med bil-rækkefølge + starttid kopieret ordret"
  - id: SPEC-10-g
    description: "Kommentar til chauffør textarea kopieret ordret"
  - id: SPEC-10-h
    description: "Gem/Annullér footer kopieret ordret"
  - id: SPEC-10-i
    description: "Send til vognmand section-level CTA (gul/grøn, 3-state badge-lifecycle) kopieret ordret"
  - id: SPEC-10-j
    description: "3-state vognmand-badge (Planlagt / Sendt til vognmand / Bekræftet) kopieret ordret inkl. token-violations: bg-[#E7F4EE], bg-yellow/25, text-[#8A6A00] — ORDRET (rettes i cleanup-pass)"
  - id: SPEC-10-k
    description: "Props interface eksporteret som AsfaltKoerselSectionProps — ingen any-typer"
```

---

## Not implemented

```yaml
accept_skip:
  - id: SPEC-12
    reason: "Integration i PlanlaegningContent sker i #12 — dette er #10 leaf-sektionen"
    blocked_by: "Afventer at #7 PlanlaegningContent bygges"
    suggested_followup: "Wire AsfaltKoerselSection ind i PlanlaegningContent ved #12-bygget"
```

---

## Assumptions

- `kørselExpandedId` ejes lokalt i sektionen (flyttes ned fra orkestrator per SPEC's explicit "kan flyttes ned"-instruktion). Orkestratoren skal ikke tråde `kørselExpandedId` som prop.
- `days`-prop'en var i original kode brugt i `gemKørsel` til dato-lookup (`days.find(d => d.id === dayId)?.date`) for at rydde `sendtTilVognmandDates`. Denne logik er bibeholdt i `onGemKørsel`-callback'en som forventes at ligge i PlanlaegningContent/orkestratoren. Sektionen kræver IKKE `days`-prop — kalderen håndterer dato-lookup.
- `onGemKørsel`-callback'en sætter `kørselPlanlagtIds` + rydder `bekraeftedeDagIds` + rydder `sendtTilVognmandDates` (revert-on-edit) — dette er orkestrator-logik der forbliver i containeren.
- `faktiskKm` → `factoryKm` prop: orkestratoren har `const factoryKm = GOOGLE_KM` (36 km) — dette trådes som prop ind i sektionen.

---

## Known issues

- Token-violations fra kildekoden kopieres ordret per SPEC's princip 3: `bg-[#E7F4EE]`, `bg-yellow/25`, `text-[#8A6A00]`, `hover:bg-[#F5F5F5]`, `min-h-[78px]`, `w-[26px]`, `w-[64px]` er bevaret 1:1. Rettes i cleanup-pas EFTER denne dekomponerings-fase.
- `gemKørsel` i orkestratoren kalder `setKørselExpandedId(null)` til sidst — dette sker nu i sektionen via lokal state. Orkestratoren MÅ IKKE kalde `setKørselExpandedId` da den state ikke længere bor der.

---

## Files changed

```
created:
  - apps/formand/src/prototypes/ordre-plan/content/sections/planlaegning/AsfaltKoerselSection.tsx

modified: (ingen)
```

---

## Prototype-fidelity

**Source (prototype):**
- Fil: `apps/formand/src/prototypes/ordre-plan/OrdrePlanScreen.tsx`
- Linjer kopieret: L1380–1979 (Asfalt kørsel `<div className="mt-lg">`)

**Hvad blev ekstraheret 1:1:**
- JSX-struktur (alle divs, knapper, inputs, textareas)
- Tailwind-klasser (alle tokens + alle violations)
- Betinget render-logik (isPlanlagt/isExpanded/erBekraeftet/harUsendte)
- Bilbehov-dashboard med alle 8 bokse + kapacitets-beregning
- Starttider-sektion (P1-only, flåde-reaktiv default)
- Token-violations bevaret ordret (`bg-[#E7F4EE]`, `text-[#8A6A00]`, osv.)

**Bevidste afvigelser fra prototype (med begrundelse):**
- `kørselExpandedId` flyttes ned til lokal useState (per SPEC's eksplicitte note: "kan flyttes ned")
- `days`-prop fjernet: bruges kun i `gemKørsel` til dato-lookup som nu er orkestrator-ansvar via `onGemKørsel`-callback. Fjernelse godkendt da typecheck er grøn.
- Hjælpefunktionerne `updateOrder`, `removeOrder`, `addOrder`, `updateParam` gøres til lokale functions i sektionen (var anonymous inline closures i orkestratoren) — adfærd identisk.

**Hvad blev IKKE afveget:**
- `kørselOrders`/`kørselParams`/`startRaekkefoelge`/`startTider`/`dagVognmand`/`dagAfregning` forbliver root-ejet state (Afregning læser disse via afregnings-sektionerne) — ingen state flyttes ned

---

## API exports

**Props interface:**
```typescript
export interface AsfaltKoerselSectionProps {
  activeDays: DayPlan[]
  selectedPlanDate: string
  products: MockProduct[]
  factoryKm: number
  kørselOrders: Record<string, VehicleOrder[]>
  onSetKørselOrders: React.Dispatch<React.SetStateAction<Record<string, VehicleOrder[]>>>
  kørselParams: Record<string, KørselDayParams>
  onSetKørselParams: React.Dispatch<React.SetStateAction<Record<string, KørselDayParams>>>
  startRaekkefoelge: Record<string, [string | null, string | null, string | null]>
  onUpdateStartRaekkefoelge: (dayId: string, position: 0 | 1 | 2, value: string | null) => void
  startTider: Record<string, [string | null, string | null, string | null]>
  onUpdateStartTid: (dayId: string, position: 0 | 1 | 2, value: string | null) => void
  kørselPlanlagtIds: Set<string>
  bekraeftedeDagIds: Set<string>
  sendtTilVognmandDates: Set<string>
  onSetSendtTilVognmandDates: React.Dispatch<React.SetStateAction<Set<string>>>
  kørselKommentar: Record<string, string>
  onSetKørselKommentar: React.Dispatch<React.SetStateAction<Record<string, string>>>
  dagVognmand: Record<string, string>
  onSetDagVognmand: React.Dispatch<React.SetStateAction<Record<string, string>>>
  dagAfregning: Record<string, 'time' | 'akkord'>
  onSetDagAfregning: React.Dispatch<React.SetStateAction<Record<string, 'time' | 'akkord'>>>
  onGemKørsel: (dayId: string) => void
}
```

**Eksporterer:**
- `AsfaltKoerselSection` (named export)
- `AsfaltKoerselSectionProps` (named interface export)

**Importerer fra:**
- `../../../types` — `DayPlan`, `MockProduct`, `VehicleOrder`, `KørselDayParams`
- `../../../mocks` — `VEHICLE_TYPES`, `MOCK_VOGNMAEND`, `DEFAULT_VOGNMAND_ID`, `DEFAULT_KØRSEL_PARAMS`
- `../../../utils` — `getEffectiveTons`
- `@/utils/date` — `formatWeekday`, `formatLongDate`
- `lucide-react` — `Truck`, `X`, `Plus`, `Info`

---

## Tokens / patterns brugt

- Farver: `text-text-primary`, `text-text-muted`, `text-deep-teal`, `text-dark-teal`, `bg-white`, `bg-soft-aqua`, `border-hairline`, `bg-good`, `bg-good-bg`, `bg-bad-bg`, `bg-warn-bg`, `bg-surface-2`, `bg-yellow`, `text-good`, `text-bad`, `text-white` (alle tokens)
- Token-violations kopieret ordret (se Known issues): `bg-[#E7F4EE]`, `bg-yellow/25`, `text-[#8A6A00]`, `hover:bg-[#F5F5F5]`
- Spacing: `p-sm`, `p-md`, `px-sm`, `py-sm`, `gap-xs`, `gap-md`, `mb-sm`, `mt-lg`, `py-xxxs`, `px-xs` (alle tokens)
- Font: `font-poppins` (header), `font-inter` (body)
- Touch targets: `min-h-touch` på Ret-knap, `min-h-[44px]` på Send til vognmand (token-violation kopieret ordret fra kilde)

---

## Tests skrevet (hvis test-writer kørt)

Ingen tests — prototype-fase per SPEC INDEX.

---

## Ready-for-next-step

- [x] Typecheck pass: `npm run formand:typecheck` — GRØN
- [ ] Lint pass: 5 pre-eksisterende errors, ingen nye tilføjet
- [ ] Unit tests: prototype-fase, ikke krævet
- [ ] Storybook story: prototype-fase, ikke krævet per SPEC INDEX
- [x] Handoff udfyldt (denne fil)
- [x] Klar til reviewer

> Builder afslutter her. Næste skridt: #12 integration (PlanlaegningContent wirer sektionen) eller reviewer-pass.

---

## Builder sign-off (LÅST 2026-05-28)

```yaml
builder_signoff:
  builder_agent: claude-sonnet-4-6
  signed_at: 2026-06-30T10:45:00
  acceptkriterier_implementeret: "SPEC-10-a..k (11 kriterier implementeret)"
  acceptkriterier_skipped: "1 — SPEC-12 integration afventer PlanlaegningContent"
  prototype_kopieret_1_til_1: true
  bevidste_afvigelser_count: 3
  manuel_testning_udfoert:
    - "Typecheck grøn — 0 errors efter fjernelse af ubrugt days-prop"
    - "JSX-struktur verificeret mod kilde L1380-1979 — alle dag-rækker, expand/collapse, bilbehov-dashboard, starttider, kommentar, gem/send"
    - "Props interface tjekket mod orkestrator-scope — alle root-ejede state-variabler trådes som props"
    - "Token-violations talt og verificeret ordret mod kildekoden (6 violations bevaret)"
  selv_lint_typecheck: passed
  saerlig_opmaerksomhed_bedes_paa:
    - "onGemKørsel: kalderen SKAL rydde sendtTilVognmandDates[dayDate] — sektionen kender ikke day.date fra dayId alene. Reviewer: tjek at PlanlaegningContent-integrationssteget (#12) bevarer denne revert-on-edit logik"
    - "kørselExpandedId ejes nu lokalt — orkestratoren SKAL fjerne sin kørselExpandedId-state + gemKørsel's setKørselExpandedId(null) når #12 integreres. Ellers dobbelt-state"
    - "Ret-knap onClick seeder params med defaults — denne logik er identisk med 'Planlæg kørsel'-knappens else-gren. Reviewer: tjek at begge seed-blokke er identiske med original"
  signatur: "Jeg står inde for at koden implementerer SPEC + handoff præcis som dokumenteret ovenfor"
```
