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
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];

  const checkEmailExists = async (email: string) => {
    try {
      // TODO: Replace with actual API call to check if email exists
      // For now, we'll simulate with AsyncStorage
      const existingEmail = await AsyncStorage.getItem("userEmail");
      return existingEmail === email;
    } catch (error) {
      console.error("Error checking email:", error);
      return false;
    }
  };

  const handleEmailSubmit = async () => {
    Keyboard.dismiss();
    if (!email || !email.includes("@")) {
      setEmailError("Please enter a valid email address.");
      return;
    }
    
    const emailExists = await checkEmailExists(email);
    setIsNewUser(!emailExists);
    setEmailError("");
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    setShowPassword(true);
  };

  const validatePassword = () => {
    if (!password) {
      setPasswordError("Password is required");
      return false;
    }
    if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    Keyboard.dismiss();
    if (!validatePassword()) return;

    try {
      if (isNewUser) {
        // TODO: Replace with actual API call to register user
        await AsyncStorage.setItem("userToken", "temp-token");
        await AsyncStorage.setItem("userEmail", email);
        navigation.replace("Onboarding");
      } else {
        // TODO: Implement actual login logic
        navigation.navigate("Dashboard")
      }
    } catch (error) {
      console.error("Authentication error:", error);
      // TODO: Show error message to user
    }
  };

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
                  onChangeText={(text) => {
                    setPassword(text);
                    if (passwordError) setPasswordError("");
                  }}
                  secureTextEntry
                  returnKeyType="go"
                  onSubmitEditing={handleSubmit}
                  inputContainerStyle={styles.input}
                  inputStyle={styles.inputText}
                  placeholderTextColor={COLORS.textPlaceholder}
                  errorMessage={passwordError}
                  errorStyle={styles.errorText}
                  containerStyle={[styles.inputWrapper, { width: 250 }]}
                />

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleSubmit}
                >
                  <Text style={styles.actionButtonText}>
                    {isNewUser ? "Create Account" : "Log In"}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Fixed Bottom Section */}
      <View style={styles.bottomSection}>
        {showPassword && (
          <Animated.View style={{ opacity: fadeAnim }}>
            <TouchableOpacity
              style={styles.bottomLink}
              onPress={() => navigation.navigate("ForgotPassword")}
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
    marginTop: 50,
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
    marginTop: -100,
  },
  inputSection: {
    width: "100%",
    alignItems: "center",
  },
  centeredInputWrapper: {
    alignItems: "center",
    width: "100%",
    marginBottom: 300,
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
  actionButton: {
    backgroundColor: "transparent",
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 30,
    marginTop: 20,
  },
  actionButtonText: {
    color: COLORS.textPink,
    fontSize: 16,
    fontWeight: "600",
  },
  bottomSection: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: "center",
    backgroundColor: COLORS.deepPurpleBackground,
  },
  bottomLink: {
    paddingVertical: 10,
  },
  forgotPasswordText: {
    color: COLORS.textWhite,
    fontSize: 14,
    fontWeight: "500",
  },
});
