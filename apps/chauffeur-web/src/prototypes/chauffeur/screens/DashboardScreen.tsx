/**
 * PROTOTYPE — Dashboard-skærm (inde i iPhone-rammen)
 * Start-fanen: Colas logo, billedgitter, opgaver-swiper.
 */
import type { Task } from '@/types/task'
import type { TabName } from '../components/BottomTabBar'
import { BottomTabBar } from '../components/BottomTabBar'

export interface DashboardScreenProps {
  tasks: Task[]
  messageCount: number
  activeTab: TabName
  onTabPress: (tab: TabName) => void
  onTaskPress: (taskId: string) => void
  onMessagesPress?: () => void
}

export function DashboardScreen({
  tasks,
  messageCount,
  activeTab,
  onTabPress,
  onTaskPress,
}: DashboardScreenProps) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: '#0E4764',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Scrollable content */}
      <div
        className="scrollbar-hide"
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          paddingBottom: 58, // tabbar height
        }}
      >
        {/* Dashboard Header — Colas logo */}
        <div
          style={{
            paddingTop: 67, // 59px Dynamic Island safe area + 8px
            paddingBottom: 48,
            paddingLeft: 16,
            paddingRight: 16,
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'flex-start',
          }}
        >
          <img
            src="/colas-logo.png"
            alt="Colas"
            style={{ height: 40, width: 110, objectFit: 'contain', objectPosition: 'right' }}
          />
        </div>

        {/* Image Grid */}
        <div
          style={{
            paddingLeft: 22,
            paddingRight: 22,
            display: 'flex',
            flexDirection: 'row',
            gap: 8,
            minWidth: 0,
          }}
        >
          {/* Left column: tall project image */}
          <div
            style={{
              flex: 1,
              borderRadius: 12,
              overflow: 'hidden',
              aspectRatio: '168 / 326',
              position: 'relative',
              minWidth: 0,
            }}
          >
            <img
              src="/venstre_aflang.png"
              alt=""
              style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', borderRadius: 12 }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 60%)',
              }}
            />
          </div>

          {/* Right column: small image + message widget */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              minWidth: 0,
            }}
          >
            <div
              style={{
                borderRadius: 12,
                overflow: 'hidden',
                aspectRatio: '165 / 183',
                position: 'relative',
                minWidth: 0,
              }}
            >
              <img
                src="/hoejre_lille.png"
                alt=""
                style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', borderRadius: 12 }}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 60%)',
                }}
              />
            </div>

            {/* Opgave-widget */}
            <div
              style={{
                flex: 1,
                minHeight: 44,
                backgroundColor: '#F0F7FA',
                borderRadius: 16,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '10px 12px',
                cursor: 'pointer',
              }}
            >
              <span
                style={{
                  fontFamily: 'Poppins, sans-serif',
                  fontWeight: 700,
                  fontSize: 28,
                  color: '#1D1D1D',
                  lineHeight: 1,
                  letterSpacing: '-0.5px',
                  textAlign: 'center',
                }}
              >
                {tasks.length}
              </span>
              <span
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 400,
                  fontSize: 11,
                  color: '#717182',
                  lineHeight: 1.3,
                  textAlign: 'center',
                }}
              >
                opgaver idag
              </span>
            </div>
          </div>
        </div>

        {/* Section label */}
        <div
          style={{
            paddingLeft: 22,
            paddingRight: 22,
            paddingTop: 16,
            paddingBottom: 8,
          }}
        >
          <span
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase' as const,
              color: 'rgba(255,255,255,0.55)',
            }}
          >
            Dagens opgaver
          </span>
        </div>

        {/* Task Swiper */}
        <div
          className="scrollbar-hide"
          style={{
            overflowX: 'auto',
            display: 'flex',
            flexDirection: 'row',
            gap: 7,
            paddingLeft: 22,
            paddingRight: 22,
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch',
            paddingBottom: 16,
          }}
        >
          {tasks.map((task) => {
            const delivery = task.locations[1]
            return (
              <button
                key={task.id}
                onClick={() => onTaskPress(task.id)}
                aria-label={`Opgave: ${delivery?.name ?? task.orderNumber}`}
                style={{
                  width: 349,
                  minHeight: 220,
                  height: 'auto',
                  flexShrink: 0,
                  scrollSnapAlign: 'start',
                  backgroundColor: '#F0F7FA',
                  borderRadius: 12,
                  paddingTop: 24,
                  paddingLeft: 24,
                  paddingRight: 24,
                  paddingBottom: 4,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: 10,
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 600,
                      fontSize: 10,
                      color: '#717182',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      margin: 0,
                    }}
                  >
                    Udførselssted
                  </span>
                  <p
                    style={{
                      fontFamily: 'Poppins, sans-serif',
                      fontWeight: 500,
                      fontSize: 18,
                      color: '#1D1D1D',
                      margin: 0,
                      lineHeight: 1.25,
                      display: '-webkit-box',
                      WebkitLineClamp: 1,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {delivery?.name ?? '—'}
                  </p>
                  {delivery?.address && (
                    <p
                      style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: 12,
                        color: '#717182',
                        margin: 0,
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {delivery.address}
                    </p>
                  )}
                </div>
                {(() => {
                  const formandContact = task.contacts.find((c) =>
                    c.role.toLowerCase().includes('formand')
                  ) ?? task.contacts[0]
                  return (
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: formandContact ? '1fr 1fr 2fr' : '1fr 1fr',
                        width: '100%',
                        gap: 0,
                      }}
                    >
                      {[
                        { label: 'Ton', value: String(task.ton) },
                        { label: 'Produkt', value: task.produkt ?? 'Asfalt' },
                      ].map((metric) => (
                        <div
                          key={metric.label}
                          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}
                        >
                          <p
                            style={{
                              fontFamily: 'Inter, sans-serif',
                              fontSize: 10,
                              color: '#717182',
                              margin: '0 0 2px 0',
                              fontWeight: 500,
                            }}
                          >
                            {metric.label}
                          </p>
                          <p
                            style={{
                              fontFamily: 'Inter, sans-serif',
                              fontSize: 14,
                              fontWeight: 700,
                              color: '#1D1D1D',
                              margin: 0,
                            }}
                          >
                            {metric.value}
                          </p>
                        </div>
                      ))}
                      {formandContact && (
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            textAlign: 'center',
                          }}
                        >
                          <p
                            style={{
                              fontFamily: 'Inter, sans-serif',
                              fontSize: 10,
                              color: '#717182',
                              margin: '0 0 2px 0',
                              fontWeight: 500,
                            }}
                          >
                            Formand
                          </p>
                          <p
                            style={{
                              fontFamily: 'Inter, sans-serif',
                              fontSize: 14,
                              fontWeight: 700,
                              color: '#1D1D1D',
                              margin: 0,
                            }}
                          >
                            {formandContact.name}
                          </p>
                          <a
                            href={`tel:${formandContact.phone}`}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              fontFamily: 'Inter, sans-serif',
                              fontSize: 11,
                              fontWeight: 500,
                              color: '#0E4764',
                              margin: 0,
                              textDecoration: 'none',
                            }}
                          >
                            {formandContact.phone}
                          </a>
                        </div>
                      )}
                    </div>
                  )
                })()}
                {task.formandNote && (
                  <>
                    <div style={{ width: '100%', height: 1, backgroundColor: 'rgba(0,0,0,0.08)' }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, width: '100%', paddingBottom: 8 }}>
                      <span
                        style={{
                          fontFamily: 'Inter, sans-serif',
                          fontSize: 10,
                          color: '#717182',
                          fontWeight: 500,
                        }}
                      >
                        Fra formand
                      </span>
                      <p
                        style={{
                          fontFamily: 'Inter, sans-serif',
                          fontSize: 12,
                          color: '#1D1D1D',
                          margin: 0,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          lineHeight: 1.4,
                        }}
                      >
                        {task.formandNote}
                      </p>
                    </div>
                  </>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Bottom tab bar */}
      <BottomTabBar
        activeTab={activeTab}
        onTabPress={onTabPress}
        messageCount={messageCount}
      />
    </div>
  )
}
