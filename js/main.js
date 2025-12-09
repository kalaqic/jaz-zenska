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
});
