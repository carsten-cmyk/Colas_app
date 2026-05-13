import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ActionButton } from '../../ui/ActionButton';
import { theme } from '../../../config/theme';

export interface TaskActionsProps {
  state: 'idle' | 'active' | 'paused';
  onStart: () => void;
  onPause: () => void;
  onComplete: () => void;
}

export function TaskActions({ state, onStart, onPause, onComplete }: TaskActionsProps) {
  return (
    <View style={styles.container}>
      {state === 'idle' && (
        <ActionButton variant="start" label="Start opgave" onPress={onStart} />
      )}
      {state === 'active' && (
        <>
          <ActionButton variant="pause" label="Pause opgave" onPress={onPause} />
          <ActionButton variant="stop" label="Afslut opgave" onPress={onComplete} />
        </>
      )}
      {state === 'paused' && (
        <>
          <ActionButton variant="start" label="Start opgave" onPress={onStart} />
          <ActionButton variant="stop" label="Afslut opgave" onPress={onComplete} />
        </>
      )}
      {state !== 'idle' && state !== 'active' && state !== 'paused' && (
        <ActionButton variant="start" label="Start opgave" onPress={onStart} disabled={true} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    paddingBottom: theme.spacing.md,
    paddingTop: theme.spacing.xs,
  },
});
