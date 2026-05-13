/**
 * PROTOTYPE — Opgave-detaljeskærm (bund-ark over dashboard)
 * Viser ordre-metrics, lokationer, info/kontaktkort og handlingsknapper.
 */
import { X, MapPin, ArrowDown, ArrowUp, Phone } from 'lucide-react'
import type { Task, TaskState } from '@/types/task'

export interface TaskDetailScreenProps {
  task: Task
  taskState: TaskState
  onClose: () => void
  onStart: () => void
  onPause: () => void
  onComplete: () => void
}

export function TaskDetailScreen({
  task,
  taskState,
  onClose,
  onStart,
  onPause,
  onComplete,
}: TaskDetailScreenProps) {
  const [pickup, delivery] = task.locations
  const infoAlerts = task.alerts.filter(a => a.type !== 'traffic')
  const dangerAlerts = task.alerts.filter(a => a.type === 'traffic')

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.45)',
        }}
      />

      {/* Sheet */}
      <div
        style={{
          position: 'relative',
          backgroundColor: '#F8F8F8',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          maxHeight: '85%',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideUp 0.3s ease',
        }}
      >
        {/* Handle */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            paddingTop: 10,
            paddingBottom: 4,
          }}
        >
          <div
            style={{
              width: 36,
              height: 4,
              backgroundColor: '#C4C4C4',
              borderRadius: 2,
            }}
          />
        </div>

        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingLeft: 20,
            paddingRight: 16,
            paddingBottom: 12,
          }}
        >
          <p
            style={{
              fontFamily: 'Poppins, sans-serif',
              fontWeight: 600,
              fontSize: 14,
              color: '#1D1D1D',
              margin: 0,
            }}
          >
            Ordrenummer {task.orderNumber}
          </p>
          <button
            onClick={onClose}
            aria-label="Luk"
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              backgroundColor: '#EDEDED',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={16} color="#1D1D1D" />
          </button>
        </div>

        {/* Scrollable body */}
        <div
          className="scrollbar-hide"
          style={{
            flex: 1,
            overflowY: 'auto',
            paddingLeft: 20,
            paddingRight: 20,
            paddingBottom: 8,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          {/* Order metrics */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 12,
              border: '1px solid #EDEDED',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              overflow: 'hidden',
            }}
          >
            {[
              { label: 'Ton', value: String(task.ton) },
              { label: 'Produkt', value: task.produkt },
              { label: 'Runder', value: String(task.runder) },
              { label: 'Timer', value: String(task.timer) },
            ].map((metric, i) => (
              <div
                key={metric.label}
                style={{
                  padding: '14px 13px',
                  borderRight: i % 2 === 0 ? '1px solid #EDEDED' : 'none',
                  borderBottom: i < 2 ? '1px solid #EDEDED' : 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                <p
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: 11,
                    color: '#717182',
                    margin: '0 0 2px 0',
                    textAlign: 'center',
                  }}
                >
                  {metric.label}
                </p>
                <p
                  style={{
                    fontFamily: 'Poppins, sans-serif',
                    fontWeight: 600,
                    fontSize: 22,
                    color: '#1D1D1D',
                    margin: 0,
                    lineHeight: 1.2,
                    textAlign: 'center',
                  }}
                >
                  {metric.value}
                </p>
              </div>
            ))}
          </div>

          {/* Locations */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* Pickup */}
            {pickup && (
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 12,
                  border: '1px solid #EDEDED',
                  padding: '14px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    backgroundColor: '#F0F7FA',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <MapPin size={16} color="#0E4764" />
                </div>
                <div style={{ flex: 1 }}>
                  <p
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase' as const,
                      color: '#717182',
                      margin: '0 0 2px 0',
                    }}
                  >
                    Afhenting
                  </p>
                  <p
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 600,
                      fontSize: 15,
                      color: '#1D1D1D',
                      margin: '0 0 2px 0',
                    }}
                  >
                    {pickup.name}
                  </p>
                  <p
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: 13,
                      color: '#717182',
                      margin: 0,
                    }}
                  >
                    {pickup.address}
                  </p>
                </div>
                {pickup.meetingTime && (
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p
                      style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: 11,
                        color: '#717182',
                        margin: '0 0 2px 0',
                      }}
                    >
                      Mødetid
                    </p>
                    <p
                      style={{
                        fontFamily: 'Poppins, sans-serif',
                        fontWeight: 600,
                        fontSize: 20,
                        color: '#1D1D1D',
                        margin: 0,
                      }}
                    >
                      {pickup.meetingTime}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Transport icon — runder frem og tilbage */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  backgroundColor: '#EDEDED',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 2,
                }}
              >
                <ArrowUp size={12} color="#717182" />
                <ArrowDown size={12} color="#717182" />
              </div>
            </div>

            {/* Delivery */}
            {delivery && (
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 12,
                  border: '1px solid #EDEDED',
                  padding: '14px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    backgroundColor: '#E7F4EE',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <MapPin size={16} color="#1F8A5B" />
                </div>
                <div style={{ flex: 1 }}>
                  <p
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase' as const,
                      color: '#717182',
                      margin: '0 0 2px 0',
                    }}
                  >
                    Udførselssted
                  </p>
                  <p
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 600,
                      fontSize: 15,
                      color: '#1D1D1D',
                      margin: '0 0 2px 0',
                    }}
                  >
                    {delivery.name}
                  </p>
                  <p
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: 13,
                      color: '#717182',
                      margin: 0,
                    }}
                  >
                    {delivery.address}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Info/contact/alert cards (horizontal swiper) */}
          {(infoAlerts.length > 0 || task.contacts.length > 0 || dangerAlerts.length > 0) && (
            <div
              className="scrollbar-hide"
              style={{
                display: 'flex',
                flexDirection: 'row',
                gap: 7,
                overflowX: 'auto',
                scrollSnapType: 'x mandatory',
                marginLeft: -20,
                marginRight: -20,
                paddingLeft: 20,
                paddingRight: 20,
              }}
            >
              {/* Info cards */}
              {infoAlerts.map(alert => (
                <div
                  key={alert.id}
                  style={{
                    width: 309,
                    height: 158,
                    flexShrink: 0,
                    scrollSnapAlign: 'start',
                    backgroundColor: '#FFFFFF',
                    borderRadius: 20,
                    border: '1px solid #EDEDED',
                    padding: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  <p
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase' as const,
                      color: '#717182',
                      margin: 0,
                    }}
                  >
                    Information
                  </p>
                  <p
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: 13,
                      color: '#1D1D1D',
                      margin: 0,
                      lineHeight: 1.5,
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 5,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {alert.message}
                  </p>
                </div>
              ))}

              {/* Contacts card */}
              {task.contacts.length > 0 && (
                <div
                  style={{
                    width: 309,
                    height: 158,
                    flexShrink: 0,
                    scrollSnapAlign: 'start',
                    backgroundColor: '#FFFFFF',
                    borderRadius: 20,
                    border: '1px solid #EDEDED',
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 16,
                    padding: '16px 24px',
                  }}
                >
                  {task.contacts.map((contact, i) => (
                    <div key={contact.id} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                      {i > 0 && (
                        <div
                          style={{
                            width: 1,
                            height: 80,
                            backgroundColor: '#EDEDED',
                            marginRight: 16,
                            flexShrink: 0,
                          }}
                        />
                      )}
                      <div
                        style={{
                          flex: 1,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        {contact.imageUrl ? (
                          <img
                            src={contact.imageUrl}
                            alt={contact.name}
                            style={{
                              width: 52,
                              height: 52,
                              borderRadius: '50%',
                              objectFit: 'cover',
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: 52,
                              height: 52,
                              borderRadius: '50%',
                              backgroundColor: '#A0C7D7',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontFamily: 'Inter, sans-serif',
                              fontWeight: 700,
                              fontSize: 18,
                              color: '#0E4764',
                            }}
                          >
                            {contact.name[0]}
                          </div>
                        )}
                        <div style={{ textAlign: 'center' }}>
                          <p
                            style={{
                              fontFamily: 'Inter, sans-serif',
                              fontSize: 13,
                              fontWeight: 600,
                              color: '#1D1D1D',
                              margin: '0 0 1px 0',
                              lineHeight: 1.3,
                            }}
                          >
                            {contact.name}
                          </p>
                          <p
                            style={{
                              fontFamily: 'Inter, sans-serif',
                              fontSize: 11,
                              color: '#717182',
                              margin: 0,
                            }}
                          >
                            {contact.role}
                          </p>
                        </div>
                        <a
                          href={`tel:${contact.phone.replace(/\s/g, '')}`}
                          aria-label={`Ring til ${contact.name}`}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            textDecoration: 'none',
                            color: '#0E4764',
                            minHeight: 36,
                          }}
                        >
                          <Phone size={12} color="#0E4764" />
                          <span
                            style={{
                              fontFamily: 'Inter, sans-serif',
                              fontSize: 12,
                              color: '#0E4764',
                            }}
                          >
                            {contact.phone}
                          </span>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Danger/traffic alerts */}
              {dangerAlerts.map(alert => (
                <div
                  key={alert.id}
                  style={{
                    width: 309,
                    height: 158,
                    flexShrink: 0,
                    scrollSnapAlign: 'start',
                    backgroundColor: '#FBECEA',
                    borderRadius: 20,
                    border: '1px solid #F4C5C2',
                    padding: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  <p
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase' as const,
                      color: '#C8372D',
                      margin: 0,
                    }}
                  >
                    Trafikvarsel
                  </p>
                  <p
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: 13,
                      color: '#C8372D',
                      margin: 0,
                      lineHeight: 1.5,
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 5,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {alert.message}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div
          style={{
            padding: '12px 20px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            borderTop: '1px solid #EDEDED',
            backgroundColor: '#F8F8F8',
          }}
        >
          {taskState === 'idle' && (
            <button
              onClick={onStart}
              style={{
                height: 52,
                backgroundColor: '#0E4764',
                color: '#fff',
                borderRadius: 12,
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 600,
                fontSize: 15,
              }}
            >
              Start opgave
            </button>
          )}
          {taskState === 'active' && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={onPause}
                style={{
                  flex: 1,
                  height: 52,
                  backgroundColor: '#EDEDED',
                  color: '#1D1D1D',
                  borderRadius: 12,
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'Poppins, sans-serif',
                  fontWeight: 600,
                  fontSize: 15,
                }}
              >
                Pause
              </button>
              <button
                onClick={onComplete}
                style={{
                  flex: 1,
                  height: 52,
                  backgroundColor: '#1F8A5B',
                  color: '#fff',
                  borderRadius: 12,
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'Poppins, sans-serif',
                  fontWeight: 600,
                  fontSize: 15,
                }}
              >
                Færdig
              </button>
            </div>
          )}
          {taskState === 'paused' && (
            <button
              onClick={onStart}
              style={{
                height: 52,
                backgroundColor: '#0E4764',
                color: '#fff',
                borderRadius: 12,
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 600,
                fontSize: 15,
              }}
            >
              Genoptag
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
