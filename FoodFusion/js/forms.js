// FoodFusion Form Validation and Handling JavaScript
// Handles all form validation, submission, and user feedback

class FormValidator {
    constructor() {
        this.rules = {
            required: (value) => value.trim() !== '',
            email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
            minLength: (value, length) => value.length >= length,
            maxLength: (value, length) => value.length <= length,
            pattern: (value, pattern) => new RegExp(pattern).test(value),
            password: (value) => {
                // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
                return value.length >= 8 && 
                       /[A-Z]/.test(value) && 
                       /[a-z]/.test(value) && 
                       /\d/.test(value);
            },
            confirmPassword: (value, originalPassword) => value === originalPassword,
            phone: (value) => /^[\+]?[1-9][\d]{0,15}$/.test(value.replace(/\s/g, '')),
            url: (value) => {
                try {
                    new URL(value);
                    return true;
                } catch {
                    return false;
                }
            }
        };
        
        this.messages = {
            required: 'This field is required',
            email: 'Please enter a valid email address',
            minLength: 'Must be at least {length} characters long',
            maxLength: 'Must be no more than {length} characters long',
            pattern: 'Please enter a valid format',
            password: 'Password must be at least 8 characters with uppercase, lowercase, and number',
            confirmPassword: 'Passwords do not match',
            phone: 'Please enter a valid phone number',
            url: 'Please enter a valid URL'
        };
        
        this.init();
    }
    
    init() {
        this.setupFormValidation();
        this.setupRealTimeValidation();
        this.setupFormSubmission();
    }
    
    setupFormValidation() {
        const forms = document.querySelectorAll('form[data-validate], .join-form, .contact-form, .auth-form, .recipe-form');
        
        forms.forEach(form => {
            form.addEventListener('submit', (e) => this.handleFormSubmit(e));
            
            // Add novalidate to prevent browser validation
            form.setAttribute('novalidate', 'true');
        });
    }
    
    setupRealTimeValidation() {
        // Real-time validation for inputs
        document.addEventListener('input', (e) => {
            if (e.target.matches('input, textarea, select')) {
                this.validateField(e.target);
            }
        });
        
        document.addEventListener('blur', (e) => {
            if (e.target.matches('input, textarea, select')) {
                this.validateField(e.target);
            }
        });
        
        // Special handling for password confirmation
        document.addEventListener('input', (e) => {
            if (e.target.name === 'confirmPassword' || e.target.id === 'confirmPassword') {
                const passwordField = document.querySelector('input[name="password"], #registerPassword, #password');
                if (passwordField) {
                    this.validatePasswordMatch(e.target, passwordField.value);
                }
            }
        });
    }
    
    setupFormSubmission() {
        // Join Us form submission
        const joinForm = document.getElementById('joinUsForm');
        if (joinForm) {
            joinForm.addEventListener('submit', (e) => this.handleJoinFormSubmit(e));
        }
        
        // Contact form submission
        const contactForm = document.getElementById('contactForm');
        if (contactForm) {
            contactForm.addEventListener('submit', (e) => this.handleContactFormSubmit(e));
        }
        
        // Newsletter forms
        const newsletterForms = document.querySelectorAll('.newsletter-form');
        newsletterForms.forEach(form => {
            form.addEventListener('submit', (e) => this.handleNewsletterSubmit(e));
        });
    }
    
    validateField(field) {
        const rules = this.getFieldRules(field);
        const value = field.value;
        let isValid = true;
        let errorMessage = '';
        
        for (const rule of rules) {
            const result = this.applyRule(rule, value, field);
            if (!result.valid) {
                isValid = false;
                errorMessage = result.message;
                break;
            }
        }
        
        this.showFieldValidation(field, isValid, errorMessage);
        return isValid;
    }
    
    getFieldRules(field) {
        const rules = [];
        
        // Required validation
        if (field.hasAttribute('required')) {
            rules.push({ type: 'required' });
        }
        
        // Type-based validation
        switch (field.type) {
            case 'email':
                if (field.value) rules.push({ type: 'email' });
                break;
            case 'tel':
                if (field.value) rules.push({ type: 'phone' });
                break;
            case 'url':
                if (field.value) rules.push({ type: 'url' });
                break;
            case 'password':
                if (field.value) rules.push({ type: 'password' });
                break;
        }
        
        // Attribute-based validation
        if (field.hasAttribute('minlength')) {
            rules.push({ type: 'minLength', value: parseInt(field.getAttribute('minlength')) });
        }
        
        if (field.hasAttribute('maxlength')) {
            rules.push({ type: 'maxLength', value: parseInt(field.getAttribute('maxlength')) });
        }
        
        if (field.hasAttribute('pattern')) {
            rules.push({ type: 'pattern', value: field.getAttribute('pattern') });
        }
        
        // Custom validation based on name/id
        if (field.name === 'confirmPassword' || field.id === 'confirmPassword') {
            const passwordField = document.querySelector('input[name="password"], #registerPassword, #password');
            if (passwordField) {
                rules.push({ type: 'confirmPassword', value: passwordField.value });
            }
        }
        
        return rules;
    }
    
    applyRule(rule, value, field) {
        const ruleFn = this.rules[rule.type];
        if (!ruleFn) return { valid: true };
        
        let valid;
        if (rule.value !== undefined) {
            valid = ruleFn(value, rule.value);
        } else {
            valid = ruleFn(value);
        }
        
        const message = this.messages[rule.type].replace('{length}', rule.value);
        
        return { valid, message };
    }
    
    validatePasswordMatch(confirmField, originalPassword) {
        const isValid = confirmField.value === originalPassword;
        const message = isValid ? '' : this.messages.confirmPassword;
        this.showFieldValidation(confirmField, isValid, message);
        return isValid;
    }
    
    showFieldValidation(field, isValid, message) {
        const errorElement = field.parentNode.nextElementSibling;
        
        if (isValid) {
            field.classList.remove('error');
            if (errorElement && errorElement.classList.contains('error-message')) {
                errorElement.textContent = '';
            }
        } else {
            field.classList.add('error');
            if (errorElement && errorElement.classList.contains('error-message')) {
                errorElement.textContent = message;
            }
        }
    }
    
    validateForm(form) {
        const fields = form.querySelectorAll('input, textarea, select');
        let isValid = true;
        
        fields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });
        
        // Check for checkbox requirements
        const requiredCheckboxes = form.querySelectorAll('input[type="checkbox"][required]');
        requiredCheckboxes.forEach(checkbox => {
            if (!checkbox.checked) {
                isValid = false;
                const errorElement = checkbox.closest('.checkbox-group').querySelector('.error-message');
                if (errorElement) {
                    errorElement.textContent = 'This field is required';
                }
            }
        });
        
        return isValid;
    }
    
    handleFormSubmit(e) {
        e.preventDefault();
        const form = e.target;
        
        if (!this.validateForm(form)) {
            // Focus on first error field
            const firstError = form.querySelector('.error');
            if (firstError) {
                firstError.focus();
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return false;
        }
        
        return true;
    }
    
    handleJoinFormSubmit(e) {
        e.preventDefault();
        
        if (!this.validateForm(e.target)) return;
        
        const formData = new FormData(e.target);
        const userData = {
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            email: formData.get('email'),
            password: formData.get('password'),
            newsletter: formData.get('newsletter') === 'on',
            terms: formData.get('terms') === 'on',
            registrationDate: new Date().toISOString()
        };
        
        // Simulate API call
        this.showFormLoading(e.target);
        
        setTimeout(() => {
            // Store user data (in real app, send to server)
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            
            // Check if email already exists
            if (users.find(user => user.email === userData.email)) {
                this.hideFormLoading(e.target);
                this.showFieldValidation(
                    e.target.querySelector('input[name="email"]'),
                    false,
                    'An account with this email already exists'
                );
                return;
            }
            
            users.push(userData);
            localStorage.setItem('users', JSON.stringify(users));
            
            this.hideFormLoading(e.target);
            
            // Close popup and show success
            document.getElementById('joinUsPopup').classList.remove('active');
            document.body.style.overflow = '';
            
            if (window.FoodFusion && window.FoodFusion.showNotification) {
                window.FoodFusion.showNotification(
                    'Welcome to FoodFusion! Your account has been created successfully.',
                    'success'
                );
            }
            
            e.target.reset();
        }, 2000);
    }
    
    async handleContactFormSubmit(e) {
        e.preventDefault();
        
        if (!this.validateForm(e.target)) return;
        
        const formData = new FormData(e.target);
        const contactData = {
            first_name: formData.get('firstName'),
            last_name: formData.get('lastName'),
            email: formData.get('email'),
            phone: formData.get('phone') || '',
            subject: formData.get('subject'),
            message: formData.get('message'),
            newsletter: formData.get('newsletter') === 'on',
            privacy: formData.get('privacy') === 'on'
        };
        
        this.showFormLoading(e.target);
        
        try {
            const response = await fetch('http://localhost:8000/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(contactData)
            });

            const data = await response.json();
            this.hideFormLoading(e.target);

            if (response.ok && data.success) {
                const successModal = document.getElementById('successModal');
                if (successModal) {
                    successModal.classList.add('active');
                    document.body.style.overflow = 'hidden';
                } else if (window.FoodFusion && window.FoodFusion.showNotification) {
                    window.FoodFusion.showNotification(
                        'Thank you for your message! We\'ll get back to you within 24 hours.',
                        'success'
                    );
                }
                e.target.reset();
            } else {
                if (window.FoodFusion && window.FoodFusion.showNotification) {
                    window.FoodFusion.showNotification(
                        data.detail || 'Failed to send message. Please try again.',
                        'error'
                    );
                }
            }
        } catch (error) {
            this.hideFormLoading(e.target);
            if (window.FoodFusion && window.FoodFusion.showNotification) {
                window.FoodFusion.showNotification(
                    'Network error. Please try again.',
                    'error'
                );
            }
            console.error('Contact form error:', error);
        }
    }
    
    async handleNewsletterSubmit(e) {
        e.preventDefault();
        
        const emailInput = e.target.querySelector('input[type="email"]');
        if (!this.validateField(emailInput)) return;
        
        const email = emailInput.value.trim();
        const submitBtn = e.target.querySelector('button[type="submit"]');
        
        this.showButtonLoading(submitBtn);
        
        try {
            const response = await fetch('http://localhost:8000/api/newsletter', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email: email })
            });

            const data = await response.json();
            this.hideButtonLoading(submitBtn);

            if (response.ok && data.success) {
                if (window.FoodFusion && window.FoodFusion.showNotification) {
                    window.FoodFusion.showNotification(
                        'Thank you for subscribing to our newsletter!',
                        'success'
                    );
                }
                emailInput.value = '';
            } else {
                if (window.FoodFusion && window.FoodFusion.showNotification) {
                    window.FoodFusion.showNotification(
                        data.detail || 'Subscription failed. Please try again.',
                        data.detail === 'Email already subscribed' ? 'info' : 'error'
                    );
                }
            }
        } catch (error) {
            this.hideButtonLoading(submitBtn);
            if (window.FoodFusion && window.FoodFusion.showNotification) {
                window.FoodFusion.showNotification(
                    'Network error. Please try again.',
                    'error'
                );
            }
            console.error('Newsletter subscription error:', error);
        }
    }
    
    showFormLoading(form) {
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            this.showButtonLoading(submitBtn);
        }
    }
    
    hideFormLoading(form) {
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            this.hideButtonLoading(submitBtn);
        }
    }
    
    showButtonLoading(button) {
        if (!button) return;
        
        button.disabled = true;
        const btnText = button.querySelector('.btn-text');
        const btnLoading = button.querySelector('.btn-loading');
        
        if (btnText && btnLoading) {
            btnText.style.display = 'none';
            btnLoading.style.display = 'inline-flex';
        } else {
            button.dataset.originalText = button.textContent;
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
        }
    }
    
    hideButtonLoading(button) {
        if (!button) return;
        
        button.disabled = false;
        const btnText = button.querySelector('.btn-text');
        const btnLoading = button.querySelector('.btn-loading');
        
        if (btnText && btnLoading) {
            btnText.style.display = 'inline';
            btnLoading.style.display = 'none';
        } else if (button.dataset.originalText) {
            button.textContent = button.dataset.originalText;
            delete button.dataset.originalText;
        }
    }
}

// File upload handler
class FileUploadHandler {
    constructor() {
        this.allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        this.maxSize = 5 * 1024 * 1024; // 5MB
        this.init();
    }
    
    init() {
        document.addEventListener('change', (e) => {
            if (e.target.type === 'file') {
                this.handleFileUpload(e.target);
            }
        });
        
        // Drag and drop functionality
        document.addEventListener('dragover', (e) => {
            const dropZone = e.target.closest('.file-drop-zone');
            if (dropZone) {
                e.preventDefault();
                dropZone.classList.add('drag-over');
            }
        });
        
        document.addEventListener('dragleave', (e) => {
            const dropZone = e.target.closest('.file-drop-zone');
            if (dropZone) {
                dropZone.classList.remove('drag-over');
            }
        });
        
        document.addEventListener('drop', (e) => {
            const dropZone = e.target.closest('.file-drop-zone');
            if (dropZone) {
                e.preventDefault();
                dropZone.classList.remove('drag-over');
                
                const files = Array.from(e.dataTransfer.files);
                const fileInput = dropZone.querySelector('input[type="file"]');
                if (fileInput) {
                    this.processFiles(files, fileInput);
                }
            }
        });
    }
    
    handleFileUpload(input) {
        const files = Array.from(input.files);
        this.processFiles(files, input);
    }
    
    processFiles(files, input) {
        const validFiles = [];
        const errors = [];
        
        files.forEach(file => {
            const validation = this.validateFile(file);
            if (validation.valid) {
                validFiles.push(file);
            } else {
                errors.push(`${file.name}: ${validation.error}`);
            }
        });
        
        if (errors.length > 0) {
            if (window.FoodFusion && window.FoodFusion.showNotification) {
                window.FoodFusion.showNotification(
                    `Upload errors: ${errors.join(', ')}`,
                    'error'
                );
            }
        }
        
        if (validFiles.length > 0) {
            this.previewFiles(validFiles, input);
        }
    }
    
    validateFile(file) {
        if (!this.allowedTypes.includes(file.type)) {
            return {
                valid: false,
                error: 'File type not allowed. Please use JPG, PNG, GIF, or WebP.'
            };
        }
        
        if (file.size > this.maxSize) {
            return {
                valid: false,
                error: 'File size too large. Maximum size is 5MB.'
            };
        }
        
        return { valid: true };
    }
    
    previewFiles(files, input) {
        const previewContainer = input.parentNode.querySelector('.file-preview') ||
                               input.parentNode.nextElementSibling;
        
        if (!previewContainer) return;
        
        previewContainer.innerHTML = '';
        
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const preview = document.createElement('div');
                preview.className = 'file-preview-item';
                preview.innerHTML = `
                    <img src="${e.target.result}" alt="Preview">
                    <div class="file-info">
                        <span class="file-name">${file.name}</span>
                        <span class="file-size">${this.formatFileSize(file.size)}</span>
                    </div>
                    <button type="button" class="remove-file" data-file-name="${file.name}">
                        <i class="fas fa-times"></i>
                    </button>
                `;
                previewContainer.appendChild(preview);
                
                // Add remove functionality
                preview.querySelector('.remove-file').addEventListener('click', () => {
                    preview.remove();
                });
            };
            reader.readAsDataURL(file);
        });
    }
    
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Initialize form validation when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    new FormValidator();
    new FileUploadHandler();
    
    // Initialize character counters
    initCharacterCounters();
    
    // Initialize auto-resize textareas
    initAutoResizeTextareas();
});

function initCharacterCounters() {
    const textareas = document.querySelectorAll('textarea[maxlength]');
    
    textareas.forEach(textarea => {
        const maxLength = parseInt(textarea.getAttribute('maxlength'));
        const counter = document.createElement('div');
        counter.className = 'character-count';
        counter.innerHTML = `<span class="current">0</span>/${maxLength} characters`;
        
        textarea.parentNode.appendChild(counter);
        
        const currentSpan = counter.querySelector('.current');
        
        textarea.addEventListener('input', function() {
            const currentLength = this.value.length;
            currentSpan.textContent = currentLength;
            
            if (currentLength > maxLength * 0.9) {
                counter.style.color = '#B8860B'; // warning color
            } else {
                counter.style.color = '';
            }
            
            if (currentLength > maxLength) {
                counter.style.color = '#A0522D'; // danger color
            }
        });
        
        // Initial count
        textarea.dispatchEvent(new Event('input'));
    });
}

function initAutoResizeTextareas() {
    const textareas = document.querySelectorAll('textarea[data-auto-resize]');
    
    textareas.forEach(textarea => {
        textarea.style.resize = 'none';
        textarea.style.overflow = 'hidden';
        
        function resize() {
            textarea.style.height = 'auto';
            textarea.style.height = textarea.scrollHeight + 'px';
        }
        
        textarea.addEventListener('input', resize);
        textarea.addEventListener('focus', resize);
        
        // Initial resize
        resize();
    });
}

// Export for use in other scripts
window.FormValidator = FormValidator;
window.FileUploadHandler = FileUploadHandler;
