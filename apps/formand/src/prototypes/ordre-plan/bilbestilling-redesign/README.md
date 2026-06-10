# Handoff: Planlæg kørsel (Plan Route)

## Overview

This design is a **route planning interface** for the Colas fleet management system. It allows dispatchers to:
- Select a carrier (vognmand) and billing method
- Choose and configure vehicles from the carrier's fleet
- View capacity requirements and recommendations
- Set departure times and intervals for products
- Configure product-to-product coupling (direct sequence or separate scheduling)
- Add notes for drivers

The interface calculates total tonnage, vehicle recommendations, and expected completion times based on factory location, round-trip time, and product weight.

## About the Design Files

The files in this bundle are **design references created in HTML** — high-fidelity interactive mockups showing intended look, layout, and behavior. They are **not production code** meant to be used directly. 

The task is to **recreate this design in your target environment** (React, Vue, backend templating, native app, etc.) using your existing design system, libraries, and code patterns. The HTML files serve as a pixel-perfect visual and interaction reference.

## Fidelity

**High-fidelity (hifi)**: Pixel-perfect mockups with final colors, typography, spacing, and interactions. Recreate the UI exactly as shown using your codebase's existing libraries and design system.

## Screens / Views

### Screen: Planlæg kørsel (Plan Route)

**Purpose**: Dispatcher configures a single transport job: selects vehicles, sets schedules, and reviews capacity requirements.

**Location**: Full viewport — centered card on soft-aqua background

**Layout**:
- **Header** (dark teal bar, full-width inside card)
  - Left: Title group (label "Ordre 1212343 · Kørsel" + h1 "Planlæg kørsel")
  - Right: Location pill (icon + "Søvej 6D · 4900 Nakskov")
  - Height: 60px, padding: 20px 28px
  - Background: `--colas-deep-teal`, text: white, 82% opacity for secondary text

- **Main body** (white, padding: 26px 28px)
  - Multiple sections separated by horizontal dividers (1px, `--colas-box-outline`)
  - Each section adds 24px padding-bottom; adjacent sections add 24px padding-top
  - Max-width container: 1100px, centered on page

- **Footer bar** (light aqua background, padding: 18px 28px)
  - Left: Summary text ("2 produkter · **322 t** i alt · **3** biler")
  - Right: Button group (ghost "Annullér" + primary "Gem kørsel")
  - Full-width, sticky or positioned at bottom of card
  - Border-top: 1px `--colas-box-outline`

---

### Section 1: Vognmand + Afregning (Carrier + Billing)

**Layout**: 2-column grid (1fr + auto)

**Components**:
1. **Vognmand Select** (left column)
   - Label: "VOGNMAND" (uppercase, `--fs-xs`, `--fg-3`, font-weight: 600, letter-spacing: 0.04em)
   - Select dropdown, height: 42px, padding: 0 14px
   - Chevron icon on right (17px × 17px, `--fg-3`)
   - Options: "Kloster A/S (primær)", "Egholm Transport", "HP Vognmandsforretning"
   - Focus: border `--colas-dark-teal`, box-shadow: 0 0 0 3px rgba(14,71,100,0.12)

2. **Afregning Segmented Control** (right column, aligned to bottom of select)
   - Label: "AFREGNING" (same styling as above)
   - Group of 2 buttons: "Akkord" (default pressed) + "Timeløn"
   - Background: `--colas-soft-aqua`, padding: 3px, gap: 2px, border-radius: `--r-2xl`
   - Border: 1px `--colas-box-outline`
   - Button: padding: 8px 20px, border-radius: `--r-xl`, font-size: `--fs-sm`, font-weight: 600
   - Unpressed: color `--fg-3`, bg: none
   - Pressed: color white, bg `--colas-deep-teal`, box-shadow: 0 1px 2px rgba(0,0,0,0.12)

---

### Section 2: Biler — vognmandens flåde (Vehicles — Carrier's Fleet)

**Label**: "BILER — VOGNMANDENS FLÅDE" (uppercase)

**List Container**:
- Border: 1px `--colas-box-outline`, border-radius: `--r-lg`, overflow: hidden
- Each row: padding: 9px 14px, display: grid, 5 columns: [34px 1fr auto auto 34px]
- Background: white
- Row separator: 1px `--colas-box-outline`

**Row Items** (3 vehicles shown):
1. Icon cell (34×34px)
   - Background: `--colas-soft-aqua`, border-radius: `--r-md`
   - SVG truck icon: 18×18px, color `--colas-deep-teal`

2. Name cell
   - Bold vehicle type (e.g., "4-akslet"), font-size: `--fs-sm`, font-weight: 600
   - Optional subtitle in `--fg-3`

3. Stepper (quantity control)
   - Border: 1px `--colas-divider`, border-radius: `--r-md`, height: 34px
   - 3 cells: [−button | number | +button]
   - Buttons: 34px × 34px, bg: none, color `--fg-2`, hover bg: `--colas-soft-aqua`
   - Number: font-weight: 600, font-size: `--fs-sm`, text-align: center, min-width: 30px
   - Font: `--font-display`, `font-variant-numeric: tabular-nums`

4. Tonnage cell
   - Font: `--font-display`, font-weight: 600, font-size: `--fs-sm`, color: `--colas-deep-teal`
   - Tabular numbers, right-aligned, min-width: 54px

5. Delete button (34×34px)
   - Background: transparent
   - Hover: bg `#FBECEA`, color `--colas-error`
   - Icon: 16×16px, X mark

**Add Button** (below list):
- Class: "add-pill"
- Inline-flex, gap: 8px, margin-top: 14px
- Background: white, border: 1px dashed `--colas-light-aqua`, border-radius: `--r-full`
- Padding: 10px 18px
- Font: `--font-body`, `--fs-sm`, font-weight: 600, color: `--colas-dark-teal`
- Icon: + (16×16px)
- Hover: bg rgba(160,199,215,0.14), border-color: `--colas-dark-teal`

---

### Section 3: Bilbehov (Vehicle Requirements Dashboard)

**Label + Help**:
- Label: "BILBEHOV" (uppercase)
- Inline help: icon (info circle, 15×15px, `--colas-light-aqua`) + text "Beregnet ud fra tonnage, fabrik og rundtid" (font-size: `--fs-xs`, color: `--fg-3`)

**Dashboard Grid**:
- 5 columns (responsive: 2 columns on ≤860px), gap: 12px
- Each tile: 5 tiles shown

**Tile Layout** (each ~96px min-height):
- Background: white, border: 1px `--colas-box-outline`, border-radius: `--r-lg`
- Padding: 14px 15px
- Flexbox column, gap: 6px

**Tile Content**:
1. Label (tl): font-size: `--fs-xxs`, text-transform: uppercase, color: `--fg-3`, font-weight: 600
2. Value (tv): font-size: `--fs-xl`, font-weight: 700, color: `--colas-deep-teal`, font-family: `--font-display`
   - Optional small unit next to value: font-size: `--fs-xs`, color: `--fg-3`
   - Font-variant-numeric: tabular-nums, letter-spacing: -0.01em
3. Subtitle (ts): font-size: `--fs-xs`, color: `--fg-3`

**Special Tile: "Mangler" (Warning Tile)**:
- Background: `#FBECEA`, border-color: `#F3C9C5`
- Label color: `--colas-error` (#F04E4E)
- Value color: `--colas-error`
- Subtitle color: `#B5443F`

**Special Tile: "Forventet slut" (Expected Completion)**:
- Contains 2 rows (P1 + P2)
- Each row: pill badge (bg: `--colas-deep-teal`, color: white, padding: 1px 5px, border-radius: `--r-sm`) + time value
- Layout: flexbox gap: 8px
- Time font: `--font-display`, font-weight: 700, font-size: `--fs-md`, tabular-nums

---

### Section 4: Starttider og intervaller (Departure Times and Intervals)

**Title**: "Starttider og intervaller" (h2 style, `--colas-deep-teal`)
**Subtitle**: "Anbefaling til vognmand for de første biler. Ikke bindende — vognmand kan afvige." (smaller text, `--fg-3`)

**Flow Layout**:
- Margin-top: 18px
- Grid: 3 columns [1fr | 56px | 1fr] gap: 24px (responsive: 1fr on ≤860px, no middle column)
- Align-items: stretch

**Product Card 1 (Left)** & **Product Card 2 (Right)**:
- Background: white
- Border: 1px `--colas-box-outline`, border-radius: `--r-lg`
- Padding: 18px 20px
- Flexbox column

**Card Header** (.phead):
- Display: flex, align-items: center, gap: 11px, flex-wrap: wrap
- Margin-bottom: 16px

**Card Header Items**:
1. **Number badge** (.pnum):
   - 28×28px circle, background: `--colas-deep-teal`, color: white
   - Font: `--font-display`, font-weight: 700, font-size: `--fs-xs`
   - Text: "1" or "2"

2. **Product badge** (.pbadge):
   - Background: `--colas-deep-teal`, color: white
   - Padding: 5px 12px, border-radius: `--r-full`
   - Font: `--font-body`, font-weight: 600, font-size: `--fs-xs`
   - Text: "Produkt 1" or "Produkt 2"

3. **Product name** (.pname):
   - Font: `--font-display`, font-weight: 600, font-size: `--fs-md`, color: `--fg-1`
   - Format: "GAB I · 70 t" or "SMA 11S · 252 t"
   - Dot separator: color `--colas-light-aqua`, margin: 0 6px
   - Tonnage: color `--colas-deep-teal`, font-weight: 600, tabular-nums

---

#### Product 1 Content (.plan section):

**3 Order Rows** (.order-row):
- Grid: 2 columns [1fr | 116px], gap: 12px
- Margin-bottom: 12px (last: 0)

**Row 1 & 2: Bil nr. 1 / 2**:
- Left column:
  - Label (.field-label): font-size: `--fs-xs`, color: `--fg-3`, font-weight: 500, margin-bottom: 6px
  - Recommendation pill (.reco):
    - Flex, gap: 9px, height: 42px, padding: 0 13px
    - Background: white, border: 1px `--colas-divider`, border-radius: `--r-md`
    - Icon avatar (.av): 24×24px, bg: `--colas-soft-aqua`, color: `--colas-deep-teal`, icon: 14×14px
    - Name (.nm): font-weight: 500, color: `--fg-1`, white-space: nowrap
    - ID (.id): color: `--fg-3`, tabular-nums, ellipsis on overflow

- Right column:
  - Label: "Startid"
  - Time value display (.timeval):
    - Flex, gap: 8px, height: 42px, padding: 0 13px
    - Background: white, border: 1px `--colas-divider`, border-radius: `--r-md`
    - Font: `--font-display`, font-weight: 600, font-size: `--fs-sm`, tabular-nums
    - Icon (clock): 14×14px, `--fg-3`
    - Content: "06.00" / "06.20"

**Row 3: Herefter — interval**:
- Label: "Herefter — interval"
- Span full grid width
- Value display: "20 min mellem biler"

---

#### Product 2 Content:

**Coupling Question**:
- Flex, gap: 14px, flex-wrap: wrap
- Question text (.q): font-size: `--fs-sm`, color: `--fg-2`, font-weight: 500
  - Text: "Køres **direkte i forlængelse** af Produkt 1?" (bold part: color `--fg-1`, font-weight: 600)
- Yes/No toggle group (.yesno):
  - Inline-flex, bg: white, border: 1px `--colas-divider`, border-radius: `--r-md`
  - Padding: 3px, gap: 2px
  - Buttons: padding: 7px 18px, border-radius: 6px, font-size: `--fs-sm`, font-weight: 600
  - Unpressed: color `--fg-3`, bg: none
  - Pressed: color white, bg: `--colas-deep-teal`
  - Data attribute: `data-reveal="p2extra"`

**Direct Routing Message** (#p2direct):
- Flex, gap: 9px, align-items: center
- Margin-top: 14px
- Icon: arrow-right, 16×16px, `--colas-light-aqua`
- Text: "Kører direkte efter Produkt 1 — ingen separat starttid nødvendig."
- Font-size: `--fs-sm`, color: `--fg-3`
- Hidden by default when "Nej" is selected

**Extended Options** (#p2extra, initially hidden):
- Margin-top: 14px
- Visibility controlled by yes/no toggle

**P2 Row 1: Bil nr. 1 (Select)**:
- Label: "Bil nr. 1"
- Select dropdown (same styling as vognmand select)
- Options: "Bil 1 · KL 41 230", "Bil 2 · KL 38 117", "Bil 3 · KL 52 904"
- Margin-bottom: 12px

**P2 Times Grid** (.p2-times):
- Grid: 2 columns [1fr | 1fr], gap: 12px

**Column 1: Startid (Departure Time)**:
- Label: "Startid"
- Input field, height: 42px
- Value: "13.00"
- Icon: clock, 15×15px, `--fg-3`, absolute-positioned on right

**Column 2: Interval**:
- Label: "Interval"
- Input field, height: 42px
- Value: "15 min"

---

### Section 5: Kommentar til chauffør (Driver Notes)

**Label**: "KOMMENTAR TIL CHAUFFØR" (uppercase)

**Textarea** (.ta):
- Width: 100%, min-height: 88px
- Padding: 13px
- Border: 1px `--colas-divider`, border-radius: `--r-md`
- Background: white
- Font: `--font-body`, `--fs-sm`, color: `--fg-1`
- Line-height: 1.5
- Placeholder: "Fx 'Brug bagvejen', 'Aflæsningssted flyttet 50 m mod vest', 'Støjrestriktion efter kl. 22'…"
- Focus: border `--colas-dark-teal`, box-shadow: 0 0 0 3px rgba(14,71,100,0.12)

---

## Interactions & Behavior

### Vognmand Select
- Click opens dropdown menu
- Select option updates displayed selection
- Selection persists across page interactions

### Afregning Toggle
- Click "Akkord" or "Timeløn" to toggle
- Only one can be active at a time (aria-pressed states)
- Default: "Akkord" active

### Vehicle List Steppers
- Click "+" increases quantity by 1
- Click "−" decreases quantity by 1 (minimum: 0?)
- Stepper updates appear in real time
- Click X button removes the vehicle entirely from the list

### Add Vehicle Button
- Click opens picker or adds a new row to the list
- (Details depend on implementation)

### Product 1 → Product 2 Coupling
- Yes/No toggle controls visibility of extra options
- **When "Ja" (Yes) selected** (default):
  - Show message: "Kører direkte efter Produkt 1 — ingen separat starttid nødvendig."
  - Hide extra options section (#p2extra)
  
- **When "Nej" (No) selected**:
  - Hide direct message (#p2direct)
  - Show extra options section:
    - Bil nr. 1 select
    - Startid input (editable, default: "13.00")
    - Interval input (editable, default: "15 min")

### Responsive Behavior
- **Desktop (>860px)**: 5-column dashboard, 3-column flow layout with connector
- **Tablet/Mobile (≤860px)**: 2-column dashboard, 1-column flow layout (no connector)
- All form controls scale with viewport but maintain minimum sizes

### Buttons & Focus States
- **Primary Button** (.btn.primary): "Gem kørsel"
  - Hover: `filter: brightness(1.12)`
  - Active: `transform: scale(0.985)`
  
- **Ghost Button** (.btn.ghost): "Annullér"
  - Hover: text color `--fg-1` (darker)

---

## State Management

### Form State Variables
```
vognmand:       String (selected carrier)
billing:        'akkord' | 'timeløn'
vehicles:       Array of { type, quantity, tonnage }
p2Coupling:     'ja' | 'nej'
p2Vehicle:      String (selected vehicle for P2)
p2StartTime:    String (time, format: HH.MM)
p2Interval:     String (duration, format: "15 min")
driverNotes:    String (textarea content)
```

### Computed Values
```
totalTonnage:   Sum of all vehicle tonnage
totalVehicles:  Count of vehicles
shortageWarning: If total < required, show warning tile
```

### Form Submission
- "Gem kørsel" button: Validate and submit form data
- "Annullér" button: Clear form or navigate back
- (Backend endpoint details: TBD by implementation team)

---

## Design Tokens

All values from `colas-tokens.css`:

### Colors
```
--colas-deep-teal:     #0B3950   (primary, headings, dark backgrounds)
--colas-dark-teal:     #0E4764   (secondary, accents)
--colas-light-aqua:    #A0C7D7   (borders, secondary elements)
--colas-soft-aqua:     #F0F7FA   (page/section backgrounds)
--colas-error:         #F04E4E   (error/warning states)
--colas-box-outline:   #EDEDED   (card borders, dividers)
--colas-divider:       #C4C4C4   (input borders)
--colas-text-primary:  #1D1D1D   (--fg-1, primary text)
--colas-text-secondary:#2B2B2B   (--fg-2, secondary text)
--colas-text-muted:    #717182   (--fg-3, labels, disabled)
```

### Typography
```
--font-display: 'Poppins', system-ui, -apple-system, 'Segoe UI', sans-serif
--font-body:    'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif

--fs-xxs:  10px   (--lh-xxs: 14px)
--fs-xs:   12px   (--lh-xs:  16px)
--fs-sm:   14px   (--lh-sm:  20px)
--fs-md:   16px   (--lh-md:  24px)
--fs-lg:   20px   (--lh-lg:  28px)
--fs-xl:   24px   (--lh-xl:  32px)
--fs-2xl:  30px   (--lh-2xl: 38px)
```

### Spacing
```
--sp-xxxs: 2px
--sp-xxxs: 4px
--sp-xs:   8px
--sp-sm:   16px
--sp-md:   24px
--sp-lg:   32px
```

### Border Radius
```
--r-sm:   4px
--r-md:   8px
--r-lg:   12px
--r-xl:   16px
--r-2xl:  20px
--r-full: 9999px
```

### Shadows
```
--shadow-md: 0 2px 8px rgba(0,0,0,0.08)
Card shadow (used): 0 6px 28px rgba(11,57,80,0.10)
```

### Motion
```
--ease:   cubic-bezier(0.2, 0.7, 0.2, 1)
--t-fast: 120ms
--t-base: 200ms
```

---

## Assets

### Icons (SVG inline)
All icons are inline SVGs, 18–24px, using `stroke="currentColor"` for color inheritance:
- Truck (vehicle icon, 18×18px)
- Map pin (location icon, 16×16px)
- Chevron down (select dropdown, 17×17px)
- Info circle (help tooltip, 15×15px)
- Clock (time input, 15×15px)
- Plus (add vehicle, 16×16px)
- X/Close (delete vehicle, 16×16px)
- Arrow right (coupling flow, 15×15px)
- Checkmark (submit button, 16×16px)

No external icon library — all rendered as inline SVG strings.

### Fonts
- **Poppins** (display): Weights 400, 500, 600, 700 — loaded from Google Fonts
- **Inter** (body): Weights 400, 500, 600, 700 — loaded from Google Fonts

---

## Files

**In the handoff bundle:**
- `Planlæg kørsel.html` — Full interactive mockup with all styles and scripts
- `colas-tokens.css` — Design tokens (colors, type, spacing, shadows) — import as reference
- `README.md` — This file

---

## Implementation Notes

1. **No external dependencies** in the HTML mockup — vanilla CSS + minimal vanilla JS for toggle behavior.

2. **Responsive breakpoint** at `max-width: 860px`:
   - Dashboard: 5 → 2 columns
   - Flow layout: 3-column grid → 1 column (hides connector arrow)
   - Form grid: 2 columns → 1 column

3. **Typography**: Uses Google Fonts imports; ensure fonts load before paint in your build system.

4. **Accessibility**: 
   - All form inputs have associated labels
   - Buttons use `aria-pressed` for toggle state
   - Color contrast meets WCAG AA (dark text on white/light bg)
   - Icon-only buttons have `aria-label`

5. **Form behavior** (see inline `<script>` in HTML):
   - Segmented controls (vognmand select, afregning, p2 coupling) use aria-pressed toggles
   - Product 2 section visibility controlled by yes/no selection
   - Direct routing message shown by default; hidden when "Nej" selected

6. **Numbers & Formatting**:
   - Use `font-variant-numeric: tabular-nums` for all numeric values (time, tonnage, IDs)
   - Time format: "HH.MM" (e.g., "06.00", "13.00")
   - Duration format: "NN min" (e.g., "20 min mellan biler")
   - Tonnage: "NN t" (e.g., "30 t", "252 t")

---

## Next Steps for Implementation

1. Choose your target environment (React, Vue, etc.)
2. Set up design token imports from `colas-tokens.css` or recreate in your system (Tailwind, CSS-in-JS, etc.)
3. Build reusable components:
   - FormSelect (with custom styling)
   - SegmentedToggle
   - Stepper (quantity control)
   - Card / Tile
   - TimeInput / TimeDisplay
   - DriverNotesTextarea
4. Implement state management (React Context, Redux, Vuex, etc.) for form data
5. Connect to backend API for form submission
6. Test responsive behavior at breakpoints
7. QA against this mockup for pixel-perfect alignment

