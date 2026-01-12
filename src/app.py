import json
import os
from flask import Flask, render_template, request, jsonify, flash, redirect, url_for, session
import stripe
from dotenv import load_dotenv
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
import sqlite3
from datetime import datetime

# Load environment variables from .env file (only for local development)
# In production (Vercel), environment variables are automatically available
if os.path.exists('.env'):
    load_dotenv('.env')
elif os.path.exists('../.env'):
    load_dotenv('../.env')

app = Flask(__name__)
app.secret_key = os.getenv('FLASK_SECRET_KEY', 'fallback-secret-key-change-in-production')

# Session configuration for production hosting
app.config['SESSION_COOKIE_SECURE'] = os.getenv('SESSION_COOKIE_SECURE', 'False') == 'True'  # Set to True for HTTPS
app.config['SESSION_COOKIE_HTTPONLY'] = True  # Prevent JavaScript access to session cookie
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'  # CSRF protection
app.config['PERMANENT_SESSION_LIFETIME'] = 86400  # 24 hours in seconds
app.config['SESSION_COOKIE_NAME'] = 'fondant_session'  # Custom session cookie name

# Base URL configuration (change to your domain in production)
BASE_URL = os.getenv('BASE_URL', 'http://localhost:5000')

# Stripe configuration - strip quotes if present
print("=== STRIPE CONFIGURATION DEBUG ===")
print(f"Raw STRIPE_SECRET_KEY from env: {repr(os.getenv('STRIPE_SECRET_KEY', 'NOT_SET'))}")
print(f"Raw STRIPE_PUBLISHABLE_KEY from env: {repr(os.getenv('STRIPE_PUBLISHABLE_KEY', 'NOT_SET'))}")

stripe_secret = os.getenv('STRIPE_SECRET_KEY', '')
if stripe_secret:
    # Remove surrounding quotes if present (from .env files)
    stripe_secret = stripe_secret.strip().strip("'").strip('"')
    print(f"Cleaned STRIPE_SECRET_KEY: {stripe_secret[:30] if len(stripe_secret) > 30 else stripe_secret}...")
stripe.api_key = stripe_secret if stripe_secret else None

stripe_pub_key = os.getenv('STRIPE_PUBLISHABLE_KEY', 'pk_test_default')
if stripe_pub_key and stripe_pub_key != 'pk_test_default':
    stripe_pub_key = stripe_pub_key.strip().strip("'").strip('"')
    print(f"Cleaned STRIPE_PUBLISHABLE_KEY: {stripe_pub_key[:30]}...")
STRIPE_PUBLISHABLE_KEY = stripe_pub_key

STRIPE_WEBHOOK_SECRET = os.getenv('STRIPE_WEBHOOK_SECRET', '')  # Optional for local testing

# Debug: Print to verify keys are loaded
if not stripe.api_key:
    print("WARNING: STRIPE_SECRET_KEY not found in environment variables!")
    print("Stripe payments will not work until this is configured in Vercel.")
else:
    print(f"Stripe API Key loaded: {stripe.api_key[:20]}...")
    
if not STRIPE_PUBLISHABLE_KEY or STRIPE_PUBLISHABLE_KEY == 'pk_test_default':
    print("WARNING: STRIPE_PUBLISHABLE_KEY not found in environment variables!")
else:
    print(f"Stripe Publishable Key loaded: {STRIPE_PUBLISHABLE_KEY[:20]}...")

# Database configuration
DATABASE = 'fondant_shop.db'

# Database configuration
DATABASE = 'fondant_shop.db'

def get_db():
    """Get database connection"""
    db = sqlite3.connect(DATABASE)
    db.row_factory = sqlite3.Row
    return db

def init_db():
    """Initialize the database with tables"""
    db = get_db()
    db.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            first_name TEXT,
            last_name TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    db.execute('''
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            product_name TEXT NOT NULL,
            product_price REAL NOT NULL,
            stripe_session_id TEXT,
            status TEXT DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    db.commit()
    db.close()

# Skip database initialization on Vercel (read-only filesystem)
# Orders are tracked through Stripe dashboard
# init_db()

def login_required(f):
    """Decorator to require login for routes"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            flash('Please log in to access this page.', 'error')
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

def load_products():
    """Utility function to load products from the JSON file."""
    try:
        base_dir = os.path.dirname(os.path.abspath(__file__))
        file_path = os.path.join(base_dir, 'data', 'extracted_products.json')
        with open(file_path, 'r') as f:
            return json.load(f)
    except (json.JSONDecodeError, FileNotFoundError) as e:
        print(f"Error loading products: {e}")
        return []

@app.route('/')
def home():
    product_list = load_products()
    return render_template('index.html', products=product_list)

@app.route('/debug/stripe')
def debug_stripe():
    """Debug endpoint to check Stripe configuration"""
    return jsonify({
        'stripe_api_key_set': stripe.api_key is not None and stripe.api_key != '',
        'stripe_api_key_length': len(stripe.api_key) if stripe.api_key else 0,
        'stripe_api_key_prefix': stripe.api_key[:7] if stripe.api_key else 'None',
        'stripe_publishable_key_set': STRIPE_PUBLISHABLE_KEY != 'pk_test_default',
        'stripe_publishable_key_prefix': STRIPE_PUBLISHABLE_KEY[:7] if STRIPE_PUBLISHABLE_KEY else 'None',
        'env_vars_raw': {
            'STRIPE_SECRET_KEY_exists': os.getenv('STRIPE_SECRET_KEY') is not None,
            'STRIPE_PUBLISHABLE_KEY_exists': os.getenv('STRIPE_PUBLISHABLE_KEY') is not None
        }
    })

@app.route('/products')
def products():
    product_list = load_products()
    # Add ID to each product for routing
    for idx, product in enumerate(product_list):
        product['id'] = idx
    return render_template('products.html', products=product_list, stripe_publishable_key=STRIPE_PUBLISHABLE_KEY)

@app.route('/product/<int:product_id>')
def product_detail(product_id):
    """Display individual product detail page"""
    product_list = load_products()
    
    if 0 <= product_id < len(product_list):
        product = product_list[product_id].copy()
        product['id'] = product_id
        
        # Placeholder data for product variants and ratings
        product['variants'] = [
            {'name': 'Small', 'price_modifier': 0},
            {'name': 'Medium', 'price_modifier': 5},
            {'name': 'Large', 'price_modifier': 10}
        ]
        product['colors'] = ['Pink', 'Blue', 'White', 'Pastel Mix', 'Custom']
        product['rating'] = 4.8
        product['review_count'] = 127
        product['reviews'] = [
            {'name': 'Sarah M.', 'rating': 5, 'date': '2026-01-05', 'comment': 'Absolutely beautiful! Perfect for my daughter\'s birthday cake.'},
            {'name': 'John D.', 'rating': 5, 'date': '2026-01-03', 'comment': 'High quality and exactly as pictured. Will order again!'},
            {'name': 'Emily R.', 'rating': 4, 'date': '2025-12-28', 'comment': 'Very nice, though shipping took a bit longer than expected.'}
        ]
        product['description'] = 'Handcrafted fondant decoration perfect for adding a special touch to your celebration. Each piece is carefully made with attention to detail using high-quality, food-safe fondant. Can be customized to match your color scheme and theme.'
        product['details'] = [
            'Handmade with premium fondant',
            '100% edible and food-safe',
            'Custom colors available upon request',
            'Made to order - ships within 1-2 weeks',
            'Store in cool, dry place away from direct sunlight'
        ]
        
        return render_template('product_detail.html', product=product, stripe_publishable_key=STRIPE_PUBLISHABLE_KEY)
    
    flash('Product not found', 'error')
    return redirect(url_for('products'))

@app.route('/contact')
def contact():
    return render_template('contact.html')

@app.route('/contact', methods=['POST'])
def contact_submit():
    """Handle contact form submission"""
    try:
        name = request.form.get('name')
        email = request.form.get('email')
        subject = request.form.get('subject')
        message = request.form.get('message')
        
        # Email configuration
        email_host = os.getenv('EMAIL_HOST', 'smtp.gmail.com')
        email_port = int(os.getenv('EMAIL_PORT', 587))
        email_user = os.getenv('EMAIL_USER')
        email_password = os.getenv('EMAIL_PASSWORD')
        
        if not all([email_user, email_password]):
            flash('Email configuration error. Please try again later.', 'error')
            return redirect(url_for('contact'))
        
        # Create email
        msg = MIMEMultipart()
        msg['From'] = email_user
        msg['To'] = email_user
        msg['Subject'] = f"Contact Form: {subject}"
        
        body = f"""
        New contact form submission:
        
        Name: {name}
        Email: {email}
        Subject: {subject}
        
        Message:
        {message}
        """
        
        msg.attach(MIMEText(body, 'plain'))
        
        # Send email
        with smtplib.SMTP(email_host, email_port) as server:
            server.starttls()
            server.login(email_user, email_password)
            server.send_message(msg)
        
        flash('Thank you! Your message has been sent successfully.', 'success')
        return redirect(url_for('contact'))
        
    except Exception as e:
        print(f"Error sending email: {e}")
        flash('Sorry, there was an error sending your message. Please try again.', 'error')
        return redirect(url_for('contact'))

@app.route('/reviews')
def reviews():
    # Sample reviews data
    reviews_data = [
        {
            'name': 'Sarah M.',
            'rating': 5,
            'date': 'December 2025',
            'text': 'Absolutely stunning work! The fondant animals were perfect for my daughter\'s farm-themed birthday. Everyone was amazed by the detail!',
            'image': None
        },
        {
            'name': 'Jennifer K.',
            'rating': 5,
            'date': 'November 2025',
            'text': 'Beautiful toppers and arrived quickly! The woodland creatures were exactly as pictured. Will definitely order again!',
            'image': None
        },
        {
            'name': 'Lisa R.',
            'rating': 5,
            'date': 'October 2025',
            'text': 'The jellyfish topper was absolutely gorgeous! It was the centerpiece of our ocean-themed party. Highly recommend!',
            'image': None
        },
        {
            'name': 'Amanda T.',
            'rating': 5,
            'date': 'September 2025',
            'text': 'Professional quality and amazing customer service. The winter animals set made our holiday cake truly special!',
            'image': None
        },
        {
            'name': 'Michelle D.',
            'rating': 5,
            'date': 'August 2025',
            'text': 'These toppers are works of art! Worth every penny. The attention to detail is incredible.',
            'image': None
        },
        {
            'name': 'Rachel P.',
            'rating': 5,
            'date': 'July 2025',
            'text': 'Perfect for our beach wedding cake! The seashells looked so realistic. Thank you for making our day special!',
            'image': None
        }
    ]
    return render_template('reviews.html', reviews=reviews_data)

@app.route('/qa')
def qa():
    # FAQ data
    faq_data = [
        {
            'question': 'How far in advance should I order?',
            'answer': 'We recommend ordering at least 2-3 weeks in advance for custom orders. Standard toppers can usually be prepared within 1 week. For rush orders, please contact us directly.'
        },
        {
            'question': 'Are your fondant decorations edible?',
            'answer': 'Yes! All our fondant toppers are made from 100% edible, food-safe ingredients. However, many customers choose to keep them as keepsakes due to their detailed craftsmanship.'
        },
        {
            'question': 'How should I store the toppers before use?',
            'answer': 'Store in a cool, dry place away from direct sunlight. Keep them in an airtight container to prevent humidity damage. Avoid refrigeration as moisture can affect the fondant.'
        },
        {
            'question': 'Can you create custom designs?',
            'answer': 'Absolutely! We love creating custom pieces. Contact us with your ideas, theme, or color preferences, and we\'ll work with you to create the perfect topper for your celebration.'
        },
        {
            'question': 'What is your cancellation policy?',
            'answer': 'Orders can be cancelled within 24 hours of purchase for a full refund. After work has begun on custom orders, cancellations may be subject to a fee depending on the progress.'
        },
        {
            'question': 'Do you ship internationally?',
            'answer': 'Currently, we ship within the United States. International shipping can be arranged for certain items - please contact us for details and shipping costs.'
        },
        {
            'question': 'How are the toppers packaged for shipping?',
            'answer': 'Each topper is carefully packaged in protective materials and shipped in sturdy boxes to ensure they arrive in perfect condition. We take extra care with delicate pieces.'
        },
        {
            'question': 'What if my topper arrives damaged?',
            'answer': 'While rare, if your topper arrives damaged, please contact us immediately with photos. We will work with you to either provide a replacement or issue a refund.'
        }
    ]
    return render_template('qa.html', faqs=faq_data)

# Shopping Cart Routes
@app.route('/cart')
def view_cart():
    """Display shopping cart"""
    cart = session.get('cart', [])
    
    # Calculate totals
    subtotal = sum(item['price'] * item['quantity'] for item in cart)
    
    return render_template('cart.html', cart=cart, subtotal=subtotal, stripe_publishable_key=STRIPE_PUBLISHABLE_KEY)

@app.route('/cart/add', methods=['POST'])
def add_to_cart():
    """Add item to shopping cart"""
    data = request.get_json()
    
    # Initialize cart if it doesn't exist
    if 'cart' not in session:
        session['cart'] = []
    
    cart = session['cart']
    
    # Check if item already exists in cart
    existing_item = None
    for item in cart:
        if (item['product_id'] == data['product_id'] and 
            item.get('variant') == data.get('variant') and 
            item.get('color') == data.get('color')):
            existing_item = item
            break
    
    if existing_item:
        # Update quantity
        existing_item['quantity'] += data.get('quantity', 1)
    else:
        # Add new item
        cart.append({
            'product_id': data['product_id'],
            'name': data['name'],
            'price': float(data['price']),
            'quantity': data.get('quantity', 1),
            'variant': data.get('variant', ''),
            'color': data.get('color', ''),
            'image': data.get('image', '')
        })
    
    session['cart'] = cart
    session.modified = True
    
    return jsonify({
        'success': True,
        'cart_count': sum(item['quantity'] for item in cart),
        'message': 'Item added to cart!'
    })

@app.route('/cart/update', methods=['POST'])
def update_cart():
    """Update cart item quantity"""
    data = request.get_json()
    cart = session.get('cart', [])
    
    for item in cart:
        if item['product_id'] == data['product_id']:
            item['quantity'] = max(1, int(data['quantity']))
            break
    
    session['cart'] = cart
    session.modified = True
    
    subtotal = sum(item['price'] * item['quantity'] for item in cart)
    
    return jsonify({'success': True, 'subtotal': subtotal})

@app.route('/cart/remove', methods=['POST'])
def remove_from_cart():
    """Remove item from cart"""
    data = request.get_json()
    cart = session.get('cart', [])
    
    cart = [item for item in cart if item['product_id'] != data['product_id']]
    
    session['cart'] = cart
    session.modified = True
    
    return jsonify({
        'success': True,
        'cart_count': sum(item['quantity'] for item in cart)
    })

@app.route('/cart/count')
def cart_count():
    """Get current cart item count"""
    cart = session.get('cart', [])
    count = sum(item['quantity'] for item in cart)
    return jsonify({'count': count})

@app.route('/create-checkout-session', methods=['POST'])
def create_checkout_session():
    data = request.get_json()
    
    # Check if Firebase user data is provided
    firebase_user = data.get('firebase_user')
    if not firebase_user or not firebase_user.get('uid'):
        return jsonify({'error': 'login_required', 'message': 'Please login or create an account to complete your purchase'}), 401
    
    # Use Firebase UID as user identifier
    user_id = firebase_user['uid']
    user_email = firebase_user.get('email', 'unknown@email.com')
    user_name = firebase_user.get('displayName', 'Customer')
    try:
        # Check if this is a cart checkout or single product
        if data.get('checkout_type') == 'cart':
            cart = session.get('cart', [])
            if not cart:
                return jsonify({'error': 'Cart is empty'}), 400
            
            # Create line items from cart
            line_items = []
            total_price = 0
            product_names = []
            
            for item in cart:
                item_price = item['price'] * item['quantity']
                total_price += item_price
                product_names.append(f"{item['name']} (x{item['quantity']})")
                
                line_items.append({
                    'price_data': {
                        'currency': 'usd',
                        'product_data': {
                            'name': f"{item['name']} - {item.get('variant', '')} {item.get('color', '')}".strip(),
                        },
                        'unit_amount': int(item['price'] * 100),
                    },
                    'quantity': item['quantity'],
                })
            
            order_name = ', '.join(product_names[:3])  # First 3 items
            if len(product_names) > 3:
                order_name += f" and {len(product_names) - 3} more"
            
        else:
            # Single product checkout
            unit_amount = int(float(data['price']) * 100)
            line_items = [{
                'price_data': {
                    'currency': 'usd',
                    'product_data': {
                        'name': data['name'],
                    },
                    'unit_amount': unit_amount,
                },
                'quantity': 1,
            }]
            order_name = data['name']
            total_price = data['price']
        
        # Check if Stripe is configured
        if not stripe.api_key or stripe.api_key == '' or stripe.api_key == 'None':
            print(f"ERROR: Stripe API key is not configured. Current value: {stripe.api_key}")
            return jsonify({
                'error': 'Stripe not configured',
                'message': 'Payment processing is not available. Please contact support.'
            }), 500
        
        # Direct redirect to success page (no database needed)
        success_url = f'{BASE_URL}/order-success'
        print(f"Creating Stripe session with success_url: {success_url}")
        print(f"Using Stripe API key: {stripe.api_key[:20] if stripe.api_key else 'None'}...")

        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=line_items,
            mode='payment',
            success_url=success_url,
            cancel_url=f'{BASE_URL}/products',
            metadata={
                'user_id': user_id,
                'user_email': user_email,
                'user_name': user_name,
                'order_name': order_name
            }
        )
        
        print(f"Checkout URL: {checkout_session.url}")
        return jsonify({
            'id': checkout_session.id,
            'url': checkout_session.url
        })
    except Exception as e:
        print(f"Error creating checkout session: {e}")
        return jsonify({'error': str(e)}), 400

@app.route('/order-success')
def order_success():
    """Handle successful payment - simplified for serverless"""
    return render_template('order_success.html')

@app.route('/webhook', methods=['POST'])
def webhook():
    """Handle Stripe webhook events for automatic payment processing"""
    payload = request.data
    sig_header = request.headers.get('Stripe-Signature')
    
    # For testing without webhook secret, just parse the JSON
    if not STRIPE_WEBHOOK_SECRET:
        try:
            event = json.loads(payload)
        except json.JSONDecodeError:
            return jsonify({'error': 'Invalid payload'}), 400
    else:
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, STRIPE_WEBHOOK_SECRET
            )
        except ValueError:
            return jsonify({'error': 'Invalid payload'}), 400
        except stripe.error.SignatureVerificationError:
            return jsonify({'error': 'Invalid signature'}), 400
    
    # Handle checkout.session.completed event
    if event['type'] == 'checkout.session.completed':
        checkout_session = event['data']['object']
        session_id = checkout_session['id']
        
        print(f"\n=== WEBHOOK: Checkout session completed ===")
        print(f"Session ID: {session_id}")
        print(f"Payment status: {checkout_session.get('payment_status')}")
        
        # Find the order by session ID and update it
        try:
            db = get_db()
            cursor = db.execute('SELECT id FROM orders WHERE stripe_session_id = ?', (session_id,))
            order = cursor.fetchone()
            
            if order:
                order_id = order[0]
                db.execute('''
                    UPDATE orders 
                    SET status = 'completed'
                    WHERE id = ?
                ''', (order_id,))
                db.commit()
                print(f"✓ Order {order_id} marked as completed via webhook")
            else:
                print(f"⚠ No order found for session {session_id}")
            
            db.close()
        except Exception as e:
            print(f"✗ Error updating order: {e}")
            import traceback
            traceback.print_exc()
    
    return jsonify({'status': 'success'}), 200

@app.route('/payment-processing/<int:order_id>')
def payment_processing(order_id):
    """Show payment processing page with auto-redirect"""
    token = request.args.get('token')
    if not token:
        flash('Invalid payment link', 'error')
        return redirect(url_for('products'))
    
    return render_template('payment_processing.html', order_id=order_id, token=token)

@app.route('/api/submit-review', methods=['POST'])
def api_submit_review():
    """API endpoint to submit a review from logged-in users"""
    try:
        data = request.get_json()
        
        # Validate required fields
        user_name = data.get('user_name', '').strip()
        user_email = data.get('user_email', '').strip()
        rating = data.get('rating')
        review_text = data.get('review_text', '').strip()
        
        if not user_name:
            return jsonify({'success': False, 'message': 'Name is required'}), 400
        
        if not user_email:
            return jsonify({'success': False, 'message': 'Email is required'}), 400
        
        if not rating or not isinstance(rating, int) or rating < 1 or rating > 5:
            return jsonify({'success': False, 'message': 'Rating must be between 1 and 5'}), 400
        
        if not review_text or len(review_text) < 10:
            return jsonify({'success': False, 'message': 'Review must be at least 10 characters'}), 400
        
        # Get database connection
        db = get_db()
        
        # Create reviews table if it doesn't exist
        db.execute('''
            CREATE TABLE IF NOT EXISTS reviews (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_name TEXT NOT NULL,
                user_email TEXT NOT NULL,
                rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
                review_text TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                approved BOOLEAN DEFAULT 0
            )
        ''')
        
        # Insert the review (pending approval)
        db.execute(
            'INSERT INTO reviews (user_name, user_email, rating, review_text, approved) VALUES (?, ?, ?, ?, 0)',
            (user_name, user_email, rating, review_text)
        )
        db.commit()
        db.close()
        
        return jsonify({
            'success': True,
            'message': 'Thank you for your review! It will be published after approval.'
        }), 200
        
    except Exception as e:
        print(f"Error submitting review: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'An error occurred while submitting your review. Please try again.'
        }), 500

@app.route('/api/order-status/<int:order_id>')
def api_order_status(order_id):
    """API endpoint to check order status"""
    token = request.args.get('token')
    
    # Verify token
    db = get_db()
    order = db.execute('SELECT user_id, status FROM orders WHERE id = ?', (order_id,)).fetchone()
    db.close()
    
    if not order:
        return jsonify({'error': 'Order not found'}), 404
    
    import hashlib
    valid_token = hashlib.sha256(f"{order_id}-{order['user_id']}-{app.secret_key}".encode()).hexdigest()[:16]
    
    if token != valid_token:
        return jsonify({'error': 'Invalid token'}), 403
    
    return jsonify({'status': order['status']})

@app.route('/order/<int:order_id>')
def order_detail(order_id):
    """Display order details"""
    # Check for payment success parameter and token
    payment_success = request.args.get('payment') == 'success'
    order_token = request.args.get('token')
    
    print(f"=== ORDER DETAIL REQUEST ===")
    print(f"Order ID: {order_id}")
    print(f"Payment success: {payment_success}")
    print(f"Token provided: {order_token}")
    print(f"Session user_id: {session.get('user_id')}")
    
    db = get_db()
    order = db.execute('''
        SELECT o.*, u.email, u.first_name, u.last_name
        FROM orders o
        JOIN users u ON o.user_id = u.id
        WHERE o.id = ?
    ''', (order_id,)).fetchone()
    db.close()
    
    if not order:
        print("Order not found!")
        flash('Order not found', 'error')
        return redirect(url_for('products'))
    
    # Verify token if provided (allows access without session)
    import hashlib
    valid_token = hashlib.sha256(f"{order_id}-{order['user_id']}-{app.secret_key}".encode()).hexdigest()[:16]
    
    print(f"Valid token: {valid_token}")
    print(f"Token match: {order_token == valid_token}")
    
    has_token_access = order_token and order_token == valid_token
    has_session_access = 'user_id' in session and session['user_id'] == order['user_id']
    
    print(f"Has token access: {has_token_access}")
    print(f"Has session access: {has_session_access}")
    
    if not has_token_access and not has_session_access:
        print("Access denied!")
        flash('Access denied. Please log in to view this order.', 'error')
        return redirect(url_for('login'))
    
    # Show success message if coming from payment
    if payment_success and order['status'] == 'completed':
        flash('Payment successful! Your order has been confirmed.', 'success')
    elif payment_success and order['status'] == 'pending':
        flash('Payment is being processed. Your order will be confirmed shortly.', 'info')
    
    print(f"Rendering order_detail.html for order {order_id}")
    print("="*60)
    return render_template('order_detail.html', order=order)

@app.route('/success')
def success():
    return "Payment successful! Thank you for your purchase."

@app.route('/cancel')
def cancel():
    flash('Payment cancelled. Please try again when ready.', 'info')
    return redirect(url_for('products'))
    return "Payment canceled. Please try again."

@app.route('/register', methods=['GET', 'POST'])
def register():
    """User registration"""
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        confirm_password = request.form.get('confirm_password')
        first_name = request.form.get('first_name')
        last_name = request.form.get('last_name')
        
        # Validation
        if not all([email, password, first_name, last_name]):
            flash('All fields are required.', 'error')
            return redirect(url_for('register'))
        
        if password != confirm_password:
            flash('Passwords do not match.', 'error')
            return redirect(url_for('register'))
        
        if len(password) < 6:
            flash('Password must be at least 6 characters long.', 'error')
            return redirect(url_for('register'))
        
        # Check if user exists
        db = get_db()
        existing_user = db.execute('SELECT id FROM users WHERE email = ?', (email,)).fetchone()
        
        if existing_user:
            flash('Email already registered. Please log in.', 'error')
            db.close()
            # Preserve redirect parameter if it exists
            redirect_path = request.args.get('redirect')
            if redirect_path:
                return redirect(url_for('login', redirect=redirect_path))
            return redirect(url_for('login'))
        
        # Create user
        password_hash = generate_password_hash(password, method='pbkdf2:sha256')
        try:
            db.execute(
                'INSERT INTO users (email, password_hash, first_name, last_name) VALUES (?, ?, ?, ?)',
                (email, password_hash, first_name, last_name)
            )
            db.commit()
            flash('Account created successfully! Please log in.', 'success')
            db.close()
            # Preserve redirect parameter if it exists
            redirect_path = request.args.get('redirect')
            if redirect_path:
                return redirect(url_for('login', redirect=redirect_path))
            return redirect(url_for('login'))
        except Exception as e:
            db.close()
            flash('An error occurred. Please try again.', 'error')
            return redirect(url_for('register'))
    
    return render_template('register.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    """User login"""
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        
        if not email or not password:
            flash('Email and password are required.', 'error')
            return redirect(url_for('login'))
        
        db = get_db()
        user = db.execute('SELECT * FROM users WHERE email = ?', (email,)).fetchone()
        db.close()
        
        if user and check_password_hash(user['password_hash'], password):
            session.permanent = True  # Make session persistent
            session['user_id'] = user['id']
            session['user_email'] = user['email']
            session['user_name'] = f"{user['first_name']} {user['last_name']}"
            flash(f'Welcome back, {user["first_name"]}!', 'success')
            
            # Check if there's a redirect parameter (URL path)
            redirect_path = request.args.get('redirect')
            if redirect_path:
                # Redirect to the stored path
                return redirect(redirect_path)
            
            return redirect(url_for('home'))
        else:
            flash('Invalid email or password.', 'error')
            return redirect(url_for('login'))
    
    return render_template('login.html')

@app.route('/logout')
def logout():
    """User logout"""
    session.clear()
    flash('You have been logged out successfully.', 'success')
    return redirect(url_for('home'))

@app.route('/account')
def account():
    """User account dashboard - authentication handled by Firebase on client side"""
    # No server-side authentication needed - Firebase handles it in the browser
    return render_template('account.html')

if __name__ == '__main__':
    app.run(debug=False, host='127.0.0.1', port=5000)