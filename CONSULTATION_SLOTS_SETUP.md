# Consultation Slots Setup

## Overview
Consultation slots are now stored in Firestore instead of being hardcoded. This allows dynamic management of available dates and times.

## Firestore Collection Structure

**Collection:** `consultationSlots`

**Document Structure:**
```javascript
{
  date: "2026-02-16",        // Format: YYYY-MM-DD
  time: "09:00",             // Format: HH:MM (CET timezone)
  available: true            // Boolean: true = available, false = booked
}
```

**Document ID Format:** `{date}_{time}` (e.g., `2026-02-16_0900`)

## Initial Setup

To initialize the default slots (16.02.2026 with times 09:00, 09:30, 10:00, 10:30, 11:00), you can:

### Option 1: Use Firebase Console
1. Go to Firebase Console → Firestore Database
2. Create collection `consultationSlots`
3. Add documents manually with the structure above

### Option 2: Use the initialization script
Run the script `scripts/init-consultation-slots.js` (requires Firebase Admin SDK setup)

### Option 3: Use Firebase CLI
```bash
firebase firestore:set consultationSlots/2026-02-16_0900 {
  date: "2026-02-16",
  time: "09:00",
  available: true
}
```

## Adding New Slots

To add new available dates/times, create new documents in the `consultationSlots` collection with:
- `date`: Date in YYYY-MM-DD format
- `time`: Time in HH:MM format (CET timezone)
- `available`: `true`

## How It Works

1. **Frontend (`js/main.js`):**
   - Fetches all slots from Firestore on calendar initialization
   - Shows only dates/times where `available: true`
   - Updates in real-time when slots change
   - Refreshes after successful booking

2. **Backend (`api/consultation.js`):**
   - Validates requested date/time exists in Firestore
   - Uses Firestore transaction to atomically check and book slot
   - Prevents double-booking (two users booking same slot simultaneously)
   - Marks slot as `available: false` when booked
   - Stores booking timestamp and email

## Timezone Handling

- All times in Firestore are stored in **CET (UTC+1)** format (HH:MM)
- Dates are stored as **YYYY-MM-DD**
- When sending to GetResponse API, times are converted to UTC format (YYYY-MM-DDTHH:MM:SSZ)

## Current Default Slots

- **Date:** 2026-02-16
- **Times:** 09:00, 09:30, 10:00, 10:30, 11:00 (all CET)

These should be initialized in Firestore before the system goes live.
