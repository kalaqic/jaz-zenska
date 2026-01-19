// Helper endpoint to check if a contact exists in GetResponse

const GETRESPONSE_API_KEY = 'zn0yitbcr5jsxt6xf349zq37epsysj2b';
const GETRESPONSE_API_URL = 'https://api.getresponse.com/v3/contacts';

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
        const { email } = req.query;

        if (!email) {
            return res.status(400).json({ error: 'Email parameter is required' });
        }

        // Search for contact by email
        const searchUrl = `${GETRESPONSE_API_URL}?query[email]=${encodeURIComponent(email)}`;
        
        console.log('Searching for contact:', email);
        console.log('Search URL:', searchUrl);

        const response = await fetch(searchUrl, {
            method: 'GET',
            headers: {
                'X-Auth-Token': `api-key ${GETRESPONSE_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        console.log('Search response status:', response.status);
        console.log('Search response:', JSON.stringify(data, null, 2));

        if (!response.ok) {
            return res.status(response.status).json({
                success: false,
                error: data.message || 'Failed to search for contact',
                details: data
            });
        }

        // Check if contact was found
        const contacts = Array.isArray(data) ? data : [];
        const found = contacts.length > 0;

        return res.status(200).json({
            success: true,
            found: found,
            email: email,
            contacts: contacts,
            count: contacts.length,
            message: found ? 'Contact found' : 'Contact not found'
        });
    } catch (error) {
        console.error('Server error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
};
