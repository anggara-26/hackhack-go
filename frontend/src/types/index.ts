// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// API Response with Pagination
export interface PaginatedResponse<T = any> {
  success: boolean;
  data: {
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  } & {
    [key: string]: T[];
  };
}

// User Types
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  profilePicture?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

// Artifact Types
export interface ArtifactIdentification {
  name: string;
  category: string;
  description: string;
  history: string;
  confidence: number;
  isRecognized: boolean;
  culturalSignificance?: string;
  estimatedAge?: string;
  materials?: string;
}

export interface Artifact {
  _id: string;
  imageUrl: string;
  originalFilename: string;
  identificationResult: ArtifactIdentification;
  userId?: string;
  sessionId?: string;
  createdAt: string;
  updatedAt: string;
}

// Chat Types
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ChatSession {
  _id: string;
  artifactId: string;
  userId?: string;
  // sessionId?: string;
  messages: ChatMessage[];
  rating?: 'up' | 'down';
  createdAt: string;
  updatedAt: string;
}

export interface QuickQuestion {
  id: string;
  text: string;
  category: string;
}

// Navigation Types
export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Auth: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  Main: undefined;
  Home: undefined;
  Camera: undefined;
  Gallery: undefined;
  PhotoPreview: { photoUri: string };
  ArtifactResult: { artifact: Artifact };
  Chat: { sessionId: string; artifact: Artifact };
  History: undefined;
  Profile: undefined;
  Settings: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Camera: undefined;
  History: undefined;
  Profile: undefined;
};

// Socket Types
export interface SocketChatData {
  sessionId: string;
  message?: string;
  question?: string;
  rating?: 'up' | 'down';
}

export interface MessageChunk {
  chunk: string;
  sessionId: string;
}

export interface MessageComplete {
  fullResponse: string;
  sessionId: string;
}

// Voice Types
export interface VoiceSession {
  _id: string;
  artifactId: string;
  userId?: string;
  isActive: boolean;
  createdAt: string;
}

// Storage Types
export interface UserPreferences {
  theme: 'light' | 'dark';
  language: 'id' | 'en';
  soundEnabled: boolean;
  voiceEnabled: boolean;
  notificationsEnabled: boolean;
}

// History Types
export interface HistoryItem {
  id: string;
  artifact: Artifact;
  lastChatSession?: ChatSession;
  isFavorite: boolean;
  visitCount: number;
  lastVisited: string;
}

// Onboarding Types
export interface OnboardingSlide {
  id: string;
  title: string;
  description: string;
  image: any; // require() image
  backgroundColor: string;
}

// Error Types
export interface AppError {
  code: string;
  message: string;
  details?: string;
}

// Form Types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface ForgotPasswordForm {
  email: string;
}

export interface ResetPasswordForm {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

// Camera Types
export interface CameraOptions {
  mediaType: 'photo' | 'video' | 'mixed';
  quality: number;
  maxWidth?: number;
  maxHeight?: number;
  includeBase64?: boolean;
}

export interface ImagePickerResponse {
  assets?: Array<{
    uri: string;
    type: string;
    fileName?: string;
    fileSize?: number;
    width?: number;
    height?: number;
    base64?: string;
  }>;
  didCancel?: boolean;
  errorMessage?: string;
}
