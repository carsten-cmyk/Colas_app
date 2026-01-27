# Documentation - Colas App Project

Dette er dokumentationsbiblioteket for Colas App projektet. Filerne repræsenterer best practices og guidelines fra tidligere projekter.

## Mappestruktur

```
.claude/docs/
├── README.md (denne fil)
├── APP_MIGRATION_STRATEGY.md       # ⭐ VIGTIG: Prototype → Production guide
├── core/                           # Core development guidelines
│   ├── FRONTEND_BEST_PRACTICES.md  # React og frontend patterns
│   ├── DESIGN_SYSTEM.md            # Design system og komponenter
│   └── TEST_STRATEGY.md            # Test strategi og eksempler
├── reference/                      # Reference dokumentation
│   ├── LESSONS_LEARNED.md          # Lessons learned fra tidligere projekter
│   ├── architecture.md             # Arkitektur principper
│   ├── it-architect-role.md        # IT-arkitekt beslutningsframework
│   └── ux-ui-guidelines.md         # UX/UI design principper
└── templates/                      # Templates til genbrugelige patterns
```

## Quick Start Guide

### Ved Opstart af Ny Opgave

**Frontend/React Work:**
```bash
Før ny component → Læs DESIGN_SYSTEM.md (Copy-paste Components)
Før styling → Læs DESIGN_SYSTEM.md (Tailwind Patterns)
Før React hooks → Læs FRONTEND_BEST_PRACTICES.md (Hooks Patterns)
Før forms → Læs DESIGN_SYSTEM.md (Form Components) + FRONTEND_BEST_PRACTICES.md (Validation)
```

**Testing:**
```bash
Før component test → Læs TEST_STRATEGY.md (Unit Testing)
Før integration test → Læs TEST_STRATEGY.md (Integration Testing)
```

**Arkitektur Decisions:**
```bash
Ved større design decisions → Læs architecture.md + it-architect-role.md
Ved performance spørgsmål → Læs LESSONS_LEARNED.md (Performance)
Ved UI inconsistency → Læs ux-ui-guidelines.md
```

**Migration til Production/Native:**
```bash
⭐ Før du skriver mere kode → Læs APP_MIGRATION_STRATEGY.md
Ved databehandling → Læs APP_MIGRATION_STRATEGY.md (Data Layer)
Ved database design → Læs APP_MIGRATION_STRATEGY.md (Database Schema)
Ved native app planning → Læs APP_MIGRATION_STRATEGY.md (React Native/Capacitor)
```

## Critical Documentation

### 0. APP_MIGRATION_STRATEGY.md ⭐
**Hvad:** Komplet guide til migration fra prototype til production-ready native apps
**Hvornår at referere:**
- **FØR du skriver mere kode** - Undgå at skulle starte forfra
- Når du arbejder med data/API integration
- Ved planlægning af database struktur
- Før migration til native apps (iOS/Android)

**Nøgle emner:**
- Data Layer Separation (service layer pattern)
- Database schema design
- React Native vs Capacitor migration paths
- State management architecture
- Type definitions og API contracts
- Environment configuration
- Authentication strategy
- Migration checklist

**VIGTIGT:** Denne guide sikrer at prototype koden kan genbruges 80-95% når I skal i production!

---

## Core Documentation

### 1. FRONTEND_BEST_PRACTICES.md
**Hvad:** React og frontend development best practices
**Hvornår at referere:**
- Når du skriver nye React komponenter
- Ved state management decisions
- Ved performance optimization
- Når du er usikker på patterns

**Nøgle emner:**
- React hooks patterns
- Performance optimization (useMemo, useCallback)
- Error handling
- Form validation
- Code organization
- Testing patterns

### 2. DESIGN_SYSTEM.md
**Hvad:** Code-first design system reference med copy-paste komponenter
**Hvornår at referere:**
- Når du skal bygge nye UI komponenter
- Ved styling af eksisterende komponenter
- Når du er usikker på Tailwind classes
- Ved responsive design implementering

**Nøgle emner:**
- Color system
- Typography scale
- Component library (cards, buttons, forms, dialogs)
- Tailwind patterns
- Responsive breakpoints
- Animations og transitions

### 3. TEST_STRATEGY.md
**Hvad:** Komplet test strategi med eksempler
**Hvornår at referere:**
- Når du skal skrive tests
- Ved test setup for nye features
- Når tests fejler og skal debugges

**Nøgle emner:**
- Unit testing (components, utilities)
- Integration testing
- Test data fixtures
- Coverage goals

## Reference Documentation

### 4. LESSONS_LEARNED.md
**Hvad:** Dokumenterede lessons learned fra udviklingen
**Hvornår at referere:**
- Før du starter en ny større feature
- Når du støder på lignende problemer
- Ved code review for at undgå kendte pitfalls

**Nøgle emner:**
- Frontend lessons (query patterns, state management)
- UI/UX lessons (color consistency, design patterns)
- Performance lessons (optimization techniques)
- Architecture decisions

### 5. architecture.md
**Hvad:** Arkitektur principper og patterns
**Hvornår at referere:**
- Ved større arkitektur beslutninger
- Når du tilføjer nye moduler
- Ved performance eller sikkerhedsspørgsmål

### 6. it-architect-role.md
**Hvad:** IT-arkitekt principper og beslutningsframework
**Hvornår at referere:**
- Ved design af nye features
- Ved performance optimization
- Når du skal vælge mellem multiple tekniske løsninger

### 7. ux-ui-guidelines.md
**Hvad:** Design system og UI/UX patterns
**Hvornår at referere:**
- Ved alle frontend/UI ændringer
- Ved responsive design spørgsmål
- Når du skal style forms, buttons, cards

## Integration med Claude Code

Disse filer er placeret i `.claude/docs/` så Claude Code automatisk kan læse dem når relevant. Du behøver normalt ikke at referere til dem eksplicit - Claude vil læse dem når opgaven kræver det.

**Eksplicit reference kun når:**
- Du mærker Claude går i en forkert retning
- Ved meget komplekse opgaver
- Når du vil have specifik guideline-baseret input

## Tilpasning til Dit Projekt

Disse dokumenter er kopieret fra Enterprise Strategy Platform projektet. Du kan frit tilpasse dem til dit nye projekts behov:

1. **Design System** - Opdater farver, typography og komponenter til dit brand
2. **Best Practices** - Tilføj projekt-specifikke patterns efterhånden som de udvikles
3. **Test Strategy** - Tilpas til din test setup og frameworks
4. **Lessons Learned** - Tilføj nye lessons learned fra dette projekt

## Næste Skridt

### Prototype Fase (Nu)
1. **LÆS APP_MIGRATION_STRATEGY.md FØRST** ⭐ - Forstå migration path
2. Gennemse FRONTEND_BEST_PRACTICES.md for React patterns
3. Tilpas DESIGN_SYSTEM.md med dine farver og brand
4. Start udvikling med best practices fra starten

### Forberedelse til Production (Snart)
1. Implementer Data Layer Separation (APP_MIGRATION_STRATEGY.md §1)
2. Design database schema (APP_MIGRATION_STRATEGY.md §2)
3. Setup environment configuration (APP_MIGRATION_STRATEGY.md §6)
4. Definer Type definitions (APP_MIGRATION_STRATEGY.md §3)

### Migration til Native (Senere)
1. Følg migration checklist (APP_MIGRATION_STRATEGY.md §9)
2. Vælg React Native eller Capacitor
3. Implementer authentication
4. Deploy til App Store / Google Play

---

**Projekt:** Colas App
**Oprettet:** 2026-01-19
**Baseret på:** Enterprise Strategy Platform v2.0 documentation
