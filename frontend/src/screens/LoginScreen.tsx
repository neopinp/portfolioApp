import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Keyboard,
  Platform,
  Animated,
  KeyboardAvoidingView,
} from "react-native";
import { Input, Text } from "@rneui/themed";
import { COLORS } from "../constants/colors";
import { StatsBar } from "../components/StatsBar";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];

  const handleEmailSubmit = () => {
    Keyboard.dismiss();
    if (!email || !email.includes("@")) {
      setEmailError("Please enter a valid email address.");
      return;
    }
    setEmailError("");
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    setShowPassword(true);
  };

  const handleLogin = () => {
    Keyboard.dismiss();
    // TODO: Implement actual login logic
    console.log("Login attempt with:", { email, password });
  };

  const navigateToRegister = () => console.log("Navigate to Register Screen");
  const navigateToForgotPassword = () =>
    console.log("Navigate to Forgot Password");

  return (
    <View style={styles.container}>
      {/* Fixed Header Section */}
      <View style={styles.headerSection}>
        <Text style={styles.mainTitle}>STOX</Text>
        <StatsBar />
      </View>

      {/* Keyboard Avoiding Section */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingContainer}
      >
        {/* Form Section */}
        <View style={styles.formContainer}>
          <View style={styles.inputSection}>
            {!showPassword ? (
              // Email Screen
              <View style={styles.centeredInputWrapper}>
                <Input
                  placeholder="email@example.com"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (emailError) setEmailError("");
                  }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  returnKeyType="next"
                  onSubmitEditing={handleEmailSubmit}
                  inputContainerStyle={styles.input}
                  inputStyle={styles.inputText}
                  placeholderTextColor={COLORS.textPlaceholder}
                  errorMessage={emailError}
                  errorStyle={styles.errorText}
                  containerStyle={[styles.inputWrapper, { width: 250 }]}
                />
              </View>
            ) : (
              // Password Screen
              <Animated.View
                style={[
                  styles.centeredInputWrapper,
                  {
                    opacity: fadeAnim,
                    transform: [
                      {
                        translateY: fadeAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [20, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <Input
                  placeholder="••••••••"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  returnKeyType="go"
                  onSubmitEditing={handleLogin}
                  inputContainerStyle={styles.input}
                  inputStyle={styles.inputText}
                  placeholderTextColor={COLORS.textPlaceholder}
                  containerStyle={[styles.inputWrapper, { width: 250 }]}
                />
              </Animated.View>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Fixed Bottom Section */}
      <View style={styles.bottomSection}>
        {!showPassword ? (
          // Sign Up Link (Email Screen)
          <TouchableOpacity
            style={styles.bottomLink}
            onPress={navigateToRegister}
          >
            <Text style={styles.signUpText}>Sign up</Text>
          </TouchableOpacity>
        ) : (
          // Forgot Password Link (Password Screen)
          <Animated.View style={{ opacity: fadeAnim }}>
            <TouchableOpacity
              style={styles.bottomLink}
              onPress={navigateToForgotPassword}
            >
              <Text style={styles.forgotPasswordText}>Forgot password?</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.deepPurpleBackground,
  },
  headerSection: {
    paddingTop: Platform.OS === "ios" ? 50 : 30,
    paddingHorizontal: 30,
    alignItems: "center",
    marginTop: 50, // Keep the header lower
  },
  mainTitle: {
    fontSize: 48,
    fontWeight: "bold",
    color: COLORS.textWhite,
    marginBottom: 80,
    textAlign: "center",
  },
  keyboardAvoidingContainer: {
    flex: 1,
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 30,
    justifyContent: "center",
    marginTop: -100, // Adjust input position relative to header
  },
  inputSection: {
    width: "100%",
    alignItems: "center",
  },
  centeredInputWrapper: {
    alignItems: "center",
    width: "100%",
    marginBottom: 300
  },
  inputWrapper: {
    paddingHorizontal: 0,
    marginBottom: 15,
  },
  input: {
    backgroundColor: "transparent",
    borderWidth: 0,
    borderRadius: 12,
    paddingHorizontal: 20,
    height: 55,
  },
  inputText: {
    fontSize: 16,
    color: COLORS.textWhite,
    textAlign: "center",
  },
  errorText: {
    color: COLORS.coral,
    marginLeft: 10,
    marginTop: 5,
  },
  bottomSection: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: "center",
    backgroundColor: COLORS.deepPurpleBackground, // Ensure consistent background
  },
  bottomLink: {
    paddingVertical: 10,
  },
  signUpText: {
    color: COLORS.textSignUpLink,
    fontSize: 15,
    fontWeight: "bold",
  },
  forgotPasswordText: {
    color: COLORS.textLink,
    fontSize: 14,
    fontWeight: "500",
  },
});
