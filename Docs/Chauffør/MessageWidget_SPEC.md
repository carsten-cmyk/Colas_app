# MessageWidget — Component Spec

## Kontekst
Read these files before starting:
- apps/chauffeur/styles/tokens.ts
- apps/chauffeur/docs/STRUCTURE.md

## Figma
[INDSÆT FIGMA LINK]

---

## Files to create
- `src/components/ui/MessageWidget.tsx`
- `src/components/ui/MessageWidget.stories.tsx`

---

## Component spec

```ts
export interface MessageWidgetProps {
  count: number              // Antal beskeder — vises som "1 Besked"
  onPress: () => void        // Navigation til Beskeder-tab
}
```

## Visuel struktur
- Gul baggrund (token: color-brand-yellow)
- Konvolut/mail ikon centreret øverst
- Tekst: "{count} Besked" eller "{count} Beskeder" (plural håndtering)
- Afrundede hjørner fra tokens
- Fylder sin grid-celle (samme størrelse som ProjectImage)

## Adfærd
- Hele widgetten er klikbar — kalder onPress
- Touch target fylder hele fladen

## Storybook stories
| Story | Data |
|---|---|
| 1 besked | count: 1 — viser "1 Besked" |
| Flere beskeder | count: 3 — viser "3 Beskeder" |
| Ingen beskeder | count: 0 — viser "0 Beskeder" |

---

## Må ikke
- Ingen hardcoded farver eller spacing
- Ikke hardcode "Besked" teksten — håndter singular/plural
