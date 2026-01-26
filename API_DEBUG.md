# API Debug Guide

## Problem: 405 Method Not Allowed

Ako dobivate 405 grešku na `/api/create-checkout-session`, provjerite sljedeće:

### 1. Provjerite Vercel Logs
- Idite u Vercel Dashboard → Vaš projekt → Functions → Logs
- Tražite zahtjeve za `/api/create-checkout-session`
- Provjerite što API prima (method, headers, body)

### 2. Provjerite da li je funkcija deployana
- Provjerite da li se `api/create-checkout-session.js` nalazi u root direktoriju
- Provjerite da li je funkcija vidljiva u Vercel Dashboard → Functions

### 3. Provjerite Environment Variables
- `STRIPE_SECRET_KEY` mora biti postavljen u Vercel
- Provjerite da li su sve varijable postavljene nakon deploymenta

### 4. Hard Refresh Browser
- Korisnik možda vidi cacheanu verziju
- Pritisnite `Ctrl+Shift+R` (Windows) ili `Cmd+Shift+R` (Mac)

### 5. Provjerite Network Tab
- Otvorite Developer Tools → Network tab
- Provjerite da li se zahtjev šalje kao POST
- Provjerite response headers

### 6. Testirajte direktno
- Pokušajte pozvati API direktno iz browsera ili Postman
- Koristite: `POST https://your-domain.vercel.app/api/create-checkout-session`
- Body: `{"plan": "yearly"}`

### 7. Provjerite da li je problem s routingom
- Provjerite `vercel.json` - možda postoji rewrite koji blokira API rutu
- Provjerite da li postoji `.vercelignore` koji možda ignorira `api/` folder

## Trenutna struktura

```
api/
├── create-checkout-session.js  ✅ (module.exports)
├── newsletter.js               ✅ (module.exports - radi)
├── stripe-webhook.js           ✅ (module.exports)
└── ...
```

Sve funkcije koriste `module.exports`, što je ispravno za Vercel.

## Što provjeriti u Vercel Logs

Kada pokrenete checkout, u Vercel logs trebate vidjeti:
```
=== Create Checkout Session Request ===
Method: POST
URL: /api/create-checkout-session
Headers: {...}
Body: {...}
```

Ako vidite `Method: GET` ili nešto drugo, to je problem.
