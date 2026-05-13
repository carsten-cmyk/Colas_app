# Memory Index

## Setup
- Agency setup færdigt 2026-05-13: 6 agenter i `.claude/agents/`, nye kommandoer, FUNCTIONAL_FLOWS.md
- Workflow: `/develop-screen [skærm] [app]` → architect → builder → reviewer → issues
- `/git` er manuel — aldrig auto-commit
- Tokens obligatoriske selv i prototyper (ingen hardcodede hex/px)
- Agent-format: model: opus/sonnet/haiku (ikke fuld ID), ingen tools-liste i YAML, ligger i .claude/agents/

## Project
- [project_formand_review.md](project_formand_review.md) — Fuld review af formand-appen mangler
- NÆSTE: Opdater AnkommetFabrikScreen prototype — UX-analyse færdig, klar til implementation
  - Fil: apps/chauffeur-web/src/prototypes/chauffeur/screens/AnkommetFabrikScreen.tsx
  - Sig: "fortsæt med AnkommetFabrikScreen prototype-opdatering" for at genoptage

## Cross-app flows
- `.claude/docs/FUNCTIONAL_FLOWS.md` — komplet flow-dokumentation (bil-tildeling + materiel)
- `.claude/docs/MATERIEL_FLOW.md` — detaljeret spec for materiel-transport
- `.claude/docs/DATA_FIELDS.md` — feltliste formand→vognmand
- Chauffør identificeres via tlf + nummerplade (intet login-system)
