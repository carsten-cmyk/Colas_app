# Colas Driver App — Mappestruktur

## Teknologi
- React Native + Expo (Expo Router)
- Storybook til komponent-udvikling
- TypeScript

---

## Mappestruktur

```
src/
├── app/                              # Expo Router screens
│   ├── (auth)/
│   │   └── index.tsx                 # Welcome/Splash screen
│   ├── (app)/
│   │   ├── _layout.tsx               # Tab navigation layout
│   │   ├── index.tsx                 # Dashboard/Front screen
│   │   ├── tasks/
│   │   │   └── [id].tsx              # Opgave-detalje screen
│   │   ├── messages/
│   │   │   └── index.tsx             # Beskeder screen
│   │   ├── timelog/
│   │   │   └── index.tsx             # Timereg screen
│   │   └── contact/
│   │       └── index.tsx             # Kontakt screen
│   └── _layout.tsx
│
├── components/
│   ├── ui/                           # Generiske, genanvendelige UI-komponenter
│   │   ├── StatCard.tsx
│   │   ├── OrderMetrics.tsx
│   │   ├── LocationCard.tsx
│   │   ├── ContactCard.tsx
│   │   ├── AlertBanner.tsx
│   │   ├── ActionButton.tsx
│   │   └── ...
│   │
│   ├── screens/                      # Screen-specifikke sammensatte komponenter
│   │   ├── welcome/
│   │   │   ├── WelcomeHero.tsx
│   │   │   └── ActivitySummary.tsx
│   │   ├── dashboard/
│   │   │   ├── TaskCard.tsx
│   │   │   ├── TaskScroll.tsx
│   │   │   └── MessageWidget.tsx
│   │   └── task/
│   │       ├── TaskHeader.tsx
│   │       ├── TaskInfoTab.tsx
│   │       ├── TaskContactsTab.tsx
│   │       ├── TaskAlertTab.tsx
│   │       ├── TaskSwiper.tsx        # Horisontal scroll container
│   │       └── TaskActions.tsx       # Start/Pause/Afslut knapper
│   │
│   └── layout/
│       ├── BottomTabBar.tsx
│       └── ScreenHeader.tsx
│
├── hooks/
│   ├── useTask.ts
│   ├── useWeather.ts
│   └── usePhoneCall.ts
│
├── types/
│   ├── task.ts
│   ├── contact.ts
│   └── user.ts
│
├── styles/
│   └── tokens.ts                     # Design tokens (farver, spacing, typography)
│
└── lib/
    └── utils.ts                      # Delte utilities (cn(), formatters, osv.)
```

---

## Komponent-hierarki for Opgave-detalje

```
[id].tsx (screen)
└── TaskSwiper (horisontal scroll)
    ├── TaskInfoTab
    │   ├── TaskHeader (ordrenummer + luk)
    │   ├── OrderMetrics (ton, produkt, runder, timer)
    │   ├── LocationCard (afhentning)
    │   └── LocationCard (levering)
    ├── TaskContactsTab
    │   └── ContactCard[] (foto, navn, rolle, telefon)
    └── TaskAlertTab (vises kun hvis alert aktiv)
        └── AlertBanner
└── TaskActions (fast i bunden)
    ├── ActionButton (Start / Pause opgave)
    └── ActionButton (Afslut opgave)
```

---

## Screen States — Opgave-detalje

| State | Start-knap | Kontakter | Alert |
|---|---|---|---|
| Ikke startet | "Start opgave" (grå) | Skjult | Vises hvis aktiv |
| Startet | "Pause opgave" (gul) | Synlig | Vises hvis aktiv |
| Pause | "Start opgave" (grå) + gul overlay | - | - |
| Afsluttet | Ingen | - | - |
