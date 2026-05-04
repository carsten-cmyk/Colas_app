# Colas — Udviklingsworkflow

Alt hvad du skal skrive og køre. Reference for hver situation.

---

## Efter /clear — session start

Paste dette i alle sessioner:

```
Læs disse filer før du gør noget:
1. .claude/docs/PROJECT_STATUS.md
2. Docs/Formand/CONTEXT.md
3. .claude/docs/core/DESIGN_SYSTEM.md
4. .claude/docs/OFFLINE_STRATEGY.md

Bekræft at du har læst dem, og fortæl hvad der er næste prioritet.
```

**Tilføj hvis du arbejder på Formand/web:**
```
Læs også: Docs/Formand/PRD.md og Docs/Formand/REVIEW_SPEC.md
```

**Tilføj hvis du arbejder på Chauffør/app:**
```
Læs også: Docs/Chauffør/PRD.md og Docs/Chauffør/REVIEW_SPEC_1.md og Docs/Chauffør/STRUCTURE.md
```

---

## Prototype-arbejde

Brug når du eksperimenterer med UX, flows eller nye features.
**Ingen regler om tokens, tests eller hooks her — det er bevidst.**

```
Vi arbejder i prototype-mode på [beskrivelse].
Filen skal ligge i src/prototypes/[mappe]/[Navn]Screen.tsx
Ingen tests, ingen hooks, ingen import fra src/components/.
Fokus er UX og flow — ikke kode-kvalitet.
```

Eksempel:
```
Vi arbejder i prototype-mode på transportberegner-flow.
Filen skal ligge i src/prototypes/transportberegner/TransportberegnerScreen.tsx
```

---

## Produktionskode — ny komponent

**Trin 1: Spec**
Giv Claude spec-filen (paste indholdet eller henvis til filen):
```
Implementér denne spec præcist — ingen tilføjelser:
[paste indhold fra Docs/Formand/[Komponent]_SPEC.md]
```

**Trin 2: Review** — kør med det samme efter build:
```
/review apps/formand/src/components/ui/[KomponentNavn].tsx
```
eller for app:
```
/review apps/chauffeur/src/components/ui/[KomponentNavn].tsx
```

**Trin 3: Cleanup** — hvis review finder issues:
```
/cleanup apps/formand/src/components/ui/[KomponentNavn].tsx
```

**Trin 4: Test:**
```
/test apps/formand/src/components/ui/[KomponentNavn].tsx
```

**Trin 5: Kør i terminal:**
```bash
# Web (formand)
npm run formand:test
npm run formand:lint
npm run formand:typecheck

# App (chauffeur) — ingen vitest, men typecheck:
cd apps/chauffeur && npx tsc --noEmit
```

---

## Produktionskode — ny side/screen

```
/new-page [SideNavn] formand /[route]
```
eller:
```
/new-page [SideNavn] chauffeur
```

Derefter samme flow: `/review` → `/cleanup` → `/test` → kør scripts.

---

## Prototype → produktion (upgrade)

Når en prototype er godkendt og skal blive rigtig kode:

```
/upgrade-prototype apps/formand/src/prototypes/[mappe]/[Navn]Screen.tsx
```

Følg de trin Claude foreslår. Slet **aldrig** prototypen selv — lad `/upgrade-prototype` styre det.

---

## Token-audit — find hardcodede værdier

Kør periodisk (fx inden en større commit):
```
/audit-tokens apps/formand/src/components
```
eller:
```
/audit-tokens apps/chauffeur/src/components
```

---

## Status-tjek

```
/status
```

---

## Afslut session

```
Opdater .claude/docs/PROJECT_STATUS.md med hvad vi har lavet i dag.
Marker færdige opgaver og sæt timestamp.
```

---

## Kommando-oversigt

| Kommando | Hvornår |
|---|---|
| `/review [fil]` | Efter hver komponent er bygget |
| `/cleanup [fil]` | Når review finder issues |
| `/test [fil]` | Efter review er godkendt |
| `/new-component [Navn] [app]` | Ny komponent fra spec |
| `/new-page [Navn] [app] [route]` | Ny side/screen |
| `/new-hook [useNavn] [app]` | Ny data-hook |
| `/upgrade-prototype [fil]` | Prototype klar til produktion |
| `/audit-tokens [mappe]` | Periodisk token-tjek |
| `/status` | Overblik over projekt |

---

## Terminal-scripts

### Web (formand — og kommende vognmand, fabrik, kunde)

```bash
npm run formand:dev          # Start dev-server (port 5174)
npm run formand:storybook    # Start Storybook (port 6007)
npm run formand:test         # Kør alle tests
npm run formand:lint         # Kør ESLint (0 warnings tilladt)
npm run formand:typecheck    # TypeScript check
```

### App (chauffeur)

```bash
npm run chauffeur:start      # Start Expo (Expo Go)
npm run chauffeur:ios        # iOS simulator
npm run chauffeur:android    # Android emulator
cd apps/chauffeur && npx tsc --noEmit   # TypeScript check
```

---

## Prototype vs. produktion — hvad må hvad

| | Prototype (`src/prototypes/`) | Produktion (`src/components/`, `src/pages/`) |
|---|---|---|
| Inline typer | OK | Nej — `src/types/` |
| Inline mock-data | OK | Nej — `src/mocks/` |
| Logik i JSX | OK | Nej — `src/hooks/` |
| Hardcodede farver | OK | Nej — tokens kun |
| Tests påkrævet | Nej | Ja |
| Stories påkrævet | Nej | Ja |
| Må importeres i produktion | Aldrig | Ja |

---

## Rækkefølge ved ny feature (komplet)

```
1. Skriv spec (Docs/[App]/[Komponent]_SPEC.md)
2. Prototype hvis UX er usikker  →  src/prototypes/
3. Godkend prototype visuelt
4. /upgrade-prototype  ELLER  /new-component direkte fra spec
5. /review
6. /cleanup (hvis nødvendigt)
7. /test
8. npm run [app]:test + lint + typecheck
9. Commit: feat(formand): add [KomponentNavn]
10. Opdater PROJECT_STATUS.md
```
