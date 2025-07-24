import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Dimensions,
} from 'react-native';
import { useNavigation } from '../hooks/useNavigation';
import { useRoute } from '@react-navigation/native';
import { ChatMessage, Artifact } from '../types';

const { width } = Dimensions.get('window');

const ChatScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  // const { sessionId, artifact } = route.params as { sessionId: string; artifact: Artifact };

  // Mock data for demonstration
  const mockArtifact: Artifact = {
    _id: '1',
    imageUrl: 'placeholder.jpg',
    originalFilename: 'artifact.jpg',
    identificationResult: {
      name: 'Keris Majapahit',
      category: 'Senjata Tradisional',
      description: 'Keris tradisional dari era Majapahit',
      history: 'Digunakan oleh ksatria Majapahit',
      confidence: 0.89,
      isRecognized: true,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        'Halo! Aku adalah Keris Majapahit! 🗡️ Senang bisa ngobrol denganmu. Aku sudah berusia ratusan tahun lho! Ada yang ingin kamu tanyakan tentang sejarahku?',
      timestamp: new Date().toISOString(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [rating, setRating] = useState<'up' | 'down' | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  const quickQuestions = [
    'Tanya umur gua dong!',
    'Kenapa gua penting?',
    'Fun fact tentang gua dong!',
    'Gimana cara gua dibuat?',
    'Siapa yang biasa pake gua dulu?',
  ];

  useEffect(() => {
    // Scroll to bottom when messages change
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const responses = [
        'Wah, pertanyaan yang menarik! 🤔 Sebagai keris berusia ratusan tahun, aku sudah melihat banyak sekali peristiwa sejarah. Ceritanya panjang nih!',
        'Hehe, aku senang kamu tertarik dengan sejarahku! 😊 Dulu aku dipakai sama ksatria Majapahit yang sangat pemberani lho!',
        'Itu pertanyaan bagus banget! ✨ Aku punya banyak cerita seru tentang masa lalu. Mau dengerin?',
        'Wahhh, jarang-jarang ada yang nanya hal itu! 🙌 Aku excited bisa cerita sama kamu!',
      ];

      const randomResponse =
        responses[Math.floor(Math.random() * responses.length)];

      const aiMessage: ChatMessage = {
        role: 'assistant',
        content: randomResponse,
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 2000);
  };

  const handleQuickQuestion = (question: string) => {
    const userMessage: ChatMessage = {
      role: 'user',
      content: question,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    // Simulate AI response for quick questions
    setTimeout(() => {
      let response = '';

      if (question.includes('umur')) {
        response =
          'Aku sudah berusia sekitar 600-700 tahun nih! 👴 Dibuat pada masa kejayaan Majapahit di abad ke-14. Masih cukup muda kan untuk ukuran artefak? Hehe! 😄';
      } else if (question.includes('penting')) {
        response =
          'Aku penting karena jadi saksi sejarah Nusantara! 🏛️ Selain sebagai senjata, aku juga punya makna spiritual dan jadi simbol kekuatan ksatria. Keren ya? ✨';
      } else if (question.includes('fun fact')) {
        response =
          'Fun fact: Aku bukan cuma senjata biasa lho! 🌟 Bilah-ku dibuat dengan teknik lipat berkali-kali, makanya motifnya unik. Dan katanya aku punya kekuatan magis! 🪄';
      } else if (question.includes('dibuat')) {
        response =
          "Proses pembuatanku butuh berbulan-bulan! 🔨 Empu (pandai besi) harus melipat besi berkali-kali sambil berdoa. Setiap keris punya 'jiwa' sendiri lho! Mistis banget kan? 👻";
      } else {
        response =
          'Dulu aku dipakai sama para ksatria dan bangsawan Majapahit! 👑 Bukan sembarang orang yang bisa memiliki keris seperti aku. Aku simbol status dan kehormatan! 🎖️';
      }

      const aiMessage: ChatMessage = {
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleRating = (newRating: 'up' | 'down') => {
    setRating(newRating);
    Alert.alert(
      'Terima Kasih!',
      newRating === 'up'
        ? 'Senang kamu menikmati percakapan ini! 😊'
        : 'Maaf kalau kurang memuaskan. Kami akan terus belajar! 🙇‍♂️',
      [{ text: 'OK' }],
    );
  };

  const handleShare = () => {
    Alert.alert(
      'Share Chat',
      'Chat akan dibagikan sebagai transkrip. Fitur ini akan diimplementasikan dengan react-native-share.',
      [{ text: 'OK' }],
    );
  };

  const renderMessage = (message: ChatMessage, index: number) => {
    const isUser = message.role === 'user';

    return (
      <View
        key={index}
        style={[
          styles.messageContainer,
          isUser ? styles.userMessageContainer : styles.aiMessageContainer,
        ]}
      >
        {!isUser && (
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>🏺</Text>
          </View>
        )}

        <View
          style={[
            styles.messageBubble,
            isUser ? styles.userBubble : styles.aiBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isUser ? styles.userMessageText : styles.aiMessageText,
            ]}
          >
            {message.content}
          </Text>

          <Text
            style={[
              styles.timestamp,
              isUser ? styles.userTimestamp : styles.aiTimestamp,
            ]}
          >
            {new Date(message.timestamp).toLocaleTimeString('id-ID', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <Text style={styles.artifactName}>
            {mockArtifact.identificationResult.name}
          </Text>
          <Text style={styles.artifactStatus}>Online • Siap ngobrol</Text>
        </View>

        <TouchableOpacity onPress={handleShare}>
          <Text style={styles.shareButton}>📤</Text>
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.messagesContent}
      >
        {messages.map((message, index) => renderMessage(message, index))}

        {isTyping && (
          <View style={styles.typingContainer}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>🏺</Text>
            </View>
            <View style={styles.typingBubble}>
              <Text style={styles.typingText}>Sedang mengetik...</Text>
              <View style={styles.typingDots}>
                <View style={[styles.dot, styles.dot1]} />
                <View style={[styles.dot, styles.dot2]} />
                <View style={[styles.dot, styles.dot3]} />
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Quick Questions */}
      {messages.length === 1 && (
        <View style={styles.quickQuestionsContainer}>
          <Text style={styles.quickQuestionsTitle}>Pertanyaan Cepat:</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickQuestions}
          >
            {quickQuestions.map((question, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickQuestionButton}
                onPress={() => handleQuickQuestion(question)}
              >
                <Text style={styles.quickQuestionText}>{question}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Rating Section */}
      {messages.length > 3 && !rating && (
        <View style={styles.ratingContainer}>
          <Text style={styles.ratingText}>Gimana percakapannya?</Text>
          <View style={styles.ratingButtons}>
            <TouchableOpacity
              style={styles.ratingButton}
              onPress={() => handleRating('up')}
            >
              <Text style={styles.ratingEmoji}>👍</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.ratingButton}
              onPress={() => handleRating('down')}
            >
              <Text style={styles.ratingEmoji}>👎</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          placeholder="Ketik pesan..."
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            inputText.trim() ? styles.sendButtonActive : {},
          ]}
          onPress={handleSendMessage}
          disabled={!inputText.trim() || isTyping}
        >
          <Text style={styles.sendButtonText}>📨</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    fontSize: 24,
    color: '#6366f1',
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  artifactName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  artifactStatus: {
    fontSize: 12,
    color: '#10b981',
  },
  shareButton: {
    fontSize: 20,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: 16,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  aiMessageContainer: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarText: {
    fontSize: 16,
  },
  messageBubble: {
    maxWidth: width * 0.75,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
  },
  userBubble: {
    backgroundColor: '#6366f1',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: '#fff',
  },
  aiMessageText: {
    color: '#111827',
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
  },
  userTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'right',
  },
  aiTimestamp: {
    color: '#9ca3af',
  },
  typingContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  typingBubble: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingText: {
    fontSize: 14,
    color: '#9ca3af',
    marginRight: 8,
  },
  typingDots: {
    flexDirection: 'row',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#9ca3af',
    marginHorizontal: 1,
  },
  dot1: {
    // Animation delay would be handled by Animated API in real implementation
  },
  dot2: {
    // Animation delay would be handled by Animated API in real implementation
  },
  dot3: {
    // Animation delay would be handled by Animated API in real implementation
  },
  quickQuestionsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  quickQuestionsTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 8,
  },
  quickQuestions: {
    paddingRight: 16,
  },
  quickQuestionButton: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  quickQuestionText: {
    fontSize: 14,
    color: '#374151',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  ratingText: {
    fontSize: 14,
    color: '#6b7280',
  },
  ratingButtons: {
    flexDirection: 'row',
  },
  ratingButton: {
    marginLeft: 12,
  },
  ratingEmoji: {
    fontSize: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonActive: {
    backgroundColor: '#6366f1',
  },
  sendButtonText: {
    fontSize: 20,
  },
});

export default ChatScreen;
