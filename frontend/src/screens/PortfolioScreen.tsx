import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Text } from "@rneui/themed";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "../constants/colors";
import { PortfolioChart } from "../components/TimeSeriesChart";
import { HoldingItem } from "../components/HoldingItem";
import { AppHeader } from "../components/AppHeader";
import { Icon } from "@rneui/themed";
import { useAuth } from "../contexts/AuthContext";
import { usePortfolio } from "../contexts/PortfolioContext";
import { Holding, Portfolio as PortfolioType } from "../types";
import { api } from "../services/api";
import { BottomNavSpacer } from "../components/BottomNavSpacer";

export const PortfolioScreen = ({ route, navigation }: any) => {
  // Get portfolioId from route params or use the selected portfolio from context
  const { portfolioId: routePortfolioId } = route.params || {};
  const { selectedPortfolio: contextPortfolio } = usePortfolio();
  
  // Use the portfolioId from route params if available, otherwise use the one from context
  const portfolioId = routePortfolioId || (contextPortfolio?.id);
  
  const { user } = useAuth();
  const [timeRanges] = useState(["1D", "1W", "1M", "3M", "6M"]);
  const [selectedRange, setSelectedRange] = useState("1M");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for the portfolio data
  const [portfolio, setPortfolio] = useState<{
    name: string;
    value: number;
    change: number;
    holdings: Holding[];
  }>({
    name: "",
    value: 0,
    change: 0,
    holdings: [],
  });

  // Fetch portfolio data when the component mounts or portfolioId changes
  useEffect(() => {
    const fetchPortfolioData = async () => {
      // If no portfolioId is available, show an error
      if (!portfolioId) {
        setError("No portfolio selected. Please select a portfolio from the Dashboard.");
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch the portfolio data using the API
        const response = await api.portfolios.getOne(portfolioId);
        
        // Transform the response to match our expected format
        const portfolioData = {
          name: response.portfolio?.name || "Portfolio",
          value: Number(response.portfolio?.starting_balance) || 0,
          change: 0, // Default to 0 if not available
          holdings: response.portfolio?.holdings || [],
        };
        
        setPortfolio(portfolioData);
      } catch (err) {
        console.error("Error fetching portfolio:", err);
        setError("Failed to load portfolio data");
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolioData();
  }, [portfolioId]);

  const chartData = {
    value: portfolio.value,
    change: portfolio.change,
    timeRanges,
    selectedRange,
    onRangeSelect: setSelectedRange,
  };

  const handleAddHolding = () => {
    // Navigate to Assets screen with the portfolio ID
    navigation.navigate("Assets", { portfolioId });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <AppHeader title="Loading..." username={user?.username || "User"} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.textPink} />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <AppHeader title="Error" username={user?.username || "User"} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

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
          {portfolio.holdings.length > 0 ? (
            portfolio.holdings.map((holding) => (
              <HoldingItem key={holding.id} holding={holding} />
            ))
          ) : (
            <Text style={styles.emptyText}>
              No holdings yet. Add some assets to get started!
            </Text>
          )}
        </View>

        {/* News Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>News about this Portfolio</Text>
          {/* Add news items here */}
          <Text style={styles.emptyText}>No news available at this time.</Text>
        </View>
        
        {/* Add spacer at the bottom to prevent content from being hidden behind the nav bar */}
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    color: COLORS.textPink,
    fontSize: 16,
    textAlign: "center",
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: "center",
    marginVertical: 20,
  },
});
