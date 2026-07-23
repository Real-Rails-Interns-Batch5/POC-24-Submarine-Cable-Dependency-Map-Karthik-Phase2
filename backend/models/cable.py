from typing import List, Optional
from pydantic import BaseModel

class Cable(BaseModel):
    id: str
    name: str
    lengthKm: int
    capacityTbps: int
    status: str                         # "active" | "planned" | "maintenance"
    region: str                         # "transatlantic" | "emea" | "transpacific" | "intra-asia"
    owners: List[str]                   # list of Owner IDs
    landingPoints: List[str]            # list of LandingPoint IDs
    path: List[List[float]]             # list of [lon, lat] pairs
    color: str
    glowColor: str
