// Course Detail Page JavaScript

// Initialize course data structure
function initCourseData() {
    const courses = JSON.parse(localStorage.getItem('courses') || '[]');
    
    // Add episodes to courses if they don't have them
    courses.forEach(course => {
        if (!course.episodes || course.episodes.length === 0) {
            course.episodes = [
                {
                    id: '1',
                    title: 'Uvod v tečaj',
                    description: 'Spoznajte osnove in začnite svojo pot.',
                    videoUrl: '',
                    duration: '10 min'
                },
                {
                    id: '2',
                    title: 'Glavna vsebina',
                    description: 'Poglobljeno delo z vsebino tečaja.',
                    videoUrl: '',
                    duration: '20 min'
                }
            ];
        }
    });
    
    localStorage.setItem('courses', JSON.stringify(courses));
}

// Get course ID from URL
function getCourseId() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

// Load course
async function loadCourse() {
    const courseId = getCourseId();
    if (!courseId) {
        window.location.href = 'dashboard.html';
        return;
    }
    
    let course = null;
    
    // Try to load from Firestore first
    try {
        if (typeof db !== 'undefined') {
            const courseDoc = await db.collection('courses').doc(courseId).get();
            
            if (courseDoc.exists) {
                const data = courseDoc.data();
                course = {
                    id: courseDoc.id,
                    title: data.title,
                    description: data.description,
                    episodes: data.episodes || [],
                    progress: data.progress || 0,
                    completed: data.completed || false
                };
                
                // Update localStorage cache
                const courses = JSON.parse(localStorage.getItem('courses') || '[]');
                const courseIndex = courses.findIndex(c => c.id === courseId);
                if (courseIndex !== -1) {
                    courses[courseIndex] = course;
                } else {
                    courses.push(course);
                }
                localStorage.setItem('courses', JSON.stringify(courses));
                console.log('Loaded course from Firestore');
            }
        }
    } catch (error) {
        console.error('Error loading course from Firestore:', error);
    }
    
    // Fallback to localStorage
    if (!course) {
        initCourseData();
        const courses = JSON.parse(localStorage.getItem('courses') || '[]');
        course = courses.find(c => c.id === courseId);
    }
    
    if (!course) {
        window.location.href = 'dashboard.html';
        return;
    }
    
    // Set header title
    document.getElementById('courseHeaderTitle').textContent = course.title;
    
    // Load episodes
    loadEpisodes(course);
    
    // Update progress
    updateCourseProgress(courseId);
    
    // Load first episode content
    if (course.episodes && course.episodes.length > 0) {
        loadEpisodeContent(course.episodes[0].id, course);
    }
}

// Get watched episodes for a course
async function getWatchedEpisodes(courseId) {
    const user = getCurrentUser();
    if (!user || !user.userId) {
        // Fallback to localStorage
        const watched = JSON.parse(localStorage.getItem('watchedEpisodes') || '{}');
        return watched[courseId] || [];
    }
    
    try {
        // Try to get from Firestore
        if (typeof db !== 'undefined') {
            const progressDoc = await db.collection('userProgress').doc(`${user.userId}_${courseId}`).get();
            
            if (progressDoc.exists) {
                const data = progressDoc.data();
                const watchedEpisodes = data.watchedEpisodes || [];
                
                // Cache in localStorage
                const watched = JSON.parse(localStorage.getItem('watchedEpisodes') || '{}');
                watched[courseId] = watchedEpisodes;
                localStorage.setItem('watchedEpisodes', JSON.stringify(watched));
                
                return watchedEpisodes;
            }
        }
    } catch (error) {
        console.error('Error loading watched episodes from Firestore:', error);
    }
    
    // Fallback to localStorage
    const watched = JSON.parse(localStorage.getItem('watchedEpisodes') || '{}');
    return watched[courseId] || [];
}

// Mark episode as watched/unwatched
async function toggleEpisodeWatched(courseId, episodeId, isWatched) {
    const user = getCurrentUser();
    if (!user || !user.userId) {
        // Fallback to localStorage only
        const watched = JSON.parse(localStorage.getItem('watchedEpisodes') || '{}');
        if (!watched[courseId]) {
            watched[courseId] = [];
        }
        
        if (isWatched) {
            if (!watched[courseId].includes(episodeId)) {
                watched[courseId].push(episodeId);
            }
        } else {
            watched[courseId] = watched[courseId].filter(id => id !== episodeId);
        }
        
        localStorage.setItem('watchedEpisodes', JSON.stringify(watched));
        updateCourseProgress(courseId);
        return;
    }
    
    // Get current watched episodes
    const currentWatched = await getWatchedEpisodes(courseId);
    let newWatched = [...currentWatched];
    
    if (isWatched) {
        if (!newWatched.includes(episodeId)) {
            newWatched.push(episodeId);
        }
    } else {
        newWatched = newWatched.filter(id => id !== episodeId);
    }
    
    // Update localStorage cache
    const watched = JSON.parse(localStorage.getItem('watchedEpisodes') || '{}');
    watched[courseId] = newWatched;
    localStorage.setItem('watchedEpisodes', JSON.stringify(watched));
    
    // Save to Firestore
    try {
        if (typeof db !== 'undefined') {
            const courses = JSON.parse(localStorage.getItem('courses') || '[]');
            const course = courses.find(c => c.id === courseId);
            const totalEpisodes = course?.episodes?.length || 0;
            const progress = totalEpisodes > 0 ? Math.round((newWatched.length / totalEpisodes) * 100) : 0;
            
            await db.collection('userProgress').doc(`${user.userId}_${courseId}`).set({
                userId: user.userId,
                courseId: courseId,
                watchedEpisodes: newWatched,
                progress: progress,
                completed: progress === 100,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        }
    } catch (error) {
        console.error('Error saving course progress to Firestore:', error);
    }
    
    updateCourseProgress(courseId);
    
    // Update checkbox if it exists
    const checkbox = document.querySelector(`input[onclick*="${episodeId}"]`);
    if (checkbox) {
        checkbox.checked = isWatched;
    }
    
    // Update episode item styling
    const episodeItem = document.querySelector(`[data-episode-id="${episodeId}"]`);
    if (episodeItem) {
        if (isWatched) {
            episodeItem.classList.add('watched');
        } else {
            episodeItem.classList.remove('watched');
        }
    }
}

// Calculate and update course progress
async function updateCourseProgress(courseId) {
    const courses = JSON.parse(localStorage.getItem('courses') || '[]');
    const course = courses.find(c => c.id === courseId);
    if (!course || !course.episodes) return;
    
    const watched = await getWatchedEpisodes(courseId);
    const totalEpisodes = course.episodes.length;
    const watchedCount = watched.length;
    const progress = totalEpisodes > 0 ? Math.round((watchedCount / totalEpisodes) * 100) : 0;
    
    // Update progress bar
    const progressBar = document.getElementById('progressBar');
    const progressPercentage = document.getElementById('progressPercentage');
    if (progressBar) {
        progressBar.style.width = progress + '%';
    }
    if (progressPercentage) {
        progressPercentage.textContent = progress + '%';
    }
    
    // Update course completion status
    course.progress = progress;
    course.completed = progress === 100;
    localStorage.setItem('courses', JSON.stringify(courses));
    
    return progress;
}

// Load episodes list
async function loadEpisodes(course) {
    const episodesList = document.getElementById('episodesList');
    const courseId = course.id;
    const watched = await getWatchedEpisodes(courseId);
    
    if (!course.episodes || course.episodes.length === 0) {
        episodesList.innerHTML = '<p style="color: var(--text-light); text-align: center; padding: 20px;">Ni epizod.</p>';
        return;
    }
    
    episodesList.innerHTML = course.episodes.map((episode, index) => {
        const isWatched = watched.includes(episode.id);
        return `
            <div class="episode-item ${isWatched ? 'watched' : ''}" onclick="loadEpisodeContent('${episode.id}', null, this)" data-episode-id="${episode.id}">
                <input type="checkbox" class="episode-checkbox" ${isWatched ? 'checked' : ''} onclick="event.stopPropagation(); toggleEpisodeWatched('${courseId}', '${episode.id}', this.checked); const course = getCurrentCourse(); if (course) loadEpisodes(course);" />
                <div class="episode-content">
                    <div class="episode-number">Epizoda ${index + 1}</div>
                    <div class="episode-title">${episode.title}</div>
                </div>
            </div>
        `;
    }).join('');
    
    // Update progress
    await updateCourseProgress(courseId);
}

// Get current course
function getCurrentCourse() {
    const courseId = getCourseId();
    if (!courseId) return null;
    
    const courses = JSON.parse(localStorage.getItem('courses') || '[]');
    return courses.find(c => c.id === courseId);
}

// Load episode content
function loadEpisodeContent(episodeId, course = null, element = null) {
    if (!course) {
        const courseId = getCourseId();
        const courses = JSON.parse(localStorage.getItem('courses') || '[]');
        course = courses.find(c => c.id === courseId);
    }
    
    if (!course || !course.episodes) return;
    
    const episode = course.episodes.find(e => e.id === episodeId);
    if (!episode) return;
    
    // Update active episode
    if (element) {
        document.querySelectorAll('.episode-item').forEach(item => {
            item.classList.remove('active');
        });
        element.classList.add('active');
    } else {
        document.querySelectorAll('.episode-item').forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-episode-id') === episodeId) {
                item.classList.add('active');
            }
        });
    }
    
    // Check if this is the last episode
    const episodeIndex = course.episodes.findIndex(e => e.id === episodeId);
    const isLastEpisode = episodeIndex === course.episodes.length - 1;
    const nextEpisode = !isLastEpisode ? course.episodes[episodeIndex + 1] : null;
    
    // Check if current episode is watched
    const watched = await getWatchedEpisodes(course.id);
    const isWatched = watched.includes(episodeId);
    
    // Load content
    const contentArea = document.getElementById('courseContentArea');
    contentArea.innerHTML = `
        <div class="course-content-title">${episode.title}</div>
        <div class="course-video">
            ${episode.videoUrl ? `<iframe src="${episode.videoUrl}" frameborder="0" allowfullscreen style="width: 100%; height: 100%;"></iframe>` : 'Video bo kmalu na voljo'}
        </div>
        <div class="course-description">${episode.description || 'Opis epizode bo kmalu na voljo.'}</div>
        <div class="episode-actions">
            ${!isLastEpisode ? `
                <button class="next-episode-btn" onclick="markAsWatchedAndNext('${course.id}', '${episodeId}', '${nextEpisode.id}')">
                    ✓ Označi kot ogledano in pojdi na naslednjo epizodo →
                </button>
            ` : `
                <button class="finish-course-btn" onclick="finishCourse('${course.id}', '${episodeId}')">
                    🎉 Zaključi ta tečaj
                </button>
            `}
        </div>
    `;
}

async function markAsWatchedAndNext(courseId, currentEpisodeId, nextEpisodeId) {
    // Mark current episode as watched
    await toggleEpisodeWatched(courseId, currentEpisodeId, true);
    
    // Update checkbox in episodes list
    const currentCheckbox = document.querySelector(`input[onclick*="${currentEpisodeId}"]`);
    if (currentCheckbox) {
        currentCheckbox.checked = true;
    }
    
    // Update episode item styling
    const currentEpisodeItem = document.querySelector(`[data-episode-id="${currentEpisodeId}"]`);
    if (currentEpisodeItem) {
        currentEpisodeItem.classList.add('watched');
    }
    
    // Reload episodes list to update styling
    const course = getCurrentCourse();
    if (course) {
        await loadEpisodes(course);
        
        // Load next episode
        setTimeout(() => {
            const nextEpisodeElement = document.querySelector(`[data-episode-id="${nextEpisodeId}"]`);
            if (nextEpisodeElement) {
                loadEpisodeContent(nextEpisodeId, course, nextEpisodeElement);
            }
        }, 100);
    }
}

async function finishCourse(courseId, episodeId) {
    // Mark last episode as watched
    await toggleEpisodeWatched(courseId, episodeId, true);
    
    // Update checkbox in episodes list
    const currentCheckbox = document.querySelector(`input[onclick*="${episodeId}"]`);
    if (currentCheckbox) {
        currentCheckbox.checked = true;
    }
    
    // Update episode item styling
    const currentEpisodeItem = document.querySelector(`[data-episode-id="${episodeId}"]`);
    if (currentEpisodeItem) {
        currentEpisodeItem.classList.add('watched');
    }
    
    // Reload episodes list to update styling
    const course = getCurrentCourse();
    if (course) {
        await loadEpisodes(course);
    }
    
    // Show congratulations popup
    showCongratulationsPopup();
}

function showCongratulationsPopup() {
    const popup = document.createElement('div');
    popup.className = 'congratulations-popup';
    popup.innerHTML = `
        <div class="congratulations-content">
            <div class="congratulations-icon">🎉</div>
            <h2 class="congratulations-title">Čestitamo!</h2>
            <p class="congratulations-message">Uspešno ste zaključili ta tečaj!</p>
            <a href="dashboard.html" class="congratulations-btn">Nazaj na domačo stran</a>
        </div>
    `;
    document.body.appendChild(popup);
    
    // Remove popup when clicking outside
    popup.addEventListener('click', function(e) {
        if (e.target === popup) {
            popup.remove();
        }
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    loadCourse();
});
