# Datafelter — Colas Apps

> Reverse engineered fra prototype-kode.
> Opdateres løbende når nye sektioner bygges.
> Formål: IT-leveranceliste over felter der skal leveres fra backend/PLAN-system.

**Sidst opdateret:** 2026-05-12
**Dækker:** Formand (komplet prototype), Chauffør (kommer), Vognmand (kommer)

---

## Formand App

### Sidebar (altid synlig)

| Felt | Format | Kilde |
|---|---|---|
| Udførselssted — adresse | Tekst | PLAN |
| Udførselssted — postnr + by | Tekst | PLAN |
| Ordrenummer | Tekst | PLAN |
| Projektleder — navn | Tekst | PLAN |
| Projektleder — telefon | Telefonnr | PLAN |
| Fabrik — navn | Tekst | PLAN |
| Fabrik — telefon | Telefonnr | PLAN |
| Kundekontakt — virksomhed | Tekst | PLAN |
| Kundekontakt — navn | Tekst | PLAN |
| Kundekontakt — telefon | Telefonnr | PLAN |

---

### Produkt-tabs

| Felt | Format | Kilde |
|---|---|---|
| Receptkode | Tekst (fx `82101H`) | PLAN |
| Produktnavn | Tekst (fx `SMA 11S`) | PLAN |
| Tykkelse | Tal (mm) | PLAN |
| Tons total | Tal (tons) | PLAN |
| Startdato | Dato | Formand |
| Slutdato | Dato | Formand |

---

### Sektion: Planlægning — Produktoversigt

| Felt | Format | Kilde |
|---|---|---|
| Mængde | Tal (tons) | PLAN |
| Receptkode | Tekst | PLAN |
| Produktnavn | Tekst | PLAN |
| Tykkelse | Tal (mm) | PLAN |
| Areal | Tal (m²) | PLAN |
| Fabrik — navn | Tekst | PLAN |
| Fabrik — køretid | Tal (min) | PLAN |
| Aktivitetsbeskrivelse | Tekst (fx `GAB I at levere og udlægge, 80mm`) | PLAN |
| Krav til samlinger | Tekst (fx `Klæbet` / `Ikke klæbet`) | PLAN |
| Ekstra temperaturmålinger | Boolean (Ja/Nej) | PLAN |
| Entreprisekontrol | Enum: `1` / `2` | PLAN |

**Entreprisekontrol — adfærd i appen:**

| Værdi | Konsekvens |
|---|---|
| `1` | A3 og A4 (kvalitetskontrol) vises under Udførelse → Kvalitetssikring |
| `2` | A3, A4 **og** MKS vises under Udførelse → Kvalitetssikring |

> Formularer A3, A4, MKS bygges i en fremtidig sprint. Entreprisekontrol-værdien læses fra PLAN og gemmes på ordren i Supabase, så Udførelse-siden kan reagere på den dynamisk.

---

### Sektion: Dagfordeling

**Per dag:**

| Felt | Format | Kilde |
|---|---|---|
| Dato | Dato | Beregnet (fra startdato) |
| Ugedag | Tekst | Beregnet |
| Tons planlagt | Tal (tons) | Formand |
| Morgen tons | Tal (tons) | Formand |
| Aflyst | Boolean | Formand |
| Aflysningsårsag | Enum: Regn / Frost / Underlag / Andet | Formand |
| Bestilt til fabrik | Boolean | Formand |

**Aggregeret:**

| Felt | Format | Kilde |
|---|---|---|
| Tons fordelt i alt | Tal (tons) | Beregnet |
| Resterende tons | Tal (tons) | Beregnet |
| Antal dage med morgen tons bekræftet | Tal | Beregnet |

---

### Sektion: Dokumentation

| Felt | Format | Kilde |
|---|---|---|
| Opmåling — fil | PDF / billede | Formand upload |
| Opmåling — filnavn | Tekst | Formand upload |
| Opmåling — filstørrelse | Bytes | Beregnet |
| Billedmateriale — billeder | Filer (image/*) | Formand (kamera / upload) |
| Note — forfatter initialer | Tekst (fx `OJ`) | System (bruger) |
| Note — forfatter navn | Tekst | System (bruger) |
| Note — tidsstempel | ISO 8601 | System |
| Note — tekst | Fritekst | Formand |

---

### Sektion: Materiellevering

**Per maskine:**

| Felt | Format | Kilde |
|---|---|---|
| Anlægsnummer | Tekst (fx `5-0034`) | PLAN |
| Beskrivelse | Tekst (fx `HAMM HD10 VT`) | PLAN |
| Transporttype | Enum: Blokvogn / Kran-Bånd / Egen kørsel | PLAN |
| Status | Enum: Planlagt / Ikke planlagt | Formand |
| Udlånt | Boolean | Formand |
| Afhentningsadresse | Tekst | Formand |
| Afhentning — postnr | Tekst | Formand |
| Klar til afhentning | Dato / tid | Formand |
| Leveringsdato | Dato | Formand |
| Fakturaordre | Tekst | Formand |
| Kommentar til vognmand | Fritekst | Formand |
| Afhentningspin — lat/lng | Koordinater | Formand (kort — fremtidig feature) |
| Aflæsningspin — lat/lng | Koordinater | Formand (kort — fremtidig feature) |

**Formand → Vognmand flow (Materiel):**

Sendes per materiel-enhed som separat linje til vognmandens løsning.

| Felt | Format |
|---|---|
| Anlægsnummer | Tekst |
| Beskrivelse | Tekst |
| Afhentningsadresse | Tekst (eller pin-koordinater) |
| Aflæsningsadresse | Tekst (eller pin-koordinater) |
| Klar til afhentning | ISO 8601 |
| Skal være på lokation | ISO 8601 |
| Kommentar | Fritekst |

**Vognmand → Formand (bekræftelse materiel):**

| Felt | Format |
|---|---|
| Bekræftet | Boolean |
| Transport — reg.nr | Tekst |
| Transport — type | Tekst (fx Blokvogn) |
| Chauffør — navn + tlf | Tekst |
| Bekræftet tidspunkt | ISO 8601 |

---

### Sektion: Kørsel (Transportberegner)

**Inputparametre per dag:**

| Felt | Format | Kilde |
|---|---|---|
| Biltype | Enum: 6 Aks / 7 Aks / Forvogn / Forvogn+Kærre / Grab / Sneglebil / Snegl m. kærre / Sideudlægger | Formand |
| Antal biler per type | Tal | Formand |
| Første læs (Grab) | Boolean | Formand |
| Køretid fabrik→plads | Tal (min) | PLAN (driveTimeMinutes) |
| Lastetid | Tal (min) | Formand / standard |
| Aflæssetid | Tal (min) | Formand / standard |
| Interval mellem biler | Tal (min) | Formand / standard |
| Første læs-tidspunkt | Tid (HH:MM) | Formand |
| Seneste læs-tidspunkt | Tid (HH:MM) | Formand |
| Pause — tidspunkt | Tid (HH:MM) | Formand |
| Pause — varighed | Tal (min) | Formand |

**Beregnet output:**

| Felt | Format | Kilde |
|---|---|---|
| Estimeret antal biler | Tal | Beregnet |
| Estimeret tons per tur | Tal (tons) | Beregnet |
| Total kapacitet | Tal (tons) | Beregnet |
| Estimeret sluttid | Tid (HH:MM) | Beregnet |

---

### Sektion: Udførelse — Ekstraarbejde

| Felt | Format | Kilde |
|---|---|---|
| Type | Enum (25 typer — se liste nedenfor) | Formand |
| Beskrivelse | Fritekst per linje | Formand |
| Antal | Tal (stk.) | Formand |

**Typer (dropdown):**
Regulering af fast rendestensrist, Regulering af fast stophane, Regulering af fast Ø 300, Regulering af fast Ø 600 dæksel, Regulering af flydende rist, Regulering af flydende stophane, Regulering af flydende Ø 300 dæksel, Regulering af flydende Ø 600 dæksel, Udskiftning af dæksel excl. brøndgods, Udskiftning af dæksel incl. brøndgods, Udskiftning af rist excl. brøndgods, Udskiftning af rist incl. brøndgods, Ø 300 flydende rendestensrist, Ø 300 overtopstykke (beton) 30/50/100 mm, Ø 325 kombinringe (plast), Ø 475 mellemlægsskiver, Ø 600 dæksel (40t), Ø 600 flydende karm (40t), Ø 600 kombinringe (plast), Ø 600 topringe (beton) h. 30/50/100 mm, Ø 750 mellemlægsskiver

**Adfærd ved gem:** Sendes automatisk som mail til projektleder (Henrik Thor) — TODO: kræver mail-integration eller Supabase trigger

---

### Sektion: Udførelse — Forundersøgelse

| Felt | Format | Kilde |
|---|---|---|
| Underlags type(r) | Multiselect: Asfalt / Grus / Beton / Fræset / Andet | Formand |
| Underlag — fritekst (ved Andet) | Tekst | Formand |
| Tilfredsstillende | Boolean (Ja/Nej) | Formand |
| Årsager | Multiselect: Revner / Sporkørt / Krakeleret / Ujævn / Sætninger / Snavs / Blød / Græs/ukrudt | Formand |
| Aftalt med | Fritekst | Formand |
| Forbehold | Fritekst | PLAN (preudfyldt) + Formand (redigerbar) |
| Billeder | Filer (image/*) | Formand (kamera / upload) |

---

### Gantt-oversigt (Mine opgaver)

**Per ordre:**

| Felt | Format | Kilde |
|---|---|---|
| Ordrenummer | Tekst | PLAN |
| Projektnavn | Tekst | PLAN |
| Ordrestatus | Enum: Aktiv / Planlagt / Afsluttet | PLAN / beregnet |
| Startdato | Dato | PLAN |
| Slutdato | Dato | PLAN |
| Tons total | Tal (tons) | PLAN |
| Tons leveret | Tal (tons) | System (real-time fra chauffør-app) |

---

## Chauffør App

> Kommer — reverse engineering afventer

---

## Vognmand App

> Kommer — reverse engineering afventer

---

---

## Formand → Vognmand flow (Asfalt kørsel)

### Trigger
Formand trykker **"Gem kørsel"** på en given dag i Asfalt kørsel-sektionen (Planlægning-mode).

### Hvad der sker
1. Bestillingen oprettes som en **åben ordre på vognmandens side** — vises i vognmandens liste som "Afventer disponering"
2. Ordren indeholder: dato, fabrik, adresse, biltype(r) + antal, første læs-tidspunkt, interval, kommentar til vognmand
3. Vognmanden **disponerer** — tildeler konkrete biler + chauffører til ordren
4. Når vognmand trykker "Bekræft og send":
   - Bestillingen markeres **"Bekræftet af vognmand"** på formandens side
   - Badge vises på den pågældende dag i **Planlægning → Asfalt kørsel**
   - Den bekræftede bilbestilling (reg.nr, chauffør, tlf, biltype, tons) vises på **Udførelse-siden** under Forundersøgelse-sektionen

### Felter der sendes fra formand → vognmand

| Felt | Format |
|---|---|
| Dato | ISO dato |
| Fabrik | Navn + adresse |
| Udførselssted | Adresse |
| Biltype(r) | Enum + antal per type |
| Første læs | Tid (HH:MM) |
| Interval | Tal (min) |
| Afstand | Tal (km) |
| Kommentar | Fritekst |

### Felter der sendes fra vognmand → formand (bekræftelse)

| Felt | Format |
|---|---|
| Bekræftet | Boolean |
| Biler | Array: reg.nr + chaufførnavn + tlf + biltype |
| Bekræftet tidspunkt | ISO 8601 |

### UI-markering
- **Planlægning → Asfalt kørsel:** Grønt badge "Bekræftet af vognmand" på dagen
- **Udførelse → under Forundersøgelse:** Kort med bekræftede biler (reg.nr, chauffør, tlf)
- **Ikke bekræftet:** Gult "Afventer vognmand"-badge

---

## Noter til IT

- **PLAN-felter:** Læses fra eksisterende PLAN-system via integration (ikke defineret endnu)
- **Formand-felter:** Gemmes i Supabase — skema ikke defineret endnu
- **Billeder/filer:** Kræver Supabase Storage
- **Real-time tons leveret:** Kræver integration med chauffør-appen via Supabase Realtime
- **Beregnede felter:** Beregnes i frontend — kræver ikke backend-lagring

---

## IT-arkitektur plan

### Rækkefølge (ikke afviges)

```
1. Prototype færdig (alle 3 apps)
2. Send DATA_FIELDS.md til Jesper Nielsen → bed om bekræftelse på felter
3. Data-kontrakt aftalt (hvilke felter kan PLAN levere, i hvilket format)
4. Supabase skema designes ud fra bekræftet kontrakt
5. Supabase seedet med rigtige testdata fra PLAN-udtræk
6. Produktionskode skrives (prototype → prod) mod Supabase
7. Go-live
```

### Leveranceopdeling (til eksterne DB-folk)

**Fase 1 — Læse-felter fra PLAN** (eksternt DB-team)
Alle felter markeret med kilde = PLAN i tabellerne ovenfor.
Leveres som API eller dataudtræk i aftalt format.

**Fase 2 — Skrive-felter** (vi bygger selv i Supabase)
Alle felter markeret med kilde = Formand / System / Beregnet.
Uafhængig af fase 1 — kan startes parallelt når skema er aftalt.

### Første skridt mod Jesper Nielsen

Send DATA_FIELDS.md og stil dette spørgsmål:

> "Kan I bekræfte hvilke af disse felter I kan levere fra PLAN, i hvilket format,
> og hvilke felter I ikke har? Vi behøver ikke udtræk endnu — kun en bekræftelse
> på hvad der er tilgængeligt, så vi kan designe databaseskemaet korrekt."

### Typiske dataproblemer at tjekke for

- Datoformat: PLAN bruger måske `YYYYMMDD` — vi forventer ISO 8601
- Tons-definitioner: inkluderer PLAN spild i `tonsTotal`?
- Tomme felter: felter der "altid er udfyldt" i teorien men er tomme i praksis
- Feltnavne: `WO_NR` i PLAN hedder `ordrenummer` hos os — mapping-tabel nødvendig
