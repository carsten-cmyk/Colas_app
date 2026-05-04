# TODO: Afslut dag — Eksekveringsfane

Afventer design af eksekveringsfanen før implementering.

## Ønsket funktionalitet

### Forsinkelser
Hvis formanden på ekskveringsdagen ikke når de planlagte tons
(regn, frost, teknisk nedbrud) skal han kunne angive faktiske tons udlagt.

Resterende tons (planlagt minus faktisk) fordeles automatisk
til næste planlagte dag eller en ny dag hvis ingen findes.
Kørselsplanen for den berørte dag genberegnes automatisk.

### "Afslut dag"-dialog
- Trigges fra eksekveringsfanen (ikke kørselsplanlægning)
- Viser: "Udlagt i dag: [X] t af [Y] t planlagt — fordel [rest] t til næste dag?"
- Formanden kan justere manuelt inden bekræftelse
- Resterende tons opdaterer dagfordeling for næste dag
- Kørselsplan for berørt dag genberegnes automatisk

### Scenarier der skal understøttes
1. **Delvis planlægning** — formanden planlægger kun ét produkt nu, det andet først om nogle dage. Produkter planlægges uafhængigt.
2. **Dag-overførsel** — rest-tons fordeles til næste dag(e), som derefter skal genberegnes.

### Vognmand-hensyn (VIGTIGT)
Hvis en køreplan genberegnes pga. ændrede tons, må vognmanden **ikke** skulle tildele chauffører til biler igen fra scratch.
- Kun **delta/ændringer** præsenteres til vognmanden
- Eksisterende bil-chauffør-tildelinger bevares
- Kun nye/fjernede biler kræver handling fra vognmanden

### Datamodel (aftalt)
```
paramsPerProduct:  Record<productId, Params>
                   — produktets egne biler, tider osv.

savedPlans:        Record<productId, Record<dayIndex, 'saved' | 'stale'>>
                   — 'stale' sættes automatisk når tons ændres for en dag
```

### Dagnavigation-status
- ✓ grøn  — gemt og gyldig
- ⚠ gul   — gemt men forældet (tons ændret siden sidst gemt)
- ● rød   — ikke planlagt endnu

### Teknisk note (til implementering)
- `productDays` state: `Record<productId, Record<date, tons>>`
- `handleAfslutDag(actualTons)`: beregner rest, finder næste planlagte dag, opdaterer state
- Når tons ændres for dag X → sæt `savedPlans[productId][dagIndex] = 'stale'` for alle dage >= X
- "Gem køreplan" gemmer per produkt per dag (ikke globalt)
