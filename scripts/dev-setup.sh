#!/bin/bash

# PostGenie AI - Development Setup Script
# This script helps you get started quickly

set -e

echo "🚀 PostGenie AI - Development Setup"
echo "===================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "⚠️  AWS CLI is not installed. You'll need it for deployment."
    echo "   Install from: https://aws.amazon.com/cli/"
fi

# Check if CDK is installed
if ! command -v cdk &> /dev/null; then
    echo "⚠️  AWS CDK is not installed. Installing globally..."
    npm install -g aws-cdk
fi

echo "✅ AWS CDK version: $(cdk --version)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install
echo "✅ Dependencies installed"
echo ""

# Build backend
echo "🔨 Building backend..."
cd backend
npm run build
cd ..
echo "✅ Backend built"
echo ""

# Setup frontend environment
echo "⚙️  Setting up frontend environment..."
if [ ! -f frontend/.env ]; then
    cp frontend/.env.example frontend/.env
    echo "✅ Created frontend/.env (you'll need to update the API URL after deployment)"
else
    echo "✅ frontend/.env already exists"
fi
echo ""

# Setup backend environment
echo "⚙️  Setting up backend environment..."
if [ ! -f backend/.env ]; then
    cp backend/.env.example backend/.env
    echo "✅ Created backend/.env"
else
    echo "✅ backend/.env already exists"
fi
echo ""

echo "✨ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Configure AWS credentials: aws configure"
echo "2. Deploy infrastructure: cd infrastructure && cdk deploy"
echo "3. Update frontend/.env with your API Gateway URL"
echo "4. Run frontend: cd frontend && npm run dev"
echo ""
echo "For detailed instructions, see RUNNING.md"
