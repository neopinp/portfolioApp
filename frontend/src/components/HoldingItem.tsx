import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Text } from '@rneui/themed';
import { COLORS } from '../constants/colors';
import { Holding } from '../types';

// Using the Holding type directly with optional props for component flexibility
type HoldingItemProps = {
  holding?: Holding;
  symbol?: string;
  fullName?: string;
  value?: number;
  change?: number;
  imageUrl?: string;
};

export const HoldingItem = ({ holding, symbol, fullName, value, change, imageUrl }: HoldingItemProps) => {
  // Use either the holding object or the individual props
  const displaySymbol = symbol || holding?.symbol || holding?.assetSymbol || '';
  const displayName = fullName || holding?.fullName || '';
  const displayValue = value ?? holding?.value ?? 0;
  const displayChange = change ?? holding?.change ?? 0;
  const displayImageUrl = imageUrl || holding?.imageUrl;
  
  // Format value safely
  const formattedValue = typeof displayValue === 'number' ? displayValue.toLocaleString() : '0';
  
  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        {displayImageUrl ? (
          <Image source={{ uri: displayImageUrl }} style={styles.image} />
        ) : (
          <View style={styles.symbolContainer}>
            <Text style={styles.symbolText}>{displaySymbol.charAt(0)}</Text>
          </View>
        )}
        <View style={styles.nameContainer}>
          <Text style={styles.symbol}>{displaySymbol}</Text>
          <Text style={styles.fullName}>{displayName}</Text>
        </View>
      </View>
      
      <View style={styles.rightSection}>
        <Text style={styles.value}>${formattedValue}</Text>
        <Text style={[
          styles.change,
          { color: displayChange >= 0 ? '#4CAF50' : '#FF5252' }
        ]}>
          {displayChange >= 0 ? '+' : ''}{displayChange}%
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