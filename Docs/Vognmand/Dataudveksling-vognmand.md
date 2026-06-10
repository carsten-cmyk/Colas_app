# Daglig kørselsbestilling — dataudveksling mellem Colas og vognmand

## Sådan foregår en dag

**Dagen før** sender Colas jer en kørselsbestilling pr. ordre. I disponerer biler og chauffører på bestillingen og sender retur, hvilke biler I sætter på. Hver chauffør får herefter automatisk en SMS fra Colas med dagens ordre og et link til en webapp, som chaufføren bruger på pladsen og fabrikken.

---

## 1. Det I modtager fra Colas (dagen før)

For hver kørselsbestilling sender vi:

| Oplysning | Forklaring |
|---|---|
| **Ordrenummer** | Reference på ordren |
| **Dato** | Hvilken dag kørslen skal udføres |
| **Fabrik** | Hvor materialet hentes |
| **Produkt og forventede Tons** | Hvilket asfaltprodukt og hvor mange Tons der forventes pr. produkt |
| **Aflæsningssted** | Adressen på pladsen hvor der lægges ud |
| **Forventet antal biler** | Vores vejledende beregning af hvor mange biler dagen kræver |
| **De første biler — faste ankomsttider** | For de første 1-3 biler pr. produkt angiver formanden et fast tidspunkt for, hvornår bilen skal være fremme på pladsen (for eksempel første bil klokken 07.00, anden bil klokken 08.00). Derefter følger et fast interval (for eksempel 20 Minutter), som gælder fra den sidste faste bil og frem — næste bil klokken 08.20, så 08.40 og så videre. De øvrige biler kører herefter blot i fast rytme, indtil dagens Tons er hentet. |
| **Mødetid på fabrik (kun de første biler)** | For de biler der har en fast ankomsttid på pladsen, beregner og oplyser vi mødetiden på fabrikken — bygget på køreafstanden fra fabrik til plads plus 10 procent ekstra køretid. **I skal altså ikke selv regne mødetiden ud.** De øvrige biler i rytmen får ikke en fast mødetid — de møder bare ind i strømmen. |
| **Kommentar til chaufføren** | Eventuelle kørselsspecifikke instruktioner fra formanden (for eksempel "Brug bagvejen" eller "Støjrestriktion efter klokken 22") |
| **Afregningsform** | Om turen afregnes på akkord eller på timeløn |

> Bilerne har **ingen blivende rolle som "første læs" eller "andet læs".** De faste ankomsttider gælder kun de første 1-3 biler pr. produkt og bruges til at få materialet i gang i en jævn strøm. Derefter kører bilerne frem og tilbage mellem plads og fabrik i den faste rytme og fylder, indtil ordrens Tons er hentet — på den sidste tur er der måske kun nogle få Tons tilbage.

---

## 2. Det I sender retur til Colas

Når I har disponeret, sender I tilbage — **for hver bil I sætter på dagen:**

| Oplysning | Forklaring |
|---|---|
| **Biltype** | For eksempel 4-akslet, sættevogn |
| **Chaufførens navn** | Navnet på den chauffør der kører bilen |
| **Chaufførens mobilnummer** | Det nummer chaufføren har på sig — det er hertil vi sender SMS med ordren og linket til webappen |

Hvis den samme bil og chauffør skal køre flere ture på dagen, oplyses bilen bare én gang.

---

## 3. Undervejs på dagen

- **Chaufføren bruger Colas' webapp** (modtaget via SMS) til at registrere ankomst, vejesedler og tider på pladsen og fabrikken.
- **Hvis en chauffør bliver syg, eller en bil bryder ned:** chaufføren afslutter dagen i appen, formanden og I aftaler en erstatning over telefonen, I sætter en ny bil på, og den nye chauffør får automatisk en ny SMS med ordren.

---

## 4. Efter dagen — afregning

Formanden godkender de registrerede Timer og Tons fra dagen og sender afregningsgrundlaget retur til jer. Dette sker separat og kræver ikke, at jeres eget system er koblet på.

---

## Spørgsmål til jer om dataudvekslingen

Vi vil gerne forstå, hvordan jeres eget disponeringssystem arbejder, så vi kan udveksle data så enkelt som muligt:

1. **Modtagelse af bestillingen:** Kan jeres system modtage en bestilling elektronisk og lægge den direkte ind hos jer — eller vil I hellere modtage den på mail/SMS og taste disponeringen ind i en enkel web-formular fra os?

2. **Retur af disponeringen:** Når I har sat biler på, kan jeres system så sende biltype, chaufførnavn og mobilnummer automatisk tilbage — eller vil det blive udfyldt manuelt?

3. **Mobilnummer:** Er chaufførens mobilnummer altid det nummer, chaufføren reelt har på sig på dagen? (Det er afgørende, fordi SMS'en og linket til appen sendes dertil.)

4. **Biltyper:** Bruger I faste betegnelser for biltyper (for eksempel "4-akslet", "sættevogn"), og hvilke betegnelser vil I helst bruge?

5. **Samme bil, flere ture:** Hvordan markerer I bedst, at den samme bil kører flere ture på en ordre?

6. **Skift af chauffør i løbet af dagen:** Når en bil skiftes ud undervejs, hvordan vil I helst give os besked om den nye bil og chauffør?

7. **Filformat:** Hvis jeres system skal modtage bestillingen elektronisk — er der et bestemt format, I har brug for, for at kunne læse den ind?
