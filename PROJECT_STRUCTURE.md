# Project Structure

## Root Files

### Documentation
- `README.md` - Project overview and quick start
- `QUICK_START.md` - Quick reference guide
- `LOCAL_DEV_GUIDE.md` - Comprehensive development & testing guide
- `CLOUDFLARE_CACHE_FIX.md` - Cache troubleshooting guide
- `DEV_SETUP.md` - Development environment setup
- `CHANGELOG.md` - Version history and changes

### Configuration
- `package.json` - npm configuration and scripts
- `.dev.vars.example` - Environment variables template
- `.gitignore` - Git ignore rules
- `manifest.json` - PWA manifest

### Scripts
- `setup.sh` - Automated setup script
- `local-server.js` - Node.js mock server (for testing without Azure)
- `local-server.py` - Python mock server (alternative)

### Application Pages
- `index.html` - Main application page
- `help.html` - Help page
- `stats.html` - Statistics page
- `sw.js` - Service worker for PWA

## Directory Structure

```
voice-subtitle/
├── .git/                   # Git repository
├── .vscode/               # VS Code settings
├── node_modules/          # npm dependencies (gitignored)
├── .wrangler/            # Wrangler build artifacts (gitignored)
│
├── src/                   # Source code
│   ├── js/               # JavaScript modules
│   │   ├── app.js       # Main application controller
│   │   ├── speech-recognition.js  # Azure Speech SDK integration
│   │   ├── ui-controller.js       # UI management
│   │   ├── text-polisher.js       # Text cleaning
│   │   ├── token-manager.js       # Token lifecycle
│   │   ├── network-monitor.js     # Network status
│   │   ├── wake-lock.js          # Screen wake lock
│   │   ├── config.js             # Configuration
│   │   ├── errors.js             # Error handling
│   │   ├── utils.js              # Utilities
│   │   ├── api.js                # API client
│   │   └── stats-page.js         # Statistics page logic
│   │
│   └── css/              # Stylesheets
│       ├── main.css     # Main application styles
│       ├── help.css     # Help page styles
│       └── stats.css    # Statistics page styles
│
├── functions/            # Cloudflare Functions (serverless)
│   ├── api/             # API endpoints
│   │   ├── token.js    # Azure Speech token endpoint
│   │   └── stats.js    # Usage statistics endpoint
│   │
│   └── utils/          # Shared utilities
│       ├── rate-limit.js    # Rate limiting
│       ├── referer-check.js # Security checks
│       ├── response.js      # Response helpers
│       └── stats.js         # Stats utilities
│
├── script/             # Build/utility scripts
│   └── generate-icon.html  # Icon generator
│
├── icon-192.png       # PWA icon (192x192)
├── icon-512.png       # PWA icon (512x512)
│
├── .env.example       # Environment template (legacy)
├── .dev.vars.example  # Wrangler environment template
├── .dev.vars          # Local environment (gitignored)
├── .gitignore         # Git ignore rules
├── package.json       # npm configuration
├── package-lock.json  # npm lock file
│
└── Documentation files (see above)
```

## Key Files Explained

### Application Core
- **index.html** - Main page with dual subtitle display
- **src/js/app.js** - Orchestrates all components, handles events
- **src/js/speech-recognition.js** - Manages Azure Speech SDK, state machine
- **src/js/ui-controller.js** - Updates UI, coordinates text polishing
- **src/js/text-polisher.js** - Cleans Chinese text (removes filler words)

### Backend (Cloudflare Functions)
- **functions/api/token.js** - Fetches Azure Speech tokens
- **functions/api/stats.js** - Records usage statistics
- **functions/utils/** - Shared utilities for rate limiting, security

### Development
- **package.json** - Defines npm scripts (dev, deploy, etc.)
- **setup.sh** - Automates initial setup
- **local-server.js/py** - Mock servers for testing without Azure
- **.dev.vars** - Local environment variables (not committed)

### PWA
- **manifest.json** - PWA configuration
- **sw.js** - Service worker for offline support and caching
- **icon-*.png** - App icons

## File Count Summary

- **Documentation**: 6 files
- **Configuration**: 4 files
- **Scripts**: 3 files
- **HTML Pages**: 3 files
- **JavaScript Modules**: 11 files
- **CSS Files**: 3 files
- **Cloudflare Functions**: 6 files
- **Assets**: 2 icons

## Removed Files (Cleanup)

The following temporary/debug files were removed:
- `test-button-fix.html` - Diagnostic test
- `debug-button.html` - Button debug test
- `test-layout.html` - Layout test
- `BUTTON_FIX_SUMMARY.md` - Temporary notes
- `BUTTON_FIX_GUIDE.md` - Temporary guide
- `LOCAL_TEST.md` - Redundant (consolidated into LOCAL_DEV_GUIDE.md)
- `RELIABILITY_IMPROVEMENTS.md` - Implementation notes
- `STATE_MACHINE_SIMPLIFIED.md` - Implementation notes
- `DUAL_DISPLAY_FEATURE.md` - Implementation notes
- `HELP_MODAL_IMPLEMENTATION.md` - Implementation notes
- `PWA_HELP_FIX.md` - Implementation notes
- `MERGE_RESOLUTION.md` - Temporary notes
- `IMPROVEMENTS.md` - Temporary notes
- `REFACTORING_COMPLETE.md` - Temporary notes
- `CHINESE_ANDROID_COMPATIBILITY.md` - Temporary notes
- `PERMISSION_SUMMARY.md` - Temporary notes

All relevant information from removed files has been consolidated into:
- README.md
- LOCAL_DEV_GUIDE.md
- CHANGELOG.md

## Documentation Hierarchy

1. **README.md** - Start here for project overview
2. **QUICK_START.md** - Quick commands and testing
3. **LOCAL_DEV_GUIDE.md** - Detailed development guide
4. **CLOUDFLARE_CACHE_FIX.md** - Specific troubleshooting
5. **DEV_SETUP.md** - Environment setup details
6. **CHANGELOG.md** - Version history
7. **PROJECT_STRUCTURE.md** - This file

## Maintenance

### Adding New Features
1. Create feature branch
2. Implement in appropriate module
3. Update tests if needed
4. Update documentation (README.md, CHANGELOG.md)
5. Test locally with `npm run dev`
6. Submit PR

### Updating Documentation
- Keep README.md concise (overview only)
- Put detailed info in LOCAL_DEV_GUIDE.md
- Update CHANGELOG.md for significant changes
- Keep QUICK_START.md as a quick reference

### File Organization Rules
- Keep root directory clean (only essential files)
- Put source code in `src/`
- Put serverless functions in `functions/`
- Put documentation in root (for visibility)
- Put build artifacts in gitignored directories
