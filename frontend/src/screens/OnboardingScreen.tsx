import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Image,
} from 'react-native';
import StorageService from '../services/storage';
import { OnboardingSlide } from '../types';

const { width, height } = Dimensions.get('window');

interface OnboardingScreenProps {
  route: {
    params: {
      onComplete: () => void;
    };
  };
}

const onboardingData: OnboardingSlide[] = [
  {
    id: '1',
    title: 'Selamat Datang di Museyo',
    description:
      'Jelajahi dunia artefak bersejarah dengan bantuan kecerdasan buatan yang canggih',
    image: (
      <Image
        source={require('../assets/logo-white.png')}
        style={{
          width: 180,
          height: 60,
          marginBottom: 20,
          resizeMode: 'contain',
        }}
      />
    ),
    backgroundColor: '#7B7B7D',
  },
  {
    id: '2',
    title: 'Foto & Identifikasi',
    description:
      'Ambil foto artefak apapun dan dapatkan informasi detail tentang sejarah dan budayanya',
    image: '📸',
    backgroundColor: '#565656',
  },
  {
    id: '3',
    title: 'Chat dengan Artefak',
    description:
      'Berbincang langsung dengan artefak! Tanya tentang sejarah, cerita, dan pengalaman mereka',
    image: '💬',
    backgroundColor: '#7B7B7D',
  },
  {
    id: '4',
    title: 'Riwayat & Koleksi',
    description:
      'Simpan semua penemuan Anda dan akses kembali kapan saja untuk belajar lebih dalam',
    image: '📚',
    backgroundColor: '#565656',
  },
];

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ route }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const { onComplete } = route.params;

  const handleNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
    } else {
      handleGetStarted();
    }
  };

  const handleSkip = () => {
    handleGetStarted();
  };

  const handleGetStarted = async () => {
    await StorageService.setOnboardingCompleted(true);
    await StorageService.setFirstTimeUser(false);
    onComplete();
  };

  const renderSlide = ({ item }: { item: OnboardingSlide }) => (
    <View style={[styles.slide, { backgroundColor: item.backgroundColor }]}>
      <View style={styles.content}>
        <View style={styles.imageContainer}>
          <Text style={styles.emoji}>{item.image}</Text>
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.description}>{item.description}</Text>
        </View>
      </View>
    </View>
  );

  const renderDots = () => (
    <View style={styles.dotsContainer}>
      {onboardingData.map((_, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            index === currentIndex ? styles.activeDot : styles.inactiveDot,
          ]}
        />
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={onboardingData[currentIndex].backgroundColor}
      />

      {/* Skip Button */}
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={styles.skipText}>Lewati</Text>
      </TouchableOpacity>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={onboardingData}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={event => {
          const index = Math.round(event.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
        keyExtractor={item => item.id}
      />

      {/* Bottom Section */}
      <View style={styles.bottomSection}>
        {renderDots()}

        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>
            {currentIndex === onboardingData.length - 1
              ? 'Mulai Sekarang'
              : 'Lanjut'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skipButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  skipText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  slide: {
    width,
    height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  imageContainer: {
    marginBottom: 50,
  },
  emoji: {
    fontSize: 120,
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    color: '#e5e7eb',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  bottomSection: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    marginBottom: 30,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  activeDot: {
    backgroundColor: '#fff',
  },
  inactiveDot: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  nextButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
});

export default OnboardingScreen;
