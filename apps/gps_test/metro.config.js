const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: true,
  },
});

config.resolver.resolverMainFields = ['sbmodern', 'react-native', 'browser', 'main'];

// Monorepo-fix: Storybook er hoisted til Colas/node_modules og bruger sin
// egen React (19.2.4) mens appen har 19.1.0 => duplicate React => hook crash.
//
// resolveRequest tvinger React og react-native til ALTID at komme fra
// denne apps node_modules, uanset hvem der importerer dem.
const localNodeModules = path.resolve(__dirname, 'node_modules');

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'react' || moduleName === 'react-native') {
    const resolved = require.resolve(moduleName, { paths: [localNodeModules] });
    return { filePath: resolved, type: 'sourceFile' };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
