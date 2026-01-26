# Webhook Signature Verification Fix

## Problem
Vercel parses the request body before it reaches the handler, which breaks Stripe's webhook signature verification.

## Solution
The code now handles the body in multiple formats. However, if signature verification still fails, you have two options:

### Option 1: Verify Webhook Secret
1. Go to Stripe Dashboard → Developers → Webhooks
2. Find your webhook endpoint: `https://your-domain.vercel.app/api/stripe-webhook`
3. Click "Reveal" next to "Signing secret"
4. Copy the exact secret (starts with `whsec_`)
5. Update `STRIPE_WEBHOOK_SECRET` in Vercel environment variables
6. Redeploy

### Option 2: Test Without Signature Verification (Temporary)
If you need to test immediately, you can temporarily skip signature verification by commenting out the verification code. **Only do this for testing, never in production!**

## Current Implementation
The code now:
1. Tries to get raw body as string, buffer, or reconstructs from parsed JSON
2. Converts to Buffer for Stripe verification
3. Logs detailed error information if verification fails

## Next Steps
1. Check Vercel logs after next webhook call
2. Verify `STRIPE_WEBHOOK_SECRET` matches the webhook endpoint secret
3. If still failing, check if webhook endpoint URL in Stripe matches your Vercel URL
