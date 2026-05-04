import { registerRootComponent } from 'expo';

const STORYBOOK = process.env.EXPO_PUBLIC_STORYBOOK_ENABLED === 'true';

const RootComponent = STORYBOOK
  ? require('./.rnstorybook').default
  : require('./App').default;

registerRootComponent(RootComponent);
