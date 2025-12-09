// Tab switching functionality
function showTab(tabName) {
    // Hide all tab contents
    const allTabs = document.querySelectorAll('.tab-content');
    allTabs.forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active class from all buttons
    const allButtons = document.querySelectorAll('.tab-button');
    allButtons.forEach(button => {
        button.classList.remove('active');
    });
    
    // Show selected tab content
    const selectedTab = document.getElementById(tabName);
    if(selectedTab) {
        selectedTab.classList.add('active');
    }
    
    // Activate the matching tab button by data attribute (safer than relying on event)
    const activeButton = document.querySelector(`.tab-button[data-tab="${tabName}"]`);
    if (activeButton) activeButton.classList.add('active');

    // Show corresponding package info (if present)
    const packageInfo = document.getElementById(tabName + '-packages');
    if(packageInfo) {
        packageInfo.classList.add('active');
    }
}

// Testimonials carousel scrolling
function scrollTestimonials(direction) {
    const track = document.querySelector('.testimonials-track');
    if (track) {
        const cardWidth = track.querySelector('.testimonial-card').offsetWidth + 20;
        track.scrollBy({
            left: direction * cardWidth,
            behavior: 'smooth'
        });
    }
}

// Testimonials carousel auto-scroll
let autoScrollInterval = null;

function startAutoScroll() {
    autoScrollInterval = setInterval(() => {
        scrollTestimonials(1);
    }, 4000);
}

// Newsletter form submission
function handleNewsletterSubmit(event) {
    event.preventDefault();
    alert('Hvala za prijavo! Prejeli boste potrditveno e-pošto.');
}

// Cart functionality
let cartItems = 0;

function toggleCart() {
    alert('Košarica je trenutno prazna');
}

// Add to cart functionality for product buttons
document.querySelectorAll('.product-button').forEach(button => {
    button.addEventListener('click', function() {
        cartItems++;
        document.querySelector('.cart-count').textContent = cartItems;
        this.textContent = 'DODANO ✓';
        setTimeout(() => {
            if(this.textContent === 'DODANO ✓') {
                this.textContent = this.textContent.includes('KOŠARICO') ? 'DODAJ V KOŠARICO' : 'IZBERITE MOŽNOSTI';
            }
        }, 2000);
    });
});

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
        
        // Set newsletter spacing to match footer height (slightly shorter to eliminate gap)
        newsletter.style.marginBottom = (footerHeight - 5) + 'px';
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
    
    // Prevent touch overscroll on mobile
    let touchStartY = 0;
    
    document.addEventListener('touchstart', function(e) {
        touchStartY = e.touches[0].clientY;
    }, { passive: true });
    
    document.addEventListener('touchmove', function(e) {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        const maxScroll = documentHeight - windowHeight;
        const touchY = e.touches[0].clientY;
        const deltaY = touchStartY - touchY;
        
        // Prevent scrolling down when at bottom, or scrolling up when at top
        if ((scrollTop >= maxScroll && deltaY < 0) || (scrollTop <= 0 && deltaY > 0)) {
            e.preventDefault();
        }
        
        touchStartY = touchY;
    }, { passive: false });
}

// Initialize animations on page load
document.addEventListener('DOMContentLoaded', function() {
    // Add fade-in class to elements
    const elements = document.querySelectorAll('.value-card, .service-card, .blog-card');
    elements.forEach((el, index) => {
        el.classList.add('fade-in');
        el.style.animationDelay = `${index * 0.1}s`;
    });
    
    // Start testimonials auto-scroll
    startAutoScroll();
    
    // Set newsletter spacing to match footer height
    setNewsletterSpacing();
    window.addEventListener('resize', setNewsletterSpacing);
    
    // Prevent scroll bounce
    preventScrollBounce();
});
