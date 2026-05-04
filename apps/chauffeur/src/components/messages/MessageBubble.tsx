import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '@/config/theme';
import { Message } from '@/types/messages';
import { formatMessageTime } from '@/lib/messageUtils';

export interface MessageBubbleProps {
  message: Message;
  isSent: boolean;
}

export function MessageBubble({ message, isSent }: MessageBubbleProps) {
  return (
    <View style={[styles.wrapper, isSent ? styles.wrapperSent : styles.wrapperReceived]}>
      <View style={[styles.bubble, isSent ? styles.bubbleSent : styles.bubbleReceived]}>
        <Text style={[styles.content, isSent ? styles.contentSent : styles.contentReceived]}>
          {message.content}
        </Text>
      </View>
      <Text style={[styles.timestamp, isSent ? styles.timestampSent : styles.timestampReceived]}>
        {formatMessageTime(message.timestamp)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    maxWidth: '80%',
    marginVertical: theme.spacing.xxxs,
  },
  wrapperSent: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  wrapperReceived: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  bubble: {
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  bubbleSent: {
    backgroundColor: theme.colors.success,
    borderBottomRightRadius: theme.borderRadius.sm,
  },
  bubbleReceived: {
    backgroundColor: theme.colors.white,
    borderBottomLeftRadius: theme.borderRadius.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  content: {
    fontSize: theme.fontSizes.sm,
    lineHeight: 20,
  },
  contentSent: {
    fontFamily: theme.fonts.interRegular,
    color: theme.colors.textPrimary,
  },
  contentReceived: {
    fontFamily: theme.fonts.interRegular,
    color: theme.colors.textPrimary,
  },
  timestamp: {
    fontFamily: theme.fonts.interRegular,
    fontSize: 10,
    color: theme.colors.textMuted,
    marginTop: 2,
    marginHorizontal: theme.spacing.xxxs,
  },
  timestampSent: {},
  timestampReceived: {},
});
