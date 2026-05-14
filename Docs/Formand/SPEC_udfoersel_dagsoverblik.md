# Spec: Udførelse — dagens overblik og vejesedler

## Kontekst

Denne spec beskriver to nye sektioner der tilføjes til udførelses-siden i Colas transportløsning. Siden viser allerede adresse, ordrenummer, trin-navigation (Planlægning / Udførelse / Evaluering), projektleder, fabrik og kundekontakt i venstre sidebar, samt en statusrad øverst med kort for Biler, Materiel Transport og Forundersøgelse.

De to nye sektioner placeres **under Forundersøgelses-sektionen** i samme højre-kolonne.

Eksisterende farver og kortdesign følges. Nye kort bruger samme stil som eksisterende statuskort.

---

## Sektion 1: Dagens overblik

To rader med dashboardkort.

### Rad 1 — Ordreinfo (4 kort)

Vises altid. Data er statisk for dagen — ændres ikke under udførelse.

**Areal i dag**
- Værdi: dagens planlagte m², beregnet fra formandents angivelse af tons pr. dag × (1000 / kg/m² fra recept)
- Undertekst: "á [samlet ordreareal] m²"
- Kilde: antal udførelsesdage fra ordren, tons pr. dag angives af formanden

**Produkt**
- Værdi: receptnavn (fx "SMA 11S")
- Undertekst: receptkode (fx "82101H")
- Kilde: ordre → planlægning → produkt

**Tykkelse**
- Værdi: planlagt tykkelse i mm (fx "45 mm")
- Kilde: ordre → planlægning → tykkelse

**Tons i dag**
- Værdi: dagens forventede tons, beregnet som areal i dag × kg/m² fra recept
- Undertekst: "á [ordretotal tons] t"
- Kilde: beregnet fra ordredata og recept

---

### Rad 2 — Fremdrift (3 kort + inputlinje)

Opdateres løbende i takt med at vejesedler ankommer.

**Tons ankommet**
- Værdi: sum af tons fra dagens indkomne vejesedler
- Progressbar: tons ankommet / dagens tons-mål (%)
- Undertekst: "á [dagens tons-mål] t dagens plan"
- Kilde: vejesedler fra PLAN (automatisk, 10 min forsinkelse)

**Forventet udlagt**
- Værdi: beregnet m² = akkumulerede ankomne tons × (1000 / kg/m² fra recept)
- Progressbar: forventet udlagt / dagens areal-mål (%)
- Undertekst: "beregnet fra tons × kg/m²"
- Kilde: beregnet løbende fra vejesedler + receptdata

**Faktisk udlagt**
- Værdi: senest gemte m² indtastet af formand. Vises som "–" indtil første registrering.
- Afvigelse: difference vs. forventet udlagt vises som "−X m²" eller "+X m²" i advarselsfarve hvis afvigelse > 0
- Progressbar: faktisk udlagt / dagens areal-mål (%)
- Kilde: formand indtaster manuelt (se inputlinje nedenfor)

**Inputlinje (under de 3 kort)**
- To inputfelter: m² og tons
- Gem-knap
- Ved gem: faktisk tykkelse beregnes (tons × 1000 / m² / densitet fra recept) og vises som "X mm · plan Y mm · ±Z%"
- Formanden registrerer typisk ved dagens afslutning, men kan opdatere løbende
- Kilde: manuel indtastning, gemmes på dagens udførelse

---

## Sektion 2: Vejesedler og indkomne tons

Tabel der viser alle læs tilknyttet dagens ordre som én samlet pipeline — ankomne, undervejs og ikke afsendt.

### Sortering
1. Ankomne (vejeseddel modtaget) — nyeste øverst
2. Undervejs (bil kørt fra fabrik, vejeseddel ikke modtaget endnu)
3. På vej til fabrik (bil disponeret, ikke afhentet endnu)

### Kolonner

| Kolonne | Beskrivelse |
|---|---|
| Vejeseddel | Vejeseddelnummer fra PLAN. Vises som "—" hvis ikke modtaget endnu |
| Nummerplade | Bilens registreringsnummer. Kilde: vognmandsmodul |
| Chauffør | Chaufførnavn. Kilde: vognmandsmodul |
| Produkt | Receptnavn oversat fra receptkode (fx "SMA 11S"). Kilde: vejeseddel → recept-oversættelse. Vises som "—" hvis vejeseddel ikke modtaget |
| Fabrik | Fabriksnavn (ikke kode). Kilde: fabriksstamdata, opslået via fabriks-id fra vejeseddel eller ordre |
| Tons | Tons fra vejeseddel. Vises som "—" hvis vejeseddel ikke modtaget |
- Udlægger | Dropdown med udlæggere registreret som materiel på ordren. Udlæggere identificeres på materielnummer-prefix "9-" (fx 9-0009). Formanden vælger hvilken udlægger læsset hældes i. Kun aktiv på ankomne rækker. Kilde: materiel-liste på ordren, filtreret til materielnumre med prefix "9-" |
| Status / Temp. | Se nedenfor |

### Status / Temp.-kolonne pr. rækketyper

**Ankomne rækker**
- Hvis temperatur ikke registreret: inputfelt (°C)
- Hvis temperatur registreret: målt værdi + badge
  - "OK" (grøn): temperatur over minimumsgrænse
  - "Lav" (gul advarsel): temperatur under minimumsgrænse
- Minimumsgrænse: formanden indtaster en minimumstemperatur på ordren/dagen. Bruges som grænse for OK/Lav-badge

**Undervejs-rækker**
- Badge: "ETA X min"
- ETA beregnes: afstand fra bil til udførelsesskstedet i km × 1 min/km
- Afstand beregnes fra GPS-position (chauffør-app) til ordrens udførelsessksted
- Opdateres løbende

**På vej til fabrik-rækker**
- Badge: "På vej til fabrik"
- Kilde: GPS viser bil bevæger sig mod fabrik, eller bil er disponeret men GPS ikke aktivt på vej til udførelsessksted

### Datakilder til tabellen

| Data | Kilde |
|---|---|
| Vejesedler (nr., tons, recept, fabrik) | PLAN — automatisk, 10 min forsinkelse |
| Nummerplade, chauffør | Vognmandsmodul — disponering på ordren |
| GPS-position og ETA | Chauffør-app — løbende opdatering |
| Udlægger-liste | Materiel-liste på ordren, filtreret til udlægger-type |
| Temperatur | Formand — manuel registrering pr. læs |

---

## Fase 2 (ikke i MVP)

- Temperaturregistrering flyttes til chauffør-app så formanden kan stå i marken
- Fremdrift opdateres automatisk pr. læs uden manuel indtastning
