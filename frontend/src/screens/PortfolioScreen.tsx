import React, { useState } from "react";
import { View, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { Text } from "@rneui/themed";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "../constants/colors";
import { PortfolioChart } from "../components/PortfolioChart";
import { HoldingItem } from "../components/HoldingItem";
import { AppHeader } from "../components/AppHeader";
import { Icon } from "@rneui/themed";
import { useAuth } from "../contexts/AuthContext";

interface Holding {
  id: number;
  symbol: string;
  fullName: string;
  value: number;
  change: number;
  imageUrl?: string;
}

export const PortfolioScreen = ({ route, navigation }: any) => {
  const { portfolioId } = route.params;
  const { user } = useAuth();
  const [timeRanges] = useState(["1D", "1W", "1M", "3M", "6M"]);
  const [selectedRange, setSelectedRange] = useState("1M");

  // Mock data - replace with real data from your API
  const [portfolio] = useState({
    name: "Portfolio Name",
    value: 45678.9,
    change: 8.5,
    holdings: [
      {
        id: 1,
        symbol: "TSLA",
        fullName: "Tesla Inc.",
        value: 15000,
        change: 6.2,
      },
      {
        id: 2,
        symbol: "AAPL",
        fullName: "Apple Inc.",
        value: 12000,
        change: 8.0,
      },
      {
        id: 3,
        symbol: "NVDA",
        fullName: "NVIDIA Corporation",
        value: 9000,
        change: -2.5,
      },
    ] as Holding[],
  });

  const chartData = {
    value: portfolio.value,
    change: portfolio.change,
    timeRanges,
    selectedRange,
    onRangeSelect: setSelectedRange,
  };

  const handleAddHolding = () => {
    // Implement the logic to add a new holding
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title={portfolio.name} username={user?.username || "User"} />
      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <PortfolioChart data={chartData} />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Holdings</Text>
            <TouchableOpacity onPress={handleAddHolding}>
              <Icon name="plus" type="feather" color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {portfolio.holdings.map((holding) => (
            <HoldingItem
              key={holding.id}
              symbol={holding.symbol}
              fullName={holding.fullName}
              value={holding.value}
              change={holding.change}
              imageUrl={holding.imageUrl}
            />
          ))}
        </View>

        {/* News Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>News about this Portfolio</Text>
          {/* Add news items here */}
        </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textWhite,
  },
  moversScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  moverCard: {
    width: 80,
    height: 80,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    marginRight: 10,
    padding: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  moverSymbol: {
    color: COLORS.textWhite,
    fontSize: 14,
    fontWeight: "600",
  },
  moverValue: {
    color: COLORS.textWhite,
    fontSize: 12,
    marginTop: 4,
  },
  moverChange: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  holdingsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  addAssetButton: {
    padding: 8,
  },
  addAsset: {
    color: COLORS.textPink,
    fontSize: 16,
  },
});
