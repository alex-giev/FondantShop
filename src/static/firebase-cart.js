// Firebase Cart Management
// Uses localStorage for cart data and Firebase for user authentication

(function() {
    'use strict';

    const CART_STORAGE_KEY = 'fondant_cart';

    // Cart object
    window.FirebaseCart = {
        // Get cart from localStorage
        getCart: function() {
            try {
                const cartData = localStorage.getItem(CART_STORAGE_KEY);
                return cartData ? JSON.parse(cartData) : [];
            } catch (error) {
                console.error('Error reading cart:', error);
                return [];
            }
        },

        // Save cart to localStorage
        saveCart: function(cart) {
            try {
                localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
                this.updateCartCount();
            } catch (error) {
                console.error('Error saving cart:', error);
            }
        },

        // Add item to cart
        addItem: function(productId, productName, productPrice, productImage, quantity = 1) {
            const cart = this.getCart();
            
            // Check if item already exists
            const existingItemIndex = cart.findIndex(item => item.productId === productId);
            
            if (existingItemIndex >= 0) {
                // Update quantity
                cart[existingItemIndex].quantity += quantity;
            } else {
                // Add new item
                cart.push({
                    productId,
                    productName,
                    productPrice,
                    productImage,
                    quantity,
                    addedAt: new Date().toISOString()
                });
            }
            
            this.saveCart(cart);
            return { success: true, itemCount: cart.length };
        },

        // Remove item from cart
        removeItem: function(productId) {
            let cart = this.getCart();
            cart = cart.filter(item => item.productId !== productId);
            this.saveCart(cart);
            return { success: true, itemCount: cart.length };
        },

        // Update item quantity
        updateQuantity: function(productId, quantity) {
            const cart = this.getCart();
            const itemIndex = cart.findIndex(item => item.productId === productId);
            
            if (itemIndex >= 0) {
                if (quantity <= 0) {
                    return this.removeItem(productId);
                }
                cart[itemIndex].quantity = quantity;
                this.saveCart(cart);
                return { success: true };
            }
            
            return { success: false, error: 'Item not found' };
        },

        // Clear cart
        clearCart: function() {
            localStorage.removeItem(CART_STORAGE_KEY);
            this.updateCartCount();
            return { success: true };
        },

        // Get cart count
        getCartCount: function() {
            const cart = this.getCart();
            return cart.reduce((total, item) => total + item.quantity, 0);
        },

        // Get cart total
        getCartTotal: function() {
            const cart = this.getCart();
            return cart.reduce((total, item) => total + (item.productPrice * item.quantity), 0);
        },

        // Update cart count badge in navigation
        updateCartCount: function() {
            const count = this.getCartCount();
            const cartBadge = document.getElementById('cart-count');
            const cartLink = document.querySelector('a[href*="cart"]');
            
            if (cartBadge) {
                cartBadge.textContent = count;
                cartBadge.style.display = count > 0 ? 'inline-block' : 'none';
            }
            
            // If cart badge doesn't exist, create it
            if (!cartBadge && cartLink && count > 0) {
                const badge = document.createElement('span');
                badge.id = 'cart-count';
                badge.className = 'cart-badge';
                badge.textContent = count;
                badge.style.cssText = `
                    position: absolute;
                    top: -5px;
                    right: -10px;
                    background-color: #ff69b4;
                    color: white;
                    border-radius: 50%;
                    padding: 2px 6px;
                    font-size: 0.75rem;
                    font-weight: bold;
                `;
                
                // Make cart link position relative if not already
                if (cartLink.style.position !== 'relative') {
                    cartLink.style.position = 'relative';
                }
                
                cartLink.appendChild(badge);
            }
        },

        // Initialize cart on page load
        init: function() {
            this.updateCartCount();
            
            // Listen for storage events (cart changes in other tabs)
            window.addEventListener('storage', (e) => {
                if (e.key === CART_STORAGE_KEY) {
                    this.updateCartCount();
                }
            });
        }
    };

    // Initialize cart when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.FirebaseCart.init();
        });
    } else {
        window.FirebaseCart.init();
    }

    // Expose helper function for adding to cart from product pages
    window.addToCart = function(productId, productName, productPrice, productImage, quantity = 1) {
        const user = window.firebaseAuthFunctions?.getCurrentUser();
        
        if (!user) {
            const shouldLogin = confirm('Please log in to add items to your cart.\n\nClick OK to go to login page.');
            if (shouldLogin) {
                window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
            }
            return;
        }

        const result = window.FirebaseCart.addItem(productId, productName, productPrice, productImage, quantity);
        
        if (result.success) {
            showNotification(`${productName} added to cart!`, 'success');
        } else {
            showNotification('Failed to add item to cart', 'error');
        }
    };

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
})();
