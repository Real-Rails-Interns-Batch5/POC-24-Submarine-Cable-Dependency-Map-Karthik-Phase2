import { CABLES, LANDING_POINTS, COUNTRIES, OWNERS } from './constants';

export function downloadData() {
  const data = {
    meta: {
      title: "Submarine Cable Dependency Map Data",
      source: "Real Rails Intelligence Library",
      generated: new Date().toISOString(),
      data_provenance: {
        topology: "TeleGeography Submarine Cable Map (reference, 2024)",
        redundancy_scores: "SYNTHETIC — not real-time",
        events: "SYNTHETIC — no public event feed available"
      }
    },
    cables: CABLES,
    landing_points: LANDING_POINTS,
    countries: COUNTRIES,
    owners: OWNERS
  };

  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.href = url;
  link.download = "submarine_cable_data.json";
  document.body.appendChild(link);
  link.click();
  
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
