// Community Platform JavaScript
// Structured for easy Firebase migration later

// Helper function to ensure URL is absolute (opens in new tab correctly)
function ensureAbsoluteUrl(url) {
    if (!url) return '#';
    // If URL already starts with http:// or https://, return as is
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }
    // Otherwise, prepend https://
    return 'https://' + url;
}

// Initialize data structures in localStorage
function initDataStructures() {
    // Initialize courses as empty array
    if (!localStorage.getItem('courses')) {
        localStorage.setItem('courses', JSON.stringify([]));
    }
    
    // Initialize events as empty array
    if (!localStorage.getItem('events')) {
        localStorage.setItem('events', JSON.stringify([]));
    }
    
    // Initialize webinars with default webinar
    if (!localStorage.getItem('webinars')) {
        const defaultWebinars = [
            {
                id: '1',
                title: 'Moja moč je v meni',
                date: '12. februarja, 2026',
                description: 'Brezplačni webinar o odkritju notranje moči in spremembi življenja.',
                videoId: '1164808779',
                videoUrl: 'https://player.vimeo.com/video/1164808779?badge=0&autopause=0&player_id=0&app_id=58479'
            }
        ];
        localStorage.setItem('webinars', JSON.stringify(defaultWebinars));
    }
}

// Get current user from localStorage (populated by Firebase Auth)
function getCurrentUser() {
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) {
        // Check if Firebase Auth is available
        if (typeof auth !== 'undefined' && auth.currentUser) {
            // Try to get from Firebase
            return null; // Will trigger redirect in initDashboard
        }
        window.location.href = '/login';
        return null;
    }
    return JSON.parse(userStr);
}

// Check if user is admin
function isAdmin() {
    const user = getCurrentUser();
    return user && user.role === 'admin';
}

// Logout function using Firebase
async function handleLogout() {
    try {
        // Sign out from Firebase
        if (typeof auth !== 'undefined' && auth.currentUser) {
            await auth.signOut();
        }
        // Clear localStorage
        localStorage.removeItem('currentUser');
        // Redirect to login
        window.location.href = '/login';
    } catch (error) {
        console.error('Error logging out:', error);
        // Clear localStorage anyway and redirect
        localStorage.removeItem('currentUser');
        window.location.href = '/login';
    }
}

// Track if dashboard is initialized to prevent duplicate initialization
let dashboardInitialized = false;
let currentSidebarTab = 'active-work';

function updateMobileDrawerBodyLock() {
    try {
        const isMobile = window.matchMedia('(max-width: 768px)').matches;
        if (!isMobile) {
            document.body.style.overflow = '';
            return;
        }
        const rightOpen = !!document.querySelector('.dashboard-right.open');
        const leftOpen = !!document.querySelector('.dashboard-sidebar.open');
        document.body.style.overflow = (rightOpen || leftOpen) ? 'hidden' : '';
    } catch (e) {
        // no-op
    }
}

function setRightPanelOpen(open) {
    const rightPanel = document.getElementById('rightPanel') || document.querySelector('.dashboard-right');
    const toggleBtn = document.getElementById('rightMenuToggle') || document.getElementById('leftMenuToggle');
    if (!rightPanel || !toggleBtn) return;

    if (open) {
        rightPanel.classList.add('open');
        toggleBtn.setAttribute('aria-expanded', 'true');
    } else {
        rightPanel.classList.remove('open');
        toggleBtn.setAttribute('aria-expanded', 'false');
    }

    updateMobileDrawerBodyLock();
}

window.toggleRightPanel = function() {
    const rightPanel = document.getElementById('rightPanel') || document.querySelector('.dashboard-right');
    if (!rightPanel) return;
    const nextOpen = !rightPanel.classList.contains('open');
    setRightPanelOpen(nextOpen);
};

function setLeftMenuOpen(open) {
    const leftMenu = document.querySelector('.dashboard-sidebar');
    const toggleBtn = document.getElementById('leftMenuToggle');
    if (!leftMenu || !toggleBtn) return;

    if (open) {
        leftMenu.classList.add('open');
        toggleBtn.setAttribute('aria-expanded', 'true');
    } else {
        leftMenu.classList.remove('open');
        toggleBtn.setAttribute('aria-expanded', 'false');
    }
    updateMobileDrawerBodyLock();
}

window.toggleLeftMenu = function() {
    const leftMenu = document.querySelector('.dashboard-sidebar');
    if (!leftMenu) return;
    const nextOpen = !leftMenu.classList.contains('open');
    setLeftMenuOpen(nextOpen);
};

window.closeLeftMenu = function() {
    setLeftMenuOpen(false);
};

// Initialize dashboard
function initDashboard() {
    if (dashboardInitialized) {
        console.log('Dashboard already initialized, skipping');
        return;
    }
    dashboardInitialized = true;
    window.dashboardInitialized = true;
    // Double-check authentication before proceeding
    if (typeof auth !== 'undefined' && auth && auth.currentUser === null) {
        // Check localStorage as fallback
        const currentUser = localStorage.getItem('currentUser');
        if (!currentUser) {
            window.location.href = '/login';
            return;
        }
    }
    
    initDataStructures();
    
    const user = getCurrentUser();
    if (!user) {
        window.location.href = '/login';
        return;
    }
    
    // Display user info
    document.getElementById('userName').textContent = user.name || user.email;
    const roleEl = document.getElementById('userRole');
    const roleLabels = { admin: 'Admin', member: 'Članica', guest: 'Gost' };
    roleEl.textContent = roleLabels[user.role] || (user.role === 'admin' ? 'Admin' : 'Članica');
    roleEl.className = `user-role ${user.role}`;
    
    // Navigation
    // Left sidebar navigation (Tečaji / Webinarji / Koledar / Nastavitve)
    document.querySelectorAll('[data-sidebar]').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const tab = this.getAttribute('data-sidebar');

            document.querySelectorAll('[data-sidebar].sidebar-item').forEach(x => x.classList.remove('active'));
            this.classList.add('active');

            currentSidebarTab = tab;
            switchSection('profile');
            setLeftMenuOpen(false);
        });
    });
    
    // Load initial section (profile first)
    switchSection('profile');
    // Right panel content
    renderRightPanel();
    loadMiniWeekCalendar().then(() => {
        // Re-render panel after Firestore-loaded events update localStorage
        renderRightPanel();
        loadMiniWeekCalendar();
    });
    
    // Check welcome status AFTER everything is initialized
    // Wait for Firebase to be ready
    waitForFirebaseAndCheckWelcome();
}

function userHasCourseAccessForResume(courseId, user) {
    if (!user || !user.userId) return false;
    if (user.role !== 'guest') return true;
    if (String(courseId).startsWith('webinar-')) return false;
    const purchased = Array.isArray(user.purchasedCourses) ? user.purchasedCourses : [];
    return purchased.includes(courseId);
}

function buildCourseResumeUrl(courseId, episodeId) {
    const e = encodeURIComponent(String(episodeId));
    if (String(courseId).startsWith('webinar-')) {
        const wid = String(courseId).replace(/^webinar-/, '');
        return `/course?webinar=${encodeURIComponent(wid)}&episode=${e}`;
    }
    return `/course?id=${encodeURIComponent(courseId)}&episode=${e}`;
}

async function renderResumeInRightPanel(statsEl, user) {
    if (!statsEl) return;
    statsEl.innerHTML = '<p class="right-resume-placeholder" style="margin:0; color:var(--text-light); font-size:13px;">Nalaganje …</p>';

    let resume = null;
    let resumeTs = 0;
    try {
        const localRaw = localStorage.getItem('courseLastResume');
        if (localRaw) {
            const local = JSON.parse(localRaw);
            if (local && local.courseId && local.episodeId) {
                resume = { courseId: local.courseId, episodeId: String(local.episodeId) };
                resumeTs = Number(local.ts) || 0;
            }
        }
    } catch (e) {
        /* ignore */
    }

    if (user && user.userId && typeof db !== 'undefined') {
        try {
            const snap = await db.collection('users').doc(user.userId).get();
            if (snap.exists) {
                const cloud = snap.data().lastCourseResume;
                if (cloud && cloud.courseId && cloud.episodeId) {
                    const t = cloud.updatedAt && typeof cloud.updatedAt.toMillis === 'function'
                        ? cloud.updatedAt.toMillis()
                        : 0;
                    if (t >= resumeTs) {
                        resume = { courseId: cloud.courseId, episodeId: String(cloud.episodeId) };
                        resumeTs = t;
                    }
                }
            }
        } catch (e) {
            console.warn('renderResumeInRightPanel', e);
        }
    }

    if (!resume) {
        statsEl.innerHTML = `
            <div class="right-resume-empty">
                <p style="margin:0; color:var(--text-light); font-size:13px; line-height:1.55;">
                    Ko začneš z ogledom tečaja, se ti tukaj prikaže zadnja epizoda, pri kateri si ostala.
                </p>
            </div>`;
        return;
    }

    const courses = JSON.parse(localStorage.getItem('courses') || '[]');
    const course = courses.find(c => c.id === resume.courseId);

    let courseTitle = course && course.title ? course.title : '';
    if (!courseTitle) {
        if (resume.courseId === 'moc-besede') {
            courseTitle = 'Moč besede';
        } else if (String(resume.courseId).startsWith('webinar-')) {
            const wid = String(resume.courseId).replace(/^webinar-/, '');
            const webinars = JSON.parse(localStorage.getItem('webinars') || '[]') || [];
            const w = webinars.find(x => String(x.id) === String(wid));
            courseTitle = w ? (w.title || 'Webinar') : 'Webinar';
        } else {
            courseTitle = 'Tečaj';
        }
    }

    let episodeTitle = '';
    if (course && Array.isArray(course.episodes)) {
        const ep = course.episodes.find(e => String(e.id) === String(resume.episodeId));
        if (ep) episodeTitle = (ep.title || '').trim();
    }
    if (!episodeTitle) {
        episodeTitle = 'Zadnja epizoda';
    }

    const epIndex = course && Array.isArray(course.episodes)
        ? course.episodes.findIndex(e => String(e.id) === String(resume.episodeId))
        : -1;
    const epLabel = epIndex >= 0 ? `Epizoda ${epIndex + 1}` : '';

    const hasAccess = userHasCourseAccessForResume(resume.courseId, user);
    const url = buildCourseResumeUrl(resume.courseId, resume.episodeId);

    if (!hasAccess) {
        statsEl.innerHTML = `
            <div class="right-resume-card right-resume-locked">
                <div style="font-weight:800; color:var(--dark-violet); font-size:14px; font-family:'Playfair Display',serif;">${escapeHtml(courseTitle)}</div>
                <div style="color:var(--text-light); font-size:12px; margin-top:6px; line-height:1.45;">${escapeHtml(episodeTitle)}${epLabel ? ` · ${escapeHtml(epLabel)}` : ''}</div>
                <p style="margin:10px 0 0; font-size:12px; color:var(--text-light);">Za nadaljevanje potrebuješ dostop.</p>
                <a href="/jaz-zenska" class="right-resume-btn">Več o dostopu</a>
            </div>`;
        return;
    }

    statsEl.innerHTML = `
        <a href="${url}" class="right-resume-card">
            <div style="font-weight:800; color:var(--dark-violet); font-size:14px; font-family:'Playfair Display',serif;">${escapeHtml(courseTitle)}</div>
            <div style="color:var(--text-dark); font-size:13px; margin-top:8px; line-height:1.45;">${escapeHtml(episodeTitle)}</div>
            ${epLabel ? `<div style="color:var(--text-light); font-size:11px; margin-top:4px;">${escapeHtml(epLabel)}</div>` : ''}
            <div style="margin-top:10px; font-size:12px; font-weight:700; color:var(--mid-violet);">Nadaljuj poslušanje →</div>
        </a>`;
}

function renderRightPanel() {
    const upcomingEl = document.getElementById('rightUpcoming');
    const statsEl = document.getElementById('rightStats');
    if (!upcomingEl || !statsEl) return;

    const user = getCurrentUser() || {};
    const currentUser = user || {};
    const role = currentUser.role || 'member';

    void renderResumeInRightPanel(statsEl, currentUser);

    // Upcoming events (from events cache)
    const rawEvents = JSON.parse(localStorage.getItem('events') || '[]') || [];
    const events = mergeCanonicalEvents(rawEvents);
    const toLocalDateStringCal = (d) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return y + '-' + m + '-' + day;
    };

    const now = new Date();
    const upcomingEvents = events
        .map(e => ({ ...e, _dt: e.date ? new Date(e.date) : null }))
        .filter(e => e._dt && !Number.isNaN(e._dt.getTime()) && e._dt >= now)
        .sort((a, b) => a._dt - b._dt)
        .slice(0, 3);

    const webinars = JSON.parse(localStorage.getItem('webinars') || '[]') || [];
    const hasWebinarAccess = role !== 'guest';
    const upcomingWebinars = webinars.slice(0, 2);

    upcomingEl.innerHTML = `
        <div class="right-list">
            <div style="color: var(--text-light); font-weight:800; font-size:12px; letter-spacing:0.02em; margin-top:10px;">
                Dogodki
            </div>
            ${upcomingEvents.length === 0 ? `
                <div class="right-list-item" style="cursor:default;">
                    <div class="right-list-item-title">Ni prihajajočih dogodkov</div>
                    <div class="right-list-item-meta">Preveri koledar</div>
                </div>
            ` : upcomingEvents.map(evt => {
                const d = new Date(evt._dt);
                const dateStr = toLocalDateStringCal(d);
                const evtId = evt.id != null && evt.id !== '' ? String(evt.id) : '';
                return `
                    <div class="right-list-item js-open-calendar-day" data-date="${escapeHtml(dateStr)}" data-event-id="${escapeHtml(evtId)}">
                        <div class="right-list-item-title">${escapeHtml(evt.title || 'Dogodek')}</div>
                        <div class="right-list-item-meta">🗓 ${escapeHtml(d.toLocaleDateString('sl-SI', { year:'numeric', month:'long', day:'numeric' }))}</div>
                    </div>
                `;
            }).join('')}

            <div style="color: var(--text-light); font-weight:800; font-size:12px; letter-spacing:0.02em; margin-top:10px;">
                Webinarji
            </div>
            ${upcomingWebinars.length === 0 ? `
                <div class="right-list-item" style="cursor:default;">
                    <div class="right-list-item-title">Ni webinarjev</div>
                    <div class="right-list-item-meta">V prihodnosti kmalu</div>
                </div>
            ` : upcomingWebinars.map(w => `
                <div class="right-list-item" onclick="openWebinar('${w.id}', ${hasWebinarAccess})" style="${hasWebinarAccess ? '' : 'opacity:0.9;'}">
                    <div class="right-list-item-title">${escapeHtml(w.title || 'Webinar')}</div>
                    <div class="right-list-item-meta">📅 ${escapeHtml(w.date || '')}${hasWebinarAccess ? '' : ' • zaklenjeno'}</div>
                </div>
            `).join('')}
        </div>
    `;
    upcomingEl.querySelectorAll('.js-open-calendar-day').forEach(el => {
        el.addEventListener('click', () => {
            const date = el.getAttribute('data-date') || '';
            const eventId = el.getAttribute('data-event-id') || null;
            if (date) window.openCalendarForDay(date, eventId);
        });
    });
}

async function loadMiniWeekCalendar() {
    const content = document.getElementById('miniCalendarContent');
    if (!content) return;

    let events = [];
    try {
        if (typeof db !== 'undefined') {
            const eventsSnapshot = await db.collection('events').orderBy('date', 'asc').get();
            if (!eventsSnapshot.empty) {
                events = eventsSnapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        title: data.title,
                        description: data.description,
                        date: data.date ? (data.date.toDate ? data.date.toDate().toISOString() : data.date) : new Date().toISOString(),
                        time: data.time,
                        type: data.type,
                        location: data.location
                    };
                });
                localStorage.setItem('events', JSON.stringify(events));
            }
        }
    } catch (e) {
        console.error('Error loading mini calendar events:', e);
    }

    if (events.length === 0) {
        events = JSON.parse(localStorage.getItem('events') || '[]');
    }

    events = mergeCanonicalEvents(events);

    const now = new Date();
    const day = now.getDay(); // 0-6, Sunday 0
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() + mondayOffset);
    weekStart.setHours(0, 0, 0, 0);

    const weekDays = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date(weekStart);
        d.setDate(weekStart.getDate() + i);
        return d;
    });

    const toLocalDateString = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    content.innerHTML = `
        <div class="mini-week-calendar" onclick="openFullCalendarModal()">
            ${weekDays.map(d => {
                const key = toLocalDateString(d);
                const count = events.filter(e => {
                    const ed = new Date(e.date);
                    return toLocalDateString(ed) === key;
                }).length;
                const isToday = toLocalDateString(d) === toLocalDateString(now);
                return `
                    <div class="mini-day ${isToday ? 'today' : ''}">
                        <div class="mini-day-name">${d.toLocaleDateString('sl-SI', { weekday: 'short' })}</div>
                        <div class="mini-day-number">${d.getDate()}</div>
                        <div class="mini-day-dot ${count > 0 ? 'has' : ''}"></div>
                    </div>
                `;
            }).join('')}
        </div>
        <button type="button" class="mini-calendar-open" onclick="openFullCalendarModal()">Odpri celoten koledar</button>
    `;
}

window.openFullCalendarModal = function() {
    const modal = document.getElementById('fullCalendarModal');
    if (!modal) return;
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
    void loadCalendar();
};

/**
 * Odpri celoten koledar na pravem mesecu in pokaži dogodek (ali vse dogodke tistega dne).
 * @param {string} dateStr - YYYY-MM-DD
 * @param {string|null|undefined} eventId - če je podan, modal pokaže ta dogodek (če obstaja na ta dan)
 */
window.openCalendarForDay = async function(dateStr, eventId) {
    const full = document.getElementById('fullCalendarModal');
    if (!full) return;
    const parts = String(dateStr || '').split('-').map(Number);
    if (parts.length === 3 && !parts.some(n => Number.isNaN(n))) {
        currentCalendarDate = new Date(parts[0], parts[1] - 1, 1);
    }
    full.classList.add('show');
    document.body.style.overflow = 'hidden';
    try {
        await loadCalendar();
        await showDayEvents(dateStr, eventId);
    } catch (error) {
        console.error('openCalendarForDay failed:', error);
        openFullCalendarModal();
    }
};

window.closeFullCalendarModal = function() {
    const modal = document.getElementById('fullCalendarModal');
    if (!modal) return;
    modal.classList.remove('show');
    document.body.style.overflow = '';
};

// Close right drawer when clicking outside (mobile)
document.addEventListener('click', function(e) {
    const rightPanel = document.getElementById('rightPanel') || document.querySelector('.dashboard-right');
    const toggleBtn = document.getElementById('rightMenuToggle') || document.getElementById('leftMenuToggle');
    if (!rightPanel || !toggleBtn) return;
    const isOpen = rightPanel.classList.contains('open');
    if (!isOpen) return;

    const clickedInsidePanel = !!e.target.closest('#rightPanel');
    const clickedToggle = !!e.target.closest('#rightMenuToggle') || !!e.target.closest('#leftMenuToggle');
    if (clickedInsidePanel || clickedToggle) return;

    setRightPanelOpen(false);
});

// Close left menu when clicking outside (mobile)
document.addEventListener('click', function(e) {
    const leftMenu = document.querySelector('.dashboard-sidebar');
    const toggleBtn = document.getElementById('leftMenuToggle');
    if (!leftMenu || !toggleBtn) return;
    const isOpen = leftMenu.classList.contains('open');
    if (!isOpen) return;

    const clickedInsideMenu = !!e.target.closest('.dashboard-sidebar');
    const clickedToggle = !!e.target.closest('#leftMenuToggle');
    if (clickedInsideMenu || clickedToggle) return;

    setLeftMenuOpen(false);
});

// Wait for Firebase to be ready before checking welcome status
async function waitForFirebaseAndCheckWelcome() {
    // Wait up to 3 seconds for Firebase to initialize
    let attempts = 0;
    const maxAttempts = 30; // 30 * 100ms = 3 seconds
    
    const checkInterval = setInterval(() => {
        attempts++;
        
        // Check if Firebase is ready
        if (typeof db !== 'undefined' && db) {
            clearInterval(checkInterval);
            checkWelcomeStatus();
        } else if (attempts >= maxAttempts) {
            clearInterval(checkInterval);
            // Firebase not available: do not use cached/local welcomed flag.
            // We intentionally skip showing welcome modal until Firestore is available.
            console.warn('Firebase not available, skipping welcome modal check');
        }
    }, 100);
}

// Switch between sections
function switchSection(section) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(sec => {
        sec.classList.remove('active');
    });
    
    // Show selected section
    const targetSection = document.getElementById(section);
    if (targetSection) {
        targetSection.classList.add('active');
        
        // Load section content
        switch(section) {
            case 'calendar':
                loadCalendar();
                break;
            case 'profile':
                loadProfile();
                break;
        }
    }
}

// ===== QUESTIONNAIRE SECTION =====
const QUESTIONNAIRE_QUESTIONS = [
    'Kdo sem jaz?',
    'Katere vloge igram?',
    'Katere maske nosim?',
    'Kaj je tisto kar si res želim?',
    'Kako močno si to želim?',
    'Kaj mi to pomeni?',
    'Kdo je najpomembnejša oseba v mojem življenju?',
    'Koga si želim v mojem življenju?',
    'Kdo me omejuje?',
    'Kaj me omejuje?',
    'Če bi lahko naredila kar koli,  kaj bi v tem trenutku spremenila?',
    'Kaj bi morala narediti, da bi bila ponosna sama nase?',
    'Kaj zame pomeni sreča?',
    'Koga želim osrečit?',
    'S čim ali kom, pogojujem svoje občutke sreče?',
    'Kaj mi preprečuje, da bi bila srečna že sedaj?',
    'Kaj je tisto, kar bi me res osrečilo?',
    'Kaj sem pripravljena za to narediti?',
    'Kaj me bogati?',
    'Kaj mi daje občutek pomembnosti?',
    'Kaj mi dviguje energijo?',
    'Kakšno je moje zdravje in kako se počutim sedaj?',
    'Kaj delam za svoje zdravje in boljše počutje?',
    'Kaj bi še lahko naredila za svoje zdravje in boljše počutje?',
    'Česa si želiš več v svojem življenju!',
    'Česa si ne želiš več v svojem življenju.',
    'Kaj me še skrbi?',
    'Kaj so moji strahovi?',
    'Kaj je moja največja želja?',
    'Kaj bi naredila če bi imela neomejeno denarja, časa, moči...?',
    'Kaj bi naredila, če bi imela samo še en mesec življenja?',
    'Kaj mi stoji na poti, da tega ne naredim sedaj?'
];

const QUESTIONNAIRE_INTRO = `Vabim te, da vzameš papir in svinčnik. Poskrbi, da boš imela dovolj časa in da te ne bodo motili, nato pa si začni postavljati vprašanja in brez razmišljanja piši odgovore. Napiši vse, kar ti pride na misel, kar je v tebi in  kar se ti bo ponudilo kot odgovor.  Brez cenzure, brez presojanja ali je to možno ali ne, brez dvomov in obsojanj. Napiši vse tisto, kar bo privrelo na plan, iskreno odkrito in brez omejitev.`;

const QUESTIONNAIRE_OUTRO = `Če si prišla do konca in na vsa vprašanja odgovorila iskreno, iz srca, brez razmišljanja in preračunavanja kaj je prav in kaj narobe, brez dvoma kaj lahko in česa ne moreš, potem si prišla do informacij, ki ti bodo pri tvojem delu zelo koristile.

S skupnim delom, učenjem, spoznavanjem, vajami, druženjem in medsebojno podporo bomo skozi leto korak po korak hodile skupaj, pa vendar vsaka po svoji poti, do svojih ciljev. Pomagala ti bom da boš:

- Ozavestila svojo moč in se naučila sprejemati znamenja in darila, pa tudi bolečino, slabe  trenutke in neprijetne situacije kot učitelje na tvoji poti, ki te dobronamerno budijo, usmerjajo in opozarjajo.
- Prepoznala kaj v svojem življenju lahko spremeniš, nadgradiš, izboljšaš...
- Sprejela zavedanje da zmoreš, da si zaslužiš in da si vredna, da nisi sama in da je prav ta trenutek tukaj in sedaj pravi, da narediš prvi korak na svoji novi poti.

Če se po vseh teh vprašanjih počutiš negotovo, utrujeno, izčrpano, mogoče celo prestrašeno in so se ti porodila dodatna vprašanja, mi lahko pišeš na e-mail: marjanca@jazzenska.com, in ti bom v najkrajšem roku odgovorila, sicer pa bomo skupaj iskale odgovore in rešitve počasi in vztrajno iz lekcije v lekcijo, hodile skupaj, pa vendar vsaka po svoji poti do spremeb in ciljev, ki smo si jih zadale.

Bodi dobro, pozdrav in topel objem

- Marjanca`;

async function loadQuestionnaire(container) {
    const user = getCurrentUser();
    if (!user) return;
    
    const content = container || document.getElementById('questionnaireContent');
    if (!content) return;
    
    let answers = {};
    if (typeof db !== 'undefined' && user.userId) {
        try {
            const userDoc = await db.collection('users').doc(user.userId).get();
            if (userDoc.exists) {
                const data = userDoc.data();
                answers = data.questionnaireAnswers || {};
            }
        } catch (e) {
            console.error('Error loading questionnaire answers:', e);
        }
    }
    
    const firstName = (user.name || user.email || '').trim().split(/\s+/)[0] || 'članica';
    
    let html = `
        <div class="questionnaire-intro">
            <p><strong>Draga ${escapeHtml(firstName)}</strong></p>
            <p>${QUESTIONNAIRE_INTRO.replace(/\n/g, '<br>')}</p>
        </div>
        <div class="questionnaire-questions">
    `;
    
    QUESTIONNAIRE_QUESTIONS.forEach((q, i) => {
        const key = 'q' + (i + 1);
        const raw = answers[key] || '';
        const safeValue = raw.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/&/g, '&amp;');
        html += `
            <div class="questionnaire-item">
                <label class="questionnaire-label">${escapeHtml(q)}</label>
                <textarea class="questionnaire-answer" data-key="${key}" rows="2" placeholder="Odgovor">${safeValue}</textarea>
            </div>
        `;
    });
    
    html += `
        </div>
        <div class="questionnaire-outro">${QUESTIONNAIRE_OUTRO.replace(/\n/g, '<br>')}</div>
        <div class="questionnaire-actions">
            <button type="button" class="questionnaire-save-btn" onclick="saveQuestionnaire()">Shrani odgovore</button>
        </div>
    `;
    
    content.innerHTML = html;
    
    content.querySelectorAll('.questionnaire-answer').forEach(ta => {
        autoResizeTextarea(ta);
        ta.addEventListener('input', function() { autoResizeTextarea(this); });
    });
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function autoResizeTextarea(el) {
    el.style.height = 'auto';
    el.style.height = Math.max(48, el.scrollHeight) + 'px';
}

window.saveQuestionnaire = async function() {
    const user = getCurrentUser();
    if (!user || !user.userId) return;
    
    const answers = {};
    document.querySelectorAll('.questionnaire-answer').forEach(ta => {
        const key = ta.getAttribute('data-key');
        if (key) answers[key] = (ta.value || '').trim();
    });
    
    try {
        if (typeof db !== 'undefined') {
            await db.collection('users').doc(user.userId).update({
                questionnaireAnswers: answers,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
        alert('Odgovori so bili shranjeni.');
    } catch (e) {
        console.error('Error saving questionnaire:', e);
        alert('Pri shranjevanju je prišlo do napake. Poskusite znova.');
    }
};

// ===== CLASSROOM SECTION =====
async function loadClassroom(container) {
    const content = container || document.getElementById('classroomContent');
    if (!content) return;
    
    let courses = [];
    
    // Try to load from Firestore first
    try {
        if (typeof db !== 'undefined') {
            const coursesSnapshot = await db.collection('courses').get();
            
            if (!coursesSnapshot.empty) {
                courses = coursesSnapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        title: data.title,
                        description: data.description,
                        episodes: data.episodes || [],
                        progress: data.progress || 0,
                        completed: data.completed || false,
                        createdAt: data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate().toISOString() : data.createdAt) : new Date().toISOString()
                    };
                });
                
                // Update localStorage cache
                localStorage.setItem('courses', JSON.stringify(courses));
                console.log('Loaded courses from Firestore');
            }
        }
    } catch (error) {
        console.error('Error loading courses from Firestore:', error);
    }
    
    // Fallback to localStorage if Firestore failed or returned no courses
    if (courses.length === 0) {
        courses = JSON.parse(localStorage.getItem('courses') || '[]');
        console.log('Loaded courses from localStorage');
    }
    
    // Filter out specific courses to delete
    const coursesToDelete = [
        'Moj jutranji obred in meditacija',
        'Vadba za lahkotnost, prožnost in vitalnost',
        'Meditativni ples za sproščanje',
        // Webinarji (niso tečaji) – ostanejo le pod »Webinarji«
        'Moja moč je v meni',
        '25 Stopnic do srece',
        '25 Stopnic do sreče'
    ];

    courses = courses.filter(course => {
        if (coursesToDelete.includes(course.title)) return false;
        const t = String(course.title || '').toLowerCase();
        if (t.includes('stopnic')) return false;
        return true;
    });
    
    // Guests can see all courses; lock those they do not own
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const purchasedCourses = Array.isArray(currentUser.purchasedCourses)
        ? currentUser.purchasedCourses
        : (Array.isArray(currentUser.boughtCourses) ? currentUser.boughtCourses : []);
    
    let html = `
        <div class="classroom-courses-block">
            <h3 style="font-family:'Playfair Display', serif; color: var(--dark-violet); margin: 0 0 12px;">Tečaji</h3>
    `;

    const isGuest = currentUser.role === 'guest';
    const hasMocBesedeAccess = !isGuest || purchasedCourses.includes('moc-besede');
    // Keep "Moč besede" always as a featured card in webinar-like design
    html += `
        <div class="webinars-grid" style="margin-bottom: 24px;">
            <div class="webinar-card ${hasMocBesedeAccess ? '' : 'locked'}" onclick="openCourse('moc-besede', ${hasMocBesedeAccess})">
                <img src="images/moc besede.webp" alt="Moč besede" class="webinar-card-image">
                <div class="webinar-title">Moč besede</div>
                <div class="webinar-date">30-dnevna e-delavnica</div>
                <div class="webinar-description">Spoznaj moč besed in kako z majhnimi spremembami v izražanju vplivaš na počutje, odnose in rezultate v življenju.</div>
                ${!hasMocBesedeAccess ? '<div class="webinar-lock-note">Nimate dostopa do tega tečaja</div>' : ''}
            </div>
        </div>
    `;

    // Remove moc-besede from the generic grid so it doesn't appear as a purple card
    courses = courses.filter(course => course.id !== 'moc-besede');
    
    if (courses.length > 0) {
        html += '<div class="courses-grid">';
        courses.forEach(course => {
            const isGuest = currentUser.role === 'guest';
            const hasAccess = !isGuest || purchasedCourses.includes(course.id);
            html += `
                <div class="course-card ${hasAccess ? '' : 'locked'}" onclick="openCourse('${course.id}', ${hasAccess})">
                    <div class="course-title">${course.title}</div>
                    <div class="course-info">
                        <span>${course.episodes?.length || 0} epizod</span>
                        ${course.progress ? `<span>${course.progress}% dokončano</span>` : ''}
                        ${!hasAccess ? '<span class="course-lock-note">Nimate dostopa do tega tečaja</span>' : ''}
                    </div>
                </div>
            `;
        });
        html += '</div>';
    }

    html += `</div>`;
    // If only moc-besede exists, the page will still render the photo card above.
    content.innerHTML = html;
}

function getCourseBuyUrl(courseId) {
    if (courseId === 'moc-besede') return '/o-tecaju';
    return '/spletna-trgovina';
}

function openCourse(courseId, hasAccess = true) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (currentUser.role === 'guest' && !hasAccess) {
        showGuestJoinPopup();
        return;
    }
    window.location.href = `/course?id=${courseId}`;
}

function showGuestJoinPopup() {
    const existing = document.getElementById('guestJoinModal');
    if (existing) {
        existing.classList.add('show');
        return;
    }
    const overlay = document.createElement('div');
    overlay.id = 'guestJoinModal';
    overlay.className = 'no-access-modal';
    overlay.innerHTML = `
        <div class="no-access-modal-content">
            <h3 class="no-access-title">Dostop do vseh vsebin v spletni učilnici imajo samo članice skupnosti.</h3>
            <div class="no-access-buttons">
                <a href="/jaz-zenska" class="no-access-btn no-access-btn-primary">Pridruži se</a>
            </div>
            <button type="button" class="no-access-close" aria-label="Zapri">&times;</button>
        </div>
    `;
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay || e.target.classList.contains('no-access-close')) {
            overlay.classList.remove('show');
        }
    });
    document.body.appendChild(overlay);
    document.body.appendChild(document.createElement('style')).textContent = `
        .no-access-modal { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(3px); z-index: 20000; align-items: center; justify-content: center; padding: 20px; }
        .no-access-modal.show { display: flex; }
        .no-access-modal-content { background: linear-gradient(160deg, #fff 0%, #fbf8fa 100%); border-radius: 22px; padding: 34px 30px 30px; max-width: 460px; width: 100%; position: relative; box-shadow: 0 24px 70px rgba(0,0,0,0.35); border: 1px solid rgba(153,98,122,0.22); }
        .no-access-title { font-family: 'Playfair Display', serif; font-size: 25px; line-height: 1.35; color: var(--dark-violet); margin: 0 0 22px; text-align: center; }
        .no-access-buttons { display: flex; flex-direction: column; gap: 12px; align-items: center; }
        .no-access-btn { display: block; text-align: center; padding: 14px 24px; border-radius: 50px; font-size: 16px; font-weight: 700; text-decoration: none; transition: all 0.3s ease; min-width: 180px; }
        .no-access-btn-primary { background: linear-gradient(135deg, #99627A 0%, #643843 100%); color: white; box-shadow: 0 8px 28px rgba(100,56,67,0.35); }
        .no-access-btn-primary:hover { transform: translateY(-2px); }
        .no-access-close { position: absolute; top: 16px; right: 16px; background: none; border: none; font-size: 28px; color: var(--text-light); cursor: pointer; line-height: 1; padding: 0; }
        .no-access-close:hover { color: var(--dark-violet); }
    `;
    overlay.classList.add('show');
}

function ensureGuestLockedVisualOverrides() {
    if (document.getElementById('guestLockedVisualOverrides')) return;
    const style = document.createElement('style');
    style.id = 'guestLockedVisualOverrides';
    style.textContent = `
        .guest-locked-muted::before {
            background: linear-gradient(90deg, #c8c8c8 0%, #d9d9d9 100%) !important;
        }
        .guest-locked-muted {
            border-color: rgba(180, 180, 180, 0.45) !important;
            box-shadow: 0 14px 36px rgba(44, 34, 40, 0.06), 0 0 0 1px rgba(180, 180, 180, 0.25) !important;
        }
        .guest-locked-btn-disabled {
            background: #b8b8b8 !important;
            border: 1px solid #b8b8b8 !important;
            color: #fff !important;
            box-shadow: none !important;
            transform: none !important;
            cursor: not-allowed !important;
            text-decoration: none !important;
        }
        .guest-locked-btn-disabled:hover {
            background: #b8b8b8 !important;
            box-shadow: none !important;
            transform: none !important;
        }
        a.extra-offer-image-link.locked {
            cursor: not-allowed !important;
            text-decoration: none !important;
            outline: none !important;
        }
        a.extra-offer-image-link.locked img {
            filter: grayscale(100%) !important;
            opacity: 0.72 !important;
            box-shadow: none !important;
        }
    `;
    document.head.appendChild(style);
}

// Locked content message for guests (calendar, webinars)
function getGuestLockedHtml() {
    return `
        <div style="
            max-width: 520px;
            margin: 24px auto;
            background: linear-gradient(135deg, #f8f0f2 0%, #fff6f9 100%);
            border: 1px solid rgba(153, 98, 122, 0.2);
            border-left: 4px solid var(--mid-violet);
            border-radius: 16px;
            padding: 24px;
            box-shadow: 0 8px 24px rgba(100, 56, 67, 0.1);
            text-align: center;
        ">
            <p style="margin: 0 0 12px; color: var(--text-dark); font-size: 16px; line-height: 1.6;">
                Želite dostop do vseh tečajev?
            </p>
            <a href="/jaz-zenska" style="
                display: inline-block;
                background: linear-gradient(135deg, #99627A 0%, #643843 100%);
                color: #fff;
                padding: 12px 24px;
                border-radius: 999px;
                font-size: 14px;
                font-weight: 600;
                text-decoration: none;
                box-shadow: 0 6px 20px rgba(100,56,67,0.25);
            ">Pridruži se skupini Jaz Ženska</a>
        </div>
    `;
}

// ===== WEBINARS SECTION =====
// 25 Stopnic do sreče – uradni Vimeo replay (iframe src kot na vimeo embed strani)
const STOPNIC_WEBINAR_VIMEO_URL = 'https://player.vimeo.com/video/1179302920?badge=0&autopause=0&player_id=0&app_id=58479';
const MOC_BESEDE_WEBINAR_VIMEO_URL = 'https://player.vimeo.com/video/1183774557?badge=0&autopause=0&player_id=0&app_id=58479';

/** Ensure 25 Stopnic webinar exists and has Vimeo replay (same flow as course player for «Moja moč je v meni»). */
function applyStopnicWebinarDefaults(webinars) {
    let list = Array.isArray(webinars) ? webinars.map(w => ({ ...w })) : [];
    list = list.map(w => {
        const t = String(w.title || '').trim();
        if (t === '25 Stopnic do sreče' || t === '25 Stopnic do srece') {
            return {
                ...w,
                title: '25 Stopnic do sreče',
                videoId: w.videoId || '1179302920',
                videoUrl: w.videoUrl || STOPNIC_WEBINAR_VIMEO_URL
            };
        }
        if (t === 'Moč Besede | Webinar' || t === 'Moc Besede | Webinar' || t === 'Moč besede | Webinar' || t === 'Moc besede | Webinar') {
            return {
                ...w,
                title: 'Moč Besede | Webinar',
                videoId: w.videoId || '1183774557',
                videoUrl: w.videoUrl || MOC_BESEDE_WEBINAR_VIMEO_URL
            };
        }
        return w;
    });
    const hasStopnic = list.some(w => String(w.title || '').trim() === '25 Stopnic do sreče');
    if (!hasStopnic) {
        list.unshift({
            id: '2',
            title: '25 Stopnic do sreče',
            date: '9. marca 2026',
            description: 'Webinar 25 stopnic do sreče — posnetek.',
            videoId: '1179302920',
            videoUrl: STOPNIC_WEBINAR_VIMEO_URL
        });
    }

    const hasMocBesede = list.some(w => {
        const t = String(w.title || '').trim().toLowerCase();
        return t === 'moč besede | webinar' || t === 'moc besede | webinar';
    });
    if (!hasMocBesede) {
        list.unshift({
            id: '3',
            title: 'Moč Besede | Webinar',
            date: '14. aprila 2026',
            description: 'Webinar Moč Besede.',
            videoId: '1183774557',
            videoUrl: MOC_BESEDE_WEBINAR_VIMEO_URL
        });
    }
    return list;
}

function getStopnicWebinarReplayUrl() {
    try {
        let webinars = JSON.parse(localStorage.getItem('webinars') || '[]');
        webinars = applyStopnicWebinarDefaults(webinars);
        const row = webinars.find(w => {
            const t = String(w.title || '').trim();
            return t === '25 Stopnic do sreče' || t === '25 Stopnic do srece';
        });
        const id = row ? row.id : '2';
        return `/course?webinar=${encodeURIComponent(id)}`;
    } catch (e) {
        return '/course?webinar=2';
    }
}

async function loadWebinars(container) {
    const content = container || document.getElementById('webinarsContent');
    if (!content) return;
    
    const user = getCurrentUser();
    const isGuest = !!(user && user.role === 'guest');
    
    // Initialize webinars if they don't exist
    if (!localStorage.getItem('webinars')) {
        const defaultWebinars = [
            {
                id: '1',
                title: 'Moja moč je v meni',
                date: '12. februarja, 2026',
                description: 'Brezplačni webinar o odkritju notranje moči in spremembi življenja.',
                videoId: '1164808779',
                videoUrl: 'https://player.vimeo.com/video/1164808779?badge=0&autopause=0&player_id=0&app_id=58479'
            },
            {
                id: '2',
                title: '25 Stopnic do sreče',
                date: '9. marca 2026',
                description: 'Webinar 25 stopnic do sreče.',
                videoId: '1179302920',
                videoUrl: STOPNIC_WEBINAR_VIMEO_URL
            },
            {
                id: '3',
                title: 'Moč Besede | Webinar',
                date: '14. aprila 2026',
                description: 'Webinar Moč Besede.',
                videoId: '1183774557',
                videoUrl: MOC_BESEDE_WEBINAR_VIMEO_URL
            }
        ];
        localStorage.setItem('webinars', JSON.stringify(defaultWebinars));
    }
    
    let webinars = JSON.parse(localStorage.getItem('webinars') || '[]');
    
    // Try to load from Firestore if available
    try {
        if (typeof db !== 'undefined') {
            const webinarsSnapshot = await db.collection('webinars').orderBy('date', 'desc').get();
            
            if (!webinarsSnapshot.empty) {
                webinars = webinarsSnapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        title: data.title,
                        date: data.date,
                        description: data.description,
                        videoId: data.videoId,
                        videoUrl: data.videoUrl
                    };
                });
                
                // Update localStorage cache
                localStorage.setItem('webinars', JSON.stringify(webinars));
            }
        }
    } catch (error) {
        console.error('Error loading webinars from Firestore:', error);
    }

    webinars = applyStopnicWebinarDefaults(webinars);
    localStorage.setItem('webinars', JSON.stringify(webinars));
    
    let html = '';
    
    if (webinars.length === 0) {
        html = '<p style="color: var(--text-light); text-align: center; padding: 40px;">Trenutno ni na voljo nobenih webinarjev.</p>';
    } else {
        html = '<div class="extra-offer-webinars-stack">';
        webinars.forEach(webinar => {
            const isStopnic = String(webinar.title || '').toLowerCase().includes('stopnic');
            const isMocBesede = String(webinar.title || '').toLowerCase().includes('moč besede') || String(webinar.title || '').toLowerCase().includes('moc besede');
            const cardImage = isStopnic ? 'images/aktualen dogodek 2.webp' : (isMocBesede ? 'images/moc besede fb.webp' : 'images/moja moc je v meni.webp');
            const hasAccess = !isGuest;
            const safeId = encodeURIComponent(String(webinar.id));
            const href = hasAccess ? `/course?webinar=${safeId}` : '/jaz-zenska';
            const lockedClass = hasAccess ? '' : ' locked';
            html += `
                <div class="extra-offer-image-row">
                    <a href="${href}" class="extra-offer-image-link${lockedClass}">
                        <img src="${cardImage}" alt="${escapeHtml(webinar.title)}">
                    </a>
                </div>
            `;
        });
        html += '</div>';
    }
    
    content.innerHTML = html;
}

function showStopnicWebinarPopup(hasAccess = true) {
    if (!hasAccess) {
        window.location.href = '/jaz-zenska';
        return;
    }
    window.location.href = getStopnicWebinarReplayUrl();
}

function closeStopnicWebinarPopup() {
    const modal = document.getElementById('stopnicWebinarModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function openWebinar(webinarId, hasAccess = true) {
    if (!hasAccess) {
        showGuestJoinPopup();
        return;
    }
    
    let webinars = JSON.parse(localStorage.getItem('webinars') || '[]');
    webinars = applyStopnicWebinarDefaults(webinars);
    localStorage.setItem('webinars', JSON.stringify(webinars));
    const webinar = webinars.find(w => String(w.id) === String(webinarId));
    
    if (!webinar) {
        console.error('Webinar not found:', webinarId);
        return;
    }
    
    // Open in course-style layout (progress bar + episode list)
    window.location.href = `/course?webinar=${encodeURIComponent(webinar.id)}`;
}

function closeWebinarModal() {
    const modal = document.getElementById('webinarModal');
    const videoContainer = document.getElementById('webinarVideoContainer');
    
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    // Clear video to stop playback
    if (videoContainer) {
        videoContainer.innerHTML = '';
    }
}

// Close modal on overlay click
document.addEventListener('DOMContentLoaded', function() {
    const webinarModal = document.getElementById('webinarModal');
    if (webinarModal) {
        webinarModal.addEventListener('click', function(e) {
            if (e.target === webinarModal) {
                closeWebinarModal();
            }
        });
    }
    
    const stopnicModal = document.getElementById('stopnicWebinarModal');
    if (stopnicModal) {
        stopnicModal.addEventListener('click', function(e) {
            if (e.target === stopnicModal) {
                closeStopnicWebinarPopup();
            }
        });
    }
    
    // Close on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const modal = document.getElementById('webinarModal');
            if (modal && modal.classList.contains('active')) {
                closeWebinarModal();
            }
            const stopnic = document.getElementById('stopnicWebinarModal');
            if (stopnic && stopnic.classList.contains('active')) {
                closeStopnicWebinarPopup();
            }
        }
    });
});

// ===== WELCOME FLOW =====
// Track if welcome check has already been performed to prevent duplicate checks
let welcomeCheckPerformed = false;

async function checkWelcomeStatus() {
    // Prevent duplicate checks
    if (welcomeCheckPerformed) {
        console.log('Welcome check already performed, skipping');
        return;
    }
    
    const user = getCurrentUser();
    if (!user || !user.userId) {
        console.log('No user found, skipping welcome check');
        return;
    }
    
    welcomeCheckPerformed = true;
    
    let welcomed = false;
    let checkedFromFirestore = false;
    
    // Try to get welcomed status from Firestore (source of truth)
    try {
        if (typeof db !== 'undefined' && db) {
            console.log('🔍 Checking welcome status in Firestore for user:', user.userId);
            const userDoc = await db.collection('users').doc(user.userId).get();
            
            if (userDoc.exists) {
                const userData = userDoc.data();
                // Check if welcomed field exists and is true
                // If field doesn't exist or is false, show welcome
                welcomed = userData.welcomed === true;
                checkedFromFirestore = true;
                console.log('📊 Firestore welcomed status:', welcomed);
            } else {
                // User document doesn't exist yet - show welcome
                console.log('⚠️ User document not found in Firestore, showing welcome');
                welcomed = false;
                checkedFromFirestore = true;
            }
        } else {
            console.log('⚠️ Firestore not available, skipping welcome check');
        }
    } catch (error) {
        console.error('❌ Error checking welcome status:', error);
        checkedFromFirestore = false;
    }

    if (!checkedFromFirestore) {
        console.warn('Welcome status not confirmed from Firestore; modal not shown');
        return;
    }

    // Only show welcome modal if user hasn't been welcomed yet
    if (!welcomed) {
        console.log('🎉 Showing welcome modal');
        showWelcomeModal();
    } else {
        console.log('✅ User already welcomed, not showing modal');
    }
}

function showWelcomeModal() {
    const modal = document.getElementById('welcomeModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Get user's first name
        const user = getCurrentUser();
        let firstName = '';
        if (user && user.name) {
            // Extract first name (first word before space)
            firstName = user.name.split(' ')[0];
        } else if (user && user.firstName) {
            firstName = user.firstName;
        }
        
        // Update welcome text with first name
        const welcomeTextEl = document.querySelector('#welcomeScreen0 .welcome-text');
        if (welcomeTextEl && firstName) {
            const firstParagraph = welcomeTextEl.querySelector('p:first-child');
            if (firstParagraph) {
                firstParagraph.innerHTML = `<strong>Spoštovana ${firstName}</strong>`;
            }
        }
        
        // Reset to screen 0 (welcome text)
        document.getElementById('welcomeScreen0').style.display = 'flex';
        document.getElementById('welcomeScreen1').style.display = 'none';
        
        // Scroll modal content to top
        const modalContent = document.querySelector('.welcome-modal-content');
        if (modalContent) {
            modalContent.scrollTop = 0;
        }
    }
}

// Make functions globally accessible
window.showWelcomeScreen1 = function() {
    document.getElementById('welcomeScreen0').style.display = 'none';
    document.getElementById('welcomeScreen1').style.display = 'flex';
    
    // Scroll modal content to top when switching screens
    const modalContent = document.querySelector('.welcome-modal-content');
    if (modalContent) {
        modalContent.scrollTop = 0;
    }
};

window.completeWelcome = async function() {
    const user = getCurrentUser();
    if (!user || !user.userId) return;
    
    try {
        // Update Firestore
        if (typeof db !== 'undefined') {
            await db.collection('users').doc(user.userId).update({
                welcomed: true
            });
        }
        
        // Close modal and go to profile → questionnaire tab
        const modal = document.getElementById('welcomeModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
        sessionStorage.setItem('openProfileTab', 'questionnaire');
        switchSection('profile');
    } catch (error) {
        console.error('Error updating welcome status:', error);
        const modal = document.getElementById('welcomeModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
        sessionStorage.setItem('openProfileTab', 'questionnaire');
        switchSection('profile');
    }
}

// ===== CALENDAR SECTION =====
let currentCalendarDate = new Date();

const CANONICAL_STOPNIC_ID = 'stopnic-webinar-2026';
const CANONICAL_POHOD_ID = 'pohod-100-zensk-trska-2026-05';
const CANONICAL_MOC_BESEDE_WEBINAR_ID = 'moc-besede-webinar-2026-04-14';
const LEGACY_POHOD_EVENT_ID = 'pohod-100-zensk-trska-2026';

function dashboardEventsToLocalDateString(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
}

function getCanonicalPohodEvent() {
    return {
        id: CANONICAL_POHOD_ID,
        title: 'Pohod 100 žensk na Trško goro',
        description: 'Vabim te, da se nam pridružiš na pohodu 100 žensk na Trško Goro. Zbor ob 8:00 v Sevnu ob vznožju Trške gore.\n\nTrška Gora je veliko več kot vinorodno področje – zelena oaza nad reko Krko, posejana z vinogradi in zidanicami, na vrhu pa Marijina cerkev in mogočne lipe. Spust v dolino bo lahkoten ob druženju; pohod vodi Marjanca Trščinar Antić.',
        date: new Date(2026, 4, 23, 8, 0).toISOString(),
        time: '08:00',
        type: 'real-life',
        location: 'Sevno – ob vznožju Trške gore (zbir ob 8:00)',
        externalUrl: '/pohod',
        externalLabel: 'Rezerviraj svoje mesto',
        image: 'images/pohod.webp',
        canonical: true
    };
}

function getCanonicalMocBesedeWebinarEvent() {
    return {
        id: CANONICAL_MOC_BESEDE_WEBINAR_ID,
        title: 'Webinar Moč besede',
        description: 'Ali verjameš, da naše misli in besede vplivajo na naša dejanja, naše počutje in naša čustva. Besede imajo moč, da spremenijo naše življenje in res ni vseeno katere beseda, kdaj in kako uporabljamo.\n\nVeliko lahko naredite že s pravo izbiro besed in prav o besedah se bomo pogovarjali na brezplačnem webinarju, na katerega vas vabim v torek, 14. aprila ob 20 uri.',
        date: new Date(2026, 3, 14, 20, 0).toISOString(),
        time: '20:00',
        type: 'webinar',
        location: '/?openWebinarSignup=1#aktualno',
        canonical: true
    };
}

/** Merge Firestore/local events with built-in calendar items so dashboard + koledar stay in sync. */
function mergeCanonicalEvents(events) {
    let list = Array.isArray(events) ? events.map(e => ({ ...e })) : [];

    list = list.filter(e => dashboardEventsToLocalDateString(new Date(e.date)) !== '2026-02-06');

    list = list.filter(e => !(
        (e.title === '25 Stopnic do sreče' || e.title === '25 Stopnic do srece')
        && e.date
        && (String(e.date).startsWith('2026-03-05') || (new Date(e.date).getMonth() === 2 && new Date(e.date).getDate() === 5))
    ));

    const hasStopnic = list.some(e =>
        (e.title === '25 Stopnic do sreče' || e.title === '25 Stopnic do srece')
        && e.date
        && (String(e.date).startsWith('2026-03-09') || (new Date(e.date).getMonth() === 2 && new Date(e.date).getDate() === 9))
    );
    if (!hasStopnic) {
        list.push({
            id: CANONICAL_STOPNIC_ID,
            title: '25 Stopnic do sreče',
            description: 'Brezplačni webinar 25 stopnic do sreče. Začetek ob 19:00. Povezava za Zoom bo dodana pravočasno.',
            date: '2026-03-09T10:00:00.000Z',
            time: '19:00',
            type: 'webinar',
            location: 'https://www.jazzenska.com/sreca',
            canonical: true
        });
    }

    // Remove zastarel 23. marec (zdaj je 23. maj); sicer bi ostal duplikat z napačnim dnem
    list = list.filter(e => {
        if (e.id === LEGACY_POHOD_EVENT_ID) return false;
        const t = String(e.title || '').toLowerCase();
        const ds = dashboardEventsToLocalDateString(new Date(e.date));
        if (t.includes('tršk') && ds === '2026-03-23') return false;
        return true;
    });

    const hasPohod = list.some(e =>
        e.id === CANONICAL_POHOD_ID
        || (e.title && String(e.title).toLowerCase().includes('tršk') && dashboardEventsToLocalDateString(new Date(e.date)) === '2026-05-23')
    );
    if (!hasPohod) {
        list.push(getCanonicalPohodEvent());
    }

    const hasMocBesedeWebinar = list.some(e =>
        e.id === CANONICAL_MOC_BESEDE_WEBINAR_ID
        || ((String(e.title || '').toLowerCase().includes('moč besede') || String(e.title || '').toLowerCase().includes('moc besede'))
            && dashboardEventsToLocalDateString(new Date(e.date)) === '2026-04-14')
    );
    if (!hasMocBesedeWebinar) {
        list.push(getCanonicalMocBesedeWebinarEvent());
    }

    return list;
}

async function loadCalendar() {
    const content = document.getElementById('calendarContent');
    let events = [];
    
    // Try to load from Firestore first
    try {
        if (typeof db !== 'undefined') {
            const eventsSnapshot = await db.collection('events')
                .orderBy('date', 'asc')
                .get();
            
            if (!eventsSnapshot.empty) {
                events = eventsSnapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        title: data.title,
                        description: data.description,
                        date: data.date ? (data.date.toDate ? data.date.toDate().toISOString() : data.date) : new Date().toISOString(),
                        time: data.time,
                        type: data.type,
                        location: data.location,
                        createdAt: data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate().toISOString() : data.createdAt) : new Date().toISOString()
                    };
                });
                
                // Update localStorage cache
                localStorage.setItem('events', JSON.stringify(events));
                console.log('Loaded events from Firestore');
            }
        }
    } catch (error) {
        console.error('Error loading events from Firestore:', error);
    }
    
    // Fallback to localStorage if Firestore failed or returned no events
    if (events.length === 0) {
        events = JSON.parse(localStorage.getItem('events') || '[]');
        console.log('Loaded events from localStorage');
    }

    events = mergeCanonicalEvents(events);

    let html = '';
    // Calendar header
    const monthNames = ['Januar', 'Februar', 'Marec', 'April', 'Maj', 'Junij', 'Julij', 'Avgust', 'September', 'Oktober', 'November', 'December'];
    html += `
        <div class="calendar-header">
            <div class="calendar-nav-group">
                <button class="calendar-nav-btn" onclick="changeCalendarMonth(-1)">←</button>
                <span class="calendar-nav-label">Prejšnji mesec</span>
            </div>
            <div class="calendar-month">${monthNames[currentCalendarDate.getMonth()]} ${currentCalendarDate.getFullYear()}</div>
            <div class="calendar-nav-group">
                <button class="calendar-nav-btn" onclick="changeCalendarMonth(1)">→</button>
                <span class="calendar-nav-label">Naslednji mesec</span>
            </div>
        </div>
        <div class="calendar-legend">
            <div class="legend-title">Legenda:</div>
            <div class="legend-items">
                <div class="legend-item">
                    <div class="legend-color" style="background: linear-gradient(135deg, #FFE5E5 0%, #FFD4D4 100%); border: 2px solid #FF6B6B;"></div>
                    <span>Dogodek v živo</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background: linear-gradient(135deg, #E5F3FF 0%, #D4EBFF 100%); border: 2px solid #4A90E2;"></div>
                    <span>Webinar</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background: linear-gradient(135deg, #E5FFE5 0%, #D4FFD4 100%); border: 2px solid #4CAF50;"></div>
                    <span>Zoom klic</span>
                </div>
            </div>
        </div>
    `;
    
    // Calendar grid
    const firstDay = new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth(), 1);
    const lastDay = new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    
    const dayNames = ['Ned', 'Pon', 'Tor', 'Sre', 'Čet', 'Pet', 'Sob'];
    
    html += '<div class="calendar-grid">';
    
    // Day headers
    dayNames.forEach(day => {
        html += `<div class="calendar-day-header">${day}</div>`;
    });
    
    // Calendar days (use local date string to avoid timezone shifting the day)
    function toLocalDateString(d) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return y + '-' + m + '-' + day;
    }
    const currentDate = new Date(startDate);
    for (let i = 0; i < 42; i++) {
        const dateStr = toLocalDateString(currentDate);
        const dayEvents = events.filter(e => {
            const ed = new Date(e.date);
            return toLocalDateString(ed) === dateStr;
        });
        
        const isToday = currentDate.toDateString() === new Date().toDateString();
        const isCurrentMonth = currentDate.getMonth() === currentCalendarDate.getMonth();
        
        // Determine background color based on event types
        let dayBackgroundColor = '';
        let dayBorderColor = '';
        if (dayEvents.length > 0) {
            const eventTypes = dayEvents.map(e => e.type);
            if (eventTypes.includes('real-life')) {
                dayBackgroundColor = 'background: linear-gradient(135deg, #FFE5E5 0%, #FFD4D4 100%);';
                dayBorderColor = 'border-color: #FF6B6B;';
            } else if (eventTypes.includes('webinar')) {
                dayBackgroundColor = 'background: linear-gradient(135deg, #E5F3FF 0%, #D4EBFF 100%);';
                dayBorderColor = 'border-color: #4A90E2;';
            } else if (eventTypes.includes('zoom')) {
                dayBackgroundColor = 'background: linear-gradient(135deg, #E5FFE5 0%, #D4FFD4 100%);';
                dayBorderColor = 'border-color: #4CAF50;';
            }
        }
        
        html += `
            <div class="calendar-day ${!isCurrentMonth ? 'other-month' : ''} ${isToday ? 'today' : ''}" onclick="showDayEvents('${dateStr}')" style="${dayBackgroundColor} ${dayBorderColor ? 'border: 2px solid; ' + dayBorderColor : ''}">
                <div class="day-number">${currentDate.getDate()}</div>
                ${dayEvents.length > 0 ? `
                    <div class="event-badges-container">
                        ${dayEvents.map((evt, idx) => {
                            let badgeColor = '';
                            if (evt.type === 'real-life') {
                                badgeColor = 'background: linear-gradient(135deg, #FF6B6B 0%, #FF5252 100%);';
                            } else if (evt.type === 'webinar') {
                                badgeColor = 'background: linear-gradient(135deg, #4A90E2 0%, #357ABD 100%);';
                            } else if (evt.type === 'zoom') {
                                badgeColor = 'background: linear-gradient(135deg, #4CAF50 0%, #45A049 100%);';
                            }
                            return `
                                <div class="event-badge-large" title="${evt.title}" style="${badgeColor}">
                                    <div class="event-badge-title">${evt.title.length > 12 ? evt.title.substring(0, 12) + '...' : evt.title}</div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                ` : ''}
            </div>
        `;
        
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    html += '</div></div>';
    
    // Event modal
    html += `
        <div id="eventModal" class="event-modal">
            <div class="event-modal-content">
                <button class="event-modal-close" onclick="closeEventModal()">&times;</button>
                <div id="eventModalContent"></div>
            </div>
        </div>
    `;
    
    content.innerHTML = html;
}

function changeCalendarMonth(direction) {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + direction);
    loadCalendar();
}

async function showDayEvents(dateStr, focusEventId) {
    let events = [];
    
    // Try to load from Firestore first
    try {
        if (typeof db !== 'undefined') {
            const eventsSnapshot = await db.collection('events')
                .orderBy('date', 'asc')
                .get();
            
            if (!eventsSnapshot.empty) {
                events = eventsSnapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        title: data.title,
                        description: data.description,
                        date: data.date ? (data.date.toDate ? data.date.toDate().toISOString() : data.date) : new Date().toISOString(),
                        time: data.time,
                        type: data.type,
                        location: data.location
                    };
                });
            }
        }
    } catch (error) {
        console.error('Error loading events from Firestore:', error);
    }
    
    // Fallback to localStorage
    if (events.length === 0) {
        events = JSON.parse(localStorage.getItem('events') || '[]');
    }

    events = mergeCanonicalEvents(events);
    
    function toLocalDateString(d) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return y + '-' + m + '-' + day;
    }
    
    let dayEvents = events.filter(e => {
        const ed = new Date(e.date);
        return toLocalDateString(ed) === dateStr;
    });

    if (focusEventId != null && focusEventId !== '') {
        const focused = dayEvents.filter(e => String(e.id) === String(focusEventId));
        if (focused.length) dayEvents = focused;
    }
    
    const modal = document.getElementById('eventModal');
    const modalContent = document.getElementById('eventModalContent');
    
    const [y, mo, da] = dateStr.split('-').map(Number);
    const modalDate = new Date(y, mo - 1, da);
    if (dayEvents.length === 0) {
        modalContent.innerHTML = `
            <h3 style="font-family: 'Playfair Display', serif; font-size: 24px; color: var(--dark-violet); margin-bottom: 20px;">
                ${modalDate.toLocaleDateString('sl-SI', { year: 'numeric', month: 'long', day: 'numeric' })}
            </h3>
            <p style="color: var(--text-light);">Na ta dan ni načrtovanih dogodkov.</p>
        `;
    } else {
        modalContent.innerHTML = `
            <h3 style="font-family: 'Playfair Display', serif; font-size: 24px; color: var(--dark-violet); margin-bottom: 20px;">
                ${modalDate.toLocaleDateString('sl-SI', { year: 'numeric', month: 'long', day: 'numeric' })}
            </h3>
            ${dayEvents.map(event => {
                const eventDate = new Date(event.date);
                const isStopnic = event.title === '25 Stopnic do sreče' || event.title === '25 Stopnic do srece';
                const now = new Date();
                const eventDateTime = new Date(eventDate);
                if (event && event.time && typeof event.time === 'string') {
                    const [hh, mm] = event.time.split(':').map(n => parseInt(n, 10));
                    if (!Number.isNaN(hh)) {
                        eventDateTime.setHours(hh, Number.isNaN(mm) ? 0 : mm, 0, 0);
                    }
                }
                const isPast = eventDateTime < now;
                const actionLabel = (isStopnic && isPast) ? 'Ogled replaya' : 'Pridruži se';
                const stopnicReplayHref = getStopnicWebinarReplayUrl();
                const webinarActionHref = isStopnic
                    ? (isPast ? stopnicReplayHref : ensureAbsoluteUrl(event.location))
                    : ensureAbsoluteUrl(event.location);
                let eventImage = '';
                if (isStopnic) {
                    eventImage = '<img src="images/aktualen dogodek 2.webp" alt="25 Stopnic do sreče" style="width: 100%; max-height: 220px; object-fit: cover; border-radius: 12px 12px 0 0; margin: -20px -20px 16px -20px; display: block;">';
                } else if (event.image) {
                    eventImage = `<img src="${event.image}" alt="" style="width: 100%; max-height: 220px; object-fit: cover; border-radius: 12px 12px 0 0; margin: -20px -20px 16px -20px; display: block;">`;
                }
                const safeExtUrl = event.externalUrl ? String(event.externalUrl).replace(/"/g, '') : '';
                const isFocused = focusEventId != null && focusEventId !== '' && String(event.id) === String(focusEventId);
                return `
                    <div ${isFocused ? 'id="calendar-event-focus"' : ''} style="
                        background: var(--main-white);
                        padding: 20px;
                        border-radius: 15px;
                        margin-bottom: 15px;
                        border-left: 4px solid var(--mid-violet);
                        overflow: hidden;
                    ">
                        ${eventImage}
                        <h4 style="font-family: 'Playfair Display', serif; font-size: 20px; color: var(--dark-violet); margin-bottom: 10px;">${escapeHtml(event.title || '')}</h4>
                        <p style="color: var(--text-dark); line-height: 1.6; margin-bottom: 10px; white-space: pre-wrap;">${escapeHtml(event.description || '')}</p>
                        <div style="margin-bottom: 10px;">
                            ${event.type === 'real-life' ? '<span style="background: var(--main-white); padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; color: var(--dark-violet);">Dogodek v živo</span>' : ''}
                            ${event.type === 'webinar' ? '<span style="background: var(--main-white); padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; color: var(--dark-violet);">Webinar</span>' : ''}
                            ${event.type === 'zoom' ? '<span style="background: var(--main-white); padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; color: var(--dark-violet);">Zoom klic</span>' : ''}
                        </div>
                        <div style="font-size: 14px; color: var(--text-light); margin-bottom: 12px;">
                            ${event.time ? `<div style="margin-bottom: 4px;">🕐 ${escapeHtml(event.time)}</div>` : ''}
                            <div>📅 ${eventDate.toLocaleDateString('sl-SI', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                        </div>
                        ${event.type === 'real-life' && event.location ? `<div style="font-size: 14px; color: var(--text-light); margin-bottom: 12px;">📍 ${escapeHtml(event.location)}</div>` : ''}
                        ${safeExtUrl ? `
                        <div style="margin-top: 12px;">
                            <a href="${safeExtUrl}" style="
                                background: linear-gradient(135deg, var(--mid-violet) 0%, var(--dark-violet) 100%);
                                color: var(--white);
                                padding: 10px 24px;
                                border-radius: 20px;
                                font-size: 14px;
                                font-weight: 600;
                                text-decoration: none;
                                display: inline-block;
                                transition: all 0.3s ease;
                                box-shadow: 0 2px 8px rgba(100, 56, 67, 0.3);
                            " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(100, 56, 67, 0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(100, 56, 67, 0.3)'">${escapeHtml(event.externalLabel || 'Odpri')}</a>
                        </div>
                        ` : ''}
                        ${event.type === 'webinar' || event.type === 'zoom' ? `
                        <div style="margin-top: 12px;">
                            <a href="${webinarActionHref}" ${isStopnic && isPast ? '' : 'target="_blank" rel="noopener noreferrer"'} style="
                                background: linear-gradient(135deg, var(--mid-violet) 0%, var(--dark-violet) 100%);
                                color: var(--white);
                                padding: 10px 24px;
                                border-radius: 20px;
                                font-size: 14px;
                                font-weight: 600;
                                text-decoration: none;
                                display: inline-block;
                                transition: all 0.3s ease;
                                box-shadow: 0 2px 8px rgba(100, 56, 67, 0.3);
                            " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(100, 56, 67, 0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(100, 56, 67, 0.3)'">${actionLabel}</a>
                        </div>
                        ` : ''}
                    </div>
                `;
            }).join('')}
        `;
    }
    
    modal.classList.add('show');

    if (focusEventId != null && focusEventId !== '') {
        requestAnimationFrame(() => {
            const el = document.getElementById('calendar-event-focus');
            if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        });
    }
}

function closeEventModal() {
    const el = document.getElementById('eventModal');
    if (el) el.classList.remove('show');
}

// Close modal when clicking outside
document.addEventListener('click', function(e) {
    const eventModal = document.getElementById('addEventModal');
    if (eventModal && e.target === eventModal) {
        closeAddEventModal();
    }
    
    const eventDetailModal = document.getElementById('eventModal');
    if (eventDetailModal && e.target === eventDetailModal) {
        closeEventModal();
    }
    
    const allEventsModal = document.getElementById('allEventsModal');
    if (allEventsModal && e.target === allEventsModal) {
        closeAllEventsModal();
    }

    const fullCalendarModal = document.getElementById('fullCalendarModal');
    if (fullCalendarModal && e.target === fullCalendarModal) {
        closeFullCalendarModal();
    }
    
});

function showAddEventModal() {
    // Clear any editing state
    document.getElementById('addEventModal').removeAttribute('data-editing-id');
    document.querySelector('#addEventModal .modal-title').textContent = 'Nov dogodek';
    
    document.getElementById('addEventModal').classList.add('show');
    document.getElementById('eventTitle').value = '';
    document.getElementById('eventDescription').value = '';
    document.getElementById('eventDate').value = '';
    document.getElementById('eventTime').value = '18:00';
    document.getElementById('eventType').value = '';
    document.getElementById('eventLocation').value = '';
    document.getElementById('eventLocationGroup').style.display = 'none';
}

function closeAddEventModal() {
    document.getElementById('addEventModal').classList.remove('show');
    document.getElementById('eventType').value = '';
    document.getElementById('eventLocationGroup').style.display = 'none';
    // Clear editing state
    document.getElementById('addEventModal').removeAttribute('data-editing-id');
    document.querySelector('#addEventModal .modal-title').textContent = 'Nov dogodek';
}

function toggleEventLocationField() {
    const eventType = document.getElementById('eventType').value;
    const locationGroup = document.getElementById('eventLocationGroup');
    const locationLabel = document.getElementById('eventLocationLabel');
    const locationInput = document.getElementById('eventLocation');
    
    if (eventType === 'real-life') {
        locationGroup.style.display = 'block';
        locationLabel.textContent = 'Naslov lokacije';
        locationInput.placeholder = 'Vnesite naslov lokacije';
        locationInput.required = true;
    } else if (eventType === 'webinar' || eventType === 'zoom') {
        locationGroup.style.display = 'block';
        locationLabel.textContent = eventType === 'webinar' ? 'Povezava do webinara' : 'Zoom povezava';
        locationInput.placeholder = eventType === 'webinar' ? 'Vnesite povezavo do webinara' : 'Vnesite Zoom povezavo';
        locationInput.required = true;
    } else {
        locationGroup.style.display = 'none';
        locationInput.required = false;
    }
}

async function submitEvent(event) {
    event.preventDefault();
    
    const title = document.getElementById('eventTitle').value.trim();
    const description = document.getElementById('eventDescription').value.trim();
    const date = document.getElementById('eventDate').value;
    const time = document.getElementById('eventTime').value;
    const eventType = document.getElementById('eventType').value;
    const location = document.getElementById('eventLocation').value.trim();
    const editingId = document.getElementById('addEventModal').getAttribute('data-editing-id');
    
    if (!title || !date || !time || !eventType) {
        alert('Prosimo, izpolnite vsa obvezna polja.');
        return;
    }
    
    if ((eventType === 'real-life' || eventType === 'webinar' || eventType === 'zoom') && !location) {
        alert('Prosimo, vnesite lokacijo ali povezavo.');
        return;
    }
    
    const eventDate = new Date(date + 'T' + time);
    
    try {
        if (editingId) {
            // Update existing event in Firestore
            if (typeof db !== 'undefined') {
                await db.collection('events').doc(editingId).update({
                    title: title,
                    description: description,
                    date: firebase.firestore.Timestamp.fromDate(eventDate),
                    time: time,
                    type: eventType,
                    location: location,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                console.log('Event updated in Firestore:', editingId);
            }
            
            // Also update localStorage cache
            const events = JSON.parse(localStorage.getItem('events') || '[]');
            const eventIndex = events.findIndex(e => e.id === editingId);
            if (eventIndex !== -1) {
                events[eventIndex] = {
                    ...events[eventIndex],
                    title: title,
                    description: description,
                    date: eventDate.toISOString(),
                    time: time,
                    type: eventType,
                    location: location
                };
                localStorage.setItem('events', JSON.stringify(events));
            }
            
            // Clear editing ID
            document.getElementById('addEventModal').removeAttribute('data-editing-id');
            document.querySelector('#addEventModal .modal-title').textContent = 'Nov dogodek';
        } else {
            // Add new event to Firestore
            const newEvent = {
                title: title,
                description: description,
                date: firebase.firestore.Timestamp.fromDate(eventDate),
                time: time,
                type: eventType,
                location: location,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            if (typeof db !== 'undefined') {
                const docRef = await db.collection('events').add(newEvent);
                console.log('Event saved to Firestore with ID:', docRef.id);
                
                // Also update localStorage cache
                const events = JSON.parse(localStorage.getItem('events') || '[]');
                events.push({
                    ...newEvent,
                    id: docRef.id,
                    date: eventDate.toISOString(),
                    createdAt: new Date().toISOString()
                });
                localStorage.setItem('events', JSON.stringify(events));
            } else {
                // Fallback to localStorage if Firestore not available
                const events = JSON.parse(localStorage.getItem('events') || '[]');
                const eventWithId = {
                    ...newEvent,
                    id: Date.now().toString(),
                    date: eventDate.toISOString(),
                    createdAt: new Date().toISOString()
                };
                events.push(eventWithId);
                localStorage.setItem('events', JSON.stringify(events));
                console.warn('Firestore not available, saved to localStorage');
            }
        }
        
        closeAddEventModal();
        loadCalendar();
    } catch (error) {
        console.error('Error saving event:', error);
        alert('Napaka pri shranjevanju dogodka. Prosimo, poskusite znova.');
    }
}

async function showAllEventsModal() {
    let events = [];
    
    // Try to load from Firestore first
    try {
        if (typeof db !== 'undefined') {
            const eventsSnapshot = await db.collection('events')
                .orderBy('date', 'asc')
                .get();
            
            if (!eventsSnapshot.empty) {
                events = eventsSnapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        title: data.title,
                        description: data.description,
                        date: data.date ? (data.date.toDate ? data.date.toDate().toISOString() : data.date) : new Date().toISOString(),
                        time: data.time,
                        type: data.type,
                        location: data.location
                    };
                });
            }
        }
    } catch (error) {
        console.error('Error loading events from Firestore:', error);
    }
    
    // Fallback to localStorage
    if (events.length === 0) {
        events = JSON.parse(localStorage.getItem('events') || '[]');
    }

    events = mergeCanonicalEvents(events);
    
    const eventsList = document.getElementById('allEventsList');
    
    if (events.length === 0) {
        eventsList.innerHTML = '<p style="color: var(--text-light); text-align: center; padding: 40px;">Ni dogodkov.</p>';
    } else {
        eventsList.innerHTML = events.sort((a, b) => new Date(a.date) - new Date(b.date)).map(event => {
            const eventDate = new Date(event.date);
            const typeLabels = {
                'real-life': 'Dogodek v živo',
                'webinar': 'Webinar',
                'zoom': 'Zoom klic'
            };
            const typeColors = {
                'real-life': '#FF6B6B',
                'webinar': '#4A90E2',
                'zoom': '#4CAF50'
            };
            
            return `
                <div style="
                    background: var(--main-white);
                    padding: 25px;
                    border-radius: 15px;
                    margin-bottom: 20px;
                    border-left: 4px solid ${typeColors[event.type] || 'var(--mid-violet)'};
                ">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
                        <div style="flex: 1;">
                            <h3 style="font-family: 'Playfair Display', serif; font-size: 22px; color: var(--dark-violet); margin-bottom: 10px;">${event.title}</h3>
                            <div style="margin-bottom: 10px;">
                                <span style="background: ${typeColors[event.type] || 'var(--mid-violet)'}; color: var(--white); padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">${typeLabels[event.type] || 'Dogodek'}</span>
                            </div>
                            <p style="color: var(--text-dark); line-height: 1.6; margin-bottom: 15px; white-space: pre-wrap;">${event.description || 'Brez opisa'}</p>
                            <div style="display: flex; gap: 20px; font-size: 14px; color: var(--text-light); margin-bottom: 15px; flex-wrap: wrap;">
                                <span>📅 ${eventDate.toLocaleDateString('sl-SI', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                <span>🕐 ${event.time}</span>
                                ${event.type === 'real-life' ? `<span>📍 ${event.location}</span>` : ''}
                                ${event.type === 'webinar' || event.type === 'zoom' ? `<span>🔗 <a href="${ensureAbsoluteUrl(event.location)}" target="_blank" rel="noopener noreferrer" style="color: var(--mid-violet); text-decoration: none;">Povezava</a></span>` : ''}
                            </div>
                        </div>
                    </div>
                    <div style="display: flex; gap: 10px; justify-content: flex-end;">
                        ${event.canonical ? `
                            <span style="font-size: 13px; color: var(--text-light); padding: 8px 12px;">Fiksni dogodek (uredi v kodi)</span>
                        ` : `
                        <button onclick="editEvent('${event.id}')" style="
                            background: var(--main-white);
                            color: var(--dark-violet);
                            padding: 8px 20px;
                            border: 2px solid var(--mid-violet);
                            border-radius: 20px;
                            font-size: 14px;
                            font-weight: 600;
                            cursor: pointer;
                            transition: all 0.3s ease;
                        ">✏️ Uredi</button>
                        <button onclick="deleteEvent('${event.id}')" style="
                            background: #fee;
                            color: #c33;
                            padding: 8px 20px;
                            border: 2px solid #c33;
                            border-radius: 20px;
                            font-size: 14px;
                            font-weight: 600;
                            cursor: pointer;
                            transition: all 0.3s ease;
                        ">🗑️ Izbriši</button>
                        `}
                    </div>
                </div>
            `;
        }).join('');
    }
    
    document.getElementById('allEventsModal').classList.add('show');
}

function closeAllEventsModal() {
    document.getElementById('allEventsModal').classList.remove('show');
}

async function editEvent(eventId) {
    let event = null;
    
    // Try to load from Firestore first
    try {
        if (typeof db !== 'undefined') {
            const eventDoc = await db.collection('events').doc(eventId).get();
            if (eventDoc.exists) {
                const data = eventDoc.data();
                event = {
                    id: eventDoc.id,
                    title: data.title,
                    description: data.description,
                    date: data.date ? (data.date.toDate ? data.date.toDate().toISOString() : data.date) : new Date().toISOString(),
                    time: data.time,
                    type: data.type,
                    location: data.location
                };
            }
        }
    } catch (error) {
        console.error('Error loading event from Firestore:', error);
    }
    
    // Fallback to localStorage
    if (!event) {
        const events = JSON.parse(localStorage.getItem('events') || '[]');
        event = events.find(e => e.id === eventId);
    }
    
    if (!event) return;
    
    // Close all events modal
    closeAllEventsModal();
    
    // Populate add event modal with event data
    const eventDate = new Date(event.date);
    document.getElementById('eventTitle').value = event.title;
    document.getElementById('eventDescription').value = event.description || '';
    document.getElementById('eventDate').value = eventDate.toISOString().split('T')[0];
    document.getElementById('eventTime').value = event.time;
    document.getElementById('eventType').value = event.type || '';
    document.getElementById('eventLocation').value = event.location || '';
    
    // Show location field if type is set
    if (event.type) {
        toggleEventLocationField();
    }
    
    // Store event ID for update
    document.getElementById('addEventModal').setAttribute('data-editing-id', eventId);
    document.querySelector('#addEventModal .modal-title').textContent = 'Uredi dogodek';
    
    // Show add event modal
    document.getElementById('addEventModal').classList.add('show');
}

async function deleteEvent(eventId) {
    if (!confirm('Ali ste prepričani, da želite izbrisati ta dogodek?')) {
        return;
    }
    
    try {
        // Delete from Firestore
        if (typeof db !== 'undefined') {
            await db.collection('events').doc(eventId).delete();
            console.log('Event deleted from Firestore:', eventId);
        }
        
        // Also update localStorage cache
        const events = JSON.parse(localStorage.getItem('events') || '[]');
        const filteredEvents = events.filter(e => e.id !== eventId);
        localStorage.setItem('events', JSON.stringify(filteredEvents));
        
        // Reload calendar and close modal
        loadCalendar();
        closeAllEventsModal();
    } catch (error) {
        console.error('Error deleting event:', error);
        alert('Napaka pri brisanju dogodka. Prosimo, poskusite znova.');
    }
}

// ===== PROFILE SECTION =====
async function loadProfile() {
    const user = getCurrentUser();
    if (!user) return;
    
    const content = document.getElementById('profileContent');
    if (!content) return;

    const titleEl = document.querySelector('#profile h2');
    if (titleEl) {
        const titleMap = {
            'active-work': 'Aktivno delo',
            'courses-webinars': 'Tečaji in webinarji',
            'extra-offer': 'Dodatna ponudba',
            'life-wheel': 'Kolo življenja',
            profil: 'Nastavitve'
        };
        titleEl.textContent = titleMap[currentSidebarTab] || 'Spletna učilnica';
    }

    if (currentSidebarTab === 'active-work') {
        renderActiveWork(content);
        return;
    }
    if (currentSidebarTab === 'courses-webinars') {
        await loadCoursesAndWebinars(content);
        return;
    }
    if (currentSidebarTab === 'questionnaire') {
        loadQuestionnaire(content);
        return;
    }
    if (currentSidebarTab === 'life-wheel') {
        await loadLifeWheel(content);
        return;
    }
    if (currentSidebarTab === 'extra-offer') {
        renderExtraOffer(content);
        return;
    }
    if (currentSidebarTab === 'profil') {
        renderProfileForm(content);
        return;
    }
    renderActiveWork(content);
}

function renderActiveWork(container) {
    if (!container) return;
    const user = getCurrentUser() || {};
    const isGuest = user.role === 'guest';
    ensureGuestLockedVisualOverrides();
    container.innerHTML = `
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap:16px;">
            <div class="guest-locked-block ${isGuest ? 'guest-locked-muted' : ''}" style="margin:0; border-top:4px solid ${isGuest ? '#c3c3c3' : '#d4af37'};">
                <div class="guest-locked-inner">
                    <h3 class="guest-locked-title">Vprašalnik</h3>
                    <p class="guest-locked-lead">Odpri vprašalnik in spremljaj svoj napredek skozi delo na sebi.</p>
                    <div class="guest-locked-buttons">
                        <button type="button" class="guest-locked-btn guest-locked-btn-primary ${isGuest ? 'guest-locked-btn-disabled' : ''}" onclick="${isGuest ? 'showGuestJoinPopup()' : `openSidebarTab('questionnaire')`}">Odpri vprašalnik</button>
                    </div>
                </div>
            </div>
            <div class="guest-locked-block ${isGuest ? 'guest-locked-muted' : ''}" style="margin:0; border-top:4px solid ${isGuest ? '#c3c3c3' : '#d4af37'};">
                <div class="guest-locked-inner">
                    <h3 class="guest-locked-title">Kolo življenja</h3>
                    <p class="guest-locked-lead">Oceni 8 področij življenja in shrani svoj trenutni vpogled.</p>
                    <div class="guest-locked-buttons">
                        <button type="button" class="guest-locked-btn guest-locked-btn-primary ${isGuest ? 'guest-locked-btn-disabled' : ''}" onclick="${isGuest ? 'showGuestJoinPopup()' : `openSidebarTab('life-wheel')`}">Odpri kolo življenja</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

async function loadLifeWheel(container) {
    const user = getCurrentUser();
    if (!user) return;
    const content = container || document.getElementById('profileContent');
    if (!content) return;

    content.innerHTML = `
        <div class="life-wheel-wrap">
            <h3 class="life-wheel-title">Kolo življenja</h3>
            <div class="life-wheel-intro">
                <p class="life-wheel-intro-lead">KOLO ŽIVLJENJA Jaz ženska</p>
                <p>Kolo življenja je preprosto, a zelo učinkovito orodje za osebni razvoj, s katerim oceniš, kako uravnoteženo je tvoje življenje na različnih področjih.</p>
                <p>Vabim te, da se umiriš, sprostiš, globoko vdihneš in izdihneš in nato narišeš svoje kolo življenja.</p>
                <p>Vsako področje označi od 1 do 10, odvisno od tega, kako ocenjuješ svoje stanje na določenem področju. Si zadovoljna, bi kaj spremenila, meniš, da je še prostora za tvojo rast, imaš izzive in težave na tem področju … Postavi si čim več vprašanj, iskreno prisluhni svojemu občutku in označi v krogu, kje se trenutno nahajaš. Vse je prav in v redu. Kolo življenja izpolnjujemo, da vidimo kje smo, kako je naše življenje usklajeno in kje so priložnosti za rast in spremembo. Pokaže nam, kje se trenutno nahajamo in nam pomaga videti širšo sliko našega življenja.</p>
                <p>Sproščeno, lahkotno, iskreno izpolni svoje kolo življenja in poglej, kje je največje neskladje, kje so še priložnosti za rast, kaj bi želela spremeniti. Zapiši si misli, ki se ti ob tem porajajo; piši vse, brez da vključiš um, samo tisto, kar se v tebi poraja, brez razmišljanja in analiziranja.</p>
                <p>Shrani svoj zapis in ga imej pri sebi na našem srečanju v živo, ki ga bomo imele v sredo, 8. aprila ob 20. uri zvečer preko Zooma. Povabilo na Zoom boš pravočasno prejela preko e-maila.</p>
            </div>
            <div class="life-wheel-sub">Oceni 8 področij in shrani svoj rezultat.</div>
            <h4 class="life-wheel-current" id="lifeWheelCurrentArea">ZDRAVJE</h4>
            <div class="life-wheel-hint" id="lifeWheelSubtitle">Kako bi ocenila to področje?</div>
            <div class="life-wheel-nav" id="lifeWheelNav">
                <button type="button" class="life-wheel-back" id="lifeWheelBackBtn" onclick="lifeWheelBack()" aria-label="Nazaj na prejšnje področje">← Nazaj</button>
                <button type="button" class="life-wheel-skip" id="lifeWheelSkipBtn" onclick="lifeWheelSkip()">Naprej</button>
            </div>
            <div class="life-wheel-numbers" id="lifeWheelNumbers"></div>
            <div id="lifeWheelCapture" class="life-wheel-canvas-wrap">
                <canvas id="lifeWheelCanvas" class="life-wheel-canvas" width="430" height="430"></canvas>
            </div>
            <div class="life-wheel-actions" id="lifeWheelActions">
                <button type="button" onclick="lifeWheelSavePDF()">Shrani kot PDF</button>
                <button type="button" onclick="lifeWheelDownloadImage()">Prenesi sliko</button>
                <button type="button" onclick="lifeWheelReset()">Naredi znova</button>
            </div>
        </div>
    `;

    const areas = ['Zdravje', 'Kariera', 'Ljubezen', 'Duhovnost', 'Družina', 'Denar', 'Zabava', 'Prijatelji'];
    const colors = ['#ff9aa2', '#ffb7b2', '#ffdac1', '#e2f0cb', '#b5ead7', '#c7ceea', '#f6c1ff', '#ffd6e0'];

    let savedScores = [];
    try {
        if (typeof db !== 'undefined' && user.userId) {
            const userDoc = await db.collection('users').doc(user.userId).get();
            if (userDoc.exists) {
                const data = userDoc.data() || {};
                const fromDb = data.lifeWheelScores;
                if (Array.isArray(fromDb) && fromDb.length === areas.length) {
                    savedScores = fromDb.map(v => Number(v) || 0);
                }
            }
        }
    } catch (e) {
        console.error('Error loading life wheel scores:', e);
    }

    const scores = Array.isArray(savedScores) && savedScores.length === areas.length ? [...savedScores] : new Array(areas.length).fill(0);

    function allScoresFilled() {
        return scores.every(v => v >= 1 && v <= 10);
    }

    function nextUnfilledFrom(cur) {
        for (let i = cur + 1; i < areas.length; i++) {
            if (!scores[i] || scores[i] < 1) return i;
        }
        for (let i = 0; i < cur; i++) {
            if (!scores[i] || scores[i] < 1) return i;
        }
        return null;
    }

    let currentIndex;
    let history = [];
    if (allScoresFilled()) {
        currentIndex = areas.length;
    } else {
        currentIndex = scores.findIndex(v => !v || v < 1);
        for (let i = 0; i <= currentIndex; i++) history.push(i);
    }

    const canvas = document.getElementById('lifeWheelCanvas');
    const numbersDiv = document.getElementById('lifeWheelNumbers');
    const currentAreaEl = document.getElementById('lifeWheelCurrentArea');
    const subtitleEl = document.getElementById('lifeWheelSubtitle');
    const actionsEl = document.getElementById('lifeWheelActions');
    const navEl = document.getElementById('lifeWheelNav');
    const backBtn = document.getElementById('lifeWheelBackBtn');
    const skipBtn = document.getElementById('lifeWheelSkipBtn');
    if (!canvas || !numbersDiv || !currentAreaEl || !subtitleEl || !actionsEl) return;

    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const maxRadius = 165;

    function labelHighlightIndex(animatedIndex = null) {
        if (currentIndex >= areas.length) return -1;
        if (animatedIndex !== null && animatedIndex !== undefined) return animatedIndex;
        return currentIndex;
    }

    function drawWheel(animatedIndex = null, progress = 1) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const angleStep = (2 * Math.PI) / areas.length;
        const hi = labelHighlightIndex(animatedIndex);
        for (let i = 1; i <= 10; i++) {
            ctx.beginPath();
            ctx.arc(centerX, centerY, (i / 10) * maxRadius, 0, 2 * Math.PI);
            ctx.strokeStyle = '#eee';
            ctx.stroke();
        }
        for (let i = 0; i < areas.length; i++) {
            const angle = i * angleStep - Math.PI / 2;
            const x = centerX + Math.cos(angle) * maxRadius;
            const y = centerY + Math.sin(angle) * maxRadius;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(x, y);
            ctx.strokeStyle = '#ddd';
            ctx.stroke();
        }
        areas.forEach((area, i) => {
            const startAngle = i * angleStep - Math.PI / 2;
            const endAngle = startAngle + angleStep;
            let value = scores[i] || 0;
            if (i === animatedIndex) value *= progress;
            const radius = (value / 10) * maxRadius;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.closePath();
            ctx.fillStyle = colors[i];
            ctx.globalAlpha = 0.9;
            ctx.fill();
            ctx.globalAlpha = 1;
            const midAngle = startAngle + angleStep / 2;
            const labelRadius = maxRadius + 20;
            const x = centerX + Math.cos(midAngle) * labelRadius;
            const y = centerY + Math.sin(midAngle) * labelRadius;
            ctx.font = 'bold 13px Montserrat, sans-serif';
            ctx.textAlign = 'center';
            if (i === hi) {
                ctx.lineJoin = 'round';
                ctx.miterLimit = 2;
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 2.5;
                ctx.strokeText(area, x, y);
                ctx.fillStyle = colors[i];
                ctx.fillText(area, x, y);
            } else {
                ctx.fillStyle = '#333';
                ctx.fillText(area, x, y);
            }
        });
    }

    async function persistScores() {
        try {
            if (typeof db !== 'undefined' && user.userId) {
                await db.collection('users').doc(user.userId).set({
                    lifeWheelScores: scores,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
            }
        } catch (e) {
            console.error('Error saving life wheel scores:', e);
        }
    }

    function animateSlice(index, onComplete) {
        let start = 0;
        const duration = 400;
        function animate(timestamp) {
            if (!start) start = timestamp;
            const progress = Math.min((timestamp - start) / duration, 1);
            drawWheel(index, progress);
            if (progress < 1) requestAnimationFrame(animate);
            else if (typeof onComplete === 'function') onComplete();
            else drawWheel();
        }
        requestAnimationFrame(animate);
    }

    function finish() {
        numbersDiv.style.display = 'none';
        if (navEl) navEl.style.display = 'none';
        currentAreaEl.textContent = 'Tvoje kolo življenja je pripravljeno!';
        subtitleEl.textContent = 'Lahko shraniš sliko ali narediš kolo znova.';
        actionsEl.style.display = 'flex';
        drawWheel();
    }

    function updateUI() {
        if (currentIndex >= areas.length) {
            finish();
            return;
        }
        currentAreaEl.textContent = (areas[currentIndex] || '').toUpperCase();
        if (backBtn) backBtn.disabled = history.length <= 1;
        if (skipBtn) skipBtn.disabled = nextUnfilledFrom(currentIndex) === null;
    }

    window.lifeWheelSelectScore = async function(value) {
        if (currentIndex >= areas.length) return;
        scores[currentIndex] = value;
        const answeredIdx = currentIndex;
        await persistScores();
        animateSlice(answeredIdx, () => {
            const next = nextUnfilledFrom(answeredIdx);
            if (next === null) {
                currentIndex = areas.length;
                history = [];
            } else {
                currentIndex = next;
                history.push(next);
            }
            updateUI();
            if (currentIndex < areas.length) drawWheel();
        });
    };

    window.lifeWheelBack = async function() {
        if (currentIndex >= areas.length || history.length <= 1) return;
        history.pop();
        currentIndex = history[history.length - 1];
        scores[currentIndex] = 0;
        await persistScores();
        drawWheel();
        updateUI();
    };

    window.lifeWheelSkip = async function() {
        if (currentIndex >= areas.length) return;
        const next = nextUnfilledFrom(currentIndex);
        if (next === null) return;
        currentIndex = next;
        history.push(next);
        await persistScores();
        drawWheel();
        updateUI();
    };

    window.lifeWheelReset = async function() {
        for (let i = 0; i < scores.length; i++) scores[i] = 0;
        currentIndex = 0;
        history = [0];
        numbersDiv.style.display = 'flex';
        if (navEl) navEl.style.display = 'flex';
        actionsEl.style.display = 'none';
        subtitleEl.textContent = 'Kako bi ocenila to področje?';
        await persistScores();
        updateUI();
        drawWheel();
    };

    window.lifeWheelSavePDF = function() {
        const wheelCanvas = document.getElementById('lifeWheelCanvas');
        const JsPDF = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
        if (!wheelCanvas) {
            return;
        }
        if (typeof JsPDF !== 'function') {
            window.alert('Knjižnica za PDF se ni naložila. Osveži stran in poskusi znova.');
            return;
        }
        try {
            const imgData = wheelCanvas.toDataURL('image/png');
            const pdf = new JsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
            const pageW = pdf.internal.pageSize.getWidth();
            const pageH = pdf.internal.pageSize.getHeight();
            const margin = 18;
            const maxW = pageW - 2 * margin;
            const maxH = pageH - 2 * margin;
            let imgW = wheelCanvas.width;
            let imgH = wheelCanvas.height;
            try {
                const props = pdf.getImageProperties(imgData);
                if (props && props.width && props.height) {
                    imgW = props.width;
                    imgH = props.height;
                }
            } catch (e) { /* use canvas dimensions */ }
            const scale = Math.min(maxW / imgW, maxH / imgH);
            const dispW = imgW * scale;
            const dispH = imgH * scale;
            const x = (pageW - dispW) / 2;
            const y = (pageH - dispH) / 2;
            pdf.addImage(imgData, 'PNG', x, y, dispW, dispH);
            pdf.save('kolo-zivljenja.pdf');
        } catch (err) {
            console.error('lifeWheelSavePDF:', err);
            window.alert('PDF se ni uspelo ustvariti. Poskusi znova ali uporabi »Prenesi sliko«.');
        }
    };

    window.lifeWheelDownloadImage = function() {
        const capture = document.getElementById('lifeWheelCapture');
        if (!capture || typeof html2canvas === 'undefined') return;
        html2canvas(capture).then(c => {
            const link = document.createElement('a');
            link.download = 'kolo-zivljenja.png';
            link.href = c.toDataURL();
            link.click();
        });
    };

    numbersDiv.innerHTML = '';
    for (let i = 1; i <= 10; i++) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = String(i);
        btn.onclick = () => window.lifeWheelSelectScore(i);
        numbersDiv.appendChild(btn);
    }
    drawWheel();
    updateUI();
}

async function loadCoursesAndWebinars(container) {
    if (!container) return;
    ensureGuestLockedVisualOverrides();
    await loadClassroom(container);
    let webinars = JSON.parse(localStorage.getItem('webinars') || '[]') || [];
    webinars = applyStopnicWebinarDefaults(webinars);
    localStorage.setItem('webinars', JSON.stringify(webinars));
    const user = getCurrentUser() || {};
    const role = user.role || 'member';
    const hasAccess = role !== 'guest';

    let webinarsHtml = `
        <div style="margin-top:24px;">
            <h3 class="extra-offer-subtitle">Webinarji</h3>
            <div class="extra-offer-webinars-stack">
    `;
    if (!webinars.length) {
        webinarsHtml += `<p style="color:var(--text-light);margin:0;">Ni webinarjev</p>`;
    } else {
        webinarsHtml += webinars.map(w => {
            const isStopnic = String(w.title || '').toLowerCase().includes('stopnic');
            const cardImage = isStopnic ? 'images/aktualen dogodek 2.webp' : 'images/moja moc je v meni.webp';
            const wid = encodeURIComponent(String(w.id));
            const href = hasAccess ? `/course?webinar=${wid}` : '#';
            const lockedClass = hasAccess ? '' : ' locked';
            return `
                <div class="extra-offer-image-row">
                    <a href="${href}" class="extra-offer-image-link${lockedClass}" ${hasAccess ? '' : 'onclick="event.preventDefault(); showGuestJoinPopup();"'}>
                        <img src="${cardImage}" alt="${escapeHtml(w.title || 'Webinar')}">
                    </a>
                </div>
            `;
        }).join('');
    }
    webinarsHtml += `</div></div>`;
    container.innerHTML += webinarsHtml;
}

function renderExtraOffer(container) {
    if (!container) return;
    container.innerHTML = `
        <h3 class="extra-offer-subtitle">Pohodi</h3>
        <div class="extra-offer-image-row">
            <a href="/pohod" class="extra-offer-image-link">
                <img src="images/pohod.webp" alt="100 žensk na Trško goro">
            </a>
        </div>
    `;
}

window.openSidebarTab = function(tab) {
    const user = getCurrentUser() || {};
    if (user.role === 'guest' && (tab === 'questionnaire' || tab === 'life-wheel')) {
        showGuestJoinPopup();
        return;
    }
    currentSidebarTab = tab;
    document.querySelectorAll('[data-sidebar].sidebar-item').forEach(x => {
        x.classList.toggle('active', x.getAttribute('data-sidebar') === tab);
    });
    switchSection('profile');
    setLeftMenuOpen(false);
};

async function renderProfileForm(container) {
    if (!container) return;
    const user = getCurrentUser();
    if (!user) return;
    
    let userData = user;
    if (typeof db !== 'undefined' && user.userId) {
        try {
            const userDoc = await db.collection('users').doc(user.userId).get();
            if (userDoc.exists) {
                userData = { ...user, ...userDoc.data() };
            }
        } catch (error) {
            console.error('Error loading user from Firestore:', error);
        }
    }
    
    const answers = userData.questionnaireAnswers || {};
    const hasAnswers = Object.keys(answers).some(k => (answers[k] || '').trim() !== '');
    
    let answersHtml = '';
    if (hasAnswers) {
        answersHtml = '<div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid var(--almost-white);"><h3 style="font-family: \'Playfair Display\', serif; font-size: 20px; color: var(--dark-violet); margin-bottom: 16px;">Vaši odgovori na vprašalnik</h3>';
        QUESTIONNAIRE_QUESTIONS.forEach((q, i) => {
            const key = 'q' + (i + 1);
            const val = (answers[key] || '').trim();
            if (!val) return;
            const preview = val.length > 120 ? val.slice(0, 120) + '…' : val;
            answersHtml += `<div style="margin-bottom: 16px;"><strong style="color: var(--dark-violet); font-size: 14px;">${escapeHtml(q)}</strong><p style="margin-top: 4px; color: var(--text-dark); font-size: 14px; white-space: pre-wrap;">${escapeHtml(preview)}</p></div>`;
        });
        answersHtml += `
            <button type="button" onclick="openQuestionnaireFromSettings()" style="
                margin-top: 20px;
                background: var(--main-white);
                color: var(--dark-violet);
                padding: 12px 28px;
                border: 2px solid var(--mid-violet);
                border-radius: 25px;
                font-size: 15px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
            ">Spremeni odgovore</button>
        </div>`;
    }
    
    const formHtml = `
        <form id="profileForm" style="max-width: 600px;">
            <div style="margin-bottom: 25px;">
                <label style="display: block; font-weight: 600; color: var(--text-dark); margin-bottom: 8px;">Ime</label>
                <input type="text" id="profileName" value="${escapeHtml(userData.name || '')}" style="
                    width: 100%;
                    padding: 12px 16px;
                    border: 2px solid var(--almost-white);
                    border-radius: 10px;
                    font-size: 16px;
                    font-family: 'Montserrat', sans-serif;
                ">
            </div>
            
            <div style="margin-bottom: 25px;">
                <label style="display: block; font-weight: 600; color: var(--text-dark); margin-bottom: 8px;">Email</label>
                <input type="email" id="profileEmail" value="${escapeHtml(userData.email || '')}" style="
                    width: 100%;
                    padding: 12px 16px;
                    border: 2px solid var(--almost-white);
                    border-radius: 10px;
                    font-size: 16px;
                    font-family: 'Montserrat', sans-serif;
                " readonly>
                <p style="font-size: 12px; color: var(--text-light); margin-top: 5px;">Email naslova ni mogoče spremeniti.</p>
            </div>
            
            <div style="margin-bottom: 25px;">
                <label style="display: block; font-weight: 600; color: var(--text-dark); margin-bottom: 8px;">Trenutno geslo</label>
                <input type="password" id="profileCurrentPassword" placeholder="Potrebno za spremembo gesla" style="
                    width: 100%;
                    padding: 12px 16px;
                    border: 2px solid var(--almost-white);
                    border-radius: 10px;
                    font-size: 16px;
                    font-family: 'Montserrat', sans-serif;
                ">
            </div>
            
            <div style="margin-bottom: 25px;">
                <label style="display: block; font-weight: 600; color: var(--text-dark); margin-bottom: 8px;">Novo geslo</label>
                <input type="password" id="profileNewPassword" placeholder="Min. 6 znakov" style="
                    width: 100%;
                    padding: 12px 16px;
                    border: 2px solid var(--almost-white);
                    border-radius: 10px;
                    font-size: 16px;
                    font-family: 'Montserrat', sans-serif;
                ">
            </div>
            
            <div style="margin-bottom: 25px;">
                <label style="display: block; font-weight: 600; color: var(--text-dark); margin-bottom: 8px;">Ponovite novo geslo</label>
                <input type="password" id="profileNewPasswordConfirm" placeholder="Ponovite novo geslo" style="
                    width: 100%;
                    padding: 12px 16px;
                    border: 2px solid var(--almost-white);
                    border-radius: 10px;
                    font-size: 16px;
                    font-family: 'Montserrat', sans-serif;
                ">
            </div>
            
            <button type="button" onclick="saveProfile()" style="
                background: linear-gradient(135deg, var(--mid-violet) 0%, var(--dark-violet) 100%);
                color: var(--white);
                padding: 15px 40px;
                border: none;
                border-radius: 25px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
            ">Shrani spremembe</button>
            
            ${answersHtml}
        </form>
    `;
    container.innerHTML = formHtml;
}

window.showProfileTab = function(tab) {
    const container = document.getElementById('profileTabContent');
    if (!container) return;
    const user = getCurrentUser();
    
    document.querySelectorAll('.profile-subnav a').forEach(a => {
        a.classList.toggle('profile-tab-active', a.getAttribute('data-tab') === tab);
    });
    
    if (tab === 'profil') {
        renderProfileForm(container);
        return;
    }
    if (tab === 'classroom') {
        loadClassroom(container);
        return;
    }
    if (tab === 'webinars') {
        loadWebinars(container);
        return;
    }
    if (tab === 'questionnaire') {
        if (user && user.role === 'guest') {
            container.innerHTML = `
                <div class="guest-locked-block">
                    <div class="guest-locked-inner">
                        <div class="guest-locked-accent"></div>
                        <p class="guest-locked-label">Samo za članice</p>
                        <h3 class="guest-locked-title">Vprašalnik je del članstva</h3>
                        <p class="guest-locked-lead">Ko se pridružiš skupini, dobiš dostop do celotnega vprašalnika, vseh webinarjev in vseh tečajev v učilnici.</p>
                        <div class="guest-locked-buttons">
                            <a href="/jaz-zenska" class="guest-locked-btn guest-locked-btn-primary">Odkleni dostop</a>
                        </div>
                    </div>
                </div>
            `;
            return;
        }
        loadQuestionnaire(container);
        return;
    }
};

window.openQuestionnaireFromSettings = function() {
    currentSidebarTab = 'questionnaire';
    document.querySelectorAll('[data-sidebar].sidebar-item').forEach(x => {
        x.classList.toggle('active', x.getAttribute('data-sidebar') === 'questionnaire');
    });
    switchSection('profile');
};

async function saveProfile() {
    const user = getCurrentUser();
    if (!user) return;
    
    const name = document.getElementById('profileName').value.trim();
    const currentPassword = (document.getElementById('profileCurrentPassword') && document.getElementById('profileCurrentPassword').value) || '';
    const newPassword = (document.getElementById('profileNewPassword') && document.getElementById('profileNewPassword').value) || '';
    const newPasswordConfirm = (document.getElementById('profileNewPasswordConfirm') && document.getElementById('profileNewPasswordConfirm').value) || '';
    
    if (!name) {
        alert('Prosimo, izpolnite vsa obvezna polja.');
        return;
    }
    
    const wantsPasswordChange = currentPassword || newPassword || newPasswordConfirm;
    if (wantsPasswordChange) {
        if (!currentPassword) {
            alert('Za spremembo gesla vnesite trenutno geslo.');
            return;
        }
        if (!newPassword) {
            alert('Vnesite novo geslo.');
            return;
        }
        if (newPassword.length < 6) {
            alert('Novo geslo mora imeti vsaj 6 znakov.');
            return;
        }
        if (newPassword !== newPasswordConfirm) {
            alert('Novo geslo in ponovitev se ne ujemata.');
            return;
        }
    }
    
    try {
        // Update Firestore if available
        if (typeof db !== 'undefined' && user.userId) {
            await db.collection('users').doc(user.userId).update({
                name: name,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
        
        // Update password if provided: reauthenticate with current password, then set new
        if (wantsPasswordChange && typeof auth !== 'undefined' && auth.currentUser) {
            const credential = firebase.auth.EmailAuthProvider.credential(user.email, currentPassword);
            await auth.currentUser.reauthenticateWithCredential(credential);
            await auth.currentUser.updatePassword(newPassword);
        }
        
        // Update localStorage
        const currentUser = {
            ...user,
            name: name
        };
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        // Update display
        document.getElementById('userName').textContent = name || user.email;
        
        alert('Profil je bil posodobljen!');
        loadProfile();
    } catch (error) {
        console.error('Error saving profile:', error);
        let errorMessage = 'Napaka pri shranjevanju profila.';
        
        if (error.code === 'auth/weak-password') {
            errorMessage = 'Novo geslo mora imeti vsaj 6 znakov.';
        } else if (error.code === 'auth/requires-recent-login') {
            errorMessage = 'Za spremembo gesla se morate znova prijaviti.';
        } else if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            errorMessage = 'Trenutno geslo ni pravilno.';
        }
        
        alert(errorMessage);
    }
}

// handleLogout is already defined above with Firebase integration

// Initialize on page load (only if not already initialized by /dashboard)
// /dashboard handles initialization after Firebase is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        // Only init if not already done by /dashboard
        if (!window.dashboardInitialized) {
            initDashboard();
        }
    });
} else {
    // DOM already loaded, but check if /dashboard will handle it
    // /dashboard handles initialization after Firebase is ready
}
