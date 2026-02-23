// Add contact to MailerLite "In group" after purchase (used by stripe-webhook)
const { addToMailerLite, GROUPS, MAILERLITE_API_KEY } = require('../lib/mailerlite');

/**
 * Add contact to MailerLite In group (paid members) after purchase.
 * Called from stripe-webhook; password reset email is sent by Firebase Auth.
 * @param {string} email - Customer email
 * @param {string} resetLink - Unused (kept for backward compatibility)
 * @param {string} name - Customer name
 */
async function sendPasswordResetEmail(email, resetLink, name = '') {
    if (!MAILERLITE_API_KEY) {
        console.error('MAILERLITE_API_KEY is not set');
        throw new Error('MailerLite API key not configured');
    }

    const result = await addToMailerLite(email, name || email, [GROUPS.IN_GROUP]);

    if (result.success) {
        console.log('Contact added to MailerLite In group');
        return { success: true, message: 'Contact added to MailerLite', service: 'mailerlite', data: result.data };
    }

    console.error('MailerLite error:', result.error);
    throw new Error(result.error || 'Failed to add contact to MailerLite');
}

module.exports = { sendPasswordResetEmail };
