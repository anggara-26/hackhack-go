# Artifact Identification & Chat API Documentation

## Overview

This API provides functionality for uploading artifact images, AI-powered identification, and interactive chat with identified artifacts using OpenAI.

## Base URL

```
http://localhost:5000/api
```

## Features

1. **Foto & Identifikasi Benda** - Upload and identify artifacts
2. **AI Roleplay / Chat** - Chat with artifacts using AI roleplay
3. **History / Riwayat Interaksi** - Track user interactions and chat history

---

## Artifact Endpoints

### 1. Upload & Identify Artifact

**POST** `/artifacts/upload`

Upload an image and get AI identification of the artifact.

**Request:**

- Content-Type: `multipart/form-data`
- Body:
  - `image` (file): Image file (JPEG, PNG, GIF, WebP, max 10MB)
  - `userId` (string, optional): User ID for tracking
  - `sessionId` (string, optional): Anonymous session ID

**Response:**

```json
{
  "success": true,
  "data": {
    "artifact": {
      "_id": "artifact_id",
      "imageUrl": "/api/artifacts/images/filename.jpg",
      "originalFilename": "uploaded_image.jpg",
      "identificationResult": {
        "name": "Keris Jawa",
        "category": "senjata",
        "description": "Keris tradisional Jawa dengan...",
        "history": "Keris ini berasal dari...",
        "confidence": 0.85,
        "isRecognized": true,
        "culturalSignificance": "...",
        "estimatedAge": "Abad 15-16",
        "materials": "Besi, kayu, emas"
      },
      "createdAt": "2025-07-24T10:00:00.000Z"
    },
    "chatSession": {
      "_id": "chat_session_id",
      "title": "Chat dengan Keris Jawa",
      "messages": [
        {
          "role": "assistant",
          "content": "Halo! Aku Keris Jawa! ...",
          "timestamp": "2025-07-24T10:00:00.000Z"
        }
      ]
    },
    "quickQuestions": [
      "Tanya umur gua dong!",
      "Kenapa gua penting?",
      "Fun fact tentang gua dong!"
    ]
  }
}
```

### 2. Get Artifact History

**GET** `/artifacts/history`

Get user's artifact identification history.

**Query Parameters:**

- `userId` (string, optional)
- `sessionId` (string, optional)
- `page` (number, default: 1)
- `limit` (number, default: 20)

### 3. Get Single Artifact

**GET** `/artifacts/:id`

Get detailed information about a specific artifact.

### 4. Serve Artifact Images

**GET** `/artifacts/images/:filename`

Serve uploaded artifact images.

### 5. Delete Artifact

**DELETE** `/artifacts/:id`

Delete artifact and all associated data.

---

## Chat Endpoints

### 1. Send Message

**POST** `/chat/:chatSessionId/send`

Send a message to the artifact for roleplay chat.

**Request Body:**

```json
{
  "message": "Halo, cerita tentang sejarahmu dong!",
  "userId": "user123",
  "sessionId": "session456"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "userMessage": {
      "role": "user",
      "content": "Halo, cerita tentang sejarahmu dong!",
      "timestamp": "2025-07-24T10:05:00.000Z"
    },
    "aiResponse": {
      "role": "assistant",
      "content": "Wah, cerita panjang nih! Aku lahir di zaman Majapahit...",
      "timestamp": "2025-07-24T10:05:01.000Z"
    },
    "totalMessages": 3
  }
}
```

### 2. Send Quick Question

**POST** `/chat/:chatSessionId/quick-question`

Send a predefined quick question to the artifact.

**Request Body:**

```json
{
  "questionText": "Tanya umur gua dong!",
  "userId": "user123"
}
```

### 3. Get Chat Session

**GET** `/chat/:chatSessionId`

Get chat session with message history.

**Query Parameters:**

- `page` (number, default: 1)
- `limit` (number, default: 50)

### 4. Rate Chat Session

**POST** `/chat/:chatSessionId/rate`

Rate the chat interaction with the artifact.

**Request Body:**

```json
{
  "rating": 5,
  "comment": "Sangat menarik dan informatif!",
  "userId": "user123"
}
```

### 5. Get Chat History

**GET** `/chat/`

Get user's chat history across all artifacts.

**Query Parameters:**

- `userId` (string, optional)
- `sessionId` (string, optional)
- `page` (number, default: 1)
- `limit` (number, default: 20)

### 6. Delete Chat Session

**DELETE** `/chat/:chatSessionId`

Delete a chat session and its messages.

---

## Quick Questions Examples

The system generates contextual quick questions based on artifact category:

**General Questions:**

- "Tanya umur gua dong!"
- "Kenapa gua penting?"
- "Fun fact tentang gua dong!"
- "Gimana cara gua dibuat?"
- "Siapa yang biasa pake gua dulu?"

**Category-Specific:**

- **Keramik**: "Dari tanah apa gua dibuat?", "Berapa lama proses pembuatan gua?"
- **Senjata**: "Seberapa berbahaya gua dulu?", "Untuk perang apa gua dipakai?"
- **Perhiasan**: "Siapa yang dulu pake gua?", "Dari bahan apa gua dibuat?"
- **Tekstil**: "Gimana cara bikin gua?", "Motif gua ada artinya nggak?"

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

**Common HTTP Status Codes:**

- `400`: Bad Request (missing required fields)
- `404`: Not Found (artifact/chat session not found)
- `500`: Internal Server Error

---

## File Upload Specifications

**Supported Formats:** JPEG, PNG, GIF, WebP
**Maximum Size:** 10MB
**Processing:** Images are automatically resized to max 1024x1024px and optimized for storage.

---

## OpenAI Integration

The system uses:

- **GPT-4 Vision**: For artifact identification with web search capabilities
- **GPT-4**: For roleplay chat responses
- **Streaming**: Support for real-time chat responses (future enhancement)

Each artifact gets a unique AI personality based on its identified characteristics, history, and cultural significance.
