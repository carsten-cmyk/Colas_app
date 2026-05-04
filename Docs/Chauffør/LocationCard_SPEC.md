# LocationCard — Component Spec

## Kontekst
Read these files before starting:
- /docs/PRD.md — section 4.3 LocationCard
- /docs/STRUCTURE.md — folder conventions
- /styles/tokens.ts — design tokens (no hardcoded values)
- /src/mocks/tasks.ts — mock data
- /types/task.ts — Location interface

## Figma
[INDSÆT FIGMA LINK]

---

## Files to create
- `src/components/ui/LocationCard.tsx`
- `src/components/ui/LocationCard.stories.tsx`

---

## Component spec

```ts
export interface LocationCardProps {
  name: string           // "Køge Asfaltfabrik"
  address: string        // "Nordhavnsvej 9, 4600 Køge"
  meetingTime?: string   // "05.30" — vises kun hvis sat (pickup)
  type: 'pickup' | 'delivery'
}
```

## Visuel struktur
- Hvidt kort med let border/shadow
- Venstre side: location-pin ikon + navn (bold) + adresse (muted, mindre)
- Højre side (kun hvis `meetingTime` sat): label "Mødetid" øverst, tid bold og stor nedenunder
- Navn og adresse fylder venstre kolonne — højre kolonne kun ved meetingTime

## Adfærd
- Map-ikon (fx pin/kort ikon) på kortet — tryk åbner Google Maps med adressen
- Brug `Linking.openURL('https://maps.google.com/?q=' + encodeURIComponent(address))`
- Touch target på map-ikonet minimum 44x44px
- Selve kortet er ikke klikbart — kun map-ikonet

## Data & mock
- Ingen hardcoded data i komponenten — kun props
- Mock-data fra /src/mocks/tasks.ts

---

## Storybook stories

| Story | Data |
|---|---|
| Pickup med mødetid | "Køge Asfaltfabrik", "Nordhavnsvej 9, 4600 Køge", meetingTime: "05.30" |
| Delivery uden mødetid | "Uddannelsescenter Syd", "Søvej 6 D, 4900 Nakskov", ingen meetingTime |
| Langt navn | Meget langt lokationsnavn — skal ikke overlappe mødetid |
| Lang adresse | To-linje adresse |

---

## Må ikke
- Ingen hardcoded farver, spacing eller font sizes
- Ikke bygge transport-ikonet mellem de to kort — det er en separat komponent
- Ikke bygge LocationList — kun det enkelte kort
