// TODO: Erstat med Supabase når klar

export const BILTYPER = [
  '6 Aks · 32 tons',
  '7 Aks · 35 tons',
  'Forvogn · 18 tons',
  'Forvogn/Kærre · 32 tons',
  'Grab · 28 tons',
  'Sneglebil · 15 tons',
  'Snegl m. kærre · 30 tons',
  'Sideudlægger · 16 tons',
] as const

export interface Chauffør {
  id: string
  navn: string
  mobil: string
  aktiv: boolean
}

export interface Bil {
  reg: string
  biltype: string         // fuld streng, fx "6 Aks · 32 tons"
  type: '6-aks' | '4-aks' | 'andet'  // til filtrering
  tons: number
  chaufførId: string
  chaufførNavn: string    // cachet visningsnavn
  aktiv: boolean
}

export const MOCK_CHAUFFOERER: Chauffør[] = [
  { id: 'c1', navn: 'Lars Pedersen',    mobil: '+4520304050', aktiv: true },
  { id: 'c2', navn: 'Brian Nielsen',    mobil: '+4520304051', aktiv: true },
  { id: 'c3', navn: 'Mads Christensen', mobil: '+4520304052', aktiv: true },
  { id: 'c4', navn: 'Jens Andersen',    mobil: '+4520304053', aktiv: true },
  { id: 'c5', navn: 'Søren Hansen',     mobil: '+4520304054', aktiv: true },
  { id: 'c6', navn: 'Peter Madsen',     mobil: '+4520304055', aktiv: true },
]

export const MOCK_BILER: Bil[] = [
  { reg: 'XE32114', biltype: '6 Aks · 32 tons',     type: '6-aks', tons: 32, chaufførId: 'c1', chaufførNavn: 'Lars Pedersen',    aktiv: true },
  { reg: 'AB54231', biltype: '6 Aks · 32 tons',     type: '6-aks', tons: 30, chaufførId: 'c2', chaufførNavn: 'Brian Nielsen',    aktiv: true },
  { reg: 'CV98012', biltype: 'Grab · 28 tons',       type: 'andet', tons: 28, chaufførId: 'c3', chaufførNavn: 'Mads Christensen', aktiv: true },
  { reg: 'TH11233', biltype: '7 Aks · 35 tons',     type: '6-aks', tons: 35, chaufførId: 'c4', chaufførNavn: 'Jens Andersen',    aktiv: true },
  { reg: 'MO99821', biltype: '6 Aks · 32 tons',     type: '6-aks', tons: 32, chaufførId: 'c5', chaufførNavn: 'Søren Hansen',     aktiv: true },
  { reg: 'KA45567', biltype: 'Forvogn · 18 tons',   type: '4-aks', tons: 18, chaufførId: 'c6', chaufførNavn: 'Peter Madsen',     aktiv: true },
  { reg: 'BL77331', biltype: 'Blokvogn',            type: 'andet', tons: 0,  chaufførId: 'c1', chaufførNavn: 'Lars Pedersen',    aktiv: true },
]
