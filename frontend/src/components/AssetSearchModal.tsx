import React, { useState, useEffect } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Modal,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Text, Input, Icon } from "@rneui/themed";
import { COLORS } from "../constants/colors";
import { Asset } from "../types";
import { searchAssets, getMultipleAssetDetails } from "../services/financialApi";

interface AssetSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectAsset: (asset: Asset) => void;
}

export const AssetSearchModal: React.FC<AssetSearchModalProps> = ({
  visible,
  onClose,
  onSelectAsset,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<Asset[]>([]);
  const [recentSearches, setRecentSearches] = useState<Asset[]>([]);
  const [popularAssets, setPopularAssets] = useState<Asset[]>([]);

  const categories = ["All", "Stocks", "ETFs", "Crypto", "Forex"];

  // Load popular assets on mount and when modal becomes visible
  useEffect(() => {
    if (visible) {
      loadPopularAssets();
      // Load recent searches from storage (in a real app)
      // For now, we'll use mock data
      setRecentSearches([]);
    }
  }, [visible]);

  // Load popular assets
  const loadPopularAssets = async () => {
    const defaultSymbols = ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "META", "NVDA", "BTC-USD", "ETH-USD"];
    
    try {
      setIsLoading(true);
      const assets = await getMultipleAssetDetails(defaultSymbols);
      setPopularAssets(assets);
    } catch (error) {
      console.error("Error loading popular assets:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search input changes with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= 2) {
        handleSearch(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle search
  const handleSearch = async (query: string) => {
    if (query.length < 2) return;
    
    try {
      setIsLoading(true);
      const results = await searchAssets(query);
      setSearchResults(results);
    } catch (error) {
      console.error("Error searching assets:", error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle asset selection
  const handleSelectAsset = async (asset: Asset) => {
    try {
      setIsLoading(true);
      
      // If the asset doesn't have price data yet, fetch it
      if (asset.price === 0) {
        const [detailedAsset] = await getMultipleAssetDetails([asset.symbol]);
        if (detailedAsset) {
          asset = detailedAsset;
        }
      }
      
      // Add to recent searches (avoiding duplicates)
      setRecentSearches(prev => {
        const exists = prev.some(item => item.symbol === asset.symbol);
        if (exists) {
          return prev;
        }
        // Keep only the 5 most recent
        return [asset, ...prev].slice(0, 5);
      });
      
      // Pass the asset to the parent component
      onSelectAsset(asset);
      onClose();
    } catch (error) {
      console.error("Error selecting asset:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter assets by category
  const filterByCategory = (assets: Asset[]): Asset[] => {
    if (selectedCategory === "All") {
      return assets;
    }
    
    return assets.filter(asset => {
      const type = asset.type?.toLowerCase() || "";
      
      switch (selectedCategory) {
        case "Stocks":
          return type.includes("equity") || type.includes("stock");
        case "ETFs":
          return type.includes("etf") || type.includes("fund");
        case "Crypto":
          return type.includes("crypto") || type.includes("currency");
        case "Forex":
          return type.includes("forex") || type.includes("currency pair");
        default:
          return true;
      }
    });
  };

  const renderAssetItem = ({ item }: { item: Asset }) => (
    <TouchableOpacity
      style={styles.assetItem}
      onPress={() => handleSelectAsset(item)}
    >
      <View>
        <Text style={styles.assetSymbol}>{item.symbol}</Text>
        <Text style={styles.assetName}>{item.fullName || item.name}</Text>
      </View>
      <View style={styles.assetPriceContainer}>
        <Text style={styles.assetPrice}>
          ${item.price?.toFixed(2) || "0.00"}
        </Text>
        <Text
          style={[
            styles.assetChange,
            { color: (item.change || 0) >= 0 ? "#4CAF50" : "#FF5252" },
          ]}
        >
          {(item.change || 0) >= 0 ? "+" : ""}
          {item.change?.toFixed(2) || "0.00"}%
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Icon name="x" type="feather" color={COLORS.textWhite} size={24} />
          </TouchableOpacity>
          <Text style={styles.title}>Search Assets</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.searchContainer}>
          <Input
            placeholder="Search by symbol or name"
            placeholderTextColor={COLORS.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            inputStyle={styles.searchInput}
            containerStyle={styles.searchInputContainer}
            leftIcon={
              <Icon
                name="search"
                type="feather"
                color={COLORS.textSecondary}
                size={20}
              />
            }
            rightIcon={
              isLoading ? <ActivityIndicator color={COLORS.textPink} size="small" /> : undefined
            }
          />
        </View>

        {/* Fixed height container for categories */}
        <View style={styles.categoriesWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContentContainer}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryButton,
                  selectedCategory === category && styles.selectedCategory,
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text
                  style={[
                    styles.categoryText,
                    selectedCategory === category && styles.selectedCategoryText,
                  ]}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        
        {/* Divider */}
        <View style={styles.divider} />

        <ScrollView>
          {searchQuery ? (
            // Show search results
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Search Results</Text>
              {isLoading && searchResults.length === 0 ? (
                <ActivityIndicator color={COLORS.textPink} style={styles.loader} />
              ) : searchResults.length > 0 ? (
                filterByCategory(searchResults).map((asset) => (
                  <View key={asset.symbol}>
                    {renderAssetItem({ item: asset })}
                  </View>
                ))
              ) : (
                <Text style={styles.noResultsText}>
                  No assets found matching "{searchQuery}"
                </Text>
              )}
            </View>
          ) : (
            // Show recent and popular when not searching
            <>
              {recentSearches.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Recent Searches</Text>
                  {filterByCategory(recentSearches).map((asset) => (
                    <View key={asset.symbol}>
                      {renderAssetItem({ item: asset })}
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Popular Assets</Text>
                {isLoading && popularAssets.length === 0 ? (
                  <ActivityIndicator color={COLORS.textPink} style={styles.loader} />
                ) : (
                  filterByCategory(popularAssets).map((asset) => (
                    <View key={asset.symbol}>
                      {renderAssetItem({ item: asset })}
                    </View>
                  ))
                )}
              </View>
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.deepPurpleBackground,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.textWhite,
  },
  searchContainer: {
    padding: 20,
    paddingBottom: 10,
  },
  searchInputContainer: {
    paddingHorizontal: 0,
  },
  searchInput: {
    color: COLORS.textWhite,
    fontSize: 16,
  },
  categoriesWrapper: {
    height: 50,
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  categoriesContentContainer: {
    alignItems: "center",
    height: 50,
    paddingVertical: 5,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    marginRight: 8,
    minWidth: 80,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  selectedCategory: {
    backgroundColor: COLORS.primary,
  },
  categoryText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  selectedCategoryText: {
    color: COLORS.textWhite,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textWhite,
    marginBottom: 15,
  },
  assetItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  assetSymbol: {
    color: COLORS.textWhite,
    fontSize: 16,
    fontWeight: "600",
  },
  assetName: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 2,
  },
  assetPriceContainer: {
    alignItems: "flex-end",
  },
  assetPrice: {
    color: COLORS.textWhite,
    fontSize: 16,
    fontWeight: "500",
  },
  assetChange: {
    fontSize: 14,
    marginTop: 2,
  },
  noResultsText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    textAlign: "center",
    marginTop: 20,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  loader: {
    marginVertical: 20,
  },
});
