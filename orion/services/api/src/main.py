import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env before anything else — walk up from main.py until we find .env
_env = Path(__file__).resolve()
for parent in _env.parents:
    _env_candidate = parent / ".env"
    if _env_candidate.exists():
        load_dotenv(_env_candidate)
        break

import uvicorn
from datetime import datetime
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

from .routers import auth, files, stats, system, folders, users
from .dependencies import engine, Base

app = FastAPI(title="Orion File Storage API", version="0.1.0")

# CORS (if webui is served from another origin)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(files.router)
app.include_router(stats.router)
app.include_router(system.router)
app.include_router(folders.router)
app.include_router(users.router)

# ---------------------------------------------------------------------------
# Startup / shutdown
# ---------------------------------------------------------------------------
@app.on_event("startup")
async def on_startup():
    # Create tables if they don't exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

if __name__ == "__main__":
    uvicorn.run("src.main:app", host="0.0.0.0", port=8082, reload=False)
