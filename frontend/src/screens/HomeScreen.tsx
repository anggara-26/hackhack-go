import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  RefreshControl,
  Dimensions,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useNavigation } from '../hooks/useNavigation';
import AuthService from '../services/auth';
import ArtifactService from '../services/artifact';
import StorageService from '../services/storage';
import { User, Artifact } from '../types';

const { width } = Dimensions.get('window');

const HomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const [user, setUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [recentArtifacts, setRecentArtifacts] = useState<Artifact[]>([]);
  const [popularArtifacts, setPopularArtifacts] = useState<Artifact[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadUserData();
    loadArtifacts();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadArtifacts();
    }, []),
  );

  const loadUserData = async () => {
    try {
      const currentUser = await AuthService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadArtifacts = async () => {
    try {
      setLoading(true);

      // Load recent artifacts
      const recentResponse = await ArtifactService.getHistory();
      console.log('Recent artifacts:', recentResponse);
      if (recentResponse.success && recentResponse.data) {
        setRecentArtifacts(
          (recentResponse.data.artifacts as unknown as Artifact[]).slice(0, 5),
        );
      }

      // For now, use recent artifacts as popular (you can implement actual popularity logic)
      setPopularArtifacts(
        (recentResponse.data.artifacts as unknown as Artifact[]).slice(0, 5) ||
          [],
      );
    } catch (error) {
      console.error('Error loading artifacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadUserData();
    await loadArtifacts();
    setRefreshing(false);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      Alert.alert('Info', 'Masukkan kata kunci pencarian');
      return;
    }

    try {
      const response = await ArtifactService.searchArtifacts(searchQuery);
      if (response.success && response.data) {
        // Navigate to search results (you can create a SearchResultsScreen)
        Alert.alert('Pencarian', `Ditemukan ${response.data.length} hasil`);
      } else {
        Alert.alert('Info', 'Tidak ditemukan hasil pencarian');
      }
    } catch (error) {
      Alert.alert('Error', 'Gagal melakukan pencarian');
    }
  };

  const handleTakePhoto = () => {
    navigation.navigate('Camera');
  };

  const handleViewHistory = () => {
    navigation.navigate('History');
  };

  const handleArtifactPress = (artifact: Artifact) => {
    navigation.navigate('ArtifactResult', { artifact });
  };

  const renderArtifactCard = (artifact: Artifact, index: number) => (
    <TouchableOpacity
      key={artifact._id}
      style={styles.artifactCard}
      onPress={() => handleArtifactPress(artifact)}
    >
      <View style={styles.artifactImageContainer}>
        {artifact.imageUrl ? (
          <Image
            source={{ uri: ArtifactService.getImageUrl(artifact.imageUrl) }}
            style={styles.artifactImage}
            onError={() =>
              console.log(
                'Image load error',
                ArtifactService.getImageUrl(artifact.imageUrl),
              )
            }
          />
        ) : (
          <View style={[styles.artifactImage, styles.placeholderImage]}>
            <Text style={styles.placeholderText}>🏺</Text>
          </View>
        )}
      </View>
      <View style={styles.artifactInfo}>
        <Text style={styles.artifactName} numberOfLines={1}>
          {artifact.identificationResult.name}
        </Text>
        <Text style={styles.artifactCategory} numberOfLines={1}>
          {artifact.identificationResult.category}
        </Text>
        <View style={styles.confidenceContainer}>
          <Text style={styles.confidenceText}>
            {Math.round(artifact.identificationResult.confidence * 100)}% yakin
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Logo */}
      <View
        style={{
          width: '100%',
          alignItems: 'flex-start',
          marginTop: 20,
          justifyContent: 'flex-start',
          paddingHorizontal: 20,
        }}
      >
        <Image
          source={require('../assets/logo.png')}
          style={{
            width: 100,
            height: 30,
            resizeMode: 'contain',
          }}
        />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>
            Halo {user ? user.name.split(' ')[0] : 'Explorer'}! 👋
          </Text>
          <Text style={styles.subtitle}>
            Siap jadi penjelajah para benda bersejarah?
          </Text>
        </View>

        {user && (
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <Text style={styles.profileInitial}>
              {user.name.charAt(0).toUpperCase()}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Cari artefak manual..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            readOnly={true}
          />
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            <Text style={styles.searchButtonText}>🔍</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.primaryAction}
          onPress={handleTakePhoto}
        >
          <Text style={styles.actionIcon}>📸</Text>
          <Text style={styles.primaryActionText}>Ambil Foto</Text>
          <Text style={styles.actionSubtext}>
            Identifikasi artefak dengan AI
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryAction}
          onPress={handleViewHistory}
        >
          <Text style={styles.actionIcon}>📚</Text>
          <Text style={styles.secondaryActionText}>Riwayat Interaksi</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Discoveries */}
      {recentArtifacts.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Penemuan Terbaru</Text>
            <TouchableOpacity onPress={handleViewHistory}>
              <Text style={styles.seeAllText}>Lihat Semua</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScroll}
          >
            {recentArtifacts.map((artifact, index) =>
              renderArtifactCard(artifact, index),
            )}
          </ScrollView>
        </View>
      )}

      {/* Popular Artifacts */}
      {/* {popularArtifacts.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Artefak Populer</Text>
          </View>

          <View style={styles.popularGrid}>
            {popularArtifacts.map((artifact, index) => (
              <TouchableOpacity
                key={artifact._id}
                style={styles.popularCard}
                onPress={() => handleArtifactPress(artifact)}
              >
                {artifact.imageUrl ? (
                  <Image
                    source={{
                      uri: ArtifactService.getImageUrl(artifact.imageUrl),
                    }}
                    style={styles.popularImage}
                  />
                ) : (
                  <View
                    style={[styles.popularImage, styles.popularPlaceholder]}
                  >
                    <Text style={styles.popularPlaceholderText}>🏺</Text>
                  </View>
                )}
                <View style={styles.popularOverlay}>
                  <Text style={styles.popularName} numberOfLines={2}>
                    {artifact.identificationResult.name}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )} */}

      {/* Empty State */}
      {recentArtifacts.length === 0 && !loading && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateIcon}>🏛️</Text>
          <Text style={styles.emptyStateTitle}>Mulai Petualangan Anda</Text>
          <Text style={styles.emptyStateText}>
            Ambil foto artefak pertama Anda dan mulai menjelajahi sejarah dengan
            AI!
          </Text>
          <TouchableOpacity
            style={styles.emptyStateButton}
            onPress={handleTakePhoto}
          >
            <Text style={styles.emptyStateButtonText}>Ambil Foto Pertama</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Bottom Spacing */}
      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  welcomeSection: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  profileButton: {
    width: 40,
    height: 40,
    backgroundColor: '#7B7B7D',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitial: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  searchContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  searchButton: {
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: {
    fontSize: 20,
  },
  quickActions: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  primaryAction: {
    backgroundColor: '#7B7B7D',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#7B7B7D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  primaryActionText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  actionSubtext: {
    fontSize: 14,
    color: '#F0F0F0',
    textAlign: 'center',
  },
  secondaryAction: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  secondaryActionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginLeft: 12,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  seeAllText: {
    fontSize: 14,
    color: '#7B7B7D',
    fontWeight: '500',
  },
  horizontalScroll: {
    paddingLeft: 20,
    paddingVertical: 10,
  },
  artifactCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginRight: 16,
    width: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  artifactImageContainer: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
  },
  artifactImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#f3f4f6',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e5e7eb',
  },
  placeholderText: {
    fontSize: 32,
    color: '#9ca3af',
  },
  artifactInfo: {
    padding: 12,
  },
  artifactName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  artifactCategory: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
  },
  confidenceContainer: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  confidenceText: {
    fontSize: 10,
    color: '#1d4ed8',
    fontWeight: '500',
  },
  popularGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  popularCard: {
    width: (width - 52) / 2,
    height: 140,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  popularImage: {
    width: '100%',
    height: '100%',
  },
  popularPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e5e7eb',
  },
  popularPlaceholderText: {
    fontSize: 40,
    color: '#9ca3af',
  },
  popularOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 12,
  },
  popularName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyStateIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  emptyStateButton: {
    backgroundColor: '#7B7B7D',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  emptyStateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  bottomSpacing: {
    height: 20,
  },
});

export default HomeScreen;
