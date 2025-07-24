import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { useNavigation } from '../hooks/useNavigation';
import { useRoute } from '@react-navigation/native';
import { Artifact } from '../types';

const ArtifactResultScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  // const { artifact } = route.params as { artifact: Artifact };

  // Placeholder data
  const mockArtifact: Artifact = {
    _id: '1',
    imageUrl: 'placeholder.jpg',
    originalFilename: 'artifact.jpg',
    identificationResult: {
      name: 'Keris Majapahit',
      category: 'Senjata Tradisional',
      description:
        'Keris tradisional dari era Majapahit dengan motif yang indah dan makna spiritual yang mendalam.',
      history:
        'Digunakan oleh ksatria Majapahit pada abad ke-14 untuk upacara dan perlindungan diri.',
      confidence: 0.89,
      isRecognized: true,
      culturalSignificance:
        'Simbol kekuatan dan spiritualitas dalam budaya Jawa',
      estimatedAge: 'Abad 14-15',
      materials: 'Besi, baja, dan ukiran emas',
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const handleStartChat = () => {
    navigation.navigate('Chat', {
      sessionId: 'mock_session',
      artifact: mockArtifact,
    });
  };

  const handleShare = () => {
    Alert.alert(
      'Share Feature',
      'Share functionality will be implemented with react-native-share',
      [{ text: 'OK' }],
    );
  };

  const handleAddToFavorites = () => {
    Alert.alert(
      'Favorites',
      'Artifact added to favorites! (This is a placeholder)',
      [{ text: 'OK' }],
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Artifact Image */}
      <View style={styles.imageContainer}>
        <View style={styles.imagePlaceholder}>
          <Text style={styles.imagePlaceholderText}>🏺</Text>
        </View>

        <View style={styles.confidenceContainer}>
          <Text style={styles.confidenceText}>
            {Math.round(mockArtifact.identificationResult.confidence * 100)}%
            yakin
          </Text>
        </View>
      </View>

      {/* Artifact Info */}
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.artifactName}>
            {mockArtifact.identificationResult.name}
          </Text>
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={handleAddToFavorites}
          >
            <Text style={styles.favoriteIcon}>🤍</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.category}>
          {mockArtifact.identificationResult.category}
        </Text>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Deskripsi</Text>
          <Text style={styles.sectionContent}>
            {mockArtifact.identificationResult.description}
          </Text>
        </View>

        {/* History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sejarah</Text>
          <Text style={styles.sectionContent}>
            {mockArtifact.identificationResult.history}
          </Text>
        </View>

        {/* Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detail</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Periode:</Text>
            <Text style={styles.detailValue}>
              {mockArtifact.identificationResult.estimatedAge}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Bahan:</Text>
            <Text style={styles.detailValue}>
              {mockArtifact.identificationResult.materials}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Makna Budaya:</Text>
            <Text style={styles.detailValue}>
              {mockArtifact.identificationResult.culturalSignificance}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <TouchableOpacity style={styles.chatButton} onPress={handleStartChat}>
            <Text style={styles.chatButtonText}>
              💬 Ngobrol Sama Benda Ini!
            </Text>
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
