// Firebase Navigation Authentication Handler
// Manages navigation bar auth state across all pages

(function() {
    'use strict';

    // Wait for Firebase to initialize
    function initNavAuth() {
        if (!window.firebaseAuth || !window.firebaseAuthFunctions) {
            console.error('Firebase not initialized for navigation');
            return;
        }

        const authFunctions = window.firebaseAuthFunctions;

        // Listen for auth state changes
        authFunctions.onAuthStateChanged((user) => {
            updateNavigation(user);
        });

        function updateNavigation(user) {
            const navLinks = document.querySelector('.nav-links');
            if (!navLinks) return;

            // Remove existing auth-related links
            const existingAuthLinks = navLinks.querySelectorAll('.auth-link');
            existingAuthLinks.forEach(link => link.remove());

            if (user) {
                // User is logged in
                // Remove login/register links if they exist
                const loginLink = navLinks.querySelector('a[href*="login"]');
                const registerLink = navLinks.querySelector('a[href*="register"]');
                if (loginLink) loginLink.style.display = 'none';
                if (registerLink) registerLink.style.display = 'none';

                // Add account link if it doesn't exist
                let accountLink = navLinks.querySelector('a[href*="account"]');
                if (!accountLink) {
                    accountLink = document.createElement('a');
                    accountLink.href = '/account';
                    accountLink.className = 'nav-link auth-link';
                    navLinks.appendChild(accountLink);
                }
                accountLink.innerHTML = '<i class="fas fa-user"></i> ' + (user.displayName || 'Account');
                accountLink.style.display = 'inline-block';

                // Add logout button if it doesn't exist
                let logoutLink = navLinks.querySelector('.logout-btn, a[href*="logout"]');
                if (!logoutLink) {
                    logoutLink = document.createElement('button');
                    logoutLink.className = 'nav-link auth-link logout-btn';
                    logoutLink.style.background = 'none';
                    logoutLink.style.border = 'none';
                    logoutLink.style.color = 'inherit';
                    logoutLink.style.cursor = 'pointer';
                    logoutLink.style.fontFamily = 'inherit';
                    logoutLink.style.fontSize = 'inherit';
                    logoutLink.style.padding = 'inherit';
                    navLinks.appendChild(logoutLink);
                }
                logoutLink.innerHTML = '<i class="fas fa-sign-out-alt"></i> Logout';
                logoutLink.style.display = 'inline-block';

                // Add logout event listener
                logoutLink.onclick = async (e) => {
                    e.preventDefault();
                    try {
                        const result = await authFunctions.logoutUser();
                        if (result.success) {
                            showNotification('Logged out successfully!', 'success');
                            setTimeout(() => {
                                window.location.href = '/';
                            }, 500);
                        }
                    } catch (error) {
                        console.error('Logout error:', error);
                        showNotification('Logout failed. Please try again.', 'error');
                    }
                };

                // Update cart count with user context
                updateCartCount();
            } else {
                // User is not logged in
                // Hide account and logout links
                const accountLink = navLinks.querySelector('a[href*="account"]');
                const logoutLink = navLinks.querySelector('.logout-btn, a[href*="logout"]');
                if (accountLink) accountLink.style.display = 'none';
                if (logoutLink) logoutLink.style.display = 'none';

                // Show login and register links
                let loginLink = navLinks.querySelector('a[href*="login"]');
                let registerLink = navLinks.querySelector('a[href*="register"]');
                
                if (!loginLink) {
                    loginLink = document.createElement('a');
                    loginLink.href = '/login';
                    loginLink.className = 'nav-link auth-link';
                    loginLink.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
                    navLinks.appendChild(loginLink);
                }
                loginLink.style.display = 'inline-block';

                if (!registerLink) {
                    registerLink = document.createElement('a');
                    registerLink.href = '/register';
                    registerLink.className = 'nav-link auth-link';
                    registerLink.innerHTML = '<i class="fas fa-user-plus"></i> Register';
                    navLinks.appendChild(registerLink);
                }
                registerLink.style.display = 'inline-block';
            }
        }

        function updateCartCount() {
            // This function will be enhanced when we update cart functionality
            const cartBadge = document.getElementById('cart-count');
            if (cartBadge) {
                // Cart count will be updated from local storage or API
            }
        }

        function showNotification(message, type) {
            const notification = document.createElement('div');
            notification.className = `alert alert-${type === 'success' ? 'success' : 'danger'} alert-dismissible fade show`;
            notification.style.position = 'fixed';
            notification.style.top = '20px';
            notification.style.right = '20px';
            notification.style.zIndex = '10000';
            notification.style.minWidth = '300px';
            notification.innerHTML = `
                <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            `;
            
            document.body.appendChild(notification);

            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 300);
            }, 3000);
        }
    }

    // Initialize when DOM and Firebase are ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(initNavAuth, 100); // Give Firebase time to initialize
        });
    } else {
        setTimeout(initNavAuth, 100);
    }
})();
