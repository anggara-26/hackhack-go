# Backend Deployment Guide

This guide will help you deploy the Hackathon backend to your VPS with Docker, Nginx, and HTTPS support.

## 🏗️ Architecture Overview

```
Internet → Nginx (443/HTTPS) → Backend (8080) → MongoDB (27017)
```

- **Nginx**: Reverse proxy with SSL termination
- **Backend**: Node.js API running on port 8080
- **MongoDB**: Database with authentication
- **Docker**: Containerization for easy deployment

## 🚀 Quick Start

### 1. Prerequisites

Make sure your VPS has:
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.21.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Certbot for SSL
sudo apt update
sudo apt install certbot -y
```

### 2. Clone and Setup

```bash
# Upload your backend code to VPS
scp -r ./backend user@your-server:/home/user/hackathon-backend
ssh user@your-server
cd hackathon-backend
```

### 3. Configure Environment

```bash
# Copy and edit environment variables
cp .env.example .env
nano .env
```

Update these key values in `.env`:
```env
MONGO_PASSWORD=your-secure-mongodb-password
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters
OPENAI_API_KEY=your-openai-api-key
CORS_ORIGIN=https://yourdomain.com
DOMAIN=yourdomain.com
```

### 4. Setup SSL Certificate

```bash
# Get SSL certificate from Let's Encrypt
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Create SSL directory and copy certificates
mkdir -p ssl
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ssl/
sudo chown $USER:$USER ssl/*.pem
```

### 5. Update Nginx Configuration

Edit `nginx/conf.d/default.conf` and replace `yourdomain.com` with your actual domain.

### 6. Deploy

```bash
# Run the deployment script
./deploy.sh production
```

## 🔧 Manual Deployment Steps

If you prefer manual deployment:

### 1. Build and Start Services

```bash
# Create necessary directories
mkdir -p logs uploads ssl

# Start services
docker-compose up -d --build
```

### 2. Check Service Status

```bash
# View running containers
docker-compose ps

# Check logs
docker-compose logs backend
docker-compose logs mongodb
docker-compose logs nginx
```

### 3. Test API

```bash
# Test local API
curl http://localhost:8080/api/health

# Test through Nginx
curl https://yourdomain.com/api/health
```

## 📊 Service Configuration

### Backend (Port 8080)

- **Environment**: Production
- **Database**: MongoDB with authentication
- **Features**: API, WebSocket support, File uploads
- **Health Check**: `/api/health`

### Nginx (Ports 80/443)

- **HTTP → HTTPS redirect**
- **SSL/TLS termination**
- **Reverse proxy to backend**
- **Rate limiting**
- **Security headers**
- **WebSocket support for voice calls**

### MongoDB (Port 27017)

- **Authentication enabled**
- **Persistent data storage**
- **Indexed collections**
- **Automatic initialization**

## 🛡️ Security Features

### SSL/HTTPS
- TLS 1.2 and 1.3 support
- Strong cipher suites
- HSTS headers
- SSL stapling

### Rate Limiting
- API endpoints: 10 requests/second
- WebSocket connections: 5 connections/second
- Login endpoints: 1 request/second

### Security Headers
- Content Security Policy
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection
- Referrer Policy

### Database Security
- MongoDB authentication
- Non-root containers
- Encrypted connections

## 📝 Maintenance

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f nginx
docker-compose logs -f mongodb
```

### Backup Database
```bash
# Create backup
docker-compose exec mongodb mongodump --authenticationDatabase admin -u admin -p password123 --db hackathon --out /backup

# Copy backup from container
docker cp hackathon_mongodb:/backup ./backup
```

### Update Application
```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose up -d --build
```

### SSL Certificate Renewal
```bash
# Renew certificate (run monthly)
sudo certbot renew --dry-run

# Update Docker SSL files
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ssl/
docker-compose restart nginx
```

## 🔍 Troubleshooting

### Common Issues

1. **Cannot connect to database**
   ```bash
   docker-compose logs mongodb
   # Check MongoDB credentials in .env
   ```

2. **SSL certificate errors**
   ```bash
   # Verify certificate files exist
   ls -la ssl/
   # Check Nginx configuration
   docker-compose logs nginx
   ```

3. **API not responding**
   ```bash
   # Check backend logs
   docker-compose logs backend
   # Verify environment variables
   cat .env
   ```

4. **WebSocket connection fails**
   ```bash
   # Check Nginx WebSocket configuration
   # Verify rate limits aren't being hit
   ```

### Performance Monitoring

```bash
# Check resource usage
docker stats

# Monitor disk space
df -h

# Check memory usage
free -h

# View network connections
netstat -tulpn | grep :443
```

## 🌐 Frontend Configuration

Update your frontend API configuration to use your domain:

```typescript
// frontend/src/services/api.ts
const API_BASE_URL = 'https://yourdomain.com/api';
```

## 🔄 CI/CD Integration

For automated deployments, add this to your CI/CD pipeline:

```yaml
# GitHub Actions example
- name: Deploy to VPS
  run: |
    ssh user@your-server 'cd hackathon-backend && git pull && ./deploy.sh production'
```

## 📞 Support

If you encounter issues:

1. Check the logs: `docker-compose logs -f`
2. Verify environment variables: `cat .env`
3. Test individual services: `curl http://localhost:8080/api/health`
4. Check SSL configuration: `openssl s_client -connect yourdomain.com:443`

## 📋 Production Checklist

- [ ] SSL certificate configured and valid
- [ ] Environment variables set correctly
- [ ] Database secured with strong password
- [ ] Nginx configuration updated with your domain
- [ ] Rate limiting configured appropriately
- [ ] Backup strategy implemented
- [ ] Log rotation configured
- [ ] Monitoring setup (optional)
- [ ] Firewall configured (ports 80, 443, 22 only)
- [ ] Regular security updates scheduled

Your backend is now ready for production with HTTPS support! 🎉
