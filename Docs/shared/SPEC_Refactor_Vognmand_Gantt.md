---
type: refactor-spec
target: apps/vognmand/src/prototypes/gantt/VognmandGanttScreen.tsx
replaces_block: linje 182-225 (Periode-controls)
depends_on: PeriodeNavigator (shared/components/PeriodeNavigator.tsx)
status: DRAFT — afventer Carstens API-godkendelse
---

# Refactor — Vognmand Gantt periode-navigator

## Hvad ændres

Erstat hele `Periode-controls`-blokken (linje 182-225) — som indeholder både mode-toggle OG pile-navigation — med én `<PeriodeNavigator>`-instance.

## Eksisterende kode (slettes)

Linje 182-225: mode-toggle (`['uge', '14-dage', 'maaned']`) + pile/I-dag-navigation.

## Ny kode

```tsx
{/* Periode-controls */}
<div className="mb-5">
  <PeriodeNavigator
    modes={['uge', '14-dage', 'maaned']}
    activeMode={viewMode}
    onModeChange={m => { setViewMode(m); setOffset(0) }}
    onNavigate={dir => setOffset(o => o + dir * viewDays)}
    onToday={() => setOffset(0)}
    ariaLabel="Periode-navigation"
  />
</div>
```

> Wrapper-`div` bevarer `mb-5` så vertikalt rytme matcher omkringliggende layout.

## State bevares uændret

- `viewMode: ViewMode` — uændret
- `offset: number` — uændret
- `getViewDays(viewMode)` — uændret (kaldes nu i `onNavigate`-callback)
- `windowStart`, `days`, `windowEnd` — beregnes uændret udenfor navigator

## Imports ændres

- Fjern: `ChevronLeft`, `ChevronRight` fra `lucide-react` (medmindre brugt andre steder)
- Tilføj: `import { PeriodeNavigator } from '@shared/components/PeriodeNavigator'`

## ⚠ Breaking change-overvejelse — `border-box-outline` → `border-hairline`

Den eksisterende kode bruger `border-box-outline` på pile + "I dag"-knap; ny komponent bruger `border-hairline`. Forskellen er `#EDEDED` → `#E8E8E8` (begge meget tæt-grå, knap synligt for øjet).

**Beslutning:** acceptér mikro-ændringen for at få cross-app konsistens. Hvis Carsten kræver pixel-præcis bevaring, kan vi tilføje en `borderToken` prop i `PeriodeNavigator` v1.1.

## Test plan

- Skift mode `uge` / `14-dage` / `maaned` → `viewMode` opdateres, `offset` nulstilles
- Naviger frem/tilbage → `offset` flyttes med `viewDays`
- Klik "I dag" → `offset = 0`
- Gantt-grid renderer korrekt windows efter mode-skift
- Visuelt næsten identisk (kun mikro-border-skifte)
