---
name: Section build (ny sektion til produktion)
about: Anmod om at en ny sektion startes via /interview + /develop-screen
title: 'section: [app/sektion-slug]'
labels: 'section, needs-interview'
assignees: ''
---

## Sektion
- **App**: [formand / vognmand / chauffeur / chauffeur-web / fabrik]
- **Sektion-slug**: [fx asfaltbestilling, sidste-laes-frigivelse]
- **Tab/skærm**: [planlaegning / udfoersel / afregning / —]
- **Phase**: [prototype-klar / dev-ready / dev-aktiv]

## Prototype-reference
- **Fil**: `apps/[app]/src/prototypes/[path]/[file].tsx`
- **Live URL**: [hvis deployed]

## Status før dev
- [ ] Prototype er UX-godkendt af kunde
- [ ] Status-vokabular låst (eller ikke relevant)
- [ ] Datoformat låst (eller ikke relevant)
- [ ] Cross-cutting blockers afklaret

## Workflow (auto-eksekveres efter denne issue oprettes)
1. **`/interview [sektion] [app]`** — interviewer-agent producerer KICKOFF + CONTRACT-draft + Q&A
2. **Carsten signerer CONTRACT** → FROZEN
3. **`/develop-screen [sektion] [app]`** — architect-agent producerer SPECs + build-rounds
4. **Auto-loop**: builder → reviewer → builder (fix) → reviewer → test-writer
5. **`/cleanup-section [sektion] [app]`** før live-status
6. **Section-manifest** opdateres løbende

## Reference
- WORKFLOW_PROTOTYPE_TIL_PRODUKTION.md
- DEFINITION_OF_DONE.md
