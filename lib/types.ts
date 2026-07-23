// /lib/types.ts
export type CableStatus = 'active' | 'planned' | 'under_repair' | 'offline';
export type CableRegion = 'transatlantic' | 'transpacific' | 'intra-asia' | 'emea' | 'americas';

export interface Owner {
  id: string;
  name: string;
  type: 'consortium' | 'private' | 'telecom';
}

export interface Country {
  id: string;
  name: string;
  code: string;
  coordinates: [number, number]; // [longitude, latitude]
}

export interface LandingPoint {
  id: string;
  name: string;
  countryId: string;
  coordinates: [number, number];
  tier?: 1 | 2 | 3; // 1=Global Hub, 2=Regional Hub, 3=Standard
}

export interface Cable {
  id: string;
  name: string;
  lengthKm: number;
  capacityTbps: number;
  status: CableStatus;
  region: CableRegion;
  owners: string[]; // Owner IDs
  landingPoints: string[]; // LandingPoint IDs
  path: [number, number][]; // Array of [longitude, latitude]
  color: string;
  glowColor: string;
}

export interface FilterState {
  region: string;
  capacity: string;
  status: string;
}

export interface SimulationResult {
  health_score: number;
  capacity_loss_tbps: number;
  affected_regions: string[];
  rerouting_required: boolean;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  summary: string;
  resilience_score: number;
  rerouting_recommendation: string;
  alternative_cables: string[];
  risk_narrative: string;
  timestamp: string;
}

export interface SimState {
  running: boolean;
  cableId: string | null;
  result: SimulationResult | null;
  error: string | null;
}

export interface AppState {
  selectedCable: string | null;
  selectedLandingPoint: string | null;
  activeTab: 'map' | 'country' | 'sim';
  filters: FilterState;
  sim: SimState;
  panel: 'why' | 'who' | null;
  panelOpen: boolean;
}
