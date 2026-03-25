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
        window.location.href = 'login.html';
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
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Error logging out:', error);
        // Clear localStorage anyway and redirect
        localStorage.removeItem('currentUser');
        window.location.href = 'login.html';
    }
}

// Track if dashboard is initialized to prevent duplicate initialization
let dashboardInitialized = false;

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
            window.location.href = 'login.html';
            return;
        }
    }
    
    initDataStructures();
    
    const user = getCurrentUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    
    // Display user info
    document.getElementById('userName').textContent = user.name || user.email;
    const roleEl = document.getElementById('userRole');
    const roleLabels = { admin: 'Admin', member: 'Članica', guest: 'Gost' };
    roleEl.textContent = roleLabels[user.role] || (user.role === 'admin' ? 'Admin' : 'Članica');
    roleEl.className = `user-role ${user.role}`;
    
    // Navigation
    document.querySelectorAll('.dashboard-switcher .switch-card').forEach(card => {
        card.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('data-section');
            switchSection(section);
            
            document.querySelectorAll('.dashboard-switcher .switch-card').forEach(c => c.classList.remove('active'));
            this.classList.add('active');
            this.setAttribute('aria-current', 'page');
            document.querySelectorAll('.dashboard-switcher .switch-card:not(.active)').forEach(c => c.removeAttribute('aria-current'));
        });
    });
    
    // Load initial section (profile first)
    switchSection('profile');
    
    // Check welcome status AFTER everything is initialized
    // Wait for Firebase to be ready
    waitForFirebaseAndCheckWelcome();
}

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
            // Firebase not available, use localStorage fallback
            const user = getCurrentUser();
            if (user && !user.welcomed) {
                console.log('Firebase not available, checking localStorage only');
                checkWelcomeStatus();
            }
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
        'Meditativni ples za sproščanje'
    ];
    
    courses = courses.filter(course => !coursesToDelete.includes(course.title));
    
    // Guests can see all courses; lock those they do not own
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const purchasedCourses = Array.isArray(currentUser.purchasedCourses)
        ? currentUser.purchasedCourses
        : (Array.isArray(currentUser.boughtCourses) ? currentUser.boughtCourses : []);
    
    let html = '';
    
    // Test/CTA block: show only when user has purchased moc-besede
    if (purchasedCourses.includes('moc-besede')) {
        html += `
            <div style="
                position: relative;
                max-width: 620px;
                margin: 0 auto 24px;
                padding: 18px;
                background: linear-gradient(135deg, #f8f0f2 0%, #fff6f9 100%);
                border: 1px solid rgba(153, 98, 122, 0.2);
                border-left: 4px solid var(--mid-violet);
                border-radius: 18px;
                box-shadow: 0 10px 28px rgba(100, 56, 67, 0.12);
                overflow: hidden;
            ">
                <div style="
                    position: absolute;
                    top: -35px;
                    right: -35px;
                    width: 170px;
                    height: 170px;
                    background: url('images/background-decorations.webp') no-repeat center;
                    background-size: contain;
                    opacity: 0.22;
                    pointer-events: none;
                "></div>
                <a href="course.html?id=moc-besede" style="
                    position: relative;
                    z-index: 1;
                    display: block;
                    border-radius: 14px;
                    overflow: hidden;
                    box-shadow: 0 10px 26px rgba(100, 56, 67, 0.18);
                    transition: transform 0.25s ease, box-shadow 0.25s ease;
                " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 16px 42px rgba(100, 56, 67, 0.22)';"
                   onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 10px 26px rgba(100, 56, 67, 0.18)';">
                    <img src="images/moc besede.webp" alt="Moč besede" style="
                        width: 100%;
                        height: auto;
                        display: block;
                        aspect-ratio: 16/10;
                        object-fit: cover;
                    ">
                </a>
            </div>
        `;
    }
    
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
    } else if (currentUser.role === 'guest' && purchasedCourses.length === 0) {
        html += `
            <div style="
                position: relative;
                max-width: 620px;
                margin: 8px auto 0;
                background: linear-gradient(135deg, #f8f0f2 0%, #fff6f9 100%);
                border: 1px solid rgba(153, 98, 122, 0.2);
                border-left: 4px solid var(--mid-violet);
                border-radius: 18px;
                padding: 30px 24px;
                text-align: center;
                box-shadow: 0 10px 28px rgba(100, 56, 67, 0.12);
                overflow: hidden;
            ">
                <div style="
                    position: absolute;
                    bottom: -35px;
                    left: -30px;
                    width: 170px;
                    height: 170px;
                    background: url('images/background-decorations.webp') no-repeat center;
                    background-size: contain;
                    opacity: 0.2;
                    pointer-events: none;
                "></div>
                <p style="margin: 0 0 12px; color: var(--text-dark); font-size: 16px; line-height: 1.6;">
                    Nimate dostopa do nobenega tečaja.
                </p>
                <a href="spletna-trgovina.html" style="
                    display: inline-block;
                    background: linear-gradient(135deg, #99627A 0%, #643843 100%);
                    color: #fff;
                    padding: 12px 24px;
                    border-radius: 999px;
                    font-size: 14px;
                    font-weight: 600;
                    text-decoration: none;
                    box-shadow: 0 6px 20px rgba(100,56,67,0.25);
                ">Klikni tukaj za dostop</a>
            </div>
        `;
    }
    
    content.innerHTML = html;
}

function getCourseBuyUrl(courseId) {
    if (courseId === 'moc-besede') return 'o-tecaju.html';
    return 'spletna-trgovina.html';
}

function openCourse(courseId, hasAccess = true) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (currentUser.role === 'guest' && !hasAccess) {
        window.location.href = getCourseBuyUrl(courseId);
        return;
    }
    window.location.href = `course.html?id=${courseId}`;
}

function showNoAccessPopup() {
    const existing = document.getElementById('noAccessModal');
    if (existing) {
        existing.classList.add('show');
        return;
    }
    const overlay = document.createElement('div');
    overlay.id = 'noAccessModal';
    overlay.className = 'no-access-modal';
    overlay.innerHTML = `
        <div class="no-access-modal-content">
            <h3 class="no-access-title">Nimate dostopa do te vsebine</h3>
            <p class="no-access-text">Kupite ta tečaj v spletni trgovini ali se pridružite celotni skupini za 119 € in dobite dostop do vsega!</p>
            <div class="no-access-buttons">
                <a href="spletna-trgovina.html" class="no-access-btn no-access-btn-primary">Kupi tečaj</a>
                <a href="pridruzi-se.html" class="no-access-btn no-access-btn-secondary">Celotna skupina (119 €)</a>
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
        .no-access-modal { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 20000; align-items: center; justify-content: center; padding: 20px; }
        .no-access-modal.show { display: flex; }
        .no-access-modal-content { background: var(--white); border-radius: 20px; padding: 40px; max-width: 440px; width: 100%; position: relative; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
        .no-access-title { font-family: 'Playfair Display', serif; font-size: 24px; color: var(--dark-violet); margin: 0 0 16px; }
        .no-access-text { color: var(--text-dark); font-size: 16px; line-height: 1.7; margin: 0 0 28px; }
        .no-access-buttons { display: flex; flex-direction: column; gap: 12px; }
        .no-access-btn { display: block; text-align: center; padding: 14px 24px; border-radius: 50px; font-size: 16px; font-weight: 600; text-decoration: none; transition: all 0.3s ease; }
        .no-access-btn-primary { background: linear-gradient(135deg, #99627A 0%, #643843 100%); color: white; box-shadow: 0 6px 24px rgba(100,56,67,0.35); }
        .no-access-btn-primary:hover { transform: translateY(-2px); }
        .no-access-btn-secondary { background: var(--main-white); color: var(--dark-violet); border: 2px solid var(--mid-violet); }
        .no-access-btn-secondary:hover { background: rgba(153,98,122,0.1); }
        .no-access-close { position: absolute; top: 16px; right: 16px; background: none; border: none; font-size: 28px; color: var(--text-light); cursor: pointer; line-height: 1; padding: 0; }
        .no-access-close:hover { color: var(--dark-violet); }
    `;
    overlay.classList.add('show');
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
            <a href="pridruzi-se.html" style="
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
async function loadWebinars(container) {
    const content = container || document.getElementById('webinarsContent');
    if (!content) return;
    
    const user = getCurrentUser();
    if (user && user.role === 'guest') {
        content.innerHTML = typeof getGuestLockedHtml === 'function' ? getGuestLockedHtml() : '';
        return;
    }
    
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
                title: '25 Stopnic do srece',
                date: '9. marca 2026',
                description: 'Webinar 25 stopnic do sreče.',
                videoId: '',
                videoUrl: ''
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
    
    const stopnicWebinar = { id: '2', title: '25 Stopnic do srece', date: '9. marca 2026', description: 'Webinar 25 stopnic do sreče.', videoId: '', videoUrl: '' };
    if (!webinars.some(w => w.title === '25 Stopnic do srece')) {
        webinars.unshift(stopnicWebinar);
    }
    
    let html = '';
    
    if (webinars.length === 0) {
        html = '<p style="color: var(--text-light); text-align: center; padding: 40px;">Trenutno ni na voljo nobenih webinarjev.</p>';
    } else {
        html = '<div class="webinars-grid">';
        webinars.forEach(webinar => {
            const isStopnic = webinar.title === '25 Stopnic do srece';
            const cardImage = isStopnic ? 'images/aktualen dogodek 2.webp' : 'images/moja moc je v meni.webp';
            const cardOnclick = isStopnic ? 'showStopnicWebinarPopup()' : `openWebinar('${webinar.id}')`;
            html += `
                <div class="webinar-card" onclick="${cardOnclick}">
                    <img src="${cardImage}" alt="${escapeHtml(webinar.title)}" class="webinar-card-image">
                    <div class="webinar-title">${webinar.title}</div>
                    <div class="webinar-date">${webinar.date || ''}</div>
                    <div class="webinar-description">${webinar.description || ''}</div>
                </div>
            `;
        });
        html += '</div>';
    }
    
    content.innerHTML = html;
}

function showStopnicWebinarPopup() {
    const user = getCurrentUser();
    if (user && user.role === 'guest') {
        showNoAccessPopup();
        return;
    }
    const modal = document.getElementById('stopnicWebinarModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeStopnicWebinarPopup() {
    const modal = document.getElementById('stopnicWebinarModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function openWebinar(webinarId) {
    const user = getCurrentUser();
    if (user && user.role === 'guest') {
        showNoAccessPopup();
        return;
    }
    
    const webinars = JSON.parse(localStorage.getItem('webinars') || '[]');
    const webinar = webinars.find(w => w.id === webinarId);
    
    if (!webinar) {
        console.error('Webinar not found:', webinarId);
        return;
    }
    
    // Open in course-style layout (progress bar + episode list)
    window.location.href = `course.html?webinar=${encodeURIComponent(webinar.id)}`;
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
    
    // Quick check localStorage first (for performance)
    const cachedWelcomed = user.welcomed === true;
    if (cachedWelcomed) {
        console.log('✅ User already welcomed (from cache), skipping modal');
        return;
    }
    
    let welcomed = false;
    
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
                console.log('📊 Firestore welcomed status:', welcomed);
                
                // Update localStorage cache with latest welcomed status
                const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
                currentUser.welcomed = welcomed;
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
            } else {
                // User document doesn't exist yet - show welcome
                console.log('⚠️ User document not found in Firestore, showing welcome');
                welcomed = false;
            }
        } else {
            console.log('⚠️ Firestore not available, using localStorage');
            // Firestore not available - fallback to localStorage
            welcomed = user.welcomed === true;
        }
    } catch (error) {
        console.error('❌ Error checking welcome status:', error);
        // Fallback to localStorage if Firestore check fails
        welcomed = user.welcomed === true;
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
        
        // Update localStorage
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        currentUser.welcomed = true;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
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
    
    // Exclude events on 6 Feb (user requested removal)
    function toLocalDateStringCal(d) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return y + '-' + m + '-' + day;
    }
    events = events.filter(e => toLocalDateStringCal(new Date(e.date)) !== '2026-02-06');
    
    // Remove "25 Stopnic do sreče" from 5.3 – webinar is on 9.3 (Monday) only
    events = events.filter(e => !(e.title === '25 Stopnic do sreče' && (e.date && (e.date.startsWith('2026-03-05') || (new Date(e.date).getMonth() === 2 && new Date(e.date).getDate() === 5)))));
    
    // Ensure "25 Stopnic do sreče" webinar on 9 March (Monday) is always present
    const stopnicDate = '2026-03-09T10:00:00.000Z';
    const hasStopnic = events.some(e => e.title === '25 Stopnic do sreče' && (e.date && (e.date.startsWith('2026-03-09') || (new Date(e.date).getMonth() === 2 && new Date(e.date).getDate() === 9))));
    if (!hasStopnic) {
        events.push({
            id: 'stopnic-webinar-2026',
            title: '25 Stopnic do sreče',
            description: 'Brezplačni webinar 25 stopnic do sreče. Začetek ob 19:00. Povezava za Zoom bo dodana pravočasno.',
            date: stopnicDate,
            time: '19:00',
            type: 'webinar',
            location: 'https://www.jazzenska.com/sreca'
        });
    }
    
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

async function showDayEvents(dateStr) {
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
    
    function toLocalDateString(d) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return y + '-' + m + '-' + day;
    }
    
    // Exclude events on 6 Feb (user requested removal)
    events = events.filter(e => toLocalDateString(new Date(e.date)) !== '2026-02-06');
    
    // Remove "25 Stopnic do sreče" on 5.3 – only 9.3 (Monday) is correct
    events = events.filter(e => !(e.title === '25 Stopnic do sreče' && (e.date && (String(e.date).startsWith('2026-03-05') || (new Date(e.date).getMonth() === 2 && new Date(e.date).getDate() === 5)))));
    
    // Ensure "25 Stopnic do sreče" on 9 March (Monday) is available when opening that day
    if (dateStr === '2026-03-09') {
        const hasStopnic = events.some(e => e.title === '25 Stopnic do sreče');
        if (!hasStopnic) {
            events.push({
                id: 'stopnic-webinar-2026',
                title: '25 Stopnic do sreče',
                description: 'Brezplačni webinar 25 stopnic do sreče. Začetek ob 19:00. Povezava za Zoom bo dodana pravočasno.',
                date: '2026-03-09T10:00:00.000Z',
                time: '19:00',
                type: 'webinar',
                location: 'https://www.jazzenska.com/sreca'
            });
        }
    }
    
    const dayEvents = events.filter(e => {
        const ed = new Date(e.date);
        return toLocalDateString(ed) === dateStr;
    });
    
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
                const eventImage = isStopnic ? '<img src="images/aktualen dogodek 2.webp" alt="25 Stopnic do sreče" style="width: 100%; max-height: 220px; object-fit: cover; border-radius: 12px 12px 0 0; margin: -20px -20px 16px -20px; display: block;">' : '';
                return `
                    <div style="
                        background: var(--main-white);
                        padding: 20px;
                        border-radius: 15px;
                        margin-bottom: 15px;
                        border-left: 4px solid var(--mid-violet);
                        overflow: hidden;
                    ">
                        ${eventImage}
                        <h4 style="font-family: 'Playfair Display', serif; font-size: 20px; color: var(--dark-violet); margin-bottom: 10px;">${event.title}</h4>
                        <p style="color: var(--text-dark); line-height: 1.6; margin-bottom: 10px; white-space: pre-wrap;">${event.description || ''}</p>
                        <div style="margin-bottom: 10px;">
                            ${event.type === 'real-life' ? '<span style="background: var(--main-white); padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; color: var(--dark-violet);">Dogodek v živo</span>' : ''}
                            ${event.type === 'webinar' ? '<span style="background: var(--main-white); padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; color: var(--dark-violet);">Webinar</span>' : ''}
                            ${event.type === 'zoom' ? '<span style="background: var(--main-white); padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; color: var(--dark-violet);">Zoom klic</span>' : ''}
                        </div>
                        <div style="font-size: 14px; color: var(--text-light); margin-bottom: 12px;">
                            <div style="margin-bottom: 4px;">🕐 ${event.time}</div>
                            <div>📅 ${eventDate.toLocaleDateString('sl-SI', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                        </div>
                        ${event.type === 'real-life' ? `<div style="font-size: 14px; color: var(--text-light); margin-bottom: 12px;">📍 ${event.location}</div>` : ''}
                        ${event.type === 'webinar' || event.type === 'zoom' ? `
                        <div style="margin-top: 12px;">
                            <a href="${ensureAbsoluteUrl(event.location)}" target="_blank" rel="noopener noreferrer" style="
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
}

function closeEventModal() {
    document.getElementById('eventModal').classList.remove('show');
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
    
    content.innerHTML = `
        <div class="profile-subnav">
            <a href="#" class="profile-tab-active" data-tab="classroom">Tečaji</a>
            <a href="#" data-tab="webinars">Webinari</a>
            <a href="#" data-tab="questionnaire">Vprašalnik</a>
            <a href="#" data-tab="profil">Nastavitve</a>
        </div>
        <div id="profileTabContent"></div>
    `;
    
    const container = document.getElementById('profileTabContent');
    content.querySelectorAll('.profile-subnav a').forEach(a => {
        a.addEventListener('click', function(e) {
            e.preventDefault();
            showProfileTab(this.getAttribute('data-tab'));
        });
    });
    
    const openTab = sessionStorage.getItem('openProfileTab');
    if (openTab) {
        sessionStorage.removeItem('openProfileTab');
        showProfileTab(openTab);
    } else {
        loadClassroom(container);
    }
}

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
            <button type="button" onclick="showProfileTab(\'questionnaire\')" style="
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
        loadQuestionnaire(container);
        return;
    }
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

// Initialize on page load (only if not already initialized by dashboard.html)
// dashboard.html handles initialization after Firebase is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        // Only init if not already done by dashboard.html
        if (!window.dashboardInitialized) {
            initDashboard();
        }
    });
} else {
    // DOM already loaded, but check if dashboard.html will handle it
    // dashboard.html handles initialization after Firebase is ready
}
