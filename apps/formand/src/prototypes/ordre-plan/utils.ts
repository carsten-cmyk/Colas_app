import type { DayPlan } from './types'

/**
 * Effektive tons = original planlagt + evt. ekstra-bestilling fra PLAN.
 * Bruges ALLE steder hvor produkt-tons summeres (Vejesedler, Dagsoverblik,
 * Afregning, Ordredetaljer/Mængde tons).
 */
export function getEffectiveTons(d: DayPlan): number {
  return d.tonsPlanned + (d.ekstraTons?.tons ?? 0)
}

/** HH:MM (24-timer) fra ISO-string — lokal helper til EkstraBestillingBox */
export function formatTime(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/**
 * Produkt-total tons inkl. evt. ekstra-bestillinger fra PLAN på produktets dage.
 * Bruges i Ordredetaljer/Mængde tons-cellen og lignende per-produkt aggregater.
 */
export function getEffectiveProductTotalTons(p: { tonsTotal: number; days?: { ekstraTons?: { tons: number } }[] }): number {
  const ekstra = (p.days ?? []).reduce((sum, d) => sum + (d.ekstraTons?.tons ?? 0), 0)
  return p.tonsTotal + ekstra
}

// Silence unused import warning (MockProduct er ikke brugt direkte i utils.ts — det er re-eksporteret via types.ts)

// Date-format helpers (formatLongDate, formatDateRange, formatWeekday) er
// centraliseret i `@/utils/date` — SINGLE SOURCE OF TRUTH for alle dato-visninger.
// Når dato-formatet skal ændres globalt — RET DER. Ingen inline-formatting i UI.

export const DA_MONTHS = ['januar', 'februar', 'marts', 'april', 'maj', 'juni', 'juli', 'august', 'september', 'oktober', 'november', 'december']

// Timestamp-formatter — "DD. måned · HH:MM" — til godkendt/kommentar/bekræftet-stempler.
// Lokal helper fordi den blander dato + tid (ikke en pure date-display).
export function formatTimestamp(d: Date | string): string {
  const dt = typeof d === 'string' ? new Date(d) : d
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${dt.getDate()}. ${DA_MONTHS[dt.getMonth()]} · ${pad(dt.getHours())}:${pad(dt.getMinutes())}`
}

// Frozen "today" for prototype — bruger mock-dato svarende til produkternes range
// TODO (produktion): Erstat med new Date() og tilpas INITIAL_PRODUCTS til rigtige datoer
export const TODAY = new Date('2026-03-17T00:00:00')

export function dateToString(d: Date): string {
  return d.toISOString().slice(0, 10)
}

