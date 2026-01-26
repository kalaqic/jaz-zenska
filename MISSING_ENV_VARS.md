# Missing Environment Variables

## ✅ Already Added to Vercel:
- ✅ `STRIPE_SECRET_KEY`
- ✅ `FIREBASE_SERVICE_ACCOUNT`
- ✅ `GETRESPONSE_API_KEY`

## ⚠️ Still Missing (Required):

### 1. STRIPE_WEBHOOK_SECRET (REQUIRED)
**Why:** Needed to verify Stripe webhook signatures (security)

**How to get it:**
1. Go to Stripe Dashboard → Developers → Webhooks
2. Create webhook endpoint: `https://your-domain.vercel.app/api/stripe-webhook`
3. Select event: `checkout.session.completed`
4. Copy the "Signing secret" (starts with `whsec_`)
5. Add to Vercel as `STRIPE_WEBHOOK_SECRET`

**Without this:** Webhook will fail signature verification and won't work!

---

### 2. FIREBASE_API_KEY (Optional but Recommended)
**Why:** Used for client-side Firebase Auth (login page)

**How to get it:**
1. Go to Firebase Console → Project Settings → General
2. Scroll to "Your apps" section
3. Find "Web API Key" (starts with `AIza...`)
4. Add to Vercel as `FIREBASE_API_KEY`

**Without this:** Login page will still work (we're using Firebase client SDK), but some features might not work optimally.

---

## 📧 GetResponse Email Setup

Since you're using GetResponse for emails, you have two options:

### Option A: GetResponse Automation (Recommended)
1. In GetResponse dashboard, create a custom field called `password_reset_link`
2. Set up automation: When contact is added → Send email with custom field
3. The webhook will add contacts with the password reset link in the custom field
4. GetResponse automation will automatically send the email

### Option B: Manual Email Sending
- The password reset link will be logged in Vercel logs
- You can manually send it to users
- Or set up GetResponse automation later

---

## Summary

**Critical (must add):**
- `STRIPE_WEBHOOK_SECRET` - Webhook won't work without this!

**Recommended:**
- `FIREBASE_API_KEY` - Better login experience

**Optional:**
- `GETRESPONSE_CAMPAIGN_ID` - If different from default `froXf`
- `FROM_EMAIL` - Defaults to `info@jazzenska.si`
- `FROM_NAME` - Defaults to `Jaz Ženska`
