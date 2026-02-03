// Vercel Serverless Function for creating bank transfer invoice
const Stripe = require('stripe');
const admin = require('firebase-admin');
const fetch = require('node-fetch');

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const GETRESPONSE_API_KEY = process.env.GETRESPONSE_API_KEY;
const GETRESPONSE_API_URL = 'https://api.getresponse.com/v3/contacts';
const PAYMENT_WAITING_CAMPAIGN_ID = 'f5nDe'; // Payment waiting list

if (!STRIPE_SECRET_KEY) {
    console.error('ERROR: STRIPE_SECRET_KEY environment variable is not set!');
}

// Initialize Firebase Admin
let firebaseApp;
try {
    const serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (serviceAccountRaw) {
        const serviceAccount = JSON.parse(serviceAccountRaw);
        const projectId = serviceAccount.project_id || serviceAccount.projectId;
        if (projectId) {
            try {
                firebaseApp = admin.app();
            } catch (e) {
                firebaseApp = admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount)
                });
            }
        }
    }
} catch (error) {
    console.error('Firebase initialization error:', error);
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
                body = {};
            }
        } else if (!body) {
            body = {};
        }

        const { email, firstName, lastName } = body;

        // Validate input
        if (!email || !firstName || !lastName) {
            return res.status(400).json({ 
                error: 'Missing required fields: email, firstName, lastName' 
            });
        }

        console.log('=== Creating bank transfer invoice ===');
        console.log('Email:', email);
        console.log('Name:', firstName, lastName);

        // Step 1: Create Stripe Customer with Slovenian locale
        const customer = await stripe.customers.create({
            email: email,
            name: `${firstName} ${lastName}`,
            address: {
                country: 'SI' // Slovenia
            },
            invoice_settings: {
                default_payment_method: null, // No default, forces bank transfer for send_invoice
                custom_fields: null,
                footer: null
            },
            metadata: {
                firstName: firstName,
                lastName: lastName,
                payment_method: 'bank_transfer',
                country: 'SI' // Slovenia for IBAN
            }
        });

        console.log('✅ Customer created:', customer.id);

        // Step 2: Create Invoice with bank transfer/SEPA only
        // Note: To restrict invoices to ONLY bank transfer (no card payments),
        // you must configure this in Stripe Dashboard:
        // Settings → Payment methods → Invoice payments → Disable card and other methods
        // Keep only "Bank transfer" enabled for invoices
        // The IBAN country will be determined by the customer's address (SI - Slovenia)
        const invoice = await stripe.invoices.create({
            customer: customer.id,
            collection_method: 'send_invoice',
            days_until_due: 7,
            auto_advance: false, // Don't auto-advance, wait for payment
            metadata: {
                payment_method: 'bank_transfer',
                firstName: firstName,
                lastName: lastName,
                country: 'SI' // Slovenia
            }
        });

        console.log('✅ Invoice created:', invoice.id);

        // Step 3: Add line item to invoice
        await stripe.invoiceItems.create({
            customer: customer.id,
            invoice: invoice.id,
            amount: 11900, // €119.00 in cents
            currency: 'eur',
            description: 'Skupnost JAZ ŽENSKA - Letna naročnina do 31. 12. 2027'
        });

        console.log('✅ Invoice item added');

        // Step 4: Finalize invoice (this will send it)
        const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id, {
            auto_advance: false
        });

        console.log('✅ Invoice finalized:', finalizedInvoice.id);

        // Step 5: Send invoice email
        await stripe.invoices.sendInvoice(finalizedInvoice.id);
        console.log('✅ Invoice email sent');

        // Step 6: Add to GetResponse Payment waiting list
        if (GETRESPONSE_API_KEY) {
            try {
                const contactData = {
                    email: email,
                    name: `${firstName} ${lastName}`,
                    campaign: {
                        campaignId: PAYMENT_WAITING_CAMPAIGN_ID
                    }
                };

                const getResponseResponse = await fetch(GETRESPONSE_API_URL, {
                    method: 'POST',
                    headers: {
                        'X-Auth-Token': `api-key ${GETRESPONSE_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(contactData)
                });

                if (getResponseResponse.ok || getResponseResponse.status === 409) {
                    console.log('✅ Added to GetResponse payment waiting list');
                } else {
                    console.warn('⚠️ Failed to add to GetResponse, but continuing');
                }
            } catch (getResponseError) {
                console.warn('⚠️ GetResponse error (non-critical):', getResponseError.message);
            }
        }

        // Step 7: Add to Firebase waiting_payments collection
        if (firebaseApp) {
            try {
                const db = admin.firestore();
                await db.collection('waiting_payments').doc(customer.id).set({
                    email: email,
                    firstName: firstName,
                    lastName: lastName,
                    customerId: customer.id,
                    invoiceId: finalizedInvoice.id,
                    paymentStatus: 'waiting',
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    amount: 11900,
                    currency: 'eur'
                });
                console.log('✅ Added to Firebase waiting_payments');
            } catch (firebaseError) {
                console.error('❌ Firebase error (non-critical):', firebaseError.message);
            }
        }

        return res.status(200).json({ 
            success: true,
            message: 'Invoice created and sent successfully',
            customerId: customer.id,
            invoiceId: finalizedInvoice.id
        });

    } catch (error) {
        console.error('Error creating bank invoice:', error);
        console.error('Error type:', error.type);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        return res.status(500).json({ 
            error: 'Failed to create invoice',
            message: error.message,
            type: error.type,
            code: error.code
        });
    }
}
