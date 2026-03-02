// FoodFusion Carousel JavaScript
// Handles carousel functionality for events and other content

class Carousel {
    constructor(containerSelector, options = {}) {
        this.container = document.querySelector(containerSelector);
        if (!this.container) return;
        
        this.options = {
            autoPlay: true,
            autoPlayInterval: 5000,
            showIndicators: true,
            showArrows: true,
            loop: true,
            animationDuration: 500,
            pauseOnHover: true,
            swipeEnabled: true,
            ...options
        };
        
        this.currentSlide = 0;
        this.slides = [];
        this.indicators = [];
        this.isAnimating = false;
        this.autoPlayTimer = null;
        this.isPaused = false;
        
        this.init();
    }
    
    init() {
        this.setupSlides();
        this.setupControls();
        this.setupIndicators();
        this.setupSwipeHandlers();
        this.setupKeyboardNavigation();
        this.setupAutoPlay();
        this.setupPauseOnHover();
        
        // Show first slide
        this.showSlide(0);
        
        // Handle window resize
        window.addEventListener('resize', () => this.handleResize());
    }
    
    setupSlides() {
        this.slideWrapper = this.container.querySelector('.carousel-wrapper');
        this.slides = Array.from(this.container.querySelectorAll('.carousel-slide'));
        
        if (this.slides.length === 0) return;
        
        // Set initial slide states
        this.slides.forEach((slide, index) => {
            slide.style.transition = `opacity ${this.options.animationDuration}ms ease`;
            slide.setAttribute('data-slide-index', index);
            
            if (index === 0) {
                slide.classList.add('active');
            } else {
                slide.classList.remove('active');
            }
        });
    }
    
    setupControls() {
        if (!this.options.showArrows) return;
        
        this.prevBtn = this.container.querySelector('.prev-btn, .carousel-btn.prev-btn');
        this.nextBtn = this.container.querySelector('.next-btn, .carousel-btn.next-btn');
        
        if (this.prevBtn) {
            this.prevBtn.addEventListener('click', () => this.previousSlide());
            this.prevBtn.setAttribute('aria-label', 'Previous slide');
        }
        
        if (this.nextBtn) {
            this.nextBtn.addEventListener('click', () => this.nextSlide());
            this.nextBtn.setAttribute('aria-label', 'Next slide');
        }
        
        // Hide controls if only one slide
        if (this.slides.length <= 1) {
            if (this.prevBtn) this.prevBtn.style.display = 'none';
            if (this.nextBtn) this.nextBtn.style.display = 'none';
        }
    }
    
    setupIndicators() {
        if (!this.options.showIndicators || this.slides.length <= 1) return;
        
        this.indicatorContainer = this.container.querySelector('.carousel-indicators');
        if (!this.indicatorContainer) {
            // Create indicator container if it doesn't exist
            this.indicatorContainer = document.createElement('div');
            this.indicatorContainer.className = 'carousel-indicators';
            this.container.appendChild(this.indicatorContainer);
        }
        
        // Clear existing indicators
        this.indicatorContainer.innerHTML = '';
        this.indicators = [];
        
        this.slides.forEach((_, index) => {
            const indicator = document.createElement('span');
            indicator.className = 'indicator';
            indicator.setAttribute('data-slide', index);
            indicator.setAttribute('aria-label', `Go to slide ${index + 1}`);
            indicator.setAttribute('role', 'button');
            indicator.setAttribute('tabindex', '0');
            
            if (index === 0) {
                indicator.classList.add('active');
            }
            
            indicator.addEventListener('click', () => this.goToSlide(index));
            indicator.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.goToSlide(index);
                }
            });
            
            this.indicatorContainer.appendChild(indicator);
            this.indicators.push(indicator);
        });
    }
    
    setupSwipeHandlers() {
        if (!this.options.swipeEnabled || !this.slideWrapper) return;
        
        let startX = 0;
        let startY = 0;
        let endX = 0;
        let endY = 0;
        let isSwipeDetected = false;
        
        // Touch events
        this.slideWrapper.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            isSwipeDetected = false;
            this.pauseAutoPlay();
        }, { passive: true });
        
        this.slideWrapper.addEventListener('touchmove', (e) => {
            if (!isSwipeDetected) {
                endX = e.touches[0].clientX;
                endY = e.touches[0].clientY;
                
                const deltaX = Math.abs(endX - startX);
                const deltaY = Math.abs(endY - startY);
                
                if (deltaX > deltaY && deltaX > 30) {
                    isSwipeDetected = true;
                    e.preventDefault();
                }
            }
        }, { passive: false });
        
        this.slideWrapper.addEventListener('touchend', () => {
            if (isSwipeDetected) {
                const deltaX = endX - startX;
                
                if (Math.abs(deltaX) > 50) {
                    if (deltaX > 0) {
                        this.previousSlide();
                    } else {
                        this.nextSlide();
                    }
                }
            }
            this.resumeAutoPlay();
        });
        
        // Mouse events for desktop
        let isMouseDown = false;
        
        this.slideWrapper.addEventListener('mousedown', (e) => {
            startX = e.clientX;
            startY = e.clientY;
            isMouseDown = true;
            isSwipeDetected = false;
            this.slideWrapper.style.cursor = 'grabbing';
            this.pauseAutoPlay();
        });
        
        this.slideWrapper.addEventListener('mousemove', (e) => {
            if (!isMouseDown) return;
            
            endX = e.clientX;
            endY = e.clientY;
            
            const deltaX = Math.abs(endX - startX);
            const deltaY = Math.abs(endY - startY);
            
            if (deltaX > deltaY && deltaX > 10) {
                isSwipeDetected = true;
                e.preventDefault();
            }
        });
        
        this.slideWrapper.addEventListener('mouseup', () => {
            if (isMouseDown && isSwipeDetected) {
                const deltaX = endX - startX;
                
                if (Math.abs(deltaX) > 50) {
                    if (deltaX > 0) {
                        this.previousSlide();
                    } else {
                        this.nextSlide();
                    }
                }
            }
            
            isMouseDown = false;
            this.slideWrapper.style.cursor = '';
            this.resumeAutoPlay();
        });
        
        this.slideWrapper.addEventListener('mouseleave', () => {
            isMouseDown = false;
            this.slideWrapper.style.cursor = '';
            this.resumeAutoPlay();
        });
    }
    
    setupKeyboardNavigation() {
        this.container.addEventListener('keydown', (e) => {
            switch (e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    this.previousSlide();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.nextSlide();
                    break;
                case 'Home':
                    e.preventDefault();
                    this.goToSlide(0);
                    break;
                case 'End':
                    e.preventDefault();
                    this.goToSlide(this.slides.length - 1);
                    break;
            }
        });
    }
    
    setupAutoPlay() {
        if (!this.options.autoPlay || this.slides.length <= 1) return;
        
        this.startAutoPlay();
    }
    
    setupPauseOnHover() {
        if (!this.options.pauseOnHover) return;
        
        this.container.addEventListener('mouseenter', () => this.pauseAutoPlay());
        this.container.addEventListener('mouseleave', () => this.resumeAutoPlay());
        this.container.addEventListener('focusin', () => this.pauseAutoPlay());
        this.container.addEventListener('focusout', () => this.resumeAutoPlay());
    }
    
    startAutoPlay() {
        if (this.autoPlayTimer) return;
        
        this.autoPlayTimer = setInterval(() => {
            if (!this.isPaused && !document.hidden) {
                this.nextSlide();
            }
        }, this.options.autoPlayInterval);
    }
    
    pauseAutoPlay() {
        this.isPaused = true;
    }
    
    resumeAutoPlay() {
        this.isPaused = false;
    }
    
    stopAutoPlay() {
        if (this.autoPlayTimer) {
            clearInterval(this.autoPlayTimer);
            this.autoPlayTimer = null;
        }
    }
    
    showSlide(index) {
        if (this.isAnimating || index === this.currentSlide) return;
        
        this.isAnimating = true;
        
        // Update slides
        this.slides.forEach((slide, i) => {
            slide.classList.toggle('active', i === index);
        });
        
        // Update indicators
        this.indicators.forEach((indicator, i) => {
            indicator.classList.toggle('active', i === index);
        });
        
        this.currentSlide = index;
        
        // Update ARIA attributes
        this.updateAriaAttributes();
        
        // Reset animation flag
        setTimeout(() => {
            this.isAnimating = false;
        }, this.options.animationDuration);
        
        // Trigger custom event
        this.container.dispatchEvent(new CustomEvent('slideChange', {
            detail: { currentSlide: this.currentSlide, totalSlides: this.slides.length }
        }));
    }
    
    nextSlide() {
        if (this.slides.length === 0) return;
        
        let nextIndex = this.currentSlide + 1;
        
        if (nextIndex >= this.slides.length) {
            nextIndex = this.options.loop ? 0 : this.slides.length - 1;
        }
        
        this.goToSlide(nextIndex);
    }
    
    previousSlide() {
        if (this.slides.length === 0) return;
        
        let prevIndex = this.currentSlide - 1;
        
        if (prevIndex < 0) {
            prevIndex = this.options.loop ? this.slides.length - 1 : 0;
        }
        
        this.goToSlide(prevIndex);
    }
    
    goToSlide(index) {
        if (index < 0 || index >= this.slides.length) return;
        this.showSlide(index);
    }
    
    updateAriaAttributes() {
        this.slides.forEach((slide, index) => {
            slide.setAttribute('aria-hidden', index !== this.currentSlide);
        });
        
        if (this.prevBtn) {
            this.prevBtn.setAttribute('aria-disabled', 
                !this.options.loop && this.currentSlide === 0);
        }
        
        if (this.nextBtn) {
            this.nextBtn.setAttribute('aria-disabled', 
                !this.options.loop && this.currentSlide === this.slides.length - 1);
        }
    }
    
    handleResize() {
        // Handle any responsive adjustments
        clearTimeout(this.resizeTimer);
        this.resizeTimer = setTimeout(() => {
            this.updateAriaAttributes();
        }, 250);
    }
    
    destroy() {
        this.stopAutoPlay();
        
        // Remove event listeners
        if (this.prevBtn) {
            this.prevBtn.removeEventListener('click', this.previousSlide);
        }
        if (this.nextBtn) {
            this.nextBtn.removeEventListener('click', this.nextSlide);
        }
        
        this.indicators.forEach(indicator => {
            indicator.removeEventListener('click', this.goToSlide);
        });
        
        // Clear references
        this.container = null;
        this.slides = [];
        this.indicators = [];
    }
    
    // Public API methods
    getCurrentSlide() {
        return this.currentSlide;
    }
    
    getTotalSlides() {
        return this.slides.length;
    }
    
    isAutoPlaying() {
        return this.autoPlayTimer !== null && !this.isPaused;
    }
}

// Initialize carousels when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Initialize events carousel
    const eventsCarousel = new Carousel('.events-carousel .carousel-container', {
        autoPlay: true,
        autoPlayInterval: 6000,
        showIndicators: true,
        showArrows: true,
        loop: true,
        pauseOnHover: true,
        swipeEnabled: true
    });
    
    // Initialize any other carousels on the page
    const carouselContainers = document.querySelectorAll('.carousel-container:not(.events-carousel .carousel-container)');
    carouselContainers.forEach(container => {
        new Carousel(container, {
            autoPlay: false,
            showIndicators: true,
            showArrows: true,
            loop: true,
            swipeEnabled: true
        });
    });
    
    // Handle page visibility change to pause/resume autoplay
    document.addEventListener('visibilitychange', function() {
        const carousels = document.querySelectorAll('.carousel-container');
        carousels.forEach(container => {
            const carousel = container._carousel;
            if (carousel) {
                if (document.hidden) {
                    carousel.pauseAutoPlay();
                } else {
                    carousel.resumeAutoPlay();
                }
            }
        });
    });
});

// Export Carousel class for use in other scripts
window.Carousel = Carousel;
