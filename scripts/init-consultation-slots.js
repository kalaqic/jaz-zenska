// Script to initialize consultation slots in Firestore
// Run this once to set up the initial available slots
// You can run this via Node.js or Firebase CLI

// This script creates consultation slots for:
// Date: 2026-02-16
// Times: 09:00, 09:30, 10:00, 10:30, 11:00 (CET)

const admin = require('firebase-admin');

// Initialize Firebase Admin (you'll need to set up service account)
// For local testing, you can use:
// admin.initializeApp({
//     credential: admin.credential.cert(require('../path/to/serviceAccountKey.json'))
// });

// Or use environment variable (as in Vercel)
const serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT;
if (serviceAccountRaw) {
    const serviceAccount = JSON.parse(serviceAccountRaw);
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
} else {
    console.error('FIREBASE_SERVICE_ACCOUNT environment variable not set');
    process.exit(1);
}

const db = admin.firestore();

async function initConsultationSlots() {
    const date = '2026-02-16';
    const times = ['09:00', '09:30', '10:00', '10:30', '11:00'];
    
    console.log('Initializing consultation slots...');
    console.log(`Date: ${date}`);
    console.log(`Times: ${times.join(', ')}`);
    
    const batch = db.batch();
    
    times.forEach(time => {
        const slotId = `${date}_${time.replace(':', '')}`;
        const slotRef = db.collection('consultationSlots').doc(slotId);
        
        batch.set(slotRef, {
            date: date,
            time: time,
            available: true
        });
        
        console.log(`Created slot: ${slotId}`);
    });
    
    await batch.commit();
    console.log('✅ All consultation slots initialized successfully!');
    process.exit(0);
}

initConsultationSlots().catch(error => {
    console.error('Error initializing slots:', error);
    process.exit(1);
});
