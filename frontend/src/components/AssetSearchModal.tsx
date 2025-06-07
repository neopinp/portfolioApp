import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Modal,
  ScrollView,
} from 'react-native';
import { Text, Input, Icon } from '@rneui/themed';
import { COLORS } from '../constants/colors';

interface Asset {
  symbol: string;
  name: string;
  type: string;
}

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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', 'Stocks', 'Crypto', 'ETFs', 'Forex'];
  
  const recentSearches: Asset[] = [
    { symbol: 'AAPL', name: 'Apple Inc.', type: 'Stocks' },
    { symbol: 'BTC', name: 'Bitcoin', type: 'Crypto' },
    { symbol: 'VOO', name: 'Vanguard S&P 500 ETF', type: 'ETFs' },
  ];

  const popularAssets: Asset[] = [
    { symbol: 'MSFT', name: 'Microsoft Corporation', type: 'Stocks' },
    { symbol: 'ETH', name: 'Ethereum', type: 'Crypto' },
    { symbol: 'QQQ', name: 'Invesco QQQ Trust', type: 'ETFs' },
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
        <Text style={styles.assetName}>{item.name}</Text>
      </View>
      <Text style={styles.assetType}>{item.type}</Text>
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
              <Icon name="search" type="feather" color={COLORS.textSecondary} size={20} />
            }
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryButton,
                selectedCategory === category && styles.selectedCategory,
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text style={[
                styles.categoryText,
                selectedCategory === category && styles.selectedCategoryText,
              ]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView>
          {!searchQuery && (
            <>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Recent Searches</Text>
                {recentSearches.map((asset) => (
                  <View key={asset.symbol}>
                    {renderAssetItem({ item: asset })}
                  </View>
                ))}
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Popular Assets</Text>
                {popularAssets.map((asset) => (
                  <View key={asset.symbol}>
                    {renderAssetItem({ item: asset })}
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Search results would go here */}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
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
  categoriesContainer: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginRight: 8,
  },
  selectedCategory: {
    backgroundColor: COLORS.primary,
  },
  categoryText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  selectedCategoryText: {
    color: COLORS.textWhite,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textWhite,
    marginBottom: 15,
  },
  assetItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  assetSymbol: {
    color: COLORS.textWhite,
    fontSize: 16,
    fontWeight: '600',
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
}); 