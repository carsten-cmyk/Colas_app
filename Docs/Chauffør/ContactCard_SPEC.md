# ContactCard — Component Spec

## Kontekst
Read these files before starting:
- /docs/PRD.md — section 4.4 ContactCard
- /docs/STRUCTURE.md — folder conventions
- /styles/tokens.ts — design tokens (no hardcoded values)
- /src/mocks/tasks.ts — mock data
- /types/contact.ts — Contact interface

## Figma
[INDSÆT FIGMA LINK]

---

## Files to create
- `src/components/ui/ContactCard.tsx`
- `src/components/ui/ContactCard.stories.tsx`

---

## Component spec

```ts
export interface ContactCardProps {
  name: string
  role: string          // Vises under navn. Brug "-" hvis ingen rolle
  phone: string         // Format: "2399 1448" — vises med telefon-ikon
  imageUrl?: string     // Rundt foto. Fallback hvis undefined (se nedenfor)
  onPress?: () => void  // Overskriver default tel: adfærd hvis sat
}
```

## Visuel struktur (top → bund)
1. Rundt billede (cirkel crop) — fast størrelse fra tokens
2. Navn — kan være to linjer, centreret
3. Rolle — mindre tekst, muted farve, centreret
4. Telefon-række — telefon-ikon + nummer, klikbart

## Adfærd
- Tryk på kortet åbner `Linking.openURL('tel:' + phone)`
- Hvis `onPress` er sat bruges den i stedet
- Touch target: minimum 44x44px på telefon-rækken

## Billede fallback
- Hvis `imageUrl` er undefined eller fejler: vis neutral placeholder (grå cirkel med person-ikon)
- Brug `onError` på Image-komponenten til at håndtere fejlede URLs

## Data & mock
- Ingen hardcoded data i komponenten — kun props
- Mock-data fra /src/mocks/tasks.ts

---

## Storybook stories

| Story | Data |
|---|---|
| Med foto og rolle | Henrik Thor, Projektleder, foto-URL, 2399 1448 |
| Med foto, ingen rolle | Ole Jensen, "-", foto-URL, 2399 1443 |
| Uden foto (maskine/bygning) | Fabrik Køge, "-", billede-URL der er et maskine-foto |
| Ingen imageUrl | Fallback placeholder skal vises |
| Langt navn | "Hans Christian Andersen-Nielsen", "Projektleder og koordinator" |

---

## Må ikke
- Ingen hardcoded farver, spacing eller font sizes
- Ingen hover-only states (React Native)
- Ikke bygge ContactList/scroll container — kun det enkelte kort
