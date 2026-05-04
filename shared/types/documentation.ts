// Typer for hændelsesdokumentation
// TODO: Erstat mock-brug med Supabase Storage når klar

export interface HændelsesDokumentation {
  id: string
  ordreId: string
  beskrivelse: string
  /** URLs eller base64 — erstattes med Supabase Storage URLs */
  billeder: string[]
  oprettetAf: string           // formandnavn
  tidspunkt: string            // ISO 8601
  // TODO: Erstat med Supabase Storage når klar
}
