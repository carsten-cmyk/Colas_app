export type UserRole = 'projektleder' | 'formand' | 'fabrik' | 'chauffør';

export interface MessageUser {
  id: string;
  name: string;
  role: UserRole;
  phone: string;
  avatarUrl?: string;
}

export interface MessageProject {
  id: string;
  orderNumber: string;
  name: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
}

export interface Conversation {
  id: string;
  participants: MessageUser[];
  project?: MessageProject;
  messages: Message[];
  lastMessage: Message;
  createdAt: Date;
}
