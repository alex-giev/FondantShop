// Enhanced Interactive Features for Fondant Shop
// Compiled from TypeScript

class FondantShop {
    constructor() {
        this.currentSlide = 0;
        this.slideTimer = null;
        this.slides = null;
        this.dots = null;
        this.init();
    }

    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupComponents());
        } else {
            this.setupComponents();
        }
    }

    setupComponents() {
        this.setupSlideshow();
        this.setupMobileMenu();
        this.setupScrollToTop();
        this.setupFAQAccordion();
        this.setupSmoothScroll();
        this.setupFormValidation();
        this.setupAnimations();
    }

    // Slideshow Functionality
    setupSlideshow() {
        this.slides = document.querySelectorAll('.slide');
        
        if (!this.slides || this.slides.length === 0) return;

        // Create dots navigation
        const slideshowContainer = document.querySelector('.slideshow-container');
        if (slideshowContainer && !document.querySelector('.slideshow-dots')) {
            const dotsContainer = document.createElement('div');
            dotsContainer.className = 'slideshow-dots';
            
            this.slides.forEach((_, index) => {
                const dot = document.createElement('span');
                dot.className = 'dot';
                dot.addEventListener('click', () => this.goToSlide(index));
                dotsContainer.appendChild(dot);
            });
            
            slideshowContainer.appendChild(dotsContainer);
            this.dots = document.querySelectorAll('.dot');
        }

        this.showSlide(0);
        this.startSlideshow();

        // Pause on hover
        const container = document.querySelector('.slideshow-container');
        if (container) {
            container.addEventListener('mouseenter', () => this.pauseSlideshow());
            container.addEventListener('mouseleave', () => this.startSlideshow());
        }
    }

    showSlide(index) {
        if (!this.slides || this.slides.length === 0) return;

        // Hide all slides
        this.slides.forEach(slide => slide.classList.remove('active'));

        // Remove active class from all dots
        if (this.dots) {
            this.dots.forEach(dot => dot.classList.remove('active'));
        }

        // Wrap around
        if (index >= this.slides.length) {
            this.currentSlide = 0;
        } else if (index < 0) {
            this.currentSlide = this.slides.length - 1;
        } else {
            this.currentSlide = index;
        }

        // Show current slide
        this.slides[this.currentSlide].classList.add('active');
        if (this.dots && this.dots[this.currentSlide]) {
            this.dots[this.currentSlide].classList.add('active');
        }
    }

    goToSlide(index) {
        this.pauseSlideshow();
        this.showSlide(index);
        this.startSlideshow();
    }

    nextSlide() {
        this.showSlide(this.currentSlide + 1);
    }

    startSlideshow() {
        this.pauseSlideshow();
        this.slideTimer = setInterval(() => this.nextSlide(), 5000);
    }

    pauseSlideshow() {
        if (this.slideTimer) {
            clearInterval(this.slideTimer);
            this.slideTimer = null;
        }
    }

    // Mobile Menu
    setupMobileMenu() {
        let toggle = document.querySelector('.mobile-menu-toggle');
        const navLinks = document.querySelector('.nav-links');

        if (!toggle && navLinks) {
            const navbar = document.querySelector('.navbar');
            if (navbar) {
                toggle = document.createElement('div');
                toggle.className = 'mobile-menu-toggle';
                toggle.innerHTML = '<span></span><span></span><span></span>';
                navbar.appendChild(toggle);
            }
        }

        if (toggle && navLinks) {
            toggle.addEventListener('click', () => {
                navLinks.classList.toggle('active');
                toggle.classList.toggle('active');
            });
        }
    }

    // Scroll to Top Button
    setupScrollToTop() {
        let scrollBtn = document.querySelector('.scroll-to-top');
        
        if (!scrollBtn) {
            scrollBtn = document.createElement('button');
            scrollBtn.className = 'scroll-to-top';
            scrollBtn.innerHTML = '↑';
            scrollBtn.setAttribute('aria-label', 'Scroll to top');
            document.body.appendChild(scrollBtn);
        }

        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                scrollBtn.classList.add('visible');
            } else {
                scrollBtn.classList.remove('visible');
            }
        });

        scrollBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // FAQ Accordion
    setupFAQAccordion() {
        const faqQuestions = document.querySelectorAll('.faq-question');
        
        faqQuestions.forEach(question => {
            question.addEventListener('click', () => {
                const answer = question.nextElementSibling;
                const isActive = question.classList.contains('active');

                // Close all other FAQs
                document.querySelectorAll('.faq-question').forEach(q => {
                    q.classList.remove('active');
                    if (q.nextElementSibling) {
                        q.nextElementSibling.classList.remove('active');
                    }
                });

                // Toggle current FAQ
                if (!isActive) {
                    question.classList.add('active');
                    if (answer) answer.classList.add('active');
                }
            });
        });
    }

    // Smooth Scroll
    setupSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = anchor.getAttribute('href');
                if (targetId && targetId !== '#') {
                    const target = document.querySelector(targetId);
                    if (target) {
                        target.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                    }
                }
            });
        });
    }

    // Form Validation
    setupFormValidation() {
        const contactForm = document.querySelector('form');
        
        if (!contactForm) return;

        contactForm.addEventListener('submit', (e) => {
            const name = contactForm.querySelector('[name="name"]');
            const email = contactForm.querySelector('[name="email"]');
            const message = contactForm.querySelector('[name="message"]');

            if (!name || !email || !message) return;
            
            if (!name.value || !email.value || !message.value) {
                e.preventDefault();
                this.showNotification('Please fill in all required fields', 'error');
                return;
            }

            if (!this.isValidEmail(email.value)) {
                e.preventDefault();
                this.showNotification('Please enter a valid email address', 'error');
                return;
            }
        });

        // Real-time email validation
        const emailInput = contactForm.querySelector('[name="email"]');
        if (emailInput) {
            emailInput.addEventListener('blur', () => {
                if (emailInput.value && !this.isValidEmail(emailInput.value)) {
                    emailInput.style.borderColor = '#dc3545';
                } else {
                    emailInput.style.borderColor = '';
                }
            });
        }
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Intersection Observer for Animations
    setupAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        // Observe elements
        document.querySelectorAll('.product-card, .review-card, .faq-item').forEach(el => {
            observer.observe(el);
        });
    }

    // Show Notification
    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `alert alert-${type}`;
        notification.textContent = message;
        notification.style.position = 'fixed';
        notification.style.top = '20px';
        notification.style.right = '20px';
        notification.style.zIndex = '10000';
        notification.style.minWidth = '300px';
        
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Initialize the app
const fondantShop = new FondantShop();
window.fondantShop = fondantShop;
