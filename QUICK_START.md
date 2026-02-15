# Quick Start Guide

## For E2E Testing (Recommended)

```bash
# 1. Install
npm install

# 2. Setup credentials
cp .dev.vars.example .dev.vars
# Edit .dev.vars and add your AZURE_KEY and AZURE_REGION

# 3. Run
npm run dev

# 4. Test
# Open http://localhost:8000
# Click "开始" → Grant mic permission → Speak
```

## For UI Testing Only (No Azure Needed)

```bash
# Option 1: Mock server
npm run dev:mock

# Option 2: Python
python3 local-server.py

# Option 3: Simple HTTP server
python3 -m http.server 8000
```

## Get Azure Credentials

1. Go to https://portal.azure.com
2. Navigate to your Speech Service
3. Click "Keys and Endpoint"
4. Copy:
   - Key 1 → `AZURE_KEY`
   - Location/Region → `AZURE_REGION`

## Test Checklist

- [ ] Page loads
- [ ] Two subtitle sections visible
- [ ] Click "开始" button
- [ ] Grant microphone permission
- [ ] Speak: "嗯...那个...我觉得...这个方案很好"
- [ ] Top shows: "A: 嗯...那个...我觉得...这个方案很好"
- [ ] Bottom shows: "A: 我觉得 方案很好"
- [ ] Click "停止"
- [ ] Can restart

## Troubleshooting

| Issue | Fix |
|-------|-----|
| 404 /api/token | Use `npm run dev` not python server |
| Button not working | Check console, clear cache |
| Old version | Hard reload: Ctrl+Shift+R |
| No microphone | Use localhost or HTTPS |

## More Info

- Full guide: [LOCAL_DEV_GUIDE.md](LOCAL_DEV_GUIDE.md)
- Cache issues: [CLOUDFLARE_CACHE_FIX.md](CLOUDFLARE_CACHE_FIX.md)
- Project overview: [README.md](README.md)
