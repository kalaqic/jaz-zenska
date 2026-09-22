/* Shared Firebase init for CMS (public + admin) */
let cmsDb = null;
let cmsAuth = null;
let cmsImageUploadConfig = null;
let cmsInitPromise = null;

async function initCmsFirebase() {
    if (cmsInitPromise) return cmsInitPromise;

    cmsInitPromise = (async () => {
        const response = await fetch('/api/firebase-config');
        if (!response.ok) throw new Error('Firebase config unavailable');
        const config = await response.json();
        cmsImageUploadConfig = config.imageUpload || null;
        if (!firebase.apps.length) {
            firebase.initializeApp(config);
        }
        cmsAuth = firebase.auth();
        cmsDb = firebase.firestore();
        return { db: cmsDb, auth: cmsAuth, imageUpload: cmsImageUploadConfig };
    })();

    return cmsInitPromise;
}

function cmsGetImageUploadConfig() {
    return cmsImageUploadConfig;
}

function cmsSlugify(text) {
    return String(text || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 80);
}

function cmsEscapeHtml(str) {
    return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function cmsGetQueryParam(name) {
    return new URLSearchParams(window.location.search).get(name);
}
