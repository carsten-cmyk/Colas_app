import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DashboardHeader } from '@/components/screens/dashboard/DashboardHeader';
import { ImageGrid } from '@/components/screens/dashboard/ImageGrid';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { TaskSwiper } from '@/components/screens/task/TaskSwiper';
import { TaskCard } from '@/components/ui/TaskCard';
import { BottomTabBar, TabName } from '@/components/layout/BottomTabBar';
import { TaskDetailScreen } from './TaskDetailScreen';
import { MessagesListScreen } from './MessagesListScreen';
import { ConversationScreen } from './ConversationScreen';
import { NewMessageScreen } from './NewMessageScreen';
import { theme } from '@/config/theme';
import { mockConversations } from '@/mocks/messages';
import { Conversation } from '@/types/messages';
// TODO: Erstat med Supabase realtime subscription
import { mockTasks } from '@/mocks/tasks';

// TODO: Erstat med Supabase realtime subscription — hent fra beskeder-tabel
const MESSAGE_COUNT = mockConversations.filter(
  c => !c.lastMessage.isRead && c.lastMessage.senderId !== 'me'
).length;

// TODO: Erstat med rigtige projektbilleder fra Supabase Storage
const PROJECT_IMAGES = [
  require('../../assets/venstre_aflang.png'),
  require('../../assets/hoejre_lille.png'),
];

type MessagesView = 'list' | 'conversation' | 'new';

export function DashboardScreen() {
  const [activeTab, setActiveTab] = useState<TabName>('start');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [messagesView, setMessagesView] = useState<MessagesView>('list');
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  const handleTabPress = (tab: TabName) => {
    setActiveTab(tab);
    if (tab === 'beskeder') setMessagesView('list');
  };

  if (activeTab === 'beskeder') {
    if (messagesView === 'conversation' && selectedConversation) {
      return (
        <ConversationScreen
          conversation={selectedConversation}
          onBack={() => setMessagesView('list')}
        />
      );
    }
    if (messagesView === 'new') {
      return (
        <NewMessageScreen
          onCancel={() => setMessagesView('list')}
          onSend={() => setMessagesView('list')}
        />
      );
    }
    return (
      <View style={styles.messagesRoot}>
        <MessagesListScreen
          onOpenConversation={c => { setSelectedConversation(c); setMessagesView('conversation'); }}
          onNewMessage={() => setMessagesView('new')}
        />
        <BottomTabBar activeTab={activeTab} onTabPress={handleTabPress} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <DashboardHeader />

        <View style={styles.imageGrid}>
          <ImageGrid
            images={PROJECT_IMAGES}
            messageCount={MESSAGE_COUNT}
            onMessagePress={() => handleTabPress('beskeder')}
          />
        </View>

        <View style={styles.sectionLabel}>
          <SectionLabel label="Dagens opgaver" />
        </View>

        <TaskSwiper cardHeight={theme.cardHeight.task}>
          {mockTasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onPress={() => setSelectedTaskId(task.id)}
            />
          ))}
        </TaskSwiper>

      </ScrollView>

      <BottomTabBar activeTab={activeTab} onTabPress={handleTabPress} />

      {selectedTaskId && (
        <TaskDetailScreen
          id={selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
        />
      )}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  messagesRoot: {
    flex: 1,
  },
  root: {
    flex: 1,
    backgroundColor: theme.colors.darkTeal,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingBottom: theme.spacing.md,
  },
  imageGrid: {
    paddingHorizontal: theme.taskSwiper.sidePeek,
  },
  sectionLabel: {
    paddingTop: theme.spacing.xs,
    paddingHorizontal: theme.taskSwiper.sidePeek,
  },
});
