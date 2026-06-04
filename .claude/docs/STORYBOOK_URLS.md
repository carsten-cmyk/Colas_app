# Storybook URLs — Colas Transport Apps

> **Status**: LÅST 2026-06-04
> **Formål**: Kanonisk reference for Storybook-URLs per app. Bruges af `architect`-agenten i Epic + sub-issue-bodies så modtageren (builder/reviewer) hurtigt kan navigere til komponent-biblioteket.

---

## Lokale URLs (development)

| App | Port | URL | Command |
|---|---|---|---|
| Formand | 6007 | http://localhost:6007 | `npm run formand:storybook` |
| Vognmand | 6008 | http://localhost:6008 | `npm run vognmand:storybook` |
| Fabrik | 6009 | http://localhost:6009 | `npm run fabrik:storybook` |
| Chauffeur-web | 6010 | http://localhost:6010 | `npm run chauffeur-web:storybook` |

(Chauffeur RN-appen har ikke Storybook — den bruger native preview via Expo Go.)

---

## Produktion URLs (når deployed)

TBD — Storybook deploy ikke sat op endnu. Plan:
- **Option A** (anbefalet): Egne Netlify-sites per app, fx `formand-storybook.netlify.app`
- **Option B**: GitHub Pages med subpath per app, fx `colas.github.io/storybook/formand`
- **Option C**: Chromatic (Storybook-specifik hosting, gratis tier)

Når deploy er sat op, opdatér denne tabel.

---

## Brug i issue-bodies

Når architect-agenten opretter Epic eller sub-issues for en feature i `app:formand`, embed URL-blokken i issue-body:

```markdown
## Komponent-bibliotek

- **Storybook (live)**: TBD — sættes op via Netlify
- **Storybook (lokal)**: http://localhost:6007 — `npm run formand:storybook`
- **Komponent-registry**: `.claude/docs/COMPONENT_REGISTRY.md`
- **Design system**: `.claude/docs/core/DESIGN_SYSTEM.md`
- **UI patterns**: `.claude/docs/core/PATTERNS.md`
```

Tilsvarende for vognmand (6008), fabrik (6009), chauffeur-web (6010).

---

## Format for embedding (architect-agent skal bruge denne)

Givet `APP` (formand/vognmand/fabrik/chauffeur-web), embed altid:

```markdown
## Komponent-bibliotek

- **Storybook (lokal)**: http://localhost:{PORT} — `npm run {APP}:storybook`
- **Komponent-registry**: `.claude/docs/COMPONENT_REGISTRY.md`
- **Design system**: `.claude/docs/core/DESIGN_SYSTEM.md`
- **UI patterns**: `.claude/docs/core/PATTERNS.md` (formand-mønstre er source-of-truth)
```

Hvor `{PORT}` er:
- formand: 6007
- vognmand: 6008
- fabrik: 6009
- chauffeur-web: 6010

---

## TODO

- [ ] Sæt Storybook op på vognmand + chauffeur-web (mangler scaffold)
- [ ] Opsæt Netlify-deploy per app's Storybook
- [ ] Opdater issue-templates til at auto-link til Storybook (kræver template-variable-support)
- [ ] Tilføj Storybook-link til README per app
