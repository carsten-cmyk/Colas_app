---
type: refactor-spec
target: apps/fabrik/src/prototypes/produktionsplan/ProduktionsplanScreen.tsx
replaces_block: linje 999-1024 (dato-navigator)
depends_on: PeriodeNavigator (shared/components/PeriodeNavigator.tsx)
status: DRAFT — afventer Carstens API-godkendelse
---

# Refactor — Fabrik Produktionsplan dato-navigator

## Hvad ændres

Erstat den eksisterende dato-navigator-blok (linje 999-1024) med en enkelt `<PeriodeNavigator>`-instance.

## Eksisterende kode (slettes)

```tsx
{/* Dato-navigator — stil fra formand/GanttScreen linje 246-267 */}
<div className="flex items-center gap-xxxs">
  <button onClick={() => navigerDag(-1)} className="..." aria-label="Forrige dag">
    <ChevronLeft size={16} />
  </button>
  <div className="px-sm py-xs ... min-w-[180px] text-center">
    {formatDanskLangDato(selectedDate)}
  </div>
  <button onClick={goToday} className="...">I dag</button>
  <button onClick={() => navigerDag(1)} className="..." aria-label="Næste dag">
    <ChevronRight size={16} />
  </button>
</div>
```

## Ny kode

```tsx
<PeriodeNavigator
  onNavigate={dir => navigerDag(dir)}
  onToday={goToday}
  dateLabel={formatDanskLangDato(selectedDate)}
  ariaLabel="Dato-navigation"
/>
```

## State bevares uændret

- `selectedDate: Date` — uændret
- `navigerDag(delta: number)` — uændret (kaldes med -1 eller 1)
- `goToday()` — uændret
- `formatDanskLangDato()` — uændret

## Imports ændres

- Fjern: `ChevronLeft`, `ChevronRight` fra `lucide-react` (medmindre brugt andre steder i filen — tjek først)
- Tilføj: `import { PeriodeNavigator } from '@shared/components/PeriodeNavigator'` (sti afhænger af tsconfig-alias — se note nedenfor)

## Path-alias-overvejelse

Fabrik-app bruger sandsynligvis `@/`-alias. Builder skal tilføje `@shared/` (eller `shared/`) alias i `apps/fabrik/tsconfig.json` + `apps/fabrik/vite.config.ts` hvis ikke allerede sat op. Hvis problemer: brug relative imports som fallback: `'../../../../../shared/components/PeriodeNavigator'`.

## Visuel risiko

Ingen — komponenten matcher præcis det eksisterende mønster (matched på `ProduktionsplanScreen.tsx:1001-1023`).

## Test plan

- Naviger frem / tilbage en dag → `selectedDate` opdateres korrekt
- Klik "I dag" → `selectedDate` resetter til `2026-06-01`
- Dato-label rendret korrekt i lang-format ("1. juni 2026")
- Visuelt identisk med før-refactor (sammenlign screenshots)
