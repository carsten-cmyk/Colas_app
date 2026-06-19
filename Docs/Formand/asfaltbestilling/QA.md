---
section: asfaltbestilling
app: formand
document_type: q_and_a_for_customer
created: 2026-05-27
last_updated: 2026-06-18
version: v2
status: draft — afventer kunde-svar
---

# Asfaltbestilling — Spørgsmål til kunde-afklaring (v2)

> **Formål**: Afklare de åbne beslutninger med kunden inden Asfaltbestilling går i udvikling. Sektionen frys IKKE før disse er besvaret.
> **Format**: Pr. spørgsmål — kontekst → Colas-forslag → kundens svar (udfyldes på mødet).
> **Mærkning**: 🔴 kritisk · 🟡 vigtig · 🟢 nice-to-have.
> **To dele**: **Del 1** = nye beslutninger fra re-baseline 18. juni (prioritet denne runde). **Del 2** = videreførte spørgsmål fra v1.

---

# DEL 1 — Nye beslutninger (re-baseline 2026-06-18)

> Disse er opstået fordi prototypen er videreudviklet siden v1. De er det primære formål med denne kunde-runde.

### 🟡 B-1: Vejr-markering — gemmes og sendes videre, eller rent visuelt?

**Kontekst**: Formanden kan markere at vejret har påvirket en produkt-dag. I prototypen er markeringen i dag kun lokal og forsvinder — den gemmes ikke og sendes ikke videre.

**Colas-forslag**: **Gem markeringen og send den videre** til vognmand/fabrik, så de ved at dagen er vejr-påvirket. (Ellers har markeringen ingen reel effekt.)

**Kundens svar:**
```
[ ]
```

---

### 🟡 B-3: Skal aflysnings-årsag "andet" kræve en fritekst-begrundelse?

**Kontekst**: Aflysningsårsager er faste valg (regn/frost/underlag/andet). Spørgsmålet er om "andet" skal tvinge en kort skriftlig begrundelse.

**Colas-forslag**: **Udskyd til senere fase** — ikke nødvendigt for første version.

**Kundens svar:**
```
[ ]
```

---

### 🟡 B-4: Hvor robust skal afsendelsen være i første fase?

**Kontekst**: Tre mulige værn ved afsendelse: (a) advarsel hvis summen af tons overstiger ordrens total, (b) automatisk fortrydelse hvis afsendelse fejler undervejs, (c) værn mod dobbelt-klik/dobbelt-afsendelse.

**Colas-forslag**: **Kun (c) dobbelt-afsendelses-værn i første fase.** (a) og (b) udskydes — de er nice-to-have og øger kompleksiteten.

**Kundens svar:**
```
[ ]
```

---

### 🟢 B-5: Skal dato-vælgeren vise ugedag?

**Kontekst**: Datovælgeren viser i dag "16. marts 2026" (uden ugedag). Colas' generelle datoformat-regel anbefaler at vise ugedag i kontekst ("mandag 16. marts 2026").

**Colas-beslutning (intern, 2026-06-18)**: **MED ugedag** — følger datoformat-reglen. *Til kundens orientering — ikke blokerende.*

**Kundens svar:**
```
[ ]
```

---

### 🟡 B-6: Skal en "for sent"-bestilling markeres synligt for vognmand/fabrik?

**Kontekst**: Ny regel (Flow 9c): bestilling efter kl. 11 dagen før udlægning kan stadig sendes, men kræver et opkald til fabrik. Spørgsmålet er om systemet skal bære et synligt flag ("sendt for sent / kapacitet ikke bekræftet") videre til vognmand, fabrik og PLAN/Asfalttavlen.

**Colas-forslag**: **Ja** — så modtagerne ved at kapacitet ikke er bekræftet endnu.

**Kundens svar:**
```
[ ]
```

---

### 🟡 B-7: Er kl. 11-fristen ens for alle fabrikker, eller forskellig pr. fabrik?

**Kontekst**: Bestillingsfristen er sat til kl. 11. Forskellige fabrikker kan i princippet have forskellige cut-off-tider.

**Colas-forslag**: **Ens (global) kl. 11 i første fase** — konfigurerbar pr. fabrik kan komme senere hvis behov.

**Kundens svar:**
```
[ ]
```

---

> **Interne tekniske beslutninger (kræver IKKE kunde-svar):**
> - **B-2**: Datamodel for "Samles på en bil" (felt-struktur) — afklares internt.
> - **E-1**: Oprydning af forældede ekstra-bestilling-felter i cross-app-payloads — afklares internt (architect retter i udviklingsfasen).

---

# DEL 2 — Videreførte spørgsmål fra v1

> Stadig åbne fra forrige runde. Nogle er nu løst af de nye beslutninger og markeret derefter.

## A. Bestilling-livscyklus

### ✅ Q-A1: Hvad sker hvis morgen-bestilling glemmes? *(Colas-forslag: telefon-workaround — ingen system-automatik)*
**Kundens svar:**
```
[ ]
```

### ✅ Q-A2: Skal der være en "Genåbn bestilling"-knap? *(Colas-forslag: nej — rettelser sker pr. telefon til fabrik)*
**Kundens svar:**
```
[ ]
```

### 🟡 Q-A3: Mid-day aflysning — hvad sker med allerede produceret asfalt / bil på vej?
- (a) Produceret, ikke læsset → fabrik håndterer internt, ingen UI-effekt?
- (b) Bil læsset/på vej → leverer alligevel, eller skal systemet kunne stoppe bilen?
- (c) Bil på plads → færdiggør nuværende læs, kun fremtidige aflyses?

**Kundens svar:**
```
[ ]
```

### ~~Q-A4: Tidsgrænse for ekstra-bestilling~~ — **BORTFALDET**
> Ekstra-bestilling oprettes ikke længere af formand (besluttet 3. juni). Timing af morgen-bestilling dækkes nu af kl. 11-fristen (B-7 / Flow 9c).

### 🟢 Q-A5: Dag der passerer uden bestilling — markeres "Manglende"/"For sent", auto-aflyses, eller bare historisk?
**Kundens svar:**
```
[ ]
```

## B. Edge cases på data

### 🟡 Q-B1: Tons-validering — decimaler tilladt? Er 0 t gyldig? Maksimum-loft?
**Kundens svar:**
```
[ ]
```

### 🟢 Q-B2: Sum-warning threshold — *(afhænger af B-4: hvis sum-warning udskydes, bortfalder dette indtil videre)*
**Kundens svar:**
```
[ ]
```

## C. Fabrik-feedback

### 🔴 Q-C1: Hvad hvis fabrik afviser bestilling (kapacitet/fejl/nedbrud)?
- Skal fabrik kunne sende en afvisning retur ("Afvist af fabrik"-status)?
- Eller håndteres alt via telefon?
- Bemærk: hænger sammen med kl. 11-reglen (B-6) — for-sent-bestillinger er netop dem hvor kapacitet kan mangle.

**Kundens svar:**
```
[ ]
```

### 🟡 Q-C2: "Bekræftet af fabrik"-kvittering — skal der være en status efter "Sendt", eller er "Sendt" nok?
**Kundens svar:**
```
[ ]
```

### 🟢 Q-C3: "Produktion startet"-signal — skal formand kunne se hvornår fabrik er begyndt?
**Kundens svar:**
```
[ ]
```

## D. Multi-formand / konflikter

### 🟡 Q-D1: To formænd på samme ordre samtidigt — fejl ("Allerede sendt af [navn]"), merge, eller presence-indikator?
**Kundens svar:**
```
[ ]
```

### 🟢 Q-D2: PLAN-data ændrer sig mens formand er i UI'en — auto-opdater m. toast, eller manuel refresh?
**Kundens svar:**
```
[ ]
```

## E. UI-detaljer

### 🟢 Q-E1: Sortering af produkt-bokse — alfabetisk, receptkode, PLAN-rækkefølge, eller udlægnings-rækkefølge?
**Kundens svar:**
```
[ ]
```

### 🟢 Q-E2: Recept-detaljer synlige (expand på boksen), eller er navn + kode nok?
**Kundens svar:**
```
[ ]
```

### 🟢 Q-E3: Kommentar-feltet — max-tegn? Synlig som historik efter send, eller engangs-vist?
**Kundens svar:**
```
[ ]
```

### 🟢 Q-E4: Bekræftelses-modal indhold — ud over den nye kl. 11-advarsel: skal den vise produkt-liste + total + estimeret leveringstid + bil-antal?
**Kundens svar:**
```
[ ]
```

### 🟢 Q-E5: "Samles på en bil" — visuel indikator (linje mellem bokse, fælles farve, eller blot badge)?
**Kundens svar:**
```
[ ]
```

## F. Cross-app integrationer

### 🟡 Q-F1: "Egen bil"-flow — vælges det i Asfaltbestilling eller i Bil-disponering? Pr. produkt/dag/bestilling?
**Kundens svar:**
```
[ ]
```

### 🟡 Q-F2: Vognmand-kapacitet — skal systemet advare/blokere hvis der bestilles mere end vognmands biler kan dække?
**Kundens svar:**
```
[ ]
```

### 🟡 Q-F3: Fabrik-kapacitet — skal systemet kende fabrikkens kapacitet og advare (data fra PLAN), eller er det fabrikkens ansvar (jf. Q-C1 + kl. 11-reglen)?
**Kundens svar:**
```
[ ]
```

## G. Vejr og afregning

### 🟡 Q-G1: Vejr-markering automatik — skal den trigge "minus regn"-fradrag i afregning, eller rent informativ? *(hænger sammen med B-1)*
**Kundens svar:**
```
[ ]
```

## H. "Samles på en bil" detaljer

### 🟡 Q-H1: Kan "Samles på en bil" ændres EFTER send, eller låst med afsendelsen?
**Kundens svar:**
```
[ ]
```

## Z. Tværgående regler at bekræfte

| # | Beslutning | Forslag |
|---|---|---|
| Z1 | Dato-pille-rækkefølge over flere måneder | Kronologisk, måneds-skift som lille separator |
| Z2 | Default-værdier ved ny dag | "Forventet" = parent-værdi; "Morgen-bestilling" = tom (udfyldes manuelt) |
| ~~Z3~~ | ~~Aflysningsårsag "andet" fritekst~~ | **Flyttet til B-3** |
| Z4 | Decimal-separator i tons | Komma (24,5 t) — ikke punktum |

**Kundens svar / kommentarer:**
```
[ ]
```

---

## Tjekliste til kundemøde

**Prioritet (nye beslutninger — Del 1):**
- [ ] 🟡 B-1 vejr gem+send
- [ ] 🟡 B-3 aflysnings-note
- [ ] 🟡 B-4 afsendelses-robusthed
- [ ] 🟢 B-5 ugedag (kun orientering)
- [ ] 🟡 B-6 for-sent-flag videre
- [ ] 🟡 B-7 kl. 11 global vs. pr. fabrik

**Videreført (Del 2) — anbefalet rækkefølge: 🔴 først, så 🟡 A→H, så 🟢:**
- [ ] 🔴 Q-C1 fabrik afviser
- [ ] 🟡 Q-A3 · Q-B1 · Q-C2 · Q-D1 · Q-F1 · Q-F2 · Q-F3 · Q-G1 · Q-H1
- [ ] 🟢 Q-A5 · Q-B2 · Q-C3 · Q-D2 · Q-E1..E5 · Z1·Z2·Z4
- [ ] ✅ Q-A1 · Q-A2 (hurtig bekræftelse)

---

*Dokument-version: 2026-06-18 · v2 · draft*
