import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '../hooks/useNavigation';
import { useRoute } from '@react-navigation/native';
import ArtifactService from '../services/artifact';

const PhotoPreviewScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { photoUri } = route.params as { photoUri: string };
  const [isProcessing, setIsProcessing] = useState(false);

  const handleRetake = () => {
    navigation.goBack();
  };

  const handleConfirm = async () => {
    try {
      setIsProcessing(true);

      // Upload and identify the artifact
      const result = await ArtifactService.uploadAndIdentify(photoUri);

      if (result.success && result.data) {
        navigation.navigate('ArtifactResult', {
          artifact: result.data.artifact,
        });
      } else {
        Alert.alert(
          'Identifikasi Gagal',
          result.error ||
            'Tidak dapat mengidentifikasi artefak. Coba lagi dengan foto yang lebih jelas.',
          [{ text: 'OK' }],
        );
      }
    } catch (error) {
      console.error('Identification error:', error);
      Alert.alert(
        'Error',
        'Terjadi kesalahan saat mengidentifikasi artefak. Periksa koneksi internet Anda.',
        [{ text: 'OK' }],
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.closeButton}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Preview Foto</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.imageContainer}>
        <Image source={{ uri: photoUri }} style={styles.previewImage} />
        <Text style={styles.previewText}>
          Pastikan artefak terlihat jelas dalam foto
        </Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.retakeButton, isProcessing && styles.disabledButton]}
          onPress={handleRetake}
          disabled={isProcessing}
        >
          <Text style={styles.retakeButtonText}>Ambil Ulang</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.confirmButton, isProcessing && styles.disabledButton]}
          onPress={handleConfirm}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.confirmButtonText}>Identifikasi</Text>
          )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  closeButton: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  placeholder: {
    width: 20,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '80%',
    resizeMode: 'contain',
  },
  imagePlaceholder: {
    fontSize: 80,
    marginBottom: 20,
  },
  previewText: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
    paddingVertical: 40,
  },
  retakeButton: {
    backgroundColor: '#374151',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  retakeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  confirmButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  disabledButton: {
    opacity: 0.6,
  },
});

export default PhotoPreviewScreen;
