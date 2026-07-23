from typing import List
from pydantic import BaseModel

class LandingPoint(BaseModel):
    id: str
    name: str
    countryId: str
    tier: int                   # 1 = primary, 2 = secondary, 3 = tertiary
    coordinates: List[float]    # [lon, lat]
