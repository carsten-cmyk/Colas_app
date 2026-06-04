# Handoff: PeriodeNavigator

**Bygget:** 2026-06-04  
**Builder:** builder-agent (Sonnet)  
**Status:** Klar til review

## Filer oprettet

- `shared/components/PeriodeNavigator.tsx`
- `shared/components/PeriodeNavigator.stories.tsx`

## API-tabel

| Prop | Type | Required | Default | Beskrivelse |
|---|---|---|---|---|
| `modes` | `PeriodeNavigatorMode[]` | Nej | — | Tilgængelige modes. Udeladt/tom → skjuler toggle |
| `activeMode` | `PeriodeNavigatorMode` | Nej* | — | Aktiv mode. *Required hvis `modes` sat |
| `onModeChange` | `(mode) => void` | Nej | — | Callback ved mode-skift |
| `onNavigate` | `(direction: -1 \| 1) => void` | **Ja** | — | Pile-navigation |
| `onToday` | `() => void` | **Ja** | — | "I dag"-knap |
| `dateLabel` | `string` | Nej | — | Færdigformateret dato-label (caller formaterer) |
| `dateLabelPosition` | `'inline' \| 'none'` | Nej | `'inline'` | Placeringen af dato-label |
| `className` | `string` | Nej | — | Extra CSS på root-wrapper |
| `ariaLabel` | `string` | Nej | `'Periode-navigation'` | Aria-label på `role="group"` |

Type alias:
```ts
export type PeriodeNavigatorMode = 'uge' | '14-dage' | 'maaned'
```

## Tokens brugt

| Token | Klasse | Brug |
|---|---|---|
| Hvid baggrund | `bg-white` | Knapper + label-boks |
| Deep teal | `bg-deep-teal text-white` | Aktiv mode-knap |
| Soft aqua | `hover:bg-soft-aqua` | Hover-state |
| Deep teal hover | `hover:text-deep-teal` | Hover-tekst |
| Tekst muted | `text-text-muted` | Inaktive knapper |
| Tekst primær | `text-text-primary` | Inline dato-label |
| Hairline border | `border-hairline` | Alle knap-borders |
| Rounded lg | `rounded-lg` | Alle knapper + container |
| Font inter | `font-inter` | Al knap-tekst |
| Text xs | `text-xs` | Pile + toggle + I dag-knap |
| Text sm | `text-sm` | Dato-label |
| Font medium | `font-medium` | Knap-tekst |
| Gap 3 / gap 1 | `gap-3`, `gap-1` | Root-container / pile-gruppe |
| px-3 py-2 | Spacing på mode-toggle-knapper |
| px-sm py-xs | `px-sm py-xs` | I dag-knap + dato-label |
| w-8 h-8 | `w-8 h-8` | Pile-knapper (32×32px) |
| min-w-[180px] | Inline dato-label min-bredde |
| Transition | `transition-colors` | Hover-animation |

## Visual Pattern Reference — matchet 1:1

| Pattern | Kilde | Status |
|---|---|---|
| Mode-toggle container | `VognmandGanttScreen.tsx:184` | Identisk |
| Mode-toggle knapper | `VognmandGanttScreen.tsx:185-198` | Identisk |
| Pile-knapper | `ProduktionsplanScreen.tsx:1001-1007` | Identisk |
| Inline dato-label | `ProduktionsplanScreen.tsx:1008-1010` | Identisk |
| I dag-knap | `ProduktionsplanScreen.tsx:1011-1016` | Identisk |
| Root container | `VognmandGanttScreen.tsx:182` | Identisk |

## Afvigelser fra SPEC

Ingen funktionelle afvigelser. Én layout-note:

**ProduktionsplanScreen bruger `gap-xxxs` (4px) på pile-gruppe** men SPEC beskriver `gap-1` (4px i Tailwind = 4×4 = 16px?). Faktisk er `gap-1` i Tailwind = 4px (0.25rem), og `gap-xxxs` i custom spacing = 4px. De er identiske i praksis. Valgt `gap-1` fordi SPEC udtrykkeligt angiver det, og det matcher komponentens interne logik.

**Touch target:** w-8 h-8 = 32×32px bevares som SPEC og Carsten har godkendt. JSDoc-kommentar tilføjet i komponenten med TODO.

## Hvad reviewer skal være opmærksom på

1. **`gap-1` vs `gap-xxxs`**: Begge = 4px. Ingen visuel forskel men `gap-1` er Tailwind-native, `gap-xxxs` er custom token. Begge er valid — reviewer bør bekræfte præference.
2. **Stories bruger `eslint-disable` på hooks-in-render**: Dette er standard Storybook-mønster for stateful stories. Der er ingen hook-violation i produktionskoden.
3. **`dateLabelPosition='none'`**: Render-logik er korrekt (`showDateLabel = dateLabel !== undefined && dateLabelPosition === 'inline'`), men der er ingen story der specifikt tester dette. Kan tilføjes hvis reviewer ønsker det.
4. **`onModeChange` er optional**: Hvis `modes` er sat men `onModeChange` er undefined, klikker mode-knapper uden effekt (`onModeChange?.(mode)`). Dette er intentionelt — caller ansvar.
