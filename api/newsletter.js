// Vercel Serverless Function for Newsletter + Ebook signup (MailerLite)
// POST body: { email, name, type?: 'newsletter' | 'ebook' } — default type is 'newsletter'
const { detectBot } = require('../lib/bot-filter');
const { addToMailerLite, GROUPS, MAILERLITE_API_KEY } = require('../lib/mailerlite');

if (!MAILERLITE_API_KEY) {
    console.error('ERROR: MAILERLITE_API_KEY environment variable is not set!');
}

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Max-Age', '86400');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    if (!MAILERLITE_API_KEY) {
        return res.status(500).json({
            error: 'Server configuration error',
            message: 'API key not configured',
        });
    }

    try {
        let body = req.body;
        if (typeof body === 'string') {
            try {
                body = JSON.parse(body);
            } catch (e) {
                return res.status(400).json({ error: 'Invalid JSON in request body' });
            }
        }

        const { email, name, type = 'newsletter', are_you_a_bot, form_start_time } = body || {};
        const signupType = String(type).toLowerCase() === 'ebook' ? 'ebook' : 'newsletter';
        const groupIds = signupType === 'ebook' ? [GROUPS.EBOOK] : [GROUPS.NEWSLETTER];

        const botCheck = detectBot(req, body);
        if (botCheck.isBot) {
            console.log('Bot detected:', botCheck.reason, 'IP:', req.headers['x-forwarded-for'] || 'unknown');
            return res.status(200).json({ success: true, message: signupType === 'ebook' ? 'Successfully signed up for ebook' : 'Successfully subscribed to newsletter' });
        }

        if (!email || !name) {
            return res.status(400).json({ error: 'Missing required fields: email, name' });
        }

        const normalizedEmail = String(email).trim().toLowerCase();
        const normalizedName = String(name).trim();

        const result = await addToMailerLite(normalizedEmail, normalizedName, groupIds);

        if (result.success) {
            return res.status(200).json({
                success: true,
                message: result.alreadyExists
                    ? (signupType === 'ebook' ? 'Already signed up for ebook' : 'Already subscribed to newsletter')
                    : (signupType === 'ebook' ? 'Successfully signed up for ebook' : 'Successfully subscribed to newsletter'),
                alreadyExists: result.alreadyExists,
            });
        }

        if (result.status === 422) {
            return res.status(400).json({
                error: result.error || 'Invalid email or data',
                message: result.error,
            });
        }

        console.error('MailerLite error:', result.error, 'Status:', result.status);
        return res.status(result.status >= 400 ? result.status : 500).json({
            error: result.error || (signupType === 'ebook' ? 'Failed to sign up for ebook' : 'Failed to subscribe to newsletter'),
            message: result.error,
        });
    } catch (error) {
        console.error('Server error:', error);
        return res.status(500).json({ error: 'Internal server error', message: error.message });
    }
};
