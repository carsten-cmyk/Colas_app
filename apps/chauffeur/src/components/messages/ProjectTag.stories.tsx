import type { Meta, StoryObj } from '@storybook/react-native';
import { ProjectTag } from './ProjectTag';

const meta: Meta<typeof ProjectTag> = {
  title: 'Messages/ProjectTag',
  component: ProjectTag,
};

export default meta;
type Story = StoryObj<typeof ProjectTag>;

export const MedNavn: Story = {
  args: {
    orderNumber: '1212343',
    name: 'Uddannelsescenter Syd',
    size: 'md',
  },
};

export const KunNummer: Story = {
  args: {
    orderNumber: '1212343',
    size: 'md',
  },
};

export const Lille: Story = {
  args: {
    orderNumber: '1212343',
    name: 'Uddannelsescenter Syd',
    size: 'sm',
  },
};

export const LangtNavn: Story = {
  args: {
    orderNumber: '9900123',
    name: 'Sydmotorvejen E47 – Nykøbing F',
    size: 'md',
  },
};
