from typing import List, Any
from fastapi import APIRouter, HTTPException
from backend.models.simulation_request import SimulationCutRequest
from backend.models.simulation_response import SimulationCutResponse, ScenarioItem
from backend.services.simulation_engine import run_cut_simulation, get_scenarios, get_history

router = APIRouter()


@router.post("/cut", response_model=SimulationCutResponse)
def cut_cable(body: SimulationCutRequest):
    """Simulate cutting a cable and return the impact assessment."""
    try:
        result = run_cut_simulation(body.cable_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    return result


@router.get("/scenarios", response_model=List[ScenarioItem])
def list_scenarios():
    """Return all available cut scenarios (active cables)."""
    return get_scenarios()


@router.get("/history")
def simulation_history():
    """Return in-memory simulation history, newest first."""
    return get_history()
