// Mock-data for chauffører og opgaver
// TODO: Erstat med Supabase-kald når klar
import type { Driver, DriverTask } from '@/types/driver'

export const MOCK_DRIVERS: Driver[] = [
  { id: 'd1', name: 'Jesper Madsen', phone: '+45 51 23 45 67', vehicleType: 'Sættevogn' },
  { id: 'd2', name: 'Brian Olsen', phone: '+45 52 34 56 78', vehicleType: 'Sættevogn' },
  { id: 'd3', name: 'Torben Nielsen', phone: '+45 53 45 67 89', vehicleType: 'Båndtrailer' },
  { id: 'd4', name: 'Kim Pedersen', phone: '+45 54 56 78 90', vehicleType: 'Sættevogn' },
]

export const MOCK_DRIVER_TASKS: DriverTask[] = [
  {
    id: 'dt1',
    orderId: 'order-1',
    driver: MOCK_DRIVERS[0],
    state: 'active',
    tripsToday: 3,
    tonsDelivered: 72,
    lastUpdatedAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    startedAt: new Date().toISOString(),
  },
  {
    id: 'dt2',
    orderId: 'order-1',
    driver: MOCK_DRIVERS[1],
    state: 'active',
    tripsToday: 2,
    tonsDelivered: 48,
    lastUpdatedAt: new Date(Date.now() - 28 * 60 * 1000).toISOString(),
    startedAt: new Date().toISOString(),
  },
  {
    id: 'dt3',
    orderId: 'order-1',
    driver: MOCK_DRIVERS[2],
    state: 'idle',
    tripsToday: 0,
    tonsDelivered: 0,
  },
  {
    id: 'dt4',
    orderId: 'order-1',
    driver: MOCK_DRIVERS[3],
    state: 'completed',
    tripsToday: 4,
    tonsDelivered: 96,
    startedAt: new Date().toISOString(),
    completedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
  },
]
