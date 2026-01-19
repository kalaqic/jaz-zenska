// Vercel Serverless Function for Consultation Scheduling
// This file should be in /api/consultation.js for Vercel deployment

// Use node-fetch v2 for better compatibility
// Vercel supports node-fetch v2 in CommonJS format
const fetch = require('node-fetch');

const GETRESPONSE_API_KEY = 'zn0yitbcr5jsxt6xf349zq37epsysj2b';
const GETRESPONSE_API_URL = 'https://api.getresponse.com/v3/contacts';
const CAMPAIGN_ID = 'C5wYq';
const CUSTOM_FIELD_CALL_DATE_ID = 'nIZ5dE';
const CUSTOM_FIELD_CALL_TIME_ID = 'nIZjvO';

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

        const { email, callDate, callTime } = body;

        // Validate input
        if (!email || !callDate || !callTime) {
            console.error('Missing fields:', { email: !!email, callDate: !!callDate, callTime: !!callTime });
            return res.status(400).json({ 
                error: 'Missing required fields: email, callDate, callTime',
                received: { email: !!email, callDate: !!callDate, callTime: !!callTime },
                body: body
            });
        }

        // Prepare complete contact data - send everything at once (not in steps)
        // This avoids duplicate contacts and ensures all data is saved together
        const contactData = {
            email: email,
            name: email, // Required field
            campaign: {
                campaignId: CAMPAIGN_ID
            },
            customFieldValues: [
                {
                    customFieldId: CUSTOM_FIELD_CALL_DATE_ID,
                    value: [callDate] // Format: YYYY-MM-DD
                },
                {
                    customFieldId: CUSTOM_FIELD_CALL_TIME_ID,
                    value: [callTime] // One of: 18:00, 19:00, 20:00, 21:00, 22:00
                }
            ],
            tags: ['consultation']
        };
        
        console.log('=== Sending complete contact data (all at once) ===');
        console.log('Campaign ID:', CAMPAIGN_ID);
        console.log('Custom Field IDs:', CUSTOM_FIELD_CALL_DATE_ID, CUSTOM_FIELD_CALL_TIME_ID);
        console.log('Complete request data:', JSON.stringify(contactData, null, 2));
        
        // Send to GetResponse API with all data at once
        const requestBody = JSON.stringify(contactData);
        
        console.log('=== Request Details ===');
        console.log('URL:', GETRESPONSE_API_URL);
        console.log('Method: POST');
        console.log('Request body:', requestBody);
        
        // Make request
        let response;
        try {
            response = await fetch(GETRESPONSE_API_URL, {
                method: 'POST',
                headers: {
                    'X-Auth-Token': `api-key ${GETRESPONSE_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: requestBody
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
        
        // GetResponse returns 202 Accepted - this means request is accepted
        // Contact will be processed asynchronously (may take a few minutes)
        const isSuccess = response.status >= 200 && response.status < 300;
        console.log('Is success (2xx)?', isSuccess);
        
        // Check response headers for contact ID or location
        const responseHeaders = Object.fromEntries(response.headers.entries());
        const locationHeader = response.headers.get('location') || response.headers.get('Location');
        const contactId = locationHeader ? locationHeader.split('/').pop() : null;
        
        let data = {};
        const responseText = await response.text();
        console.log('Response text length:', responseText.length);
        console.log('Response text:', responseText);
        
        if (responseText && responseText.length > 0) {
            try {
                data = JSON.parse(responseText);
            } catch (e) {
                data = { message: 'Contact accepted (202)', raw: responseText };
            }
        } else {
            // 202 often has empty body
            data = { 
                message: 'Contact accepted (202)',
                location: locationHeader,
                contactId: contactId,
                note: 'Contact creation is asynchronous. It may take a few minutes to appear in GetResponse.'
            };
        }
        
        console.log('Response data:', JSON.stringify(data, null, 2));
        console.log('Location header:', locationHeader);
        console.log('Contact ID:', contactId);

        // Handle response
        if (!isSuccess) {
            console.error('GetResponse API error:', data);
            console.error('Request that failed:', JSON.stringify(contactData, null, 2));
            
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
                details: data
            });
        }

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
