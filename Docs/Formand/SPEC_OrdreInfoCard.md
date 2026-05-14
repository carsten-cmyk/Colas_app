# SPEC: OrdreInfoCard

## Formål
Ét af de 4 statiske info-kort i Rad 1 af `DagsoverblikSection` (Areal i dag, Produkt, Tykkelse, Tons i dag). Viser en stor label-værdi-kombination med valgfri enhed og undertekst. Designen matcher de eksisterende status-bokse i Udførelse (Biler / Materiel / Forundersøgelse) — samme dimensioner og struktur.

## Filsti
`apps/formand/src/components/ui/OrdreInfoCard.tsx`

## Props

```ts
export interface OrdreInfoCardProps {
  /** Uppercase-label øverst — fx "AREAL I DAG" */
  label: string
  /** Hoved-værdi — string for at understøtte både tal og tekst ("SMA 11S", "5.420") */
  value: string
  /** Valgfri enhed der vises efter value — fx "m²", "mm", "t" */
  unit?: string
  /** Valgfri undertekst — fx "á 31.200 m²", "82101H" */
  subtekst?: string
  /** Valgfri ARIA label — falder tilbage til `${label} ${value} ${unit}` */
  ariaLabel?: string
}
```

## Layout

Matcher status-bokse i Udførelse (samme dimensioner som produkt-bokse i Planlægning):

```
┌────────────────────────────┐
│ AREAL I DAG                │   ← label (uppercase, lille)
│                            │
│ 5.420 m²                   │   ← value (stor) + unit (mindre)
│ á 31.200 m²                │   ← subtekst (lille, muted)
└────────────────────────────┘
```

- Wrapper: `flex flex-col gap-xxxs items-start min-w-[150px] px-sm py-xs rounded-xl border border-hairline bg-surface`
- Label: `text-xxs font-semibold tracking-wider uppercase text-text-secondary font-inter`
- Value-row: `flex items-baseline gap-xxs`
  - Value: `text-2xl font-semibold text-text-primary font-inter`
  - Unit: `text-sm text-text-secondary font-inter`
- Subtekst: `text-xs text-text-muted font-inter`

**Note om dimensioner:** Eksisterende status-bokse bruger `min-w-[150px]` — denne værdi videreføres for konsistens. Hvis vi senere ekstraherer et fælles `StatusBox`-mønster (sat på pause i denne iteration), erstattes denne komponent.

## Visuelle states

### 1. Default — alle felter sat
- Label, value, unit, subtekst — alle synlige

### 2. Uden enhed
- `unit` undefined → kun value vises

### 3. Uden subtekst
- `subtekst` undefined → kun label + value-row

### 4. Tom value
- `value=""` eller `"–"` → vis "–" som placeholder for "endnu ikke beregnet"
- Subtekst skjules valgfrit (parent beslutter)

## Tokens (ufravigelige)
- Baggrund: `bg-surface`
- Border: `border-hairline`
- Tekst: `text-text-primary`, `text-text-secondary`, `text-text-muted`
- Typografi: `font-inter`, `text-xxs`, `text-xs`, `text-sm`, `text-2xl`, `font-semibold`, `tracking-wider`, `uppercase`
- Spacing: `gap-xxxs`, `gap-xxs`, `px-sm`, `py-xs`
- Radius: `rounded-xl`
- Min-width: `min-w-[150px]`
- INGEN hardcodede farver eller pixel-størrelser udover `min-w-[150px]` (matcher eksisterende status-bokse)

## Eksisterende komponenter genbrugt
Ingen — atomar UI-komponent. Designen matcher manuelt de eksisterende status-bokse (Biler / Materiel / Forundersøgelse i `UdfoerselContent`).

**Fremtidigt:** Et fælles `StatusBox`/`InfoBox`-mønster kan ekstraheres når UX er låst — sat på pause i denne iteration. Notér i koden:
```ts
// TODO: Overvej at ekstrahere et fælles StatusBox-mønster sammen med
// status-bokse for Biler/Materiel/Forundersøgelse når layout er låst.
```

## Mock-data
Ikke relevant — alle data kommer fra props. Eksempel-usage:

```tsx
<OrdreInfoCard label="AREAL I DAG" value="5.420" unit="m²" subtekst="á 31.200 m²" />
<OrdreInfoCard label="PRODUKT" value="SMA 11S" subtekst="82101H" />
<OrdreInfoCard label="TYKKELSE" value="45" unit="mm" />
<OrdreInfoCard label="TONS I DAG" value="312" unit="t" subtekst="á 1.040 t" />
```

## Storybook stories (minimum)
1. `Areal i dag — med enhed og subtekst`
2. `Produkt — uden enhed, med kode-subtekst`
3. `Tykkelse — kun value+unit`
4. `Tons i dag — fuld variant`
5. `Tom — value="–"`

## Test-cases (skrives senere af test-writer)
- Renderer label, value, unit, subtekst når alle sat
- Skjuler unit når undefined
- Skjuler subtekst når undefined
- ARIA-label falder tilbage til samlet string hvis ikke eksplicit sat
- Kun token-klasser i className

## Accessibility
- `aria-label` på wrapper med samlet beskrivelse hvis ikke struktureret tilgængelig
- Label vises visuelt OG til screen reader — ingen `aria-hidden`

## Acceptance-kriterier
- Props eksporteret som `OrdreInfoCardProps`
- Ingen `any`-typer
- Kun tokens — ingen hardcodede farver/spacing (undtagen `min-w-[150px]`)
- Stil matcher eksisterende status-bokse — verifier visuelt i Storybook
- Ren visnings-komponent — ingen interaktion eller state
