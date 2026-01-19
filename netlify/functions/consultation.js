// Netlify Serverless Function for Consultation Scheduling
// This file should be in /netlify/functions/consultation.js

const GETRESPONSE_API_KEY = 'zn0yitbcr5jsxt6xf349zq37epsysj2b';
const GETRESPONSE_API_URL = 'https://api.getresponse.com/v3/contacts';

exports.handler = async (event, context) => {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    // Handle preflight request
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            body: ''
        };
    }

    try {
        const { email, callDate, callTime } = JSON.parse(event.body);

        // Validate input
        if (!email || !callDate || !callTime) {
            return {
                statusCode: 400,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    error: 'Missing required fields: email, callDate, callTime' 
                })
            };
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
            return {
                statusCode: response.status,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    error: data.message || 'Failed to schedule consultation',
                    details: data
                })
            };
        }

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                success: true, 
                message: 'Successfully scheduled consultation',
                data: data
            })
        };
    } catch (error) {
        console.error('Server error:', error);
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                error: 'Internal server error',
                message: error.message
            })
        };
    }
};
