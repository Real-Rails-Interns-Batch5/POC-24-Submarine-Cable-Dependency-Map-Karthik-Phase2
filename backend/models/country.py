from typing import List
from pydantic import BaseModel

class Country(BaseModel):
    id: str
    name: str
    code: str
    coordinates: List[float]  # [lon, lat]
