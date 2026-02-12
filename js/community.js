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
    // Initialize posts if they don't exist
    if (!localStorage.getItem('posts')) {
        localStorage.setItem('posts', JSON.stringify([]));
    }
    
    // Initialize courses as empty array
    if (!localStorage.getItem('courses')) {
        localStorage.setItem('courses', JSON.stringify([]));
    }
    
    // Initialize events as empty array
    if (!localStorage.getItem('events')) {
        localStorage.setItem('events', JSON.stringify([]));
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

// Initialize dashboard
function initDashboard() {
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
    roleEl.textContent = user.role === 'admin' ? 'Admin' : 'Članica';
    roleEl.className = `user-role ${user.role}`;
    
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('data-section');
            switchSection(section);
            
            // Update active nav
            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // Load initial section
    switchSection('community');
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
            case 'community':
                loadCommunity();
                break;
            case 'classroom':
                loadClassroom();
                break;
            case 'calendar':
                loadCalendar();
                break;
            case 'profile':
                loadProfile();
                break;
        }
    }
}

// ===== COMMUNITY SECTION =====
async function loadCommunity() {
    const user = getCurrentUser();
    const content = document.getElementById('communityContent');
    
    let posts = [];
    
    // Try to load from Firestore first
    try {
        if (typeof db !== 'undefined') {
            const postsSnapshot = await db.collection('posts')
                .orderBy('createdAt', 'desc')
                .get();
            
            if (!postsSnapshot.empty) {
                posts = postsSnapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        title: data.title,
                        author: data.author,
                        authorId: data.authorId,
                        content: data.content,
                        image: data.image || null,
                        likes: data.likes || [],
                        likesCount: data.likesCount || (data.likes ? data.likes.length : 0),
                        commentsCount: data.commentsCount || 0,
                        createdAt: data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate().toISOString() : data.createdAt) : new Date().toISOString()
                    };
                });
                
                // Update localStorage cache
                localStorage.setItem('posts', JSON.stringify(posts));
                console.log('Loaded posts from Firestore');
            }
        }
    } catch (error) {
        console.error('Error loading posts from Firestore:', error);
    }
    
    // Fallback to localStorage if Firestore failed or returned no posts
    if (posts.length === 0) {
        posts = JSON.parse(localStorage.getItem('posts') || '[]');
        console.log('Loaded posts from localStorage');
    }
    
    // Filter out welcome posts
    const welcomePostTitles = [
        'Dobrodošla v skupnosti!',
        'Dobrodošle v skupnost Jaz Ženska!'
    ];
    posts = posts.filter(post => !welcomePostTitles.includes(post.title));
    
    let html = '';
    
    // Add post button for admin
    if (isAdmin()) {
        html += `
            <div style="margin-bottom: 30px;">
                <button onclick="showAddPostModal()" style="
                    background: linear-gradient(135deg, var(--mid-violet) 0%, var(--dark-violet) 100%);
                    color: var(--white);
                    padding: 12px 30px;
                    border: none;
                    border-radius: 25px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                ">+ Dodaj novo objavo</button>
            </div>
        `;
    }
    
    // Info message about clicking posts
    html += `
        <div style="
            background: linear-gradient(135deg, var(--main-white) 0%, #fafafa 100%);
            padding: 15px 25px;
            border-radius: 12px;
            margin-bottom: 25px;
            border-left: 4px solid var(--mid-violet);
            display: flex;
            align-items: center;
            gap: 10px;
        ">
            <span style="font-size: 20px;">💡</span>
            <span style="color: var(--text-dark); font-size: 14px; font-weight: 500;">Kliknite na objavo, da vidite celotno vsebino in slike</span>
        </div>
    `;
    
    // Display posts
    if (posts.length === 0) {
        html += '<p style="color: var(--text-light); text-align: center; padding: 40px;">Trenutno ni objav.</p>';
    } else {
        // Load user likes from Firestore
        let userLikes = [];
        try {
            if (typeof db !== 'undefined' && user.userId) {
                const likesSnapshot = await db.collection('users').doc(user.userId)
                    .collection('likes').get();
                userLikes = likesSnapshot.docs.map(doc => doc.id);
            }
        } catch (error) {
            console.error('Error loading user likes:', error);
        }
        
        posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).forEach(post => {
            const likes = post.likes || [];
            const comments = post.comments || [];
            // Check if user liked from Firestore data, fallback to localStorage
            const isLiked = userLikes.includes(post.id) || likes.includes(user.userId);
            const likeCount = likes.length;
            const commentCount = comments.length;
            const title = post.title || 'Brez naslova';
            const preview = post.content.length > 150 ? post.content.substring(0, 150) + '...' : post.content;
            const isExpanded = localStorage.getItem(`post-expanded-${post.id}`) === 'true';
            
            html += `
                <div class="post-card" onclick="togglePostExpand('${post.id}')">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
                        <div>
                            <div style="font-weight: 600; color: var(--dark-violet); font-size: 18px;">${post.author}</div>
                            <div style="font-size: 12px; color: var(--text-light);">${new Date(post.createdAt).toLocaleDateString('sl-SI', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                    </div>
                    <div class="post-title">${title}</div>
                    <div class="post-preview" id="preview-${post.id}">${preview}</div>
                    <div class="post-full ${isExpanded ? 'show' : ''}" id="full-${post.id}">
                        ${post.content}
                        ${post.image ? `<img src="${post.image}" alt="Post image" class="post-image" onclick="event.stopPropagation();">` : ''}
                    </div>
                    <div class="post-actions" onclick="event.stopPropagation()">
                        <button class="action-btn ${isLiked ? 'liked' : ''}" onclick="toggleLike('${post.id}')">
                            <span style="font-size: 20px;">${isLiked ? '❤️' : '🤍'}</span>
                            <span>Všeč mi je!</span>
                            <span style="margin-left: 5px; font-weight: 600;">${likeCount}</span>
                        </button>
                        <button class="action-btn" onclick="showComments('${post.id}')">
                            <span style="font-size: 20px;">💬</span>
                            <span>Komentiraj!</span>
                            <span style="margin-left: 5px; font-weight: 600;">${commentCount}</span>
                        </button>
                    </div>
                    <div id="comments-${post.id}" style="display: none; margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(100, 56, 67, 0.1);" onclick="event.stopPropagation()">
                        <div id="comments-list-${post.id}"></div>
                        <div style="margin-top: 15px;">
                            <input type="text" id="comment-input-${post.id}" placeholder="Napišite komentar..." style="
                                width: 100%;
                                padding: 12px 18px;
                                border: 2px solid var(--almost-white);
                                border-radius: 25px;
                                font-size: 14px;
                                transition: all 0.3s ease;
                            " onkeypress="if(event.key==='Enter') addComment('${post.id}')" onfocus="this.style.borderColor='var(--mid-violet)'" onblur="this.style.borderColor='var(--almost-white)'">
                        </div>
                    </div>
                </div>
            `;
        });
    }
    
    content.innerHTML = html;
}

let postImageData = null;

function showAddPostModal() {
    document.getElementById('addPostModal').classList.add('show');
    document.getElementById('postTitle').value = '';
    document.getElementById('postContent').value = '';
    document.getElementById('postImage').value = '';
    document.getElementById('postImagePreview').style.display = 'none';
    postImageData = null;
}

function closeAddPostModal() {
    document.getElementById('addPostModal').classList.remove('show');
    document.getElementById('postImage').value = '';
    document.getElementById('postImagePreview').style.display = 'none';
    postImageData = null;
}

function previewPostImage(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        alert('Prosimo, izberite slikovno datoteko.');
        event.target.value = '';
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        postImageData = e.target.result;
        document.getElementById('postImagePreviewImg').src = postImageData;
        document.getElementById('postImagePreview').style.display = 'block';
    };
    reader.readAsDataURL(file);
}

function removePostImage() {
    document.getElementById('postImage').value = '';
    document.getElementById('postImagePreview').style.display = 'none';
    postImageData = null;
}

async function submitPost(event) {
    event.preventDefault();
    
    const title = document.getElementById('postTitle').value.trim();
    const content = document.getElementById('postContent').value.trim();
    const postImageData = window.postImageData || null;
    
    if (!title || !content) {
        alert('Prosimo, izpolnite vsa obvezna polja.');
        return;
    }
    
    const user = getCurrentUser();
    if (!user || !user.userId) {
        alert('Morate biti prijavljeni za objavo.');
        return;
    }
    
    // Create post object
    const newPost = {
        title: title,
        author: user.name || 'Marjanca',
        authorId: user.userId,
        content: content,
        image: postImageData || null,
        likes: [],
        likesCount: 0,
        commentsCount: 0,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    try {
        // Save to Firestore
        if (typeof db !== 'undefined') {
            const docRef = await db.collection('posts').add(newPost);
            console.log('Post saved to Firestore with ID:', docRef.id);
            
            // Also update localStorage cache
            const posts = JSON.parse(localStorage.getItem('posts') || '[]');
            posts.push({
                ...newPost,
                id: docRef.id,
                createdAt: new Date().toISOString()
            });
            localStorage.setItem('posts', JSON.stringify(posts));
        } else {
            // Fallback to localStorage if Firestore not available
            const posts = JSON.parse(localStorage.getItem('posts') || '[]');
            const postWithId = {
                ...newPost,
                id: Date.now().toString(),
                createdAt: new Date().toISOString()
            };
            posts.push(postWithId);
            localStorage.setItem('posts', JSON.stringify(posts));
            console.warn('Firestore not available, saved to localStorage');
        }
        
        // Clear form
        document.getElementById('postTitle').value = '';
        document.getElementById('postContent').value = '';
        document.getElementById('postImage').value = '';
        if (window.postImageData) {
            window.postImageData = null;
        }
        if (document.getElementById('postImagePreview')) {
            document.getElementById('postImagePreview').style.display = 'none';
        }
        
        closeAddPostModal();
        loadCommunity();
    } catch (error) {
        console.error('Error saving post:', error);
        alert('Napaka pri shranjevanju objave. Prosimo, poskusite znova.');
    }
}

function togglePostExpand(postId) {
    const preview = document.getElementById(`preview-${postId}`);
    const full = document.getElementById(`full-${postId}`);
    
    if (!preview || !full) return;
    
    const isExpanded = full.classList.contains('show');
    
    if (isExpanded) {
        full.classList.remove('show');
        preview.style.display = '-webkit-box';
        localStorage.setItem(`post-expanded-${postId}`, 'false');
    } else {
        full.classList.add('show');
        preview.style.display = 'none';
        localStorage.setItem(`post-expanded-${postId}`, 'true');
    }
}

async function toggleLike(postId) {
    event.stopPropagation();
    const user = getCurrentUser();
    if (!user || !user.userId) return;
    
    const posts = JSON.parse(localStorage.getItem('posts') || '[]');
    const post = posts.find(p => p.id === postId);
    
    if (!post) return;
    
    if (!post.likes) post.likes = [];
    
    const index = post.likes.indexOf(user.userId);
    const isLiked = index > -1;
    
    if (isLiked) {
        post.likes.splice(index, 1);
    } else {
        post.likes.push(user.userId);
    }
    
    localStorage.setItem('posts', JSON.stringify(posts));
    
    // Save to Firestore
    try {
        if (typeof db !== 'undefined') {
            const userLikesRef = db.collection('users').doc(user.userId)
                .collection('likes').doc(postId);
            
            if (isLiked) {
                // Unlike - remove from Firestore
                await userLikesRef.delete();
            } else {
                // Like - add to Firestore
                await userLikesRef.set({
                    postId: postId,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
            
            // Update post likes count in Firestore
            await db.collection('posts').doc(postId).set({
                likes: post.likes,
                likesCount: post.likes.length,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        }
    } catch (error) {
        console.error('Error saving like to Firestore:', error);
    }
    
    loadCommunity();
}

function showComments(postId) {
    event.stopPropagation();
    const commentsDiv = document.getElementById(`comments-${postId}`);
    if (commentsDiv.style.display === 'none') {
        commentsDiv.style.display = 'block';
        loadComments(postId);
    } else {
        commentsDiv.style.display = 'none';
    }
}

async function loadComments(postId) {
    const posts = JSON.parse(localStorage.getItem('posts') || '[]');
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    
    let comments = post.comments || [];
    
    // Try to load from Firestore
    try {
        if (typeof db !== 'undefined') {
            const commentsSnapshot = await db.collection('posts').doc(postId)
                .collection('comments').orderBy('createdAt', 'asc').get();
            
            if (!commentsSnapshot.empty) {
                comments = commentsSnapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        author: data.author,
                        authorId: data.authorId,
                        content: data.content,
                        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt
                    };
                });
                
                // Update localStorage cache
                post.comments = comments;
                localStorage.setItem('posts', JSON.stringify(posts));
            }
        }
    } catch (error) {
        console.error('Error loading comments from Firestore:', error);
    }
    
    const commentsList = document.getElementById(`comments-list-${postId}`);
    
    if (comments.length === 0) {
        commentsList.innerHTML = '<p style="color: var(--text-light); font-size: 14px;">Ni komentarjev.</p>';
    } else {
        commentsList.innerHTML = comments.map(comment => `
            <div style="padding: 10px 0; border-bottom: 1px solid var(--almost-white);">
                <div style="font-weight: 600; color: var(--dark-violet); font-size: 14px;">${comment.author}</div>
                <div style="color: var(--text-dark); font-size: 14px; margin-top: 5px;">${comment.content}</div>
                <div style="font-size: 12px; color: var(--text-light); margin-top: 5px;">${new Date(comment.createdAt).toLocaleDateString('sl-SI')}</div>
            </div>
        `).join('');
    }
}

async function addComment(postId) {
    const input = document.getElementById(`comment-input-${postId}`);
    const content = input.value.trim();
    if (!content) return;
    
    const user = getCurrentUser();
    if (!user || !user.userId) return;
    
    const posts = JSON.parse(localStorage.getItem('posts') || '[]');
    const post = posts.find(p => p.id === postId);
    
    if (!post) return;
    
    if (!post.comments) post.comments = [];
    
    const comment = {
        id: Date.now().toString(),
        author: user.name || user.email,
        authorId: user.userId,
        content: content,
        createdAt: new Date().toISOString()
    };
    
    post.comments.push(comment);
    localStorage.setItem('posts', JSON.stringify(posts));
    input.value = '';
    
    // Save to Firestore
    try {
        if (typeof db !== 'undefined') {
            await db.collection('posts').doc(postId)
                .collection('comments').add({
                    author: comment.author,
                    authorId: comment.authorId,
                    content: comment.content,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            
            // Update comment count in post
            await db.collection('posts').doc(postId).set({
                commentsCount: post.comments.length,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        }
    } catch (error) {
        console.error('Error saving comment to Firestore:', error);
    }
    
    await loadComments(postId);
}

// ===== CLASSROOM SECTION =====
async function loadClassroom() {
    const content = document.getElementById('classroomContent');
    
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
    
    let html = '';
    
    if (courses.length > 0) {
        html += '<div class="courses-grid">';
        courses.forEach(course => {
            html += `
                <div class="course-card" onclick="openCourse('${course.id}')">
                    <div class="course-title">${course.title}</div>
                    <div class="course-info">
                        <span>${course.episodes?.length || 0} epizod</span>
                        ${course.progress ? `<span>${course.progress}% dokončano</span>` : ''}
                    </div>
                </div>
            `;
        });
        html += '</div>';
    }
    
    content.innerHTML = html;
}

function openCourse(courseId) {
    window.location.href = `course.html?id=${courseId}`;
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
    
    // Calendar header
    const monthNames = ['Januar', 'Februar', 'Marec', 'April', 'Maj', 'Junij', 'Julij', 'Avgust', 'September', 'Oktober', 'November', 'December'];
    let html = '';
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
    
    // Calendar days
    const currentDate = new Date(startDate);
    for (let i = 0; i < 42; i++) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const dayEvents = events.filter(e => {
            const eventDate = new Date(e.date).toISOString().split('T')[0];
            return eventDate === dateStr;
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
    
    const dayEvents = events.filter(e => {
        const eventDate = new Date(e.date).toISOString().split('T')[0];
        return eventDate === dateStr;
    });
    
    const modal = document.getElementById('eventModal');
    const modalContent = document.getElementById('eventModalContent');
    
    if (dayEvents.length === 0) {
        modalContent.innerHTML = `
            <h3 style="font-family: 'Playfair Display', serif; font-size: 24px; color: var(--dark-violet); margin-bottom: 20px;">
                ${new Date(dateStr).toLocaleDateString('sl-SI', { year: 'numeric', month: 'long', day: 'numeric' })}
            </h3>
            <p style="color: var(--text-light);">Na ta dan ni načrtovanih dogodkov.</p>
        `;
    } else {
        modalContent.innerHTML = `
            <h3 style="font-family: 'Playfair Display', serif; font-size: 24px; color: var(--dark-violet); margin-bottom: 20px;">
                ${new Date(dateStr).toLocaleDateString('sl-SI', { year: 'numeric', month: 'long', day: 'numeric' })}
            </h3>
            ${dayEvents.map(event => {
                const eventDate = new Date(event.date);
                return `
                    <div style="
                        background: var(--main-white);
                        padding: 20px;
                        border-radius: 15px;
                        margin-bottom: 15px;
                        border-left: 4px solid var(--mid-violet);
                    ">
                        <h4 style="font-family: 'Playfair Display', serif; font-size: 20px; color: var(--dark-violet); margin-bottom: 10px;">${event.title}</h4>
                        <p style="color: var(--text-dark); line-height: 1.6; margin-bottom: 10px; white-space: pre-wrap;">${event.description || ''}</p>
                        <div style="margin-bottom: 10px;">
                            ${event.type === 'real-life' ? '<span style="background: var(--main-white); padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; color: var(--dark-violet);">Dogodek v živo</span>' : ''}
                            ${event.type === 'webinar' ? '<span style="background: var(--main-white); padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; color: var(--dark-violet);">Webinar</span>' : ''}
                            ${event.type === 'zoom' ? '<span style="background: var(--main-white); padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; color: var(--dark-violet);">Zoom klic</span>' : ''}
                        </div>
                        <div style="display: flex; gap: 20px; align-items: center; font-size: 14px; color: var(--text-light); flex-wrap: wrap;">
                            <span>🕐 ${event.time}</span>
                            ${event.type === 'real-life' ? `<span>📍 ${event.location}</span>` : ''}
                            ${event.type === 'webinar' || event.type === 'zoom' ? `
                                <a href="${ensureAbsoluteUrl(event.location)}" target="_blank" rel="noopener noreferrer" style="
                                    background: linear-gradient(135deg, var(--mid-violet) 0%, var(--dark-violet) 100%);
                                    color: var(--white);
                                    padding: 8px 20px;
                                    border-radius: 20px;
                                    font-size: 14px;
                                    font-weight: 600;
                                    text-decoration: none;
                                    display: inline-block;
                                    transition: all 0.3s ease;
                                    box-shadow: 0 2px 8px rgba(100, 56, 67, 0.3);
                                " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(100, 56, 67, 0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(100, 56, 67, 0.3)'">🔗 Odpri povezavo</a>
                            ` : ''}
                        </div>
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
    const postModal = document.getElementById('addPostModal');
    if (postModal && e.target === postModal) {
        closeAddPostModal();
    }
    
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
    
    let userData = user;
    
    // Try to get fresh data from Firestore if available
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
    
    const content = document.getElementById('profileContent');
    
    content.innerHTML = `
        <form id="profileForm" style="max-width: 600px;">
            <div style="margin-bottom: 25px;">
                <label style="display: block; font-weight: 600; color: var(--text-dark); margin-bottom: 8px;">Ime</label>
                <input type="text" id="profileName" value="${userData.name || ''}" style="
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
                <input type="email" id="profileEmail" value="${userData.email || ''}" style="
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
                <label style="display: block; font-weight: 600; color: var(--text-dark); margin-bottom: 8px;">Novo geslo</label>
                <input type="password" id="profilePassword" placeholder="Pustite prazno, če ne želite spremeniti gesla" style="
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
        </form>
    `;
}

async function saveProfile() {
    const user = getCurrentUser();
    if (!user) return;
    
    const name = document.getElementById('profileName').value.trim();
    const password = document.getElementById('profilePassword').value;
    
    if (!name) {
        alert('Prosimo, izpolnite vsa obvezna polja.');
        return;
    }
    
    try {
        // Update Firestore if available
        if (typeof db !== 'undefined' && user.userId) {
            await db.collection('users').doc(user.userId).update({
                name: name,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
        
        // Update password if provided
        if (password && typeof auth !== 'undefined' && auth.currentUser) {
            await auth.currentUser.updatePassword(password);
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
            errorMessage = 'Geslo mora biti vsaj 6 znakov dolgo.';
        } else if (error.code === 'auth/requires-recent-login') {
            errorMessage = 'Za spremembo gesla se morate znova prijaviti.';
        }
        
        alert(errorMessage);
    }
}

// handleLogout is already defined above with Firebase integration

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initDashboard();
});
