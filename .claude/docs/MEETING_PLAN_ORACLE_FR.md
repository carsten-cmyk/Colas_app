# Meeting prep — PLAN / Oracle (France) integration & hosting

**Audience:** Oracle/PLAN engineer (France datacenter)
**Purpose:** Two objectives — (1) understand how to integrate the new Colas transport apps with PLAN, and (2) assess whether the France datacenter can host our application data plane alongside PLAN.
**Status:** Apps are in prototype/mock phase; we are choosing the production database + hosting now.

> Please bring/prepare answers to the questions in sections 3–6 where possible. Sections marked 🔑 are decision-critical.

---

## 1. Context — what we are building

A suite of role-based apps that operate on top of the planning data that originates in **PLAN**:

| App | Users | Platform |
|---|---|---|
| Formand | Foremen (planning + execution) | Web |
| Vognmand | Hauliers (vehicle dispatch) | Web |
| Chauffør | Drivers | Mobile (iOS/Android) |
| Fabrik | Asphalt plant | Web (coming) |
| Kunde | Customers | Web (coming) |

**PLAN is the system of record for planning data.** Orders and crew packages ("holdpakker") originate in PLAN. Our apps read from PLAN, enrich the data operationally (dispatch, time registration, weighing tickets, site surveys), and write certain results back to PLAN.

**Design principle:** We will **not** build the apps directly on the PLAN Oracle database (wrong tool for a realtime, mobile-facing, role-secured workload). The apps get their **own operational database**, connected to PLAN through a well-defined **integration boundary**.

---

## 2. What we understand today (please confirm/correct)

- PLAN runs on **Oracle**, in the France datacenter, owner-controlled.
- PLAN sits as a **separate, standalone database** alongside the other French systems (not entangled with core enterprise systems).
- France = EU → satisfies our **EU data-residency requirement**.

---

## 3. 🔑 PLAN integration (needed regardless of where our DB lives)

1. **How does PLAN expose data to other systems today?**
   - REST/SOAP API? Database views? CDC/replication? Direct read access? File/batch export?
2. **What entities/fields can we read?** Specifically: orders, crew packages (people + equipment/materiel), customer, site/location, asphalt product/recipe, planned tonnage, dates.
3. **Write-back:** Can we write data back to PLAN, and how (API, staging table, other)? We need to write back at least:
   - Added people / equipment to a crew package
   - Site-survey ("forundersøgelse") results + extra work
   - Time-registration / settlement flags
4. **Join keys / identifiers:** Which keys link our records to PLAN (order number, etc.)?
5. **Data freshness:** Real-time, near-real-time (CDC), scheduled batch, or on-demand polling? Expected latency for changes to propagate?
6. **Authentication to the integration:** Service account, OAuth client credentials, mTLS, IP allow-listing?
7. **Volume:** Approx. orders/day, records, peak concurrency — so we size the integration.
8. **Environments:** Is there a PLAN test/staging environment we can integrate against before production?

---

## 4. 🔑 Hosting our data plane in the France datacenter (Option 2 feasibility)

> Our "data plane" = our application database + an API/BFF layer + the PLAN integration service.

1. **Can the datacenter host a managed PostgreSQL** instance alongside PLAN?
   - We require **PostgreSQL** (not Oracle) — our apps rely on row-level security, JSON, and realtime patterns that we build on Postgres.
   - If not Postgres: what managed DB options are available there?
2. **Compute:** Can it also host our API/BFF + integration service (containers / VMs / app platform)? What runtimes are supported?
3. **Operating model & iteration tempo** (decision-critical):
   - Who operates the DB/compute — your team or ours?
   - What is the SLA (uptime, support response)?
   - How fast can we deploy **schema changes and app deployments** — self-service/CI-CD, or ticket-based with lead time? *(This is the main trade-off vs. a managed cloud like Supabase.)*
4. **Network reachability:** How would our public web apps and mobile apps reach an API/DB hosted there? Public HTTPS endpoint + API gateway/DMZ? VPN? Reverse proxy?
5. **Backup / DR / monitoring:** What is provided as standard?

---

## 5. 🔑 Compliance & security

1. **EU data residency:** Confirm all data (PLAN + our app DB) stays in EU/France, owner-controlled (no non-EU jurisdiction exposure).
2. **Data ownership / processing:** Who is data controller/processor? Any sub-processors?
3. **Security baseline expected from your side:** encryption at rest/in transit, audit logging, network segmentation, penetration testing requirements before go-live.
4. **EU Data Act / GDPR:** Any existing compliance documentation for PLAN's environment we can build on?

---

## 6. SSO / authentication

1. **What identity provider does PLAN use for login?** (Entra ID / Azure AD / other?)
2. Can our apps **federate to the same IdP** (SAML 2.0 / OIDC) so foremen get **SSO** consistent with PLAN?
3. Role mapping: can the IdP supply role claims (foreman / haulier / driver / plant / customer)?

---

## 7. Scope boundary — what we are NOT asking for

- We are **not** asking to build the apps on the PLAN Oracle DB.
- We are **not** asking to modify PLAN's internal data model.
- We **are** asking for: a clean integration interface to PLAN, and (to evaluate) the option of co-locating our own Postgres-based data plane in the same EU datacenter.

---

## 8. Decision this informs

| Option | Where data plane lives | Trade-off |
|---|---|---|
| **A. France datacenter** (this meeting) | Same place as PLAN | Strongest compliance + cleanest integration; depends on Postgres availability + iteration tempo |
| **B. Supabase EU** | EU cloud (different provider) | Fastest to build; US-incorporated provider → needs DPO sign-off |

Front-end web hosting is decoupled (static SPAs, no personal data on the host) and not part of this decision.

---

*Prepared 2026-06-04. Companion doc: `HOSTING_OG_DATABASE_VALG.md`.*
