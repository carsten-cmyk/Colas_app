---
type: refactor-spec
target: apps/vognmand/src/prototypes/liste/VognmandListeScreen.tsx
replaces_block: linje 407-450 (Periode-controls)
depends_on: PeriodeNavigator (shared/components/PeriodeNavigator.tsx)
status: DRAFT — afventer Carstens API-godkendelse
---

# Refactor — Vognmand Liste periode-navigator

## Hvad ændres

Erstat hele `Periode-controls`-blokken (linje 407-450) med en `<PeriodeNavigator>`-instance. Identisk refactor som Gantt-skærmen (samme state-form, samme API).

## Eksisterende kode (slettes)

Linje 407-450: mode-toggle + pile/I-dag-navigation. Kopieret 1:1 fra VognmandGanttScreen.

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

## State bevares uændret

- `viewMode`, `offset`, `viewDays`, `getWindowStart()` — uændret
- `navigatePeriod()` lokal-funktion kan slettes — logikken flyttes inline i `onNavigate`-callback ovenfor

## Imports ændres

- Fjern: `ChevronLeft`, `ChevronRight` fra `lucide-react` (tjek først om brugt andre steder i filen)
- Tilføj: `import { PeriodeNavigator } from '@shared/components/PeriodeNavigator'`

## ⚠ Samme `border-box-outline` → `border-hairline` overvejelse som Gantt

Se Gantt-SPEC for detaljer. Accept anbefales.

## Synkronisering mellem Gantt og Liste

**Nuværende state:** Hver skærm har sin egen lokale `useState` — ingen synkronisering. Skifter brugeren periode på Gantt og navigerer derefter til Liste, så ses default-periode (offset=0).

Dette bevares som-is. Hvis cross-screen-sync ønskes, skal `viewMode`/`offset` flyttes til en delt URL-param eller context — det er ude af scope for denne refactor.

## Test plan

- Identisk med Gantt-test plan
- Liste-tabellen renderes fortsat korrekt for det valgte periode-vindue
