# Voice Subtitle 语音字幕

Real-time voice subtitle application with intelligent text polishing for Chinese speech.

## Features

- 🎤 Real-time speech recognition using Azure Speech SDK
- 🧹 Intelligent text polishing (removes filler words)
- 👥 Multi-speaker detection
- 📱 Mobile-first responsive design (iPhone & iPad optimized)
- ⚡ Fast startup with token preloading
- 🔄 Automatic session management and recovery
- 💪 Reliable state machine with error recovery
- 📊 Dual display: raw real-time + polished subtitles

## Quick Start

### Local Development

```bash
# 1. Setup
./setup.sh

# 2. Add Azure credentials to .dev.vars
# Get from: https://portal.azure.com → Speech Service → Keys and Endpoint

# 3. Start development server
npm run dev

# 4. Open http://localhost:8000
```

See [QUICK_START.md](QUICK_START.md) for more options.

### Deploy to Cloudflare Pages

1. Push to GitHub
2. Connect repository to Cloudflare Pages
3. Set environment variables:
   - `AZURE_KEY`
   - `AZURE_REGION`
4. Deploy automatically on push

## Documentation

### Getting Started
- [QUICK_START.md](QUICK_START.md) - Quick reference guide
- [SETUP_CHECKLIST.md](SETUP_CHECKLIST.md) - Step-by-step setup checklist
- [LOCAL_DEV_GUIDE.md](LOCAL_DEV_GUIDE.md) - Comprehensive development & testing

### AI Summarization
- [AI_SUMMARY_SETUP.md](AI_SUMMARY_SETUP.md) - Complete AI setup guide
- [README_CLOUDFLARE.md](README_CLOUDFLARE.md) - Quick Cloudflare setup (5 min)
- [CLOUDFLARE_ENV_SETUP.md](CLOUDFLARE_ENV_SETUP.md) - Detailed Cloudflare guide

### Architecture & Troubleshooting
- [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture and data flow
- [CLOUDFLARE_REGION_ROUTING.md](CLOUDFLARE_REGION_ROUTING.md) - Region routing configuration
- [SETUP_SMART_PLACEMENT.md](SETUP_SMART_PLACEMENT.md) - Quick Smart Placement setup
- [API_KEY_TROUBLESHOOTING.md](API_KEY_TROUBLESHOOTING.md) - API key issues and fixes
- [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) - Code organization
- [CLOUDFLARE_CACHE_FIX.md](CLOUDFLARE_CACHE_FIX.md) - Cache troubleshooting
- [DEV_SETUP.md](DEV_SETUP.md) - Development environment setup

### Quick Commands
```bash
npm run check-env    # Check environment configuration
npm run test-ai      # Test SiliconFlow API connection
npm run dev          # Start development server
npm run deploy       # Deploy to Cloudflare
```


## Project Structure

```
voice-subtitle/
├── index.html              # Main application page
├── help.html               # Help page
├── stats.html              # Statistics page
├── manifest.json           # PWA manifest
├── sw.js                   # Service worker
├── src/
│   ├── js/                 # JavaScript modules
│   │   ├── app.js         # Main controller
│   │   ├── speech-recognition.js
│   │   ├── ui-controller.js
│   │   ├── text-polisher.js
│   │   └── ...
│   └── css/               # Stylesheets
├── functions/
│   ├── api/               # Cloudflare Functions
│   │   ├── token.js      # Azure token endpoint
│   │   └── stats.js      # Usage stats
│   └── utils/            # Shared utilities
├── package.json          # npm configuration
├── .dev.vars.example     # Environment template
└── setup.sh             # Setup script
```

## NPM Scripts

```bash
npm run dev        # Development with real Azure
npm run dev:mock   # Development with mock API
npm run deploy     # Deploy to Cloudflare Pages
```

## Environment Variables

### Local (`.dev.vars`)
```
AZURE_KEY=your_azure_speech_key
AZURE_REGION=eastus
```

### Production (Cloudflare Pages)
Set in Cloudflare Pages → Settings → Environment Variables:
- `AZURE_KEY` - Azure Speech Service key
- `AZURE_REGION` - Azure region
- `RATE_LIMIT` - KV namespace (optional)
- `STATS` - KV namespace (optional)

## Browser Support

- Chrome/Edge (recommended)
- Safari (iOS/macOS)
- Firefox

Note: Microphone requires HTTPS (except localhost)

## Troubleshooting

See [LOCAL_DEV_GUIDE.md](LOCAL_DEV_GUIDE.md) for detailed troubleshooting.

Quick fixes:
- **Button not working**: Check console, clear cache
- **404 /api/token**: Use `npm run dev` not simple HTTP server
- **Old version cached**: Hard reload (Ctrl+Shift+R)

## License

MIT
