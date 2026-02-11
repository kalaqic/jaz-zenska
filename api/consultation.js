// Vercel Serverless Function for Consultation Scheduling
// This file should be in /api/consultation.js for Vercel deployment

// Use node-fetch v2 for better compatibility
// Vercel supports node-fetch v2 in CommonJS format
const fetch = require('node-fetch');
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

// Get API key from environment variable (set in Vercel)
const GETRESPONSE_API_KEY = process.env.GETRESPONSE_API_KEY;
const GETRESPONSE_API_URL = 'https://api.getresponse.com/v3/contacts';
// Campaign ID is now fetched from Firestore slot document (each time slot has its own campaign)
const CUSTOM_FIELD_PHONE_ID = 'no8Uze'; // phone field - actual GetResponse customFieldId
const CUSTOM_FIELD_HOUR_ID = 'noddbk'; // hour field - actual GetResponse customFieldId (HH:MM format)

// Validate API key is set
if (!GETRESPONSE_API_KEY) {
    console.error('ERROR: GETRESPONSE_API_KEY environment variable is not set!');
}

// Debug: Log configuration (without exposing full API key)
console.log('=== GetResponse API Configuration ===');
console.log('API URL:', GETRESPONSE_API_URL);
console.log('Campaign ID: (fetched from Firestore slot document)');
console.log('API Key configured:', GETRESPONSE_API_KEY ? 'Yes' : 'No');
console.log('Using fetch:', typeof fetch);

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

    // Check if API key is configured
    if (!GETRESPONSE_API_KEY) {
        console.error('GetResponse API key is not configured');
        return res.status(500).json({ 
            error: 'Server configuration error',
            message: 'API key not configured'
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

        // Validate hour format (HH:MM)
        const hourRegex = /^\d{2}:\d{2}$/;
        if (!hourRegex.test(hour)) {
            console.error('Invalid hour format:', hour);
            return res.status(400).json({ 
                error: 'Invalid hour format. Expected: HH:MM',
                received: hour
            });
        }

        // Validate date format (YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(date)) {
            console.error('Invalid date format:', date);
            return res.status(400).json({ 
                error: 'Invalid date format. Expected: YYYY-MM-DD',
                received: date
            });
        }
        
        const dateKey = date; // YYYY-MM-DD
        const timeKey = hour; // HH:MM format (already in CET)
        
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
        const slotData = slotQuery.docs[0].data();
        
        // Get campaign ID from slot document
        const campaignId = slotData.campaignId;
        if (!campaignId) {
            console.error('Slot missing campaignId:', dateKey, timeKey);
            return res.status(500).json({
                error: 'Napaka pri konfiguraciji termina. Prosimo, kontaktirajte podporo.'
            });
        }
        
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
                    campaignId: campaignId,
                    bookedAt: admin.firestore.FieldValue.serverTimestamp()
                });
            });
            console.log('Slot booked successfully:', dateKey, timeKey, 'Campaign:', campaignId);
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

        // Ensure name is properly set (GetResponse requires name field)
        // Only use email as fallback if name is truly missing/empty
        const contactName = (name && name.trim()) ? name.trim() : email;
        
        // Prepare complete contact data - send everything at once
        // GetResponse API v3 format for creating contacts with custom fields
        // Custom fields must exist in GetResponse account with these exact IDs
        const contactData = {
            email: email,
            name: contactName, // Use actual name, fallback to email only if name is missing
            campaign: {
                campaignId: campaignId // Use campaign ID from slot document
            },
            customFieldValues: [
                {
                    customFieldId: CUSTOM_FIELD_PHONE_ID, // no8Uze - phone field (phone type)
                    value: [phone] // Phone number - must be array even for single values
                },
                {
                    customFieldId: CUSTOM_FIELD_HOUR_ID, // noddbk - hour field (text type)
                    value: [hour] // Hour in HH:MM format (e.g., "09:00") - must be array
                }
            ]
            // tags: ['consultation'] // Removed - requires tag ID, not name
        };
        
        // Validate that custom field IDs are set
        if (!CUSTOM_FIELD_PHONE_ID || !CUSTOM_FIELD_HOUR_ID) {
            console.error('ERROR: Custom field IDs are not configured!');
            console.error('Phone ID:', CUSTOM_FIELD_PHONE_ID);
            console.error('Hour ID:', CUSTOM_FIELD_HOUR_ID);
        }
        
        console.log('=== Creating consultation contact ===');
        console.log('Raw input - Email:', email);
        console.log('Raw input - Name:', name);
        console.log('Raw input - Phone:', phone);
        console.log('Raw input - Hour:', hour);
        console.log('Raw input - Date:', date);
        console.log('Campaign ID:', campaignId);
        console.log('Custom Field IDs:');
        console.log('  - Phone:', CUSTOM_FIELD_PHONE_ID, '(no8Uze)');
        console.log('  - Hour:', CUSTOM_FIELD_HOUR_ID, '(noddbk)');
        console.log('Final contactData.name:', contactData.name);
        console.log('Custom field values:', JSON.stringify(contactData.customFieldValues, null, 2));
        console.log('Complete request data:', JSON.stringify(contactData, null, 2));
        
        // Try to create contact directly - GetResponse will return 409 if it already exists
        let response;
        try {
            // Format: api-key YOUR_API_KEY (with space after "api-key")
            const authHeader = `api-key ${GETRESPONSE_API_KEY}`;
            // Don't log the actual API key - only log that it's configured
            console.log('Auth header format: api-key [HIDDEN]');
            console.log('API Key configured: Yes');
            
            response = await fetch(GETRESPONSE_API_URL, {
                method: 'POST',
                headers: {
                    'X-Auth-Token': authHeader,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(contactData)
            });
            console.log('Fetch completed successfully');
        } catch (fetchError) {
            console.error('Fetch threw error:', fetchError);
            return res.status(500).json({
                error: 'Network error',
                message: fetchError.message
            });
        }
        
        console.log('Response status:', response.status);
        
        // Get response text first (might be empty for 202)
        const responseText = await response.text();
        let data = {};
        
        if (responseText && responseText.length > 0) {
            try {
                data = JSON.parse(responseText);
            } catch (e) {
                console.log('Response is not JSON (might be empty for 202):', e.message);
                data = { message: responseText };
            }
        }
        
        console.log('Response text:', responseText);
        console.log('Response data:', JSON.stringify(data, null, 2));

        // Handle response
        console.log('=== GetResponse API Response ===');
        console.log('Status:', response.status);
        console.log('Response text:', responseText);
        console.log('Response data:', JSON.stringify(data, null, 2));
        
        // Check if custom fields were saved by examining the response
        if (data.customFieldValues && Array.isArray(data.customFieldValues)) {
            console.log('✓ Custom fields found in response:', JSON.stringify(data.customFieldValues, null, 2));
        } else {
            console.warn('⚠ WARNING: Response does not include customFieldValues array');
            console.warn('This might mean custom fields were not saved. Check if custom field IDs are correct.');
            console.warn('Custom field IDs used:');
            console.warn('  - Phone:', CUSTOM_FIELD_PHONE_ID);
            console.warn('  - Hour:', CUSTOM_FIELD_HOUR_ID);
        }
        
        // Check for any errors related to custom fields
        if (data.context && Array.isArray(data.context)) {
            const customFieldErrors = data.context.filter(ctx => 
                ctx.field && (ctx.field.includes('customField') || ctx.field.includes('no8Uze') || ctx.field.includes('noddbk'))
            );
            if (customFieldErrors.length > 0) {
                console.error('✗ Custom field errors found:', JSON.stringify(customFieldErrors, null, 2));
            }
        }
        
        // 409 = Contact already exists in GetResponse account
        // BUT check the actual error message to be sure
        if (response.status === 409) {
            const errorMessage = data.message || data.error || '';
            const isAlreadyAdded = errorMessage.includes('already') || 
                                   errorMessage.includes('duplicate') ||
                                   (data.code === 1008);
            
            console.log('409 response received');
            console.log('Error message:', errorMessage);
            console.log('Is "already added" error?', isAlreadyAdded);
            console.log('Error code:', data.code);
            
            if (isAlreadyAdded) {
                return res.status(409).json({ 
                    error: 'Contact already added',
                    message: 'Contact already added',
                    details: data
                });
            } else {
                // 409 but NOT "already added" - this is a different problem
                console.error('409 but NOT "already added" error:', data);
                return res.status(500).json({ 
                    error: data.message || data.error || 'Failed to schedule consultation',
                    message: 'Unexpected error occurred',
                    details: data,
                    httpStatus: 409
                });
            }
        }

        // Check if successful (200, 201, 202)
        const isSuccess = response.status >= 200 && response.status < 300;
        
        if (!isSuccess) {
            // Other errors (400, 500, etc.)
            console.error('GetResponse API error:', data);
            console.error('Status:', response.status);
            console.error('Full error:', JSON.stringify(data, null, 2));
            
            let errorMessage = 'Failed to schedule consultation';
            if (data.message) {
                errorMessage = data.message;
            } else if (data.error) {
                errorMessage = data.error;
            } else if (data.codeDescription) {
                errorMessage = data.codeDescription;
            }
            
            return res.status(response.status).json({ 
                error: errorMessage,
                details: data,
                httpStatus: response.status
            });
        }

        // Success (200, 201, 202)
        console.log('Contact created successfully');
        console.log('Response data includes:', JSON.stringify(data, null, 2));
        
        // Check if custom fields were saved by looking at the response
        if (data.customFieldValues) {
            console.log('Custom fields in response:', JSON.stringify(data.customFieldValues, null, 2));
        } else {
            console.warn('WARNING: Response does not include customFieldValues. Custom fields may not have been saved.');
        }
        
        // Booking is already recorded in the transaction above (atomic with slot booking)
        // This prevents duplicate submissions even if GetResponse fails
        
        return res.status(200).json({ 
            success: true, 
            message: 'Successfully scheduled consultation',
            data: data,
            customFieldsSaved: !!data.customFieldValues
        });
    } catch (error) {
        console.error('Server error:', error);
        return res.status(500).json({ 
            error: 'Internal server error',
            message: error.message
        });
    }
}
