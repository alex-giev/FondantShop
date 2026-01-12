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

            // Get references to existing links
            const accountLink = navLinks.querySelector('a[href*="account"]');
            const logoutLink = navLinks.querySelector('.logout-btn, a[href*="logout"]');
            const loginLink = navLinks.querySelector('a[href*="login"]');
            const registerLink = navLinks.querySelector('a[href*="register"]');

            if (user) {
                // User is logged in - show account and logout, hide login and register
                if (accountLink) {
                    accountLink.innerHTML = '<i class="fas fa-user"></i> ' + (user.displayName || 'Account');
                    accountLink.style.display = 'inline-block';
                }
                if (logoutLink) {
                    logoutLink.style.display = 'inline-block';
                }
                if (loginLink) loginLink.style.display = 'none';
                if (registerLink) registerLink.style.display = 'none';

                // Add logout event listener if not already added
                if (logoutLink && !logoutLink.hasAttribute('data-logout-handler')) {
                    logoutLink.setAttribute('data-logout-handler', 'true');
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
                }

                // Update cart count with user context
                updateCartCount();
            } else {
                // User is not logged in - hide account and logout, show login and register
                if (accountLink) accountLink.style.display = 'none';
                if (logoutLink) logoutLink.style.display = 'none';
                if (loginLink) loginLink.style.display = 'inline-block';
                if (registerLink) registerLink.style.display = 'inline-block';
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
