"""run.py - convenience launcher for the FastAPI backend.
Run from the project root:
    python run.py
"""
import os
import uvicorn

if __name__ == "__main__":
    host = os.getenv("FASTAPI_HOST", "0.0.0.0")
    port = int(os.getenv("FASTAPI_PORT", "8000"))
    uvicorn.run(
        "backend.main:app",
        host=host,
        port=port,
        reload=True,
    )
