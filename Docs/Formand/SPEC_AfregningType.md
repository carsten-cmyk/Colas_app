# SPEC: Afregningstype (delt type + helper)

## Formål
Type-definition + utility til at afgøre om en chauffør (eller materiel-enhed) er på **time-afregning** eller **akkord** — styrer hvilke felter der vises i afregnings-formen.

## Filsti
`apps/formand/src/types/afregning.ts`

## Type-definition

```ts
// TODO: Erstat med Supabase når klar.
// Markering kommer fra vognmandens chauffør-aftale (vognmand-systemet).
// Hvis ikke leveret, falder vi tilbage til "time" — formand kan ændre i UI.
export type AfregningType = 'time' | 'akkord'

export interface ChauffoerAfregningSetup {
  /** Reg.nr på bilen (matcher confirmed_vehicles.regnr) */
  regnr: string
  /** Hvis vognmand har leveret typen, brug den. Ellers default = 'time'. */
  afregningType: AfregningType
  /** Om vognmand HAR oplyst typen, eller om det er fallback */
  kilde: 'vognmand' | 'fallback'
}

export interface AfregningTimer {
  /** Kun ved time-afregning */
  koeretimer?: number
  /** Ved begge typer */
  ventetid?: number
  /** Kun ved time-afregning */
  pause?: number
  /** Kun ved akkord */
  tonsKoert?: number
}

export interface ChauffoerAfregning {
  /** Reg.nr matcher confirmed_vehicles.regnr (Bestilte biler) */
  regnr: string
  /** Hvilken dag det gælder (matcher day.id) */
  dayId: string
  afregningType: AfregningType
  /** Værdier prædufyldt fra chauffør-app / PLAN vejebilag */
  timer: AfregningTimer
  /** Eventuel kommentar fra chauffør indtastet i chauffør-app */
  chauffoerKommentar?: string
  /** Status */
  godkendt: boolean
  /** Tidspunkt for godkendelse — "DD. mmm · HH:MM" eller ISO */
  godkendtTidspunkt?: string
  /** Hvem godkendte (formand-navn) */
  godkendtAf?: string
  /** Tidspunkt for genåbning hvis formand har genåbnet afregningen (sætter godkendt=false igen) */
  genaabnetTidspunkt?: string
}

export interface MaterielAfregning {
  /** Identificerer chaufføren der har kørt materiellet — én afregning per chauffør, IKKE per materiel-enhed */
  chauffoerKey: string  // fx "regnr+dayId" eller chauffør-id
  dayId: string
  /** Liste over materiel-enheder denne chauffør har kørt (kun til visning) */
  materielIds: string[]
  /** Materiel er ALTID time — ingen akkord. INGEN pause (pause er asfalt-specifikt). */
  timer: {
    koeretimer?: number
    ventetid?: number
  }
  chauffoerKommentar?: string
  godkendt: boolean
  godkendtTidspunkt?: string
  godkendtAf?: string
  /** Tidspunkt for genåbning hvis formand har genåbnet afregningen (sætter godkendt=false igen) */
  genaabnetTidspunkt?: string
}
```

## Helper-funktion

```ts
/**
 * Returnér afregningstype for en chauffør.
 * Fallback til 'time' hvis vognmand ikke har angivet typen.
 */
export function getAfregningType(
  setup: ChauffoerAfregningSetup | undefined
): { type: AfregningType; isFallback: boolean }
```

## Acceptance-kriterier
- Type-fil eksporteres fra `apps/formand/src/types/index.ts` (opret den hvis den mangler)
- Ingen `any`-typer
- Alle felter har JSDoc-kommentar
- TODO-kommentar ved Supabase-integration

## Tokens
N/A — kun typer.
