import React, { useState, useRef, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity, Dimensions } from "react-native";
import { Text } from "@rneui/themed";
import { COLORS } from "../constants/colors";
import { ChartData } from "../types";
import { format, subDays, subMonths, subWeeks, parseISO, differenceInDays, differenceInWeeks, differenceInMonths, addDays } from "date-fns";
import Svg, { Path, Line, Defs, LinearGradient, Stop, Text as SvgText } from "react-native-svg";

const screenWidth = Dimensions.get("window").width;
const CHART_HEIGHT = 200; // Increased from 160
const CHART_WIDTH = screenWidth - 70;
const CHART_PADDING = 20;
const LABEL_PADDING = 25; // Space for x-axis labels

const LABEL_FONT_SIZE = 10;
const LABEL_COLOR = "rgba(255, 255, 255, 0.5)";

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

// Helper function to get x-axis labels based on time range
const getXAxisLabels = (chartSeries: any[], selectedRange: string) => {
  if (!chartSeries.length) return [];
  
  const timestamps = chartSeries.map(point => new Date(point.timestamp));
  const startDate = timestamps[0];
  const endDate = timestamps[timestamps.length - 1];
  const labels: { text: string; position: number; timestamp: Date }[] = [];
  const xStep = (CHART_WIDTH - 2 * CHART_PADDING) / (chartSeries.length - 1);

  const getPositionFromTimestamp = (timestamp: Date) => {
    // Find the closest data point to this timestamp
    const index = timestamps.findIndex(t => t.getTime() === timestamp.getTime());
    if (index !== -1) {
      return CHART_PADDING + (index * xStep);
    }
    return CHART_PADDING; // Fallback
  };

  switch (selectedRange) {
    case "1D": {
      // Use actual market hours from the data
      const marketHours = [10, 11, 12, 13, 14];
      marketHours.forEach(targetHour => {
        // Find the closest data point to this hour
        const point = timestamps.find(t => t.getHours() === targetHour);
        if (point) {
          labels.push({
            text: targetHour > 12 ? (targetHour - 12).toString() : targetHour.toString(),
            position: getPositionFromTimestamp(point),
            timestamp: point
          });
        }
      });
      break;
    }

    case "1W": {
      // Find 5 evenly spaced points in the data
      const interval = Math.floor(chartSeries.length / 4);
      for (let i = 0; i < chartSeries.length; i += interval) {
        const point = timestamps[i];
        if (point) {
          labels.push({
            text: point.getDate().toString(),
            position: CHART_PADDING + (i * xStep),
            timestamp: point
          });
        }
      }
      break;
    }

    case "1M": {
      // Find 5 evenly spaced points in the data
      const interval = Math.floor(chartSeries.length / 4);
      for (let i = 0; i < chartSeries.length; i += interval) {
        const point = timestamps[i];
        if (point) {
          labels.push({
            text: point.getDate().toString(),
            position: CHART_PADDING + (i * xStep),
            timestamp: point
          });
        }
      }
      break;
    }

    case "3M":
    case "6M": {
      // Find first day of each month in the data
      const seenMonths = new Set<string>();
      const maxLabels = selectedRange === "3M" ? 3 : 5; // Limit 6M to 5 labels
      
      // Get all unique months first
      const uniqueMonths = timestamps.reduce((acc, date, index) => {
        const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
        if (!acc.has(monthKey)) {
          acc.set(monthKey, { date, index });
        }
        return acc;
      }, new Map<string, { date: Date; index: number }>());

      // Convert to array and sort chronologically
      const sortedMonths = Array.from(uniqueMonths.values())
        .sort((a, b) => a.date.getTime() - b.date.getTime());

      // For 6M, skip the first month to start from Feb
      if (selectedRange === "6M") {
        sortedMonths.shift(); // Remove first month
      }
      
      // Take only the required number of labels
      sortedMonths.slice(0, maxLabels).forEach(({ date, index }) => {
        labels.push({
          text: format(date, "MMM"),
          position: CHART_PADDING + (index * xStep),
          timestamp: date
        });
      });
      break;
    }

    case "1Y": {
      // Find quarterly points in the actual data
      const quarters = new Set<string>();
      
      timestamps.forEach((date, index) => {
        const quarter = Math.floor(date.getMonth() / 3);
        const quarterKey = `${date.getFullYear()}-${quarter}`;
        if (!quarters.has(quarterKey) && quarters.size < 4) {
          quarters.add(quarterKey);
          labels.push({
            text: format(date, "MMM"),
            position: CHART_PADDING + (index * xStep),
            timestamp: date
          });
        }
      });
      break;
    }

    case "5Y": {
      // Show only 5 evenly spaced years starting from 2021
      const uniqueYears = new Set<number>();
      const maxLabels = 5;
      
      // Filter timestamps to start from 2021
      const validTimestamps = timestamps.filter(date => date.getFullYear() >= 2021);
      
      validTimestamps.forEach((date, index) => {
        const year = date.getFullYear();
        if (!uniqueYears.has(year) && uniqueYears.size < maxLabels) {
          uniqueYears.add(year);
          labels.push({
            text: year.toString(),
            position: CHART_PADDING + (index * xStep),
            timestamp: date
          });
        }
      });
      break;
    }
  }

  // Always include the last data point if we have room
  if (labels.length > 0 && 
      Math.abs(labels[labels.length - 1].position - (CHART_WIDTH - CHART_PADDING)) > 50) {
    const lastPoint = timestamps[timestamps.length - 1];
    labels.push({
      text: selectedRange === "5Y" 
        ? lastPoint.getFullYear().toString()
        : selectedRange === "1Y" || selectedRange === "3M" || selectedRange === "6M"
        ? format(lastPoint, "MMM")
        : lastPoint.getDate().toString(),
      position: CHART_WIDTH - CHART_PADDING,
      timestamp: lastPoint
    });
  }

  return labels;
};

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
    const availableHeight = CHART_HEIGHT - 2 * CHART_PADDING - LABEL_PADDING;
    return CHART_HEIGHT - CHART_PADDING - LABEL_PADDING - ((price - minPrice) / (maxPrice - minPrice)) * availableHeight;
  };

  const getPath = (isArea = false) => {
    if (!hasChartData) return "";

    const prices = chartSeries.map(point => point.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const xStep = (CHART_WIDTH - 2 * CHART_PADDING) / (chartSeries.length - 1);

    let path = chartSeries.reduce((path, point, i) => {
      const x = CHART_PADDING + i * xStep;
      const y = getY(point.price, minPrice, maxPrice);
      return path + `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }, "");

    if (isArea) {
      // Add line to bottom right corner
      const lastX = CHART_PADDING + (chartSeries.length - 1) * xStep;
      path += ` L ${lastX} ${CHART_HEIGHT - LABEL_PADDING * 2}`;
      // Add line to bottom left corner
      path += ` L ${CHART_PADDING} ${CHART_HEIGHT - LABEL_PADDING * 2}`;
      // Close the path
      path += ' Z';
    }

    return path;
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
              <Svg width={CHART_WIDTH} height={CHART_HEIGHT} style={{ overflow: 'hidden' }}>
                <Defs>
                  <LinearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                    <Stop 
                      offset="0" 
                      stopColor={data.change >= 0 ? "#4CAF50" : "#FF5252"} 
                      stopOpacity="0.3" 
                    />
                    <Stop 
                      offset="0.5" 
                      stopColor={data.change >= 0 ? "#4CAF50" : "#FF5252"} 
                      stopOpacity="0.1" 
                    />
                    <Stop 
                      offset="1" 
                      stopColor={data.change >= 0 ? "#4CAF50" : "#FF5252"} 
                      stopOpacity="0.02" 
                    />
                  </LinearGradient>
                </Defs>
                {/* Grid lines */}
                {data.chartData?.data && getXAxisLabels(data.chartData.data, data.selectedRange).map((label) => (
                  <Line
                    key={`grid-${label.position}`}
                    x1={label.position}
                    y1={0}
                    x2={label.position}
                    y2={CHART_HEIGHT - LABEL_PADDING}
                    stroke="rgba(255, 255, 255, 0.1)"
                    strokeWidth="1"
                    strokeDasharray="5,5"
                  />
                ))}
                {/* Area fill */}
                <Path
                  d={getPath(true)}
                  fill="url(#gradient)"
                />
                {/* Line on top */}
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
                    y2={CHART_HEIGHT - LABEL_PADDING}
                    stroke={data.change >= 0 ? "rgba(76, 175, 80, 0.3)" : "rgba(255, 82, 82, 0.3)"}
                    strokeWidth="2"
                  />
                )}
                {/* X-axis labels */}
                {data.chartData?.data && getXAxisLabels(data.chartData.data, data.selectedRange).map((label, index) => (
                  <SvgText
                    key={`${label.text}-${label.position}`}
                    x={label.position}
                    y={CHART_HEIGHT - LABEL_PADDING / 3}
                    fontSize={LABEL_FONT_SIZE}
                    fill={LABEL_COLOR}
                    textAnchor={index === 0 ? "start" : index === getXAxisLabels(data.chartData!.data, data.selectedRange).length - 1 ? "end" : "middle"}
                  >
                    {label.text}
                  </SvgText>
                ))}
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

