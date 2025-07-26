import React from "react";
import { View, Text, StyleSheet } from "react-native";

const ChartHeader = ({
  value,
  change,
  touchedPoint,
  selectedRange,
  chartSeries,
}: any) => {
  // Calculate percent change for the time range
  const calculatePercentChange = (chartSeries: any[]) => {
    if (!chartSeries || chartSeries.length < 2) return 0;

    const firstPrice = chartSeries[0].price;
    const lastPrice = chartSeries[chartSeries.length - 1].price;

    return Number((((lastPrice - firstPrice) / firstPrice) * 100).toFixed(2));
  };
  const rangePercentChange = calculatePercentChange(chartSeries);
  const showRangeChange = selectedRange !== "1D" && chartSeries?.length > 0;

  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.value}>
          $
          {touchedPoint
            ? touchedPoint.price.toLocaleString()
            : value.toLocaleString()}
        </Text>
        {touchedPoint ? (
          <Text style={styles.dateText}>{touchedPoint.date}</Text>
        ) : (
          <Text
            style={[
              styles.change,
              { color: change >= 0 ? "#4CAF50" : "#FF5252" },
            ]}
          >
            {change >= 0 ? "+" : ""}
            {change}%
          </Text>
        )}
      </View>
      {showRangeChange && (
        <View style={styles.rangeChangeContainer}>
          <Text
            style={[
              styles.rangeChangeLabel,
              { color: rangePercentChange >= 0 ? "#4CAF50" : "#FF5252" },
            ]}
          >
            {rangePercentChange >= 0 ? "+" : ""}
            {rangePercentChange}%
          </Text>
        </View>
      )}
    </View>
  );
};
export default ChartHeader;

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  value: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    marginRight: 10,
  },
  dateText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
    marginTop: 4,
  },
  change: {
    fontSize: 16,
    fontWeight: "500",
  },
  rangeChangeContainer: {
    alignItems: "flex-end",
    justifyContent: "flex-start",
    paddingTop: 4,
  },
  rangeChangeLabel: {
    fontSize: 14,
    fontWeight: "500",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
});
