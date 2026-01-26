// Helper function to send password reset email via GetResponse
const fetch = require('node-fetch');

const GETRESPONSE_API_KEY = process.env.GETRESPONSE_API_KEY;
const GETRESPONSE_API_URL = 'https://api.getresponse.com/v3';
const FROM_EMAIL = process.env.FROM_EMAIL || 'info@jazzenska.si';
const FROM_NAME = process.env.FROM_NAME || 'Jaz Ženska';

/**
 * Send password reset email
 * @param {string} toEmail - Recipient email
 * @param {string} resetLink - Password reset link
 * @param {string} userName - User's name (optional)
 */
async function sendPasswordResetEmail(toEmail, resetLink, userName = '') {
    const emailSubject = 'Nastavite vaše geslo - Jaz Ženska';
    const emailBody = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
        </head>
        <body style="font-family: 'Montserrat', sans-serif; line-height: 1.6; color: #3a3a3a;">
            <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="font-family: 'Playfair Display', serif; color: #643843; font-size: 32px;">Dobrodošla!</h1>
                </div>
                
                <p style="font-size: 16px; margin-bottom: 20px;">
                    ${userName ? `Pozdravljena ${userName},` : 'Pozdravljena,'}
                </p>
                
                <p style="font-size: 16px; margin-bottom: 20px;">
                    Hvala, da ste se pridružili skupnosti JAZ ŽENSKA! Vaš račun je bil uspešno ustvarjen.
                </p>
                
                <p style="font-size: 16px; margin-bottom: 30px;">
                    Za nastavitev vašega gesla kliknite na spodnjo povezavo:
                </p>
                
                <div style="text-align: center; margin: 40px 0;">
                    <a href="${resetLink}" 
                       style="display: inline-block; background: linear-gradient(135deg, #99627A 0%, #643843 100%); 
                              color: #ffffff; padding: 18px 50px; text-decoration: none; 
                              border-radius: 50px; font-weight: 600; font-size: 16px;">
                        Nastavi geslo
                    </a>
                </div>
                
                <p style="font-size: 14px; color: #666; margin-top: 30px;">
                    Če gumb ne deluje, kopirajte in prilepite to povezavo v vaš brskalnik:<br>
                    <a href="${resetLink}" style="color: #99627A; word-break: break-all;">${resetLink}</a>
                </p>
                
                <p style="font-size: 14px; color: #666; margin-top: 30px;">
                    Ta povezava je veljavna 24 ur.
                </p>
                
                <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 40px 0;">
                
                <p style="font-size: 12px; color: #999; text-align: center;">
                    Jaz Ženska<br>
                    info@jazzenska.si
                </p>
            </div>
        </body>
        </html>
    `;

    const textBody = `
Dobrodošla!

Hvala, da ste se pridružili skupnosti JAZ ŽENSKA! Vaš račun je bil uspešno ustvarjen.

Za nastavitev vašega gesla kliknite na to povezavo:
${resetLink}

Ta povezava je veljavna 24 ur.

Jaz Ženska
info@jazzenska.si
    `;

    try {
        if (!GETRESPONSE_API_KEY) {
            console.log('GetResponse API key not configured. Email would be sent to:', toEmail);
            console.log('Subject:', emailSubject);
            console.log('Reset link:', resetLink);
            return { success: false, message: 'GetResponse API key not configured' };
        }
        
        return await sendViaGetResponse(toEmail, emailSubject, emailBody, textBody, resetLink, userName);
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
}

/**
 * Send email via GetResponse
 * Note: GetResponse doesn't have a direct transactional email API
 * We'll add the user with custom fields containing the password reset link
 * You need to set up GetResponse automation to send the email when contact is added
 */
async function sendViaGetResponse(toEmail, subject, htmlBody, textBody, resetLink, userName) {
    if (!GETRESPONSE_API_KEY) {
        throw new Error('GETRESPONSE_API_KEY not configured');
    }

    const CAMPAIGN_ID = process.env.GETRESPONSE_CAMPAIGN_ID || 'froXf';
    
    try {
        // Step 1: Get or create custom field for password reset link
        // First, try to find existing custom field
        let customFieldId = null;
        try {
            const fieldsResponse = await fetch(`${GETRESPONSE_API_URL}/custom-fields`, {
                method: 'GET',
                headers: {
                    'X-Auth-Token': `api-key ${GETRESPONSE_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (fieldsResponse.ok) {
                const fields = await fieldsResponse.json();
                const passwordResetField = fields.find(f => 
                    f.name === 'password_reset_link' || 
                    f.name === 'passwordResetLink' ||
                    f.name.toLowerCase().includes('password')
                );
                if (passwordResetField) {
                    customFieldId = passwordResetField.customFieldId;
                }
            }
        } catch (fieldError) {
            console.log('Could not fetch custom fields, will add contact without custom field');
        }
        
        // Step 2: Add contact to GetResponse with password reset link
        const contactData = {
            email: toEmail,
            name: userName || toEmail,
            campaign: {
                campaignId: CAMPAIGN_ID
            }
        };
        
        // Add custom field if we found one
        if (customFieldId) {
            contactData.customFieldValues = [
                {
                    customFieldId: customFieldId,
                    value: [resetLink]
                }
            ];
        }

        // Add/update contact in GetResponse
        const contactResponse = await fetch(`${GETRESPONSE_API_URL}/contacts`, {
            method: 'POST',
            headers: {
                'X-Auth-Token': `api-key ${GETRESPONSE_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(contactData)
        });

        if (contactResponse.ok || contactResponse.status === 409) {
            // 409 means contact already exists, which is fine
            console.log('Contact added/updated in GetResponse:', toEmail);
            
            // Log email details for GetResponse automation or manual sending
            console.log('=== PASSWORD RESET EMAIL FOR GETRESPONSE ===');
            console.log('Email:', toEmail);
            console.log('Subject:', subject);
            console.log('Password Reset Link:', resetLink);
            console.log('HTML Body length:', htmlBody.length, 'characters');
            console.log('===========================================');
            
            // Note: You need to set up GetResponse automation to send this email
            // Or manually send it using the logged information
            
            return { 
                success: true, 
                service: 'getresponse',
                message: 'Contact added to GetResponse. Password reset link stored.',
                resetLink: resetLink,
                note: 'Set up GetResponse automation to send email when contact is added, or send manually using the logged link.'
            };
        } else {
            const error = await contactResponse.text();
            throw new Error(`GetResponse error: ${error}`);
        }
    } catch (error) {
        console.error('GetResponse error:', error);
        throw error;
    }
}

module.exports = { sendPasswordResetEmail };
