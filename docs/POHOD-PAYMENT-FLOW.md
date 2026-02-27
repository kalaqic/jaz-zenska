# Pohod payment flow – how it works

## Checklist (confirm everything works)

- [ ] **Vercel env:** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `MAILERLITE_API_KEY`, `FIREBASE_SERVICE_ACCOUNT`. Optional: `SITE_URL` (e.g. `https://jaz-zenska.vercel.app`) so success/cancel URLs are correct even if `Origin` header is missing.
- [ ] **Stripe:** Webhook endpoint points to `https://your-domain.com/api/stripe-webhook` and is set for `checkout.session.completed`.
- [ ] **MailerLite:** Custom fields exist with keys `event_number` and `phone` (and `name` is standard). Group ID `180377754709002083` (or `MAILERLITE_GROUP_POHOD`) is the Pohod group. Automation: trigger = "Subscriber joins group [Pohod]", email uses `{{ event_number }}`.
- [ ] **Firestore:** Collection `availableTickets` with document `pohod` (field `nextNumber`). Collection `pohodPayments` is written by the webhook (no client access needed). Server uses Admin SDK so rules don’t block API.

## Overview

When someone pays for **Pohod 100 Žensk na Trško Goro** (27 €), this is what happens end to end.

---

## 1. User journey

1. **pohod.html** – User reads about the event and clicks e.g. "Prijavi se" or "Nadaljuj na plačilo (27 €)".
2. **pohod-checkout.html** – User can either:
   - **Option A (Payment Link):** Click "Plačaj 27 €" and go straight to Stripe’s hosted checkout (your test link).
   - **Option B (API Checkout):** Fill name, email, phone and submit → your API creates a Checkout Session and redirects to Stripe.
3. **Stripe Checkout** – User enters payment details and pays.
4. **Success redirect** – User is sent to **pohod-hvala.html** (thank-you page).

---

## 2. Backend: create session (only if using Option B – form → API)

**File:** `api/create-pohod-checkout.js`

- **When:** `POST /api/create-pohod-checkout` with body `{ name, email, phone }`.
- **Checks:** Firestore `availableTickets/pohod` – if `nextNumber > 100` returns “sold out”.
- **Creates:** A Stripe **Checkout Session** with:
  - One-time payment 27 €
  - `metadata`: `type: 'pohod'`, `name`, `email`, `phone`
  - `customer_email`: from form
  - `success_url`: your site + `/pohod-hvala.html?session_id={CHECKOUT_SESSION_ID}`
  - `cancel_url`: your site + `/pohod-checkout.html`
- **Returns:** `{ url }` – frontend redirects the browser to this Stripe URL.

So with Option B, your server creates the session and attaches `metadata.type = 'pohod'` and the customer data.

---

## 3. Backend: after payment – webhook

**File:** `api/stripe-webhook.js`

Stripe sends **`checkout.session.completed`** to your webhook URL when payment succeeds.

- **Pohod detection:** Session is treated as Pohod if **either**:
  - `session.metadata.type === 'pohod'` (sessions created by `create-pohod-checkout.js`), **or**
  - `session.payment_link === STRIPE_POHOD_PAYMENT_LINK_ID` (sessions created from your Payment Link; set the env var to that link’s ID).
- **Idempotency:** Looks up Firestore `pohodPayments/{session.id}`. If it exists, the webhook returns 200 and does nothing (avoids double processing).
- **Data used:**  
  - Email: `session.customer_details.email` or `session.customer_email` or `session.metadata.email`  
  - Name: `session.customer_details.name` or `session.metadata.name`  
  - Phone: `session.metadata.phone` (only with Option B; Payment Link usually doesn’t send this unless you add a custom field).
- **Logic:**
  1. Reserve **event_number** (1–100) in Firestore `availableTickets/pohod` (transaction: read `nextNumber`, assign `eventNumber`, increment `nextNumber`).
  2. Add/update subscriber in **MailerLite** to group **Pohod** (ID `180377754709002083`) with fields `event_number` and `phone`.
  3. Write `pohodPayments/{session.id}` with `sessionId`, `email`, `name`, `eventNumber`, `processedAt`.
- **Confirmation email:** Not sent by your code. Your **MailerLite automation** (trigger: “Subscriber joins group [Pohod]”) sends the email and can use `{{ event_number }}`, `{{ name }}`, `{{ phone }}`.

So: payment completes → webhook runs once per session → number is reserved, contact is added to MailerLite, and your automation sends the email.

---

## 4. Using the test Payment Link

Your test link:  
**https://buy.stripe.com/test_cNi28t4Zn174c2rgqr8IU00**

- **Checkout page:** The “Plačaj 27 €” button can point directly to this URL so users go to Stripe without calling your API (Option A).
- **Webhook:** To treat these payments as Pohod you can:
  - **Preferred:** In Stripe Dashboard, edit the **Payment Link** and add **metadata** `type` = `pohod`. Then the same webhook condition `session.metadata.type === 'pohod'` works.
  - **Alternative:** Set env **`STRIPE_POHOD_PAYMENT_LINK_ID`** to the Payment Link’s ID (e.g. `plink_xxx` from Stripe Dashboard → Payment Links). The webhook also treats such sessions as Pohod even without metadata.
- **Success/cancel URLs:** In the Payment Link settings, set **After payment** → success URL to your **pohod-hvala** page and cancel URL to **pohod-checkout** (or back to pohod).

With that, the flow is: user clicks link → pays on Stripe → redirect to thank-you page → Stripe sends `checkout.session.completed` → your webhook runs the same Pohod logic (number + MailerLite + automation email).

---

## Potential issues

| Issue | What happens | Mitigation |
|-------|----------------|------------|
| **MailerLite returns 422** | Custom fields `event_number` or `phone` don’t exist in your account. Subscriber is not added; number is still consumed. | Create fields in MailerLite (Subscribers → Fields) with keys `event_number` and `phone`. Check Vercel logs for `MailerLite pohod add failed`. |
| **Wrong redirect after payment** | `Origin`/`Referer` can be missing or wrong, so success_url points to wrong domain. | Set **SITE_URL** in Vercel (e.g. `https://jaz-zenska.vercel.app`). create-pohod-checkout uses it for success/cancel URLs. |
| **Webhook signature fails** | Vercel may parse body before the webhook runs; Stripe needs raw body for verification. | Ensure webhook is configured to receive raw body if needed, or use the test-mode fallback in code only for debugging. In production use correct webhook secret and raw body. |
| **101st payment** | Race: 100th and 101st checkout created before any webhook runs. Both pay. One gets number 100, the other hits POHOD_SOLD_OUT and gets no number / no MailerLite. | Acceptable: only one “extra” payer can be affected. Optionally handle POHOD_SOLD_OUT in webhook (e.g. add to waitlist or trigger refund). |
| **Automation email not sent** | Contact is in group but automation doesn’t run or merge field is wrong. | In MailerLite, confirm automation trigger is “Subscriber joins group” and the group is the Pohod group. Use merge field `{{ event_number }}` (key must match). |

---

## 5. Files involved

| File | Role |
|------|------|
| `pohod.html` | Event info and CTAs to checkout. |
| `pohod-checkout.html` | Checkout page: link to Payment Link and/or form that calls create-pohod-checkout. |
| `pohod-hvala.html` | Thank-you page after payment. |
| `api/create-pohod-checkout.js` | Creates Stripe Checkout Session with metadata (used if you use the form). |
| `api/stripe-webhook.js` | Handles `checkout.session.completed`, assigns number, adds to MailerLite, writes `pohodPayments`. |
| `lib/mailerlite.js` | `GROUPS.POHOD` = `180377754709002083`; `addToMailerLite()`. |

---

## 6. Env vars (Vercel)

- **STRIPE_SECRET_KEY** – Stripe API key.
- **STRIPE_WEBHOOK_SECRET** – For verifying webhook signature.
- **MAILERLITE_API_KEY** – So the webhook can add subscribers to the Pohod group.
- **MAILERLITE_GROUP_POHOD** – Optional; code defaults to `180377754709002083`.
- **STRIPE_POHOD_PAYMENT_LINK_ID** – Optional; Payment Link ID (e.g. `plink_xxx`) if you use the test link and don’t set metadata on the link.
- **FIREBASE_SERVICE_ACCOUNT** – For Firestore (ticket counter + `pohodPayments`).
