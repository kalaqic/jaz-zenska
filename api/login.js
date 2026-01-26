// Vercel Serverless Function for User Login
const admin = require('firebase-admin');
const fetch = require('node-fetch');

// Initialize Firebase Admin
let firebaseApp;
let firebaseConfig;
try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
    firebaseConfig = serviceAccount;
    
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

    if (!firebaseApp || !firebaseConfig) {
        return res.status(500).json({ 
            error: 'Server configuration error',
            message: 'Firebase not initialized'
        });
    }

    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({ 
                error: 'Missing required fields: email, password' 
            });
        }

        // Use Firebase Auth REST API to verify credentials
        // The API key can be found in Firebase Console → Project Settings → General → Web API Key
        const apiKey = firebaseConfig.apiKey || process.env.FIREBASE_API_KEY;
        if (!apiKey) {
            console.error('Firebase API key not found. Please add FIREBASE_API_KEY to environment variables.');
            return res.status(500).json({ 
                error: 'Server configuration error: Firebase API key not configured. Please add FIREBASE_API_KEY to your environment variables.' 
            });
        }

        const authUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`;
        
        const authResponse = await fetch(authUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email,
                password: password,
                returnSecureToken: true
            })
        });

        const authData = await authResponse.json();

        if (!authResponse.ok) {
            const errorMessage = authData.error?.message || 'Napačen email ali geslo';
            return res.status(401).json({ 
                error: errorMessage
            });
        }

        // Get user details from Admin SDK
        const auth = admin.auth();
        const user = await auth.getUser(authData.localId);
        
        // Create a custom token for session management
        const customToken = await auth.createCustomToken(user.uid);
        
        // Return success with token
        return res.status(200).json({ 
            success: true,
            token: customToken,
            idToken: authData.idToken,
            user: {
                uid: user.uid,
                email: user.email,
                emailVerified: user.emailVerified,
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ 
            error: 'Internal server error',
            message: error.message
        });
    }
}
