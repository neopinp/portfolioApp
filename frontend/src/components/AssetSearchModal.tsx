import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Modal,
  ScrollView,
} from "react-native";
import { Text, Input, Icon } from "@rneui/themed";
import { COLORS } from "../constants/colors";
import { Asset } from "../types";

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

  const categories = ["All", "Stocks", "Crypto", "ETFs", "Forex"];

  const recentSearches: Asset[] = [
    {
      symbol: "AAPL",
      name: "Apple Inc.",
      fullName: "Apple Inc.",
      price: 189.84,
      change: 2.3,
      riskScore: 6,
      type: "Stocks",
    },
    {
      symbol: "BTC",
      name: "Bitcoin",
      fullName: "Bitcoin",
      price: 68245.5,
      change: -1.2,
      riskScore: 9,
      type: "Crypto",
    },
    {
      symbol: "VOO",
      name: "Vanguard S&P 500 ETF",
      fullName: "Vanguard S&P 500 ETF",
      price: 458.72,
      change: 0.8,
      riskScore: 5,
      type: "ETFs",
    },
  ];

  const popularAssets: Asset[] = [
    {
      symbol: "MSFT",
      name: "Microsoft Corporation",
      fullName: "Microsoft Corporation",
      price: 417.32,
      change: 1.5,
      riskScore: 5,
      type: "Stocks",
    },
    {
      symbol: "ETH",
      name: "Ethereum",
      fullName: "Ethereum",
      price: 3456.78,
      change: -0.5,
      riskScore: 8,
      type: "Crypto",
    },
    {
      symbol: "QQQ",
      name: "Invesco QQQ Trust",
      fullName: "Invesco QQQ Trust",
      price: 438.29,
      change: 1.2,
      riskScore: 6,
      type: "ETFs",
    },
    {
      symbol: "NVDA",
      name: "NVIDIA Corporation",
      fullName: "NVIDIA Corporation",
      price: 477.76,
      change: 3.5,
      riskScore: 7,
      type: "Stocks",
    },
    {
      symbol: "AMZN",
      name: "Amazon.com Inc.",
      fullName: "Amazon.com Inc.",
      price: 178.15,
      change: 0.7,
      riskScore: 6,
      type: "Stocks",
    },
    {
      symbol: "TSLA",
      name: "Tesla Inc.",
      fullName: "Tesla Inc.",
      price: 238.45,
      change: -1.8,
      riskScore: 8,
      type: "Stocks",
    },
    {
      symbol: "META",
      name: "Meta Platforms",
      fullName: "Meta Platforms",
      price: 341.49,
      change: 1.7,
      riskScore: 6,
      type: "Stocks",
    },
  ];

  const renderAssetItem = ({ item }: { item: Asset }) => (
    <TouchableOpacity
      style={styles.assetItem}
      onPress={() => {
        onSelectAsset(item);
        onClose();
      }}
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

  // Filter assets based on search query and category
  const filteredAssets = [...recentSearches, ...popularAssets]
    .filter((asset) => {
      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          asset.symbol.toLowerCase().includes(query) ||
          asset.name.toLowerCase().includes(query) ||
          (asset.fullName && asset.fullName.toLowerCase().includes(query))
        );
      }
      return true;
    })
    .filter((asset) => {
      // Filter by category
      if (selectedCategory !== "All") {
        return asset.type === selectedCategory;
      }
      return true;
    });

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
              {filteredAssets.length > 0 ? (
                filteredAssets.map((asset) => (
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
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Recent Searches</Text>
                {recentSearches
                  .filter(
                    (asset) =>
                      selectedCategory === "All" ||
                      asset.type === selectedCategory
                  )
                  .map((asset) => (
                    <View key={asset.symbol}>
                      {renderAssetItem({ item: asset })}
                    </View>
                  ))}
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Popular Assets</Text>
                {popularAssets
                  .filter(
                    (asset) =>
                      selectedCategory === "All" ||
                      asset.type === selectedCategory
                  )
                  .map((asset) => (
                    <View key={asset.symbol}>
                      {renderAssetItem({ item: asset })}
                    </View>
                  ))}
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
    marginBottom: -35
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
  assetType: {
    color: COLORS.textSecondary,
    fontSize: 14,
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
});
