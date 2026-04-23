const { detectBot } = require('../lib/bot-filter');
const { addToMailerLite, GROUPS, MAILERLITE_API_KEY } = require('../lib/mailerlite');

if (!MAILERLITE_API_KEY) {
    console.error('ERROR: MAILERLITE_API_KEY environment variable is not set!');
}

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
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

    if (!GROUPS.JUTRANJI_OBRED) {
        return res.status(500).json({
            error: 'Server configuration error',
            message: 'MAILERLITE_GROUP_JUTRANJI_OBRED is not configured',
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

        const { name, email } = body || {};

        const botCheck = detectBot(req, body);
        if (botCheck.isBot) {
            return res.status(200).json({ success: true, message: 'Successfully signed up' });
        }

        if (!name || !email) {
            return res.status(400).json({ error: 'Missing required fields: name, email' });
        }

        const normalizedEmail = String(email).trim().toLowerCase();
        const normalizedName = String(name).trim();
        const result = await addToMailerLite(normalizedEmail, normalizedName, [GROUPS.JUTRANJI_OBRED]);

        if (result.success) {
            return res.status(200).json({
                success: true,
                message: result.alreadyExists ? 'Already signed up' : 'Successfully signed up',
                alreadyExists: result.alreadyExists,
            });
        }

        if (result.status === 422) {
            return res.status(400).json({
                error: result.error || 'Invalid email or data',
                message: result.error,
            });
        }

        return res.status(result.status >= 400 ? result.status : 500).json({
            error: result.error || 'Failed to sign up',
            message: result.error,
        });
    } catch (error) {
        console.error('Server error:', error);
        return res.status(500).json({ error: 'Internal server error', message: error.message });
    }
};
