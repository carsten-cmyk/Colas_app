# UX/UI Design Guidelines - Senior Udvikler Perspektiv

## Design Philosophy

**Principper:**
- **Clarity over cleverness** - Funktionalitet skal være umiddelbart forståelig
- **Consistency is king** - Samme patterns overalt reducerer cognitive load
- **Progressive disclosure** - Vis kun hvad brugeren har brug for nu
- **Feedback always** - Bruger skal altid vide hvad der sker
- **Mobile-first thinking** - Design skal virke på alle skærmstørrelser

## Design System

### Color Palette

**Primary Colors:**
```javascript
primary: '#4e91bc'        // Blå - Hovedfarve
'primary-dark': '#3a6d8f'
'primary-light': '#6ba8d4'
```

**Semantic Colors:**
```javascript
rose: '#d91a45'           // Rød - Fejl, kritisk, deletion
amber: '#dacf71'          // Gul - Warning, needs attention
emerald: '#10B981'        // Grøn - Success, completed
slate: '#64748b'          // Grå - Neutral, disabled
```

**Strategy Colors (Solutions):**
```javascript
maintain: '#10B981'       // Emerald (tidligere Leverage)
uplift: '#F59E0B'        // Amber (tidligere Enhance)
transform: '#EF4444'     // Rose
newBuild: '#3B82F6'      // Blue
tbd: '#F1F5F9'           // Slate-100
```

**Health Status Colors:**
```javascript
grey: '#6B7280'          // Not started
blue: '#3B82F6'          // Work in progress
green: '#10B981'         // All good
yellow: '#F59E0B'        // Needs attention
red: '#EF4444'           // Critical issues
```

### Typography

**Font Family:**
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

**Scale (defined in designSystem.js):**
```javascript
typography: {
  pageTitle: 'text-3xl font-bold text-white',
  sectionTitle: 'text-2xl font-semibold text-white',
  cardTitle: 'text-xl font-semibold text-white',
  body: 'text-base text-slate-300',
  small: 'text-sm text-slate-400',
  tiny: 'text-xs text-slate-500'
}
```

**Usage:**
```jsx
import { typography } from '../styles/designSystem';

<h1 className={typography.pageTitle}>Value Streams & Capabilities</h1>
<p className={typography.body}>Supporting description text</p>
```

### Spacing

**Tailwind Grid (4px base):**
- `gap-2` = 8px - Tight spacing (badges, inline elements)
- `gap-4` = 16px - Standard spacing (card internals)
- `gap-6` = 24px - Section spacing (between cards)
- `gap-8` = 32px - Page sections
- `gap-12` = 48px - Major sections

**Padding Standards:**
```jsx
// Card padding
<div className="p-6">          // Standard card
<div className="p-8">          // Emphasised card
<div className="p-4">          // Compact card

// Page padding
<div className="p-8">          // Desktop
<div className="p-4">          // Mobile (responsive)
```

### Shadows & Borders

**Card Elevation:**
```css
/* Subtle elevation */
.shadow-sm

/* Standard card */
.shadow-md

/* Hover state */
.shadow-lg

/* Active/Selected */
.shadow-xl
```

**Border Styles:**
```jsx
// Standard border
border border-slate-700

// Dividers
border-b border-slate-700/30

// Colored top bars (strategy indicators)
border-t-4 border-emerald-600
```

## Component Patterns

### Cards

**Standard Card:**
```jsx
<div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700 hover:shadow-lg transition-all cursor-pointer">
  <h3 className="text-xl font-semibold text-white mb-2">Card Title</h3>
  <p className="text-sm text-slate-400">Description text</p>
</div>
```

**Interactive Card (clickable):**
```jsx
<div
  onClick={() => navigate(`/detail/${id}`)}
  className="bg-slate-800/50 rounded-lg p-6 border border-slate-700
             hover:bg-slate-800/70 hover:shadow-lg hover:scale-[1.02]
             transition-all cursor-pointer"
>
  {/* Content */}
</div>
```

**Card with Color Bar (strategy/status indicator):**
```jsx
<div className="bg-slate-800/50 rounded-lg border border-slate-700">
  <div className="h-2 bg-emerald-600 rounded-t-lg" />
  <div className="p-6">
    {/* Content */}
  </div>
</div>
```

### Badges & Status Indicators

**Status Badge:**
```jsx
<span className={`
  px-3 py-1 rounded-full text-xs font-semibold
  ${statusColors[status]}
`}>
  {statusLabels[status]}
</span>

// Color mapping
const statusColors = {
  'Identified': 'bg-slate-500/20 text-slate-400 border border-slate-500/30',
  'Approved': 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  'InProgress': 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
  'Resolved': 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  'Rejected': 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
};
```

**Priority Badge with Score:**
```jsx
<div className="flex items-center gap-2">
  <span className={`px-2 py-1 rounded text-xs font-semibold ${priorityColors[priority]}`}>
    {priority}
  </span>
  <span className="text-xs text-slate-400">
    Score: {priorityScore.toFixed(1)}
  </span>
</div>
```

**Health Indicator (circular dot):**
```jsx
<div className="flex items-center gap-2">
  <div className={`w-3 h-3 rounded-full ${getHealthColorClasses(color)}`} />
  <span className="text-sm text-slate-300">{message}</span>
</div>
```

### Buttons

**Primary Button:**
```jsx
<button className="
  px-4 py-2
  bg-primary hover:bg-primary-dark
  text-white font-semibold rounded-lg
  transition-all duration-200
  flex items-center gap-2
">
  <Plus className="w-4 h-4" />
  Add Item
</button>
```

**Secondary Button:**
```jsx
<button className="
  px-4 py-2
  bg-slate-700 hover:bg-slate-600
  text-slate-200 font-semibold rounded-lg
  transition-all duration-200
">
  Cancel
</button>
```

**Danger Button:**
```jsx
<button className="
  px-4 py-2
  bg-rose-600 hover:bg-rose-700
  text-white font-semibold rounded-lg
  transition-all duration-200
">
  Delete
</button>
```

**Icon Button:**
```jsx
<button className="
  p-2 rounded-lg
  hover:bg-slate-700
  transition-colors
">
  <Edit2 className="w-4 h-4 text-slate-400" />
</button>
```

### Dialogs / Modals

**Full Dialog Structure:**
```jsx
<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
  <div className="bg-slate-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
    {/* Header */}
    <div className="flex items-center justify-between p-6 border-b border-slate-700">
      <h2 className="text-2xl font-bold text-white">Dialog Title</h2>
      <button onClick={onClose} className="text-slate-400 hover:text-white">
        <X className="w-6 h-6" />
      </button>
    </div>

    {/* Tabs (if needed) */}
    <div className="flex border-b border-slate-700 px-6">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors
            ${activeTab === tab.id
              ? 'border-primary-light text-primary-light'
              : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          onClick={() => setActiveTab(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>

    {/* Content */}
    <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
      {/* Tab content */}
    </div>

    {/* Footer */}
    <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-700">
      <button onClick={onClose} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg">
        Cancel
      </button>
      <button onClick={onSave} className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg">
        Save Changes
      </button>
    </div>
  </div>
</div>
```

**Tab Design (max 7 tabs):**
```jsx
// Equal width tabs, no scrolling
<div className="flex border-b border-slate-700 px-6">
  {tabs.map(tab => (
    <button className="flex-1 px-2 py-3 text-sm font-semibold">
      {tab.label}
    </button>
  ))}
</div>
```

### Forms

**Input Field:**
```jsx
<div className="space-y-2">
  <label className="block text-sm font-semibold text-slate-300">
    Field Label
  </label>
  <input
    type="text"
    value={value}
    onChange={(e) => setValue(e.target.value)}
    className="
      w-full px-4 py-2
      bg-slate-700 border border-slate-600
      text-white rounded-lg
      focus:outline-none focus:ring-2 focus:ring-primary-light
      placeholder:text-slate-500
    "
    placeholder="Enter value..."
  />
</div>
```

**Select Dropdown:**
```jsx
<select className="
  w-full px-4 py-2
  bg-slate-700 border border-slate-600
  text-white rounded-lg
  focus:outline-none focus:ring-2 focus:ring-primary-light
">
  <option value="">Select option...</option>
  <option value="1">Option 1</option>
  <option value="2">Option 2</option>
</select>
```

**Textarea:**
```jsx
<textarea
  rows={4}
  className="
    w-full px-4 py-2
    bg-slate-700 border border-slate-600
    text-white rounded-lg
    focus:outline-none focus:ring-2 focus:ring-primary-light
    placeholder:text-slate-500
  "
  placeholder="Enter description..."
/>
```

**Radio Button Group (Horizontal):**
```jsx
<div className="flex gap-4">
  {options.map(option => (
    <label key={option.value} className="flex items-center gap-2 cursor-pointer">
      <input
        type="radio"
        name="group"
        value={option.value}
        checked={selected === option.value}
        onChange={() => setSelected(option.value)}
        className="w-4 h-4 text-primary focus:ring-primary"
      />
      <span className="text-sm text-slate-300">{option.label}</span>
    </label>
  ))}
</div>
```

### Lists & Tables

**Grid Layout (Cards):**
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {items.map(item => (
    <Card key={item.id} {...item} />
  ))}
</div>
```

**List with Expand/Collapse:**
```jsx
<div className="space-y-4">
  {items.map(item => (
    <div key={item.id} className="bg-slate-800/50 rounded-lg border border-slate-700">
      <div
        onClick={() => toggleExpand(item.id)}
        className="p-4 flex items-center justify-between cursor-pointer"
      >
        <h3 className="font-semibold text-white">{item.name}</h3>
        {expanded[item.id] ? <ChevronUp /> : <ChevronDown />}
      </div>

      {expanded[item.id] && (
        <div className="p-4 border-t border-slate-700">
          {/* Expanded content */}
        </div>
      )}
    </div>
  ))}
</div>
```

### Navigation

**Tab Navigation:**
```jsx
<div className="flex items-center gap-2 border-b border-primary-light/30">
  {tabs.map(tab => (
    <button
      key={tab.id}
      onClick={() => setActiveTab(tab.id)}
      className={`
        px-6 py-3 text-sm font-semibold transition-all
        ${activeTab === tab.id
          ? 'text-primary-light border-b-2 border-primary-light'
          : 'text-slate-400 hover:text-slate-300'
        }
      `}
    >
      {tab.label}
    </button>
  ))}
</div>
```

**Breadcrumbs:**
```jsx
<div className="flex items-center gap-2 text-sm">
  <span className="text-slate-400">Value Streams</span>
  <ChevronRight className="w-4 h-4 text-slate-600" />
  <span className="text-slate-400">Customer Management</span>
  <ChevronRight className="w-4 h-4 text-slate-600" />
  <span className="text-white font-semibold">CRM System</span>
</div>
```

## Interaction Patterns

### Click Behaviors

**Navigate on Card Click:**
```jsx
<div
  onClick={() => navigate(`/capability/${id}`)}
  className="cursor-pointer hover:scale-[1.02] transition-transform"
>
  {/* Card content */}
</div>
```

**Inline Edit Pattern:**
```jsx
<div className="flex items-center gap-2">
  {isEditing ? (
    <input
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={handleSave}
      autoFocus
      className="flex-1 px-2 py-1 bg-slate-700 rounded"
    />
  ) : (
    <span onClick={() => setIsEditing(true)}>
      {value}
    </span>
  )}
  <button onClick={() => setIsEditing(true)}>
    <Edit2 className="w-4 h-4 text-slate-400" />
  </button>
</div>
```

**Confirmation Modal (Destructive Action):**
```jsx
function handleDelete() {
  if (!window.confirm('Are you sure you want to delete this item?')) {
    return;
  }

  // Proceed with deletion
}
```

### Loading States

**Spinner:**
```jsx
{loading && (
  <div className="flex items-center justify-center py-12">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-light" />
  </div>
)}
```

**Skeleton Cards:**
```jsx
<div className="animate-pulse bg-slate-800/50 rounded-lg p-6">
  <div className="h-6 bg-slate-700 rounded w-3/4 mb-4" />
  <div className="h-4 bg-slate-700 rounded w-1/2" />
</div>
```

### Empty States

**No Data Pattern:**
```jsx
<div className="text-center py-12">
  <AlertCircle className="w-12 h-12 text-slate-600 mx-auto mb-4" />
  <h3 className="text-lg font-semibold text-slate-300 mb-2">
    No items found
  </h3>
  <p className="text-sm text-slate-400 mb-4">
    Get started by creating your first item
  </p>
  <button onClick={handleCreate} className="px-4 py-2 bg-primary text-white rounded-lg">
    <Plus className="w-4 h-4 inline mr-2" />
    Create Item
  </button>
</div>
```

## Responsive Design

### Breakpoints
```javascript
sm: '640px'   // Mobile landscape
md: '768px'   // Tablet
lg: '1024px'  // Desktop
xl: '1280px'  // Large desktop
```

### Mobile-First Pattern
```jsx
<div className="
  grid
  grid-cols-1        /* Mobile: 1 column */
  md:grid-cols-2     /* Tablet: 2 columns */
  lg:grid-cols-3     /* Desktop: 3 columns */
  gap-4 md:gap-6     /* Responsive gap */
">
  {/* Cards */}
</div>
```

### Hide on Mobile
```jsx
<div className="hidden md:block">
  {/* Desktop only content */}
</div>
```

### Mobile Navigation
```jsx
<div className="flex md:hidden">
  {/* Hamburger menu for mobile */}
</div>
```

## Accessibility

### Semantic HTML
```jsx
// ✅ GOOD: Semantic
<nav>
  <ul>
    <li><a href="/home">Home</a></li>
  </ul>
</nav>

// ❌ BAD: Non-semantic
<div>
  <div onClick={goHome}>Home</div>
</div>
```

### Keyboard Navigation
```jsx
<button
  onClick={handleClick}
  onKeyPress={(e) => e.key === 'Enter' && handleClick()}
  className="..."
>
  Action
</button>
```

### ARIA Labels
```jsx
<button aria-label="Close dialog" onClick={onClose}>
  <X className="w-6 h-6" />
</button>

<input
  aria-label="Search capabilities"
  placeholder="Search..."
/>
```

### Focus States
```jsx
<button className="
  focus:outline-none
  focus:ring-2
  focus:ring-primary-light
  focus:ring-offset-2
  focus:ring-offset-slate-900
">
  Button
</button>
```

## Animation & Transitions

### Standard Transitions
```css
transition-all duration-200    /* Standard */
transition-colors duration-150 /* Color changes */
transition-transform duration-300 /* Movements */
```

### Hover Effects
```jsx
// Scale up
<div className="hover:scale-[1.02] transition-transform">

// Shadow increase
<div className="hover:shadow-lg transition-shadow">

// Background change
<div className="hover:bg-slate-700 transition-colors">
```

### Entrance Animations
```jsx
// Fade in
<div className="animate-fade-in">

// Slide down
<div className="animate-slide-down">
```

## Common Pitfalls to Avoid

❌ **Don't:**
- Mix design patterns (use consistent badge styles everywhere)
- Use too many colors (stick to semantic palette)
- Create custom components for one-time use
- Ignore mobile breakpoints
- Skip loading states
- Forget hover/focus states
- Use px instead of rem for fonts
- Hardcode colors (use Tailwind classes)

✅ **Do:**
- Reuse existing components and patterns
- Follow established color semantics
- Test on mobile devices
- Provide visual feedback for all interactions
- Use consistent spacing (Tailwind scale)
- Maintain accessibility standards
- Document new patterns you create
