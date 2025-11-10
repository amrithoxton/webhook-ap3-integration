# Webhook → AP3 API Integration

A serverless webhook that receives campaign data and merges contacts in AP3 API.

## 🚀 Quick Deploy (2 Minutes)

### Step 1: Create GitHub Repository

1. Go to [GitHub](https://github.com/new)
2. Create a new repository (e.g., `webhook-ap3-integration`)
3. **Do NOT initialize with README** (we'll add files manually)

### Step 2: Add Files to Repository

Create these files in your repository:
```
webhook-ap3-integration/
├── package.json
├── next.config.js
├── tsconfig.json
├── vercel.json
├── .env.local.example
├── README.md
└── app/
    └── api/
        └── webhook/
            └── route.ts
```

**Important:** Create the `app/api/webhook/` directory structure first, then add `route.ts`

### Step 3: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **"Add New Project"**
3. Import your GitHub repository
4. Vercel will auto-detect Next.js settings
5. **Before deploying**, add environment variable:
   - Key: `AP3_API_KEY`
   - Value: `PRV-hoxtonqa-V3DpVoeFd5OFzBKdYvKSVftxKX-8-icBHLFR2DXltz4`
6. Click **"Deploy"**

### Step 4: Get Your Webhook URL

After deployment, your webhook will be available at:
```
https://your-project.vercel.app/api/webhook
```

## 📥 How It Works

### Incoming Webhook Payload
Your webhook receives data from n8n (or any source):
```json
{
  "body": {
    "campaign_id": "691178f5660f74c0f5758533",
    "campaign_name": "n8n test",
    "contact_id": "0068fa1982f804ecb44e2f00",
    "email": "amrit.bonnet@testing10.com",
    "id": "00691179ab9e0ce6a25d4443",
    "run_id": "106911799800000000000000",
    "shape_id": "1",
    "shape_title": "n8n POST",
    "time": "2025-11-10T05:35:39.96729118Z",
    "webhook_id": "6904b1201cef03feeb1566bf",
    "webhook_name": "n8n POST"
  }
}
```

### Processing
1. Extracts `contact_id` from the payload
2. Constructs AP3 API merge request
3. Sends to `https://api.eu.ap3api.com/v1/person/merge`

### Outgoing API Call
```json
{
  "people": [
    {
      "fields": {
        "str::person_id": "0068fa1982f804ecb44e2f00",
        "str:cm:orttoid": "0068fa1982f804ecb44e2f00"
      }
    }
  ],
  "merge_by": ["str::person_id"],
  "merge_strategy": 2
}
```

### Response
```json
{
  "success": true,
  "contact_id": "0068fa1982f804ecb44e2f00",
  "ap3_response": { /* AP3 API response */ },
  "duration_ms": 234
}
```

## 🧪 Testing

### Health Check
```bash
curl https://your-project.vercel.app/api/webhook
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-11-10T12:00:00.000Z",
  "endpoint": "/api/webhook"
}
```

### Test Webhook
```bash
curl -X POST https://your-project.vercel.app/api/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "body": {
      "contact_id": "0068fa1982f804ecb44e2f00",
      "email": "test@example.com"
    }
  }'
```

## 📊 Monitoring

### View Logs in Vercel
1. Go to your Vercel dashboard
2. Click on your project
3. Go to **"Deployments"** → Select latest deployment
4. Click **"Functions"** → `/api/webhook`
5. View real-time logs

### Log Format
```
[WEBHOOK] Received payload: {...}
[WEBHOOK] Extracted contact_id: 0068fa1982f804ecb44e2f00
[AP3] Sending request to AP3 API: {...}
[AP3] API call successful (234ms): {...}
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `AP3_API_KEY` | Your AP3 API key | ✅ Yes |

### Timeout Settings
- Default timeout: 30 seconds
- Modify in `route.ts`: `AbortSignal.timeout(30000)`

## 🛠️ Local Development (Optional)
```bash
# Clone repository
git clone https://github.com/yourusername/webhook-ap3-integration.git
cd webhook-ap3-integration

# Install dependencies
npm install

# Create .env.local file
cp .env.local.example .env.local
# Edit .env.local and add your API key

# Run development server
npm run dev

# Test locally
curl -X POST http://localhost:3000/api/webhook \
  -H "Content-Type: application/json" \
  -d '{"body": {"contact_id": "test123"}}'
```

## 🐛 Troubleshooting

### "Missing contact_id in payload"
- Check that incoming webhook sends `contact_id` field
- Payload can be in `body.contact_id` or `contact_id` (both supported)

### "API configuration error"
- Verify `AP3_API_KEY` is set in Vercel environment variables
- Redeploy after adding environment variables

### "AP3 API call failed"
- Check API key is valid
- Verify contact_id format is correct
- Check logs for detailed error message

### Timeout Errors
- Increase timeout in `route.ts` if needed
- Check AP3 API status

## 📝 Customization

### Change Response Format
Edit `route.ts` around line 115:
```typescript
return NextResponse.json({
  success: true,
  // Add custom fields here
  webhook_id: crypto.randomUUID(),
  processed_at: new Date().toISOString(),
});
```

### Add Validation
Edit `route.ts` around line 43:
```typescript
if (!contactId || !payload.email) {
  return NextResponse.json(
    { success: false, error: 'Missing required fields' },
    { status: 400 }
  );
}
```

### Add Retry Logic
```typescript
let retries = 3;
while (retries > 0) {
  try {
    const response = await fetch(/* ... */);
    if (response.ok) break;
  } catch (error) {
    retries--;
    if (retries === 0) throw error;
    await new Promise(r => setTimeout(r, 1000));
  }
}
```

## 🔒 Security Notes

- API key is stored as environment variable (not in code)
- Webhook accepts POST requests only
- 30-second timeout prevents hanging requests
- All errors are logged but sensitive data is not exposed in responses

## 📚 Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [AP3 API Documentation](https://api.eu.ap3api.com/docs)

## 🆘 Support

If you encounter issues:
1. Check Vercel function logs
2. Verify environment variables are set
3. Test with curl command above
4. Check AP3 API status

---

**Deployment Time:** ~2 minutes  
**Zero Configuration Required** ✨
