import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from '@rneui/themed';
import { COLORS } from '../constants/colors';

interface PortfolioCardProps {
  name: string;
  value: number;
  riskScore: number;
  change?: number;
  onPress: () => void;
  isNew?: boolean;
  isSelected?: boolean;
}

export const PortfolioCard: React.FC<PortfolioCardProps> = ({
  name,
  value = 0,
  riskScore,
  change = 0,
  onPress,
  isNew = false,
  isSelected = false,
}) => {
  if (isNew) {
    return (
      <TouchableOpacity 
        style={[styles.container, styles.newContainer]} 
        onPress={onPress}
      >
        <Text style={styles.newText}>Create a new portfolio +</Text>
      </TouchableOpacity>
    );
  }

  const getRiskColor = (score: number) => {
    if (score > 7) return '#FF5252';
    if (score > 4) return '#FFC107';
    return '#4CAF50';
  };

  const formattedValue = typeof value === 'number' ? value.toLocaleString() : '0';

  return (
    <TouchableOpacity 
      style={[
        styles.container,
        isSelected && styles.selectedContainer
      ]} 
      onPress={onPress}
    >
      <View style={styles.header}>
        <Text style={styles.name}>{name}</Text>
        <View style={[
          styles.riskBadge,
          { backgroundColor: `${getRiskColor(riskScore)}20` }
        ]}>
          <Text style={[
            styles.riskScore,
            { color: getRiskColor(riskScore) }
          ]}>
            {riskScore}
          </Text>
        </View>
      </View>
      <Text style={styles.value}>${formattedValue}</Text>
      <Text style={[
        styles.change,
        { color: change >= 0 ? '#4CAF50' : '#FF5252' }
      ]}>
        {change >= 0 ? '+' : ''}{change}%
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 15,
    marginHorizontal: 10,
    marginVertical: 8,
    width: 180,
    height: 140,
  },
  newContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.textPink,
    borderStyle: 'dashed',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  name: {
    color: COLORS.textWhite,
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  riskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 28,
    alignItems: 'center',
  },
  riskScore: {
    fontSize: 12,
    fontWeight: '600',
  },
  value: {
    color: COLORS.textWhite,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  change: {
    fontSize: 14,
    fontWeight: '600',
  },
  newText: {
    color: COLORS.textPink,
    fontSize: 16,
    textAlign: 'center',
  },
  selectedContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderColor: COLORS.primary,
    borderWidth: 1,
  },
}); 