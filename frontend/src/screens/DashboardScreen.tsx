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
import { PortfolioChart } from "../components/TimeSeriesChart";
import { AppHeader } from "../components/AppHeader";
import { BottomNavSpacer } from "../components/BottomNavSpacer";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";
import { storage, STORAGE_KEYS } from "../utils/storage";
import { Portfolio, OnboardingData, Asset } from "../types";
import { usePortfolio } from "../contexts/PortfolioContext";
// Use a union type for items that could be either a portfolio or a "new portfolio" button
type PortfolioOrNew = Portfolio | { id: number };

export const DashboardScreen = ({ navigation }: any) => {
  const { logout, user } = useAuth();
  const { selectedPortfolio: contextPortfolio, setSelectedPortfolio: setContextPortfolio } = usePortfolio();
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState<Portfolio | null>(
    contextPortfolio
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRanges] = useState(["1D", "1W", "1M", "3M", "6M"]);
  const [selectedRange, setSelectedRange] = useState("1M");

  // Track if we've already created an initial portfolio in this session
  const [hasCreatedInitialPortfolio, setHasCreatedInitialPortfolio] =
    useState(false);

  // Use a ref to track if we're currently loading to prevent infinite loops
  const isLoadingRef = useRef(false);

  const [showRiskDetails, setShowRiskDetails] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [flipAnimation] = useState(new Animated.Value(0));
  const [heightAnimation] = useState(new Animated.Value(180));
  const scrollViewRef = useRef(null);

  // Initial load of portfolios
  useEffect(() => {
    loadPortfolios();

    // Add navigation listener to reload portfolios when returning to this screen
    const unsubscribe = navigation.addListener("focus", () => {
      // Check if we're not already loading to avoid duplicate calls
      if (!isLoadingRef.current) {
        loadPortfolios();
      }
    });

    // Cleanup listener on unmount
    return unsubscribe;
  }, [navigation]);

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
        starting_balance: initialInvestment,
        risk_score: riskTolerance,
      });

      // Transform portfolio so that it can be passed
      const transformedPortfolio: Portfolio = {
        id: newPortfolio.id,
        name: newPortfolio.name || "",
        value: Number(newPortfolio.starting_balance) || 0,
        riskScore: newPortfolio.risk_score || 5,
        change: 0,
        holdings: newPortfolio.holdings || [],
        starting_balance: Number(newPortfolio.starting_balance) || 0,
        risk_score: newPortfolio.risk_score || 5,
      };

      setPortfolios([transformedPortfolio]);
      setSelectedPortfolio(transformedPortfolio);
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
      const response = await api.portfolios.getAll();

      if (response.length === 0 && !hasCreatedInitialPortfolio) {
        // Create initial portfolio if none exist and we haven't already created one in this session
        await createInitialPortfolio();
      } else {
        // Transform the response to match our Portfolio interface
        const transformedPortfolios = response.map((portfolio: any) => ({
          id: portfolio.id,
          name: portfolio.name || "",
          value: Number(portfolio.starting_balance) || 0,
          riskScore: portfolio.risk_score || 5,
          change: 0,
          holdings: portfolio.holdings || [],
          starting_balance: Number(portfolio.starting_balance) || 0,
          risk_score: portfolio.risk_score || 5,
        }));

        setPortfolios(transformedPortfolios);
        setSelectedPortfolio(transformedPortfolios[0]);
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
      setSelectedPortfolio(portfolio);
      setContextPortfolio(portfolio);
    }
  };

  const handleChartPress = () => {
    if (selectedPortfolio) {
      navigation.navigate("Portfolio", { portfolioId: selectedPortfolio.id });
    }
  };

  const handleCreatePortfolio = () => {
    navigation.navigate("CreatePortfolio");
  };

  const handleAddAsset = () => {
    navigation.navigate("Assets");
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
    const holdingsCount = selectedPortfolio?.holdings?.length || 0;
    const expandedHeight = holdingsCount === 0 
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
          isSelected={selectedPortfolio?.id === item.id}
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

  // Calculate average risk score from holdings
  const calculateAverageRiskScore = (portfolio?: Portfolio | null): number => {
    if (!portfolio || !portfolio.holdings || portfolio.holdings.length === 0) {
      return 0;
    }
    
    // For now, use the portfolio's risk score since holdings don't have individual risk scores yet
    // In a real implementation, you would calculate the average from all holdings' risk scores
    return portfolio.riskScore;
  };

  // Helper function for risk color
  const getRiskColor = (score: number) => {
    if (score === 0) return "#808080"; // Gray for no holdings
    if (score > 7) return "#FF5252";
    if (score > 4) return "#FFC107";
    return "#4CAF50";
  };

  // Helper function for risk description
  const getRiskDescription = (score: number): string => {
    if (score === 0) return "No Holdings Yet";
    if (score >= 8) return "High Risk Portfolio";
    if (score >= 5) return "Moderate Risk Portfolio";
    if (score >= 3) return "Low-Moderate Risk Portfolio";
    return "Low Risk Portfolio";
  };

  // Create chart data with default values if no portfolio is selected
  const chartData = {
    value: selectedPortfolio ? selectedPortfolio.value : 0,
    change: selectedPortfolio ? selectedPortfolio.change : 0,
    timeRanges,
    selectedRange,
    onRangeSelect: setSelectedRange,
  };

  // Update the effect to sync the local state with the context
  useEffect(() => {
    if (contextPortfolio) {
      setSelectedPortfolio(contextPortfolio);
    }
  }, [contextPortfolio]);

  // Update local state when portfolios are loaded
  useEffect(() => {
    if (portfolios.length > 0 && !selectedPortfolio) {
      setSelectedPortfolio(portfolios[0]);
      setContextPortfolio(portfolios[0]);
    }
  }, [portfolios, selectedPortfolio]);

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

        <TouchableOpacity
          style={styles.section}
          onPress={handleChartPress}
          activeOpacity={0.8}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{selectedPortfolio?.name}</Text>
            <Text style={styles.tapHint}>Tap to view</Text>
          </View>
          <PortfolioChart data={chartData} onPress={handleChartPress} />
        </TouchableOpacity>

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
              style={styles.cardContainer}
            >
              <Animated.View
                style={[
                  styles.card,
                  styles.frontCard,
                  frontAnimatedStyle,
                  { display: showRiskDetails ? "none" : "flex" },
                ]}
              >
                <Text style={[
                  styles.riskScore,
                  { color: getRiskColor(calculateAverageRiskScore(selectedPortfolio)) }
                ]}>
                  {calculateAverageRiskScore(selectedPortfolio)}
                </Text>
                <Text style={styles.riskLabel}>out of 10</Text>
                <Text style={styles.riskDescription}>
                  {getRiskDescription(calculateAverageRiskScore(selectedPortfolio))}
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
                {selectedPortfolio && selectedPortfolio.holdings.length > 0 ? (
                  <View style={styles.assetsList}>
                    {selectedPortfolio.holdings.map((holding) => (
                      <View key={holding.id} style={styles.riskAssetItem}>
                        <View style={styles.riskAssetInfo}>
                          <Text style={styles.riskAssetSymbol}>
                            {holding.symbol || holding.asset_symbol}
                          </Text>
                          <Text style={styles.riskAssetName}>{holding.fullName || ''}</Text>
                        </View>
                        <View
                          style={[
                            styles.riskBadge,
                            {
                              backgroundColor: `${getRiskColor(
                                selectedPortfolio.riskScore
                              )}20`,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.riskScoreSmall,
                              { color: getRiskColor(selectedPortfolio.riskScore) },
                            ]}
                          >
                            {selectedPortfolio.riskScore}
                          </Text>
                        </View>
                      </View>
                    ))}
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
