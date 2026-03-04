@echo off
REM PostGenie AI - Development Setup Script (Windows)
REM This script helps you get started quickly

echo.
echo 🚀 PostGenie AI - Development Setup
echo ====================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    exit /b 1
)

echo ✅ Node.js version:
node --version

REM Check if AWS CLI is installed
where aws >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ⚠️  AWS CLI is not installed. You'll need it for deployment.
    echo    Install from: https://aws.amazon.com/cli/
)

REM Check if CDK is installed
where cdk >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ⚠️  AWS CDK is not installed. Installing globally...
    call npm install -g aws-cdk
)

echo ✅ AWS CDK version:
cdk --version
echo.

REM Install dependencies
echo 📦 Installing dependencies...
call npm install
echo ✅ Dependencies installed
echo.

REM Build backend
echo 🔨 Building backend...
cd backend
call npm run build
cd ..
echo ✅ Backend built
echo.

REM Setup frontend environment
echo ⚙️  Setting up frontend environment...
if not exist frontend\.env (
    copy frontend\.env.example frontend\.env
    echo ✅ Created frontend\.env (you'll need to update the API URL after deployment)
) else (
    echo ✅ frontend\.env already exists
)
echo.

REM Setup backend environment
echo ⚙️  Setting up backend environment...
if not exist backend\.env (
    copy backend\.env.example backend\.env
    echo ✅ Created backend\.env
) else (
    echo ✅ backend\.env already exists
)
echo.

echo ✨ Setup complete!
echo.
echo Next steps:
echo 1. Configure AWS credentials: aws configure
echo 2. Deploy infrastructure: cd infrastructure ^&^& cdk deploy
echo 3. Update frontend\.env with your API Gateway URL
echo 4. Run frontend: cd frontend ^&^& npm run dev
echo.
echo For detailed instructions, see RUNNING.md
echo.
pause
