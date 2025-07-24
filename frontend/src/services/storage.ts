import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserPreferences } from '../types';

export class StorageService {
  // Keys for different data types
  private static readonly KEYS = {
    USER_PREFERENCES: 'user_preferences',
    ONBOARDING_COMPLETED: 'onboarding_completed',
    FIRST_TIME_USER: 'first_time_user',
    FAVORITES: 'favorites',
    VISIT_COUNTS: 'visit_counts',
    LOCAL_CHATS: 'local_chats',
    CHAT_RATINGS: 'chat_ratings',
    SESSION_ID: 'session_id',
    AUTH_TOKEN: 'auth_token',
    REFRESH_TOKEN: 'refresh_token',
    CURRENT_USER: 'current_user',
    CAMERA_PERMISSIONS: 'camera_permissions',
    MICROPHONE_PERMISSIONS: 'microphone_permissions',
  };

  // Generic storage methods
  static async setItem(key: string, value: any): Promise<void> {
    try {
      const stringValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, stringValue);
    } catch (error) {
      console.error(`Error saving ${key}:`, error);
      throw error;
    }
  }

  static async getItem<T>(key: string, defaultValue: T): Promise<T> {
    try {
      const value = await AsyncStorage.getItem(key);
      if (value === null) {
        return defaultValue;
      }
      return JSON.parse(value);
    } catch (error) {
      console.error(`Error getting ${key}:`, error);
      return defaultValue;
    }
  }

  static async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing ${key}:`, error);
      throw error;
    }
  }

  // User Preferences
  static async getUserPreferences(): Promise<UserPreferences> {
    const defaultPreferences: UserPreferences = {
      theme: 'light',
      language: 'id',
      soundEnabled: true,
      voiceEnabled: true,
      notificationsEnabled: true,
    };

    return await this.getItem(this.KEYS.USER_PREFERENCES, defaultPreferences);
  }

  static async setUserPreferences(preferences: UserPreferences): Promise<void> {
    await this.setItem(this.KEYS.USER_PREFERENCES, preferences);
  }

  static async updateUserPreference<K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K],
  ): Promise<void> {
    const currentPreferences = await this.getUserPreferences();
    const updatedPreferences = { ...currentPreferences, [key]: value };
    await this.setUserPreferences(updatedPreferences);
  }

  // Onboarding
  static async isOnboardingCompleted(): Promise<boolean> {
    return await this.getItem(this.KEYS.ONBOARDING_COMPLETED, false);
  }

  static async setOnboardingCompleted(completed: boolean): Promise<void> {
    await this.setItem(this.KEYS.ONBOARDING_COMPLETED, completed);
  }

  static async isFirstTimeUser(): Promise<boolean> {
    return await this.getItem(this.KEYS.FIRST_TIME_USER, true);
  }

  static async setFirstTimeUser(isFirstTime: boolean): Promise<void> {
    await this.setItem(this.KEYS.FIRST_TIME_USER, isFirstTime);
  }

  // Favorites
  static async getFavorites(): Promise<string[]> {
    return await this.getItem(this.KEYS.FAVORITES, []);
  }

  static async addFavorite(artifactId: string): Promise<void> {
    const favorites = await this.getFavorites();
    if (!favorites.includes(artifactId)) {
      favorites.push(artifactId);
      await this.setItem(this.KEYS.FAVORITES, favorites);
    }
  }

  static async removeFavorite(artifactId: string): Promise<void> {
    const favorites = await this.getFavorites();
    const updatedFavorites = favorites.filter(id => id !== artifactId);
    await this.setItem(this.KEYS.FAVORITES, updatedFavorites);
  }

  static async isFavorite(artifactId: string): Promise<boolean> {
    const favorites = await this.getFavorites();
    return favorites.includes(artifactId);
  }

  // Visit Counts
  static async getVisitCounts(): Promise<{ [artifactId: string]: number }> {
    return await this.getItem(this.KEYS.VISIT_COUNTS, {});
  }

  static async incrementVisitCount(artifactId: string): Promise<number> {
    const counts = await this.getVisitCounts();
    const newCount = (counts[artifactId] || 0) + 1;
    counts[artifactId] = newCount;
    await this.setItem(this.KEYS.VISIT_COUNTS, counts);
    return newCount;
  }

  static async getVisitCount(artifactId: string): Promise<number> {
    const counts = await this.getVisitCounts();
    return counts[artifactId] || 0;
  }

  // Permissions
  static async getCameraPermissionStatus(): Promise<boolean> {
    return await this.getItem(this.KEYS.CAMERA_PERMISSIONS, false);
  }

  static async setCameraPermissionStatus(granted: boolean): Promise<void> {
    await this.setItem(this.KEYS.CAMERA_PERMISSIONS, granted);
  }

  static async getMicrophonePermissionStatus(): Promise<boolean> {
    return await this.getItem(this.KEYS.MICROPHONE_PERMISSIONS, false);
  }

  static async setMicrophonePermissionStatus(granted: boolean): Promise<void> {
    await this.setItem(this.KEYS.MICROPHONE_PERMISSIONS, granted);
  }

  // Clear all data
  static async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Error clearing all data:', error);
      throw error;
    }
  }

  // Clear user-specific data (logout)
  static async clearUserData(): Promise<void> {
    try {
      const keysToRemove = [
        this.KEYS.AUTH_TOKEN,
        this.KEYS.REFRESH_TOKEN,
        this.KEYS.CURRENT_USER,
        this.KEYS.LOCAL_CHATS,
        this.KEYS.CHAT_RATINGS,
      ];

      await AsyncStorage.multiRemove(keysToRemove);
    } catch (error) {
      console.error('Error clearing user data:', error);
      throw error;
    }
  }

  // Get storage info
  static async getStorageInfo(): Promise<{
    totalSize: number;
    itemCount: number;
    keys: string[];
  }> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const items = await AsyncStorage.multiGet(keys);

      let totalSize = 0;
      items.forEach(([key, value]) => {
        if (value) {
          totalSize += value.length;
        }
      });

      return {
        totalSize,
        itemCount: keys.length,
        keys: [...keys],
      };
    } catch (error) {
      console.error('Error getting storage info:', error);
      return {
        totalSize: 0,
        itemCount: 0,
        keys: [],
      };
    }
  }

  // Backup data
  static async backupData(): Promise<{ [key: string]: any }> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const items = await AsyncStorage.multiGet(keys);

      const backup: { [key: string]: any } = {};
      items.forEach(([key, value]) => {
        if (value) {
          try {
            backup[key] = JSON.parse(value);
          } catch {
            backup[key] = value;
          }
        }
      });

      return backup;
    } catch (error) {
      console.error('Error creating backup:', error);
      throw error;
    }
  }

  // Restore data
  static async restoreData(backup: { [key: string]: any }): Promise<void> {
    try {
      const items: [string, string][] = Object.entries(backup).map(
        ([key, value]) => [
          key,
          typeof value === 'string' ? value : JSON.stringify(value),
        ],
      );

      await AsyncStorage.multiSet(items);
    } catch (error) {
      console.error('Error restoring data:', error);
      throw error;
    }
  }
}

export default StorageService;
