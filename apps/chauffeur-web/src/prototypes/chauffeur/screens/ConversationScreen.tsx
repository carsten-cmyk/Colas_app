/**
 * PROTOTYPE — Samtale-skærm (inde i iPhone-rammen)
 * Chat-bobler, projekt-banner, send-input.
 */
import { useState, useRef, useEffect } from 'react'
import { ChevronLeft, Phone, Send } from 'lucide-react'
import type { Conversation, Message } from '@/types/messages'
import { SAFE_AREA, FS } from '@/styles/spacing'

export interface ConversationScreenProps {
  conversation: Conversation
  onBack: () => void
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })
}

export function ConversationScreen({ conversation, onBack }: ConversationScreenProps) {
  const [messages, setMessages] = useState<Message[]>(conversation.messages)
  const [input, setInput] = useState('')
  const listRef = useRef<HTMLDivElement>(null)
  const other = conversation.participants[0]

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages])

  function handleSend() {
    const text = input.trim()
    if (!text) return
    const newMsg: Message = {
      id: `m${Date.now()}`,
      conversationId: conversation.id,
      senderId: 'me',
      content: text,
      timestamp: new Date(),
      isRead: true,
    }
    setMessages(prev => [...prev, newMsg])
    setInput('')
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleSend()
  }

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: '#F0F7FA',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 20,
      }}
    >
      {/* Header */}
      <div
        style={{
          backgroundColor: '#0B3950',
          paddingTop: `calc(${SAFE_AREA.top} + 8px)`,
          paddingLeft: 8,
          paddingRight: 16,
          paddingBottom: 8,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <button
          onClick={onBack}
          aria-label="Tilbage"
          style={{
            width: 44,
            height: 44,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <ChevronLeft size={26} color="#FFFFFF" />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
          {other.avatarUrl ? (
            <img
              src={other.avatarUrl}
              alt={other.name}
              style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
            />
          ) : (
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                backgroundColor: '#A0C7D7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                fontFamily: 'Inter, sans-serif',
                fontWeight: 700,
                fontSize: FS.sm,
                color: '#0E4764',
              }}
            >
              {other.name[0]}
            </div>
          )}
          <div>
            <p
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 600,
                fontSize: FS.sm,
                color: '#FFFFFF',
                margin: 0,
              }}
            >
              {other.name}
            </p>
            <p
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: FS.xs,
                color: '#A0C7D7',
                margin: 0,
                textTransform: 'capitalize' as const,
              }}
            >
              {other.role}
            </p>
          </div>
        </div>

        <a
          href={`tel:${other.phone.replace(/\s/g, '')}`}
          aria-label={`Ring til ${other.name}`}
          style={{
            width: 44,
            height: 44,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Phone size={22} color="#FFFFFF" />
        </a>
      </div>

      {/* Project banner */}
      {conversation.project && (
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderBottom: '1px solid #EDEDED',
            paddingLeft: 16,
            paddingRight: 16,
            paddingTop: 8,
            paddingBottom: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: FS.xs,
              fontWeight: 600,
              color: '#0E4764',
            }}
          >
            #{conversation.project.orderNumber}
          </span>
          <span
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: FS.xs,
              color: '#717182',
            }}
          >
            {conversation.project.name}
          </span>
        </div>
      )}

      {/* Messages */}
      <div
        ref={listRef}
        className="scrollbar-hide"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {messages.map(msg => {
          const isSent = msg.senderId === 'me'
          return (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: isSent ? 'flex-end' : 'flex-start',
              }}
            >
              <div
                style={{
                  maxWidth: '80%',
                  backgroundColor: isSent ? '#0E4764' : '#FFFFFF',
                  borderRadius: isSent ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  padding: '10px 14px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                }}
              >
                <p
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: FS.sm,
                    color: isSent ? '#FFFFFF' : '#1D1D1D',
                    margin: 0,
                    lineHeight: 1.45,
                  }}
                >
                  {msg.content}
                </p>
              </div>
              <p
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: FS.xxs,
                  color: '#717182',
                  margin: '3px 4px 0',
                }}
              >
                {formatTime(msg.timestamp)}
              </p>
            </div>
          )
        })}
      </div>

      {/* Input */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderTop: '1px solid #EDEDED',
          padding: '10px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Skriv en besked..."
          style={{
            flex: 1,
            height: 40,
            backgroundColor: '#F5F5F5',
            borderRadius: 20,
            border: 'none',
            outline: 'none',
            paddingLeft: 16,
            paddingRight: 16,
            fontFamily: 'Inter, sans-serif',
            fontSize: FS.sm,
            color: '#1D1D1D',
          }}
        />
        <button
          onClick={handleSend}
          aria-label="Send"
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            backgroundColor: input.trim() ? '#0E4764' : '#EDEDED',
            border: 'none',
            cursor: input.trim() ? 'pointer' : 'default',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'background-color 0.15s',
          }}
        >
          <Send size={18} color={input.trim() ? '#FFFFFF' : '#C4C4C4'} />
        </button>
      </div>
    </div>
  )
}
