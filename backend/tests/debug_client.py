import asyncio
import httpx
from app.main import app

async def main():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        print("Testing GET / ...")
        res = await client.get("/")
        print("GET / ->", res.status_code, res.json())

        print("Testing POST /api/v1/auth/login ...")
        res = await client.post(
            "/api/v1/auth/login",
            json={"mobile_or_email": "admin@agrismart.in", "password": "Admin@AgriSmart2024"},
        )
        print("POST login ->", res.status_code, res.json()["user"]["full_name"])

asyncio.run(main())
