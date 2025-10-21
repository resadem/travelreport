#!/bin/bash

# Backup Script for 4Travels B2B Portal
# Creates backup of MongoDB database

BACKUP_DIR="/opt/backups/4travels"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="4travels_backup_$DATE"

mkdir -p $BACKUP_DIR

echo "Creating backup: $BACKUP_NAME"

# Backup MongoDB
docker exec travel_mongodb mongodump --out /backup/$BACKUP_NAME
docker cp travel_mongodb:/backup/$BACKUP_NAME $BACKUP_DIR/

# Compress backup
cd $BACKUP_DIR
tar -czf $BACKUP_NAME.tar.gz $BACKUP_NAME
rm -rf $BACKUP_NAME

echo "Backup completed: $BACKUP_DIR/$BACKUP_NAME.tar.gz"

# Keep only last 7 backups
ls -t $BACKUP_DIR/*.tar.gz | tail -n +8 | xargs rm -f 2>/dev/null

echo "Old backups cleaned. Keeping last 7 backups."
