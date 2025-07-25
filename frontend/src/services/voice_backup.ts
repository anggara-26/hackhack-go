import ApiService from './api';
import AuthService from './auth';
import { ApiResponse } from '../types';

// WebRTC polyfill for React Native
declare global {
  var RTCPeerConnection: any;
  var RTCDataChannel: any;
  var MediaStream: any;
  var MediaRecorder: any;
  var AudioContext: any;
  var webkitAudioContext: any;
  var SpeechRecognition: any;
  var webkitSpeechRecognition: any;
  var navigator: any;
  var Audio: any;
  var window: any;
}

// WebRTC Configuration
const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

const PEER_CONNECTION_CONFIG = {
  iceServers: ICE_SERVERS,
  iceCandidatePoolSize: 10,
};

export interface VoiceCallData {
  ephemeralKey: string;
  artifactInfo: {
    name: string;
    category: string;
    description: string;
  };
  interactionId: string;
}

export interface VoiceCallHistory {
  _id: string;
  artifactId: {
    _id: string;
    identificationResult: {
      name: string;
      category: string;
    };
    imageUrl: string;
  };
  chatSessionId: {
    _id: string;
    title: string;
    rating?: number;
  };
  duration: number;
  hasTranscript: boolean;
  transcriptPreview: string;
  createdAt: string;
}

export interface VoiceCallSession {
  isConnected: boolean;
  isRecording: boolean;
  isSpeaking: boolean;
  transcript: string;
  duration: number;
  artifactInfo: VoiceCallData['artifactInfo'];
  interactionId: string;
}

export class VoiceService {
  private static ws: WebSocket | null = null;
  private static session: VoiceCallSession | null = null;
  private static startTime: number = 0;
  private static transcriptBuffer: string[] = [];

  // Initialize voice call session
  static async initializeVoiceCall(
    chatSessionId: string,
  ): Promise<ApiResponse<VoiceCallData>> {
    const isAuthenticated = await AuthService.isAuthenticated();
    const payload: any = {};

    if (isAuthenticated) {
      const user = await AuthService.getCurrentUser();
      if (user) {
        payload.userId = user.id;
      }
    } else {
      const sessionId = await AuthService.getOrCreateSessionId();
      payload.sessionId = sessionId;
    }

    return ApiService.post<ApiResponse<VoiceCallData>>(
      `/voice/${chatSessionId}/start`,
      payload,
    );
  }

  // End voice call and save transcript
  static async endVoiceCall(): Promise<ApiResponse<any>> {
    if (!this.session) {
      throw new Error('No active voice call session');
    }

    const transcript = this.transcriptBuffer.join(' ');
    const duration = Date.now() - this.startTime;

    const result = await ApiService.post<ApiResponse<any>>(
      `/voice/end/${this.session.interactionId}`,
      {
        transcript,
        duration: Math.floor(duration / 1000), // Convert to seconds
      },
    );

    // Clean up session
    this.cleanup();

    return result;
  }

  // Get voice call history
  static async getVoiceCallHistory(): Promise<
    ApiResponse<{
      voiceCalls: VoiceCallHistory[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>
  > {
    const isAuthenticated = await AuthService.isAuthenticated();

    if (isAuthenticated) {
      return ApiService.get('/voice/history');
    } else {
      const sessionId = await AuthService.getOrCreateSessionId();
      return ApiService.get(`/voice/history?sessionId=${sessionId}`);
    }
  }

  // Start voice call session
  static async startVoiceCall(
    chatSessionId: string,
    onSessionUpdate: (session: VoiceCallSession) => void,
    onError: (error: string) => void,
  ): Promise<boolean> {
    try {
      // Initialize voice call on backend
      const response = await this.initializeVoiceCall(chatSessionId);
      if (!response.success || !response.data) {
        onError('Failed to initialize voice call');
        return false;
      }

      // Initialize session state
      this.session = {
        isConnected: false,
        isRecording: false,
        isSpeaking: false,
        transcript: '',
        duration: 0,
        artifactInfo: response.data.artifactInfo,
        interactionId: response.data.interactionId,
      };

      this.startTime = Date.now();
      this.transcriptBuffer = [];

      // Connect to OpenAI Realtime API using ephemeral token
      await this.connectToRealtimeAPI(
        response.data.ephemeralKey,
        data => this.handleWebSocketMessage(data, onSessionUpdate),
        error => {
          console.error('WebSocket error:', error);
          onError('Voice connection failed');
        },
        () => {
          if (this.session) {
            this.session.isConnected = true;
            onSessionUpdate(this.session);
          }
        },
        () => {
          if (this.session) {
            this.session.isConnected = false;
            onSessionUpdate(this.session);
          }
        },
      );

      return true;
    } catch (error) {
      console.error('Error starting voice call:', error);
      onError('Failed to start voice call');
      return false;
    }
  }

  // Connect to OpenAI Realtime API using WebSocket with ephemeral token
  private static async connectToRealtimeAPI(
    ephemeralKey: string,
    onMessage: (data: any) => void,
    onError: (error: any) => void,
    onOpen: () => void,
    onClose: () => void,
  ): Promise<void> {
    try {
      console.log('🔗 Connecting to OpenAI Realtime API...');
      
      const wsUrl = 'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01';

      this.ws = new WebSocket(wsUrl, [], {
        headers: {
          'Authorization': `Bearer ${ephemeralKey}`,
          'OpenAI-Beta': 'realtime=v1',
        },
      });

      this.ws.onopen = () => {
        console.log('✅ Connected to OpenAI Realtime API');

        // Send session configuration
        this.sendWebSocketMessage({
          type: 'session.update',
          session: {
            modalities: ['text', 'audio'],
            instructions: `You are ${this.session?.artifactInfo.name}, speaking in Indonesian with a warm, friendly tone. You are a ${this.session?.artifactInfo.category} with this description: ${this.session?.artifactInfo.description}. Speak as if you are this artifact coming to life.`,
            voice: 'alloy',
            input_audio_format: 'pcm16',
            output_audio_format: 'pcm16',
            input_audio_transcription: {
              model: 'whisper-1',
            },
          },
        });

        onOpen();
      };

      this.ws.onmessage = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 Received from OpenAI:', data.type);
          onMessage(data);
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error);
        }
      };

      this.ws.onerror = (error: Event) => {
        console.error('❌ WebSocket error:', error);
        onError(error);
      };

      this.ws.onclose = (event: CloseEvent) => {
        console.log('🔌 WebSocket closed:', event.code, event.reason);
        onClose();
      };

    } catch (error) {
      console.error('❌ Error connecting to Realtime API:', error);
      onError(error);
    }
  }

  // Initialize WebRTC peer connection
  private static async initializePeerConnection(
    onMessage: (data: any) => void,
    onError: (error: any) => void,
    onOpen: () => void,
    onClose: () => void,
  ): Promise<void> {
    try {
      // Create RTCPeerConnection
      this.peerConnection = new (window.RTCPeerConnection ||
        (window as any).webkitRTCPeerConnection)(PEER_CONNECTION_CONFIG);

      // Create data channel for text communication
      this.dataChannel = this.peerConnection.createDataChannel(
        'voice-transcript',
        {
          ordered: true,
        },
      );

      // Data channel event handlers
      this.dataChannel.onopen = () => {
        console.log('✅ Data channel opened');
        onOpen();
      };

      this.dataChannel.onmessage = (event: any) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 Received via data channel:', data.type);
          onMessage(data);
        } catch (error) {
          console.error('❌ Error parsing data channel message:', error);
        }
      };

      this.dataChannel.onclose = () => {
        console.log('🔌 Data channel closed');
        onClose();
      };

      this.dataChannel.onerror = (error: any) => {
        console.error('❌ Data channel error:', error);
        onError(error);
      };

      // Peer connection event handlers
      this.peerConnection.onicecandidate = (event: any) => {
        if (event.candidate) {
          console.log('🧊 ICE candidate generated');
          // In a real implementation, send this to the signaling server
        }
      };

      this.peerConnection.ontrack = (event: any) => {
        console.log('🎵 Remote audio track received');
        this.remoteStream = event.streams[0];
        this.handleRemoteAudio(event.streams[0]);
      };

      this.peerConnection.onconnectionstatechange = () => {
        console.log(
          '🔗 Connection state:',
          this.peerConnection.connectionState,
        );
        if (this.peerConnection.connectionState === 'connected') {
          onOpen();
        } else if (
          this.peerConnection.connectionState === 'disconnected' ||
          this.peerConnection.connectionState === 'failed'
        ) {
          onClose();
        }
      };
    } catch (error) {
      console.error('❌ Error initializing peer connection:', error);
      throw error;
    }
  }

  // Get user media (microphone access)
  private static async getUserMedia(): Promise<void> {
    try {
      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
        },
        video: false,
      };

      // Get user media (fallback for React Native)
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        this.localStream = await navigator.mediaDevices.getUserMedia(
          constraints,
        );
      } else {
        // Fallback for older browsers/React Native
        const getUserMedia =
          (navigator as any).getUserMedia ||
          (navigator as any).webkitGetUserMedia ||
          (navigator as any).mozGetUserMedia;

        if (getUserMedia) {
          this.localStream = await new Promise((resolve, reject) => {
            getUserMedia.call(navigator, constraints, resolve, reject);
          });
        } else {
          throw new Error('getUserMedia not supported');
        }
      }

      // Add local stream to peer connection
      if (this.peerConnection && this.localStream) {
        this.localStream.getTracks().forEach((track: any) => {
          this.peerConnection.addTrack(track, this.localStream);
        });
        console.log('✅ Local audio stream added to peer connection');
      }
    } catch (error) {
      console.error('❌ Error accessing microphone:', error);
      // For demo purposes, continue without microphone
      console.log('📱 Continuing in text-only mode...');
    }
  }

  // Setup speech recognition
  private static setupSpeechRecognition(onMessage: (data: any) => void): void {
    try {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      if (SpeechRecognition) {
        this.speechRecognition = new SpeechRecognition();
        this.speechRecognition.continuous = true;
        this.speechRecognition.interimResults = true;
        this.speechRecognition.lang = 'id-ID'; // Indonesian

        this.speechRecognition.onstart = () => {
          console.log('🎤 Speech recognition started');
          onMessage({
            type: 'input_audio_buffer.speech_started',
          });
        };

        this.speechRecognition.onresult = (event: any) => {
          let transcript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }

          if (event.results[event.results.length - 1].isFinal) {
            console.log('�️ Speech recognized:', transcript);
            onMessage({
              type: 'conversation.item.input_audio_transcription.completed',
              transcript: transcript,
            });
          }
        };

        this.speechRecognition.onend = () => {
          console.log('🎤 Speech recognition ended');
          onMessage({
            type: 'input_audio_buffer.speech_stopped',
          });
        };

        this.speechRecognition.onerror = (error: any) => {
          console.error('❌ Speech recognition error:', error);
        };

        // Start speech recognition
        this.speechRecognition.start();
      } else {
        console.log(
          '📱 Speech recognition not available, using text input fallback',
        );
      }
    } catch (error) {
      console.error('❌ Error setting up speech recognition:', error);
    }
  }

  // Create WebRTC offer and handle signaling
  private static async createOffer(ephemeralKey: string): Promise<void> {
    try {
      if (!this.peerConnection) {
        throw new Error('Peer connection not initialized');
      }

      // Create offer
      const offer = await this.peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: false,
      });

      // Set local description
      await this.peerConnection.setLocalDescription(offer);

      // Send offer to signaling server
      const chatSessionId = this.session?.interactionId;
      if (chatSessionId) {
        const response = await ApiService.post<any>(
          `/voice/${chatSessionId}/webrtc/offer`,
          {
            offer: offer,
            ephemeralKey: ephemeralKey,
          },
        );

        if (response.success && response.data) {
          // Handle answer from server
          await this.handleWebRTCAnswer(response.data.answer);
          console.log('✅ WebRTC signaling completed');
        }
      }
    } catch (error) {
      console.error('❌ Error in WebRTC signaling:', error);
      // Fallback to simulated connection
      setTimeout(() => {
        this.simulateWebRTCAnswer();
      }, 1000);
    }
  }

  // Handle WebRTC answer from server
  private static async handleWebRTCAnswer(answer: any): Promise<void> {
    try {
      if (this.peerConnection && answer) {
        await this.peerConnection.setRemoteDescription(answer);
        console.log('✅ WebRTC answer processed');

        // Start AI responses
        this.startSimulatedAIResponses();
      }
    } catch (error) {
      console.error('❌ Error processing WebRTC answer:', error);
      // Fallback to simulation
      this.simulateWebRTCAnswer();
    }
  }

  // Check connection status
  private static async checkConnectionStatus(
    chatSessionId: string,
  ): Promise<any> {
    try {
      const response = await ApiService.get<any>(
        `/voice/${chatSessionId}/status`,
      );
      if (response.success) {
        return response.data;
      }
    } catch (error) {
      console.error('❌ Error checking connection status:', error);
    }
    return null;
  }

  // Simulate WebRTC answer (in real implementation, this comes from server)
  private static async simulateWebRTCAnswer(): Promise<void> {
    try {
      // Create a mock answer
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setRemoteDescription(answer);

      console.log('✅ WebRTC connection established (simulated)');

      // Start simulated AI responses
      this.startSimulatedAIResponses();
    } catch (error) {
      console.error('❌ Error processing WebRTC answer:', error);
    }
  }

  // Handle remote audio stream
  private static handleRemoteAudio(stream: any): void {
    try {
      // Create audio element to play remote stream
      const audio = new Audio();
      audio.srcObject = stream;
      audio.autoplay = true;
      console.log('🔊 Playing remote audio stream');
    } catch (error) {
      console.error('❌ Error handling remote audio:', error);
    }
  }

  // Start simulated AI responses for demo
  private static startSimulatedAIResponses(): void {
    // Simulate AI speaking after user input
    setInterval(() => {
      if (this.session?.isConnected && Math.random() > 0.7) {
        this.simulateAIResponse();
      }
    }, 5000);
  }

  // Simulate AI response
  private static simulateAIResponse(): void {
    const responses = [
      'Halo! Senang berbicara dengan Anda.',
      'Saya adalah artefak bersejarah yang sangat menarik.',
      'Apakah ada yang ingin Anda ketahui tentang sejarah saya?',
      'Ceritakan lebih lanjut tentang minat Anda terhadap sejarah.',
    ];

    const response = responses[Math.floor(Math.random() * responses.length)];

    // Add to transcript
    this.transcriptBuffer.push(`AI: ${response}`);
    if (this.session) {
      this.session.transcript = this.transcriptBuffer.join('\n');
    }

    // Send via data channel
    this.sendDataChannelMessage({
      type: 'response.audio_transcript.delta',
      delta: response,
    });

    // Simulate speaking state
    if (this.session) {
      this.session.isSpeaking = true;
      setTimeout(() => {
        if (this.session) {
          this.session.isSpeaking = false;
        }
      }, 2000);
    }
  }

  // Handle WebSocket messages
  private static handleWebSocketMessage(
    data: any,
    onSessionUpdate: (session: VoiceCallSession) => void,
  ): void {
    if (!this.session) return;

    switch (data.type) {
      case 'conversation.item.input_audio_transcription.completed':
        // User speech transcription
        if (data.transcript) {
          this.transcriptBuffer.push(`User: ${data.transcript}`);
          this.session.transcript = this.transcriptBuffer.join('\n');
        }
        break;

      case 'response.audio_transcript.delta':
        // AI response transcription (streaming)
        if (data.delta) {
          // Update the last AI response or add new one
          const lastEntry =
            this.transcriptBuffer[this.transcriptBuffer.length - 1];
          if (lastEntry && lastEntry.startsWith('AI: ')) {
            this.transcriptBuffer[this.transcriptBuffer.length - 1] +=
              data.delta;
          } else {
            this.transcriptBuffer.push(`AI: ${data.delta}`);
          }
          this.session.transcript = this.transcriptBuffer.join('\n');
        }
        break;

      case 'response.audio.delta':
        // AI is speaking audio
        this.session.isSpeaking = true;
        break;

      case 'response.audio.done':
        // AI finished speaking
        this.session.isSpeaking = false;
        break;

      case 'input_audio_buffer.speech_started':
        // User started speaking
        this.session.isRecording = true;
        break;

      case 'input_audio_buffer.speech_stopped':
        // User stopped speaking
        this.session.isRecording = false;
        break;

      case 'error':
        console.error('OpenAI Realtime API error:', data.error);
        break;
    }

    // Update duration
    this.session.duration = Math.floor((Date.now() - this.startTime) / 1000);

    onSessionUpdate(this.session);
  }

  // Send message via WebRTC data channel
  private static sendDataChannelMessage(message: any): void {
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      this.dataChannel.send(JSON.stringify(message));
      console.log('📤 Sent via data channel:', message.type);
    } else {
      console.error('❌ Data channel not connected');
    }
  }

  // Send text message via data channel
  static sendTextMessage(text: string): void {
    if (!this.session?.isConnected) return;

    // Add to transcript
    this.transcriptBuffer.push(`User: ${text}`);
    if (this.session) {
      this.session.transcript = this.transcriptBuffer.join('\n');
    }

    // Send via data channel
    this.sendDataChannelMessage({
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: text,
          },
        ],
      },
    });

    // Trigger AI response
    setTimeout(() => {
      this.simulateAIResponse();
    }, 1000);
  }

  // Simulate audio input via data channel (for demo purposes)
  static simulateAudioInput(text: string): void {
    if (!this.session) return;

    // Add to transcript buffer
    this.transcriptBuffer.push(`User: ${text}`);
    this.session.transcript = this.transcriptBuffer.join('\n');

    // Simulate speech recognition result
    this.sendDataChannelMessage({
      type: 'conversation.item.input_audio_transcription.completed',
      transcript: text,
    });

    // Trigger AI response
    setTimeout(() => {
      this.simulateAIResponse();
    }, 1000);
  }

  // Clean up WebRTC resources
  static cleanup(): void {
    // Close peer connection
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    // Close data channel
    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }

    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach((track: any) => {
        track.stop();
      });
      this.localStream = null;
    }

    // Stop speech recognition
    if (this.speechRecognition) {
      this.speechRecognition.stop();
      this.speechRecognition = null;
    }

    // Close audio context
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    // Stop media recorder
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
      this.mediaRecorder = null;
    }

    // Reset session
    this.session = null;
    this.startTime = 0;
    this.transcriptBuffer = [];
    this.remoteStream = null;

    console.log('🧹 WebRTC resources cleaned up');
  }

  // Get current session
  static getCurrentSession(): VoiceCallSession | null {
    return this.session;
  }

  // Check if voice call is active
  static get isActive(): boolean {
    return this.session?.isConnected ?? false;
  }
}

export default VoiceService;
