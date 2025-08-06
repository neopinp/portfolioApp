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
import { POPULAR_SYMBOLS } from "../constants/assets";
import { TimeSeriesChart } from "../components/TimeSeriesChart";
import { AppHeader } from "../components/AppHeader";
import { BottomNavSpacer } from "../components/BottomNavSpacer";
import { AssetSearchModal } from "../components/AssetSearchModal";
import { SimulateHoldingModal } from "../components/SimulateHoldingModal";
import { TradeButtons } from "../components/TradeButtons";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";
import { Asset } from "../types";
import { usePortfolio } from "../contexts/PortfolioContext";
import {
  getAssetDetails,
  getMultipleAssetDetails,
  getAssetHistoricalData,
} from "../services/financialApi";
import { ChartData } from "../types";

export const AssetsScreen = ({ navigation }: any) => {
  const { selectedPortfolio: contextPortfolio } = usePortfolio();
  console.log("AssetsScreen - Context portfolio:", contextPortfolio?.id, contextPortfolio?.name);
  const { user } = useAuth();
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [isAddingAsset, setIsAddingAsset] = useState(false);
  const [timeRanges] = useState(["1D", "1W", "1M", "3M", "6M", "1Y", "5Y"]);
  const [selectedRange, setSelectedRange] = useState("1M");
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [topMovers, setTopMovers] = useState<Asset[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [isLoadingChart, setIsLoadingChart] = useState(false);

  // Flippable card state and animations
  const [showDetailedInfo, setShowDetailedInfo] = useState(false);
  const [flipAnimation] = useState(new Animated.Value(0));
  const [heightAnimation] = useState(new Animated.Value(120));

  // Default symbols for "Top Movers"
  const defaultSymbols = POPULAR_SYMBOLS;

  // Load top movers when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadTopMovers();
    }, [])
  );

  // Load top movers data from Finnhub - use Popular Stocks for now
  const loadTopMovers = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const assets = await getMultipleAssetDetails(defaultSymbols);
      const sortedAssets = assets.sort((a, b) => {
        return Math.abs(b.change) - Math.abs(a.change);
      });

      setTopMovers(sortedAssets.slice(0, 5));
    } catch (error) {
      console.error("Error loading top movers:", error);
      setError("Failed to load market data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle time range selection changes
  const handleTimeRangeChange = async (newRange: string) => {
    setSelectedRange(newRange);

    // If we have a selected asset, reload chart data with new time range
    if (selectedAsset) {
      try {
        setIsLoadingChart(true);
        const historicalData = await getAssetHistoricalData(
          selectedAsset.symbol,
          newRange
        );
        setChartData(historicalData);
      } catch (error) {
        console.error(
          `Error loading chart data for ${selectedAsset.symbol}:`,
          error
        );
        setChartData(null);
      } finally {
        setIsLoadingChart(false);
      }
    }
  };

  // getAssetDetails & getAssetHistoricalData
  const handleAssetSelection = async (asset: Asset) => {
    try {
      setIsLoading(true);
      const detailed = await getAssetDetails(asset.symbol);
      const finalAsset = detailed || asset;

      setSelectedAsset(finalAsset);
      await loadChartData(finalAsset);
    } catch (error) {
      console.error(`Error in handleAssetSelection:`, error);
      // Fallback to original asset if detailed fetch fails
      setSelectedAsset(asset);
      await loadChartData(asset);
    } finally {
      setIsLoading(false);
    }
  };
  const loadChartData = async (asset: Asset) => {
    try {
      setIsLoadingChart(true);
      const historicalData = await getAssetHistoricalData(
        asset.symbol,
        selectedRange
      );
      setChartData(historicalData);
    } catch (error) {
      console.error(`Error loading chart data for ${asset.symbol}:`, error);
      setChartData(null);
    } finally {
      setIsLoadingChart(false);
    }
  };

  // strictly for AssetSearchModal
  const handleSearchSelect = async (asset: Asset) => {
    await handleAssetSelection(asset);
    setSearchModalVisible(false);
  };

  const renderMoverCard = ({ item }: { item: Asset }) => (
    <TouchableOpacity
      style={[
        styles.moverCard,
        selectedAsset?.symbol === item.symbol && styles.selectedMoverCard,
      ]}
      onPress={() => handleAssetSelection(item)}
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

  const handleAddAsset = () => {
    if (!contextPortfolio) {
      alert("Please select a portfolio first before adding assets.");
      return;
    }
    setShowTradeModal(true);
  };

  const handleTradeSubmit = async (amount: number, price: number, date: Date) => {
    if (!selectedAsset || !contextPortfolio) return;

    try {
      setIsAddingAsset(true);

      await api.holdings.add(contextPortfolio.id, {
        symbol: selectedAsset.symbol,
        amount,
        boughtAtPrice: price,
        boughtAtDate: date.toISOString(),
      });

      Alert.alert(
        "Success",
        `Added ${amount} shares of ${selectedAsset.symbol} at $${price}`,
        [{ text: "OK" }]
      );
      setShowTradeModal(false);
    } catch (error) {
      console.error("Error adding holding:", error);
      Alert.alert("Error", "Failed to add holding. Please try again.");
    } finally {
      setIsAddingAsset(false);
    }
  };

  const handleSell = () => {
    Alert.alert("Coming Soon", "Sell functionality will be added soon!");
  };

  // Flip card animation function
  const flipCard = () => {
    setShowDetailedInfo(!showDetailedInfo);

    // Flip animation
    Animated.spring(flipAnimation, {
      toValue: showDetailedInfo ? 0 : 180,
      friction: 8,
      tension: 10,
      useNativeDriver: true,
    }).start();

    // Height animation
    const baseHeight = 120;
    const expandedHeight = 360; // Height when expanded to show all details

    Animated.timing(heightAnimation, {
      toValue: showDetailedInfo ? baseHeight : expandedHeight,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  // Handle pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadTopMovers();
    if (selectedAsset) {
      await handleAssetSelection(selectedAsset);
    }
    setRefreshing(false);
  };

  // Determine if we're in "add to portfolio" mode
  // Animation interpolations
  const frontInterpolate = flipAnimation.interpolate({
    inputRange: [0, 180],
    outputRange: ["0deg", "180deg"],
  });

  const backInterpolate = flipAnimation.interpolate({
    inputRange: [0, 180],
    outputRange: ["180deg", "360deg"],
  });

  const frontAnimatedStyle = {
    transform: [{ rotateY: frontInterpolate }],
  };

  const backAnimatedStyle = {
    transform: [{ rotateY: backInterpolate }],
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="Assets" username={user?.username || "User"} />
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
            <Text style={styles.sectionTitle}>Popular Stocks</Text>
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
            <ActivityIndicator
              color={COLORS.textPink}
              size="large"
              style={styles.loader}
            />
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
              <View style={styles.assetInfoContainer}>
                <Text style={styles.assetSymbol}>{selectedAsset.symbol}</Text>
                <Text style={styles.assetName}>
                  {selectedAsset.fullName || selectedAsset.name}
                </Text>
                {selectedAsset.sector && (
                  <Text style={styles.assetSector}>{selectedAsset.sector}</Text>
                )}
              </View>
              <View style={styles.priceContainer}>
                <Text style={styles.assetPrice}>
                  ${selectedAsset.price?.toFixed(2) || "0.00"}
                </Text>
                <Text
                  style={[
                    styles.assetChange,
                    {
                      color:
                        (selectedAsset.change || 0) >= 0
                          ? "#4CAF50"
                          : "#FF5252",
                    },
                  ]}
                >
                  {(selectedAsset.change || 0) >= 0 ? "+" : ""}
                  {selectedAsset.change?.toFixed(2) || "0.00"}%
                </Text>
              </View>
            </View>

            <TimeSeriesChart
              data={{
                value: selectedAsset.price || 0,
                change: selectedAsset.change || 0,
                timeRanges,
                selectedRange,
                onRangeSelect: handleTimeRangeChange,
                chartData: chartData || undefined,
              }}
            />

            {isLoadingChart && (
              <View style={styles.chartLoadingContainer}>
                <ActivityIndicator
                  color={COLORS.textPink}
                  size="small"
                  style={styles.chartLoader}
                />
                <Text style={styles.chartLoadingText}>
                  Loading chart data...
                </Text>
              </View>
            )}

            {/* Flippable Asset Details Card */}
            <Animated.View
              style={[
                styles.assetDetailsContainer,
                {
                  height: heightAnimation,
                },
              ]}
            >
              <TouchableOpacity
                onPress={flipCard}
                activeOpacity={0.9}
                style={styles.cardContainer}
              >
                <Animated.View
                  style={[
                    styles.card,
                    styles.frontCard,
                    frontAnimatedStyle,
                    { display: showDetailedInfo ? "none" : "flex" },
                  ]}
                >
                  <View style={styles.frontCardContent}>
                    <View style={styles.keyMetricsRow}>
                      <View style={styles.keyMetric}>
                        <Text style={styles.metricLabel}>Market Cap</Text>
                        <Text style={styles.metricValue}>
                          {selectedAsset.marketCap || "N/A"}
                        </Text>
                      </View>
                      <View style={styles.keyMetric}>
                        <Text style={styles.metricLabel}>P/E Ratio</Text>
                        <Text style={styles.metricValue}>
                          {selectedAsset.peRatio || "N/A"}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.tapForMoreContainer}>
                      <Text style={styles.tapForMoreText}>
                        Tap for more details
                      </Text>
                    </View>
                  </View>
                </Animated.View>

                <Animated.View
                  style={[
                    styles.card,
                    styles.backCard,
                    backAnimatedStyle,
                    { display: showDetailedInfo ? "flex" : "none" },
                  ]}
                >
                  <Text style={styles.backCardTitle}>Asset Details</Text>
                  <View style={styles.detailsGrid}>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Market Cap</Text>
                      <Text style={styles.detailValue}>
                        {selectedAsset.marketCap || "N/A"}
                      </Text>
                    </View>

                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Shares Outstanding</Text>
                      <Text style={styles.detailValue}>
                        {selectedAsset.sharesOutstanding || "N/A"}
                      </Text>
                    </View>

                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>P/E Ratio</Text>
                      <Text style={styles.detailValue}>
                        {selectedAsset.peRatio || "N/A"}
                      </Text>
                    </View>

                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>EPS</Text>
                      <Text style={styles.detailValue}>
                        {selectedAsset.eps || "N/A"}
                      </Text>
                    </View>

                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>52W High</Text>
                      <Text style={styles.detailValue}>
                        {selectedAsset.high52w || "N/A"}
                      </Text>
                    </View>

                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>52W Low</Text>
                      <Text style={styles.detailValue}>
                        {selectedAsset.low52w || "N/A"}
                      </Text>
                    </View>

                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Beta</Text>
                      <Text style={styles.detailValue}>
                        {selectedAsset.beta || "N/A"}
                      </Text>
                    </View>

                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Dividend Yield</Text>
                      <Text style={styles.detailValue}>
                        {selectedAsset.dividendYield || "N/A"}
                      </Text>
                    </View>

                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Volume</Text>
                      <Text style={styles.detailValue}>
                        {selectedAsset.volume || "N/A"}
                      </Text>
                    </View>

                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Avg Volume</Text>
                      <Text style={styles.detailValue}>
                        {selectedAsset.avgVolume || "N/A"}
                      </Text>
                    </View>
                  </View>
                </Animated.View>
              </TouchableOpacity>
            </Animated.View>

            <View style={styles.tradeButtons}>
              <Button
                title="Buy"
                buttonStyle={[styles.tradeButton, styles.buyButton]}
                onPress={handleAddAsset}
                disabled={!contextPortfolio}
              />
              <Button
                title="Sell"
                buttonStyle={[styles.tradeButton, styles.sellButton]}
                onPress={handleSell}
                disabled={!contextPortfolio}
              />
            </View>
          </View>
        )}

        <BottomNavSpacer extraSpace={20} />
      </ScrollView>

      {/* Trade Modal */}
      <SimulateHoldingModal
        visible={showTradeModal}
        onClose={() => setShowTradeModal(false)}
        onSubmit={handleTradeSubmit}
        asset={selectedAsset}
        portfolioName={contextPortfolio?.name || ""}
        portfolioId={contextPortfolio?.id || 0}
        isLoading={isAddingAsset}
      />

      {/* Asset Search Modal */}
      <AssetSearchModal
        visible={searchModalVisible}
        onClose={() => setSearchModalVisible(false)}
        onSelectAsset={handleSearchSelect}
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
  assetInfoContainer: {
    flex: 1,
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
    flex: 1,
    flexWrap: "wrap",
    maxWidth: "80%",
  },
  assetSector: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    opacity: 0.7,
  },
  priceContainer: {
    alignItems: "flex-end",
    minWidth: 100,
    marginLeft: 10,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 24,
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
  chartLoadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    paddingVertical: 10,
  },
  chartLoader: {
    marginRight: 10,
  },
  chartLoadingText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  assetDetailsContainer: {
    padding: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    marginBottom: 20,
    overflow: "hidden",
  },
  cardContainer: {
    flex: 1,
    position: "relative",
  },
  card: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backfaceVisibility: "hidden",
    padding: 15,
  },
  frontCard: {
    alignItems: "center",
    justifyContent: "center",
  },
  backCard: {
    alignItems: "stretch",
  },
  frontCardContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  keyMetricsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 20,
  },
  keyMetric: {
    alignItems: "center",
    padding: 10,
    marginRight: 25,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.textWhite,
  },
  tapForMoreText: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.textSecondary,
    opacity: 0.8,
    marginTop: 10,
  },
  tapForMoreContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -5,
  },
  detailItem: {
    width: "50%",
    paddingHorizontal: 5,
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.textWhite,
  },
  backCardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.textWhite,
    marginBottom: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
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
    fontWeight: "bold",
    color: COLORS.textWhite,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 24,
  },
  modalButton: {
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 12,
  },
  simulateButton: {
    backgroundColor: COLORS.primary,
  },
  buyNowButton: {
    backgroundColor: "#4CAF50",
  },
  cancelButtonText: {
    color: COLORS.textSecondary,
  },
  tradeSection: {
    marginTop: 24,
  },
  modeToggleContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  modeLabel: {
    color: COLORS.textSecondary,
    marginRight: 12,
    fontSize: 14,
  },
});
