/**
 * PROTOTYPE — Opgaveliste
 * Må ikke importeres i produktionskode.
 * Når godkendt → byg ordentligt i src/screens/TaskListScreen.tsx
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { TaskCard } from '@/components/ui/TaskCard';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { BottomTabBar, TabName } from '@/components/layout/BottomTabBar';
import { TaskDetailScreen } from '@/screens/TaskDetailScreen';
import { mockTask, mockTask2, mockTask3 } from '@/mocks/tasks';
import { Task, TaskState } from '@/types/task';
import { theme } from '@/config/theme';

// ─── Lokal type-udvidelse til prototype ──────────────────────────────────────
type PrototypeTask = Task & { completedAt?: string };
type DayGroup = { date: string; tasks: PrototypeTask[] };

const TWENTY_HOURS_AGO = new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString();

const INITIAL_GROUPS: DayGroup[] = [
  {
    date: '12. Februar 2026',
    tasks: [
      { ...mockTask,  id: '1', state: 'completed', completedAt: TWENTY_HOURS_AGO },
      { ...mockTask2, id: '2', state: 'active' },
    ],
  },
  {
    date: '13. Februar 2026',
    tasks: [
      { ...mockTask3, id: '3', state: 'idle' },
    ],
  },
];

const REOPEN_REASONS = [
  'Forkert afsluttet',
  'Manglende registrering',
  'GPS-fejl',
  'Teknisk fejl',
  'Andet',
];

function canReopen(completedAt?: string): boolean {
  if (!completedAt) return false;
  return Date.now() - new Date(completedAt).getTime() < 24 * 60 * 60 * 1000;
}

// ─── Komponent ───────────────────────────────────────────────────────────────
interface TaskListScreenProps {
  onClose: () => void;
}

export function TaskListScreen({ onClose }: TaskListScreenProps) {
  const [groups, setGroups] = useState<DayGroup[]>(INITIAL_GROUPS);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabName>('opgaver');

  const handleReopen = (taskId: string) => {
    setGroups(prev => prev.map(g => ({
      ...g,
      tasks: g.tasks.map(t =>
        t.id === taskId
          ? { ...t, state: 'active' as TaskState, completedAt: undefined }
          : t
      ),
    })));
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {groups.map(group => (
          <View key={group.date} style={styles.dayGroup}>
            <SectionLabel label={group.date} />
            {group.tasks.map(task => (
              <TaskEntry
                key={task.id}
                task={task}
                onPress={() => setSelectedTaskId(task.id)}
                onReopen={() => handleReopen(task.id)}
              />
            ))}
          </View>
        ))}
      </ScrollView>

      <BottomTabBar
        activeTab={activeTab}
        onTabPress={tab => { if (tab === 'prototyper') onClose(); else setActiveTab(tab); }}
      />

      {selectedTaskId && (
        <TaskDetailScreen
          id={selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
        />
      )}
    </SafeAreaView>
  );
}

// ─── TaskEntry ────────────────────────────────────────────────────────────────
interface TaskEntryProps {
  task: PrototypeTask;
  onPress: () => void;
  onReopen: () => void;
}

function TaskEntry({ task, onPress, onReopen }: TaskEntryProps) {
  const insets = useSafeAreaInsets();
  const isCompleted = task.state === 'completed';
  const isActive    = task.state === 'active';
  const showReopen  = isCompleted && canReopen(task.completedAt);
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <View>
      <View style={[styles.cardWrapper, isActive && styles.cardWrapperActive]}>
        <TaskCard task={task} onPress={onPress} />

        {/* Rødt overlay på afsluttede opgaver */}
        {isCompleted && <View style={styles.completedOverlay} pointerEvents="none" />}

        {/* Aktiv badge */}
        {isActive && (
          <View style={styles.activeBadge}>
            <View style={styles.activeDot} />
            <Text style={styles.activeBadgeText}>Aktiv</Text>
          </View>
        )}

        {/* Afsluttet badge */}
        {isCompleted && (
          <View style={styles.completedBadge}>
            <Text style={styles.completedBadgeText}>Afsluttet</Text>
          </View>
        )}

        {/* Genåbn-chip integreret i bunden af kortet */}
        {showReopen && (
          <Pressable
            style={styles.reopenChip}
            onPress={() => setModalVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Genåbn opgave"
          >
            <Ionicons name="refresh-outline" size={13} color={theme.colors.white} />
            <Text style={styles.reopenChipText}>Genåbn opgave</Text>
          </Pressable>
        )}
      </View>

      {/* Genåbn-modal */}
      <Modal visible={modalVisible} transparent animationType="none">
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setModalVisible(false)} />
          <View style={[styles.modalSheet, { paddingBottom: insets.bottom + theme.spacing.md }]}>

            <View style={styles.modalHandle} />

            <Text style={styles.modalTitle}>Årsag til genåbning</Text>
            <Text style={styles.modalSubtitle}>
              Vælg årsag til at genåbne opgaven
            </Text>

            <View style={styles.reasonList}>
              {REOPEN_REASONS.map((reason, index) => (
                <Pressable
                  key={reason}
                  style={[
                    styles.reasonOption,
                    index < REOPEN_REASONS.length - 1 && styles.reasonOptionBorder,
                  ]}
                  onPress={() => {
                    setModalVisible(false);
                    onReopen();
                  }}
                >
                  <Text style={styles.reasonOptionText}>{reason}</Text>
                  <Ionicons name="chevron-forward" size={16} color={theme.colors.textMuted} />
                </Pressable>
              ))}
            </View>

            <Pressable
              style={styles.cancelBtn}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.cancelBtnText}>Annuller</Text>
            </Pressable>

          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.darkTeal,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.sm,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    gap: theme.spacing.md,
  },
  dayGroup: {
    gap: theme.spacing.sm,
  },

  // Card wrapper
  cardWrapper: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  cardWrapperActive: {
    borderWidth: 2,
    borderColor: theme.colors.yellow,
  },
  completedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(180,40,40,0.30)',
  },

  // Active badge
  activeBadge: {
    position: 'absolute',
    top: theme.spacing.xs,
    right: theme.spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xxxs,
    backgroundColor: theme.colors.yellow,
    borderRadius: theme.borderRadius.xxl,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 3,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.deepTeal,
  },
  activeBadgeText: {
    fontFamily: theme.fonts.interBold,
    fontSize: theme.fontSizes.xxs,
    color: theme.colors.deepTeal,
  },

  // Completed badge
  completedBadge: {
    position: 'absolute',
    top: theme.spacing.xs,
    right: theme.spacing.xs,
    backgroundColor: 'rgb(180,40,40)',
    borderRadius: theme.borderRadius.xxl,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 3,
  },
  completedBadgeText: {
    fontFamily: theme.fonts.interBold,
    fontSize: theme.fontSizes.xxs,
    color: theme.colors.white,
  },

  // Genåbn chip — integreret i bunden af kortet
  reopenChip: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xxxs,
    backgroundColor: 'rgba(180,40,40,0.55)',
    paddingVertical: theme.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
  },
  reopenChipText: {
    fontFamily: theme.fonts.interSemiBold,
    fontSize: theme.fontSizes.xs,
    color: theme.colors.white,
  },

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: theme.borderRadius.xxl,
    borderTopRightRadius: theme.borderRadius.xxl,
    paddingHorizontal: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.boxOutline,
    alignSelf: 'center',
    marginBottom: theme.spacing.xxxs,
  },
  modalTitle: {
    fontFamily: theme.fonts.poppinsSemiBold,
    fontSize: theme.fontSizes.lg,
    color: theme.colors.deepTeal,
  },
  modalSubtitle: {
    fontFamily: theme.fonts.interRegular,
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.xxxs,
  },
  reasonList: {
    backgroundColor: theme.colors.softAqua,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
  },
  reasonOptionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.boxOutline,
  },
  reasonOptionText: {
    fontFamily: theme.fonts.interRegular,
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textPrimary,
  },
  cancelBtn: {
    height: theme.buttonHeight.action,
    borderRadius: theme.borderRadius.xxl,
    borderWidth: 1,
    borderColor: theme.colors.deepTeal,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.xxxs,
  },
  cancelBtnText: {
    fontFamily: theme.fonts.poppinsSemiBold,
    fontSize: theme.fontSizes.sm,
    color: theme.colors.deepTeal,
  },
});
