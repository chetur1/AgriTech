"""
AGRI SMART — Enable Supabase Realtime for all tables
File: backend/app/database/enable_realtime.py
"""

from app.database.session import engine
from sqlalchemy import text

tables = [
    'users',
    'farmer_profiles',
    'expert_profiles',
    'buyer_profiles',
    'consumer_profiles',
    'farms',
    'crops',
    'crop_activities',
    'expenses',
    'incomes',
    'consultations',
    'consultation_messages',
    'ai_diagnoses',
    'audit_logs',
]

def enable_realtime():
    with engine.connect().execution_options(isolation_level="AUTOCOMMIT") as conn:
        pub = conn.execute(
            text("SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'")
        ).fetchone()
        if not pub:
            conn.execute(text("CREATE PUBLICATION supabase_realtime;"))
            print("Created supabase_realtime publication.")
        else:
            print("Found existing supabase_realtime publication.")

        for t in tables:
            try:
                conn.execute(text(f"ALTER TABLE {t} REPLICA IDENTITY FULL;"))
                conn.execute(text(f"ALTER PUBLICATION supabase_realtime ADD TABLE {t};"))
                print(f"✓ Added {t} to supabase_realtime (REPLICA IDENTITY FULL)")
            except Exception as e:
                err_msg = str(e)
                if "already member of publication" in err_msg.lower():
                    print(f"✓ {t} is already in supabase_realtime")
                else:
                    print(f"! {t}: {err_msg}")

    with engine.connect() as conn:
        res = conn.execute(
            text("SELECT tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime'")
        )
        active = [r[0] for r in res.fetchall()]
        print("\nAll active realtime tables in Supabase:")
        for tbl in sorted(active):
            print(f"  - {tbl}")

if __name__ == "__main__":
    enable_realtime()
