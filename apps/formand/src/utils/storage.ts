/**
 * Versioneret session-storage for formand.
 *
 * Formand bruger sessionStorage til auth (nulstilles når fanen lukkes), så
 * stale-state-risikoen er mindre end ved localStorage — men vi spejler
 * chauffeur-web's mønster for konsistens: bump STORAGE_VERSION ved hver
 * brydende ændring af gemt state, og `migrateStorage()` (kaldt ÉN gang ved
 * app-boot) rydder alle app-nøgler hvis den gemte version ikke matcher.
 * Så helbreder gammel state sig selv, uden incognito eller manuel oprydning.
 */

// Bump denne ved hver brydende ændring af session-storage-formatet.
const STORAGE_VERSION = '1'
const VERSION_KEY = 'formand_storage_version'

const AUTH_KEY = 'formand_auth'

// Alle app-ejede nøgler — ryddes ved version-mismatch.
const APP_KEYS = [AUTH_KEY] as const

/**
 * Kaldes ÉN gang ved app-boot (main.tsx) FØR render.
 * Rydder al app-state hvis den gemte storage-version er forældet.
 */
export function migrateStorage(): void {
  try {
    if (sessionStorage.getItem(VERSION_KEY) !== STORAGE_VERSION) {
      APP_KEYS.forEach(key => sessionStorage.removeItem(key))
      sessionStorage.setItem(VERSION_KEY, STORAGE_VERSION)
    }
  } catch {
    // sessionStorage utilgængelig (privat browsing-kvote e.l.) — ignorér.
  }
}

/** Gem auth-flag for denne fane-session. */
export function setAuth(): void {
  try {
    sessionStorage.setItem(AUTH_KEY, '1')
  } catch {
    // ignorér
  }
}

/** Ryd auth-flag. */
export function clearAuth(): void {
  try {
    sessionStorage.removeItem(AUTH_KEY)
  } catch {
    // ignorér
  }
}

/** True hvis der er et gyldigt auth-flag i denne fane-session. */
export function isAuthed(): boolean {
  try {
    return sessionStorage.getItem(AUTH_KEY) === '1'
  } catch {
    return false
  }
}
