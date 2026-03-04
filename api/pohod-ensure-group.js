// Ensure pohod payer is added to MailerLite group (fallback when webhook doesn't run).
// Called from pohod-hvala.html with session_id so the user is added even if the webhook failed.
const Stripe = require('stripe');
const admin = require('firebase-admin');
const { addToMailerLite, GROUPS } = require('../lib/mailerlite');

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const POHOD_DOC_ID = 'pohod';
const MAX_TICKETS = 100;

let firebaseApp;
try {
    const serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (serviceAccountRaw) {
        const serviceAccount = JSON.parse(serviceAccountRaw);
        try {
            firebaseApp = admin.app();
        } catch (e) {
            firebaseApp = admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
        }
    }
} catch (err) {
    console.error('Firebase init error:', err);
}

const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY) : null;

function capitalizeName(str) {
    if (!str || typeof str !== 'string') return str;
    return str.trim().split(/\s+/).map(function (w) {
        return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    }).join(' ');
}

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET' && req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    let sessionId = null;
    if (req.method === 'GET' && req.query && req.query.session_id) {
        sessionId = String(req.query.session_id).trim();
    } else if (req.method === 'POST' && req.body) {
        const body = typeof req.body === 'string' ? (() => { try { return JSON.parse(req.body); } catch (e) { return {}; } })() : req.body;
        sessionId = body.session_id ? String(body.session_id).trim() : null;
    }

    if (!sessionId) {
        return res.status(400).json({ error: 'session_id is required' });
    }

    if (!stripe || !STRIPE_SECRET_KEY) {
        return res.status(500).json({ error: 'Server configuration error' });
    }

    if (!firebaseApp) {
        return res.status(500).json({ error: 'Server configuration error', message: 'Firebase not available' });
    }

    try {
        const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: [] });
        if (!session || session.payment_status !== 'paid') {
            return res.status(400).json({ error: 'Payment not completed or session invalid' });
        }
        const isPohod = session.metadata && session.metadata.type === 'pohod';
        if (!isPohod) {
            return res.status(400).json({ error: 'Not a pohod session' });
        }

        const customerEmail = session.customer_details?.email || session.customer_email || session.metadata?.email;
        const customerName = capitalizeName(session.customer_details?.name || session.metadata?.name || '');

        if (!customerEmail) {
            return res.status(400).json({ error: 'No email in session' });
        }

        const db = admin.firestore();
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
                if (nextNumber > MAX_TICKETS) {
                    throw new Error('POHOD_SOLD_OUT');
                }
                eventNumber = nextNumber;
                tx.update(ticketRef, { nextNumber: nextNumber + 1 });
            }
            tx.set(processedRef, {
                sessionId: session.id,
                email: customerEmail,
                name: customerName,
                eventNumber,
                processedAt: admin.firestore.FieldValue.serverTimestamp(),
                source: 'pohod-ensure-group',
            });
            weProcessed = true;
        });

        if (weProcessed && GROUPS.POHOD) {
            const result = await addToMailerLite(customerEmail, customerName, [GROUPS.POHOD], {
                event_number: String(eventNumber),
                phone: (session.metadata && session.metadata.phone) || '',
            });
            if (result.success) {
                console.log('✅ [pohod-ensure-group] MailerLite: added to Pohod –', customerEmail, 'event_number', eventNumber);
            } else {
                console.error('❌ [pohod-ensure-group] MailerLite add failed:', result.error);
            }
        }

        return res.status(200).json({
            success: true,
            eventNumber: eventNumber != null ? eventNumber : undefined,
        });
    } catch (e) {
        if (e.message === 'POHOD_SOLD_OUT') {
            return res.status(200).json({ success: true, soldOut: true });
        }
        console.error('pohod-ensure-group error:', e.message || e);
        return res.status(500).json({ error: e.message || 'Server error' });
    }
};
