# Hosting og database — valg & vurdering

> **Status:** 🟢 **Retning valgt 2026-06-05: egen instance i France-datacenteret** (samme miljø som PLAN). Forretnings-begrundelse vægter tungest: overvågning findes allerede (Jesper/DK IT), SSO for alle medarbejdere, kendte Oracle-udviklere, kendt oppetid, compliance på plads (EU + ejer-kontrolleret), + goodwill hos ejerne. DK bygger frontend + native apps oven på. **Afventer:** Jesper (DK IT) validering (mail draftet — se `MAIL_JESPER_FRANKRIG_INSTANCE.md`) + afklaring af Postgres-vs-Oracle + iterations-tempo (se Åbne punkter). Supabase EU er nu fallback, ikke primær vej.
>
> *Historik: 2026-06-04 var dette under evaluering (Supabase EU vs France). Skiftede til France-retning 2026-06-05.*
>
> **Dette er arkitektur-notat — ikke juridisk rådgivning.** EU Data Act/GDPR-godkendelse skal Colas' DPO/legal underskrive.

---

## Krav (låst)

| Krav | Detalje |
|---|---|
| **EU data residency** | Persondata (chauffør-navn, telefon, GPS/lokation) SKAL ligge i EU. Ikke til forhandling. |
| **EU Data Act + GDPR compliance** | EU Data Act (Reg. 2023/2854, gælder fra sept. 2025): beskyttelse mod ulovlig tredjelands-myndighedsadgang + cloud-switching/portabilitet. GDPR: DPA, sub-processor-tjek, transfer-grundlag. |
| **SSO** | Formand skal logge ind via Colas' eksisterende IdP (samme der driver PLAN — sandsynligvis Entra ID). Rolle-mapping: formand/vognmand/chauffør/fabrik/kunde. |
| **Sikkerhed** | Rolle/ordre-baseret adgang håndhævet i DB (ikke kun app-lag), MFA, audit-log, kryptering at rest/in transit, secrets-håndtering, pen-test før go-live, data-minimering på lokation. |
| **Offline-first** | Formand + chauffør: cache + write-queue + auto-sync (uafhængigt af DB-valg — bygges selv). |
| **Realtime** | Cross-app status-flow (formand → vognmand → chauffør) — ønskes realtime. |

---

## Kontekst: PLAN er system of record

- **PLAN kører på Oracle i Frankrig, hos ejerne** (Colas-koncernen). Frankrig = EU ✅, ejer-kontrolleret.
- **PLAN ligger som en SEPARAT, fritstående DB** ved siden af de øvrige franske systemer — ikke sammenfiltret med koncernens kernesystemer. (Bekræftet 2026-06-04.)
- Ordrer/holdpakker stammer fra PLAN. Flows beskriver data **PLAN → formand** og **retur til PLAN** (se `FUNCTIONAL_FLOWS.md`).
- **Princip:** PLAN's Oracle forbliver kilde for planlægningsdata. Apps'ene bygges IKKE oven på PLAN-Oracle direkte (forkert værktøj til realtime/mobil/RLS). Apps'ene får deres **egen operationelle DB** + et **integrationslag** (API/sync/CDC) mod PLAN.

**Konsekvens af at PLAN er fritstående:** Det styrker Option 2 (France-datacenter) — der er allerede præcedens for en standalone DB i det datacenter, så app-Postgres som endnu en separat DB ved siden af er driftsmæssigt konsistent. Integrationsgrænsen bliver en ren **DB-til-DB / API-grænse mellem to fritstående databaser**, ikke en dyb kernesystem-integration → lettere at sync'e og lettere for ejernes IT at godkende.

---

## Optioner

| Option | EU-residency | US-jurisdiktion (CLOUD Act) | Udviklingshastighed | Drift |
|---|---|---|---|---|
| **1. Supabase EU + Netlify** | ✅ (EU-region, fx Frankfurt) | ⚠️ US-selskaber — eksponering selv i EU-region | 🟢 Højest (auth/realtime/RLS/instant-API out of the box) | Managed |
| **2. Ejernes France-datacenter** (Postgres v. siden af PLAN-Oracle) | ✅ (Frankrig) | ✅ Ingen — EU/ejer-kontrolleret | 🔴 Lavest (bygger auth/realtime selv, afhængig af ejernes IT) | Ejernes IT |
| **3. Azure EU PostgreSQL** | ✅ (EU-region) | ⚠️ US-selskab (men EU-regions + Entra ID-fit) | 🟡 Mellem | Managed |

### Supabase + Netlify — detaljer
- **DB:** Supabase Postgres, EU-region. **Auth:** SAML 2.0/OIDC → føderer mod Colas IdP. **Sikkerhed:** Row Level Security (RLS) per rolle/ordre — passer multi-app-modellen (vognmand-blind-zone, fabrik-direkte-link).
- **Knast:** Supabase Inc. + Netlify er US-selskaber → potentiel CLOUD Act-eksponering selv med data i EU-region. DPO skal vurdere mod EU Data Act art. om tredjelandsadgang + GDPR-transfer (EU-US DPF dækker p.t., men kan ankes — jf. Schrems).
- **Frontend-note:** static assets på Netlify = lav risiko. Pas på hvis Netlify Edge Functions/logs rører persondata → så hellere EU-host.
- **Fallback hvis DPO stejler:** (a) self-hosted Supabase (open source) i EU/egen tenant, eller (b) flyt kun DB til France-infra/Azure EU, behold resten.

---

## Anbefaling (2026-06-04)

1. **Byg MVP på Supabase EU + Netlify** for hastighed — men kør **DPO-review parallelt nu**, ikke til sidst.
2. **Hold migrationsvejen åben:** Al DB-adgang bag `src/hooks/`. **Isolér auth + realtime bag tynde abstraktioner** — så er et skift væk fra Supabase billigt på alt undtagen de to ting (det er dér flyt-omkostningen ligger).
3. **Hvis DPO kræver fuld EU/ejer-kontrol:** Skift DB til **ejernes France-datacenter** (Postgres ved siden af PLAN-Oracle) — løser US-jurisdiktion helt og co-lokerer med PLAN. Pris: byg auth/realtime selv.

---

## Åbne punkter (afventer)

- [ ] **DPO/legal-review:** US-provider + CLOUD Act vs. EU Data Act tredjelandsadgang + GDPR-transfer-grundlag
- [ ] Kan ejernes France-datacenter hoste en managed Postgres til apps'ene?
- [ ] Bekræft Colas IdP (Entra ID?) + SAML/OIDC-føderation for formand-SSO
- [ ] Definér integrationslag PLAN (Oracle) ↔ app-DB (API/sync/CDC + retur-skrivning)
- [ ] Sikkerheds-baseline: RLS-policies per rolle, MFA, audit-log, pen-test-plan
- [ ] Frontend-hosting: er Netlify Edge Functions/logs i spil for persondata?

---

*Sidst opdateret: 2026-06-04 — afventer DPO. Opdatér ved beslutning.*
