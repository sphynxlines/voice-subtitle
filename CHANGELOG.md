# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2026-02-15

### Added
- Real-time speech recognition with Azure Speech SDK
- Dual display: raw real-time + polished subtitles
- Intelligent text polishing (removes Chinese filler words)
- Multi-speaker detection
- Mobile-first responsive design (iPhone & iPad optimized)
- Token preloading for faster startup
- Automatic session management and recovery
- Reliable state machine with error recovery
- Session health monitoring (auto-restart at 8.5 minutes)
- Network status monitoring
- Wake lock for long sessions
- PWA support with service worker
- Cloudflare Functions for token management
- Rate limiting and usage statistics
- Comprehensive local development setup with Wrangler
- Mock servers for testing without Azure credentials

### Features
- **Performance**: Token preloading, transcriber persistence, hover prewarm
- **Reliability**: Health checks, auto-recovery, timeout protection
- **UX**: Dual subtitle display, clean mobile layout, instant feedback
- **Developer**: npm-based workflow, live reload, comprehensive docs

### Documentation
- README.md - Project overview
- QUICK_START.md - Quick reference
- LOCAL_DEV_GUIDE.md - Comprehensive development guide
- CLOUDFLARE_CACHE_FIX.md - Cache troubleshooting
- DEV_SETUP.md - Environment setup

## Development History

### Phase 1: Core Functionality
- Initial speech recognition implementation
- Basic UI with single subtitle display
- Azure Speech SDK integration

### Phase 2: Performance Optimization
- Token preloading on page load
- Transcriber persistence and reuse
- Hover/touch prewarm on start button
- Health checks for token/transcriber freshness

### Phase 3: Reliability Improvements
- Simplified state machine (single source of truth)
- Automatic recovery with forceReset()
- Session health monitoring
- Automatic session restart before token expiry
- Race condition prevention
- Timeout protection on operations

### Phase 4: Dual Display Feature
- Split screen: raw (top) + polished (bottom)
- Text polisher with regex-based cleaning
- Removes Chinese filler words
- 500ms debounced updates
- Independent scrolling

### Phase 5: Mobile Optimization
- Fixed viewport height for iOS Safari
- iPad-specific layout fixes
- Simplified UI (removed font controls)
- Equal space for both subtitle areas

### Phase 6: Development Experience
- npm-based workflow with Wrangler
- Mock servers for testing
- Comprehensive documentation
- Setup automation
- Diagnostic tools

## Known Issues

None currently. See GitHub issues for any reported problems.

## Future Enhancements

Potential improvements for future versions:
- Additional language support
- Customizable filler word lists
- Export subtitle history
- Keyboard shortcuts
- Theme customization
- Offline mode improvements
