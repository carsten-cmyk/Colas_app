# Oplæg til Jesper — backend-setup for app'erne (bekræft retning)

> **Status:** Carstens finaliserede mail (sendt 2026-06-22). Kanonisk formulering — brief til udviklerne når Jesper har bekræftet. Let typo-oprydning ift. den afsendte mail (indhold uændret).
> Baggrund: efter mødet med Abraham (France). Relaterede docs: `MEETING_PLAN_ORACLE_FR.md`, `HOSTING_OG_DATABASE_VALG.md`, `FUNCTIONAL_FLOWS.md` (vognmand fil-udveksling).

---

Hej Jesper

Efter vores møde med Abraham har jeg samlet op på den retning, som efter min vurdering passer bedst til Colas. Jeg vil gerne have dig til at bekræfte den, så vi kan bruge den som brief til udviklerne.


**Oracle backend setup, bygget af Cegal**

Backend bygges som PLAN_APP inde i APPS Oracle af Cegal for Colas DK. Vi benytter altså Oracle over alle løsninger i det eksisterende miljø.

Systemet deles i to skemaer af sikkerhedshensyn. INT_PLAN_APP indeholder alle backend-objekter, og EXT_PLAN_APP publiceres som webservice med ORDS/REST-interface.

Løsningen kører på samme interne Azure-platform som PLAN – altså samme miljø, samme overvågning, samme oppetid. Ekstern udvikler bygger frontend og apps oven på, men driver ikke selv backenden. Cegal ejer og driver Oracle-delen.


**Brugeradgang og autentifikation**

Formænd godkendes via Azure AD, som I gør i dag. Chauffører og vognmænd findes ikke i PLAN/AD. Jeg ved, at du ikke ønsker at oprette AD-konti til alle chauffører, som både er dyrt og ressourcekrævende at vedligeholde.

Derfor foreslår jeg denne løsning:

- Formand: Azure AD, som i dag.
- Vognmand: Brugernavn/adgangskode oprettet og lagret i Oracle (INT_PLAN_APP).
- Chauffør: SMS-login med PIN via LINK Mobility og lagret i Oracle.

Det væsentligste sikkerhedsmæssigt er, at kun formanden kan udløse skrivning til PLAN gennem EXT_PLAN_APP, og han er AD-autentificeret. Chauffør og vognmand bidrager med data, men skriver ikke direkte til PLAN.


**Vognmandens app og dataudveksling**

Vognmandens app skal håndtere to ting:

- Se ordrer og bilbehov fra Colas (read-only), filtreret til kun det der vedrører ham.
- Udveksle disponeringsdata med os i filformat begge veje: vi sender bilbehov ud, vognmanden returnerer sin disponering (registreringsnummer/chauffør/starttid).

Alle vognmænd leverer disponeringsdata via CSV-fil. De store via SFTP, de mindre via webupload.

Det betyder, at løsningen ud over REST også skal kunne håndtere en fil-ind/ud-kanal (CSV-import/eksport). Kan du bekræfte, at det kan ligge inden for samme setup, eller skal filudvekslingen være en separat kanal ved siden af EXT_PLAN_APP?


**Cegal ejer backenden**

Cegal bygger og ejer systemets backend, så hver schema- og backend-ændring bliver en Cegal-opgave. Det betyder, at vi afhænger af dem og deres tid til at implementere ændringer. Det medfører en omkostning, men det fjerner jo også noget fra frontend-udviklerne. Til gengæld bliver hele backend-løsningen bygget efter samme præmis som PLAN i dag.


**Bekræftelse**

Kan du bekræfte følgende, så jeg kan dokumentere det til udviklerne:

- Vi går efter Cegal-modellen (PLAN_APP i APPS, Oracle) og ikke en egen SQL-server.
- Setuppet kan stå på samme interne Azure-platform som PLAN.
- Vi kan åbne firewallen, så app'en kan nå EXT_PLAN_APP (ORDS/REST).
- Du står for Azure AD-brugergodkendelse, og Oracle for vognmand- og chauffør-login kombineret med LINK Mobility SMS.

Vil du bekræfte det?

Hilsen
Carsten

---

## Åbne punkter efter bekræftelse (til udvikler-brief)
- **Fil-ind/ud-kanal:** ligger CSV-import/eksport i `EXT_PLAN_APP` eller som separat kanal? (spørgsmål stillet i mailen)
- **Auth-lagring:** vognmand (brugernavn/password) + chauffør (LINK Mobility SMS+PIN) — begge logins lagret i Oracle (INT_PLAN_APP). Detaljeret datamodel afklares.
- **Iteration vs. ticket-og-vent:** Cegal ejer backend → bevidst trade-off; afklar ændringsproces + omkostningsmodel.

*Sidst opdateret: 2026-06-22.*
