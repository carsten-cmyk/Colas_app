// TODO: Erstat mock-data med Supabase realtime-subscription når klar
import { useState, useEffect } from 'react'
import type { DriverTask } from '@/types/driver'
import { MOCK_DRIVER_TASKS } from '@/mocks/drivers'

export interface UseDriverTasksReturn {
  tasks: DriverTask[]
  /** Chauffører der kører nu */
  activeTasks: DriverTask[]
  /** Chauffører der venter */
  idleTasks: DriverTask[]
  /** Chauffører der er færdige */
  completedTasks: DriverTask[]
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useDriverTasks(orderId: string): UseDriverTasksReturn {
  const [tasks, setTasks] = useState<DriverTask[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTasks = () => {
    setLoading(true)
    setError(null)
    // TODO: Erstat med Supabase realtime-subscription når klar
    // supabase.from('driver_tasks').select('*, driver(*)').eq('order_id', orderId)
    try {
      setTasks(MOCK_DRIVER_TASKS.filter(t => t.orderId === orderId))
    } catch (err) {
      setError('Kunne ikke hente chauffør-opgaver')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [orderId])

  return {
    tasks,
    activeTasks: tasks.filter(t => t.state === 'active'),
    idleTasks: tasks.filter(t => t.state === 'idle'),
    completedTasks: tasks.filter(t => t.state === 'completed'),
    loading,
    error,
    refetch: fetchTasks,
  }
}
