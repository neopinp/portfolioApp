import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';

const ICON_SIZE = 80;
const BAR_WIDTH = 8;
const BAR_SPACING = 6;

export const AppIcon = () => {
  return (
    <View style={styles.iconContainer}>
      <View style={styles.bar} />
      <View style={[styles.bar, { height: '70%' }]} />
      <View style={[styles.bar, { height: '40%' }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: 18, // Rounded square
    backgroundColor: COLORS.iconSquareBackground,
    flexDirection: 'row',
    alignItems: 'flex-end', // Bars start from bottom
    justifyContent: 'center',
    paddingHorizontal: BAR_SPACING * 2,
    paddingBottom: BAR_SPACING * 1.5, // To give some base
    marginBottom: 20,
  },
  bar: {
    backgroundColor: COLORS.textWhite,
    width: BAR_WIDTH,
    height: '100%', // Tallest bar
    borderRadius: BAR_WIDTH / 2,
    marginHorizontal: BAR_SPACING / 2,
  },
}); 