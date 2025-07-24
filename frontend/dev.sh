#!/bin/bash

# ArtifactID React Native Development Helper Script
echo "🚀 ArtifactID React Native Development Helper"
echo "============================================="

# Function to check Metro status
check_metro() {
    if lsof -Pi :8081 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "✅ Metro bundler is running on port 8081"
        return 0
    else
        echo "❌ Metro bundler is not running"
        return 1
    fi
}

# Function to start Metro
start_metro() {
    echo "📦 Starting Metro bundler..."
    npm start --reset-cache &
    echo "Metro started in background. Check terminal for status."
}

# Function to run Android
run_android() {
    echo "🤖 Running on Android..."
    if check_metro; then
        npm run android
    else
        echo "Starting Metro first..."
        start_metro
        sleep 5
        npm run android
    fi
}

# Function to run iOS
run_ios() {
    echo "📱 Running on iOS..."
    if check_metro; then
        npm run ios
    else
        echo "Starting Metro first..."
        start_metro
        sleep 5
        npm run ios
    fi
}

# Function to run type check
type_check() {
    echo "🔍 Running TypeScript type check..."
    npx tsc --noEmit
}

# Function to clean project
clean_project() {
    echo "🧹 Cleaning project..."
    npm run clean || echo "Clean script not found, running manual cleanup..."
    rm -rf node_modules
    npm install
    npx react-native start --reset-cache &
}

# Main menu
case "$1" in
    "metro")
        start_metro
        ;;
    "android")
        run_android
        ;;
    "ios")  
        run_ios
        ;;
    "check")
        type_check
        ;;
    "clean")
        clean_project
        ;;
    "status")
        check_metro
        ;;
    *)
        echo "Usage: $0 {metro|android|ios|check|clean|status}"
        echo ""
        echo "Commands:"
        echo "  metro   - Start Metro bundler"
        echo "  android - Run on Android device/emulator"
        echo "  ios     - Run on iOS device/simulator"
        echo "  check   - Run TypeScript type checking"
        echo "  clean   - Clean and reinstall dependencies"
        echo "  status  - Check Metro bundler status"
        echo ""
        echo "Examples:"
        echo "  ./dev.sh metro     # Start Metro bundler"
        echo "  ./dev.sh android   # Run on Android"
        echo "  ./dev.sh check     # Type check"
        ;;
esac
