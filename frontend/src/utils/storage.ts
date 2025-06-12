import * as SecureStore from 'expo-secure-store';

// Storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_DATA: 'user_data',
  FIRST_LAUNCH: 'first_launch',
  ONBOARDING_COMPLETE: 'onboarding_complete',
  APP_PREFERENCES: 'app_preferences',
} as const;

// Type for storage keys
export type StorageKey = keyof typeof STORAGE_KEYS;

// Storage utility class
class Storage {
  private getKey(key: StorageKey): string {
    return STORAGE_KEYS[key];
  }

  // Set an item in storage
  async setItem<T>(key: StorageKey, value: T): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      await SecureStore.setItemAsync(this.getKey(key), jsonValue);
    } catch (error) {
      console.error('Error saving to storage:', error);
      throw error;
    }
  }

  // Get an item from storage
  async getItem<T>(key: StorageKey): Promise<T | null> {
    try {
      const jsonValue = await SecureStore.getItemAsync(this.getKey(key));
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error('Error reading from storage:', error);
      return null;
    }
  }

  // Remove an item from storage
  async removeItem(key: StorageKey): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(this.getKey(key));
    } catch (error) {
      console.error('Error removing from storage:', error);
      throw error;
    }
  }

  // Clear all storage
  async clearAll(): Promise<void> {
    try {
      await Promise.all(
        Object.values(STORAGE_KEYS).map(key => 
          SecureStore.deleteItemAsync(key)
        )
      );
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw error;
    }
  }
}

// Create and export a single instance
export const storage = new Storage(); 