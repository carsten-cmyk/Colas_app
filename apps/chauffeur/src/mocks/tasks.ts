import { Task } from '@/types/task'

export const mockTask: Task = {
  id: '1',
  orderNumber: '1212343',
  ton: 75,
  produkt: '82101H',
  runder: 3,
  timer: 4,
  locations: [
    {
      name: 'Køge Asfaltfabrik',
      address: 'Nordhavnsvej 9, 4600 Køge',
      meetingTime: '05.30',
      type: 'pickup'
    },
    {
      name: 'Uddannelsescenter Syd',
      address: 'Søvej 6 D, 4900 Nakskov',
      type: 'delivery'
    }
  ],
  contacts: [
    {
      id: '1',
      name: 'Henrik Thor',
      role: 'Projektleder',
      phone: '2399 1448',
      imageUrl: 'https://i.pravatar.cc/150?img=11'
    },
    {
      id: '2',
      name: 'Ole Jensen',
      role: 'Formand',
      phone: '2399 1443',
      imageUrl: 'https://i.pravatar.cc/150?img=53'
    },
  ],
  alerts: [
    {
      id: '1',
      message: 'Der er registreret en trafikulykke på ruten. Forvent forsinkelser og følg anvisninger fra vejmyndighed.',
      type: 'traffic',
      active: true
    },
    {
      id: '2',
      message: 'Dagens læs er klar på fabrikken. Husk at tjekke ind ved ankomst og meld dig til vognmanden.',
      type: 'other',
      active: true
    },
    {
      id: '3',
      message: 'Kørselsbemærkning: Særlig opmærksomhed ved vejarbejde på ruten. Kør forsigtigt og følg skilte.',
      type: 'other',
      active: true
    }
  ],
  state: 'active'
}

export const mockTask2: Task = {
  id: '2',
  orderNumber: '1212344',
  ton: 120,
  produkt: '94202A',
  runder: 5,
  timer: 6,
  locations: [
    {
      name: 'Asfaltfabrikken Køge Nord',
      address: 'Industrivej 14, 4600 Køge',
      meetingTime: '07.00',
      type: 'pickup'
    },
    {
      name: 'Motorvej E47, Sydmotorvejen',
      address: 'E47 afkørsel 28, 4800 Nykøbing F',
      type: 'delivery'
    }
  ],
  contacts: [],
  alerts: [],
  state: 'idle'
}

export const mockTask3: Task = {
  id: '3',
  orderNumber: '1212345',
  ton: 45,
  produkt: '71105B',
  runder: 2,
  timer: 3,
  locations: [
    {
      name: 'Næstved Asfaltfabrik',
      address: 'Fabriksvej 3, 4700 Næstved',
      meetingTime: '10.30',
      type: 'pickup'
    },
    {
      name: 'Ringsted Centrum',
      address: 'Torvet 1, 4100 Ringsted',
      type: 'delivery'
    }
  ],
  contacts: [],
  alerts: [],
  state: 'idle'
}

export const mockTasks: Task[] = [mockTask, mockTask2, mockTask3]
