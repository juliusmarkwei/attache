# 📧 Gmail Webhook Setup Guide

## 🚀 Quick Setup

Your Gmail webhook is now configured to work with OAuth2 credentials. Here's how to complete the setup:

### 1. Get Access Tokens

1. **Visit the auth URL** to authorize Gmail access:

    ```
    http://localhost:3000/api/gmail/auth
    ```

2. **Follow the OAuth flow**:
    - Click the generated auth URL
    - Sign in with your Google account
    - Grant Gmail permissions
    - Copy the access and refresh tokens

3. **Add tokens to your `.env.local`**:
    ```bash
    GMAIL_ACCESS_TOKEN=your_access_token_here
    GMAIL_REFRESH_TOKEN=your_refresh_token_here
    ```

### 2. Test the Webhook

1. **Check status**:

    ```bash
    curl http://localhost:3000/api/gmail/status
    ```

2. **Test webhook endpoint**:
    ```bash
    curl -X POST http://localhost:3000/api/gmail/webhook \
      -H "Content-Type: application/json" \
      -d '{"historyId":"12345"}'
    ```

### 3. Configure Gmail Push Notifications

For production, you'll need to:

1. **Deploy your app** to a public URL
2. **Set up Gmail watch** using the Gmail API
3. **Configure webhook URL** to point to your deployed endpoint

### 4. Environment Variables

Your `.env.local` should include:

```bash
# OAuth2 Credentials
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000

# Gmail Access Tokens (after OAuth flow)
GMAIL_ACCESS_TOKEN=your_access_token
GMAIL_REFRESH_TOKEN=your_refresh_token

# Optional: Pub/Sub Topic
GOOGLE_PROJECT_TOPIC_NAME=projects/your-project/topics/gmail-inbox
```

## 🔧 How It Works

### Email Processing Flow

1. **Gmail sends webhook** to `/api/gmail/webhook`
2. **Webhook processes** email history changes
3. **Extracts company names** from email subjects
4. **Downloads attachments** from Gmail
5. **Uploads files** to Convex storage
6. **Creates/updates companies** in database
7. **Links documents** to companies

### Company Extraction

The system automatically extracts company names using patterns like:

- `Invoice: Company Name`
- `Document - Company Name`
- `Re: Company Name`
- Capitalized word sequences

### Supported Features

- ✅ **Automatic company creation** from email data
- ✅ **Attachment processing** (PDF, images, documents)
- ✅ **Real-time document storage** in Convex
- ✅ **Company metadata** tracking
- ✅ **Error handling** and logging

## 🎯 Next Steps

1. **Complete OAuth flow** to get access tokens
2. **Add tokens** to your environment variables
3. **Test with sample emails** containing attachments
4. **Deploy to production** with public webhook URL
5. **Configure Gmail push notifications** for automatic processing

---

The webhook is ready to process emails and automatically organize documents by company! 🎉
