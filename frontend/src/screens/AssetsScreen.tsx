import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Animated,
  Alert,
} from "react-native";
import { Text, Input, Icon, Button } from "@rneui/themed";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "../constants/colors";
import { PortfolioChart } from "../components/PortfolioChart";
import { AppHeader } from "../components/AppHeader";
import { BottomNavSpacer } from "../components/BottomNavSpacer";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";
import { Asset } from "../types";

export const AssetsScreen = ({ route, navigation }: any) => {
  const { portfolioId } = route.params || {};
  const { user } = useAuth();
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [timeRanges] = useState(["1D", "1W", "1M", "3M", "6M"]);
  const [selectedRange, setSelectedRange] = useState("1M");
  const [isAddingAsset, setIsAddingAsset] = useState(false);

  const topMovers: Asset[] = [
    { symbol: "AAPL", name: "Apple Inc.", price: 189.84, change: 2.3, riskScore: 6 },
    { symbol: "TSLA", name: "Tesla Inc.", price: 238.45, change: -1.8, riskScore: 8 },
    { symbol: "NVDA", name: "NVIDIA Corp.", price: 477.76, change: 3.5, riskScore: 7 },
    { symbol: "META", name: "Meta Platforms", price: 341.49, change: 1.7, riskScore: 6 },
  ];

  const renderMoverCard = ({ item }: { item: Asset }) => (
    <TouchableOpacity
      style={[
        styles.moverCard,
        selectedAsset?.symbol === item.symbol && styles.selectedMoverCard,
      ]}
      onPress={() => setSelectedAsset(item)}
    >
      <Text style={styles.symbolText}>{item.symbol}</Text>
      <Text style={styles.priceText}>${item.price}</Text>
      <Text
        style={[
          styles.changeText,
          { color: item.change >= 0 ? "#4CAF50" : "#FF5252" },
        ]}
      >
        {item.change > 0 ? "+" : ""}
        {item.change}%
      </Text>
    </TouchableOpacity>
  );

  const handleSearch = () => {
    setShowSearch(true);
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
            onPress: () => navigation.navigate("Dashboard") 
          },
          { 
            text: "Cancel", 
            style: "cancel" 
          }
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
            onPress: () => navigation.navigate("Portfolio", { portfolioId }) 
          },
          { 
            text: "Add More", 
            style: "cancel" 
          }
        ]
      );
      
      // Reset selection
      setSelectedAsset(null);
    } catch (error) {
      console.error("Error adding asset to portfolio:", error);
      Alert.alert("Error", "Failed to add asset to portfolio. Please try again.");
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
      <ScrollView style={styles.scrollView}>
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

          <FlatList
            data={topMovers}
            renderItem={renderMoverCard}
            keyExtractor={(item) => item.symbol}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.moversList}
          />
        </View>

        {selectedAsset && (
          <View style={styles.section}>
            <View style={styles.assetHeader}>
              <View>
                <Text style={styles.assetSymbol}>{selectedAsset.symbol}</Text>
                <Text style={styles.assetName}>{selectedAsset.name}</Text>
              </View>
              <View style={styles.priceContainer}>
                <Text style={styles.assetPrice}>${selectedAsset.price}</Text>
                <Text
                  style={[
                    styles.assetChange,
                    {
                      color: selectedAsset.change >= 0 ? "#4CAF50" : "#FF5252",
                    },
                  ]}
                >
                  {selectedAsset.change > 0 ? "+" : ""}
                  {selectedAsset.change}%
                </Text>
              </View>
            </View>

            <PortfolioChart
              data={{
                value: selectedAsset.price,
                change: selectedAsset.change,
                timeRanges,
                selectedRange,
                onRangeSelect: setSelectedRange,
              }}
            />

            <View style={styles.tradeButtons}>
              {isAddToPortfolioMode ? (
                <Button
                  title="Add to Portfolio"
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
                  />
                  <Button
                    title="Sell"
                    buttonStyle={[styles.tradeButton, styles.sellButton]}
                  />
                </>
              )}
            </View>
          </View>
        )}
        
        <BottomNavSpacer extraSpace={20} />
      </ScrollView>
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
    justifyContent: "space-between",
    marginTop: 20,
  },
  tradeButton: {
    width: "48%",
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
    width: "100%",
    borderRadius: 8,
    paddingVertical: 12,
    backgroundColor: COLORS.primary,
  },
});
