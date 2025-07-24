import ApiService from './api';
import AuthService from './auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ApiResponse,
  Artifact,
  HistoryItem,
  PaginatedResponse,
} from '../types';

export class ArtifactService {
  // Upload and identify artifact
  static async uploadAndIdentify(
    imageUri: string,
    filename?: string,
  ): Promise<ApiResponse<{ artifact: Artifact }>> {
    const formData = new FormData();

    // Create file object for upload
    const imageFile = {
      uri: imageUri,
      type: 'image/jpeg',
      name: filename || 'artifact_image.jpg',
    } as any;

    formData.append('image', imageFile);

    // Add user ID or session ID
    const isAuthenticated = await AuthService.isAuthenticated();
    if (isAuthenticated) {
      const user = await AuthService.getCurrentUser();
      if (user) {
        formData.append('userId', user.id);
      }
    } else {
      const sessionId = await AuthService.getOrCreateSessionId();
      formData.append('sessionId', sessionId);
    }

    return ApiService.upload<ApiResponse<{ artifact: Artifact }>>(
      '/artifacts/upload',
      formData,
    );
  }

  // Get artifact by ID
  static async getArtifact(artifactId: string): Promise<ApiResponse<Artifact>> {
    return ApiService.get<ApiResponse<Artifact>>(`/artifacts/${artifactId}`);
  }

  // Get artifact history for current user
  static async getHistory(): Promise<PaginatedResponse<Artifact[]>> {
    const isAuthenticated = await AuthService.isAuthenticated();

    if (isAuthenticated) {
      return ApiService.get<PaginatedResponse<Artifact[]>>(
        '/artifacts/history',
      );
    } else {
      const sessionId = await AuthService.getOrCreateSessionId();
      return ApiService.get<PaginatedResponse<Artifact[]>>(
        `/artifacts/history?sessionId=${sessionId}`,
      );
    }
  }

  // Search artifacts
  static async searchArtifacts(
    query: string,
  ): Promise<ApiResponse<Artifact[]>> {
    return ApiService.get<ApiResponse<Artifact[]>>(
      `/artifacts/search?q=${encodeURIComponent(query)}`,
    );
  }

  // Get popular artifacts
  static async getPopularArtifacts(): Promise<ApiResponse<Artifact[]>> {
    return ApiService.get<ApiResponse<Artifact[]>>('/artifacts/popular');
  }

  // Get recent artifacts
  static async getRecentArtifacts(): Promise<ApiResponse<Artifact[]>> {
    return ApiService.get<ApiResponse<Artifact[]>>('/artifacts/recent');
  }

  // Mark artifact as favorite (local storage for now)
  static async toggleFavorite(artifactId: string): Promise<boolean> {
    try {
      const favorites = await this.getFavorites();
      const isFavorite = favorites.includes(artifactId);

      let updatedFavorites: string[];
      if (isFavorite) {
        updatedFavorites = favorites.filter(id => id !== artifactId);
      } else {
        updatedFavorites = [...favorites, artifactId];
      }

      await AsyncStorage.setItem('favorites', JSON.stringify(updatedFavorites));
      return !isFavorite;
    } catch (error) {
      console.error('Error toggling favorite:', error);
      return false;
    }
  }

  // Get favorite artifacts
  static async getFavorites(): Promise<string[]> {
    try {
      const favoritesString = await AsyncStorage.getItem('favorites');
      return favoritesString ? JSON.parse(favoritesString) : [];
    } catch (error) {
      console.error('Error getting favorites:', error);
      return [];
    }
  }

  // Check if artifact is favorite
  static async isFavorite(artifactId: string): Promise<boolean> {
    const favorites = await this.getFavorites();
    return favorites.includes(artifactId);
  }

  // Get artifact image URL
  static getImageUrl(imageUrl: string): string {
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }
    return `${ApiService.BASE_URL_PLAIN}${imageUrl}`;
  }

  // Increment visit count (local storage)
  static async incrementVisitCount(artifactId: string): Promise<void> {
    try {
      const countsString = await AsyncStorage.getItem('visit_counts');
      const counts = countsString ? JSON.parse(countsString) : {};

      counts[artifactId] = (counts[artifactId] || 0) + 1;

      await AsyncStorage.setItem('visit_counts', JSON.stringify(counts));
    } catch (error) {
      console.error('Error incrementing visit count:', error);
    }
  }

  // Get visit count
  static async getVisitCount(artifactId: string): Promise<number> {
    try {
      const countsString = await AsyncStorage.getItem('visit_counts');
      const counts = countsString ? JSON.parse(countsString) : {};
      return counts[artifactId] || 0;
    } catch (error) {
      console.error('Error getting visit count:', error);
      return 0;
    }
  }

  // Get enhanced history with favorites and visit counts
  static async getEnhancedHistory(): Promise<HistoryItem[]> {
    try {
      const historyResponse = await this.getHistory();
      if (!historyResponse.success || !historyResponse.data) {
        return [];
      }

      const artifacts = historyResponse.data.artifacts as unknown as Artifact[];
      const favorites = await this.getFavorites();

      const historyItems: HistoryItem[] = await Promise.all(
        artifacts.map(async artifact => {
          const visitCount = await this.getVisitCount(artifact._id);
          return {
            id: artifact._id,
            artifact,
            isFavorite: favorites.includes(artifact._id),
            visitCount,
            lastVisited: artifact.updatedAt,
          };
        }),
      );

      // Sort by last visited (most recent first)
      return historyItems.sort(
        (a, b) =>
          new Date(b.lastVisited).getTime() - new Date(a.lastVisited).getTime(),
      );
    } catch (error) {
      console.error('Error getting enhanced history:', error);
      return [];
    }
  }

  // Clear history (local data only)
  static async clearLocalData(): Promise<void> {
    try {
      await AsyncStorage.removeItem('favorites');
      await AsyncStorage.removeItem('visit_counts');
    } catch (error) {
      console.error('Error clearing local data:', error);
    }
  }
}

export default ArtifactService;
