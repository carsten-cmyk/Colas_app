---
section: asfaltbestilling
app: formand
tab: planlægning
document_type: customer_spec
created: 2026-05-27
last_updated: 2026-06-18
version: v2
status: draft (afventer kunde-sign-off)
print_format: A4
---

# Asfaltbestilling — Funktionsbeskrivelse (v2)

> **Dette dokument**: Beskriver hvordan formanden bestiller dagens asfalt på en ordre, og hvilke konsekvenser hver handling har for fabrik, vognmand og chauffør.
> **Til**: Kundens gennemgang og sign-off inden udvikling.
> **Sign-off**: Sidste side. **Sektionen går IKKE i udvikling før dette dokument + spørgsmålslisten (`QA.md`) er signet af kunden.**

> ### ⚠️ Hvad er ændret siden v1 (27. maj 2026)
> Prototypen er videreudviklet i ~3 uger. De vigtigste forretnings­ændringer kunden skal være opmærksom på:
> 1. **Formanden opretter IKKE længere ekstra-bestillinger i appen** (besluttet 3. juni). Ekstra tons registreres af fabrikken og vises kun som læse-information hos formanden.
> 2. **Aflysning er flyttet** fra den enkelte produkt-boks til en samlet aflysnings-celle under ordre-detaljerne (samme sted uanset om man er i Planlægning, Udførsel eller Afregning).
> 3. **Ny regel: bestilling skal ske inden kl. 11 dagen før udlægning** (18. juni). For sen bestilling blokeres ikke, men formanden skal ringe til fabrikken.

---

## 1. Formål

Formanden bruger Asfaltbestilling **hver morgen** til at fortælle fabrikken og vognmanden hvad der skal produceres og køres ud i løbet af dagen. Det er det første touch-point i arbejdsgangen — uden bestillingen ingen produktion, ingen biler, ingen kørsel.

Sektionen dækker:
- **Morgenbestillingen** (planlagt dagsforbrug pr. produkt)
- **Afsendelse til fabrik** (én samlet pakke pr. dag)
- **Aflysning** ved fx regn, frost eller dårligt underlag
- **"Samles på en bil"-markering** der signalerer hvilke produkter der skal pakkes på samme bil
- **Visning af ekstra tons** som fabrikken har registreret (læse-information)

---

## 2. Brugerrejse — morgenbestillingen

### Trin 1: Formanden åbner ordren
Formanden åbner dagens ordre og lander på **Planlægning-tabben**. Øverst vælger han dag via en datovælger der spænder hele ordrens udlægnings­periode. Datovælgeren er den samme på tværs af Planlægning, Udførsel og Afregning. Passerede dage er gennemstregede.

### Trin 2: Formand ser dagens produkter
Under datovælgeren ligger ét boks-felt per **produkt** (fx "AB 11t" eller "SMA 8t"). Hvert produkt-felt viser:
- Produktnavn + receptkode + tykkelse
- Felt: **"Forventet i dag"** (formandens estimat)
- Felt: **"Morgen-bestilling"** (det fabrikken skal producere)
- Status: Afventer / Sendt / Aflyst

Hvis fabrikken har registreret **ekstra tons** på et produkt, vises det i en separat boks ved siden af — **kun som læse-information** ("+N tons · Bekræftet fabrik" med tidspunkt). Formanden kan ikke redigere den.

### Trin 3: Formand indtaster tons
Formanden taster det antal tons han vil bestille til morgenproduktion ind i hvert produkt-felt. Han kan sætte **"Samles på en bil"**-flag hvis 2-3 produkter skal pakkes sammen på samme bil.

### Trin 4: Formand klikker "Send til fabrik"
Bunden af sektionen har én knap: **"Send til fabrik"**, der viser fabrikkens navn og en permanent påmindelse: **"Bestilling skal ske inden kl. 11"**. Klik åbner en bekræftelses-modal med:
- Mulighed for at knytte en **kommentar til fabrik** (valgfri)
- Bekræft-knap

**Hvis bestillingen er for sent på den** (efter kl. 11 dagen før udlægning), viser modalen en tydelig rød advarsel: *"Bestillingen er lavet efter kl. 11. Du skal derfor ringe til fabrikken for at sikre produktionskapacitet."* Bestillingen kan **stadig sendes** — den blokeres ikke.

Når formanden bekræfter, sendes **alle dagens bestillinger** som én samlet pakke til både fabrik og vognmand. Alle produkt-felter skifter til status **"Sendt"**.

### Trin 5: Ekstra tons i løbet af dagen (kommer fra fabrik)
Hvis der køres mere end planlagt, registrerer **fabrikken** ekstra-mængden i deres system. Den vises automatisk hos formanden som læse-information på det relevante produkt ("+N tons · Bekræftet fabrik"). **Formanden gør ingenting** — han opretter ikke længere ekstra-bestillinger selv.

### Trin 6: Aflysning ved dårligt vejr
Hvis vejret skifter, kan formanden aflyse en specifik dag via **aflysnings-cellen under ordre-detaljerne**. Han vælger dato + **årsag** (regn / frost / dårligt underlag / andet) og bekræfter. Fabrik og vognmand modtager besked og kan frigøre ressourcer.

---

## 3. Forretningsregler

### 3.1 Morgenbestilling
- **Samlet afsendelse pr. dag**: Alle produkter for én dag sendes som én pakke til fabrik + vognmand.
- **Bestillingsfrist kl. 11**: Bestilling skal sendes inden **kl. 11 dagen før udlægningsdagen**, så fabrikken kan planlægge næste-dags produktion. Frist­påmindelsen står permanent på send-knappen.
- **For sent = ring, ikke blokér**: Bestilling efter fristen kan stadig sendes, men formanden får en rød advarsel om at ringe til fabrikken for at sikre kapacitet.
- **Kommentar pr. afsendelse**: Én kommentar følger med den samlede afsendelse.

### 3.2 Ekstra tons (læse-information fra fabrik)
- Formanden **opretter ikke** ekstra-bestillinger i appen (ændret 3. juni 2026).
- Ekstra tons registreres af fabrikken og vises hos formanden som **read-only** ("+N tons · Bekræftet fabrik" + tidspunkt).
- Indgår automatisk i de samlede tons-beregninger nedstrøms (Udførsel, Afregning).

### 3.3 "Samles på en bil"-flag
- Markeres pr. produkt pr. dag.
- Signalerer at op til 3 produkter skal pakkes på samme bil, hvis bilens kompartmenter tillader det.
- Driver et særskilt læsse-flow hos chauffør (multi-produkt-script på fabrik).
- Synligt hos fabrik, vognmand og chauffør.

### 3.4 Aflysning
- Sker i **aflysnings-cellen under ordre-detaljerne** (ikke længere på produkt-boksen).
- Faste årsager (ikke fri-tekst): **regn · frost · underlag · andet**.
- Fabrik + vognmand modtager besked og frigør ressourcer.

### 3.5 Offline-håndtering
- Formand kan indtaste og sende selv uden internet.
- Send-handlingen lægges i en kø der synkroniseres når forbindelse genoprettes.

### 3.6 Frosne valg (allerede besluttet)
| Beslutning | Dato | Værdi |
|---|---|---|
| Status-ord | 2026-05-26 | Afventer / Sendt / Aflyst (dansk) |
| Datoformat i UI | 2026-05-26 | "16. marts 2026" (lang form) |
| Multi-produkt-model | 2026-05-19 | Samme bil kan rumme op til 3 produkter |
| Aflysnings-årsager | 2026-05-22 | 4 faste valg (regn/frost/underlag/andet) |
| Ekstra-bestilling fjernet fra formand | 2026-06-03 | Ekstra tons kommer fra fabrik (read-only) |
| Bestillingsfrist kl. 11 | 2026-06-18 | Inden kl. 11 dagen før — for sent ≠ blokeret |

---

## 4. Skærmbilleder

> Prototype er live på `formandsapp.netlify.app` (eller lokalt på port 5174) → en ordre → Planlægning-tabben.
>
> **Til print-versionen — indsæt skærmbilleder af:**
> 1. Planlægning-tab med datovælger + produkt-bokse
> 2. Produkt-boks med tons indtastet + "Samles på en bil" tjekket
> 3. Send-til-fabrik-knap med "Bestilling skal ske inden kl. 11"
> 4. Bekræftelses-modal med den røde "for sent"-advarsel
> 5. Ekstra tons-boks (read-only "Bekræftet fabrik")
> 6. Aflysnings-celle under ordre-detaljerne

---

## 5. Roller — hvem ser og kan ændre hvad

| Rolle | Ser sektionen | Kan ændre | Cross-app effekt |
|---|---|---|---|
| **Formand** | Ja, fuld kontrol | Tons, samles-flag, aflysning, send | — |
| **Vognmand** | Nej (intern data) | Nej | Modtager bestilling → disponerer biler |
| **Fabrik** | Nej (intern data) | Registrerer ekstra tons | Modtager bestilling → producerer; sender ekstra tons retur |
| **Chauffør** | Nej | Nej | Modtager kørsler via vognmand; "Samles på en bil" styrer læsse-flow |
| **Kunde** | Nej | Nej | — |

---

## 6. Cross-app effekter — når formanden trykker "Send til fabrik"

| Modtager | Hvad de får | Hvad de gør |
|---|---|---|
| **Fabrik** | Produkter + tons + dato + samles-flag + kommentar | Planlægger produktion |
| **Vognmand** | Bilbestilling for dagen | Disponerer biler, sender bekræftelse retur |
| **PLAN / Asfalttavlen** | Dagens samlede bestillinger pr. fabrik/ordre | Konsoliderings-overblik for fabrik-mester + koordinator |
| **Formand · Udførsel** | "Morgen tons"-værdien | Default for "faktisk udlagt" i dagsoverblik |
| **Formand · Asfaltkørsel** | "Dagen klar til bilbestilling"-signal | Aktiverer bilbestilling i samme app |

---

## 7. Hvad sektionen IKKE dækker

- **Bil-disponering** (vognmand vælger biler) → Vognmand · Disponerings-view
- **Afregning** af kørsler/bil-timer → Afregning-tabben
- **Faktisk udlagt** → Udførsel · Dagsoverblik
- **Bil-, fabrik- og chauffør-UI** → Egne apps

---

## 8. Spørgsmål til kunde-sign-off

Den fulde spørgsmålsliste ligger i **`QA.md`** (samme mappe). De vigtigste beslutninger der mangler kundens svar i denne runde:

| # | Emne | Colas-forslag |
|---|---|---|
| B-1 | Skal vejr-markering gemmes + sendes videre til vognmand/fabrik, eller være rent visuelt? | Gem + send videre |
| B-3 | Skal aflysnings-årsag "andet" kræve en fritekst-begrundelse? | Udskyd til senere fase |
| B-4 | Hvor robust skal afsendelse være (advarsel ved for mange tons, fortrydelse ved fejl)? | Kun værn mod dobbelt-afsendelse i første fase |
| B-6 | Skal en for-sent-bestilling markeres synligt for vognmand/fabrik (så de ved kapacitet ikke er bekræftet)? | Ja |
| B-7 | Er kl. 11-fristen ens for alle fabrikker, eller forskellig pr. fabrik? | Ens for alle i første fase |

(B-2 og E-1 er rent tekniske og afklares internt.)

---

## 9. Status og næste skridt

**Sektionens fase**: re-interview gennemført — afventer kunde-sign-off.
**Prototype**: live på `formandsapp.netlify.app`.
**Tekniske detaljer**: `CONTRACT.md` (v2 draft) + `FLOWS.md` + `.claude/docs/FUNCTIONAL_FLOWS.md` (Flow 9b + 9c + ABE-1..8).

Efter kundens sign-off omsættes svarene til den endelige kontrakt (v2) → sektionen går i udvikling.

---

## Sign-off

Ved at underskrive bekræfter kunden at:
- Forretningsformålet er forstået og accepteret
- Brugerrejsen matcher den forventede arbejdsgang
- Forretningsreglerne (inkl. de tre ændringer øverst) er gennemgået
- Cross-app effekter er accepteret
- Spørgsmålene i `QA.md` er besvaret (eller markeret som ikke-blokerende)

| | Navn | Rolle | Dato | Underskrift |
|---|---|---|---|---|
| **Kunde** | _______________ | _______________ | _______________ | _______________ |
| **Colas — Produktansvarlig** | _______________ | _______________ | _______________ | _______________ |
| **Colas — Udviklingsansvarlig** | _______________ | _______________ | _______________ | _______________ |

---

*Dokument-version: 2026-06-18 · v2 · draft*
