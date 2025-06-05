import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { COLORS } from "../constants/colors";

const { width } = Dimensions.get("window");
const GRAPHIC_ELEMENT_WIDTH = Math.min(width * 0.6, 250);

export const StatsBar = () => {
  return (
    <View style={styles.container}>
      <View style={styles.graphicContainer}>
        <View
          style={[styles.bar, styles.bar1, { backgroundColor: COLORS.mint }]}
        />
        <View
          style={[styles.bar, styles.bar2, { backgroundColor: COLORS.coral }]}
        />
        <View
          style={[styles.bar, styles.bar3, { backgroundColor: COLORS.primary }]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    height: 150,
    marginBottom: 250,
  },
  graphicContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-around",
    width: GRAPHIC_ELEMENT_WIDTH,
    height: "100%",
  },
  bar: {
    borderRadius: 10,
    width: GRAPHIC_ELEMENT_WIDTH / 4,
  },
  bar1: {
    height: "40%",
  },
  bar2: {
    height: "70%",
  },
  bar3: {
    height: "100%",
  },
});
