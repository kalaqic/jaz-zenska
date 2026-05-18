/* Admin CMS – events & blog (admin role only) */

function cmsAdminFormatError(err) {
    const code = err && (err.code || err.message);
    if (code === 'permission-denied' || (err && String(err.message).includes('permission'))) {
        return 'Manjkajo dovoljenja v Firebase. V Firebase Console objavite firestore.rules '
            + '(firebase deploy --only firestore:rules). '
            + 'Preverite tudi, da ima vaš uporabnik v users/{uid} polje role: "admin".';
    }
    return (err && err.message) || String(err);
}

let cmsEventEditor = null;
let cmsBlogEditor = null;
let cmsEditingEventId = null;
let cmsEditingBlogId = null;

async function cmsAdminEnsureAccess() {
    await initCmsFirebase();

    const user = await new Promise((resolve) => {
        const unsub = cmsAuth.onAuthStateChanged((u) => {
            unsub();
            resolve(u);
        });
    });

    if (!user) {
        window.location.href = '/login?next=' + encodeURIComponent('/admin-vsebina');
        return false;
    }

    const userDoc = await cmsDb.collection('users').doc(user.uid).get();
    const role = userDoc.exists ? userDoc.data().role : null;
    if (role !== 'admin') {
        document.getElementById('cmsAdminDenied').style.display = 'block';
        document.getElementById('cmsAdminApp').style.display = 'none';
        return false;
    }

    document.getElementById('cmsAdminUserEmail').textContent = user.email || '';
    document.getElementById('cmsAdminApp').style.display = 'block';
    return true;
}

async function cmsAdminUploadImage(file, folder) {
    if (!file) throw new Error('Datoteka manjka');

    const uploadCfg = cmsGetImageUploadConfig();
    if (!uploadCfg || uploadCfg.provider !== 'cloudinary') {
        throw new Error(
            'Nalaganje datotek ni nastavljeno. V Vercel dodajte CLOUDINARY_CLOUD_NAME in CLOUDINARY_UPLOAD_PRESET, '
            + 'ali prilepite URL slike v polje spodaj (npr. /images/... ali obstoječa povezava).'
        );
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadCfg.uploadPreset);
    formData.append('folder', `jaz-zenska-cms/${folder}`);

    const res = await fetch(
        `https://api.cloudinary.com/v1_1/${uploadCfg.cloudName}/image/upload`,
        { method: 'POST', body: formData }
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new Error(data.error?.message || data.message || 'Napaka pri nalaganju na Cloudinary');
    }
    return data.secure_url;
}

function cmsAdminInitEditors() {
    if (typeof Quill === 'undefined') return;

    cmsEventEditor = new Quill('#cmsEventBodyEditor', {
        theme: 'snow',
        modules: {
            toolbar: [
                [{ header: [2, 3, false] }],
                ['bold', 'italic', 'underline'],
                [{ list: 'ordered' }, { list: 'bullet' }],
                ['link', 'image'],
                ['clean'],
            ],
        },
    });

    cmsBlogEditor = new Quill('#cmsBlogBodyEditor', {
        theme: 'snow',
        modules: {
            toolbar: [
                [{ header: [2, 3, false] }],
                ['bold', 'italic', 'underline'],
                [{ list: 'ordered' }, { list: 'bullet' }],
                ['link', 'image'],
                ['clean'],
            ],
        },
    });
}

function cmsAdminSwitchTab(tab) {
    document.querySelectorAll('.cms-admin-tab').forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    document.querySelectorAll('.cms-admin-panel').forEach((panel) => {
        panel.classList.toggle('active', panel.id === `cmsPanel${tab}`);
    });
}

function cmsAdminUpdateDeleteButtons() {
    const eventDeleteBtn = document.getElementById('cmsEventDeleteBtn');
    const blogDeleteBtn = document.getElementById('cmsBlogDeleteBtn');
    if (eventDeleteBtn) eventDeleteBtn.style.display = cmsEditingEventId ? 'inline-flex' : 'none';
    if (blogDeleteBtn) blogDeleteBtn.style.display = cmsEditingBlogId ? 'inline-flex' : 'none';
}

function cmsAdminResetEventForm() {
    cmsEditingEventId = null;
    document.getElementById('cmsEventForm').reset();
    document.getElementById('cmsEventId').value = '';
    document.getElementById('cmsEventHeroPreview').src = '';
    document.getElementById('cmsEventCardPreview').src = '';
    if (cmsEventEditor) cmsEventEditor.root.innerHTML = '';
    document.getElementById('cmsEventFormTitle').textContent = 'Nov dogodek';
    cmsAdminUpdateDeleteButtons();
}

function cmsAdminResetBlogForm() {
    cmsEditingBlogId = null;
    document.getElementById('cmsBlogForm').reset();
    document.getElementById('cmsBlogId').value = '';
    document.getElementById('cmsBlogCoverPreview').src = '';
    if (cmsBlogEditor) cmsBlogEditor.root.innerHTML = '';
    document.getElementById('cmsBlogFormTitle').textContent = 'Nov članek';
    cmsAdminUpdateDeleteButtons();
}

async function cmsAdminLoadEventList() {
    let snap;
    try {
        snap = await cmsDb.collection('site_events').get();
    } catch (err) {
        console.error('cmsAdminLoadEventList:', err);
        document.getElementById('cmsEventList').innerHTML =
            '<p class="cms-admin-empty" style="color:#a6232e;">' + cmsEscapeHtml(cmsAdminFormatError(err)) + '</p>';
        return;
    }
    const list = document.getElementById('cmsEventList');
    const docs = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    docs.sort((a, b) => (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0));
    if (!docs.length) {
        list.innerHTML = '<p class="cms-admin-empty">Še ni dogodkov.</p>';
        return;
    }

    list.innerHTML = docs.map((doc) => {
        const d = doc;
        const status = d.status === 'published' ? 'Objavljeno' : 'Osnutek';
        return `<div class="cms-admin-list-item">
            <div>
                <strong>${cmsEscapeHtml(d.title || 'Brez naslova')}</strong>
                <span class="cms-admin-meta">/${cmsEscapeHtml(d.slug || '')} · ${status}</span>
            </div>
            <div class="cms-admin-list-actions">
                <button type="button" class="cms-admin-btn small" data-edit-event="${doc.id}">Uredi</button>
                <button type="button" class="cms-admin-btn small danger" data-delete-event="${doc.id}">Izbriši</button>
            </div>
        </div>`;
    }).join('');

    list.querySelectorAll('[data-edit-event]').forEach((btn) => {
        btn.addEventListener('click', () => cmsAdminEditEvent(btn.dataset.editEvent));
    });
    list.querySelectorAll('[data-delete-event]').forEach((btn) => {
        btn.addEventListener('click', () => cmsAdminDeleteEvent(btn.dataset.deleteEvent));
    });
}

async function cmsAdminLoadBlogList() {
    let snap;
    try {
        snap = await cmsDb.collection('blog_posts').get();
    } catch (err) {
        console.error('cmsAdminLoadBlogList:', err);
        document.getElementById('cmsBlogList').innerHTML =
            '<p class="cms-admin-empty" style="color:#a6232e;">' + cmsEscapeHtml(cmsAdminFormatError(err)) + '</p>';
        return;
    }
    const list = document.getElementById('cmsBlogList');
    const docs = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    docs.sort((a, b) => (Number(b.sortOrder) || 0) - (Number(a.sortOrder) || 0));
    if (!docs.length) {
        list.innerHTML = '<p class="cms-admin-empty">Še ni člankov.</p>';
        return;
    }

    list.innerHTML = docs.map((doc) => {
        const d = doc;
        const status = d.status === 'published' ? 'Objavljeno' : 'Osnutek';
        return `<div class="cms-admin-list-item">
            <div>
                <strong>${cmsEscapeHtml(d.title || 'Brez naslova')}</strong>
                <span class="cms-admin-meta">/${cmsEscapeHtml(d.slug || '')} · ${status}</span>
            </div>
            <div class="cms-admin-list-actions">
                <button type="button" class="cms-admin-btn small" data-edit-blog="${doc.id}">Uredi</button>
                <button type="button" class="cms-admin-btn small danger" data-delete-blog="${doc.id}">Izbriši</button>
            </div>
        </div>`;
    }).join('');

    list.querySelectorAll('[data-edit-blog]').forEach((btn) => {
        btn.addEventListener('click', () => cmsAdminEditBlog(btn.dataset.editBlog));
    });
    list.querySelectorAll('[data-delete-blog]').forEach((btn) => {
        btn.addEventListener('click', () => cmsAdminDeleteBlog(btn.dataset.deleteBlog));
    });
}

async function cmsAdminEditEvent(id) {
    const doc = await cmsDb.collection('site_events').doc(id).get();
    if (!doc.exists) return;
    const d = doc.data();
    cmsEditingEventId = id;

    document.getElementById('cmsEventFormTitle').textContent = 'Uredi dogodek';
    document.getElementById('cmsEventId').value = id;
    document.getElementById('cmsEventTitle').value = d.title || '';
    document.getElementById('cmsEventSlug').value = d.slug || '';
    document.getElementById('cmsEventHeroSubtitle').value = d.heroSubtitle || '';
    document.getElementById('cmsEventHeroLabel').value = d.heroLabel || '';
    document.getElementById('cmsEventHeroUrl').value = d.heroImageUrl || '';
    document.getElementById('cmsEventCardUrl').value = d.cardImageUrl || '';
    document.getElementById('cmsEventHeroPreview').src = d.heroImageUrl || '';
    document.getElementById('cmsEventCardPreview').src = d.cardImageUrl || d.heroImageUrl || '';
    document.getElementById('cmsEventIsFree').checked = d.isFree !== false;
    document.getElementById('cmsEventPrice').value = d.priceEur != null ? d.priceEur : '';
    document.getElementById('cmsEventCtaLabel').value = d.ctaLabel || '';
    document.getElementById('cmsEventCtaUrl').value = d.ctaUrl || '';
    document.getElementById('cmsEventMailerliteGroupId').value = d.mailerliteGroupId || '';
    document.getElementById('cmsEventSortOrder').value = d.sortOrder != null ? d.sortOrder : 0;
    document.getElementById('cmsEventStatus').value = d.status || 'draft';
    document.getElementById('cmsEventShowHome').checked = d.showOnHomepage !== false;
    if (cmsEventEditor) cmsEventEditor.root.innerHTML = d.bodyHtml || '';

    cmsAdminTogglePaidFields();
    cmsAdminUpdateDeleteButtons();
    document.getElementById('cmsEventForm').scrollIntoView({ behavior: 'smooth' });
}

async function cmsAdminEditBlog(id) {
    const doc = await cmsDb.collection('blog_posts').doc(id).get();
    if (!doc.exists) return;
    const d = doc.data();
    cmsEditingBlogId = id;

    document.getElementById('cmsBlogFormTitle').textContent = 'Uredi članek';
    document.getElementById('cmsBlogId').value = id;
    document.getElementById('cmsBlogTitle').value = d.title || '';
    document.getElementById('cmsBlogSlug').value = d.slug || '';
    document.getElementById('cmsBlogCategory').value = d.category || 'Blog';
    document.getElementById('cmsBlogDateLabel').value = d.dateLabel || '';
    document.getElementById('cmsBlogExcerpt').value = d.excerpt || '';
    document.getElementById('cmsBlogCoverUrl').value = d.coverImageUrl || '';
    document.getElementById('cmsBlogCoverPreview').src = d.coverImageUrl || '';
    document.getElementById('cmsBlogSortOrder').value = d.sortOrder != null ? d.sortOrder : 0;
    document.getElementById('cmsBlogStatus').value = d.status || 'draft';
    if (cmsBlogEditor) cmsBlogEditor.root.innerHTML = d.bodyHtml || '';

    cmsAdminUpdateDeleteButtons();
    document.getElementById('cmsBlogForm').scrollIntoView({ behavior: 'smooth' });
}

async function cmsAdminDeleteEvent(id) {
    if (!confirm('Res želite izbrisati ta dogodek?')) return;
    await cmsDb.collection('site_events').doc(id).delete();
    await cmsAdminLoadEventList();
    cmsAdminResetEventForm();
}

async function cmsAdminDeleteBlog(id) {
    if (!confirm('Res želite izbrisati ta članek?')) return;
    await cmsDb.collection('blog_posts').doc(id).delete();
    await cmsAdminLoadBlogList();
    cmsAdminResetBlogForm();
}

function cmsAdminTogglePaidFields() {
    const isFree = document.getElementById('cmsEventIsFree').checked;
    document.getElementById('cmsEventPaidFields').style.display = isFree ? 'none' : 'block';
    document.getElementById('cmsEventFreeFields').style.display = isFree ? 'block' : 'none';
}

async function cmsAdminSaveEvent(e) {
    e.preventDefault();
    const title = document.getElementById('cmsEventTitle').value.trim();
    let slug = document.getElementById('cmsEventSlug').value.trim() || cmsSlugify(title);
    slug = cmsSlugify(slug);
    if (!title || !slug) {
        alert('Naslov in slug sta obvezna.');
        return;
    }

    const isFree = document.getElementById('cmsEventIsFree').checked;
    const payload = {
        title,
        slug,
        heroSubtitle: document.getElementById('cmsEventHeroSubtitle').value.trim(),
        heroLabel: document.getElementById('cmsEventHeroLabel').value.trim(),
        heroImageUrl: document.getElementById('cmsEventHeroUrl').value.trim(),
        cardImageUrl: document.getElementById('cmsEventCardUrl').value.trim() || document.getElementById('cmsEventHeroUrl').value.trim(),
        bodyHtml: cmsEventEditor ? cmsEventEditor.root.innerHTML : '',
        isFree,
        priceEur: isFree ? null : (parseFloat(document.getElementById('cmsEventPrice').value) || null),
        ctaLabel: document.getElementById('cmsEventCtaLabel').value.trim() || (isFree ? 'Brezplačne prijave' : 'Kupi'),
        ctaUrl: document.getElementById('cmsEventCtaUrl').value.trim(),
        mailerliteGroupId: isFree ? (document.getElementById('cmsEventMailerliteGroupId').value.trim() || null) : null,
        sortOrder: parseInt(document.getElementById('cmsEventSortOrder').value, 10) || 0,
        status: document.getElementById('cmsEventStatus').value,
        showOnHomepage: document.getElementById('cmsEventShowHome').checked,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    };

    if (payload.status === 'published') {
        payload.publishedAt = firebase.firestore.FieldValue.serverTimestamp();
    }

    try {
        if (cmsEditingEventId) {
            await cmsDb.collection('site_events').doc(cmsEditingEventId).update(payload);
        } else {
            payload.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            await cmsDb.collection('site_events').add(payload);
        }
    } catch (err) {
        alert('Napaka pri shranjevanju: ' + cmsAdminFormatError(err));
        return;
    }

    alert('Dogodek shranjen.');
    await cmsAdminLoadEventList();
    cmsAdminResetEventForm();
}

async function cmsAdminSaveBlog(e) {
    e.preventDefault();
    const title = document.getElementById('cmsBlogTitle').value.trim();
    let slug = document.getElementById('cmsBlogSlug').value.trim() || cmsSlugify(title);
    slug = cmsSlugify(slug);
    if (!title || !slug) {
        alert('Naslov in slug sta obvezna.');
        return;
    }

    const payload = {
        title,
        slug,
        category: document.getElementById('cmsBlogCategory').value.trim() || 'Blog',
        dateLabel: document.getElementById('cmsBlogDateLabel').value.trim(),
        excerpt: document.getElementById('cmsBlogExcerpt').value.trim(),
        coverImageUrl: document.getElementById('cmsBlogCoverUrl').value.trim(),
        bodyHtml: cmsBlogEditor ? cmsBlogEditor.root.innerHTML : '',
        sortOrder: parseInt(document.getElementById('cmsBlogSortOrder').value, 10) || 0,
        status: document.getElementById('cmsBlogStatus').value,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    };

    if (payload.status === 'published') {
        payload.publishedAt = firebase.firestore.FieldValue.serverTimestamp();
    }

    try {
        if (cmsEditingBlogId) {
            await cmsDb.collection('blog_posts').doc(cmsEditingBlogId).update(payload);
        } else {
            payload.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            await cmsDb.collection('blog_posts').add(payload);
        }
    } catch (err) {
        alert('Napaka pri shranjevanju: ' + cmsAdminFormatError(err));
        return;
    }

    alert('Članek shranjen.');
    await cmsAdminLoadBlogList();
    cmsAdminResetBlogForm();
}

function cmsAdminBindImageUrlPreview(urlFieldId, previewId) {
    const urlEl = document.getElementById(urlFieldId);
    const preview = document.getElementById(previewId);
    if (!urlEl || !preview) return;
    urlEl.addEventListener('input', () => {
        preview.src = urlEl.value.trim();
    });
}

function cmsAdminBindImageUpload(inputId, urlFieldId, previewId, folder) {
    const input = document.getElementById(inputId);
    if (!input) return;
    cmsAdminBindImageUrlPreview(urlFieldId, previewId);
    input.addEventListener('change', async () => {
        const file = input.files && input.files[0];
        if (!file) return;
        try {
            input.disabled = true;
            const url = await cmsAdminUploadImage(file, folder);
            document.getElementById(urlFieldId).value = url;
            document.getElementById(previewId).src = url;
        } catch (err) {
            console.error('cmsAdminUploadImage:', err);
            alert('Napaka pri nalaganju slike: ' + cmsAdminFormatError(err));
        } finally {
            input.disabled = false;
            input.value = '';
        }
    });
}

async function cmsAdminInit() {
    const ok = await cmsAdminEnsureAccess();
    if (!ok) return;

    cmsAdminInitEditors();
    cmsAdminBindImageUpload('cmsEventHeroFile', 'cmsEventHeroUrl', 'cmsEventHeroPreview', 'events');
    cmsAdminBindImageUpload('cmsEventCardFile', 'cmsEventCardUrl', 'cmsEventCardPreview', 'events');
    cmsAdminBindImageUpload('cmsBlogCoverFile', 'cmsBlogCoverUrl', 'cmsBlogCoverPreview', 'blogs');

    document.getElementById('cmsEventTitle').addEventListener('input', () => {
        const slugEl = document.getElementById('cmsEventSlug');
        if (!slugEl.dataset.touched) slugEl.value = cmsSlugify(document.getElementById('cmsEventTitle').value);
    });
    document.getElementById('cmsEventSlug').addEventListener('input', () => {
        document.getElementById('cmsEventSlug').dataset.touched = '1';
    });
    document.getElementById('cmsBlogTitle').addEventListener('input', () => {
        const slugEl = document.getElementById('cmsBlogSlug');
        if (!slugEl.dataset.touched) slugEl.value = cmsSlugify(document.getElementById('cmsBlogTitle').value);
    });
    document.getElementById('cmsBlogSlug').addEventListener('input', () => {
        document.getElementById('cmsBlogSlug').dataset.touched = '1';
    });

    document.getElementById('cmsEventIsFree').addEventListener('change', cmsAdminTogglePaidFields);
    document.getElementById('cmsEventForm').addEventListener('submit', cmsAdminSaveEvent);
    document.getElementById('cmsBlogForm').addEventListener('submit', cmsAdminSaveBlog);
    document.getElementById('cmsEventResetBtn').addEventListener('click', cmsAdminResetEventForm);
    document.getElementById('cmsBlogResetBtn').addEventListener('click', cmsAdminResetBlogForm);
    document.getElementById('cmsEventDeleteBtn').addEventListener('click', () => {
        if (cmsEditingEventId) cmsAdminDeleteEvent(cmsEditingEventId);
    });
    document.getElementById('cmsBlogDeleteBtn').addEventListener('click', () => {
        if (cmsEditingBlogId) cmsAdminDeleteBlog(cmsEditingBlogId);
    });

    document.querySelectorAll('.cms-admin-tab').forEach((btn) => {
        btn.addEventListener('click', () => cmsAdminSwitchTab(btn.dataset.tab));
    });

    cmsAdminTogglePaidFields();
    await cmsAdminLoadEventList();
    await cmsAdminLoadBlogList();
}

document.addEventListener('DOMContentLoaded', cmsAdminInit);
