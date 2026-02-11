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
    const slots = [
        { time: '09:00', campaignId: 'fZzdl' },
        { time: '09:30', campaignId: 'fZzsz' },
        { time: '10:00', campaignId: 'fZzEA' },
        { time: '10:30', campaignId: 'fZrVk' },
        { time: '11:00', campaignId: 'fZrnT' }
    ];
    
    console.log('Initializing consultation slots...');
    console.log(`Date: ${date}`);
    console.log(`Slots: ${slots.map(s => `${s.time} (${s.campaignId})`).join(', ')}`);
    
    const batch = db.batch();
    
    slots.forEach(slot => {
        const slotId = `${date}_${slot.time.replace(':', '')}`;
        const slotRef = db.collection('consultationSlots').doc(slotId);
        
        batch.set(slotRef, {
            date: date,
            time: slot.time,
            available: true,
            campaignId: slot.campaignId
        });
        
        console.log(`Created slot: ${slotId} -> Campaign: ${slot.campaignId}`);
    });
    
    await batch.commit();
    console.log('✅ All consultation slots initialized successfully!');
    process.exit(0);
}

initConsultationSlots().catch(error => {
    console.error('Error initializing slots:', error);
    process.exit(1);
});
