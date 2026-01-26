# 🚀 Deployment Checklist - Everything Ready!

## ✅ Environment Variables (All Set!)
- ✅ `STRIPE_SECRET_KEY` - Stripe payments
- ✅ `STRIPE_WEBHOOK_SECRET` - Webhook security
- ✅ `FIREBASE_SERVICE_ACCOUNT` - Firebase Admin SDK
- ✅ `GETRESPONSE_API_KEY` - Email marketing
- ✅ `FIREBASE_API_KEY` - Client-side Firebase Auth

## 🎯 What Happens When User Completes Payment

1. **User clicks "Pridruži se"** → Goes to checkout page
2. **Selects subscription** (monthly €19 or yearly €119)
3. **Redirects to Stripe** → Completes payment
4. **Stripe webhook fires** → `/api/stripe-webhook` receives event
5. **Firebase user created** → Passwordless account with email
6. **Password reset link generated** → User can set password
7. **User added to GetResponse** → Added to campaign `froXf`
8. **Email sent** → Via GetResponse automation (if set up)
9. **Success page** → User sees confirmation

## 🧪 Testing Steps

### 1. Test Checkout Flow
- [ ] Deploy to Vercel
- [ ] Visit checkout page
- [ ] Select subscription plan
- [ ] Complete test payment (use Stripe test card: `4242 4242 4242 4242`)
- [ ] Verify redirect to success page

### 2. Test Webhook
- [ ] Check Vercel logs after payment
- [ ] Verify Firebase user was created
- [ ] Check GetResponse for new contact
- [ ] Verify password reset link is logged

### 3. Test Login
- [ ] Go to login page
- [ ] Use email from test payment
- [ ] Use password reset link from logs (or set password)
- [ ] Verify login works
- [ ] Check account page displays user data

### 4. Test GetResponse Email
- [ ] Set up GetResponse automation (optional)
- [ ] Or manually send password reset email
- [ ] Verify email is received

## 📋 Stripe Test Cards

Use these for testing:
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0025 0000 3155`

Any future date for expiry, any 3 digits for CVC.

## 🔍 Monitoring

After deployment, check:
- **Vercel Logs**: Function logs show webhook activity
- **Firebase Console**: Users → Authentication → See new users
- **Stripe Dashboard**: Payments → See successful payments
- **GetResponse Dashboard**: Contacts → See new contacts

## 🎉 You're All Set!

Everything is configured and ready. Once deployed to Vercel:
- ✅ Checkout will work
- ✅ Payments will process
- ✅ Users will be created
- ✅ Emails will be logged (or sent via GetResponse automation)

**Next Step:** Deploy to Vercel and test with a Stripe test card!
