# BottomTabBar — Component Spec

## Kontekst
Read these files before starting:
- /docs/STRUCTURE.md — folder conventions
- /styles/tokens.ts — design tokens (no hardcoded values)

## Figma
[INDSÆT FIGMA LINK]

---

## Files to create
- `src/components/layout/BottomTabBar.tsx`
- `src/components/layout/BottomTabBar.stories.tsx`

---

## Component spec

```ts
export type TabName = 'start' | 'opgaver' | 'beskeder' | 'timereg' | 'kontakt'

export interface TabItem {
  name: TabName
  label: string        // "Start", "Opgaver" osv.
  icon: ReactNode      // Outline ikon (inaktiv) — se ikoner nedenfor
}

export interface BottomTabBarProps {
  activeTab: TabName
  onTabPress: (tab: TabName) => void
}
```

## Tabs (venstre → højre)

| Name | Label | Ikon |
|---|---|---|
| `start` | Start | Hus/home outline |
| `opgaver` | Opgaver | Lastbil outline |
| `beskeder` | Beskeder | Konvolut/mail outline |
| `timereg` | Timereg | Ur/clock outline |
| `kontakt` | Kontakt | Telefon outline |

Brug ikoner fra `@expo/vector-icons` (Ionicons eller MaterialCommunityIcons) — match så tæt på mockup som muligt.

## Visuel struktur
- Fast baggrund: mørk teal (token: color-background-dark)
- Fuld bredde, fast højde fra tokens
- 5 tabs ligeligt fordelt
- Per tab: ikon øverst, label nedenunder
- Safe area padding i bunden (iOS home indicator)

## Aktiv state
- Ikon: hvid (samme som inaktiv)
- Label: hvid (samme som inaktiv)
- Markering: 4px gul streg (token: color-brand-yellow) direkte under label-teksten
- Inaktiv: ikon + tekst i muted hvid (reduceret opacity fra tokens)

## Adfærd
- Touch target minimum 44x44px per tab
- Ingen animation i første version
- Kalder `onTabPress(name)` ved tryk

## Storybook stories

| Story | Data |
|---|---|
| Start aktiv | activeTab: "start" |
| Opgaver aktiv | activeTab: "opgaver" |
| Beskeder aktiv | activeTab: "beskeder" |
| Timereg aktiv | activeTab: "timereg" |
| Kontakt aktiv | activeTab: "kontakt" |

---

## Må ikke
- Ingen hardcoded farver, spacing eller font sizes
- Ikke koble til Expo Router navigation — kun UI-komponent med onTabPress callback
- Ingen animation endnu
