# Multi-produkt og pulje-læs — opsummering og UX-forslag

**Til:** Projektgruppen
**Fra:** Colas-appen team
**Dato:** 2026-05-19
**Status:** Opsummering af kundens svar + forslag til løsning
**Bilag:** Bygger videre på `AFKLARING_Multi-produkt_og_Vejekort.md` (sendt 2026-05-18)

---

## 1. Tak for svarene — det var meget brugbart

I har givet os afklaring på langt de fleste spørgsmål. Vi har lavet en opsummering nedenfor af det vi har forstået, plus et forslag til hvordan løsningen kan se ud i appen. Til sidst er der 7 spørgsmål tilbage, som vi gerne vil have lukket før vi lægger os fast — de fire første handler om forretnings-flowet, de tre sidste om hvordan chauffør-appen konkret skal opføre sig.

---

## 2. Det vigtigste vi tog med os

**Én formand ejer altid bilen — uanset antallet af ordrer.**

Det var det helt afgørende svar. Det betyder, at vi ikke skal designe nogle indviklede koordineringsmekanismer mellem to formænd, og at vognmanden ikke skal håndtere multi-produkt — det er formanden, der styrer det fra start til slut.

**To distinkte situationer er kommet frem:**

| Situation | Hvad det betyder | Hvor ofte? |
|---|---|---|
| **Multi-produkt ved bestilling** | Formanden bestiller 2 (sjældent 3) forskellige produkter på samme bil — fx asfalt + lappesand. Hvert produkt har sit eget vejeseddel og kendte tons fra start. | Ugentligt, ofte. |
| **Pulje-læs til småreparationer** | Formanden vejer 3 tons ud, fordelt på op til 7-8 ordrer. Fordelingen sker først om aftenen, hvor formanden ringer til fabrikken og melder ind. | Når der er småreparationsdage. |

De to situationer ligner hinanden på overfladen, men er reelt to forskellige flows i appen. Begge skal kunne håndteres.

---

## 3. Vores forslag — sådan kunne det fungere i appen

### 3.1 Tilkøb som en del af dagsfordelingen

I dagsfordelingen lægger formanden allerede dagens **hovedlæs** ind — produkt og tons fra ordrens egen plan. Det er fastlåst af ordregrundlaget.

Når formanden vil tilføje **ekstra produkter** til samme bil, sker det inde i dagsfordelingen for den pågældende dag. Han åbner dagen og tilføjer ét eller flere tilkøb pr. bil:

```
┌────────────────────────────────────────────────┐
│ Dagsfordeling — Mandag 19/5                    │
├────────────────────────────────────────────────┤
│ Hovedlæs (fra ordrens plan)                    │
│ Ordre:    260423891 (Køge Bugt motorvej)       │
│ Produkt:  SMA 11S · 82101H                     │
│ Tons:     24 t                                 │
│                                                │
│ Tilkøb #1                                      │
│ Produkt:  [SMA 8 — 82103H              ▼]      │
│ Ordre:    [260423892 (Solrød)          ▼]      │
│ Tons:     [ 4 ] t                              │
│ [Fjern]                                        │
│                                                │
│ + Tilføj endnu et produkt                      │
│ + Bestil pulje-læs (fordel senere)             │
│                                                │
│ [Bekræft dagsfordeling — sendes til vognmand]  │
└────────────────────────────────────────────────┘
```

**Hvad det dækker:**

| Situation | Hvordan formanden bestiller |
|---|---|
| 1 bil, 1 produkt, 1 ordre (almindeligt) | Ingen tilkøb — bare hovedlæsset |
| 1 bil, 2 produkter, samme ordre | 1 tilkøb med samme ordrenummer |
| 1 bil, 2 produkter, 2 ordrer (samme formand) | 1 tilkøb med andet ordrenummer |
| 1 bil, 3 produkter, 3 ordrer | 2 tilkøb |
| Småreparationsdag (pulje-læs) | Knappen "Bestil pulje-læs" — fordeles om aftenen |

### 3.2 Pulje-læs — fordel om aftenen

For småreparationsdage bruger formanden "Bestil pulje-læs". Bilen kører med ét produkt, men ordrefordelingen er åben. Om aftenen får formanden et lille kort i sin dagsafslutning:

```
┌────────────────────────────────────────────────┐
│ Fordel pulje-læs                               │
│ Bil FH 51 069 — 3 tons SMA 8 — vejet 14:21     │
├────────────────────────────────────────────────┤
│ Hvilke ordrer skal disse 3 tons fordeles på?   │
│                                                │
│ Ordre [260423891 ▼]   [0.8] t   [Fjern]        │
│ Ordre [260424105 ▼]   [1.2] t   [Fjern]        │
│ Ordre [260424211 ▼]   [1.0] t   [Fjern]        │
│ + Tilføj ordre                                 │
│                                                │
│ Total fordelt: 3.0 / 3.0 t  ✓                  │
│                                                │
│ [Bekræft og send til vognmand]                 │
└────────────────────────────────────────────────┘
```

Det er præcis det, formanden i dag gør telefonisk med fabrikken — bare digitalt og fanget i systemet.

### 3.3 Visuel markering — M, R og A

For at gøre det hurtigt at scanne hvilke biler der er "noget særligt", foreslår vi små pille-badges på alle biler i tabeller og oversigter:

| Badge | Betyder | Hvor det vises |
|---|---|---|
| **M** | Multiprodukt — bilen har 2+ produkter | Formand, vognmand, chauffør |
| **R** | Returlæs — bilen returnerer materiel | Vognmand, chauffør |
| **A** | Ankommet — bilen er på plads | Formand-overblik |
| **P** | Pulje-læs — afventer fordeling | Kun formand |

Eksempel fra formandens vejesedler-overblik:

```
─────────────────────────────────────────────────
 [M] [A]  FH 51 069  Morten Lund   24t + 4t  14:21
     [A]  BD 22 847  Søren K.      23.8t     13:47
 [R]      PL 44 901  Jesper M.     22t       undervejs
 [P]      CK 19 882  Kim Pedersen   3t       afventer fordeling
─────────────────────────────────────────────────
```

Badgene har farve **og** bogstav, så de virker både for hurtig genkendelse og for skærmlæsere.

---

## 4. Konsekvenser for de tre apps

### Formand
- Får et **tilkøbs-felt** direkte i dagsfordelingen (ikke som separat bestillings-skærm)
- Får en **pulje-fordelings-skærm** ved dagsafslutning
- Vejesedler-tabel viser M-bil som to grupperede rækker, med M-badge på første række
- Rekvisitionsseddel kan ved dagsafslutning samle både multi-produkt og pulje-fordelinger

### Vognmand
- Modtager den færdige bestilling af antal biler som i dag — skal ikke gøre noget aktivt
- Ser M-badge på sine biler i Gantt
- Behøver ikke bekymre sig om ordren overhovedet

### Chauffør
- Ser **én opgave** uanset hvor mange produkter eller ordrer der er på bilen
- Kan se M-badge øverst på opgavekortet
- Markerer ankomst pr. **plads** (én bil kan have 2 forskellige pladser, hvis der er to udlæggere)
- Pulje-læs vises bare som en normal opgave — chaufføren skal ikke gøre noget særligt

### Fabrik
- Modtager bestilling — laver tareeret vejning mellem hver produkttype som i dag
- Hvert produkt får sin egen vejeseddel
- Ved pulje-læs: vejer som normalt, fordelingen sker bagefter

---

## 5. De 7 tilbageværende spørgsmål

Vi har brug for jer til at lukke disse, så vi kan lægge os fast på løsningen. De første fire handler om forretnings-flow. De sidste tre handler om hvordan chauffør-appen konkret skal opføre sig under multi-produkt- og pulje-ture.

### Forretnings-flow

**1. Rekvisitionsseddel — digital eller fysisk?**
I dag samler formanden tons + timer på en rekvisitionsseddel ved dagsslut, som vognmanden modtager. Skal vi gøre rekvisitionen digital i appen (med formandens godkendelse, og vognmanden modtager den elektronisk), eller skal appen bare hjælpe formanden med at samle tallene, og selve afleveringen sker som i dag?

**2. Pulje-læs ved bestilling — angives mulige ordrer på forhånd?**
Når formanden bestiller et pulje-læs, har han da en idé om hvilke ordrer det formentlig skal på (kan han fx vælge 3-5 mulige ordrer, der så er forslag når han fordeler om aftenen)? Eller er det helt åbent indtil aftenens fordeling?

**3. 1,5-times-reglen — automatisk eller manuelt skift?**
Akkord-aftalen siger at hvis bilen ikke er aflæsset inden 1,5 time efter ankomst, skifter hele dagens kørsel for den bil til timeløn. Skal appen automatisk skifte når den måler at 1,5 time er overskredet, eller skal det være formandens beslutning at flippe det manuelt? *(Vores anbefaling: vis det automatisk som forslag, men formanden bekræfter — så undgår vi falske skift pga. GPS-fejl.)*

**4. Tilkøbs-ordrer på andre datoer?**
Kan en bil bestilt til mandag have et tilkøb der hører til en ordre der løber over flere uger, eller skal alle tilkøbs-ordrer være aktive samme dag? *(Vi antager: kun ordrer der er åbne samme dag — bekræft venligst.)*

### Chauffør-app

**5. Chauffør-app ved fabrikken på en M-tur — simplified skærm?**

Den almindelige chauffør-app guider step-by-step når chaufføren ankommer til fabrikken: *"Velkommen til Køge"* → *"Kør på vægten — tomvejning"* → *"Kør til silo 3 og læs"* → *"Kør tilbage på vægten"* → *"Kør videre"*.

For en multi-produkt-tur ville den sekvens skulle udvides med taravejning mellem hvert produkt — og det bliver skrøbeligt, hvis fabrikken vælger en anden silo-rækkefølge, eller hvis der er kø.

Vores forslag er at chaufføren ved en M-tur i stedet ser en enkel skærm der lister hans læs og siger:

> *"Velkommen til Køge fabrik. Du har et multi-produkt-læs: SMA 11S 24t + SMA 8 4t. Følg fabrikkens anvisninger — de tager dig igennem læsningen. Tryk når bilen er læsset og vejet."*

Fabrikkens personale ved at det er en multi-produkt-tur og guider verbalt.

**Spørgsmål:** Er det OK? Mister vi noget kritisk ved at chaufføren ikke trykker sig gennem detaljerede trin?

*(Den væsentlige note: De mellemliggende vejetimestamps — tomvejet, læsset, endelig vejning — kommer alligevel fra Danvægt, ikke fra chaufførens app. Vi mister kun chaufførens bekræftelse af hvert trin — ikke selve vejedataet.)*

**6. Chauffør-app ved levering af pulje-læs — hvordan ser flowet ud?**

En pulje-bil typisk stopper 5-7 forskellige steder i løbet af dagen og leverer små mængder. Det er ikke som en normal tur hvor chaufføren læsser af på én plads.

Tre muligheder:
- **a)** Appen viser en *liste over mulige pladser* (ud fra de ordrer formanden har markeret) — chaufføren krydser af når han har været der
- **b)** Chaufføren *manuelt indtaster* "Aflæsset på [adresse/ordre] kl. [tid]" hver gang han stopper
- **c)** Geofence *detekterer automatisk* at han er ankommet til en kendt ordre-plads, og spørger "Aflæsser du her? [Ja/Nej]"

Vores forslag er **c kombineret med b** — geofence-detektion hvor det er muligt, fri tekst hvor det ikke er. Chaufføren indtaster **ikke** tonsmængde — det er formandens fordeling om aftenen der afgør tons.

**Spørgsmål:** Er den kombination OK? Eller vil I have en simplere model — fx kun (a)?

**7. 1,5-times-reglen — hvilke to tidspunkter måles imellem?**

For at kunne advare formand/chauffør om at akkord-grænsen nærmer sig (og evt. automatisk skifte til timeløn — se spørgsmål 3), skal vi vide præcist hvilke to tidspunkter reglen sammenligner:

- **a)** Forlader fabrik → aflæsset på plads (leveringstid)
- **b)** Ankomst plads → aflæsset på plads (aflæsningstid)
- **c)** Ankomst plads → forlader plads (samlet plads-tid)
- **d)** Noget andet — fx ankomst fabrik → forlader plads (samlet tur-tid)?

**Spørgsmål:** Hvilken fortolkning gælder i akkord-aftalen?

---

## 6. Når disse er besvaret

- Vi låser datamodellen (kørsel → læs → ordre-fordeling)
- Vi tegner de tre skærme færdig (dagsfordeling med tilkøb, pulje-fordeling, vejesedler-overblik)
- Vi indarbejder M/R/A/P-badgene i komponentbiblioteket
- Vi opdaterer chauffør-app'en til at vise "én opgave med flere læs"

Vi kan starte forarbejdet på datamodellen mens vi venter på svar — der er rigeligt at gå i gang med på den side.

---

*Spørg endelig hvis noget af ovenstående ser anderledes ud end I havde tænkt jer det. Det er nemmere at justere nu end senere.*
