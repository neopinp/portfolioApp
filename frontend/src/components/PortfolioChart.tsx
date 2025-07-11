import React from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { Text } from '@rneui/themed';
import { COLORS } from '../constants/colors';

const { width } = Dimensions.get('window');

interface PortfolioChartProps {
  data: {
    value: number;
    change: number;
    timeRanges: string[];
    selectedRange: string;
    onRangeSelect: (range: string) => void;
  };
  onPress?: () => void;
}

export const PortfolioChart = ({ data, onPress }: PortfolioChartProps) => {
  // Format value safely
  const formattedValue = typeof data.value === 'number' ? data.value.toLocaleString() : '0';

  const ChartContent = () => (
    <>
      <View style={styles.header}>
        <Text style={styles.value}>${formattedValue}</Text>
        <Text style={[styles.change, { color: data.change >= 0 ? '#4CAF50' : '#FF5252' }]}>
          {data.change >= 0 ? '+' : ''}{data.change}%
        </Text>
      </View>
      
      <View style={styles.chartPlaceholder}>
        {/* This is where we'd integrate a real chart library */}
        <View style={styles.dummyLine} />
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
      <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
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
    width: '100%',
    padding: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    marginVertical: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  value: {
    color: COLORS.textWhite,
    fontSize: 24,
    fontWeight: 'bold',
    marginRight: 10,
  },
  change: {
    fontSize: 16,
    fontWeight: '500',
  },
  chartPlaceholder: {
    height: 200,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dummyLine: {
    height: 2,
    width: '90%',
    backgroundColor: COLORS.textPink,
    opacity: 0.5,
  },
  timeRanges: {
    flexDirection: 'row',
    justifyContent: 'space-around',
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
    fontWeight: '600',
  },
}); 