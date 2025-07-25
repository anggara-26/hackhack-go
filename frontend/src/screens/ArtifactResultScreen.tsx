import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '../hooks/useNavigation';
import { useRoute } from '@react-navigation/native';
import { Artifact } from '../types';
import { ChatService } from '../services/chat';
import ArtifactService from '../services/artifact';

const ArtifactResultScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { artifact } = route.params as { artifact: Artifact };

  const [isCreatingSession, setIsCreatingSession] = useState(false);

  const handleStartChat = async () => {
    try {
      setIsCreatingSession(true);

      // Start a chat session with the backend
      const result = await ChatService.getChatSessionFromArtifact(artifact._id);
      console.log('Chat session result:', result);
      if (result.success && result.data && result.data._id) {
        navigation.navigate('Chat', {
          sessionId: result.data._id,
          artifact: artifact,
        });
      } else {
        Alert.alert(
          'Error',
          result.error || 'Gagal memulai percakapan. Coba lagi.',
          [{ text: 'OK' }],
        );
      }
    } catch (error) {
      console.error('Error starting chat:', error);
      Alert.alert(
        'Error',
        'Terjadi kesalahan saat memulai percakapan. Periksa koneksi internet Anda.',
        [{ text: 'OK' }],
      );
    } finally {
      setIsCreatingSession(false);
    }
  };
  //   Not used, change logic
  //   const handleStartChat = async () => {
  //     try {
  //       setIsCreatingSession(true);

  //       // Start a chat session with the backend
  //       const result = await ChatService.startChatSession(artifact._id);

  //       if (result.success && result.data) {
  //         navigation.navigate('Chat', {
  //           sessionId: result.data.sessionId,
  //           artifact: artifact,
  //         });
  //       } else {
  //         Alert.alert(
  //           'Error',
  //           result.error || 'Gagal memulai percakapan. Coba lagi.',
  //           [{ text: 'OK' }],
  //         );
  //       }
  //     } catch (error) {
  //       console.error('Error starting chat:', error);
  //       Alert.alert(
  //         'Error',
  //         'Terjadi kesalahan saat memulai percakapan. Periksa koneksi internet Anda.',
  //         [{ text: 'OK' }],
  //       );
  //     } finally {
  //       setIsCreatingSession(false);
  //     }
  //   };

  const handleShare = async () => {
    try {
      // In a real app, you would use react-native-share
      Alert.alert(
        'Bagikan Artefak',
        `Bagikan "${artifact.identificationResult.name}" ke social media atau platform lainnya?`,
        [
          { text: 'Batal', style: 'cancel' },
          {
            text: 'Bagikan',
            onPress: () => {
              // Placeholder for actual share functionality
              Alert.alert('Berhasil', 'Link telah disalin ke clipboard!');
            },
          },
        ],
      );
    } catch (error) {
      console.error('Error sharing:', error);
      Alert.alert('Error', 'Gagal membagikan artefak.');
    }
  };

  const handleAddToFavorites = async () => {
    try {
      // In a real app, you would save to backend or local storage
      Alert.alert(
        'Tambah ke Favorit',
        `"${artifact.identificationResult.name}" telah ditambahkan ke favorit Anda!`,
        [{ text: 'OK' }],
      );
    } catch (error) {
      console.error('Error adding to favorites:', error);
      Alert.alert('Error', 'Gagal menambahkan ke favorit.');
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Artifact Image */}
      <View style={styles.imageContainer}>
        {artifact.imageUrl ? (
          <Image
            source={{ uri: ArtifactService.getImageUrl(artifact.imageUrl) }}
            style={styles.artifactImage}
            onError={error => {
              console.log('Image load error:', error);
            }}
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imagePlaceholderText}>🏺</Text>
          </View>
        )}

        <View style={styles.confidenceContainer}>
          <Text style={styles.confidenceText}>
            {Math.round(artifact.identificationResult.confidence * 100)}% yakin
          </Text>
        </View>
      </View>

      {/* Artifact Info */}
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.artifactName}>
            {artifact.identificationResult.name}
          </Text>
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={handleAddToFavorites}
          >
            <Text style={styles.favoriteIcon}>🤍</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.category}>
          {artifact.identificationResult.category}
        </Text>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Deskripsi</Text>
          <Text style={styles.sectionContent}>
            {artifact.identificationResult.description}
          </Text>
        </View>

        {/* History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sejarah</Text>
          <Text style={styles.sectionContent}>
            {artifact.identificationResult.history}
          </Text>
        </View>

        {/* Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detail</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Periode:</Text>
            <Text style={styles.detailValue}>
              {artifact.identificationResult.estimatedAge}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Bahan:</Text>
            <Text style={styles.detailValue}>
              {artifact.identificationResult.materials}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Makna Budaya:</Text>
            <Text style={styles.detailValue}>
              {artifact.identificationResult.culturalSignificance}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={[
              styles.chatButton,
              isCreatingSession && styles.chatButtonDisabled,
            ]}
            onPress={handleStartChat}
            disabled={isCreatingSession}
          >
            {isCreatingSession ? (
              <View style={styles.buttonContent}>
                <ActivityIndicator
                  size="small"
                  color="#fff"
                  style={styles.buttonLoader}
                />
                <Text style={styles.chatButtonText}>Memulai percakapan...</Text>
              </View>
            ) : (
              <Text style={styles.chatButtonText}>
                💬 Ngobrol Sama Benda Ini!
              </Text>
            )}
          </TouchableOpacity>

          <View style={styles.secondaryActions}>
            <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
              <Text style={styles.shareButtonText}>📤 Bagikan</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleAddToFavorites}
            >
              <Text style={styles.saveButtonText}>💾 Simpan</Text>
            </TouchableOpacity>
          </View>
        </View>
        {/* Not used, change logic */}
        {/* <View style={styles.actionSection}>
          <TouchableOpacity
            style={[
              styles.chatButton,
              isCreatingSession && styles.chatButtonDisabled,
            ]}
            onPress={handleStartChat}
            disabled={isCreatingSession}
          >
            {isCreatingSession ? (
              <View style={styles.buttonContent}>
                <ActivityIndicator
                  size="small"
                  color="#fff"
                  style={styles.buttonLoader}
                />
                <Text style={styles.chatButtonText}>Memulai percakapan...</Text>
              </View>
            ) : (
              <Text style={styles.chatButtonText}>
                💬 Ngobrol Sama Benda Ini!
              </Text>
            )}
          </TouchableOpacity>

          <View style={styles.secondaryActions}>
            <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
              <Text style={styles.shareButtonText}>📤 Bagikan</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleAddToFavorites}
            >
              <Text style={styles.saveButtonText}>💾 Simpan</Text>
            </TouchableOpacity>
          </View>
        </View> */}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  imageContainer: {
    height: 300,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  artifactImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholderText: {
    fontSize: 100,
  },
  confidenceContainer: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(99, 102, 241, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  artifactName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
    marginRight: 10,
  },
  favoriteButton: {
    padding: 5,
  },
  favoriteIcon: {
    fontSize: 24,
  },
  category: {
    fontSize: 16,
    color: '#6366f1',
    fontWeight: '500',
    marginBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  sectionContent: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    width: 100,
  },
  detailValue: {
    fontSize: 14,
    color: '#111827',
    flex: 1,
  },
  actionSection: {
    marginTop: 20,
  },
  chatButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  chatButtonDisabled: {
    backgroundColor: '#9ca3af',
    shadowColor: '#9ca3af',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonLoader: {
    marginRight: 8,
  },
  chatButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  secondaryActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  shareButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  shareButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  saveButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
});

export default ArtifactResultScreen;
