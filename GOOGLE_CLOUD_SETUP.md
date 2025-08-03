# ☁️ Google Cloud Pub/Sub Setup Guide

This guide will help you set up Google Cloud Pub/Sub to enable Gmail push notifications for your Attache application.

## 🚀 Prerequisites

1. **Google Cloud Project** with billing enabled
2. **Gmail API** enabled in your project
3. **OAuth2 credentials** configured (already done)
4. **Google Cloud CLI** installed (optional but recommended)

## 📋 Step-by-Step Setup

### 1. Enable Required APIs

Go to the [Google Cloud Console](https://console.cloud.google.com/) and enable these APIs:

- **Gmail API**: `gmail.googleapis.com`
- **Pub/Sub API**: `pubsub.googleapis.com`

### 2. Create a Pub/Sub Topic

#### Option A: Using Google Cloud Console

1. Navigate to **Pub/Sub** > **Topics** in Google Cloud Console
2. Click **"Create Topic"**
3. Enter topic ID: `gmail-inbox`
4. Click **"Create"**

#### Option B: Using gcloud CLI

```bash
# Set your project ID
gcloud config set project YOUR_PROJECT_ID

# Create the topic
gcloud pubsub topics create gmail-inbox
```

### 3. Create a Pub/Sub Subscription

#### Option A: Using Google Cloud Console

1. Go to **Pub/Sub** > **Subscriptions**
2. Click **"Create Subscription"**
3. Enter subscription ID: `gmail-webhook-subscription`
4. Select topic: `gmail-inbox`
5. Choose **"Push"** delivery type
6. Enter endpoint URL: `https://your-domain.com/api/gmail/webhook`
7. Set **Acknowledgement deadline**: 10 seconds
8. Click **"Create"**

#### Option B: Using gcloud CLI

```bash
# Create push subscription
gcloud pubsub subscriptions create gmail-webhook-subscription \
  --topic=gmail-inbox \
  --push-endpoint=https://your-domain.com/api/gmail/webhook \
  --ack-deadline=10
```

### 4. Update Environment Variables

Add these to your `.env.local`:

```bash
# Google Cloud Configuration
GOOGLE_PROJECT_ID=your-project-id
GOOGLE_PROJECT_TOPIC_NAME=projects/your-project-id/topics/gmail-inbox
```

### 5. Deploy Your Application

For the webhook to work, your application needs to be accessible from the internet:

#### Option A: Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

#### Option B: Deploy to Netlify

```bash
# Build the project
npm run build

# Deploy to Netlify
# (Follow Netlify's deployment instructions)
```

#### Option C: Use ngrok for Development

```bash
# Install ngrok
npm install -g ngrok

# Start your app
npm run dev

# In another terminal, expose your local server
ngrok http 3000

# Use the ngrok URL as your webhook endpoint
```

### 6. Test the Integration

1. **Visit the setup page**: `http://localhost:3000/gmail-setup`
2. **Click "Authorize Gmail Access"**
3. **Complete the OAuth flow**
4. **Verify subscription is created**

## 🔧 Configuration Details

### Webhook Endpoint

Your webhook endpoint will receive notifications in this format:

```json
{
	"historyId": "12345",
	"emailAddress": "user@gmail.com"
}
```

### Topic Name Format

The topic name should follow this format:

```
projects/YOUR_PROJECT_ID/topics/gmail-inbox
```

### Subscription Configuration

- **Type**: Push subscription
- **Endpoint**: Your webhook URL
- **Ack Deadline**: 10 seconds (recommended)
- **Retry Policy**: Default (exponential backoff)

## 🐛 Troubleshooting

### Common Issues

#### 1. "Permission denied" errors

**Solution**: Ensure your service account has these roles:

- `pubsub.publisher`
- `pubsub.subscriber`
- `gmail.api.user`

#### 2. Webhook not receiving notifications

**Solution**:

- Verify your webhook URL is publicly accessible
- Check that the subscription is active
- Ensure the topic exists and is properly configured

#### 3. OAuth flow fails

**Solution**:

- Verify OAuth2 credentials are correct
- Check that redirect URI matches exactly
- Ensure Gmail API is enabled

### Debug Commands

```bash
# Check topic exists
gcloud pubsub topics list

# Check subscription exists
gcloud pubsub subscriptions list

# Test push endpoint
curl -X POST https://your-domain.com/api/gmail/webhook \
  -H "Content-Type: application/json" \
  -d '{"historyId":"12345"}'
```

## 📊 Monitoring

### Google Cloud Console

1. **Pub/Sub Dashboard**: Monitor message delivery
2. **Gmail API Dashboard**: Check API usage
3. **Logs**: View webhook execution logs

### Application Logs

Your webhook logs important events:

- Email processing start/completion
- Company creation/updates
- Document uploads
- Error messages

## 🔒 Security Considerations

1. **HTTPS Only**: Always use HTTPS for webhook endpoints
2. **Authentication**: Consider adding webhook authentication
3. **Rate Limiting**: Implement rate limiting for webhook endpoints
4. **Validation**: Validate incoming webhook payloads
5. **Error Handling**: Log errors without exposing sensitive data

## 🎯 Next Steps

1. **Complete the OAuth flow** using the frontend setup page
2. **Deploy your application** to a public URL
3. **Configure Pub/Sub** following this guide
4. **Test with sample emails** containing attachments
5. **Monitor the integration** for any issues

## 📞 Support

If you encounter issues:

1. **Check Google Cloud Console** for API quotas and errors
2. **Review application logs** for detailed error messages
3. **Verify environment variables** are correctly set
4. **Test webhook endpoint** manually with curl

---

Your Gmail integration will automatically process emails and organize documents by company once setup is complete! 🎉
