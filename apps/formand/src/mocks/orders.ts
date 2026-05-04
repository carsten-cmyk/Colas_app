// Mock-data for ordrer
// TODO: Erstat med Supabase-kald når klar
import type { Order } from '@/types/order'

export const MOCK_ORDERS: Order[] = [
  {
    id: 'order-1',
    orderNumber: '1212343',
    customer: 'Uddannelsescenter Syd',
    projectName: 'Uddannelsescenter Syd — Parkeringsplads etape 1',
    district: 'Sydsjælland',
    foreman: 'OJ-14',
    contactPM: {
      name: 'Henrik Thor',
      role: 'Projektleder',
      phone: '+45 40 12 34 56',
    },
    comments: 'Adgang via port B. Husk sikkerhedsgodkendelse.',
    state: 'active',
    resources: [
      {
        plantNumber: 'A-0421',
        description: 'HAMM HD10 VT',
        type: 'equipment',
        vehicleType: 'Tromle',
      },
      {
        plantNumber: 'A-0887',
        description: 'VÖGELE 1900-3I',
        type: 'equipment',
        vehicleType: 'Udlægger',
      },
      {
        plantNumber: 'T-1204',
        description: '7-akslet sættevogn',
        type: 'asphalt-truck',
        vehicleType: 'Sættevogn',
        capacityTonsPerTrip: 25,
      },
    ],
    products: [
      {
        id: 'p1',
        activityName: 'GAB I at levere og udlægge, 80mm',
        recipeCode: '23001B',
        recipeName: 'GAB I',
        factory: {
          code: '29000',
          name: 'PROD A EAST KØGE PH',
          driveTimeMinutes: 36,
        },
        m2: 67,
        kgPerM2: 295,
        kgPerM3: 2450,
        tonsTotal: 200,
        startDate: '2026-05-05',
        endDate: '2026-05-06',
        state: 'active',
        dailyPlan: [
          { day: 1, date: '2026-05-05', tonsPlanned: 100, tonsDelivered: 87, cancelled: false },
          { day: 2, date: '2026-05-06', tonsPlanned: 100, cancelled: false },
        ],
      },
      {
        id: 'p2',
        activityName: 'SMA 11 at levere og udlægge, 40mm',
        recipeCode: '82101H',
        recipeName: 'SMA 11',
        factory: {
          code: '29000',
          name: 'PROD A EAST KØGE PH',
          driveTimeMinutes: 36,
        },
        m2: 4017,
        kgPerM2: 187,
        kgPerM3: 2380,
        tonsTotal: 752,
        startDate: '2026-05-07',
        endDate: '2026-05-09',
        state: 'pending',
        dailyPlan: [
          { day: 1, date: '2026-05-07', tonsPlanned: 250, cancelled: false },
          { day: 2, date: '2026-05-08', tonsPlanned: 250, cancelled: false },
          { day: 3, date: '2026-05-09', tonsPlanned: 252, cancelled: false },
        ],
      },
    ],
  },
]
