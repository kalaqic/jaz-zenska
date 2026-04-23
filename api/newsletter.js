// Vercel Serverless Function for Newsletter + Ebook + Jutranji obred signup (MailerLite)
// POST body: { email, name, type?: 'newsletter' | 'ebook' | 'jutranji_obred' } — default type is 'newsletter'
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
        const rawType = String(type).toLowerCase();
        const signupType = rawType === 'ebook' ? 'ebook' : (rawType === 'jutranji_obred' ? 'jutranji_obred' : 'newsletter');
        const groupIds = signupType === 'ebook'
            ? [GROUPS.EBOOK]
            : (signupType === 'jutranji_obred' ? [GROUPS.JUTRANJI_OBRED] : [GROUPS.NEWSLETTER]);

        if (signupType === 'jutranji_obred' && !GROUPS.JUTRANJI_OBRED) {
            return res.status(500).json({
                error: 'Server configuration error',
                message: 'MAILERLITE_GROUP_JUTRANJI_OBRED is not configured',
            });
        }

        const botCheck = detectBot(req, body);
        if (botCheck.isBot) {
            console.log('Bot detected:', botCheck.reason, 'IP:', req.headers['x-forwarded-for'] || 'unknown');
            const botMessage = signupType === 'ebook'
                ? 'Successfully signed up for ebook'
                : (signupType === 'jutranji_obred' ? 'Successfully signed up for jutranji obred' : 'Successfully subscribed to newsletter');
            return res.status(200).json({ success: true, message: botMessage });
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
                    ? (signupType === 'ebook'
                        ? 'Already signed up for ebook'
                        : (signupType === 'jutranji_obred' ? 'Already signed up for jutranji obred' : 'Already subscribed to newsletter'))
                    : (signupType === 'ebook'
                        ? 'Successfully signed up for ebook'
                        : (signupType === 'jutranji_obred' ? 'Successfully signed up for jutranji obred' : 'Successfully subscribed to newsletter')),
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
            error: result.error || (signupType === 'ebook'
                ? 'Failed to sign up for ebook'
                : (signupType === 'jutranji_obred' ? 'Failed to sign up for jutranji obred' : 'Failed to subscribe to newsletter')),
            message: result.error,
        });
    } catch (error) {
        console.error('Server error:', error);
        return res.status(500).json({ error: 'Internal server error', message: error.message });
    }
};
