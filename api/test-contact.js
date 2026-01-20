// Test endpoint to debug contact creation
// This will help us test different formats

const GETRESPONSE_API_KEY = 'nlsodeb550ot1v6swxanh0bbzjnyhoc2';
const GETRESPONSE_API_URL = 'https://api.getresponse.com/v3/contacts';

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

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { email } = req.body || {};
        const testEmail = email || `test${Date.now()}@example.com`;

        // Try the simplest possible format - exactly as shown in GetResponse docs
        const contactData = {
            email: testEmail,
            campaign: {
                campaignId: 'C5wYq'
            }
        };

        console.log('=== TEST: Simplest format ===');
        console.log('Campaign ID: C5wYq');
        console.log('Email:', testEmail);
        console.log('Request body:', JSON.stringify(contactData, null, 2));
        console.log('Headers:', {
            'X-Auth-Token': `api-key ${GETRESPONSE_API_KEY.substring(0, 10)}...`,
            'Content-Type': 'application/json'
        });

        // Make request exactly like curl does
        const requestBodyString = JSON.stringify(contactData);
        console.log('Request body string (exact):', requestBodyString);
        console.log('Request body bytes:', Buffer.from(requestBodyString).length);
        
        const response = await fetch(GETRESPONSE_API_URL, {
            method: 'POST',
            headers: {
                'X-Auth-Token': `api-key ${GETRESPONSE_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: requestBodyString
        });

        console.log('Fetch completed, status:', response.status);
        console.log('Response headers:', JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2));
        
        const responseText = await response.text();
        console.log('Raw response text length:', responseText.length);
        console.log('Raw response text (first 500 chars):', responseText.substring(0, 500));
        
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            console.error('Failed to parse JSON:', e.message);
            data = { raw: responseText, parseError: e.message };
        }

        console.log('Parsed response:', JSON.stringify(data, null, 2));

        return res.status(response.status).json({
            success: response.ok,
            status: response.status,
            request: contactData,
            response: data,
            message: response.ok ? 'Contact created successfully' : 'Failed to create contact'
        });
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: error.message,
            stack: error.stack
        });
    }
};
