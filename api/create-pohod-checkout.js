// Create Stripe Checkout Session for Pohod 100 Žensk na Trško Goro – one-time 27 €
// GET with ?session_id=xxx = ensure payer is in MailerLite group (fallback when webhook doesn't run)
const Stripe = require('stripe');
const admin = require('firebase-admin');
const { addToMailerLite, GROUPS } = require('../lib/mailerlite');

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
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // —— GET ?session_id=xxx: ensure payer is in MailerLite group (thank-you page fallback) ——
    if (req.method === 'GET' && req.query && req.query.session_id) {
        const sessionId = String(req.query.session_id).trim();
        if (!sessionId || !stripe || !db) {
            return res.status(400).json({ error: 'session_id required or server not configured' });
        }
        try {
            const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: [] });
            if (!session || session.payment_status !== 'paid') {
                return res.status(400).json({ error: 'Payment not completed or session invalid' });
            }
            if (!(session.metadata && session.metadata.type === 'pohod')) {
                return res.status(400).json({ error: 'Not a pohod session' });
            }
            const customerEmail = session.customer_details?.email || session.customer_email || session.metadata?.email;
            const customerName = capitalizeName(session.customer_details?.name || session.metadata?.name || '');
            if (!customerEmail) {
                return res.status(400).json({ error: 'No email in session' });
            }
            const processedRef = db.collection('pohodPayments').doc(session.id);
            const ticketRef = db.collection('availableTickets').doc(POHOD_DOC_ID);
            let weProcessed = false;
            let eventNumber = null;
            await db.runTransaction(async (tx) => {
                const existing = await tx.get(processedRef);
                if (existing.exists) {
                    eventNumber = existing.data().eventNumber;
                    return;
                }
                const ticketDoc = await tx.get(ticketRef);
                let nextNumber;
                if (!ticketDoc.exists) {
                    nextNumber = 2;
                    eventNumber = 1;
                    tx.set(ticketRef, { nextNumber });
                } else {
                    nextNumber = ticketDoc.data().nextNumber || 1;
                    if (nextNumber > MAX_TICKETS) throw new Error('POHOD_SOLD_OUT');
                    eventNumber = nextNumber;
                    tx.update(ticketRef, { nextNumber: nextNumber + 1 });
                }
                tx.set(processedRef, {
                    sessionId: session.id,
                    email: customerEmail,
                    name: customerName,
                    eventNumber,
                    processedAt: admin.firestore.FieldValue.serverTimestamp(),
                    source: 'create-pohod-checkout-get',
                });
                weProcessed = true;
            });
            if (weProcessed && GROUPS.POHOD) {
                const result = await addToMailerLite(customerEmail, customerName, [GROUPS.POHOD], {
                    event_number: String(eventNumber),
                    phone: (session.metadata && session.metadata.phone) || '',
                });
                if (result.success) {
                    console.log('✅ [pohod ensure] MailerLite added –', customerEmail, 'event_number', eventNumber);
                } else {
                    console.error('❌ [pohod ensure] MailerLite failed:', result.error);
                }
            }
            return res.status(200).json({ success: true, eventNumber: eventNumber != null ? eventNumber : undefined });
        } catch (e) {
            if (e.message === 'POHOD_SOLD_OUT') {
                return res.status(200).json({ success: true, soldOut: true });
            }
            console.error('Pohod ensure-group error:', e.message || e);
            return res.status(500).json({ error: e.message || 'Server error' });
        }
    }

    // —— POST: create checkout session (like Jaz Ženska subscription: no form, Stripe collects details) ——
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
        // Check sold out (read nextNumber; we don't increment until after payment when adding to group)
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

        const siteUrl = process.env.SITE_URL || req.headers.origin || req.headers.referer || 'https://jaz-zenska.vercel.app';
        const baseUrl = String(siteUrl).replace(/\/$/, '');

        // No customer_email or metadata.name/email – Stripe Checkout collects them (same as subscription)
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
            success_url: `${baseUrl}//pohod-hvala?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${baseUrl}/pohod-/checkout`,
            billing_address_collection: 'required',
            customer_creation: 'always',
            metadata: {
                type: 'pohod',
            },
        });

        return res.status(200).json({ url: session.url, sessionId: session.id });
    } catch (err) {
        console.error('Create pohod checkout error:', err);
        return res.status(500).json({ error: 'Prišlo je do napake. Poskusite znova.' });
    }
};
