#!/bin/bash

# Interactive script to setup .dev.vars from Cloudflare

echo ""
echo "🔑 Setup Local Environment Variables"
echo ""
echo "This script will help you copy environment variables from Cloudflare Pages"
echo "to your local .dev.vars file."
echo ""

# Check if .dev.vars already exists
if [ -f .dev.vars ]; then
    echo "⚠️  .dev.vars already exists"
    read -p "Do you want to overwrite it? (y/N): " OVERWRITE
    if [[ ! $OVERWRITE =~ ^[Yy]$ ]]; then
        echo "Cancelled."
        exit 0
    fi
fi

echo ""
echo "📋 Please get your environment variables from Cloudflare:"
echo ""
echo "   1. Go to: https://dash.cloudflare.com/"
echo "   2. Navigate to: Pages → [Your Project] → Settings → Environment variables"
echo "   3. Click 'View' on each variable to reveal the value"
echo ""
echo "Press Enter when ready to continue..."
read

echo ""
echo "Enter your environment variables:"
echo ""

# Prompt for Azure Key
read -p "AZURE_KEY: " AZURE_KEY
if [ -z "$AZURE_KEY" ]; then
    echo "❌ AZURE_KEY is required"
    exit 1
fi

# Prompt for Azure Region
read -p "AZURE_REGION (e.g., eastus): " AZURE_REGION
if [ -z "$AZURE_REGION" ]; then
    echo "❌ AZURE_REGION is required"
    exit 1
fi

# Prompt for Groq Key
read -p "GROQ_API_KEY: " GROQ_API_KEY
if [ -z "$GROQ_API_KEY" ]; then
    echo "❌ GROQ_API_KEY is required"
    exit 1
fi

# Create .dev.vars file
cat > .dev.vars << EOF
# Local Development Environment Variables
# Copied from Cloudflare Pages

# Azure Speech Service Credentials
AZURE_KEY=$AZURE_KEY
AZURE_REGION=$AZURE_REGION

# Groq API Key (for LLM summarization)
GROQ_API_KEY=$GROQ_API_KEY

# These are automatically provided by Cloudflare Pages in production
# For local testing, you can leave these empty (rate limiting will be disabled)
# RATE_LIMIT=
# STATS=
EOF

echo ""
echo "✅ .dev.vars created successfully!"
echo ""
echo "🚀 You can now run:"
echo "   npm run dev"
echo ""

