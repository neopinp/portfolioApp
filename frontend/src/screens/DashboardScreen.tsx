import React, { useState, useRef } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Animated,
} from "react-native";
import { Text, Icon, Overlay } from "@rneui/themed";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "../constants/colors";
import { PortfolioCard } from "../components/PortfolioCard";
import { StatsBar } from "../components/StatsBar";
import { HoldingItem } from "../components/HoldingItem";
import { PortfolioChart } from "../components/PortfolioChart";

interface Portfolio {
  id: number;
  name: string;
  value: number;
  riskScore: number;
  change?: number;
}

interface Asset {
  symbol: string;
  fullName: string;
  riskScore: number;
}

type PortfolioOrNew = Portfolio | { id: number };

export const DashboardScreen = ({ navigation }: any) => {
  const [portfolios] = useState<Portfolio[]>([
    { id: 1, name: "Portfolio Name", value: 45678.9, riskScore: 8, change: 8.5 },
    { id: 2, name: "Tech Growth", value: 32150.75, riskScore: 7, change: -2.3 },
    { id: 3, name: "Conservative", value: 15890.25, riskScore: 4, change: 1.2 },
  ]);
  const [selectedPortfolio, setSelectedPortfolio] = useState<Portfolio>(portfolios[0]);
  const [timeRanges] = useState(['1D', '1W', '1M', '3M', '6M']);
  const [selectedRange, setSelectedRange] = useState('1M');

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

  const handlePortfolioPress = (portfolioId: number) => {
    const portfolio = portfolios.find(p => p.id === portfolioId);
    if (portfolio) {
      setSelectedPortfolio(portfolio);
    }
  };

  const handleChartPress = () => {
    navigation.navigate("Portfolio", { portfolioId: selectedPortfolio.id });
  };

  const handleCreatePortfolio = () => {
    navigation.navigate("CreatePortfolio");
  };

  const handleAddAsset = () => {
    navigation.navigate('Assets');
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

  const renderPortfolioItem = ({ item }: { item: PortfolioOrNew }) => {
    if ("name" in item) {
      return (
        <PortfolioCard
          name={item.name}
          value={item.value}
          riskScore={item.riskScore}
          change={item.change}
          onPress={() => handlePortfolioPress(item.id)}
          isSelected={selectedPortfolio.id === item.id}
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
    value: selectedPortfolio.value,
    change: selectedPortfolio.change || 0,
    timeRanges,
    selectedRange,
    onRangeSelect: setSelectedRange,
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>STOX</Text>
      </View>

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
            <Text style={styles.sectionTitle}>{selectedPortfolio.name}</Text>
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
                height: heightAnimation
              }
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
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
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
});
