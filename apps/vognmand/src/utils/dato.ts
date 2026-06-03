/**
 * Dato-formattering til vognmand-appen.
 * Projektreglen: ALLE fulde datoer i UI vises som dansk lang-format, fx "17. marts 2026".
 * ISO-format (YYYY-MM-DD) bruges KUN til intern storage og sammenligning.
 * TODO: Erstat med Supabase når klar — evt. del med shared/utils
 */

const MAANEDER = [
  'januar', 'februar', 'marts', 'april', 'maj', 'juni',
  'juli', 'august', 'september', 'oktober', 'november', 'december',
]

/**
 * Formaterer en ISO-datostreng til dansk lang-format.
 * @example formatDatoLang('2026-03-17') → '17. marts 2026'
 */
export function formatDatoLang(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  return `${d.getDate()}. ${MAANEDER[d.getMonth()]} ${d.getFullYear()}`
}

/**
 * Formaterer en ISO-datostreng til dansk lang-format med kort ugedag.
 * @example formatDatoMedUgedag('2026-03-17') → 'tirs 17. marts 2026'
 */
export function formatDatoMedUgedag(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  const ugedage = ['søn', 'man', 'tirs', 'ons', 'tors', 'fre', 'lør']
  return `${ugedage[d.getDay()]} ${d.getDate()}. ${MAANEDER[d.getMonth()]} ${d.getFullYear()}`
}
