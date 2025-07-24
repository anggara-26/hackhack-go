import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '../hooks/useNavigation';
import { useRoute } from '@react-navigation/native';

const PhotoPreviewScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  // const { photoUri } = route.params as { photoUri: string };

  const handleRetake = () => {
    navigation.goBack();
  };

  const handleConfirm = () => {
    Alert.alert(
      'Photo Processing',
      'Photo would be sent to AI for identification. This is a placeholder.',
      [{ text: 'OK', onPress: () => navigation.navigate('Home') }],
    );
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
        <Text style={styles.imagePlaceholder}>🖼️</Text>
        <Text style={styles.previewText}>
          Preview foto akan ditampilkan di sini
        </Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.retakeButton} onPress={handleRetake}>
          <Text style={styles.retakeButtonText}>Ambil Ulang</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
          <Text style={styles.confirmButtonText}>Identifikasi</Text>
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
    paddingTop: 50,
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
});

export default PhotoPreviewScreen;
