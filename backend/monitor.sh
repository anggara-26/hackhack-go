#!/bin/bash

# Simple monitoring script for the hackathon backend
# Usage: ./monitor.sh

echo "🔍 Hackathon Backend Monitoring"
echo "================================"

# Check if Docker Compose is running
if ! docker-compose ps | grep -q "Up"; then
    echo "❌ Some services are not running!"
    docker-compose ps
    exit 1
fi

echo "✅ All services are running"
echo ""

# Service status
echo "📊 Service Status:"
docker-compose ps
echo ""

# Resource usage
echo "💾 Resource Usage:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"
echo ""

# Disk usage
echo "💿 Disk Usage:"
df -h | grep -E "(Filesystem|/dev/)"
echo ""

# API Health Check
echo "🏥 API Health Check:"
if curl -f -s http://localhost:8080/api/health > /dev/null; then
    echo "✅ API is responding"
    echo "Response: $(curl -s http://localhost:8080/api/health | jq -r '.message' 2>/dev/null || echo 'API OK')"
else
    echo "❌ API is not responding"
fi
echo ""

# Database connection check
echo "🗄️  Database Check:"
if docker-compose exec -T mongodb mongo --quiet --eval "db.adminCommand('ismaster')" > /dev/null 2>&1; then
    echo "✅ Database is accessible"
else
    echo "❌ Database connection failed"
fi
echo ""

# SSL certificate check (if domain is configured)
if [ -f "ssl/fullchain.pem" ]; then
    echo "🔒 SSL Certificate:"
    EXPIRY=$(openssl x509 -enddate -noout -in ssl/fullchain.pem | cut -d= -f2)
    echo "Certificate expires: $EXPIRY"
    
    # Check if certificate expires in next 30 days
    if openssl x509 -checkend 2592000 -noout -in ssl/fullchain.pem > /dev/null; then
        echo "✅ Certificate is valid for at least 30 days"
    else
        echo "⚠️  Certificate expires within 30 days!"
    fi
else
    echo "⚠️  SSL certificate not found"
fi
echo ""

# Recent logs (errors only)
echo "📝 Recent Error Logs:"
echo "Backend errors (last 10):"
docker-compose logs --tail=10 backend 2>/dev/null | grep -i error || echo "No recent errors"
echo ""

echo "Nginx errors (last 10):"
docker-compose logs --tail=10 nginx 2>/dev/null | grep -i error || echo "No recent errors"
echo ""

# Network connectivity
echo "🌐 Network Check:"
if ping -c 1 8.8.8.8 > /dev/null 2>&1; then
    echo "✅ Internet connectivity OK"
else
    echo "❌ No internet connectivity"
fi

echo ""
echo "✅ Monitoring complete!"
echo "💡 For detailed logs: docker-compose logs -f [service]"
echo "💡 For real-time monitoring: watch -n 5 ./monitor.sh"
