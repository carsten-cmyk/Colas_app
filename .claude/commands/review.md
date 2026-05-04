Kør et professionelt code review af følgende fil: $ARGUMENTS

Følg REVIEW_SPEC præcist — læs den fra `Docs/formand/REVIEW_SPEC.md` (eller det relevante app's REVIEW_SPEC).

## Fremgangsmåde

1. Læs filen der skal reviewes
2. Læs den relevante REVIEW_SPEC
3. Gennemgå ALLE 9 checkliste-punkter systematisk:
   - TYPES — props interface, JSDoc, ingen `any`
   - TOKENS — ingen hardcodede farver/spacing, kun Tailwind tokens
   - REACT/WEB PATTERNS — semantisk HTML, key props, konstanter udenfor render
   - TILGÆNGELIGHED — WCAG 2.1 AA, aria-label, fokus-ring, 4.5:1 kontrast
   - TOUCH/TABLET — 44×44px touch targets
   - PROPS & ROBUSTHED — optional props, array guards, loading/error states
   - STATE & HOOKS — useEffect dependencies, mock TODO-kommentarer, logik i hooks
   - RESPONSIVE — 768px og 1280px breakpoints
   - STORYBOOK — story med alle varianter og edge cases

## Output-format

For hvert issue:

```
[PRIORITET] filsti:linjenummer
Problem: Hvad er forkert
Fix: Konkret kodeeksempel der løser det
```

Prioriteter: CRITICAL | RECOMMENDED | NICE-TO-HAVE

Afslut med:
- Samlet vurdering (klar til merge / kræver rettelser / større refaktor nødvendig)
- Antal issues per prioritet
- Gem issues i `.claude/docs/REVIEW_ISSUES.md` med dato og komponentnavn
