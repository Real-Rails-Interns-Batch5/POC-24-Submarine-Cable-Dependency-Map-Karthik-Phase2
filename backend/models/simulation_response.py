from typing import List, Optional
from pydantic import BaseModel

class SimulationCutResponse(BaseModel):
    health_score: int
    capacity_loss_tbps: int
    affected_regions: List[str]
    rerouting_required: bool
    impact: str                     # "HIGH" | "MEDIUM" | "LOW"
    summary: str
    resilience_score: int
    rerouting_recommendation: str
    alternative_cables: List[str]
    risk_narrative: str
    timestamp: str

class ScenarioItem(BaseModel):
    cable_id: str
    name: str

class HistoryItem(BaseModel):
    cable_id: str
    result: SimulationCutResponse
