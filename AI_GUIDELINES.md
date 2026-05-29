# AI Guidelines — Colas Transport Apps

> **Hvad**: Standarder for hvordan AI-værktøjer (Claude, Copilot, Cursor etc.) bruges i dette projekt.
> **Hvorfor**: Sikre ensartet kode-kvalitet og stil uanset om koden er skrevet af menneske eller AI.
> **Status**: LÅST 2026-05-29 — afventer kun løbende refinement.

---

## 1. Generel projekt-stil

### React (Web)
- **React 18 + Hooks** — IKKE class components
- **TypeScript strict mode** — ingen `any`, ingen `@ts-ignore` uden begrundelse
- **Functional components** med `function ComponentName(props: Props) { ... }`
- **Container/Presenter-pattern**:
  - Container ejer state via hook(s)
  - Presenter modtager props ind, sender callbacks ud — INGEN direkte hook-import
- **Eksporteret Props interface**: `[ComponentName]Props` — altid eksporteret
- **JSDoc** på ikke-oplagte props

### React Native (Chauffeur app)
- **Functional components** + Hooks
- **StyleSheet.create()** med tokens fra `src/styles/tokens.ts`
- **Safe areas** via `useSafeAreaInsets()` — ALDRIG hardcoded padding for status bar / notch
- **Touch targets**: minimum 44×44px (outdoor app, høj kontrast påkrævet)

### Tilstand & data
- **Forretningslogik i hooks**, ikke i JSX
- **Mock-data i `src/mocks/`** — ALDRIG inline i komponenter
- **Typer i `src/types/`** — ALDRIG inline (undtaget Props-interface for komponenten selv)
- **Alle data-hooks** returnerer `{ data, loading, error }`
- **`useEffect`** har korrekte dependencies (eslint-plugin-react-hooks håndhævet)

---

## 2. Design system — UFRAVIGELIG

**Tokens er ikke valgfrie. Heller ikke i prototyper.**

```tsx
// ALDRIG
style={{ color: '#0B3950' }}
style={{ padding: 16 }}
className="bg-[#FEEE32]"
className="text-[14px]"

// ALTID
className="text-deep-teal"
className="p-sm"
className="bg-yellow"
className="text-sm"
```

- **Web tokens**: `apps/formand/tailwind.config.ts`
- **Mobil tokens**: `apps/chauffeur/src/styles/tokens.ts`
- **Reference**: `.claude/docs/core/DESIGN_SYSTEM.md`
- **Inline `style={}`** kun ved genuint runtime-beregnede værdier (fx `width: progress * 100 + '%'`)

---

## 3. Frosne projekt-beslutninger (LÅST — overhold uden undtagelser)

| Beslutning | Reference | Dato |
|---|---|---|
| Status-vokabular dansk + ASCII + snake_case | `.claude/docs/STATUS_VOKABULAR.md` | 2026-05-26 |
| Datoformat: ISO storage + "16. marts 2026" UI | `.claude/docs/DATOFORMAT.md` | 2026-05-26 |
| Tons-format: komma som decimal (24,5 t — ikke 24.5) | (i UI; lagring er number) | 2026-05-27 |
| 5+1 vejeseddel-statusser | `STATUS_VOKABULAR.md` §2 | 2026-05-27 |
| Første-læs + interval-model for bilbestilling | `FUNCTIONAL_FLOWS.md` Flow 1 Trin 1 | 2026-05-26 |
| Google Distance Matrix + 10% lastbil-buffer for ETA | `FUNCTIONAL_FLOWS.md` Flow 3 Trin 6 | 2026-05-27 |
| Sidste-læs frigivelses-flow: hybrid trigger | `FUNCTIONAL_FLOWS.md` Flow 1 Variant | 2026-05-27 |
| Folder-konvention: `Docs/[App]/[sektion-slug]/` | `WORKFLOW_UPGRADES_PLANNED.md` C4 | 2026-05-28 |

**Konflikt mellem prototype-UX og frosne beslutninger?** Frosne beslutninger vinder altid. Prototypen rettes.

---

## 4. Database & data-håndtering

> **Bemærk**: Supabase er valgt som DB-løsning, men opsætning er endnu ikke startet. Detaljer opdateres når Supabase er sat op.

**Foreløbige principper (revideres når Supabase går live):**
- **Alle datofelter** lagres som ISO 8601 i UTC (`yyyy-mm-ddTHH:MM:ssZ`)
- **Alle status-felter** følger `STATUS_VOKABULAR.md` (dansk + snake_case + ASCII)
- **Alle tabeller** skal have RLS-policies på når Supabase er klar
- **Alle mock-data** har `// TODO: Erstat med Supabase når klar`-kommentar
- **Skema-ændringer** kræver migration-script + reference til CONTRACT-amendment

---

## 5. Hosting & deploy

> **Bemærk**: Hosting er fastlagt som **Netlify for web-apps** + **Expo/EAS for chauffeur (RN)**. Specifik deploy-konfiguration opdateres løbende.

**Foreløbige principper:**
- **Branch → Netlify preview**: hver feature-branch får automatic preview-URL
- **Main → Netlify live**: merge til main = deploy
- **Section-manifest live-tag** styrer hvornår sektion vises som "produktion" i UI

---

## 6. AI-værktøjer

### Tilladte AI-værktøjer

| Værktøj | Brug | Begrænsninger |
|---|---|---|
| **Claude Code** | Officiel — kører projektets agent-suite | Ingen |
| **Cursor / Copilot** | Tilladt som co-pilot | Skal følge samme regler — outputtet er bare en PR uanset |
| **ChatGPT / andre** | Til research / brainstorm | IKKE direkte til kode der committes |

### Claude agent-suite (projektets workflow)

Læs `.claude/agents/` for fuld liste. Hovedagenter:

| Agent | Rolle | Kald via |
|---|---|---|
| `interviewer` | Scope sektion + draft contract | `/interview [sektion] [app]` |
| `architect` | Plan build-rounds + SPECs | `/develop-screen [sektion] [app]` |
| `builder` | Byg én komponent fra SPEC | Auto via architect |
| `reviewer` | Review mod SPEC | Auto efter builder |
| `test-writer` | Skriv tests | Auto efter reviewer GODKENDT |
| `cleanup-agent` | Cleanup (file eller sektion) | `/cleanup [fil]` eller `/cleanup-section [sektion]` |
| `git-agent` | Commit + PR | Auto i dev-fase, manuel i prototype |

### Auto-orchestration-loop (i dev-fase)

```
Builder bygger → handoff + signoff
   ↓ auto-dispatch reviewer
Reviewer reviewer → REVIEW_REPORT + signoff
   ├─ GODKENDT → auto-dispatch test-writer → git-agent åbner PR
   └─ NEEDS-FIX → auto-dispatch builder med fix-list (max 3 rounds → ESCALATION)
```

---

## 7. Hvad du SKAL gøre når du bidrager med AI-genereret kode

1. **Læs section-manifestet** før du starter — find scope, accept-kriterier, build-order
2. **Læs `COMPONENT_REGISTRY.md`** — genbrug eksisterende komponenter
3. **Brug Claude's agents** når du arbejder på en sektion — de håndhæver projektets standarder
4. **Skriv handoff-fil** med signoff når komponent er klar
5. **Åbn PR** med udfyldt PR-template — link til SPEC + CONTRACT
6. **Vent på reviewer-signoff** før merge

---

## 8. Hvad du IKKE må

- **Aldrig** committe direkte til `main` (blokeret af branch-protection)
- **Aldrig** committe `.env`-filer eller secrets
- **Aldrig** ændre frosne beslutninger uden eksplicit godkendelse fra Carsten + CONTRACT-amendment
- **Aldrig** importere fra `src/prototypes/` i produktion-kode
- **Aldrig** introducere `any`-typer uden `// eslint-disable-next-line` + begrundelse
- **Aldrig** afvige fra tokens (hex, raw px) — heller ikke "bare lige"

---

## 9. Spørgsmål eller tvivl

- **Slack**: #colas-dev (oprettes når agency starter)
- **Asana**: COL-projektet (oprettes når Carsten er færdig med signup)
- **Direkte**: Carsten / agency-lead

Vi opdaterer dette dokument løbende — hvis du finder noget der mangler, åbn en `docs:`-PR.

---

*Sidste opdatering: 2026-05-29 — F5 implementering*
