// Signup for "100 Žensk Pohod na Trško Goro" – limited to 100 places, assign event_number 1–100
const admin = require('firebase-admin');
const { detectBot } = require('../lib/bot-filter');
const { addToMailerLite, GROUPS, MAILERLITE_API_KEY } = require('../lib/mailerlite');

const POHOD_DOC_ID = 'pohod';
const MAX_TICKETS = 100;

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

        const { name, email, are_you_a_bot, form_start_time } = body || {};

        const botCheck = detectBot(req, body);
        if (botCheck.isBot) {
            return res.status(200).json({ success: true, message: 'Prijava uspešna' });
        }

        if (!email || !name) {
            return res.status(400).json({ error: 'Potrebna sta ime in e-pošta.' });
        }

        const normalizedEmail = String(email).trim().toLowerCase();
        const normalizedName = String(name).trim();

        const ticketRef = db.collection('availableTickets').doc(POHOD_DOC_ID);

        let eventNumber;
        await db.runTransaction(async (tx) => {
            const doc = await tx.get(ticketRef);
            let nextNumber;

            if (!doc.exists) {
                nextNumber = 2;
                eventNumber = 1;
                tx.set(ticketRef, { nextNumber });
            } else {
                nextNumber = doc.data().nextNumber || 1;
                if (nextNumber > MAX_TICKETS) {
                    throw new Error('SOLD_OUT');
                }
                eventNumber = nextNumber;
                tx.update(ticketRef, { nextNumber: nextNumber + 1 });
            }
        });

        if (GROUPS.POHOD && MAILERLITE_API_KEY) {
            const result = await addToMailerLite(normalizedEmail, normalizedName, [GROUPS.POHOD], {
                event_number: String(eventNumber),
            });
            if (!result.success) {
                console.error('MailerLite pohod signup error:', result.error);
                return res.status(500).json({
                    error: 'Prijava je bila shranjena, vendar je prišlo do napake pri pošiljanju. Kontaktirajte nas.',
                });
            }
        }

        return res.status(200).json({
            success: true,
            message: 'Uspešno ste se prijavili na 100 Žensk Pohod na Trško Goro.',
        });
    } catch (err) {
        if (err.message === 'SOLD_OUT') {
            return res.status(400).json({
                error: 'Žal so vsa mesta zasedena. Prijava je omejena na 100 udeleženk.',
                soldOut: true,
            });
        }
        console.error('Pohod signup error:', err);
        return res.status(500).json({ error: 'Prišlo je do napake. Poskusite znova.' });
    }
};
