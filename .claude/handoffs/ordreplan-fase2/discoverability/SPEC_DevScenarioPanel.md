# SPEC — `DevScenarioPanel.tsx` (dev-only scenarie-vælger)

> **Round 2** · NY fil: `apps/formand/src/prototypes/ordre-plan/components/DevScenarioPanel.tsx`
> **Type:** ui (prototype-chrome, dev-only) · ingen tests/stories.

## Hvad komponenten gør (én sætning)

Et flydende, tydeligt dev-mærket panel (nederst-venstre) hvor man hopper direkte til Spor A/B/C uden at kende den "magiske" URL-param — sætter `?scenarie=X` og remounter skærmen.

## Punkt 3-svar: entry point + UI-valg

- **Primært entry point = `?scenarie=A|B|C` URL-param** (matcher eksisterende `?samleordreId`/`?date`-mønster; bookmarkable + deeplinkbar).
- **Sekundært = dette dev-panel** som affordance så man ikke skal kende param'en. Panelet *skriver* bare param'en og navigerer.

### Valg: flydende panel frem for TopBar-dropdown
Begrundelse (noteret her, ikke et åbent spørgsmål): TopBar er produktions-chrome og deles på tværs af alle 4 skærme via `@/components/layout/TopBar` — at injicere en scenarie-dropdown der ville (a) forurene produktions-komponenten og (b) risikere at blive forvekslet med rigtig nav. Et selvstændigt flydende panel holder dev-laget 100% adskilt og kan fjernes i ét greb ved /upgrade-prototype.

## Props

```ts
export interface DevScenarioPanelProps {
  /** Aktivt scenarie-id (fra useScenario) */
  activeId: ScenarioId
  /** True hvis valgt via eksplicit param — styrer "default"-hint */
  wasExplicit: boolean
  /** Kaldes når bruger vælger et spor — wiring sætter ?scenarie + remounter */
  onSelect: (id: ScenarioId) => void
}
```

`SCENARIOS` importeres direkte for label/beskrivelse (knapperne genereres fra registry → nye spor dukker automatisk op).

## Visuelle states

- **Collapsed (default):** lille pille nederst-venstre med tekst `DEV · Scenarie {activeId}`. Klik → expand.
- **Expanded:** liste m. de 3 spor; aktivt spor markeret; hvert spor viser `label` + `beskrivelse`. Klik på et spor → `onSelect(id)` + auto-collapse.
- **Default-hint:** hvis `!wasExplicit`, vis lille tekst "(default — ingen ?scenarie i URL)".
- Ingen loading/error (ren synkron state).

## Punkt 3-svar: hvordan markeres den som dev-only (forveksles ikke med produktion)?

1. **Render-guard:** panelet rendres KUN i prototype-kontekst. Da hele `ordre-plan/` lever under `src/prototypes/` (aldrig importeret i produktion pr. CLAUDE.md), er placeringen i sig selv guarden. Ekstra `import.meta.env.DEV`-guard tilføjes så et evt. prod-build af prototype-hub'en aldrig viser panelet.
2. **Eksplicit `DEV`-mærkning:** pillen bærer altid teksten `DEV` + et advarsels-token-look (se tokens nedenfor) så det aldrig forveksles med formandens rigtige UI.
3. **Position:** `fixed bottom-md left-md z-50` — uden for det normale grid/content-flow.

## Tokens (obligatorisk — bevidst AFVIGENDE fra produktion)

Dette er dev-chrome, IKKE produktions-UI → den SKAL se anderledes ud, men stadig KUN via tokens (ingen hex/px). Forslag (semantisk "dev/advarsel"-look så det er umiskendeligt midlertidigt):

- Container: `fixed bottom-md left-md z-50 rounded-xl border border-warn-border bg-warn-bg shadow-md p-sm`
- DEV-label: `font-poppins font-semibold text-xs text-warn` (eller `text-text-primary` hvis `text-warn` mangler — vælg den der findes i `tailwind.config.ts`; ingen ny token).
- Spor-knapper: `min-h-touch` (touch-target-regel gælder selv i dev), `font-inter text-sm`, aktiv = `bg-surface`/inaktiv = transparent.
- Beskrivelse: `font-inter text-xxs text-text-muted`.

> Builder: verificér de præcise token-navne mod `apps/formand/tailwind.config.ts` (`warn`/`warn-bg`/`warn-border` findes — brugt i AsfaltbestillingSection). Ingen `text-[..]`/`bg-[#..]`.

## Visual Pattern Reference

Bevidst INGEN match til target-skærmens patterns: dette element er dev-chrome og SKAL visuelt skille sig ud fra produktions-UI (punkt 3-krav). Den eneste pattern-binding er token-brug (warn-palette + touch-target + font-tokens). Notér i handoff at afvigelsen er tilsigtet.

## Eksisterende komponenter brugt

Ingen — atomart panel. `lucide-react` ikon valgfrit (fx `FlaskConical`/`Wrench`) for dev-look; genbrug ikon-import-mønster fra andre sektioner.
