import math
from typing import Dict, List

from backend.services.data_loader import DataLoader
from backend.models.owner import Owner
from backend.models.cable import Cable


def network_overview() -> Dict[str, int | float]:
    """Compute dynamic network overview values.
    Returns a dict with keys: active_cables, landing_points, capacity_tbps, health_score.
    """
    cables = DataLoader.get_cables()
    active_cables = sum(1 for c in cables if c.status == "active")
    total_capacity = sum(c.capacityTbps for c in cables)
    landing_points = len(DataLoader.get_landing_points())

    total_cables = len(cables)
    if total_cables == 0:
        health = 0
    else:
        health = int((active_cables / total_cables) * 80 + (total_capacity / (total_cables * 100)) * 20)
    health = max(0, min(100, round(health)))

    return {
        "active_cables": active_cables,
        "landing_points": landing_points,
        "capacity_tbps": total_capacity,
        "health_score": health,
    }


def ownership_percentages() -> Dict[str, int]:
    """Calculate ownership concentration percentages based on cable capacity.
    Returns a mapping from lower‑cased owner name to integer percentage (rounded).
    Top owners are Google, Meta, Microsoft, Orange; everything else is "others".
    """
    cables = DataLoader.get_cables()
    owners = DataLoader.get_owners()
    id_to_name = {o.id: o.name.lower() for o in owners}
    total_capacity = sum(c.capacityTbps for c in cables)
    if total_capacity == 0:
        return {"google": 0, "meta": 0, "microsoft": 0, "orange": 0, "others": 0}

    capacity_by_owner: Dict[str, int] = {}
    for c in cables:
        for oid in c.owners:
            capacity_by_owner[oid] = capacity_by_owner.get(oid, 0) + c.capacityTbps

    top_keys = {
        "google": "o2",
        "meta": "o1",
        "microsoft": "o3",
        "orange": "o5",
    }
    result: Dict[str, int] = {}
    accounted = 0
    for name, oid in top_keys.items():
        pct = round((capacity_by_owner.get(oid, 0) / total_capacity) * 100)
        result[name] = pct
        accounted += pct
    result["others"] = max(0, 100 - accounted)
    return result


def intelligence_assessment() -> Dict[str, str | int]:
    """Return a composite assessment for the dashboard.
    Uses network health, ownership concentration and a static bottleneck.
    """
    overview = network_overview()
    health = overview.get("health_score", 0)
    if health >= 90:
        resilience = "Strong"
    elif health >= 70:
        resilience = "Medium"
    else:
        resilience = "Weak"

    ownership = ownership_percentages()
    top_total = ownership.get("google", 0) + ownership.get("meta", 0) + ownership.get("microsoft", 0) + ownership.get("orange", 0)
    if top_total > 60:
        ownership_conc = "High"
    elif top_total > 40:
        ownership_conc = "Moderate"
    else:
        ownership_conc = "Low"

    return {
        "health": health,
        "resilience": resilience,
        "ownership_concentration": ownership_conc,
        "primary_bottleneck": "Suez Corridor",
        "regional_dependency": "High in EMEA",
    }
