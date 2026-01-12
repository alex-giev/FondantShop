# Vercel Deployment for FondantShop

## 🚀 Quick Deploy to Vercel

Your site now uses Firebase Authentication (client-side) which works perfectly with Vercel!

### Step 1: Deploy to Vercel

```bash
cd /Users/giev/Desktop/FondantShop
vercel
```

Follow the prompts:
- **Set up and deploy?** → Yes
- **Which scope?** → Your account
- **Link to existing project?** → No
- **Project name?** → fondant-shop (or your choice)
- **Directory?** → `./` (press Enter)
- **Override settings?** → No

### Step 2: Set Environment Variables in Vercel Dashboard

After deployment, go to your Vercel dashboard:
1. Go to https://vercel.com/dashboard
2. Click on your `fondant-shop` project
3. Go to **Settings** → **Environment Variables**
4. Add these variables:

```
STRIPE_SECRET_KEY = sk_test_51SnSGpBayiH... (your Stripe secret key)
STRIPE_PUBLISHABLE_KEY = pk_test_51SnSGpBayiH... (your Stripe publishable key)
FLASK_SECRET_KEY = (generate with: python -c "import secrets; print(secrets.token_hex(32))")
```

### Step 3: Add Your Vercel Domain to Firebase

**CRITICAL:** Firebase needs to know your Vercel domain!

1. Get your Vercel URL (e.g., `fondant-shop-xyz.vercel.app`)
2. Go to [Firebase Console → Authentication → Settings](https://console.firebase.google.com/project/fondant-shop/authentication/settings)
3. Scroll to **Authorized domains**
4. Click **Add domain**
5. Add your Vercel domain: `fondant-shop-xyz.vercel.app`
6. Click **Add**

### Step 4: Connect Your $12.99 Custom Domain

1. In Vercel Dashboard → Your Project → **Settings** → **Domains**
2. Click **Add**
3. Enter your custom domain (e.g., `yourdomain.com`)
4. Follow Vercel's DNS instructions
5. **Add this domain to Firebase authorized domains too!**

### Step 5: Enable Email/Password in Firebase

If you haven't already:
1. Go to [Firebase Console → Authentication → Sign-in method](https://console.firebase.google.com/project/fondant-shop/authentication/providers)
2. Click **Email/Password**
3. Toggle **Enable** to ON
4. Click **Save**

---

## 🎯 Deploy Now!

Run this command:
```bash
cd /Users/giev/Desktop/FondantShop && vercel --prod
```

After deployment:
1. Note your Vercel URL
2. Add it to Firebase authorized domains
3. Connect your $12.99 custom domain
4. Test authentication on your live site!

---

## ✅ Why This Works

- **Firebase Auth** = Client-side JavaScript (works on Vercel)
- **No Flask sessions** = No server state needed
- **Cart in localStorage** = Persists in browser
- **Vercel** = Perfect for this setup
- **Your $12.99 domain** = Can finally be used!

Your authentication will work perfectly on your deployed website!
