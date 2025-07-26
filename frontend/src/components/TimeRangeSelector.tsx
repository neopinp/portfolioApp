import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { COLORS } from "../constants/colors";

const TimeRangeSelector = ({
  timeRanges,
  selectedRange,
  onRangeSelect,
  dateRange,
}: any) => (
  <View style={styles.timeRangeSection}>
    <View style={styles.dateRangeContainer}>
      <Text style={styles.dateLabel}>{dateRange.start}</Text>
      <Text style={styles.dateLabel}>{dateRange.end}</Text>
    </View>
    <View style={styles.separator} />
    <View style={styles.timeRanges}>
      {timeRanges.map((range: string) => (
        <TouchableOpacity
          key={range}
          onPress={() => onRangeSelect(range)}
          style={[
            styles.timeRangeButton,
            range === selectedRange && styles.selectedTimeRangeButton,
          ]}
        >
          <Text
            style={[
              styles.timeRange,
              range === selectedRange && styles.selectedTimeRange,
            ]}
          >
            {range}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);
export default TimeRangeSelector;

const styles = StyleSheet.create({
  timeRangeSection: {
    marginTop: 10,
  },
  dateRangeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  separator: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    marginBottom: 15,
  },
  timeRanges: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 5,
  },
  timeRangeButton: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  selectedTimeRangeButton: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  timeRange: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  selectedTimeRange: {
    color: COLORS.textPink,
    fontWeight: "600",
  },
  dateLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 8,
  },
});
