const { getDefaultConfig } = require('expo/metro-config');
const { withStorybook } = require('@storybook/react-native/metro/withStorybook');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver.resolverMainFields = ['sbmodern', 'react-native', 'browser', 'main'];

// Monorepo-fix: tving React og react-native til at komme fra denne apps
// node_modules — undgår duplicate React fra Colas/node_modules/
const localNodeModules = path.resolve(__dirname, 'node_modules');

const FORCED_LOCAL = ['react', 'react-native', 'react-native-reanimated', 'react-native-worklets'];

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (FORCED_LOCAL.some(m => moduleName === m || moduleName.startsWith(m + '/'))) {
    const resolved = require.resolve(moduleName, { paths: [localNodeModules] });
    return { filePath: resolved, type: 'sourceFile' };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withStorybook(config, {
  enabled: process.env.EXPO_PUBLIC_STORYBOOK_ENABLED === 'true',
  configPath: path.resolve(__dirname, './.rnstorybook'),
});
