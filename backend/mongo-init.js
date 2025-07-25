// MongoDB initialization script
// This runs when the MongoDB container first starts

db = db.getSiblingDB('hackathon');

// Create application user
db.createUser({
  user: 'app_user',
  pwd: 'app_password',
  roles: [
    {
      role: 'readWrite',
      db: 'hackathon'
    }
  ]
});

// Create collections with indexes
db.createCollection('users');
db.createCollection('artifacts');
db.createCollection('chatsessions');
db.createCollection('userinteractions');

// Create indexes for better performance
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "sessionId": 1 });
db.artifacts.createIndex({ "identificationResult.name": 1 });
db.artifacts.createIndex({ "createdAt": -1 });
db.chatsessions.createIndex({ "userId": 1 });
db.chatsessions.createIndex({ "artifactId": 1 });
db.chatsessions.createIndex({ "createdAt": -1 });
db.userinteractions.createIndex({ "userId": 1 });
db.userinteractions.createIndex({ "artifactId": 1 });
db.userinteractions.createIndex({ "interactionType": 1 });
db.userinteractions.createIndex({ "createdAt": -1 });

print('Database initialized successfully!');
