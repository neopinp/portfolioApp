import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Card } from '@rneui/themed';
import { SafeAreaView } from 'react-native-safe-area-context';

export const DashboardScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Text h3 style={styles.header}>Portfolio Overview</Text>
        
        {/* Portfolio Value Card */}
        <Card>
          <Card.Title>Total Portfolio Value</Card.Title>
          <Text h2 style={styles.portfolioValue}>$10,000</Text>
          <Text style={styles.changeText}>+5.2% today</Text>
        </Card>

        {/* Risk Analysis Card */}
        <Card>
          <Card.Title>Risk Analysis</Card.Title>
          <View style={styles.riskContainer}>
            <Text h1 style={styles.riskScore}>7</Text>
            <Text>out of 10</Text>
          </View>
          <Text style={styles.description}>Moderately High Risk Portfolio</Text>
        </Card>

        {/* News Feed Preview */}
        <Card>
          <Card.Title>Latest News</Card.Title>
          <Text>Loading news feed...</Text>
        </Card>

        {/* Future Projections Preview */}
        <Card>
          <Card.Title>Portfolio Projections</Card.Title>
          <Text>Loading projections...</Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 15,
  },
  portfolioValue: {
    textAlign: 'center',
    color: '#2089dc',
  },
  changeText: {
    textAlign: 'center',
    color: '#4CAF50',
    marginTop: 5,
  },
  riskContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  riskScore: {
    color: '#2089dc',
  },
  description: {
    textAlign: 'center',
    marginTop: 10,
    color: '#666',
  },
}); 