#!/bin/bash

# Let's Encrypt SSL Certificate Initialization Script
# ==================================================

# Configuration
DOMAIN=${1:-"your-domain.com"}
EMAIL=${2:-"admin@your-domain.com"}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Let's Encrypt SSL Certificate Initialization${NC}"
echo -e "${YELLOW}Domain: $DOMAIN${NC}"
echo -e "${YELLOW}Email: $EMAIL${NC}"
echo ""

# Check if domain is provided
if [ "$DOMAIN" = "your-domain.com" ]; then
    echo -e "${RED}Error: Please provide your domain name as the first argument${NC}"
    echo "Usage: $0 your-domain.com your-email@domain.com"
    exit 1
fi

# Create directories if they don't exist
mkdir -p certbot/conf
mkdir -p certbot/www

# Stop nginx if running
echo -e "${YELLOW}Stopping nginx container...${NC}"
docker compose -f docker-compose.prod.yml stop nginx

# Get initial certificate
echo -e "${YELLOW}Requesting initial SSL certificate...${NC}"
docker run --rm \
    -v "$(pwd)/certbot/conf:/etc/letsencrypt" \
    -v "$(pwd)/certbot/www:/var/www/certbot" \
    certbot/certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    --force-renewal \
    -d "$DOMAIN"

# Check if certificate was obtained successfully
if [ -f "certbot/conf/live/$DOMAIN/fullchain.pem" ]; then
    echo -e "${GREEN}SSL certificate obtained successfully!${NC}"
    
    # Update nginx config with correct domain
    echo -e "${YELLOW}Updating nginx configuration...${NC}"
    sed -i.bak "s/your-domain.com/$DOMAIN/g" nginx/nginx.conf
    
    # Start nginx
    echo -e "${YELLOW}Starting nginx with SSL...${NC}"
    docker compose -f docker-compose.prod.yml up -d nginx
    
    echo -e "${GREEN}SSL setup completed!${NC}"
    echo -e "${GREEN}Your site should now be accessible at: https://$DOMAIN${NC}"
else
    echo -e "${RED}Failed to obtain SSL certificate${NC}"
    echo -e "${YELLOW}Please check:${NC}"
    echo "1. Domain DNS is pointing to this server"
    echo "2. Port 80 is accessible from the internet"
    echo "3. Domain name is correct"
    exit 1
fi 
