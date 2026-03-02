// FoodFusion Authentication JavaScript
// Handles login, registration, and security features including account lockout

class AuthManager {
    constructor() {
        this.maxLoginAttempts = 3;
        this.lockoutDuration = 3 * 60 * 1000; // 3 minutes in milliseconds
        this.init();
    }
    
    init() {
        this.setupLoginForm();
        this.setupRegistrationForm();
        this.setupSecurityFeatures();
        this.checkExistingSession();
        this.checkAccountLockout();
    }
    
    setupLoginForm() {
        const loginForm = document.getElementById('loginForm');
        if (!loginForm) return;
        
        loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        
        // Show login attempts if user has failed attempts
        this.updateLoginAttemptsDisplay();
    }
    
    setupRegistrationForm() {
        const registerForm = document.getElementById('registerForm');
        if (!registerForm) return;
        
        registerForm.addEventListener('submit', (e) => this.handleRegistration(e));
    }
    
    setupSecurityFeatures() {
        // Check for suspicious activity
        this.trackPageViews();
        
        // Clear sensitive data on page unload
        window.addEventListener('beforeunload', () => {
            this.clearSensitiveData();
        });
        
        // Monitor for multiple failed attempts
        this.monitorFailedAttempts();
    }
    
    handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        const rememberMe = document.getElementById('rememberMe').checked;
        
        // Check if account is locked
        if (this.isAccountLocked(email)) {
            this.showLockoutMessage();
            return;
        }
        
        // Validate input
        if (!this.validateLoginInput(email, password)) {
            return;
        }
        
        this.showLoginLoading();
        
        // Simulate authentication delay
        setTimeout(() => {
            this.authenticateUser(email, password, rememberMe);
        }, 1500);
    }
    
    handleRegistration(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const userData = {
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            email: formData.get('email'),
            password: formData.get('password'),
            confirmPassword: formData.get('confirmPassword'),
            cookingLevel: formData.get('cookingLevel'),
            interests: formData.getAll('interests'),
            newsletter: formData.get('newsletter') === 'on',
            terms: formData.get('terms') === 'on'
        };
        
        // Validate registration data
        if (!this.validateRegistrationData(userData)) {
            return;
        }
        
        this.showRegistrationLoading();
        
        setTimeout(() => {
            this.registerUser(userData);
        }, 2000);
    }
    
    async authenticateUser(email, password, rememberMe) {
        try {
            const response = await fetch('http://localhost:8000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Successful login
                this.clearFailedAttempts(email);
                this.createUserSession(data.user, rememberMe);
                this.hideLoginLoading();
                this.showLoginSuccess();
            } else {
                // Failed login
                this.recordFailedAttempt(email);
                this.hideLoginLoading();
                this.showLoginError(data.detail || 'Login failed');
            }
        } catch (error) {
            this.recordFailedAttempt(email);
            this.hideLoginLoading();
            this.showLoginError('Network error. Please try again.');
            console.error('Login error:', error);
        }
    }
    
    async registerUser(userData) {
        try {
            const response = await fetch('http://localhost:8000/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    first_name: userData.firstName,
                    last_name: userData.lastName,
                    email: userData.email,
                    password: userData.password,
                    confirm_password: userData.confirmPassword,
                    cooking_level: userData.cookingLevel,
                    interests: userData.interests,
                    newsletter: userData.newsletter
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                this.hideRegistrationLoading();
                this.showRegistrationSuccess();
            } else {
                this.hideRegistrationLoading();
                this.showFieldError('registerEmail', data.detail || 'Registration failed');
            }
        } catch (error) {
            this.hideRegistrationLoading();
            this.showFieldError('registerEmail', 'Network error. Please try again.');
            console.error('Registration error:', error);
        }
    }
    
    validateLoginInput(email, password) {
        let isValid = true;
        
        if (!email) {
            this.showFieldError('loginEmail', 'Email is required');
            isValid = false;
        } else if (!this.isValidEmail(email)) {
            this.showFieldError('loginEmail', 'Please enter a valid email address');
            isValid = false;
        } else {
            this.clearFieldError('loginEmail');
        }
        
        if (!password) {
            this.showFieldError('loginPassword', 'Password is required');
            isValid = false;
        } else {
            this.clearFieldError('loginPassword');
        }
        
        return isValid;
    }
    
    validateRegistrationData(userData) {
        let isValid = true;
        
        // Validate required fields
        if (!userData.firstName) {
            this.showFieldError('firstName', 'First name is required');
            isValid = false;
        }
        
        if (!userData.lastName) {
            this.showFieldError('lastName', 'Last name is required');
            isValid = false;
        }
        
        if (!userData.email) {
            this.showFieldError('registerEmail', 'Email is required');
            isValid = false;
        } else if (!this.isValidEmail(userData.email)) {
            this.showFieldError('registerEmail', 'Please enter a valid email address');
            isValid = false;
        }
        
        if (!userData.password) {
            this.showFieldError('registerPassword', 'Password is required');
            isValid = false;
        } else if (!this.isValidPassword(userData.password)) {
            this.showFieldError('registerPassword', 'Password must be at least 8 characters with uppercase, lowercase, and number');
            isValid = false;
        }
        
        if (userData.password !== userData.confirmPassword) {
            this.showFieldError('confirmPassword', 'Passwords do not match');
            isValid = false;
        }
        
        if (!userData.cookingLevel) {
            this.showFieldError('cookingLevel', 'Please select your cooking experience level');
            isValid = false;
        }
        
        if (!userData.terms) {
            this.showFieldError('terms', 'You must agree to the terms of service');
            isValid = false;
        }
        
        return isValid;
    }
    
    recordFailedAttempt(email) {
        const attempts = JSON.parse(localStorage.getItem('loginAttempts') || '{}');
        const now = Date.now();
        
        if (!attempts[email]) {
            attempts[email] = [];
        }
        
        attempts[email].push(now);
        
        // Keep only recent attempts (within lockout duration)
        attempts[email] = attempts[email].filter(time => 
            now - time < this.lockoutDuration
        );
        
        localStorage.setItem('loginAttempts', JSON.stringify(attempts));
        this.updateLoginAttemptsDisplay();
        
        // Check if account should be locked
        if (attempts[email].length >= this.maxLoginAttempts) {
            this.lockAccount(email);
        }
    }
    
    clearFailedAttempts(email) {
        const attempts = JSON.parse(localStorage.getItem('loginAttempts') || '{}');
        delete attempts[email];
        localStorage.setItem('loginAttempts', JSON.stringify(attempts));
        this.hideLoginAttemptsDisplay();
    }
    
    isAccountLocked(email) {
        const attempts = JSON.parse(localStorage.getItem('loginAttempts') || '{}');
        const userAttempts = attempts[email] || [];
        const now = Date.now();
        
        // Filter recent attempts
        const recentAttempts = userAttempts.filter(time => 
            now - time < this.lockoutDuration
        );
        
        return recentAttempts.length >= this.maxLoginAttempts;
    }
    
    lockAccount(email) {
        const lockouts = JSON.parse(localStorage.getItem('accountLockouts') || '{}');
        lockouts[email] = Date.now();
        localStorage.setItem('accountLockouts', JSON.stringify(lockouts));
        
        this.showLockoutMessage();
        this.startLockoutTimer();
    }
    
    checkAccountLockout() {
        const lockoutAlert = document.getElementById('lockoutAlert');
        if (!lockoutAlert) return;
        
        const urlParams = new URLSearchParams(window.location.search);
        const email = urlParams.get('email') || document.getElementById('loginEmail')?.value;
        
        if (email && this.isAccountLocked(email)) {
            this.showLockoutMessage();
            this.startLockoutTimer();
        }
    }
    
    showLockoutMessage() {
        const lockoutAlert = document.getElementById('lockoutAlert');
        if (lockoutAlert) {
            lockoutAlert.style.display = 'block';
            this.startLockoutTimer();
        }
    }
    
    startLockoutTimer() {
        const timerElement = document.getElementById('lockoutTime');
        if (!timerElement) return;
        
        let timeLeft = Math.ceil(this.lockoutDuration / 1000); // 3 minutes in seconds
        
        const timer = setInterval(() => {
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            
            timeLeft--;
            
            if (timeLeft < 0) {
                clearInterval(timer);
                this.hideLockoutMessage();
            }
        }, 1000);
    }
    
    hideLockoutMessage() {
        const lockoutAlert = document.getElementById('lockoutAlert');
        if (lockoutAlert) {
            lockoutAlert.style.display = 'none';
        }
        
        // Clear expired lockouts
        this.clearExpiredLockouts();
    }
    
    clearExpiredLockouts() {
        const lockouts = JSON.parse(localStorage.getItem('accountLockouts') || '{}');
        const attempts = JSON.parse(localStorage.getItem('loginAttempts') || '{}');
        const now = Date.now();
        
        Object.keys(lockouts).forEach(email => {
            if (now - lockouts[email] >= this.lockoutDuration) {
                delete lockouts[email];
                delete attempts[email];
            }
        });
        
        localStorage.setItem('accountLockouts', JSON.stringify(lockouts));
        localStorage.setItem('loginAttempts', JSON.stringify(attempts));
    }
    
    updateLoginAttemptsDisplay() {
        const attemptsElement = document.getElementById('loginAttempts');
        const countElement = document.getElementById('attemptCount');
        
        if (!attemptsElement || !countElement) return;
        
        const email = document.getElementById('loginEmail')?.value;
        if (!email) return;
        
        const attempts = JSON.parse(localStorage.getItem('loginAttempts') || '{}');
        const userAttempts = attempts[email] || [];
        const now = Date.now();
        
        const recentAttempts = userAttempts.filter(time => 
            now - time < this.lockoutDuration
        );
        
        if (recentAttempts.length > 0) {
            countElement.textContent = recentAttempts.length;
            attemptsElement.style.display = 'block';
        }
    }
    
    hideLoginAttemptsDisplay() {
        const attemptsElement = document.getElementById('loginAttempts');
        if (attemptsElement) {
            attemptsElement.style.display = 'none';
        }
    }
    
    createUserSession(user, rememberMe) {
        const sessionData = {
            userId: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            loginTime: new Date().toISOString(),
            rememberMe: rememberMe
        };
        
        if (rememberMe) {
            localStorage.setItem('userSession', JSON.stringify(sessionData));
        } else {
            sessionStorage.setItem('userSession', JSON.stringify(sessionData));
        }
        
        // Set authentication token (in real app, this would come from server)
        const token = this.generateSessionToken();
        localStorage.setItem('authToken', token);
    }
    
    generateSessionToken() {
        // Simple token generation (in real app, use proper JWT or server-generated tokens)
        return btoa(Date.now() + Math.random().toString(36));
    }
    
    checkExistingSession() {
        const sessionData = localStorage.getItem('userSession') || sessionStorage.getItem('userSession');
        
        if (sessionData) {
            const session = JSON.parse(sessionData);
            const loginTime = new Date(session.loginTime);
            const now = new Date();
            
            // Check if session is still valid (24 hours for remember me, 2 hours for regular)
            const maxAge = session.rememberMe ? 24 * 60 * 60 * 1000 : 2 * 60 * 60 * 1000;
            
            if (now - loginTime < maxAge) {
                // Session is valid, user is logged in
                this.handleExistingSession(session);
            } else {
                // Session expired
                this.clearUserSession();
            }
        }
    }
    
    handleExistingSession(session) {
        // Update UI to reflect logged-in state
        const loginLink = document.querySelector('.nav-link.login-btn');
        if (loginLink) {
            loginLink.textContent = `Hello, ${session.firstName}`;
            loginLink.href = '#';
            loginLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.showUserMenu();
            });
        }
        
        // Hide login forms if on auth pages
        if (window.location.pathname.includes('login.html')) {
            this.redirectToHomePage();
        }
    }
    
    showUserMenu() {
        // Create and show user dropdown menu
        const existingMenu = document.querySelector('.user-menu');
        if (existingMenu) {
            existingMenu.remove();
            return;
        }
        
        const menu = document.createElement('div');
        menu.className = 'user-menu';
        menu.style.cssText = `
            position: absolute;
            top: 100%;
            right: 0;
            background: white;
            border: 1px solid #ddd;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            z-index: 1000;
            min-width: 200px;
            padding: 1rem 0;
        `;
        
        menu.innerHTML = `
            <a href="#" class="menu-item" style="display: block; padding: 0.5rem 1rem; color: #333; text-decoration: none;">
                <i class="fas fa-user"></i> Profile
            </a>
            <a href="#" class="menu-item" style="display: block; padding: 0.5rem 1rem; color: #333; text-decoration: none;">
                <i class="fas fa-heart"></i> Favorites
            </a>
            <a href="#" class="menu-item" style="display: block; padding: 0.5rem 1rem; color: #333; text-decoration: none;">
                <i class="fas fa-book"></i> My Recipes
            </a>
            <hr style="margin: 0.5rem 0; border: none; border-top: 1px solid #eee;">
            <a href="#" class="menu-item logout-link" style="display: block; padding: 0.5rem 1rem; color: #A0522D; text-decoration: none;">
                <i class="fas fa-sign-out-alt"></i> Logout
            </a>
        `;
        
        const loginLink = document.querySelector('.nav-link.login-btn');
        const navItem = loginLink.closest('.nav-item');
        navItem.style.position = 'relative';
        navItem.appendChild(menu);
        
        // Add logout functionality
        menu.querySelector('.logout-link').addEventListener('click', (e) => {
            e.preventDefault();
            this.logout();
        });
        
        // Close menu when clicking outside
        setTimeout(() => {
            document.addEventListener('click', (e) => {
                if (!navItem.contains(e.target)) {
                    menu.remove();
                }
            }, { once: true });
        }, 100);
    }
    
    logout() {
        this.clearUserSession();
        
        // Redirect to home page
        window.location.href = 'index.html';
        
        // Show logout notification
        setTimeout(() => {
            if (window.FoodFusion && window.FoodFusion.showNotification) {
                window.FoodFusion.showNotification('You have been logged out successfully', 'info');
            }
        }, 500);
    }
    
    clearUserSession() {
        localStorage.removeItem('userSession');
        sessionStorage.removeItem('userSession');
        localStorage.removeItem('authToken');
        
        // Reset UI
        const loginLink = document.querySelector('.nav-link.login-btn');
        if (loginLink) {
            loginLink.textContent = 'Login';
            loginLink.href = 'login.html';
        }
    }
    
    showLoginLoading() {
        const submitBtn = document.querySelector('#loginForm button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            const btnText = submitBtn.querySelector('.btn-text');
            const btnLoading = submitBtn.querySelector('.btn-loading');
            
            if (btnText && btnLoading) {
                btnText.style.display = 'none';
                btnLoading.style.display = 'inline-flex';
            }
        }
    }
    
    hideLoginLoading() {
        const submitBtn = document.querySelector('#loginForm button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = false;
            const btnText = submitBtn.querySelector('.btn-text');
            const btnLoading = submitBtn.querySelector('.btn-loading');
            
            if (btnText && btnLoading) {
                btnText.style.display = 'inline';
                btnLoading.style.display = 'none';
            }
        }
    }
    
    showRegistrationLoading() {
        const submitBtn = document.querySelector('#registerForm button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            const btnText = submitBtn.querySelector('.btn-text');
            const btnLoading = submitBtn.querySelector('.btn-loading');
            
            if (btnText && btnLoading) {
                btnText.style.display = 'none';
                btnLoading.style.display = 'inline-flex';
            }
        }
    }
    
    hideRegistrationLoading() {
        const submitBtn = document.querySelector('#registerForm button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = false;
            const btnText = submitBtn.querySelector('.btn-text');
            const btnLoading = submitBtn.querySelector('.btn-loading');
            
            if (btnText && btnLoading) {
                btnText.style.display = 'inline';
                btnLoading.style.display = 'none';
            }
        }
    }
    
    showLoginSuccess() {
        const successModal = document.getElementById('successModal');
        if (successModal) {
            successModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        } else {
            this.redirectToHomePage();
        }
    }
    
    showRegistrationSuccess() {
        const successModal = document.getElementById('registrationSuccessModal');
        if (successModal) {
            successModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        } else if (window.FoodFusion && window.FoodFusion.showNotification) {
            window.FoodFusion.showNotification(
                'Registration successful! Welcome to FoodFusion!',
                'success'
            );
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        }
    }
    
    showLoginError() {
        const email = document.getElementById('loginEmail').value.trim();
        const attempts = JSON.parse(localStorage.getItem('loginAttempts') || '{}');
        const userAttempts = attempts[email] || [];
        const now = Date.now();
        const recentAttempts = userAttempts.filter(time => now - time < this.lockoutDuration);
        
        let errorMessage = 'Invalid email or password.';
        
        if (recentAttempts.length > 0) {
            const remaining = this.maxLoginAttempts - recentAttempts.length;
            if (remaining > 0) {
                errorMessage += ` ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`;
            }
        }
        
        this.showFieldError('loginPassword', errorMessage);
        
        if (window.FoodFusion && window.FoodFusion.showNotification) {
            window.FoodFusion.showNotification(errorMessage, 'error');
        }
    }
    
    showFieldError(fieldId, message) {
        const field = document.getElementById(fieldId);
        if (!field) return;
        
        field.classList.add('error');
        const errorElement = field.parentNode.nextElementSibling;
        if (errorElement && errorElement.classList.contains('error-message')) {
            errorElement.textContent = message;
        }
    }
    
    clearFieldError(fieldId) {
        const field = document.getElementById(fieldId);
        if (!field) return;
        
        field.classList.remove('error');
        const errorElement = field.parentNode.nextElementSibling;
        if (errorElement && errorElement.classList.contains('error-message')) {
            errorElement.textContent = '';
        }
    }
    
    redirectToHomePage() {
        window.location.href = 'index.html';
    }
    
    trackPageViews() {
        const pageViews = JSON.parse(localStorage.getItem('pageViews') || '[]');
        const currentPage = window.location.pathname;
        const timestamp = Date.now();
        
        pageViews.push({ page: currentPage, timestamp });
        
        // Keep only last 50 page views
        if (pageViews.length > 50) {
            pageViews.shift();
        }
        
        localStorage.setItem('pageViews', JSON.stringify(pageViews));
    }
    
    monitorFailedAttempts() {
        // Monitor for suspicious activity patterns
        const attempts = JSON.parse(localStorage.getItem('loginAttempts') || '{}');
        const totalAttempts = Object.values(attempts).flat().length;
        
        if (totalAttempts > 10) {
            console.warn('High number of failed login attempts detected');
            // In a real app, this would trigger security alerts
        }
    }
    
    clearSensitiveData() {
        // Clear any sensitive data from memory
        const passwordFields = document.querySelectorAll('input[type="password"]');
        passwordFields.forEach(field => {
            field.value = '';
        });
    }
    
    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
    
    isValidPassword(password) {
        // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
        return password.length >= 8 && 
               /[A-Z]/.test(password) && 
               /[a-z]/.test(password) && 
               /\d/.test(password);
    }
}

// Initialize authentication when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    window.authManager = new AuthManager();
});

// Export for use in other scripts
window.AuthManager = AuthManager;
