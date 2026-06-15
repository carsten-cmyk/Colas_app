/**
 * Versioneret localStorage for chauffeur-web.
 *
 * Problem dette løser: når auth-/state-modellen ændres, bliver gamle
 * localStorage-nøgler hængende og bryder den nye kode (fx en gammel
 * `chauffeur_auth` uden `expires` → `Date.now() > 0` → øjeblikkelig
 * logout-loop, "viser ikke app efter login"). Kun guest-mode med tom
 * storage undgik fejlen.
 *
 * Løsning: bump STORAGE_VERSION ved hver brydende ændring af gemt state.
 * `migrateStorage()` kaldes ÉN gang ved app-boot og rydder ALLE app-nøgler
 * hvis den gemte version ikke matcher — så gammel state helbreder sig selv,
 * uden at brugeren skal i incognito eller rydde browseren manuelt.
 */

// Bump denne ved hver brydende ændring af localStorage-formatet.
const STORAGE_VERSION = '1'
const VERSION_KEY = 'chauffeur_storage_version'

const AUTH_KEY = 'chauffeur_auth'
const AUTH_EXPIRES_KEY = 'chauffeur_auth_expires'

// Alle app-ejede nøgler — ryddes ved version-mismatch.
const APP_KEYS = [AUTH_KEY, AUTH_EXPIRES_KEY] as const

const AUTH_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 dage

/**
 * Kaldes ÉN gang ved app-boot (main.tsx) FØR render.
 * Rydder al app-state hvis den gemte storage-version er forældet.
 */
export function migrateStorage(): void {
  try {
    if (localStorage.getItem(VERSION_KEY) !== STORAGE_VERSION) {
      APP_KEYS.forEach(key => localStorage.removeItem(key))
      localStorage.setItem(VERSION_KEY, STORAGE_VERSION)
    }
  } catch {
    // localStorage utilgængelig (privat browsing-kvote e.l.) — ignorér.
  }
}

/** Gem auth-token med 30-dages udløb. */
export function setAuth(): void {
  try {
    localStorage.setItem(AUTH_KEY, '1')
    localStorage.setItem(AUTH_EXPIRES_KEY, String(Date.now() + AUTH_TTL_MS))
  } catch {
    // ignorér
  }
}

/** Ryd auth-token. */
export function clearAuth(): void {
  try {
    localStorage.removeItem(AUTH_KEY)
    localStorage.removeItem(AUTH_EXPIRES_KEY)
  } catch {
    // ignorér
  }
}

/** True hvis et gyldigt, ikke-udløbet token findes. */
export function isAuthed(): boolean {
  try {
    const authed = localStorage.getItem(AUTH_KEY) === '1'
    const expires = Number(localStorage.getItem(AUTH_EXPIRES_KEY) ?? 0)
    return authed && Date.now() < expires
  } catch {
    return false
  }
}
