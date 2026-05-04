import { mockTask } from '@/mocks/tasks'
import { Task } from '@/types/task'

interface UseTaskResult {
  data: Task | null
  loading: boolean
  error: string | null
}

export function useTask(id: string): UseTaskResult {
  // TODO: Erstat med Supabase kald når integration er klar
  return {
    data: mockTask,
    loading: false,
    error: null
  }
}
