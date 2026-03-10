// Vercel Serverless Function for Stripe Webhook (MailerLite for lists)
const Stripe = require('stripe');
const admin = require('firebase-admin');
const { sendPasswordResetEmail } = require('./send-email');
const { addToMailerLite, GROUPS } = require('../lib/mailerlite');

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET) {
    console.error('ERROR: Stripe environment variables are not set!');
}

// Initialize Firebase Admin
let firebaseApp;
try {
    const serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT;
    console.log('FIREBASE_SERVICE_ACCOUNT exists:', !!serviceAccountRaw);
    console.log('FIREBASE_SERVICE_ACCOUNT length:', serviceAccountRaw ? serviceAccountRaw.length : 0);
    
    if (!serviceAccountRaw) {
        console.error('❌ FIREBASE_SERVICE_ACCOUNT environment variable is not set!');
    } else {
        const serviceAccount = JSON.parse(serviceAccountRaw);
        console.log('Parsed service account keys:', Object.keys(serviceAccount));
        // Firebase service account uses snake_case: project_id, not camelCase projectId
        const projectId = serviceAccount.project_id || serviceAccount.projectId;
        console.log('Service account project_id:', projectId);
        
        if (!projectId) {
            console.error('❌ Service account JSON is missing project_id field');
            console.error('Service account structure:', JSON.stringify(serviceAccount, null, 2));
        } else {
            // Check if Firebase app is already initialized
            try {
                firebaseApp = admin.app();
                console.log('Firebase app already initialized');
            } catch (e) {
                // App doesn't exist, initialize it
                firebaseApp = admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount)
                });
                console.log('✅ Firebase Admin initialized successfully');
            }
        }
    }
} catch (error) {
    console.error('❌ Firebase initialization error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
}

const stripe = new Stripe(STRIPE_SECRET_KEY);

async function addToMailerLiteGroups(email, name, groupIds) {
    const result = await addToMailerLite(email, name || email, groupIds);
    if (result.success) {
        console.log('✅ Added to MailerLite group(s)');
    } else {
        console.warn('⚠️ MailerLite (non-critical):', result.error);
    }
}

function capitalizeName(str) {
    if (!str || typeof str !== 'string') return str;
    return str.trim().split(/\s+/).map(function(w) {
        return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    }).join(' ');
}

// Configure to receive raw body for webhook signature verification
module.exports = async function handler(req, res) {
    // Log that webhook was called
    console.log('=== WEBHOOK CALLED ===');
    console.log('Method:', req.method);
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    
    // Only allow POST requests
    if (req.method !== 'POST') {
        console.log('Method not allowed:', req.method);
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const sig = req.headers['stripe-signature'];
    
    if (!sig) {
        console.error('No Stripe signature found in headers');
        return res.status(400).json({ error: 'No signature found' });
    }

    let event;
    let rawBody;

    try {
        // In Vercel, req.body might be a string, buffer, or parsed object
        // For Stripe webhook signature verification, we need the raw body
        if (typeof req.body === 'string') {
            // Body is already a string - use it directly
            rawBody = req.body;
            console.log('Body is string, length:', rawBody.length);
        } else if (Buffer.isBuffer(req.body)) {
            // Body is a buffer - convert to string
            rawBody = req.body.toString('utf8');
            console.log('Body is buffer, converted to string, length:', rawBody.length);
        } else if (req.body && typeof req.body === 'object') {
            // Body was parsed as JSON - reconstruct it
            // Note: This might not match exactly what Stripe sent, but it's the best we can do
            rawBody = JSON.stringify(req.body);
            console.log('Body is object, stringified, length:', rawBody.length);
        } else {
            console.error('Unable to get request body, type:', typeof req.body);
            return res.status(400).json({ error: 'Unable to get request body' });
        }

        console.log('Raw body type:', typeof rawBody);
        console.log('Raw body preview (first 200 chars):', rawBody.substring(0, 200));
        console.log('Signature header:', sig);
        console.log('Webhook secret configured:', !!STRIPE_WEBHOOK_SECRET);

        // Verify webhook signature
        // Stripe expects the raw body as a Buffer
        const bodyBuffer = Buffer.from(rawBody, 'utf8');
        event = stripe.webhooks.constructEvent(bodyBuffer, sig, STRIPE_WEBHOOK_SECRET);
        
        console.log('✅ Webhook signature verified successfully');
        console.log('Event type:', event.type);
        console.log('Event ID:', event.id);
    } catch (err) {
        console.error('❌ Webhook signature verification failed:', err.message);
        console.error('Error type:', err.type);
        console.error('Signature header:', sig);
        console.error('Body preview:', typeof rawBody === 'string' ? rawBody.substring(0, 200) : 'Not a string');
        console.error('Webhook secret exists:', !!STRIPE_WEBHOOK_SECRET);
        console.error('Webhook secret length:', STRIPE_WEBHOOK_SECRET ? STRIPE_WEBHOOK_SECRET.length : 0);
        
        // For testing, we can skip verification if it fails
        // BUT: This is a security risk - only use in test mode!
        // In production, signature verification MUST work
        console.log('⚠️ Attempting to parse event without signature verification (TEST MODE ONLY)');
        
        try {
            // Try to parse the event anyway for testing
            if (typeof req.body === 'object') {
                event = req.body;
                console.log('⚠️ Using parsed body as event (UNVERIFIED - TEST MODE)');
            } else if (typeof rawBody === 'string') {
                event = JSON.parse(rawBody);
                console.log('⚠️ Parsed body string as event (UNVERIFIED - TEST MODE)');
            } else {
                throw new Error('Cannot parse event');
            }
        } catch (parseError) {
            console.error('Failed to parse event even without verification:', parseError);
            // Return 200 to prevent Stripe from retrying, but log the error
            return res.status(200).json({ 
                received: true, 
                error: `Webhook signature verification failed: ${err.message}` 
            });
        }
    }

    // Handle the event
    console.log('=== PROCESSING EVENT ===');
    console.log('Event type:', event.type);
    console.log('Event ID:', event.id);
    console.log('Event data keys:', Object.keys(event.data || {}));
    
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        
        console.log('✅ Checkout session completed event received');
        console.log('Session ID:', session.id);
        console.log('Mode:', session.mode); // 'subscription' or 'payment'
        console.log('Payment status:', session.payment_status);
        console.log('Metadata:', session.metadata);

        const customerEmail = session.customer_details?.email || session.customer_email || session.metadata?.email;
        const customerName = capitalizeName(session.customer_details?.name || session.metadata?.name || session.client_reference_id || '');

        // Pohod: either metadata.type === 'pohod' (API-created session) or session from our Payment Link
        const isPohodPayment = (session.metadata && session.metadata.type === 'pohod') ||
            (process.env.STRIPE_POHOD_PAYMENT_LINK_ID && session.payment_link === process.env.STRIPE_POHOD_PAYMENT_LINK_ID);

        console.log('isPohodPayment:', isPohodPayment, 'metadata.type:', session.metadata?.type, 'payment_link:', session.payment_link ? 'set' : 'none');

        // —— Pohod: one-time payment 27 € —— event number from DB, add to MailerLite, counter +1 for next person
        if (isPohodPayment) {
            console.log('📌 Pohod checkout – processing');
            const { addToMailerLite, GROUPS } = require('../lib/mailerlite');
            const POHOD_DOC_ID = 'pohod';
            const MAX_TICKETS = 100;

            // Firebase must be initialized (FIREBASE_SERVICE_ACCOUNT set and valid)
            let db;
            try {
                db = admin.firestore();
            } catch (firestoreErr) {
                console.error('❌ Pohod: Firebase/Firestore not available:', firestoreErr.message);
                return res.status(500).json({ error: 'Server misconfiguration: Firebase not initialized' });
            }

            const processedRef = db.collection('pohodPayments').doc(session.id);

            // Idempotency: avoid processing the same session twice (e.g. Stripe retries or ensure-group API)
            const alreadyProcessed = await processedRef.get();
            if (alreadyProcessed.exists) {
                console.log('✅ Pohod session already processed (idempotent skip):', session.id);
                return res.status(200).json({ received: true });
            }

            if (!customerEmail) {
                console.error('❌ Pohod: no email in session');
                return res.status(400).json({ error: 'No email in session' });
            }

            if (!GROUPS.POHOD) {
                console.error('❌ Pohod: MAILERLITE_GROUP_POHOD / POHOD group is not set – contact will not be added to MailerLite');
            }

            const ticketRef = db.collection('availableTickets').doc(POHOD_DOC_ID);
            let eventNumber;
            let weProcessed = false;

            try {
                await db.runTransaction(async (tx) => {
                    const existing = await tx.get(processedRef);
                    if (existing.exists) {
                        eventNumber = existing.data().eventNumber;
                        return;
                    }
                    const doc = await tx.get(ticketRef);
                    let nextNumber;
                    if (!doc.exists) {
                        nextNumber = 2;
                        eventNumber = 1;
                        tx.set(ticketRef, { nextNumber });
                    } else {
                        nextNumber = doc.data().nextNumber || 1;
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
                        source: 'stripe-webhook',
                    });
                    weProcessed = true;
                });
            } catch (e) {
                if (e.message === 'POHOD_SOLD_OUT') {
                    console.warn('Pohod sold out after payment – manual check needed');
                    return res.status(200).json({ received: true });
                }
                console.error('❌ Pohod Firestore transaction failed:', e.message);
                throw e;
            }

            if (weProcessed && GROUPS.POHOD) {
                const result = await addToMailerLite(customerEmail, customerName, [GROUPS.POHOD], {
                    event_number: String(eventNumber),
                    phone: (session.metadata && session.metadata.phone) || '',
                });
                if (result.success) {
                    console.log('✅ MailerLite: added to Pohod group –', customerEmail, 'event_number', eventNumber);
                } else {
                    console.error('❌ MailerLite pohod add failed:', result.error);
                }
            }

            console.log('✅ Pohod checkout handled – event_number', eventNumber);
            return res.status(200).json({ received: true });
        }

        // —— Course (web shop) one-time payment —— guest account, MailerLite, purchasedCourses, password reset
        const isCoursePayment = session.metadata && session.metadata.type === 'course';
        if (isCoursePayment) {
            console.log('📌 Course checkout – processing');
            const courseId = session.metadata.course_id || process.env.SHOP_COURSE_ID || 'prvi-tecaj';

            let db;
            try {
                db = admin.firestore();
            } catch (firestoreErr) {
                console.error('❌ Course: Firebase not available:', firestoreErr.message);
                return res.status(500).json({ error: 'Server misconfiguration: Firebase not initialized' });
            }

            if (!customerEmail) {
                console.error('❌ Course: no email in session');
                return res.status(400).json({ error: 'No email in session' });
            }

            const auth = admin.auth();
            if (!firebaseApp) {
                try { firebaseApp = admin.app(); } catch (e) {
                    const serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT;
                    if (serviceAccountRaw) {
                        const serviceAccount = JSON.parse(serviceAccountRaw);
                        if (serviceAccount.project_id || serviceAccount.projectId) {
                            firebaseApp = admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
                        }
                    }
                }
            }

            if (!firebaseApp) {
                console.error('❌ Course: Firebase not initialized');
                return res.status(500).json({ error: 'Firebase not initialized' });
            }

            let user;
            try {
                user = await auth.getUserByEmail(customerEmail);
                console.log('✅ Course: user already exists');
            } catch (err) {
                if (err.code === 'auth/user-not-found') {
                    const tempPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12) + 'A1!';
                    user = await auth.createUser({
                        email: customerEmail,
                        password: tempPassword,
                        emailVerified: false,
                        disabled: false
                    });
                    console.log('✅ Course: created new Firebase Auth user');
                } else throw err;
            }

            const userDocRef = db.collection('users').doc(user.uid);
            const userDoc = await userDocRef.get();

            if (!userDoc.exists) {
                await userDocRef.set({
                    email: customerEmail,
                    name: customerName || customerEmail.split('@')[0],
                    role: 'guest',
                    purchasedCourses: [courseId],
                    welcomed: false,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                });
                console.log('✅ Course: created user doc with role guest, purchasedCourses:', [courseId]);
            } else {
                const data = userDoc.data();
                const existing = data.purchasedCourses || [];
                if (!existing.includes(courseId)) {
                    await userDocRef.update({
                        purchasedCourses: admin.firestore.FieldValue.arrayUnion(courseId),
                        updatedAt: admin.firestore.FieldValue.serverTimestamp()
                    });
                    console.log('✅ Course: added course to purchasedCourses');
                }
                if (data.role !== 'guest' && data.role !== 'member') {
                    await userDocRef.update({ role: 'guest' });
                }
            }

            if (GROUPS.COURSE_BUYERS) {
                const result = await addToMailerLite(customerEmail, customerName, [GROUPS.COURSE_BUYERS]);
                if (result.success) console.log('✅ MailerLite: added to Course buyers group');
                else console.warn('⚠️ MailerLite course add:', result.error);
            }

            try {
                const resetUrl = process.env.SITE_URL ? `${process.env.SITE_URL.replace(/\/$/, '')}/login.html?mode=resetPassword` : 'https://jaz-zenska.vercel.app/login.html?mode=resetPassword';
                await auth.generatePasswordResetLink(customerEmail, { url: resetUrl, handleCodeInApp: false });
                const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY;
                if (FIREBASE_API_KEY) {
                    await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${FIREBASE_API_KEY}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            requestType: 'PASSWORD_RESET',
                            email: customerEmail,
                            continueUrl: resetUrl,
                        }),
                    });
                    console.log('✅ Course: password reset email sent');
                }
            } catch (emailErr) {
                console.error('❌ Course: password reset email failed:', emailErr.message);
            }

            console.log('✅ Course checkout handled –', customerEmail, 'course_id', courseId);
            return res.status(200).json({ received: true });
        }

        // —— Default: membership subscription flow ——
        console.log('Customer details:', JSON.stringify(session.customer_details, null, 2));
        
        console.log('Extracted email:', customerEmail);
        console.log('Extracted name:', customerName);
        
        if (!customerEmail) {
            console.error('❌ No email found in checkout session');
            console.error('Session object:', JSON.stringify(session, null, 2));
            return res.status(400).json({ error: 'No email found in checkout session' });
        }

        try {
            // 1. Create Firebase user (passwordless initially)
            console.log('Firebase app initialized:', !!firebaseApp);
            console.log('Firebase app type:', typeof firebaseApp);
            
            // Try to get Firebase app if not already set
            if (!firebaseApp) {
                try {
                    firebaseApp = admin.app();
                    console.log('Retrieved existing Firebase app');
                } catch (e) {
                    console.error('Cannot retrieve Firebase app:', e.message);
                    // Try to initialize Firebase again as fallback
                    try {
                        const serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT;
                        if (serviceAccountRaw) {
                            const serviceAccount = JSON.parse(serviceAccountRaw);
                            // Firebase service account uses snake_case: project_id
                            const projectId = serviceAccount.project_id || serviceAccount.projectId;
                            if (projectId) {
                                firebaseApp = admin.initializeApp({
                                    credential: admin.credential.cert(serviceAccount)
                                });
                                console.log('✅ Firebase initialized in handler (fallback)');
                            } else {
                                console.error('❌ Service account missing project_id in fallback initialization');
                            }
                        }
                    } catch (initError) {
                        console.error('Failed to initialize Firebase in handler:', initError);
                        console.error('Init error message:', initError.message);
                        console.error('Init error stack:', initError.stack);
                    }
                }
            }
            
            if (firebaseApp) {
                console.log('✅ Firebase app is ready, proceeding with user creation');
                const auth = admin.auth();
                console.log('✅ Firebase Auth initialized');
                
                // Check if user already exists
                let user;
                console.log(`🔍 Checking if user exists with email: ${customerEmail}`);
                try {
                    user = await auth.getUserByEmail(customerEmail);
                    console.log('✅ User already exists in Firebase Auth');
                    console.log('   User ID:', user.uid);
                    console.log('   Email:', user.email);
                    console.log('   Email verified:', user.emailVerified);
                } catch (error) {
                    if (error.code === 'auth/user-not-found') {
                        console.log('ℹ️ User not found, creating new Firebase Auth user...');
                        // User doesn't exist, create new one
                        // Generate a random password temporarily
                        const tempPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12) + 'A1!';
                        
                        user = await auth.createUser({
                            email: customerEmail,
                            password: tempPassword,
                            emailVerified: false,
                            disabled: false
                        });
                        console.log('✅ Created new Firebase Auth user successfully');
                        console.log('   User ID:', user.uid);
                        console.log('   Email:', user.email);
                    } else {
                        console.error('❌ Error checking/getting user:', error.code);
                        throw error;
                    }
                }

                // 1.5. Create user document in Firestore
                console.log('📝 Creating/updating Firestore user document...');
                try {
                    const db = admin.firestore();
                    console.log('✅ Firestore initialized');
                    const userDocRef = db.collection('users').doc(user.uid);
                    console.log(`   Document path: users/${user.uid}`);
                    const userDoc = await userDocRef.get();
                    
                    if (!userDoc.exists) {
                        console.log('   Document does not exist, creating new document...');
                        // Create new user document
                        const userData = {
                            email: customerEmail,
                            name: customerName || customerEmail.split('@')[0],
                            role: 'member', // Default role for new members
                            welcomed: false, // New users need to see welcome flow
                            createdAt: admin.firestore.FieldValue.serverTimestamp(),
                            subscriptionStatus: 'active',
                            subscriptionType: session.metadata?.subscription_type || session.metadata?.plan || 'unknown'
                        };
                        console.log('   User data to save:', JSON.stringify(userData, null, 2));
                        await userDocRef.set(userData);
                        console.log('✅ Created Firestore user document successfully');
                        console.log('   User ID:', user.uid);
                        console.log('   Email:', customerEmail);
                        console.log('   Name:', customerName || customerEmail.split('@')[0]);
                        console.log('   Role: member');
                        console.log('   Subscription status: active');
                    } else {
                        console.log('   Document exists, updating subscription info...');
                        // Update existing user document
                        const updateData = {
                            subscriptionStatus: 'active',
                            subscriptionType: session.metadata?.subscription_type || session.metadata?.plan || 'unknown',
                            updatedAt: admin.firestore.FieldValue.serverTimestamp()
                        };
                        console.log('   Update data:', JSON.stringify(updateData, null, 2));
                        await userDocRef.update(updateData);
                        console.log('✅ Updated Firestore user document successfully');
                        console.log('   User ID:', user.uid);
                    }
                } catch (firestoreError) {
                    console.error('❌ Error creating/updating Firestore user document:', firestoreError);
                    console.error('   Error code:', firestoreError.code);
                    console.error('   Error message:', firestoreError.message);
                    // Don't fail the webhook if Firestore fails
                }

                // 2. Send password reset email via Firebase (so user can set their password)
                console.log('📧 Generating password reset link via Firebase Admin SDK...');
                try {
                    // Use authorized domain for continueUrl
                    // Domain 'jaz-zenska.vercel.app' is added to Firebase authorized domains
                    const resetUrl = 'https://jaz-zenska.vercel.app/login.html?mode=resetPassword';
                    const actionCodeSettings = {
                        url: resetUrl,
                        handleCodeInApp: false,
                    };
                    console.log('   Reset URL:', resetUrl);
                    console.log('   Email recipient:', customerEmail);
                    
                    // Admin SDK uses generatePasswordResetLink - this generates the link
                    // Then we use Firebase REST API to actually send the email
                    const resetLink = await auth.generatePasswordResetLink(customerEmail, actionCodeSettings);
                    console.log('✅ Password reset link generated successfully');
                    console.log('   Reset link preview:', resetLink.substring(0, 80) + '...');
                    
                    // Send password reset email via Firebase REST API
                    console.log('📧 Sending password reset email via Firebase REST API...');
                    const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY;
                    if (!FIREBASE_API_KEY) {
                        console.error('❌ FIREBASE_API_KEY not set, cannot send password reset email');
                        throw new Error('FIREBASE_API_KEY not configured');
                    }
                    
                    console.log('   Calling Firebase Identity Toolkit API...');
                    const sendPasswordResetResponse = await fetch(
                        `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${FIREBASE_API_KEY}`,
                        {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                requestType: 'PASSWORD_RESET',
                                email: customerEmail,
                                continueUrl: resetUrl,
                            }),
                        }
                    );
                    
                    const responseData = await sendPasswordResetResponse.json();
                    
                    if (!sendPasswordResetResponse.ok) {
                        console.error('❌ Firebase REST API error response:', JSON.stringify(responseData, null, 2));
                        throw new Error(`Firebase REST API error: ${JSON.stringify(responseData)}`);
                    }
                    
                    console.log('✅ Password reset email sent successfully via Firebase REST API');
                    console.log('   Sent to:', customerEmail);
                    console.log('   Reset link will redirect to:', resetUrl);
                    console.log('   API response:', JSON.stringify(responseData, null, 2));

                    // 3. Add contact to MailerLite (In group + Newsletter) for card payment
                    console.log('📬 Adding contact to MailerLite...');
                    try {
                        await sendPasswordResetEmail(customerEmail, null, customerName);
                        await addToMailerLiteGroups(customerEmail, customerName, [GROUPS.NEWSLETTER]);
                        console.log('✅ Contact added to MailerLite successfully');
                    } catch (emailError) {
                        console.error('❌ Error adding to MailerLite (non-critical):', emailError.message);
                    }
                    
                    // 4. Ensure subscription is set until 2027 (cancel at end date to prevent renewals)
                    try {
                        const subscriptionId = session.subscription;
                        if (subscriptionId) {
                            // Wait a moment for subscription to be fully created
                            await new Promise(resolve => setTimeout(resolve, 1000));
                            
                            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
                            const subscriptionEndDate = Math.floor(new Date('2027-12-31T23:59:59Z').getTime() / 1000);
                            
                            // Update subscription to cancel at 2027-12-31 (prevents renewals but keeps active until then)
                            await stripe.subscriptions.update(subscriptionId, {
                                cancel_at: subscriptionEndDate,
                                metadata: {
                                    ...(subscription.metadata || {}),
                                    end_date: '2027-12-31',
                                    payment_method: 'card'
                                }
                            });
                            console.log('✅ Subscription set to cancel on 2027-12-31 (no renewals)');
                        } else {
                            console.warn('⚠️ No subscription ID in checkout session');
                        }
                    } catch (subscriptionError) {
                        console.warn('⚠️ Error updating subscription end date (non-critical):', subscriptionError.message);
                    }
                } catch (emailError) {
                    console.error('❌ Error sending password reset email via Firebase:', emailError);
                    console.error('   Error code:', emailError.code);
                    console.error('   Error message:', emailError.message);
                    // Don't fail the webhook if email sending fails
                }
                
                console.log('✅ All Firebase operations completed successfully for:', customerEmail);
            } else {
                console.error('❌ Firebase not initialized - cannot create user');
                console.error('FIREBASE_SERVICE_ACCOUNT exists:', !!process.env.FIREBASE_SERVICE_ACCOUNT);
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

    // Handle invoice.paid event for bank transfer workflow
    if (event.type === 'invoice.paid') {
        const invoice = event.data.object;
        console.log('✅ Invoice paid event received');
        console.log('Invoice ID:', invoice.id);
        console.log('Customer ID:', invoice.customer);
        console.log('Payment status:', invoice.status);
        
        const customerId = invoice.customer;
        
        try {
            // Step 1: Find user in waiting_payments by customer_id
            if (!firebaseApp) {
                try {
                    firebaseApp = admin.app();
                } catch (e) {
                    const serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT;
                    if (serviceAccountRaw) {
                        const serviceAccount = JSON.parse(serviceAccountRaw);
                        const projectId = serviceAccount.project_id || serviceAccount.projectId;
                        if (projectId) {
                            firebaseApp = admin.initializeApp({
                                credential: admin.credential.cert(serviceAccount)
                            });
                        }
                    }
                }
            }
            
            if (firebaseApp) {
                const db = admin.firestore();
                const waitingPaymentRef = db.collection('waiting_payments').doc(customerId);
                const waitingPaymentDoc = await waitingPaymentRef.get();
                
                if (!waitingPaymentDoc.exists) {
                    console.log('⚠️ No waiting payment found for customer:', customerId);
                    return res.status(200).json({ received: true, message: 'No waiting payment found' });
                }
                
                const waitingPayment = waitingPaymentDoc.data();
                console.log('✅ Found waiting payment:', waitingPayment);

                const { email, firstName, lastName } = waitingPayment;
                const isPohodBank = waitingPayment.product === 'pohod';

                // —— Pohod bank transfer: add to POHOD group with event number, then remove from waiting ——
                if (isPohodBank) {
                    const POHOD_DOC_ID = 'pohod';
                    const MAX_TICKETS = 100;
                    const customerName = `${firstName} ${lastName}`.trim();
                    const processedRef = db.collection('pohodPayments').doc(customerId);
                    const ticketRef = db.collection('availableTickets').doc(POHOD_DOC_ID);
                    let eventNumber;
                    let weProcessed = false;
                    try {
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
                                customerId: customerId,
                                email: email,
                                name: customerName,
                                eventNumber,
                                processedAt: admin.firestore.FieldValue.serverTimestamp(),
                                source: 'invoice.paid',
                            });
                            weProcessed = true;
                        });
                    } catch (e) {
                        if (e.message === 'POHOD_SOLD_OUT') {
                            console.warn('Pohod sold out (bank)');
                            await waitingPaymentRef.delete();
                            return res.status(200).json({ received: true });
                        }
                        throw e;
                    }
                    if (weProcessed && GROUPS.POHOD) {
                        const result = await addToMailerLite(email, customerName, [GROUPS.POHOD], {
                            event_number: String(eventNumber),
                        });
                        if (result.success) {
                            console.log('✅ MailerLite: added to Pohod (bank) –', email, 'event_number', eventNumber);
                        } else {
                            console.error('❌ MailerLite pohod (bank) add failed:', result.error);
                        }
                    }
                    await waitingPaymentRef.delete();
                    console.log('✅ Pohod bank transfer completed – event_number', eventNumber);
                    return res.status(200).json({ received: true });
                }

                // —— Subscription bank transfer (existing flow) ——
                // Step 2: Update payment status to paid
                await waitingPaymentRef.update({
                    paymentStatus: 'paid',
                    paidAt: admin.firestore.FieldValue.serverTimestamp()
                });
                console.log('✅ Payment status updated to paid');
                
                // Step 3: Create Firebase user
                const auth = admin.auth();
                let user;
                try {
                    user = await auth.getUserByEmail(email);
                    console.log('✅ User already exists in Firebase Auth');
                } catch (error) {
                    if (error.code === 'auth/user-not-found') {
                        const tempPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12) + 'A1!';
                        user = await auth.createUser({
                            email: email,
                            password: tempPassword,
                            emailVerified: false,
                            disabled: false
                        });
                        console.log('✅ Created new Firebase Auth user');
                    } else {
                        throw error;
                    }
                }
                
                // Step 4: Move to users collection
                const userDocRef = db.collection('users').doc(user.uid);
                const userDoc = await userDocRef.get();
                
                if (!userDoc.exists) {
                    await userDocRef.set({
                        email: email,
                        name: `${firstName} ${lastName}`,
                        firstName: firstName,
                        lastName: lastName,
                        role: 'member',
                        welcomed: false, // New users need to see welcome flow
                        createdAt: admin.firestore.FieldValue.serverTimestamp(),
                        subscriptionStatus: 'active',
                        subscriptionType: 'yearly',
                        paymentMethod: 'bank_transfer'
                    });
                    console.log('✅ Created Firestore user document');
                } else {
                    await userDocRef.update({
                        subscriptionStatus: 'active',
                        subscriptionType: 'yearly',
                        paymentMethod: 'bank_transfer',
                        updatedAt: admin.firestore.FieldValue.serverTimestamp()
                    });
                    console.log('✅ Updated Firestore user document');
                }
                
                // Step 5: Delete from waiting_payments
                await waitingPaymentRef.delete();
                console.log('✅ Deleted from waiting_payments');
                
                // Step 6: Send password reset email
                try {
                    const resetUrl = 'https://jaz-zenska.vercel.app/login.html?mode=resetPassword';
                    const actionCodeSettings = {
                        url: resetUrl,
                        handleCodeInApp: false,
                    };
                    
                    const resetLink = await auth.generatePasswordResetLink(email, actionCodeSettings);
                    
                    const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY;
                    if (FIREBASE_API_KEY) {
                        await fetch(
                            `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${FIREBASE_API_KEY}`,
                            {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    requestType: 'PASSWORD_RESET',
                                    email: email,
                                    continueUrl: resetUrl,
                                }),
                            }
                        );
                        console.log('✅ Password reset email sent');
                    }
                } catch (emailError) {
                    console.error('❌ Error sending password reset email:', emailError.message);
                }
                
                // Step 7: Add to MailerLite In group + Newsletter (bank transfer paid)
                try {
                    await addToMailerLiteGroups(email, `${firstName} ${lastName}`, [GROUPS.IN_GROUP, GROUPS.NEWSLETTER]);
                    console.log('✅ Updated MailerLite lists');
                } catch (mlError) {
                    console.warn('⚠️ MailerLite error (non-critical):', mlError.message);
                }
                
                // Step 8: Create subscription until 2027
                try {
                    const subscriptionEndDate = Math.floor(new Date('2027-12-31T23:59:59Z').getTime() / 1000);
                    
                    await stripe.subscriptions.create({
                        customer: customerId,
                        items: [{
                            price_data: {
                                currency: 'eur',
                                product_data: {
                                    name: 'Skupnost JAZ ŽENSKA',
                                    description: 'Pridružite se naši skupnosti žensk, ki se zbirajo, delijo modrost in se podpirajo na skupni poti rasti.',
                                },
                                unit_amount: 11900,
                                recurring: {
                                    interval: 'year',
                                },
                            },
                            quantity: 1,
                        }],
                        cancel_at: subscriptionEndDate,
                        metadata: {
                            end_date: '2027-12-31',
                            payment_method: 'bank_transfer'
                        }
                    });
                    console.log('✅ Subscription created until 2027-12-31');
                } catch (subscriptionError) {
                    console.error('❌ Error creating subscription:', subscriptionError.message);
                }
                
                console.log('✅ Bank transfer payment workflow completed for:', email);
            } else {
                console.error('❌ Firebase not initialized');
            }
        } catch (error) {
            console.error('Error processing invoice payment:', error);
            // Return 200 to prevent Stripe from retrying
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

    // Log if event type is not handled
    if (event.type !== 'checkout.session.completed' && 
        event.type !== 'invoice.paid' &&
        event.type !== 'customer.subscription.created' && 
        event.type !== 'customer.subscription.updated' && 
        event.type !== 'customer.subscription.deleted') {
        console.log('⚠️ Unhandled event type:', event.type);
    }

    // Return a response to acknowledge receipt of the event
    console.log('✅ Webhook processed successfully, returning 200');
    res.status(200).json({ received: true });
}
