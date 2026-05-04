import type { Meta, StoryObj } from '@storybook/react-native';
import { ErrorBanner } from './ErrorBanner';

const meta: Meta<typeof ErrorBanner> = {
  title: 'UI/ErrorBanner',
  component: ErrorBanner,
  argTypes: {
    onRetry: { action: 'retry' },
  },
};

export default meta;
type Story = StoryObj<typeof ErrorBanner>;

export const UdenRetry: Story = {
  args: {
    message: 'Der opstod en fejl. Prøv igen senere.',
  },
};

export const MedRetry: Story = {
  args: {
    message: 'Kunne ikke hente opgaver.',
    onRetry: () => {},
  },
};

export const LangBesked: Story = {
  args: {
    message: 'Forbindelsen til serveren kunne ikke oprettes. Tjek din internetforbindelse og prøv igen.',
    onRetry: () => {},
  },
};
