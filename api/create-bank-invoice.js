// Vercel Serverless Function for creating bank transfer invoice (MailerLite for waiting list)
const Stripe = require('stripe');
const admin = require('firebase-admin');

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const { addToMailerLite, GROUPS, MAILERLITE_API_KEY } = require('../lib/mailerlite');

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

        const { email, firstName, lastName, product } = body;

        // product: undefined or 'subscription' = group (119€); 'pohod' = pohod (27€)
        const isPohod = product === 'pohod';
        const amountCents = isPohod ? 2700 : 11900; // 27 € or 119 €
        const description = isPohod
            ? 'Pohod 100 Žensk na Trško Goro – vstopnica 27 €'
            : 'Skupnost JAZ ŽENSKA - Letna naročnina do 31. 12. 2027';

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
            metadata: {
                firstName: firstName,
                lastName: lastName,
                payment_method: 'bank_transfer',
                country: 'SI',
                product: isPohod ? 'pohod' : 'subscription'
            }
        });

        console.log('✅ Customer created:', customer.id);

        // Step 2: Create Invoice with bank transfer/SEPA only
        // Using 'send_invoice' collection method automatically uses bank transfer
        // The payment method shown in the invoice is controlled by your Stripe account settings
        const invoice = await stripe.invoices.create({
            customer: customer.id,
            collection_method: 'send_invoice',
            days_until_due: 7,
            auto_advance: false,
        
            payment_settings: {
                payment_method_types: ['customer_balance'],
                payment_method_options: {
                    customer_balance: {
                        funding_type: 'bank_transfer',
                        bank_transfer: {
                            type: 'eu_bank_transfer',
                            eu_bank_transfer: {
                                country: 'DE'
                            }
                        }
                    }
                }
            },
        
            metadata: {
                payment_method: 'bank_transfer',
                firstName: firstName,
                lastName: lastName,
                country: 'SI',
                product: isPohod ? 'pohod' : 'subscription'
            }
        });
        
        
        
        
        console.log('✅ Invoice created:', invoice.id);

        console.log('✅ Invoice created:', invoice.id);

        // Step 3: Add line item to invoice
        await stripe.invoiceItems.create({
            customer: customer.id,
            invoice: invoice.id,
            amount: amountCents,
            currency: 'eur',
            description: description
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

        // Step 6: Add to MailerLite "Waiting for payment" group
        if (MAILERLITE_API_KEY) {
            try {
                const result = await addToMailerLite(email, `${firstName} ${lastName}`, [GROUPS.WAITING_FOR_PAYMENT]);
                if (result.success) {
                    console.log('✅ Added to MailerLite waiting-for-payment list');
                } else {
                    console.warn('⚠️ MailerLite (non-critical):', result.error);
                }
            } catch (mlError) {
                console.warn('⚠️ MailerLite error (non-critical):', mlError.message);
            }
        }

        // Step 7: Add to Firebase waiting_payments collection
        if (firebaseApp) {
            try {
                const db = admin.firestore();
                const data = {
                    email: email,
                    firstName: firstName,
                    lastName: lastName,
                    customerId: customer.id,
                    invoiceId: finalizedInvoice.id,
                    paymentStatus: 'waiting',
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    amount: amountCents,
                    currency: 'eur',
                    product: isPohod ? 'pohod' : 'subscription'
                };
                await db.collection('waiting_payments').doc(customer.id).set(data);
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
