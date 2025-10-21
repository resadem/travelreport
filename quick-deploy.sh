#!/bin/bash

# Quick Deployment Script for 4Travels B2B Portal
# Run this script on your VPS after uploading the files

set -e

echo "=========================================="
echo "4Travels B2B Portal - Quick Deploy"
echo "=========================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}Docker not installed. Please run deploy-vps.sh first.${NC}"
    exit 1
fi

echo -e "${GREEN}Step 1: Preparing environment files...${NC}"
if [ -f "frontend/.env.production" ]; then
    cp frontend/.env.production frontend/.env
    echo -e "${GREEN}✓ Frontend .env configured${NC}"
fi

if [ -f "backend/.env.production" ]; then
    cp backend/.env.production backend/.env
    echo -e "${GREEN}✓ Backend .env configured${NC}"
fi

echo -e "${GREEN}Step 2: Building and starting containers...${NC}"
docker compose down
docker compose up -d --build

echo -e "${GREEN}Step 3: Waiting for services to start...${NC}"
sleep 10

echo -e "${GREEN}Step 4: Checking container status...${NC}"
docker compose ps

echo ""
echo -e "${GREEN}=========================================="
echo "Deployment Complete!"
echo "==========================================${NC}"
echo ""
echo "Container Status:"
docker compose ps
echo ""
echo "Next steps:"
echo "1. Setup SSL: sudo certbot --nginx -d rs.4travels.net"
echo "2. Create admin user (see DEPLOYMENT_GUIDE.md)"
echo "3. Visit: https://rs.4travels.net"
echo ""
echo "View logs: docker compose logs -f"
echo ""
