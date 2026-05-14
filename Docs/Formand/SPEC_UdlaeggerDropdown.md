# SPEC: UdlaeggerDropdown

> **Opdateret 2026-05-14**: Feltnavne følger eksisterende prototype-konvention
> (`anlaegsNr` ikke `materielNr`). Typen `UdlaeggerEnhed` lever i `src/types/udlaegger.ts`.

## Formål
Native `<select>`-dropdown der lader formanden vælge hvilken udlægger en ankommen vejeseddel skal hældes i. Listen filtreres til materiel med materielnummer-prefix `9-` (udlægger-konventionen). Kun aktiv på ankomne rækker — disabled på undervejs/på-vej-til-fabrik-rækker.

## Filsti
`apps/formand/src/components/ui/UdlaeggerDropdown.tsx`

## Props

```ts
export interface UdlaeggerEnhed {
  /** Anlægsnummer fra PLAN — fx "9-0009" */
  anlaegsNr: string
  /** Beskrivelse fra PLAN — fx "VÖGELE 1900-3I" */
  beskrivelse: string
}

export interface UdlaeggerDropdownProps {
  /** Hele udlægger-listen på ordren — filtreres internt på anlaegsNr-prefix "9-" */
  udlaeggerliste: UdlaeggerEnhed[]
  /** Aktuelt valgt udlægger-anlægsnummer — null = intet valgt */
  selected: string | null
  /** Kald når formand vælger en udlægger */
  onChange: (anlaegsNr: string) => void
  /** Disable hele dropdownen (fx for undervejs-/på-vej-til-fabrik-rækker) */
  disabled?: boolean
  /** Valgfri placeholder-tekst */
  placeholder?: string
}
```

## Layout

```
┌──────────────────────────────────────┐
│ Vælg udlægger ▾                      │     ← placeholder/value
└──────────────────────────────────────┘
```

- Wrapper: ingen — `<select>` renderes direkte
- `<select>`: `w-full max-w-[200px] px-xs py-xxxs rounded-md border border-hairline bg-surface text-sm text-text-primary font-inter`
- `min-h-[44px]` for touch target
- `disabled:bg-surface-2 disabled:text-text-muted disabled:cursor-not-allowed`
- Focus: `focus-visible:ring-2 focus-visible:ring-yellow`

## Visuelle states

### 1. Tom — intet valgt, aktiv
- Vis placeholder som første `<option value="" disabled selected>`
- Default placeholder: `"Vælg udlægger"`

### 2. Valgt
- Vis valgt materiel som `{anlaegsNr} · {beskrivelse}` i selectens visible value

### 3. Disabled (`disabled=true`)
- Grå baggrund + grå tekst
- Tooltip valgfri (`title="Tilgængelig når læsset er ankommet"`)

### 4. Tom liste (ingen udlæggere på ordren)
- Vis en disabled placeholder-option: `"Ingen udlæggere registreret"`
- `<select>` er disabled

## Filtrerings-logik

Internt i komponenten:

```ts
const udlaeggere = udlaeggerliste.filter(m => m.anlaegsNr.startsWith('9-'))
```

- Filteret er rent visuelt — parent kan stadig give hele listen
- Hvis ingen materiel matcher prefix, vis "Ingen udlæggere registreret"-state

## Tokens (ufravigelige)
- Baggrund: `bg-surface`, `bg-surface-2` (disabled)
- Tekst: `text-text-primary`, `text-text-muted`
- Border: `border-hairline`
- Focus: `ring-yellow`
- Typografi: `font-inter text-sm`
- Spacing: `px-xs py-xxxs`
- Radius: `rounded-md`
- Width: `w-full max-w-[200px]`
- Touch: `min-h-[44px]`

## Eksisterende komponenter genbrugt
Ingen — atomar UI-komponent. Native `<select>` (ingen custom popover).

## Mock-data
Ikke relevant — alle data kommer fra props. Eksempel-data:

```ts
// TODO: Erstat med Supabase når klar — kommer fra orders.udlaeggerliste[]
const MOCK_UDLAEGGERLISTE: UdlaeggerEnhed[] = [
  { anlaegsNr: '9-0009', beskrivelse: 'VÖGELE 1900-3I' },
  { anlaegsNr: '9-0012', beskrivelse: 'VÖGELE Super 1800-3i' },
  { anlaegsNr: '7-0044', beskrivelse: 'HAMM HD10 VT' }, // filtreres væk
]
```

## Storybook stories (minimum)
1. `Tom — afventer valg`
2. `Valgt — 9-0009`
3. `Disabled — ankommet endnu ikke`
4. `Tom liste — ingen udlæggere på ordren`
5. `Lang liste — 5+ udlæggere`

## Test-cases (skrives senere af test-writer)
- Filtrerer kun materiel med prefix `9-`
- `onChange` kaldes med korrekt `anlaegsNr` ved valg
- `disabled=true` blokerer interaktion
- Tom liste viser "Ingen udlæggere registreret"-disabled state
- Placeholder vises som disabled første option
- `min-h-[44px]` på `<select>` for touch

## Accessibility
- `<label>` med synlig eller `aria-label` "Vælg udlægger for læsset"
- Native `<select>` har indbygget keyboard-support
- Disabled-state markeres med `aria-disabled` (browser sætter dette automatisk fra `disabled`-attribut)

## Acceptance-kriterier
- Props eksporteret som `UdlaeggerDropdownProps`
- Ingen `any`-typer
- Kun tokens — ingen hardcodede farver
- Filtrerings-logik er ren funktion (test-bar)
- Disabled-state synlig og blokerer interaktion
- Native `<select>` — ingen custom popover/dropdown-bibliotek
