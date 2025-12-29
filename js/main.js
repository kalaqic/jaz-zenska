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


// Newsletter form submission
function handleNewsletterSubmit(event) {
    event.preventDefault();
    alert('Hvala za prijavo! Prejeli boste potrditveno e-pošto.');
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
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
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
    let ticking = false;
    
    window.addEventListener('scroll', function() {
        if (ticking) return;
        
        ticking = true;
        requestAnimationFrame(function() {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const windowHeight = window.innerHeight;
            const documentHeight = Math.max(
                document.body.scrollHeight,
                document.body.offsetHeight,
                document.documentElement.clientHeight,
                document.documentElement.scrollHeight,
                document.documentElement.offsetHeight
            );
            const maxScroll = documentHeight - windowHeight;
            
            // If scrolled past the maximum (with tiny tolerance), snap back
            if (scrollTop > maxScroll + 1) {
                window.scrollTo({
                    top: maxScroll,
                    behavior: 'auto'
                });
            }
            
            ticking = false;
        });
    }, { passive: true });
    
    // Prevent touch overscroll on mobile - only at the very edges
    // Disabled for now to allow normal scrolling
    // The CSS overscroll-behavior: contain should handle bounce prevention
}

// Loading Screen Handler
function initLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    const body = document.body;
    
    if (loadingScreen) {
        // Prevent scrolling while loading
        body.classList.add('loading');
        
        // Hide loading screen after 5 seconds
        setTimeout(function() {
            loadingScreen.classList.add('fade-out');
            
            // Remove from DOM and re-enable scrolling after fade-out completes
            setTimeout(function() {
                loadingScreen.style.display = 'none';
                body.classList.remove('loading');
                // Show welcome popup after loading screen
                initWelcomePopup();
            }, 800); // Match CSS transition duration
        }, 5000); // Show for 5 seconds
    } else {
        // If no loading screen, show popup immediately
        initWelcomePopup();
    }
}

// Welcome Popup Handler
function initWelcomePopup() {
    const welcomePopup = document.getElementById('welcomePopup');
    const welcomePopupClose = document.getElementById('welcomePopupClose');
    const body = document.body;
    
    if (!welcomePopup) return;
    
    // Show popup after a short delay
    setTimeout(function() {
        welcomePopup.classList.add('active');
        // Only prevent body scroll on desktop, not mobile
        if (window.innerWidth > 768) {
            body.style.overflow = 'hidden';
        }
    }, 500);
    
    // Close popup function
    function closePopup() {
        welcomePopup.classList.remove('active');
        body.style.overflow = '';
    }
    
    // Close button
    if (welcomePopupClose) {
        welcomePopupClose.addEventListener('click', closePopup);
    }
    
    // Close on overlay click
    welcomePopup.addEventListener('click', function(e) {
        if (e.target === welcomePopup) {
            closePopup();
        }
    });
    
    // Close on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && welcomePopup.classList.contains('active')) {
            closePopup();
        }
    });
}

// Initialize loading screen immediately
initLoadingScreen();

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
    }
    
    // Toggle menu
    burgerMenu.addEventListener('click', function() {
        burgerMenu.classList.toggle('active');
        mobileMenuOverlay.classList.toggle('active');
        document.body.style.overflow = mobileMenuOverlay.classList.contains('active') ? 'hidden' : '';
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

document.addEventListener('DOMContentLoaded', function() {
    initBurgerMenu();
    // Ensure page starts at top
    window.scrollTo(0, 0);
    
    // Add fade-in class to elements
    const elements = document.querySelectorAll('.value-card, .service-card, .blog-card');
    elements.forEach((el, index) => {
        el.classList.add('fade-in');
        el.style.animationDelay = `${index * 0.1}s`;
    });
    
    // Set newsletter spacing to match footer height
    setNewsletterSpacing();
    window.addEventListener('resize', setNewsletterSpacing);
    
    // Set testimonials spacing to match footer height
    setTestimonialsSpacing();
    window.addEventListener('resize', setTestimonialsSpacing);
    
    // Prevent scroll bounce
    preventScrollBounce();
    
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
    
    // Initialize floating social media button
    initFloatingSocial();
    
    // Initialize page transition loader
    initPageTransitionLoader();
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
function initPageTransitionLoader() {
    const pageTransitionLoader = document.getElementById('pageTransitionLoader');
    if (!pageTransitionLoader) return;
    
    // Hide loader when page finishes loading (with a small delay for smooth transition)
    function hideLoader() {
        setTimeout(function() {
            pageTransitionLoader.classList.remove('active');
        }, 300);
    }
    
    // Hide loader on page load
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        hideLoader();
    } else {
        window.addEventListener('load', hideLoader);
        document.addEventListener('DOMContentLoaded', hideLoader);
    }
    
    // Get all internal links (links to other pages on the site)
    const internalLinks = document.querySelectorAll('a[href]');
    
    internalLinks.forEach(link => {
        const href = link.getAttribute('href');
        
        // Skip external links, anchor links, and links with target="_blank"
        if (!href) return;
        if (href.startsWith('#')) return;
        if (link.getAttribute('target') === '_blank') return;
        if (href.startsWith('http') && !href.includes(window.location.hostname)) return;
        
        // Check if it's an internal page link
        const isInternalPage = href.endsWith('.html') || 
                               href.startsWith('/') || 
                               href.startsWith('./') || 
                               href.startsWith('../') ||
                               (!href.startsWith('http') && !href.startsWith('mailto:') && !href.startsWith('tel:'));
        
        if (isInternalPage) {
            link.addEventListener('click', function(e) {
                // Show loader immediately
                pageTransitionLoader.classList.add('active');
                
                // Store in sessionStorage so new page knows to show loader
                sessionStorage.setItem('showPageLoader', 'true');
            });
        }
    });
    
    // Show loader if coming from another page
    if (sessionStorage.getItem('showPageLoader') === 'true') {
        pageTransitionLoader.classList.add('active');
        sessionStorage.removeItem('showPageLoader');
    }
}

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
        document.body.style.overflow = 'hidden';
    });
    
    // Close modal functions
    function closeModal() {
        modal.classList.remove('active');
        document.body.style.overflow = '';
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
