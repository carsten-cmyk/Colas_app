# Definition of Done — Colas Transport Apps

> **Hvad**: Klart definerede kriterier for hvornår noget er "færdigt" på forskellige niveauer.
> **Hvorfor**: Forhindrer scope-creep + sikrer kvalitet uanset hvem (menneske eller AI) der bygger.
> **Status**: LÅST 2026-05-29.

---

## 1. Definition of Done — KOMPONENT

En komponent (presenter eller container) er **DONE** når:

### Kode-kvalitet
- [ ] TypeScript: `npm run [app]:typecheck` — 0 fejl
- [ ] Lint: `npm run [app]:lint` — 0 warnings, 0 errors
- [ ] Tests: `npm run [app]:test` — alle grønne, coverage ≥ 80% lines/functions / 70% branches
- [ ] Ingen `any`-typer (ud over dokumenterede undtagelser)
- [ ] Ingen hardcodede farver, spacing, font-sizes — kun tokens
- [ ] Props-interface eksporteret: `[ComponentName]Props`
- [ ] JSDoc på ikke-oplagte props

### Funktionalitet
- [ ] Alle accept-kriterier fra SPEC er opfyldt (eller markeret `accept_skip` i handoff med begrundelse)
- [ ] Loading state implementeret (hvis relevant)
- [ ] Error state implementeret (hvis relevant)
- [ ] Empty state implementeret (hvis relevant)
- [ ] Touch targets ≥ 44×44px på interaktive elementer

### Storybook
- [ ] Story-fil eksisterer: `[ComponentName].stories.tsx`
- [ ] Stories dækker: default, alle prop-varianter, edge cases (tom liste, lang tekst, loading, error)
- [ ] Storybook starter uden errors

### Tilgængelighed
- [ ] ARIA-labels på ikoner med funktion
- [ ] `role="alert"` på fejl/status-beskeder
- [ ] Keyboard-navigation virker (Tab, Enter, Space, Esc hvor relevant)
- [ ] Fokus-indikator synlig (ikke `outline: none` uden alternativ)

### Dokumentation
- [ ] Handoff-fil udfyldt med builder-signoff: `Docs/[App]/[sektion]/handoffs/[ComponentName].md`
- [ ] Prototype-fidelity dokumenteret (hvad blev kopieret 1:1, hvilke bevidste afvigelser)

### Review
- [ ] Reviewer-signoff: `GODKENDT` i sidste `REVIEW_REPORT_*.md`
- [ ] 0 åbne CRITICAL-issues (DISPUTED-ACCEPTED tæller som lukket)
- [ ] Section-manifest opdateret med builder-/reviewer-signoff-dato + rounds-count

---

## 2. Definition of Done — SEKTION

En sektion (fx Asfaltbestilling) er **DONE** når:

### Forberedelse (Interview-fase)
- [ ] KICKOFF.md signed
- [ ] CONTRACT.md signed FROZEN
- [ ] FLOWS.md komplet
- [ ] CUSTOMER_SPEC.md godkendt af kunde (sign-off-blok udfyldt)
- [ ] QA.md med alle kunde-spørgsmål besvarede
- [ ] Section-manifest færdig med komponent-scope

### Build-fase
- [ ] Alle komponenter i komponent-scope er DONE (jf. punkt 1)
- [ ] Alle hooks i komponent-scope er DONE
- [ ] Sektion-containeren binder alt sammen
- [ ] Integration-tests (e2e) for sektionens kerne-flows er grønne
- [ ] Mock-data komplet — alle inline-mocks i `src/mocks/`
- [ ] Cross-app effekter (ABE-* fra CONTRACT) er testet

### Cleanup-fase (C5)
- [ ] `/cleanup-section [sektion] [app]` udført
- [ ] `CLEANUP_REPORT.md` produceret og godkendt af Carsten
- [ ] Folder-cleanup: ingen orphan-filer i sektion-mappen
- [ ] Cross-app-tjek: alle 🌍-kandidater flagget i COMPONENT_REGISTRY
- [ ] Inline-mocks tjekket mod Supabase-status

### Production-readiness
- [ ] Deploy til preview-environment grøn
- [ ] Performance-budget overholdt (når perf-spec er låst — senere fase)
- [ ] Accessibility-audit udført (når a11y-spec er låst — senere fase)
- [ ] Security-review udført (kommer når data er live)

### Sign-off
- [ ] Tech-lead (Carsten) signed
- [ ] Kunde signed (på `CUSTOMER_SPEC.md`-blok)
- [ ] Section-manifest sat til `current_phase: live`
- [ ] Git-tag oprettet: `[sektion-slug]-v1.0`

### Lessons learned
- [ ] `LESSONS_LEARNED.md` udfyldt (bund af CONTRACT eller separat fil)
- [ ] Gentagne huller flagget til `_template.md` eller `PATTERNS.md`

---

## 3. Definition of Done — PULL REQUEST

En PR er **DONE** (= klar til merge) når:

- [ ] CI grøn (lint + typecheck + test + build + commitlint)
- [ ] PR-template udfyldt komplet
- [ ] Link til SPEC + CONTRACT i body
- [ ] 1 reviewer har godkendt (Carsten eller agency-lead)
- [ ] Alle PR-kommentarer er løst (conversations resolved)
- [ ] Branch er opdateret mod main (no merge conflicts)
- [ ] Hvis komponent: handoff-fil committet med signoff
- [ ] Hvis sektion-completion: alle "Sektion Done"-kriterier opfyldt

---

## 4. Definition of Done — RELEASE (produktion-deploy)

En release er **DONE** når:

- [ ] Alle sektioner i releasen er `current_phase: live`
- [ ] End-to-end-tests grønne i preview-environment
- [ ] Deploy til Netlify gennemført uden errors
- [ ] Smoke-tests udført mod live-URL
- [ ] Kunde notificeret om go-live
- [ ] Git-tag oprettet: `release-v[major.minor.patch]`
- [ ] Changelog opdateret

---

## 5. Hvornår noget IKKE er Done

Disse er typiske red flags der betyder "ikke færdig":

- 🛑 "Det virker på min maskine" — uden tests = ikke done
- 🛑 "Vi fixer det senere" — uden issue + reference = ikke done
- 🛑 "Det er bare en prototype" — gælder ikke for produktion-PRs
- 🛑 Inline mock-data i komponenter — flyt til `src/mocks/`
- 🛑 `// TODO` uden ejer eller deadline — uacceptabelt i produktion
- 🛑 Hardcodede tokens — også selvom det "ser ok ud"
- 🛑 Manglende loading/error states — selvom det er sjældent
- 🛑 PR uden CONTRACT-reference — vi ved ikke hvad der skal verificeres

---

## 6. Eskalering

Hvis du som bidragsyder er i tvivl om noget er "done":

1. Tjek dette dokument igen — er du sikker på alle bullets er opfyldt?
2. Kør reviewer-agent (`/review [fil]`) for systematisk tjek
3. Spørg på Slack #colas-dev
4. Når i tvivl: marker IKKE som done — det er bedre at vente end at lukke noget brækket ind

---

*Sidste opdatering: 2026-05-29 — F6 implementering*
