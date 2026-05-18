// Vercel Serverless Function for Newsletter + Ebook + event signups (MailerLite)
// POST body: { email, name, type?, mailerliteGroupId? }
const { detectBot } = require('../lib/bot-filter');
const { addToMailerLite, GROUPS, MAILERLITE_API_KEY } = require('../lib/mailerlite');

if (!MAILERLITE_API_KEY) {
    console.error('ERROR: MAILERLITE_API_KEY environment variable is not set!');
}

function resolveGroupIds(body) {
    const customGroup = String(body.mailerliteGroupId || '').trim();
    if (customGroup) return [customGroup];

    const rawType = String(body.type || 'newsletter').toLowerCase();
    if (rawType === 'ebook') return [GROUPS.EBOOK];
    if (rawType === 'jutranji_obred') return GROUPS.JUTRANJI_OBRED ? [GROUPS.JUTRANJI_OBRED] : [GROUPS.NEWSLETTER];
    return [GROUPS.NEWSLETTER];
}

function signupTypeFrom(body) {
    const rawType = String(body?.type || 'newsletter').toLowerCase();
    if (rawType === 'ebook') return 'ebook';
    if (rawType === 'jutranji_obred') return 'jutranji_obred';
    return 'newsletter';
}

function successMessage(signupType, alreadyExists) {
    if (signupType === 'ebook') {
        return alreadyExists ? 'Already signed up for ebook' : 'Successfully signed up for ebook';
    }
    if (signupType === 'jutranji_obred') {
        return alreadyExists ? 'Already signed up for jutranji obred' : 'Successfully signed up for jutranji obred';
    }
    return alreadyExists ? 'Already subscribed to newsletter' : 'Successfully subscribed to newsletter';
}

function failureMessage(signupType) {
    if (signupType === 'ebook') return 'Failed to sign up for ebook';
    if (signupType === 'jutranji_obred') return 'Failed to sign up for jutranji obred';
    return 'Failed to subscribe to newsletter';
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

        const signupType = signupTypeFrom(body);
        const groupIds = resolveGroupIds(body || {});

        if (signupType === 'jutranji_obred' && !GROUPS.JUTRANJI_OBRED && !String(body?.mailerliteGroupId || '').trim()) {
            return res.status(500).json({
                error: 'Server configuration error',
                message: 'MAILERLITE_GROUP_JUTRANJI_OBRED is not configured',
            });
        }

        const botCheck = detectBot(req, body);
        if (botCheck.isBot) {
            console.log('Bot detected:', botCheck.reason, 'IP:', req.headers['x-forwarded-for'] || 'unknown');
            return res.status(200).json({ success: true, message: successMessage(signupType, false) });
        }

        const { email, name } = body || {};
        if (!email || !name) {
            return res.status(400).json({ error: 'Missing required fields: email, name' });
        }

        const normalizedEmail = String(email).trim().toLowerCase();
        const normalizedName = String(name).trim();

        const result = await addToMailerLite(normalizedEmail, normalizedName, groupIds);

        if (result.success) {
            return res.status(200).json({
                success: true,
                message: successMessage(signupType, result.alreadyExists),
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
            error: result.error || failureMessage(signupType),
            message: result.error,
        });
    } catch (error) {
        console.error('Server error:', error);
        return res.status(500).json({ error: 'Internal server error', message: error.message });
    }
};
