// Vercel Serverless Function for Ebook Signup (MailerLite)
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

        const { email, name, are_you_a_bot, form_start_time } = body;

        const botCheck = detectBot(req, body);
        if (botCheck.isBot) {
            console.log('Bot detected (ebook):', botCheck.reason);
            return res.status(200).json({ success: true, message: 'Successfully signed up for ebook' });
        }

        if (!email || !name) {
            return res.status(400).json({ error: 'Missing required fields: email, name' });
        }

        const normalizedEmail = String(email).trim().toLowerCase();
        const normalizedName = String(name).trim();

        const result = await addToMailerLite(normalizedEmail, normalizedName, [GROUPS.EBOOK]);

        if (result.success) {
            return res.status(200).json({
                success: true,
                message: 'Successfully signed up for ebook',
                alreadyExists: result.alreadyExists,
            });
        }

        if (result.status === 422) {
            return res.status(400).json({ error: result.error || 'Invalid email or data' });
        }

        console.error('MailerLite ebook error:', result.error);
        return res.status(result.status >= 400 ? result.status : 500).json({
            error: result.error || 'Failed to sign up for ebook',
        });
    } catch (error) {
        console.error('Server error:', error);
        return res.status(500).json({ error: 'Internal server error', message: error.message });
    }
};
