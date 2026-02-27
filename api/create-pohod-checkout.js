// Create Stripe Checkout Session for Pohod 100 Žensk na Trško Goro – one-time 27 €
const Stripe = require('stripe');
const admin = require('firebase-admin');

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const POHOD_DOC_ID = 'pohod';
const MAX_TICKETS = 100;
const POHOD_PRICE_EUR = 27;

function capitalizeName(str) {
    if (!str || typeof str !== 'string') return str;
    return str.trim().split(/\s+/).map(function(w) {
        return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    }).join(' ');
}

let db;
try {
    const serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (serviceAccountRaw) {
        const serviceAccount = JSON.parse(serviceAccountRaw);
        try {
            admin.app();
        } catch (e) {
            admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
        }
        db = admin.firestore();
    }
} catch (err) {
    console.error('Firebase init error:', err);
}

const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY) : null;

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    if (!STRIPE_SECRET_KEY || !stripe) {
        return res.status(500).json({ error: 'Server configuration error', message: 'Stripe not configured' });
    }

    if (!db) {
        return res.status(500).json({ error: 'Server configuration error', message: 'Database not available' });
    }

    try {
        let body = req.body;
        if (typeof body === 'string') {
            try {
                body = JSON.parse(body);
            } catch (e) {
                return res.status(400).json({ error: 'Invalid JSON' });
            }
        }
        body = body || {};

        const { name, email, phone } = body;
        const normalizedEmail = String(email || '').trim().toLowerCase();
        const normalizedName = capitalizeName(String(name || '').trim());
        const normalizedPhone = String(phone || '').trim();

        if (!normalizedEmail || !normalizedName) {
            return res.status(400).json({ error: 'Potrebna sta ime in e-pošta.' });
        }

        // Check sold out (read nextNumber; we don't increment until webhook after payment)
        const ticketRef = db.collection('availableTickets').doc(POHOD_DOC_ID);
        const doc = await ticketRef.get();
        let nextNumber = 1;
        if (doc.exists && doc.data().nextNumber != null) {
            nextNumber = doc.data().nextNumber;
        }
        if (nextNumber > MAX_TICKETS) {
            return res.status(400).json({
                error: 'Žal so vsa mesta zasedena.',
                soldOut: true,
            });
        }

        // Success/cancel URLs: use SITE_URL if set (e.g. https://jaz-zenska.vercel.app), else origin from request
        const siteUrl = process.env.SITE_URL || req.headers.origin || req.headers.referer || 'https://jaz-zenska.vercel.app';
        const baseUrl = String(siteUrl).replace(/\/$/, '');

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            locale: 'sl',
            line_items: [
                {
                    price_data: {
                        currency: 'eur',
                        unit_amount: POHOD_PRICE_EUR * 100,
                        product_data: {
                            name: 'Pohod 100 Žensk na Trško Goro',
                            description: 'Udeležba na pohodu 100 žensk na Trško Goro – vstopnica s številko udeleženke.',
                            images: [],
                        },
                    },
                    quantity: 1,
                },
            ],
            success_url: `${baseUrl}/pohod-hvala.html?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${baseUrl}/pohod-checkout.html`,
            customer_email: normalizedEmail,
            metadata: {
                type: 'pohod',
                name: normalizedName,
                email: normalizedEmail,
                phone: normalizedPhone,
            },
        });

        return res.status(200).json({ url: session.url, sessionId: session.id });
    } catch (err) {
        console.error('Create pohod checkout error:', err);
        return res.status(500).json({ error: 'Prišlo je do napake. Poskusite znova.' });
    }
};
