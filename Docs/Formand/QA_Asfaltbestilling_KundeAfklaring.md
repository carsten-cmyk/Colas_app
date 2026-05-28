---
section: asfaltbestilling
app: formand
document_type: q_and_a_for_customer
created: 2026-05-27
last_updated: 2026-05-27
status: draft — afventer kunde-svar
---

# Asfaltbestilling — Åbne spørgsmål til kunde-afklaring

> **Formål**: Disse spørgsmål er opstået under intern gennemgang af Asfaltbestilling-sektionen og skal afklares med kunden inden udvikling kan afsluttes.
> **Format**: Pr. spørgsmål — kontekst (hvorfor det betyder noget) → konkrete valg → kundens svar (udfyldes på mødet).
> **Sortering**: Grupperet efter emne. Mærket med 🔴 (kritisk), 🟡 (vigtig) eller 🟢 (nice-to-have).

---

## A. Bestilling-livscyklus

### ✅ Q-A1: Hvad sker hvis morgen-bestilling glemmes inden produktion?

**Kontekst**: Formanden glemmer at sende morgen-bestilling før første bil skal læsse på fabrik kl. 06:30.

**Mulige tilgange overvejet**:
- (a) Systemet blokerer fabrikken indtil bestillingen kommer
- (b) Fabrik producerer fra "Forventet"-feltet som auto-fallback
- (c) Advarsel/påmindelse til formand uden system-automatik
- (d) Reflektér nuværende workaround (telefon)

**Svar (intern Colas-afklaring, 2026-05-27)**:
> **(d)** Beholder nuværende telefon-workaround. Fabrik/vognmand ringer til formanden. Ingen system-automatik eller blocking. Skal afspejles i out-of-scope-notatet.

**Til kunde-bekræftelse**: er denne arbejdsgang stadig den rigtige, eller ønsker kunden et system-trigger (fx SMS-påmindelse)?

**Kundens kommentar:**
```
[ ]
```

---

### ✅ Q-A2: Skal der være en "Genåbn bestilling"-knap for sendte bestillinger?

**Kontekst**: Efter "Send til fabrik" er felter låst. Hvis formanden indser en fejl, skal han kunne genåbne?

**Mulige tilgange overvejet**:
- (a) Knap "Genåbn bestilling" altid tilgængelig
- (b) Knap kun før produktion er startet
- (c) Ingen knap — telefon-til-fabrik er reglen

**Svar (intern Colas-afklaring, 2026-05-27)**:
> **(c)** Ingen genåbn-knap. Lås efter send er hard. Formanden må ringe til fabrik ved fejl. Eksisterende out-of-scope-notat om "edit-cascade efter send" bekræftet.

**Til kunde-bekræftelse**: er det acceptabelt at fejl-rettelser altid kræver telefon-opringning til fabrik?

**Kundens kommentar:**
```
[ ]
```

---

### 🟡 Q-A3: Mid-day aflysning — hvad sker med allerede produceret asfalt?

**Kontekst**: Formanden kan aflyse en produkt-dag efter send er gået igennem. Men hvad nu hvis fabrik allerede har produceret en batch, eller en bil allerede er på vej til pladsen?

**Spørgsmål til kunde**:
- (a) **Asfalt produceret, ikke læsset endnu** → Fabrik håndterer det internt (genbrug/kassér)? Ingen UI-effekt?
- (b) **Bil læsset, på vej til pladsen** → Bilen leverer alligevel (formand håndterer manuelt), ELLER systemet skal kunne stoppe bilen med push-besked til chauffør?
- (c) **Bil på pladsen / aflæsning i gang** → Bilen færdiggør sin nuværende læs (kan ikke aflyses), kun fremtidige læs aflyses?

**Kundens svar:**
```
[ ]
```

---

### 🟡 Q-A4: Bestilling sent på dagen — er der en tidsgrænse?

**Kontekst**: Ekstra-bestilling kan tilføjes når som helst i dagens forløb. Men fabrik har åbningstider og produktion tager tid.

**Spørgsmål til kunde**:
- Skal systemet have en hard cut-off (fx ingen ekstra-bestilling efter kl. 14:00 til samme dag)?
- Skal ekstra-bestilling automatisk skubbes til næste dag hvis den kommer efter en bestemt tid?
- Eller er det op til formanden + fabrik manuelt (samme telefon-workaround som A1)?

**Kundens svar:**
```
[ ]
```

---

### 🟢 Q-A5: Dag der passerer uden bestilling

**Kontekst**: Hvis en dag i ordrens udførelses-periode passerer uden at formand har sendt noget for den dag.

**Spørgsmål til kunde**:
- Skal dagen markeres "Manglende" / "For sent" i UI'en?
- Auto-aflyses den med en system-årsag?
- Eller bare en historisk markering uden konsekvens?

**Kundens svar:**
```
[ ]
```

---

## B. Edge cases på data

### 🟡 Q-B1: Tons-validering

**Kontekst**: Felterne `tonsPlanned` og `morgenTons` accepterer tal. Men hvilke grænser?

**Spørgsmål til kunde**:
- **Tilladte værdier**: heltal kun (24 t), eller decimaler (24,5 t)?
- **Mindste værdi**: er 0 t en gyldig bestilling (= "produkt aflyst for dagen" — eller skal det blot lade værre at sende)?
- **Maksimum**: skal der være et logisk loft (fx 500 t pr. produkt pr. dag), eller blot ordrens samlede tons som loft?

**Kundens svar:**
```
[ ]
```

---

### 🟢 Q-B2: Sum-warning threshold

**Kontekst**: Hvis summen af `tonsPlanned` overstiger ordrens samlede bestilte tons, vises en blød advarsel (men det blokerer ikke).

**Spørgsmål til kunde**:
- Skal advarslen trigge LIGE over total (24,1 vs 24,0), eller med en buffer (fx +5%)?
- Skal advarslen være blokerende ved et bestemt punkt (fx +20% over)?
- Eller bare en lille muted-tekst der ikke forstyrrer flow'et?

**Kundens svar:**
```
[ ]
```

---

## C. Fabrik-feedback

### 🔴 Q-C1: Hvad hvis fabrik afviser bestilling?

**Kontekst**: I dag er bestillingen "fire-and-forget" — formand sender, fabrik modtager. Men hvad hvis fabrik **ikke kan levere** (kapacitet, produkt-fejl, nedbrud)?

**Spørgsmål til kunde**:
- Skal fabrik kunne sende en **afvisning** retur til formand (notifikation + "Afvist af fabrik"-status)?
- Eller håndteres alt manuelt via telefon (som A1)?
- Hvis afvisning er i UI: skal formand kunne sende **igen** efter rettelse, eller skal det altid være telefon?

**Kundens svar:**
```
[ ]
```

---

### 🟡 Q-C2: Bekræftelse "modtaget af fabrik"

**Kontekst**: Nu sættes status til "Sendt" når formand klikker. Men der er ingen synlig kvittering på at fabrik har **set** den.

**Spørgsmål til kunde**:
- Skal der være en yderligere status "Bekræftet af fabrik" (med tidspunkt) — fabrik klikker accept?
- Eller er "Sendt" tilstrækkeligt (fabrik tager ansvar fra det punkt)?
- Hvis bekræftelse: hvem på fabrik gør det? Hver gang en bestilling kommer ind, eller batch-vis?

**Kundens svar:**
```
[ ]
```

---

### 🟢 Q-C3: "Produktion startet"-signal

**Kontekst**: Skal formand kunne se hvornår fabrik faktisk er begyndt at producere?

**Spørgsmål til kunde**:
- Skal status kunne være "I produktion" (efter "Sendt", før "Bil på vej")?
- Eller er det overkill — formand følger med via Vejesedler i Udførsel-tabben uanset?

**Kundens svar:**
```
[ ]
```

---

## D. Multi-formand / konflikter

### 🟡 Q-D1: To formænd redigerer samme ordre samtidigt

**Kontekst**: Hvad sker hvis to formænd er logget på samme ordre og begge prøver at sende?

**Spørgsmål til kunde**:
- Hvor ofte sker dette i praksis? Sjældent / ofte?
- Hvis det sker: skal den ene få en fejl ("Allerede sendt af [navn]"), eller skal det merges?
- Skal vi vise hvilken anden formand der har ordren åbnet (real-time presence-indikator)?

**Kundens svar:**
```
[ ]
```

---

### 🟢 Q-D2: PLAN-data ændrer sig mens formand er i UI'en

**Kontekst**: Hvis ordre-data ændres i PLAN (fx nyt produkt tilføjes, dato udvides) mens formand er midt i bestilling.

**Spørgsmål til kunde**:
- Skal UI'en auto-opdatere (med en toast: "Ordre opdateret fra PLAN")?
- Eller skal formand klikke "Refresh" manuelt?
- Skal en advarsel komme hvis ændring sker MENS formand har en bestilling under sending?

**Kundens svar:**
```
[ ]
```

---

## E. UI-detaljer

### 🟢 Q-E1: Sortering af produkter

**Kontekst**: Produkt-bokse vises på en dag. Hvilken rækkefølge?

**Spørgsmål til kunde**:
- Alfabetisk efter navn?
- Efter receptkode (numerisk)?
- Efter rækkefølge de er tilføjet i den oprindelige ordre fra PLAN?
- Efter forventet udlægnings-rækkefølge?

**Kundens svar:**
```
[ ]
```

---

### 🟢 Q-E2: Recept-detaljer synlige?

**Kontekst**: I dag viser produkt-bokse navn + receptkode + tykkelse. Receptens detaljer (mineralogi, type, klassificering) er ikke synlige.

**Spørgsmål til kunde**:
- Behøver formand se flere recept-detaljer (fx via expand-funktion på produktboksen)?
- Eller er navn + kode tilstrækkeligt — detaljerne hører til PLAN-systemet?

**Kundens svar:**
```
[ ]
```

---

### 🟢 Q-E3: Kommentar-feltet — regler

**Kontekst**: Ved "Send til fabrik" kan formand skrive en kommentar (valgfri).

**Spørgsmål til kunde**:
- Skal der være en max-tegn-grænse (500 ofte brugt)?
- Skal kommentaren være synlig som **historik** efter send (under produkt-boksen som læselig info)?
- Eller er den engang-vist (kun i selve send-handlingen)?

**Kundens svar:**
```
[ ]
```

---

### 🟢 Q-E4: Bekræftelses-modal indhold

**Kontekst**: Modal der vises før formand bekræfter send.

**Spørgsmål til kunde**:
- Skal den vise: liste over produkter + tons + total + samles-flags + ordre-nr + dato?
- Skal den vise et forventet **leverings-tidspunkt** baseret på fabrik+vognmand?
- Skal den vise estimeret **bil-antal** (baseret på bil-kapacitet)?

**Kundens svar:**
```
[ ]
```

---

### 🟢 Q-E5: "Samles på en bil" — visuel indikator

**Kontekst**: Når 2-3 produkter er markeret med "Samles på en bil", skal de visuelt være kædet sammen?

**Spørgsmål til kunde**:
- Vises en linje/streg mellem dem?
- Får de samme baggrundsfarve eller markering?
- Eller bare et lille badge på hver markeret produkt?

**Kundens svar:**
```
[ ]
```

---

## F. Cross-app integrations

### 🟡 Q-F1: "Egen bil"-flow integration

**Kontekst**: I FUNCTIONAL_FLOWS er der en "Egen bil"-variant af bilbestilling (formand bestemmer chauffør + reg.nr selv). Spørgsmål: hvor vælges "Egen bil"?

**Spørgsmål til kunde**:
- Vælges det i **Asfaltbestilling** (sammen med tons-indtastning)?
- Eller i **Bil-disponering** (separat sektion efter morgen-bestilling)?
- Hvis i Asfaltbestilling: er det en checkbox pr. produkt, pr. dag, eller pr. hele bestillingen?

**Kundens svar:**
```
[ ]
```

---

### 🟡 Q-F2: Vognmand-kapacitet-validering

**Kontekst**: Hvis vognmand har 3 biler men formand bestiller mere end de kan klare på en dag.

**Spørgsmål til kunde**:
- Skal systemet **forhindre** bestillingen (rød fejl)?
- Skal det blot vise en **advarsel** ("Vognmand har 3 biler — kan kun dække ~120 t/dag")?
- Eller intet — fabrik+vognmand håndterer det manuelt?

**Kundens svar:**
```
[ ]
```

---

### 🟡 Q-F3: Fabrik-kapacitet-validering

**Kontekst**: Hvis fabrikkens daglige produktion ikke kan rumme bestillingen.

**Spørgsmål til kunde**:
- Skal systemet kende fabrikkens kapacitet og advare? (Data fra PLAN?)
- Eller er det fabrikkens problem at afvise (jf. Q-C1)?

**Kundens svar:**
```
[ ]
```

---

## G. Vejr-flag og afregning

### 🟡 Q-G1: Vejr-flag automatik

**Kontekst**: Formand kan toggle et "Vejr"-flag på en produkt-dag — informativt at vejret har påvirket dagen.

**Spørgsmål til kunde**:
- Skal vejr-flaget **automatisk trigge** "minus regn"-fradrag i afregning?
- Eller er det **rent informativt** — afregning sker uafhængigt?
- Hvis automatik: hvilket fradrag-beløb / procent?

**Kundens svar:**
```
[ ]
```

---

## H. "Samles på en bil" detaljer

### 🟡 Q-H1: Kan "Samles på en bil" ændres EFTER send?

**Kontekst**: I dag er flaget låst med batchen (samme regel som tonsPlanned/morgenTons).

**Spørgsmål til kunde**:
- Er det OK at flaget er **låst** efter send?
- Eller skal det kunne ændres til/fra **mens dagen kører** (fx hvis bilen alligevel kun har plads til ét produkt på dagen)?

**Kundens svar:**
```
[ ]
```

---

## Bonus: Tværgående regler at låse

Mens vi har kunden på linjen, foreslår jeg vi også får bekræftelse på følgende — de er nævnt i andre sektioner men hører delvist hjemme i Asfaltbestilling:

| # | Beslutning | Forslag |
|---|---|---|
| Z1 | **Dato-pille-rækkefølge** når perioden spænder flere måneder | Sorteret kronologisk, måneds-skifte vises som lille separator |
| Z2 | **Default-værdier** ved ny dag | tonsPlanned = parent.startDate; morgenTons = `undefined` (skal udfyldes manuelt) |
| Z3 | **Aflysningsårsag "andet"** | Kræver fritekst-kommentar (>10 tegn) |
| Z4 | **Decimal-separator i tons** | Komma (24,5 t) — IKKE punktum |

**Kundens svar / kommentarer:**
```
[ ]
```

---

## Tjekliste til kundemøde

**Allerede afklaret internt — kun bekræftelse fra kunde:**
- [ ] ✅ Q-A1 glemt morgen-bestilling (forslag: telefon-workaround)
- [ ] ✅ Q-A2 "Genåbn bestilling"-knap (forslag: ingen knap)

**Åbne — kræver kundens svar:**
- [ ] 🟡 Q-A3 mid-day aflysning
- [ ] 🟡 Q-A4 tids-grænse for ekstra-bestilling
- [ ] 🟢 Q-A5 dag der passerer uden bestilling
- [ ] 🟡 Q-B1 tons-validering
- [ ] 🟢 Q-B2 sum-warning threshold
- [ ] 🔴 Q-C1 fabrik afviser
- [ ] 🟡 Q-C2 "modtaget af fabrik"-bekræftelse
- [ ] 🟢 Q-C3 "produktion startet"-signal
- [ ] 🟡 Q-D1 to formænd samtidigt
- [ ] 🟢 Q-D2 PLAN-data ændrer sig
- [ ] 🟢 Q-E1 produkt-sortering
- [ ] 🟢 Q-E2 recept-detaljer
- [ ] 🟢 Q-E3 kommentar-felt-regler
- [ ] 🟢 Q-E4 bekræftelses-modal-indhold
- [ ] 🟢 Q-E5 "samles på en bil"-visuel
- [ ] 🟡 Q-F1 "egen bil" hvor vælges
- [ ] 🟡 Q-F2 vognmand-kapacitet
- [ ] 🟡 Q-F3 fabrik-kapacitet
- [ ] 🟡 Q-G1 vejr-flag automatik
- [ ] 🟡 Q-H1 "samles på en bil" lås efter send
- [ ] 🟢 Z1-Z4 tværgående regler

**Anbefalet rækkefølge på mødet**: start med 🔴 (Q-C1), så 🟡 i topic-rækkefølge A→H, så 🟢 til sidst hvis tiden tillader. Q-A1 + Q-A2 kan tages hurtigt som åbning ("vi har overvejet X — er det OK?").

---

*Dokument-version: 2026-05-27 · draft*
