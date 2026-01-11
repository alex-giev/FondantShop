#!/usr/bin/env python3
"""
Product Management Script for Fondant Toppers Booth
Easy way to add, view, and manage products from command line
"""

import json
import os
from pathlib import Path

PRODUCTS_FILE = Path(__file__).parent / 'backend' / 'data' / 'extracted_products.json'

def load_products():
    """Load products from JSON file"""
    if PRODUCTS_FILE.exists():
        with open(PRODUCTS_FILE, 'r') as f:
            return json.load(f)
    return []

def save_products(products):
    """Save products to JSON file"""
    # Create backup
    if PRODUCTS_FILE.exists():
        backup_file = PRODUCTS_FILE.with_suffix('.json.backup')
        with open(PRODUCTS_FILE, 'r') as f:
            with open(backup_file, 'w') as bf:
                bf.write(f.read())
    
    with open(PRODUCTS_FILE, 'w') as f:
        json.dump(products, f, indent=4)
    print(f"✅ Products saved successfully!")

def add_product():
    """Add a new product"""
    print("\n" + "="*50)
    print("ADD NEW PRODUCT")
    print("="*50)
    
    title = input("Product Title: ").strip()
    price = input("Price (numbers only, e.g., 12.99): ").strip()
    link = input("Etsy Link: ").strip()
    image_url = input("Image URL: ").strip()
    
    if not all([title, price, link, image_url]):
        print("❌ All fields are required!")
        return
    
    try:
        float(price)  # Validate price
    except ValueError:
        print("❌ Invalid price format!")
        return
    
    products = load_products()
    new_product = {
        "title": title,
        "price": price,
        "link": link,
        "image_url": image_url
    }
    
    products.append(new_product)
    save_products(products)
    print(f"✅ Product '{title}' added successfully!")

def view_products():
    """View all products"""
    products = load_products()
    
    if not products:
        print("\n❌ No products found!")
        return
    
    print("\n" + "="*50)
    print(f"TOTAL PRODUCTS: {len(products)}")
    print("="*50)
    
    for i, product in enumerate(products, 1):
        print(f"\n{i}. {product['title']}")
        print(f"   Price: ${product['price']}")
        print(f"   Link: {product['link'][:50]}...")
        print(f"   Image: {product['image_url'][:50]}...")

def bulk_add_from_csv():
    """Add products from CSV file"""
    print("\n" + "="*50)
    print("BULK ADD FROM CSV")
    print("="*50)
    print("CSV Format: title,price,link,image_url")
    
    csv_file = input("Enter CSV file path: ").strip()
    
    if not os.path.exists(csv_file):
        print("❌ File not found!")
        return
    
    import csv
    products = load_products()
    added = 0
    
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            if all(key in row for key in ['title', 'price', 'link', 'image_url']):
                products.append({
                    "title": row['title'],
                    "price": row['price'],
                    "link": row['link'],
                    "image_url": row['image_url']
                })
                added += 1
    
    save_products(products)
    print(f"✅ Added {added} products from CSV!")

def delete_product():
    """Delete a product"""
    products = load_products()
    
    if not products:
        print("\n❌ No products to delete!")
        return
    
    view_products()
    
    try:
        index = int(input("\nEnter product number to delete (or 0 to cancel): ")) - 1
        
        if index == -1:
            return
        
        if 0 <= index < len(products):
            deleted = products.pop(index)
            save_products(products)
            print(f"✅ Deleted: {deleted['title']}")
        else:
            print("❌ Invalid product number!")
    except ValueError:
        print("❌ Please enter a valid number!")

def main():
    """Main menu"""
    while True:
        print("\n" + "="*50)
        print("FONDANT TOPPERS BOOTH - PRODUCT MANAGER")
        print("="*50)
        print("1. View all products")
        print("2. Add new product")
        print("3. Bulk add from CSV")
        print("4. Delete product")
        print("5. Exit")
        print("="*50)
        
        choice = input("Enter your choice (1-5): ").strip()
        
        if choice == '1':
            view_products()
        elif choice == '2':
            add_product()
        elif choice == '3':
            bulk_add_from_csv()
        elif choice == '4':
            delete_product()
        elif choice == '5':
            print("\n👋 Goodbye!")
            break
        else:
            print("❌ Invalid choice!")

if __name__ == '__main__':
    print("\n🍰 Welcome to Fondant Toppers Booth Product Manager!")
    main()
