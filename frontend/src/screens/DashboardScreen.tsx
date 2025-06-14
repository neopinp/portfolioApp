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
import { PortfolioChart } from "../components/PortfolioChart";
import { AppHeader } from "../components/AppHeader";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";
import { storage, STORAGE_KEYS } from "../utils/storage";

interface Portfolio {
  id: number;
  name: string;
  value: number;
  riskScore: number;
  change: number;
  holdings?: any[];
}

interface OnboardingData {
  riskTolerance: number;
  investmentGoals: string;
  initialInvestment: number;
}

interface Asset {
  symbol: string;
  fullName: string;
  riskScore: number;
}

type PortfolioOrNew = Portfolio | { id: number };

export const DashboardScreen = ({ navigation }: any) => {
  const { logout, user } = useAuth();
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState<Portfolio | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRanges] = useState(["1D", "1W", "1M", "3M", "6M"]);
  const [selectedRange, setSelectedRange] = useState("1M");

  const [showRiskDetails, setShowRiskDetails] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [flipAnimation] = useState(new Animated.Value(0));
  const [heightAnimation] = useState(new Animated.Value(180));
  const scrollViewRef = useRef(null);
  const [assets] = useState<Asset[]>([
    { symbol: "TSLA", fullName: "Tesla Inc.", riskScore: 8 },
    { symbol: "AAPL", fullName: "Apple Inc.", riskScore: 6 },
    { symbol: "NVDA", fullName: "NVIDIA Corporation", riskScore: 7 },
    { symbol: "MSFT", fullName: "Microsoft Corporation", riskScore: 5 },
    { symbol: "AMZN", fullName: "Amazon.com Inc.", riskScore: 6 },
  ]);

  // Initial load of portfolios
  useEffect(() => {
    loadPortfolios();
  }, []);

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

      // Transform the response to match our Portfolio interface
      const transformedPortfolio: Portfolio = {
        id: newPortfolio.id,
        name: newPortfolio.name || "",
        value: Number(newPortfolio.starting_balance) || 0,
        riskScore: newPortfolio.risk_score || 5,
        change: 0,
        holdings: newPortfolio.holdings || [],
      };

      setPortfolios([transformedPortfolio]);
      setSelectedPortfolio(transformedPortfolio);
    } catch (err) {
      console.error("Error creating initial portfolio:", err);
      setError("Failed to create initial portfolio");
      throw err;
    }
  };

  // refreshes portfolios
  const loadPortfolios = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.portfolios.getAll();

      if (response.length === 0) {
        // Create initial portfolio if none exist
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
        }));

        setPortfolios(transformedPortfolios);
        setSelectedPortfolio(transformedPortfolios[0]);
      }
    } catch (err) {
      console.error("Error loading portfolios:", err);
      setError("Failed to load portfolios");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePortfolioPress = (portfolioId: number) => {
    const portfolio = portfolios.find((p) => p.id === portfolioId);
    if (portfolio) {
      setSelectedPortfolio(portfolio);
    }
  };

  const handleChartPress = () => {
    navigation.navigate("Portfolio", { portfolioId: selectedPortfolio?.id });
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

    // Height animation
    Animated.timing(heightAnimation, {
      toValue: showRiskDetails ? 180 : assets.length * 60 + 40, // 60 per item + padding
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

  const chartData = {
    value: selectedPortfolio?.value || 0,
    change: selectedPortfolio?.change || 0,
    timeRanges,
    selectedRange,
    onRangeSelect: setSelectedRange,
  };

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
      <AppHeader username={user?.username || "User"} />
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Portfolios Section */}
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

        {/* Portfolio Chart Section */}
        <TouchableOpacity
          style={styles.section}
          onPress={handleChartPress}
          activeOpacity={0.8}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{selectedPortfolio?.name}</Text>
            <Text style={styles.tapHint}>Tap to view</Text>
          </View>
          <PortfolioChart data={chartData} />
        </TouchableOpacity>

        {/* Risk Analysis Section */}
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
                <Text style={styles.riskScore}>7</Text>
                <Text style={styles.riskLabel}>out of 10</Text>
                <Text style={styles.riskDescription}>
                  Moderately High Risk Portfolio
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
                <View style={styles.assetsList}>
                  {assets.map((asset) => (
                    <View key={asset.symbol} style={styles.riskAssetItem}>
                      <View style={styles.riskAssetInfo}>
                        <Text style={styles.riskAssetSymbol}>
                          {asset.symbol}
                        </Text>
                        <Text style={styles.riskAssetName}>
                          {asset.fullName}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.riskScoreBadge,
                          {
                            backgroundColor:
                              asset.riskScore > 7
                                ? "rgba(255, 82, 82, 0.2)"
                                : asset.riskScore > 4
                                  ? "rgba(255, 193, 7, 0.2)"
                                  : "rgba(76, 175, 80, 0.2)",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.riskAssetScore,
                            {
                              color:
                                asset.riskScore > 7
                                  ? "#FF5252"
                                  : asset.riskScore > 4
                                    ? "#FFC107"
                                    : "#4CAF50",
                            },
                          ]}
                        >
                          {asset.riskScore}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
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
  },
  riskAssetItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  riskAssetInfo: {
    flex: 1,
  },
  riskAssetSymbol: {
    color: COLORS.textWhite,
    fontSize: 16,
    fontWeight: "600",
  },
  riskAssetName: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  riskScoreBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginLeft: 10,
  },
  riskAssetScore: {
    fontSize: 14,
    fontWeight: "600",
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
});
