// Enhanced Interactive Features for Fondant Shop

interface Product {
    title: string;
    price: string;
    link: string;
    image_url: string;
}

class FondantShop {
    private currentSlide: number = 0;
    private slideTimer: number | null = null;
    private slides: NodeListOf<Element> | null = null;
    private dots: NodeListOf<Element> | null = null;

    constructor() {
        this.init();
    }

    private init(): void {
        // Initialize when DOM is loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupComponents());
        } else {
            this.setupComponents();
        }
    }

    private setupComponents(): void {
        this.setupSlideshow();
        this.setupMobileMenu();
        this.setupScrollToTop();
        this.setupFAQAccordion();
        this.setupSmoothScroll();
        this.setupFormValidation();
        this.setupProductFilters();
        this.setupAnimations();
    }

    // Slideshow Functionality
    private setupSlideshow(): void {
        this.slides = document.querySelectorAll('.slide');
        
        if (!this.slides || this.slides.length === 0) return;

        // Create dots navigation
        const slideshowContainer = document.querySelector('.slideshow-container');
        if (slideshowContainer) {
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
        document.querySelector('.slideshow-container')?.addEventListener('mouseenter', () => {
            this.pauseSlideshow();
        });

        document.querySelector('.slideshow-container')?.addEventListener('mouseleave', () => {
            this.startSlideshow();
        });
    }

    private showSlide(index: number): void {
        if (!this.slides || this.slides.length === 0) return;

        // Hide all slides
        this.slides.forEach(slide => {
            slide.classList.remove('active');
        });

        // Remove active class from all dots
        this.dots?.forEach(dot => {
            dot.classList.remove('active');
        });

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
        this.dots?.[this.currentSlide]?.classList.add('active');
    }

    private goToSlide(index: number): void {
        this.pauseSlideshow();
        this.showSlide(index);
        this.startSlideshow();
    }

    private nextSlide(): void {
        this.showSlide(this.currentSlide + 1);
    }

    private startSlideshow(): void {
        this.pauseSlideshow();
        this.slideTimer = window.setInterval(() => this.nextSlide(), 5000);
    }

    private pauseSlideshow(): void {
        if (this.slideTimer) {
            clearInterval(this.slideTimer);
            this.slideTimer = null;
        }
    }

    // Mobile Menu
    private setupMobileMenu(): void {
        const toggle = document.querySelector('.mobile-menu-toggle');
        const navLinks = document.querySelector('.nav-links');

        if (!toggle) {
            // Create mobile menu toggle if it doesn't exist
            const navbar = document.querySelector('.navbar');
            if (navbar && navLinks) {
                const toggleBtn = document.createElement('div');
                toggleBtn.className = 'mobile-menu-toggle';
                toggleBtn.innerHTML = '<span></span><span></span><span></span>';
                navbar.appendChild(toggleBtn);
                
                toggleBtn.addEventListener('click', () => {
                    navLinks.classList.toggle('active');
                    toggleBtn.classList.toggle('active');
                });
            }
        } else {
            toggle.addEventListener('click', () => {
                navLinks?.classList.toggle('active');
                toggle.classList.toggle('active');
            });
        }
    }

    // Scroll to Top Button
    private setupScrollToTop(): void {
        let scrollBtn = document.querySelector('.scroll-to-top') as HTMLElement;
        
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
    private setupFAQAccordion(): void {
        const faqQuestions = document.querySelectorAll('.faq-question');
        
        faqQuestions.forEach(question => {
            question.addEventListener('click', () => {
                const answer = question.nextElementSibling;
                const isActive = question.classList.contains('active');

                // Close all other FAQs
                document.querySelectorAll('.faq-question').forEach(q => {
                    q.classList.remove('active');
                    q.nextElementSibling?.classList.remove('active');
                });

                // Toggle current FAQ
                if (!isActive) {
                    question.classList.add('active');
                    answer?.classList.add('active');
                }
            });
        });
    }

    // Smooth Scroll for Navigation
    private setupSmoothScroll(): void {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = anchor.getAttribute('href');
                if (targetId && targetId !== '#') {
                    const target = document.querySelector(targetId);
                    target?.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    // Form Validation
    private setupFormValidation(): void {
        const contactForm = document.querySelector('form') as HTMLFormElement;
        
        if (!contactForm) return;

        contactForm.addEventListener('submit', (e) => {
            const name = (contactForm.querySelector('[name="name"]') as HTMLInputElement)?.value;
            const email = (contactForm.querySelector('[name="email"]') as HTMLInputElement)?.value;
            const message = (contactForm.querySelector('[name="message"]') as HTMLTextAreaElement)?.value;

            if (!name || !email || !message) {
                e.preventDefault();
                this.showNotification('Please fill in all required fields', 'error');
                return;
            }

            if (!this.isValidEmail(email)) {
                e.preventDefault();
                this.showNotification('Please enter a valid email address', 'error');
                return;
            }
        });

        // Real-time email validation
        const emailInput = contactForm.querySelector('[name="email"]') as HTMLInputElement;
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

    private isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Product Filters (if needed)
    private setupProductFilters(): void {
        const filterButtons = document.querySelectorAll('[data-filter]');
        const products = document.querySelectorAll('.product-card');

        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                const filter = button.getAttribute('data-filter');
                
                filterButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                products.forEach(product => {
                    if (filter === 'all' || product.getAttribute('data-category') === filter) {
                        (product as HTMLElement).style.display = 'block';
                        product.classList.add('fade-in');
                    } else {
                        (product as HTMLElement).style.display = 'none';
                    }
                });
            });
        });
    }

    // Intersection Observer for Animations
    private setupAnimations(): void {
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

        // Observe product cards
        document.querySelectorAll('.product-card').forEach(card => {
            observer.observe(card);
        });

        // Observe review cards
        document.querySelectorAll('.review-card').forEach(card => {
            observer.observe(card);
        });

        // Observe FAQ items
        document.querySelectorAll('.faq-item').forEach(item => {
            observer.observe(item);
        });
    }

    // Show Notification
    private showNotification(message: string, type: 'success' | 'error'): void {
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

    // Checkout functionality
    public async handleCheckout(productName: string, productPrice: string): Promise<void> {
        try {
            const response = await fetch('/create-checkout-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: productName,
                    price: productPrice
                })
            });

            const data = await response.json();

            if (data.error) {
                this.showNotification('Error creating checkout session', 'error');
                return;
            }

            // Redirect to Stripe Checkout
            // Note: You'll need to include Stripe.js for this
            console.log('Checkout session created:', data.id);
            this.showNotification('Redirecting to checkout...', 'success');
            
        } catch (error) {
            console.error('Checkout error:', error);
            this.showNotification('An error occurred. Please try again.', 'error');
        }
    }
}

// Initialize the app
const fondantShop = new FondantShop();

// Export for use in HTML
(window as any).fondantShop = fondantShop;
