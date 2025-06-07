import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Text } from '@rneui/themed';
import { COLORS } from '../constants/colors';

interface HoldingItemProps {
  symbol: string;
  fullName: string;
  value: number;
  change: number;
  imageUrl?: string;
}

export const HoldingItem = ({ symbol, fullName, value, change, imageUrl }: HoldingItemProps) => {
  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} />
        ) : (
          <View style={styles.symbolContainer}>
            <Text style={styles.symbolText}>{symbol.charAt(0)}</Text>
          </View>
        )}
        <View style={styles.nameContainer}>
          <Text style={styles.symbol}>{symbol}</Text>
          <Text style={styles.fullName}>{fullName}</Text>
        </View>
      </View>
      
      <View style={styles.rightSection}>
        <Text style={styles.value}>${value.toLocaleString()}</Text>
        <Text style={[
          styles.change,
          { color: change >= 0 ? '#4CAF50' : '#FF5252' }
        ]}>
          {change >= 0 ? '+' : ''}{change}%
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  image: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  symbolContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.textPink,
    justifyContent: 'center',
    alignItems: 'center',
  },
  symbolText: {
    color: COLORS.textWhite,
    fontSize: 18,
    fontWeight: 'bold',
  },
  nameContainer: {
    marginLeft: 12,
  },
  symbol: {
    color: COLORS.textWhite,
    fontSize: 16,
    fontWeight: '600',
  },
  fullName: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  value: {
    color: COLORS.textWhite,
    fontSize: 16,
    fontWeight: '500',
  },
  change: {
    fontSize: 14,
    marginTop: 2,
  },
}); 