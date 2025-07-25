import ApiService from './api';
import AuthService from './auth';
import { ApiResponse } from '../types';

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
      console.log('Voice call initialized:', response.data?.ephemeralKey);
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
      console.log(
        '🔗 Connecting to OpenAI Realtime API with ephemeral token...',
      );

      // For React Native compatibility, we'll connect through our backend proxy
      // Backend will handle the WebSocket connection to OpenAI with proper headers
      const wsUrl = `ws://localhost:3000/api/voice/realtime/${
        this.session?.interactionId
      }?token=${encodeURIComponent(ephemeralKey)}`;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('✅ Connected to voice proxy server');

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

      this.ws.onmessage = (event: any) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 Received from proxy:', data.type);
          onMessage(data);
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error);
        }
      };

      this.ws.onerror = (error: any) => {
        console.error('❌ WebSocket error:', error);
        onError(error);
      };

      this.ws.onclose = (event: any) => {
        console.log('🔌 WebSocket closed:', event.code, event.reason);
        onClose();
      };
    } catch (error) {
      console.error('❌ Error connecting to Realtime API:', error);
      onError(error);
    }
  }

  // Handle WebSocket messages from OpenAI
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

  // Send message to OpenAI WebSocket
  private static sendWebSocketMessage(message: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
      console.log('📤 Sent to OpenAI:', message.type);
    } else {
      console.error('❌ WebSocket not connected');
    }
  }

  // Send text message (for fallback when audio isn't available)
  static sendTextMessage(text: string): void {
    if (!this.session?.isConnected) return;

    // Add to transcript
    this.transcriptBuffer.push(`User: ${text}`);
    if (this.session) {
      this.session.transcript = this.transcriptBuffer.join('\n');
    }

    // Send text message to OpenAI
    this.sendWebSocketMessage({
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

    // Request response
    this.sendWebSocketMessage({
      type: 'response.create',
    });
  }

  // Simulate audio input (for demo purposes in React Native)
  static simulateAudioInput(text: string): void {
    if (!this.session) return;

    // Add to transcript buffer
    this.transcriptBuffer.push(`User: ${text}`);
    this.session.transcript = this.transcriptBuffer.join('\n');

    // Send as if it was audio transcription
    this.sendWebSocketMessage({
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

    // Request response
    this.sendWebSocketMessage({
      type: 'response.create',
    });
  }

  // Clean up WebSocket resources
  static cleanup(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.session = null;
    this.startTime = 0;
    this.transcriptBuffer = [];

    console.log('🧹 WebSocket resources cleaned up');
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
