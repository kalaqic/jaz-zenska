// Vercel Serverless Function: create Stripe Checkout Session for single course purchase (web shop)
const Stripe = require('stripe');

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
// Course ID in Firestore (must match a document in courses collection). Optional env override.
const SHOP_COURSE_ID = process.env.SHOP_COURSE_ID || 'moc-besede';
// Price in cents. e.g. 2700 = 27€
const SHOP_COURSE_PRICE_CENTS = parseInt(process.env.SHOP_COURSE_PRICE_CENTS || '2700', 10);

if (!STRIPE_SECRET_KEY) {
    console.error('ERROR: STRIPE_SECRET_KEY environment variable is not set!');
}

const stripe = new Stripe(STRIPE_SECRET_KEY);

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

    if (!STRIPE_SECRET_KEY) {
        return res.status(500).json({ error: 'Server configuration error' });
    }

    try {
        let body = req.body;
        if (typeof body === 'string') {
            try {
                body = JSON.parse(body);
            } catch (e) {
                body = {};
            }
        }
        if (!body) body = {};

        const { name, email, course_id } = body;
        const courseId = course_id || SHOP_COURSE_ID;

        if (!email || !email.trim()) {
            return res.status(400).json({ error: 'E-pošta je obvezna.' });
        }

        const origin = req.headers.origin || req.headers.referer || 'http://localhost:3000';
        const baseUrl = (origin || '').replace(/\/$/, '');

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            locale: 'sl',
            line_items: [
                {
                    price_data: {
                        currency: 'eur',
                        product_data: {
                            name: 'Tečaj – Spletna trgovina Jaz Ženska',
                            description: 'Dostop do kupljenega tečaja v spletni učilnici. Po plačilu prejete e-pošto z navodili za nastavitev gesla in dostop.',
                        },
                        unit_amount: SHOP_COURSE_PRICE_CENTS,
                    },
                    quantity: 1,
                },
            ],
            customer_email: email.trim(),
            success_url: `${baseUrl}/course-checkout-success.html?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${baseUrl}/spletna-trgovina.html`,
            metadata: {
                type: 'course',
                course_id: courseId,
                name: (name || '').trim() || email.trim().split('@')[0],
                email: email.trim(),
            },
        });

        return res.status(200).json({ sessionId: session.id, url: session.url });
    } catch (error) {
        console.error('create-course-checkout error:', error);
        return res.status(500).json({
            error: 'Napaka pri ustvarjanju plačila.',
            message: error.message,
        });
    }
};
