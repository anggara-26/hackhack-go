/**
 * Museyo - React Native App
 * Artifact identification and chat with AI
 */

import React from 'react';
import { StatusBar } from 'react-native';
import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import RootNavigator from './src/navigation/RootNavigator';
import { StoreProvider } from './src/stores/StoreProvider';
import './global.css';

function App() {
  return (
    <StoreProvider>
      <GluestackUIProvider mode="light">
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <RootNavigator />
      </GluestackUIProvider>
    </StoreProvider>
  );
}

export default App;
