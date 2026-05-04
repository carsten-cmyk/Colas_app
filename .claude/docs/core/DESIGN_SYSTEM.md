# Design System — Colas Transport Apps

Design tokens er defineret i `apps/formand/tailwind.config.ts` (web) og `apps/chauffeur/src/styles/tokens.ts` (mobil).
Tokens er **frosne** — ingen nye værdier uden eksplicit godkendelse.

---

## Farvepalette

| Token | Tailwind-klasse | Hex | Brug |
|---|---|---|---|
| Gul (primær) | `bg-yellow` / `text-yellow` | `#FEEE32` | Aktiv tilstand, CTA, highlight |
| Mørk teal (nav/header) | `bg-dark-teal` | `#0E4764` | TopBar, BottomTabBar, modal-header |
| Dyb teal (baggrund) | `bg-deep-teal` | `#0B3950` | Page-baggrund, sektionsbaggrund |
| Lys aqua | `bg-light-aqua` | `#A0C7D7` | Sekundære badges, borders |
| Soft aqua | `bg-soft-aqua` | `#F0F7FA` | Kortbaggrund, input-baggrund |
| Soft gray | `bg-soft-gray` | `#F8F8F8` | Sidens baggrund |
| Success | `bg-success` | `#CAE6E3` | Gennemført, ok-status |
| Error | `bg-error` / `text-error` | `#F04E4E` | Fejl, kritisk, slet |
| Warning | `bg-warning` | `#FAEF68` | Advarsel, bemærk |
| Box outline | `border-box-outline` | `#EDEDED` | Kortborder |
| Divider | `border-divider-strong` | `#C4C4C4` | Sektionsskillelinje |
| Tekst primær | `text-text-primary` | `#1D1D1D` | Overskrifter, vigtig tekst |
| Tekst sekundær | `text-text-secondary` | `#2B2B2B` | Brødtekst |
| Tekst muted | `text-text-muted` | `#717182` | Labels, metadata |

---

## Typografi

```tsx
// Overskrifter — Poppins
<h1 className="font-poppins text-2xl font-bold text-text-primary" />
<h2 className="font-poppins text-xl font-semibold text-text-primary" />
<h3 className="font-poppins text-lg font-semibold text-text-primary" />

// Brødtekst — Inter
<p className="font-inter text-md text-text-secondary" />
<span className="font-inter text-sm text-text-muted" />
<span className="font-inter text-xs text-text-muted" />
<span className="font-inter text-xxs text-text-muted" />  // 10px — kun metadata
```

Font-skala: xxs=10px, xs=12px, sm=14px, md=16px, lg=20px, xl=24px, 2xl=30px

---

## Spacing

xxs=2px, xxxs=4px, xs=8px, sm=16px, md=24px, lg=32px
Brug: `p-sm`, `gap-xs`, `mt-md` osv.

## Border-radius

sm=4px, md=8px, lg=12px, xl=16px, 2xl=20px

---

## Komponenter — copy-paste patterns

### Kort (standard)
```tsx
<div className="bg-white rounded-lg border border-box-outline shadow-md p-sm">
  <h3 className="font-poppins text-md font-semibold text-text-primary mb-xxxs">Titel</h3>
  <p className="font-inter text-sm text-text-secondary">Beskrivelse</p>
</div>
```

### Stat-kort
```tsx
<div className="bg-soft-aqua rounded-lg p-sm flex flex-col gap-xxxs min-w-[80px]">
  <span className="font-poppins text-xl font-bold text-dark-teal">180t</span>
  <span className="font-inter text-xs text-text-muted">Leveret</span>
</div>
```

### Primær knap (CTA)
```tsx
<button className="bg-yellow text-text-primary font-inter font-semibold text-sm
                   px-sm py-xs rounded-lg min-h-[44px] min-w-[44px]
                   hover:brightness-95 transition-all active:scale-[0.98]">
  Handling
</button>
```

### Sekundær knap
```tsx
<button className="bg-soft-aqua border border-box-outline text-text-primary
                   font-inter font-semibold text-sm px-sm py-xs rounded-lg
                   min-h-[44px] hover:bg-light-aqua/30 transition-colors">
  Annuller
</button>
```

### Status-badge
```tsx
// Aktiv
<span className="bg-success text-dark-teal font-inter font-semibold text-xs px-xs py-xxxs rounded-sm">Kører</span>
// Venter
<span className="bg-warning text-text-primary font-inter font-semibold text-xs px-xs py-xxxs rounded-sm">Venter</span>
// Afsluttet
<span className="bg-soft-gray border border-box-outline text-text-muted font-inter font-semibold text-xs px-xs py-xxxs rounded-sm">Afsluttet</span>
// Fejl
<span className="bg-error/10 text-error font-inter font-semibold text-xs px-xs py-xxxs rounded-sm border border-error/20">Problem</span>
```

### Progress-bar (tons)
```tsx
<div className="flex flex-col gap-xxxs">
  <div className="flex justify-between">
    <span className="font-inter text-xs text-text-muted">Leveret i dag</span>
    <span className="font-inter text-xs font-semibold text-text-primary">180t / 250t</span>
  </div>
  <div className="h-[6px] bg-soft-aqua rounded-sm overflow-hidden">
    <div className="h-full bg-dark-teal rounded-sm transition-all" style={{ width: `${(180/250)*100}%` }} />
  </div>
</div>
```

### Input-felt
```tsx
<div className="flex flex-col gap-xxxs">
  <label className="font-inter text-sm font-semibold text-text-primary">Label</label>
  <input
    type="text"
    className="w-full px-sm py-xs bg-white border border-box-outline rounded-md
               font-inter text-md text-text-primary
               focus:outline-none focus:ring-2 focus:ring-dark-teal/30
               placeholder:text-text-muted"
    placeholder="Indtast..."
  />
</div>
```

### Loading state
```tsx
<div className="flex items-center justify-center py-md">
  <div className="w-8 h-8 rounded-full border-2 border-light-aqua border-t-dark-teal animate-spin" />
</div>
```

### Error state
```tsx
<div className="bg-error/10 border border-error/20 rounded-lg p-sm flex items-start gap-xs" role="alert">
  <span className="text-error font-inter text-sm font-semibold">Fejl</span>
  <p className="font-inter text-sm text-text-secondary">{errorMessage}</p>
</div>
```

### Offline-indikator
```tsx
// Vises når navigator.onLine === false
<div className="fixed top-0 left-0 right-0 bg-warning text-text-primary
                font-inter text-xs font-semibold text-center py-xxxs z-[100]"
     role="alert" aria-live="polite">
  Ingen forbindelse — viser gemte data
</div>
```

---

## Tilgængelighed

- `text-white` på `bg-dark-teal`: 9.7:1 — OK
- `text-text-primary` på `bg-soft-aqua`: 13.2:1 — OK
- `text-text-muted` på `bg-white`: 4.6:1 — kun sekundær info
- Touch targets: altid `min-h-[44px] min-w-[44px]`
- Fokus-ring: `focus:ring-2 focus:ring-dark-teal/30`
- Ikoner med funktion: `aria-label="..."`

---

## Aldrig gøre

```tsx
style={{ color: '#0B3950' }}   // brug text-deep-teal
style={{ padding: 16 }}        // brug p-sm
className="bg-[#FEEE32]"       // brug bg-yellow
```
