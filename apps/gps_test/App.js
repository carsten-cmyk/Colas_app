import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { View } from 'react-native';

import SplashScreen from './src/screens/SplashScreen';
import InputScreen from './src/screens/InputScreen';
import TrackingScreen from './src/screens/TrackingScreen';
import ResultScreen from './src/screens/ResultScreen';

// Toggle this to switch between Storybook and the main app
const SHOW_STORYBOOK = true;

let StorybookUI;
if (SHOW_STORYBOOK) {
  StorybookUI = require('./.rnstorybook/Storybook').default;
}

export default function App() {
  if (SHOW_STORYBOOK && StorybookUI) {
    return <StorybookUI />;
  }
  const [currentScreen, setCurrentScreen] = useState('Splash');
  const [screenParams, setScreenParams] = useState({});

  // Simple navigation function
  const navigate = (screen, params = {}) => {
    setScreenParams(params);
    setCurrentScreen(screen);
  };

  // Go back function
  const goBack = () => {
    setCurrentScreen('Input');
    setScreenParams({});
  };

  // Render current screen
  const renderScreen = () => {
    const navigation = { navigate, goBack };
    const route = { params: screenParams };

    switch (currentScreen) {
      case 'Splash':
        return <SplashScreen navigation={navigation} />;
      case 'Input':
        return <InputScreen navigation={navigation} route={route} />;
      case 'Tracking':
        return <TrackingScreen navigation={navigation} route={route} />;
      case 'Result':
        return <ResultScreen navigation={navigation} route={route} />;
      default:
        return <SplashScreen navigation={navigation} />;
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="auto" />
      {renderScreen()}
    </View>
  );
}
