# Hackathon Backend

Express.js backend with MongoDB connection for the hackathon project.

## Features

- ✅ Express.js server setup
- ✅ MongoDB connection with Mongoose
- ✅ Environment variables configuration
- ✅ CORS enabled
- ✅ Error handling middleware
- ✅ Health check endpoint
- ✅ Basic project structure

## Setup Instructions

1. **Install dependencies:**

   ```bash
   cd backend
   npm install
   ```

2. **Environment Setup:**

   - Copy `.env` file and update the MongoDB URI if needed
   - Default MongoDB URI: `mongodb://localhost:27017/hackathon-db`
   - Default PORT: `5000`

3. **Start MongoDB:**
   Make sure MongoDB is running on your system.

4. **Run the server:**

   **Development mode (with nodemon):**

   ```bash
   npm run dev
   ```

   **Production mode:**

   ```bash
   npm start
   ```

## API Endpoints

### Base Routes

- `GET /` - Welcome message and server status
- `GET /health` - Health check endpoint with database status

### Test Routes

- `GET /api/test` - Test route

## Project Structure

```
backend/
├── config/
│   └── database.js     # Database connection configuration
├── models/
│   └── User.js         # Example User model
├── routes/
│   └── test.js         # Test routes
├── .env                # Environment variables
├── .gitignore         # Git ignore file
├── package.json       # Dependencies and scripts
├── server.js          # Main server file
└── README.md          # This file
```

## Environment Variables

| Variable      | Description               | Default                                  |
| ------------- | ------------------------- | ---------------------------------------- |
| `PORT`        | Server port               | `5000`                                   |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/hackathon-db` |
| `NODE_ENV`    | Environment mode          | `development`                            |

## Development

The server includes:

- Hot reloading with nodemon
- Error handling middleware
- CORS configuration
- Database connection status monitoring
- Graceful shutdown handling

## Next Steps

1. Add authentication routes
2. Create additional models as needed
3. Implement business logic routes
4. Add validation middleware
5. Set up logging
6. Add API documentation (Swagger/OpenAPI)

## Technologies Used

- **Express.js** - Web framework
- **Mongoose** - MongoDB ODM
- **dotenv** - Environment variables
- **cors** - Cross-origin resource sharing
- **nodemon** - Development server auto-restart
