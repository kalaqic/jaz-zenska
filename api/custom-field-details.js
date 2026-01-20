// Helper endpoint to get details of specific custom field
// This will show what values are allowed for call_time field

const GETRESPONSE_API_KEY = 'nlsodeb550ot1v6swxanh0bbzjnyhoc2';
const GETRESPONSE_API_URL = 'https://api.getresponse.com/v3/custom-fields';

module.exports = async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const fetch = require('node-fetch');
        
        // Get all custom fields
        const response = await fetch(GETRESPONSE_API_URL, {
            method: 'GET',
            headers: {
                'X-Auth-Token': `api-key ${GETRESPONSE_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json({ 
                error: data.message || 'Failed to fetch custom fields',
                details: data
            });
        }

        // Find call_time field (nIZjvO) and call_date field (nIZ5dE)
        const callTimeField = Array.isArray(data) ? data.find(f => f.customFieldId === 'nIZjvO') : null;
        const callDateField = Array.isArray(data) ? data.find(f => f.customFieldId === 'nIZ5dE') : null;

        return res.status(200).json({ 
            success: true,
            allFields: data,
            callTimeField: callTimeField,
            callDateField: callDateField,
            message: 'Custom fields retrieved successfully'
        });
    } catch (error) {
        console.error('Server error:', error);
        return res.status(500).json({ 
            error: 'Internal server error',
            message: error.message
        });
    }
};
