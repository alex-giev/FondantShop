# Deployment Setup Guide

## Fixing Login/Registration on Your Domain

The login and registration issues on your hosted domain are now fixed! Here's what you need to configure:

### 1. Update Your `.env` File

Add these settings to your `.env` file on your hosting platform:

```env
# Your domain URL (IMPORTANT - change this!)
BASE_URL=https://yourdomain.com

# Session security for HTTPS
SESSION_COOKIE_SECURE=True

# Your existing keys
FLASK_SECRET_KEY=your_actual_secret_key_here
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

### 2. Important Configuration Notes

**For HTTPS domains (recommended):**
- Set `BASE_URL=https://yourdomain.com`
- Set `SESSION_COOKIE_SECURE=True`

**For HTTP domains (not recommended for production):**
- Set `BASE_URL=http://yourdomain.com`
- Set `SESSION_COOKIE_SECURE=False`

### 3. What Was Fixed

✅ **Session Cookie Configuration**: Added proper cookie settings for cross-domain sessions
✅ **Persistent Sessions**: Sessions now last 24 hours 
✅ **Security Headers**: HTTPOnly and SameSite protection enabled
✅ **Domain-Agnostic URLs**: Stripe redirects now use your configured BASE_URL
✅ **Session Permanence**: Login sessions persist properly across page loads

### 4. Testing Login/Registration

After deploying with the new settings:

1. Clear your browser cookies for the domain
2. Try registering a new account
3. Try logging in
4. Verify the session persists when you navigate between pages
5. Test checkout functionality

### 5. Troubleshooting

**Still not working?**
- Check your hosting platform's logs for errors
- Verify environment variables are set correctly
- Make sure `BASE_URL` matches your actual domain exactly
- For HTTPS sites, ensure `SESSION_COOKIE_SECURE=True`
- Clear browser cache and cookies completely

**Session not persisting?**
- Verify your `FLASK_SECRET_KEY` is set and consistent
- Check that cookies are enabled in your browser
- Some hosting platforms require additional session configuration

### 6. Hosting Platform Specific Notes

**Render/Railway/Heroku:**
- Environment variables are set in the dashboard
- Make sure to set `BASE_URL` to your assigned URL

**Vercel/Netlify:**
- These are typically for static sites
- Flask needs a server - consider Render or PythonAnywhere instead

**PythonAnywhere:**
- Set environment variables in the "Web" tab
- Update WSGI configuration file if needed
