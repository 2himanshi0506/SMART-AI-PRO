/**
 * Smart AI Assistant Pro - Authentication JavaScript
 * Handles password toggle, validation, and animations
 */

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', function() {
    initializeParticles();
    initializeFormValidation();
    initializeCardAnimation();
});

/**
 * Create floating particles
 */
function initializeParticles() {
    const particlesContainer = document.getElementById('particles');
    if (!particlesContainer) return;
    
    const particleCount = 30;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 15 + 's';
        particle.style.animationDuration = (Math.random() * 10 + 10) + 's';
        particlesContainer.appendChild(particle);
    }
}

/**
 * Toggle password visibility - FIXED VERSION
 */
function togglePassword(inputId, iconId) {
    const input = document.getElementById(inputId);
    
    if (input) {
        if (input.type === 'password') {
            input.type = 'text';
            // Find icon by ID or by finding it near the input
            let icon = iconId ? document.getElementById(iconId) : null;
            if (!icon) {
                // Fallback: find icon in the same wrapper
                const wrapper = input.parentElement;
                icon = wrapper.querySelector('.toggle-password i');
            }
            if (icon) {
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            }
        } else {
            input.type = 'password';
            let icon = iconId ? document.getElementById(iconId) : null;
            if (!icon) {
                const wrapper = input.parentElement;
                icon = wrapper.querySelector('.toggle-password i');
            }
            if (icon) {
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        }
    }
}

// Make function globally available
window.togglePassword = togglePassword;

/**
 * Initialize form validation
 */
function initializeFormValidation() {
    const signupForm = document.getElementById('signupForm');
    const loginForm = document.getElementById('loginForm');
    
    if (signupForm) {
        setupSignupValidation();
    }
    
    if (loginForm) {
        setupLoginValidation();
    }
}

/**
 * Setup signup form validation - FIXED
 */
function setupSignupValidation() {
    const password = document.getElementById('password');
    const confirmPassword = document.getElementById('confirm_password');
    const submitBtn = document.getElementById('submitBtn');
    const strengthBar = document.getElementById('strengthBar');
    const passwordMatch = document.getElementById('passwordMatch');
    const passwordMismatch = document.getElementById('passwordMismatch');
    
    // Password strength checker
    if (password) {
        password.addEventListener('input', function() {
            const strength = checkPasswordStrength(this.value);
            
            if (strengthBar) {
                strengthBar.className = 'strength-bar';
                
                if (this.value.length === 0) {
                    strengthBar.style.width = '0';
                } else if (strength === 'weak') {
                    strengthBar.classList.add('weak');
                } else if (strength === 'medium') {
                    strengthBar.classList.add('medium');
                } else if (strength === 'strong') {
                    strengthBar.classList.add('strong');
                }
            }
        });
    }
    
    // Password match checker
    if (confirmPassword) {
        confirmPassword.addEventListener('input', function() {
            if (passwordMatch && passwordMismatch) {
                if (this.value.length === 0) {
                    passwordMatch.style.display = 'none';
                    passwordMismatch.style.display = 'none';
                    this.classList.remove('error', 'success');
                    // Enable button when empty
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.style.opacity = '1';
                        submitBtn.style.cursor = 'pointer';
                    }
                } else if (password.value === this.value) {
                    passwordMatch.style.display = 'flex';
                    passwordMismatch.style.display = 'none';
                    this.classList.add('success');
                    this.classList.remove('error');
                    // Enable button when passwords match
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.style.opacity = '1';
                        submitBtn.style.cursor = 'pointer';
                    }
                } else {
                    passwordMatch.style.display = 'none';
                    passwordMismatch.style.display = 'flex';
                    this.classList.add('error');
                    this.classList.remove('success');
                    // Don't disable button - let user click and show alert
                }
            }
        });
    }
    
    // Real-time validation on blur
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        const inputs = signupForm.querySelectorAll('.input-field');
        inputs.forEach(input => {
            input.addEventListener('blur', function() {
                validateField(this);
            });
            
            input.addEventListener('input', function() {
                if (this.classList.contains('error')) {
                    validateField(this);
                }
            });
        });
        
        // Form submission - FIXED
        signupForm.addEventListener('submit', function(e) {
            // Don't prevent default - let form validate first
            if (!validateForm()) {
                e.preventDefault();
                return false;
            }
            // Form will submit normally
            return true;
        });
    }
    
    function checkPasswordStrength(password) {
        let score = 0;
        
        if (password.length >= 8) score++;
        if (password.length >= 12) score++;
        if (/[a-z]/.test(password)) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^a-zA-Z0-9]/.test(password)) score++;
        
        if (score <= 2) return 'weak';
        if (score <= 4) return 'medium';
        return 'strong';
    }
    
    function showFieldError(field, message) {
        field.classList.add('error');
        field.classList.remove('success');
        
        // Remove existing error message
        const existingError = field.parentElement.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }
        
        // Create new error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error error-message';
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        
        field.parentElement.appendChild(errorDiv);
    }
    
    function clearFieldError(field) {
        field.classList.remove('error');
        
        const errorDiv = field.parentElement.querySelector('.field-error');
        if (errorDiv) {
            errorDiv.style.display = 'none';
        }
    }
    
    function validateField(field) {
        const value = field.value.trim();
        const fieldName = field.name;
        
        if (field.hasAttribute('required') && !value) {
            showFieldError(field, 'This field is required');
            return false;
        }
        
        if (field.type === 'email' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                showFieldError(field, 'Please enter a valid email address');
                return false;
            }
        }
        
        if (fieldName === 'username' && value) {
            if (value.length < 3) {
                showFieldError(field, 'Username must be at least 3 characters');
                return false;
            }
        }
        
        if (fieldName === 'password' && value) {
            if (value.length < 6) {
                showFieldError(field, 'Password must be at least 6 characters');
                return false;
            }
        }
        
        clearFieldError(field);
        return true;
    }
    
    function validateForm() {
        const signupForm = document.getElementById('signupForm');
        if (!signupForm) return false;
        
        const inputs = signupForm.querySelectorAll('.input-field');
        let isValid = true;
        
        inputs.forEach(input => {
            if (!validateField(input)) {
                isValid = false;
            }
        });
        
        // Check password match
        if (password && confirmPassword) {
            if (password.value !== confirmPassword.value) {
                showFieldError(confirmPassword, 'Passwords do not match');
                isValid = false;
            }
        }
        
        return isValid;
    }
}

/**
 * Setup login form validation
 */
function setupLoginValidation() {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;
    
    loginForm.addEventListener('submit', function(e) {
        const username = document.getElementById('username');
        const password = document.getElementById('password');
        
        let isValid = true;
        
        if (!username.value.trim()) {
            showFieldError(username, 'Username is required');
            isValid = false;
        }
        
        if (!password.value.trim()) {
            showFieldError(password, 'Password is required');
            isValid = false;
        }
        
        if (!isValid) {
            e.preventDefault();
        }
    });
    
    function showFieldError(field, message) {
        field.classList.add('error');
        
        const existingError = field.parentElement.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error error-message';
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        
        field.parentElement.appendChild(errorDiv);
    }
}

/**
 * Add smooth entrance animation to card
 */
function initializeCardAnimation() {
    window.addEventListener('load', function() {
        const card = document.querySelector('.auth-card');
        if (card) {
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px)';
            
            setTimeout(() => {
                card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, 100);
        }
    });
}

/**
 * Handle input focus effects
 */
document.querySelectorAll('.input-field').forEach(input => {
    input.addEventListener('focus', function() {
        this.parentElement.classList.add('focused');
    });
    
    input.addEventListener('blur', function() {
        this.parentElement.classList.remove('focused');
    });

    
});

