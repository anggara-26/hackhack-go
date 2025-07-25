import io, { Socket } from 'socket.io-client';
import {
  ChatMessage,
  MessageChunk,
  MessageComplete,
  SocketChatData,
} from '../types';
import ApiService from './api';

const SOCKET_URL = ApiService.BASE_URL_PLAIN;

export class SocketService {
  private static instance: SocketService;
  private socket: Socket | null = null;
  private isConnected = false;

  private constructor() {}

  static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  // Connect to socket
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve();
        return;
      }

      this.socket = io(SOCKET_URL, {
        transports: ['websocket'],
        timeout: 10000,
      });

      this.socket.on('connect', () => {
        console.log('Socket connected');
        this.isConnected = true;
        resolve();
      });

      this.socket.on('connect_error', error => {
        console.error('Socket connection error:', error);
        this.isConnected = false;
        reject(error);
      });

      this.socket.on('disconnect', reason => {
        console.log('Socket disconnected:', reason);
        this.isConnected = false;
      });

      // Set connection timeout
      setTimeout(() => {
        if (!this.isConnected) {
          reject(new Error('Socket connection timeout'));
        }
      }, 10000);
    });
  }

  // Disconnect socket
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Check if connected
  isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  // Join chat room
  joinChat(
    chatSessionId: string,
  ): Promise<{ sessionId: string; artifactInfo: any }> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit('join_chat', { chatSessionId });

      this.socket.once('joined_chat', data => {
        resolve(data);
      });

      this.socket.once('error', error => {
        reject(new Error(error.message));
      });

      // Set timeout
      setTimeout(() => {
        reject(new Error('Join chat timeout'));
      }, 5000);
    });
  }

  // Send message with streaming response
  sendMessage(
    chatSessionId: string,
    message: string,
    onChunk: (chunk: MessageChunk) => void,
    onComplete: (complete: MessageComplete) => void,
    onError?: (error: Error) => void,
  ): void {
    if (!this.socket) {
      onError?.(new Error('Socket not connected'));
      return;
    }

    // Listen for AI response chunks
    this.socket.on('ai_response_chunk', onChunk);

    // Listen for complete response
    this.socket.once('ai_response_end', (data: MessageComplete) => {
      // Clean up listeners
      this.socket?.off('ai_response_chunk', onChunk);
      onComplete(data);
    });

    // Listen for errors
    this.socket.once('error', error => {
      this.socket?.off('ai_response_chunk', onChunk);
      onError?.(new Error(error.message));
    });

    // Send message
    this.socket.emit('send_message', { message });
  }

  // Send quick question
  sendQuickQuestion(
    chatSessionId: string,
    question: string,
    onChunk: (chunk: MessageChunk) => void,
    onComplete: (complete: MessageComplete) => void,
    onError?: (error: Error) => void,
  ): void {
    if (!this.socket) {
      onError?.(new Error('Socket not connected'));
      return;
    }

    // Listen for AI response chunks
    this.socket.on('ai_response_chunk', onChunk);

    // Listen for complete response
    this.socket.once('ai_response_end', (data: MessageComplete) => {
      // Clean up listeners
      this.socket?.off('ai_response_chunk', onChunk);
      onComplete(data);
    });

    // Listen for errors
    this.socket.once('error', error => {
      this.socket?.off('ai_response_chunk', onChunk);
      onError?.(new Error(error.message));
    });

    // Send quick question
    this.socket.emit('send_quick_question', { question });
  }

  // Start typing indicator
  startTyping(chatSessionId: string): void {
    if (this.socket) {
      this.socket.emit('typing_start');
    }
  }

  // Stop typing indicator
  stopTyping(chatSessionId: string): void {
    if (this.socket) {
      this.socket.emit('typing_stop');
    }
  }

  // Listen for typing indicators
  onUserTyping(callback: (data: { sessionId: string }) => void): void {
    if (this.socket) {
      this.socket.on('user_typing', callback);
    }
  }

  onUserStoppedTyping(callback: (data: { sessionId: string }) => void): void {
    if (this.socket) {
      this.socket.on('user_stopped_typing', callback);
    }
  }

  // Listen for new messages (for chat screen)
  onNewMessage(callback: (message: ChatMessage) => void): void {
    if (this.socket) {
      this.socket.on('new_message', callback);
    }
  }

  // Listen for typing indicators (simplified for chat screen)
  onTyping(callback: () => void): void {
    if (this.socket) {
      this.socket.on('user_typing', callback);
    }
  }

  onStopTyping(callback: () => void): void {
    if (this.socket) {
      this.socket.on('user_stopped_typing', callback);
    }
  }

  // Rate conversation
  rateConversation(
    chatSessionId: string,
    rating: 'up' | 'down',
  ): Promise<{ rating: string }> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit('rate_chat', { rating });

      this.socket.once('rating_saved', data => {
        resolve(data);
      });

      this.socket.once('error', error => {
        reject(new Error(error.message));
      });

      setTimeout(() => {
        reject(new Error('Rate conversation timeout'));
      }, 5000);
    });
  }

  // Leave chat room
  leaveChat(chatSessionId: string): void {
    if (this.socket) {
      this.socket.emit('leave_chat', { chatSessionId });
    }
  }

  // Generic event listener
  on(event: string, callback: (...args: any[]) => void): void {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  // Remove event listener
  off(event: string, callback?: (...args: any[]) => void): void {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  // Remove all listeners for an event
  removeAllListeners(event?: string): void {
    if (this.socket) {
      if (event) {
        this.socket.removeAllListeners(event);
      } else {
        this.socket.removeAllListeners();
      }
    }
  }
}

// Export singleton instance
export const socketService = SocketService.getInstance();
export default socketService;
