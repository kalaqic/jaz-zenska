/* Public site: load published events & blog posts from Firestore */

async function cmsLoadPublishedEvents() {
    await initCmsFirebase(false);
    const snap = await cmsDb.collection('site_events')
        .where('status', '==', 'published')
        .get();

    const items = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    items.sort((a, b) => (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0));
    return items;
}

async function cmsLoadPublishedBlogs() {
    await initCmsFirebase(false);
    const snap = await cmsDb.collection('blog_posts')
        .where('status', '==', 'published')
        .get();

    const items = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    items.sort((a, b) => (Number(b.sortOrder) || 0) - (Number(a.sortOrder) || 0));
    return items;
}

async function cmsLoadEventBySlug(slug) {
    await initCmsFirebase(false);
    const normalized = String(slug || '').trim().toLowerCase();
    if (!normalized) return null;

    const snap = await cmsDb.collection('site_events')
        .where('slug', '==', normalized)
        .where('status', '==', 'published')
        .limit(1)
        .get();

    if (snap.empty) return null;
    const doc = snap.docs[0];
    return { id: doc.id, ...doc.data() };
}

async function cmsLoadBlogBySlug(slug) {
    await initCmsFirebase(false);
    const normalized = String(slug || '').trim().toLowerCase();
    if (!normalized) return null;

    const snap = await cmsDb.collection('blog_posts')
        .where('slug', '==', normalized)
        .where('status', '==', 'published')
        .limit(1)
        .get();

    if (snap.empty) return null;
    const doc = snap.docs[0];
    return { id: doc.id, ...doc.data() };
}

function cmsRenderAktualnoCards(container, events) {
    if (!container) return;
    const homepage = events.filter((e) => e.showOnHomepage !== false);
    if (!homepage.length) return;

    const cardsHtml = homepage.map((event) => {
        const img = cmsEscapeHtml(event.cardImageUrl || event.heroImageUrl || '');
        const alt = cmsEscapeHtml(event.title || 'Dogodek');
        const href = `/dogodek/${encodeURIComponent(event.slug || '')}`;
        return `<a href="${href}" class="current-event-card current-event-image-link cms-event-card">
                <img src="${img}" alt="${alt}" class="current-event-image" loading="lazy">
            </a>`;
    }).join('');

    container.insertAdjacentHTML('afterbegin', cardsHtml);
}

function cmsBuildBlogCardHtml(post) {
    const img = cmsEscapeHtml(post.coverImageUrl || '');
    const category = cmsEscapeHtml(post.category || 'Blog');
    const title = cmsEscapeHtml(post.title || '');
    const excerpt = cmsEscapeHtml(post.excerpt || '');
    const href = `/blog/${encodeURIComponent(post.slug || '')}`;
    return `<article class="blog-post-card cms-blog-card">
            <a href="${href}" style="text-decoration:none;color:inherit;display:block;">
                <div class="blog-post-image" style="background-image:url('${img}');background-size:cover;background-position:center;">
                    <div class="blog-post-category">${category}</div>
                </div>
                <div class="blog-post-content">
                    <h2>${title}</h2>
                    <p>${excerpt}</p>
                    <span class="blog-read-more">Preberi več</span>
                </div>
            </a>
        </article>`;
}

function cmsPrependBlogCards(container, posts) {
    if (!container || !posts.length) return;
    container.insertAdjacentHTML('afterbegin', posts.map(cmsBuildBlogCardHtml).join(''));
}

function cmsRenderBlogGrid(container, posts) {
    if (!container || !posts.length) return;

    container.innerHTML = posts.map((post) => {
        const img = cmsEscapeHtml(post.coverImageUrl || '');
        const category = cmsEscapeHtml(post.category || 'Blog');
        const title = cmsEscapeHtml(post.title || '');
        const excerpt = cmsEscapeHtml(post.excerpt || '');
        const href = `/blog/${encodeURIComponent(post.slug || '')}`;
        return cmsBuildBlogCardHtml(post);
    }).join('');
}
