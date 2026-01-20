// Helper endpoint to list all campaigns in GetResponse
// This will help us find the correct campaign ID

const GETRESPONSE_API_KEY = 'nlsodeb550ot1v6swxanh0bbzjnyhoc2';
const GETRESPONSE_API_URL = 'https://api.getresponse.com/v3/campaigns';

module.exports = async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Only allow GET requests
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Get all campaigns from GetResponse
        const response = await fetch(GETRESPONSE_API_URL, {
            method: 'GET',
            headers: {
                'X-Auth-Token': `api-key ${GETRESPONSE_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('GetResponse API error:', data);
            return res.status(response.status).json({ 
                error: data.message || 'Failed to fetch campaigns',
                details: data
            });
        }

        return res.status(200).json({ 
            success: true, 
            campaigns: data,
            message: 'Campaigns retrieved successfully'
        });
    } catch (error) {
        console.error('Server error:', error);
        return res.status(500).json({ 
            error: 'Internal server error',
            message: error.message
        });
    }
};
