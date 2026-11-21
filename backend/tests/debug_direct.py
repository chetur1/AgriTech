import sys
from app.database.session import SessionLocal
from app.models.user import User
from app.core.security import verify_password

db = SessionLocal()
admin = db.query(User).filter(User.email == "admin@agrismart.in").first()
print("Found admin:", admin.full_name, admin.email)
ok = verify_password("Admin@AgriSmart2024", admin.hashed_password)
print("Password match:", ok)
db.close()
