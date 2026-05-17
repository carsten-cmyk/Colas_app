# Diskussion: Returlæs (fabrik-initieret transportopgave)

**Status:** UNDER AFKLARING — afventer kunde-input
**Dato startet:** 2026-05-16
**Berørte apps:** formand, vognmand, chauffeur (chauffeur-web + native), senere fabrik

---

## Kontekst & forretningsregel

Vognmandens chauffører kan ifølge stående aftale tage **returlæs** når de kører tomme fra
udførselsstedet. Fabrikken kan ringe og sige:

> "Kan du køre forbi X grusgrav og hente et læs grus med til fabrikken?"

Opgaven er **udenfor Colas-ordren** og betales af fabrikken (eller anden tredjepart).
Den skal være synlig for formand, vognmand og chauffør — men kun chaufføren udfører den.
Formand og vognmand kan ikke disponere på den.

Fabrikken er afsender af bestillingen (fabrik-view bygges senere).

---

## Anbefalet datamodel

**Returopgave** som selvstændig entitet — sidestillet med `Læs`, IKKE en del af `Ordre`.

```
Ordre (formand-ejet)
 └── Læs[]              (formand-disponerede)

Returopgave (fabrik-ejet)        ← NY entitet, sidestillet
 ├── id
 ├── bestiller          { type: 'fabrik', fabrikId, fabrikNavn }
 ├── afhentning         { sted, position, tidsvindue }
 ├── aflevering         { sted, position, tidsvindue }
 ├── materiale          { type, mængde, enhed }
 ├── tildeling          { vognmandId, chaufførId, biltype, slot }
 ├── status             'tilbudt' | 'accepteret' | 'undervejs' | 'læsset' | 'afleveret' | 'afsluttet' | 'afvist' | 'annulleret'
 └── økonomi            { aftaleRef, sats, valuta }   ← privat for vognmand+fabrik
```

**Hvorfor sideordnet entitet:**
- Holder ordrens regnskab rent (returlæs forurener ikke tons/temperatur/økonomi på Colas-ordren)
- Én samlet kilde til "chaufførens disponible tid" = `Læs ∪ Returopgaver`
- Tillader fabrik at oprette uden at formand er involveret

---

## Per-rolle behandling

| Rolle | Ser | Kan |
|---|---|---|
| **Formand** | Lille `R`-mærke på chaufførens "på vej til fabrik"-pille i Gantt. Signal om at chauffør er optaget — ingen detaljer | Intet. Ingen disponering, ingen økonomi |
| **Vognmand** | Tidsblok i disponerings-Gantt med bestiller + sats. Stiplet kant + R-ikon. | Se økonomi (det er hans forretning). Evt. afvise før chauffør får tilbud (åbent) |
| **Chauffør** | Fuld task på telefonen med distinct styling (stiplet kant + R-ikon). Egen afhentning + aflevering | Accept/afvis. Normal workflow: ankomst grusgrav → læsset → afleveret |
| **Fabrik** (senere) | Oprette + tildele + tracke returlæs | Fuld kontrol |

---

## Visuel sprog — fælles på tværs af apps

- **Stiplet 2px border** rundt om blokken (signal: "ikke en del af hovedflowet")
- **R-badge** — gult cirkulært badge med "R" (`bg-yellow text-deep-teal`)
- **Chip** øverst: `Returlæs · Fabrik X`
- **Padlock-ikon** for formand/vognmand (signal: "kan ikke disponeres")
- For formand specifikt: bare et lille R på den eksisterende "på vej til fabrik"-pille — minimal interferens

---

## Åbne spørgsmål til kunden

1. **Accept-flow:** Skal chauffør acceptere hver returopgave aktivt, eller har vognmand stående aftale så de bare dukker op?
2. **Konflikt:** Hvad sker hvis returlæs forsinker næste ordre? Kan formand kontakte chauffør? Kan returlæs "trumfes"?
3. **Genplanlægning:** Hvis formand flytter en ordre 30 min, hvem flytter den planlagte returopgave?
4. **Annullering:** Kan fabrikken trække returlæs tilbage? Med hvilket varsel? Hvem får besked?
5. **Synlighed af økonomi:** Skal vognmand kunne se sats per returlæs, eller kun aggregeret periodevis?
6. **Matching:** Skubber fabrikken returlæs til en konkret chauffør, eller broadcaster systemet til alle ledige i nærheden?
7. **Push til chauffør:** Hvilken distributionsmekanisme? (Samme TBD som Flow 1 trin 8 — kan løses sammen)
8. **GPS / sporing:** Skal chauffør tracke GPS på returlæs (som ved Colas-læs)? Hvem ser positionen?
9. **Dokumentation:** Skal vejeseddel og temperaturmåling kobles på returlæs, eller er det udelukkende fabrikkens dokumentation?
10. **Afregning af kørsel:** Når chauffør tager returlæs efter en Colas-ordre, hvordan håndteres timer? Kører tiden på Colas indtil aflæsning, eller skifter "ejer" af tiden ved fabrik-stop?

---

## Hvad skal med i FUNCTIONAL_FLOWS når afklaret?

Forslag — nyt **Flow 10: Returlæs — Fabrik → Vognmand → Chauffør**:

- Trin 1: Fabrik opretter returopgave (fabrik-app — senere fase)
- Trin 2: Tildeling / matching til vognmand+chauffør (mekanisme afklares)
- Trin 3: Chauffør accept/afvis (hvis acceptflow vælges)
- Trin 4: Synlighed for formand (R-mærke på "på vej til fabrik"-pille)
- Trin 5: Synlighed for vognmand (tidsblok i disponerings-Gantt)
- Trin 6: Chauffør udfører (afhentning → læsset → aflevering)
- Trin 7: Afslutning + afregning til fabrik

**Forretningsregler at tilføje under "Forretningsregler & Konventioner":**
- Returopgave er sideordnet `Ordre`, ikke en del af den — påvirker ikke ordrens regnskab
- Formand kan ikke disponere returopgaver, kun se dem som "optaget"-mærke
- Vognmand ser økonomi på egne returopgaver, men kan ikke ændre tildeling efter chauffør har accepteret
- Chaufførens disponible tid = `Læs ∪ Returopgaver` (ikke kun Læs)

---

## Status på implementering

- **Prototypeboks placeret:** `apps/formand/src/prototypes/ordre-plan/OrdrePlanScreen.tsx` — Evaluerings-tab (under Evalueringsområder-tabellen)
- **Næste skridt:** Carsten tager spørgsmålene med til kunden. Når svarene foreligger:
  1. Opdater dette dokument med beslutninger
  2. Tilføj Flow 10 til FUNCTIONAL_FLOWS.md
  3. Tilføj `Returopgave`-typen til `shared/types/`
  4. Lav SPECs for R-mærke på formand-pille, returlæs-blok i vognmand-Gantt, og returlæs-task-kort i chauffør-app
