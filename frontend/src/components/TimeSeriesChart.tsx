import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Text } from "@rneui/themed";
import { COLORS } from "../constants/colors";
import { CartesianChart, Line } from "victory-native";
import { ChartData } from "../types";
import { format } from "date-fns";

interface TimeSeriesChartProps {
  data: {
    value: number;
    change: number;
    timeRanges: string[];
    selectedRange: string;
    onRangeSelect: (range: string) => void;
    chartData?: ChartData;
  };
  onPress?: () => void;
}

export const TimeSeriesChart = ({ data, onPress }: TimeSeriesChartProps) => {
  const formattedValue =
    typeof data.value === "number" ? data.value.toLocaleString() : "0";

  // Format dates for display
  const formatDate = (dateString: string): string => {
    if (!dateString) return "";
    return format(new Date(dateString), "MMM d");
  };

  const chartSeries = data.chartData?.data ?? [];
  const hasChartData = chartSeries.length > 0;
  const startDate = data.chartData?.startDate ?? "";
  const endDate = data.chartData?.endDate ?? "";

  const formattedStart = formatDate(startDate);
  const formattedEnd = formatDate(endDate);

  const ChartContent = () => (
    <>
      <View style={styles.header}>
        <Text style={styles.value}>${formattedValue}</Text>
        <Text
          style={[
            styles.change,
            { color: data.change >= 0 ? "#4CAF50" : "#FF5252" },
          ]}
        >
          {data.change >= 0 ? "+" : ""}
          {data.change}%
        </Text>
      </View>

      <View style={styles.chartPlaceholder}>
        {hasChartData ? (
          <View style={styles.chartContainer}>
            <CartesianChart
              data={chartSeries as any[]}
              xKey="timestamp"
              yKeys={["price"]}
              axisOptions={{
                font: { size: 0 },
                lineWidth: 0,
              }}
            >
              {({ points }: any) => (
                <Line
                  points={points.price}
                  color={data.change >= 0 ? "#4CAF50" : "#FF5252"}
                  strokeWidth={2}
                  animate
                />
              )}
            </CartesianChart>

            {/* Date Labels */}
            <View style={styles.dateLabelsContainer}>
              <Text style={styles.dateLabel}>{formattedStart}</Text>
              <Text style={styles.dateLabel}>{formattedEnd}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.dummyLine} />
        )}
      </View>

      <View style={styles.timeRanges}>
        {data.timeRanges.map((range) => (
          <Text
            key={range}
            style={[
              styles.timeRange,
              range === data.selectedRange && styles.selectedTimeRange,
            ]}
            onPress={(e) => {
              e.stopPropagation(); // Prevent triggering the parent onPress
              data.onRangeSelect(range);
            }}
          >
            {range}
          </Text>
        ))}
      </View>
    </>
  );

  // If onPress is provided, wrap the chart in a TouchableOpacity
  if (onPress) {
    return (
      <TouchableOpacity
        style={styles.container}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <ChartContent />
      </TouchableOpacity>
    );
  }

  // Otherwise, render without TouchableOpacity
  return (
    <View style={styles.container}>
      <ChartContent />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    padding: 15,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 15,
    marginVertical: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  value: {
    color: COLORS.textWhite,
    fontSize: 24,
    fontWeight: "bold",
    marginRight: 10,
  },
  change: {
    fontSize: 16,
    fontWeight: "500",
  },
  chartPlaceholder: {
    height: 200,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  chartContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  linesContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  dataPoint: {
    position: "absolute",
    width: 2,
    height: 2,
    borderRadius: 1,
    marginLeft: -1,
    marginBottom: -1,
  },
  chartLine: {
    position: "absolute",
  },
  dummyLine: {
    height: 2,
    width: "90%",
    backgroundColor: COLORS.textPink,
    opacity: 0.5,
  },
  dateLabelsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    marginTop: -20,
  },
  dateLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    opacity: 0.8,
  },
  timeRanges: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 15,
  },
  timeRange: {
    color: COLORS.textSecondary,
    fontSize: 14,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  selectedTimeRange: {
    color: COLORS.textPink,
    fontWeight: "600",
  },
});
