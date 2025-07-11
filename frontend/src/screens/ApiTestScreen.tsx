import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { AssetSearchTest } from '../components/AssetSearchTest';

import { COLORS } from '../constants/colors';

export const ApiTestScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <AssetSearchTest />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.deepPurpleBackground,
  },
}); 