import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemeProvider } from "@rneui/themed";
import { AuthProvider, useAuth } from "./src/contexts/AuthContext";
import { storage } from "./src/utils/storage";
import LoginScreen from "./src/screens/LoginScreen";
import { OnboardingScreen } from "./src/screens/OnboardingScreen";
import { DashboardScreen } from "./src/screens/DashboardScreen";
import { PortfolioScreen } from "./src/screens/PortfolioScreen";
import { AssetsScreen } from "./src/screens/AssetsScreen";
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
          headerTitle: "Assets",
          headerTransparent: true,
        }}
      />
    </Tab.Navigator>
  );
}

function Navigation() {
  const { user, isLoading } = useAuth();
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);

  useEffect(() => {
    const checkFirstLaunch = async () => {
      try {
        const hasLaunched = await storage.getItem<boolean>('FIRST_LAUNCH');
        if (hasLaunched === null) {
          await storage.setItem('FIRST_LAUNCH', true);
          setIsFirstLaunch(true);
        } else {
          setIsFirstLaunch(false);
        }
      } catch (error) {
        console.error('Error checking first launch:', error);
        setIsFirstLaunch(false);
      }
    };

    checkFirstLaunch();
  }, []);

  if (isLoading || isFirstLaunch === null) {
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
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          </>
        ) : (
          // App Stack
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen
              name="AddAsset"
              component={AssetsScreen}
              options={{
                presentation: "modal",
                headerShown: true,
                headerTitle: "Add Asset",
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
          <Navigation />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
