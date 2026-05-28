---
section: sidste-laes-frigivelse
app: formand
tab: udfoersel
current_phase: prototype
owner: Carsten
created: 2026-05-27
last_updated: 2026-05-27
cross_app: [formand, vognmand, chauffeur]
---

# Section Manifest — "Sidste læs"-frigivelse af overflødige chauffører

> Cross-app feature: når formand allokerer sidste-læs, frigives overflødige biler automatisk efter vognmand-bekræftelse.
> Design LÅST 2026-05-27. Implementering AFVENTER.

---

## Status

| Phase | Status | Dato | Notes |
|---|---|---|---|
| Design | godkendt | 2026-05-27 | Hybrid (system → vognmand bekræfter) + reserve-buffer + early trigger |
| Prototype | ikke-startet | | Mock viser endepunktet (dag_afsluttet-biler), ikke selve flowet |
| Dev | ikke-startet | | |
| Test | ikke-startet | | |
| Live | ikke-startet | | |

**Cross-cutting blockers tjekket:**
- [x] Status-vokabular låst — `dag_afsluttet` tilføjet 2026-05-27
- [x] Datoformat låst
- [ ] Push-notifikations-infrastruktur (chauffør-app) — afventer
- [ ] Supabase-tabel `frigivelses_forslag` — design ikke skrevet endnu

---

## Design-reference

- **FUNCTIONAL_FLOWS.md:** Flow 1, Variant "Sidste læs"-frigivelse (linje ~165-225)
- **STATUS_VOKABULAR.md:** §2 `VejeseddelStatus` med `dag_afsluttet` enum-værdi
- **Prototype (delvis):** `apps/formand/src/mocks/vejesedler.ts` — v-006, v-007 + v-020 viser endepunktet visuelt

---

## Komponent-scope

| Komponent | App | Rolle | Status | SPEC | Handoff |
|---|---|---|---|---|---|
| `useSidsteLaesDetection` | formand | Hook | not-started | TBD | TBD |
| `FrigivelsesModal` | vognmand | Presenter | not-started | TBD | TBD |
| `useFrigivelsesForslag` | vognmand | Hook | not-started | TBD | TBD |
| `DagAfsluttetBanner` | chauffeur | Presenter | not-started | TBD | TBD |
| Push-notifikation | chauffeur | Infrastruktur | not-started | — | — |
| `frigivelses_forslag` (Supabase) | shared | DB | not-started | — | — |

---

## Build-order

```
Round 1 (foundation — parallel):
  - shared/types/sidsteLaesFrigivelse.ts  (FrigivelsesForslag-type)
  - Supabase migration: frigivelses_forslag-tabel
  - apps/formand/src/hooks/useSidsteLaesDetection.ts (trigger-logik)

Round 2 (vognmand-UI):
  - apps/vognmand/src/hooks/useFrigivelsesForslag.ts
  - apps/vognmand/src/components/ui/FrigivelsesModal.tsx

Round 3 (chauffør-UI + push):
  - apps/chauffeur/src/components/DagAfsluttetBanner.tsx
  - Push-notifikations-integration (FCM eller anden)

Round 4 (formand-visning):
  - Vejesedler-row får live status-skift når dag_afsluttet trigger
```

---

## Cross-section dependencies

| Type | Sektion | Relation |
|---|---|---|
| reads-from | `vejesedler` | Læser `er_sidste_laes`-flag + `bil_kapacitet` for sum-tjek |
| writes-to | `vejesedler` | Skifter `VejeseddelStatus` → `dag_afsluttet` på frigivne biler |
| writes-to | `vognmand-disponering` | Markerer biler som "Dag afsluttet" i vognmand-UI |
| writes-to | `chauffeur-tasks` | Status-skift + push-notifikation til chauffør |
| blocks | — | Ingen sektioner blokeres af denne |

---

## Åbne spørgsmål (til implementering)

1. **Allerede-på-vej-til-fabrik chauffør** — vender om, parkerer eller kører videre? UX-detalje
2. **Push fejler** — fallback til SMS? Eller "ved næste app-åbning"?
3. **Reserve-bil-valg** — algoritme: sidste i kø (default) vs. tættest-på-fabrik vs. chauffør-præference
4. **Afvisnings-konsekvens** — hvis vognmand afviser frigivelse → skal advarsel triggers hvis sidste-læs senere fejler?
5. **Push-infrastruktur** — FCM (Firebase) eller anden? Skal afklares før chauffør-side bygges
6. **Tidsregistrering** — chauffør får løn frem til "afmelding modtaget"-tidspunkt — hvordan logges det?

---

## Roller der bruger sektionen

| Rolle | Adgang | Notes |
|---|---|---|
| Formand | trigger (passiv) | Hans `er_sidste_laes`-allokering starter flowet |
| Vognmand | bekræft | Modtager forslag, godkender frigivelse |
| Chauffør | modtager | Får push + status-skift, kører hjem |
| Fabrik | — | Ikke involveret |

---

## Næste skridt

Når Carsten er klar til at bygge:
1. Kør `/interview sidste-laes-frigivelse formand` (interviewer scoper, drafter contract)
2. Carsten signerer contract → FROZEN
3. `/develop-screen` → architect planlægger build-rounds
4. Build per round som vanligt

---

## Notes

Design LÅST 2026-05-27 via AskUserQuestion-svar:
- Trigger-ejer: Hybrid (system foreslår, vognmand bekræfter)
- Trigger-tidspunkt: Når sidste-læs er disponeret (early signal)
- Reserve-buffer: Ja (hold 1 bil indtil sidste-læs er udlagt)

Visualisering i mock-prototypen (formand) viser ENDEPUNKTET — selve flow-mekanikken er ikke bygget.
