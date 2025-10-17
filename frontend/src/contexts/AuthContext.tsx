import React, { createContext, useState, useContext, useEffect } from "react";
import { api } from "../services/api";
import { storage, STORAGE_KEYS } from "../utils/storage";

// Define the shape of our user object
interface User {
  id: number;
  email: string;
  username?: string;
  onboardingComplete?: boolean;
}

interface UserPreferences {
  completed: boolean;
}

// Define the shape of our Auth Context
interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  isOnboardingComplete: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (
    email: string,
    password: string,
    username: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  completeOnboarding: () => Promise<void>;
}

// Create context with a default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider Component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);

  useEffect(() => {
    const loadStoredAuth = async () => {
      try {
        const storedToken = await storage.getItem<string>(
          STORAGE_KEYS.AUTH_TOKEN
        );
        const storedUser = await storage.getItem<User>(STORAGE_KEYS.USER_DATA);

        if (storedToken && storedUser) {
          // Check user-specific preferences
          const userPreferences = await storage.getItem<UserPreferences>(
            STORAGE_KEYS.USER_PREFERENCES,
            storedUser.id
          );
          const onboardingComplete =
            storedUser.onboardingComplete || !!userPreferences?.completed;

          setToken(storedToken);
          setUser({
            ...storedUser,
            onboardingComplete,
          });
          setIsOnboardingComplete(onboardingComplete);
        } else {
          // Clear any partial state
          if (storedUser?.id) {
            await storage.clearUserData(storedUser.id);
          }
          setToken(null);
          setUser(null);
          setIsOnboardingComplete(false);
        }
      } catch (err) {
        console.error("Error loading auth data", err);
        setToken(null);
        setUser(null);
        setIsOnboardingComplete(false);
      } finally {
        setIsLoading(false);
      }
    };
    loadStoredAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await api.auth.login(email, password);

      if (!response.token || !response.user) {
        throw new Error("Invalid response from server");
      }

      // Get user-specific preferences
      const userPreferences = await storage.getItem<UserPreferences>(
        STORAGE_KEYS.USER_PREFERENCES,
        response.user.id
      );

      // Determine onboarding status from multiple sources
      const onboardingComplete =
        response.user.onboardingComplete || // from server
        !!userPreferences?.completed; // from stored preferences

      const userData = {
        ...response.user,
        onboardingComplete,
      };

      // Store user data and token
      await storage.setItem(STORAGE_KEYS.AUTH_TOKEN, response.token);
      await storage.setItem(STORAGE_KEYS.USER_DATA, userData);

      // If onboarding was completed before, ensure preferences exist
      if (onboardingComplete) {
        await storage.setItem(
          STORAGE_KEYS.USER_PREFERENCES,
          { completed: true },
          response.user.id
        );
      }

      setToken(response.token);
      setUser(userData);
      setIsOnboardingComplete(onboardingComplete);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Login Failed";
      setError(errorMessage);
      // Don't throw a new error, just return false to indicate failure
      return false;
    } finally {
      setIsLoading(false);
    }
    return true;
  };

  const register = async (
    email: string,
    password: string,
    username: string
  ) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await api.auth.register(email, password, username);

      if (!response.user) {
        throw new Error("Invalid response from server");
      }

      // After registration, login to get the token
      const loginResponse = await api.auth.login(email, password);

      if (!loginResponse.token || !loginResponse.user) {
        throw new Error("Login failed after registration");
      }

      // Store user data and token
      await storage.setItem(STORAGE_KEYS.AUTH_TOKEN, loginResponse.token);
      await storage.setItem(STORAGE_KEYS.USER_DATA, {
        ...loginResponse.user,
        onboardingComplete: false,
      });

      // Set initial state
      setUser({
        ...loginResponse.user,
        onboardingComplete: false,
      });
      setToken(loginResponse.token);
      setIsOnboardingComplete(false);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Registration Failed";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const completeOnboarding = async () => {
    try {
      if (!user) throw new Error("No user found");

      // Get existing preferences first
      const existingPrefs = await storage.getItem<any>(
        STORAGE_KEYS.USER_PREFERENCES
      );

      const updatedUser = {
        ...user,
        onboardingComplete: true,
      };

      await storage.setItem(STORAGE_KEYS.USER_DATA, updatedUser);

      // Preserve existing preferences data when marking as completed
      await storage.setItem(
        STORAGE_KEYS.USER_PREFERENCES,
        {
          ...existingPrefs,
          completed: true,
        },
        user.id
      );

      setUser(updatedUser);
      setIsOnboardingComplete(true);
    } catch (err) {
      console.error("Error completing onboarding:", err);
      throw err;
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      if (user) {
        // Remove auth-related data and portfolio data
        await storage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
        await storage.removeItem(STORAGE_KEYS.USER_DATA);
        // Also remove the selected portfolio ID to prevent accessing stale data
        await storage.removeItem(STORAGE_KEYS.SELECTED_PORTFOLIO);
        console.log("Cleared selected portfolio ID during logout");
      }
      setToken(null);
      setUser(null);
      setIsOnboardingComplete(false);
    } catch (err) {
      console.error("Error during logout", err);
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => setError(null);

  const value = {
    user,
    token,
    isLoading,
    error,
    isOnboardingComplete,
    login,
    register,
    logout,
    clearError,
    setUser,
    setToken,
    completeOnboarding,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
