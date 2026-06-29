---
section: ordre-plan
component: TransportberegnerScreen (shell-nav extension)
spec: Docs/Formand/SPEC_OrdrePlan_ShellRefactor.md + Docs/Formand/SPEC_TopBar_NavSlot.md
builder_session: 2026-06-29-1200
builder_model: claude-sonnet-4-6
status: ready-for-review
review_rounds: 0
---

# Handoff — TransportberegnerScreen shell-nav extension

> Mekanisk udvidelse af den allerede godkendte shell-nav-pattern til TransportberegnerScreen.
> Ingen ny komponent — kun navændring i eksisterende prototype-fil.

---

## Implemented

```yaml
accept_pass:
  - id: NAV-TB-001
    description: "BottomTabBar-import fjernet"
  - id: NAV-TB-002
    description: "type { TabName }-import fjernet"
  - id: NAV-TB-003
    description: "activeTab-state fjernet (useState<TabName>)"
  - id: NAV-TB-004
    description: "handleTabPress-funktion fjernet"
  - id: NAV-TB-005
    description: "<BottomTabBar>-render fjernet (linje 930)"
  - id: NAV-TB-006
    description: "TopBar udvidet med onLogoPress + nav-prop identisk med OrdrePlan-wiring"
  - id: NAV-TB-007
    description: "activeId udeladt (sub-værktøj — intet nav-mål aktivt)"
  - id: NAV-TB-008
    description: "paddingBottom: 110 (inline) erstattet med className='pb-lg' (token)"
  - id: NAV-TB-009
    description: "useNavigate + navigate allerede til stede — ingen ny import nødvendig"
```

---

## Not implemented

```yaml
accept_skip: []
```

Alle scope-punkter er implementeret.

---

## Assumptions

- `pb-lg` (32px) giver tilstrækkelig bund-luft nu da BottomTabBar er fjernet.
  Den tidligere `paddingBottom: 110` kompenserede for bjælkens ~56px + det sticky "Se simulering"-bånds ~54px.
  "Se simulering"-bånd er IKKE sticky/fixed — det er en inline-knap i dokumentflowet — så 32px er rigeligt.
- `navigate('/prototyper/dagsoversigt')` bruges til onLogoPress, konsistent med OrdrePlanScreen-wiring.
- Skærmen er et sub-værktøj åbnet fra OrdrePlanScreen, derfor `activeId` udeladt — ingen af de to nav-piller markeres som aktive.

---

## Known issues

- Prototype-filen indeholder præ-eksisterende token-violations (hardcodede hex-farver: `#2E9E65`, `#0E4764`, `#F04E4E` osv.) i selve indholdet. Disse er eksplicit OUT OF SCOPE for denne ændring (jf. opgavebeskrivelsen) og skal adresseres i en separat cleanup-opgave.

---

## Files changed

```
modified:
  - apps/formand/src/prototypes/transportberegner/TransportberegnerScreen.tsx
    # Fjernet: BottomTabBar-import, TabName-import, activeTab-state, handleTabPress-fn, <BottomTabBar>-render
    # Tilføjet: TopBar nav-prop + onLogoPress
    # Ændret: paddingBottom:110 → className="pb-lg"
```

---

## Prototype-fidelity

**Source:** `apps/formand/src/prototypes/transportberegner/TransportberegnerScreen.tsx` (prototype)

**Hvad blev KUN ændret:**
- Import-sektion (linje 11-13): `BottomTabBar` + `type { TabName }` fjernet
- State (linje 329): `activeTab`-state fjernet
- Function (linje 355-358): `handleTabPress` fjernet
- JSX TopBar (linje 404): udvidet med `onLogoPress` + `nav`-prop
- JSX main (linje 406): `style={{ paddingBottom: 110 }}` erstattet med `className="pb-lg"`
- JSX BottomTabBar (linje 930): render-linje fjernet

**Hvad er uberørt (hele skærmens indhold):**
- "← Tilbage"-knap og `handleBack`-funktion
- Dagsnavigation, dagfordeling, produkt-tabs
- Parametre-panel (2-kolonne layout)
- Resultat-kort
- Kørselsoversigt + simuleringsbånd
- Bekræft/Gem-knap
- Forlad-alert overlay

**Bevidste afvigelser fra prototype:**
- Ingen — ren mekanisk navændring

---

## API exports

Ingen ændring i eksporteret API. `TransportberegnerScreen` eksporteres uændret som named export.

---

## Tokens / patterns brugt

Nye/ændrede klasser:
- `pb-lg` — token for 32px bund-padding (erstatter hardkodet `paddingBottom: 110`)
- TopBar `nav`-prop: identiske Tailwind-klasser som OrdrePlanScreen (ingen nye klasser)

Præ-eksisterende token-violations i indholdet er IKKE berørt (separat cleanup-scope).

---

## Tests skrevet

Ingen tests kræves — prototype-fil, mekanisk navændring.

---

## Ready-for-next-step

- [x] Typecheck pass: `npm run formand:typecheck` — 0 fejl
- [x] Ingen nye lint-fejl (kun præ-eksisterende jsx-a11y)
- [x] Handoff udfyldt (denne fil)
- [x] Klar til reviewer

---

## Builder sign-off

```yaml
builder_signoff:
  builder_agent: claude-sonnet-4-6
  signed_at: "2026-06-29 12:00"
  acceptkriterier_implementeret: "9 af 9 (NAV-TB-001..009)"
  acceptkriterier_skipped: 0
  prototype_kopieret_1_til_1: true
  bevidste_afvigelser_count: 0
  manuel_testning_udfoert:
    - "Verificeret med grep: activeTab bruges KUN i useState + BottomTabBar-render — sikkert at fjerne"
    - "Verificeret med grep: handleTabPress bruges KUN i BottomTabBar-render — sikkert at fjerne"
    - "Verificeret: Se simulering-bånd er inline i dokumentflow (ikke sticky) — pb-lg er tilstrækkeligt"
    - "TypeScript typecheck: 0 nye fejl efter alle ændringer"
  selv_lint_typecheck: passed
  saerlig_opmaerksomhed_bedes_paa:
    - "pb-lg (32px) vs tidligere 110px — reviewer bør bekræfte at bunden af skærmen ikke føles kneben"
    - "onLogoPress navigerer til /prototyper/dagsoversigt — konsistent med OrdrePlanScreen, men reviewer bør bekræfte det er det ønskede mål"
  signatur: "Jeg står inde for at koden implementerer SPEC + handoff præcis som dokumenteret ovenfor"
```
