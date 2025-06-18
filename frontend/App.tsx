import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemeProvider } from "@rneui/themed";
import { AuthProvider, useAuth } from "./src/contexts/AuthContext";
import { PortfolioProvider } from "./src/contexts/PortfolioContext";
import { storage, STORAGE_KEYS } from "./src/utils/storage";
import LoginScreen from "./src/screens/LoginScreen";
import { OnboardingScreen } from "./src/screens/OnboardingScreen";
import { DashboardScreen } from "./src/screens/DashboardScreen";
import { PortfolioScreen } from "./src/screens/PortfolioScreen";
import { AssetsScreen } from "./src/screens/AssetsScreen";
import { CreatePortfolioScreen } from "./src/screens/CreatePortfolioScreen";
import { BottomNav } from "./src/components/BottomNav";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props: BottomTabBarProps) => (
        <BottomNav
          currentRoute={props.state.routeNames[props.state.index]}
          onNavigate={(routeName) => props.navigation.navigate(routeName)}
        />
      )}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen
        name="Portfolio"
        component={PortfolioScreen}
        options={{
          headerShown: true,
          headerTitle: "",
          headerTransparent: true,
        }}
      />
      <Tab.Screen
        name="Assets"
        component={AssetsScreen}
        options={{
          headerShown: true,
          headerTitle: "",
          headerTransparent: true,
        }}
      />
    </Tab.Navigator>
  );
}

function Navigation() {
  const { user, isLoading, isOnboardingComplete } = useAuth();

  if (isLoading) {
    return null; // Or a loading screen
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "transparent" },
        }}
      >
        {!user ? (
          // Auth Stack
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : !isOnboardingComplete ? (
          // Onboarding Stack
          <Stack.Screen 
            name="Onboarding" 
            component={OnboardingScreen}
            options={{ gestureEnabled: false }}
          />
        ) : (
          // Main App Stack
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen
              name="Portfolio"
              component={PortfolioScreen}
              options={{
                presentation: "modal",
                headerShown: true,
                headerTitle: "",
                headerTransparent: true,
              }}
            />
            <Stack.Screen
              name="CreatePortfolio"
              component={CreatePortfolioScreen}
              options={{
                presentation: "modal",
                headerShown: true,
                headerTitle: "Create Portfolio",
                headerTransparent: true,
              }}
            />
            <Stack.Screen
              name="Assets"
              component={AssetsScreen}
              options={{
                presentation: "modal",
                headerShown: true,
                headerTitle: "Assets",
                headerTransparent: true,
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <PortfolioProvider>
            <Navigation />
          </PortfolioProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
