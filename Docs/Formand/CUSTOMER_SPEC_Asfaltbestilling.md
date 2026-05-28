---
section: asfaltbestilling
app: formand
tab: planlægning
document_type: customer_spec
created: 2026-05-27
last_updated: 2026-05-27
status: draft (afventer kunde-gennemgang)
print_format: A4
---

# Asfaltbestilling — Funktionsbeskrivelse

> **Dette dokument**: Beskriver hvordan formanden bestiller dagens asfalt på en ordre, og hvilke konsekvenser hver handling har for fabrik, vognmand og chauffør.
> **Til**: Kundens gennemgang og godkendelse inden udvikling
> **Sign-off**: Sidste side

---

## 1. Formål

Formanden bruger Asfaltbestilling **hver morgen** til at fortælle fabrikken og vognmanden hvad der skal produceres og køres ud i løbet af dagen. Sektionen er det første touch-point i arbejdsgangen — uden dem ingen produktion, ingen biler, ingen kørsel.

Sektionen dækker både:
- **Morgenbestillingen** (planlagt dagsforbrug)
- **Ekstra-bestillinger** løbende på dagen, når formanden ser at mere er nødvendigt
- **Aflysninger** ved fx regn, frost eller dårligt underlag
- **Markeringer** der signaler hvilke produkter skal pakkes på samme bil

---

## 2. Brugerrejse — morgenbestillingen

### Trin 1: Formanden åbner ordren
Formanden åbner dagens ordre og lander på **Planlægning-tabben**. Han ser dagens dato øverst i en række pillen-knapper (én pille per dag i den planlagte udførelses-periode). Den aktive dag er fremhævet.

### Trin 2: Formand ser dagens produkter
Under datovælgeren ligger ét boks-felt per **produkt** (fx "AB 11t" eller "SMA 8t"). Hvert produkt-felt viser:
- Produktnavn + receptkode + tykkelse
- Felt: **"Forventet i dag"** (tonsPlanned — formandens estimat)
- Felt: **"Morgen-bestilling"** (morgenTons — det fabrikken skal producere)
- Status: Afventer / Sendt / Aflyst

### Trin 3: Formand indtaster tons
Formanden taster det antal tons han vil bestille til morgenproduktion ind i hvert produkt-felt. Han kan også tilføje **"Samles på en bil"**-flag hvis 2-3 produkter skal pakkes sammen.

### Trin 4: Formand klikker "Send til fabrik"
Bunden af sektionen har én knap: **"Send til fabrik"**. Klik åbner en bekræftelses-modal med:
- Opsummering: hvilke produkter, hvor meget, hvilken dato
- Felt for **kommentar til fabrik** (valgfri)
- Bekræft-knap

Når formanden bekræfter, sendes **alle dagens bestillinger** som én samlet pakke (atomic batch) til både fabrik og vognmand. Optisk: alle produkt-felter skifter til status **"Sendt"** og bliver låst for redigering.

### Trin 5: Senere på dagen — ekstra-bestilling
Hvis formanden ser at der køres mere end planlagt, kan han klikke **"+ Tilføj ekstra bestilling"**. Han vælger produkt fra en dropdown, taster tons, og sender. Ekstra-bestillinger har samme cross-app effekt som morgen-bestilling.

### Trin 6: Aflysning ved dårligt vejr
Hvis vejret skifter, kan formanden aflyse et enkelt produkt for en specifik dag. Han vælger en **årsag** (regn / frost / dårligt underlag / andet) og bekræfter. Fabrik og vognmand modtager besked og kan frigøre ressourcer.

Aflysning kan fortrydes (kun lokalt — kræver ny send hvis dagen tidligere var sendt).

---

## 3. Forretningsregler

### 3.1 Morgenbestilling
- **Atomic batch**: Alle ændringer på én dag sendes som én transaktion. Enten lykkes alt eller intet.
- **Lås efter send**: `morgenTons`, `tonsPlanned`, `samlesPaaEnBil` kan IKKE redigeres efter "Sendt"-status. Rettelser sker pr. telefon til fabrik.
- **Vejr-flag og aflysning** kan stadig sættes efter send.
- **Sum-warning**: Hvis summen af `tonsPlanned` overstiger ordrens totale bestilte tons, vises en blød advarsel — men det blokerer ikke afsendelsen.
- **Kommentar pr. dag**: Én kommentar gælder alle bestillinger sendt samme batch.

### 3.2 Ekstra-bestillinger
- Tilføjes løbende efter morgenbestillingen.
- Skal have produkt valgt før de kan sendes.
- Slettes lokalt indtil de er sendt — efter send er de låst (samme regler som morgenbestilling).
- Har eget atomic-batch-flow uafhængigt af morgenbestillingen.

### 3.3 "Samles på en bil"-flag
- Markeres pr. produkt pr. dag (også pr. ekstra-bestilling).
- Signalerer at op til 3 produkter skal pakkes på samme bil hvis bilens kompartmenter tillader det.
- Driver et særskilt loading-flow hos chauffør (multi-produkt-script på fabrik).
- Synligt hos fabrik (planlæg samtidig produktion), vognmand (matche bilens kapacitet) og chauffør (læsse-instruktion).

### 3.4 Aflysningsårsager
Faste valg (ikke fri-tekst): **regn · frost · underlag · andet**. Kun "andet" kræver kommentar.

### 3.5 Offline-håndtering
- Formand kan indtaste og sende selv uden internet.
- Send-handlingen lægges i en write-queue der synkroniseres når forbindelse genoprettes.
- Optisk UI viser **"Sendt"** med det samme (optimistic) — hvis batchen fejler ved sync, vises fejl + auto-rollback efter 5 sekunder.

### 3.6 Frosne valg (allerede besluttet med kunden)
| Beslutning | Dato | Værdi |
|---|---|---|
| Status-ord | 2026-05-26 | Afventer / Sendt / Aflyst (på dansk, ikke engelsk) |
| Datoformat i UI | 2026-05-26 | "16. marts 2026" (lang form) |
| Multi-produkt-model | 2026-05-19 | Samme bil kan rumme op til 3 produkter |
| Aflysnings-årsager | 2026-05-22 | 4 faste valg + fri-tekst kun ved "andet" |

---

## 4. Skærmbilleder

> **Bemærk:** Prototype er klar — se på `formandsapp.netlify.app` (eller lokalt på port 5174) → en ordre → Planlægning-tabben.
>
> **Til print-versionen:** Indsæt skærmbilleder her af:
> 1. Planlægning-tab med datovælger + 3 produkt-bokse (default state)
> 2. Produkt-boks med tons indtastet, "Samles på en bil" tjekket
> 3. Send-til-fabrik bekræftelses-modal
> 4. Status efter send: alle bokse låst med "Sendt"-pille
> 5. Ekstra-bestilling formular
> 6. Aflys-modal med årsags-dropdown

---

## 5. Roller — hvem ser og kan ændre hvad

| Rolle | Ser sektionen | Kan ændre | Cross-app effekt |
|---|---|---|---|
| **Formand** | Ja, fuld kontrol | Alt | — |
| **Vognmand** | Nej (intern data) | Nej | Modtager bestilling → disponerer biler |
| **Fabrik** | Nej (intern data) | Nej | Modtager bestilling → producerer |
| **Chauffør** | Nej | Nej | Modtager kørsler via vognmand. "Samles på en bil"-flag styrer hans læsse-flow |
| **Kunde** | Nej | Nej | — |

Asfaltbestilling er **kun synlig for formanden**. De andre apps modtager data-effekterne uden at se selve UI'en.

---

## 6. Cross-app effekter — hvad sker der i andre apps når formanden trykker "Send til fabrik"?

| Modtager | Hvad de får | Hvad de gør |
|---|---|---|
| **Fabrik** | Liste over produkter + tons + dato + samles-flag + kommentar | Planlægger produktion til afhentnings-tidspunktet |
| **Vognmand** | Bilbestilling for dagen + første-læs-tidspunkt + interval | Disponerer biler i sin app, sender bekræftelse retur |
| **Formand · Udførsel** | "Morgen tons"-værdien | Bruges som default for "faktisk udlagt"-feltet i dagsoverblikket |
| **Formand · Asfaltkørsel** | "Dagen er klar til bilbestilling"-signal | Aktiverer bilbestilling-sektionen i samme app |
| **Chauffør** | (Via vognmand) Kørsels-opgaver inkl. "Samles på en bil"-flag | Får besked om kørsler + multi-produkt-loading-instruktioner |

---

## 7. Hvad sektionen IKKE dækker

For at undgå misforståelser — disse områder hører til andre sektioner og dækkes separat:

- **Bil-disponering** (vognmand bestemmer hvilke biler der kører) → "Vognmand · Disponerings-view"
- **Afregning** af kørsler og bil-timer → "Afregning"-tabben
- **Faktisk udlagt** (hvad blev der reelt kørt på dagen) → "Udførsel · Dagsoverblik"
- **Historik / audit-log** — hvem sendte hvad hvornår → Separat administrations-view
- **Bil-, fabrik- og chauffør-UI** → Egne apps

---

## 8. Åbne spørgsmål til kunden

Følgende detaljer mangler endelig afklaring inden udvikling kan afslutte fuldstændigt:

| # | Spørgsmål | Påvirker |
|---|---|---|
| Q1 | Skal en formand kunne **redigere en sendt bestilling** ved fejl, eller skal det altid være telefon-til-fabrik? | Edit-cascade-flow |
| Q2 | Skal **vejr-flaget** automatisk trigge en fradrag-beregning i afregning, eller er det rent informativt? | Afregnings-regler |
| Q3 | Skal **"Samles på en bil"** kunne ændres EFTER send (uden at gen-sende)? Eller låses det med batchen? | Edit-cascade-flow |
| Q4 | Hvis flere formænd er logget på samme ordre samtidigt, hvad sker hvis de begge prøver at sende? | Konflikt-håndtering |

---

## 9. Status og næste skridt

**Sektionens fase**: dev-ready (klar til udvikling efter sign-off)
**Prototype**: bygget og live på `formandsapp.netlify.app`
**Tekniske detaljer**: i `KICKOFF_Asfaltbestilling.md` + `CONTRACT_Asfaltbestilling.md` + `FLOWS_Asfaltbestilling.md`
**Cross-app dataflow**: dokumenteret i `.claude/docs/FUNCTIONAL_FLOWS.md`

Efter kundens sign-off på dette dokument går sektionen i **udvikling** — anslået varighed iflg. interviewer-vurdering: TBD.

---

## Sign-off

Ved at underskrive dette dokument bekræfter kunden at:
- Forretningsformålet er forstået og accepteret
- Brugerrejsen matcher den forventede arbejdsgang
- Forretningsreglerne er gennemgået
- Cross-app effekter er accepteret
- De åbne spørgsmål er besvaret (eller markeret som ikke-blokerende)

| | Navn | Rolle | Dato | Underskrift |
|---|---|---|---|---|
| **Kunde** | _______________ | _______________ | _______________ | _______________ |
| **Colas — Produktansvarlig** | _______________ | _______________ | _______________ | _______________ |
| **Colas — Udviklingsansvarlig** | _______________ | _______________ | _______________ | _______________ |

---

*Dokument-version: 2026-05-27 · draft*
