// MailerLite API helper – add/update subscriber (connect.mailerlite.com)
const fetch = require('node-fetch');

const MAILERLITE_API_KEY = process.env.MAILERLITE_API_KEY;
const MAILERLITE_BASE = 'https://connect.mailerlite.com/api';

// Group IDs (MailerLite)
const GROUPS = {
    NEWSLETTER: '180183096656660293',
    WEBINAR_25_STOPNIC: '180183190264087754',
    WAITING_FOR_PAYMENT: '180183161009866538',
    // Waiting for payment – Pohod / Trška Gora (set MAILERLITE_GROUP_WAITING_POHOD in Vercel)
    WAITING_POHOD: process.env.MAILERLITE_GROUP_WAITING_POHOD || '',
    IN_GROUP: '180183704629413845',
    EBOOK: '180183130920978410',
    CONSULTATION: '180183211500897362',
    // Pohod group – set MAILERLITE_GROUP_POHOD in Vercel; automation "subscriber joins group" on this group
    POHOD: process.env.MAILERLITE_GROUP_POHOD || '',
    // Course / shop buyers – set MAILERLITE_GROUP_COURSE_BUYERS in Vercel
    COURSE_BUYERS: process.env.MAILERLITE_GROUP_COURSE_BUYERS || '',
};

/**
 * Add or update a subscriber in MailerLite and add to given groups.
 * @param {string} email - Subscriber email
 * @param {string} [name] - Subscriber name (optional)
 * @param {string[]} groupIds - Array of group IDs to add the subscriber to
 * @param {Object} [fields] - Extra fields, e.g. { phone: '+386...', termin_date: '2026-02-15', termin_time: '09:00' }
 * @returns {{ success: boolean, status: number, data?: object, alreadyExists?: boolean, error?: string }}
 */
async function addToMailerLite(email, name, groupIds, fields = {}) {
    if (!MAILERLITE_API_KEY) {
        console.error('MAILERLITE_API_KEY is not set');
        return { success: false, error: 'API key not configured' };
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const payload = {
        email: normalizedEmail,
        fields: {
            ...(name ? { name: String(name).trim() } : {}),
            ...fields,
        },
        groups: Array.isArray(groupIds) ? groupIds : [groupIds],
    };

    // Remove empty field values so we don't send null/undefined
    Object.keys(payload.fields).forEach((k) => {
        if (payload.fields[k] == null || payload.fields[k] === '') {
            delete payload.fields[k];
        }
    });

    try {
        const response = await fetch(`${MAILERLITE_BASE}/subscribers`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                Authorization: `Bearer ${MAILERLITE_API_KEY}`,
            },
            body: JSON.stringify(payload),
        });

        const responseText = await response.text();
        let data = {};
        if (responseText) {
            try {
                data = JSON.parse(responseText);
            } catch (e) {
                data = { message: responseText };
            }
        }

        // 200 = existing subscriber updated; 201 = new subscriber created
        if (response.status === 200 || response.status === 201) {
            return {
                success: true,
                status: response.status,
                data,
                alreadyExists: response.status === 200,
            };
        }

        // 422 = validation error (e.g. invalid email, invalid field)
        if (response.status === 422) {
            const msg = (data.errors && Object.values(data.errors).flat().join(' ')) || data.message || 'Validation error';
            return { success: false, status: 422, error: msg };
        }

        return {
            success: false,
            status: response.status,
            error: data.message || data.error || `HTTP ${response.status}`,
        };
    } catch (err) {
        console.error('MailerLite request error:', err.message);
        return { success: false, error: err.message };
    }
}

module.exports = { addToMailerLite, GROUPS, MAILERLITE_API_KEY };
