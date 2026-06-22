/**
 * Global nummerplade-formatering — single source of truth på tværs af alle apps.
 *
 * - Storage/fil (CSV, DB):  kompakt uppercase uden mellemrum, fx "BL77331"
 * - UI-visning:             grupperet "XX 99 999", fx "BL 77 331"
 *
 * Kanonisk regel: .claude/docs/core/PATTERNS.md § "Nummerplade-konvention".
 * Importeres via "@shared/utils/regnr" — byg aldrig en app-lokal kopi.
 *
 * Dansk nummerplade-format: 2 bogstaver + 5 cifre.
 * Specialformater (prøveplader, diplomater, historiske) returneres uændret.
 */

/** Regex for dansk standardnummerplade: præcis 2 bogstaver efterfulgt af 5 cifre. */
const REGNR_PATTERN = /^([A-Z]{2})(\d{5})$/

/**
 * Normaliserer en nummerplade til kompakt uppercase storage-format (ingen mellemrum).
 * Returnerer null hvis input ikke matcher dansk standardformat.
 */
export function toCompactRegnr(raw: string): string | null {
  if (!raw) return null
  const compact = raw.replace(/\s/g, '').toUpperCase()
  if (!REGNR_PATTERN.test(compact)) return null
  return compact
}

/**
 * Formaterer en nummerplade til UI-visning: "XX 99 999" (fx "BL 77 331").
 * Accepterer kompakt ("BL77331"), allerede grupperet ("BL 77 331") eller
 * lowercase-input ("ff40345") — alle normaliseres til korrekt visning.
 * Ukendt format returneres uændret (fail-safe — ingen data tabes i UI).
 *
 * @param raw - Rå nummerplade-streng fra data-lag eller bruger-input.
 */
export function formatRegnr(raw: string): string {
  if (!raw) return raw
  const compact = toCompactRegnr(raw)
  if (!compact) return raw
  const letters = compact.slice(0, 2)
  const digits = compact.slice(2)
  return `${letters} ${digits.slice(0, 2)} ${digits.slice(2)}`
}
