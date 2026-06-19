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

### Edge-cases på dagen (afklaret 2026-06-19)

Den daglige fil løser den **planlagte** disponering. Følgende sker i realtid på dagen:

- **Sygdom / nedbrud → erstatningsbil:** formand og vognmand taler sammen, og vognmanden sender erstatningsbilen **via filudvekslingen** (samme kanal/format, ad-hoc indlevering — ikke den planlagte dagsfil). Erstatningsbilen binder til samme bil-ordrenummer-slot. Se "Bil-identitet" nedenfor.
- **Ekstra bil sat på undervejs** — flere biler end disponeret dagen før: håndteres som en ekstra ad-hoc indlevering via samme kanal.

---

## Udvekslings-model — fire øjeblikke + vognmand-app (LÅST 2026-06-19)

Udvekslingen mellem Colas og vognmand er **ikke** en løbende live-strøm. Den består af **fire diskrete øjeblikke**:

| # | Øjeblik | Retning | Indhold |
|---|---|---|---|
| 1 | **Bestilling** (dagen før) | Colas → vognmand | Kørselsbestilling pr. ordre — jf. afsnit 1 |
| 2 | **Ordrebekræftelse af biler** (disponering retur) | Vognmand → Colas | Pr. bil: bil-ordrenummer + biltype + chauffør + mobil + **reelt reg.nr** — jf. afsnit 2 |
| 3 | **Dag afsluttet** (på dagen) | Begge veje, samme event | Besked om at en bil er færdig for dagen → kan disponeres andetsteds |
| 4 | **Afregning** (efter dagen) | Colas → vognmand | Timer (app vs godkendt) + tons + vejesedler |

Mellem disse øjeblikke er der **ingen** udveksling. Vejesedler/tons strømmer ikke live; de samles og leveres ved afregning (øjeblik 4).

### Vognmand-app — spejler formandens 3-mode

Vognmandens ordre-detalje får samme toggle som formanden: **Planlægning · Udførsel · Afregning**. Hvert felt mærkes med retning (`Modtaget fra Colas` / `Sendt retur` / `Besked`), så siden samtidig er den visuelle kontrakt over hvad der udveksles.

- **🔵 Planlægning** = øjeblik 1 + 2. Modtaget bestilling + disponerings-retur (biltype, chauffør, mobil, reelt reg.nr) + materiel.
- **🟠 Udførsel** = øjeblik 3. **Kun hændelses-beskeder** — ingen live-data:
  - **Dag afsluttet** pr. bil — udløses ens uanset om chaufføren afslutter i app'en *eller* formanden frigiver bilen (samme `dag_afsluttet`-event). Bilen er fri → kan disponeres andetsteds.
  - **Aflyst** (vejr m.m.)
  - **Erstatning nødvendig**
- **🟢 Afregning** = øjeblik 4. Vejesedler + akkumuleret tons pr. bil pr. ordre + timer pr. chauffør pr. dag.

### Bil-identitet — fast match-nøgle, reelt reg.nr binder på (LÅST 2026-06-19)

- **Bil-ordrenummeret** (`<ordrenr>-DDMMYY-NN`) er den **permanente match-nøgle**. Den ændrer sig aldrig og bæres gennem hele livscyklussen (bestilling → bekræftelse → fabrik → chauffør → afregning).
- Vognmandens **reelle reg.nr** bindes til match-nøglen ved ordrebekræftelse (øjeblik 2) og er det, **al udførsels- og afregningsdata hænger på** (vejesedler, tons, timer). Indtil reg.nr er returneret, hænger data midlertidigt på bil-ordrenummeret.
- **Erstatning (nedbrud, sygdom mv.):** formand og vognmand **taler sammen** om erstatningen, og vognmanden **sender erstatningsbilen via filudvekslingen** (samme kanal — CSV/SFTP eller web-formular, ikke en separat vej). Den nye bil binder sit reg.nr til **samme bil-ordrenummer-slot**. Den gamle markeres `Afsluttet`, den nye `Ny`. **Formandssiden røres ikke** — bilen ryger blot i flow og på "bekræftede biler" med markering. Den frigjorte bil kan disponeres andetsteds.

### Ændrings-cutoff (LÅST 2026-06-19)

- **Én fælles cutoff dagen før (fx kl. 18)** — samme tidspunkt som fil-deadline.
- Efter cutoff kan **hverken formand eller vognmand** redigere disponeringen i app'en. Redigeringsforsøg viser en **ring-modal** ("Ændringer efter kl. 18 skal aftales telefonisk").
- Adskilt fra **kl-11-fabriksdeadlinen** (formand → fabrik), som er en anden regel.

### Afregning — felter Colas sender retur (LÅST 2026-06-19, opdateret)

Afregningen vises **pr. chauffør pr. dag** og er afhængig af afregningstype (jf. FUNCTIONAL_FLOWS Trin 6b):

| Felt | Indhold |
|---|---|
| **Afregningstype** | `time` eller `akkord` |
| **Formand-godkendte timer** | `time` → køretid · ventetid · hviletid · `akkord` → **kun ventetid** (køretid/hviletid ikke relevant) |
| **Chauffør-app rå-timer** | Køretid · ventetid · hviletid — chaufføren logger ALTID alle tre, uanset type. Vises så vognmanden kan se forskellen mod formandens godkendte tal (Færdselsstyrelse-dokumentation) |
| **Årsag til ændrede timer** | Fritekst fra chauffør-app — chaufførens begrundelse hvis han har justeret timer (kan være tom) |
| **Chauffør-kommentar** | Fritekstkommentar fra chaufføren (kan være tom) |
| **Tons** | Akkumuleret pr. bil pr. ordre |
| **Vejesedler** | Pr. læs: tidspunkt · produkt · tons (vises når chaufføren foldes ud) |

Ingen "diff"-kolonne — vognmanden ser app- og formand-tal ved siden af hinanden og vurderer selv afvigelsen. Spejler formandens **Bil- og tonsafregning**.

### Format-konventioner (LÅST 2026-06-19)

Gælder både CSV-fil og web-formular. Følger `.claude/docs/DATOFORMAT.md` (storage-format i fil; lang-format kun til UI-visning).

| Felttype | Format | Eksempel |
|---|---|---|
| **Dato** | ISO 8601 `yyyy-mm-dd` | `2026-03-17` |
| **Tid** | `HH.mm` (24-timer, punktum) | `07.15` |
| **Tons** | Heltal | `96` |
| **Separator** | Semikolon | `;` |
| **Tegnsæt** | UTF-8 (med BOM så Excel læser danske tegn) | — |

> NB: Tider i CSV skrives som `HH.mm` med punktum jf. kontrakten — vær opmærksom på at felter kan kræve anførselstegn hvis et parser-system fejllæser punktum som decimal.

### CSV-kolonner

**Bestilling (Colas → vognmand):**
`bil_ordrenummer; ordrenummer; dato; fabrik; produkt; forventet_tons; aflaesningssted; forventet_antal_biler; ankomst_plads; moedetid_fabrik; afregningsform; kommentar`

**Disponering retur (vognmand → Colas), én række pr. bil:**
`bil_ordrenummer; reg_nr; biltype; chauffoer_navn; chauffoer_mobil`

**Match-nøgle:** `bil_ordrenummer` (`<ordrenr>-DDMMYY-NN`) er fælles i begge retninger og kobler bekræftet bil mod bestillingen.

### Vognmand-app (prototype)

`DataudvekslingScreen` (menupunkt "Dataudveksling") viser begge kontrakter felt-for-felt med format-eksempler, leverer **downloadbare CSV-eksempler** (bestilling + retur) og en **"Opdatér"-knap** der puller klar-data fra Colas (læser kun nuværende tilstand — trigger **ikke** server-generering on-demand; den automatiske SFTP-push står ved magt).
