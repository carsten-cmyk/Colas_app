Kør et token-audit af: $ARGUMENTS

Angiv en mappe eller fil — fx `apps/formand/src/components` eller `apps/chauffeur/src`

## Fremgangsmåde

1. Læs alle `.tsx` og `.ts` filer i den angivne mappe rekursivt
2. Find ALLE hardcodede værdier:

### Hardcodede farver (CRITICAL)
- `className` med hex: `text-[#333]`, `bg-[#FFD100]`
- `style={{ color: '#...' }}`, `style={{ backgroundColor: '...' }}`
- Farvenavne: `style={{ color: 'white' }}`, `style={{ color: 'red' }}`

### Hardkodet spacing/sizing (RECOMMENDED)
- `style={{ padding: 16 }}`, `style={{ margin: '24px' }}`
- `style={{ height: 52 }}` — medmindre genuint dynamisk
- `style={{ fontSize: 12 }}`

### Manglende tokens
- Tailwind-klasser der ikke matcher tokens i `tailwind.config.ts`
- Fx `text-gray-500` når `text-text-muted` er det korrekte token

## Output-format

```
[CRITICAL] apps/formand/src/components/ui/StatCard.tsx:23
Hardcodet farve: style={{ color: '#333' }}
Fix: className="text-text-primary"

[RECOMMENDED] apps/formand/src/components/layout/TopBar.tsx:18
Hardkodet højde: style={{ height: 52 }}
Fix: Tilføj token 'topbar-height: 52px' i tailwind.config.ts hvis genuint fast værdi, ellers brug h-[52px] med kommentar
```

Afslut med samlet tal: X CRITICAL, Y RECOMMENDED
