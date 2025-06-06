import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemeProvider } from "@rneui/themed";
import AsyncStorage from "@react-native-async-storage/async-storage";
import LoginScreen from "./src/screens/LoginScreen";
import { OnboardingScreen } from "./src/screens/OnboardingScreen";
import { DashboardScreen } from "./src/screens/DashboardScreen";

// We'll create these screens next
const Stack = createNativeStackNavigator();

export default function App() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initialRoute, setInitialRoute] = useState<string>("Login");

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // During development, clear AsyncStorage to test navigation


        const token = await AsyncStorage.getItem("userToken");
        const hasCompletedOnboarding = await AsyncStorage.getItem(
          "hasCompletedOnboarding"
        );

        let route = "Login";
        if (token && hasCompletedOnboarding === "true") {
          setInitialRoute("Dashboard");
        } else if (token) {
          setInitialRoute("Onboarding");
        } else {
          setInitialRoute("Login");
        }
        setInitialRoute(route);
      } catch (e) {
        console.error(e);
        // If there's an error, default to Login
        setInitialRoute("Login");
      } finally {
        setIsInitialized(true);
      }
    };

    if (!isInitialized) {
      initializeApp();
    }
  }, [isInitialized]);

  if (!isInitialized) {
    return null; // or a loading screen
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <NavigationContainer>
          <Stack.Navigator initialRouteName={initialRoute}>
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Onboarding"
              component={OnboardingScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Dashboard"
              component={DashboardScreen}
              options={{
                headerTitle: "Portfolio Overview",
                headerLargeTitle: true,
              }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
