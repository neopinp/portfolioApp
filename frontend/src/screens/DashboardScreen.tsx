import React, { useState, useRef, useEffect } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
} from "react-native";
import { Text, Icon, Overlay } from "@rneui/themed";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "../constants/colors";
import { PortfolioCard } from "../components/PortfolioCard";
// TimeSeriesChart removed from dashboard to simplify loading
import { AppHeader } from "../components/AppHeader";
import { BottomNavSpacer } from "../components/BottomNavSpacer";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";
import { storage, STORAGE_KEYS } from "../utils/storage";
import { Portfolio, OnboardingData, Asset } from "../types";
import { usePortfolio } from "../contexts/PortfolioContext";
import { getAssetDetails } from "../services/financialApi";

// Use a union type for items that could be either a portfolio or a "new portfolio" button
type PortfolioOrNew = Portfolio | { id: number };

export const DashboardScreen = ({ navigation }: any) => {
  const { logout, user } = useAuth();
  const {
    selectedPortfolio: contextPortfolio,
    setSelectedPortfolio: setContextPortfolio,
    getStoredPortfolioId,
  } = usePortfolio();
  const storedSelectedPortfolioIdRef = useRef<number | null>(null);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  // Using context directly instead of local state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Track if we've already created an initial portfolio in this session
  const [hasCreatedInitialPortfolio, setHasCreatedInitialPortfolio] =
    useState(false);

  // Use a ref to track if we're currently loading to prevent infinite loops
  const isLoadingRef = useRef(false);

  const [showRiskDetails, setShowRiskDetails] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [flipAnimation] = useState(new Animated.Value(0));
  const [heightAnimation] = useState(new Animated.Value(180));

  // Load the stored portfolio ID directly from storage on focus
  useEffect(() => {
    const loadStoredIdFromStorage = async () => {
      try {
        // Only attempt to load portfolio ID if user is logged in
        if (user) {
          const storedId = await storage.getItem<number>(
            STORAGE_KEYS.SELECTED_PORTFOLIO
          );
          storedSelectedPortfolioIdRef.current = storedId;
          console.log(
            "Loaded stored portfolio ID directly from storage:",
            storedId
          );
        } else {
          // If no user, ensure portfolio ID is null
          storedSelectedPortfolioIdRef.current = null;
          console.log("No user logged in, portfolio ID set to null");
        }
      } catch (error) {
        console.error("Error loading portfolio ID from storage:", error);
        storedSelectedPortfolioIdRef.current = null;
      }
    };

    // Load on mount
    loadStoredIdFromStorage();

    // Also add a focus listener to reload when returning to this screen
    const unsubscribe = navigation.addListener("focus", () => {
      loadStoredIdFromStorage();
    });

    return unsubscribe;
  }, [navigation, user]);

  // Initial load of portfolios
  useEffect(() => {
    // Only load portfolios if user is logged in
    if (user) {
      loadPortfolios();
    } else {
      // Reset portfolios state when user is logged out
      setPortfolios([]);
      // Use the context function to reset the selected portfolio
      setContextPortfolio(null);
    }

    // Add navigation listener to reload portfolios when returning to this screen
    const unsubscribe = navigation.addListener("focus", () => {
      // Check if we're not already loading to avoid duplicate calls
      if (!isLoadingRef.current && user) {
        loadPortfolios();
      }
    });

    // Cleanup listener on unmount
    return unsubscribe;
  }, [navigation, user]);

  const createInitialPortfolio = async () => {
    try {
      // Get user-specific onboarding data
      const onboardingData = await storage.getItem<OnboardingData>(
        STORAGE_KEYS.USER_PREFERENCES,
        user?.id
      );

      if (!onboardingData) {
        setError("No onboarding data found");
        return;
      }

      const portfolioName =
        onboardingData.investmentGoals === "growth"
          ? "Retirement Riches"
          : onboardingData.investmentGoals === "income"
            ? "Regular Riches"
            : "Right Now Riches";

      // Ensure initialInvestment is a number
      const initialInvestment =
        typeof onboardingData.initialInvestment === "number"
          ? onboardingData.initialInvestment
          : parseFloat(onboardingData.initialInvestment as unknown as string) ||
            1000;

      // Ensure riskTolerance is a number
      const riskTolerance =
        typeof onboardingData.riskTolerance === "number"
          ? onboardingData.riskTolerance
          : parseInt(onboardingData.riskTolerance as unknown as string) || 5;

      const newPortfolio = await api.portfolios.create({
        name: portfolioName,
        startingBalance: initialInvestment,
        riskScore: riskTolerance,
      });

      // Transform portfolio so that it can be passed
      const transformedPortfolio: Portfolio = {
        id: newPortfolio.id,
        name: newPortfolio.name || "",
        value: Number(newPortfolio.startingBalance) || 0, // Initially value equals starting balance
        riskScore: newPortfolio.riskScore || 5,
        change: 0,
        holdings: newPortfolio.holdings || [],
        startingBalance: Number(newPortfolio.startingBalance) || 0,
        userId: newPortfolio.userId,
        createdAt: newPortfolio.createdAt
          ? new Date(newPortfolio.createdAt)
          : undefined,
      };

      setPortfolios([transformedPortfolio]);
      console.log(
        "Setting initial portfolio in context:",
        transformedPortfolio.id,
        transformedPortfolio.name
      );
      setContextPortfolio(transformedPortfolio); // Set in context
      setHasCreatedInitialPortfolio(true);
    } catch (err) {
      console.error("Error creating initial portfolio:", err);
      setError("Failed to create initial portfolio");
      throw err;
    }
  };

  // refreshes portfolios
  const loadPortfolios = async () => {
    // if already loading, return
    if (isLoadingRef.current) return;

    try {
      isLoadingRef.current = true; // loading in-progress
      setIsLoading(true);
      setError(null);

      // First, ensure we have the latest stored ID from storage
      try {
        const latestStoredId = await storage.getItem<number>(
          STORAGE_KEYS.SELECTED_PORTFOLIO
        );
        if (latestStoredId !== storedSelectedPortfolioIdRef.current) {
          console.log(
            "Updating stored portfolio ID from storage:",
            latestStoredId
          );
          storedSelectedPortfolioIdRef.current = latestStoredId;
        }
      } catch (error) {
        console.error("Error refreshing stored portfolio ID:", error);
      }

      const response = await api.portfolios.getAll();

      if (response.length === 0 && !hasCreatedInitialPortfolio) {
        // Create initial portfolio if none exist and we haven't already created one in this session
        await createInitialPortfolio();
      } else {
        // Transform the response to match our Portfolio interface
        const transformedPortfolios = response.map((portfolio: any) => {
          const holdings = portfolio.holdings || [];
          // Calculate total value of all holdings
          const holdingsValue = holdings.reduce((total: number, holding: any) => {
            const shares = parseFloat(String(holding.amount || 0)) || 0;
            const price = parseFloat(String(holding.currentValue / shares || holding.boughtAtPrice || 0)) || 0;
            return total + (shares * price);
          }, 0);
          
          const startingBalance = Number(portfolio.startingBalance) || 0;
          // Total value is cash (starting balance) + value of all holdings
          const totalValue = startingBalance + holdingsValue;
          
          return {
            id: portfolio.id,
            name: portfolio.name || "",
            value: totalValue,
            riskScore: portfolio.riskScore || 5,
            change: 0,
            holdings: holdings,
            startingBalance: startingBalance,
            userId: portfolio.userId,
            createdAt: portfolio.createdAt
              ? new Date(portfolio.createdAt)
              : undefined,
          };
        });

        setPortfolios(transformedPortfolios);

        // Check for stored portfolio ID (using the latest value)
        const storedPortfolioId = storedSelectedPortfolioIdRef.current;
        if (storedPortfolioId) {
          const match = transformedPortfolios.find(
            (p: Portfolio) => p.id === storedPortfolioId
          );
          if (match) {
            console.log(
              "Restoring stored selected portfolio:",
              match.id,
              match.name
            );
            setContextPortfolio(match);
            return;
          } else {
            console.log(
              "Stored portfolio ID not found in current portfolios:",
              storedPortfolioId
            );
          }
        }

        // If there's a currently selected portfolio in context, try to maintain it
        if (contextPortfolio) {
          const existingPortfolio = transformedPortfolios.find(
            (p: Portfolio) => p.id === contextPortfolio.id
          );
          if (existingPortfolio) {
            console.log(
              "Maintaining existing selected portfolio:",
              existingPortfolio.id,
              existingPortfolio.name
            );
            setContextPortfolio(existingPortfolio);
            return;
          }
        }

        // Otherwise, set first portfolio as selected in context
        if (transformedPortfolios.length > 0) {
          console.log(
            "Setting first portfolio in context:",
            transformedPortfolios[0].id,
            transformedPortfolios[0].name
          );
          setContextPortfolio(transformedPortfolios[0]);
        } else {
          console.log("No portfolios to set in context");
        }
      }
    } catch (err) {
      console.error("Error loading portfolios:", err);
      setError("Failed to load portfolios");
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
    }
  };

  const handlePortfolioPress = (portfolioId: number) => {
    const portfolio = portfolios.find((p) => p.id === portfolioId);
    if (portfolio) {
      setContextPortfolio(portfolio);
    }
  };

  const handleChartPress = async () => {
    if (contextPortfolio) {
      navigation.navigate("Portfolio", {
        portfolioId: contextPortfolio.id,
      });
    }
  };

  const handleCreatePortfolio = () => {
    navigation.navigate("CreatePortfolio");
  };

  const flipCard = () => {
    setShowRiskDetails(!showRiskDetails);

    // Flip animation
    Animated.spring(flipAnimation, {
      toValue: showRiskDetails ? 0 : 180,
      friction: 8,
      tension: 10,
      useNativeDriver: true,
    }).start();

    // Height animation - dynamically calculate based on holdings count
    const baseHeight = 180;
    const holdingsCount = contextPortfolio?.holdings?.length || 0;
    const expandedHeight =
      holdingsCount === 0
        ? baseHeight // Empty state height
        : Math.min(500, baseHeight + holdingsCount * 40); // Cap at 500px

    Animated.timing(heightAnimation, {
      toValue: showRiskDetails ? baseHeight : expandedHeight,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

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

  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <Icon
        name="folder-plus"
        type="feather"
        size={48}
        color={COLORS.textSecondary}
      />
      <Text style={styles.emptyStateTitle}>Create Your First Portfolio</Text>
      <Text style={styles.emptyStateDescription}>
        Get started by creating a portfolio with your investment preferences
      </Text>
      <TouchableOpacity
        style={styles.createFirstPortfolioButton}
        onPress={handleCreatePortfolio}
      >
        <Text style={styles.createFirstPortfolioText}>Create Portfolio</Text>
      </TouchableOpacity>
    </View>
  );

  const renderPortfolioItem = ({ item }: { item: PortfolioOrNew }) => {
    if ("name" in item) {
      return (
        <PortfolioCard
          name={item.name}
          value={item.value}
          riskScore={item.riskScore}
          change={item.change}
          onPress={() => handlePortfolioPress(item.id)}
          isSelected={contextPortfolio?.id === item.id}
        />
      );
    }
    return (
      <TouchableOpacity
        style={styles.createPortfolioButton}
        onPress={handleCreatePortfolio}
      >
        <Icon name="plus" type="feather" color={COLORS.textSecondary} />
        <Text style={styles.createPortfolioText}>Create Portfolio</Text>
      </TouchableOpacity>
    );
  };

  // Calculate risk rating for a single asset based on its characteristics
  const calculateAssetRiskRating = async (symbol: string): Promise<number> => {
    try {
      const assetDetails = await getAssetDetails(symbol);
      if (!assetDetails) return 5; // Default risk if we can't get details

      let riskScore = 5; // Base risk score

      // Sector-based risk
      if (assetDetails.sector) {
        const sector = assetDetails.sector.toLowerCase();
        // Higher risk sectors
        if (
          sector.includes("technology") ||
          sector.includes("crypto") ||
          sector.includes("biotech")
        ) {
          riskScore += 3;
        }
        // Medium-high risk sectors
        else if (
          sector.includes("consumer cyclical") ||
          sector.includes("communication")
        ) {
          riskScore += 2;
        }
        // Medium risk sectors
        else if (sector.includes("industrial") || sector.includes("energy")) {
          riskScore += 1;
        }
        // Low-medium risk sectors
        else if (
          sector.includes("healthcare") ||
          sector.includes("materials")
        ) {
          riskScore += 0;
        }
        // Lower risk sectors
        else if (
          sector.includes("utilities") ||
          sector.includes("consumer defensive")
        ) {
          riskScore -= 1;
        }
      }

      // Beta-based risk (market sensitivity)
      if (assetDetails.beta && assetDetails.beta !== "N/A") {
        const beta = parseFloat(assetDetails.beta);
        if (!isNaN(beta)) {
          if (beta > 1.5) riskScore += 2;
          else if (beta > 1.2) riskScore += 1;
          else if (beta < 0.8) riskScore -= 1;
        }
      }

      // Market cap based risk (if available)
      if (assetDetails.marketCap && assetDetails.marketCap !== "N/A") {
        const mcap = assetDetails.marketCap.toLowerCase();
        if (mcap.includes("t"))
          riskScore -= 1; // Trillion dollar companies are more stable
        else if (mcap.includes("m")) riskScore += 1; // Small caps are riskier
      }

      // Price volatility risk
      if (assetDetails.change) {
        const volatility = Math.abs(assetDetails.change);
        if (volatility > 10) riskScore += 2;
        else if (volatility > 5) riskScore += 1;
      }

      // Ensure risk score stays within 1-10 range
      return Math.max(1, Math.min(10, Math.round(riskScore)));
    } catch (error) {
      console.error("Error calculating risk rating:", error);
      return 5; // Default risk on error
    }
  };

  // Calculate average risk rating from holdings
  const calculateAverageRiskRating = async (
    portfolio?: Portfolio | null
  ): Promise<number> => {
    if (!portfolio || !portfolio.holdings || portfolio.holdings.length === 0) {
      return 0;
    }

    try {
      let totalValue = 0;
      let weightedRiskSum = 0;

      // Calculate risk ratings for all holdings in parallel
      const holdingPromises = portfolio.holdings.map(async (holding) => {
        const holdingValue =
          Number(holding.amount) * Number(holding.boughtAtPrice);
        const symbol = holding.symbol || holding.assetSymbol;
        const riskRating = await calculateAssetRiskRating(symbol);
        return { value: holdingValue, risk: riskRating };
      });

      const holdingResults = await Promise.all(holdingPromises);

      holdingResults.forEach(({ value, risk }) => {
        totalValue += value;
        weightedRiskSum += value * risk;
      });

      return totalValue > 0
        ? Math.round((weightedRiskSum / totalValue) * 10) / 10
        : 0;
    } catch (error) {
      console.error("Error calculating average risk:", error);
      return 0;
    }
  };

  // Helper function for risk color
  const getRiskColor = (score: number) => {
    if (score === 0) return "#808080"; // Gray for no holdings
    if (score > 7) return "#FF5252"; // High risk assets
    if (score > 4) return "#FFC107"; // Medium risk assets
    return "#4CAF50"; // Low risk assets
  };

  // Helper function for risk description
  const getRiskDescription = (score: number): string => {
    if (score === 0) return "No Holdings Yet";
    if (score >= 8) return "High Risk";
    if (score >= 5) return "Moderate Risk";
    if (score >= 3) return "Low-Moderate Risk";
    return "Low Risk Assets";
  };

  const [riskRatings, setRiskRatings] = useState<Record<string, number>>({});
  const [averageRisk, setAverageRisk] = useState<number>(0);

  useEffect(() => {
    const loadRiskRatings = async () => {
      if (!contextPortfolio || !contextPortfolio.holdings) return;

      // ✅ Collect unique non-undefined symbols only
      const uniqueSymbols = Array.from(
        new Set(
          contextPortfolio.holdings
            .map((h) => h.assetSymbol || h.symbol)
            .filter((s): s is string => Boolean(s)) // <-- filters out undefined
        )
      );

      const ratings: Record<string, number> = {};

      for (const symbol of uniqueSymbols) {
        ratings[symbol] = await calculateAssetRiskRating(symbol);
      }

      setRiskRatings(ratings);

      const avgRisk =
        Object.values(ratings).reduce((a, b) => a + b, 0) /
        uniqueSymbols.length;

      setAverageRisk(avgRisk);
    };

    loadRiskRatings();
  }, [contextPortfolio]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.textPink} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadPortfolios}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (portfolios.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <AppHeader username={user?.username || "User"} />
        {renderEmptyState()}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="Dashboard" username={user?.username || "User"} />
      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Portfolios</Text>
          <FlatList
            data={[...portfolios, { id: -1 }] as PortfolioOrNew[]}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={renderPortfolioItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.portfolioList}
          />
        </View>

        <View style={styles.cardContainer}>
          <TouchableOpacity
            style={[styles.portfolioInfoCard]}
            onPress={handleChartPress}
            activeOpacity={0.8}
          >
            <View style={styles.portfolioSummary}>
              {/* Stats section moved to the top */}
              <View style={styles.portfolioStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Holdings</Text>
                  <Text style={styles.statValue}>
                    {contextPortfolio?.holdings
                      ? new Set(
                          contextPortfolio.holdings
                            .map((h) => h.assetSymbol || h.symbol)
                            .filter(Boolean) // remove undefined
                        ).size
                      : 0}
                  </Text>
                </View>

                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Cash</Text>
                  <Text style={styles.statValue}>
                    ${contextPortfolio?.startingBalance?.toFixed(2) || "0.00"}
                  </Text>
                </View>

                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Created</Text>
                  <Text style={styles.statValue}>
                    {contextPortfolio?.createdAt
                      ? new Date(
                          contextPortfolio.createdAt
                        ).toLocaleDateString()
                      : "N/A"}
                  </Text>
                </View>
              </View>

              {/* Value section moved to the bottom and centered */}
              <View style={styles.portfolioValueContainer}>
                <Text style={styles.portfolioValue}>
                  ${contextPortfolio?.value.toFixed(2) || "0.00"}
                </Text>

                <View style={styles.changeContainer}>
                  <Text
                    style={[
                      styles.changeValue,
                      {
                        color:
                          (contextPortfolio?.change || 0) >= 0
                            ? "#4CAF50"
                            : "#FF5252",
                      },
                    ]}
                  >
                    {(contextPortfolio?.change || 0) >= 0 ? "+" : ""}
                    {contextPortfolio?.change?.toFixed(2) || "0.00"}%
                  </Text>
                </View>
              </View>

              {/* Single view charts prompt */}
              <View style={styles.viewChartPrompt}>
                <Icon
                  name="bar-chart-2"
                  type="feather"
                  color={COLORS.textPink}
                  size={20}
                />
                <Text style={styles.viewChartText}>View chart</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.titleContainer}>
              <Text style={styles.sectionTitle}>Risk Analysis</Text>
              <TouchableOpacity
                onPress={() => setShowTooltip(true)}
                style={styles.tooltipButton}
              >
                <Icon
                  name="info"
                  type="feather"
                  size={16}
                  color={COLORS.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </View>

          <Animated.View
            style={[
              styles.riskContainer,
              {
                height: heightAnimation,
              },
            ]}
          >
            <TouchableOpacity
              onPress={flipCard}
              activeOpacity={0.9}
              style={styles.riskCardContainer}
            >
              <Animated.View
                style={[
                  styles.card,
                  styles.frontCard,
                  frontAnimatedStyle,
                  { display: showRiskDetails ? "none" : "flex" },
                ]}
              >
                <Text
                  style={[
                    styles.riskScore,
                    { color: getRiskColor(averageRisk) },
                  ]}
                >
                  {averageRisk}
                </Text>
                <Text style={styles.riskLabel}>out of 10</Text>
                <Text style={styles.riskDescription}>
                  {getRiskDescription(averageRisk)}
                </Text>
              </Animated.View>

              <Animated.View
                style={[
                  styles.card,
                  styles.backCard,
                  backAnimatedStyle,
                  { display: showRiskDetails ? "flex" : "none" },
                ]}
              >
                {contextPortfolio && contextPortfolio.holdings.length > 0 ? (
                  <View style={styles.assetsList}>
                    {(() => {
                      // Group holdings by symbol
                      const holdingsBySymbol = contextPortfolio.holdings.reduce(
                        (acc, holding) => {
                          const symbol = holding.symbol || holding.assetSymbol;
                          if (!symbol) return acc;

                          if (!acc[symbol]) {
                            acc[symbol] = {
                              symbol,
                              fullName: holding.fullName || "",
                              totalShares: 0,
                              holdings: [],
                            };
                          }

                          acc[symbol].holdings.push(holding);
                          acc[symbol].totalShares +=
                            parseFloat(String(holding.amount || 0)) || 0;
                          // Use the most complete name if available
                          if (holding.fullName && !acc[symbol].fullName) {
                            acc[symbol].fullName = holding.fullName;
                          }

                          return acc;
                        },
                        {} as Record<
                          string,
                          {
                            symbol: string;
                            fullName: string;
                            totalShares: number;
                            holdings: typeof contextPortfolio.holdings;
                          }
                        >
                      );

                      // Convert to array and render
                      return Object.values(holdingsBySymbol).map(
                        (groupedHolding) => {
                          const symbol = groupedHolding.symbol;
                          const riskRating = riskRatings[symbol] || 0;
                          return (
                            <View key={symbol} style={styles.riskAssetItem}>
                              <View style={styles.riskAssetInfo}>
                                <Text style={styles.riskAssetSymbol}>
                                  {symbol}
                                </Text>
                                <Text style={styles.riskAssetName}>
                                  {groupedHolding.fullName} (
                                  {groupedHolding.totalShares} shares)
                                </Text>
                              </View>
                              <View
                                style={[
                                  styles.riskBadge,
                                  {
                                    backgroundColor: `${getRiskColor(riskRating)}20`,
                                  },
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.riskScoreSmall,
                                    { color: getRiskColor(riskRating) },
                                  ]}
                                >
                                  {riskRating || "N/A"}
                                </Text>
                              </View>
                            </View>
                          );
                        }
                      );
                    })()}
                  </View>
                ) : (
                  <View style={styles.emptyHoldingsContainer}>
                    <Icon
                      name="alert-circle"
                      type="feather"
                      size={24}
                      color={COLORS.textSecondary}
                    />
                    <Text style={styles.emptyHoldingsText}>
                      No holdings in this portfolio yet.
                    </Text>
                    <Text style={styles.emptyHoldingsSubtext}>
                      Add assets to see risk analysis.
                    </Text>
                  </View>
                )}
              </Animated.View>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Allocation Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Allocation</Text>
          <Text style={styles.allocationLabel}>
            % Domestic, foreign, bonds, etc.
          </Text>
          {/* Add pie chart here */}
        </View>

        {/* Add spacer at the bottom to prevent content from being hidden behind the nav bar */}
        <BottomNavSpacer extraSpace={20} />
      </ScrollView>

      <Overlay
        isVisible={showTooltip}
        onBackdropPress={() => setShowTooltip(false)}
        overlayStyle={styles.tooltipOverlay}
      >
        <View style={styles.tooltipContent}>
          <Text style={styles.tooltipTitle}>Risk Analysis</Text>
          <Text style={styles.tooltipText}>
            Tap this card for a detailed breakdown risk rating for each asset.
          </Text>
          <TouchableOpacity
            style={styles.tooltipCloseButton}
            onPress={() => setShowTooltip(false)}
          >
            <Text style={styles.tooltipCloseText}>Got it</Text>
          </TouchableOpacity>
        </View>
      </Overlay>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  portfolioInfoCard: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 15,
    marginBottom: 10,
    width: "100%",
  },
  portfolioCardHeader: {
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  portfolioCardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.textPink,
    textAlign: "center",
  },
  portfolioSummary: {
    padding: 18,
  },
  portfolioValueContainer: {
    marginVertical: 20,
    alignItems: "center",
  },
  portfolioValueLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 5,
    textAlign: "center",
  },
  portfolioValue: {
    fontSize: 32,
    fontWeight: "bold",
    color: COLORS.textWhite,
    textAlign: "center",
  },
  changeContainer: {
    marginTop: 5,
    alignItems: "center",
  },
  changeValue: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  portfolioStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    marginBottom: 10,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 5,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textWhite,
  },
  viewChartPrompt: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
    marginTop: 5,
  },
  viewChartText: {
    color: COLORS.textPink,
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "600",
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.deepPurpleBackground,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 90, // Add padding to account for the navigation bar
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.textWhite,
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
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.textWhite,
  },
  portfolioList: {
    paddingRight: 20,
  },
  tooltipButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  riskContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 15,
    overflow: "hidden",
  },
  riskCardContainer: {
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
    padding: 20,
  },
  frontCard: {
    alignItems: "center",
    justifyContent: "center",
  },
  backCard: {
    alignItems: "stretch",
  },
  riskScore: {
    fontSize: 48,
    fontWeight: "bold",
    color: COLORS.textPink,
  },
  riskLabel: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 5,
  },
  riskDescription: {
    fontSize: 14,
    color: COLORS.textWhite,
    marginTop: 10,
  },
  assetsList: {
    flex: 1,
    paddingBottom: 10,
  },
  riskAssetItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  riskAssetInfo: {
    flex: 1,
  },
  riskAssetSymbol: {
    color: COLORS.textWhite,
    fontSize: 14,
    fontWeight: "600",
  },
  riskAssetName: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 1,
  },
  riskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 10,
  },
  allocationLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 5,
  },
  tooltipOverlay: {
    backgroundColor: COLORS.deepPurpleBackground,
    borderRadius: 15,
    padding: 0,
    width: "80%",
    maxWidth: 300,
  },
  tooltipContent: {
    padding: 20,
  },
  tooltipTitle: {
    color: COLORS.textWhite,
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
  },
  tooltipText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  tooltipCloseButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  tooltipCloseText: {
    color: COLORS.textWhite,
    fontSize: 16,
    fontWeight: "600",
  },
  tapHint: {
    color: COLORS.textSecondary,
    fontSize: 14,
    opacity: 0.8,
  },
  createPortfolioButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 8,
  },
  createPortfolioText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  logoutButton: {
    padding: 10,
  },
  welcomeContainer: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  welcomeText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    opacity: 0.8,
  },
  usernameText: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.textWhite,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.deepPurpleBackground,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.deepPurpleBackground,
    padding: 20,
  },
  errorText: {
    color: COLORS.coral,
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: COLORS.textPink,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: COLORS.textWhite,
    fontSize: 16,
    fontWeight: "600",
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyStateTitle: {
    color: COLORS.textWhite,
    fontSize: 24,
    fontWeight: "600",
    marginTop: 20,
    marginBottom: 10,
  },
  emptyStateDescription: {
    color: COLORS.textSecondary,
    fontSize: 16,
    textAlign: "center",
    marginBottom: 30,
  },
  createFirstPortfolioButton: {
    backgroundColor: COLORS.textPink,
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  createFirstPortfolioText: {
    color: COLORS.textWhite,
    fontSize: 18,
    fontWeight: "600",
  },
  emptyHoldingsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyHoldingsText: {
    color: COLORS.textWhite,
    fontSize: 16,
    fontWeight: "600",
    marginTop: 10,
  },
  emptyHoldingsSubtext: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: "center",
  },
  riskScoreSmall: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.textPink,
  },
});
