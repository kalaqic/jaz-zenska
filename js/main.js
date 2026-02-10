// Programs section animation on scroll
function initProgramsAnimation() {
    const programsSection = document.querySelector('.programs');
    if (!programsSection) return;
    
    const programObserver = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const programCards = entry.target.querySelectorAll('.program-card');
                programCards.forEach((card, index) => {
                    card.style.animationDelay = `${index * 0.2}s`;
                    card.classList.add('animate-in');
                });
                programObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.2,
        rootMargin: '0px 0px -100px 0px'
    });
    
    programObserver.observe(programsSection);
}

// Program card click handler for mobile devices
function initProgramCardClicks() {
    const programCardWrappers = document.querySelectorAll('.program-card-wrapper');
    
    programCardWrappers.forEach(wrapper => {
        const card = wrapper.querySelector('.program-card');
        const programButton = wrapper.querySelector('.program-button');
        const cardFront = wrapper.querySelector('.program-card-front');
        const cardBack = wrapper.querySelector('.program-card-back');
        
        // Prevent button click from triggering card flip
        if (programButton) {
            programButton.addEventListener('click', function(e) {
                e.stopPropagation();
            });
        }
        
        // Add click handler to both front and back cards for mobile
        function handleCardClick(e) {
            // Only handle clicks on mobile
            if (window.innerWidth > 768) {
                return;
            }
            
            // Don't flip if clicking the button
            if (e.target.closest('.program-button')) {
                return;
            }
            
            // Toggle flip state
            wrapper.classList.toggle('mobile-flipped');
        }
        
        // Add click handlers to both sides
        if (cardFront) {
            cardFront.addEventListener('click', handleCardClick);
        }
        if (cardBack) {
            cardBack.addEventListener('click', handleCardClick);
        }
        
        // Also add to wrapper as fallback
        wrapper.addEventListener('click', handleCardClick);
    });
    
    // Reset flip state on window resize to desktop
    let resizeTimer;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function() {
            const newIsMobile = window.innerWidth <= 768;
            programCardWrappers.forEach(wrapper => {
                if (!newIsMobile) {
                    wrapper.classList.remove('mobile-flipped');
                }
            });
        }, 250);
    });
}

// Steps section animation on scroll (fade in from left to right)
function initStepsAnimation() {
    const stepsShowcase = document.querySelector('.jaz-steps-showcase');
    if (!stepsShowcase) return;
    
    const steps = stepsShowcase.querySelectorAll('.jaz-step-featured');
    
    // Check if already in view on page load
    const checkIfInView = () => {
        const rect = stepsShowcase.getBoundingClientRect();
        const isInView = rect.top < window.innerHeight && rect.bottom > 0;
        return isInView;
    };
    
    // If already in view, animate immediately
    if (checkIfInView()) {
        steps.forEach((step) => {
            step.classList.add('animate-in');
        });
    } else {
        // Otherwise, use Intersection Observer
        const stepsObserver = new IntersectionObserver(function(entries) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    steps.forEach((step) => {
                        step.classList.add('animate-in');
                    });
                    stepsObserver.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -100px 0px'
        });
        
        stepsObserver.observe(stepsShowcase);
    }
}


// API Configuration
// Production Vercel URL
// For local testing, set window.API_BASE_URL = 'http://localhost:3000' in HTML before loading this script
const API_BASE_URL = window.API_BASE_URL || 'https://jaz-zenska.vercel.app';

// Newsletter form submission with GetResponse API
// Uses backend proxy to avoid CORS issues
function handleNewsletterSubmit(event) {
    event.preventDefault();
    
    // Get form elements
    const nameInput = document.getElementById('newsletter-name');
    const emailInput = document.getElementById('newsletter-email');
    const submitBtn = document.getElementById('newsletter-submit-btn');
    const form = event.target;
    
    // Check honeypot field - if filled, it's a bot
    const honeypotField = document.getElementById('are_you_a_bot');
    if (honeypotField && honeypotField.value.trim() !== '') {
        // Bot detected - silently reject
        console.log('Bot detected via honeypot field');
        return;
    }
    
    // Get form values
    let name = nameInput ? nameInput.value.trim() : '';
    // Capitalize first letter of name
    if (name) {
        name = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
    }
    const email = emailInput ? emailInput.value.trim() : '';
    
    // Check privacy checkbox
    const privacyCheckbox = document.getElementById('newsletter-privacy-checkbox');
    if (!privacyCheckbox || !privacyCheckbox.checked) {
        alert('Prosimo, strinjajte se s politiko zasebnosti.');
        if (privacyCheckbox) privacyCheckbox.focus();
        return;
    }
    
    // Validate email
    if (!email || !email.includes('@')) {
        alert('Prosimo, vnesite veljaven email naslov.');
        if (emailInput) emailInput.focus();
        return;
    }
    
    // Validate name
    if (!name) {
        alert('Prosimo, vnesite vaše ime.');
        if (nameInput) nameInput.focus();
        return;
    }
    
    // Disable submit button to prevent multiple submissions
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Pošiljanje...';
    }
    
    // Backend API endpoint (proxy to GetResponse)
    const API_URL = `${API_BASE_URL}/api/newsletter`;
    
    // Prepare data for backend
    const requestData = {
        email: email,
        name: name,
        are_you_a_bot: honeypotField ? honeypotField.value.trim() : ''
    };
    
    // Make API request to backend proxy
    fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
    })
    .then(async response => {
        const data = await response.json();
        
        if (!response.ok) {
            // Check for specific error messages
            if (data.error && data.error.includes('already')) {
                throw new Error('Contact already exists');
            }
            throw new Error(data.error || data.message || `HTTP error! status: ${response.status}`);
        }
        
        return data;
    })
    .then(data => {
        // Success
        if (data && data.alreadyExists) {
            alert('Ta email naslov je že prijavljen na naše e-novičke. Hvala!');
        } else {
            alert('Hvala za prijavo! Uspešno ste se prijavili na naše e-novičke. Prejeli boste potrditveno e-pošto.\n\nKer imamo nov naslov obstaja možnost da bo naše sporočilo poletelo med nezazeleno pošto torej prosimo da preverite tudi tam. 🌞');
        }
        
        // Reset form
        if (form) form.reset();
        
        // Re-enable submit button
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'PRIJAVI ME';
        }
    })
    .catch(error => {
        console.error('Error submitting to newsletter:', error);
        console.error('Error details:', error);
        
        // Check if contact already exists - only show "already" message if status is 409
        // AND error message specifically says "already"
        if (error.message && error.message.includes('Contact already')) {
            alert('Ta email naslov je že prijavljen na naše e-novičke. Hvala!');
        } else {
            // Show actual error message for debugging
            let errorMsg = 'Prišlo je do napake pri prijavi. Prosimo, poskusite znova pozneje ali nas kontaktirajte neposredno.';
            if (error.message && !error.message.includes('already')) {
                errorMsg += '\n\nNapaka: ' + error.message;
            }
            alert(errorMsg);
        }
        
        // Re-enable submit button
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'PRIJAVI ME';
        }
    });
}


// Scroll animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if(entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

document.querySelectorAll('.fade-in').forEach(el => {
    observer.observe(el);
});

// Why Join Steps Animation - triggers when section comes into view
const whyJoinObserver = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if(entry.isIntersecting) {
            const steps = entry.target.querySelectorAll('.why-join-step');
            steps.forEach((step) => {
                step.classList.add('animate-in');
            });
            whyJoinObserver.unobserve(entry.target);
        }
    });
}, {
    threshold: 0.2,
    rootMargin: '0px 0px -100px 0px'
});

const whyJoinSection = document.querySelector('.why-join');
if (whyJoinSection) {
    whyJoinObserver.observe(whyJoinSection);
}

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        // Skip if href is just "#" (no target)
        if (href === '#' || href.length <= 1) {
            return; // Don't prevent default, let the link handle it
        }
        e.preventDefault();
        const target = document.querySelector(href);
        if(target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Header color change on scroll
window.addEventListener('scroll', function() {
    const header = document.querySelector('header');
    if (window.scrollY > 10) {
        header.classList.add('sticky');
    } else {
        header.classList.remove('sticky');
    }
});

// Set newsletter spacing to match footer height for perfect scroll limit
function setNewsletterSpacing() {
    const footer = document.querySelector('footer');
    const newsletter = document.querySelector('.newsletter');
    
    if (footer && newsletter) {
        const isMobile = window.innerWidth <= 768;
        
        // Temporarily show footer to measure its height
        const originalTransform = footer.style.transform;
        const originalVisibility = footer.style.visibility;
        const originalPosition = footer.style.position;
        
        footer.style.transform = 'translateY(0)';
        footer.style.visibility = 'hidden';
        footer.style.position = 'absolute';
        
        const footerHeight = footer.offsetHeight;
        
        // Restore footer
        footer.style.transform = originalTransform;
        footer.style.visibility = originalVisibility;
        footer.style.position = originalPosition;
        
        // On mobile, add extra padding to ensure footer is visible
        if (isMobile) {
            newsletter.style.marginBottom = (footerHeight + 50) + 'px';
        } else {
            // Set newsletter spacing to match footer height (slightly shorter to eliminate gap)
            newsletter.style.marginBottom = (footerHeight - 5) + 'px';
        }
    }
}

// Set testimonials spacing to match footer height for perfect scroll limit
function setTestimonialsSpacing() {
    const footer = document.querySelector('footer');
    const testimonials = document.querySelector('.testimonials-section');
    
    if (footer && testimonials) {
        const isMobile = window.innerWidth <= 768;
        
        // Temporarily show footer to measure its height
        const originalTransform = footer.style.transform;
        const originalVisibility = footer.style.visibility;
        const originalPosition = footer.style.position;
        
        footer.style.transform = 'translateY(0)';
        footer.style.visibility = 'hidden';
        footer.style.position = 'absolute';
        
        const footerHeight = footer.offsetHeight;
        
        // Restore footer
        footer.style.transform = originalTransform;
        footer.style.visibility = originalVisibility;
        footer.style.position = originalPosition;
        
        // On mobile, add extra padding to ensure footer is visible
        if (isMobile) {
            testimonials.style.marginBottom = (footerHeight + 50) + 'px';
        } else {
            // Set testimonials spacing to match footer height (slightly shorter to eliminate gap)
            testimonials.style.marginBottom = (footerHeight - 5) + 'px';
        }
    }
}

// Prevent scroll bounce/overscroll at the bottom
function preventScrollBounce() {
    // Set overscroll-behavior to auto to allow normal scrolling
    // CSS already handles this, but ensure JS doesn't override it
    document.documentElement.style.overscrollBehaviorY = 'auto';
    document.body.style.overscrollBehaviorY = 'auto';
    // IMPORTANT:
    // We allow normal scrolling. The CSS `overscroll-behavior: auto` allows
    // normal scrolling behavior while preventing unwanted bounce effects.
}


// Welcome Popup Handler

// Initialize animations on page load
// ===== BURGER MENU TOGGLE =====
function initBurgerMenu() {
    const burgerMenu = document.querySelector('.burger-menu');
    const mobileMenuOverlay = document.querySelector('.mobile-menu-overlay');
    const mobileMenuClose = document.querySelector('.mobile-menu-close');
    const mobileMenuLinks = document.querySelectorAll('.mobile-menu-overlay a');
    
    if (!burgerMenu || !mobileMenuOverlay) return;
    
    // Function to close menu
    function closeMenu() {
        burgerMenu.classList.remove('active');
        mobileMenuOverlay.classList.remove('active');
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
    }
    
    // Toggle menu
    burgerMenu.addEventListener('click', function() {
        burgerMenu.classList.toggle('active');
        mobileMenuOverlay.classList.toggle('active');
        if (mobileMenuOverlay.classList.contains('active')) {
            document.body.style.overflow = 'hidden';
            document.documentElement.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
            document.documentElement.style.overflow = '';
        }
    });
    
    // Close menu with X button
    if (mobileMenuClose) {
        mobileMenuClose.addEventListener('click', closeMenu);
    }
    
    // Close menu when clicking on a link
    mobileMenuLinks.forEach(link => {
        link.addEventListener('click', closeMenu);
    });
    
    // Close menu when clicking outside (on overlay background)
    mobileMenuOverlay.addEventListener('click', function(e) {
        if (e.target === mobileMenuOverlay) {
            closeMenu();
        }
    });
    
    // Close menu on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && mobileMenuOverlay.classList.contains('active')) {
            closeMenu();
        }
    });
}

// Media slider functionality
function initMediaSlider() {
    const slideContainers = document.querySelectorAll('.jaz-media-image, .jaz-media-image-mobile');
    
    slideContainers.forEach(container => {
        const slides = container.querySelectorAll('.jaz-media-slide');
        if (slides.length === 0) return;
        
        // Ensure first slide is active initially
        slides.forEach((slide, index) => {
            if (index === 0) {
                slide.classList.add('active');
            } else {
                slide.classList.remove('active');
            }
        });
        
        let currentSlide = 0;
        
        function showNextSlide() {
            // Remove active class from current slide
            slides[currentSlide].classList.remove('active');
            
            // Move to next slide (loop back to 0 after last slide)
            currentSlide = (currentSlide + 1) % slides.length;
            
            // Add active class to new slide
            slides[currentSlide].classList.add('active');
        }
        
        // Start the rotation - change slide every 2 seconds, loop forever
        setInterval(showNextSlide, 2000);
    });
}

document.addEventListener('DOMContentLoaded', function() {
    initBurgerMenu();
    initMediaSlider();
    initProgramCardClicks();
    // Ensure page starts at top
    window.scrollTo(0, 0);
    
    // Add fade-in class to elements
    const elements = document.querySelectorAll('.value-card, .service-card, .blog-card');
    elements.forEach((el, index) => {
        el.classList.add('fade-in');
        el.style.animationDelay = `${index * 0.1}s`;
    });
    
    // Capitalize first letter of newsletter name field (same logic as webinar form)
    const newsletterNameInput = document.getElementById('newsletter-name');
    if (newsletterNameInput) {
        newsletterNameInput.addEventListener('input', function(e) {
            const value = e.target.value;
            if (value.length > 0) {
                e.target.value = value.charAt(0).toUpperCase() + value.slice(1);
            }
        });
    }
    
    // Set newsletter spacing to match footer height
    setNewsletterSpacing();
    window.addEventListener('resize', setNewsletterSpacing);
    
    // Set testimonials spacing to match footer height
    setTestimonialsSpacing();
    window.addEventListener('resize', setTestimonialsSpacing);
    
    // Initialize scheduling system
    initSchedulingSystem();
    
    // Prevent scroll bounce
    preventScrollBounce();
    
    // Ensure scrolling is enabled on page load - ALWAYS enable scrolling
    // Only disable if a modal is actually open
    const activeModals = document.querySelectorAll('.webinar-modal-overlay.active, .mobile-menu-overlay.active, .welcome-popup-overlay.active, .event-modal.active');
    if (activeModals.length === 0) {
        // No modals are open, ensure scrolling is enabled
        document.body.style.overflow = '';
        document.body.style.overflowY = 'scroll';
        document.body.style.height = 'auto';
        document.body.style.position = 'relative';
        document.documentElement.style.overflow = '';
        document.documentElement.style.overflowY = 'scroll';
        document.documentElement.style.height = 'auto';
        document.documentElement.style.position = '';
    }
    
    // Also ensure scrolling works after a short delay (in case something else interferes)
    setTimeout(function() {
        const stillActiveModals = document.querySelectorAll('.webinar-modal-overlay.active, .mobile-menu-overlay.active, .welcome-popup-overlay.active, .event-modal.active');
        if (stillActiveModals.length === 0) {
            document.body.style.overflowY = 'scroll';
            document.documentElement.style.overflowY = 'scroll';
        }
    }, 100);
    
    // Initialize programs animation
    initProgramsAnimation();
    
    // Initialize steps animation
    initStepsAnimation();
    
    // Initialize back to top button
    initBackToTop();
    
    // Initialize event modal
    initEventModal();
    
    // Initialize footer logo scroll to top
    initFooterLogoScroll();
    
    // Initialize testimonials carousel
    initTestimonialsCarousel();
    
    // Initialize floating social media button
    initFloatingSocial();
    
    // Initialize page transition loader
});

// Back to Top Button
function initBackToTop() {
    const backToTopButton = document.getElementById('backToTop');
    
    if (!backToTopButton) return;
    
    // Show/hide button based on scroll position
    function toggleBackToTop() {
        if (window.pageYOffset > 300) {
            backToTopButton.classList.add('show');
        } else {
            backToTopButton.classList.remove('show');
        }
    }
    
    // Scroll to top function
    function scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }
    
    // Event listeners
    window.addEventListener('scroll', toggleBackToTop);
    backToTopButton.addEventListener('click', scrollToTop);
    
    // Initial check
    toggleBackToTop();
}

// Footer Logo Scroll to Top
function initFooterLogoScroll() {
    const footerLogoLink = document.getElementById('footer-logo-link');
    
    if (footerLogoLink) {
        footerLogoLink.addEventListener('click', function(e) {
            e.preventDefault();
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
}

// Floating Social Media Icons
function initFloatingSocial() {
    // No additional functionality needed - icons are always visible
}

// Page Transition Loader

// Event Modal functionality
function initEventModal() {
    const eventDetailsButton = document.getElementById('event-details-button');
    const modal = document.getElementById('event-modal');
    const closeButton = document.querySelector('.event-modal-close');
    const overlay = document.querySelector('.event-modal-overlay');
    
    if (!eventDetailsButton || !modal) return;
    
    // Open modal when clicking on "Več o dogodku" button
    eventDetailsButton.addEventListener('click', function(e) {
        e.preventDefault();
        modal.classList.add('active');
        // Don't prevent body scrolling - let the modal handle its own scroll
    });
    
    // Close modal functions
    function closeModal() {
        modal.classList.remove('active');
        // Ensure body can scroll after closing
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
    }
    
    if (closeButton) {
        closeButton.addEventListener('click', closeModal);
    }
    
    if (overlay) {
        overlay.addEventListener('click', closeModal);
    }
    
    // Close on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        }
    });
}

// Scheduling System
function initSchedulingSystem() {
    const scheduleBtn = document.getElementById('schedule-btn');
    const wrapper = document.getElementById('stik-z-nami-wrapper');
    const image = document.getElementById('stik-z-nami-image');
    const content = document.getElementById('stik-z-nami-content');
    const schedulingInterface = document.getElementById('scheduling-interface');
    const successMessage = document.getElementById('scheduling-success');
    const scheduleCallBtn = document.getElementById('schedule-call-btn');
    
    if (!scheduleBtn || !wrapper) return;
    
    // Consultation availability (hard-limited as requested)
    // Only: 16.2.2026
    const ONLY_AVAILABLE_DATE = new Date(2026, 1, 16); // months are 0-based (1 = February)
    const ONLY_AVAILABLE_DATE_STR = ONLY_AVAILABLE_DATE.toDateString();
    const AVAILABLE_TIME_SLOTS = ['09:00', '09:30', '10:00', '10:30', '11:00'];
    
    let currentDate = new Date();
    let selectedDate = null;
    let selectedTime = null;
    
    // Initialize calendar
    function initCalendar() {
        // Always show the month that contains the only available date and preselect it
        currentDate = new Date(ONLY_AVAILABLE_DATE.getFullYear(), ONLY_AVAILABLE_DATE.getMonth(), 1);
        selectedDate = new Date(ONLY_AVAILABLE_DATE);
        selectedTime = null;
        renderCalendar();
        renderTimeSlots();
        updateSelectedInfo();
    }
    
    // Render calendar
    function renderCalendar() {
        const calendarGrid = document.getElementById('calendar-grid');
        const monthYear = document.getElementById('calendar-month-year');
        if (!calendarGrid || !monthYear) return;
        
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        
        monthYear.textContent = new Date(year, month).toLocaleDateString('sl-SI', { month: 'long', year: 'numeric' });
        
        // Get first day of month and number of days
        // getDay() returns 0=Sunday, 1=Monday, etc.
        // But our calendar starts with Monday, so we need to adjust:
        // Sunday (0) should be at position 6, Monday (1) at position 0, etc.
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const firstDay = (firstDayOfMonth + 6) % 7; // Convert Sunday=0 to Sunday=6, Monday=1 to Monday=0
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today = new Date();
        
        // Clear grid
        calendarGrid.innerHTML = '';
        
        // Add day headers (Monday to Sunday)
        const dayHeaders = ['Ponedeljek', 'Torek', 'Sredo', 'Četrtek', 'Petek', 'Soboto', 'Nedeljo'];
        dayHeaders.forEach(day => {
            const header = document.createElement('div');
            header.className = 'calendar-day-header';
            header.textContent = day;
            calendarGrid.appendChild(header);
        });
        
        // Add empty cells for days before month starts
        for (let i = 0; i < firstDay; i++) {
            const empty = document.createElement('div');
            calendarGrid.appendChild(empty);
        }
        
        // Add days
        for (let day = 1; day <= daysInMonth; day++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            dayElement.textContent = day;
            
            const date = new Date(year, month, day);
            const dateStr = date.toDateString();
            const isDisabled = dateStr !== ONLY_AVAILABLE_DATE_STR;
            
            // Calculate column position (0-6, where 5 and 6 are the last two columns)
            const column = (firstDay + day - 1) % 7;
            if (column === 5 || column === 6) {
                dayElement.classList.add('weekend');
            }
            
            if (isDisabled) {
                dayElement.classList.add('disabled');
            }
            
            if (selectedDate && dateStr === selectedDate.toDateString()) {
                dayElement.classList.add('selected');
            }
            
            if (!isDisabled) {
                dayElement.addEventListener('click', () => {
                    selectedDate = date;
                    selectedTime = null;
                    renderCalendar();
                    renderTimeSlots();
                    updateSelectedInfo();
                });
            }
            
            calendarGrid.appendChild(dayElement);
        }
    }
    
    // Render time slots
    function renderTimeSlots() {
        const timeSlotsGrid = document.getElementById('time-slots-grid');
        if (!timeSlotsGrid) return;
        
        timeSlotsGrid.innerHTML = '';
        
        if (!selectedDate) {
            timeSlotsGrid.innerHTML = '<p style="grid-column: 1/-1; color: var(--dark-violet);">Izberite najprej datum</p>';
            return;
        }
        
        AVAILABLE_TIME_SLOTS.forEach(time => {
            const slot = document.createElement('div');
            slot.className = 'time-slot';
            slot.textContent = time;
            
            if (selectedTime === time) {
                slot.classList.add('selected');
            }
            
            slot.addEventListener('click', () => {
                selectedTime = time;
                renderTimeSlots();
                updateSelectedInfo();
            });
            
            timeSlotsGrid.appendChild(slot);
        });
    }
    
    // Update selected info and validate form
    function updateSelectedInfo() {
        const selectedInfo = document.getElementById('selected-info');
        const userEmailInput = document.getElementById('user-email');
        if (!selectedInfo) return;
        
        if (selectedDate && selectedTime) {
            const dateStr = selectedDate.toLocaleDateString('sl-SI', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
            selectedInfo.innerHTML = `<p><strong>Izbrano:</strong> ${dateStr} ob ${selectedTime}</p>`;
        } else if (selectedDate) {
            const dateStr = selectedDate.toLocaleDateString('sl-SI', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
            selectedInfo.innerHTML = `<p><strong>Datum:</strong> ${dateStr}</p>`;
        } else {
            selectedInfo.innerHTML = '<p>Izberite datum in uro</p>';
        }
        
        // Enable/disable schedule button based on form completion
        if (scheduleCallBtn) {
            const userEmailInput = document.getElementById('user-email');
            const userFirstNameInput = document.getElementById('user-first-name');
            const userPhoneInput = document.getElementById('user-phone');
            const hasEmail = userEmailInput && userEmailInput.value.trim() && userEmailInput.value.includes('@');
            const hasFirstName = userFirstNameInput && userFirstNameInput.value.trim();
            const hasPhone = userPhoneInput && userPhoneInput.value.trim();
            scheduleCallBtn.disabled = !(selectedDate && selectedTime && hasEmail && hasFirstName && hasPhone);
        }
    }
    
    // Add input listeners for form validation
    const userEmailInput = document.getElementById('user-email');
    const userFirstNameInput = document.getElementById('user-first-name');
    const userPhoneInput = document.getElementById('user-phone');
    
    if (userEmailInput) {
        userEmailInput.addEventListener('input', updateSelectedInfo);
    }
    if (userFirstNameInput) {
        userFirstNameInput.addEventListener('input', updateSelectedInfo);
    }
    if (userPhoneInput) {
        userPhoneInput.addEventListener('input', updateSelectedInfo);
    }
    
    // Month navigation
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    
    if (prevMonthBtn) {
        // Disabled because only one date is available
        prevMonthBtn.disabled = true;
    }
    
    if (nextMonthBtn) {
        // Disabled because only one date is available
        nextMonthBtn.disabled = true;
    }
    
    // Schedule button click
    scheduleBtn.addEventListener('click', () => {
        wrapper.classList.add('animate');
        
        setTimeout(() => {
            schedulingInterface.classList.add('active');
            initCalendar();
        }, 800);
    });
    
    // Schedule call button
    if (scheduleCallBtn) {
        scheduleCallBtn.addEventListener('click', async () => {
            if (!selectedDate || !selectedTime) return;
            
            // Get user inputs
            const userEmailInput = document.getElementById('user-email');
            const userFirstNameInput = document.getElementById('user-first-name');
            const userPhoneInput = document.getElementById('user-phone');
            
            const userEmail = userEmailInput ? userEmailInput.value.trim() : '';
            let userFirstName = userFirstNameInput ? userFirstNameInput.value.trim() : '';
            // Capitalize first letter of name
            if (userFirstName) {
                userFirstName = userFirstName.charAt(0).toUpperCase() + userFirstName.slice(1).toLowerCase();
            }
            const userPhone = userPhoneInput ? userPhoneInput.value.trim() : '';
            
            // Validate inputs
            if (!userEmail || !userEmail.includes('@')) {
                alert('Prosimo, vnesite veljaven email naslov.');
                if (userEmailInput) userEmailInput.focus();
                return;
            }
            
            if (!userFirstName) {
                alert('Prosimo, vnesite vaše ime.');
                if (userFirstNameInput) userFirstNameInput.focus();
                return;
            }
            
            // Check privacy checkbox
            const consultationPrivacyCheckbox = document.getElementById('consultation-privacy-checkbox');
            if (!consultationPrivacyCheckbox || !consultationPrivacyCheckbox.checked) {
                alert('Prosimo, strinjajte se z uporabo podatkov.');
                if (consultationPrivacyCheckbox) consultationPrivacyCheckbox.focus();
                return;
            }
            
            if (!userPhone) {
                alert('Prosimo, vnesite vašo telefonsko številko.');
                if (userPhoneInput) userPhoneInput.focus();
                return;
            }
            
            // Disable button to prevent multiple submissions
            scheduleCallBtn.disabled = true;
            scheduleCallBtn.textContent = 'Pošiljanje...';
            
            // Format date and time for GetResponse API (YYYY-MM-DDTHH:MM:SSZ in UTC)
            const year = selectedDate.getFullYear();
            const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
            const day = String(selectedDate.getDate()).padStart(2, '0');
            
            // Parse time slot (e.g., "18:00" -> hours: 18, minutes: 00)
            const [hours, minutes] = selectedTime.split(':').map(Number);
            
            // Create a Date object in local timezone
            const localDateTime = new Date(year, selectedDate.getMonth(), day, hours, minutes, 0);
            
            // Convert to UTC and format as YYYY-MM-DDTHH:MM:SSZ
            const utcYear = localDateTime.getUTCFullYear();
            const utcMonth = String(localDateTime.getUTCMonth() + 1).padStart(2, '0');
            const utcDay = String(localDateTime.getUTCDate()).padStart(2, '0');
            const utcHours = String(localDateTime.getUTCHours()).padStart(2, '0');
            const utcMinutes = String(localDateTime.getUTCMinutes()).padStart(2, '0');
            const utcSeconds = String(localDateTime.getUTCSeconds()).padStart(2, '0');
            
            const noyCaD = `${utcYear}-${utcMonth}-${utcDay}T${utcHours}:${utcMinutes}:${utcSeconds}Z`;
            
            // Get day name in Slovenian
            // Use the selected date's year, month, and day to create a fresh date object
            // This ensures we get the correct day of the week without timezone issues
            const selectedYear = selectedDate.getFullYear();
            const selectedMonth = selectedDate.getMonth();
            const selectedDay = selectedDate.getDate();
            
            // Create a date object at noon (12:00) to avoid any timezone edge cases
            const dateForDayCalculation = new Date(selectedYear, selectedMonth, selectedDay, 12, 0, 0);
            const dayNames = ['Nedeljo', 'Ponedeljek', 'Torek', 'Sredo', 'Četrtek', 'Petek', 'Soboto'];
            const dayOfWeek = dateForDayCalculation.getDay();
            const dayName = dayNames[dayOfWeek];
            
            // Debug: Log the date and day to verify
            console.log('Selected date object:', selectedDate);
            console.log('Date components - Year:', selectedYear, 'Month:', selectedMonth, 'Day:', selectedDay);
            console.log('Date for day calculation:', dateForDayCalculation);
            console.log('Day of week (0=Sunday, 1=Monday, etc.):', dayOfWeek);
            console.log('Day name:', dayName);
            
            // Backend API endpoint (proxy to GetResponse)
            const API_URL = `${API_BASE_URL}/api/consultation`;
            
            try {
                // Send to backend proxy
                const requestData = {
                    email: userEmail,
                    name: userFirstName,
                    phone: userPhone,
                    noyCaD: noyCaD, // Format: YYYY-MM-DDTHH:MM:SSZ (UTC)
                    day: dayName // Day name in Slovenian
                };
                
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestData)
                });
                
                let result;
                try {
                    result = await response.json();
                } catch (e) {
                    const text = await response.text();
                    console.error('Failed to parse response as JSON:', text);
                    alert('Prišlo je do napake pri pošiljanju. Prosimo, poskusite znova.');
                    scheduleCallBtn.disabled = false;
                    scheduleCallBtn.textContent = 'Prijavi se';
                    return;
                }
                
                console.log('API Response:', result);
                console.log('Response status:', response.status);
                
                if (!response.ok) {
                    console.error('API error:', result);
                    console.error('Full error details:', JSON.stringify(result, null, 2));
                    
                    // Check for specific error messages
                    if (result.error && result.error.includes('already')) {
                        alert('Ta email naslov je že prijavljen. Hvala!');
                    } else if (result.error) {
                        alert(`Napaka: ${result.error}. Prosimo, kontaktirajte nas direktno.`);
                    } else {
                        alert('Prišlo je do napake pri pošiljanju. Prosimo, poskusite znova.');
                    }
                    
                    scheduleCallBtn.disabled = false;
                    scheduleCallBtn.textContent = 'Prijavi se';
                    return;
                }
                
                console.log('Consultation scheduled successfully:', result);
                
                // Fade out scheduling interface
                schedulingInterface.style.transition = 'opacity 0.5s ease';
                schedulingInterface.style.opacity = '0';
                
                setTimeout(() => {
                    schedulingInterface.classList.remove('active');
                    successMessage.classList.add('active');
                }, 500);
            } catch (error) {
                console.error('Error sending to GetResponse:', error);
                alert('Prišlo je do napake pri pošiljanju. Prosimo, poskusite znova.');
                scheduleCallBtn.disabled = false;
                scheduleCallBtn.textContent = 'Prijavi se';
            }
        });
    }
    
    // Initialize
    updateSelectedInfo();
}

// ===== COOKIE BANNER =====
document.addEventListener('DOMContentLoaded', function() {
    const cookieBanner = document.getElementById('cookieBanner');
    if (!cookieBanner) return;
    
    const cookieAcceptBtn = document.getElementById('cookieAccept');
    const cookieRejectBtn = document.getElementById('cookieReject');
    const cookieSettingsBtn = document.getElementById('cookieSettings');
    
    // Check if user has already made a choice
    const cookieConsent = localStorage.getItem('cookieConsent');
    
    // Show banner only if no consent has been given
    if (!cookieConsent) {
        setTimeout(() => {
            cookieBanner.classList.add('show');
        }, 1000); // Show after 1 second delay
    }
    
    // Accept all cookies
    if (cookieAcceptBtn) {
        cookieAcceptBtn.addEventListener('click', function() {
            localStorage.setItem('cookieConsent', 'accepted');
            localStorage.setItem('cookiePreferences', JSON.stringify({
                necessary: true,
                analytics: true,
                functional: true
            }));
            hideBanner();
        });
    }
    
    // Reject all (only necessary cookies)
    if (cookieRejectBtn) {
        cookieRejectBtn.addEventListener('click', function() {
            localStorage.setItem('cookieConsent', 'rejected');
            localStorage.setItem('cookiePreferences', JSON.stringify({
                necessary: true,
                analytics: false,
                functional: false
            }));
            hideBanner();
        });
    }
    
    // Settings - show modal
    const cookieSettingsModal = document.getElementById('cookieSettingsModal');
    const cookieSettingsClose = document.getElementById('cookieSettingsClose');
    const cookieNecessary = document.getElementById('cookieNecessary');
    const cookieAnalytics = document.getElementById('cookieAnalytics');
    const cookieFunctional = document.getElementById('cookieFunctional');
    const cookieSettingsSave = document.getElementById('cookieSettingsSave');
    const cookieSettingsReject = document.getElementById('cookieSettingsReject');
    
    // Load saved preferences if they exist
    const savedPreferences = localStorage.getItem('cookiePreferences');
    if (savedPreferences) {
        try {
            const prefs = JSON.parse(savedPreferences);
            if (cookieAnalytics) cookieAnalytics.checked = prefs.analytics || false;
            if (cookieFunctional) cookieFunctional.checked = prefs.functional || false;
        } catch (e) {
            console.error('Error parsing cookie preferences:', e);
        }
    }
    
    if (cookieSettingsBtn) {
        cookieSettingsBtn.addEventListener('click', function() {
            if (cookieSettingsModal) {
                cookieSettingsModal.classList.add('active');
            }
        });
    }
    
    // Close modal
    if (cookieSettingsClose) {
        cookieSettingsClose.addEventListener('click', function() {
            if (cookieSettingsModal) {
                cookieSettingsModal.classList.remove('active');
            }
        });
    }
    
    // Close modal when clicking overlay
    if (cookieSettingsModal) {
        const overlay = cookieSettingsModal.querySelector('.cookie-settings-overlay');
        if (overlay) {
            overlay.addEventListener('click', function() {
                cookieSettingsModal.classList.remove('active');
            });
        }
    }
    
    // Reject all in settings
    if (cookieSettingsReject) {
        cookieSettingsReject.addEventListener('click', function() {
            if (cookieAnalytics) cookieAnalytics.checked = false;
            if (cookieFunctional) cookieFunctional.checked = false;
            saveCookiePreferences();
        });
    }
    
    // Save settings
    if (cookieSettingsSave) {
        cookieSettingsSave.addEventListener('click', function() {
            saveCookiePreferences();
        });
    }
    
    function saveCookiePreferences() {
        const preferences = {
            necessary: true, // Always true
            analytics: cookieAnalytics ? cookieAnalytics.checked : false,
            functional: cookieFunctional ? cookieFunctional.checked : false
        };
        
        localStorage.setItem('cookieConsent', 'settings');
        localStorage.setItem('cookiePreferences', JSON.stringify(preferences));
        
        if (cookieSettingsModal) {
            cookieSettingsModal.classList.remove('active');
        }
        
        hideBanner();
    }
    
    function hideBanner() {
        cookieBanner.classList.remove('show');
        setTimeout(() => {
            cookieBanner.style.display = 'none';
        }, 400); // Wait for animation to complete
    }
});

// Testimonials Carousel and Modal
function initTestimonialsCarousel() {
    const testimonials = [
        {
            id: 1,
            preview: 'Draga Marjanca,<br><br>Že dolgo, dolgo te poznam kot IZJEMNO ŽENSKO odprtega srca in uma, skrbna, sočutna in odgovorna ter zavzeta in vztrajna pri spoznavanju in pridobivanju novih znanj in veščin in predaji le teh naprej vsem nam...',
            full: 'Draga Marjanca,<br><br>Že dolgo, dolgo te poznam kot IZJEMNO ŽENSKO odprtega srca in uma, skrbna, sočutna in odgovorna ter zavzeta in vztrajna pri spoznavanju in pridobivanju novih znanj in veščin in predaji le teh naprej vsem nam.<br><br>Si neizmerni vir tople, sočutne, pozitivne energije, ki jo nesebično širiš naokrog.<br><br>Si motivator in aktivni vodja raznih veščin, ki prinašajo notranji mir, povezanost in odpirajo ljubeča srca.<br><br>Izjemno obvladuješ lekcije samopomoči, reikija, in aktivacije notranje moči.<br><br>Hvaležna sem ti za vse kar si delila z nami in nam je bilo v pomoč na naši poti pridobivanja notranje moči.<br><br><br>Rada te imam in vedno znova občudujem,',
            author: 'Nada'
        },
        {
            id: 2,
            preview: 'Prelisičimo možgane in naredimo spremembo je bil naslov in vsebina predavanja. Gospo Marjanco poznamo kot izjemno turistično vodičko, a je v njej tudi veliko drugih potencialov...',
            full: 'Prelisičimo možgane in naredimo spremembo je bil naslov in vsebina predavanja. Gospo Marjanco poznamo kot izjemno turistično vodičko, a je v njej tudi veliko drugih potencialov.<br><br>V prostor kjer smo poslušali predavanje je prinesla odlično, pozitivno energijo in nasmeh na obraz vseh prisotnih. Spoznali smo načine in orodja za osebno rast in lažje sprejemanje in izvajanje sprememb, ki si jih želimo. Pridobili smo nasvete kako komunicirati in se odzivati v težkih pogojih, ko se pojavijo konflikti in kako biti uspešni tudi takrat, ko imamo občutek, da ne vidimo poti naprej. Meditacija, dihanje, aktivnosti, počitek, čuječnost in ne nazadnje hvaležnost so ene izmed tehnik kako narediti spremembo v nas samih. Namesto da smo kopija preteklosti, postanimo zemljevid prihodnosti, nam med drugim pove Marjanca Trščinar Antić.<br><br>Kadar je druženje ali predavanje prijetno, čas vedno prehitro mine. Tako je bilo tudi ta večer.<br><br>Gospe Marjanci Trščinar Antić se zahvaljujemo za izjemen večer presežkov.',
            author: 'Cirila<br>DU Dolenjske Toplice'
        },
        {
            id: 3,
            preview: 'Marjanca je oseba, ki človeku v stiski stoji ob strani. Vliva pogum in optimizem, ter s svojo prisotnostjo pokaže, da ji je mar za človeka...',
            full: 'Marjanca je oseba, ki človeku v stiski stoji ob strani. Vliva pogum in optimizem, ter s svojo prisotnostjo pokaže, da ji je mar za človeka. In to je največ kar potrebuješ, ko se znajdeš v stiski sam. Hvala ti Marjanca.',
            author: 'Tanja'
        }
    ];
    
    let currentIndex = 0;
    const cards = document.querySelectorAll('.testimonial-card');
    const prevBtn = document.querySelector('.testimonial-nav-prev');
    const nextBtn = document.querySelector('.testimonial-nav-next');
    const readMoreBtns = document.querySelectorAll('.testimonial-read-more');
    const modal = document.getElementById('testimonial-modal');
    const modalOverlay = document.querySelector('.testimonial-modal-overlay');
    const modalClose = document.querySelector('.testimonial-modal-close');
    const modalText = document.querySelector('.testimonial-modal-text');
    const modalAuthor = document.querySelector('.testimonial-modal-author');
    
    if (!cards.length) return;
    
    // Show first card
    if (cards[0]) {
        cards[0].classList.add('active');
    }
    
    function showTestimonial(index) {
        cards.forEach((card, i) => {
            if (i === index) {
                card.classList.add('active');
            } else {
                card.classList.remove('active');
            }
        });
        currentIndex = index;
    }
    
    function nextTestimonial() {
        const nextIndex = (currentIndex + 1) % cards.length;
        showTestimonial(nextIndex);
    }
    
    function prevTestimonial() {
        const prevIndex = (currentIndex - 1 + cards.length) % cards.length;
        showTestimonial(prevIndex);
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', nextTestimonial);
    }
    
    if (prevBtn) {
        prevBtn.addEventListener('click', prevTestimonial);
    }
    
    // Open modal with full testimonial
    readMoreBtns.forEach((btn, index) => {
        btn.addEventListener('click', function() {
            const card = this.closest('.testimonial-card');
            const testimonialId = parseInt(card.getAttribute('data-testimonial-id'));
            const testimonial = testimonials.find(t => t.id === testimonialId);
            
            if (testimonial && modal) {
                modalText.innerHTML = testimonial.full;
                modalAuthor.innerHTML = `<span class="author-name">${testimonial.author}</span>`;
                modal.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        });
    });
    
    // Close modal
    function closeModal() {
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }
    
    if (modalClose) {
        modalClose.addEventListener('click', closeModal);
    }
    
    if (modalOverlay) {
        modalOverlay.addEventListener('click', closeModal);
    }
    
    // Close on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal && modal.classList.contains('active')) {
            closeModal();
        }
    });
}
