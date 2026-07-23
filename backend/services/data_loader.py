"""Singleton data loader – reads JSON files once at startup and caches them."""
import json
from pathlib import Path
from typing import List

from backend.models.cable import Cable
from backend.models.landing_point import LandingPoint
from backend.models.owner import Owner
from backend.models.country import Country

DATA_DIR = Path(__file__).parent.parent / "data"


class DataLoader:
    _cables: List[Cable] = []
    _landing_points: List[LandingPoint] = []
    _owners: List[Owner] = []
    _countries: List[Country] = []
    _loaded: bool = False

    @classmethod
    def load_all(cls) -> None:
        """Load all JSON files into memory. Called once at application startup."""
        if cls._loaded:
            return
        cls._cables = [Cable(**c) for c in json.loads((DATA_DIR / "cables.json").read_text(encoding="utf-8"))]
        cls._landing_points = [LandingPoint(**lp) for lp in json.loads((DATA_DIR / "landing_points.json").read_text(encoding="utf-8"))]
        cls._owners = [Owner(**o) for o in json.loads((DATA_DIR / "owners.json").read_text(encoding="utf-8"))]
        cls._countries = [Country(**c) for c in json.loads((DATA_DIR / "countries.json").read_text(encoding="utf-8"))]
        cls._loaded = True

    @classmethod
    def get_cables(cls) -> List[Cable]:
        if not cls._loaded:
            cls.load_all()
        return cls._cables

    @classmethod
    def get_landing_points(cls) -> List[LandingPoint]:
        if not cls._loaded:
            cls.load_all()
        return cls._landing_points

    @classmethod
    def get_owners(cls) -> List[Owner]:
        if not cls._loaded:
            cls.load_all()
        return cls._owners

    @classmethod
    def get_countries(cls) -> List[Country]:
        if not cls._loaded:
            cls.load_all()
        return cls._countries
