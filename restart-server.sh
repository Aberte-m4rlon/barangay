#!/bin/bash

# Server Restart Script for Production
# This script restarts the Node.js application

echo "=========================================="
echo "Restarting Barangay BORS Server"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if PM2 is installed
if command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}Using PM2 to restart...${NC}"
    pm2 restart all
    echo -e "${GREEN}✓ Server restarted with PM2${NC}"
    echo ""
    echo "Check status with: pm2 status"
    echo "View logs with: pm2 logs"
else
    echo -e "${YELLOW}PM2 not found. Looking for Node processes...${NC}"
    
    # Find Node processes
    NODE_PIDS=$(pgrep -f "node.*server.cjs\|node.*index.js")
    
    if [ -z "$NODE_PIDS" ]; then
        echo -e "${RED}✗ No Node.js processes found${NC}"
        echo ""
        echo "Start the server with:"
        echo "  node server.cjs"
        echo "  or"
        echo "  npm start"
    else
        echo -e "${YELLOW}Found Node processes: $NODE_PIDS${NC}"
        echo "Stopping processes..."
        
        # Kill the processes
        kill $NODE_PIDS
        
        sleep 2
        
        echo -e "${GREEN}✓ Processes stopped${NC}"
        echo ""
        echo "Now start the server again:"
        echo "  cd /home/mocogo/barangay.mocogo.site"
        echo "  node server.cjs &"
        echo ""
        echo "Or use PM2 for better process management:"
        echo "  npm install -g pm2"
        echo "  pm2 start server.cjs --name barangay"
    fi
fi

echo ""
echo "=========================================="
echo "Done!"
echo "=========================================="
