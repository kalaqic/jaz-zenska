// Vercel Serverless Function for Stripe Webhook
const Stripe = require('stripe');
const admin = require('firebase-admin');
const fetch = require('node-fetch');
const { sendPasswordResetEmail } = require('./send-email');

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const GETRESPONSE_API_KEY = process.env.GETRESPONSE_API_KEY;
const GETRESPONSE_API_URL = 'https://api.getresponse.com/v3/contacts';
const CAMPAIGN_ID = 'froXf'; // Same campaign ID as newsletter

if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET) {
    console.error('ERROR: Stripe environment variables are not set!');
}

// Initialize Firebase Admin
let firebaseApp;
try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
    
    if (!firebaseApp && serviceAccount.projectId) {
        firebaseApp = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log('Firebase Admin initialized successfully');
    }
} catch (error) {
    console.error('Firebase initialization error:', error);
}

const stripe = new Stripe(STRIPE_SECRET_KEY);

module.exports = async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const sig = req.headers['stripe-signature'];
    let event;

    try {
        // Get raw body for webhook signature verification
        // In Vercel, we need to handle the body carefully for signature verification
        let rawBody;
        
        // Vercel may parse the body, so we need to reconstruct it
        // Try multiple approaches to get the raw body
        if (Buffer.isBuffer(req.body)) {
            rawBody = req.body;
        } else if (typeof req.body === 'string') {
            rawBody = Buffer.from(req.body, 'utf8');
        } else if (req.body && typeof req.body === 'object') {
            // Body was parsed as JSON, reconstruct it
            rawBody = Buffer.from(JSON.stringify(req.body), 'utf8');
        } else {
            // Try to read from request stream
            try {
                const chunks = [];
                for await (const chunk of req) {
                    chunks.push(chunk);
                }
                rawBody = Buffer.concat(chunks);
            } catch (streamError) {
                // If we can't read from stream, try to use parsed body
                rawBody = Buffer.from(JSON.stringify(req.body || {}), 'utf8');
            }
        }

        // Verify webhook signature
        event = stripe.webhooks.constructEvent(rawBody, sig, STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        console.error('Error details:', err);
        // For development, you might want to skip verification
        // In production, this should always verify
        return res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }

    // Handle the event
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        
        console.log('Checkout session completed:', session.id);
        console.log('Mode:', session.mode); // 'subscription' or 'payment'
        console.log('Customer email:', session.customer_details?.email);
        console.log('Subscription metadata:', session.metadata);

        const customerEmail = session.customer_details?.email || session.customer_email;
        const customerName = session.customer_details?.name || '';
        
        if (!customerEmail) {
            console.error('No email found in checkout session');
            return res.status(400).json({ error: 'No email found in checkout session' });
        }

        try {
            // 1. Create Firebase user (passwordless initially)
            if (firebaseApp) {
                const auth = admin.auth();
                
                // Check if user already exists
                let user;
                try {
                    user = await auth.getUserByEmail(customerEmail);
                    console.log('User already exists:', user.uid);
                } catch (error) {
                    if (error.code === 'auth/user-not-found') {
                        // User doesn't exist, create new one
                        // Generate a random password temporarily
                        const tempPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12) + 'A1!';
                        
                        user = await auth.createUser({
                            email: customerEmail,
                            password: tempPassword,
                            emailVerified: false,
                            disabled: false
                        });
                        console.log('Created new Firebase user:', user.uid);
                    } else {
                        throw error;
                    }
                }

                // 2. Generate password reset link (so user can set their password)
                try {
                    const actionCodeSettings = {
                        url: `${req.headers.origin || 'https://jazzenska.si'}/login.html?mode=resetPassword`,
                        handleCodeInApp: false,
                    };
                    
                    const link = await auth.generatePasswordResetLink(customerEmail, actionCodeSettings);
                    console.log('Password reset link generated:', link);

                    // 3. Add contact to GetResponse campaign (email will be sent via GetResponse automation)
                    try {
                        console.log('Adding contact to GetResponse after purchase');
                        console.log('Email:', customerEmail);
                        console.log('Name:', customerName);
                        const emailResult = await sendPasswordResetEmail(customerEmail, link, customerName);
                        console.log('GetResponse result:', JSON.stringify(emailResult, null, 2));
                        console.log('Contact added to GetResponse campaign for:', customerEmail);
                    } catch (emailError) {
                        console.error('Error adding contact to GetResponse:', emailError);
                        console.error('Error stack:', emailError.stack);
                        // Don't fail the webhook if GetResponse fails
                    }
                } catch (linkError) {
                    console.error('Error generating password reset link:', linkError);
                    // Don't fail the webhook if link generation fails
                }
            } else {
                console.error('Firebase not initialized');
            }
        } catch (error) {
            console.error('Error processing checkout completion:', error);
            // Return 200 to prevent Stripe from retrying, but log the error
            return res.status(200).json({ 
                received: true, 
                error: error.message 
            });
        }
    }

    // Handle subscription events
    if (event.type === 'customer.subscription.created') {
        console.log('Subscription created:', event.data.object.id);
    }

    if (event.type === 'customer.subscription.updated') {
        console.log('Subscription updated:', event.data.object.id);
    }

    if (event.type === 'customer.subscription.deleted') {
        console.log('Subscription canceled:', event.data.object.id);
        // You might want to handle subscription cancellation here
        // e.g., disable user access, send notification, etc.
    }

    // Return a response to acknowledge receipt of the event
    res.status(200).json({ received: true });
}
