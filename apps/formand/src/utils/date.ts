/**
 * Date-format helpers — SINGLE SOURCE OF TRUTH for alle dato-visninger i formand-appen.
 *
 * Default-format: "16. marts 2026" (lang-format med fuld måned + år).
 * Med-weekday-variant: "Mandag · 16. marts 2026" — kun når ugedag tilfører kontekstuel værdi.
 *
 * Når formatet skal ændres globalt — RET HER. Ingen inline-formatting i komponenter.
 *
 * Se også: memory feedback_global_date_format.md
 */

const DA_MONTHS = [
  'januar', 'februar', 'marts', 'april', 'maj', 'juni',
  'juli', 'august', 'september', 'oktober', 'november', 'december',
] as const

const DA_WEEKDAYS = [
  'Søndag', 'Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag',
] as const

function parseDate(dateStr: string): Date {
  return new Date(dateStr + 'T00:00:00')
}

/** "Mandag", "Tirsdag" osv. */
export function formatWeekday(dateStr: string): string {
  return DA_WEEKDAYS[parseDate(dateStr).getDay()]
}

/** Default-format: "16. marts 2026" */
export function formatLongDate(dateStr: string): string {
  const d = parseDate(dateStr)
  return `${d.getDate()}. ${DA_MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

/** Kombineret: "Mandag · 16. marts 2026" — brug når ugedag tilfører værdi (fx Asfaltkørsel-liste) */
export function formatLongDateWithWeekday(dateStr: string): string {
  return `${formatWeekday(dateStr)} · ${formatLongDate(dateStr)}`
}

/**
 * Range-format med fuld måned + år konsekvent:
 * - Same-day: "16. marts 2026"
 * - Same-month: "16.–18. marts 2026"
 * - Cross-month, same-year: "28. februar–3. marts 2026"
 * - Cross-year: "28. december 2025–3. januar 2026"
 */
export function formatDateRange(startStr: string, endStr: string): string {
  const s = parseDate(startStr)
  const e = parseDate(endStr)
  if (startStr === endStr) {
    return formatLongDate(startStr)
  }
  const sameMonth = s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()
  if (sameMonth) {
    return `${s.getDate()}.–${e.getDate()}. ${DA_MONTHS[e.getMonth()]} ${e.getFullYear()}`
  }
  const sameYear = s.getFullYear() === e.getFullYear()
  if (sameYear) {
    return `${s.getDate()}. ${DA_MONTHS[s.getMonth()]}–${e.getDate()}. ${DA_MONTHS[e.getMonth()]} ${e.getFullYear()}`
  }
  return `${s.getDate()}. ${DA_MONTHS[s.getMonth()]} ${s.getFullYear()}–${e.getDate()}. ${DA_MONTHS[e.getMonth()]} ${e.getFullYear()}`
}
