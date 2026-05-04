import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { TaskSheet } from '../components/layout/TaskSheet';
import { OrderMetrics } from '../components/ui/OrderMetrics';
import { LocationCard } from '../components/ui/LocationCard';
import { ContactCard } from '../components/ui/ContactCard';
import { InfoCard } from '../components/ui/InfoCard';
import { TransportIcon } from '../components/ui/TransportIcon';
import { TaskSkeleton } from '../components/ui/TaskSkeleton';
import { ErrorBanner } from '../components/ui/ErrorBanner';
import { TaskSwiper } from '../components/screens/task/TaskSwiper';
import { TaskActions } from '../components/screens/task/TaskActions';
import { BottomTabBar, TabName } from '../components/layout/BottomTabBar';
import { useTask } from '../hooks/useTask';
import { TaskState } from '../types/task';
import { theme } from '../config/theme';

export interface TaskDetailScreenProps {
  /** Opgavens unikke ID — matches Task.id i types/task.ts */
  id: string;
  onClose: () => void;
}

export function TaskDetailScreen({ id, onClose }: TaskDetailScreenProps) {
  const { data: task, loading, error } = useTask(id);
  const [taskState, setTaskState] = useState<TaskState>('idle');
  const [activeTab, setActiveTab] = useState<TabName>('opgaver');

  useEffect(() => {
    if (task?.state) setTaskState(task.state);
  }, [task?.state]);

  if (loading) {
    return (
      <TaskSheet orderNumber="Indlæser..." onClose={onClose} visible={true}>
        <TaskSkeleton />
      </TaskSheet>
    );
  }

  if (error || !task) {
    return <ErrorBanner message={error ?? 'Opgaven kunne ikke hentes.'} onRetry={onClose} />;
  }

  const [pickup, delivery] = task.locations;
  if (!pickup || !delivery) {
    return <ErrorBanner message="Opgaven mangler lokationsdata." onRetry={onClose} />;
  }

  const infoAlerts = task.alerts.filter(a => a.type !== 'traffic');
  const dangerAlerts = task.alerts.filter(a => a.type === 'traffic');

  return (
    <TaskSheet
      orderNumber={`Ordrenummer ${task.orderNumber}`}
      onClose={onClose}
      visible={true}
      footer={
        <TaskActions
          state={taskState === 'completed' ? 'idle' : taskState}
          onStart={() => setTaskState('active')}
          onPause={() => setTaskState('paused')}
          onComplete={onClose}
        />
      }
      tabBar={
        <BottomTabBar activeTab={activeTab} onTabPress={setActiveTab} />
      }
    >
      {/* Sektion 1: Ordre metrics */}
      <OrderMetrics
        ton={task.ton}
        produkt={task.produkt}
        runder={task.runder}
        timer={task.timer}
      />

      {/* Sektion 2: Lokationer */}
      <View style={styles.locations}>
        <LocationCard {...pickup} />
        <View style={styles.transportIcon}>
          <TransportIcon />
        </View>
        <LocationCard {...delivery} />
      </View>

      {/* Sektion 3: Horisontal swipe
          Rækkefølge: hvide infokort → kontaktkort → røde alerts */}
      <TaskSwiper initialIndex={0}>
        {/* Hvide infokort — venstre */}
        {infoAlerts.map(alert => (
          <InfoCard
            key={alert.id}
            variant="info"
            title="Information"
            message={alert.message}
          />
        ))}

        {/* Kontaktkort — ét kort med alle kontakter, hver centreret i sin søjle */}
        {task.contacts.length > 0 && (
          <View style={styles.contactsCard}>
            {task.contacts.map((contact, i) => (
              <React.Fragment key={contact.id}>
                {i > 0 && <View style={styles.contactDivider} />}
                <View style={styles.contactColumn}>
                  <ContactCard {...contact} />
                </View>
              </React.Fragment>
            ))}
          </View>
        )}

        {/* Røde trafikvarsler — højre */}
        {dangerAlerts.map(alert => (
          <InfoCard
            key={alert.id}
            variant="danger"
            title="Trafikvarsel"
            message={alert.message}
          />
        ))}
      </TaskSwiper>
    </TaskSheet>
  );
}

const styles = StyleSheet.create({
  locations: {
    gap: theme.spacing.xs,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  transportIcon: {
    alignItems: 'center',
  },
  contactsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xxl,
    borderWidth: 1,
    borderColor: theme.colors.boxOutline,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.sm,
    height: theme.cardHeight.info,
  },
  contactDivider: {
    width: 1,
    height: theme.cardHeight.contactDivider,
    backgroundColor: theme.colors.boxOutline,
  },
  contactColumn: {
    flex: 1,
    alignItems: 'center',
  },
});
