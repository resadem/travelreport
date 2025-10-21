#!/bin/bash

# Package application for VPS deployment
# This script creates a deployment-ready package

echo "=========================================="
echo "Creating Deployment Package"
echo "=========================================="

PACKAGE_NAME="4travels-portal-deploy.tar.gz"
TEMP_DIR="4travels-portal-package"

# Create temporary directory
rm -rf $TEMP_DIR
mkdir -p $TEMP_DIR

echo "Copying files..."

# Copy application files
cp -r backend $TEMP_DIR/
cp -r frontend $TEMP_DIR/

# Copy deployment files
cp Dockerfile.backend $TEMP_DIR/
cp Dockerfile.frontend $TEMP_DIR/
cp docker-compose.yml $TEMP_DIR/
cp nginx-vps.conf $TEMP_DIR/
cp nginx.conf $TEMP_DIR/
cp deploy-vps.sh $TEMP_DIR/
cp quick-deploy.sh $TEMP_DIR/
cp backup.sh $TEMP_DIR/
cp .dockerignore $TEMP_DIR/
cp DEPLOYMENT_GUIDE.md $TEMP_DIR/
cp README_DEPLOYMENT.md $TEMP_DIR/

# Clean up unnecessary files
echo "Cleaning up..."
rm -rf $TEMP_DIR/backend/__pycache__
rm -rf $TEMP_DIR/backend/*.pyc
rm -rf $TEMP_DIR/frontend/node_modules
rm -rf $TEMP_DIR/frontend/build
rm -rf $TEMP_DIR/frontend/.env.local
rm -rf $TEMP_DIR/backend/.env.local

# Create tarball
echo "Creating archive..."
tar -czf $PACKAGE_NAME $TEMP_DIR/

# Cleanup
rm -rf $TEMP_DIR

echo ""
echo "=========================================="
echo "Package created: $PACKAGE_NAME"
echo "=========================================="
echo ""
echo "File size: $(du -h $PACKAGE_NAME | cut -f1)"
echo ""
echo "Upload to your VPS:"
echo "  scp $PACKAGE_NAME root@YOUR_VPS_IP:/root/"
echo ""
echo "Then on your VPS:"
echo "  cd /root"
echo "  tar -xzf $PACKAGE_NAME"
echo "  mv 4travels-portal-package /opt/4travels-portal"
echo "  cd /opt/4travels-portal"
echo "  sudo bash deploy-vps.sh"
echo "  sudo bash quick-deploy.sh"
echo ""
