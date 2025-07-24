import React from 'react';
import { View, StyleSheet, Switch } from 'react-native';
import { Text, Button } from '@rneui/themed';
import { COLORS } from '../constants/colors';

interface TradeButtonsProps {
  isSimulationMode: boolean;
  onToggleMode: (value: boolean) => void;
  onBuy: () => void;
  onSell: () => void;
  disabled?: boolean;
}

export const TradeButtons = ({
  isSimulationMode,
  onToggleMode,
  onBuy,
  onSell,
  disabled,
}: TradeButtonsProps) => {
  return (
    <View style={styles.tradeSection}>
      <View style={styles.modeToggleContainer}>
        <Text style={styles.modeLabel}>
          {isSimulationMode ? "Simulation" : "Real Trading"}
        </Text>
        <Switch
          value={isSimulationMode}
          onValueChange={onToggleMode}
          trackColor={{ false: "#767577", true: `${COLORS.primary}50` }}
          thumbColor={isSimulationMode ? COLORS.primary : "#f4f3f4"}
        />
      </View>

      <View style={styles.tradeButtons}>
        <Button
          title={isSimulationMode ? "Simulate Buy" : "Buy"}
          buttonStyle={[styles.tradeButton, styles.buyButton]}
          onPress={onBuy}
          disabled={disabled}
        />
        <Button
          title={isSimulationMode ? "Simulate Sell" : "Sell"}
          buttonStyle={[styles.tradeButton, styles.sellButton]}
          onPress={onSell}
          disabled={disabled}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  tradeSection: {
    marginTop: 24,
  },
  modeToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  modeLabel: {
    color: COLORS.textSecondary,
    marginRight: 12,
    fontSize: 14,
  },
  tradeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  tradeButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
  },
  buyButton: {
    backgroundColor: "#4CAF50",
  },
  sellButton: {
    backgroundColor: "#FF5252",
  },
}); 