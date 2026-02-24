// Vercel Serverless Function for Consultation Scheduling
// This file should be in /api/consultation.js for Vercel deployment

const admin = require('firebase-admin');
const { detectBot } = require('../lib/bot-filter');

// Initialize Firebase Admin
let firebaseApp;
let db;
try {
    const serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (serviceAccountRaw) {
        const serviceAccount = JSON.parse(serviceAccountRaw);
        try {
            firebaseApp = admin.app();
        } catch (e) {
            firebaseApp = admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
        }
        db = admin.firestore();
    }
} catch (error) {
    console.error('Error initializing Firebase Admin:', error);
}

const { addToMailerLite, GROUPS, MAILERLITE_API_KEY } = require('../lib/mailerlite');

if (!MAILERLITE_API_KEY) {
    console.error('ERROR: MAILERLITE_API_KEY environment variable is not set!');
}

module.exports = async function handler(req, res) {
    // Get the origin from the request
    const origin = req.headers.origin || req.headers.referer || '*';
    
    // Set CORS headers for all requests
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Max-Age', '86400');

    // Handle preflight OPTIONS request first - MUST return 200
    if (req.method === 'OPTIONS') {
        res.status(200);
        res.end();
        return;
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    if (!MAILERLITE_API_KEY) {
        return res.status(500).json({
            error: 'Server configuration error',
            message: 'API key not configured',
        });
    }

    try {
        // Vercel serverless functions receive req.body as parsed JSON
        // But sometimes it might be a string, so we handle both cases
        let body = req.body;
        
        // If body is undefined or empty, try to read from request
        if (!body) {
            const chunks = [];
            for await (const chunk of req) {
                chunks.push(chunk);
            }
            const rawBody = Buffer.concat(chunks).toString();
            if (rawBody) {
                try {
                    body = JSON.parse(rawBody);
                } catch (e) {
                    console.error('Failed to parse raw body:', rawBody);
                }
            }
        }
        
        // If still string, parse it
        if (typeof body === 'string') {
            try {
                body = JSON.parse(body);
            } catch (e) {
                console.error('JSON parse error:', e);
                return res.status(400).json({ 
                    error: 'Invalid JSON in request body',
                    details: e.message
                });
            }
        }

        console.log('Received body:', JSON.stringify(body, null, 2));
        console.log('Body type:', typeof body);
        console.log('Req.body:', req.body);

        const { email, name, phone, hour, date, are_you_a_bot, form_start_time } = body;

        // Comprehensive bot detection
        const botCheck = detectBot(req, body);
        if (botCheck.isBot) {
            console.log('Bot detected (consultation):', botCheck.reason, 'IP:', req.headers['x-forwarded-for'] || 'unknown');
            // Return success to bot (don't let them know they were caught)
            return res.status(200).json({ 
                success: true, 
                message: 'Successfully scheduled consultation'
            });
        }

        // Validate input
        if (!email || !name || !phone || !hour || !date) {
            console.error('Missing fields:', { 
                email: !!email, 
                name: !!name, 
                phone: !!phone, 
                hour: !!hour,
                date: !!date
            });
            return res.status(400).json({ 
                error: 'Missing required fields: email, name, phone, hour, date',
                received: { 
                    email: !!email, 
                    name: !!name, 
                    phone: !!phone, 
                    hour: !!hour,
                    date: !!date
                },
                body: body
            });
        }

        // Validate and normalize hour to HH (Firebase and MailerLite use HH only)
        const hourStr = String(hour).trim();
        let timeKey; // 2-digit HH e.g. "09", "15"
        if (/^\d{1,2}$/.test(hourStr)) {
            timeKey = hourStr.padStart(2, '0'); // "9" -> "09", "15" -> "15"
        } else if (/^\d{2}:\d{2}$/.test(hourStr)) {
            timeKey = hourStr.slice(0, 2); // "15:00" -> "15"
        } else {
            return res.status(400).json({
                error: 'Invalid hour. Expected HH (e.g. 9 or 15) or HH:MM (e.g. 15:00).',
                received: hour,
            });
        }

        // Validate date format (YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(date)) {
            console.error('Invalid date format:', date);
            return res.status(400).json({
                error: 'Invalid date format. Expected: YYYY-MM-DD',
                received: date,
            });
        }

        const dateKey = date; // YYYY-MM-DD
        
        // Check availability in Firestore
        if (!db) {
            console.error('Firebase Firestore not initialized');
            return res.status(500).json({
                error: 'Database not available'
            });
        }
        
        // Check if this email has already booked a consultation
        const existingBookingQuery = await db.collection('bookedConsultations')
            .where('email', '==', email.toLowerCase().trim())
            .limit(1)
            .get();
        
        if (!existingBookingQuery.empty) {
            console.log('Email already has a consultation booking:', email);
            return res.status(400).json({
                error: 'Ta email naslov je že uporabljen za rezervacijo konzultacije. Prosimo, uporabite drug email naslov ali kontaktirajte podporo.'
            });
        }
        
        // Find the slot document first (outside transaction)
        const slotQuery = await db.collection('consultationSlots')
            .where('date', '==', dateKey)
            .where('time', '==', timeKey)
            .limit(1)
            .get();
        
        if (slotQuery.empty) {
            console.error('Slot not found:', dateKey, timeKey);
            return res.status(400).json({
                error: 'Izbrani termin ni več na voljo. Prosimo, izberite enega od razpoložljivih terminov.'
            });
        }
        
        const slotDocRef = slotQuery.docs[0].ref;

        // Use a transaction to atomically check and book the slot
        // This prevents double-booking if two users try to book the same slot simultaneously
        try {
            await db.runTransaction(async (transaction) => {
                const freshSlot = await transaction.get(slotDocRef);
                
                if (!freshSlot.exists) {
                    throw new Error('Slot does not exist');
                }
                
                const freshData = freshSlot.data();
                if (!freshData.available) {
                    throw new Error('Slot already booked');
                }
                
                // Mark as unavailable
                transaction.update(slotDocRef, {
                    available: false
                });
                
                // Record the booking to prevent duplicate submissions (atomic with slot booking)
                const bookingRef = db.collection('bookedConsultations').doc();
                transaction.set(bookingRef, {
                    email: email.toLowerCase().trim(),
                    date: dateKey,
                    time: timeKey,
                    bookedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
            });
            console.log('Slot booked successfully:', dateKey, timeKey);
        } catch (transactionError) {
            console.error('Transaction error:', transactionError);
            if (transactionError.message === 'Slot does not exist') {
                return res.status(400).json({
                    error: 'Izbrani termin ni več na voljo. Prosimo, izberite enega od razpoložljivih terminov.'
                });
            }
            if (transactionError.message === 'Slot already booked') {
                return res.status(400).json({
                    error: 'Izbrani termin je že zaseden. Prosimo, izberite drug termin.'
                });
            }
            return res.status(500).json({
                error: 'Napaka pri rezervaciji termina. Prosimo, poskusite znova.'
            });
        }

        const contactName = (name && name.trim()) ? name.trim() : email;

        // Normalize phone for MailerLite (keep +international format)
        let normalizedPhone = phone.trim().replace(/[\s\-\(\)]/g, '');
        if (!normalizedPhone.startsWith('+')) {
            if (normalizedPhone.startsWith('386')) {
                normalizedPhone = '+' + normalizedPhone;
            } else if (normalizedPhone.startsWith('0')) {
                normalizedPhone = '+386' + normalizedPhone.substring(1);
            } else {
                normalizedPhone = '+' + normalizedPhone.replace(/\D/g, '');
            }
        }
        if (!normalizedPhone.match(/^\+\d+$/)) {
            normalizedPhone = '+' + normalizedPhone.replace(/\D/g, '');
        }

        // MailerLite: Consultation Call group. termin_time as HH without leading zero ("9", "15")
        const hourForMailerLite = parseInt(timeKey, 10).toString(); // "09" -> "9", "15" -> "15"
        const result = await addToMailerLite(
            email.trim().toLowerCase(),
            contactName,
            [GROUPS.CONSULTATION],
            {
                phone: normalizedPhone,
                termin_date: dateKey,
                termin_time: hourForMailerLite,
            }
        );

        if (!result.success) {
            console.error('MailerLite consultation error:', result.error, 'Status:', result.status);
            return res.status(result.status === 422 ? 400 : (result.status >= 400 ? result.status : 500)).json({
                error: result.error || 'Failed to save consultation details',
                message: result.error,
            });
        }

        console.log('Consultation contact added to MailerLite successfully');
        return res.status(200).json({
            success: true,
            message: 'Successfully scheduled consultation',
            customFieldsSaved: true,
        });
    } catch (error) {
        console.error('Server error:', error);
        return res.status(500).json({ 
            error: 'Internal server error',
            message: error.message
        });
    }
}
