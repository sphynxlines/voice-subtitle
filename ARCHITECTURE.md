# Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER DEVICE                              │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    Browser (Frontend)                       │ │
│  │                                                              │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │ │
│  │  │ Speech Input │  │ UI Controller│  │  AI Client   │     │ │
│  │  │  (Microphone)│  │  (Display)   │  │  (Summary)   │     │ │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │ │
│  │         │                  │                  │              │ │
│  └─────────┼──────────────────┼──────────────────┼─────────────┘ │
│            │                  │                  │                │
└────────────┼──────────────────┼──────────────────┼────────────────┘
             │                  │                  │
             ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Cloudflare Edge Network                       │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              Cloudflare Pages (Static Assets)               │ │
│  │  • index.html                                               │ │
│  │  • CSS, JS files                                            │ │
│  │  • Service Worker                                           │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │           Cloudflare Functions (Serverless API)             │ │
│  │                                                              │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │ │
│  │  │ /api/token   │  │/api/summarize│  │  /api/stats  │     │ │
│  │  │ (Azure Auth) │  │ (AI Summary) │  │  (Analytics) │     │ │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │ │
│  │         │                  │                  │              │ │
│  │  ┌──────▼──────────────────▼──────────────────▼──────────┐ │ │
│  │  │         Environment Variables (Secrets)                │ │ │
│  │  │  • AZURE_KEY                                           │ │ │
│  │  │  • AZURE_REGION                                        │ │ │
│  │  │  • SILICONFLOW_API_KEY  ← YOU SET THIS                │ │ │
│  │  └────────────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
             │                  │                  │
             ▼                  ▼                  ▼
┌─────────────────────┐  ┌─────────────────────┐  ┌──────────────┐
│   Azure Speech      │  │   SiliconFlow AI    │  │  Cloudflare  │
│   Service (China)   │  │   (China-friendly)  │  │     KV       │
│                     │  │                     │  │   (Storage)  │
│  • Speech-to-Text   │  │  • DeepSeek-V3     │  │              │
│  • Real-time        │  │  • Summarization   │  │  • Stats     │
│  • Continuous       │  │  • Chinese support │  │  • Rate Limit│
└─────────────────────┘  └─────────────────────┘  └──────────────┘
```

## Data Flow

### 1. Speech Recognition Flow

```
User speaks
    ↓
Microphone captures audio
    ↓
Azure Speech SDK (in browser)
    ↓
Requests token from /api/token
    ↓
Cloudflare Function validates request
    ↓
Returns Azure token (9 min expiry)
    ↓
SDK connects to Azure Speech Service
    ↓
Real-time transcription
    ↓
Display in UI
```

### 2. AI Summarization Flow

```
User clicks "停止"
    ↓
Frontend collects transcript array
    ↓
POST /api/summarize
    {
      transcript: [
        { speaker: 'A', text: '...', timestamp: ... },
        { speaker: 'B', text: '...', timestamp: ... }
      ]
    }
    ↓
Cloudflare Function receives request
    ↓
Validates referer (security)
    ↓
Gets SILICONFLOW_API_KEY from env
    ↓
Formats conversation for AI
    ↓
Calls SiliconFlow API
    POST https://api.siliconflow.cn/v1/chat/completions
    {
      model: "deepseek-ai/DeepSeek-V3",
      messages: [
        { role: "system", content: "..." },
        { role: "user", content: "请总结..." }
      ]
    }
    ↓
SiliconFlow processes with DeepSeek-V3
    ↓
Returns summary in Chinese
    ↓
Cloudflare Function returns to frontend
    ↓
Display summary in UI
```

## Environment Variables

### Local Development (.dev.vars)

```
AZURE_KEY=xxx                    # Azure Speech Service key
AZURE_REGION=eastasia            # Azure region
SILICONFLOW_API_KEY=sk-xxx       # SiliconFlow API key
```

### Production (Cloudflare Dashboard)

```
Settings → Environment variables:

Name: AZURE_KEY
Value: [your Azure key]
Environment: Production, Preview

Name: AZURE_REGION  
Value: eastasia
Environment: Production, Preview

Name: SILICONFLOW_API_KEY
Value: sk-[your SiliconFlow key]
Environment: Production, Preview
```

## Security Layers

```
┌─────────────────────────────────────────────────────────────┐
│                     Security Measures                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Referer Check                                           │
│     ✓ Only allowed domains can call API                     │
│     ✓ Prevents unauthorized usage                           │
│                                                              │
│  2. API Keys in Backend Only                                │
│     ✓ Never exposed to frontend/browser                     │
│     ✓ Stored in Cloudflare environment                      │
│                                                              │
│  3. Rate Limiting (optional)                                │
│     ✓ Prevents abuse                                        │
│     ✓ Uses Cloudflare KV                                    │
│                                                              │
│  4. HTTPS Only                                              │
│     ✓ All traffic encrypted                                 │
│     ✓ Cloudflare SSL/TLS                                    │
│                                                              │
│  5. Token Expiry                                            │
│     ✓ Azure tokens expire in 10 minutes                     │
│     ✓ Auto-refresh before expiry                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Feature Flags

```javascript
// src/js/config.js

export const CONFIG = {
  FEATURES: {
    ENABLE_SUMMARY: false  // ← Toggle AI summarization
  }
};
```

**When to enable**:
- ✅ SILICONFLOW_API_KEY is configured
- ✅ Test script passes (`npm run test-ai`)
- ✅ Ready for production use

**When to disable**:
- ❌ API key not available
- ❌ Want to reduce costs
- ❌ Debugging other features

## Error Handling

```
┌─────────────────────────────────────────────────────────────┐
│                    Error Handling Flow                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  API Call                                                    │
│    ↓                                                         │
│  Try with timeout (45s)                                      │
│    ↓                                                         │
│  ┌─ Success? ────────────────────────────────────┐          │
│  │                                                │          │
│  YES                                             NO          │
│  │                                                │          │
│  ↓                                                ↓          │
│  Return summary                          Check error type   │
│  Display to user                                 │          │
│                                                  ↓          │
│                                    ┌─────────────┴─────────┐│
│                                    │                       ││
│                              401 Unauthorized      500 Error││
│                                    │                       ││
│                                    ↓                       ↓│
│                            Don't retry            Retry 2x ││
│                            Show error             Backoff  ││
│                                                             │
│                              429 Rate Limit                 │
│                                    │                        │
│                                    ↓                        │
│                              Retry with backoff             │
│                              (2^attempt * 1000ms)           │
│                                                             │
│  All errors → User-friendly Chinese message                 │
│  App continues working (graceful degradation)               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Deployment Flow

```
Local Development:
  git commit
  git push
    ↓
GitHub Repository
    ↓
Cloudflare Pages (auto-deploy)
    ↓
  Build process
    ↓
  Deploy to edge
    ↓
  Available globally
    ↓
  Users access via CDN
```

## Performance Characteristics

| Component | Latency | Notes |
|-----------|---------|-------|
| Static assets | <50ms | Cloudflare CDN |
| Token API | ~100ms | Cloudflare Function |
| Azure Speech | Real-time | WebSocket connection |
| AI Summary | 2-5s | SiliconFlow API call |
| Total page load | <1s | PWA with caching |

## Scalability

```
┌─────────────────────────────────────────────────────────────┐
│                    Cloudflare Edge Network                   │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Beijing │  │ Shanghai │  │ Shenzhen │  │  Tokyo   │   │
│  │   Edge   │  │   Edge   │  │   Edge   │  │   Edge   │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
│       │             │              │             │          │
│       └─────────────┴──────────────┴─────────────┘          │
│                          │                                   │
│                    Global Network                            │
│                                                              │
│  • Auto-scaling                                             │
│  • DDoS protection                                          │
│  • Load balancing                                           │
│  • 200+ data centers                                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Cost Structure

| Service | Cost | Notes |
|---------|------|-------|
| Cloudflare Pages | Free | Unlimited bandwidth |
| Cloudflare Functions | Free tier | 100k requests/day |
| Azure Speech | Pay-per-use | ~¥0.01/minute |
| SiliconFlow AI | ~¥0.001/request | DeepSeek-V3 |
| **Total** | **Very low** | Mostly free tier |

