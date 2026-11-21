"""
AGRI SMART — Simple startup check script
"""
import sys
from app.main import app

print("Checking FastAPI endpoints...")

# Check routes
routes = [route.path for route in app.routes]
print(f"Registered {len(routes)} routes:")
for r in routes:
    print(f"  - {r}")

print("\nApp initialized successfully!")
