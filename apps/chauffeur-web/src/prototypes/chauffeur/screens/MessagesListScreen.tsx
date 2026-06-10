/**
 * PROTOTYPE — Beskeder-liste (inde i iPhone-rammen)
 * Indbakke og arkiv med samtale-kort.
 */
import { useState } from 'react'
import { Edit, MessageCircle } from 'lucide-react'
import type { Conversation } from '@/types/messages'
import { SAFE_AREA, FS } from '@/styles/spacing'
import type { TabName } from '../components/BottomTabBar'
import { BottomTabBar } from '../components/BottomTabBar'

export interface MessagesListScreenProps {
  conversations: Conversation[]
  activeTab: TabName
  onTabPress: (tab: TabName) => void
  onOpenConversation: (conversation: Conversation) => void
}

type MessageTab = 'indbakke' | 'arkiv'

const ARCHIVE_DAYS = 30

function isArchived(date: Date): boolean {
  return Date.now() - date.getTime() > ARCHIVE_DAYS * 24 * 60 * 60 * 1000
}

function formatTime(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  if (diff < 60 * 60 * 1000) return `${Math.floor(diff / 60000)} min`
  if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / 3600000)} t`
  return `${Math.floor(diff / 86400000)} d`
}

export function MessagesListScreen({
  conversations,
  activeTab,
  onTabPress,
  onOpenConversation,
}: MessagesListScreenProps) {
  const [msgTab, setMsgTab] = useState<MessageTab>('indbakke')

  const inbox = conversations.filter(c => !isArchived(c.lastMessage.timestamp))
  const archive = conversations.filter(c => isArchived(c.lastMessage.timestamp))
  const shown = msgTab === 'indbakke' ? inbox : archive

  const unreadCount = inbox.filter(c => !c.lastMessage.isRead && c.lastMessage.senderId !== 'me').length

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: '#F8F8F8',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div
        style={{
          backgroundColor: '#0B3950',
          paddingTop: `calc(${SAFE_AREA.top} + 8px)`,
          paddingLeft: 16,
          paddingRight: 16,
          paddingBottom: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: 12,
          }}
        >
          <p
            style={{
              fontFamily: 'Poppins, sans-serif',
              fontWeight: 600,
              fontSize: FS.lg,
              color: '#FFFFFF',
              margin: 0,
            }}
          >
            Beskeder
          </p>
          <button
            aria-label="Ny besked"
            style={{
              width: 44,
              height: 44,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <Edit size={22} color="#FFFFFF" />
          </button>
        </div>

        {/* Tab switcher */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            gap: 0,
          }}
        >
          {(['indbakke', 'arkiv'] as MessageTab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setMsgTab(tab)}
              style={{
                flex: 1,
                height: 40,
                background: 'transparent',
                border: 'none',
                borderBottom: msgTab === tab ? '3px solid #FEEE32' : '3px solid transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <span
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: FS.sm,
                  fontWeight: msgTab === tab ? 600 : 400,
                  color: msgTab === tab ? '#FFFFFF' : 'rgba(255,255,255,0.55)',
                  textTransform: 'capitalize' as const,
                }}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </span>
              {tab === 'indbakke' && unreadCount > 0 && (
                <div
                  style={{
                    minWidth: 18,
                    height: 18,
                    backgroundColor: '#FEEE32',
                    borderRadius: 9,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 4px',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: FS.xxs,
                      fontWeight: 700,
                      color: '#1D1D1D',
                    }}
                  >
                    {unreadCount}
                  </span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Message list */}
      <div
        className="scrollbar-hide"
        style={{
          flex: 1,
          overflowY: 'auto',
          paddingBottom: 58,
        }}
      >
        {shown.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              paddingTop: 60,
            }}
          >
            <MessageCircle size={48} color="#C4C4C4" />
            <p
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: FS.sm,
                color: '#717182',
                margin: 0,
              }}
            >
              {msgTab === 'indbakke' ? 'Ingen beskeder' : 'Arkivet er tomt'}
            </p>
          </div>
        ) : (
          shown.map(conversation => {
            const other = conversation.participants[0]
            const isUnread = !conversation.lastMessage.isRead && conversation.lastMessage.senderId !== 'me'
            return (
              <button
                key={conversation.id}
                onClick={() => onOpenConversation(conversation)}
                style={{
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  padding: '14px 16px',
                  backgroundColor: '#FFFFFF',
                  borderBottom: '1px solid #EDEDED',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                {/* Avatar */}
                {other.avatarUrl ? (
                  <img
                    src={other.avatarUrl}
                    alt={other.name}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      objectFit: 'cover',
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      backgroundColor: '#A0C7D7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 700,
                      fontSize: FS.md,
                      color: '#0E4764',
                    }}
                  >
                    {other.name[0]}
                  </div>
                )}

                {/* Content */}
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
                    <p
                      style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: FS.sm,
                        fontWeight: isUnread ? 700 : 500,
                        color: '#1D1D1D',
                        margin: 0,
                      }}
                    >
                      {other.name}
                    </p>
                    <span
                      style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: FS.xxs,
                        color: '#717182',
                        flexShrink: 0,
                        marginLeft: 8,
                      }}
                    >
                      {formatTime(conversation.lastMessage.timestamp)}
                    </span>
                  </div>
                  {conversation.project && (
                    <p
                      style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: FS.xxs,
                        color: '#0E4764',
                        margin: '0 0 2px 0',
                        fontWeight: 500,
                      }}
                    >
                      #{conversation.project.orderNumber}
                    </p>
                  )}
                  <p
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: FS.sm,
                      color: isUnread ? '#1D1D1D' : '#717182',
                      fontWeight: isUnread ? 500 : 400,
                      margin: 0,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {conversation.lastMessage.senderId === 'me' ? 'Du: ' : ''}
                    {conversation.lastMessage.content}
                  </p>
                </div>

                {/* Unread dot */}
                {isUnread && (
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      backgroundColor: '#0E4764',
                      flexShrink: 0,
                    }}
                  />
                )}
              </button>
            )
          })
        )}
      </div>

      <BottomTabBar activeTab={activeTab} onTabPress={onTabPress} messageCount={unreadCount} />
    </div>
  )
}
