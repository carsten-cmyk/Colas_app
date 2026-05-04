import { Conversation, Message, MessageProject, MessageUser } from '@/types/messages';

export const mockMessageUsers: MessageUser[] = [
  {
    id: '1',
    name: 'Henrik Thor',
    role: 'projektleder',
    phone: '2399 1448',
    avatarUrl: 'https://i.pravatar.cc/100?img=11',
  },
  {
    id: '2',
    name: 'Ole Jensen',
    role: 'formand',
    phone: '2399 1443',
    avatarUrl: 'https://i.pravatar.cc/100?img=53',
  },
  {
    id: '3',
    name: 'Fabrik Køge',
    role: 'fabrik',
    phone: '6020 1818',
    avatarUrl: 'https://i.pravatar.cc/100?img=32',
  },
];

export const mockMessageProjects: MessageProject[] = [
  { id: '1', orderNumber: '1212343', name: 'Køge Asfaltfabrik' },
  { id: '2', orderNumber: '1212344', name: 'Uddannelsescenter Syd' },
];

const now = new Date();
const hoursAgo = (h: number) => new Date(now.getTime() - h * 60 * 60 * 1000);
const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);

export const mockConversations: Conversation[] = [
  {
    id: '1',
    participants: [mockMessageUsers[0]],
    project: mockMessageProjects[0],
    messages: [
      {
        id: 'm1',
        conversationId: '1',
        senderId: '1',
        content: 'Husk at tjekke temperaturen på asfalten inden læsning.',
        timestamp: hoursAgo(1),
        isRead: false,
      },
      {
        id: 'm2',
        conversationId: '1',
        senderId: 'me',
        content: 'Forstået, jeg er på vej.',
        timestamp: hoursAgo(0.5),
        isRead: true,
      },
    ],
    lastMessage: {
      id: 'm2',
      conversationId: '1',
      senderId: 'me',
      content: 'Forstået, jeg er på vej.',
      timestamp: hoursAgo(0.5),
      isRead: true,
    },
    createdAt: daysAgo(1),
  },
  {
    id: '2',
    participants: [mockMessageUsers[1]],
    project: mockMessageProjects[0],
    messages: [
      {
        id: 'm3',
        conversationId: '2',
        senderId: '2',
        content: 'Der er lukket for indkørsel fra syd. Brug nordindgangen.',
        timestamp: hoursAgo(3),
        isRead: false,
      },
    ],
    lastMessage: {
      id: 'm3',
      conversationId: '2',
      senderId: '2',
      content: 'Der er lukket for indkørsel fra syd. Brug nordindgangen.',
      timestamp: hoursAgo(3),
      isRead: false,
    },
    createdAt: daysAgo(2),
  },
  {
    id: '3',
    participants: [mockMessageUsers[2]],
    project: mockMessageProjects[1],
    messages: [
      {
        id: 'm4',
        conversationId: '3',
        senderId: '3',
        content: 'Dagens læs er klar. Asfalt temp: 160°C.',
        timestamp: daysAgo(1),
        isRead: true,
      },
    ],
    lastMessage: {
      id: 'm4',
      conversationId: '3',
      senderId: '3',
      content: 'Dagens læs er klar. Asfalt temp: 160°C.',
      timestamp: daysAgo(1),
      isRead: true,
    },
    createdAt: daysAgo(3),
  },
  {
    id: '4',
    participants: [mockMessageUsers[0]],
    messages: [
      {
        id: 'm5',
        conversationId: '4',
        senderId: '1',
        content: 'God arbejdslyst i dag!',
        timestamp: daysAgo(35),
        isRead: true,
      },
    ],
    lastMessage: {
      id: 'm5',
      conversationId: '4',
      senderId: '1',
      content: 'God arbejdslyst i dag!',
      timestamp: daysAgo(35),
      isRead: true,
    },
    createdAt: daysAgo(35),
  },
];
