# Colas Formandsapp — Kontekst & Baggrund

## Virksomhed
Colas Danmark A/S er et dansk asfalt- og vejentreprenørfirma med ~800 ansatte og omsætning på ~1 mia. DKK. Ejet af franske Colas Group. Kerneopgaver: asfaltproduktion, udlægning, vejvedligehold, råstoffer.

## Problemet vi løser
En formand på en asfaltplads koordinerer i dag alt manuelt:
- Ringer til vognmand for at bestille biler
- Taler med fabrik om produktion
- Opdaterer PLAN-systemet (et ældre desktop-system)
- Fordeler tons på dage i hovedet
- Modtager chaufførtimer på papir eller telefon
- Dokumenterer afvigelser manuelt

Resultatet: 120M DKK i årlig transportomkostning uden visibility, forsinkelser, fold i belægningen fordi asfalt bliver for kold, og manglende data til efterkalkulation.

## PLAN-systemet (eksisterende)
PLAN er det nuværende planlægningssystem formanden opdaterer. Det indeholder:

**Ordre-niveau:**
- Arbejdsordre nr, kunde, projektnavn/etape
- Distrikt, sagsansvarlig, holdnr/formand
- Kontaktperson (projektleder + tlf)
- Vejledende holdtimer, forbehold/kommentarer
- Enterprise-kontrol, regningsarbejde ja/nej
- Krav til samlinger (klæbet, varm i varm, infrared)

**Aktivitet/Recept-niveau:**
- Aktivitetsnavn (fx "GAB I at levere og udlægge, 80mm")
- Receptkode + navn (fx 23001B, 82101H)
- Fabrik (kode + navn, fx "29000-PROD A EAST KØGE PH")
- Mængde i m², tykkelse i kg/m², kg/m3, tons total
- Fordeling per dag (Dag1/Dag2/Dag3 i tons)

**Ressource-niveau per dag:**
- Materiel med anlægsnr og beskrivelse (HAMM HD10, VÖGELE 1900-3I, KUBOTA mv.)
- Vogntype og stk/timer-kapacitet
- Job-rapport: faktiske køretimer, ventetimer, akkord-tons per vogntype

## En ordres anatomi
En ordre kan have **flere produkter/recepter** som udlægges sekventielt — produkt 1 lægges ud over X dage, produkt 2 lægges ovenpå over Y dage. Hvert produkt har egne tons, kvm, tykkelse og dagfordeling.

**Eksempel ordre:**
- Ordre: 1212343 — Uddannelsescenter Syd, Søvej 6D, Nakskov
- Produkt 1: 23001B — 200t, 67m², 295mm tykkelse
- Produkt 2: 82101H — 752t, 4017m², 187mm tykkelse
- Fabrik: 29000-PROD A EAST KØGE PH (~36 min kørsel)

## Materiel og transport
Materiel skal transporteres til pladsen. Der er to typer transport:

**Asfalt-transport** (løbende hele dagen, cyklisk):
- 7-akslet sættevogn eller båndtrailer kører frem og tilbage fabrik↔plads
- Mange læs per dag, tidssat interval

**Materiel-transport** (én gang — dag 1 og sidste dag):
- HAMM HD10 VT → Blokvogn
- VÖGELE 1900-3I → Blokvogn
- Kran/feeder → Lastbil med aflæsserbånd
- Kubota og mindre maskiner → Egen kørsel

## Tre faser i systemet
1. **Planlægning** — formanden planlægger fremad (aftenen før / morgen)
2. **Eksekvering** — real-time under jobbet på pladsen
3. **Evaluering** — efterkalkulation: planlagt vs. faktisk (bruges af Mads i salg)

## Nøglepersoner (Colas)
- **Ole Jensen** — Formand (primær bruger af denne app)
- **Henrik Thor** — Projektleder
- **Lars-Henrik Andersen** — Sagsansvarlig / Distriktschef
- **Jeanette Vridstoft** — Kunder, Marked, Salg (CRM-projekt)
- **Jacob Kloster** — Industri, Asfaltfabrikker
- **Lars Dich-Johansen & Mads Zinglersen** — Asfalt & Salg
- **Jesper Nielsen** — IT
