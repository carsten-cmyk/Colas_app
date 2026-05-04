import React, { useState } from 'react';
import { View, FlatList, StyleSheet, Text, Image, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/config/theme';
import { MessageBubble } from '@/components/messages/MessageBubble';
import { MessageInput } from '@/components/messages/MessageInput';
import { ProjectTag } from '@/components/messages/ProjectTag';
import { Conversation, Message } from '@/types/messages';

export interface ConversationScreenProps {
  conversation: Conversation;
  onBack: () => void;
}

const AVATAR_SIZE = 36;

export function ConversationScreen({ conversation, onBack }: ConversationScreenProps) {
  const [messages, setMessages] = useState<Message[]>(conversation.messages);
  const other = conversation.participants[0];

  const handleSend = (text: string) => {
    const newMessage: Message = {
      id: `m${Date.now()}`,
      conversationId: conversation.id,
      senderId: 'me',
      content: text,
      timestamp: new Date(),
      isRead: true,
    };
    setMessages(prev => [...prev, newMessage]);
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Tilbage"
        >
          <Ionicons name="chevron-back" size={24} color={theme.colors.white} />
        </Pressable>

        <View style={styles.headerInfo}>
          {other.avatarUrl ? (
            <Image source={{ uri: other.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarInitial}>{other.name[0]}</Text>
            </View>
          )}
          <View>
            <Text style={styles.headerName}>{other.name}</Text>
            <Text style={styles.headerRole}>{other.role}</Text>
          </View>
        </View>

        <Pressable
          style={styles.phoneButton}
          accessibilityRole="button"
          accessibilityLabel={`Ring til ${other.name}`}
        >
          <Ionicons name="call-outline" size={22} color={theme.colors.white} />
        </Pressable>
      </View>

      {/* Projekt-context */}
      {conversation.project && (
        <View style={styles.projectBanner}>
          <Ionicons name="briefcase-outline" size={14} color={theme.colors.darkTeal} />
          <ProjectTag
            orderNumber={conversation.project.orderNumber}
            name={conversation.project.name}
            size="sm"
          />
        </View>
      )}

      {/* Beskeder */}
      <FlatList
        data={messages}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <MessageBubble
            message={item}
            isSent={item.senderId === 'me'}
          />
        )}
        contentContainerStyle={styles.messageList}
        showsVerticalScrollIndicator={false}
      />

      {/* Input */}
      <MessageInput onSend={handleSend} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.softAqua,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.deepTeal,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
    gap: theme.spacing.xs,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
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
    fontSize: theme.fontSizes.sm,
    color: theme.colors.darkTeal,
  },
  headerName: {
    fontFamily: theme.fonts.interSemiBold,
    fontSize: theme.fontSizes.sm,
    color: theme.colors.white,
  },
  headerRole: {
    fontFamily: theme.fonts.interRegular,
    fontSize: theme.fontSizes.xs,
    color: theme.colors.lightAqua,
    textTransform: 'capitalize',
  },
  phoneButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  projectBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xxxs,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.boxOutline,
  },
  messageList: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
});
