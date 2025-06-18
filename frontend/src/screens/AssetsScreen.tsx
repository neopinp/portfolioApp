import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Animated,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Text, Input, Icon, Button } from "@rneui/themed";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { COLORS } from "../constants/colors";
import { PortfolioChart } from "../components/PortfolioChart";
import { AppHeader } from "../components/AppHeader";
import { BottomNavSpacer } from "../components/BottomNavSpacer";
import { AssetSearchModal } from "../components/AssetSearchModal";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";
import { Asset } from "../types";
import { usePortfolio } from "../contexts/PortfolioContext";
import { getMultipleAssetDetails } from "../services/financialApi";

export const AssetsScreen = ({ route, navigation }: any) => {
  const { portfolioId: routePortfolioId } = route.params || {};
  const { selectedPortfolio: contextPortfolio } = usePortfolio();
  
  // Use the portfolioId from route params if available, otherwise it's not in "add to portfolio" mode
  const portfolioId = routePortfolioId;
  
  const { user } = useAuth();
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [timeRanges] = useState(["1D", "1W", "1M", "3M", "6M"]);
  const [selectedRange, setSelectedRange] = useState("1M");
  const [isAddingAsset, setIsAddingAsset] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [topMovers, setTopMovers] = useState<Asset[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Default symbols for top movers
  const defaultSymbols = ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "META", "NVDA"];

  // Load top movers when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadTopMovers();
    }, [])
  );

  // Load top movers data from Finnhub
  const loadTopMovers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const assets = await getMultipleAssetDetails(defaultSymbols);
      
      // Sort by absolute change percentage to get the actual top movers
      const sortedAssets = assets.sort((a, b) => {
        return Math.abs(b.change) - Math.abs(a.change);
      });
      
      setTopMovers(sortedAssets.slice(0, 5)); // Take top 5 movers
      
      // If we had a selected asset, refresh its data too
      if (selectedAsset) {
        const updatedAsset = assets.find(asset => asset.symbol === selectedAsset.symbol);
        if (updatedAsset) {
          setSelectedAsset(updatedAsset);
        }
      }
    } catch (err) {
      console.error("Error loading top movers:", err);
      setError("Failed to load market data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadTopMovers();
    setRefreshing(false);
  };

  const renderMoverCard = ({ item }: { item: Asset }) => (
    <TouchableOpacity
      style={[
        styles.moverCard,
        selectedAsset?.symbol === item.symbol && styles.selectedMoverCard,
      ]}
      onPress={() => setSelectedAsset(item)}
    >
      <Text style={styles.symbolText}>{item.symbol}</Text>
      <Text style={styles.priceText}>${item.price?.toFixed(2) || "0.00"}</Text>
      <Text
        style={[
          styles.changeText,
          { color: (item.change || 0) >= 0 ? "#4CAF50" : "#FF5252" },
        ]}
      >
        {(item.change || 0) >= 0 ? "+" : ""}
        {item.change?.toFixed(2) || "0.00"}%
      </Text>
    </TouchableOpacity>
  );

  const handleSearch = () => {
    setSearchModalVisible(true);
  };

  const handleSelectAssetFromSearch = async (asset: Asset) => {
    try {
      // If the asset doesn't have complete data, fetch it
      if (!asset.price || asset.price === 0) {
        setIsLoading(true);
        const [detailedAsset] = await getMultipleAssetDetails([asset.symbol]);
        if (detailedAsset) {
          asset = detailedAsset;
        }
      }
      
      setSelectedAsset(asset);
      setSearchModalVisible(false);
    } catch (err) {
      console.error("Error getting asset details:", err);
      Alert.alert("Error", "Failed to get asset details. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBuyAsset = () => {
    if (!selectedAsset) {
      Alert.alert("Error", "Please select an asset first.");
      return;
    }

    // Navigate to a buy screen (to be implemented)
    Alert.alert(
      "Buy Asset",
      `This will navigate to the Buy screen for ${selectedAsset.symbol}.\nThis feature will be implemented soon.`,
      [
        {
          text: "OK",
          style: "cancel",
        },
      ]
    );
  };

  const handleSellAsset = () => {
    if (!selectedAsset) {
      Alert.alert("Error", "Please select an asset first.");
      return;
    }

    // Navigate to a sell screen (to be implemented)
    Alert.alert(
      "Sell Asset",
      `This will navigate to the Sell screen for ${selectedAsset.symbol}.\nThis feature will be implemented soon.`,
      [
        {
          text: "OK",
          style: "cancel",
        },
      ]
    );
  };

  const handleAddToPortfolio = async () => {
    if (!selectedAsset) {
      Alert.alert("Error", "Please select an asset first.");
      return;
    }

    if (!portfolioId) {
      // If accessed directly without a portfolio ID, navigate to dashboard
      Alert.alert(
        "No Portfolio Selected",
        "Would you like to go to your portfolios to select one?",
        [
          {
            text: "Yes",
            onPress: () => navigation.navigate("Dashboard"),
          },
          {
            text: "Cancel",
            style: "cancel",
          },
        ]
      );
      return;
    }

    try {
      setIsAddingAsset(true);

      // Simplified data that matches the backend AddHoldingDto
      const holdingData = {
        symbol: selectedAsset.symbol,
        amount: 100, // Default amount
        boughtAtPrice: selectedAsset.price, // Current price
      };

      // Add the holding to the portfolio
      await api.holdings.add(portfolioId, holdingData);

      // Show success message
      Alert.alert(
        "Success",
        `Added ${selectedAsset.symbol} to your portfolio!`,
        [
          {
            text: "View Portfolio",
            onPress: () => navigation.navigate("Portfolio", { portfolioId }),
          },
          {
            text: "Add More",
            style: "cancel",
          },
        ]
      );

      // Reset selection
      setSelectedAsset(null);
    } catch (error) {
      console.error("Error adding asset to portfolio:", error);
      Alert.alert(
        "Error",
        "Failed to add asset to portfolio. Please try again."
      );
    } finally {
      setIsAddingAsset(false);
    }
  };

  // Determine if we're in "add to portfolio" mode
  const isAddToPortfolioMode = !!portfolioId;

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader
        title={isAddToPortfolioMode ? "Add Asset to Portfolio" : "Assets"}
        username={user?.username || "User"}
      />
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.textPink]}
            tintColor={COLORS.textPink}
          />
        }
      >
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Top Market Movers</Text>
            <TouchableOpacity onPress={handleSearch}>
              <Icon
                name="search"
                type="feather"
                color={COLORS.textWhite}
                size={24}
              />
            </TouchableOpacity>
          </View>

          {isLoading && !refreshing ? (
            <ActivityIndicator color={COLORS.textPink} size="large" style={styles.loader} />
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <Button
                title="Try Again"
                onPress={loadTopMovers}
                buttonStyle={styles.retryButton}
              />
            </View>
          ) : (
            <FlatList
              data={topMovers}
              renderItem={renderMoverCard}
              keyExtractor={(item) => item.symbol}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.moversList}
            />
          )}
        </View>

        {selectedAsset && (
          <View style={styles.section}>
            <View style={styles.assetHeader}>
              <View>
                <Text style={styles.assetSymbol}>{selectedAsset.symbol}</Text>
                <Text style={styles.assetName}>{selectedAsset.fullName || selectedAsset.name}</Text>
                {selectedAsset.sector && (
                  <Text style={styles.assetSector}>{selectedAsset.sector}</Text>
                )}
              </View>
              <View style={styles.priceContainer}>
                <Text style={styles.assetPrice}>${selectedAsset.price?.toFixed(2) || "0.00"}</Text>
                <Text
                  style={[
                    styles.assetChange,
                    {
                      color: (selectedAsset.change || 0) >= 0 ? "#4CAF50" : "#FF5252",
                    },
                  ]}
                >
                  {(selectedAsset.change || 0) >= 0 ? "+" : ""}
                  {selectedAsset.change?.toFixed(2) || "0.00"}%
                </Text>
              </View>
            </View>

            <PortfolioChart
              data={{
                value: selectedAsset.price || 0,
                change: selectedAsset.change || 0,
                timeRanges,
                selectedRange,
                onRangeSelect: setSelectedRange,
              }}
            />

            <View style={styles.tradeButtons}>
              {isAddToPortfolioMode ? (
                <Button
                  title="Add"
                  buttonStyle={styles.addToPortfolioButton}
                  loading={isAddingAsset}
                  disabled={isAddingAsset}
                  onPress={handleAddToPortfolio}
                />
              ) : (
                <>
                  <Button
                    title="Buy"
                    buttonStyle={[styles.tradeButton, styles.buyButton]}
                    onPress={handleBuyAsset}
                  />
                  <Button
                    title="Sell"
                    buttonStyle={[styles.tradeButton, styles.sellButton]}
                    onPress={handleSellAsset}
                  />
                </>
              )}
            </View>
          </View>
        )}

        <BottomNavSpacer extraSpace={20} />
      </ScrollView>

      {/* Asset Search Modal */}
      <AssetSearchModal
        visible={searchModalVisible}
        onClose={() => setSearchModalVisible(false)}
        onSelectAsset={handleSelectAssetFromSearch}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.deepPurpleBackground,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.textWhite,
  },
  searchInput: {
    marginHorizontal: 20,
    marginTop: 10,
  },
  moversList: {
    paddingRight: 20,
  },
  moverCard: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    padding: 15,
    marginRight: 12,
    width: 120,
  },
  selectedMoverCard: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderColor: COLORS.primary,
    borderWidth: 1,
  },
  symbolText: {
    color: COLORS.textWhite,
    fontSize: 16,
    fontWeight: "600",
  },
  priceText: {
    color: COLORS.textWhite,
    fontSize: 14,
    marginTop: 4,
  },
  changeText: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 4,
  },
  assetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  assetSymbol: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.textWhite,
  },
  assetName: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  assetSector: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    opacity: 0.7,
  },
  priceContainer: {
    alignItems: "flex-end",
  },
  assetPrice: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.textWhite,
  },
  assetChange: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 4,
  },
  tradeButtons: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
  },
  tradeButton: {
    width: "48%",
    borderRadius: 8,
    paddingVertical: 12,
    margin: 5,
  },
  buyButton: {
    backgroundColor: "#4CAF50",
  },
  sellButton: {
    backgroundColor: "#FF5252",
  },
  addToPortfolioButton: {
    alignSelf: "center",
    width: "80%",
    borderRadius: 12,
    paddingVertical: 14,
    backgroundColor: COLORS.primary,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  loader: {
    marginVertical: 20,
  },
  errorContainer: {
    padding: 15,
    alignItems: "center",
  },
  errorText: {
    color: "#FF5252",
    marginBottom: 10,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
});
