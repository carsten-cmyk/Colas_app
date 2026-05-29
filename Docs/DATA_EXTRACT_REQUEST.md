---
title: Data Extract Request — Colas IT
purpose: Anmodning om testdata fra eksisterende Colas-systemer til brug i app-udvikling
sent_to: Colas IT (Jesper Nielsen / Thomas / relevant ejer)
from: Carsten Anthonisen
date: 2026-05-29
status: Draft til afsendelse
---

# Anmodning om testdata — Colas Transport Apps

## Formål

Vi er ved at refactore Colas-app'ene fra prototype til produktion. For at validere datamodellen + designe Supabase-skemaet korrekt, har vi brug for et udtræk af **real-life testdata** fra de eksisterende systemer (PLAN, Danvægt, HR osv.).

**Dette er IKKE en produktions-integration** — det er en engangs-leverance der bruges som referencegrundlag.

---

## Hvilke entiteter vi har brug for

For hver entitet: **liste over felter** + foreslået volumen + format.

### 1. Ordrer (Plan-system)

**Felter**:
- Ordre-id, ordrenummer, titel, adresse (udførselssted), postnr, by
- Kunde-reference (kun id/navn — ikke kontakt-detaljer)
- Start-dato + slut-dato
- Total bestilt tons + produkt-liste
- Tilhørende fabrik(ker)
- Status (planlagt / aktiv / afsluttet)
- Holdnummer + formand-navn

**Volumen**: 10-15 reelle ordrer fordelt over fx Q1 2026 — gerne mix af korte (1-3 dage) og længere (1-2 uger).

### 2. Produkter (recepter) på ordrer

**Felter**:
- Receptkode, recept-navn, tykkelse (mm), receptype (AB/SMA/GAB osv.)
- Min. temperatur ved aflæsning
- Planlagte tons pr. dag pr. produkt
- Faktiske tons leveret (fra vejesedler)

**Volumen**: Alle produkter knyttet til de 10-15 ordrer fra punkt 1.

### 3. Vejesedler (Danvægt)

**Felter**:
- Vejeseddel-nr, ordrenummer, dato + tidspunkt (modtaget)
- Reg.nr på bil, chauffør-navn
- Fabrik-id + fabrik-navn
- Produkt (receptkode)
- Tons vejet
- Temperatur ved aflæsning (hvis registreret)
- Indvejning-tidspunkt + udvejning-tidspunkt

**Volumen**: Alle vejesedler knyttet til de 10-15 ordrer (typisk 50-500 stk total).

### 4. Biler (vognmænd)

**Felter**:
- Reg.nr, biltype (3-aks, 4-aks, 6-aks, sættevogn), tons-kapacitet
- Vognmand-tilknytning (navn/id)
- Aktiv/inaktiv

**Volumen**: Den aktuelle aktive vognmandsflåde der har kørt for Colas i den valgte periode (~20-50 biler).

### 5. Chauffører

**Felter**:
- Chauffør-navn, tlf-nr (mobil, der bruges til app-login)
- Vognmand-tilknytning
- Aktiv/inaktiv
- **IKKE**: CPR, adresse, løndata

**Volumen**: De chauffører der har kørt i den valgte periode (~30-70 stk).

### 6. Fabrikker

**Felter**:
- Fabrik-id, fabrik-navn (fx "PROD A EAST KØGE PH")
- Adresse + GPS-koordinater (til drive-time-beregning)
- Aktive recepter/produkter
- Vejeterminal-id'er (til kommende QR-scan-løsning — se separat dialog med Thomas)

**Volumen**: Alle aktive fabrikker (typisk 5-10 stk).

### 7. Udlæggere / materiel

**Felter**:
- Materiel-nr (fx "9-0042")
- Navn/type (fx "VÖGELE 1900-3I")
- Kapacitet (m/t pr. time)
- Tilknyttet hold/formand
- Aktiv/inaktiv

**Volumen**: Aktiv udlægger-flåde (typisk 10-30 stk).

### 8. Materiel-transport (kran/blokvogn)

**Felter**:
- Materiel-id, anlægsnummer, beskrivelse
- Transport-type (Blokvogn / Kran-bånd)
- Afhentnings-adresse → aflæsnings-adresse
- Dato for transport
- Tilknyttet ordre

**Volumen**: Materiel-leveringer knyttet til de 10-15 ordrer.

---

## Hvad vi IKKE har brug for

For at undgå unødvendig dataeksport:

- ❌ Faktura-data eller priser
- ❌ Løndata på chauffører
- ❌ CPR-numre eller private adresser
- ❌ Interne PLAN-felter der kun bruges af Colas-administration
- ❌ Historik længere tilbage end Q4 2025

---

## Format-anbefaling

- **CSV pr. tabel** (én CSV pr. entitet ovenfor) — let at importere til Supabase
- **UTF-8 encoding** — danske tegn skal være korrekte
- **ISO 8601 datoer** (`yyyy-mm-ddTHH:MM:ssZ`) hvor relevant — ellers `yyyy-mm-dd`
- **Decimal-separator**: punktum (`24.5`) i CSV — vi konverterer til komma i UI
- **NULL** for tomme felter (ikke tom string)
- **Header-række** med feltnavne i første linje

---

## Anonymisering

- Kunde-navne kan beholdes (relevant for kontekst)
- Chauffør-navne kan beholdes (men vi bruger dem KUN i intern test-environment — ikke offentligt)
- Reg.nr kan beholdes (det er offentligt synligt på bilerne alligevel)
- Hvis I foretrækker fuld anonymisering: erstat med "Chauffør 1", "Chauffør 2" osv. — det fungerer også for vores formål

---

## Tidsplan

- **Ideelt**: udtræk klar inden for 2-3 uger
- **Format**: Send som zip-arkiv via sikker filoverførsel (ikke email)
- **Spørgsmål**: Kontakt Carsten direkte hvis noget er uklart eller skal afgrænses anderledes

---

## Hvad vi gør med data'en

- Importerer til vores test-Supabase-instans
- Bruger til at validere vores datamodel + RLS-policies
- Sletter når app går live OG der findes reelt produktions-datagrundlag
- Deles IKKE med tredjeparts-leverandører eller eksternt agency uden NDA

---

*Spørgsmål? Skriv til Carsten — vi tilpasser gerne scope.*
