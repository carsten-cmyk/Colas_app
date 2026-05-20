# Login-løsning — kort afklaring til IT

**Til:** IT
**Fra:** Colas-appen team
**Dato:** 2026-05-19

---

## Hvad vi vil bygge

Den nye Colas-app skal bruges af tre forskellige typer brugere, og de skal logge ind på hver sin måde:

| Bruger | Login | Antal |
|---|---|---|
| **Formand + Sjakbejs** | Med deres Colas-medarbejderlogin (samme som de bruger til Outlook) | Mange |
| **Vognmand** | Med en brugerkonto vi opretter i appen | 4–6 personer |
| **Chauffør** | Indtaster sit telefonnummer, modtager en kode på SMS, bekræfter | Mange, skifter løbende |

Vi har lagt et **brief** for chauffør- og vognmandslogin ved, så I kan se hvordan det er tænkt at fungere ude i marken. Den her side er kun de spørgsmål **vi har brug for jeres input på**.

---

## Det vi skal bede dig tage stilling til

1. **Medarbejderlogin (formand/sjakbejs)** — kan vi koble appen direkte op på Colas' Microsoft-/medarbejderlogin, så de bare bruger deres almindelige konto? (Det er det vi anbefaler — så slipper de for endnu et password.)

2. **Hvordan ved appen hvem der er formand/sjakbejs?** Findes der en *gruppe* i jeres system som vi kan bruge til at se "denne her medarbejder er formand"? Eller skal I lave en?

3. **Hvilke oplysninger må vi få om medarbejderen** ved login? Vi har brug for navn og email — gerne også medarbejdernummer og evt. lokation/afdeling.

4. **SMS til chauffører** — har Colas en eksisterende SMS-aftale vi kan bruge til at sende koderne, eller skal vi vælge en leverandør? *(Det er typisk ~5 øre pr. SMS.)*

5. **Når en medarbejder stopper** — bliver deres konto automatisk lukket i jeres system? Hvis ja, så lukkes adgangen til appen automatisk. Hvis nej, skal vi vide hvordan vi får besked.

6. **Test-adgang** — kan vi få en test-konto eller test-miljø, så vi kan bygge og afprøve logind før vi går live?

7. **Special-krav fra IT/compliance** — er der noget vi skal være opmærksomme på (særlige logning-krav, persondataforhold, MFA-krav)?

---

## Vores forslag — du kan bare sige "ja" eller justere

- **Formand/sjakbejs** logger ind med deres almindelige Colas-medarbejderkonto. Ét klik fra app-skærmen, og de er inde.
- **Vognmand** får en konto vi opretter (email + password + ekstra SMS-bekræftelse første gang).
- **Chauffør** logger ind med telefonnummer + SMS-kode. Vognmanden styrer sin egen liste af chauffører i appen — så når en chauffør stopper, kan vognmanden selv lukke adgangen med ét klik.

---

*Vil du have et 20-minutters møde, hvor vi går igennem det sammen? Det er ofte hurtigere end at skrive frem og tilbage.*
