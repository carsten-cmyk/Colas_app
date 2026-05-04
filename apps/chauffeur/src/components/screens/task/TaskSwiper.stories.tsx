import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native';
import { TaskSwiper } from './TaskSwiper';
import { InfoCard } from '../../ui/InfoCard';
import { ContactCard } from '../../ui/ContactCard';

const meta: Meta<typeof TaskSwiper> = {
  title: 'Task/TaskSwiper',
  component: TaskSwiper,
};

export default meta;

export const ToKort: StoryObj = {
  render: () => (
    <TaskSwiper>
      <InfoCard title="Information" message="Dagens læs er klar på fabrikken." variant="info" />
      <ContactCard name="Henrik Thor" role="Projektleder" phone="2399 1448" imageUrl="https://i.pravatar.cc/150?img=11" />
    </TaskSwiper>
  ),
};

export const TreKort: StoryObj = {
  render: () => (
    <TaskSwiper>
      <InfoCard title="Advarsel" message="Der er registreret en trafikulykke på ruten." variant="danger" />
      <ContactCard name="Henrik Thor" role="Projektleder" phone="2399 1448" imageUrl="https://i.pravatar.cc/150?img=11" />
      <InfoCard title="Information" message="Husk frokostpause kl. 12." variant="info" />
    </TaskSwiper>
  ),
};

export const StartPaaIndex1: StoryObj = {
  render: () => (
    <TaskSwiper initialIndex={1}>
      <InfoCard title="Information" message="Dagens læs er klar på fabrikken." variant="info" />
      <ContactCard name="Henrik Thor" role="Projektleder" phone="2399 1448" imageUrl="https://i.pravatar.cc/150?img=11" />
    </TaskSwiper>
  ),
};

export const EtKort: StoryObj = {
  render: () => (
    <TaskSwiper>
      <InfoCard title="Information" message="Kun ét kort — ingen swipe mulig." variant="info" />
    </TaskSwiper>
  ),
};
