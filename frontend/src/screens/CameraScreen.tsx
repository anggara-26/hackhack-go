import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import {
  launchImageLibrary,
  launchCamera,
  ImagePickerResponse,
  MediaType,
} from 'react-native-image-picker';
import { useNavigation } from '../hooks/useNavigation';

const CameraScreen: React.FC = () => {
  const navigation = useNavigation();
  const [flashEnabled, setFlashEnabled] = useState(false);

  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        console.log('Requesting camera permission');
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message:
              'ArtifactID needs access to your camera to take photos of artifacts.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  const handleTakePhoto = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      Alert.alert(
        'Permission Required',
        'Camera permission is required to take photos.',
        [{ text: 'OK' }],
      );
      return;
    }

    const options = {
      mediaType: 'photo' as MediaType,
      quality: 0.8 as const,
      maxWidth: 1080,
      maxHeight: 1080,
      includeBase64: false,
      storageOptions: {
        skipBackup: true,
        path: 'images',
      },
    };

    launchCamera(options, (response: ImagePickerResponse) => {
      if (response.didCancel) {
        return;
      }

      if (response.errorMessage) {
        Alert.alert('Error', response.errorMessage);
        return;
      }

      if (response.assets && response.assets[0] && response.assets[0].uri) {
        navigation.navigate('PhotoPreview', {
          photoUri: response.assets[0].uri,
        });
      }
    });
  };

  const handleGalleryPress = async () => {
    const options = {
      mediaType: 'photo' as MediaType,
      quality: 0.8 as const,
      maxWidth: 1080,
      maxHeight: 1080,
      includeBase64: false,
    };

    launchImageLibrary(options, (response: ImagePickerResponse) => {
      if (response.didCancel) {
        return;
      }

      if (response.errorMessage) {
        Alert.alert('Error', response.errorMessage);
        return;
      }

      if (response.assets && response.assets[0] && response.assets[0].uri) {
        navigation.navigate('PhotoPreview', {
          photoUri: response.assets[0].uri,
        });
      }
    });
  };

  const handleFlashToggle = () => {
    setFlashEnabled(!flashEnabled);
    // Note: Flash control would be implemented with a proper camera library like react-native-camera
    Alert.alert('Flash', `Flash ${flashEnabled ? 'disabled' : 'enabled'}`, [
      { text: 'OK' },
    ]);
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
          <Text style={[styles.captureButtonText, { marginTop: -8 }]}>📷</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomControls}>
        <TouchableOpacity
          style={styles.galleryButton}
          onPress={handleGalleryPress}
        >
          <Text style={styles.controlText}>🖼️ Galeri</Text>
        </TouchableOpacity>
        {/* <TouchableOpacity
          style={styles.flashButton}
          onPress={handleFlashToggle}
        >
          <Text style={styles.controlText}>
            {flashEnabled ? '⚡ Flash On' : '⚡ Flash Off'}
          </Text>
        </TouchableOpacity> */}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    marginRight: 15,
  },
  backButtonText: {
    fontSize: 16,
    color: '#0b0b0b',
    fontWeight: '500',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0b0b0b',
  },
  cameraContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#7B7B7D',
    margin: 20,
    borderRadius: 20,
  },
  cameraPlaceholder: {
    fontSize: 80,
    marginBottom: 20,
  },
  instructionText: {
    fontSize: 16,
    color: '#FFF',
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
    backgroundColor: '#7B7B7D',
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
    color: '#0b0b0b',
    textAlign: 'center',
  },
});

export default CameraScreen;
