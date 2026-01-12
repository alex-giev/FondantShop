# 🚀 Deploy Your Fondant Shop to Render

## ❌ Why Not Vercel?

Vercel is for:
- Static websites (HTML/CSS/JS)
- Next.js apps
- Serverless functions

Your Flask app needs:
- A running Python server
- SQLite database with persistent storage
- Session management

**Vercel won't work for this type of application.**

---

## ✅ Deploy to Render (FREE - Best Option)

### Step 1: Create Render Account
1. Go to https://render.com
2. Sign up with GitHub (recommended)
3. Connect your GitHub account

### Step 2: Push Your Code to GitHub
```bash
cd /Users/giev/Desktop/FondantShop
git add .
git commit -m "Add Render deployment configuration"
git push origin main
```

### Step 3: Create New Web Service on Render
1. Click "New +" → "Web Service"
2. Connect your GitHub repository `FondantShop`
3. Render will auto-detect the `render.yaml` configuration
4. OR manually configure:
   - **Name**: fondant-shop
   - **Environment**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `cd src && gunicorn app:app`

### Step 4: Set Environment Variables
In the Render dashboard, add these environment variables:

```
FLASK_SECRET_KEY=your-super-secret-key-here-make-it-long
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
BASE_URL=https://fondant-shop.onrender.com
SESSION_COOKIE_SECURE=True
```

**Important:** 
- After deployment, Render will give you a URL like `https://fondant-shop-xxxx.onrender.com`
- Update `BASE_URL` to match your actual Render URL

### Step 5: Deploy
1. Click "Create Web Service"
2. Wait 5-10 minutes for first deployment
3. Visit your site at the provided URL!

---

## 🔄 Alternative: PythonAnywhere (Also Easy)

### Pros:
- Free tier available
- Very beginner-friendly
- Great for Python apps

### Steps:
1. Sign up at https://www.pythonanywhere.com
2. Upload your files or clone from GitHub
3. Create a Web app → Flask
4. Set environment variables in Web tab
5. Configure WSGI file to point to `src/app.py`

**Cost**: Free tier with limitations, $5/month for custom domain

---

## 🌐 Alternative: Railway (Modern & Easy)

### Pros:
- Modern interface
- $5 free credit monthly
- Easy GitHub integration

### Steps:
1. Go to https://railway.app
2. Sign in with GitHub
3. New Project → Deploy from GitHub
4. Select your FondantShop repo
5. Add environment variables
6. Deploy!

**Cost**: Pay-as-you-go, ~$5-10/month after free credit

---

## 📊 Comparison Table

| Platform | Cost | Difficulty | Best For |
|----------|------|------------|----------|
| **Render** | FREE | Easy | Your app (RECOMMENDED) |
| PythonAnywhere | FREE/$5 | Very Easy | Beginners |
| Railway | $5-10/mo | Easy | Modern projects |
| Heroku | $7/mo | Medium | Legacy apps |
| ~~Vercel~~ | N/A | N/A | ❌ Won't work for Flask+DB |

---

## 🎯 Quick Start: Deploy to Render NOW

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push
   ```

2. **Go to Render.com** and sign up

3. **New Web Service** → Connect GitHub → Select FondantShop

4. **Add these environment variables:**
   - `STRIPE_SECRET_KEY` = (from Stripe dashboard)
   - `STRIPE_PUBLISHABLE_KEY` = (from Stripe dashboard)
   - `BASE_URL` = (wait for Render to give you the URL, then update this)
   - `SESSION_COOKIE_SECURE` = True
   - `FLASK_SECRET_KEY` = (generate a random long string)

5. **Deploy!** Your site will be live in ~5 minutes

6. **Update BASE_URL** once you have your Render URL

---

## 🔒 Generate FLASK_SECRET_KEY

Run this in your terminal:
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

Copy the output and use it as your `FLASK_SECRET_KEY`

---

## 📝 After Deployment Checklist

- [ ] Update `BASE_URL` in Render environment variables
- [ ] Test user registration
- [ ] Test user login
- [ ] Test adding items to cart
- [ ] Test checkout flow
- [ ] Update Stripe webhook URL (if using webhooks)

---

## 🆘 Need Help?

If you have issues:
1. Check Render logs (Logs tab in dashboard)
2. Verify all environment variables are set
3. Make sure `BASE_URL` matches your actual URL
4. Ensure `SESSION_COOKIE_SECURE=True` for HTTPS

Your app is now properly configured for deployment! 🎉
