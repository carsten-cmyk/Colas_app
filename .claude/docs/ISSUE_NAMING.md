# Issue ID Naming Convention — Colas Transport Apps

> **Format**: `[{APP}{MODE}-{SECTION}-{NNN}] kort beskrivelse`
> **Status**: LÅST 2026-06-04
> **Kanonisk reference**: brug ID i alle commits, PR-titler, kommentarer, samtaler.

---

## Format-eksempler

| ID | Betydning |
|---|---|
| `FORMPL-ASB-001` | Formand Planlægning, Asfaltbestilling, issue #001 |
| `FORMUD-VS-042` | Formand Udførelse, Vejesedler, issue #042 |
| `FORMAF-VS-003` | Formand Afregning, Vejesedler, issue #003 |
| `VOGN-DISP-014` | Vognmand Disponering, issue #014 |
| `CHAF-LOGIN-001` | Chauffør Login, issue #001 |
| `FABR-PROD-007` | Fabrik Produktionsplan, issue #007 |
| `KUND-DAGO-002` | Kunde Dagsoverblik, issue #002 |
| `SHRD-DATEFMT-002` | Shared utility, datoformat, issue #002 |
| `DOCS-FUNCFLOW-019` | Docs, FUNCTIONAL_FLOWS, issue #019 |
| `INFRA-CI-003` | Infrastruktur, CI-pipeline, issue #003 |

---

## App-prefixes

| Kode | App / Område |
|---|---|
| `FORM` | Formand (cross-mode) |
| `FORMPL` | Formand Planlægning |
| `FORMUD` | Formand Udførelse |
| `FORMAF` | Formand Afregning |
| `VOGN` | Vognmand |
| `CHAF` | Chauffør |
| `FABR` | Fabrik |
| `KUND` | Kunde |
| `SHRD` | Cross-app (shared/, utils, types) |
| `DOCS` | Dokumentation (FUNCTIONAL_FLOWS, CONTEXT, README) |
| `INFRA` | Infrastruktur (CI, build, Netlify, dependencies) |

---

## Section-koder

| Kode | Sektion |
|---|---|
| `ASB` | Asfaltbestilling |
| `BB` | Bilbestilling |
| `AK` | Asfaltkørsel |
| `SLF` | Sidste-læs-frigivelse |
| `VS` | Vejesedler |
| `FU` | Forundersøgelse |
| `DAGO` | Dagsoverblik (Gantt) |
| `TR` | Transport |
| `ME` | Materiel |
| `DISP` | Disponering (vognmand) |
| `PROD` | Produktionsplan (fabrik) |
| `LOGIN` | Login + auth |
| `DATEFMT` | Datoformat-utility (shared) |
| `FUNCFLOW` | FUNCTIONAL_FLOWS.md |
| `CI` | CI-pipeline |

---

## Tre vigtige regler

1. **Sektion-lokal nummerering**: Hver section starter ved 001 og tæller op for sig. Auto-tildeles ved issue-creation via gh-CLI.
2. **Type er en label, ikke i ID**: `FORMPL-ASB-042` med label `type:bug` — IKKE `BUG-FORMPL-ASB-042`. Holder ID stabilt selvom kategori ændres.
3. **Fase er en label, ikke i ID**: `FABR-PROD-018` med label `fase:2`. Samme ID kan promoveres til Fase 1 uden ID-skift.

---

## Auto-tildeling via gh CLI

```bash
# Find næste ledige nummer for en section
PREFIX="FORMPL-ASB"
LAST=$(gh issue list --search "$PREFIX in:title" --state all --json title \
  --jq "[.[] | .title | capture(\"$PREFIX-(?<n>[0-9]+)\").n? // \"0\" | tonumber] | max // 0")
NEXT=$(printf "%03d" $((LAST + 1)))
ID="$PREFIX-$NEXT"

gh issue create \
  --title "[$ID] kort beskrivelse" \
  --label "app:formand,sektion:asfaltbestilling,fase:1,type:feature,prioritet:medium" \
  --body "..."
```

Arkitekt-agent kalder denne logik automatisk ved plan-godkendelse.

---

## Project board — auto-add er AKTIVERET

> **Status: LØST 2026-06-04.** Auto-add-workflow er aktiv på projektet med filter `is:issue` på `carsten-cmyk/Colas_app`. Issues tilføjes automatisk til "Colas Transport Apps"-boardet inden for få sekunder efter `gh issue create`.

**Ingen manuel `gh project item-add` nødvendig længere.**

### Verifikation efter oprettelse (recommend)

```bash
URL=$(gh issue create --title "[$ID] ..." --label "..." --body "..." | tail -n1)
sleep 3
gh issue view "$URL" --json projectItems --jq '[.projectItems[].title] | join(", ")'
# Forventet output: "Colas Transport Apps"
```

Hvis output er tomt → manuelt fallback:
```bash
gh project item-add 1 --owner carsten-cmyk --url "$URL"
```

### Historisk fejl-mønster

Mellem 2026-06-04 og auto-add-aktivering blev issues #9, #10, #11, #12, #14, #15, #16 oprettet uden at lande på board'et. De blev efterfølgende tilføjet manuelt. Dette mønster bør ikke gentage sig nu.

---

## Reference

- Label-strategi: GitHub Labels list (29 labels, 5 grupper)
- GitHub Project v2: "Colas Transport Apps" — project number `1`, ID `PVT_kwHODaUxEM4BZsHd`
- FUNCTIONAL_FLOWS.md: forretningskontekst per sektion
