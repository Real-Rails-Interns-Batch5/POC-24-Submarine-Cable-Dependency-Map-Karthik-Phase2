from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.routers import cables, ownership, network, simulation
from backend.services.data_loader import DataLoader

app = FastAPI(
    title="Real Rails Infrastructure Intelligence API",
    description="Production‑ready backend for the Submarine Cable Intelligence platform",
    version="1.0.0",
)

import os

# ---------- CORS ----------
allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "*")
if allowed_origins_env == "*":
    origins = ["*"]
else:
    origins = [origin.strip() for origin in allowed_origins_env.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- Routers ----------
app.include_router(cables.router,     prefix="/api/cables",     tags=["Cables"])
app.include_router(ownership.router,  prefix="/api/ownership",  tags=["Ownership"])
app.include_router(network.router,    prefix="/api/network",    tags=["Network"])
app.include_router(simulation.router, prefix="/api/simulation", tags=["Simulation"])

# ---------- Root & health ----------
@app.get("/", tags=["Root"])
async def root():
    return {"message": "Real Rails Infrastructure Intelligence API"}

@app.get("/health", tags=["Health"])
async def health():
    return {"status": "healthy"}

# ---------- Startup ----------
@app.on_event("startup")
async def startup_event():
    # Load all JSON data into the in‑memory cache
    DataLoader.load_all()
