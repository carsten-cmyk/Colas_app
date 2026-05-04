import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  ScrollView, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/config/theme';
import { ProjectTag } from '@/components/messages/ProjectTag';
import { mockMessageUsers, mockMessageProjects } from '@/mocks/messages';
import { MessageUser, MessageProject } from '@/types/messages';

export interface NewMessageScreenProps {
  onCancel: () => void;
  onSend: (recipientId: string, projectId: string | null, message: string) => void;
}

const AVATAR_SIZE = 36;

export function NewMessageScreen({ onCancel, onSend }: NewMessageScreenProps) {
  const [selectedUser, setSelectedUser] = useState<MessageUser | null>(null);
  const [selectedProject, setSelectedProject] = useState<MessageProject | null>(null);
  const [messageText, setMessageText] = useState('');
  const [showUserPicker, setShowUserPicker] = useState(false);
  const [showProjectPicker, setShowProjectPicker] = useState(false);

  const canSend = selectedUser !== null && messageText.trim().length > 0;

  const handleSend = () => {
    if (!canSend || !selectedUser) return;
    onSend(selectedUser.id, selectedProject?.id ?? null, messageText.trim());
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.cancelButton}
          onPress={onCancel}
          accessibilityRole="button"
          accessibilityLabel="Annuller"
        >
          <Text style={styles.cancelText}>Annuller</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Ny besked</Text>
        <Pressable
          style={[styles.sendHeaderButton, !canSend && styles.sendHeaderButtonDisabled]}
          onPress={handleSend}
          disabled={!canSend}
          accessibilityRole="button"
          accessibilityLabel="Send"
        >
          <Text style={[styles.sendHeaderText, !canSend && styles.sendHeaderTextDisabled]}>
            Send
          </Text>
        </Pressable>
      </View>

      <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Modtager */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Modtager *</Text>
          <Pressable
            style={styles.picker}
            onPress={() => { setShowUserPicker(v => !v); setShowProjectPicker(false); }}
            accessibilityRole="button"
          >
            {selectedUser ? (
              <View style={styles.pickerSelected}>
                {selectedUser.avatarUrl ? (
                  <Image source={{ uri: selectedUser.avatarUrl }} style={styles.pickerAvatar} />
                ) : (
                  <View style={[styles.pickerAvatar, styles.pickerAvatarFallback]}>
                    <Text style={styles.pickerAvatarInitial}>{selectedUser.name[0]}</Text>
                  </View>
                )}
                <View>
                  <Text style={styles.pickerName}>{selectedUser.name}</Text>
                  <Text style={styles.pickerRole}>{selectedUser.role}</Text>
                </View>
              </View>
            ) : (
              <Text style={styles.pickerPlaceholder}>Vælg modtager...</Text>
            )}
            <Ionicons
              name={showUserPicker ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={theme.colors.textMuted}
            />
          </Pressable>

          {showUserPicker && (
            <View style={styles.dropdown}>
              {mockMessageUsers.map(user => (
                <Pressable
                  key={user.id}
                  style={[styles.dropdownItem, selectedUser?.id === user.id && styles.dropdownItemActive]}
                  onPress={() => { setSelectedUser(user); setShowUserPicker(false); }}
                >
                  {user.avatarUrl ? (
                    <Image source={{ uri: user.avatarUrl }} style={styles.pickerAvatar} />
                  ) : (
                    <View style={[styles.pickerAvatar, styles.pickerAvatarFallback]}>
                      <Text style={styles.pickerAvatarInitial}>{user.name[0]}</Text>
                    </View>
                  )}
                  <View style={styles.dropdownItemText}>
                    <Text style={styles.pickerName}>{user.name}</Text>
                    <Text style={styles.pickerRole}>{user.role}</Text>
                  </View>
                  {selectedUser?.id === user.id && (
                    <Ionicons name="checkmark" size={18} color={theme.colors.darkTeal} />
                  )}
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* Projekt */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Projekt (valgfrit)</Text>
          <Pressable
            style={styles.picker}
            onPress={() => { setShowProjectPicker(v => !v); setShowUserPicker(false); }}
            accessibilityRole="button"
          >
            {selectedProject ? (
              <ProjectTag
                orderNumber={selectedProject.orderNumber}
                name={selectedProject.name}
              />
            ) : (
              <Text style={styles.pickerPlaceholder}>Vælg projekt...</Text>
            )}
            <Ionicons
              name={showProjectPicker ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={theme.colors.textMuted}
            />
          </Pressable>

          {showProjectPicker && (
            <View style={styles.dropdown}>
              <Pressable
                style={styles.dropdownItem}
                onPress={() => { setSelectedProject(null); setShowProjectPicker(false); }}
              >
                <Text style={[styles.pickerRole, { fontStyle: 'italic' }]}>Intet projekt</Text>
              </Pressable>
              {mockMessageProjects.map(project => (
                <Pressable
                  key={project.id}
                  style={[styles.dropdownItem, selectedProject?.id === project.id && styles.dropdownItemActive]}
                  onPress={() => { setSelectedProject(project); setShowProjectPicker(false); }}
                >
                  <View style={styles.dropdownItemText}>
                    <Text style={styles.pickerName}>{project.name}</Text>
                    <Text style={styles.pickerRole}>#{project.orderNumber}</Text>
                  </View>
                  {selectedProject?.id === project.id && (
                    <Ionicons name="checkmark" size={18} color={theme.colors.darkTeal} />
                  )}
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* Besked */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Besked *</Text>
          <TextInput
            style={styles.textArea}
            value={messageText}
            onChangeText={setMessageText}
            placeholder="Skriv din besked..."
            placeholderTextColor={theme.colors.textMuted}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            maxLength={1000}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.softGray,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    backgroundColor: theme.colors.deepTeal,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.darkTeal,
  },
  cancelButton: {
    minWidth: 70,
    paddingVertical: theme.spacing.xs,
  },
  cancelText: {
    fontFamily: theme.fonts.interRegular,
    fontSize: theme.fontSizes.sm,
    color: theme.colors.lightAqua,
  },
  headerTitle: {
    fontFamily: theme.fonts.poppinsSemiBold,
    fontSize: theme.fontSizes.md,
    color: theme.colors.white,
  },
  sendHeaderButton: {
    minWidth: 70,
    paddingVertical: theme.spacing.xs,
    alignItems: 'flex-end',
  },
  sendHeaderButtonDisabled: {},
  sendHeaderText: {
    fontFamily: theme.fonts.interSemiBold,
    fontSize: theme.fontSizes.sm,
    color: theme.colors.yellow,
  },
  sendHeaderTextDisabled: {
    color: theme.colors.textMuted,
  },
  scroll: {
    flex: 1,
    padding: theme.spacing.sm,
  },
  field: {
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.xxxs,
  },
  fieldLabel: {
    fontFamily: theme.fonts.interMedium,
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.xxxs,
  },
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    minHeight: 52,
    borderWidth: 1,
    borderColor: theme.colors.boxOutline,
  },
  pickerSelected: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    flex: 1,
  },
  pickerAvatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  pickerAvatarFallback: {
    backgroundColor: theme.colors.lightAqua,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerAvatarInitial: {
    fontFamily: theme.fonts.interBold,
    fontSize: theme.fontSizes.sm,
    color: theme.colors.darkTeal,
  },
  pickerName: {
    fontFamily: theme.fonts.interMedium,
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textPrimary,
  },
  pickerRole: {
    fontFamily: theme.fonts.interRegular,
    fontSize: theme.fontSizes.xs,
    color: theme.colors.textMuted,
    textTransform: 'capitalize',
  },
  pickerPlaceholder: {
    fontFamily: theme.fonts.interRegular,
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textMuted,
  },
  dropdown: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.boxOutline,
    overflow: 'hidden',
    marginTop: 2,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.boxOutline,
    minHeight: 52,
  },
  dropdownItemActive: {
    backgroundColor: theme.colors.softAqua,
  },
  dropdownItemText: {
    flex: 1,
  },
  textArea: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    fontFamily: theme.fonts.interRegular,
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textPrimary,
    minHeight: 120,
    borderWidth: 1,
    borderColor: theme.colors.boxOutline,
  },
});
