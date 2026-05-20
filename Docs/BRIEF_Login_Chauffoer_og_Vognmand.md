# Brief — Login for chauffør og vognmand

**Formål:** Forklare hvordan de to brugergrupper logger ind, hvordan kontoer oprettes og lukkes, og hvorfor vi har valgt disse løsninger. Vedlægges som bilag til IT-afklaring.

---

## Vognmand — login via konto vi opretter

### Sådan fungerer det i praksis

En vognmand henvender sig til Colas (eller bliver oprettet ifm. en kontrakt). Colas-administratoren går ind i appen, indtaster vognmandens navn, firmanavn og email, og trykker "Opret". Vognmanden modtager en velkomst-mail med et midlertidigt password og en henvisning til at vælge sit eget password ved første login.

Ved login indtaster vognmanden sin email og sit password. Første gang fra en ny enhed beder appen om at bekræfte med en SMS-kode til vognmandens telefon, så vi er sikre på at det er den rette person.

Når vognmanden er logget ind, har han adgang til:
- Sin egen disponering (Gantt-overblik, opgaver tildelt ham)
- Sine egne biler og chauffører
- Sine egne afregninger

Han ser **kun** sit eget — ikke andre vognmænds data.

### Hvorfor denne løsning?

- Vognmænd er **eksterne** og har ikke Colas-medarbejderlogin
- Der er **få vognmænd** (4–6), så manuel oprettelse er overskueligt
- Email + password + SMS-bekræftelse er en velkendt model — ingen oplæring krævet
- Vi undgår at skulle integrere med vognmændenes egne IT-systemer (som ikke nødvendigvis findes)

### Når en vognmand stopper

Colas-administratoren går ind i appen og deaktiverer kontoen. Vognmanden kan ikke længere logge ind, og hans chauffører mister automatisk deres adgang.

---

## Chauffør — login via telefonnummer + SMS-kode

### Sådan fungerer det i praksis

Chaufføren åbner appen på sin telefon. Han indtaster sit mobilnummer. Få sekunder efter modtager han en SMS med en 6-cifret kode, som han indtaster i appen. Han er nu logget ind og kan se sine opgaver.

Næste gang han åbner appen, er han stadig logget ind — så han skal ikke gentage det dagligt. Først hvis han skifter telefon, eller hvis hans adgang trækkes tilbage, skal han logge ind på ny.

### Hvor kommer hans adgang fra?

Chaufføren får **ikke** sin konto fra Colas direkte. Det er **vognmanden**, der ejer sin liste af chauffører i appen. Når vognmanden ansætter en ny chauffør, går han ind i sit oversigtsbillede og tilføjer:

- Chaufførens navn
- Chaufførens mobilnummer

Det er nok. Næste gang chaufføren åbner appen og indtaster sit nummer, genkender systemet ham, og han kan logge ind.

### Når en chauffør stopper

Vognmanden går ind i sin chauffør-liste og deaktiverer den pågældende. Næste gang chaufføren forsøger at logge ind, får han en pæn besked om at hans adgang er fjernet — kontakt vognmanden.

### Hvorfor denne løsning?

- **Lav friktion ude i marken** — chaufføren skal ikke huske et password. SMS-kode er hurtigere og virker også for chauffører der ikke er vant til apps
- **Vognmanden har styr på sine egne folk** — det er ham, der ansætter og afskediger, og det er ham, der ved hvem der skal have adgang. Derfor er det også ham, der administrerer det
- **Sikker og lukket lynhurtigt** — én knap fjerner adgang. Vigtigt, fordi chauffører ser ordreinformationer og kunde-/lokationsdata
- **Telefonnummer = identitet** — det er allerede chaufførens identifikation i den daglige drift (vognmanden ringer til ham på det nummer), så det giver mening at bruge samme i appen

### Hvad sker hvis chaufføren skifter telefonnummer?

Han kontakter sin vognmand, som opdaterer nummeret i sin liste. Næste login fungerer på det nye nummer.

### Hvad sker hvis SMS'en ikke kommer frem?

Appen har en "Gensend kode"-knap. Hvis det stadig ikke virker, kan vognmanden via appen sende en midlertidig kode manuelt.

---

## Sammenfatning — hvem ejer hvad?

| Hvem | Ejer | Kan administrere |
|---|---|---|
| **Colas IT** | Formænds + sjakbejs' adgang (via Colas-medarbejderlogin) | Oprettes/lukkes automatisk når medarbejderen tilføjes/fjernes i Colas |
| **Colas-administrator** | Vognmænds adgang | Opretter og deaktiverer vognmandskonti |
| **Vognmanden selv** | Sine egne chaufførers adgang | Tilføjer og fjerner chauffører i sin egen liste |

Det betyder, at adgang altid kan trækkes tilbage hurtigt af den person der har overblikket — Colas IT for medarbejdere, Colas-administration for vognmænd, og vognmanden selv for sine chauffører.
