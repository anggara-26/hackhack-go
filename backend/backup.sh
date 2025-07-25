# Backup script for hackathon backend
# Usage: ./backup.sh

#!/bin/bash

BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="hackathon_backup_$DATE"

echo "🔄 Starting backup process..."

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup MongoDB data
echo "📦 Backing up MongoDB..."
docker-compose exec -T mongodb mongodump --out /tmp/backup
docker-compose cp mongodb:/tmp/backup $BACKUP_DIR/$BACKUP_NAME/mongodb
docker-compose exec -T mongodb rm -rf /tmp/backup

# Backup uploaded files (if any)
if [ -d "./uploads" ]; then
    echo "📁 Backing up uploaded files..."
    cp -r ./uploads $BACKUP_DIR/$BACKUP_NAME/
fi

# Backup configuration files
echo "⚙️  Backing up configuration..."
mkdir -p $BACKUP_DIR/$BACKUP_NAME/config
cp docker-compose.yml $BACKUP_DIR/$BACKUP_NAME/config/
cp .env $BACKUP_DIR/$BACKUP_NAME/config/ 2>/dev/null || echo "No .env file found"
cp -r nginx/ $BACKUP_DIR/$BACKUP_NAME/config/ 2>/dev/null || echo "No nginx config found"

# Backup SSL certificates
if [ -d "./ssl" ]; then
    echo "🔒 Backing up SSL certificates..."
    cp -r ./ssl $BACKUP_DIR/$BACKUP_NAME/
fi

# Create compressed archive
echo "🗜️  Compressing backup..."
cd $BACKUP_DIR
tar -czf $BACKUP_NAME.tar.gz $BACKUP_NAME/
rm -rf $BACKUP_NAME/
cd ..

echo "✅ Backup completed: $BACKUP_DIR/$BACKUP_NAME.tar.gz"

# Clean up old backups (keep last 5)
echo "🧹 Cleaning up old backups..."
cd $BACKUP_DIR
ls -t *.tar.gz | tail -n +6 | xargs -r rm
cd ..

echo "✅ Backup process finished!"
