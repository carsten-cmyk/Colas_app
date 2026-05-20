# Section Kickoff — TEMPLATE

> **Brug:** Kopiér denne fil til `Docs/[App]/KICKOFF_[Sektion].md` ved hver ny sektion. Architect-agenten udfylder hver del *før* SPEC-decomposition. Carsten godkender før SPECs skrives.

---

## Identitet

- **Sektion:** `[fx Dagsfordeling]`
- **App:** `[formand | vognmand | chauffeur | chauffeur-web | fabrik | kunde]`
- **Skærm/sti:** `[fx /ordre/:id → Dagsfordeling-sektion]`
- **Arkitekt:** `[claude/architect]`
- **Dato:** `[yyyy-mm-dd]`
- **Prototype-reference:** `[apps/formand/src/prototypes/.../...tsx]`

---

## 1. Scope og mål

**Hvad gør sektionen?**
> `[1-2 sætninger, forretningsorienteret]`

**Hvad gør den IKKE?** (bevidste afgrænsninger)
- `[fx Afregning ligger i separat sektion]`
- `[fx Returlæs håndteres ikke her]`

**Brugerhistorier (1-3 happy paths):**
1. `[Som formand vil jeg ...]`
2. `[...]`

---

## 2. Data — input/output

### 2.1 — Læser fra (kilder)

| Tabel/kilde | Felter brugt | Hvordan hentes? (hook) | Realtime/polling/static |
|---|---|---|---|
| `[plan_vejebilag]` | `tons, modtaget_tidspunkt, vejebilag_nr` | `useVejesedler` | polling 10 min |
| `[recepter]` | `kg_per_m2, densitet, min_temperatur` | `useRecept` | static |

### 2.2 — Skriver til (mål)

| Tabel | Felter skrevet | Trigger | Optimistic UI? |
|---|---|---|---|
| `[dagsoverblik_registreringer]` | `faktisk_m2, faktisk_tons, gemt_tidspunkt` | Bruger trykker "Gem" | Ja, med rollback |

### 2.3 — Status-overgange (state machine, hvis relevant)

```
[draft] → (godkend) → [planlagt] → (start) → [igang] → (afslut) → [udført]
                                                ↓
                                             (annullér) → [aflyst]
```

**Status-vokabular:** Bekræft alle statusser matcher låst vokabular (se [Workflow](.claude/docs/WORKFLOW_PROTOTYPE_TIL_PRODUKTION.md)).

---

## 3. Cross-app effekter

> **Vigtigst del af kickoffen.** Hvis denne sektion ændrer data en anden app læser, skal det fanges her — ellers bygger vi i blinde.

| Påvirket app | Hvad ser/skriver de? | Trigger | Reference til Flow |
|---|---|---|---|
| `[vognmand]` | `[dagstons → disponering]` | `[ved gem af dagsfordeling]` | `[FUNCTIONAL_FLOWS.md Flow 2]` |
| `[chauffør]` | `[ny task hvis morgen-tons ændres]` | `[Realtime push]` | `[Flow 3]` |
| `[fabrik]` | `[—]` | `[—]` | `[—]` |

**Skal FUNCTIONAL_FLOWS.md opdateres med nye flows?** `[Ja/Nej — og hvilken Flow N?]`

---

## 4. Realtime, offline, fejl

- **Realtime-strategi:** `[Supabase Realtime channel? Polling? Static-pr-session?]`
- **Offline-opførsel:**
  - Læs: `[Vis cached data + offline-banner / vis "ingen forbindelse" / ...]`
  - Skriv: `[Write-queue / blokeres / ...]`
- **Fejlhåndtering:**
  - Datafejl: `[Vis error-card + retry / ...]`
  - Netværksfejl: `[Vis offline-banner / ...]`
  - Validerings­fejl: `[Inline fejl ved felt / ...]`

---

## 5. Mock-data fjernelse

Alle disse `// TODO: Erstat med Supabase`-markører skal væk (eller eksplicit udskydes):

- [ ] `apps/[app]/src/hooks/[hook].ts` — `[hvilken mock skal erstattes]`
- [ ] `apps/[app]/src/mocks/[mock].ts` — `[skal slettes / behold til tests]`

---

## 6. Design tokens — production-gate

- [ ] Ingen hardcoded farver (`#xxxxxx`)
- [ ] Ingen hardcoded font-størrelser eller spacing
- [ ] `font-poppins`/`font-inter` bruges (alias mod Montserrat i prototype / Gotham i prod — se [feedback-design-tokens-no-deviation](.claude/projects/.../memory/))
- [ ] Eksisterende komponenter (badges, knapper, info-bokse) bruger ny farvepalette efter v2-token-update

---

## 7. Tilgængelighed

- [ ] Touch targets ≥ 44×44px
- [ ] Kontrast WCAG AA
- [ ] aria-labels på funktionelle ikoner
- [ ] Tastatur-navigation
- [ ] Skærmlæser-test for kritiske flows

---

## 8. Edge cases

> Liste de tilfælde der IKKE er happy path. Ikke udtømmende — det er en check.

- `[Hvad hvis der ikke findes en recept for ordren?]`
- `[Hvad hvis to formænd venter på samme bil (multi-produkt)?]`
- `[Hvad hvis bruger trykker Gem to gange hurtigt?]`
- `[Hvad hvis sessionen udløber midt i indtastning?]`

---

## 9. Test-strategi

- **Unit (Vitest):** `[hvilke hooks + utils kræver isolerede tests]`
- **Component (Vitest + Testing Library):** `[hvilke komponenter har komplekse states]`
- **Integration:** `[end-to-end via faktisk Supabase staging? Eller bare hook-niveau med Supabase-mock?]`
- **Coverage-mål:** 80% lines/functions, 70% branches

---

## 10. Komponent-decomposition (foreløbig)

> Architect udfylder dette efter forrige sektioner er klar. Hver linje bliver en SPEC-fil.

| Komponent | Type | SPEC-fil |
|---|---|---|
| `[DagsfordelingSection]` | Container | `SPEC_DagsfordelingSection.md` |
| `[DagPill]` | UI | `SPEC_DagPill.md` |
| `[useDagsfordeling]` | Hook | `SPEC_useDagsfordeling.md` |

---

## 11. Åbne spørgsmål (skal afklares før build)

> Hvis et spørgsmål her er ubesvaret, går vi IKKE i build. Carsten markerer som svaret med dato.

- [ ] `[Spørgsmål]` — *Svar: [...]* — **2026-mm-dd**

---

## 12. Definition of Done

- [ ] Alle komponenter bygget jf. SPECs
- [ ] Lint + typecheck + tests grønne
- [ ] Coverage ≥ 80/70
- [ ] Token-check ren
- [ ] Font-alias respekteret (ingen hardcoded font-family)
- [ ] FUNCTIONAL_FLOWS.md opdateret
- [ ] Cross-app effekter verificeret (ikke bare antaget)
- [ ] Mock-fjernelse gennemført (jf. afsnit 5)
- [ ] Offline-opførsel testet
- [ ] Demo med kunde

---

**Godkendt af Carsten:** `[ ] Dato: yyyy-mm-dd`
**Build-start:** `[ ] Dato: yyyy-mm-dd`
**Sektion afsluttet:** `[ ] Dato: yyyy-mm-dd`
