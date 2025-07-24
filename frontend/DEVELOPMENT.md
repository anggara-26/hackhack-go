# Development Guide - Next Implementation Steps

This guide outlines the next steps to complete the ArtifactID React Native app implementation.

## 🎯 Priority Implementation Order

### 1. Camera Integration (HIGH PRIORITY)

**File**: `src/screens/CameraScreen.tsx`

**Current Status**: Placeholder implementation
**Next Steps**:

```typescript
// Install react-native-image-picker if not already installed
// npm install react-native-image-picker

import {
  launchImageLibrary,
  launchCamera,
  ImagePickerResponse,
} from 'react-native-image-picker';

// Replace placeholder camera functionality with:
const handleTakePhoto = () => {
  const options = {
    mediaType: 'photo' as const,
    quality: 0.8,
    maxWidth: 1080,
    maxHeight: 1080,
  };

  launchCamera(options, (response: ImagePickerResponse) => {
    if (response.assets && response.assets[0]) {
      const imageUri = response.assets[0].uri;
      navigation.navigate('PhotoPreview', {
        imageUri: imageUri!,
        isFromGallery: false,
      });
    }
  });
};
```

### 2. Backend API Integration (HIGH PRIORITY)

**Files**: `src/services/*.ts`

**Current Status**: Mock data and placeholder functions
**Next Steps**:

**a) Update API Service (`src/services/api.ts`)**:

```typescript
// Replace placeholder BASE_URL with actual backend URL
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';

// Implement actual HTTP requests
export const uploadImage = async (
  imageUri: string,
): Promise<ArtifactResult> => {
  const formData = new FormData();
  formData.append('image', {
    uri: imageUri,
    type: 'image/jpeg',
    name: 'artifact.jpg',
  } as any);

  const response = await api.post('/artifacts/identify', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};
```

**b) Update Auth Service (`src/services/auth.ts`)**:

```typescript
// Replace mock implementations with actual API calls
export const login = async (
  email: string,
  password: string,
): Promise<AuthResult> => {
  const response = await api.post('/auth/login', { email, password });
  const { token, user } = response.data;

  await AsyncStorage.setItem('token', token);
  await AsyncStorage.setItem('user', JSON.stringify(user));

  return { token, user };
};
```

### 3. Real-time Chat Implementation (MEDIUM PRIORITY)

**File**: `src/services/socket.ts`

**Current Status**: Basic structure created
**Next Steps**:

```typescript
// Install socket.io-client if not already installed
// npm install socket.io-client

import io, { Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;

  connect(token: string): void {
    this.socket = io(process.env.SOCKET_URL || 'http://localhost:3000', {
      auth: { token },
    });

    this.socket.on('connect', () => {
      console.log('Connected to server');
    });
  }

  joinChatRoom(sessionId: string): void {
    this.socket?.emit('join_chat', { sessionId });
  }

  sendMessage(sessionId: string, message: string): void {
    this.socket?.emit('send_message', { sessionId, message });
  }

  onNewMessage(callback: (message: ChatMessage) => void): void {
    this.socket?.on('new_message', callback);
  }
}
```

**Update ChatScreen (`src/screens/ChatScreen.tsx`)**:

```typescript
// Replace mock message handling with real Socket.IO integration
useEffect(() => {
  SocketService.connect(token);
  SocketService.joinChatRoom(sessionId);

  SocketService.onNewMessage(message => {
    setMessages(prev => [...prev, message]);
  });

  return () => {
    SocketService.disconnect();
  };
}, []);

const handleSendMessage = async () => {
  if (!inputText.trim()) return;

  SocketService.sendMessage(sessionId, inputText.trim());
  setInputText('');
};
```

### 4. Photo Preview & Upload (MEDIUM PRIORITY)

**File**: `src/screens/PhotoPreviewScreen.tsx`

**Current Status**: UI implemented
**Next Steps**:

```typescript
const handleConfirm = async () => {
  try {
    setIsUploading(true);

    // Upload image and get identification result
    const result = await ArtifactService.identifyArtifact(imageUri);

    navigation.navigate('ArtifactResult', {
      artifactId: result.id,
      imageUri: imageUri,
    });
  } catch (error) {
    Alert.alert('Error', 'Failed to identify artifact');
  } finally {
    setIsUploading(false);
  }
};
```

### 5. Artifact Result Enhancement (LOW PRIORITY)

**File**: `src/screens/ArtifactResultScreen.tsx`

**Current Status**: Mock data display
**Next Steps**:

```typescript
// Replace mock artifact data with actual API call
useEffect(() => {
  const fetchArtifactDetails = async () => {
    try {
      setIsLoading(true);
      const artifact = await ArtifactService.getArtifactById(artifactId);
      setArtifact(artifact);
    } catch (error) {
      console.error('Error fetching artifact:', error);
    } finally {
      setIsLoading(false);
    }
  };

  fetchArtifactDetails();
}, [artifactId]);
```

### 6. History & Profile Implementation (LOW PRIORITY)

**Files**: `src/screens/HistoryScreen.tsx`, `src/screens/ProfileScreen.tsx`

**Next Steps**:

- Implement actual data fetching from API
- Add pagination for history list
- Implement user settings in profile
- Add export functionality

## 🧪 Testing Strategy

### Unit Tests

Create test files for each service:

```bash
src/services/__tests__/
├── api.test.ts
├── auth.test.ts
├── artifact.test.ts
└── socket.test.ts
```

### Integration Tests

Test complete user flows:

```bash
src/__tests__/
├── auth-flow.test.tsx
├── camera-upload.test.tsx
└── chat-functionality.test.tsx
```

### E2E Tests

Using Detox or Appium:

```bash
e2e/
├── auth.e2e.js
├── camera.e2e.js
└── chat.e2e.js
```

## 🔧 Configuration Files Needed

### Environment Variables (`.env`)

```env
API_BASE_URL=http://localhost:3000/api
SOCKET_URL=http://localhost:3000
OPENAI_API_KEY=your_openai_key_here
APP_NAME=ArtifactID
APP_VERSION=1.0.0
```

### Metro Configuration (`metro.config.js`)

```javascript
module.exports = {
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
  resolver: {
    assetExts: ['bin', 'txt', 'jpg', 'png', 'json', 'mp4', 'mov'],
  },
};
```

## 🚀 Deployment Preparation

### Android (`android/app/build.gradle`)

```gradle
android {
    compileSdkVersion 33

    defaultConfig {
        applicationId "com.artifactid.app"
        minSdkVersion 21
        targetSdkVersion 33
        versionCode 1
        versionName "1.0.0"
    }

    signingConfigs {
        release {
            storeFile file('../keystores/release.keystore')
            storePassword System.getenv("KEYSTORE_PASSWORD")
            keyAlias System.getenv("KEY_ALIAS")
            keyPassword System.getenv("KEY_PASSWORD")
        }
    }
}
```

### iOS (`ios/ArtifactID/Info.plist`)

```xml
<key>NSCameraUsageDescription</key>
<string>This app needs access to camera to take photos of artifacts</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>This app needs access to photo library to select images</string>
<key>NSMicrophoneUsageDescription</key>
<string>This app needs access to microphone for voice messages</string>
```

## 📝 Documentation Updates

### API Documentation

- Document all endpoints in `docs/api.md`
- Include request/response examples
- Add error handling documentation

### User Guide

- Create user manual in `docs/user-guide.md`
- Include screenshots and step-by-step guides
- Translate to Indonesian

### Developer Documentation

- Architecture decisions in `docs/architecture.md`
- Deployment guide in `docs/deployment.md`
- Contributing guidelines in `CONTRIBUTING.md`

## 🎯 Performance Optimization

### Image Optimization

```typescript
// Implement image compression before upload
import ImageResizer from 'react-native-image-resizer';

const compressImage = async (uri: string) => {
  return await ImageResizer.createResizedImage(uri, 800, 600, 'JPEG', 80);
};
```

### Memory Management

```typescript
// Implement proper cleanup in useEffect hooks
useEffect(() => {
  const subscription = someAsyncOperation();

  return () => {
    subscription.unsubscribe();
  };
}, []);
```

### Caching Strategy

```typescript
// Implement cache for API responses
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

export const getCachedData = async (key: string) => {
  const cached = await AsyncStorage.getItem(key);
  if (cached) {
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < CACHE_EXPIRY) {
      return data;
    }
  }
  return null;
};
```

## ✅ Implementation Checklist

- [ ] Camera integration with react-native-image-picker
- [ ] Backend API integration (auth, upload, chat)
- [ ] Socket.IO real-time chat implementation
- [ ] Image upload and processing
- [ ] Error handling and loading states
- [ ] User authentication flow
- [ ] Data persistence with AsyncStorage
- [ ] Push notifications setup
- [ ] Performance optimization
- [ ] Testing implementation
- [ ] Documentation completion
- [ ] App store preparation

---

This guide provides a roadmap for completing the ArtifactID React Native app. Follow the priority order for maximum impact and user value.
