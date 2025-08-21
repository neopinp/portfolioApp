import React from "react";
import { View, StyleSheet, Image } from "react-native";
import { Text } from "@rneui/themed";
import { COLORS } from "../constants/colors";
import { Holding } from "../types";

// Define a type for aggregated holdings
export type AggregatedHolding = {
  symbol: string;
  totalShares: number;
  totalValue: number;
  avgCostBasis: number;
  imageUrl?: string;
};

type HoldingItemProps = {
  holding?: Holding;
  symbol?: string;
  fullName?: string;
  value?: number;
  change?: number;
  imageUrl?: string;
  amount?: number;
  boughtAtPrice?: number;
  totalShares?: number;
  avgCostBasis?: number;
};

export const HoldingItem = ({
  holding,
  symbol,
  fullName,
  value,
  imageUrl,
  amount,
  boughtAtPrice,
  totalShares,
  avgCostBasis,
}: HoldingItemProps) => {
  // Use either the holding object or the individual props
  // Prioritize totalShares and avgCostBasis for aggregated view

  const displayAvg =
    avgCostBasis ??
    boughtAtPrice ??
    holding?.boughtAtPrice ??
    holding?.purchasePrice ??
    0;

  const formatMoney = (n: number) =>
    Number.isFinite(n)
      ? n.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : "0.00";
  const formatInt = (n: number) =>
    Number.isFinite(n) ? Math.trunc(n).toLocaleString() : "0";
  const displaySymbol = symbol || holding?.assetSymbol || holding?.symbol || "";
  const displayName =
    fullName || holding?.asset?.name || holding?.fullName || "";
  const displayValue = value ?? holding?.currentValue ?? 0;
  const displayImageUrl =
    imageUrl || holding?.asset?.imageUrl || holding?.imageUrl;

  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        {displayImageUrl ? (
          <Image source={{ uri: displayImageUrl }} style={styles.image} />
        ) : (
          <View style={styles.symbolContainer}>
            <Text style={styles.symbolText}>{displaySymbol.charAt(0)}</Text>
          </View>
        )}
        <View style={styles.nameContainer}>
          <Text style={styles.symbol}>{displaySymbol}</Text>
          <Text style={styles.fullName}>{displayName}</Text>
        </View>
      </View>

      <View style={styles.rightSection}>
        <Text style={styles.value}>${formatMoney(displayValue)}</Text>
        <Text style={styles.quantity}>{totalShares} shares</Text>
        <Text style={styles.avgPrice}>Avg. ${formatMoney(displayAvg)}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  image: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  symbolContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.textPink,
    justifyContent: "center",
    alignItems: "center",
  },
  symbolText: {
    color: COLORS.textWhite,
    fontSize: 18,
    fontWeight: "bold",
  },
  nameContainer: {
    marginLeft: 12,
  },
  symbol: {
    color: COLORS.textWhite,
    fontSize: 16,
    fontWeight: "600",
  },
  fullName: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  rightSection: {
    alignItems: "flex-end",
  },
  value: {
    color: COLORS.textWhite,
    fontSize: 16,
    fontWeight: "500",
  },
  quantity: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 2,
  },
  avgPrice: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 2,
  },
});
