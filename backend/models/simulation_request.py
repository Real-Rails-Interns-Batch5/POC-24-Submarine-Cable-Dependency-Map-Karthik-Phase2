from pydantic import BaseModel, Field

class SimulationCutRequest(BaseModel):
    cable_id: str = Field(..., description="ID of the cable to simulate cutting")
