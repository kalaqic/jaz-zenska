# Jaz Ženska - Website

A modern, single-page website for **Jaz Ženska** (I am Woman), a Slovenian women's empowerment and personal growth platform. The website showcases transformational programs, workshops, coaching services, and products designed to help women discover their inner strength and authentic identity.

## 📋 Project Overview

This is a static website built with vanilla HTML, CSS, and JavaScript. It serves as the main landing page for the Jaz Ženska platform, featuring information about:

- **Women's Empowerment Programs**: Academy programs, workshops, and rituals
- **Coaching Services**: Individual, couples, and corporate coaching
- **Educational Content**: Blog posts, meditations, and resources
- **E-commerce**: Shop section for books, journals, and products
- **Community**: Newsletter signup and social media integration

## 🏗️ Project Structure

```
jaz-zenska/
├── index.html              # Main HTML file (single-page application)
├── css/                    # Stylesheets directory
│   ├── main.css           # Primary stylesheet (consolidated styles)
│   ├── styles.css         # Base styles and CSS variables
│   ├── header.css         # Header component styles
│   ├── footer.css         # Footer component styles
│   ├── hero.css           # Hero section styles
│   ├── top-bar.css        # Top navigation bar styles
│   ├── why-join.css       # "Why Join" section styles
│   ├── services.css       # Services section styles
│   ├── media.css          # Media section styles
│   ├── book.css           # Book section styles
│   ├── blog.css           # Blog section styles
│   ├── shop.css           # Shop section styles
│   ├── newsletter.css     # Newsletter section styles
│   ├── quote.css          # Quote/testimonials styles
│   └── utilities.css      # Utility classes
├── js/
│   └── main.js            # Main JavaScript file
├── images/                 # Images directory
│   ├── logo/              # Logo files
│   │   └── logo jaz zenska.png    # Main logo image
│   └── svg/               # SVG icons
│       ├── facebook.svg   # Facebook icon
│       ├── instagram.svg  # Instagram icon
│       ├── linkedin.svg   # LinkedIn icon
│       └── youtube.svg    # YouTube icon
```

## 🎨 Design System

### Color Palette

The website uses a sophisticated violet/pink color scheme defined in CSS variables:

```css
--dark-violet: #643843
--mid-violet: #99627A
--pinky: #C88EA7
--almost-white: #E7CBCB
--main-white: #fff6f9
--hero-light: #f8f0f2
--text-dark: #3a3a3a
--text-light: #666
--white: #ffffff
```

### Typography

- **Headings**: Playfair Display (serif) - elegant, feminine
- **Body Text**: Montserrat (sans-serif) - modern, readable
- Both fonts are loaded from Google Fonts

## 🚀 Features

### 1. **Navigation**
- Sticky header that changes on scroll
- Top bar with quick links
- Smooth scrolling navigation
- Mobile-responsive menu

### 2. **Hero Section**
- Split-screen design (50/50 layout)
- Call-to-action button
- Responsive design (stacks on mobile)

### 3. **Services Section**
- Tabbed interface with three categories:
  - **ŽENSKE** (Women): Academy, workshops, rituals
  - **POSAMEZNIKI ALI PARI** (Individuals or Couples): Coaching, meditations, communication workshops
  - **PODJETJA / ORGANIZACIJE** (Companies/Organizations): Corporate workshops, team building
- Dynamic content switching via JavaScript

### 4. **Media Section**
- YouTube channel integration
- Facebook Live event promotion
- Responsive card layout

### 5. **Book Section**
- Featured book "Moja pot" (My Path)
- Rotating book cover animation
- Purchase CTA

### 6. **Blog Section**
- Latest blog posts display
- Card-based layout
- Fade-in animations on scroll

### 7. **Testimonials**
- Auto-scrolling carousel
- Multiple testimonial cards
- Smooth scroll behavior

### 8. **Shop Section**
- Product cards with pricing
- Add to cart functionality (basic implementation)
- Shopping cart icon (fixed position)

### 9. **Newsletter**
- Multi-step form (name, surname, email)
- Form validation
- Privacy policy note

### 10. **Interactive Elements**
- Scroll-triggered animations
- Hover effects on cards and buttons
- Tab switching functionality
- Cart counter updates

## 💻 Technologies Used

- **HTML5**: Semantic markup
- **CSS3**: 
  - CSS Variables for theming
  - Flexbox and Grid layouts
  - CSS animations and transitions
  - Media queries for responsiveness
- **JavaScript (Vanilla)**:
  - DOM manipulation
  - Event handling
  - Intersection Observer API (for scroll animations)
  - Tab switching logic
  - Cart functionality

## 📱 Responsive Design

The website is fully responsive with breakpoints at:
- **Desktop**: 1200px+ (full layout)
- **Tablet**: 768px - 1199px (adjusted grid layouts)
- **Mobile**: < 768px (single column, stacked elements)

Key responsive features:
- Navigation menu adapts to mobile
- Grid layouts switch to single column
- Hero section stacks vertically
- Forms adjust to full width
- Touch-friendly button sizes

## 🔧 Setup & Usage

### Local Development

1. **Clone or download the repository**
   ```bash
   cd jaz-zenska
   ```

2. **Open in browser**
   - Simply open `index.html` in a modern web browser
   - Or use a local server:
     ```bash
     # Using Python 3
     python -m http.server 8000
     
     # Using Node.js (http-server)
     npx http-server
     
     # Using PHP
     php -S localhost:8000
     ```

3. **Access the website**
   - Navigate to `http://localhost:8000` (or your chosen port)

### File Organization Notes

- **CSS**: While multiple CSS files exist in the `css/` directory, the main stylesheet (`main.css`) contains consolidated styles. The individual component CSS files may be legacy files or used for modular organization.
- **JavaScript**: All interactive functionality is in `js/main.js`
- **Images**: 
  - Logo files are organized in `images/logo/`
  - SVG icons (social media) are organized in `images/svg/`
  - This structure keeps assets organized and maintainable

## 🎯 Key JavaScript Functions

### `showTab(tabName)`
Switches between service category tabs (women, couples, organizations)

### `scrollTestimonials(direction)`
Scrolls the testimonials carousel horizontally

### `handleNewsletterSubmit(event)`
Handles newsletter form submission (currently shows alert)

### `toggleCart()`
Opens/closes shopping cart (basic implementation)

### Scroll Animations
Uses Intersection Observer API to trigger fade-in animations when elements enter viewport

## 🌐 Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- CSS Grid and Flexbox support required
- JavaScript ES6+ features used

## 📝 Content Language

All content is in **Slovenian** (Slovene), including:
- Navigation labels
- Section headings
- Button text
- Form placeholders
- Blog content

## 🔮 Future Enhancements

Potential areas for improvement:
- Backend integration for newsletter signups
- E-commerce functionality (payment processing)
- Blog CMS integration
- User account system
- Online course platform integration
- Multi-language support

## 📄 License

Copyright © 2024 Jaz Ženska. All rights reserved.

## 📧 Contact

- **Email**: info@jazzenska.si
- **Location**: Ljubljana, Slovenia
- **Social Media**: Facebook, Instagram, LinkedIn, YouTube

---

**Created with ❤ for all women**

