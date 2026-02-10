// Vercel Serverless Function for Consultation Scheduling
// This file should be in /api/consultation.js for Vercel deployment

// Use node-fetch v2 for better compatibility
// Vercel supports node-fetch v2 in CommonJS format
const fetch = require('node-fetch');
const { detectBot } = require('./bot-filter');

// Get API key from environment variable (set in Vercel)
const GETRESPONSE_API_KEY = process.env.GETRESPONSE_API_KEY;
const GETRESPONSE_API_URL = 'https://api.getresponse.com/v3/contacts';
const CAMPAIGN_ID = 'frqWU'; // Consultation campaign
const CUSTOM_FIELD_DATE_TIME_ID = 'noyCaD'; // call_datetime field - actual GetResponse customFieldId
const CUSTOM_FIELD_PHONE_ID = 'no8Uze'; // phone field - actual GetResponse customFieldId
const CUSTOM_FIELD_DAY_ID = 'noqq62'; // day field - actual GetResponse customFieldId

// Validate API key is set
if (!GETRESPONSE_API_KEY) {
    console.error('ERROR: GETRESPONSE_API_KEY environment variable is not set!');
}

// Debug: Log configuration (without exposing full API key)
console.log('=== GetResponse API Configuration ===');
console.log('API URL:', GETRESPONSE_API_URL);
console.log('Campaign ID:', CAMPAIGN_ID);
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

        const { email, name, phone, noyCaD, day, are_you_a_bot, form_start_time } = body;

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
        if (!email || !noyCaD || !name || !phone || !day) {
            console.error('Missing fields:', { 
                email: !!email, 
                name: !!name, 
                phone: !!phone, 
                noyCaD: !!noyCaD, 
                day: !!day 
            });
            return res.status(400).json({ 
                error: 'Missing required fields: email, name, phone, noyCaD, day',
                received: { 
                    email: !!email, 
                    name: !!name, 
                    phone: !!phone, 
                    noyCaD: !!noyCaD, 
                    day: !!day 
                },
                body: body
            });
        }

        // Validate date-time format (YYYY-MM-DDTHH:MM:SSZ)
        const dateTimeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
        if (!dateTimeRegex.test(noyCaD)) {
            console.error('Invalid date-time format:', noyCaD);
            return res.status(400).json({ 
                error: 'Invalid date-time format. Expected: YYYY-MM-DDTHH:MM:SSZ',
                received: noyCaD
            });
        }

        // Hard-limit availability (must match frontend)
        // Only allow 16.2.2026 at: 09:00, 09:30, 10:00, 10:30, 11:00 (Slovenia CET = UTC+1)
        const allowedDateTimesUtc = new Set([
            '2026-02-16T08:00:00Z', // 09:00 CET
            '2026-02-16T08:30:00Z', // 09:30 CET
            '2026-02-16T09:00:00Z', // 10:00 CET
            '2026-02-16T09:30:00Z', // 10:30 CET
            '2026-02-16T10:00:00Z'  // 11:00 CET
        ]);

        if (!allowedDateTimesUtc.has(noyCaD)) {
            console.error('Requested consultation time is not allowed:', noyCaD);
            return res.status(400).json({
                error: 'Izbrani termin ni več na voljo. Prosimo, izberite enega od razpoložljivih terminov.'
            });
        }

        // Optional: also validate the day name (16.2.2026 is Monday)
        if (day !== 'Ponedeljek') {
            console.error('Invalid day for allowed date:', day, 'for noyCaD:', noyCaD);
            return res.status(400).json({
                error: 'Neveljaven datum/termin. Prosimo, poskusite znova.'
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
                campaignId: CAMPAIGN_ID
            },
            customFieldValues: [
                {
                    customFieldId: CUSTOM_FIELD_DATE_TIME_ID, // noyCaD - call_datetime field (date type)
                    value: [noyCaD] // Format: YYYY-MM-DDTHH:MM:SSZ (UTC) - ISO 8601 format, must be array
                },
                {
                    customFieldId: CUSTOM_FIELD_PHONE_ID, // no8Uze - phone field (phone type)
                    value: [phone] // Phone number - must be array even for single values
                },
                {
                    customFieldId: CUSTOM_FIELD_DAY_ID, // noqq62 - day field (text type)
                    value: [day] // Day name (e.g., "Nedelja", "Ponedeljek") - must be array
                }
            ]
            // tags: ['consultation'] // Removed - requires tag ID, not name
        };
        
        // Validate that custom field IDs are set
        if (!CUSTOM_FIELD_DATE_TIME_ID || !CUSTOM_FIELD_PHONE_ID || !CUSTOM_FIELD_DAY_ID) {
            console.error('ERROR: Custom field IDs are not configured!');
            console.error('Date-Time ID:', CUSTOM_FIELD_DATE_TIME_ID);
            console.error('Phone ID:', CUSTOM_FIELD_PHONE_ID);
            console.error('Day ID:', CUSTOM_FIELD_DAY_ID);
        }
        
        console.log('=== Creating consultation contact ===');
        console.log('Raw input - Email:', email);
        console.log('Raw input - Name:', name);
        console.log('Raw input - Phone:', phone);
        console.log('Raw input - Day:', day);
        console.log('Raw input - noyCaD:', noyCaD);
        console.log('Campaign ID:', CAMPAIGN_ID);
        console.log('Custom Field IDs:');
        console.log('  - Date-Time (call_datetime):', CUSTOM_FIELD_DATE_TIME_ID, '(noyCaD)');
        console.log('  - Phone:', CUSTOM_FIELD_PHONE_ID, '(no8Uze)');
        console.log('  - Day:', CUSTOM_FIELD_DAY_ID, '(noqq62)');
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
            console.warn('  - Date-Time:', CUSTOM_FIELD_DATE_TIME_ID, '(noyCaD)');
            console.warn('  - Phone:', CUSTOM_FIELD_PHONE_ID);
            console.warn('  - Day:', CUSTOM_FIELD_DAY_ID);
        }
        
        // Check for any errors related to custom fields
        if (data.context && Array.isArray(data.context)) {
            const customFieldErrors = data.context.filter(ctx => 
                ctx.field && (ctx.field.includes('customField') || ctx.field.includes('noyCaD') || ctx.field.includes('no8Uze') || ctx.field.includes('noqq62'))
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
