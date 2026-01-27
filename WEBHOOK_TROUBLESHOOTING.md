# Webhook Troubleshooting Guide

## Problem: Nothing gets logged after payment

Ako se ništa ne logira u Vercel logs nakon plaćanja, webhook ne stiže do Vercel-a.

## Koraci za provjeru:

### 1. Provjeri Stripe Dashboard → Webhooks

1. Idi u **Stripe Dashboard** → **Developers** → **Webhooks**
2. Provjeri da li postoji webhook endpoint
3. Ako ne postoji, klikni **"Add endpoint"**

### 2. Postavi Webhook Endpoint

**Endpoint URL:**
```
https://jaz-zenska.vercel.app/api/stripe-webhook
```

**Events to send:**
- ✅ `checkout.session.completed` (OBVEZNO)
- ✅ `customer.subscription.created` (opcionalno)
- ✅ `customer.subscription.updated` (opcionalno)
- ✅ `customer.subscription.deleted` (opcionalno)

### 3. Provjeri da li je endpoint aktiviran

- Provjeri da li je endpoint **"Enabled"** (ne "Disabled")
- Provjeri da li je za **Test mode** (ako testiraš s test karticom)

### 4. Provjeri Events u Stripe Dashboardu

1. Idi u **Stripe Dashboard** → **Developers** → **Webhooks**
2. Klikni na tvoj webhook endpoint
3. Idi u **"Events"** tab
4. Provjeri da li vidiš `checkout.session.completed` event nakon plaćanja
5. Ako vidiš event, provjeri:
   - **Status**: "Succeeded" ili "Failed"?
   - **Response**: Što je Stripe dobio kao odgovor?

### 5. Test Webhook direktno iz Stripe Dashboarda

1. U webhook endpointu, klikni **"Send test webhook"**
2. Odaberi event: `checkout.session.completed`
3. Klikni **"Send test webhook"**
4. Provjeri Vercel logs - trebao bi vidjeti "=== WEBHOOK CALLED ==="

### 6. Provjeri Webhook Secret

1. U webhook endpointu, klikni **"Reveal"** pored "Signing secret"
2. Kopiraj secret (počinje s `whsec_`)
3. Provjeri da li je isti u Vercel environment variables kao `STRIPE_WEBHOOK_SECRET`

## Ako webhook ne stiže:

1. **Provjeri Vercel URL** - je li `https://jaz-zenska.vercel.app` tvoj pravi Vercel URL?
2. **Provjeri da li je Vercel deployment aktivan**
3. **Provjeri Vercel logs** - možda ima greške pri deploymentu

## Ako webhook stiže ali ne radi:

1. Provjeri Vercel logs za "=== WEBHOOK CALLED ==="
2. Provjeri da li vidiš signature verification greške
3. Provjeri da li vidiš "=== PROCESSING EVENT ==="
