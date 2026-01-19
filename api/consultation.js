// Vercel Serverless Function for Consultation Scheduling
// This file should be in /api/consultation.js for Vercel deployment

const GETRESPONSE_API_KEY = 'zn0yitbcr5jsxt6xf349zq37epsysj2b';
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

    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
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

        const { email, callDate, callTime } = body;

        // Validate input
        if (!email || !callDate || !callTime) {
            return res.status(400).json({ 
                error: 'Missing required fields: email, callDate, callTime',
                received: { email: !!email, callDate: !!callDate, callTime: !!callTime }
            });
        }

        // Prepare contact data for GetResponse API v3
        const contactData = {
            email: email,
            campaign: {
                campaignId: 'HljnR'
            },
            customFieldValues: [
                {
                    customFieldId: 'hPOla6',
                    value: [callDate] // Format: YYYY-MM-DD
                },
                {
                    customFieldId: 'hPO0d2',
                    value: [callTime] // Text format (e.g., "18:00")
                }
            ]
            // Note: tags removed - GetResponse might require tagId instead of tag name
        };

        // Send to GetResponse API
        const response = await fetch(GETRESPONSE_API_URL, {
            method: 'POST',
            headers: {
                'X-Auth-Token': `api-key ${GETRESPONSE_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(contactData)
        });

        let data;
        try {
            data = await response.json();
        } catch (e) {
            const text = await response.text();
            console.error('GetResponse API error - non-JSON response:', text);
            return res.status(response.status).json({ 
                error: 'GetResponse API returned invalid response',
                details: text
            });
        }

        if (!response.ok) {
            console.error('GetResponse API error:', data);
            console.error('Request sent:', JSON.stringify(contactData, null, 2));
            return res.status(response.status).json({ 
                error: data.message || data.error || 'Failed to schedule consultation',
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
