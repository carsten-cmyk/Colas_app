/**
 * Global telefonnummer-formatering — single source of truth på tværs af alle apps.
 *
 * - Storage/fil (CSV, DB):  E.164 uden mellemrum, fx "+4512121212"
 * - UI-visning:             grupperet, fx "+45 12 12 12 12"
 *
 * Kanonisk regel: .claude/docs/DATA_FIELDS.md § "Telefonnummer-format".
 * Importeres via "@shared/utils/phone" — byg aldrig en app-lokal kopi.
 */

/** Dansk landekode (E.164). */
export const PHONE_COUNTRY_CODE = '+45'

/**
 * Normaliserer et råt telefonnummer til E.164 uden mellemrum (storage-format).
 * Returnerer null hvis input ikke kan tolkes som et dansk 8-cifret nummer.
 */
export function toE164(raw: string): string | null {
  const digits = raw.replace(/\D/g, '')
  let national = digits
  if (national.startsWith('0045')) national = national.slice(4)
  else if (national.length === 10 && national.startsWith('45')) national = national.slice(2)
  if (national.length !== 8) return null
  return `+45${national}`
}

/**
 * Formaterer et telefonnummer til UI-visning: "+45 12 12 12 12".
 * Accepterer E.164, 8-cifret nationalt eller allerede-grupperet input.
 * Ukendt format returneres uændret (fail-safe — ingen data tabes i UI).
 */
export function formatPhone(raw: string): string {
  if (!raw) return raw
  const e164 = toE164(raw)
  if (!e164) return raw
  const pairs = e164.slice(3).match(/.{1,2}/g) ?? [] // cifre efter "+45"
  return `${PHONE_COUNTRY_CODE} ${pairs.join(' ')}`
}
