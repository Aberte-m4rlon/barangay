#!/bin/bash

# Deployment Script for barangay.travelrequest.online
# This script helps prepare files for deployment to Hostinger

echo "=========================================="
echo "Barangay BORS - Deployment Preparation"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Create deployment directory
DEPLOY_DIR="deploy_package"
echo -e "${YELLOW}Creating deployment package...${NC}"

# Remove old deployment directory if exists
if [ -d "$DEPLOY_DIR" ]; then
    rm -rf "$DEPLOY_DIR"
fi

# Create new deployment directory
mkdir -p "$DEPLOY_DIR"

# Copy necessary files and folders
echo -e "${YELLOW}Copying files...${NC}"

# Copy directories
cp -r config "$DEPLOY_DIR/"
cp -r controllers "$DEPLOY_DIR/"
cp -r models "$DEPLOY_DIR/"
cp -r public "$DEPLOY_DIR/"
cp -r routes "$DEPLOY_DIR/"
cp -r views "$DEPLOY_DIR/"

# Copy root files
cp index.js "$DEPLOY_DIR/"
cp package.json "$DEPLOY_DIR/"
cp package-lock.json "$DEPLOY_DIR/"
cp setup-mysql.js "$DEPLOY_DIR/"
cp create-database.js "$DEPLOY_DIR/"
cp postcss.config.js "$DEPLOY_DIR/"
cp tailwind.config.js "$DEPLOY_DIR/"
cp .htaccess "$DEPLOY_DIR/"

# Copy documentation
cp HOSTINGER_SUBDOMAIN_DEPLOYMENT.md "$DEPLOY_DIR/"
cp DEPLOYMENT_CHECKLIST.md "$DEPLOY_DIR/"
cp CHAT_FEATURE.md "$DEPLOY_DIR/"
cp .env.production.example "$DEPLOY_DIR/"

# Create uploads directory if it doesn't exist
mkdir -p "$DEPLOY_DIR/public/uploads"

# Create a README for deployment
cat > "$DEPLOY_DIR/DEPLOY_README.txt" << EOF
DEPLOYMENT PACKAGE FOR BARANGAY.TRAVELREQUEST.ONLINE
====================================================

This package contains all files needed for deployment.

IMPORTANT: DO NOT UPLOAD .env FILE
Configure environment variables in cPanel Node.js App settings instead.

STEPS:
1. Upload all files to /public_html/barangay (or your app root)
2. In cPanel, setup Node.js App with environment variables
3. Create MySQL database and user
4. Run NPM Install in Node.js App
5. SSH into server and run:
   - node create-database.js
   - node setup-mysql.js
6. Start the application

See HOSTINGER_SUBDOMAIN_DEPLOYMENT.md for detailed instructions.

Default Admin Credentials:
Username: admin
Password: 123456
Email: admin@barangay.com

CHANGE THE PASSWORD IMMEDIATELY AFTER FIRST LOGIN!
EOF

echo -e "${GREEN}✓ Files copied successfully${NC}"

# Create a zip file
echo -e "${YELLOW}Creating zip archive...${NC}"
if command -v zip &> /dev/null; then
    zip -r "${DEPLOY_DIR}.zip" "$DEPLOY_DIR" -q
    echo -e "${GREEN}✓ Deployment package created: ${DEPLOY_DIR}.zip${NC}"
else
    echo -e "${YELLOW}⚠ zip command not found. Please manually compress the ${DEPLOY_DIR} folder${NC}"
fi

# Summary
echo ""
echo "=========================================="
echo -e "${GREEN}Deployment package ready!${NC}"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Upload ${DEPLOY_DIR}.zip to your Hostinger account"
echo "2. Extract in /public_html/barangay"
echo "3. Follow HOSTINGER_SUBDOMAIN_DEPLOYMENT.md"
echo ""
echo "Files excluded from package:"
echo "  - node_modules (will be installed on server)"
echo "  - .git (version control)"
echo "  - .env (configure in cPanel)"
echo ""
echo -e "${YELLOW}⚠ Remember to configure environment variables in cPanel!${NC}"
echo ""
