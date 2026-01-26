// Vercel Serverless Function for Forgot Password
const admin = require('firebase-admin');

// Initialize Firebase Admin
let firebaseApp;
try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
    
    if (!firebaseApp && serviceAccount.projectId) {
        firebaseApp = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log('Firebase Admin initialized successfully');
    }
} catch (error) {
    console.error('Firebase initialization error:', error);
}

module.exports = async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    if (!firebaseApp) {
        return res.status(500).json({ 
            error: 'Server configuration error',
            message: 'Firebase not initialized'
        });
    }

    try {
        const { email } = req.body;

        // Validate input
        if (!email) {
            return res.status(400).json({ 
                error: 'Missing required field: email' 
            });
        }

        const auth = admin.auth();
        
        // Check if user exists
        let user;
        try {
            user = await auth.getUserByEmail(email);
        } catch (error) {
            if (error.code === 'auth/user-not-found') {
                // Don't reveal if user exists or not for security
                return res.status(200).json({ 
                    success: true,
                    message: 'Če ta email naslov obstaja, boste prejeli povezavo za ponastavitev gesla.'
                });
            }
            throw error;
        }

        // Generate password reset link
        const actionCodeSettings = {
            url: `${req.headers.origin || 'https://jazzenska.si'}/login.html?mode=resetPassword`,
            handleCodeInApp: false,
        };
        
        const link = await auth.generatePasswordResetLink(email, actionCodeSettings);
        
        // TODO: Send email with the link
        // For now, we'll just log it (in production, use an email service)
        console.log('Password reset link generated for:', email);
        console.log('Link:', link);
        
        // In production, send the email via your email service
        // You could use SendGrid, Mailgun, AWS SES, etc.
        
        return res.status(200).json({ 
            success: true,
            message: 'Če ta email naslov obstaja, boste prejeli povezavo za ponastavitev gesla.'
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        return res.status(500).json({ 
            error: 'Internal server error',
            message: error.message
        });
    }
}
