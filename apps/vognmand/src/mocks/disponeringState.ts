// TODO: Erstat med Supabase realtime
// Prototype-state: track hvilke ordrer vognmanden har godkendt i denne session

const _godkendte = new Set<string>()

export function markGodkendt(ordreId: string) {
  _godkendte.add(ordreId)
}

export function erGodkendt(ordreId: string): boolean {
  return _godkendte.has(ordreId)
}

export function antalÅbne(ordreIds: string[]): number {
  return ordreIds.filter(id => !_godkendte.has(id)).length
}
