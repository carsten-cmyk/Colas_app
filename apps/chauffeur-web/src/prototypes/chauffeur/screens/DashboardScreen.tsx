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
            const pickup = task.locations[0]
            const receptNr = task.recept_nr ?? task.produkt
            const produktnavn = task.produktnavn
            const isActive = task.state === 'active'
            const isCompleted = task.state === 'completed'
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
                  // Standard hvid baggrund og border — ingen farvet outline
                  backgroundColor: '#FFFFFF',
                  borderRadius: 12,
                  paddingTop: 20,
                  paddingLeft: 20,
                  paddingRight: 20,
                  paddingBottom: 4,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: 10,
                  border: '1px solid #EDEDED',
                  cursor: 'pointer',
                  textAlign: 'left',
                  position: 'relative',
                  // Completed-kort: let dæmpet
                  opacity: isCompleted ? 0.65 : 1,
                }}
              >
                {/* State-badge top-højre */}
                {isActive && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      backgroundColor: '#FEEE32',
                      borderRadius: 12,
                      padding: '4px 10px',
                    }}
                  >
                    <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 12, color: '#0E4764' }}>
                      I gang
                    </span>
                  </div>
                )}
                {isCompleted && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      // Neutral grå badge — ingen rød
                      backgroundColor: '#EDEDED',
                      borderRadius: 12,
                      padding: '4px 10px',
                    }}
                  >
                    <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 12, color: '#717182' }}>
                      Afsluttet
                    </span>
                  </div>
                )}

                {/* Ordrenummer */}
                <span
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: 12,
                    color: '#717182',
                    margin: 0,
                    marginBottom: 4,
                  }}
                >
                  Ordrenummer {task.orderNumber}
                </span>

                {/* Produktnavn + tons på samme linje (primær), recept_nr under (sekundær) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 1, marginTop: -6, width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <p
                      style={{
                        fontFamily: 'Poppins, sans-serif',
                        fontWeight: 600,
                        fontSize: 16,
                        color: '#0E4764',
                        margin: 0,
                        lineHeight: 1.2,
                      }}
                    >
                      {produktnavn ?? receptNr}
                    </p>
                    <p
                      style={{
                        fontFamily: 'Poppins, sans-serif',
                        fontWeight: 600,
                        fontSize: 16,
                        color: '#0E4764',
                        margin: 0,
                        lineHeight: 1.2,
                      }}
                    >
                      {task.bestilt_total != null ? Math.max(task.bestilt_total - (task.hentet ?? 0), 0) : task.ton} Tons
                    </p>
                  </div>
                  <p
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: 12,
                      color: '#717182',
                      margin: 0,
                      marginTop: 1,
                    }}
                  >
                    {receptNr}
                  </p>
                </div>

                {/* Rute */}
                {pickup?.name && delivery?.name && (
                  <p
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: 13,
                      color: '#717182',
                      margin: 0,
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                      width: '100%',
                    }}
                  >
                    {pickup.name} → {delivery.name}
                  </p>
                )}

                {/* Mødetid hvis pickup har meetingTime */}
                {pickup?.meetingTime && (
                  <p
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: 12,
                      color: '#717182',
                      margin: 0,
                    }}
                  >
                    Mødetid kl. {pickup.meetingTime}
                  </p>
                )}

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
