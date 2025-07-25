import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://9d77db4bfb2b.ngrok-free.app/api'; // Android emulator
const BASE_URL_PLAIN = 'https://9d77db4bfb2b.ngrok-free.app'; // Plain URL without /api

export class ApiService {
  private static token: string | null = null;

  static get BASE_URL() {
    return BASE_URL;
  }

  static get BASE_URL_PLAIN() {
    return BASE_URL_PLAIN;
  }

  static async setToken(token: string) {
    this.token = token;
    await AsyncStorage.setItem('auth_token', token);
  }

  static async getToken(): Promise<string | null> {
    if (!this.token) {
      this.token = await AsyncStorage.getItem('auth_token');
    }
    return this.token;
  }

  static async removeToken() {
    this.token = null;
    await AsyncStorage.removeItem('auth_token');
  }

  private static async getHeaders(): Promise<Record<string, string>> {
    const token = await this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }

  private static async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${BASE_URL}${endpoint}`;
    const headers = await this.getHeaders();

    const config: RequestInit = {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    };

    console.log(`Making request to: ${endpoint}`, config);

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}`);
      }

      console.log(`Response from ${endpoint}:`, data);

      return data;
    } catch (error) {
      console.log('API Request Error:', error);
      console.error('API Request Error:', error);
      throw error;
    }
  }

  // GET request
  static async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  // POST request
  static async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PUT request
  static async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // DELETE request
  static async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // Upload file (multipart/form-data)
  static async upload<T>(endpoint: string, formData: FormData): Promise<T> {
    const url = `${BASE_URL}${endpoint}`;
    const token = await this.getToken();

    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('Upload Error:', error);
      throw error;
    }
  }
}

export default ApiService;
