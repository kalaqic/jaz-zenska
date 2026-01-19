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

        // Prepare contact data for GetResponse API v3
        // According to GetResponse docs, POST requests MUST have Content-Type: application/json
        // Try simplest format first - just email and campaign
        const contactDataBasic = {
            email: email,
            campaign: {
                campaignId: CAMPAIGN_ID
            }
        };
        
        console.log('=== Step 1: Testing with basic contact (no custom fields) ===');
        console.log('Campaign ID:', CAMPAIGN_ID);
        console.log('Request data:', JSON.stringify(contactDataBasic, null, 2));
        
        // Send to GetResponse API - basic contact first
        // Make sure headers are exactly as GetResponse expects (exactly like curl)
        const requestBody = JSON.stringify(contactDataBasic);
        
        // Debug: Log everything exactly as it will be sent
        console.log('=== Request Details (exactly like curl) ===');
        console.log('URL:', GETRESPONSE_API_URL);
        console.log('Method: POST');
        console.log('Header X-Auth-Token:', `api-key ${GETRESPONSE_API_KEY.substring(0, 10)}...`);
        console.log('Header Content-Type: application/json');
        console.log('Request body (JSON string):', requestBody);
        console.log('Request body (parsed):', JSON.parse(requestBody));
        console.log('Request body length:', requestBody.length);
        
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
                message: fetchError.message,
                stack: fetchError.stack
            });
        }
        
        console.log('Response status:', response.status);
        console.log('Response ok?', response.ok);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));
        
        // GetResponse returns 202 Accepted (not 201 Created) for successful contact creation
        // 202 is in 2xx range, so response.ok should be true
        const isSuccess = response.status >= 200 && response.status < 300;
        console.log('Is success (2xx)?', isSuccess);
        
        let data = {};
        const responseText = await response.text();
        console.log('Response text length:', responseText.length);
        console.log('Response text:', responseText);
        
        if (responseText && responseText.length > 0) {
            try {
                data = JSON.parse(responseText);
            } catch (e) {
                console.log('Response is not JSON (might be empty for 202):', e.message);
                data = { message: 'Contact accepted (202)', raw: responseText };
            }
        } else {
            // 202 often has empty body
            data = { message: 'Contact accepted (202 - empty body)' };
        }
        
        console.log('Step 1 - Response status:', response.status);
        console.log('Step 1 - Response data:', JSON.stringify(data, null, 2));
        
        // If basic contact works (202 or 201), try with custom fields
        if (isSuccess) {
            console.log('=== Step 2: Basic contact worked! Adding custom fields ===');
            
            const contactDataWithFields = {
                email: email,
                name: email,
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
                        value: [callTime] // Text format (e.g., "18:00")
                    }
                ]
            };
            
            console.log('Step 2 - Custom Field IDs:', CUSTOM_FIELD_CALL_DATE_ID, CUSTOM_FIELD_CALL_TIME_ID);
            console.log('Step 2 - Request data:', JSON.stringify(contactDataWithFields, null, 2));
            
            // Update existing contact with custom fields (or create new if doesn't exist)
            response = await fetch(GETRESPONSE_API_URL, {
                method: 'POST',
                headers: {
                    'X-Auth-Token': `api-key ${GETRESPONSE_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(contactDataWithFields)
            });
            
            console.log('Step 2 - Response status:', response.status);
            const responseText2 = await response.text();
            console.log('Step 2 - Response text:', responseText2);
            
            if (responseText2 && responseText2.length > 0) {
                try {
                    data = JSON.parse(responseText2);
                } catch (e) {
                    data = { message: 'Contact accepted (202)', raw: responseText2 };
                }
            } else {
                data = { message: 'Contact accepted (202 - empty body)' };
            }
            
            const isSuccess2 = response.status >= 200 && response.status < 300;
            console.log('Step 2 - Is success?', isSuccess2);
            console.log('Step 2 - Response data:', JSON.stringify(data, null, 2));
            
            // If Step 2 also succeeded, use this as final result
            if (!isSuccess2) {
                console.error('Step 2 failed - custom fields might be invalid');
                console.error('Step 2 error:', data);
                
                let errorMessage = 'Failed to add custom fields';
                if (data.message) {
                    errorMessage = data.message;
                } else if (data.error) {
                    errorMessage = data.error;
                }
                
                return res.status(response.status).json({ 
                    error: errorMessage,
                    details: data
                });
            }
        }

        // If we get here, either Step 1 succeeded (basic contact) or Step 2 succeeded (with fields)
        // Both 202 and 201 are success statuses
        const isSuccessFinal = response.status >= 200 && response.status < 300;
        
        if (!isSuccessFinal) {
            console.error('GetResponse API error:', data);
            console.error('Request that failed:', JSON.stringify(contactDataBasic, null, 2));
            
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
