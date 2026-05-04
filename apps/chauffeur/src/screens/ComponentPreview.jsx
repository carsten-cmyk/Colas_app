import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../config/theme';
import { OrderMetrics } from '../components/ui/OrderMetrics';
import { ContactCard } from '../components/ui/ContactCard';
import { InfoCard } from '../components/ui/InfoCard';
import { LocationCard } from '../components/ui/LocationCard';
import { ActionButton } from '../components/ui/ActionButton';
import { TransportIcon } from '../components/ui/TransportIcon';
import { BottomTabBar } from '../components/layout/BottomTabBar';
import { TaskSheet } from '../components/layout/TaskSheet';
import { TaskSwiper } from '../components/screens/task/TaskSwiper';
import { TaskDetailScreen } from './TaskDetailScreen';
import { DashboardHeader } from '../components/screens/dashboard/DashboardHeader';
import { ProjectImage } from '../components/ui/ProjectImage';
import { MessageWidget } from '../components/ui/MessageWidget';
import { ImageGrid } from '../components/screens/dashboard/ImageGrid';
import { SectionLabel } from '../components/ui/SectionLabel';
import { TaskCard } from '../components/ui/TaskCard';

// Skift her for at preview en anden komponent
const ACTIVE_COMPONENT = 'TaskCard';

const COMPONENTS = {
  OrderMetrics: {
    component: OrderMetrics,
    stories: [
      { name: 'Default', props: { ton: 75, produkt: '82101H', runder: 3, timer: 4 } },
      { name: 'Lang produktkode', props: { ton: 75, produkt: '82101H-SPECIAL-VARIANT', runder: 3, timer: 4 } },
      { name: 'Store tal', props: { ton: 1250, produkt: '99999Z', runder: 48, timer: 12 } },
      { name: 'Nul-værdier', props: { ton: 0, produkt: '—', runder: 0, timer: 0 } },
    ],
  },
  ContactCard: {
    component: ContactCard,
    stories: [
      { name: 'Med foto og rolle', props: { name: 'Henrik Thor', role: 'Projektleder', phone: '2399 1448', imageUrl: 'https://i.pravatar.cc/150?img=11' } },
      { name: 'Med foto, ingen rolle', props: { name: 'Ole Jensen', role: '-', phone: '2399 1443', imageUrl: 'https://i.pravatar.cc/150?img=53' } },
      { name: 'Uden foto (maskine)', props: { name: 'Fabrik Køge', role: '-', phone: '6020 1818', imageUrl: 'https://broken-url.invalid/img.jpg' } },
      { name: 'Ingen imageUrl', props: { name: 'Ukendt kontakt', role: 'Chauffør', phone: '2000 0000' } },
      { name: 'Langt navn', props: { name: 'Hans Christian Andersen-Nielsen', role: 'Projektleder og koordinator', phone: '2399 1448' } },
    ],
  },
  LocationCard: {
    component: LocationCard,
    stories: [
      { name: 'Pickup m. mødetid', props: { name: 'Køge Asfaltfabrik', address: 'Nordhavnsvej 9, 4600 Køge', meetingTime: '05.30', type: 'pickup' } },
      { name: 'Delivery u. mødetid', props: { name: 'Uddannelsescenter Syd', address: 'Søvej 6 D, 4900 Nakskov', type: 'delivery' } },
      { name: 'Langt navn', props: { name: 'Nordsjællands Asfalt & Belægningsfabrik ApS', address: 'Nordhavnsvej 9, 4600 Køge', meetingTime: '07.00', type: 'pickup' } },
      { name: 'Lang adresse', props: { name: 'Fabrik Syd', address: 'Erhvervsvej 12, Industrikvarteret Nord, 2600 Glostrup', type: 'delivery' } },
    ],
  },
  BottomTabBar: {
    component: BottomTabBar,
    stories: [
      { name: 'Start', props: { activeTab: 'start', onTabPress: () => {} } },
      { name: 'Opgaver', props: { activeTab: 'opgaver', onTabPress: () => {} } },
      { name: 'Beskeder', props: { activeTab: 'beskeder', onTabPress: () => {} } },
      { name: 'Timereg', props: { activeTab: 'timereg', onTabPress: () => {} } },
      { name: 'Kontakt', props: { activeTab: 'kontakt', onTabPress: () => {} } },
    ],
  },
  MessageWidget: {
    component: ({ count, onPress }) => (
      <View style={{ width: 180, height: 180 }}>
        <MessageWidget count={count} onPress={onPress} style={{ flex: 1 }} />
      </View>
    ),
    stories: [
      { name: '1 besked', props: { count: 1, onPress: () => {} } },
      { name: 'Flere beskeder', props: { count: 3, onPress: () => {} } },
      { name: 'Ingen beskeder', props: { count: 0, onPress: () => {} } },
    ],
  },
  TaskCard: {
    component: ({ task, onPress }) => (
      <View style={{ height: 220, width: '100%', paddingHorizontal: 16 }}>
        <TaskCard task={task} onPress={onPress} />
      </View>
    ),
    stories: [
      { name: 'Default', props: {
        task: { id: '1', orderNumber: '1212343', ton: 75, produkt: '82101H', runder: 3, timer: 4,
          locations: [
            { name: 'Køge Asfaltfabrik', address: 'Nordhavnsvej 9, 4600 Køge', meetingTime: '05.30', type: 'pickup' },
            { name: 'Uddannelsescenter Syd, Lolland', address: 'Søvej 6 D, 4900 Nakskov', type: 'delivery' },
          ],
          contacts: [], alerts: [], state: 'idle' },
        onPress: () => {},
      }},
      { name: 'Langt navn', props: {
        task: { id: '2', orderNumber: '9988776', ton: 120, produkt: '99999Z', runder: 6, timer: 8,
          locations: [
            { name: 'Asfaltfabrikken Nordsjælland', address: 'Fabriksvej 1, 3400 Hillerød', meetingTime: '07.00', type: 'pickup' },
            { name: 'Motorvej E47, Afkørsel 28 Sydmotorvejen', address: 'E47, 4800 Nykøbing F', type: 'delivery' },
          ],
          contacts: [], alerts: [], state: 'active' },
        onPress: () => {},
      }},
    ],
  },
  SectionLabel: {
    component: ({ label }) => (
      <View style={{ backgroundColor: theme.colors.deepTeal, padding: theme.spacing.sm, width: '100%' }}>
        <SectionLabel label={label} />
      </View>
    ),
    stories: [
      { name: 'Default', props: { label: 'Dagens opgaver' } },
      { name: 'Lang tekst', props: { label: 'Alle opgaver for i dag og i morgen' } },
    ],
  },
  ImageGrid: {
    component: ImageGrid,
    stories: [
      { name: 'Default', props: {
        images: [
          { uri: 'https://picsum.photos/seed/road/400/800' },
          { uri: 'https://picsum.photos/seed/worker/400/400' },
        ],
        messageCount: 1,
        onMessagePress: () => {},
      }},
      { name: 'Flere beskeder', props: {
        images: [
          { uri: 'https://picsum.photos/seed/road/400/800' },
          { uri: 'https://picsum.photos/seed/worker/400/400' },
        ],
        messageCount: 3,
        onMessagePress: () => {},
      }},
    ],
  },
  ProjectImage: {
    component: ProjectImage,
    stories: [
      { name: 'Kvadratisk', props: { source: { uri: 'https://picsum.photos/400/400' }, aspectRatio: 1 } },
      { name: 'Rektangulær (portrait)', props: { source: { uri: 'https://picsum.photos/400/600' }, aspectRatio: 0.75 } },
    ],
  },
  TransportIcon: {
    component: TransportIcon,
    stories: [
      { name: 'Default', props: {} },
    ],
  },
  ActionButton: {
    component: ActionButton,
    stories: [
      { name: 'Start', props: { variant: 'start', label: 'Start opgave', onPress: () => {} } },
      { name: 'Pause', props: { variant: 'pause', label: 'Pause opgave', onPress: () => {} } },
      { name: 'Stop', props: { variant: 'stop', label: 'Afslut opgave', onPress: () => {} } },
      { name: 'Disabled', props: { variant: 'start', label: 'Start opgave', onPress: () => {}, disabled: true } },
    ],
  },
  InfoCard: {
    component: InfoCard,
    stories: [
      { name: 'Danger', props: { title: 'Information', message: 'Der er registreret en trafikulykke på ruten. Forvent forsinkelser og følg anvisninger fra vejmyndighed.', variant: 'danger' } },
      { name: 'Info', props: { title: 'Information', message: 'Dagens læs er klar på fabrikken. Husk at tjekke ind ved ankomst.', variant: 'info' } },
      { name: 'Warning', props: { title: 'Bemærk', message: 'Glatte veje på grund af frost. Kør forsigtigt og hold afstand.', variant: 'warning' } },
      { name: 'Lang tekst', props: { title: 'Information', message: 'Der er registreret en alvorlig trafikulykke på motorvejen. Ruten er spærret i begge retninger. Politiet er på stedet og forventer at åbne vejen igen om 2-3 timer. Brug alternativ rute via Køgevej og følg GPS-anvisninger. Kontakt formanden ved behov.', variant: 'danger' } },
      { name: 'Kort tekst', props: { title: 'Information', message: 'Husk frokostpause kl. 12.', variant: 'info' } },
    ],
  },
};

// 3 kontakter der altid vises sammen i canvas (som Figma-designet)
const CONTACT_PREVIEW = [
  { name: 'Henrik Thor', role: 'Projektleder', phone: '2399 1448', imageUrl: 'https://i.pravatar.cc/150?img=11' },
  { name: 'Ole Jensen', role: 'Formand', phone: '2399 1443', imageUrl: 'https://i.pravatar.cc/150?img=53' },
  { name: 'Fabrik Køge', role: '-', phone: '6020 1818' },
];

function TaskSwiperPreview() {
  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Component Preview</Text>
        <Text style={styles.headerSub}>TaskSwiper</Text>
      </View>
      <TaskSwiper>
        <InfoCard title="Information" message="Dagens læs er klar på fabrikken. Husk at tjekke ind ved ankomst." variant="info" />
        <InfoCard title="Advarsel" message="Der er registreret en trafikulykke på ruten. Forvent forsinkelser." variant="danger" />
        <InfoCard title="Bemærk" message="Glatte veje på grund af frost. Kør forsigtigt." variant="warning" />
      </TaskSwiper>
    </SafeAreaView>
  );
}

function TaskSheetPreview() {
  const [visible, setVisible] = useState(true);
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.darkTeal }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Component Preview</Text>
          <Text style={styles.headerSub}>TaskSheet</Text>
        </View>
        {!visible && (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <TouchableOpacity style={styles.reopenButton} onPress={() => setVisible(true)}>
              <Text style={styles.reopenLabel}>Åbn TaskSheet</Text>
            </TouchableOpacity>
          </View>
        )}
        <TaskSheet
          orderNumber="Ordrenummer 1212343"
          visible={visible}
          onClose={() => setVisible(false)}
        >
          <OrderMetrics ton={75} produkt="82101H" runder={3} timer={4} />
        </TaskSheet>
      </SafeAreaView>
    </View>
  );
}

function DashboardHeaderPreview() {
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.deepTeal }}>
      <SafeAreaView>
        <DashboardHeader />
      </SafeAreaView>
    </View>
  );
}

function TaskDetailScreenPreview() {
  const [visible, setVisible] = useState(true);
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.darkTeal }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Component Preview</Text>
          <Text style={styles.headerSub}>TaskDetailScreen</Text>
        </View>
        {!visible && (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <TouchableOpacity style={styles.reopenButton} onPress={() => setVisible(true)}>
              <Text style={styles.reopenLabel}>Åbn TaskDetailScreen</Text>
            </TouchableOpacity>
          </View>
        )}
        {visible && (
          <TaskDetailScreen id="1" onClose={() => setVisible(false)} />
        )}
      </SafeAreaView>
    </View>
  );
}

export function ComponentPreview() {
  const [activeStory, setActiveStory] = useState(0);

  if (ACTIVE_COMPONENT === 'DashboardHeader') {
    return <DashboardHeaderPreview />;
  }

  if (ACTIVE_COMPONENT === 'TaskDetailScreen') {
    return <TaskDetailScreenPreview />;
  }

  if (ACTIVE_COMPONENT === 'TaskSwiper') {
    return <TaskSwiperPreview />;
  }

  if (ACTIVE_COMPONENT === 'TaskSheet') {
    return <TaskSheetPreview />;
  }

  const STORIES = COMPONENTS[ACTIVE_COMPONENT].stories;

  return (
    <SafeAreaView style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Component Preview</Text>
        <Text style={styles.headerSub}>{ACTIVE_COMPONENT}</Text>
      </View>

      {/* Story tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabs}
        contentContainerStyle={styles.tabsContent}
      >
        {STORIES.map((story, i) => (
          <TouchableOpacity
            key={story.name}
            style={[styles.tab, activeStory === i && styles.tabActive]}
            onPress={() => setActiveStory(i)}
          >
            <Text style={[styles.tabLabel, activeStory === i && styles.tabLabelActive]}>
              {story.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Preview area */}
      <View style={styles.canvas}>
        {ACTIVE_COMPONENT === 'ContactCard' ? (
          <View style={styles.contactCard}>
            {CONTACT_PREVIEW.map((contact, i) => (
              <React.Fragment key={contact.name}>
                {i > 0 && <View style={styles.contactDivider} />}
                <ContactCard {...contact} />
              </React.Fragment>
            ))}
          </View>
        ) : ACTIVE_COMPONENT === 'BottomTabBar' ? (
          <View style={styles.tabBarCanvas}>
            {React.createElement(COMPONENTS[ACTIVE_COMPONENT].component, STORIES[activeStory].props)}
          </View>
        ) : ACTIVE_COMPONENT === 'ActionButton' ? (
          <View style={styles.infoCardCanvas}>
            {React.createElement(COMPONENTS[ACTIVE_COMPONENT].component, STORIES[activeStory].props)}
          </View>
        ) : ACTIVE_COMPONENT === 'InfoCard' || ACTIVE_COMPONENT === 'LocationCard' ? (
          <View style={styles.infoCardCanvas}>
            {React.createElement(COMPONENTS[ACTIVE_COMPONENT].component, STORIES[activeStory].props)}
          </View>
        ) : (
          React.createElement(COMPONENTS[ACTIVE_COMPONENT].component, STORIES[activeStory].props)
        )}
      </View>

      {/* Props inspector */}
      <View style={styles.inspector}>
        <Text style={styles.inspectorTitle}>Props</Text>
        {Object.entries(STORIES[activeStory].props).map(([key, val]) => (
          <View key={key} style={styles.propRow}>
            <Text style={styles.propKey}>{key}</Text>
            <Text style={styles.propValue}>{String(val)}</Text>
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.softGray,
  },
  header: {
    paddingHorizontal: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.xs,
    backgroundColor: theme.colors.darkTeal,
  },
  headerTitle: {
    fontFamily: theme.fonts.interMedium,
    fontSize: theme.fontSizes.xs,
    color: theme.colors.lightAqua,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  headerSub: {
    fontFamily: theme.fonts.poppinsSemiBold,
    fontSize: theme.fontSizes.xl,
    color: theme.colors.white,
    marginTop: 2,
  },
  tabs: {
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.boxOutline,
  },
  tabsContent: {
    paddingHorizontal: theme.spacing.sm,
    gap: 4,
    alignItems: 'center',
    height: 44,
  },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.md,
  },
  tabActive: {
    backgroundColor: theme.colors.softAqua,
  },
  tabLabel: {
    fontFamily: theme.fonts.interRegular,
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textMuted,
  },
  tabLabelActive: {
    fontFamily: theme.fonts.interMedium,
    color: theme.colors.darkTeal,
  },
  canvas: {
    flex: 1,
    backgroundColor: theme.colors.softAqua,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.sm,
  },
  infoCardCanvas: {
    width: '100%',
    paddingHorizontal: theme.spacing.sm,
  },
  tabBarCanvas: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.boxOutline,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  contactDivider: {
    width: 1,
    height: 80,
    backgroundColor: theme.colors.boxOutline,
  },
  inspector: {
    backgroundColor: theme.colors.white,
    borderTopWidth: 1,
    borderTopColor: theme.colors.boxOutline,
    padding: theme.spacing.sm,
  },
  inspectorTitle: {
    fontFamily: theme.fonts.interMedium,
    fontSize: theme.fontSizes.xs,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: theme.spacing.xs,
  },
  propRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.softGray,
  },
  propKey: {
    fontFamily: theme.fonts.interMedium,
    fontSize: theme.fontSizes.sm,
    color: theme.colors.deepTeal,
  },
  propValue: {
    fontFamily: theme.fonts.interRegular,
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textSecondary,
  },
  reopenButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.softAqua,
    borderRadius: theme.borderRadius.lg,
  },
  reopenLabel: {
    fontFamily: theme.fonts.interMedium,
    fontSize: theme.fontSizes.sm,
    color: theme.colors.deepTeal,
  },
});
