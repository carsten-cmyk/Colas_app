// TODO: Erstat med Supabase-kald når klar
// Kilde: recepter-tabel i PLAN via Supabase
// SELECT * FROM recepter WHERE kode = :receptKode
import type { Recept } from '@/types/order'
import { INITIAL_RECEPTER } from '@/mocks/recepter'

export interface UseReceptReturn {
  recept: Recept | undefined
  loading: false
  error: null
}

/**
 * Slår en recept op i INITIAL_RECEPTER på baggrund af receptkode.
 * Returnerer undefined hvis koden er null eller ikke kendes.
 *
 * @param receptKode - fx "82101H". null medfører undefined-retur.
 */
export function useRecept(receptKode: string | null): UseReceptReturn {
  // TODO: Erstat med Supabase når klar
  // const { data } = await supabase.from('recepter').select('*').eq('kode', receptKode).single()
  const recept = receptKode !== null ? INITIAL_RECEPTER[receptKode] : undefined

  return {
    recept,
    loading: false,
    error: null,
  }
}
