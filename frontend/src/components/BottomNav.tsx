import React, { useState } from "react";
import { View, TouchableOpacity, StyleSheet, Animated } from "react-native";
import { Icon, Text } from "@rneui/themed";
import { COLORS } from "../constants/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface BottomNavProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentRoute,
  onNavigate,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const translateY = new Animated.Value(0);
  const fadeAnim = new Animated.Value(1);
  const insets = useSafeAreaInsets();

  const toggleNav = (show: boolean) => {
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: show ? 0 : 100,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: show ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
    setIsVisible(show);
  };

  const navItems = [
    { route: "Dashboard", icon: "home", label: "Home" },
    { route: "Portfolio", icon: "pie-chart", label: "Portfolio" },
    { route: "Assets", icon: "trending-up", label: "Assets" },
  ];

  const navHeight = 60 + insets.bottom;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          opacity: fadeAnim,
          height: navHeight,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <View style={styles.navContent}>
        {navItems.map((item) => (
          <TouchableOpacity
            key={item.route}
            style={styles.navItem}
            onPress={() => onNavigate(item.route)}
          >
            <Icon
              name={item.icon}
              type="feather"
              size={24}
              color={
                currentRoute === item.route
                  ? COLORS.primary
                  : COLORS.textSecondary
              }
            />
            <Text
              style={[
                styles.navLabel,
                {
                  color:
                    currentRoute === item.route
                      ? COLORS.primary
                      : COLORS.textSecondary,
                },
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={styles.toggleButton}
        onPress={() => toggleNav(!isVisible)}
      ></TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(26, 15, 44, 0.95)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
    zIndex: 1000,
  },
  navContent: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 10,
    height: 60,
  },
  navItem: {
    alignItems: "center",
    paddingVertical: 8,
  },
  navLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  toggleButton: {
    position: "absolute",
    top: -2,
    left: "50%",
    marginLeft: -20,
    width: 40,
    height: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleIndicator: {
    width: 40,
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 2,
  },
});
