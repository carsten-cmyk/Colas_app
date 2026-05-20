# Offline-strategi — Formand og Chauffør

**Status:** Krav (tilføjet 2026-05-19). Skal indarbejdes i fase 1-fundamentet, ikke som efterfølgende lap.

---

## Hvorfor

Begge apps bruges i felten:
- **Formand** står på asfaltpladser, ofte i nybyggeri-områder, motorvejssträkninger, broer eller industrigrunde med dårlig dækning. Han indtaster temperaturer, faktisk udlagte tons og godkendelser — det MÅ ikke kunne gå tabt.
- **Chauffør** kører på tværs af landet og passerer tunneller, områder med svag dækning, og fabriksområder med Faraday-effekt fra metalhaller. Han markerer ankomst, læsning og afgang, og GPS-timestamps må ikke afhænge af forbindelse i øjeblikket.

Net-afhængighed gør appen ubrugelig i præcis de situationer hvor den skal bruges.

---

## Tilgang — fælles principper

### 1. Read-cache med tydelig "frisk vs. cached"-markør
Sidst-hentede data persisteres lokalt. UI viser tydeligt "Opdateret 14:23" eller "Offline — viser gemte data fra 12:05".

### 2. Write-queue der synkroniserer automatisk
Indtastninger gemmes lokalt med tidstempel. Når forbindelsen vender tilbage, sendes køen til Supabase i baggrunden. Brugeren får feedback: "Synkroniserer 3 handlinger..." → "Synkroniseret".

### 3. Optimistic UI
Når en formand trykker "Gem temperatur 168°C", vises det øjeblikkeligt som gemt — selvom det reelt ligger i den lokale kø. Hvis sync senere fejler, vises rollback med fejlbesked.

### 4. Konflikt-håndtering
Hvis serveren har nyere data ved sync (fx en anden bruger har overskrevet samme felt), vises konflikt-prompt: "Din version: 168°C. Server-version: 165°C. Hvilken vil du beholde?"

### 5. GPS uafhængig af net
Chauffør-app'ens timestamps logges lokalt med præcis tid og GPS-position — også uden net. Ankomstidspunktet er præcis det øjeblik chaufføren trykkede "Ankommet", ikke det øjeblik serveren modtog det.

---

## Teknisk approach (anbefaling)

### Web-apps (Formand)
- **Storage:** IndexedDB via biblioteket Dexie eller `idb` (lightweight wrapper)
- **Service Worker:** Cache shell + statiske assets så appen kan starte uden forbindelse
- **Sync-state:** React Query (TanStack Query) med `persistQueryClient` mod IndexedDB — håndterer både cache, retry og write-queue
- **Online-detektion:** `navigator.onLine` + heartbeat-ping til Supabase (browser-flag er upålidelig)

### React Native (Chauffør)
- **Storage:** `@react-native-async-storage/async-storage` for små data, `expo-sqlite` for queues og rækker
- **Sync-state:** React Query med custom persister mod SQLite
- **Online-detektion:** `@react-native-community/netinfo`
- **Background sync:** `expo-task-manager` til at synce når app er i baggrunden (forsigtig — iOS begrænser)

### Supabase
- **Conflict-strategi:** `last_write_wins` som default, men med `updated_at`-timestamp på alle tabeller så vi kan detektere konflikter inden vi skriver
- **Idempotens:** Hver write-handling har et lokalt `client_action_id` (UUID) så samme handling ikke gemmes to gange ved retry
- **Auth-refresh:** JWT skal kunne fornyes uden brugerinteraktion når forbindelsen er tilbage

---

## Hvad SKAL fungere offline

### Formand
| Funktion | Læs | Skriv |
|---|---|---|
| Dagens ordre | ✅ cached | – |
| Ordreoverblik | ✅ cached | – |
| Vejesedler-liste | ✅ cached | – |
| Temperatur-registrering | – | ✅ |
| Faktisk udlagt m² / tons | – | ✅ |
| Forundersøgelse-svar | ✅ | ✅ |
| Godkendelse/afregning | – | ✅ |
| Dagsoverblik-fremdrift | ✅ beregnet lokalt fra cache | – |

### Chauffør
| Funktion | Læs | Skriv |
|---|---|---|
| Dagens opgaver | ✅ cached morgen | – |
| Adresse + kontaktinfo | ✅ | – |
| Ankomst/afgang-markeringer | – | ✅ |
| GPS-timestamps | – | ✅ (lokalt logget) |
| Læsset/færdig-status | – | ✅ |
| Vejekort-scan (når implementeret) | – | ✅ |

---

## Hvad fungerer IKKE offline (acceptable begrænsninger)

- Push-notifikationer (kommer i køen og leveres når enheden er online)
- Login (skal være online for første login + token-refresh efter X dage)
- Live-opdateringer fra andre brugere (sker først ved næste sync)
- Detalje-billeder/dokumenter ikke set før (kun cached hvis tidligere åbnet)

---

## Test-strategi

Hver sektion der bygges i produktion skal verificeres med disse scenarier:

1. **Cold offline-start:** Slå flytilstand til, åbn app — virker startsiden og dagens data?
2. **Gå offline mid-flow:** Start en indtastning, slå net fra, gem — kommer beskeden om at sync er udskudt? Slå net til igen — synkroniseres det?
3. **Konflikt-test:** To brugere skriver til samme felt, den ene offline, den anden online — håndteres konflikten korrekt ved sync?
4. **Lang offline-periode:** 2 timer offline med 20+ writes — kø-håndtering, ingen tab af data?
5. **App-genstart med pending writes:** Force-kill app mens der er pending writes — overlever de en genstart?

Disse 5 tests SKAL køres for hver sektion i Definition of Done (`SECTION_KICKOFF_TEMPLATE.md` punkt 4).

---

## Reference

- Workflow: [`.claude/docs/WORKFLOW_PROTOTYPE_TIL_PRODUKTION.md`](../.claude/docs/WORKFLOW_PROTOTYPE_TIL_PRODUKTION.md)
- Section kickoff: [`.claude/docs/SECTION_KICKOFF_TEMPLATE.md`](../.claude/docs/SECTION_KICKOFF_TEMPLATE.md) — afsnit 4 "Realtime, offline, fejl"
