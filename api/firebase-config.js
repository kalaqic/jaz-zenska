// API endpoint to return Firebase configuration
// This keeps the API key secure on the server side

module.exports = async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Only allow GET requests
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY;

    if (!FIREBASE_API_KEY) {
        console.error('ERROR: FIREBASE_API_KEY environment variable is not set!');
        return res.status(500).json({ 
            error: 'Firebase configuration not available',
            message: 'FIREBASE_API_KEY not configured'
        });
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || '';
    const uploadPreset =
        process.env.CLOUDINARY_UPLOAD_PRESET ||
        process.env.CLOUDINARY_UPLOAD_NAME ||
        '';

    // Return Firebase configuration (+ optional CMS image upload via Cloudinary)
    const firebaseConfig = {
        apiKey: FIREBASE_API_KEY,
        authDomain: "jaz-zenska.firebaseapp.com",
        projectId: "jaz-zenska",
        storageBucket: "jaz-zenska.firebasestorage.app",
        messagingSenderId: "406513810063",
        appId: "1:406513810063:web:a485e483153ef402fb8efa"
    };

    if (cloudName && uploadPreset) {
        firebaseConfig.imageUpload = {
            provider: 'cloudinary',
            cloudName,
            uploadPreset,
        };
    }

    return res.status(200).json(firebaseConfig);
}
