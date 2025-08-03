# 🔧 OAuth Troubleshooting Guide

## Common OAuth Errors and Solutions

### 1. `invalid_grant` Error

**What it means:** The authorization code has expired or was already used.

**Causes:**

- Authorization codes expire within 10 minutes
- Codes can only be used once
- Redirect URI mismatch
- Network issues during token exchange

**Solutions:**

1. **Try again immediately** - Click "Try Again" in the Gmail setup page
2. **Check redirect URI** - Ensure it matches exactly in Google Cloud Console
3. **Clear browser cache** - Sometimes cached OAuth states cause issues
4. **Use incognito mode** - Test the flow in a private browser window

### 2. `redirect_uri_mismatch` Error

**What it means:** The redirect URI in your Google Cloud Console doesn't match your environment variable.

**Solution:**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to "APIs & Services" > "Credentials"
3. Find your OAuth 2.0 Client ID
4. Add `http://localhost:3000` to the "Authorized redirect URIs"
5. Save the changes

### 3. `invalid_client` Error

**What it means:** Your OAuth client credentials are invalid or missing.

**Solution:**

1. Check your `.env.local` file has:
    ```
    GOOGLE_CLIENT_ID=your_client_id_here
    GOOGLE_CLIENT_SECRET=your_client_secret_here
    GOOGLE_REDIRECT_URI=http://localhost:3000
    ```
2. Verify the credentials in Google Cloud Console
3. Ensure the credentials are for a "Web application" type

## Step-by-Step Fix

### 1. Verify Environment Variables

Check your `.env.local` file:

```bash
# Required OAuth2 credentials
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000
```

### 2. Check Google Cloud Console

1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to "APIs & Services" > "Credentials"
4. Find your OAuth 2.0 Client ID
5. Verify these settings:
    - **Application type:** Web application
    - **Authorized redirect URIs:** `http://localhost:3000`
    - **Authorized JavaScript origins:** `http://localhost:3000`

### 3. Test the Flow

1. **Clear browser cache** and cookies
2. **Open incognito/private window**
3. **Visit:** `http://localhost:3000/gmail-setup`
4. **Click "Authorize Gmail Access"**
5. **Complete the OAuth flow quickly** (within 10 minutes)

### 4. Debug Information

The improved error handling will now show:

- Exact redirect URI being used
- Timestamp of the error
- Specific error codes
- Detailed error messages

## Common Issues

### Issue: Code expires too quickly

**Solution:** Complete the OAuth flow immediately after getting the authorization URL.

### Issue: Multiple tabs/windows

**Solution:** Use only one browser tab for the OAuth flow.

### Issue: Network interruptions

**Solution:** Ensure stable internet connection during the flow.

### Issue: Wrong redirect URI

**Solution:** Double-check that `http://localhost:3000` is exactly what's in Google Cloud Console.

## Testing the Fix

After making changes:

1. **Restart your development server:**

    ```bash
    npm run dev
    ```

2. **Clear browser data** for localhost:3000

3. **Try the flow again** in an incognito window

4. **Check the console logs** for detailed debugging information

## Still Having Issues?

If you're still experiencing problems:

1. **Check the browser console** for detailed error messages
2. **Check the server logs** for OAuth debugging information
3. **Verify all environment variables** are correctly set
4. **Ensure Google Cloud Console** settings match exactly
5. **Try a different browser** to rule out browser-specific issues

The improved error handling will provide much more specific information about what's going wrong, making it easier to identify and fix the issue.
