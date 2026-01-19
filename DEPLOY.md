# Deployment Guide - Serverless Functions

Ovaj vodič pokazuje kako da deploy-ujete serverless funkcije koje rade 24/7 bez potrebe za održavanjem servera.

## Opcija 1: Vercel (Preporučeno - Najlakše)

Vercel je besplatan za početak i automatski deploy-uje serverless funkcije.

### Koraci:

1. **Instalirajte Vercel CLI** (opciono, možete koristiti i web interfejs):
   ```bash
   npm install -g vercel
   ```

2. **Deploy-ujte projekat**:
   ```bash
   vercel
   ```
   
   Ili jednostavno:
   - Idite na https://vercel.com
   - Registrujte se (besplatno)
   - Kliknite "New Project"
   - Povežite GitHub repo ili upload-ujte fajlove
   - Vercel će automatski detektovati `api/` folder i deploy-ovati funkcije

3. **Ažurirajte frontend kod**:
   
   U `js/main.js`, promenite:
   ```javascript
   const API_BASE_URL = window.API_BASE_URL || 'http://localhost:3000';
   ```
   
   Na:
   ```javascript
   const API_BASE_URL = window.API_BASE_URL || 'https://your-project.vercel.app';
   ```
   
   Ili koristite environment variable u HTML-u:
   ```html
   <script>
     window.API_BASE_URL = 'https://your-project.vercel.app';
   </script>
   ```

### Struktura fajlova za Vercel:
```
jaz-zenska/
├── api/
│   ├── newsletter.js      ← Serverless funkcija
│   └── consultation.js     ← Serverless funkcija
├── vercel.json            ← Vercel konfiguracija
├── index.html
└── js/
    └── main.js
```

**Besplatni plan**: 100GB bandwidth/mesec, dovoljno za većinu sajtova

---

## Opcija 2: Netlify Functions

Netlify takođe nudi besplatne serverless funkcije.

### Koraci:

1. **Instalirajte Netlify CLI** (opciono):
   ```bash
   npm install -g netlify-cli
   ```

2. **Kreirajte `netlify.toml`** (ako već ne postoji):
   ```toml
   [build]
     functions = "netlify/functions"
     publish = "."
   
   [[redirects]]
     from = "/api/*"
     to = "/.netlify/functions/:splat"
     status = 200
   ```

3. **Deploy-ujte**:
   ```bash
   netlify deploy --prod
   ```
   
   Ili koristite web interfejs:
   - Idite na https://app.netlify.com
   - Kliknite "New site from Git"
   - Povežite repo
   - Netlify će automatski deploy-ovati

4. **Ažurirajte frontend**:
   ```javascript
   const API_BASE_URL = window.API_BASE_URL || 'https://your-site.netlify.app';
   ```

### Struktura fajlova za Netlify:
```
jaz-zenska/
├── netlify/
│   └── functions/
│       ├── newsletter.js      ← Serverless funkcija
│       └── consultation.js    ← Serverless funkcija
├── netlify.toml              ← Netlify konfiguracija
├── index.html
└── js/
    └── main.js
```

**Besplatni plan**: 100GB bandwidth/mesec, 125,000 serverless invocations/mesec

---

## Opcija 3: Cloudflare Workers (Najbrže)

Cloudflare Workers su veoma brzi i besplatni za početak.

### Koraci:

1. **Instalirajte Wrangler CLI**:
   ```bash
   npm install -g wrangler
   ```

2. **Login**:
   ```bash
   wrangler login
   ```

3. **Kreirajte `wrangler.toml`**:
   ```toml
   name = "jaz-zenska-api"
   main = "workers/index.js"
   compatibility_date = "2024-01-01"
   ```

4. **Kreirajte `workers/index.js`** koji rutiše zahteve

5. **Deploy**:
   ```bash
   wrangler publish
   ```

**Besplatni plan**: 100,000 requests/dan

---

## Opcija 4: Railway / Render (Ako želite Node.js server)

Ako preferirate da koristite Node.js server umesto serverless funkcija:

### Railway:

1. Idite na https://railway.app
2. Kliknite "New Project"
3. Povežite GitHub repo
4. Railway će automatski detektovati `package.json` i pokrenuti server
5. Ažurirajte `API_BASE_URL` na Railway URL

**Besplatni plan**: $5 kredita/mesec (dovoljno za mali sajt)

### Render:

1. Idite na https://render.com
2. Kliknite "New Web Service"
3. Povežite repo
4. Render će automatski pokrenuti server
5. Ažurirajte `API_BASE_URL` na Render URL

**Besplatni plan**: Sporije instance, ali besplatno

---

## Preporuka

**Za najlakše rešenje**: Koristite **Vercel**
- Besplatno
- Automatski deploy
- Automatski SSL
- Brzo
- Nema konfiguracije servera

**Koraci za Vercel**:
1. Push-ujte kod na GitHub
2. Idite na vercel.com
3. Povežite repo
4. Deploy automatski!
5. Ažurirajte `API_BASE_URL` u `js/main.js` na Vercel URL

---

## Environment Variables (Za sigurnost)

Za production, prebacite API ključ u environment variables:

### Vercel:
1. Idite u Project Settings → Environment Variables
2. Dodajte: `GETRESPONSE_API_KEY`
3. U `api/*.js` fajlovima:
   ```javascript
   const GETRESPONSE_API_KEY = process.env.GETRESPONSE_API_KEY;
   ```

### Netlify:
1. Site settings → Environment variables
2. Dodajte: `GETRESPONSE_API_KEY`
3. U `netlify/functions/*.js`:
   ```javascript
   const GETRESPONSE_API_KEY = process.env.GETRESPONSE_API_KEY;
   ```

---

## Testiranje nakon deploy-a

Nakon deploy-a, testirajte API endpoint-e:

```bash
# Newsletter
curl -X POST https://your-site.vercel.app/api/newsletter \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","firstName":"Test","lastName":"User"}'

# Consultation
curl -X POST https://your-site.vercel.app/api/consultation \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","callDate":"2026-01-20","callTime":"18:00"}'
```

---

## Troubleshooting

**CORS greške**: Proverite da li serverless funkcije vraćaju pravilne CORS headere (već su dodati u kod)

**404 greške**: Proverite da li su fajlovi u pravom folderu (`api/` za Vercel, `netlify/functions/` za Netlify)

**500 greške**: Proverite logove u Vercel/Netlify dashboard-u
