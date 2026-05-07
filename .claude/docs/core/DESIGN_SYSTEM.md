# Design System — Colas Transport Apps

Design tokens er defineret i `apps/formand/tailwind.config.ts` (web) og `apps/chauffeur/src/config/theme.js` (mobil).
Tokens er **frosne** — ingen nye værdier uden eksplicit godkendelse.

---

## Farvepalette

### Brand
| Token | Tailwind | Hex | Brug |
|---|---|---|---|
| Gul (primær) | `bg-yellow` | `#FEEE32` | Aktiv tilstand, CTA, highlight — én ting per skærm |
| Mørk teal | `bg-dark-teal` | `#0E4764` | TopBar, BottomTabBar, modal-header |
| Dyb teal | `bg-deep-teal` | `#0B3950` | Sektionsbaggrund, dark surfaces |
| Lys aqua | `bg-light-aqua` | `#A0C7D7` | Sekundære badges, borders |

### Neutral lag (v2 — desktop/content areas)
| Token | Tailwind | Hex | Brug |
|---|---|---|---|
| Page | `bg-page` | `#FAFAFA` | Sidebaggrund |
| Surface | `bg-surface` | `#FFFFFF` | Kort, paneler |
| Surface-2 | `bg-surface-2` | `#F5F5F5` | Sektionswash, segmented controls |
| Hairline | `border-hairline` | `#E8E8E8` | Standard kortborder |
| Hairline-2 | `border-hairline-2` | `#DEDEDE` | Hover-border, dashed borders |

### Status — semantisk (v2, brug i nye komponenter)
| Token | Tailwind | Hex | Brug |
|---|---|---|---|
| Good | `text-good` | `#1F8A5B` | Succes-tekst, ikon |
| Good-bg | `bg-good-bg` | `#E7F4EE` | Succes-baggrund |
| Bad | `text-bad` | `#C8372D` | Fejl-tekst, ikon |
| Bad-bg | `bg-bad-bg` | `#FBECEA` | Fejl-baggrund |
| Warn-bg | `bg-warn-bg` | `#FFF6CC` | Advarselsbaggrund |

### Status — legacy (beholdes, brug i eksisterende komponenter)
| Token | Tailwind | Hex |
|---|---|---|
| Success | `bg-success` | `#CAE6E3` |
| Error | `text-error` / `bg-error` | `#F04E4E` |
| Warning | `bg-warning` | `#FAEF68` |

### Baggrunde (legacy)
| Token | Tailwind | Hex |
|---|---|---|
| Soft aqua | `bg-soft-aqua` | `#F0F7FA` |
| Soft gray | `bg-soft-gray` | `#F8F8F8` |

### Tekst
| Token | Tailwind | Hex | Brug |
|---|---|---|---|
| Primær | `text-text-primary` | `#1D1D1D` | Overskrifter, vigtig tekst |
| Sekundær | `text-text-secondary` | `#2B2B2B` | Brødtekst |
| Muted | `text-text-muted` | `#717182` | Labels, metadata |

### Lines
| Token | Tailwind | Hex |
|---|---|---|
| Box outline | `border-box-outline` | `#EDEDED` |
| Divider strong | `border-divider-strong` | `#C4C4C4` |

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

// Uppercase label
<span className="font-inter text-xxs font-medium text-text-muted uppercase tracking-widest" />

// Tabeltal (tabular-nums)
<span className="font-poppins font-semibold tabular-nums" />
```

Font-skala: xxs=10px, xs=12px, sm=14px, md=16px, lg=20px, xl=24px, 2xl=30px

---

## Spacing

xxs=2px, xxxs=4px, xs=8px, sm=16px, md=24px, lg=32px
Brug: `p-sm`, `gap-xs`, `mt-md` osv.

## Border-radius

sm=4px, md=8px, lg=12px, xl=16px, 2xl=20px

## Layout (web desktop)

```tsx
// To-kolonne side (OrdrePlan-pattern)
<div className="max-w-[1280px] mx-auto px-md py-lg grid grid-cols-[280px_1fr] gap-lg">
  <aside>...</aside>
  <main>...</main>
</div>

// Responsiv: enkelt kolonne under 980px
// Tailwind: add responsive breakpoint i tailwind.config.ts hvis nødvendigt
```

---

## Komponenter — copy-paste patterns

### Kort (standard)
```tsx
<div className="bg-surface rounded-lg border border-hairline shadow-md p-sm">
  <h3 className="font-poppins text-md font-semibold text-text-primary mb-xxxs">Titel</h3>
  <p className="font-inter text-sm text-text-secondary">Beskrivelse</p>
</div>
```

### Spec-grid (4 fakta-felter)
```tsx
<div className="bg-surface border border-hairline rounded-xl overflow-hidden
                grid grid-cols-4 divide-x divide-hairline">
  <div className="p-sm">
    <span className="font-inter text-xxs font-medium text-text-muted uppercase tracking-widest block mb-xxxs">Tons</span>
    <span className="font-poppins text-xl font-semibold text-text-primary tabular-nums">752<small className="text-xs font-medium text-text-muted ml-xxxs">t</small></span>
  </div>
  {/* gentag per felt */}
</div>
```

### Produkt-tabs (v2)
```tsx
<div className="inline-flex gap-xs">
  <button aria-pressed="false"
    className="bg-surface border border-hairline rounded-xl px-sm py-xs
               flex flex-col gap-xxxs min-w-[170px] transition-all
               hover:border-hairline-2">
    <span className="font-poppins font-semibold text-lg text-text-primary tabular-nums">23001B</span>
    <span className="font-inter text-xs text-text-muted">200 t · 19/3 – 20/3</span>
  </button>
  <button aria-pressed="true"
    className="bg-deep-teal border border-deep-teal rounded-xl px-sm py-xs
               flex flex-col gap-xxxs min-w-[170px]">
    <span className="font-poppins font-bold text-lg text-white tabular-nums">82101H</span>
    <span className="font-inter text-xs text-white/70">752 t · 16/3 – 18/3</span>
  </button>
</div>
```

### Dag-pill (v2 — med Forventet/Morgen)
```tsx
// Aktiv dag
<div className="relative bg-surface border-2 border-text-primary rounded-xl
                w-[140px] p-sm flex flex-col gap-xs">
  {/* "I dag" badge */}
  <span className="absolute -top-[10px] right-xs bg-text-primary text-white
                   font-inter text-xxs font-semibold px-xs py-[2px] rounded-full uppercase tracking-wider">
    I dag
  </span>
  <div className="flex justify-between items-center">
    <span className="font-inter text-xxs font-medium text-text-muted uppercase tracking-widest">Mandag</span>
    <span className="font-inter text-xs font-semibold text-text-secondary tabular-nums">16/3</span>
  </div>
  <div>
    <span className="font-inter text-xxs text-text-muted uppercase tracking-widest block">Forventet</span>
    <input className="font-poppins font-semibold text-xl text-text-primary bg-transparent
                      border-none outline-none w-full tabular-nums" defaultValue="250" />
  </div>
  <hr className="border-hairline" />
  <div>
    <span className="font-inter text-xxs text-text-muted uppercase tracking-widest block">Morgen</span>
    <input className="font-poppins font-semibold text-xl text-deep-teal bg-transparent
                      border-none outline-none w-full tabular-nums" placeholder="–" />
  </div>
</div>
```

### Status-badge (v2)
```tsx
// Planlagt / ok
<span className="inline-flex items-center gap-xxxs bg-good-bg text-good
                 font-inter font-semibold text-xs px-xs py-xxxs rounded-md border border-transparent">
  <span className="w-[6px] h-[6px] rounded-full bg-current" />
  Planlagt
</span>
// Ikke planlagt / bad
<span className="inline-flex items-center gap-xxxs bg-bad-bg text-bad
                 font-inter font-semibold text-xs px-xs py-xxxs rounded-md border border-bad/20">
  <span className="w-[6px] h-[6px] rounded-full bg-current" />
  Ikke planlagt
</span>
```

### Tabel-kort (materiel/transport)
```tsx
<div className="bg-surface border border-hairline rounded-xl overflow-hidden">
  {/* Række */}
  <div className="grid grid-cols-[36px_1fr_140px_110px_32px] items-center gap-md
                  px-sm py-[14px] border-b border-hairline hover:bg-surface-2 transition-colors">
    <div className="w-8 h-8 rounded-md bg-surface-2 flex items-center justify-center text-deep-teal">
      <TruckIcon size={16} />
    </div>
    <div>
      <span className="font-inter text-sm font-medium text-text-primary block">HAMM HD10 VT</span>
      <span className="font-inter text-xs text-text-muted tabular-nums">5-0034</span>
    </div>
    <span className="font-inter text-xs font-medium bg-surface-2 text-text-secondary
                     px-xs py-xxxs rounded-md">Blokvogn</span>
    {/* status badge */}
    <button className="text-text-muted hover:text-text-primary hover:bg-surface-2
                       p-xxxs rounded-md transition-colors">
      <Trash2Icon size={14} />
    </button>
  </div>
  {/* Tilføj-række */}
  <button className="w-full flex items-center justify-center gap-xs py-xs
                     font-inter text-sm text-text-muted border-t border-hairline
                     bg-surface-2 hover:bg-hairline transition-colors">
    <PlusIcon size={14} />
    Tilføj materiel
  </button>
</div>
```

### Sticky action bar (v2)
```tsx
<div className="sticky bottom-0 px-md py-sm
                bg-page/85 backdrop-blur-md backdrop-saturate-[140%]
                border-t border-hairline
                flex items-center justify-between gap-md z-40">
  <div className="font-inter text-sm text-text-muted">
    <b className="text-text-primary font-semibold tabular-nums">752 t</b> fordelt
  </div>
  <div className="flex gap-xs">
    <button className="font-inter text-sm font-semibold text-text-secondary
                       px-sm py-xs rounded-lg hover:bg-surface-2 transition-colors">
      Gem kladde
    </button>
    <button className="bg-yellow text-deep-teal font-inter font-semibold text-sm
                       px-sm py-xs rounded-lg hover:brightness-95 transition-all">
      Beregn køreplan
    </button>
  </div>
</div>
```

### Primær knap (CTA)
```tsx
<button className="bg-yellow text-text-primary font-inter font-semibold text-sm
                   px-sm py-xs rounded-lg min-h-[44px]
                   hover:brightness-95 transition-all active:scale-[0.98]">
  Handling
</button>
```

### Sekundær knap
```tsx
<button className="bg-surface-2 border border-hairline text-text-primary
                   font-inter font-semibold text-sm px-sm py-xs rounded-lg
                   min-h-[44px] hover:border-hairline-2 transition-colors">
  Annuller
</button>
```

### Loading state
```tsx
<div className="flex items-center justify-center py-md">
  <div className="w-8 h-8 rounded-full border-2 border-hairline border-t-dark-teal animate-spin" />
</div>
```

### Error state
```tsx
<div className="bg-bad-bg border border-bad/20 rounded-xl p-sm flex items-start gap-xs" role="alert">
  <span className="text-bad font-inter text-sm font-semibold">Fejl</span>
  <p className="font-inter text-sm text-text-secondary">{errorMessage}</p>
</div>
```

### Offline-indikator
```tsx
<div className="fixed top-0 left-0 right-0 bg-warn-bg text-text-primary
                font-inter text-xs font-semibold text-center py-xxxs z-[100]"
     role="alert" aria-live="polite">
  Ingen forbindelse — viser gemte data
</div>
```

---

## Tilgængelighed

- `text-white` på `bg-deep-teal`: 9.7:1 — OK
- `text-text-primary` på `bg-surface`: 15.3:1 — OK
- `text-good` på `bg-good-bg`: 4.6:1 — OK (borderline, kun til sekundær info)
- `text-bad` på `bg-bad-bg`: 5.2:1 — OK
- `text-text-muted` på `bg-surface`: 4.6:1 — kun sekundær info
- Touch targets: altid `min-h-[44px] min-w-[44px]`
- Fokus-ring: `focus:ring-2 focus:ring-dark-teal/30`
- Ikoner med funktion: `aria-label="..."`

---

## Aldrig gøre

```tsx
style={{ color: '#0B3950' }}   // brug text-deep-teal
style={{ padding: 16 }}        // brug p-sm
className="bg-[#FEEE32]"       // brug bg-yellow
className="bg-[#1F8A5B]"       // brug text-good / bg-good-bg
```
