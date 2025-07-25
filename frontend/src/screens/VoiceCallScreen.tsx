import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Animated,
  Dimensions,
  TextInput,
  Modal,
} from 'react-native';
import { useNavigation } from '../hooks/useNavigation';
import { useRoute } from '@react-navigation/native';
import VoiceService, { VoiceCallSession } from '../services/voice';
import { Artifact } from '../types';

const { width, height } = Dimensions.get('window');

const VoiceCallScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { artifact, chatSessionId } = route.params as {
    artifact: Artifact;
    chatSessionId: string;
  };

  const [session, setSession] = useState<VoiceCallSession | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);
  const [textInput, setTextInput] = useState('');

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    initializeVoiceCall();
    return () => {
      VoiceService.cleanup();
    };
  }, []);

  useEffect(() => {
    if (session?.isConnected) {
      startPulseAnimation();
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [session?.isConnected]);

  const initializeVoiceCall = async () => {
    try {
      setIsConnecting(true);
      setError(null);

      const success = await VoiceService.startVoiceCall(
        chatSessionId,
        updatedSession => {
          setSession({ ...updatedSession });
        },
        errorMessage => {
          setError(errorMessage);
          setIsConnecting(false);
        },
      );

      if (!success) {
        setError('Failed to initialize voice call');
      }

      setIsConnecting(false);
    } catch (error) {
      console.error('Error initializing voice call:', error);
      setError('Failed to start voice call');
      setIsConnecting(false);
    }
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  };

  const handleEndCall = async () => {
    Alert.alert(
      'End Voice Call',
      'Are you sure you want to end this voice call?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Call',
          style: 'destructive',
          onPress: async () => {
            try {
              await VoiceService.endVoiceCall();
              navigation.goBack();
            } catch (error) {
              console.error('Error ending call:', error);
              Alert.alert('Error', 'Failed to end call properly');
              navigation.goBack();
            }
          },
        },
      ],
    );
  };

  const handleSendText = () => {
    if (!textInput.trim() || !session?.isConnected) return;

    VoiceService.simulateAudioInput(textInput.trim());
    setTextInput('');
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  if (isConnecting) {
    return (
      <View style={styles.container}>
        <View style={styles.connectingContainer}>
          <Animated.View
            style={[
              styles.connectingCircle,
              {
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            <Text style={styles.connectingEmoji}>📞</Text>
          </Animated.View>
          <Text style={styles.connectingText}>
            Connecting to {artifact.identificationResult.name}...
          </Text>
          <Text style={styles.connectingSubtext}>
            Please wait while we establish the voice connection
          </Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorEmoji}>❌</Text>
          <Text style={styles.errorTitle}>Connection Failed</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={initializeVoiceCall}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!session) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Initializing voice call...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.artifactName}>{session.artifactInfo.name}</Text>
          <Text style={styles.callStatus}>
            {session.isConnected ? '🟢 Connected' : '🔴 Disconnected'}
          </Text>
        </View>
        <TouchableOpacity onPress={() => setShowTranscript(true)}>
          <Text style={styles.transcriptIcon}>📝</Text>
        </TouchableOpacity>
      </View>

      {/* Main Call Interface */}
      <Animated.View style={[styles.callContainer, { opacity: fadeAnim }]}>
        {/* Artifact Avatar */}
        <View style={styles.avatarContainer}>
          <Animated.View
            style={[
              styles.avatar,
              session.isSpeaking && {
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            <Text style={styles.avatarEmoji}>🏺</Text>
          </Animated.View>

          {/* Status Indicators */}
          <View style={styles.statusContainer}>
            {session.isRecording && (
              <View style={styles.recordingIndicator}>
                <Text style={styles.recordingText}>🎤 You're speaking...</Text>
              </View>
            )}
            {session.isSpeaking && (
              <View style={styles.speakingIndicator}>
                <Text style={styles.speakingText}>
                  🔊 {session.artifactInfo.name} is speaking...
                </Text>
              </View>
            )}
            {!session.isRecording &&
              !session.isSpeaking &&
              session.isConnected && (
                <View style={styles.idleIndicator}>
                  <Text style={styles.idleText}>
                    💬 Say something to start chatting!
                  </Text>
                </View>
              )}
          </View>
        </View>

        {/* Call Duration */}
        <Text style={styles.duration}>{formatDuration(session.duration)}</Text>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <Text style={styles.quickActionsTitle}>Quick Questions:</Text>
          <View style={styles.quickActions}>
            {[
              'Cerita tentang sejarahmu dong!',
              'Gimana rasanya hidup di zaman dulu?',
              'Apa yang paling berkesan dari pengalamanmu?',
            ].map((question, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickActionButton}
                onPress={() => VoiceService.simulateAudioInput(question)}
                disabled={!session.isConnected}
              >
                <Text style={styles.quickActionText}>{question}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Text Input Fallback */}
        <View style={styles.textInputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Type a message as fallback..."
            value={textInput}
            onChangeText={setTextInput}
            multiline
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              textInput.trim() && session.isConnected
                ? styles.sendButtonActive
                : {},
            ]}
            onPress={handleSendText}
            disabled={!textInput.trim() || !session.isConnected}
          >
            <Text style={styles.sendButtonText}>📨</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Control Buttons */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={[styles.controlButton, styles.endCallButton]}
          onPress={handleEndCall}
        >
          <Text style={styles.endCallIcon}>📵</Text>
          <Text style={styles.endCallText}>End Call</Text>
        </TouchableOpacity>
      </View>

      {/* Transcript Modal */}
      <Modal
        visible={showTranscript}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.transcriptModal}>
          <View style={styles.transcriptHeader}>
            <Text style={styles.transcriptTitle}>Call Transcript</Text>
            <TouchableOpacity onPress={() => setShowTranscript(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.transcriptContent}>
            <Text style={styles.transcriptText}>
              {session.transcript || 'No transcript available yet...'}
            </Text>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#2a2a2a',
  },
  backIcon: {
    fontSize: 24,
    color: '#fff',
    marginRight: 15,
  },
  headerInfo: {
    flex: 1,
  },
  artifactName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  callStatus: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 2,
  },
  transcriptIcon: {
    fontSize: 24,
  },
  connectingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  connectingCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#7B7B7D',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  connectingEmoji: {
    fontSize: 40,
  },
  connectingText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  connectingSubtext: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorEmoji: {
    fontSize: 60,
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 30,
  },
  retryButton: {
    backgroundColor: '#7B7B7D',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    marginBottom: 15,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    backgroundColor: '#666',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#ccc',
  },
  callContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatar: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#7B7B7D',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarEmoji: {
    fontSize: 60,
  },
  statusContainer: {
    alignItems: 'center',
    minHeight: 30,
  },
  recordingIndicator: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  recordingText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  speakingIndicator: {
    backgroundColor: '#10b981',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  speakingText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  idleIndicator: {
    backgroundColor: '#6b7280',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  idleText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  duration: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 30,
  },
  quickActionsContainer: {
    width: '100%',
    marginBottom: 20,
  },
  quickActionsTitle: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 10,
    textAlign: 'center',
  },
  quickActions: {
    gap: 10,
  },
  quickActionButton: {
    backgroundColor: '#3a3a3a',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    alignSelf: 'center',
  },
  quickActionText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
  },
  textInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#3a3a3a',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 16,
    marginRight: 10,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#666',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonActive: {
    backgroundColor: '#7B7B7D',
  },
  sendButtonText: {
    fontSize: 20,
  },
  controlsContainer: {
    paddingHorizontal: 40,
    paddingBottom: 40,
  },
  controlButton: {
    alignItems: 'center',
    paddingVertical: 15,
  },
  endCallButton: {
    backgroundColor: '#ef4444',
    borderRadius: 30,
  },
  endCallIcon: {
    fontSize: 30,
    marginBottom: 5,
  },
  endCallText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  transcriptModal: {
    flex: 1,
    backgroundColor: '#fff',
  },
  transcriptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  transcriptTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  closeButton: {
    fontSize: 24,
    color: '#6b7280',
  },
  transcriptContent: {
    flex: 1,
    padding: 20,
  },
  transcriptText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#374151',
  },
});

export default VoiceCallScreen;
