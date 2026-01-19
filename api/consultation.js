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
        const { email, callDate, callTime } = req.body;

        // Validate input
        if (!email || !callDate || !callTime) {
            return res.status(400).json({ 
                error: 'Missing required fields: email, callDate, callTime' 
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
            ],
            tags: ['consultation']
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

        const data = await response.json();

        if (!response.ok) {
            console.error('GetResponse API error:', data);
            return res.status(response.status).json({ 
                error: data.message || 'Failed to schedule consultation',
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
