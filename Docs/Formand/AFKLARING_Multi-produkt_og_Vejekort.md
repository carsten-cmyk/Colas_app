# Afklaringspunkter — bil med flere produkter + vejekort på Danvægt

**Til:** Projektgruppen
**Fra:** Colas-appen team
**Dato:** 2026-05-18
**Status:** Afventer svar — input fra workshop med formænd

---

## Baggrund

På workshoppen kom det frem, at en bil i nogle tilfælde kører med **flere produkter på samme tur** — typisk ét produkt læsset forrest og et andet bagved. Det kan være to produkter til **samme ordre**, eller produkter til **to forskellige ordrer** (og dermed to forskellige formænd).

Det her er en hverdagssituation for chaufførerne, men det rører ved næsten alle dele af løsningen: chauffør-appen, formandens overblik, timeregistreringen, vognmandens disponering og vejningen på fabrik. Vi skal derfor have nogle ting afklaret med jer, før vi kan lægge sig fast på, hvordan vi viser og håndterer det i systemet.

Vi har skitseret vores antagelser nedenfor — fortæl os hvor vi rammer rigtigt, og hvor vi mangler nuancer.

---

## 1. Selve læsset og vejningen

**Vores antagelse — bekræft venligst:**
- Hvert produkt får sit eget vejeseddel-nummer
- Hvert produkt vejes for sig (der tareres efter første læsning og første vejning, så det andet læs vejes rent)
- Der kommer altså to vejesedler fra fabrikken — én for hvert produkt — selv om det er samme bil og samme tur

**Spørgsmål:**
1. Sker det altid med præcis to produkter, eller kan der være tre? (Forrest, midt, bagved)
2. Findes der scenarier, hvor de to produkter har **forskellig fabrik** (chaufføren henter forrest fra fabrik A og bagved fra fabrik B)?
3. Hvor ofte sker det her i praksis — er det undtagelsen eller noget, der sker dagligt?
4. Hvem beslutter, at en bil skal køre med to produkter? Er det vognmanden ved disponering, fabrikken, eller chaufføren selv?

---

## 2. Når de to produkter er på samme ordre

**Vores antagelse:**
- Begge læs vises i formandens overblik som "ankomne tons" på dagens ordre
- Temperatur måles separat på hvert læs (forskellige produkter kan have forskellig minimums-temperatur)
- Hvert læs kan tildeles sin egen udlægger

**Spørgsmål:**
5. Læsses begge produkter af på samme plads, eller kan ét produkt være til formiddag og ét til eftermiddag?
6. Bliver bagest-læs altid læsset af først — eller kan formanden bestemme rækkefølgen efter ankomst?
7. Skal vi vise klart i appen, at "denne bil har to produkter med", eller skal de to læs bare vises som to selvstændige linjer i tabellen?

---

## 3. Når de to produkter er på to forskellige ordrer

Det her er den sværeste situation, for nu er der **to formænd** der hver især "ejer" hver sit læs af samme bil.

**Spørgsmål:**
8. Skal begge formænd kunne se bilen i deres overblik? (Vi antager ja — men kun deres eget produkt-læs)
9. Hvad sker der med tiden, bilen bruger på at køre mellem de to pladser? Skal det tælle med på første eller anden ordre, eller deles?
10. Hvis bilen først kommer til plads 1 (læsser bagved af), kører videre til plads 2 (læsser forrest af) — hvordan ser formand 2's "forventede ankomsttid" ud, mens bilen stadig læsser af hos formand 1?
11. Hvordan koordineres aflæsningen, hvis to formænd uafhængigt af hinanden venter på samme bil?

---

## 4. Timeregistrering og afregning

Når én bil kører for to ordrer samtidigt, kan timerne ikke længere bare lægges på én ordre.

**Spørgsmål:**
12. Skal timerne **deles** mellem de to ordrer? Hvis ja, efter hvilken regel — fordeling efter tons, efter aflæssetid, eller halvt-halvt?
13. Hvis bilen afregnes pr. ton (akkord), tæller hvert produkt selvstændigt mod sin egen ordres tonstal — det er nemt. Men hvis bilen afregnes pr. time, hvem "ejer" så timerne? Vognmanden? Formanden på første ordre? Eller deles det?
14. Er der i dag en praksis for hvordan delte ture afregnes, som vi kan bygge videre på?

---

## 5. Vognmandens disponering

I dag forventer vi, at vognmanden disponerer **én bil til én ordre pr. tur**. Det skal ændres.

**Spørgsmål:**
15. Hvordan beslutter vognmanden i dag, at to ordrer skal "deles" på samme bil? Er det manuel sammenkobling, eller efter en fast aftale med kunden?
16. Skal vognmanden i appen aktivt kunne **koble to ordrer sammen på samme tur** — fx ved at sige "denne bil tager både ordre A og ordre B"?
17. Findes der begrænsninger for hvilke produkter, der må deles på samme bil (rene asfaltprodukter sammen, ikke beton og asfalt, osv.)?
18. Er det altid både formændene OG vognmanden, der ved på forhånd at bilen er delt — eller kan chaufføren beslutte ved fabrikken, at "jeg har plads til et ekstra produkt"?

---

## 6. Chauffør-appen

Chaufføren er central her — det er ham, der fysisk har begge produkter med, og som ved hvilket læs der hører til hvilken ordre.

**Spørgsmål:**
19. Skal chaufføren se **én opgave med to under-læs** ("Tur 14: SMA 11S til ordre A foran + AB 11 til ordre B bagved"), eller skal det vises som **to separate opgaver** i hans liste?
20. Hvordan markerer chaufføren ankomst og aflæsning? Én gang pr. plads, eller én gang pr. produkt?
21. Hvis han kommer til plads 1 og kun aflæsser det bageste — skal app'en automatisk forstå, at han stadig har ét læs med, og rute ham videre til plads 2?
22. Skal chaufføren kunne **selv tilføje** et ekstra produkt på en tur, hvis det først besluttes ved fabrikken? Eller skal det altid være planlagt på forhånd?

---

## 7. Vejekort på Danvægt (NFC card emulation)

I dag bruges der **fysiske kort, der kodes om hver dag** til chaufførerne. Chaufføren holder kortet hen til Danvægt-læseren ved fabrikken, hvorefter vægten ved hvem chaufføren er og hvilken ordre vejesedlen skal kobles til.

**Vores tekniske retning (afklaret med Carsten 2026-05-20):**

Telefonen skal **fungere som et virtuelt NFC-kort** — chaufføren holder telefonen hen til Danvægt-læseren, og læseren identificerer ham. Det er IKKE telefonen der scanner Danvægt; det er Danvægt der læser telefonen, præcis som et fysisk kort i dag.

Teknisk hedder mønsteret **Host Card Emulation (HCE)**:
- **Android:** Indbygget HCE-API. Appen broadcaster et "kort-ID" når telefonen er låst op + nær læseren.
- **iOS:** Begrænset — virker kun via **Apple Wallet-passes** eller specifik partnerintegration. Ikke samme frihed som Android.

**Kritisk forudsætning:** Danvægt-læseren skal acceptere standard **13,56 MHz NFC (ISO 14443-A/B)**. "RFID" er en bred kategori, og kun NFC-frekvensen kan emuleres af en telefon.

| RFID-variant | Frekvens | Telefon kan emulere? |
|---|---|---|
| Low-frequency RFID (ældre adgangskort) | 125 kHz | ❌ Nej |
| **NFC (ISO 14443)** | 13,56 MHz | ✅ Ja (Android HCE; iOS via Wallet) |
| UHF RFID (lager-tags) | 860-960 MHz | ❌ Nej |

**Spørgsmål til kunden:**

23. **Hvilken NFC/RFID-standard bruger Danvægt-læseren?** Specifikt: er det **13,56 MHz NFC / ISO 14443-A eller B**? Dette står typisk på selve læseren eller kan oplyses af Danvægt. Hvis ja → telefonen kan emulere kortet. Hvis 125 kHz eller UHF → kræver hardware-skift hos Danvægt eller alternativt identifikations-flow (fx QR-kode på skærm i bilen som læseren scanner).

24. Hvor mange kort er i omløb i dag, og hvem håndterer den daglige om-kodning (administrativt)?

25. Hvordan ser jeres aftale ud med Danvægt — kan vi få adgang til at integrere chauffør-appen mod deres vægt-systemer (få det "kort-ID" appen skal broadcaste tildelt programmatisk hver dag), eller skal vi gå gennem Danvægt for hver tilpasning?

26. Hvis vi går videre med HCE-løsningen: **hvad er backup'en**, hvis chaufføren glemmer telefonen, batteriet er fladt, NFC er slået fra, eller appen crasher ved vægten? Skal kortene leve videre som backup i en overgangsperiode? Hvad er den minimale "graceful degradation"?

27. Er det realistisk at fase kortene ud helt, eller skal app + kort eksistere parallelt i en længere periode (anbefales 6-12 mdr)?

28. Skal vejningen kunne **sende vejesedlen direkte ind i Colas-systemet** ved scanning (real-time push fra Danvægt → Colas), eller vil vi stadig hente vejesedler via PLAN med ~10 min forsinkelse?

29. **iOS-flåde:** Hvor mange af jeres chauffører bruger iPhone vs. Android? iOS-NFC er begrænset — hvis flertallet er iPhone, skal vi enten lave Apple Wallet-pass-integration eller acceptere at flåden standardiserer på Android-enheder.

**Risici hvis det IKKE er 13,56 MHz NFC:**
- Hardware-skift hos Danvægt (potentielt på alle fabrikker) → kapital-investering + udrulnings-tid
- Alternativ: QR-kode-flow (læseren scanner skærm) — kræver kamera på Danvægt eller separat kameralæser
- Alternativ: Bluetooth/BLE-broadcast — kræver software-opgradering af læseren

---

## Hvad sker der med svarene?

Når vi har jeres input, kan vi:
- Tegne det færdige flow for, hvordan en bil med to produkter ser ud — for chauffør, formand, vognmand og fabrik
- Beslutte, om vi viser delte ture som én linje eller to i formand-appen
- Lægge en plan for, om/hvornår de fysiske vejekort kan erstattes af chauffør-appen
- Estimere tids- og udviklingsforbrug for de tre områder samlet

**Vi prioriterer afklaring på punkt 1, 8, 12 og 23 først** — de afgør resten.

---

*Skriv jeres svar direkte ind under hvert punkt og send retur, eller book et 30-minutters opklaringsmøde, hvor vi går igennem det sammen.*
