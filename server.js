const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// GetResponse API configuration
const GETRESPONSE_API_KEY = 'zn0yitbcr5jsxt6xf349zq37epsysj2b';
const GETRESPONSE_API_URL = 'https://api.getresponse.com/v3/contacts';

// Newsletter subscription endpoint
app.post('/api/newsletter', async (req, res) => {
    try {
        const { email, firstName, lastName } = req.body;

        // Validate input
        if (!email || !firstName || !lastName) {
            return res.status(400).json({ 
                error: 'Missing required fields: email, firstName, lastName' 
            });
        }

        // Prepare contact data for GetResponse API v3
        const contactData = {
            email: email,
            name: `${firstName} ${lastName}`,
            campaign: {
                campaignId: 'HljnR'
            }
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
                error: data.message || 'Failed to subscribe to newsletter',
                details: data
            });
        }

        res.json({ 
            success: true, 
            message: 'Successfully subscribed to newsletter',
            data: data
        });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message
        });
    }
});

// Consultation scheduling endpoint
app.post('/api/consultation', async (req, res) => {
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

        res.json({ 
            success: true, 
            message: 'Successfully scheduled consultation',
            data: data
        });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
});
