// Helper function to add contact to GetResponse after purchase
// Similar to newsletter.js - waits for purchase and adds contact to GetResponse campaign
const fetch = require('node-fetch');

const GETRESPONSE_API_KEY = process.env.GETRESPONSE_API_KEY;
const GETRESPONSE_API_URL = 'https://api.getresponse.com/v3/contacts';
const CAMPAIGN_ID = 'fQYMW'; // Campaign ID for purchase emails

/**
 * Add contact to GetResponse campaign after purchase
 * @param {string} email - Customer email from purchase
 * @param {string} name - Customer name from purchase
 */
async function sendPasswordResetEmail(email, resetLink, name = '') {
    if (!GETRESPONSE_API_KEY) {
        console.error('ERROR: GETRESPONSE_API_KEY environment variable is not set!');
        throw new Error('GetResponse API key not configured');
    }

    // Prepare contact data for GetResponse API v3
    const contactData = {
        email: email,
        name: name || email,
        campaign: {
            campaignId: CAMPAIGN_ID
        }
    };

    console.log('=== Adding contact to GetResponse after purchase ===');
    console.log('Email:', email);
    console.log('Name:', name);
    console.log('Campaign ID:', CAMPAIGN_ID);
    console.log('Contact data:', JSON.stringify(contactData, null, 2));

    try {
        // Add contact to GetResponse campaign
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
                console.log('Contact already exists in GetResponse');
                return { 
                    success: true, 
                    message: 'Contact already added to GetResponse',
                    service: 'getresponse'
                };
            } else {
                throw new Error(`GetResponse error: ${errorMessage}`);
            }
        }

        if (!response.ok) {
            const error = data.message || data.error || 'Failed to add contact to GetResponse';
            console.error('GetResponse API error:', error);
            throw new Error(`GetResponse error: ${error}`);
        }

        // Success (200, 201, 202)
        console.log('Contact added to GetResponse successfully');
        return { 
            success: true, 
            message: 'Contact added to GetResponse campaign',
            service: 'getresponse',
            data: data
        };
    } catch (error) {
        console.error('Error adding contact to GetResponse:', error);
        throw error;
    }
}

module.exports = { sendPasswordResetEmail };
