---
section: [section-slug]                # fx asfaltbestilling
component: [ComponentName]             # fx ProductBoxV2
handoff_ref: Docs/[App]/[sektion-slug]/handoffs/[ComponentName].md
spec_ref: Docs/[App]/[sektion-slug]/SPEC_[Name].md
review_session: [yyyy-mm-dd-hhmm]
reviewer_model: [fx claude-sonnet-4-6]
round: [1, 2, 3]
status: [in-review | needs-fix | godkendt | escalated-to-carsten]
---

> **Filplacering:** `Docs/[App]/[sektion-slug]/handoffs/REVIEW_REPORT_[ComponentName]_R[N].md`
> **N** = round-nummer. Hver loop-iteration får sin egen review-rapport. Hard-gate ved round 3 → eskalering.

---

# Review Report — [ComponentName] · Round [N]

> **Læst:** SPEC + handoff + komponent-kode + stories + tests
> **Reviewet mod:** REVIEW_SPEC + SPEC's accept-kriterier + handoff's claimed implementation

---

## Issues fundet

> Hver issue har stabilt ID (`I-001`, `I-002`, …) — bevares på tværs af rounds for sporbarhed.

### 🔴 CRITICAL (skal lukkes inden GODKENDT)

```yaml
issues_critical:
  - id: I-001
    titel: "[fx: ARIA-label mangler på reason-picker (a11y)]"
    severity: critical
    spec_ref: "[fx CONTRACT.md ASF-012 — accessibility-krav]"
    file: "apps/formand/src/components/ui/ProductBoxV2.tsx"
    line: "[fx L142]"
    description: "[Detalje + hvorfor det er kritisk]"
    suggested_fix: "[Konkret forslag]"
    status: open
```

### 🟡 RECOMMENDED (bør lukkes, men ikke blocker)

```yaml
issues_recommended:
  - id: I-101
    titel: "[fx: useMemo på tunge derived states for at undgå re-render]"
    severity: recommended
    spec_ref: "[fx CONTRACT.md performance-budget]"
    file: "..."
    line: "..."
    description: "..."
    suggested_fix: "..."
    status: open
```

### 🟢 NICE-TO-HAVE (refinement, optional)

```yaml
issues_nice_to_have:
  - id: I-201
    titel: "[fx: JSDoc på ikke-oplagte props]"
    severity: nice-to-have
    file: "..."
    line: "..."
    description: "..."
    status: open
```

---

## Issues lukket siden sidste round (round 2+)

> Builder rapporterer i sin opdaterede handoff hvilke issues der er fixet. Reviewer verificerer her.

```yaml
issues_resolved:
  - id: I-001
    fixed_by: "[builder-agent navn + tidsstempel]"
    verified: true|false
    note: "[fx: ARIA-label nu sat korrekt, testet med skærmlæser]"
issues_disputed_accepted:
  - id: I-002
    builder_argument: "[fx: 'Den eksisterende prototype-adfærd er bevidst — ikke a bug']"
    reviewer_accept: true
    note: "[reviewer accepterer disputten]"
issues_needs_rework:
  - id: I-003
    reason: "[fx: 'Fix går ud over scope — der er stadig en kant-case der ikke håndteres']"
    blocked_by: "[fx 'Mangler decision på CONTRACT amendment B-12']"
```

---

## Cross-cutting tjek

> Standard-tjekliste der gælder alle komponenter.

| Kriterie | Status | Note |
|---|---|---|
| Token-overholdelse (ingen hex/raw px) | ✅ / ❌ | |
| Props-interface eksporteret | ✅ / ❌ | |
| Ingen `any` types | ✅ / ❌ | |
| Loading + error states | ✅ / ❌ / N/A | |
| Touch targets ≥ 44×44 | ✅ / ❌ | |
| Container/Presenter-mønstret overholdt | ✅ / ❌ | |
| Mock-data i `src/mocks/` (ikke inline) | ✅ / ❌ / N/A | |
| Types i `src/types/` (ikke inline) | ✅ / ❌ / N/A | |
| Storybook story dækker alle states | ✅ / ❌ | |
| Prototype-fidelity dokumenteret | ✅ / ❌ | |
| JSDoc på ikke-oplagte props | ✅ / ❌ | |

---

## 🖋️ Reviewer sign-off

```yaml
reviewer_signoff:
  reviewer_agent: [fx claude-sonnet-4-6]
  signed_at: [yyyy-mm-dd HH:MM]
  round: [N]

  samlet_status: |
    [En af:]
    GODKENDT — alle CRITICAL er RESOLVED eller DISPUTED-ACCEPTED
    NEEDS-FIX — der er åbne CRITICAL eller RECOMMENDED issues
    ESCALATED — round 3 nået, kræver Carsten-indgriben

  critical_count_open: 0
  recommended_count_open: 0
  nice_to_have_count_open: 0

  noeglepunkter:
    - "[fx: Komponenten matcher SPEC præcist på alle 18 ASF-kriterier]"
    - "[fx: Token-overholdelse perfekt]"
    - "[fx: A11y-issue I-001 skal fixes inden next round]"

  next_action: |
    [En af:]
    Auto-dispatch builder med fix-liste (issues I-001, I-002, …) for Round [N+1]
    Klar til test-writer (status: GODKENDT, ingen åbne CRITICAL)
    Pause workflow — eskaler til Carsten (round 3 grænse nået)

  signatur: "Jeg har reviewet komponenten mod SPEC + handoff og står inde for ovenstående vurdering"
```

---

## Loop-tracking

> Opdateres i section-manifestets "Review-loop tracker"-tabel.

| Round | Builder leverede | Reviewer fandt | Status |
|---|---|---|---|
| 1 | First implementation | I-001, I-002, I-003 | NEEDS-FIX |
| 2 | Fixed: I-001, I-002. Disputed: I-003 | I-003 DISPUTED-ACCEPTED | GODKENDT |
| 3 | — | — | — |

---

## Anbefalede follow-ups (out of scope for denne round)

> Issues der er valide men ligger uden for komponentens scope — flyttes til andre sektioner eller noter.

- "[fx: Performance-budget mangler i CONTRACT — bør addresseres i amendment v1.1]"
- "[fx: Cross-app contract for vognmand-modtagelse skal valideres i e2e-test, ikke unit]"
