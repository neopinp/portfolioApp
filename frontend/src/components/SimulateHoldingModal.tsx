import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Platform,
  Switch,
  TouchableWithoutFeedback,
  Keyboard,
  TextInput,
} from 'react-native';
import { Text, Button } from '@rneui/themed';
import DateTimePicker from '@react-native-community/datetimepicker';
import { COLORS } from '../constants/colors';
import { Asset } from '../types';
import { api } from '../services/api';

interface SimulateHoldingModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (amount: number, price: number, date: Date) => void;
  asset: Asset | null;
  isLoading: boolean;
  portfolioName: string;
  portfolioId: number;
}

export const SimulateHoldingModal = ({
  visible,
  onClose,
  onSubmit,
  asset,
  isLoading,
  portfolioName,
  portfolioId,
}: SimulateHoldingModalProps) => {
  const [isSimulationMode, setIsSimulationMode] = useState(false);
  const [amount, setAmount] = useState('0');
  const [price, setPrice] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Reset form when modal opens or closes
  useEffect(() => {
    if (visible) {
      setAmount('0');
      setPrice(asset?.price?.toString() || '0');
      setDate(new Date());
      setIsSimulationMode(false);
    } else {
      // Close date picker when modal closes
      setShowDatePicker(false);
    }
  }, [visible, asset]);

  // will pass the submitted data to the getAssetHistoricalPerformance function?
  const handleSubmit = async () => {
    const numAmount = parseFloat(amount);
    const numPrice = parseFloat(price);

    if (isNaN(numAmount) || numAmount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (isNaN(numPrice) || numPrice <= 0) {
      alert('Please enter a valid price');
      return;
    }

    try {
      const boughtAtDate = isSimulationMode ? date : new Date();
      
      // Check if the boughtAtDate is today
      const today = new Date();
      const isToday = boughtAtDate.toDateString() === today.toDateString();
      
      if (isToday) {
        // For today's date, use current value update (real trading mode)
        console.log("SimulateHoldingModal - Using current value update for today");
        
        await api.portfolios.updateCurrentValue(portfolioId, {
          symbol: asset?.symbol || '',
          shares: numAmount,
          price: numPrice
        });
      } else {
        // For past dates, use historical data generation (simulation mode)
        console.log("SimulateHoldingModal - Using historical data generation for past date");
        
        await api.portfolios.generateHistoricalData(portfolioId, {
          symbol: asset?.symbol || '',
          shares: numAmount,
          price: numPrice,
          boughtAtDate: boughtAtDate.toISOString()
        });
      }
      
      setShowDatePicker(false); // Close date picker on submit
      onSubmit(numAmount, numPrice, date);
    } catch (error) {
      console.error('Error updating portfolio value:', error);
      alert('Failed to update portfolio value. Please try again.');
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      setDate(selectedDate);
    }
    // Only close on Android when user confirms
    if (Platform.OS === 'android' && event.type === 'set') {
      setShowDatePicker(false);
    }
  };

  const handleModeToggle = (value: boolean) => {
    setIsSimulationMode(value);
    // Reset values when switching to real trading mode
    if (!value) {
      setPrice(asset?.price?.toString() || '0');
      setDate(new Date());
    }
    setShowDatePicker(false); // Close date picker when switching modes
    Keyboard.dismiss();
  };

  const toggleDatePicker = () => {
    setShowDatePicker(!showDatePicker);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={() => {
        setShowDatePicker(false); // Close date picker when modal closes
        onClose();
      }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add {asset?.symbol}</Text>
            <Text style={styles.modalSubtitle}>
              Add transaction to {portfolioName}
            </Text>

            <View style={styles.modeToggleContainer}>
              <Text style={styles.modeLabel}>
                {isSimulationMode ? "Simulation Mode" : "Real Trading"}
              </Text>
              <Switch
                value={isSimulationMode}
                onValueChange={handleModeToggle}
                trackColor={{ false: "#767577", true: `${COLORS.primary}50` }}
                thumbColor={isSimulationMode ? COLORS.primary : "#f4f3f4"}
              />
            </View>

            <Text style={styles.inputLabel}>Number of Shares</Text>
            <View style={styles.inputContainer}>
              <TextInput
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                style={styles.input}
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>

            <Text style={styles.inputLabel}>Price per Share ($)</Text>
            <View style={[
              isSimulationMode ? styles.inputContainer : styles.plainContainer
            ]}>
              <TextInput
                value={price}
                onChangeText={isSimulationMode ? setPrice : undefined}
                keyboardType="decimal-pad"
                style={[
                  styles.input,
                  !isSimulationMode && styles.disabledInput
                ]}
                editable={isSimulationMode}
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>

            <Text style={styles.inputLabel}>Transaction Date</Text>
            {isSimulationMode ? (
              <TouchableOpacity
                style={styles.dateButton}
                onPress={toggleDatePicker}
              >
                <Text style={styles.dateButtonText}>
                  {date.toLocaleDateString()}
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.plainContainer}>
                <Text style={[styles.dateButtonText, styles.disabledText]}>
                  {new Date().toLocaleDateString()}
                </Text>
              </View>
            )}

            {showDatePicker && isSimulationMode && (
              <DateTimePicker
                value={date}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
                maximumDate={new Date()}
              />
            )}

            <View style={styles.totalSection}>
              <Text style={styles.totalLabel}>Total Value:</Text>
              <Text style={styles.totalAmount}>
                ${(parseFloat(amount || '0') * parseFloat(price || '0')).toFixed(2)}
              </Text>
            </View>

            <Button
              title={isSimulationMode ? "Add Simulated Holding" : "Buy Now"}
              onPress={handleSubmit}
              loading={isLoading}
              disabled={isLoading}
              buttonStyle={[
                styles.submitButton,
                isSimulationMode ? styles.simulateButton : styles.buyButton
              ]}
            />

            <Button
              title="Cancel"
              type="clear"
              titleStyle={styles.cancelButtonText}
              onPress={onClose}
              disabled={isLoading}
            />
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.deepPurpleBackground,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    minHeight: 300,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textWhite,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 24,
  },
  modeToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  modeLabel: {
    color: COLORS.textSecondary,
    marginRight: 12,
    fontSize: 14,
  },
  inputLabel: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginBottom: 8,
    marginLeft: 10,
  },
  inputContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    marginBottom: 16,
    padding: 15,
  },
  plainContainer: {
    marginBottom: 16,
    padding: 15,
  },
  input: {
    color: COLORS.textWhite,
    fontSize: 16,
    padding: 0,
  },
  disabledInput: {
    color: COLORS.textSecondary,
    opacity: 0.7,
  },
  dateButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 15,
    borderRadius: 8,
    marginBottom: 24,
  },
  dateButtonText: {
    color: COLORS.textWhite,
    fontSize: 16,
  },
  disabledText: {
    color: COLORS.textSecondary,
    opacity: 0.7,
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  totalLabel: {
    fontSize: 18,
    color: COLORS.textWhite,
    fontWeight: '600',
  },
  totalAmount: {
    fontSize: 24,
    color: COLORS.textWhite,
    fontWeight: 'bold',
  },
  submitButton: {
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 12,
  },
  simulateButton: {
    backgroundColor: COLORS.primary,
  },
  buyButton: {
    backgroundColor: "#4CAF50",
  },
  cancelButtonText: {
    color: COLORS.textSecondary,
  },
}); 