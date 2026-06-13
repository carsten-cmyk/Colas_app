# Daglig kørselsbestilling — dataudveksling mellem Colas og vognmand

## Sådan foregår en dag

**Dagen før** sender Colas jer en kørselsbestilling pr. ordre. I disponerer biler og chauffører på bestillingen og sender retur, hvilke biler I sætter på. Hver chauffør får herefter automatisk en SMS fra Colas med dagens ordre og et link til en webapp, som chaufføren bruger på pladsen og fabrikken.

---

## 1. Det I modtager fra Colas (dagen før)

For hver kørselsbestilling sender vi:

| Oplysning | Forklaring |
|---|---|
| **Ordrenummer** | Reference på ordren |
| **Bil-ordrenummer (pr. bil)** | Hver enkelt bestilt bil får sit eget unikke nummer i formatet `<ordrenummer>-DDMMYY-NN` (for eksempel `1212343-170326-01`). Løbenummeret nulstilles hver dag. Det betyder, at I kan behandle **hver bil som en separat ordre** — og at en ny dag giver nye ordrer. Nummeret skal bæres med tilbage på den bil, I sætter på (se afsnit 2), så vi kan koble jeres bil til den rigtige bestilling. |
| **Dato** | Hvilken dag kørslen skal udføres |
| **Fabrik** | Hvor materialet hentes |
| **Produkt og forventede Tons** | Hvilket asfaltprodukt og hvor mange Tons der forventes pr. produkt |
| **Aflæsningssted** | Adressen på pladsen hvor der lægges ud |
| **Forventet antal biler** | Vores vejledende beregning af hvor mange biler dagen kræver |
| **Opstart — ankomsttider på pladsen** | For de første 1-3 biler pr. produkt angiver formanden et fast tidspunkt for, hvornår bilen skal være fremme på pladsen (for eksempel første bil klokken 07.00, anden bil klokken 08.00). Derefter følger et fast interval (for eksempel 20 Minutter) fra den sidste faste bil og frem, som giver hver af de øvrige biler et opstartstidspunkt — næste bil klokken 08.20, så 08.40 og så videre, **indtil alle biler er kommet i gang.** Derfra kører bilerne videre i loop, indtil dagens Tons er hentet. |
| **Mødetid på fabrik pr. bil** | For **hver** bil beregner og oplyser vi en mødetid på fabrikken til bilens **første ankomst** — bygget på køreafstanden fra fabrik til plads plus 10 procent ekstra køretid. De første 1-3 biler følger formandens faste tider; de øvrige biler følger intervallet (08.20, 08.40 …) indtil alle er i gang. Når hele flåden kører, fortsætter de i loop uden flere faste tider. **I skal altså ikke selv regne mødetiden ud.** |
| **Kommentar til chaufføren** | Eventuelle kørselsspecifikke instruktioner fra formanden (for eksempel "Brug bagvejen" eller "Støjrestriktion efter klokken 22") |
| **Afregningsform** | Om turen afregnes på akkord eller på timeløn |

> Bilerne har **ingen blivende rolle som "første læs" eller "andet læs".** De eksplicit fastsatte ankomsttider gælder kun de første 1-3 biler pr. produkt; de øvrige biler får et opstartstidspunkt beregnet ud fra intervallet og indgår i flowet, indtil hele flåden er i gang. Derefter kører bilerne frem og tilbage mellem plads og fabrik og fylder, indtil ordrens Tons er hentet — på den sidste tur er der måske kun nogle få Tons tilbage.

---

## 2. Det I sender retur til Colas

Når I har disponeret, sender I tilbage — **for hver bil I sætter på dagen:**

| Oplysning | Forklaring |
|---|---|
| **Bil-ordrenummer** | Det nummer (`<ordrenummer>-DDMMYY-NN`) vi sendte for netop den bil — så vi kan matche jeres bil mod den rigtige bestilling |
| **Biltype** | For eksempel 4-akslet, sættevogn |
| **Chaufførens navn** | Navnet på den chauffør der kører bilen |
| **Chaufførens mobilnummer** | Det nummer chaufføren har på sig — det er hertil vi sender SMS med ordren og linket til webappen |

**Flere ture med samme bil:**

- Kører den samme bil og chauffør flere ture på **samme ordre** — eller på en samleordre eller en "samles på en bil"-bestilling — oplyses bilen bare **én gang**. Den kører blot i loop, indtil ordren er færdig.
- Sætter I derimod den samme bil og chauffør på **flere forskellige ordrer** i løbet af dagen (ordrer der **ikke** er slået sammen som samleordre eller samlelæs), **skal vi vide det.** Oplys da bilen på **hver** af de ordrer, den dækker, så chaufføren ser alle sine opgaver, og hver formand ved, at bilen er booket på netop deres ordre.

---

## 3. Undervejs på dagen

- **Chaufføren bruger Colas' webapp** (modtaget via SMS) til at registrere ankomst, foretage vejninger på fabrikken og aflæsning på pladsen.
- **Hvis en chauffør bliver syg, eller en bil bryder ned:** chaufføren afslutter dagen i appen, formanden og I aftaler en erstatning over telefonen, I sætter en ny bil på, og den nye chauffør får automatisk en ny SMS med ordren.

---

## 4. Efter dagen — afregning

Formanden godkender de registrerede Timer og Tons fra dagen, som kommer via appen, og sender afregningsgrundlaget retur til jer. Dette sker separat og kræver ikke, at jeres eget system er koblet på.

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

---

## Teknisk leverancemodel (arbejdsmodel — valgt 2026-06-10)

> Foreløbig retning: **daglig fil-leverance dagen før.** Lavest fællesnævner — stort set ethvert disponeringssystem kan eksportere en CSV, og det kræver ingen realtids-integration. De fleste vognmænd forventes at kunne levere dette.

### Hovedmodel — dagen før

1. Vognmanden disponerer i **sit eget system**.
2. Systemet eksporterer disponeringen som en **CSV-fil** (eller tilsvarende aftalt format).
3. Filen lægges på et **nærmere defineret sted** — en **SFTP**-drop-mappe.
4. Colas **henter og indlæser** filen automatisk.

Dette dækker den planlagte disponering — det vil sige ~95 % af tilfældene, hvor alt er kendt dagen før.

### Filkontrakten (skal låses pr. vognmand)

| Felt | Krav | Hvorfor |
|---|---|---|
| **Bil-ordrenummer (Colas' reference pr. bil)** | Skal med i hver række | **Match-nøglen** (`<ordrenummer>-DDMMYY-NN`) — kobler jeres bil til præcis den bestilte bil. Hver bil er en separat ordre, så match sker på bil-niveau, ikke kun ordre-niveau |
| **Ordrenummer (Colas' reference)** | Skal med i hver række | Menneskeligt-læsbar reference til moderordren (kan udledes af bil-ordrenummeret, men medsendes for læsbarhed) |
| **Biltype** | Faste betegnelser | Mappes mod Colas' biltyper — aftal de eksakte tekster/koder |
| **Chaufførnavn** | Påkrævet | Vises til formand + chauffør |
| **Chaufførens mobilnummer** | **Påkrævet — ikke valgfrit** | Hele SMS-flowet falder hvis det mangler eller er forkert |
| **Samme bil, flere ture / flere ordrer** | Aftalt repræsentation | Jf. spørgsmål 5 ovenfor |

**Format:** CSV i **UTF-8** (danske tegn), header-række, fast separator. **Deadline:** filen skal ligge senest et aftalt tidspunkt dagen før (fx kl. 18) — ellers får formanden besked om at en vognmand ikke har leveret.

### Sikkerhed

- **SFTP** (krypteret) — ikke almindelig FTP. Filen indeholder persondata (chaufførnavn + mobil).
- Drop-endpoint i **EU**.
- **Databehandleraftale** med vognmanden.
- Renest: **Colas** stiller en drop-mappe til rådighed pr. vognmand, så placering, kryptering og jurisdiktion er under Colas' kontrol.

### Én kontrakt, to døre

Samme felter og samme validering uanset indleveringsvej:

- **Store vognmænd med system:** CSV-fil via SFTP (modellen ovenfor).
- **Små vognmænd uden system:** taster ind i en enkel Colas web-formular.

Begge ender i samme `confirmed_vehicles[]` i Colas' DB. Der bygges aldrig to datamodeller — kun to indgange til den samme.

### Parkeret til senere — edge-cases

> Bevidst udskudt 2026-06-10. Den daglige fil løser den planlagte disponering; følgende sker i realtid på dagen og håndteres senere (foreløbig via telefon + manuel opdatering i portalen → ny SMS til ny chauffør):

- **Sygdom / nedbrud** — chaufførskift på dagen.
- **Ekstra bil sat på undervejs** — flere biler end disponeret dagen før.

Disse skal **ikke** presses ind i den daglige fil — de designes som et separat, mindre flow når hovedmodellen står.
