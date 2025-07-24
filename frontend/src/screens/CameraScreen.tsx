import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '../hooks/useNavigation';

const CameraScreen: React.FC = () => {
  const navigation = useNavigation();

  const handleTakePhoto = () => {
    Alert.alert(
      'Camera Feature',
      'Camera functionality will be implemented with react-native-image-picker. For now, this is a placeholder.',
      [{ text: 'Back to Home', onPress: () => navigation.navigate('Home') }],
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Kembali</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Ambil Foto Artefak</Text>
      </View>

      <View style={styles.cameraContainer}>
        <Text style={styles.cameraPlaceholder}>📸</Text>
        <Text style={styles.instructionText}>
          Arahkan kamera ke artefak yang ingin Anda identifikasi
        </Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.captureButton}
          onPress={handleTakePhoto}
        >
          <Text style={styles.captureButtonText}>📷</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomControls}>
        <TouchableOpacity style={styles.galleryButton}>
          <Text style={styles.controlText}>🖼️ Galeri</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.flashButton}>
          <Text style={styles.controlText}>⚡ Flash</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    marginRight: 15,
  },
  backButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  cameraContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    margin: 20,
    borderRadius: 20,
  },
  cameraPlaceholder: {
    fontSize: 80,
    marginBottom: 20,
  },
  instructionText: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  controls: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  captureButtonText: {
    fontSize: 32,
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingBottom: 40,
    paddingHorizontal: 40,
  },
  galleryButton: {
    padding: 10,
  },
  flashButton: {
    padding: 10,
  },
  controlText: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
  },
});

export default CameraScreen;
