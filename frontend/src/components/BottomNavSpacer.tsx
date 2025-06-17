import React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface BottomNavSpacerProps {
  extraSpace?: number;
}

export const BottomNavSpacer: React.FC<BottomNavSpacerProps> = ({ extraSpace = 0 }) => {
  const insets = useSafeAreaInsets();
  
  // Calculate the height needed for the bottom navigation
  // 60px is the base height of the nav bar + bottom inset + any extra space
  const bottomNavHeight = 60 + insets.bottom + extraSpace;
  
  return <View style={{ height: bottomNavHeight }} />;
}; 