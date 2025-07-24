# Voice Call & Chat API Documentation

## Overview

This backend provides comprehensive voice call and chat functionality for artifact identification and roleplay conversations. The system includes:

1. **REST API** - Traditional HTTP endpoints for chat management
2. **WebSocket API** - Real-time streaming chat with Socket.IO
3. **Voice Call API** - OpenAI Realtime API integration for voice conversations

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MongoDB running locally or connection string
- OpenAI API key with access to:
  - GPT-4o (for chat and vision)
  - Realtime API (for voice calls)

### Environment Variables

```env
# Required
OPENAI_API_KEY=your_openai_api_key_here
MONGODB_URI=mongodb://localhost:27017/hackathon

# Optional
PORT=5000
NODE_ENV=development
```

### Installation & Running

```bash
# Install dependencies
npm install

# Development mode (with auto-reload)
npm run dev

# Production build and start
npm run build
npm start
```

## 📡 REST API Endpoints

### 1. Text Chat Management

#### Start Chat Session

```http
POST /api/chat/start
Content-Type: application/json

{
  "artifactId": "673d2a1b2c3d4e5f6a7b8c9d",
  "userId": "user123" // Optional for anonymous users
}
```

**Response:**

```json
{
  "success": true,
  "sessionId": "673d2a1b2c3d4e5f6a7b8c9e",
  "artifactInfo": {
    "name": "Keris Majapahit",
    "category": "senjata",
    "description": "Keris dari era Majapahit...",
    "history": "Digunakan oleh ksatria...",
    "estimatedAge": "Abad 14-15",
    "materials": "Besi dan baja"
  },
  "quickQuestions": [
    "Tanya umur gua dong!",
    "Kenapa gua penting?",
    "Fun fact tentang gua dong!",
    "Gimana cara gua dibuat?",
    "Siapa yang biasa pake gua dulu?"
  ]
}
```

#### Send Message

```http
POST /api/chat/message
Content-Type: application/json

{
  "sessionId": "673d2a1b2c3d4e5f6a7b8c9e",
  "message": "Halo, bisa cerita tentang sejarahmu?"
}
```

**Response:**

```json
{
  "success": true,
  "response": "Halo! Aku keris yang sudah berusia ratusan tahun nih... 🗡️ Dulu aku dipakai sama ksatria Majapahit untuk melindungi kerajaan. Cerita tentang perangku seru banget lho!",
  "sessionId": "673d2a1b2c3d4e5f6a7b8c9e"
}
```

#### Rate Conversation

```http
POST /api/chat/rate
Content-Type: application/json

{
  "sessionId": "673d2a1b2c3d4e5f6a7b8c9e",
  "rating": "up" // or "down"
}
```

#### Get Chat History

```http
GET /api/chat/history/:sessionId
```

**Response:**

```json
{
  "success": true,
  "session": {
    "sessionId": "673d2a1b2c3d4e5f6a7b8c9e",
    "artifactId": "673d2a1b2c3d4e5f6a7b8c9d",
    "messages": [
      {
        "role": "user",
        "content": "Halo, bisa cerita tentang sejarahmu?",
        "timestamp": "2024-07-24T10:30:00Z"
      },
      {
        "role": "assistant",
        "content": "Halo! Aku keris yang sudah berusia ratusan tahun nih... 🗡️",
        "timestamp": "2024-07-24T10:30:05Z"
      }
    ],
    "rating": "up",
    "createdAt": "2024-07-24T10:29:00Z"
  }
}
```

## 🔌 WebSocket API (Real-time Chat)

### Connection

```javascript
import io from "socket.io-client";

const socket = io("http://localhost:5000", {
  transports: ["websocket"],
});
```

### Events

#### 1. Join Chat Room

```javascript
socket.emit("join_chat", {
  sessionId: "673d2a1b2c3d4e5f6a7b8c9e",
});

// Server response
socket.on("joined_chat", (data) => {
  console.log("Joined chat:", data.sessionId);
  console.log("Artifact info:", data.artifactInfo);
});
```

#### 2. Send Message (Streaming Response)

```javascript
socket.emit("send_message", {
  sessionId: "673d2a1b2c3d4e5f6a7b8c9e",
  message: "Cerita dong tentang masa lalumu!",
});

// Real-time response chunks
socket.on("message_chunk", (data) => {
  console.log("Chunk:", data.chunk);
  // Append to UI progressively
});

// Complete response
socket.on("message_complete", (data) => {
  console.log("Complete response:", data.fullResponse);
  console.log("Session ID:", data.sessionId);
});
```

#### 3. Quick Questions

```javascript
socket.emit("quick_question", {
  sessionId: "673d2a1b2c3d4e5f6a7b8c9e",
  question: "Tanya umur gua dong!",
});

// Same streaming response as send_message
```

#### 4. Typing Indicators

```javascript
// Start typing
socket.emit("typing_start", {
  sessionId: "673d2a1b2c3d4e5f6a7b8c9e",
});

// Stop typing
socket.emit("typing_stop", {
  sessionId: "673d2a1b2c3d4e5f6a7b8c9e",
});

// Listen for other users typing
socket.on("user_typing", (data) => {
  console.log("User typing in session:", data.sessionId);
});

socket.on("user_stopped_typing", (data) => {
  console.log("User stopped typing in session:", data.sessionId);
});
```

#### 5. Rate Conversation

```javascript
socket.emit("rate_conversation", {
  sessionId: "673d2a1b2c3d4e5f6a7b8c9e",
  rating: "up", // or 'down'
});

socket.on("conversation_rated", (data) => {
  console.log("Rating saved:", data.rating);
});
```

#### 6. Error Handling

```javascript
socket.on("error", (error) => {
  console.error("Socket error:", error.message);
});

socket.on("disconnect", (reason) => {
  console.log("Disconnected:", reason);
});
```

## 🎤 Voice Call API

### Start Voice Session

```http
POST /api/voice/start
Content-Type: application/json

{
  "artifactId": "673d2a1b2c3d4e5f6a7b8c9d",
  "userId": "user123" // Optional
}
```

**Response:**

```json
{
  "success": true,
  "sessionId": "673d2a1b2c3d4e5f6a7b8c9f",
  "artifactInfo": {
    "name": "Keris Majapahit",
    "category": "senjata"
  },
  "instructions": "Voice session started. Connect to WebSocket for real-time voice data."
}
```

### WebSocket Voice Connection

```javascript
// Connect to voice WebSocket
const voiceSocket = io("http://localhost:5000/voice", {
  transports: ["websocket"],
});

// Join voice session
voiceSocket.emit("join_voice_session", {
  sessionId: "673d2a1b2c3d4e5f6a7b8c9f",
});

// Send audio data (PCM 16-bit, 24kHz)
voiceSocket.emit("audio_data", {
  sessionId: "673d2a1b2c3d4e5f6a7b8c9f",
  audioData: audioBuffer, // Raw PCM audio data
});

// Receive audio response
voiceSocket.on("audio_response", (data) => {
  // data.audioData contains PCM audio from AI
  playAudioBuffer(data.audioData);
});

// Text transcription (optional)
voiceSocket.on("transcript", (data) => {
  console.log("User said:", data.userText);
  console.log("AI responded:", data.aiText);
});
```

### End Voice Session

```http
POST /api/voice/end
Content-Type: application/json

{
  "sessionId": "673d2a1b2c3d4e5f6a7b8c9f"
}
```

## 📱 Frontend Integration Examples

### React Native Socket.IO

```javascript
import io from "socket.io-client";

const ChatService = {
  socket: null,

  connect() {
    this.socket = io("http://your-backend-url:5000");

    this.socket.on("connect", () => {
      console.log("Connected to chat server");
    });

    return this.socket;
  },

  joinChat(sessionId) {
    return new Promise((resolve) => {
      this.socket.emit("join_chat", { sessionId });
      this.socket.once("joined_chat", resolve);
    });
  },

  sendMessage(sessionId, message, onChunk, onComplete) {
    this.socket.emit("send_message", { sessionId, message });

    this.socket.on("message_chunk", onChunk);
    this.socket.once("message_complete", onComplete);
  },

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  },
};
```

### Web Audio API Integration

```javascript
class VoiceService {
  constructor() {
    this.audioContext = new AudioContext();
    this.socket = io("http://your-backend-url:5000/voice");
  }

  async startRecording(sessionId) {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const processor = this.audioContext.createScriptProcessor(4096, 1, 1);
    const source = this.audioContext.createMediaStreamSource(stream);

    source.connect(processor);

    processor.onaudioprocess = (event) => {
      const audioData = event.inputBuffer.getChannelData(0);
      const pcmData = this.float32ToPCM16(audioData);

      this.socket.emit("audio_data", {
        sessionId,
        audioData: pcmData,
      });
    };

    this.socket.on("audio_response", (data) => {
      this.playAudioBuffer(data.audioData);
    });
  }

  float32ToPCM16(float32Array) {
    const pcm16 = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      pcm16[i] = Math.max(-32768, Math.min(32767, float32Array[i] * 32767));
    }
    return pcm16;
  }

  playAudioBuffer(pcmData) {
    const audioBuffer = this.audioContext.createBuffer(
      1,
      pcmData.length,
      24000
    );
    const channelData = audioBuffer.getChannelData(0);

    for (let i = 0; i < pcmData.length; i++) {
      channelData[i] = pcmData[i] / 32767;
    }

    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.audioContext.destination);
    source.start();
  }
}
```

## 🔧 Configuration & Customization

### OpenAI Model Settings

The system uses optimized settings for different use cases:

```typescript
// Chat settings (in openAIService.ts)
const chatSettings = {
  model: "gpt-4o",
  max_tokens: 300,
  temperature: 0.8, // Creative but coherent
  presence_penalty: 0.1, // Slight novelty encouragement
  frequency_penalty: 0.1, // Reduce repetition
  stream: true, // For real-time responses
};

// Vision settings (for artifact identification)
const visionSettings = {
  model: "gpt-4o",
  max_output_tokens: 1000,
  temperature: 0.7, // Balanced creativity/accuracy
  reasoning: {
    effort: "medium", // Good balance of speed/quality
    summary: "detailed", // Comprehensive analysis
  },
};
```

### Custom Artifact Personalities

Each artifact gets a unique personality based on its identification:

```typescript
const systemPrompt = `Kamu adalah ${artifactInfo.name}, sebuah ${artifactInfo.category} yang bisa bicara dengan manusia.

INFORMASI TENTANG DIRIMU:
- Nama: ${artifactInfo.name}
- Kategori: ${artifactInfo.category}
- Deskripsi: ${artifactInfo.description}
- Sejarah: ${artifactInfo.history}
- Umur/Periode: ${artifactInfo.estimatedAge}
- Bahan: ${artifactInfo.materials}

KEPRIBADIAN & CARA BICARA:
- Bicara dengan bahasa Indonesia yang santai dan ramah
- Punya kepribadian unik sesuai sejarah dan budayamu
- Sesekali gunakan emoji yang relevan
- Maksimal 200 kata per response
- Fokus pada aspek budaya, sejarah, dan pengalaman personal`;
```

## 🛠️ Troubleshooting

### Common Issues

1. **Socket Connection Failed**

   ```bash
   # Check if server is running
   curl http://localhost:5000/health

   # Check WebSocket endpoint
   curl -I http://localhost:5000/socket.io/
   ```

2. **OpenAI API Errors**

   ```bash
   # Verify API key
   echo $OPENAI_API_KEY

   # Check API quota
   curl -H "Authorization: Bearer $OPENAI_API_KEY" \
        https://api.openai.com/v1/usage
   ```

3. **Audio Issues**
   - Ensure PCM format: 16-bit, 24kHz, mono
   - Check microphone permissions
   - Verify Web Audio API support

### Debugging

Enable debug logging:

```bash
DEBUG=socket.io* npm run dev
```

Check MongoDB connection:

```bash
# In MongoDB shell
use hackathon
db.chatsessions.find().limit(5)
db.artifacts.find().limit(5)
```

## 📊 API Rate Limits & Performance

- **Text Chat**: ~2-5 seconds response time
- **Streaming Chat**: ~100-200ms first chunk
- **Voice**: ~300-500ms latency (real-time)
- **Concurrent Users**: 100+ per server instance

### Scaling Considerations

- Use Redis for Socket.IO clustering
- Implement connection pooling for MongoDB
- Consider OpenAI API rate limits (RPM/TPM)
- Add CDN for uploaded images

## 🔐 Security Notes

- Validate all input data
- Implement rate limiting
- Sanitize file uploads
- Use CORS appropriately
- Monitor API usage costs

---

## 📞 Support

For issues or questions:

1. Check logs: `npm run dev` for detailed output
2. Verify environment variables
3. Test API endpoints with provided examples
4. Check MongoDB collections for data integrity

**Happy coding! 🚀**
