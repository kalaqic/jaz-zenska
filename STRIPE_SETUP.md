# Stripe & Firebase Setup Instructions

## ⚠️ Important: Local Development

**The API endpoints only work when deployed to Vercel.** If you're testing locally:
- Use `npm run dev` to start a local server (don't open HTML files directly)
- The API calls will still fail locally - they need Vercel's serverless environment
- For full testing, deploy to Vercel

See `LOCAL_DEVELOPMENT.md` for more details.

## Environment Variables

Add these environment variables in your Vercel project settings:

1. **STRIPE_SECRET_KEY** - Your Stripe secret key (starts with `sk_`)
2. **STRIPE_WEBHOOK_SECRET** - Your Stripe webhook signing secret (starts with `whsec_`)
3. **FIREBASE_SERVICE_ACCOUNT** - JSON string of your Firebase service account credentials
4. **GETRESPONSE_API_KEY** - Your GetResponse API key (already configured)
5. **FIREBASE_API_KEY** - Your Firebase web API key (for login authentication)

## Stripe Webhook Configuration

1. Go to your Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. Set the endpoint URL to: `https://your-domain.vercel.app/api/stripe-webhook`
4. Select these events:
   - `checkout.session.completed` (required - creates user account)
   - `customer.subscription.created` (optional - logs subscription creation)
   - `customer.subscription.updated` (optional - logs subscription updates)
   - `customer.subscription.deleted` (optional - handles cancellations)
5. Copy the "Signing secret" and add it to Vercel as `STRIPE_WEBHOOK_SECRET`

## Firebase Setup

1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate new private key"
3. Copy the entire JSON content
4. In Vercel, add it as `FIREBASE_SERVICE_ACCOUNT` (paste the entire JSON as a string)
5. Also get your Firebase Web API Key from Project Settings → General
6. Add it as `FIREBASE_API_KEY` in Vercel

## Testing

1. Use Stripe test mode for testing
2. Use test cards from: https://stripe.com/docs/testing
3. After a successful payment, check:
   - Firebase Authentication console for the new user
   - Checkout success page should redirect correctly
   - User should receive password reset email (if email service is configured)

## Email Sending via GetResponse

Password reset emails are handled through GetResponse automation:

### How It Works:
1. When payment completes, user is added to GetResponse with password reset link
2. Password reset link is stored in GetResponse (logged in Vercel logs)
3. **You need to set up GetResponse automation** to send the email

### GetResponse Automation Setup:
1. Go to GetResponse Dashboard → Automation
2. Create new automation: "When contact is added"
3. Add action: "Send email"
4. Use the password reset link from custom field in your email template
5. Or manually send emails using the links logged in Vercel

### Alternative: Manual Email Sending
- Password reset links are logged in Vercel function logs
- You can manually copy and send them to users
- Check Vercel logs after each successful payment

**Note:** GetResponse doesn't have direct transactional email API, so automation is required for automatic email sending.

## Subscription Plans

- **Monthly**: €19/month (€228/year)
- **Yearly**: €119/year (saves €109 - 48% discount!)

The checkout page allows users to choose between monthly and yearly subscriptions. The yearly plan is recommended and shows a prominent discount badge.

## Notes

- The webhook endpoint is at `/api/stripe-webhook`
- The checkout page is at `/checkout.html`
- The login page is at `/login.html`
- The account page is at `/account.html`
- All API keys are stored securely in Vercel environment variables
- Subscriptions are handled automatically by Stripe (recurring billing)
