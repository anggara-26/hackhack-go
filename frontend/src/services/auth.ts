import ApiService from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ApiResponse,
  User,
  AuthResponse,
  LoginForm,
  RegisterForm,
  ForgotPasswordForm,
} from '../types';

export class AuthService {
  // Register new user
  static async register(
    data: RegisterForm,
  ): Promise<ApiResponse<AuthResponse>> {
    const response = await ApiService.post<ApiResponse<AuthResponse>>(
      '/auth/register',
      data,
    );

    if (response.success && response.data) {
      await ApiService.setToken(response.data.token);
      await this.saveUser(response.data.user);
    }

    return response;
  }

  // Login user
  static async login(data: LoginForm): Promise<ApiResponse<AuthResponse>> {
    const response = await ApiService.post<ApiResponse<AuthResponse>>(
      '/auth/login',
      data,
    );

    if (response.success && response.data) {
      await ApiService.setToken(response.data.token);
      await this.saveUser(response.data.user);
    }

    return response;
  }

  // Forgot password
  static async forgotPassword(data: ForgotPasswordForm): Promise<ApiResponse> {
    return ApiService.post<ApiResponse>('/auth/forgot-password', data);
  }

  // Reset password
  static async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<ApiResponse> {
    return ApiService.post<ApiResponse>('/auth/reset-password', {
      token,
      newPassword,
    });
  }

  // Refresh token
  static async refreshToken(): Promise<ApiResponse<AuthResponse>> {
    const refreshToken = await AsyncStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await ApiService.post<ApiResponse<AuthResponse>>(
      '/auth/refresh',
      { refreshToken },
    );

    if (response.success && response.data) {
      await ApiService.setToken(response.data.token);
      await this.saveUser(response.data.user);
    }

    return response;
  }

  // Get current user profile
  static async getProfile(): Promise<ApiResponse<User>> {
    return ApiService.get<ApiResponse<User>>('/auth/profile');
  }

  // Update user profile
  static async updateProfile(data: Partial<User>): Promise<ApiResponse<User>> {
    const response = await ApiService.put<ApiResponse<User>>(
      '/auth/profile',
      data,
    );

    if (response.success && response.data) {
      await this.saveUser(response.data);
    }

    return response;
  }

  // Logout
  static async logout(): Promise<void> {
    try {
      await ApiService.post('/auth/logout');
    } catch (error) {
      console.log('Logout API call failed:', error);
    } finally {
      await ApiService.removeToken();
      await AsyncStorage.removeItem('refresh_token');
      await AsyncStorage.removeItem('current_user');
    }
  }

  // Check if user is authenticated
  static async isAuthenticated(): Promise<boolean> {
    const token = await ApiService.getToken();
    return !!token;
  }

  // Get current user from storage
  static async getCurrentUser(): Promise<User | null> {
    try {
      const userString = await AsyncStorage.getItem('current_user');
      return userString ? JSON.parse(userString) : null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  // Save user to storage
  private static async saveUser(user: User): Promise<void> {
    await AsyncStorage.setItem('current_user', JSON.stringify(user));
  }

  // Save refresh token
  static async saveRefreshToken(refreshToken: string): Promise<void> {
    await AsyncStorage.setItem('refresh_token', refreshToken);
  }

  // Generate anonymous session ID
  static generateSessionId(): string {
    return `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get or create anonymous session
  static async getOrCreateSessionId(): Promise<string> {
    let sessionId = await AsyncStorage.getItem('session_id');
    if (!sessionId) {
      sessionId = this.generateSessionId();
      await AsyncStorage.setItem('session_id', sessionId);
    }
    return sessionId;
  }

  // Clear anonymous session
  static async clearSession(): Promise<void> {
    await AsyncStorage.removeItem('session_id');
  }
}

export default AuthService;
