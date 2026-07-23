from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from backend.models.cable import Cable
from backend.models.landing_point import LandingPoint
from backend.services.data_loader import DataLoader

router = APIRouter()


@router.get("", response_model=List[Cable])
def get_cables(
    region: Optional[str] = Query(None, description="Filter by region"),
    status: Optional[str] = Query(None, description="Filter by status (active/planned)"),
    owner: Optional[str] = Query(None, description="Filter by owner ID"),
):
    """Return all cables. Supports optional filters: region, status, owner."""
    cables = DataLoader.get_cables()
    if region:
        cables = [c for c in cables if c.region.lower() == region.lower()]
    if status:
        cables = [c for c in cables if c.status.lower() == status.lower()]
    if owner:
        cables = [c for c in cables if owner in c.owners]
    return cables


@router.get("/landing-points", response_model=List[LandingPoint])
def get_landing_points():
    """Return all cable landing points."""
    return DataLoader.get_landing_points()


@router.get("/{cable_id}", response_model=Cable)
def get_cable(cable_id: str):
    """Return a single cable by ID."""
    cable = next((c for c in DataLoader.get_cables() if c.id == cable_id), None)
    if not cable:
        raise HTTPException(status_code=404, detail=f"Cable '{cable_id}' not found")
    return cable
