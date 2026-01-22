# Backend Server Setup

Ovaj backend server rešava CORS problem sa GetResponse API-jem tako što deluje kao proxy između frontend-a i GetResponse API-ja.

## Instalacija

1. Instalirajte Node.js (ako već nemate):
   - Preuzmite sa https://nodejs.org/
   - Verzija 14 ili novija

2. Instalirajte zavisnosti:
   ```bash
   npm install
   ```

## Pokretanje servera

### Development (sa auto-reload):
```bash
npm run dev
```

### Production:
```bash
npm start
```

Server će se pokrenuti na `http://localhost:3000`

## API Endpoints

### 1. Newsletter Subscription
**POST** `/api/newsletter`

Body:
```json
{
  "email": "user@example.com",
  "firstName": "Ime",
  "lastName": "Prezime"
}
```

### 2. Consultation Scheduling
**POST** `/api/consultation`

Body:
```json
{
  "email": "user@example.com",
  "callDate": "2026-01-20",
  "callTime": "18:00"
}
```

### 3. Health Check
**GET** `/api/health`

## Konfiguracija za Production

Za production, promenite URL u `js/main.js`:

```javascript
// Umesto localhost, koristite vaš production URL
const API_URL = 'https://your-domain.com/api/newsletter';
const API_URL = 'https://your-domain.com/api/consultation';
```

## Hosting Opcije

Možete hostovati ovaj server na:
- **Heroku**: Besplatno za početak
- **Railway**: Besplatno za početak
- **Render**: Besplatno za početak
- **Vercel**: Serverless funkcije
- **Netlify**: Serverless funkcije
- **AWS Lambda**: Serverless
- **DigitalOcean**: VPS

## Environment Variables (Opciono)

Za bolju sigurnost, možete prebaciti API ključ u environment variable:

1. Kreirajte `.env` fajl:
   ```
   GETRESPONSE_API_KEY=your_api_key_here
   PORT=3000
   ```

2. Instalirajte `dotenv`:
   ```bash
   npm install dotenv
   ```

3. U `server.js` dodajte na početak:
   ```javascript
   require('dotenv').config();
   const GETRESPONSE_API_KEY = process.env.GETRESPONSE_API_KEY;
   ```

## Testiranje

Možete testirati API sa `curl`:

```bash
# Newsletter
curl -X POST http://localhost:3000/api/newsletter \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","firstName":"Test","lastName":"User"}'

# Consultation
curl -X POST http://localhost:3000/api/consultation \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","callDate":"2026-01-20","callTime":"18:00"}'
```
