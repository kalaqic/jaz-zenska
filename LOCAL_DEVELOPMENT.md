# Local Development Guide

## ⚠️ Important: You Cannot Test API Calls by Opening HTML Files Directly

If you open `checkout.html` by double-clicking it, you'll get this error:
```
Access to fetch at 'file:///api/create-checkout-session' from origin 'null' has been blocked by CORS policy
```

**This is because browsers block fetch requests from `file://` protocol URLs.**

## ✅ Solution: Use a Local Web Server

You have two options:

### Option 1: Deploy to Vercel (Recommended for Testing API)

The API endpoints only work when deployed to Vercel because:
- They are serverless functions that need the Vercel runtime
- They need access to environment variables set in Vercel
- They need proper HTTP/HTTPS protocol

**To deploy:**
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy and test on the live URL

### Option 2: Local Development Server (For Frontend Testing Only)

For testing the frontend (HTML/CSS/JS) locally, you can use a simple HTTP server:

**Using npm script:**
```bash
npm run dev
```
Then open: `http://localhost:3000/checkout.html`

**Or using Python:**
```bash
python3 -m http.server 8000
```
Then open: `http://localhost:8000/checkout.html`

**Or using PHP:**
```bash
php -S localhost:8000
```
Then open: `http://localhost:8000/checkout.html`

**Note:** The API endpoints (`/api/*`) will NOT work locally - they only work when deployed to Vercel. The local server is only for testing the frontend UI.

## 🚀 Testing the Full Flow

To test the complete checkout flow with Stripe:

1. **Deploy to Vercel** (required for API to work)
2. **Set up environment variables** in Vercel:
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `FIREBASE_SERVICE_ACCOUNT`
   - `FIREBASE_API_KEY`
   - `GETRESPONSE_API_KEY`
3. **Test on the live Vercel URL**

## 📝 Summary

- ❌ **Don't:** Open HTML files directly (double-click)
- ✅ **Do:** Use a local server for frontend testing
- ✅ **Do:** Deploy to Vercel for full API functionality
