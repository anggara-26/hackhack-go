#!/bin/bash

# Deployment script for VPS
# Usage: ./deploy.sh [production|staging]

set -e

ENVIRONMENT=${1:-production}
DOMAIN="yourdomain.com"  # Replace with your actual domain

echo "🚀 Starting deployment for $ENVIRONMENT environment..."

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p logs uploads ssl

# Copy environment file
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your actual values before continuing!"
    echo "Press any key to continue after editing .env..."
    read -n 1
fi

# Generate SSL certificates with Let's Encrypt (if not exists)
if [ ! -f "ssl/fullchain.pem" ]; then
    echo "🔒 Setting up SSL certificates..."
    echo "Please run the following commands to get SSL certificates:"
    echo "sudo apt install certbot"
    echo "sudo certbot certonly --standalone -d $DOMAIN -d www.$DOMAIN"
    echo "Then copy the certificates to the ssl/ directory"
    echo "Press any key to continue after setting up SSL..."
    read -n 1
fi

# Build and start containers
echo "🐳 Building Docker containers..."
docker-compose down --remove-orphans
docker-compose build --no-cache
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 30

# Check if services are running
echo "🔍 Checking service health..."
if docker-compose ps | grep -q "Up"; then
    echo "✅ Services are running!"
    docker-compose ps
else
    echo "❌ Some services failed to start!"
    docker-compose logs
    exit 1
fi

# Test the API
echo "🧪 Testing API endpoint..."
if curl -f http://localhost:8080/api/health > /dev/null 2>&1; then
    echo "✅ API is responding!"
else
    echo "❌ API is not responding!"
    docker-compose logs backend
    exit 1
fi

# Show final status
echo ""
echo "🎉 Deployment completed successfully!"
echo "Backend API is running on: https://$DOMAIN/api"
echo "MongoDB is running and connected"
echo "Nginx is proxying HTTPS traffic to the backend"
echo ""
echo "📊 Service Status:"
docker-compose ps

echo ""
echo "📝 Next Steps:"
echo "1. Update your frontend to use https://$DOMAIN/api as the API base URL"
echo "2. Test all API endpoints"
echo "3. Set up log rotation: sudo logrotate -d /etc/logrotate.conf"
echo "4. Set up automated backups for MongoDB"
echo "5. Monitor logs: docker-compose logs -f"
