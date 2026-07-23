from fastapi import APIRouter
from backend.services.intelligence import network_overview, intelligence_assessment

router = APIRouter()


@router.get("/overview")
def get_network_overview():
    """Return dynamically computed network health overview."""
    return network_overview()


@router.get("/assessment")
def get_assessment():
    """Return full intelligence assessment for the dashboard."""
    return intelligence_assessment()
