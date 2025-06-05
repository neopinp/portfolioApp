import React, { useState } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Button, Text, Input, Slider } from "@rneui/themed";
import { SafeAreaView } from "react-native-safe-area-context";

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
    <Text h4>What's your risk tolerance?</Text>
    <Text style={styles.description}>
      1-10
    </Text>
    <Slider
      value={value}
      onValueChange={onAnswer}
      minimumValue={1}
      maximumValue={10}
      step={1}
      trackStyle={{ height: 10 }}
      thumbStyle={{ height: 20, width: 20 }}
    />
    <Text style={styles.sliderValue}>{value}</Text>
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
    <Text h4>Goal?</Text>
    <Button
      title={"Retirement Riches"}
      type={value === "growth" ? "solid" : "outline"}
      onPress={() => onAnswer("growth")}
      containerStyle={styles.buttonContainer}
    />
    <Button
      title={"Regular Riches"}
      type={value === "income" ? "solid" : "outline"}
      onPress={() => onAnswer("income")}
      containerStyle={styles.buttonContainer}
    />
    <Button
      title={"Right Now Riches"}
      type={value === "asap" ? "solid" : "outline"}
      onPress={() => onAnswer("asap")}
      containerStyle={styles.buttonContainer}
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
    <Text h4>Initial Investment Amount?</Text>
    <Text style={styles.description}>Starting Balance:</Text>
    <Input
      placeholder="Enter amount"
      keyboardType="numeric"
      value={value}
      onChangeText={onAnswer}
      leftIcon={{ type: "font-awesome", name: "dollar" }}
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

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      navigation.replace("Dashboard");
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
          containerStyle={styles.buttonContainer}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
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
    backgroundColor: "#E0E0E0",
    marginHorizontal: 5,
  },
  progressDotActive: {
    backgroundColor: "#2089dc",
  },
  buttonContainer: {
    marginVertical: 10,
    width: "100%",
  },
  description: {
    textAlign: "center",
    marginVertical: 20,
    color: "#666",
  },
  sliderValue: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 10,
  },
});
