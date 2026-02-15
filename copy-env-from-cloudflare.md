# Copy Environment Variables from Cloudflare Pages

Since Cloudflare doesn't expose environment variables via API (for security), you need to copy them manually.

## Quick Steps

### 1. Open Cloudflare Dashboard

Go to: https://dash.cloudflare.com/

### 2. Navigate to Your Project

```
Pages → [Your Project Name] → Settings → Environment variables
```

### 3. Copy the Values

You should see these variables (click "View" to reveal):

- `AZURE_KEY` - Your Azure Speech Service key
- `AZURE_REGION` - Your Azure region (e.g., eastus)
- `GROQ_API_KEY` - Your Groq API key

### 4. Paste into .dev.vars

Edit your local `.dev.vars` file:

```bash
# Open in your editor
nano .dev.vars
# or
code .dev.vars
# or
vim .dev.vars
```

Paste the values:

```
AZURE_KEY=paste_your_azure_key_here
AZURE_REGION=paste_your_region_here
GROQ_API_KEY=paste_your_groq_key_here
```

### 5. Save and Test

```bash
# Test that it works
npm run dev
```

## Alternative: Use Wrangler CLI

If you have wrangler authenticated, you can view (but not export) the variables:

```bash
# Login to Cloudflare
npx wrangler login

# This will open browser for authentication
# Then you can view your projects
npx wrangler pages project list
```

However, you still need to copy the values manually from the dashboard.

## Security Note

⚠️ **Never commit .dev.vars to git!**

The `.gitignore` file already excludes it, but double-check:

```bash
# Verify .dev.vars is gitignored
git check-ignore .dev.vars
# Should output: .dev.vars
```

## Quick Copy Template

Here's a template you can fill in:

```bash
# Copy this to .dev.vars and fill in your values

# Azure Speech Service
AZURE_KEY=
AZURE_REGION=

# Groq API
GROQ_API_KEY=
```

## If You Don't Have the Keys

### Azure Speech Key
1. Go to https://portal.azure.com
2. Navigate to your Speech Service resource
3. Click "Keys and Endpoint"
4. Copy Key 1 and Region

### Groq API Key
1. Go to https://console.groq.com/keys
2. Sign up (free)
3. Create a new API key
4. Copy the key

Then add both to Cloudflare Pages AND your local `.dev.vars`.
