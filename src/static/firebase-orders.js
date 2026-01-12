// Firebase Order Management
// Stores order history in localStorage with Firebase user association

(function() {
    'use strict';

    const ORDERS_STORAGE_KEY = 'fondant_orders';

    // Order management object
    window.FirebaseOrders = {
        // Get orders for current user
        getOrders: function() {
            try {
                const user = window.firebaseAuth?.currentUser;
                if (!user) return [];

                const allOrders = localStorage.getItem(ORDERS_STORAGE_KEY);
                const ordersData = allOrders ? JSON.parse(allOrders) : {};
                
                // Return orders for this user
                return ordersData[user.uid] || [];
            } catch (error) {
                console.error('Error reading orders:', error);
                return [];
            }
        },

        // Save order after successful checkout
        saveOrder: function(orderData) {
            try {
                const user = window.firebaseAuth?.currentUser;
                if (!user) {
                    console.error('No user logged in, cannot save order');
                    return { success: false, error: 'No user logged in' };
                }

                // Get all orders
                const allOrders = localStorage.getItem(ORDERS_STORAGE_KEY);
                const ordersData = allOrders ? JSON.parse(allOrders) : {};
                
                // Get user's orders
                if (!ordersData[user.uid]) {
                    ordersData[user.uid] = [];
                }

                // Create order object
                const order = {
                    id: orderData.orderId || `ORD-${Date.now()}`,
                    sessionId: orderData.sessionId,
                    items: orderData.items,
                    total: orderData.total,
                    status: 'completed',
                    date: new Date().toISOString(),
                    customerEmail: user.email,
                    customerName: user.displayName || user.email
                };

                // Add to user's orders
                ordersData[user.uid].unshift(order); // Add to beginning of array

                // Save back to localStorage
                localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(ordersData));
                
                console.log('Order saved successfully:', order.id);
                return { success: true, order };
            } catch (error) {
                console.error('Error saving order:', error);
                return { success: false, error: error.message };
            }
        },

        // Get order by ID
        getOrderById: function(orderId) {
            const orders = this.getOrders();
            return orders.find(order => order.id === orderId);
        },

        // Get order count for current user
        getOrderCount: function() {
            return this.getOrders().length;
        },

        // Clear orders (for testing)
        clearOrders: function() {
            try {
                const user = window.firebaseAuth?.currentUser;
                if (!user) return { success: false };

                const allOrders = localStorage.getItem(ORDERS_STORAGE_KEY);
                const ordersData = allOrders ? JSON.parse(allOrders) : {};
                
                delete ordersData[user.uid];
                localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(ordersData));
                
                return { success: true };
            } catch (error) {
                console.error('Error clearing orders:', error);
                return { success: false, error: error.message };
            }
        },

        // Display orders on account page
        displayOrders: function(containerId = 'order-history-container') {
            const container = document.getElementById(containerId);
            if (!container) {
                console.warn('Order history container not found');
                return;
            }

            const orders = this.getOrders();
            
            if (orders.length === 0) {
                container.innerHTML = `
                    <div class="text-center py-5">
                        <i class="fas fa-shopping-basket fa-4x mb-3" style="color: #FFD1DC;"></i>
                        <h4>No Orders Yet</h4>
                        <p style="color: #5A5A5A;">Start shopping to see your order history here!</p>
                        <a href="/products" class="btn btn-primary mt-3">
                            <i class="fas fa-shopping-bag"></i> Browse Products
                        </a>
                    </div>
                `;
                return;
            }

            // Display orders
            let ordersHTML = '<div class="orders-list">';
            
            orders.forEach(order => {
                const orderDate = new Date(order.date);
                const formattedDate = orderDate.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
                
                const itemCount = order.items.length;
                const itemText = itemCount === 1 ? '1 item' : `${itemCount} items`;
                
                // Get first few item names
                const itemNames = order.items.slice(0, 2).map(item => item.name).join(', ');
                const moreText = itemCount > 2 ? ` and ${itemCount - 2} more` : '';

                ordersHTML += `
                    <div class="order-card mb-3" style="background: white; border-radius: 10px; padding: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                        <div class="d-flex justify-content-between align-items-start mb-3">
                            <div>
                                <h5 class="mb-1" style="color: #333;">
                                    <i class="fas fa-box" style="color: #FF69B4;"></i> Order ${order.id}
                                </h5>
                                <small class="text-muted">
                                    <i class="far fa-calendar"></i> ${formattedDate}
                                </small>
                            </div>
                            <span class="badge bg-success" style="font-size: 0.9em;">
                                <i class="fas fa-check-circle"></i> Completed
                            </span>
                        </div>
                        
                        <div class="order-details mb-3">
                            <p class="mb-1" style="color: #666;">
                                <strong>${itemText}:</strong> ${itemNames}${moreText}
                            </p>
                            <p class="mb-0" style="color: #FF69B4; font-size: 1.2em; font-weight: 600;">
                                Total: $${parseFloat(order.total).toFixed(2)}
                            </p>
                        </div>
                        
                        <div class="order-items-list mt-3" style="border-top: 1px solid #eee; padding-top: 15px;">
                            ${order.items.map(item => `
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <div class="d-flex align-items-center gap-2">
                                        ${item.image ? `<img src="${item.image}" alt="${item.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 5px;">` : ''}
                                        <div>
                                            <div style="font-weight: 500;">${item.name}</div>
                                            ${item.variant ? `<small class="text-muted">${item.variant}</small>` : ''}
                                        </div>
                                    </div>
                                    <div class="text-end">
                                        <div style="color: #666;">x${item.quantity}</div>
                                        <div style="color: #FF69B4; font-weight: 600;">$${(item.price * item.quantity).toFixed(2)}</div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                        
                        <div class="mt-3">
                            <small class="text-muted">
                                <i class="fas fa-info-circle"></i> 
                                Order confirmation sent to ${order.customerEmail}
                            </small>
                        </div>
                    </div>
                `;
            });
            
            ordersHTML += '</div>';
            container.innerHTML = ordersHTML;
        }
    };

    // Auto-initialize on page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            console.log('Firebase Orders module loaded');
        });
    } else {
        console.log('Firebase Orders module loaded');
    }

    // Expose globally for easy access
    window.firebaseOrders = window.FirebaseOrders;
})();
