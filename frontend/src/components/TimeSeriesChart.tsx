import React, { useState, useRef, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity, Dimensions } from "react-native";
import { Text } from "@rneui/themed";
import { COLORS } from "../constants/colors";
import { ChartData } from "../types";
import { format, subDays, subMonths, subWeeks } from "date-fns";
import Svg, { Path, Line } from "react-native-svg";

const screenWidth = Dimensions.get("window").width;
const CHART_HEIGHT = 160;
const CHART_WIDTH = screenWidth - 70;
const CHART_PADDING = 20;

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

// Separate component for the chart header
const ChartHeader = ({ value, change, touchedPoint }: any) => (
  <View style={styles.header}>
    <View>
      <Text style={styles.value}>
        ${touchedPoint ? touchedPoint.price.toLocaleString() : value.toLocaleString()}
      </Text>
      {touchedPoint ? (
        <Text style={styles.dateText}>{touchedPoint.date}</Text>
      ) : (
        <Text
          style={[styles.change, { color: change >= 0 ? "#4CAF50" : "#FF5252" }]}
        >
          {change >= 0 ? "+" : ""}{change}%
        </Text>
      )}
    </View>
  </View>
);

// Separate component for time range selector
const TimeRangeSelector = ({ timeRanges, selectedRange, onRangeSelect, dateRange }: any) => (
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
            range === selectedRange && styles.selectedTimeRangeButton
          ]}
        >
          <Text
            style={[
              styles.timeRange,
              range === selectedRange && styles.selectedTimeRange
            ]}
          >
            {range}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

export const TimeSeriesChart = ({ data, onPress }: TimeSeriesChartProps) => {
  const [touchedPoint, setTouchedPoint] = useState<{ price: number; date: string; x: number; y: number } | null>(null);
  const chartContainerRef = useRef<View>(null);

  const chartSeries = data.chartData?.data ?? [];
  const hasChartData = chartSeries.length > 0;

  const getDateRange = () => {
    const today = new Date();
    let startDate;

    switch (data.selectedRange) {
      case "1D":
        startDate = subDays(today, 1);
        break;
      case "1W":
        startDate = subWeeks(today, 1);
        break;
      case "1M":
        startDate = subMonths(today, 1);
        break;
      case "3M":
        startDate = subMonths(today, 3);
        break;
      case "6M":
        startDate = subMonths(today, 6);
        break;
      default:
        startDate = subMonths(today, 1);
    }

    return {
      start: format(startDate, "MMM d"),
      end: format(today, "MMM d")
    };
  };

  const dateRange = getDateRange();

  const getY = (price: number, minPrice: number, maxPrice: number) => {
    const availableHeight = CHART_HEIGHT - 2 * CHART_PADDING;
    return CHART_HEIGHT - CHART_PADDING - ((price - minPrice) / (maxPrice - minPrice)) * availableHeight;
  };

  const getPath = () => {
    if (!hasChartData) return "";

    const prices = chartSeries.map(point => point.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const xStep = (CHART_WIDTH - 2 * CHART_PADDING) / (chartSeries.length - 1);

    return chartSeries.reduce((path, point, i) => {
      const x = CHART_PADDING + i * xStep;
      const y = getY(point.price, minPrice, maxPrice);
      return path + `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }, "");
  };

  const handlePress = (event: any) => {
    if (!hasChartData || !chartContainerRef.current) return;

    const locationX = event.nativeEvent.locationX;
    const xStep = (CHART_WIDTH - 2 * CHART_PADDING) / (chartSeries.length - 1);
    const adjustedX = Math.max(CHART_PADDING, Math.min(locationX, CHART_WIDTH - CHART_PADDING));
    const index = Math.round((adjustedX - CHART_PADDING) / xStep);

    if (index >= 0 && index < chartSeries.length) {
      const point = chartSeries[index];
      setTouchedPoint({
        price: point.price,
        date: format(new Date(point.timestamp), "MMM d, yyyy"),
        x: CHART_PADDING + index * xStep,
        y: 0 // We don't need y coordinate since we're only showing vertical line
      });
    }
  };

  useEffect(() => {
    if (touchedPoint) {
      const prices = chartSeries.map(p => p.price);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const y = getY(touchedPoint.price, minPrice, maxPrice);

      setTouchedPoint(prev => prev ? {
        ...prev,
        y
      } : null);
    }
  }, [data.selectedRange, chartSeries]);

  const ChartContent = () => (
    <>
      <ChartHeader 
        value={data.value} 
        change={data.change} 
        touchedPoint={touchedPoint} 
      />

      <View style={styles.chartPlaceholder}>
        {hasChartData ? (
          <TouchableOpacity
            ref={chartContainerRef}
            style={styles.chartTouchable}
            onPress={handlePress}
            activeOpacity={1}
          >
            <View style={styles.chartContainer}>
              <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
                <Path
                  d={getPath()}
                  stroke={data.change >= 0 ? "#4CAF50" : "#FF5252"}
                  strokeWidth="2"
                  fill="none"
                />
                {touchedPoint && (
                  <Line
                    x1={touchedPoint.x}
                    y1={0}
                    x2={touchedPoint.x}
                    y2={CHART_HEIGHT}
                    stroke={data.change >= 0 ? "rgba(76, 175, 80, 0.3)" : "rgba(255, 82, 82, 0.3)"}
                    strokeWidth="2"
                  />
                )}
              </Svg>
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.dummyLine} />
        )}
      </View>

      <TimeRangeSelector
        timeRanges={data.timeRanges}
        selectedRange={data.selectedRange}
        onRangeSelect={data.onRangeSelect}
        dateRange={dateRange}
      />
    </>
  );

  return onPress ? (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <ChartContent />
    </TouchableOpacity>
  ) : (
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
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  value: {
    color: COLORS.textWhite,
    fontSize: 24,
    fontWeight: "bold",
    marginRight: 10,
  },
  dateText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 4,
  },
  change: {
    fontSize: 16,
    fontWeight: "500",
  },
  chartPlaceholder: {
    height: CHART_HEIGHT,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    marginBottom: 20,
    overflow: 'hidden',
  },
  chartTouchable: {
    position: "absolute",
    width: CHART_WIDTH,
    height: CHART_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
  },
  chartContainer: {
    width: CHART_WIDTH,
    height: CHART_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
  },
  dummyLine: {
    height: 2,
    width: "90%",
    backgroundColor: COLORS.textPink,
    opacity: 0.5,
  },
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
