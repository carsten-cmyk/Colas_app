import React, { useState } from 'react';
import { View, FlatList, StyleSheet, Text, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Pressable } from 'react-native';
import { theme } from '@/config/theme';
import { TabSwitcher, MessageTab } from '@/components/messages/TabSwitcher';
import { MessageCard } from '@/components/messages/MessageCard';
import { mockConversations } from '@/mocks/messages';
import { isArchived } from '@/lib/messageUtils';
import { Conversation } from '@/types/messages';

export interface MessagesListScreenProps {
  onOpenConversation: (conversation: Conversation) => void;
  onNewMessage: () => void;
}

export function MessagesListScreen({ onOpenConversation, onNewMessage }: MessagesListScreenProps) {
  const [activeTab, setActiveTab] = useState<MessageTab>('indbakke');
  const [refreshing, setRefreshing] = useState(false);

  const inbox = mockConversations.filter(c => !isArchived(c.lastMessage.timestamp));
  const archive = mockConversations.filter(c => isArchived(c.lastMessage.timestamp));
  const conversations = activeTab === 'indbakke' ? inbox : archive;

  const unreadCount = inbox.filter(
    c => !c.lastMessage.isRead && c.lastMessage.senderId !== 'me'
  ).length;

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Beskeder</Text>
        <Pressable
          style={styles.newButton}
          onPress={onNewMessage}
          accessibilityRole="button"
          accessibilityLabel="Ny besked"
        >
          <Ionicons name="create-outline" size={24} color={theme.colors.white} />
        </Pressable>
      </View>

      {/* Tabs */}
      <TabSwitcher
        activeTab={activeTab}
        onTabPress={setActiveTab}
        unreadCount={unreadCount}
      />

      {/* Liste */}
      <FlatList
        data={conversations}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <MessageCard
            conversation={item}
            onPress={() => onOpenConversation(item)}
          />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="chatbubbles-outline" size={48} color={theme.colors.textMuted} />
            <Text style={styles.emptyText}>
              {activeTab === 'indbakke' ? 'Ingen beskeder' : 'Arkivet er tomt'}
            </Text>
          </View>
        }
        contentContainerStyle={conversations.length === 0 && styles.emptyContainer}
      />
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
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.deepTeal,
  },
  headerTitle: {
    fontFamily: theme.fonts.poppinsSemiBold,
    fontSize: theme.fontSizes.lg,
    color: theme.colors.white,
  },
  newButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingTop: theme.spacing.lg,
  },
  emptyText: {
    fontFamily: theme.fonts.interRegular,
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textMuted,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
});
