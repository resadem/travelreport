#!/bin/bash

# 4Travels B2B Portal Deployment Script
# For Ubuntu 22.04 VPS
# Domain: rs.4travels.net

set -e

echo "=========================================="
echo "4Travels B2B Portal - Deployment Script"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root or with sudo${NC}"
    exit 1
fi

echo -e "${GREEN}Step 1: Updating system packages...${NC}"
apt update && apt upgrade -y

echo -e "${GREEN}Step 2: Installing Docker and Docker Compose...${NC}"
# Install Docker
if ! command -v docker &> /dev/null; then
    apt install -y ca-certificates curl gnupg lsb-release
    mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    apt update
    apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    systemctl enable docker
    systemctl start docker
    echo -e "${GREEN}✓ Docker installed successfully${NC}"
else
    echo -e "${YELLOW}✓ Docker already installed${NC}"
fi

echo -e "${GREEN}Step 3: Installing Nginx...${NC}"
if ! command -v nginx &> /dev/null; then
    apt install -y nginx
    systemctl enable nginx
    echo -e "${GREEN}✓ Nginx installed successfully${NC}"
else
    echo -e "${YELLOW}✓ Nginx already installed${NC}"
fi

echo -e "${GREEN}Step 4: Installing Certbot for SSL...${NC}"
if ! command -v certbot &> /dev/null; then
    apt install -y certbot python3-certbot-nginx
    echo -e "${GREEN}✓ Certbot installed successfully${NC}"
else
    echo -e "${YELLOW}✓ Certbot already installed${NC}"
fi

echo -e "${GREEN}Step 5: Creating application directory...${NC}"
APP_DIR="/opt/4travels-portal"
mkdir -p $APP_DIR
echo -e "${GREEN}✓ Application directory created: $APP_DIR${NC}"

echo -e "${GREEN}Step 6: Configuring Nginx...${NC}"
# Copy nginx configuration
if [ -f "./nginx-vps.conf" ]; then
    cp ./nginx-vps.conf /etc/nginx/sites-available/4travels
    ln -sf /etc/nginx/sites-available/4travels /etc/nginx/sites-enabled/4travels
    rm -f /etc/nginx/sites-enabled/default
    nginx -t && systemctl reload nginx
    echo -e "${GREEN}✓ Nginx configured successfully${NC}"
else
    echo -e "${RED}✗ nginx-vps.conf not found${NC}"
fi

echo -e "${GREEN}Step 7: Configuring firewall...${NC}"
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
echo -e "${GREEN}✓ Firewall configured${NC}"

echo ""
echo -e "${GREEN}=========================================="
echo "Installation Complete!"
echo "==========================================${NC}"
echo ""
echo "Next steps:"
echo "1. Copy your application files to: $APP_DIR"
echo "2. Navigate to the directory: cd $APP_DIR"
echo "3. Update frontend/.env with: REACT_APP_BACKEND_URL=https://rs.4travels.net"
echo "4. Run: docker compose up -d"
echo "5. Setup SSL: certbot --nginx -d rs.4travels.net"
echo ""
echo "Useful commands:"
echo "  - View logs: docker compose logs -f"
echo "  - Stop services: docker compose down"
echo "  - Restart services: docker compose restart"
echo ""
