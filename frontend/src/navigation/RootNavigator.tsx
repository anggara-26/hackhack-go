import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { observer } from 'mobx-react-lite';

// Screens
import SplashScreen from '../screens/SplashScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import HomeScreen from '../screens/HomeScreen';
import CameraScreen from '../screens/CameraScreen';
import PhotoPreviewScreen from '../screens/PhotoPreviewScreen';
import ArtifactResultScreen from '../screens/ArtifactResultScreen';
import ChatScreen from '../screens/ChatScreen';
import HistoryScreen from '../screens/HistoryScreen';
import ProfileScreen from '../screens/ProfileScreen';

// Services
import StorageService from '../services/storage';

// Stores
import { useAuthStore } from '../stores/StoreProvider';

// Types
import { RootStackParamList, MainTabParamList } from '../types';

// Icons
import { Camera, GalleryHorizontalEnd, House, User } from 'lucide-react-native';

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Main Tab Navigator
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e5e5e5',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Beranda',
          tabBarIcon: ({ color, size, focused }) => (
            <House fill={focused ? color : 'transparent'} />
          ),
        }}
      />
      <Tab.Screen
        name="Camera"
        component={CameraScreen}
        options={{
          tabBarLabel: 'Kamera',
          tabBarIcon: ({ color, size, focused }) => (
            <Camera fill={focused ? color : 'transparent'} />
          ),
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          tabBarLabel: 'Riwayat',
          tabBarIcon: ({ color, size, focused }) => (
            <GalleryHorizontalEnd fill={focused ? color : 'transparent'} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profil',
          tabBarIcon: ({ color, size, focused }) => (
            <User fill={focused ? color : 'transparent'} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// Auth Stack Navigator
function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#fff' },
        animationTypeForReplace: 'push',
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
}

// Root Navigator
const RootNavigator = observer(() => {
  const authStore = useAuthStore();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      // Check if onboarding is completed
      const onboardingCompleted = await StorageService.isOnboardingCompleted();

      if (!onboardingCompleted) {
        setShowOnboarding(true);
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
    } finally {
      setInitialCheckDone(true);
    }
  };

  const handleOnboardingComplete = async () => {
    await StorageService.setOnboardingCompleted(true);
    setShowOnboarding(false);
  };

  // Show splash screen while loading
  if (!initialCheckDone || authStore.isLoading) {
    return (
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Splash" component={SplashScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: '#fff' },
        }}
      >
        {showOnboarding ? (
          <Stack.Screen
            name="Onboarding"
            component={OnboardingScreen}
            initialParams={{ onComplete: () => setShowOnboarding(false) }}
          />
        ) : authStore.isAuthenticated ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen
              name="PhotoPreview"
              component={PhotoPreviewScreen}
              options={{
                presentation: 'modal',
                cardStyle: { backgroundColor: '#000' },
              }}
            />
            <Stack.Screen
              name="ArtifactResult"
              component={ArtifactResultScreen}
              options={{
                headerShown: true,
                title: 'Hasil Identifikasi',
                headerBackTitleVisible: false,
                headerTintColor: '#6366f1',
              }}
            />
            <Stack.Screen
              name="Chat"
              component={ChatScreen}
              options={{
                headerShown: true,
                title: 'Chat dengan Artefak',
                headerTintColor: '#6366f1',
              }}
            />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthStack} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
});

export default RootNavigator;
