import React, { useState } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Button, Text, Input, Slider } from "@rneui/themed";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { COLORS } from "../constants/colors";

type OnBoardingStep = {
  title: string;
  key: string;
  component: React.ComponentType<any>;
};

const RiskToleranceStep = ({
  onAnswer,
  value,
}: {
  onAnswer: (value: number) => void;
  value: number;
}) => (
  <View style={styles.stepContainer}>
    <Text h4 style={styles.stepTitle}>
      What's your risk tolerance?
    </Text>

    <Text style={styles.description}>Passive to Aggressive</Text>
    <View style={styles.sliderContainer}>
      <Slider
        value={value}
        onValueChange={onAnswer}
        minimumValue={1}
        maximumValue={10}
        step={1}
        allowTouchTrack
        trackStyle={{ height: 5, backgroundColor: "transparent" }}
        thumbStyle={{ height: 20, width: 20, backgroundColor: COLORS.textPink }}
        thumbProps={{
          children: <View style={styles.sliderThumb} />,
        }}
        minimumTrackTintColor={COLORS.textPink}
        maximumTrackTintColor={COLORS.textPlaceholder}
      />
      <View style={styles.sliderLabels}>
        <Text style={styles.sliderLabel}>1</Text>
        <Text style={styles.sliderValue}>{value}</Text>
        <Text style={styles.sliderLabel}>10</Text>
      </View>
    </View>
  </View>
);

const InvestmentGoalsStep = ({
  onAnswer,
  value,
}: {
  onAnswer: (value: string) => void;
  value: string;
}) => (
  <View style={styles.stepContainer}>
    <Text h4 style={styles.stepTitle}>
      What's your investment goal?
    </Text>

    <Button
      title="Retirement Riches"
      type={value === "growth" ? "solid" : "outline"}
      onPress={() => onAnswer("growth")}
      containerStyle={styles.buttonContainer}
      buttonStyle={value === "growth" ? styles.selectedButton : styles.button}
      titleStyle={
        value === "growth" ? styles.selectedButtonText : styles.buttonText
      }
    />
    <Button
      title="Regular Riches"
      type={value === "income" ? "solid" : "outline"}
      onPress={() => onAnswer("income")}
      containerStyle={styles.buttonContainer}
      buttonStyle={value === "income" ? styles.selectedButton : styles.button}
      titleStyle={
        value === "income" ? styles.selectedButtonText : styles.buttonText
      }
    />
    <Button
      title="Right Now Riches"
      type={value === "asap" ? "solid" : "outline"}
      onPress={() => onAnswer("asap")}
      containerStyle={styles.buttonContainer}
      buttonStyle={value === "asap" ? styles.selectedButton : styles.button}
      titleStyle={
        value === "asap" ? styles.selectedButtonText : styles.buttonText
      }
    />
  </View>
);

const InitialInvestmentStep = ({
  onAnswer,
  value,
}: {
  onAnswer: (value: string) => void;
  value: string;
}) => (
  <View style={styles.stepContainer}>
    <Text h4 style={styles.stepTitle}>
      Initial Investment 
    </Text>
    <Text style={styles.description}>
      How much would you like to start with?
    </Text>
    <Input
      placeholder="Enter amount"
      keyboardType="numeric"
      value={value}
      onChangeText={onAnswer}
      leftIcon={{
        type: "font-awesome",
        name: "dollar",
        color: COLORS.textWhite,
      }}
      inputStyle={styles.inputText}
      containerStyle={styles.inputContainer}
      inputContainerStyle={styles.inputBorder}
    />
  </View>
);

export const OnboardingScreen = ({ navigation }: any) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({
    riskTolerance: 5,
    investmentGoals: "",
    initialInvestment: "",
  });

  const steps: OnBoardingStep[] = [
    {
      title: "Risk Tolerance",
      key: "riskTolerance",
      component: RiskToleranceStep,
    },
    {
      title: "Investment Goals",
      key: "investmentGoals",
      component: InvestmentGoalsStep,
    },
    {
      title: "Initial Investment",
      key: "initialInvestment",
      component: InitialInvestmentStep,
    },
  ];

  const handleAnswer = (value: any) => {
    setAnswers((prev) => ({
      ...prev,
      [steps[currentStep].key]: value,
    }));
  };

  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      try {
        // Store onboarding completion status
        await AsyncStorage.setItem("hasCompletedOnboarding", "true");
        // Store onboarding answers if needed
        await AsyncStorage.setItem(
          "onboardingAnswers",
          JSON.stringify(answers)
        );
        navigation.replace("Dashboard");
      } catch (error) {
        console.error("Error saving onboarding data:", error);
      }
    }
  };

  const CurrentStepComponent = steps[currentStep].component;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.progressContainer}>
          {steps.map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressDot,
                index === currentStep && styles.progressDotActive,
              ]}
            />
          ))}
        </View>

        <CurrentStepComponent
          onAnswer={handleAnswer}
          value={answers[steps[currentStep].key as keyof typeof answers]}
        />

        <Button
          title={currentStep === steps.length - 1 ? "Complete" : "Next"}
          onPress={handleNext}
          containerStyle={styles.nextButtonContainer}
          buttonStyle={styles.nextButton}
          titleStyle={styles.nextButtonText}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.deepPurpleBackground,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  stepContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  progressContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 30,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.textPlaceholder,
    marginHorizontal: 5,
  },
  progressDotActive: {
    backgroundColor: COLORS.textPink,
  },
  stepTitle: {
    color: COLORS.textWhite,
    textAlign: "center",
    marginBottom: 20,
  },
  description: {
    textAlign: "center",
    marginVertical: 10,
    color: COLORS.textWhite,
    opacity: 0.8,
  },
  sliderContainer: {
    width: "100%",
    paddingHorizontal: 20,
    marginTop: 30,
  },
  sliderThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.textPink,
  },
  sliderLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  sliderLabel: {
    color: COLORS.textWhite,
    opacity: 0.8,
  },
  sliderValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.textWhite,
  },
  buttonContainer: {
    marginVertical: 10,
    width: "100%",
    paddingHorizontal: 20,
  },
  button: {
    backgroundColor: "transparent",
    borderColor: COLORS.textPink,
    borderWidth: 1,
    height: 50,
    borderRadius: 25,
  },
  selectedButton: {
    backgroundColor: COLORS.textPink,
    height: 50,
    borderRadius: 25,
  },
  buttonText: {
    color: COLORS.textPink,
  },
  selectedButtonText: {
    color: COLORS.textWhite,
  },
  inputContainer: {
    width: "100%",
    paddingHorizontal: 20,
  },
  inputBorder: {
    borderBottomColor: COLORS.textPink,
  },
  inputText: {
    color: COLORS.textWhite,
    fontSize: 16,
  },
  nextButtonContainer: {
    marginTop: 40,
    width: "100%",
    paddingHorizontal: 20,
  },
  nextButton: {
    backgroundColor: COLORS.textPink,
    height: 50,
    borderRadius: 25,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
