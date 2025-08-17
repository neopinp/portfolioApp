import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Text } from "@rneui/themed";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { COLORS } from "../constants/colors";
import { TimeSeriesChart } from "../components/TimeSeriesChart";
import { HoldingItem } from "../components/HoldingItem";
import { AppHeader } from "../components/AppHeader";
import { Icon } from "@rneui/themed";
import { useAuth } from "../contexts/AuthContext";
import { usePortfolio } from "../contexts/PortfolioContext";
import { HistoricalDataPoint, Holding, PortfolioHistoryData } from "../types";
import { api } from "../services/api";
import { BottomNavSpacer } from "../components/BottomNavSpacer";
import { ChartData } from "../types";
import { getTimeSeriesParams } from "services/financialApi";

export const PortfolioScreen = ({ route, navigation }: any) => {
  // Get portfolioId from route params or use the selected portfolio from context
  const { portfolioId: routePortfolioId } = route.params || {};
  const { selectedPortfolio: contextPortfolio } = usePortfolio();

  // Use the portfolioId from route params if available, otherwise use the one from context
  const portfolioId = routePortfolioId || contextPortfolio?.id;

  // Log portfolio information only once when component mounts or dependencies change
  useEffect(() => {
    console.log(
      "PortfolioScreen - Context portfolio:",
      contextPortfolio?.id,
      contextPortfolio?.name
    );
    console.log("PortfolioScreen - Route portfolio ID:", routePortfolioId);
    console.log("PortfolioScreen - Using portfolio ID:", portfolioId);
  }, [
    contextPortfolio?.id,
    contextPortfolio?.name,
    routePortfolioId,
    portfolioId,
  ]);

  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRanges] = useState(["1D", "1W", "1M", "3M", "6M", "1Y", "5Y"]);
  const [selectedRange, setSelectedRange] = useState("1Y");
  // chart states
  const [chartData, setChartData] = useState<ChartData | undefined>(); // filtered

  const [chartLoading, setChartLoading] = useState(false);
  const isLoadingRef = useRef(false);

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


  const handleTimeRangeSelect = useCallback(
    async (range: string) => {
      if (!portfolioId) return;
      try {
        setChartLoading(true);
        setSelectedRange(range);

        const res = await api.portfolios.getChartData(portfolioId, range);
        console.log("Chart Data Response:", JSON.stringify(res, null, 2));

        // The backend already returns the correct format, just validate it
        if (res?.data && Array.isArray(res.data)) {
          setChartData(res);

          // Update portfolio value and change from the latest data point
          if (res.data.length > 0) {
            const lastPoint = res.data[res.data.length - 1];
            setPortfolio((p) => ({
              ...p,
              value: lastPoint.price,
              change: res.changePercent || 0,
            }));
          }
        }
      } catch (e) {
        console.error("Error loading chart data - handleTimeRangeSelect", e);
      } finally {
        setChartLoading(false);
      }
    },
    [portfolioId]
  );

  const fetchPortfolioData = useCallback(
    async (isRefreshing = false) => {
      // Prevent multiple simultaneous fetches
      if (isLoadingRef.current && !isRefreshing) return;

      // If no portfolioId is available, show an error
      if (!portfolioId) {
        setError(
          "No portfolio selected. Please select a portfolio from the Dashboard."
        );
        setLoading(false);
        return;
      }

      try {
        isLoadingRef.current = true;
        if (!isRefreshing) {
          setLoading(true);
        }
        setError(null);

        // Fetch the portfolio data using the API
        const response = await api.portfolios.getOne(portfolioId);

        // Transform the response to match our expected format
        const portfolioData = {
          name: response.portfolio?.name || "Portfolio",
          holdings: response.portfolio?.holdings || [],
          value: 0,
          change: 0,
        };

        setPortfolio(portfolioData);
        console.log(
          "Portfolio data refreshed with",
          portfolioData.holdings.length,
          "holdings"
        );
      } catch (err) {
        console.error("Error fetching portfolio:", err);
        setError("Failed to load portfolio data");
      } finally {
        setLoading(false);
        isLoadingRef.current = false;
      }
    },
    [portfolioId]
  );

  // Handle pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPortfolioData(true);
    setRefreshing(false);
  }, [fetchPortfolioData]);

  // Inital portfolio data load
  useEffect(() => {
    fetchPortfolioData();
  }, [fetchPortfolioData]);

  // Refresh data when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log("PortfolioScreen focused - refreshing data");
      fetchPortfolioData();

      return () => {
        // This runs when the screen goes out of focus
        console.log("PortfolioScreen unfocused");
      };
    }, [fetchPortfolioData])
  );

  // Update the chart data object with validation
  const chartDataProps = {
    value: portfolio.value,
    change: portfolio.change,
    timeRanges,
    selectedRange,
    onRangeSelect: handleTimeRangeSelect,
    chartData, // Pass the data directly without transformation
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
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.textPink]}
          />
        }
      >
        <View style={styles.section}>
          <TimeSeriesChart data={chartDataProps} />
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
