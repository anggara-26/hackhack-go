# ArtifactID - React Native Mobile App

Aplikasi mobile React Native untuk mengidentifikasi dan berinteraksi dengan artefak budaya Indonesia menggunakan AI.

## 🚀 Fitur Utama

### 1. **Onboarding & Authentication**

- **Splash Screen**: Loading screen dengan branding aplikasi
- **Onboarding**: Tutorial interaktif untuk pengguna baru
- **Authentication**: Login/Register dengan JWT token
- **Forgot Password**: Reset password via email
- **Guest Mode**: Akses terbatas tanpa registrasi

### 2. **Home/Dashboard**

- **Welcome Banner**: Sapaan personal berdasarkan waktu
- **Quick Actions**: Akses cepat ke fitur utama
- **Search**: Pencarian artefak dengan autocomplete
- **Recent Artifacts**: Riwayat identifikasi terbaru
- **Popular Artifacts**: Trending artefak populer
- **Statistics**: Jumlah identifikasi dan koleksi

### 3. **Take Photo & Identification**

- **Camera Integration**: Kamera native dengan kontrol manual
- **Gallery Selection**: Pilih foto dari galeri
- **Photo Preview**: Konfirmasi foto sebelum upload
- **AI Processing**: Identifikasi menggunakan OpenAI Vision
- **Confidence Score**: Tingkat keyakinan identifikasi
- **Multiple Results**: Hasil alternatif jika tidak yakin

### 4. **Chat with Artifact**

- **WhatsApp-style UI**: Interface chat yang familiar
- **Personality AI**: Setiap artefak punya karakter unik
- **Quick Questions**: Pertanyaan cepat yang sering ditanyakan
- **Voice Messages**: Pesan suara (planned)
- **Share Chat**: Bagikan percakapan
- **Rating System**: Rating untuk kualitas chat

### 5. **History & Collection**

- **Identification History**: Riwayat semua identifikasi
- **Favorites**: Bookmark artefak favorit
- **Chat Transcripts**: Simpan percakapan
- **Export**: Export data ke PDF/JSON
- **Search & Filter**: Cari dalam riwayat

## 🛠 Tech Stack

### Core Framework

- **React Native**: 0.72+
- **TypeScript**: Untuk type safety
- **React Navigation**: v6 untuk navigasi

### State Management & Storage

- **AsyncStorage**: Penyimpanan lokal
- **Context API**: State management sederhana
- **Custom Hooks**: Reusable logic

### Backend Integration

- **Axios**: HTTP client
- **Socket.IO**: Real-time chat
- **JWT**: Authentication
- **File Upload**: Multipart form data

### UI/UX

- **Custom Components**: Reusable UI components
- **Responsive Design**: Adaptif untuk berbagai ukuran layar
- **Dark Mode Ready**: Siap untuk dark theme
- **Accessibility**: WCAG compliant

## 📁 Struktur Project

```
src/
├── components/          # Reusable UI components
├── screens/            # Screen components
│   ├── auth/          # Authentication screens
│   ├── SplashScreen.tsx
│   ├── OnboardingScreen.tsx
│   ├── HomeScreen.tsx
│   ├── CameraScreen.tsx
│   ├── ChatScreen.tsx
│   ├── HistoryScreen.tsx
│   ├── ProfileScreen.tsx
│   ├── PhotoPreviewScreen.tsx
│   └── ArtifactResultScreen.tsx
├── navigation/         # Navigation configuration
│   ├── RootNavigator.tsx
│   └── MainTabs.tsx
├── services/          # API and business logic
│   ├── api.ts         # HTTP client
│   ├── auth.ts        # Authentication
│   ├── artifact.ts    # Artifact identification
│   ├── chat.ts        # Chat messaging
│   ├── socket.ts      # WebSocket connection
│   └── storage.ts     # Local storage
├── hooks/             # Custom React hooks
│   └── useNavigation.ts
├── types/             # TypeScript type definitions
│   └── index.ts
├── utils/             # Utility functions
└── App.tsx           # Root component
```

## 🔧 Setup & Installation

### Prerequisites

- Node.js 16+
- React Native CLI
- Android Studio / Xcode
- Java 11+

### Installation Steps

1. **Clone & Install Dependencies**

```bash
cd frontend
npm install
```

2. **Install iOS Dependencies** (macOS only)

```bash
cd ios && pod install && cd ..
```

3. **Configure Environment**

```bash
# Copy environment template
cp .env.example .env

# Edit environment variables
nano .env
```

4. **Start Metro Server**

```bash
npm start
```

5. **Run on Device/Simulator**

```bash
# Android
npm run android

# iOS
npm run ios
```

## 🔐 Security Features

- **JWT Authentication**: Secure token-based auth
- **Input Validation**: Client & server-side validation
- **Image Encryption**: Secure image upload
- **Privacy Controls**: Data privacy settings
- **Secure Storage**: Encrypted local storage

## 📱 Development

### Available Scripts

```bash
npm start          # Start Metro bundler
npm run android    # Run on Android
npm run ios        # Run on iOS
npm test          # Run tests
npm run lint      # Check code style
npx tsc --noEmit  # Type checking
```

### Common Issues

**Metro bundler error:**

```bash
npx react-native start --reset-cache
```

**Android build error:**

```bash
cd android && ./gradlew clean && cd ..
```

**iOS build error:**

```bash
cd ios && rm -rf Pods && pod install && cd ..
```

## 🚀 Next Steps

1. **Implement Camera**: Integrate react-native-image-picker
2. **Connect Backend**: Wire up API endpoints
3. **Real-time Chat**: Implement Socket.IO connection
4. **Voice Features**: Add audio recording/playback
5. **Push Notifications**: Firebase integration

---

**Made with ❤️ for Indonesian Cultural Heritage**

```sh
bundle exec pod install
```

For more information, please visit [CocoaPods Getting Started guide](https://guides.cocoapods.org/using/getting-started.html).

```sh
# Using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up correctly, you should see your new app running in the Android Emulator, iOS Simulator, or your connected device.

This is one way to run your app — you can also build it directly from Android Studio or Xcode.

## Step 3: Modify your app

Now that you have successfully run the app, let's make changes!

Open `App.tsx` in your text editor of choice and make some changes. When you save, your app will automatically update and reflect these changes — this is powered by [Fast Refresh](https://reactnative.dev/docs/fast-refresh).

When you want to forcefully reload, for example to reset the state of your app, you can perform a full reload:

- **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Dev Menu**, accessed via <kbd>Ctrl</kbd> + <kbd>M</kbd> (Windows/Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (macOS).
- **iOS**: Press <kbd>R</kbd> in iOS Simulator.

## Congratulations! :tada:

You've successfully run and modified your React Native App. :partying_face:

### Now what?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).
- If you're curious to learn more about React Native, check out the [docs](https://reactnative.dev/docs/getting-started).

# Troubleshooting

If you're having issues getting the above steps to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

# Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.
