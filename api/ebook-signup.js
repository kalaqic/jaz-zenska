// Vercel Serverless Function for Ebook Signup
const fetch = require('node-fetch');

const GETRESPONSE_API_KEY = process.env.GETRESPONSE_API_KEY;
const GETRESPONSE_API_URL = 'https://api.getresponse.com/v3/contacts';
const EBOOK_CAMPAIGN_ID = 'fMeCu'; // Ebook campaign

if (!GETRESPONSE_API_KEY) {
    console.error('ERROR: GETRESPONSE_API_KEY environment variable is not set!');
}

module.exports = async function handler(req, res) {
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
        // Parse body if it's a string (Vercel sometimes sends string)
        let body = req.body;
        if (typeof body === 'string') {
            try {
                body = JSON.parse(body);
            } catch (e) {
                return res.status(400).json({ 
                    error: 'Invalid JSON in request body' 
                });
            }
        }

        const { email, name } = body;

        // Validate input
        if (!email || !name) {
            return res.status(400).json({ 
                error: 'Missing required fields: email, name' 
            });
        }

        // Prepare contact data for GetResponse API v3
        const contactData = {
            email: email,
            name: name,
            campaign: {
                campaignId: EBOOK_CAMPAIGN_ID
            }
        };

        console.log('=== Creating ebook signup contact ===');
        console.log('Email:', email);
        console.log('Name:', name);
        console.log('Campaign ID:', EBOOK_CAMPAIGN_ID);
        console.log('Contact data:', JSON.stringify(contactData, null, 2));

        // Try to create contact directly - GetResponse will return 409 if it already exists
        const response = await fetch(GETRESPONSE_API_URL, {
            method: 'POST',
            headers: {
                'X-Auth-Token': `api-key ${GETRESPONSE_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(contactData)
        });

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

        // Log full response for debugging
        console.log('=== GetResponse API Response ===');
        console.log('Status:', response.status);
        console.log('Response text:', responseText);
        console.log('Response data:', JSON.stringify(data, null, 2));

        // Handle response
        if (response.status === 409) {
            // 409 = Contact already exists in GetResponse account
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
                    error: data.message || data.error || 'Failed to sign up for ebook',
                    message: 'Unexpected error occurred',
                    details: data,
                    httpStatus: 409
                });
            }
        }

        if (!response.ok) {
            // Other errors (400, 500, etc.)
            console.error('GetResponse API error:', data);
            console.error('Status:', response.status);
            console.error('Full error:', JSON.stringify(data, null, 2));
            return res.status(response.status).json({ 
                error: data.message || data.error || 'Failed to sign up for ebook',
                details: data,
                httpStatus: response.status
            });
        }

        // Success (200, 201, 202)
        console.log('Ebook signup contact created successfully');
        
        return res.status(200).json({ 
            success: true, 
            message: 'Successfully signed up for ebook',
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
