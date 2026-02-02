// Vercel Serverless Function for creating Stripe Checkout Session
const Stripe = require('stripe');

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
    console.error('ERROR: STRIPE_SECRET_KEY environment variable is not set!');
}

const stripe = new Stripe(STRIPE_SECRET_KEY);

module.exports = async function handler(req, res) {
    // Log request for debugging
    console.log('=== Create Checkout Session Request ===');
    console.log('Method:', req.method);
    console.log('URL:', req.url);
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Body:', req.body);
    console.log('Query:', req.query);
    
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
        console.log('OPTIONS request - returning 200');
        res.status(200).end();
        return;
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
        console.log(`Method ${req.method} not allowed - returning 405`);
        console.log('Expected: POST');
        console.log('Received:', req.method);
        return res.status(405).json({ 
            error: 'Method not allowed', 
            receivedMethod: req.method,
            expectedMethod: 'POST'
        });
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
        // Parse request body - Vercel may send it as string or already parsed
        let body = req.body;
        console.log('Raw body type:', typeof body);
        console.log('Raw body:', body);
        
        if (typeof body === 'string') {
            try {
                body = JSON.parse(body);
                console.log('Parsed body:', body);
            } catch (e) {
                console.error('JSON parse error:', e);
                body = {};
            }
        } else if (!body) {
            body = {};
        }

        const plan = body.plan || 'yearly'; // Default to yearly
        console.log('Selected plan:', plan);
        const isYearly = plan === 'yearly';

        // Get the origin to construct success/cancel URLs
        const origin = req.headers.origin || req.headers.referer || 'http://localhost:3000';
        const baseUrl = origin.replace(/\/$/, ''); // Remove trailing slash

        // Create Stripe Checkout Session with subscription
        const session = await stripe.checkout.sessions.create({
            // Payment methods: Card, Link, and SEPA Direct Debit
            payment_method_types: ['card', 'link', 'sepa_debit'],
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
            mode: 'subscription',
            locale: 'sl', // Slovenian language
            
            // Note: In subscription mode, Stripe automatically:
            // - Creates customers
            // - Generates invoices (no need to enable invoice_creation)
            
            // Collect billing address (required for SEPA and business invoices)
            billing_address_collection: 'required',
            
            // Enable tax ID collection for business customers
            tax_id_collection: {
                enabled: true,
            },
            
            // Note: customer_update is not needed - Stripe automatically collects customer info in subscription mode
            
            // Enable payment method saving for subscriptions (required for SEPA)
            payment_method_collection: 'always',
            
            // Add logo to checkout page
            images: [`${baseUrl}/images/Jaz Zenska Logo Horizontal.png`],
            
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
