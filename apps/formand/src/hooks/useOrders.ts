// TODO: Erstat mock-data med Supabase-kald når klar
import { useState, useEffect } from 'react'
import type { Order } from '@/types/order'
import { MOCK_ORDERS } from '@/mocks/orders'

export interface UseOrdersReturn {
  orders: Order[]
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useOrders(): UseOrdersReturn {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOrders = () => {
    setLoading(true)
    setError(null)
    // TODO: Erstat med Supabase-kald når klar
    // supabase.from('orders').select('*, products(*), resources(*)')
    try {
      setOrders(MOCK_ORDERS)
    } catch (err) {
      setError('Kunne ikke hente ordrer')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  return { orders, loading, error, refetch: fetchOrders }
}
