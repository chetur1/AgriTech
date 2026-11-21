"""
AGRI SMART — Database Initialization & Admin Setup Script
File: backend/app/database/init_db.py

Initializes the database schema and seeds the initial administrator account.
Run with:
    python app/database/init_db.py
"""

import sys
import os

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.database.session import engine, SessionLocal
from app.database.base import Base
from app.models.user import User, UserRole, UserStatus, AuditLog
from app.models.marketplace import BuyerProfile, ConsumerProfile
from app.core.security import hash_password


def init_database():
    print("=" * 60)
    print("AGRI SMART — Initializing Database Schema...")
    print("=" * 60)

    # 1. Create all registered tables
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully.")

    # 2. Check if admin exists; if not, create default secure admin
    db = SessionLocal()
    try:
        admin = db.query(User).filter(User.role == UserRole.ADMIN).first()
        if not admin:
            print("\nCreating default Administrator account...")
            admin = User(
                full_name="AGRI SMART Administrator",
                mobile="9999999999",
                email="admin@agrismart.in",
                hashed_password=hash_password("Admin@AgriSmart2024"),
                role=UserRole.ADMIN,
                status=UserStatus.ACTIVE,
                preferred_language="en",
                state="Karnataka",
                district="Bengaluru Urban",
                village="Central Admin",
                is_active=True,
                email_verified=True,
                mobile_verified=True,
            )
            db.add(admin)
            db.flush()

            audit = AuditLog(
                user_id=admin.id,
                action="INITIAL_ADMIN_SETUP",
                resource_type="users",
                resource_id=str(admin.id),
                details="Initial platform administrator account created via init_db script.",
            )
            db.add(audit)
            db.commit()
            print("Default Administrator created successfully!")
            print("  - Mobile:   9999999999")
            print("  - Email:    admin@agrismart.in")
            print("  - Password: Admin@AgriSmart2024")
            print("  (Please change this password after initial login in Settings)\n")
        else:
            print(f"Administrator account already exists: {admin.email or admin.mobile}")

        # 3. Check / Seed default Broker account
        broker = db.query(User).filter(User.role == UserRole.BROKER).first()
        if not broker:
            print("\nCreating default Broker account...")
            broker = User(
                full_name="Ramesh Trading Co. (Broker)",
                mobile="9876543210",
                email="broker@agrismart.in",
                hashed_password=hash_password("Broker@1234"),
                role=UserRole.BROKER,
                status=UserStatus.ACTIVE,
                preferred_language="kn",
                state="Karnataka",
                district="Mandya",
                village="Mandya APMC Yard",
                is_active=True,
                email_verified=True,
                mobile_verified=True,
            )
            db.add(broker)
            db.flush()

            b_profile = BuyerProfile(
                user_id=broker.id,
                business_name="Ramesh Agro Trading",
                business_type="Trader",
                gst_number="29ABCDE1234F1Z5",
                license_number="APMC-MDY-2024-889",
                commodities_of_interest="Ragi, Paddy, Groundnut, Maize",
                preferred_districts="Mandya, Mysuru, Hassan",
                warehouse_address="Plot 12, APMC Market Yard, Mandya",
                is_verified=True,
            )
            db.add(b_profile)
            db.commit()
            print("Default Broker created successfully!")
            print("  - Mobile:   9876543210")
            print("  - Password: Broker@1234\n")

        # 4. Check / Seed default Consumer account
        consumer = db.query(User).filter(User.role == UserRole.CONSUMER).first()
        if not consumer:
            print("\nCreating default Consumer account...")
            consumer = User(
                full_name="Priya Sharma (Consumer)",
                mobile="9876543211",
                email="consumer@agrismart.in",
                hashed_password=hash_password("Consumer@1234"),
                role=UserRole.CONSUMER,
                status=UserStatus.ACTIVE,
                preferred_language="en",
                state="Karnataka",
                district="Bengaluru Urban",
                village="Indiranagar",
                is_active=True,
                email_verified=True,
                mobile_verified=True,
            )
            db.add(consumer)
            db.flush()

            c_profile = ConsumerProfile(
                user_id=consumer.id,
                delivery_address="Flat 402, Green Meadows, 100ft Road, Indiranagar, Bengaluru",
                preferred_commodities="Ragi Flour, Fresh Tomatoes, Organic Cold-Pressed Oil",
                is_organic_preferred=True,
                household_size=4,
            )
            db.add(c_profile)
            db.commit()
            print("Default Consumer created successfully!")
            print("  - Mobile:   9876543211")
            print("  - Password: Consumer@1234\n")

    except Exception as e:
        db.rollback()
        print(f"Error during initialization: {e}")
        raise e
    finally:
        db.close()

    print("Database initialization complete.")


if __name__ == "__main__":
    init_database()
