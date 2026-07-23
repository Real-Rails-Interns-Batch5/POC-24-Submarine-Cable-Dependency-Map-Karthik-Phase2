from pydantic import BaseModel

class Owner(BaseModel):
    id: str
    name: str
    type: str  # "private" | "telecom"
