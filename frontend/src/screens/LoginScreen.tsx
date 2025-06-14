import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Keyboard,
  Platform,
  Animated,
  KeyboardAvoidingView,
  ActivityIndicator,
} from "react-native";
import { Input, Text } from "@rneui/themed";
import { COLORS } from "../constants/colors";
import { StatsBar } from "../components/StatsBar";
import { storage, STORAGE_KEYS } from "../utils/storage";
import { api } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

// Email form validation function
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export default function LoginScreen({ navigation }: any) {
  const { login, register } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showUsername, setShowUsername] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];

  const handleEmailSubmit = async () => {
    if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    try {
      setIsLoading(true);
      // First check if the email exists in the database
      const response = await api.auth.checkEmail(email);
      const emailExists = response.exists;

      setIsNewUser(!emailExists);
      if (emailExists) {
        // Email exists, skip username screen
        setShowPassword(true);
      } else {
        // New user, show username screen
        setShowUsername(true);
        setUsername("");
      }

      // Start fade animation
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } catch (error) {
      console.error("Error checking email:", error);
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUsernameSubmit = () => {
    if (!username || username.trim() === "") {
      setUsernameError("Username is required");
      return;
    }
    setShowUsername(false);
    setShowPassword(true);
    // Reset animation for password screen
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
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

    setIsLoading(true);
    setError("");

    try {
      if (isNewUser) {
        // Register new user
        await register(email, password, username);
        // Registration successful - AuthContext will handle state and navigation
      } else {
        // Login existing user
        const loginSuccess = await login(email, password);
        if (!loginSuccess) {
          setPasswordError("Incorrect password");
          setPassword(""); // Clear password field for retry
          return; // Return early to maintain screen state
        }
        // Login successful - AuthContext will handle state and navigation
      }
    } catch (error: any) {
      console.error("Authentication error:", error);
      if (error.message.includes("already in use")) {
        setError("Email or username is already in use");
      } else {
        setError(error.message || "An error occurred during authentication");
      }
    } finally {
      setIsLoading(false);
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
            {!showUsername && !showPassword ? (
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
            ) : showUsername ? (
              // Username Screen
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
                  placeholder="Choose a username"
                  value={username}
                  onChangeText={(text) => {
                    setUsername(text);
                    if (usernameError) setUsernameError("");
                  }}
                  autoCapitalize="none"
                  returnKeyType="next"
                  onSubmitEditing={handleUsernameSubmit}
                  inputContainerStyle={styles.input}
                  inputStyle={styles.inputText}
                  placeholderTextColor={COLORS.textPlaceholder}
                  errorMessage={usernameError}
                  errorStyle={styles.errorText}
                  containerStyle={[styles.inputWrapper, { width: 250 }]}
                />
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleUsernameSubmit}
                >
                  <Text style={styles.actionButtonText}>Continue</Text>
                </TouchableOpacity>
              </Animated.View>
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
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color={COLORS.textWhite} />
                  ) : (
                    <Text style={styles.actionButtonText}>
                      {isNewUser ? "Create Account" : "Log In"}
                    </Text>
                  )}
                </TouchableOpacity>

                {error ? <Text style={styles.errorText}>{error}</Text> : null}
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
