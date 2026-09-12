import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, StyleSheet, Platform, ActivityIndicator } from 'react-native';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { COLORS } from './src/utils/constants';

import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import GenerateSessionScreen from './src/screens/GenerateSessionScreen';
import ActiveRunScreen from './src/screens/ActiveRunScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import AchievementsScreen from './src/screens/AchievementsScreen';
import RunDetailScreen from './src/screens/RunDetailScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TabIcon = ({ icon, focused }) => (
  <View style={[styles.tabIconContainer, focused && styles.tabIconContainerFocused]}>
    <Text style={[styles.tabIcon, focused && styles.tabIconFocused]}>{icon}</Text>
  </View>
);

const MainTabs = ({ user }) => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: styles.tabLabel,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        initialParams={{ user }}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon icon="🏠" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Generate"
        component={GenerateSessionScreen}
        options={{
          tabBarLabel: 'Training',
          tabBarIcon: ({ focused }) => <TabIcon icon="⚡" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          tabBarLabel: 'History',
          tabBarIcon: ({ focused }) => <TabIcon icon="📊" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        initialParams={{ user }}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ focused }) => <TabIcon icon="⚙️" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  const { user, login, logout, loading } = useAuth();

  // Wait for the persisted session to load before deciding login vs app
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!user) {
    return <LoginScreen onLogin={login} />;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Main">
        {() => <MainTabs user={user} />}
      </Stack.Screen>
      <Stack.Screen
        name="ActiveRun"
        component={ActiveRunScreen}
        options={{ gestureEnabled: false }} // Prevent accidental swipe back during run
      />
      <Stack.Screen name="Achievements" component={AchievementsScreen} />
      <Stack.Screen name="RunDetail" component={RunDetailScreen} />
    </Stack.Navigator>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <StatusBar style="dark" />
        <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    height: Platform.OS === 'ios' ? 88 : 68,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    // Shadow for elevation effect
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 20,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
  },
  tabIconContainer: {
    width: 44,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  tabIconContainerFocused: {
    backgroundColor: '#EFF6FF', // Light blue highlight
  },
  tabIcon: {
    fontSize: 20,
    opacity: 0.7,
  },
  tabIconFocused: {
    opacity: 1,
    transform: [{ scale: 1.1 }],
  },
});
