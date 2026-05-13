Lille rettelse i prototype eller komponent — kør i baggrunden via builder-agenten for at spare kontekst-vindue.

Brugerens ønske: $ARGUMENTS

## Hvad du (Claude) skal gøre

1. **Identificér target-filen** ud fra brugerens beskrivelse. Hvis filen ikke er åbenlys (fx "den grå boks i ankomst-flowet"), spørg brugeren kort med `AskUserQuestion` hvilken fil/komponent det drejer sig om — max 2 mulige filer som options.

2. **Lav en mini-SPEC** (2-5 linjer) der beskriver:
   - Hvilken fil og hvor (linjenr/sub-komponent)
   - Hvad der konkret skal ændres
   - Hvilke tokens der skal bruges (slå op i `.claude/docs/core/DESIGN_SYSTEM.md` hvis nødvendigt)

3. **Dispatch til `builder`-agenten via Agent-tool med `run_in_background: true`**. Builderens prompt skal indeholde:
   - Mini-SPEC'en
   - Eksplicit krav om at bruge tokens (ingen hardcoded farver/spacing — heller ikke i prototyper)
   - Krav om at rapportere tilbage i max 80 ord: hvilke linjer blev ændret + om der er issues
   - Krav om at IKKE ændre komponent-API eller tilføje funktionalitet udover det beskrevne

4. **Tildel brugeren en kort statusbesked** (under 30 ord): "Builder kører i baggrunden på [fil]. Du får besked når den er færdig."

5. **Når builder rapporterer tilbage**: vis kun de ændrede linjer + eventuelle issues. Læs IKKE filindhold ind i hovedkonteksten medmindre brugeren beder om det.

## Hvad builder skal tjekke mod

- Tokens i `.claude/docs/core/DESIGN_SYSTEM.md` (farver, spacing, font, radius)
- Eksisterende komponent-mønstre i samme mappe
- Inline styles OK i prototyper men værdier SKAL være tokens

## Hvornår NIKKE bruge `/bg`

- Nye komponenter eller skærme → brug `/develop-screen` eller `/new-component`
- Større refaktorering → brug `/cleanup` på flere filer
- Hvis brugeren beder om at se filindhold inden ændring → gør det direkte i hovedsamtalen
