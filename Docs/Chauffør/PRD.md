# PRD — Opgave-detalje Screen
**App:** Colas Driver App  
**Screen:** Task Detail (`/tasks/[id]`)  
**Status:** Design færdigt, ikke bygget  
**Sidst opdateret:** 2026-02-20

---

## 1. Formål

Chaufføren skal hurtigt kunne se alle relevante oplysninger om en opgave — gods, lokationer, kontaktpersoner og eventuelle trafikadvarsler — og styre sin arbejdsstatus (start, pause, afslut).

---

## 2. Brugere

Primær bruger: Lastbilchauffør, ofte i bevægelse, kan have handsker på. Krav til store touch targets (min. 44x44px) og høj kontrast.

---

## 3. Screen States

### 3.1 Ikke startet
- Viser OrderMetrics + lokationer
- Knap: "Start opgave" (grå/inaktiv stil)
- Kontakter-tab skjult
- Alert-tab vises hvis trafikproblem er aktivt

### 3.2 Startet
- Knap: "Pause opgave" (gul) + "Afslut opgave" (rød)
- Kontakter-tab synlig
- GPS og tidsregistrering aktiv i baggrunden

### 3.3 Pause
- Gul overlay/panel vises over indhold
- Tekst: "Opgave på pause — GPS og tidsregistrering er stoppet"
- Lovpligtigt pauseinfo vises (30 min pr. 4 timers kørsel)
- Knap: "Start opgave" (genoptag) + "Afslut opgave"

### 3.4 Afsluttet
- TBD (ikke designet endnu)

---

## 4. Komponenter

### 4.1 TaskHeader
**Props:**
```ts
orderNumber: string
onClose: () => void
```
Viser ordrenummer øverst til venstre og X-knap til højre.

---

### 4.2 OrderMetrics
**Props:**
```ts
ton: number
produkt: string
runder: number
timer: number
```
2x2 grid med StatCard for hvert felt. Baggrund: hvid kort på lysegrå baggrund.

---

### 4.3 LocationCard
**Props:**
```ts
name: string
address: string
meetingTime?: string       // Vises kun på første stop
type: 'pickup' | 'delivery'
```
Hvidt kort med location-ikon, navn, adresse. Mødetid vises bold til højre hvis tilgængelig.

Mellem pickup og delivery: transport-ikon (lastbil) med pile op/ned.

---

### 4.4 ContactCard
**Props:**
```ts
name: string
role: string
phone: string
imageUrl?: string
```
Vertikal card med rundt foto øverst, navn, rolle og telefonnummer med telefon-ikon. Tryk på kortet kalder `Linking.openURL('tel:' + phone)`.

---

### 4.5 AlertBanner
**Props:**
```ts
message: string
type: 'traffic' | 'weather' | 'other'
```
Rød banner/boks der vises som default-tab hvis aktiv. Indhold er fri tekst fra backend.

---

### 4.6 TaskSwiper
Container der wrapper TaskInfoTab, TaskContactsTab og (betinget) TaskAlertTab i en horisontal scroll/swipe. Ingen synlige tab-indikatorer i nuværende design — ren swipe.

---

### 4.7 TaskActions
**Props:**
```ts
state: 'idle' | 'active' | 'paused'
onStart: () => void
onPause: () => void
onComplete: () => void
```
Fast i bunden af skærmen. Renders korrekte knapper baseret på state.

| State | Knapper |
|---|---|
| idle | "Start opgave" (grå) |
| active | "Pause opgave" (gul) + "Afslut opgave" (rød) |
| paused | "Start opgave" (grå) + "Afslut opgave" (rød) |

---

## 5. Data Model

```ts
// types/task.ts

export type TaskState = 'idle' | 'active' | 'paused' | 'completed'

export interface Location {
  name: string
  address: string
  meetingTime?: string       // Format: "HH.MM"
  type: 'pickup' | 'delivery'
}

export interface Contact {
  id: string
  name: string
  role: string
  phone: string
  imageUrl?: string
}

export interface Alert {
  id: string
  message: string
  type: 'traffic' | 'weather' | 'other'
  active: boolean
}

export interface Task {
  id: string
  orderNumber: string
  ton: number
  produkt: string
  runder: number
  timer: number
  locations: Location[]      // [0] = pickup, [1] = delivery
  contacts: Contact[]
  alerts: Alert[]
  state: TaskState
}
```

---

## 6. Navigation

- Åbnes fra Dashboard TaskCard (push navigation)
- Lukkes med X-knap (pop til Dashboard)
- Ingen modal — fuld skærm

---

## 7. Ikke i scope (denne version)

- Afslutnings-flow (kvittering, signatur, foto)
- Offline-håndtering
- Push notifikationer
- Kort/GPS-visning
- Redigering af opgave
- **TaskSheet animation** (slide-up + fade-in via react-native-reanimated) — kræver development build, ikke Expo Go. Implementeres når projektet skifter til `expo run:ios`.

---

## 8. Gode idéer — ikke implementeret (AnkommetFabrikScreen)

Forslag fra `ux-design-reviewer` (2026-05-13) som er parkeret til senere overvejelse. Skal ikke bygges nu, men beholdes så de ikke går tabt.

### 8.1 FlowStepper-komponent
Lille progressionsindikator øverst på skærmen — fx prikker eller cirkler der viser hvor langt chaufføren er i fabrik-flowet (`Ankomst → QR-scan → Bekræft → Udvejet`).

**Props:** `steps: string[]`, `currentStep: number`

**Hvorfor parkeret:** Chaufføren ser ét trin ad gangen — stepper vurderes som visuel støj på lille skærm. Genvurder hvis flere multi-trin-flows tilføjes.

### 8.2 ContextHeader-komponent
Persistent strip på alle sub-screens der viser fx "Ordre 1212343 — Køge Asfaltfabrik".

**Props:** `orderNumber: string`, `locationName: string`, `tons?: number`

**Hvorfor parkeret:** Ordrenummer er nu kun på `udvejet`-skærmen. Genvurder hvis brugertest viser at chauffører mister kontekst undervejs.

### 8.3 Haptisk feedback ved QR-scan
Kort vibration (`navigator.vibrate(200)`) når QR-koden er scannet — taktil bekræftelse uden at chaufføren skal kigge på skærmen.

**Hvorfor parkeret:** Kræver afklaring af browser-support i app-frame, samt at chaufføren rent faktisk holder telefonen i hånden ved scanning.

### 8.4 Slide-transition mellem sub-screens
Glidende overgang mellem `ankomst → qr-scan → bekraeft → udvejet` i stedet for hård state-switch.

**Hvorfor parkeret:** Æstetisk forbedring, ikke funktionel. Tages med når øvrig animations-strategi for app er besluttet.

### 8.5 Ordrenummer + tons på bekræftelsesskærmen
Vis last-data ved siden af silo/produkt på `bekraeft`-skærmen så chaufføren kan validere tons inden silo åbnes.

**Hvorfor parkeret:** Kræver afklaring af om tons skal komme fra ordre eller fra vægt-system før lastning.
