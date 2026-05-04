# TaskSheet — Component Spec

## Kontekst
Read these files before starting:
- /docs/PRD.md
- /docs/STRUCTURE.md — folder conventions
- /styles/tokens.ts — design tokens (no hardcoded values)

## Figma
[INDSÆT FIGMA LINK]

---

## Files to create
- `src/components/layout/TaskSheet.tsx`
- `src/components/layout/TaskSheet.stories.tsx`

---

## Component spec

```ts
export interface TaskSheetProps {
  orderNumber: string       // "Ordrenummer 1212343"
  onClose: () => void       // X-knap lukker sheet
  children: ReactNode       // Indhold — komponenter per tab
  visible: boolean          // Styrer om sheet er synlig
}
```

## Visuel struktur
- Lysblå baggrund (token: color-background-sheet)
- Afrundede hjørner øverst (token: border-radius-sheet)
- Dækker ~95% af skærmhøjden — BottomTabBar synlig nedenunder
- Mørk teal baggrund (token: color-background-dark) skinner igennem i toppen og siderne
- Header: ordrenummer tekst venstre, X-knap højre — fast øverst
- Scrollbart indhold nedenunder headeren
- Ingen shadow/elevation — clean kant mod baggrund

## Animation
- Brug `react-native-reanimated`
- Trigger: `visible` prop skifter fra false → true
- Ind: sheet slides op fra bunden + let fade in (duration: ~300ms, easing: easeOut)
- Ud: slides ned + fade out ved X-knap tryk, kalder `onClose` når animation er færdig
- Starter fra position svarende til TaskCard position på dashboard (Y-offset)

## X-knap
- Placeret øverst til højre i headeren
- Touch target minimum 44x44px
- Kalder `onClose` — navigation håndteres af forælderen

## Adfærd
- Baggrunden (dashboard) er ikke interaktiv mens sheet er åben
- Swipe-ned for at lukke: nice-to-have, ikke krav i denne version

## Genanvendelse
TaskSheet bruges på alle skærme med lysblå overlay-layout:
- Opgave-detalje (ikke startet)
- Opgave-startet
- Opgave-pause

## Storybook stories

| Story | Data |
|---|---|
| Default åben | orderNumber: "Ordrenummer 1212343", children: placeholder tekst |
| Med indhold | orderNumber synlig, children: OrderMetrics mock |
| Tom | Kun header synlig |

---

## Må ikke
- Ingen hardcoded farver, spacing eller font sizes
- Ikke håndtere navigation direkte — kun kalde onClose callback
- Ikke bygge tab-indhold — kun wrapper og header
