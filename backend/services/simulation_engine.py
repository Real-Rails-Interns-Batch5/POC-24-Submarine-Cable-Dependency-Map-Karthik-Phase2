"""Simulation engine service for cable cut scenarios.

All business logic is kept here – the router only forwards the request.
"""
from datetime import datetime
from typing import List, Dict, Any

from backend.services.data_loader import DataLoader


def compute_resilience(health_score: int, affected_region: str, capacity_loss_pct: float):
    """Inline resilience calculation – no external dependency required."""
    resilience_score = max(0, min(100, health_score - int(capacity_loss_pct * 0.5)))

    if capacity_loss_pct > 15:
        recommendation = "Activate emergency rerouting via alternative corridors immediately."
    elif capacity_loss_pct > 7:
        recommendation = "Increase traffic distribution across remaining active cables."
    else:
        recommendation = "Monitor network performance; no immediate rerouting required."

    # Map region to alternative cable names
    region_alternatives = {
        "transatlantic": ["MAREA", "Dunant", "EllaLink"],
        "emea": ["AAE-1", "ACE", "SeaMeWe-6"],
        "transpacific": ["FASTER", "Jupiter"],
        "intra-asia": ["Apricot", "AAE-1"],
    }
    alternatives = region_alternatives.get(affected_region.lower(), ["Redundant path analysis required"])

    if health_score >= 85:
        narrative = "Network remains resilient. Minimal operational disruption expected."
    elif health_score >= 65:
        narrative = "Moderate degradation detected. Regional traffic may experience congestion."
    else:
        narrative = "Critical degradation. Immediate intervention required to restore capacity."

    return resilience_score, recommendation, alternatives, narrative

# In‑memory store for completed simulations (persisted only while the process lives)
SIMULATION_HISTORY: List[Dict[str, Any]] = []


def get_scenarios() -> List[Dict[str, str]]:
    """Return a list of possible cut scenarios.
    For simplicity we expose every *active* cable as a scenario.
    """
    return [{"cable_id": c.id, "name": c.name} for c in DataLoader.get_cables() if c.status == "active"]


def _calculate_loss(cable_id: str) -> Dict[str, Any]:
    """Internal helper – computes metrics for a cut simulation *without* mutating anything.
    Raises ``ValueError`` if the cable cannot be cut.
    """
    all_cables = DataLoader.get_cables()
    active_cables = [c for c in all_cables if c.status == "active"]
    total_capacity = sum(c.capacityTbps for c in active_cables)
    total_active = len(active_cables)

    # Locate the target cable (must be active)
    target = next((c for c in active_cables if c.id == cable_id), None)
    if not target:
        raise ValueError("Cable not found or not active")

    # New network state after the cut
    new_active = total_active - 1
    capacity_loss = target.capacityTbps
    new_capacity = total_capacity - capacity_loss
    capacity_loss_pct = (capacity_loss / total_capacity) * 100 if total_capacity else 0

    # ---------- Health score ----------
    health = 100
    # capacity loss penalty – direct percentage impact
    health -= capacity_loss_pct
    # redundancy penalty – if the region loses its last active cable, -10
    region_active = len([c for c in active_cables if c.region == target.region and c.id != cable_id])
    if region_active == 0:
        health -= 10
    # regional dependency penalty – extra -5 for EMEA (example rule)
    if target.region.lower() == "emea":
        health -= 5
    health = max(0, int(round(health)))

    # ---------- Impact classification ----------
    if capacity_loss_pct > 15:
        impact = "HIGH"
    elif capacity_loss_pct > 7:
        impact = "MEDIUM"
    else:
        impact = "LOW"

    affected_regions = [target.region.upper()]
    rerouting_required = impact in {"HIGH", "MEDIUM"}

    # ---------- Bonus intelligence ----------
    resilience_score, recommendation, alternatives, narrative = compute_resilience(
        health_score=health,
        affected_region=target.region,
        capacity_loss_pct=capacity_loss_pct,
    )

    result: Dict[str, Any] = {
        "health_score": health,
        "capacity_loss_tbps": capacity_loss,
        "affected_regions": affected_regions,
        "rerouting_required": rerouting_required,
        "impact": impact,
        "summary": f"{target.name} disruption {impact.lower()}ly impacts the network.",
        # Bonus fields
        "resilience_score": resilience_score,
        "rerouting_recommendation": recommendation,
        "alternative_cables": alternatives,
        "risk_narrative": narrative,
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }
    return result


def run_cut_simulation(cable_id: str) -> Dict[str, Any]:
    """Public API – executes a cut simulation and records it.
    Returns the computed result dictionary.
    """
    try:
        result = _calculate_loss(cable_id)
    except ValueError as exc:
        raise exc
    # Store a shallow copy in the global history list
    SIMULATION_HISTORY.append({"cable_id": cable_id, "result": result})
    return result


def get_history() -> List[Dict[str, Any]]:
    """Return the stored simulation history, newest first."""
    return list(reversed(SIMULATION_HISTORY))
