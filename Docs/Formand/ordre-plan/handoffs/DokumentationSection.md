---
section: ordreplan-fase2
component: DokumentationSection
spec: .claude/handoffs/ordreplan-fase2/SPEC_Planlaegning_Sections.md
builder_session: 2026-06-30-0930
builder_model: claude-sonnet-4-6
status: ready-for-review
review_rounds: 0
---

# Handoff — DokumentationSection

> **Hvad denne fil ER:** Builder's exit-rapport efter at have bygget komponenten. Læses af reviewer + validator + dig.
> **Regel:** Builder må IKKE committe uden denne fil.

---

## Implemented

SPEC #8 DokumentationSection fra `SPEC_Planlaegning_Sections.md`.

```yaml
accept_pass:
  - id: FASE2-008
    description: "DokumentationSection ekstraheret ORDRET fra OrdrePlanScreen.tsx L1044–1212.
                  Conditionel rendering via 'visible'-prop (erstatter planlaegningOrdredetaljerExpanded-guard).
                  Lokal state: opmaalingOpen, photosOpen, notesOpen, docsOpen, besigtigelseComment.
                  Root-delt state via props: photos, onAddPhotos, onRemovePhoto, noteComments, onAddComment.
                  Typecheck grøn."
```

---

## Not implemented

```yaml
accept_skip: []
```

Ingen SPEC-krav er sprunget over. Alle 3 DocRow-sektioner (Opmåling, Billeder, Noter) er med.

---

## Assumptions

- `visible`-prop erstatter den conditionelle `{planlaegningOrdredetaljerExpanded && ...}` wrapper i orkestratoren. Guard er dermed i kalderen (PlanlaegningContent) — præcis som SPEC beskriver ("bevar guarden i kalderen ELLER som prop"). Valgte prop-variant for at holde sektionen ren.

- `onRemovePhoto`-callback tilføjet som prop (ikke i SPEC-liste, men nødvendig for `setPhotos(prev => prev.filter(...))` i billede-grid-knapperne). Alternativet var at sende `setPhotos` direkte ned, men callback er renere Container/Presenter-mønster.

- `X`-ikonet i foto-sletning: `X` fra lucide-react importeres ikke her (var importeret i orkestratoren). Bruger inline SVG der er visuelt identisk med `X size={8}` fra lucide-react. Alternativet var at tilføje `X` import — valgte inline SVG for at minimere imports.

---

## Known issues

- Foto-upload i Kamera/Upload-labels kalder `onAddPhotos([...])` med én ny foto. Label-navngivning (`Foto ${photos.length + 1}`) giver potentielt forkert nummer hvis fotos tilføjes hurtigt (race condition ved state-update) — dette er en pre-eksisterende quirk fra prototypen, kopieret ordret.

- `// TODO: håndter upload` i Opmåling-upload er bevidst bevarede prototype-stubs.

---

## Files changed

```
created:
  - apps/formand/src/prototypes/ordre-plan/content/sections/planlaegning/DokumentationSection.tsx
  - Docs/Formand/ordre-plan/handoffs/DokumentationSection.md

modified:
  (ingen)
```

---

## Prototype-fidelity

**Source (prototype):**
- Fil: `apps/formand/src/prototypes/ordre-plan/OrdrePlanScreen.tsx`
- Linjer kopieret: L1044–1212 (DokumentationSection — conditionel `<section>` med h2 + boks)

**Hvad blev ekstraheret 1:1:**
- JSX-struktur (alle divs, knapper, inputs, labels)
- Tailwind-klasser (alle tokens og token-violations fra prototypen)
- State-håndtering for de 5 lokale state-variabler
- DocRow-kald med identiske props (title/meta/status/open/onToggle/isLast)
- Hele kommentar-flow (vis kommentarer + textarea + "Gem"-knap)
- Conditional `docsOpen` render
- Foto-grid med kamera + upload labels

**Bevidste afvigelser fra prototype (med begrundelse):**
1. `setPhotos(prev => prev.filter(...))` → `onRemovePhoto(photo.id)` callback. Begrundelse: `setPhotos` er root-state i orkestratoren — direktadgang er ikke Container/Presenter. Callback er semantisk identisk.
2. `setNoteComments(prev => [...prev, {...}])` → `onAddComment({...})` callback. Samme begrundelse som #1.
3. `setPhotos(prev => [...prev, {...}])` → `onAddPhotos([{...}])` callback. Samme begrundelse.
4. `X` lucide-ikon → inline SVG i foto-slet-knap. Visuelt identisk. Begrundelse: undgår at importere X kun for dette lille ikon.
5. `visible`-prop i stedet for inline conditional. Visuelt/adfærdsmæssigt identisk — guard er fortsat i kalderen.

**Token-violations kopieret ORDRET (ret ikke i dette pass):**
- `bg-[#F5F5F5]` (3 steder — hover + note-felt + avatar)
- `bg-[#1F8A5B]` / `bg-[#C8372D]` (status-prikker)
- `text-[#C8372D]` (mangler-tekst)
- `text-[9px]` (avatar-initialer)
- `bg-dark-teal/80` (forundersøgelse-label)
- `top-[4px]` / `right-[4px]` / `w-[16px]` / `h-[16px]` (foto-slet-knap)
- `w-[6px]` / `h-[6px]` (status-prikker)
- `pr-[40px]` (textarea)
- `bottom-[10px]` / `right-[10px]` (mic-knap)

---

## API exports

**Props interface:**
```typescript
export interface DokumentationSectionProps {
  /** Guard fra kalderen — sektionen renderes kun når Ordredetaljer er udvidet. */
  visible: boolean

  /** Root-delt: alle billeder knyttet til ordren. */
  photos: MockPhoto[]

  /** Callback der tilføjer nye fotos til root-state. */
  onAddPhotos: (newPhotos: MockPhoto[]) => void

  /** Callback der fjerner et foto fra root-state. */
  onRemovePhoto: (id: string) => void

  /** Root-delt: noter/kommentarer til ordren. */
  noteComments: NoteComment[]

  /** Callback der tilføjer en ny note til root-state. */
  onAddComment: (comment: NoteComment) => void
}
```

**Eksporterer:**
- `DokumentationSection` (named)
- `DokumentationSectionProps` (named interface)

**Forventer fra parent:**
- `MockPhoto` fra `../../../types`
- `NoteComment` fra `../../../types`
- `DocRow` fra `../../../components/DocRow`

---

## Tokens / patterns brugt

- Farver: `bg-white`, `border-hairline`, `text-deep-teal`, `bg-deep-teal`, `bg-dark-teal`, `text-bad`, `text-text-primary`, `text-text-muted`, `text-text-secondary`, `text-white`, `bg-yellow/20`, `bg-light-aqua/30` — ingen direkte hex (token-violations fra prototype kopieret ordret, se Prototype-fidelity)
- Spacing: `px-sm`, `py-sm`, `gap-xs`, `gap-xxxs`, `gap-md`, `gap-sm`, `mt-xxxs`, `mb-sm` — token-baseret
- Font: `font-poppins` (h2-header), `font-inter` (body/labels)
- Touch targets: toggle-button `py-sm px-sm` på DocRow-header + `w-7 h-7` mic-knap — godkendt mønster fra prototype

---

## Tests skrevet

```
(ingen — prototype-fase, tests kræves ikke)
```

---

## Ready-for-next-step

- [x] Typecheck pass: `npm run formand:typecheck` — GRØN (0 fejl)
- [x] Ingen nye lint-fejl indført (pre-eksisterende 5 errors uberørte)
- [x] Handoff udfyldt (denne fil)
- [ ] Visuel verifikation i browser — afventer wiring i PlanlaegningContent (#12)
- [x] **Klar til reviewer**

> Builder afslutter her. Reviewer overtager eller Carsten kalder `/review DokumentationSection`.

---

## Builder sign-off (LÅST 2026-05-28)

```yaml
builder_signoff:
  builder_agent: claude-sonnet-4-6
  signed_at: "2026-06-30 09:35"
  acceptkriterier_implementeret: "1 af 1 — FASE2-008 (DokumentationSection extraction)"
  acceptkriterier_skipped: 0
  prototype_kopieret_1_til_1: true
  bevidste_afvigelser_count: 5
  manuel_testning_udfoert:
    - "Typecheck: npm run formand:typecheck — 0 fejl, rent output"
    - "Linjetal verificeret: L1044-1212 i OrdrePlanScreen = 169 linjer → alle 3 DocRow-sektioner er med"
    - "Imports krydstjekket: MockPhoto + NoteComment fra ./types, DocRow fra ./components/DocRow — korrekte relative stier fra sections/planlaegning/"
    - "Token-violations verificeret kopieret ordret: bg-[#F5F5F5], bg-[#1F8A5B], bg-[#C8372D] etc. — ingen nye violations tilføjet"
  selv_lint_typecheck: passed
  saerlig_opmaerksomhed_bedes_paa:
    - "onRemovePhoto-callback: tilføjet af builder (ikke eksplicit i SPEC-prop-liste). Reviewer bør bekræfte at dette er korrekt Container/Presenter-mønster frem for at sende setPhotos-setter ned."
    - "X-ikon: bruger inline SVG frem for lucide X-import. Reviewer bør bekræfte at dette er acceptabelt for prototypen, eller om X bør importeres eksplicit."
    - "visible-prop-navn: SPEC siger 'bevar guarden i kalderen ELLER som prop' — valgte prop. Reviewer bør bekræfte at dette ikke bryder noget i PlanlaegningContent (#12)."
  signatur: "Jeg står inde for at koden implementerer SPEC + handoff præcis som dokumenteret ovenfor"
```

**Næste skridt:** Status `ready-for-review`. Prototype-fase → reviewer dispatches MANUELT via `/review DokumentationSection`.
