"""
AGRI SMART — Complete Database Seed Script for Cloud PostgreSQL (Supabase)
File: backend/app/database/seed_supabase.py

Initializes all database tables and seeds comprehensive real-world agricultural
data across all 5 roles (Farmer, Expert, Admin, Broker, Consumer).
"""

import sys
import os
import uuid
from datetime import datetime, timezone, timedelta

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.database.session import engine, SessionLocal
from app.database.base import Base
from app.core.security import hash_password
from app.models.user import User, UserRole, UserStatus, FarmerProfile, ExpertProfile, VerificationStatus, AuditLog
from app.models.marketplace import BuyerProfile, ConsumerProfile
from app.models.farm import Farm
from app.models.crop import Crop, CropActivity
from app.models.finance import Expense, Income
from app.models.consultation import Consultation, ConsultationMessage


def seed_cloud_database():
    print("=" * 65)
    print("AGRI SMART — Deploying Schema & Seeding Cloud PostgreSQL...")
    print(f"Target DB Engine: {engine.url.render_as_string(hide_password=True)}")
    print("=" * 65)

    # 1. Create all tables
    print("\n[1/6] Creating all database tables...")
    Base.metadata.create_all(bind=engine)
    print("✓ All tables created successfully.")

    db = SessionLocal()
    try:
        # 2. Seed Users & Profiles for all 5 roles
        print("\n[2/6] Seeding role-based user accounts...")

        # 2.1 Admin
        admin = db.query(User).filter(User.role == UserRole.ADMIN).first()
        if not admin:
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
            print("  ✓ Admin: 9999999999 (admin@agrismart.in)")

        # 2.2 Farmer
        farmer = db.query(User).filter(User.mobile == "9865432109").first()
        if not farmer:
            farmer = User(
                full_name="Basavaraj Patil",
                mobile="9865432109",
                email="basavaraj.patil@raitha.in",
                hashed_password=hash_password("Farmer@1234"),
                role=UserRole.FARMER,
                status=UserStatus.ACTIVE,
                preferred_language="kn",
                state="Karnataka",
                district="Mandya",
                village="Pandavapura",
                is_active=True,
                email_verified=True,
                mobile_verified=True,
            )
            db.add(farmer)
            db.flush()

            farmer_prof = FarmerProfile(
                user_id=farmer.id,
                total_land_acres=4.5,
                primary_crops="Ragi, Paddy, Sugarcane",
                irrigation_source="Borewell & Canal",
                experience_years=18,
            )
            db.add(farmer_prof)
            print("  ✓ Farmer: 9865432109 (Basavaraj Patil)")

        # 2.3 Expert
        expert = db.query(User).filter(User.mobile == "9876500001").first()
        if not expert:
            expert = User(
                full_name="Dr. Suresh Kumar",
                mobile="9876500001",
                email="dr.suresh@uasb.edu.in",
                hashed_password=hash_password("Expert@1234"),
                role=UserRole.EXPERT,
                status=UserStatus.ACTIVE,
                preferred_language="kn",
                state="Karnataka",
                district="Bengaluru Urban",
                village="GKVK Campus",
                is_active=True,
                email_verified=True,
                mobile_verified=True,
            )
            db.add(expert)
            db.flush()

            expert_prof = ExpertProfile(
                user_id=expert.id,
                qualifications="Ph.D. Plant Pathology (UAS Bangalore)",
                specialisation="Cereal & Millets Crop Disease Diagnostics",
                experience_years=14,
                institution="University of Agricultural Sciences, Bangalore",
                verification_status=VerificationStatus.APPROVED,
                verified_at=datetime.now(timezone.utc),
            )
            db.add(expert_prof)
            print("  ✓ Expert: 9876500001 (Dr. Suresh Kumar)")

        # 2.4 Broker
        broker = db.query(User).filter(User.mobile == "9876543210").first()
        if not broker:
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

            buyer_prof = BuyerProfile(
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
            db.add(buyer_prof)
            print("  ✓ Broker: 9876543210 (Ramesh Trading Co.)")

        # 2.5 Consumer
        consumer = db.query(User).filter(User.mobile == "9876543211").first()
        if not consumer:
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

            consumer_prof = ConsumerProfile(
                user_id=consumer.id,
                delivery_address="Flat 402, Green Meadows, 100ft Road, Indiranagar, Bengaluru",
                preferred_commodities="Ragi Flour, Fresh Tomatoes, Organic Cold-Pressed Oil",
                is_organic_preferred=True,
                household_size=4,
            )
            db.add(consumer_prof)
            print("  ✓ Consumer: 9876543211 (Priya Sharma)")

        db.commit()

        # 3. Seed Farms for Farmer
        print("\n[3/6] Seeding registered farm plots...")
        if farmer:
            farm_count = db.query(Farm).filter(Farm.farmer_id == farmer.id).count()
            if farm_count == 0:
                f1 = Farm(
                    farmer_id=farmer.id,
                    name="North Plot (Ragi Field)",
                    total_area=2.5,
                    area_unit="acres",
                    soil_type="Red Loam",
                    water_source="Borewell",
                    irrigation_type="Drip",
                    state="Karnataka",
                    district="Mandya",
                    taluk="Pandavapura",
                    village="Chikkade",
                    latitude=12.5204,
                    longitude=76.8951,
                )
                f2 = Farm(
                    farmer_id=farmer.id,
                    name="South Canal Field (Paddy)",
                    total_area=2.0,
                    area_unit="acres",
                    soil_type="Clay Loam",
                    water_source="Canal",
                    irrigation_type="Flood",
                    state="Karnataka",
                    district="Mandya",
                    taluk="Pandavapura",
                    village="Chikkade",
                    latitude=12.5220,
                    longitude=76.8980,
                )
                db.add_all([f1, f2])
                db.commit()
                print("  ✓ 2 Farm plots created for Basavaraj Patil")

                # 4. Seed Crops
                print("\n[4/6] Seeding active crops and developmental stages...")
                c1 = Crop(
                    farmer_id=farmer.id,
                    farm_id=f1.id,
                    crop_name="Finger Millet (Ragi)",
                    variety="GPU-28",
                    season="Kharif 2026",
                    sowing_date=datetime(2026, 6, 15).date(),
                    expected_harvest_date=datetime(2026, 10, 15).date(),
                    area_acres=2.5,
                    status="flowering",
                )
                c2 = Crop(
                    farmer_id=farmer.id,
                    farm_id=f2.id,
                    crop_name="Paddy (Rice)",
                    variety="Sona Masuri",
                    season="Kharif 2026",
                    sowing_date=datetime(2026, 7, 1).date(),
                    expected_harvest_date=datetime(2026, 11, 20).date(),
                    area_acres=2.0,
                    status="vegetative",
                )
                db.add_all([c1, c2])
                db.commit()
                print("  ✓ 2 Active crops created (Ragi GPU-28 & Paddy Sona Masuri)")

        # 5. Seed Farm Finances
        print("\n[5/6] Seeding income & expense ledgers...")
        if farmer:
            exp_count = db.query(Expense).filter(Expense.farmer_id == farmer.id).count()
            if exp_count == 0:
                e1 = Expense(
                    farmer_id=farmer.id,
                    category="Seed",
                    amount=4500.0,
                    description="Certified GPU-28 Ragi Seed from Raitha Samparka Kendra",
                    expense_date=datetime(2026, 6, 10),
                    season="Kharif 2026",
                )
                e2 = Expense(
                    farmer_id=farmer.id,
                    category="Fertilizer",
                    amount=3800.0,
                    description="DAP and Urea 1st split",
                    expense_date=datetime(2026, 7, 5),
                    season="Kharif 2026",
                )
                inc1 = Income(
                    farmer_id=farmer.id,
                    source="Crop Sale",
                    amount=28000.0,
                    commodity="Finger Millet (Ragi)",
                    quantity_quintal=8.0,
                    selling_price_per_quintal=3500.0,
                    buyer_name="Ramesh Agro Trading",
                    market_name="Mandya APMC",
                    income_date=datetime(2026, 1, 25),
                    season="Rabi 2025-26",
                )
                db.add_all([e1, e2, inc1])
                db.commit()
                print("  ✓ Financial ledger entries seeded")

        # 6. Seed Consultations
        print("\n[6/6] Seeding expert-farmer consultation thread...")
        if farmer and expert:
            con_count = db.query(Consultation).filter(Consultation.farmer_id == farmer.id).count()
            if con_count == 0:
                con = Consultation(
                    farmer_id=farmer.id,
                    assigned_expert_id=expert.id,
                    subject="Organic remedy for shoot fly in sorghum",
                    description="Seeing young seedlings with dead hearts in Mandya district. Need organic spray.",
                    category="Pest Control",
                    status="answered",
                )
                db.add(con)
                db.flush()

                m1 = ConsultationMessage(
                    consultation_id=con.id,
                    sender_id=farmer.id,
                    sender_name=farmer.full_name,
                    sender_role="farmer",
                    message="Seeing young seedlings with dead hearts. Need organic solution.",
                )
                m2 = ConsultationMessage(
                    consultation_id=con.id,
                    sender_id=expert.id,
                    sender_name=expert.full_name,
                    sender_role="expert",
                    message="Spray 5% Neem Seed Kernel Extract (NSKE) or Azadirachtin 10,000 ppm @ 2 ml/L early morning.",
                    is_expert_verified=True,
                )
                db.add_all([m1, m2])
                db.commit()
                print("  ✓ Consultation case and expert verified reply seeded")

        print("\n" + "=" * 65)
        print("🎉 SUCCESS: Cloud Database deployment & seed completed!")
        print("=" * 65)

    except Exception as e:
        db.rollback()
        print(f"\n❌ Error during database seeding: {e}")
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    seed_cloud_database()
