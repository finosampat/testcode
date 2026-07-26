import { NotoSerifDevanagari_400Regular, useFonts } from '@expo-google-fonts/noto-serif-devanagari';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ReadingSettingsProvider, useReadingSettings } from './src/lib/reading-settings';
import type { RootStackParamList } from './src/navigation';
import { CategoryScreen } from './src/screens/CategoryScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { ReaderScreen } from './src/screens/ReaderScreen';
import { SearchScreen } from './src/screens/SearchScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

function Navigation() {
  const { theme, ready } = useReadingSettings();
  const [fontsLoaded] = useFonts({ NotoSerifDevanagari_400Regular });

  if (!ready || !fontsLoaded) {
    return (
      <View style={{ alignItems: 'center', backgroundColor: theme.background, flex: 1, justifyContent: 'center' }}>
        <ActivityIndicator color={theme.accent} />
      </View>
    );
  }

  const navigationTheme = theme.name === 'dark' ? DarkTheme : DefaultTheme;
  return (
    <NavigationContainer
      theme={{
        ...navigationTheme,
        colors: {
          ...navigationTheme.colors,
          background: theme.background,
          card: theme.surface,
          text: theme.text,
          border: theme.border,
          primary: theme.accent,
        },
      }}
    >
      <StatusBar style={theme.name === 'dark' ? 'light' : 'dark'} />
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Library' }} />
        <Stack.Screen name="Category" component={CategoryScreen} />
        <Stack.Screen name="Reader" component={ReaderScreen} />
        <Stack.Screen name="Search" component={SearchScreen} options={{ title: 'Full-text search' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ReadingSettingsProvider>
        <Navigation />
      </ReadingSettingsProvider>
    </SafeAreaProvider>
  );
}
