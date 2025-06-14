import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Text, Icon } from "@rneui/themed";
import { COLORS } from "../constants/colors";
import { useAuth } from "../contexts/AuthContext";

interface AppHeaderProps {
  title?: string;
  showLogout?: boolean;
}

export const AppHeader = ({
  title = "STOX",
  showLogout = true,
}: AppHeaderProps) => {
  const { logout } = useAuth();

  return (
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
      {showLogout && (
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Icon
            name="log-out"
            type="feather"
            size={24}
            color={COLORS.textSecondary}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.textWhite,
  },
  logoutButton: {
    padding: 10,
  },
});
