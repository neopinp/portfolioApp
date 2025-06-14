import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Text, Icon } from "@rneui/themed";
import { COLORS } from "../constants/colors";
import { useAuth } from "../contexts/AuthContext";

interface AppHeaderProps {
  title?: string;
  showLogout?: boolean;
  username?: string;
}

export const AppHeader = ({
  title = "STOX",
  showLogout = true,
  username,
}: AppHeaderProps) => {
  const { logout } = useAuth();

  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.title}>{title}</Text>
        {username && (
          <Text style={styles.usernameText}>@{username}</Text>
        )}
      </View>
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
  usernameText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    opacity: 0.8,
    marginTop: 4,
  },
  logoutButton: {
    padding: 10,
  },
});
