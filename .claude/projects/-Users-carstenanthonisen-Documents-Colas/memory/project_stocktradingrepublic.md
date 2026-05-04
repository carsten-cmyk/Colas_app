---
name: StockTradingRepublic — nyt Python-projekt
description: Nyt stock intelligence agent projekt, klar til opstart
type: project
---

Nyt projekt klar til at blive oprettet. Afventer kun opstart-kommando.

**Why:** Bruger ønsker et produktionskvalitets Python trading signal agent projekt med samme robuste struktur som Colas formand-appen.

**Lokation:** `~/Documents/StockTradingRepublic/stock-intelligence/`

**Projektstruktur (oprettes præcist sådan):**
```
stock-intelligence/
├── docs/
├── tests/
├── signals/
├── engine/
├── storage/
├── broker/
├── main.py
├── config.py
├── scheduler.py
└── requirements.txt
```

**Aktier der monitoreres:** QS, XOM, NVDA, LLY, AKSO.OL

**Signalarkitektur (endelig):**
| Signal | Vægt | Implementation |
|---|---|---|
| Tekniske indikatorer (RSI, MACD, Volume, VIX) | 85% | yfinance / ta-lib |
| Reuters/Bloomberg headlines | 10% | Playwright scraper + Claude sentiment (med fallback til NewsAPI.org hvis scraping fejler) |
| Politiker-trades | 5% | Quiver Quantitative API (gratis tier, daglige opdateringer — acceptabelt) |

**Non-negotiables:**
- Ingen hardcoded værdier — alt i config.py
- Type hints på alle funktioner
- Hvert modul har en test i tests/
- Ingen business logic i main.py — kun orchestrering
- Alle external API calls har error handling og retries

**Docs der skal oprettes FØR kode:**
1. docs/PRD.md
2. docs/ARCHITECTURE.md
3. docs/STARTUP.md
4. docs/signals.md
5. docs/scoring.md
6. docs/strategy.md

**Næste skridt:** Opret mappestruktur + alle docs, bekræft, derefter implementer modul for modul startende med config.py og signals/

**How to apply:** Når bruger beder om at starte StockTradingRepublic — brug denne spec direkte uden at spørge igen om placering eller signalvægte.
