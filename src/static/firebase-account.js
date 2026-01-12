// Firebase Account Management
(function() {
    'use strict';

    // Wait for Firebase to initialize
    window.addEventListener('load', function() {
        if (!window.firebaseAuth || !window.firebaseAuthFunctions) {
            console.error('Firebase not initialized');
            window.location.href = '/';
            return;
        }

        const auth = window.firebaseAuth;
        const authFunctions = window.firebaseAuthFunctions;

        // Check authentication state
        authFunctions.onAuthStateChanged((user) => {
            if (user) {
                // User is logged in
                displayUserInfo(user);
                updateNavigation(true, user);
            } else {
                // User is not logged in, redirect to home after a brief delay
                // to allow for auth state restoration
                setTimeout(() => {
                    const currentUser = auth.currentUser;
                    if (!currentUser) {
                        window.location.href = '/';
                    } else {
                        displayUserInfo(currentUser);
                        updateNavigation(true, currentUser);
                    }
                }, 1000);
            }
        });

        // Display user information
        function displayUserInfo(user) {
            const userNameElement = document.getElementById('user-name');
            const userEmailElement = document.getElementById('user-email');
            const userMemberSinceElement = document.getElementById('user-member-since');

            if (userNameElement) {
                userNameElement.textContent = user.displayName || 'User';
            }

            if (userEmailElement) {
                userEmailElement.textContent = user.email;
            }

            if (userMemberSinceElement && user.metadata && user.metadata.creationTime) {
                const creationDate = new Date(user.metadata.creationTime);
                userMemberSinceElement.textContent = creationDate.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            }

            // Display email verification status
            const emailVerifiedElement = document.getElementById('email-verified-status');
            if (emailVerifiedElement) {
                if (user.emailVerified) {
                    emailVerifiedElement.innerHTML = '<span class="badge bg-success"><i class="fas fa-check-circle"></i> Email Verified</span>';
                } else {
                    emailVerifiedElement.innerHTML = '<span class="badge bg-warning"><i class="fas fa-exclamation-circle"></i> Email Not Verified</span> <button class="btn btn-sm btn-outline-primary ms-2" id="resend-verification">Resend Verification Email</button>';
                    
                    // Add event listener for resend verification
                    document.getElementById('resend-verification').addEventListener('click', resendVerificationEmail);
                }
            }
        }

        // Update navigation based on auth state
        function updateNavigation(isLoggedIn, user) {
            const accountLink = document.querySelector('a[href*="account"]');
            const logoutLink = document.querySelector('a[href*="logout"]');
            
            if (isLoggedIn) {
                if (accountLink) {
                    accountLink.style.display = 'inline-block';
                    accountLink.innerHTML = '<i class="fas fa-user"></i> ' + (user.displayName || 'Account');
                }
                if (logoutLink) {
                    logoutLink.style.display = 'inline-block';
                }
            } else {
                if (accountLink) accountLink.style.display = 'none';
                if (logoutLink) logoutLink.style.display = 'none';
            }
        }

        // Resend verification email
        async function resendVerificationEmail() {
            const user = authFunctions.getCurrentUser();
            if (!user) return;

            try {
                await user.sendEmailVerification();
                showNotification('Verification email sent! Please check your inbox.', 'success');
            } catch (error) {
                console.error('Error sending verification email:', error);
                showNotification('Failed to send verification email. Please try again later.', 'error');
            }
        }

        // Logout functionality
        const logoutButtons = document.querySelectorAll('a[href*="logout"], .logout-btn');
        logoutButtons.forEach(button => {
            button.addEventListener('click', async (e) => {
                e.preventDefault();
                
                try {
                    const result = await authFunctions.logoutUser();
                    if (result.success) {
                        showNotification('Logged out successfully!', 'success');
                        setTimeout(() => {
                            window.location.href = '/';
                        }, 1000);
                    } else {
                        showNotification('Logout failed. Please try again.', 'error');
                    }
                } catch (error) {
                    console.error('Logout error:', error);
                    showNotification('An error occurred during logout.', 'error');
                }
            });
        });

        // Show notification
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
    });
})();
