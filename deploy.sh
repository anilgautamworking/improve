#!/bin/bash
# Frontend deployment script
# Builds and prepares frontend for deployment

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Improve Frontend Deployment${NC}"
echo "=========================================="

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating from example...${NC}"
    if [ -f "env.example" ]; then
        cp env.example .env
        echo -e "${YELLOW}⚠️  Please update .env with production API URL${NC}"
    fi
fi

# Check if API URL is set
if ! grep -q "VITE_API_URL" .env 2>/dev/null || grep -q "localhost" .env 2>/dev/null; then
    echo -e "${YELLOW}⚠️  Warning: VITE_API_URL may not be set for production${NC}"
    echo "Make sure .env contains: VITE_API_URL=https://quiz.devwork.in/api"
fi

# Install dependencies
echo -e "${BLUE}Installing dependencies...${NC}"
npm install

# Build for production
echo -e "${BLUE}Building for production...${NC}"
npm run build

# Check if build was successful
if [ ! -d "dist" ]; then
    echo -e "${RED}❌ Build failed - dist directory not found${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Build complete!${NC}"
echo ""
echo -e "${BLUE}Build output:${NC}"
echo "  Location: $SCRIPT_DIR/dist"
echo "  Size: $(du -sh dist | cut -f1)"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "  1. Copy dist/ folder to your web server"
echo "  2. Configure nginx to serve from dist/"
echo "  3. Set up SSL certificate for quiz.devwork.in"
echo ""

