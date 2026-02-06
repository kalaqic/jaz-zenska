// Vercel Serverless Function for Webinar Signup
// Sends email to GetResponse campaign

const fetch = require('node-fetch');

// Get API key from environment variable (set in Vercel)
const GETRESPONSE_API_KEY = process.env.GETRESPONSE_API_KEY;
const GETRESPONSE_API_URL = 'https://api.getresponse.com/v3/contacts';
const DEFAULT_CAMPAIGN_ID = 'froIl'; // Default webinar campaign ID
const SRECA_CAMPAIGN_ID = 'f5M9D'; // Sreca webinar campaign ID

// Validate API key is set
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

        const { email, name, campaignId, are_you_a_bot } = body;

        // Honeypot check - if filled, it's a bot, silently reject
        if (are_you_a_bot && String(are_you_a_bot).trim() !== '') {
            console.log('Bot detected via honeypot field (webinar)');
            // Return success to bot (don't let them know they were caught)
            return res.status(200).json({
                success: true,
                message: 'Successfully signed up for webinar'
            });
        }

        // Validate input
        if (!email) {
            return res.status(400).json({ 
                error: 'Missing required field: email' 
            });
        }

        const normalizedEmail = String(email).trim().toLowerCase();

        // Determine campaign ID - use provided campaignId, or default to froIl
        // If campaignId is 'f5M9D' (sreca), use that, otherwise use default
        let selectedCampaignId = DEFAULT_CAMPAIGN_ID;
        if (campaignId === 'f5M9D' || campaignId === SRECA_CAMPAIGN_ID) {
            selectedCampaignId = SRECA_CAMPAIGN_ID;
        } else if (campaignId) {
            selectedCampaignId = campaignId; // Allow custom campaign IDs
        }

        // Prepare contact data for GetResponse API v3
        const contactData = {
            email: normalizedEmail,
            name: name || normalizedEmail.split('@')[0], // Use provided name or email prefix as fallback
            campaign: {
                campaignId: selectedCampaignId
            }
        };

        console.log('=== Creating webinar signup ===');
        console.log('Email:', normalizedEmail);
        console.log('Campaign ID:', selectedCampaignId);
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
            
            if (isAlreadyAdded) {
                return res.status(200).json({ 
                    success: true,
                    message: 'Already signed up for webinar',
                    alreadyExists: true
                });
            } else {
                console.error('409 but NOT "already added" error:', data);
                return res.status(500).json({ 
                    error: data.message || data.error || 'Failed to sign up for webinar',
                    details: data
                });
            }
        }

        if (!response.ok) {
            console.error('GetResponse API error:', data);
            return res.status(response.status).json({ 
                error: data.message || data.error || 'Failed to sign up for webinar',
                details: data
            });
        }

        // Success (200, 201, 202)
        console.log('Webinar signup successful');
        
        return res.status(200).json({ 
            success: true, 
            message: 'Successfully signed up for webinar',
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
