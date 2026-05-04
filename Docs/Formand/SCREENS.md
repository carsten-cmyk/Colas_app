# Colas Formandsapp — Skærme & Flows

> **REFERENCE-DOC — ikke design-spec.**
> Brug dette dokument til at forstå screens, flows og features.
> Design system (farver, typografi, spacing, navigation) følger **chauffeur-appens** tokens.
> Autoritativ spec: `Docs/formand/PRD.md`, `Docs/formand/REVIEW_SPEC.md`, `apps/formand/tailwind.config.ts`.
> Ved konflikt → vores specs vinder.

## FORMAND

### Bundmenu
- Opgave oversigt (Gantt-oversigt)
- Dagens opgaver (ordredetalje)
- Beskeder
- Kontakt
- Dokumentation

### 1. Opgave oversigt (Gantt)
Viser alle formandens ordrer over 14 dage (3 dage tilbage, 11 frem).

**Overskrift:**
- `font-poppins font-bold text-2xl` — ingen tilbagepil
- Datointerval under overskriften (fx "13. mar – 26. mar")
- Overskrift og datointerval indrykkede med `pl-sm` så de flugter med tabelindholdet

**Dato-header:**
- Dag-initial (ma/ti/on...) + dato-tal per kolonne
- I dag: grøn cirkel (`#2E9E65`) med hvid tekst + let grøn kolonnebaggrund (`rgba(46,158,101,0.1)`)
- I dag: stiplet lodret linje i venstre kant af kolonnen (`rgba(11,57,80,0.5)`) — absolut positioneret over bjælkeknapper

**Kolonner (faste bredder):**
- **Ordreinfo (160px):** `Ordrenr. XXXXXXX` (fed) + projektnavn (2 linjer max)
- **Status (90px):** status-badge + tons (leveret / total eller total) — adskilt fra dag-cellerne med `border-r`

**Bjælkefarver:**
- `bg-[#2E9E65]` = aktiv ordre på dagens dato
- `bg-dark-teal` = planlagt / fremtidige dage
- `bg-light-aqua` = afsluttet ordre / passerede dage

**Dag-celler:**
- Højde: 64px
- I dag: grøn baggrund (`rgba(46,158,101,0.05)`) + absolut positioneret stiplet linje (z-index: 1, pointer-events-none) så den vises over bjælken

**Legende** under Gantt-kortet, indrykkede med `pl-sm` så de flugter med tabelindholdet.

**Interaktion:**
- Klik på bjælke for ordre #1 → navigerer til `/prototyper/ordre-plan`
- Øvrige bjælker: `cursor-not-allowed opacity-50` (ikke koblet i prototype)
- "Dagens opgaver"-tab → navigerer til `/prototyper/ordre-plan`

**TODO (production):**
- `onClick` på alle bjælker kobles til React Router navigate med ordre-id

---

### 2. Dagens opgaver — Ordre-detaljeside

#### Header (altid synlig)
- Ordrenummer (fx "Ordre 1212343")
- **Mode-navigation** — segmented control: `Planlægning | Udførsel | Evaluering`
  - Aktiv mode: gul baggrund, mørk teal tekst
  - Inaktiv: mørk teal baggrund, hvid/50 tekst
- **4 info-bokse** (horisontal scroll ved behov):
  - **Kunde** — navn + adresse
  - **Beskrivelse** — fri tekst fra ordre
  - **Projektleder** — navn, initialer-avatar, telefon
  - **Seneste beskeder** — 2 seneste beskedoverskrifter + grønt pil-badge per besked

#### Produkt-tabs
- Én tab per produkt (receptkode + tons)
- Mørk teal baggrund, hvid tekst, aktiv markeret med gul bjælke i bunden
- Yderste hjørner afrundede (matching header)

---

### 2a. Planlægnings-mode

Siden er opdelt i fire navngivne sektioner med store overskrifter (Poppins bold 2xl, 32px indryk fra kant):
**Udlægning → Materiel → Dokumentation → Transport**

#### Sektion: Udlægning

**Stats-kort** (flush under produkt-tabs, ingen top-runding)
- Overskrift: "Produkt {receptkode}"
- 4-kolonner grid: Tons · KVM · Tykkelse · Fabrik (navn + køretid)
- Under divider, samme 4-kolonner grid:
  - **Kol 1–2: Dato for udlægning** (fed label) — to datovælgere med `–` imellem
    - Gul border + lys gul baggrund = ikke udfyldt (kræver opmærksomhed)
    - Normal blå border + soft-aqua = udfyldt
    - Datovælgerne pre-fyldes fra eksisterende dagsfordeling
  - **Kol 3: Antal dage** — beregnet automatisk fra datointerval (samme label/value-stil som Tons/KVM)
  - **Kol 4: Beskrivelse** — fri tekst fra ordre

**Dagfordeling**
- Horisontal scroll-strip af day-pills (100px brede):
  - Ugedag (fed) + dato + "Dag X" + tons-input (spinner skjult)
  - Heri: × knap → vælg årsag (Regn/Frost/Underlag/Andet) → pill markeres aflyst
  - Aflyst pill: kan fortryde
  - I dag: gul border
- Fast remainder-kort til højre (samme størrelse som pill):
  - Grønt + flueben = fuldt fordelt
  - Rødt + advarselsikon = X tons mangler/over
- "Tilføj dag"-knap som stiplet pill
- Remainder-linje: progressbar + "Xt fordelt af Yt total" (centreret)
- Dagsfordeling styres af antal dage fra datointerval — ændres dato, regenereres pills automatisk

#### Sektion: Materiel

**Lag 1 — Maskiner**
- Hvide kort: ikon + beskrivelse + anlægsnr + transport-tag-badge
- Klikbar **Planlagt** (grøn) / **Ikke planlagt** (rød) status-badge — toggler ved tryk
- Skraldespand-ikon → bekræftelsesmodal ("Fjern maskine?") → fjerner fra liste
- "+ Tilføj materiel"-knap (stiplet)

**Lag 2 — Transport af materiel** (sub-overskrift)
- Hvide kort: ikon + type (Blokvogn/Kran-Bånd/Andet) + retning (Ud/Hjem) + dato + kl.
- Grønt badge: "Tilføjet til kørselsplanlægning" med flueben
- Blyant-ikon → rediger dato/antal (ikke bygget endnu)
- "+ Tilføj materiel transport"-knap (stiplet)

#### Sektion: Dokumentation

Hvid boks med tre ekspanderbare rækker (chevron + statussymbol):

- **Opmåling af område** — statisk grønt OK-badge · ekspanderer til sort-hvid kortvisning
- **Billedmateriale** — grønt OK-badge + antal billeder · ekspanderer til fotogrid 4 kolonner + kamera-input
- **Noter til opgave** — rødt Mangler-badge · ekspanderer til:
  - Kommentartråd: dynamisk state, OJ (dark teal avatar) + HT (light-aqua avatar) med navn + tidsstempel
  - Tekstfelt med dikterings-mikrofon (rund dark-teal knap, absolut placeret nede til højre)
  - **Gem**-knap vises kun når der er tekst → tilføjer kommentar til tråden med tidsstempel "Nu"

#### Sektion: Transport

Hvid boks:
- Statisk header: "Forventet transport" + "~X biler · Yt/dag" summary
- Knap:
  - Ikke beregnet: mørk teal "Beregn køreplan" (TODO: kobles til transportberegner)
  - Beregnet: grøn "Se køreplan og tilpas"

---

### 3. Dagens opgaver — Eksekverings-mode
Aktiveres automatisk når dato = i dag.

**Næste bil ankommer-banner:**
- Nedtælling i minutter
- Bilnummer + chauffør + tons
- Tons leveret i dag / af planlagt

**Biler i dag:**
- Tabel: Reg.nr. / Chauffør + tlf / Status / Erstat-knap
- Statusser: På vej (grøn) / Ankommer om X min (teal) / Læsser (gul) / Venter (orange)
- Erstat: fjern bil, tilføj ny nummerplade

**Knapper:**
- **+ Ekstra arbejde** — registrer ekstraopgave (årsag, beskrivelse, dokumentation)

**Afslut dag:**
- Tre knapper: Godkend timer / Afvigelse / Dokumentér
- Godkend timer → åbner timer-panel

---

### 4. Godkend Timer

**Hold på plads:**
- Prædefineret liste fra ordre
- Felter: Navn, Rolle, Timer (preudfyldt, kan rettes)
- Afkryds-godkendelse per person

**Chauffører (fra chauffør-app):**
- Per chauffør: Navn, Nummerplade, Tlf
- Timer fordelt på: Kørsel / Ventetid / Pause
- Antal læs + tons total
- Afkryds-godkendelse per chauffør

**Materiel:**
- Liste over materiel brugt på dagen
- Timer/forbrug per maskine
- Afmeld-knap

**Bundknap:** "Godkend alle og afslut dag"

---

### 5. Dagens opgaver — Evaluerings-mode
Tilgængelig når ordre er afsluttet.

**Tons — Tilbud vs. Faktisk** per produkt
- Søjle-sammenligning med % afvigelse

**Dage — Planlagt vs. Faktisk**
- Planlagte dage vs. faktiske dage per produkt

**Timer — Hold & Chauffører**
- Planlagte timer vs. faktiske timer
- Hold separat fra transport

**Biler — Forbrug**
- Forventet snit vs. faktisk snit per dag
- Aflyste dage med årsag
- Antal dokumenterede afvigelser

---

## VOGNMAND

### View: Transportordrer
- Liste over indkomne ordrer fra formænd
- Per ordre: Dato, Projektnavn, Adresse, Fabrik, Antal biler, Biltype, Starttid, Tons
- Status: Afventer / Bekræftet

### Detalje: Tildel biler
- Kravspecifikation fra formand
- Input per bil: Nummerplade + Chauffør + Tlf
- En bil kan have konfigurationer: med/uden anhænger, med kran osv.
- Nummerplade → slår automatisk chauffør og tlf op
- "Bekræft og send" → låser plan, sender til chauffør-app og formand

---

## CHAUFFØR

### Køreplan for dagen
- Liste over læs: Fabrik-tid / Afgang-tid / Plads-ankomst / Tons
- Ordreinformation: adresse, kontakt formand

### Registrering
- Kørselstimer, ventetimer, pausetimer
- Automatisk baseret på GPS-events (optional)
- Manuel justering

### Status-rapportering
- "Jeg læsser nu" / "Jeg er på vej" / "Jeg er ankommet" / "Jeg venter"
- Afvigelse: forsinkelse + årsag

---

## FABRIK

### Produktions-dashboard (tværgående alle ordrer fra denne fabrik)

**En boks per produkt/recept:**
```
┌─────────────────────────────────┐
│ 23001B · GAB I 80mm             │
│ 3 ordrer i dag                  │
│ ████████░░░░  206 / 420 t       │
│ Næste læs: BB14 376 · 8 min     │
│ Tilbage: 214 t · ~3,5 timer     │
└─────────────────────────────────┘
```

**Per boks:**
- Produktkode + navn
- Antal ordrer der bruger dette produkt i dag
- Progressbar: tons læsset / tons total
- Nedtælling til næste bil (live)
- Tons tilbage + estimeret tid

**Forsinkelser:**
- Markering af forsinkede biler
- Biler der ikke er mødt op

**Opdatering:** real-time via websocket/supabase realtime

---

## UX-principper
- Tablet-first (formand, fabrik, vognmand)
- Mobil-first (chauffør)
- Ingen wizard-flows — erfarne brugere
- Lucide icons (hvide på mørk baggrund)
- Farvepalet: Navy (#1B3D4F), Teal (#2E7D9A), Grøn (#2E9E65), Orange (#E07A35)
- Font: DM Sans + DM Mono
- Ingen emoji — kun Lucide ikoner
