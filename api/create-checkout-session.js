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

        const paymentMethod = body.payment_method || 'card';
        console.log('Selected payment method:', paymentMethod);

        // Get the origin to construct success/cancel URLs
        const origin = req.headers.origin || req.headers.referer || 'http://localhost:3000';
        const baseUrl = origin.replace(/\/$/, ''); // Remove trailing slash

        // Calculate subscription end date: December 31, 2027
        const subscriptionEndDate = Math.floor(new Date('2027-12-31T23:59:59Z').getTime() / 1000);

        // Create Stripe Checkout Session with subscription for card payment
        const session = await stripe.checkout.sessions.create({
            // Only card payment for card workflow
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'eur',
                        product_data: {
                            name: 'Skupnost JAZ ŽENSKA',
                            description: 'Pridružite se naši skupnosti žensk, ki se zbirajo, delijo modrost in se podpirajo na skupni poti rasti.',
                        },
                        unit_amount: 11900, // €119.00 in cents
                        recurring: {
                            interval: 'year',
                        },
                    },
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            locale: 'sl', // Slovenian language
            
            // Collect billing address (required for business invoices)
            billing_address_collection: 'required',
            
            // Enable tax ID collection for business customers
            tax_id_collection: {
                enabled: true,
            },
            
            // Enable payment method saving for subscriptions
            payment_method_collection: 'always',
            
            // Set subscription to end on December 31, 2027
            subscription_data: {
                metadata: {
                    end_date: '2027-12-31'
                }
            },
            
            success_url: `${baseUrl}//checkout-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${baseUrl}//checkout`,
            metadata: {
                payment_method: 'card',
                subscription_type: 'yearly',
                subscription_end: '2027-12-31'
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
