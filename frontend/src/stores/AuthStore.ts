import { makeAutoObservable, runInAction } from 'mobx';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthService from '../services/auth';
import { User } from '../types';
import { Alert } from 'react-native';

export class AuthStore {
  // Observable state
  user: User | null = null;
  isLoading = false;
  isAuthenticated = false;
  sessionId: string | null = null;
  authError: string | null = null;

  constructor() {
    makeAutoObservable(this);
    this.initializeAuth();
  }

  // Initialize authentication state on app start
  private async initializeAuth() {
    try {
      runInAction(() => {
        this.isLoading = true;
        this.authError = null;
      });

      // Check if user is authenticated
      const isAuth = await AuthService.isAuthenticated();

      if (isAuth) {
        const currentUser = await AuthService.getCurrentUser();
        runInAction(() => {
          this.user = currentUser;
          this.isAuthenticated = true;
        });
      } else {
        // Get or create session ID for guest users
        const guestSessionId = await AuthService.getOrCreateSessionId();
        runInAction(() => {
          this.sessionId = guestSessionId;
          this.isAuthenticated = false;
        });
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      runInAction(() => {
        this.authError = 'Failed to initialize authentication';
      });
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  // Login action
  async login(email: string, password: string): Promise<boolean> {
    try {
      runInAction(() => {
        this.isLoading = true;
        this.authError = null;
      });

      const result = await AuthService.login({ email, password });

      if (result.success && result.data) {
        runInAction(() => {
          this.user = result.data!.user;
          this.isAuthenticated = true;
          this.sessionId = null; // Clear guest session
        });
        return true;
      } else {
        runInAction(() => {
          this.authError = result.error || 'Login failed';
        });
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      runInAction(() => {
        this.authError = 'Network error during login';
      });
      return false;
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  // Register action
  async register(
    email: string,
    password: string,
    name: string,
  ): Promise<boolean> {
    try {
      runInAction(() => {
        this.isLoading = true;
        this.authError = null;
      });

      const response = await AuthService.register({
        name,
        email,
        password,
        confirmPassword: password,
      });

      if (response.success) {
        // Save refresh token if provided
        if (response.data?.refreshToken) {
          await AuthService.saveRefreshToken(response.data.refreshToken);
        }

        runInAction(() => {
          this.user = response.data!.user;
          this.isAuthenticated = true;
          this.sessionId = null; // Clear guest session
        });

        return true;
      } else {
        runInAction(() => {
          this.authError = response.error || 'Registration failed';
        });
        return false;
      }
    } catch (error) {
      console.error('Registration error:', error);
      runInAction(() => {
        this.authError = 'Network error during registration';
      });
      return false;
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  // Logout action
  async logout(): Promise<void> {
    try {
      runInAction(() => {
        this.isLoading = true;
        this.authError = null;
      });

      await AuthService.logout();

      //   // Create new guest session
      //   const guestSessionId = await AuthService.getOrCreateSessionId();

      //   runInAction(() => {
      //     this.user = null;
      //     this.isAuthenticated = false;
      //     this.sessionId = guestSessionId;
      //   });
      runInAction(() => {
        this.user = null;
        this.isAuthenticated = false;
      });
    } catch (error) {
      console.error('Logout error:', error);
      runInAction(() => {
        this.authError = 'Failed to logout';
      });
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  // Forgot password action
  async forgotPassword(email: string): Promise<boolean> {
    try {
      runInAction(() => {
        this.isLoading = true;
        this.authError = null;
      });

      const result = await AuthService.forgotPassword({ email });

      if (!result.success) {
        runInAction(() => {
          this.authError = result.error || 'Failed to send reset email';
        });
        return false;
      }

      return true;
    } catch (error) {
      console.error('Forgot password error:', error);
      runInAction(() => {
        this.authError = 'Network error during password reset';
      });
      return false;
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  // Update user profile
  async updateProfile(updates: Partial<User>): Promise<boolean> {
    try {
      runInAction(() => {
        this.isLoading = true;
        this.authError = null;
      });

      const result = await AuthService.updateProfile(updates);

      if (result.success && result.data) {
        runInAction(() => {
          this.user = { ...this.user!, ...result.data! };
        });
        return true;
      } else {
        runInAction(() => {
          this.authError = result.error || 'Failed to update profile';
        });
        return false;
      }
    } catch (error) {
      console.error('Update profile error:', error);
      runInAction(() => {
        this.authError = 'Network error during profile update';
      });
      return false;
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  // Clear auth error
  clearError(): void {
    runInAction(() => {
      this.authError = null;
    });
  }

  // Getters for computed values
  get currentUserId(): string | null {
    return this.user?.id || null;
  }

  get userDisplayName(): string {
    return this.user?.name || this.user?.email || 'Guest User';
  }

  get isGuest(): boolean {
    return !this.isAuthenticated && !!this.sessionId;
  }

  get userIdentifier(): string {
    return this.user?.id || this.sessionId || 'unknown';
  }
}

// Create singleton instance
export const authStore = new AuthStore();
export default authStore;
