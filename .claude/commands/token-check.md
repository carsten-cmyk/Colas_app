Brug cleanup-agenten til at finde alle token-violations i: $ARGUMENTS

Cleanup-agenten vil:
1. Scanne alle `.tsx` og `.ts` filer i den angivne mappe
2. Finde hardcodede hex-farver, px-værdier og inline styles
3. Rapportere violations med filsti + linjenummer + foreslået token
4. IKKE ændre noget — kun rapportere

Output-format:
```
[TOKEN VIOLATION] filsti:linje
  Fundet: style={{ color: '#0B3950' }}
  Fix:    className="text-deep-teal"
```

Afslut med samlet antal violations per fil.
Kald derefter `/cleanup [fil]` for at rette dem.
