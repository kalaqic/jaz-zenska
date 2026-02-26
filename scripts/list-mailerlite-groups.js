#!/usr/bin/env node
/**
 * List MailerLite groups via API – use this to find the group ID for "100 Zensk pohod na Trško Goro".
 *
 * Run: MAILERLITE_API_KEY=your_api_key node scripts/list-mailerlite-groups.js
 * Optional filter: MAILERLITE_API_KEY=xxx node scripts/list-mailerlite-groups.js pohod
 */
const fetch = require('node-fetch');

const MAILERLITE_API_KEY = process.env.MAILERLITE_API_KEY;
const MAILERLITE_BASE = 'https://connect.mailerlite.com/api';
const nameFilter = process.argv[2]; // e.g. "pohod" to only show groups whose name contains this

if (!MAILERLITE_API_KEY) {
    console.error('Set MAILERLITE_API_KEY. Example: MAILERLITE_API_KEY=your_key node scripts/list-mailerlite-groups.js');
    process.exit(1);
}

async function listGroups() {
    let all = [];
    let page = 1;
    const limit = 100;

    while (true) {
        const url = `${MAILERLITE_BASE}/groups?limit=${limit}&page=${page}`;
        const res = await fetch(url, {
            headers: {
                Accept: 'application/json',
                Authorization: `Bearer ${MAILERLITE_API_KEY}`,
            },
        });

        if (!res.ok) {
            const text = await res.text();
            console.error('API error:', res.status, text);
            process.exit(1);
        }

        const json = await res.json();
        const data = json.data || [];
        all = all.concat(data);

        const meta = json.meta || {};
        if (data.length < limit || page >= (meta.last_page || 1)) break;
        page++;
    }

    const filtered = nameFilter
        ? all.filter((g) => (g.name || '').toLowerCase().includes(nameFilter.toLowerCase()))
        : all;

    if (filtered.length === 0) {
        console.log(nameFilter ? `No groups matching "${nameFilter}".` : 'No groups found.');
        if (nameFilter && all.length) console.log('All groups:', all.map((g) => g.name).join(', '));
        return;
    }

    console.log(nameFilter ? `Groups matching "${nameFilter}":` : 'All groups:');
    console.log('');
    filtered.forEach((g) => {
        console.log(`  ID:   ${g.id}`);
        console.log(`  Name: ${g.name}`);
        console.log('');
    });
}

listGroups().catch((err) => {
    console.error(err);
    process.exit(1);
});
