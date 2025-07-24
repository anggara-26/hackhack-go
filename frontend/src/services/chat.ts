import ApiService from './api';
import AuthService from './auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ApiResponse,
  ChatSession,
  ChatMessage,
  QuickQuestion,
  Artifact,
} from '../types';

export class ChatService {
  // Start a new chat session
  static async startChatSession(artifactId: string): Promise<
    ApiResponse<{
      sessionId: string;
      artifactInfo: Artifact;
      quickQuestions: string[];
    }>
  > {
    const isAuthenticated = await AuthService.isAuthenticated();
    const payload: any = { artifactId };

    if (isAuthenticated) {
      const user = await AuthService.getCurrentUser();
      if (user) {
        payload.userId = user.id;
      }
    } else {
      payload.sessionId = await AuthService.getOrCreateSessionId();
    }

    return ApiService.post<
      ApiResponse<{
        sessionId: string;
        artifactInfo: Artifact;
        quickQuestions: string[];
      }>
    >('/chat/start', payload);
  }

  // Send a message in chat session
  static async sendMessage(
    sessionId: string,
    message: string,
  ): Promise<
    ApiResponse<{
      response: string;
      sessionId: string;
    }>
  > {
    return ApiService.post<
      ApiResponse<{
        response: string;
        sessionId: string;
      }>
    >('/chat/message', { sessionId, message });
  }

  // Rate a chat session
  static async rateChat(
    sessionId: string,
    rating: 'up' | 'down',
  ): Promise<ApiResponse> {
    return ApiService.post<ApiResponse>('/chat/rate', { sessionId, rating });
  }

  // Get chat history
  static async getChatHistory(
    sessionId: string,
  ): Promise<ApiResponse<ChatSession>> {
    return ApiService.get<ApiResponse<ChatSession>>(
      `/chat/history/${sessionId}`,
    );
  }

  // Get all chat sessions for user
  static async getAllChatSessions(): Promise<ApiResponse<ChatSession[]>> {
    const isAuthenticated = await AuthService.isAuthenticated();

    if (isAuthenticated) {
      return ApiService.get<ApiResponse<ChatSession[]>>('/chat/sessions');
    } else {
      const sessionId = await AuthService.getOrCreateSessionId();
      return ApiService.get<ApiResponse<ChatSession[]>>(
        `/chat/sessions?sessionId=${sessionId}`,
      );
    }
  }

  // Generate quick questions for artifact
  static generateQuickQuestions(artifact: Artifact): string[] {
    const baseQuestions = [
      'Tanya umur gua dong!',
      'Kenapa gua penting?',
      'Fun fact tentang gua dong!',
      'Gimana cara gua dibuat?',
      'Siapa yang biasa pake gua dulu?',
    ];

    // Add category-specific questions
    const categoryQuestions: { [key: string]: string[] } = {
      keramik: [
        'Dari tanah apa gua dibuat?',
        'Berapa lama proses pembuatan gua?',
      ],
      senjata: [
        'Seberapa berbahaya gua dulu?',
        'Untuk perang apa gua dipakai?',
      ],
      perhiasan: ['Siapa yang dulu pake gua?', 'Dari bahan apa gua dibuat?'],
      tekstil: ['Gimana cara bikin gua?', 'Motif gua ada artinya nggak?'],
    };

    const category =
      artifact.identificationResult.category?.toLowerCase() || '';
    const specificQuestions = categoryQuestions[category] || [];

    return [...baseQuestions, ...specificQuestions].slice(0, 5);
  }

  // Save chat locally for offline viewing
  static async saveChatLocally(
    sessionId: string,
    chatData: ChatSession,
  ): Promise<void> {
    try {
      const localChats = await this.getLocalChats();
      localChats[sessionId] = chatData;
      await AsyncStorage.setItem('local_chats', JSON.stringify(localChats));
    } catch (error) {
      console.error('Error saving chat locally:', error);
    }
  }

  // Get locally saved chats
  static async getLocalChats(): Promise<{ [sessionId: string]: ChatSession }> {
    try {
      const localChatsString = await AsyncStorage.getItem('local_chats');
      return localChatsString ? JSON.parse(localChatsString) : {};
    } catch (error) {
      console.error('Error getting local chats:', error);
      return {};
    }
  }

  // Get specific local chat
  static async getLocalChat(sessionId: string): Promise<ChatSession | null> {
    try {
      const localChats = await this.getLocalChats();
      return localChats[sessionId] || null;
    } catch (error) {
      console.error('Error getting local chat:', error);
      return null;
    }
  }

  // Clear local chats
  static async clearLocalChats(): Promise<void> {
    try {
      await AsyncStorage.removeItem('local_chats');
    } catch (error) {
      console.error('Error clearing local chats:', error);
    }
  }

  // Format message for display
  static formatMessage(message: ChatMessage): ChatMessage {
    return {
      ...message,
      timestamp: new Date(message.timestamp).toISOString(),
    };
  }

  // Generate share text for chat
  static generateShareText(
    artifact: Artifact,
    messages: ChatMessage[],
  ): string {
    let shareText = `🏛️ Ngobrol dengan ${artifact.identificationResult.name}\n\n`;
    shareText += `📜 ${artifact.identificationResult.description}\n\n`;
    shareText += `💬 Percakapan:\n`;

    messages.forEach((msg, index) => {
      const speaker =
        msg.role === 'user'
          ? '👤 Saya'
          : `🏺 ${artifact.identificationResult.name}`;
      shareText += `${speaker}: ${msg.content}\n\n`;
    });

    shareText += `\n🚀 Dicoba pakai Museum AI App!`;
    return shareText;
  }

  // Check if chat has rating
  static async hasChatRating(sessionId: string): Promise<boolean> {
    try {
      const ratings = await this.getChatRatings();
      return sessionId in ratings;
    } catch (error) {
      return false;
    }
  }

  // Save chat rating locally
  static async saveChatRating(
    sessionId: string,
    rating: 'up' | 'down',
  ): Promise<void> {
    try {
      const ratings = await this.getChatRatings();
      ratings[sessionId] = rating;
      await AsyncStorage.setItem('chat_ratings', JSON.stringify(ratings));
    } catch (error) {
      console.error('Error saving chat rating:', error);
    }
  }

  // Get chat ratings
  static async getChatRatings(): Promise<{
    [sessionId: string]: 'up' | 'down';
  }> {
    try {
      const ratingsString = await AsyncStorage.getItem('chat_ratings');
      return ratingsString ? JSON.parse(ratingsString) : {};
    } catch (error) {
      console.error('Error getting chat ratings:', error);
      return {};
    }
  }

  // Get chat rating
  static async getChatRating(sessionId: string): Promise<'up' | 'down' | null> {
    try {
      const ratings = await this.getChatRatings();
      return ratings[sessionId] || null;
    } catch (error) {
      return null;
    }
  }
}

export default ChatService;
