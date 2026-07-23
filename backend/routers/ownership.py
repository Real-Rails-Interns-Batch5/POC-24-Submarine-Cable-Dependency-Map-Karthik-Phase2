from typing import List
from fastapi import APIRouter
from backend.models.owner import Owner
from backend.models.country import Country
from backend.services.data_loader import DataLoader
from backend.services.intelligence import ownership_percentages

router = APIRouter()


@router.get("", response_model=List[Owner])
def get_owners():
    """Return all cable owners."""
    return DataLoader.get_owners()


@router.get("/percentages")
def get_ownership_percentages():
    """Return computed ownership concentration percentages."""
    return ownership_percentages()


@router.get("/countries", response_model=List[Country])
def get_countries():
    """Return all countries."""
    return DataLoader.get_countries()
