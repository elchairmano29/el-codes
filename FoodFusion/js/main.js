// FoodFusion Main JavaScript
// Handles navigation, cookie consent, and general utilities

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all main functionality
    initNavigation();
    initCookieConsent();
    initScrollEffects();
    initNewsletterForm();
    initSearchFunctionality();
    initLazyLoading();
});

// Navigation functionality
function initNavigation() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');
    
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
            
            // Prevent body scroll when menu is open
            if (navMenu.classList.contains('active')) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }
        });
        
        // Close menu when clicking on nav links
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
                document.body.style.overflow = '';
            });
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!hamburger.contains(e.target) && !navMenu.contains(e.target)) {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }
    
    // Navbar scroll effect
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 100) {
                navbar.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
                navbar.style.backdropFilter = 'blur(10px)';
            } else {
                navbar.style.backgroundColor = 'var(--white)';
                navbar.style.backdropFilter = 'none';
            }
        });
    }
}

// Cookie consent functionality
function initCookieConsent() {
    const cookieConsent = document.getElementById('cookieConsent');
    const acceptCookies = document.getElementById('acceptCookies');
    const declineCookies = document.getElementById('declineCookies');
    
    if (!cookieConsent) return;
    
    // Check if user has already made a choice
    const cookieChoice = localStorage.getItem('cookieConsent');
    
    if (!cookieChoice) {
        // Show cookie consent after a short delay
        setTimeout(() => {
            cookieConsent.classList.add('show');
        }, 2000);
    }
    
    if (acceptCookies) {
        acceptCookies.addEventListener('click', function() {
            localStorage.setItem('cookieConsent', 'accepted');
            localStorage.setItem('cookieConsentDate', new Date().toISOString());
            hideCookieConsent();
            
            // Initialize analytics or other tracking here
            initAnalytics();
        });
    }
    
    if (declineCookies) {
        declineCookies.addEventListener('click', function() {
            localStorage.setItem('cookieConsent', 'declined');
            localStorage.setItem('cookieConsentDate', new Date().toISOString());
            hideCookieConsent();
        });
    }
    
    function hideCookieConsent() {
        cookieConsent.classList.remove('show');
        setTimeout(() => {
            cookieConsent.style.display = 'none';
        }, 300);
    }
}

// Initialize analytics (placeholder for real implementation)
function initAnalytics() {
    const consentStatus = localStorage.getItem('cookieConsent');
    if (consentStatus === 'accepted') {
        // Initialize Google Analytics, tracking pixels, etc.
        console.log('Analytics initialized - user consented to cookies');
        
        // Example: Initialize Google Analytics
        // gtag('config', 'GA_MEASUREMENT_ID');
    }
}

// Scroll effects for animations
function initScrollEffects() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // Observe elements for scroll animations
    const animatedElements = document.querySelectorAll('.recipe-card, .news-card, .philosophy-card, .team-member, .tip-card');
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}

// Newsletter form handling
function initNewsletterForm() {
    const newsletterForms = document.querySelectorAll('.newsletter-form');
    
    newsletterForms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const emailInput = form.querySelector('input[type="email"]');
            const submitBtn = form.querySelector('button[type="submit"]');
            const email = emailInput.value.trim();
            
            if (!isValidEmail(email)) {
                showNotification('Please enter a valid email address', 'error');
                return;
            }
            
            // Show loading state
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Subscribing...';
            submitBtn.disabled = true;
            
            // Simulate API call (replace with actual implementation)
            setTimeout(() => {
                // Store subscription in localStorage for demo purposes
                const subscribers = JSON.parse(localStorage.getItem('newsletterSubscribers') || '[]');
                
                if (!subscribers.includes(email)) {
                    subscribers.push(email);
                    localStorage.setItem('newsletterSubscribers', JSON.stringify(subscribers));
                    showNotification('Thank you for subscribing to our newsletter!', 'success');
                    emailInput.value = '';
                } else {
                    showNotification('You are already subscribed to our newsletter', 'info');
                }
                
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }, 1500);
        });
    });
}

// Search functionality
function initSearchFunctionality() {
    const searchInputs = document.querySelectorAll('input[type="search"], #recipeSearch');
    
    searchInputs.forEach(input => {
        let searchTimeout;
        
        input.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            const query = this.value.trim();
            
            if (query.length > 2) {
                searchTimeout = setTimeout(() => {
                    performSearch(query);
                }, 300);
            }
        });
        
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const query = this.value.trim();
                if (query.length > 0) {
                    performSearch(query);
                }
            }
        });
    });
}

// Search implementation
function performSearch(query) {
    console.log('Searching for:', query);
    
    // Store search in localStorage for search history
    const searchHistory = JSON.parse(localStorage.getItem('searchHistory') || '[]');
    if (!searchHistory.includes(query)) {
        searchHistory.unshift(query);
        // Keep only last 10 searches
        if (searchHistory.length > 10) {
            searchHistory.pop();
        }
        localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
    }
    
    // In a real application, this would make an API call
    // For now, we'll simulate search results
    showSearchResults(query);
}

// Show search results (placeholder implementation)
function showSearchResults(query) {
    // This would typically redirect to search results page or show dropdown
    showNotification(`Searching for "${query}"...`, 'info');
}

// Lazy loading for images
function initLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');
    
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver(function(entries, observer) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.add('loaded');
                    imageObserver.unobserve(img);
                }
            });
        });
        
        images.forEach(img => imageObserver.observe(img));
    } else {
        // Fallback for browsers without IntersectionObserver
        images.forEach(img => {
            img.src = img.dataset.src;
            img.classList.add('loaded');
        });
    }
}

// Utility functions
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${getNotificationIcon(type)}"></i>
            <span>${message}</span>
            <button class="notification-close">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10001;
        background: ${getNotificationColor(type)};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        transform: translateX(400px);
        transition: transform 0.3s ease;
        max-width: 400px;
        word-wrap: break-word;
    `;
    
    notification.querySelector('.notification-content').style.cssText = `
        display: flex;
        align-items: center;
        gap: 0.75rem;
    `;
    
    notification.querySelector('.notification-close').style.cssText = `
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        padding: 0;
        margin-left: auto;
        opacity: 0.7;
        transition: opacity 0.2s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Close button functionality
    notification.querySelector('.notification-close').addEventListener('click', function() {
        closeNotification(notification);
    });
    
    // Auto close after 5 seconds
    setTimeout(() => {
        if (document.body.contains(notification)) {
            closeNotification(notification);
        }
    }, 5000);
}

function closeNotification(notification) {
    notification.style.transform = 'translateX(400px)';
    setTimeout(() => {
        if (document.body.contains(notification)) {
            notification.remove();
        }
    }, 300);
}

function getNotificationIcon(type) {
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    return icons[type] || icons.info;
}

function getNotificationColor(type) {
    const colors = {
        success: '#228B22',
        error: '#A0522D',
        warning: '#B8860B',
        info: '#4682B4'
    };
    return colors[type] || colors.info;
}

// Smooth scroll to anchor links
document.addEventListener('click', function(e) {
    if (e.target.matches('a[href^="#"]')) {
        e.preventDefault();
        const targetId = e.target.getAttribute('href').substring(1);
        const targetElement = document.getElementById(targetId);
        
        if (targetElement) {
            const navbarHeight = document.querySelector('.navbar').offsetHeight;
            const targetPosition = targetElement.offsetTop - navbarHeight - 20;
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    }
});
  // Number counter animation
  const statNumbers = document.querySelectorAll('.stat-number');
  const statsObserver = new IntersectionObserver(function(entries) {
      entries.forEach(entry => {
          if (entry.isIntersecting) {
              animateNumber(entry.target);
              statsObserver.unobserve(entry.target);
          }
      });
  });
  
  statNumbers.forEach(stat => {
      statsObserver.observe(stat);
  });


// Animate numbers
function animateNumber(element) {
  const finalNumber = element.textContent.replace(/[^\d]/g, '');
  const duration = 2000;
  const increment = finalNumber / (duration / 16);
  let current = 0;
  
  const timer = setInterval(() => {
      current += increment;
      if (current >= finalNumber) {
          current = finalNumber;
          clearInterval(timer);
      }
      
      // Format number with commas
      const formattedNumber = Math.floor(current).toLocaleString();
      element.textContent = element.textContent.replace(/[\d,]+/, formattedNumber);
  }, 16);
}


// Handle browser back/forward buttons
window.addEventListener('popstate', function(e) {
    // Handle any necessary cleanup or state restoration
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    if (hamburger && navMenu) {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
        document.body.style.overflow = '';
    }
});

// Initialize tooltips for accessibility
function initTooltips() {
    const elementsWithTooltips = document.querySelectorAll('[data-tooltip]');
    
    elementsWithTooltips.forEach(element => {
        element.addEventListener('mouseenter', function() {
            const tooltipText = this.getAttribute('data-tooltip');
            const tooltip = document.createElement('div');
            tooltip.className = 'tooltip';
            tooltip.textContent = tooltipText;
            tooltip.style.cssText = `
                position: absolute;
                background: var(--charcoal);
                color: white;
                padding: 0.5rem;
                border-radius: 4px;
                font-size: 0.875rem;
                z-index: 10000;
                pointer-events: none;
                white-space: nowrap;
            `;
            
            document.body.appendChild(tooltip);
            
            const rect = this.getBoundingClientRect();
            tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
            tooltip.style.top = rect.top - tooltip.offsetHeight - 8 + 'px';
            
            this._tooltip = tooltip;
        });
        
        element.addEventListener('mouseleave', function() {
            if (this._tooltip) {
                this._tooltip.remove();
                this._tooltip = null;
            }
        });
    });
    
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', initTooltips);

// Export functions for use in other scripts
window.FoodFusion = {
    showNotification,
    isValidEmail,
    performSearch
};


// Filter system for recipes and resources
function initializeFilterSystem() {
    // Recipe filters
    const filterTabs = document.querySelectorAll('.filter-tab');
    const filterGroups = document.querySelectorAll('.filter-group');
    const filterOptions = document.querySelectorAll('.filter-option');
    const recipeCards = document.querySelectorAll('.recipe-card');
    
    // Tab switching
    filterTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const filter = this.dataset.filter;
            
            // Update active tab
            filterTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Show corresponding filter group
            filterGroups.forEach(group => {
                group.classList.remove('active');
                if (group.id === filter + 'Filters' || filter === 'all') {
                    group.classList.add('active');
                }
            });
            
            // Reset filters when switching tabs
            filterOptions.forEach(option => option.classList.remove('active'));
            showAllRecipes();
        });
    });
    
    // Filter options
    filterOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Toggle active state
            this.classList.toggle('active');
            
            // Apply filters
            applyRecipeFilters();
        });
    });
    
    // Category tabs for resources
    const categoryTabs = document.querySelectorAll('.category-tab');
    const resourceItems = document.querySelectorAll('.resource-item, .resource-card');
    
    categoryTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const category = this.dataset.category;
            
            // Update active tab
            categoryTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Filter resources
            resourceItems.forEach(item => {
                if (category === 'all' || item.dataset.category === category) {
                    item.style.display = '';
                    item.classList.add('fade-in');
                } else {
                    item.style.display = 'none';
                }
            });
        });
    });
}