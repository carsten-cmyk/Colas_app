/**
 * PROTOTYPE — Kontaktliste (aggregeret fra dagens opgaver)
 * Deduplikerer på telefonnummer og grupperer per rolle.
 * Må ikke importeres i produktionskode.
 */
import { X, Phone } from 'lucide-react'
import type { Task } from '@/types/task'
import { SAFE_AREA, FS } from '@/styles/spacing'
import type { TabName } from '../components/BottomTabBar'
import { BottomTabBar } from '../components/BottomTabBar'

// ─── Farver (Colas tokens) ────────────────────────────────────────────────────
const C = {
  deepTeal: '#0E4764',
  yellow: '#FEEE32',
  green: '#2E9E65',
  white: '#FFFFFF',
  bg: '#F8F8F8',
  border: '#EDEDED',
  textPrimary: '#1D1D1D',
  textMuted: '#717182',
}

// ─── Types ────────────────────────────────────────────────────────────────────
type ContactItem = {
  id: string
  name: string
  role: string
  phone: string
  udforselssteder?: string[]
}

// ─── Aggregerings-logik ───────────────────────────────────────────────────────
function aggregateContacts(tasks: Task[]): ContactItem[] {
  const seen = new Map<string, ContactItem>()
  for (const task of tasks) {
    const delivery = task.locations.find(l => l.type === 'delivery')?.name
    // Person-kontakter fra opgaven
    for (const c of task.contacts) {
      const key = c.phone.replace(/\s/g, '')
      const existing = seen.get(key)
      if (existing) {
        if (delivery && !existing.udforselssteder?.includes(delivery)) {
          existing.udforselssteder = [...(existing.udforselssteder ?? []), delivery]
        }
      } else {
        seen.set(key, {
          id: c.id,
          name: c.name,
          role: c.role,
          phone: c.phone,
          udforselssteder: delivery ? [delivery] : [],
        })
      }
    }
    // Fabrik-kontakt (kun pickup-location med phone) — ingen udforselssteder
    const pickup = task.locations.find(l => l.type === 'pickup')
    if (pickup?.phone) {
      const key = pickup.phone.replace(/\s/g, '')
      if (!seen.has(key)) {
        seen.set(key, {
          id: `fabrik-${pickup.name}`,
          name: pickup.name,
          role: 'Fabrik',
          phone: pickup.phone,
        })
      }
    }
  }
  return [...seen.values()]
}

function groupByRole(items: ContactItem[]): { role: string; items: ContactItem[] }[] {
  const order = ['Formand', 'Sjakbejs', 'Projektleder', 'Fabrik']
  const groups: Record<string, ContactItem[]> = {}
  for (const item of items) {
    if (!groups[item.role]) groups[item.role] = []
    groups[item.role]!.push(item)
  }
  // Sortér hver gruppe alfabetisk på navn
  for (const role of Object.keys(groups)) {
    groups[role]!.sort((a, b) => a.name.localeCompare(b.name, 'da-DK'))
  }
  return order.filter(r => groups[r]?.length).map(r => ({ role: r, items: groups[r]! }))
}

// ─── Props ────────────────────────────────────────────────────────────────────
export interface KontakterScreenProps {
  tasks: Task[]
  onClose: () => void
  activeTab: TabName
  onTabPress: (tab: TabName) => void
  messageCount?: number
}

// ─── Komponent ────────────────────────────────────────────────────────────────
export function KontakterScreen({
  tasks,
  onClose,
  activeTab,
  onTabPress,
  messageCount = 0,
}: KontakterScreenProps) {
  const contacts = aggregateContacts(tasks)
  const sections = groupByRole(contacts)
  const isEmpty = tasks.length === 0 || contacts.length === 0

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: C.bg,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Handle bar */}
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: SAFE_AREA.top, paddingBottom: 4 }}>
        <div style={{ width: 36, height: 4, backgroundColor: '#C4C4C4', borderRadius: 2 }} />
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
            fontSize: FS.md,
            color: C.deepTeal,
            margin: 0,
          }}
        >
          Kontakter
        </p>
        <button
          onClick={onClose}
          aria-label="Luk"
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            backgroundColor: C.border,
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <X size={16} color={C.textPrimary} />
        </button>
      </div>

      {/* Scrollable body */}
      <div
        className="scrollbar-hide"
        style={{
          flex: 1,
          overflowY: 'auto',
          paddingBottom: 16,
        }}
      >
        {isEmpty ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              paddingTop: 80,
            }}
          >
            <p
              style={{
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 600,
                fontSize: FS.md,
                color: C.textMuted,
                margin: 0,
              }}
            >
              Ingen kontakter i dag
            </p>
            <p
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: FS.sm,
                color: C.textMuted,
                margin: 0,
              }}
            >
              Du har ingen opgaver planlagt
            </p>
          </div>
        ) : (
          sections.map(section => (
            <div key={section.role}>
              {/* Sektion-header */}
              <div
                style={{
                  paddingLeft: 20,
                  paddingRight: 20,
                  paddingTop: 16,
                  paddingBottom: 6,
                }}
              >
                <span
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 600,
                    fontSize: FS.xxs,
                    color: C.textMuted,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase' as const,
                  }}
                >
                  {section.role}
                </span>
              </div>

              {/* Kontakt-rækker */}
              <div
                style={{
                  backgroundColor: C.white,
                  borderTop: `1px solid ${C.border}`,
                  borderBottom: `1px solid ${C.border}`,
                }}
              >
                {section.items.map((contact, index) => (
                  <a
                    key={contact.id}
                    href={`tel:${contact.phone.replace(/\s/g, '')}`}
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                      padding: '12px 16px',
                      borderBottom: index < section.items.length - 1 ? `1px solid ${C.border}` : 'none',
                      minHeight: 44,
                      textDecoration: 'none',
                      backgroundColor: C.white,
                    }}
                  >
                    {/* Navn + rolle + udførselssted */}
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <p
                        style={{
                          fontFamily: 'Poppins, sans-serif',
                          fontWeight: 600,
                          fontSize: FS.md,
                          color: C.textPrimary,
                          margin: 0,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {contact.name}
                      </p>
                      <p
                        style={{
                          fontFamily: 'Inter, sans-serif',
                          fontSize: FS.xs,
                          color: C.textMuted,
                          margin: 0,
                        }}
                      >
                        {contact.role}
                      </p>
                      {/* Udførselssted — vises kun for ikke-Fabrik kontakter med mindst ét sted */}
                      {contact.role !== 'Fabrik' && contact.udforselssteder && contact.udforselssteder.length > 0 && (
                        <p
                          style={{
                            fontFamily: 'Inter, sans-serif',
                            fontSize: FS.xxs,
                            color: C.textMuted,
                            margin: 0,
                            marginTop: 2,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {contact.udforselssteder.length === 1
                            ? contact.udforselssteder[0]
                            : contact.udforselssteder.length === 2
                              ? contact.udforselssteder.join(' · ')
                              : `${contact.udforselssteder[0]} · ${contact.udforselssteder[1]} +${contact.udforselssteder.length - 2} mere`}
                        </p>
                      )}
                    </div>

                    {/* Telefon */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        flexShrink: 0,
                      }}
                    >
                      <Phone size={14} color={C.deepTeal} aria-label="Ring op" />
                      <span
                        style={{
                          fontFamily: 'Inter, sans-serif',
                          fontSize: FS.sm,
                          color: C.deepTeal,
                        }}
                      >
                        {contact.phone}
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Bottom tab bar */}
      <BottomTabBar activeTab={activeTab} onTabPress={onTabPress} messageCount={messageCount} />
    </div>
  )
}
