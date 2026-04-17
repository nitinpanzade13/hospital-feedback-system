#!/bin/bash
# Setup script for macOS and Linux
# This script helps set up the project for first-time use

set -e

echo ""
echo "========================================"
echo " Hospital Feedback System - Setup"
echo "========================================"
echo ""

# Check if .env exists
if [ -f ".env" ]; then
    echo "✓ .env file already exists"
    echo "  If you want to reconfigure, delete .env and run this script again"
    echo ""
else
    # Copy .env.example to .env
    if [ -f ".env.example" ]; then
        echo "Creating .env file from template..."
        cp ".env.example" ".env"
        echo "✓ .env file created"
        echo ""
        echo "⚠️  IMPORTANT: Edit .env file with your credentials:"
        echo "   1. MongoDB URL (MONGODB_URL)"
        echo "   2. Gmail App Password (EMAIL_PASSWORD)"
        echo "   3. Network IP (APP_URL)"
        echo ""
        echo "See SETUP_GUIDE.md for detailed instructions"
        echo ""
        read -p "Press Enter once you've configured .env..."
    else
        echo "✗ .env.example not found"
        exit 1
    fi
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "✗ Docker is not installed"
    echo "Install Docker Desktop from: https://www.docker.com/products/docker-desktop"
    exit 1
fi
echo "✓ Docker is installed"

# Check if docker-compose exists
if ! command -v docker-compose &> /dev/null; then
    echo "✗ Docker Compose is not installed"
    exit 1
fi
echo "✓ Docker Compose is installed"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "✗ Node.js/npm is not installed"
    echo "Install Node.js from: https://nodejs.org/"
    exit 1
fi
echo "✓ Node.js is installed"

echo ""
echo "========================================"
echo " Building Frontend..."
echo "========================================"
echo ""

cd frontend
npm install
npm run build
cd ..

echo ""
echo "✓ Frontend build successful"
echo ""
echo "========================================"
echo " Starting Docker Services..."
echo "========================================"
echo ""

docker-compose up -d

echo ""
echo "✓ Services started!"
echo ""
echo "========================================"
echo " Next Steps:"
echo "========================================"
echo ""
echo "1. Frontend: http://localhost:3000"
echo "2. Backend API: http://localhost:8000/docs"
echo "3. Login with:"
echo "   Email: superadmin@hospital.com"
echo "   Password: SuperAdmin@123"
echo ""
echo "View logs:"
echo "  docker-compose logs -f"
echo ""
echo "Stop services:"
echo "  docker-compose down"
echo ""
