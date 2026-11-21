"""
AGRI SMART — Add and Sync farmer_name in farmer_profiles
File: backend/app/database/add_farmer_name.py
"""

from app.database.session import engine
from sqlalchemy import text

def run():
    with engine.connect().execution_options(isolation_level="AUTOCOMMIT") as conn:
        # 1. Add column if not exists
        conn.execute(text("ALTER TABLE farmer_profiles ADD COLUMN IF NOT EXISTS farmer_name VARCHAR(255);"))
        print("✓ Column farmer_name added/exists in farmer_profiles.")

        # 2. Update existing rows
        conn.execute(text("""
            UPDATE farmer_profiles fp
            SET farmer_name = u.full_name
            FROM users u
            WHERE fp.user_id = u.id AND (fp.farmer_name IS NULL OR fp.farmer_name = '');
        """))
        print("✓ Existing farmer profiles updated with full_name from users.")

        # 3. Create or replace trigger function
        conn.execute(text("""
            CREATE OR REPLACE FUNCTION sync_farmer_name()
            RETURNS TRIGGER AS $func$
            BEGIN
                IF NEW.farmer_name IS NULL OR NEW.farmer_name = '' THEN
                    SELECT full_name INTO NEW.farmer_name FROM users WHERE id = NEW.user_id;
                END IF;
                RETURN NEW;
            END;
            $func$ LANGUAGE plpgsql;
        """))
        print("✓ Trigger function sync_farmer_name created.")

        # 4. Attach trigger
        conn.execute(text("DROP TRIGGER IF EXISTS trigger_sync_farmer_name ON farmer_profiles;"))
        conn.execute(text("""
            CREATE TRIGGER trigger_sync_farmer_name
            BEFORE INSERT OR UPDATE OF user_id, farmer_name ON farmer_profiles
            FOR EACH ROW
            EXECUTE FUNCTION sync_farmer_name();
        """))
        print("✓ Trigger attached to farmer_profiles.")

    with engine.connect() as conn:
        res = conn.execute(text("""
            SELECT fp.id, fp.farmer_name, fp.user_id, u.full_name, u.mobile 
            FROM farmer_profiles fp 
            JOIN users u ON fp.user_id = u.id;
        """))
        rows = res.fetchall()
        print(f"\nFarmer profiles in Supabase ({len(rows)} total):")
        for r in rows:
            print(f"  Farmer: '{r[1]}' (Mobile: {r[4]}) | Profile ID: {r[0]}")

if __name__ == "__main__":
    run()
