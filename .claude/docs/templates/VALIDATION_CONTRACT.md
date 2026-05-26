# Validation Contract — TEMPLATE

> **Brug:** Kopiér til `Docs/[App]/CONTRACT_[Sektion].md`. Interviewer drafter — du godkender — derefter er den FROZEN. Architect læser den, builder bygger mod den, reviewer + validator tjekker mod den.
> **Regel:** Builder må IKKE starte uden godkendt contract. Validator må IKKE editere — kun raise amendment-request.

---

## Identitet

- **Sektion:** `[asfaltbestilling]`
- **App:** `[formand]`
- **Manifest:** `.claude/sections/[app]/[section].md`
- **Kickoff:** `Docs/[App]/KICKOFF_[Sektion].md`
- **Status:** `[DRAFT | SIGNED-yyyy-mm-dd | FROZEN | AMENDED-yyyy-mm-dd]`
- **Godkendt af Carsten:** `[ ] Dato:`

---

## Cross-cutting blockers — HARD GATE

Builder MÅ IKKE starte hvis nogen af disse er åbne for sektionen:

- [ ] Status-vokabular låst (relevant ENUM-værdier eksisterer i `shared/types/`)
- [ ] Datoformat låst (utility i `shared/utils/dateFormat.ts` eksisterer)
- [ ] Multi-produkt-på-bil låst (hvis sektionen rører ved det)
- [ ] Auth/RLS-model låst (hvis sektionen har rolle-differentiering)

> **Hvis ÅBEN:** Contract status = `BLOCKED`. Marker hvilke kriterier der venter.

---

## 1. Accept-kriterier (BDD-format)

> Hvert kriterium har unique ID `[SECTION-PREFIX]-NNN` der bruges i:
> - Builder's handoff (`accept_pass`, `accept_skip`)
> - Reviewer's issue-rapport
> - Validator's Playwright-test-navn (`asf-001-send-til-fabrik.spec.ts`)
> - User-stories på Monday (1:1 mapping)
>
> Hvert kriterium klassificeres som:
> - **TESTBAR** (Playwright kan checke automatisk)
> - **VISUEL** (kræver screenshot-diff mod prototype-baseline)
> - **HUMAN** (kræver dig at verificere — fx forretningsregler)

### ASF-001 — [Navn]

```
TYPE:         testbar
ROLLE:        formand
OFFLINE:      blokeret  (eller: tilladt-write-queue / read-only-cached)
COMPONENT:    AsfaltbestillingSection

GIVEN:        minimum én ikke-sendt produkt-bestilling for valgt dag
WHEN:         bruger klikker "Send til fabrik" CTA
THEN:         bekræftelses-modal vises med kommentar-felt
AND:          alle ikke-sendte produkter får status "sendt" efter bekræftelse
AND:          status-pill skifter fra "afventer" til "sendt"
AND:          kommentar gemmes på dagens bestilling (sentKommentarer[dato])
```

### ASF-002 — [Navn]

```
TYPE:         visuel
ROLLE:        formand
OFFLINE:      n/a
COMPONENT:    ProductBoxV2

GIVEN:        produkt-boks med isFocused=true
THEN:         border = dark-teal med ring (matcher prototype L2670)
AND:          screenshot-diff mod baseline < 0.5%
```

### ASF-003 — [Navn] (BLOCKED EKSEMPEL)

```
TYPE:         testbar
STATUS:       BLOCKED — afventer cross-cutting datoformat-beslutning
GIVEN:        ...
```

---

## 2. Out-of-scope

> Eksplicit IKKE en del af denne sektion. Builder må ikke "fixe" disse selvom det frister.

- `[fx Afregning af sendte bestillinger — hører til afregning-sektion]`
- `[fx Returlæs-håndtering — separat flow]`
- `[fx Vognmand-side af disponering — kun cross-app effekter, ikke selve UI]`

---

## 3. Visual baseline

> Validator sammenligner produktion mod prototype-screenshots. Diff-threshold per komponent.

| Komponent | Baseline-screenshot | Threshold | States dækket |
|---|---|---|---|
| `ProductBoxV2` | `.claude/screenshots/[section]/productbox-default.png` | 0.5% | default, focused, sent, cancelled, selecting-reason, with-tags, weather-active |
| `EkstraBestillingBox` | `...` | 0.5% | default, focused, sent |
| `StatusPill` | `...` | 0.5% | sendt, afventer, aflyst |
| `DatePillsRow` | `...` | 1.0% | normal, selected, all-sent |
| `SendTilFabrikCTA` | `...` | 1.0% | enabled, disabled, with-comments-tooltip |
| `AsfaltbestillingSection` (full) | `...` | 2.0% | full-render integration |

> **Baseline genereres** ved første run via `npm run [app]:e2e -- --update-snapshots` mod prototype-route (`?prototype=1`).

---

## 4. API-contracts (per komponent)

> Eksakt Props + callbacks pr. komponent. Builder må IKKE udvide uden contract-amendment.

### `ProductBoxV2`

```typescript
export interface ProductBoxV2Props {
  product: MockProduct
  day: DayPlan
  isFocused: boolean
  isSelectingReason: boolean
  isSent: boolean
  onFocus: () => void
  onUpdateTons: (v: number) => void
  onUpdateMorgenTons: (v: number | undefined) => void
  onCancel: () => void
  onAbortCancel: () => void
  onConfirmCancel: (r: CancelReason) => void
  onRestore: () => void
  ordreTagLabels?: string[]
  samlesPaaEnBil?: boolean
  onSamlesPaaEnBilChange?: (v: boolean) => void
}
```

### `useAsfaltbestilling`

```typescript
export function useAsfaltbestilling(ordreId: string): {
  products: MockProduct[]
  planDays: string[]
  selectedPlanDate: string
  setSelectedPlanDate: (d: string) => void
  activeProductId: string | null
  setActiveProductId: (id: string | null) => void
  sentDayIds: Set<string>
  cancellingDayId: string | null
  productSamlesFlags: Record<string, boolean>

  updateTons: (productId: string, dayId: string, v: number) => void
  updateMorgenTons: (productId: string, dayId: string, v: number | undefined) => void
  cancelDay: (productId: string, dayId: string, reason: CancelReason) => void
  restoreDay: (dayId: string) => void
  sendToFabrik: (dayIds: string[], kommentar?: string) => Promise<void>
  setProductSamles: (productId: string, dayId: string, v: boolean) => void

  loading: boolean
  error: Error | null
}
```

---

## 5. Offline-opførsel

> Per `project_offline_strategi`: Formand + Chauffør SKAL arbejde offline.

| Operation | Online | Offline | Sync-strategi |
|---|---|---|---|
| Læs produkter | Supabase | Cached | useOnlineStatus banner |
| Update tons | Supabase write | Write-queue + optimistic UI | Auto-sync ved reconnect |
| Send til fabrik | Supabase + push | Write-queue, badge "afsendes senere" | Auto-sync ved reconnect |
| Aflys dag | Supabase | Write-queue | Auto-sync, conflict-resolution = last-write-wins (dokumentér) |

---

## 6. Rolle-adgang

| Rolle | Read | Write | Notes |
|---|---|---|---|
| Formand | ✅ | ✅ | ejer sektionen |
| Vognmand | ❌ (kan ikke se UI) | ❌ | ser kun resulterende disponerings-opgaver |
| Chauffør | ❌ | ❌ | |
| Fabrik | ❌ (kan ikke se UI) | ❌ | ser kun ordre-kø |
| Kunde | ❌ | ❌ | |

**RLS-tjek:** Validator skal verificere at non-formand-roller får 403/redirect ved direkte URL-adgang.

---

## 7. Test-matrix

> Sammenkobling mellem accept-ID, test-type og test-fil.

| Accept-ID | Type | Test-fil |
|---|---|---|
| ASF-001 | testbar | `apps/formand/e2e/asfaltbestilling.spec.ts → "ASF-001 send til fabrik"` |
| ASF-002 | visuel | `apps/formand/src/components/ui/ProductBoxV2.stories.tsx → Focused.toHaveScreenshot()` |
| ASF-003 | testbar | BLOCKED |
| ... | | |

---

## 8. Contract-amendments log

> Hver gang contract ændres efter sign-off, log her.

| Dato | Amendment | Årsag | Re-signed |
|---|---|---|---|
| `[yyyy-mm-dd]` | `[fx Tilføjet ASF-014 efter validator opdagede X]` | `[...]` | `[ ]` |
