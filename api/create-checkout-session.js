// Vercel Serverless Function for creating Stripe Checkout Session
const Stripe = require('stripe');

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
    console.error('ERROR: STRIPE_SECRET_KEY environment variable is not set!');
}

const stripe = new Stripe(STRIPE_SECRET_KEY);

module.exports = async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Check if Stripe key is configured
    if (!STRIPE_SECRET_KEY) {
        console.error('Stripe secret key is not configured');
        return res.status(500).json({ 
            error: 'Server configuration error',
            message: 'Stripe key not configured'
        });
    }

    try {
        // Parse request body
        let body = req.body;
        if (typeof body === 'string') {
            try {
                body = JSON.parse(body);
            } catch (e) {
                // If parsing fails, body might be empty or malformed
                body = {};
            }
        }

        const plan = body.plan || 'yearly'; // Default to yearly
        const isYearly = plan === 'yearly';

        // Get the origin to construct success/cancel URLs
        const origin = req.headers.origin || req.headers.referer || 'http://localhost:3000';
        const baseUrl = origin.replace(/\/$/, ''); // Remove trailing slash

        // Create Stripe Checkout Session with subscription
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'eur',
                        product_data: {
                            name: 'Skupnost JAZ ŽENSKA',
                            description: 'Pridružite se naši skupnosti žensk, ki se zbirajo, delijo modrost in se podpirajo na skupni poti rasti.',
                        },
                        unit_amount: isYearly ? 11900 : 1900, // €119.00 yearly or €19.00 monthly in cents
                        recurring: {
                            interval: isYearly ? 'year' : 'month',
                        },
                    },
                    quantity: 1,
                },
            ],
            mode: 'subscription', // Changed to subscription mode
            success_url: `${baseUrl}/checkout-success.html?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${baseUrl}/checkout.html?canceled=true`,
            metadata: {
                plan: plan,
                subscription_type: isYearly ? 'yearly' : 'monthly',
            },
        });

        return res.status(200).json({ 
            sessionId: session.id,
            url: session.url 
        });
    } catch (error) {
        console.error('Stripe error:', error);
        return res.status(500).json({ 
            error: 'Failed to create checkout session',
            message: error.message
        });
    }
}
