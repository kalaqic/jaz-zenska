// Vercel Serverless Function for Consultation Scheduling
// This file should be in /api/consultation.js for Vercel deployment

// Use node-fetch v2 for better compatibility
// Vercel supports node-fetch v2 in CommonJS format
const fetch = require('node-fetch');

const GETRESPONSE_API_KEY = 'zn0yitbcr5jsxt6xf349zq37epsysj2b';
const GETRESPONSE_API_URL = 'https://api.getresponse.com/v3/contacts';
const CAMPAIGN_ID = 'frqWU';
const CUSTOM_FIELD_DATE_TIME_ID = 'noyCaD';

// Debug: Log configuration
console.log('=== GetResponse API Configuration ===');
console.log('API URL:', GETRESPONSE_API_URL);
console.log('Campaign ID:', CAMPAIGN_ID);
console.log('API Key (first 15 chars):', GETRESPONSE_API_KEY.substring(0, 15) + '...');
console.log('Using fetch:', typeof fetch);

module.exports = async function handler(req, res) {
    // Set CORS headers for all requests
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours

    // Handle preflight OPTIONS request first
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
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

        const { email, noyCaD } = body;

        // Validate input
        if (!email || !noyCaD) {
            console.error('Missing fields:', { email: !!email, noyCaD: !!noyCaD });
            return res.status(400).json({ 
                error: 'Missing required fields: email, noyCaD',
                received: { email: !!email, noyCaD: !!noyCaD },
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

        // Prepare complete contact data - send everything at once
        // Note: tags field removed - GetResponse requires tag IDs, not tag names
        // If tags are needed, they must be created first and their IDs used here
        const contactData = {
            email: email,
            name: email, // Required field
            campaign: {
                campaignId: CAMPAIGN_ID
            },
            customFieldValues: [
                {
                    customFieldId: CUSTOM_FIELD_DATE_TIME_ID,
                    value: [noyCaD] // Format: YYYY-MM-DDTHH:MM:SSZ (UTC)
                }
            ]
            // tags: ['consultation'] // Removed - requires tag ID, not name
        };
        
        console.log('=== Creating consultation contact ===');
        console.log('Email:', email);
        console.log('Campaign ID:', CAMPAIGN_ID);
        console.log('Date-Time (noyCaD):', noyCaD);
        console.log('Complete request data:', JSON.stringify(contactData, null, 2));
        
        // Try to create contact directly - GetResponse will return 409 if it already exists
        let response;
        try {
            response = await fetch(GETRESPONSE_API_URL, {
                method: 'POST',
                headers: {
                    'X-Auth-Token': `api-key ${GETRESPONSE_API_KEY}`,
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
        return res.status(200).json({ 
            success: true, 
            message: 'Successfully scheduled consultation',
            data: data
        });
    } catch (error) {
        console.error('Server error:', error);
        return res.status(500).json({ 
            error: 'Internal server error',
            message: error.message
        });
    }
}
