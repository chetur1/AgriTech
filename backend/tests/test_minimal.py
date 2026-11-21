import asyncio
from fastapi import FastAPI
import httpx

app = FastAPI()

@app.get("/ping")
def ping():
    return {"ping": "pong"}

async def test():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as c:
        print("calling ping...")
        r = await c.get("/ping")
        print("result:", r.json())

asyncio.run(test())
