/**
 * PROTOTYPE — Timeregistrering
 * Må ikke importeres i produktionskode.
 * Når godkendt → byg ordentligt i src/screens/
 */
import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, Pressable, TextInput,
  Modal, ScrollView, TouchableOpacity,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBar, TabName } from '@/components/layout/BottomTabBar';
import { theme } from '@/config/theme';

// ─── Mock data ───────────────────────────────────────────────────────────────
const MOCK = {
  date: '12. Februar 2026',
  projectName: 'Uddannelsescenter Syd, Lolland',
  orderNumber: '1212343',
  rounds: 3,
  distanceKm: 76,
  tons: 73,
};

const INITIAL_ENTRIES = [
  { id: '1', category: 'Kørsel',    minutes: 180 },
  { id: '2', category: 'Ventetid',  minutes: 120 },
  { id: '3', category: 'Læsning',   minutes: 60  },
  { id: '4', category: 'Aflæsning', minutes: 60  },
  { id: '5', category: 'Pause',     minutes: 60  },
];

const REASONS = [
  'GPS-fejl',
  'Ventetid fejlregistreret',
  'Glemt pause',
  'Teknisk fejl',
  'Andet',
];

// ─── Types ───────────────────────────────────────────────────────────────────
type Entry = { id: string; category: string; minutes: number; modified?: boolean };

type EditState = {
  entry: Entry;
  hours: string;
  minutes: string;
  reason: string;
  freeText: string;
};

type ConfirmType = 'dag' | 'opgave' | null;

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}t` : `${h}t ${m}m`;
}

// ─── Komponent ───────────────────────────────────────────────────────────────
interface TimeRegistrationScreenProps {
  onClose: () => void;
}

export function TimeRegistrationScreen({ onClose }: TimeRegistrationScreenProps) {
  const insets = useSafeAreaInsets();
  const commentRef = useRef<TextInput>(null);
  const [activeTab, setActiveTab] = useState<TabName>('prototyper');
  const [entries, setEntries] = useState<Entry[]>(INITIAL_ENTRIES);
  const [comment, setComment] = useState('');
  const [editing, setEditing] = useState<EditState | null>(null);
  const [showReasonList, setShowReasonList] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmType>(null);

  const handleEdit = (entry: Entry) => {
    setEditing({
      entry,
      hours: String(Math.floor(entry.minutes / 60)),
      minutes: String(entry.minutes % 60),
      reason: '',
      freeText: '',
    });
    setShowReasonList(false);
  };

  const handleSave = () => {
    if (!editing) return;
    const total = (parseInt(editing.hours) || 0) * 60 + (parseInt(editing.minutes) || 0);
    setEntries(prev =>
      prev.map(e => e.id === editing.entry.id ? { ...e, minutes: total, modified: true } : e)
    );
    setEditing(null);
  };

  const handleConfirm = () => {
    setConfirm(null);
    onClose();
  };

  return (
    <Modal visible transparent animationType="none">
      <View style={[styles.overlay, { paddingTop: insets.top + theme.spacing.xs }]}>

        {/* Sheet */}
        <View style={styles.sheet}>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.orderNumber}>Ordrenummer {MOCK.orderNumber}</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={16} color={theme.colors.deepTeal} />
            </TouchableOpacity>
          </View>

          {/* Indhold — ingen scroll */}
          <View style={styles.content}>

            {/* Dato + projektnavn */}
            <View style={styles.projectSection}>
              <Text style={styles.dateText}>{MOCK.date}</Text>
              <Text style={styles.projectName} numberOfLines={1}>{MOCK.projectName}</Text>
            </View>

            {/* Dags-summary */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryBox}>
                <Text style={styles.summaryValue}>{MOCK.rounds}</Text>
                <Text style={styles.summaryLabel}>Runder</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryBox}>
                <Text style={styles.summaryValue}>{MOCK.distanceKm}</Text>
                <Text style={styles.summaryLabel}>KM</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryBox}>
                <Text style={styles.summaryValue}>{MOCK.tons}</Text>
                <Text style={styles.summaryLabel}>Tons</Text>
              </View>
            </View>

            {/* Timeforbrug */}
            <Text style={styles.sectionTitle}>Timeforbrug</Text>
            <View style={styles.entriesCard}>
              {entries.map((entry, index) => (
                <View key={entry.id}>
                  {index > 0 && <View style={styles.entryDivider} />}
                  <View style={styles.entryRow}>
                    <Text style={styles.entryCategory}>
                      {entry.category}{entry.modified ? ' *' : ''}
                    </Text>
                    <View style={styles.entryRight}>
                      <Text style={styles.entryTime}>{formatTime(entry.minutes)}</Text>
                      <TouchableOpacity
                        onPress={() => handleEdit(entry)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons name="pencil-outline" size={15} color={theme.colors.deepTeal} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </View>

            {/* Kommentar — flex:1 fylder resterende plads */}
            <View style={styles.commentCard}>
              <TextInput
                ref={commentRef}
                style={styles.commentInput}
                multiline
                placeholder="Kommentar..."
                placeholderTextColor={theme.colors.textMuted}
                value={comment}
                onChangeText={setComment}
                textAlignVertical="top"
              />
              <View style={styles.commentFooter}>
                <Text style={styles.commentHint}>
                  {comment.length > 0 ? `${comment.length} tegn` : ''}
                </Text>
                <TouchableOpacity
                  style={styles.micButton}
                  onPress={() => commentRef.current?.focus()}
                  accessibilityRole="button"
                  accessibilityLabel="Dikter kommentar"
                >
                  <Ionicons name="mic-outline" size={18} color={theme.colors.deepTeal} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Knapper */}
            <View style={styles.buttonsRow}>
              <Pressable style={styles.endDayBtn} onPress={() => setConfirm('dag')}>
                <Text style={styles.endDayBtnText}>Afslut dag</Text>
              </Pressable>
              <Pressable style={styles.endTaskBtn} onPress={() => setConfirm('opgave')}>
                <Text style={styles.endTaskBtnText}>Afslut opgave</Text>
              </Pressable>
            </View>

          </View>
        </View>

        {/* Tab bar */}
        <BottomTabBar
          activeTab={activeTab}
          onTabPress={tab => { if (tab !== 'prototyper') onClose(); }}
        />

        {/* Redigerings-overlay */}
        {editing && (
          <View style={styles.editOverlay}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setEditing(null)} />
            <View style={[styles.editCard, { paddingBottom: insets.bottom + theme.spacing.md }]}>

              <Text style={styles.editTitle}>
                Rediger {editing.entry.category.toLowerCase()}
              </Text>

              <View style={styles.timeInputRow}>
                <View style={styles.timeInputGroup}>
                  <Text style={styles.timeInputLabel}>Timer</Text>
                  <TextInput
                    style={styles.timeInput}
                    keyboardType="number-pad"
                    value={editing.hours}
                    onChangeText={h => setEditing(prev => prev ? { ...prev, hours: h } : null)}
                    maxLength={2}
                  />
                </View>
                <Text style={styles.timeColon}>:</Text>
                <View style={styles.timeInputGroup}>
                  <Text style={styles.timeInputLabel}>Minutter</Text>
                  <TextInput
                    style={styles.timeInput}
                    keyboardType="number-pad"
                    value={editing.minutes}
                    onChangeText={m => setEditing(prev => prev ? { ...prev, minutes: m } : null)}
                    maxLength={2}
                  />
                </View>
              </View>

              <Text style={styles.reasonLabel}>Årsag</Text>
              <Pressable
                style={styles.reasonSelector}
                onPress={() => setShowReasonList(v => !v)}
              >
                <Text style={[
                  styles.reasonSelectorText,
                  !editing.reason && { color: theme.colors.textMuted },
                ]}>
                  {editing.reason || 'Vælg årsag...'}
                </Text>
                <Ionicons
                  name={showReasonList ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={theme.colors.deepTeal}
                />
              </Pressable>

              {showReasonList && (
                <View style={styles.reasonList}>
                  {REASONS.map(r => (
                    <Pressable
                      key={r}
                      style={styles.reasonOption}
                      onPress={() => {
                        setEditing(prev => prev ? {
                          ...prev,
                          reason: r,
                          freeText: r !== 'Andet' ? '' : prev.freeText,
                        } : null);
                        setShowReasonList(false);
                      }}
                    >
                      <Text style={[
                        styles.reasonOptionText,
                        editing.reason === r && styles.reasonOptionActive,
                      ]}>
                        {r}
                      </Text>
                      {editing.reason === r && (
                        <Ionicons name="checkmark" size={14} color={theme.colors.deepTeal} />
                      )}
                    </Pressable>
                  ))}
                </View>
              )}

              {editing.reason === 'Andet' && (
                <TextInput
                  style={styles.freeTextInput}
                  placeholder="Beskriv årsag..."
                  placeholderTextColor={theme.colors.textMuted}
                  value={editing.freeText}
                  onChangeText={t => setEditing(prev => prev ? { ...prev, freeText: t } : null)}
                  multiline
                  textAlignVertical="top"
                />
              )}

              <View style={styles.editButtons}>
                <Pressable style={styles.cancelBtn} onPress={() => setEditing(null)}>
                  <Text style={styles.cancelBtnText}>Afbryd</Text>
                </Pressable>
                <Pressable style={styles.saveBtn} onPress={handleSave}>
                  <Text style={styles.saveBtnText}>Gem</Text>
                </Pressable>
              </View>

            </View>
          </View>
        )}

        {/* Bekræftelses-dialog */}
        {confirm && (
          <View style={styles.confirmOverlay}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setConfirm(null)} />
            <View style={styles.confirmCard}>
              <View style={styles.confirmIconWrap}>
                <Ionicons
                  name={confirm === 'dag' ? 'moon-outline' : 'checkmark-circle-outline'}
                  size={36}
                  color={confirm === 'dag' ? theme.colors.deepTeal : theme.colors.error}
                />
              </View>
              <Text style={styles.confirmTitle}>
                {confirm === 'dag' ? 'Afslut dag?' : 'Afslut opgave?'}
              </Text>
              <Text style={styles.confirmMessage}>
                {confirm === 'dag'
                  ? 'Dagens timer gemmes. Opgaven fortsætter i morgen.'
                  : 'Opgaven afsluttes og sendes til godkendelse.'}
              </Text>
              <View style={styles.confirmButtons}>
                <Pressable style={styles.confirmCancelBtn} onPress={() => setConfirm(null)}>
                  <Text style={styles.confirmCancelText}>Annuller</Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.confirmOkBtn,
                    confirm === 'opgave' && styles.confirmOkBtnRed,
                  ]}
                  onPress={handleConfirm}
                >
                  <Text style={[
                    styles.confirmOkText,
                    confirm === 'opgave' && styles.confirmOkTextWhite,
                  ]}>
                    {confirm === 'dag' ? 'Afslut dag' : 'Afslut opgave'}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}

      </View>
    </Modal>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: theme.colors.darkTeal,
    justifyContent: 'flex-end',
  },
  sheet: {
    flex: 1,
    backgroundColor: theme.colors.softAqua,
    borderTopLeftRadius: theme.borderRadius.xxl,
    borderTopRightRadius: theme.borderRadius.xxl,
    marginHorizontal: theme.sheet.horizontalMargin,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xxs,
  },
  orderNumber: {
    fontFamily: theme.fonts.interMedium,
    fontSize: theme.fontSizes.xs,
    color: theme.colors.deepTeal,
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Indhold
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  projectSection: {
    gap: theme.spacing.xxxs,
  },
  dateText: {
    fontFamily: theme.fonts.interRegular,
    fontSize: theme.fontSizes.xs,
    color: theme.colors.textMuted,
  },
  projectName: {
    fontFamily: theme.fonts.poppinsMedium,
    fontSize: theme.fontSizes.md,
    color: theme.colors.deepTeal,
  },

  // Summary
  summaryCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    flexDirection: 'row',
    paddingVertical: theme.spacing.xs,
  },
  summaryBox: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: theme.colors.boxOutline,
    marginVertical: theme.spacing.xxxs,
  },
  summaryValue: {
    fontFamily: theme.fonts.poppinsSemiBold,
    fontSize: 20,
    color: theme.colors.deepTeal,
  },
  summaryLabel: {
    fontFamily: theme.fonts.interRegular,
    fontSize: theme.fontSizes.xxs,
    color: theme.colors.textMuted,
  },

  // Timeforbrug
  sectionTitle: {
    fontFamily: theme.fonts.interSemiBold,
    fontSize: theme.fontSizes.xs,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.md,
    marginBottom: -theme.spacing.xxxs,
  },
  entriesCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
  },
  entryCategory: {
    flex: 1,
    fontFamily: theme.fonts.interMedium,
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textPrimary,
  },
  entryRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  entryTime: {
    fontFamily: theme.fonts.interMedium,
    fontSize: theme.fontSizes.sm,
    color: theme.colors.deepTeal,
  },
  entryDivider: {
    height: 1,
    backgroundColor: theme.colors.boxOutline,
    marginHorizontal: theme.spacing.sm,
  },

  // Kommentar
  commentCard: {
    height: 110,
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
  },
  commentInput: {
    flex: 1,
    paddingHorizontal: theme.spacing.sm,
    paddingTop: theme.spacing.xs,
    paddingBottom: theme.spacing.xxxs,
    fontFamily: theme.fonts.interRegular,
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textPrimary,
  },
  commentFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.sm,
    paddingBottom: theme.spacing.xs,
  },
  commentHint: {
    fontFamily: theme.fonts.interRegular,
    fontSize: theme.fontSizes.xxs,
    color: theme.colors.textMuted,
  },
  micButton: {
    width: 32,
    height: 32,
    backgroundColor: theme.colors.softAqua,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Knapper
  buttonsRow: {
    gap: theme.spacing.xs,
  },
  endDayBtn: {
    backgroundColor: theme.colors.yellow,
    borderRadius: theme.borderRadius.xxl,
    height: theme.buttonHeight.action,
    alignItems: 'center',
    justifyContent: 'center',
  },
  endDayBtnText: {
    fontFamily: theme.fonts.poppinsSemiBold,
    fontSize: theme.fontSizes.sm,
    color: theme.colors.deepTeal,
  },
  endTaskBtn: {
    backgroundColor: theme.colors.error,
    borderRadius: theme.borderRadius.xxl,
    height: theme.buttonHeight.action,
    alignItems: 'center',
    justifyContent: 'center',
  },
  endTaskBtnText: {
    fontFamily: theme.fonts.poppinsSemiBold,
    fontSize: theme.fontSizes.sm,
    color: theme.colors.white,
  },

  // Redigerings-overlay
  editOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  editCard: {
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: theme.borderRadius.xxl,
    borderTopRightRadius: theme.borderRadius.xxl,
    paddingHorizontal: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  editTitle: {
    fontFamily: theme.fonts.poppinsSemiBold,
    fontSize: theme.fontSizes.md,
    color: theme.colors.deepTeal,
  },
  timeInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: theme.spacing.xs,
  },
  timeInputGroup: {
    gap: theme.spacing.xxxs,
  },
  timeInputLabel: {
    fontFamily: theme.fonts.interRegular,
    fontSize: theme.fontSizes.xs,
    color: theme.colors.textMuted,
  },
  timeInput: {
    backgroundColor: theme.colors.softAqua,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    fontFamily: theme.fonts.interMedium,
    fontSize: theme.fontSizes.lg,
    color: theme.colors.deepTeal,
    width: 80,
    textAlign: 'center',
  },
  timeColon: {
    fontFamily: theme.fonts.poppinsSemiBold,
    fontSize: theme.fontSizes.lg,
    color: theme.colors.deepTeal,
    paddingBottom: theme.spacing.xs,
  },
  reasonLabel: {
    fontFamily: theme.fonts.interSemiBold,
    fontSize: theme.fontSizes.xs,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.xxxs,
  },
  reasonSelector: {
    backgroundColor: theme.colors.softAqua,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reasonSelectorText: {
    fontFamily: theme.fonts.interMedium,
    fontSize: theme.fontSizes.sm,
    color: theme.colors.deepTeal,
  },
  reasonList: {
    backgroundColor: theme.colors.softAqua,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  reasonOptionText: {
    fontFamily: theme.fonts.interRegular,
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textPrimary,
  },
  reasonOptionActive: {
    fontFamily: theme.fonts.interMedium,
    color: theme.colors.deepTeal,
  },
  freeTextInput: {
    backgroundColor: theme.colors.softAqua,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    minHeight: 60,
    fontFamily: theme.fonts.interRegular,
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textPrimary,
  },
  editButtons: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xxxs,
  },
  cancelBtn: {
    flex: 1,
    borderRadius: theme.borderRadius.xxl,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.deepTeal,
  },
  cancelBtnText: {
    fontFamily: theme.fonts.poppinsSemiBold,
    fontSize: theme.fontSizes.sm,
    color: theme.colors.deepTeal,
  },
  saveBtn: {
    flex: 1,
    backgroundColor: theme.colors.yellow,
    borderRadius: theme.borderRadius.xxl,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontFamily: theme.fonts.poppinsSemiBold,
    fontSize: theme.fontSizes.sm,
    color: theme.colors.deepTeal,
  },

  // Bekræftelses-dialog
  confirmOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  confirmCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xxl,
    padding: theme.spacing.sm,
    width: '100%',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  confirmIconWrap: {
    marginBottom: theme.spacing.xxxs,
  },
  confirmTitle: {
    fontFamily: theme.fonts.poppinsSemiBold,
    fontSize: theme.fontSizes.lg,
    color: theme.colors.deepTeal,
    textAlign: 'center',
  },
  confirmMessage: {
    fontFamily: theme.fonts.interRegular,
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xxxs,
    width: '100%',
  },
  confirmCancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: theme.borderRadius.xxl,
    borderWidth: 1,
    borderColor: theme.colors.deepTeal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmCancelText: {
    fontFamily: theme.fonts.poppinsSemiBold,
    fontSize: theme.fontSizes.sm,
    color: theme.colors.deepTeal,
  },
  confirmOkBtn: {
    flex: 1,
    height: 44,
    borderRadius: theme.borderRadius.xxl,
    backgroundColor: theme.colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmOkBtnRed: {
    backgroundColor: theme.colors.error,
  },
  confirmOkText: {
    fontFamily: theme.fonts.poppinsSemiBold,
    fontSize: theme.fontSizes.sm,
    color: theme.colors.deepTeal,
  },
  confirmOkTextWhite: {
    color: theme.colors.white,
  },
});
