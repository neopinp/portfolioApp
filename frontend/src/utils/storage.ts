import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_DATA: 'user_data',
  FIRST_LAUNCH: 'first_launch',
  ONBOARDING_COMPLETE: 'onboarding_complete',
  APP_PREFERENCES: 'app_preferences',
  USER_PREFERENCES: 'user_preferences'
} as const;

// Type for storage keys
type StorageKeyType = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];

// Function to get user-specific storage key
const getUserSpecificKey = (userId: number | undefined, key: StorageKeyType): string => {
  if (!userId) return key;
  return `${key}_${userId}`;
};

// Check if we're on web
const isWeb = Platform.OS === 'web';

// Storage utility class
class Storage {
  // Set an item in storage
  async setItem<T>(key: StorageKeyType, value: T, userId?: number): Promise<void> {
    try {
      const storageKey = getUserSpecificKey(userId, key);
      // Always stringify the value, regardless of type
      const stringValue = JSON.stringify(value);
      
      if (isWeb) {
        // Use localStorage for web
        localStorage.setItem(storageKey, stringValue);
      } else {
        // Use SecureStore for mobile
        await SecureStore.setItemAsync(storageKey, stringValue);
      }
    } catch (error) {
      console.error('Error saving to storage:', error);
      throw error;
    }
  }

  // Get an item from storage
  async getItem<T>(key: StorageKeyType, userId?: number): Promise<T | null> {
    try {
      const storageKey = getUserSpecificKey(userId, key);
      let value: string | null;
      
      if (isWeb) {
        // Use localStorage for web
        value = localStorage.getItem(storageKey);
      } else {
        // Use SecureStore for mobile
        value = await SecureStore.getItemAsync(storageKey);
      }
      
      if (value === null) return null;
      
      try {
        // Parse the JSON string
        return JSON.parse(value) as T;
      } catch {
        // If parsing fails, return as is (for legacy string values)
        return value as unknown as T;
      }
    } catch (error) {
      console.error('Error reading from storage:', error);
      return null;
    }
  }

  // Remove an item from storage
  async removeItem(key: StorageKeyType, userId?: number): Promise<void> {
    try {
      const storageKey = getUserSpecificKey(userId, key);
      
      if (isWeb) {
        // Use localStorage for web
        localStorage.removeItem(storageKey);
      } else {
        // Use SecureStore for mobile
        await SecureStore.deleteItemAsync(storageKey);
      }
    } catch (error) {
      console.error('Error removing from storage:', error);
      throw error;
    }
  }

  // Clear all storage for a specific user
  async clearUserData(userId: number): Promise<void> {
    try {
      const keys = Object.values(STORAGE_KEYS).map(key => getUserSpecificKey(userId, key));
      
      if (isWeb) {
        // Use localStorage for web
        keys.forEach(key => localStorage.removeItem(key));
      } else {
        // Use SecureStore for mobile
        await Promise.all(keys.map(key => SecureStore.deleteItemAsync(key)));
      }
    } catch (error) {
      console.error('Error clearing user storage:', error);
      throw error;
    }
  }

  // Clear all storage
  async clearAll(): Promise<void> {
    try {
      const keys = Object.values(STORAGE_KEYS);
      
      if (isWeb) {
        // Use localStorage for web
        keys.forEach(key => localStorage.removeItem(key));
      } else {
        // Use SecureStore for mobile
        await Promise.all(keys.map(key => SecureStore.deleteItemAsync(key)));
      }
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw error;
    }
  }
}

// Create and export a single instance
export const storage = new Storage(); 