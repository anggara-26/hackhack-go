# JWT Authentication API Documentation

## 🔐 Authentication Endpoints

### Register a New User

**POST** `/api/auth/register`

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "isActive": true
    },
    "token": "jwt_token_here",
    "refreshToken": "refresh_token_here"
  }
}
```

### Login User

**POST** `/api/auth/login`

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "isActive": true
    },
    "token": "jwt_token_here",
    "refreshToken": "refresh_token_here"
  }
}
```

### Get Current User Profile

**GET** `/api/auth/me`

**Headers:**

```
Authorization: Bearer your_jwt_token_here
```

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "isActive": true
    }
  }
}
```

### Update User Profile

**PUT** `/api/auth/profile`

**Headers:**

```
Authorization: Bearer your_jwt_token_here
```

**Body:**

```json
{
  "name": "John Smith"
}
```

### Change Password

**PUT** `/api/auth/change-password`

**Headers:**

```
Authorization: Bearer your_jwt_token_here
```

**Body:**

```json
{
  "currentPassword": "old_password",
  "newPassword": "new_password123"
}
```

### Logout

**POST** `/api/auth/logout`

**Headers:**

```
Authorization: Bearer your_jwt_token_here
```

## 🔒 Protected Routes

The following routes now require authentication:

- **GET** `/api/sessions` - Get ephemeral session data (requires Bearer token)

## 🛡️ Using Authentication in Your Frontend

### 1. Login/Register

```javascript
// Register
const response = await fetch("/api/auth/register", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    name: "John Doe",
    email: "john@example.com",
    password: "password123",
  }),
});

const data = await response.json();
// Store the token in localStorage or secure storage
localStorage.setItem("token", data.data.token);
```

### 2. Making Authenticated Requests

```javascript
// Making authenticated requests
const token = localStorage.getItem("token");

const response = await fetch("/api/sessions", {
  method: "GET",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
});
```

### 3. Error Handling

Common error responses:

- **401**: Unauthorized (invalid/missing token)
- **403**: Forbidden (insufficient permissions)
- **400**: Bad Request (validation errors)

## 🔧 Middleware Usage

### Protecting Routes

```typescript
import { authenticate, authorize } from "@/middleware/auth";

// Require authentication
router.get("/protected", authenticate, controller.method);

// Require authentication + specific role
router.get("/admin", authenticate, authorize("admin"), controller.method);

// Optional authentication (user data available if logged in)
router.get("/optional", optionalAuth, controller.method);
```

## 💾 User Model Schema

```typescript
{
  name: string;           // User's full name
  email: string;          // Unique email address
  password: string;       // Hashed password (not returned in responses)
  role: 'user' | 'admin'; // User role (default: 'user')
  isActive: boolean;      // Account status (default: true)
  lastLogin?: Date;       // Last login timestamp
  createdAt: Date;        // Account creation date
  updatedAt: Date;        // Last update date
}
```

## 📋 JWT Token Structure

```typescript
{
  userId: string; // MongoDB user ID
  email: string; // User email
  role: string; // User role
  iat: number; // Issued at timestamp
  exp: number; // Expiration timestamp
}
```

## 🔐 Security Features

- ✅ Password hashing with bcrypt (salt rounds: 12)
- ✅ JWT tokens with 7-day expiration
- ✅ Refresh tokens with 30-day expiration
- ✅ Role-based authorization
- ✅ Account activation status
- ✅ Input validation
- ✅ Error handling
- ✅ TypeScript type safety
