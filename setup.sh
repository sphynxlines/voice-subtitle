#!/bin/bash

# Local Development Setup Script

echo ""
echo "🚀 Voice Subtitle - Local Development Setup"
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed"
    echo "   Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo "✅ npm found"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed"

# Setup .dev.vars if it doesn't exist
if [ ! -f .dev.vars ]; then
    echo ""
    echo "📝 Creating .dev.vars file..."
    cp .dev.vars.example .dev.vars
    echo "✅ .dev.vars created"
    echo ""
    echo "⚠️  IMPORTANT: Edit .dev.vars and add your Azure credentials:"
    echo "   - AZURE_KEY=your_azure_speech_key"
    echo "   - AZURE_REGION=your_region (e.g., eastus)"
    echo ""
    echo "   Get credentials from: https://portal.azure.com"
    echo "   → Your Speech Service → Keys and Endpoint"
else
    echo ""
    echo "✅ .dev.vars already exists"
fi

echo ""
echo "✨ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Edit .dev.vars with your Azure credentials (if not done)"
echo "  2. Run: npm run dev"
echo "  3. Open: http://localhost:8000"
echo ""
echo "For more info, see LOCAL_DEV_GUIDE.md"
echo ""
