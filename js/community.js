// Community Platform JavaScript
// Structured for easy Firebase migration later

// Initialize data structures in localStorage
function initDataStructures() {
    // Initialize posts if they don't exist
    if (!localStorage.getItem('posts')) {
        const samplePosts = [
            {
                id: '1',
                title: 'Dobrodošle v skupnost Jaz Ženska!',
                author: 'Marjanca',
                authorId: 'admin',
                content: 'Dobrodošle v skupnost Jaz Ženska! Skupaj bomo rastle in se podpirale na naši poti. Ta skupnost je prostor za varno okolje, kjer se lahko izražate, delite svoje izkušnje in se učite druga od druge. Skupaj bomo gradile močno skupnost žensk, ki podpirajo druga drugo na poti osebne rasti in spremembe.',
                createdAt: new Date().toISOString(),
                likes: [],
                comments: []
            }
        ];
        localStorage.setItem('posts', JSON.stringify(samplePosts));
    }
    
    // Initialize courses if they don't exist
    if (!localStorage.getItem('courses')) {
        const sampleCourses = [
            {
                id: '1',
                title: 'Moj jutranji obred in meditacija',
                description: 'Začnite dan s pozitivno energijo in notranjo močjo.',
                duration: '30 min',
                category: 'Meditacija'
            },
            {
                id: '2',
                title: 'Vadba za lahkotnost, prožnost in vitalnost',
                description: 'Vadbe, ki vas bodo osvežile in okrepile.',
                duration: '45 min',
                category: 'Vadba'
            },
            {
                id: '3',
                title: 'Meditativni ples za sproščanje',
                description: 'Sprostite se skozi gibanje in ples.',
                duration: '40 min',
                category: 'Ples'
            }
        ];
        localStorage.setItem('courses', JSON.stringify(sampleCourses));
    }
    
    // Initialize events if they don't exist
    if (!localStorage.getItem('events')) {
        const sampleEvents = [
            {
                id: '1',
                title: 'Tedenski webinar',
                description: 'Mesečni webinar z gostjami o različnih temah.',
                date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                time: '18:00',
                location: 'Online'
            }
        ];
        localStorage.setItem('events', JSON.stringify(sampleEvents));
    }
    
    // Initialize e-books if they don't exist
    if (!localStorage.getItem('ebooks')) {
        const sampleEbooks = [
            {
                id: '1',
                title: 'Vodnik po osebni rasti',
                description: 'Poglobljen vodnik za osebno rast in razvoj.',
                pdfUrl: '',
                createdAt: new Date().toISOString()
            }
        ];
        localStorage.setItem('ebooks', JSON.stringify(sampleEbooks));
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
            case 'ebooks':
                loadEbooks();
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
function loadCommunity() {
    const user = getCurrentUser();
    const posts = JSON.parse(localStorage.getItem('posts') || '[]');
    const content = document.getElementById('communityContent');
    
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
        posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).forEach(post => {
            const likes = post.likes || [];
            const comments = post.comments || [];
            const isLiked = likes.includes(user.userId);
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

function submitPost(event) {
    event.preventDefault();
    
    const title = document.getElementById('postTitle').value.trim();
    const content = document.getElementById('postContent').value.trim();
    
    if (!title || !content) {
        alert('Prosimo, izpolnite vsa obvezna polja.');
        return;
    }
    
    const user = getCurrentUser();
    const posts = JSON.parse(localStorage.getItem('posts') || '[]');
    
    const newPost = {
        id: Date.now().toString(),
        title: title,
        author: user.name || 'Marjanca',
        authorId: user.userId,
        content: content,
        image: postImageData || null,
        createdAt: new Date().toISOString(),
        likes: [],
        comments: []
    };
    
    posts.push(newPost);
    localStorage.setItem('posts', JSON.stringify(posts));
    closeAddPostModal();
    loadCommunity();
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

function toggleLike(postId) {
    event.stopPropagation();
    const user = getCurrentUser();
    const posts = JSON.parse(localStorage.getItem('posts') || '[]');
    const post = posts.find(p => p.id === postId);
    
    if (!post) return;
    
    if (!post.likes) post.likes = [];
    
    const index = post.likes.indexOf(user.userId);
    if (index > -1) {
        post.likes.splice(index, 1);
    } else {
        post.likes.push(user.userId);
    }
    
    localStorage.setItem('posts', JSON.stringify(posts));
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

function loadComments(postId) {
    const posts = JSON.parse(localStorage.getItem('posts') || '[]');
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    
    const comments = post.comments || [];
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

function addComment(postId) {
    const input = document.getElementById(`comment-input-${postId}`);
    const content = input.value.trim();
    if (!content) return;
    
    const user = getCurrentUser();
    const posts = JSON.parse(localStorage.getItem('posts') || '[]');
    const post = posts.find(p => p.id === postId);
    
    if (!post) return;
    
    if (!post.comments) post.comments = [];
    
    post.comments.push({
        id: Date.now().toString(),
        author: user.name || user.email,
        authorId: user.userId,
        content: content,
        createdAt: new Date().toISOString()
    });
    
    localStorage.setItem('posts', JSON.stringify(posts));
    input.value = '';
    loadComments(postId);
}

// ===== CLASSROOM SECTION =====
function loadClassroom() {
    const courses = JSON.parse(localStorage.getItem('courses') || '[]');
    const content = document.getElementById('classroomContent');
    
    if (courses.length === 0) {
        content.innerHTML = '<p style="color: var(--text-light); text-align: center; padding: 40px;">Trenutno ni tečajev.</p>';
    } else {
        content.innerHTML = `<div class="courses-grid">${courses.map(course => {
            // Calculate progress
            const watched = JSON.parse(localStorage.getItem('watchedEpisodes') || '{}');
            const courseWatched = watched[course.id] || [];
            const totalEpisodes = course.episodes ? course.episodes.length : 0;
            const progress = totalEpisodes > 0 ? Math.round((courseWatched.length / totalEpisodes) * 100) : 0;
            const isCompleted = progress === 100 && totalEpisodes > 0;
            
            return `
            <div class="course-card" onclick="openCourse('${course.id}')" style="position: relative;">
                ${isCompleted ? '<div style="position: absolute; top: 15px; right: 15px; background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%); color: var(--dark-violet); padding: 5px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 2px 8px rgba(255, 215, 0, 0.5);">ZAKLJUČENO!</div>' : ''}
                <div>
                    <div class="course-title">${course.title}</div>
                    <div class="course-info">
                        <div>📚 ${course.category}</div>
                        <div>⏱️ ${course.duration}</div>
                        ${totalEpisodes > 0 ? `<div>📹 ${courseWatched.length}/${totalEpisodes} epizod</div>` : ''}
                    </div>
                </div>
                <div style="font-size: 12px; opacity: 0.8; margin-top: 15px;">Kliknite za začetek</div>
            </div>
        `;
        }).join('')}</div>`;
    }
}

function openCourse(courseId) {
    window.location.href = `course.html?id=${courseId}`;
}

// ===== E-BOOKS SECTION =====
function loadEbooks() {
    const ebooks = JSON.parse(localStorage.getItem('ebooks') || '[]');
    const content = document.getElementById('ebooksContent');
    
    let html = '';
    
    // Add ebook button for admin
    if (isAdmin()) {
        html += `
            <div style="margin-bottom: 30px;">
                <button onclick="showAddEbookModal()" style="
                    background: linear-gradient(135deg, var(--mid-violet) 0%, var(--dark-violet) 100%);
                    color: var(--white);
                    padding: 12px 30px;
                    border: none;
                    border-radius: 25px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    box-shadow: 0 4px 15px rgba(100, 56, 67, 0.3);
                ">+ Dodaj novo E-Knjigo</button>
            </div>
        `;
    }
    
    if (ebooks.length === 0) {
        html += '<p style="color: var(--text-light); text-align: center; padding: 40px;">Trenutno ni E-Knjig.</p>';
    } else {
        html += `<div class="courses-grid">${ebooks.map(ebook => `
            <div class="course-card" style="cursor: pointer;" onclick="showEbookDetails('${ebook.id}')">
                <div>
                    <div class="course-title">${ebook.title}</div>
                    <div class="course-info">
                        <div style="margin-bottom: 15px; line-height: 1.6;">${ebook.description || 'Brez opisa'}</div>
                    </div>
                </div>
            </div>
        `).join('')}</div>`;
    }
    
    content.innerHTML = html;
}

let ebookFileData = null;
let currentEbookId = null;

function showAddEbookModal() {
    document.getElementById('addEbookModalTitle').textContent = 'Nova E-Knjiga';
    document.getElementById('ebookSubmitBtn').textContent = 'Dodaj E-Knjigo';
    document.getElementById('ebookEditId').value = '';
    document.getElementById('ebookTitle').value = '';
    document.getElementById('ebookDescription').value = '';
    document.getElementById('ebookFile').value = '';
    document.getElementById('ebookFile').required = true;
    document.getElementById('ebookFilePreview').style.display = 'none';
    document.getElementById('ebookCurrentFile').style.display = 'none';
    ebookFileData = null;
    currentEbookId = null;
    document.getElementById('addEbookModal').classList.add('show');
}

function closeAddEbookModal() {
    document.getElementById('addEbookModal').classList.remove('show');
    document.getElementById('ebookFile').value = '';
    document.getElementById('ebookFilePreview').style.display = 'none';
    document.getElementById('ebookCurrentFile').style.display = 'none';
    ebookFileData = null;
    currentEbookId = null;
}

function previewEbookFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (file.type !== 'application/pdf') {
        alert('Prosimo, izberite PDF datoteko.');
        event.target.value = '';
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        ebookFileData = e.target.result;
        document.getElementById('ebookFileName').textContent = file.name;
        document.getElementById('ebookFilePreview').style.display = 'block';
    };
    reader.readAsDataURL(file);
}

function removeEbookFile() {
    document.getElementById('ebookFile').value = '';
    document.getElementById('ebookFilePreview').style.display = 'none';
    ebookFileData = null;
}

function submitEbook(event) {
    event.preventDefault();
    
    const title = document.getElementById('ebookTitle').value.trim();
    const description = document.getElementById('ebookDescription').value.trim();
    const file = document.getElementById('ebookFile').files[0];
    const editId = document.getElementById('ebookEditId').value;
    
    if (!title || !description) {
        alert('Prosimo, izpolnite vsa obvezna polja.');
        return;
    }
    
    const ebooks = JSON.parse(localStorage.getItem('ebooks') || '[]');
    
    // If editing
    if (editId) {
        const ebookIndex = ebooks.findIndex(e => e.id === editId);
        if (ebookIndex === -1) {
            alert('E-Knjiga ni najdena.');
            return;
        }
        
        const updatedEbook = {
            ...ebooks[ebookIndex],
            title: title,
            description: description
        };
        
        // Update PDF if new file is provided
        if (file) {
            if (file.type !== 'application/pdf') {
                alert('Prosimo, izberite PDF datoteko.');
                return;
            }
            
            const reader = new FileReader();
            reader.onload = function(e) {
                updatedEbook.pdfUrl = e.target.result;
                updatedEbook.fileName = file.name;
                ebooks[ebookIndex] = updatedEbook;
                localStorage.setItem('ebooks', JSON.stringify(ebooks));
                closeAddEbookModal();
                loadEbooks();
                closeEbookDetailsModal();
            };
            reader.readAsDataURL(file);
        } else {
            ebooks[ebookIndex] = updatedEbook;
            localStorage.setItem('ebooks', JSON.stringify(ebooks));
            closeAddEbookModal();
            loadEbooks();
            closeEbookDetailsModal();
        }
        return;
    }
    
    // If adding new
    if (!file) {
        alert('Prosimo, izberite PDF datoteko.');
        return;
    }
    
    if (file.type !== 'application/pdf') {
        alert('Prosimo, izberite PDF datoteko.');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const newEbook = {
            id: Date.now().toString(),
            title: title,
            description: description,
            pdfUrl: e.target.result,
            fileName: file.name,
            createdAt: new Date().toISOString()
        };
        
        ebooks.push(newEbook);
        localStorage.setItem('ebooks', JSON.stringify(ebooks));
        closeAddEbookModal();
        loadEbooks();
    };
    reader.readAsDataURL(file);
}

function showEbookDetails(ebookId) {
    const ebooks = JSON.parse(localStorage.getItem('ebooks') || '[]');
    const ebook = ebooks.find(e => e.id === ebookId);
    
    if (!ebook) {
        alert('E-Knjiga ni najdena.');
        return;
    }
    
    currentEbookId = ebookId;
    
    document.getElementById('ebookDetailsTitle').textContent = ebook.title;
    const descriptionEl = document.getElementById('ebookDetailsDescription');
    descriptionEl.textContent = ebook.description || 'Brez opisa';
    descriptionEl.style.whiteSpace = 'pre-wrap';
    
    const downloadBtn = document.getElementById('ebookDownloadBtn');
    if (ebook.pdfUrl) {
        downloadBtn.href = ebook.pdfUrl;
        downloadBtn.download = `${ebook.title}.pdf`;
        downloadBtn.style.display = 'inline-block';
    } else {
        downloadBtn.style.display = 'none';
    }
    
    // Show admin actions if admin
    const adminActions = document.getElementById('ebookAdminActions');
    if (isAdmin()) {
        adminActions.style.display = 'block';
    } else {
        adminActions.style.display = 'none';
    }
    
    document.getElementById('ebookDetailsModal').classList.add('show');
}

function editEbook() {
    if (!currentEbookId) return;
    
    const ebooks = JSON.parse(localStorage.getItem('ebooks') || '[]');
    const ebook = ebooks.find(e => e.id === currentEbookId);
    
    if (!ebook) {
        alert('E-Knjiga ni najdena.');
        return;
    }
    
    // Close details modal
    closeEbookDetailsModal();
    
    // Open edit modal
    document.getElementById('addEbookModalTitle').textContent = 'Uredi E-Knjigo';
    document.getElementById('ebookSubmitBtn').textContent = 'Shrani spremembe';
    document.getElementById('ebookEditId').value = ebook.id;
    document.getElementById('ebookTitle').value = ebook.title;
    document.getElementById('ebookDescription').value = ebook.description || '';
    document.getElementById('ebookFile').required = false;
    document.getElementById('ebookFile').value = '';
    document.getElementById('ebookFilePreview').style.display = 'none';
    
    if (ebook.fileName) {
        document.getElementById('ebookCurrentFile').textContent = `Trenutna datoteka: ${ebook.fileName}`;
        document.getElementById('ebookCurrentFile').style.display = 'block';
    } else {
        document.getElementById('ebookCurrentFile').style.display = 'none';
    }
    
    ebookFileData = null;
    document.getElementById('addEbookModal').classList.add('show');
}

function deleteEbook() {
    if (!currentEbookId) return;
    
    if (!confirm('Ali ste prepričani, da želite izbrisati to E-Knjigo?')) {
        return;
    }
    
    const ebooks = JSON.parse(localStorage.getItem('ebooks') || '[]');
    const filteredEbooks = ebooks.filter(e => e.id !== currentEbookId);
    
    localStorage.setItem('ebooks', JSON.stringify(filteredEbooks));
    closeEbookDetailsModal();
    loadEbooks();
}

function closeEbookDetailsModal() {
    document.getElementById('ebookDetailsModal').classList.remove('show');
}

// ===== CALENDAR SECTION =====
let currentCalendarDate = new Date();

function loadCalendar() {
    const user = getCurrentUser();
    const events = JSON.parse(localStorage.getItem('events') || '[]');
    const content = document.getElementById('calendarContent');
    
    let html = '<div class="calendar-wrapper">';
    
    // Add event button for admin
    if (isAdmin()) {
        html += `
            <div style="margin-bottom: 30px; display: flex; gap: 15px; flex-wrap: wrap;">
                <button onclick="showAddEventModal()" style="
                    background: linear-gradient(135deg, var(--mid-violet) 0%, var(--dark-violet) 100%);
                    color: var(--white);
                    padding: 12px 30px;
                    border: none;
                    border-radius: 25px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    box-shadow: 0 4px 15px rgba(100, 56, 67, 0.3);
                ">+ Dodaj nov dogodek</button>
                <button onclick="showAllEventsModal()" style="
                    background: var(--white);
                    color: var(--dark-violet);
                    padding: 12px 30px;
                    border: 2px solid var(--mid-violet);
                    border-radius: 25px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                ">📅 Poglej vse dogodke</button>
            </div>
        `;
    }
    
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

function showDayEvents(dateStr) {
    const events = JSON.parse(localStorage.getItem('events') || '[]');
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
                                <a href="${event.location}" target="_blank" style="
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
    
    const ebookModal = document.getElementById('addEbookModal');
    if (ebookModal && e.target === ebookModal) {
        closeAddEbookModal();
    }
    
    const ebookDetailsModal = document.getElementById('ebookDetailsModal');
    if (ebookDetailsModal && e.target === ebookDetailsModal) {
        closeEbookDetailsModal();
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

function submitEvent(event) {
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
    
    if (eventType && !location) {
        alert('Prosimo, vnesite lokacijo ali povezavo.');
        return;
    }
    
    const events = JSON.parse(localStorage.getItem('events') || '[]');
    
    if (editingId) {
        // Update existing event
        const eventIndex = events.findIndex(e => e.id === editingId);
        if (eventIndex !== -1) {
            events[eventIndex] = {
                ...events[eventIndex],
                title: title,
                description: description,
                date: new Date(date + 'T' + time).toISOString(),
                time: time,
                type: eventType,
                location: location
            };
        }
        // Clear editing ID
        document.getElementById('addEventModal').removeAttribute('data-editing-id');
        document.querySelector('#addEventModal .modal-title').textContent = 'Nov dogodek';
    } else {
        // Add new event
        const newEvent = {
            id: Date.now().toString(),
            title: title,
            description: description,
            date: new Date(date + 'T' + time).toISOString(),
            time: time,
            type: eventType,
            location: location,
            createdAt: new Date().toISOString()
        };
        
        events.push(newEvent);
    }
    
    localStorage.setItem('events', JSON.stringify(events));
    closeAddEventModal();
    loadCalendar();
}

function showAllEventsModal() {
    const events = JSON.parse(localStorage.getItem('events') || '[]');
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
                                ${event.type === 'webinar' || event.type === 'zoom' ? `<span>🔗 <a href="${event.location}" target="_blank" style="color: var(--mid-violet); text-decoration: none;">Povezava</a></span>` : ''}
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

function editEvent(eventId) {
    const events = JSON.parse(localStorage.getItem('events') || '[]');
    const event = events.find(e => e.id === eventId);
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

function deleteEvent(eventId) {
    if (!confirm('Ali ste prepričani, da želite izbrisati ta dogodek?')) {
        return;
    }
    
    const events = JSON.parse(localStorage.getItem('events') || '[]');
    const filteredEvents = events.filter(e => e.id !== eventId);
    localStorage.setItem('events', JSON.stringify(filteredEvents));
    
    // Reload calendar and close modal
    loadCalendar();
    closeAllEventsModal();
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
