import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { observer } from 'mobx-react-lite';
import { useNavigation } from '../hooks/useNavigation';
import ArtifactService from '../services/artifact';
import { HistoryItem } from '../types';

const HistoryScreen: React.FC = observer(() => {
  const navigation = useNavigation();
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    try {
      setError(null);
      const enhancedHistory = await ArtifactService.getEnhancedHistory();
      setHistoryItems(enhancedHistory);
    } catch (error) {
      console.error('Error loading history:', error);
      setError('Failed to load history. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadHistory();
    setIsRefreshing(false);
  }, [loadHistory]);

  const toggleFavorite = async (artifactId: string) => {
    try {
      const newFavoriteStatus = await ArtifactService.toggleFavorite(
        artifactId,
      );

      // Update local state
      setHistoryItems(prevItems =>
        prevItems.map(item =>
          item.id === artifactId
            ? { ...item, isFavorite: newFavoriteStatus }
            : item,
        ),
      );
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Error', 'Failed to update favorite status');
    }
  };

  const viewArtifact = async (item: HistoryItem) => {
    try {
      // Increment visit count
      await ArtifactService.incrementVisitCount(item.id);

      // Navigate to artifact result screen
      navigation.navigate('ArtifactResult', {
        artifact: item.artifact,
      });
    } catch (error) {
      console.error('Error viewing artifact:', error);
      Alert.alert('Error', 'Failed to open artifact details');
    }
  };

  const clearHistory = () => {
    Alert.alert(
      'Clear History',
      'Are you sure you want to clear all local data (favorites and visit counts)?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await ArtifactService.clearLocalData();
              await loadHistory();
              Alert.alert('Success', 'Local data cleared successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear local data');
            }
          },
        },
      ],
    );
  };

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const renderHistoryItem = (item: HistoryItem) => (
    <TouchableOpacity
      key={item.id}
      style={styles.historyItem}
      onPress={() => viewArtifact(item)}
    >
      <View style={styles.itemImageContainer}>
        <Image
          source={{ uri: ArtifactService.getImageUrl(item.artifact.imageUrl) }}
          style={styles.itemImage}
          resizeMode="cover"
        />
        {/* {item.isFavorite && (
          <View style={styles.favoriteIndicator}>
            <Text style={styles.favoriteIcon}>❤️</Text>
          </View>
        )} */}
      </View>

      <View style={styles.itemContent}>
        <Text style={styles.itemTitle} numberOfLines={2}>
          {item.artifact.identificationResult.name}
        </Text>
        <Text style={styles.itemCategory}>
          {item.artifact.identificationResult.category}
        </Text>
        <Text style={styles.itemDescription} numberOfLines={2}>
          {item.artifact.identificationResult.description}
        </Text>

        <View style={styles.itemMeta}>
          <Text style={styles.itemDate}>
            {new Date(item.lastVisited).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </Text>
          {/* {item.visitCount > 1 && (
            <Text style={styles.visitCount}>
              Viewed {item.visitCount} times
            </Text>
          )} */}
        </View>
      </View>

      {/* <TouchableOpacity
        style={styles.favoriteButton}
        onPress={() => toggleFavorite(item.id)}
      >
        <Text style={styles.favoriteButtonText}>
          {item.isFavorite ? '❤️' : '🤍'}
        </Text>
      </TouchableOpacity> */}
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Riwayat Penemuan</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading history...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Riwayat Penemuan</Text>
        {/* {historyItems.length > 0 && (
          <TouchableOpacity style={styles.clearButton} onPress={clearHistory}>
            <Text style={styles.clearButtonText}>Clear Local</Text>
          </TouchableOpacity>
        )} */}
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadHistory}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {historyItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>📚</Text>
            <Text style={styles.emptyStateTitle}>Belum Ada Riwayat</Text>
            <Text style={styles.emptyStateText}>
              Mulai ambil foto artefak untuk melihat riwayat penemuan Anda di
              sini
            </Text>
            <TouchableOpacity
              style={styles.exploreButton}
              onPress={() => navigation.navigate('Camera')}
            >
              <Text style={styles.exploreButtonText}>Mulai Eksplorasi</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.historyList}>
            <View style={styles.statsContainer}>
              <Text style={styles.statsText}>
                {historyItems.length} artifact
                {historyItems.length !== 1 ? 's' : ''} discovered
              </Text>
              {/* <Text style={styles.statsText}>
                {historyItems.filter(item => item.isFavorite).length} favorite
                {historyItems.filter(item => item.isFavorite).length !== 1
                  ? 's'
                  : ''}
              </Text> */}
            </View>

            {historyItems.map(renderHistoryItem)}
          </View>
        )}
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#ef4444',
    borderRadius: 6,
  },
  clearButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 16,
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: {
    fontSize: 14,
    color: '#dc2626',
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 100,
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
  exploreButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  exploreButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  historyList: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  statsText: {
    fontSize: 14,
    color: '#6b7280',
  },
  historyItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  itemImageContainer: {
    position: 'relative',
    marginRight: 16,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  favoriteIndicator: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteIcon: {
    fontSize: 12,
  },
  itemContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  itemCategory: {
    fontSize: 12,
    color: '#6366f1',
    fontWeight: '600',
    textTransform: 'capitalize',
    marginBottom: 6,
  },
  itemDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 8,
  },
  itemMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  visitCount: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '500',
  },
  favoriteButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteButtonText: {
    fontSize: 20,
  },
});

export default HistoryScreen;
