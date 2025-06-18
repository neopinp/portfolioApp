import React, { useState, useEffect } from 'react';
import { View, Text, Button, ActivityIndicator, StyleSheet, ScrollView } from 'react-native';
import { searchAssets, getAssetDetails } from '../services/financialApi';
import { Asset } from '../types';
import { COLORS } from '../constants/colors';

export const AssetSearchTest: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<Asset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  const testSearch = async () => {
    setLoading(true);
    setError(null);
    try {
      const results = await searchAssets('AAPL');
      setSearchResults(results);
      console.log('Search results:', results);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Search error: ${errorMessage}`);
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const testGetAssetDetails = async (symbol: string) => {
    setLoading(true);
    setError(null);
    try {
      const asset = await getAssetDetails(symbol);
      setSelectedAsset(asset);
      console.log('Asset details:', asset);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Get asset details error: ${errorMessage}`);
      console.error('Get asset details error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Finnhub API Test</Text>
      
      <View style={styles.buttonContainer}>
        <Button 
          title="Test Search API" 
          onPress={testSearch} 
          disabled={loading} 
          color={COLORS.primary}
        />
      </View>

      {loading && (
        <ActivityIndicator size="large" color={COLORS.textPink} style={styles.loader} />
      )}

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {searchResults.length > 0 && (
        <View style={styles.resultsContainer}>
          <Text style={styles.sectionTitle}>Search Results</Text>
          <ScrollView style={styles.scrollView}>
            {searchResults.map((asset) => (
              <View key={asset.symbol} style={styles.assetItem}>
                <View>
                  <Text style={styles.assetSymbol}>{asset.symbol}</Text>
                  <Text style={styles.assetName}>{asset.fullName || asset.name}</Text>
                </View>
                <Button
                  title="Get Details"
                  onPress={() => testGetAssetDetails(asset.symbol)}
                  color={COLORS.primary}
                />
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {selectedAsset && (
        <View style={styles.assetDetailsContainer}>
          <Text style={styles.sectionTitle}>Asset Details</Text>
          <View style={styles.assetDetails}>
            <Text style={styles.detailRow}>
              <Text style={styles.detailLabel}>Symbol: </Text>
              <Text style={styles.detailValue}>{selectedAsset.symbol}</Text>
            </Text>
            <Text style={styles.detailRow}>
              <Text style={styles.detailLabel}>Name: </Text>
              <Text style={styles.detailValue}>{selectedAsset.name}</Text>
            </Text>
            <Text style={styles.detailRow}>
              <Text style={styles.detailLabel}>Price: </Text>
              <Text style={styles.detailValue}>${selectedAsset.price.toFixed(2)}</Text>
            </Text>
            <Text style={styles.detailRow}>
              <Text style={styles.detailLabel}>Change: </Text>
              <Text style={[
                styles.detailValue,
                { color: selectedAsset.change >= 0 ? '#4CAF50' : '#FF5252' }
              ]}>
                {selectedAsset.change >= 0 ? '+' : ''}{selectedAsset.change.toFixed(2)}%
              </Text>
            </Text>
            <Text style={styles.detailRow}>
              <Text style={styles.detailLabel}>Risk Score: </Text>
              <Text style={styles.detailValue}>{selectedAsset.riskScore}/10</Text>
            </Text>
            {selectedAsset.sector && (
              <Text style={styles.detailRow}>
                <Text style={styles.detailLabel}>Sector: </Text>
                <Text style={styles.detailValue}>{selectedAsset.sector}</Text>
              </Text>
            )}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: COLORS.deepPurpleBackground,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textWhite,
    marginBottom: 20,
    textAlign: 'center',
  },
  buttonContainer: {
    marginBottom: 20,
  },
  loader: {
    marginVertical: 20,
  },
  errorContainer: {
    padding: 10,
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    borderRadius: 5,
    marginBottom: 20,
  },
  errorText: {
    color: '#FF5252',
    textAlign: 'center',
  },
  resultsContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textWhite,
    marginBottom: 10,
  },
  scrollView: {
    maxHeight: 200,
  },
  assetItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  assetSymbol: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textWhite,
  },
  assetName: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  assetDetailsContainer: {
    marginTop: 20,
  },
  assetDetails: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 15,
  },
  detailRow: {
    marginBottom: 8,
    fontSize: 16,
    color: COLORS.textWhite,
  },
  detailLabel: {
    fontWeight: 'bold',
    color: COLORS.textWhite,
  },
  detailValue: {
    color: COLORS.textWhite,
  },
}); 