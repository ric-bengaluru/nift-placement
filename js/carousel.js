// Image Carousel functionality

class Carousel {
    constructor() {
        this.track = document.getElementById('carousel-track');
        this.slides = Array.from(this.track.children);
        this.nextBtn = document.querySelector('.carousel-next');
        this.prevBtn = document.querySelector('.carousel-prev');
        this.dotsContainer = document.getElementById('carousel-dots');
        
        this.currentIndex = 0;
        this.autoAdvanceInterval = null;
        this.autoAdvanceDelay = 5000; // 5 seconds
        
        this.init();
    }
    
    init() {
        // Create dots
        this.createDots();
        
        // Set initial position
        this.updateCarousel();
        
        // Add event listeners
        this.nextBtn.addEventListener('click', () => this.next());
        this.prevBtn.addEventListener('click', () => this.prev());
        
        // Pause on hover
        this.track.addEventListener('mouseenter', () => this.pauseAutoAdvance());
        this.track.addEventListener('mouseleave', () => this.startAutoAdvance());
        
        // Touch swipe support
        this.addTouchSupport();
        
        // Start auto-advance
        this.startAutoAdvance();
    }
    
    createDots() {
        this.slides.forEach((_, index) => {
            const dot = document.createElement('button');
            dot.classList.add('carousel-dot');
            if (index === 0) dot.classList.add('active');
            dot.addEventListener('click', () => this.goToSlide(index));
            this.dotsContainer.appendChild(dot);
        });
        
        this.dots = Array.from(this.dotsContainer.children);
    }
    
    updateCarousel() {
        const slideWidth = this.slides[0].getBoundingClientRect().width;
        this.track.style.transform = `translateX(-${this.currentIndex * slideWidth}px)`;
        
        // Update dots
        this.dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === this.currentIndex);
        });
    }
    
    next() {
        this.currentIndex = (this.currentIndex + 1) % this.slides.length;
        this.updateCarousel();
    }
    
    prev() {
        this.currentIndex = (this.currentIndex - 1 + this.slides.length) % this.slides.length;
        this.updateCarousel();
    }
    
    goToSlide(index) {
        this.currentIndex = index;
        this.updateCarousel();
    }
    
    startAutoAdvance() {
        this.autoAdvanceInterval = setInterval(() => this.next(), this.autoAdvanceDelay);
    }
    
    pauseAutoAdvance() {
        if (this.autoAdvanceInterval) {
            clearInterval(this.autoAdvanceInterval);
            this.autoAdvanceInterval = null;
        }
    }
    
    addTouchSupport() {
        let startX = 0;
        let currentX = 0;
        let isDragging = false;
        
        this.track.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            isDragging = true;
            this.pauseAutoAdvance();
        });
        
        this.track.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            currentX = e.touches[0].clientX;
        });
        
        this.track.addEventListener('touchend', () => {
            if (!isDragging) return;
            isDragging = false;
            
            const diff = startX - currentX;
            
            if (Math.abs(diff) > 50) { // Minimum swipe distance
                if (diff > 0) {
                    this.next();
                } else {
                    this.prev();
                }
            }
            
            this.startAutoAdvance();
        });
    }
}

// Initialize carousel when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const carousel = new Carousel();
    
    // Update carousel on window resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            carousel.updateCarousel();
        }, 200);
    });
});
