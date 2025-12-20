import pandas as pd
import numpy as np
import random
from datetime import datetime, timedelta
import os

# Configuration
NUM_CUSTOMERS = 1000
NUM_PRODUCTS = 50
NUM_ORDERS = 5000
DIR = "data/ecommerce"

os.makedirs(DIR, exist_ok=True)

def generate_customers():
    print("Generating Customers...")
    names = ["Alice", "Bob", "Charlie", "David", "Eva", "Frank", "Grace", "Hannah", "Ivan", "Jack"]
    domains = ["gmail.com", "yahoo.com", "outlook.com", "company.org"]
    
    data = []
    for i in range(1, NUM_CUSTOMERS + 1):
        name = f"{random.choice(names)} {random.choice(names)}"
        email = f"{name.lower().replace(' ', '.')}@{random.choice(domains)}"
        # Introduce some dirty data (invalid emails)
        if random.random() < 0.01:
            email = "invalid-email"
            
        data.append({
            "customer_id": i,
            "name": name,
            "email": email,
            "signup_date": (datetime.now() - timedelta(days=random.randint(0, 365))).date(),
            "region": random.choice(["NA", "EU", "APAC", "LATAM"])
        })
    
    df = pd.DataFrame(data)
    df.to_csv(f"{DIR}/customers.csv", index=False)
    print(f"  -> Saved {len(df)} customers to {DIR}/customers.csv")
    return df

def generate_products():
    print("Generating Products...")
    categories = ["Electronics", "Clothing", "Home", "Books"]
    
    data = []
    for i in range(1, NUM_PRODUCTS + 1):
        data.append({
            "product_id": i,
            "name": f"Product_{i}",
            "category": random.choice(categories),
            "price": round(random.uniform(10.0, 500.0), 2),
            "stock_level": random.randint(0, 100)
        })
        
    df = pd.DataFrame(data)
    df.to_csv(f"{DIR}/products.csv", index=False)
    print(f"  -> Saved {len(df)} products to {DIR}/products.csv")
    return df

def generate_orders(customers, products):
    print("Generating Orders...")
    cust_ids = customers["customer_id"].tolist()
    prod_ids = products["product_id"].tolist()
    
    data = []
    for i in range(1, NUM_ORDERS + 1):
        # 1% chance of orphan order (customer_id not in customers) -> Referential Integrity Failure
        cid = random.choice(cust_ids)
        if random.random() < 0.01:
            cid = 999999 
            
        data.append({
            "order_id": i,
            "customer_id": cid,
            "product_id": random.choice(prod_ids),
            "quantity": random.randint(1, 5),
            "order_date": (datetime.now() - timedelta(days=random.randint(0, 60))).date(),
            "status": random.choice(["PENDING", "SHIPPED", "DELIVERED", "CANCELLED"])
        })
        
    df = pd.DataFrame(data)
    
    # Introduce NULLs in critical columns (1% chance)
    mask = np.random.choice([True, False], size=len(df), p=[0.01, 0.99])
    df.loc[mask, "status"] = np.nan
    
    df.to_csv(f"{DIR}/orders.csv", index=False)
    print(f"  -> Saved {len(df)} orders to {DIR}/orders.csv")

if __name__ == "__main__":
    c = generate_customers()
    p = generate_products()
    generate_orders(c, p)
    print("✅ Realistic Data Generation Complete!")
