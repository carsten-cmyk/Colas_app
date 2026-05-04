import React from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { theme } from '@/config/theme';
import { Conversation } from '@/types/messages';
import { ProjectTag } from './ProjectTag';
import { formatMessageTime } from '@/lib/messageUtils';

export interface MessageCardProps {
  conversation: Conversation;
  onPress: () => void;
}

const AVATAR_SIZE = 48;

export function MessageCard({ conversation, onPress }: MessageCardProps) {
  const other = conversation.participants[0];
  const isUnread = !conversation.lastMessage.isRead &&
    conversation.lastMessage.senderId !== 'me';

  return (
    <Pressable
      style={styles.container}
      onPress={onPress}
      android_ripple={{ color: 'rgba(0,0,0,0.05)' }}
      accessibilityRole="button"
      accessibilityLabel={`Besked fra ${other.name}`}
    >
      {/* Avatar */}
      <View style={styles.avatarWrapper}>
        {other.avatarUrl ? (
          <Image source={{ uri: other.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarInitial}>{other.name[0]}</Text>
          </View>
        )}
        {isUnread && <View style={styles.unreadDot} />}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.topRow}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, isUnread && styles.nameBold]} numberOfLines={1}>
              {other.name}
            </Text>
            <Text style={styles.role}>{other.role}</Text>
          </View>
          <Text style={styles.timestamp}>
            {formatMessageTime(conversation.lastMessage.timestamp)}
          </Text>
        </View>

        {conversation.project && (
          <ProjectTag
            orderNumber={conversation.project.orderNumber}
            name={conversation.project.name}
            size="sm"
          />
        )}

        <Text style={[styles.preview, isUnread && styles.previewBold]} numberOfLines={1}>
          {conversation.lastMessage.senderId === 'me' ? 'Du: ' : ''}
          {conversation.lastMessage.content}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.boxOutline,
    backgroundColor: theme.colors.white,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  avatarFallback: {
    backgroundColor: theme.colors.lightAqua,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontFamily: theme.fonts.interBold,
    fontSize: theme.fontSizes.md,
    color: theme.colors.darkTeal,
  },
  unreadDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.darkTeal,
    borderWidth: 2,
    borderColor: theme.colors.white,
  },
  content: {
    flex: 1,
    gap: theme.spacing.xxxs,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  nameRow: {
    flex: 1,
    marginRight: theme.spacing.xs,
  },
  name: {
    fontFamily: theme.fonts.interMedium,
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textPrimary,
  },
  nameBold: {
    fontFamily: theme.fonts.interBold,
  },
  role: {
    fontFamily: theme.fonts.interRegular,
    fontSize: theme.fontSizes.xs,
    color: theme.colors.textMuted,
    textTransform: 'capitalize',
  },
  timestamp: {
    fontFamily: theme.fonts.interRegular,
    fontSize: theme.fontSizes.xs,
    color: theme.colors.textMuted,
  },
  preview: {
    fontFamily: theme.fonts.interRegular,
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  previewBold: {
    fontFamily: theme.fonts.interMedium,
    color: theme.colors.textPrimary,
  },
});
