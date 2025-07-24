/**
 * Museum AI - React Native App
 * Artifact identification and chat with AI
 */

import React from 'react';
import { StatusBar } from 'react-native';
import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import RootNavigator from './src/navigation/RootNavigator';
import './global.css';

function App() {
  return (
    <GluestackUIProvider mode="light">
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <RootNavigator />
    </GluestackUIProvider>
  );
}

export default App;
