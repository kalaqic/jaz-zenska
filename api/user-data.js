// Vercel Serverless Function for Getting User Data
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
        const { token, email } = req.body;

        // Validate input
        if (!email) {
            return res.status(400).json({ 
                error: 'Missing required field: email' 
            });
        }

        const auth = admin.auth();
        
        // Verify the token (if provided) or get user by email
        let user;
        if (token) {
            try {
                const decodedToken = await auth.verifyIdToken(token);
                user = await auth.getUser(decodedToken.uid);
            } catch (error) {
                // If token verification fails, try to get user by email
                user = await auth.getUserByEmail(email);
            }
        } else {
            user = await auth.getUserByEmail(email);
        }

        // Return user data
        return res.status(200).json({ 
            success: true,
            email: user.email,
            emailVerified: user.emailVerified,
            createdAt: user.metadata.creationTime,
            lastSignIn: user.metadata.lastSignInTime,
            uid: user.uid,
        });
    } catch (error) {
        console.error('Get user data error:', error);
        
        if (error.code === 'auth/user-not-found') {
            return res.status(404).json({ 
                error: 'Uporabnik ni najden' 
            });
        }
        
        return res.status(500).json({ 
            error: 'Internal server error',
            message: error.message
        });
    }
}
