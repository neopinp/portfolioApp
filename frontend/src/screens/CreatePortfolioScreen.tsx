import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Text, Input, Slider } from "@rneui/themed";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "../constants/colors";
import { api } from "../services/api";
import { AppHeader } from "../components/AppHeader";
import { BottomNavSpacer } from "../components/BottomNavSpacer";
import { useAuth } from "../contexts/AuthContext";

interface CreatePortfolioScreenProps {
  navigation: any;
  route: {
    params?: {
      prefillData?: {
        name: string;
        initialValue: number;
        riskScore: number;
      };
    };
  };
}

export const CreatePortfolioScreen = ({
  navigation,
  route,
}: CreatePortfolioScreenProps) => {
  const { user } = useAuth();
  const prefillData = route.params?.prefillData;

  const [name, setName] = useState(prefillData?.name || "");
  const [initialValue, setInitialValue] = useState(
    prefillData?.initialValue ? prefillData.initialValue.toString() : ""
  );
  const [riskScore, setRiskScore] = useState(prefillData?.riskScore || 5);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!name.trim()) {
      setError("Portfolio name is required");
      return;
    }

    if (!initialValue || isNaN(parseFloat(initialValue))) {
      setError("Initial value is required");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const parsedInitialValue = parseFloat(initialValue);

      await api.portfolios.create({
        name: name.trim(),
        starting_balance: parsedInitialValue,
        risk_score: riskScore,
      });
      
      navigation.goBack();
    } catch (err) {
      console.error("Error creating portfolio:", err);
      setError("Failed to create portfolio. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="Create Portfolio" username={user?.username || "User"} />
      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <Input
            placeholder="Portfolio Name"
            value={name}
            onChangeText={setName}
            containerStyle={styles.inputContainer}
            inputStyle={styles.inputText}
          />

          <Input
            placeholder="Initial Value"
            value={initialValue}
            onChangeText={(text) => {
              setInitialValue(text);
              setError(null);
            }}
            keyboardType="numeric"
            inputStyle={styles.input}
            inputContainerStyle={styles.inputContainer}
          />

          <View style={styles.sliderContainer}>
            <Text style={styles.sliderLabel}>Risk Score</Text>
            <Slider
              value={riskScore}
              onValueChange={setRiskScore}
              minimumValue={1}
              maximumValue={10}
              step={1}
              allowTouchTrack
              trackStyle={{ height: 5, backgroundColor: "transparent" }}
              thumbStyle={{
                height: 20,
                width: 20,
                backgroundColor: COLORS.textPink,
              }}
              minimumTrackTintColor={COLORS.textPink}
              maximumTrackTintColor={COLORS.textPlaceholder}
            />
            <View style={styles.sliderValues}>
              <Text style={styles.sliderValue}>1</Text>
              <Text style={[styles.sliderValue, styles.currentValue]}>
                {riskScore}
              </Text>
              <Text style={styles.sliderValue}>10</Text>
            </View>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
            disabled={isLoading}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.createButton, isLoading && styles.disabledButton]}
            onPress={handleCreate}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={COLORS.textWhite} />
            ) : (
              <Text style={styles.createButtonText}>Create Portfolio</Text>
            )}
          </TouchableOpacity>
        </View>
        
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
  inputContainer: {
    borderBottomColor: COLORS.textPink,
  },
  inputText: {
    color: COLORS.textWhite,
    fontSize: 16,
  },
  input: {
    color: COLORS.textWhite,
    fontSize: 16,
  },
  sliderContainer: {
    marginTop: 20,
    paddingHorizontal: 10,
  },
  sliderLabel: {
    color: COLORS.textWhite,
    fontSize: 16,
    marginBottom: 10,
  },
  sliderValues: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  sliderValue: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  currentValue: {
    color: COLORS.textPink,
    fontSize: 18,
    fontWeight: "bold",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: "auto",
    paddingTop: 20,
  },
  cancelButton: {
    flex: 1,
    marginRight: 10,
    padding: 15,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: COLORS.textPink,
  },
  cancelButtonText: {
    color: COLORS.textPink,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  createButton: {
    flex: 2,
    backgroundColor: COLORS.textPink,
    padding: 15,
    borderRadius: 25,
  },
  disabledButton: {
    opacity: 0.7,
  },
  createButtonText: {
    color: COLORS.textWhite,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});
