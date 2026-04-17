@echo off
REM Setup script for Windows
REM This script helps set up the project for first-time use

echo.
echo ========================================
echo  Hospital Feedback System - Setup
echo ========================================
echo.

REM Check if .env exists
if exist ".env" (
    echo ✓ .env file already exists
    echo   If you want to reconfigure, delete .env and run this script again
    echo.
    goto :docker_check
)

REM Copy .env.example to .env
echo Creating .env file from template...
if exist ".env.example" (
    copy ".env.example" ".env"
    echo ✓ .env file created
    echo.
    echo ⚠️  IMPORTANT: Edit .env file with your credentials:
    echo    1. MongoDB URL (MONGODB_URL)
    echo    2. Gmail App Password (EMAIL_PASSWORD)
    echo    3. Network IP (APP_URL)
    echo.
    echo See SETUP_GUIDE.md for detailed instructions
    echo.
    pause
    goto :docker_check
) else (
    echo ✗ .env.example not found
    exit /b 1
)

:docker_check
REM Check if Docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    echo ✗ Docker is not installed or not in PATH
    echo Install Docker Desktop from: https://www.docker.com/products/docker-desktop
    exit /b 1
)
echo ✓ Docker is installed

REM Check if docker-compose exists
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo ✗ Docker Compose is not installed
    exit /b 1
)
echo ✓ Docker Compose is installed

REM Check if npm is installed
npm --version >nul 2>&1
if errorlevel 1 (
    echo ✗ Node.js/npm is not installed
    echo Install Node.js from: https://nodejs.org/
    exit /b 1
)
echo ✓ Node.js is installed

echo.
echo ========================================
echo  Building Frontend...
echo ========================================
echo.

cd frontend
call npm install
call npm run build
if errorlevel 1 (
    echo ✗ Frontend build failed
    exit /b 1
)
cd ..

echo.
echo ✓ Frontend build successful
echo.
echo ========================================
echo  Starting Docker Services...
echo ========================================
echo.

docker-compose up -d

echo.
echo ✓ Services started!
echo.
echo ========================================
echo  Next Steps:
echo ========================================
echo.
echo 1. Frontend: http://localhost:3000
echo 2. Backend API: http://localhost:8000/docs
echo 3. Login with:
echo    Email: superadmin@hospital.com
echo    Password: SuperAdmin@123
echo.
echo View logs:
echo   docker-compose logs -f
echo.
echo Stop services:
echo   docker-compose down
echo.
pause
