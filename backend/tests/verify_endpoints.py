"""
AGRI SMART — Direct endpoint testing using AsyncClient
"""
import asyncio
import httpx
from app.main import app

async def main():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        # Test 1: Root
        r = await client.get("/")
        print("GET / -> Status:", r.status_code, r.json())
        assert r.status_code == 200

        # Test 2: Health
        r = await client.get("/api/health")
        print("GET /api/health -> Status:", r.status_code, r.json())
        assert r.status_code == 200

        # Test 3: Docs
        r = await client.get("/api/docs")
        print("GET /api/docs -> Status:", r.status_code)
        assert r.status_code == 200

    print("\n[SUCCESS] All core endpoints responded with HTTP 200!")

if __name__ == "__main__":
    asyncio.run(main())
