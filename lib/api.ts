/**
 * lib/api.ts
 * Centralised API client for the FastAPI backend.
 * All fetch calls go through here – components never call fetch() directly.
 */
import { Cable, LandingPoint, Owner, Country } from "./types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

// ─── Helpers ────────────────────────────────────────────────────────────────

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`API error ${res.status} on ${path}`);
  return res.json() as Promise<T>;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`API error ${res.status} on ${path}`);
  return res.json() as Promise<T>;
}

// ─── Response Types ──────────────────────────────────────────────────────────

export interface NetworkOverview {
  active_cables: number;
  landing_points: number;
  capacity_tbps: number;
  health_score: number;
}

export interface NetworkAssessment {
  health: number;
  resilience: string;
  ownership_concentration: string;
  primary_bottleneck: string;
  regional_dependency: string;
}

export interface OwnershipPercentages {
  google: number;
  meta: number;
  microsoft: number;
  orange: number;
  others: number;
}

export interface SimulationResult {
  health_score: number;
  capacity_loss_tbps: number;
  affected_regions: string[];
  rerouting_required: boolean;
  impact: "HIGH" | "MEDIUM" | "LOW";
  summary: string;
  resilience_score: number;
  rerouting_recommendation: string;
  alternative_cables: string[];
  risk_narrative: string;
  timestamp: string;
}

export interface SimulationScenario {
  cable_id: string;
  name: string;
}

// ─── Network ─────────────────────────────────────────────────────────────────

export const getNetworkOverview = () =>
  get<NetworkOverview>("/api/network/overview");

export const getAssessment = () =>
  get<NetworkAssessment>("/api/network/assessment");

// ─── Cables ───────────────────────────────────────────────────────────────────

export interface CableFilters {
  region?: string;
  status?: string;
  owner?: string;
}

export const getCables = (filters?: CableFilters) => {
  const params = new URLSearchParams();
  if (filters?.region && filters.region !== "all") params.set("region", filters.region);
  if (filters?.status && filters.status !== "all") params.set("status", filters.status);
  if (filters?.owner) params.set("owner", filters.owner);
  const qs = params.toString();
  return get<Cable[]>(`/api/cables${qs ? `?${qs}` : ""}`);
};

export const getCable = (id: string) => get<Cable>(`/api/cables/${id}`);

export const getLandingPoints = () => get<LandingPoint[]>("/api/cables/landing-points");

// ─── Ownership ───────────────────────────────────────────────────────────────

export const getOwners = () => get<Owner[]>("/api/ownership");

export const getOwnership = () =>
  get<OwnershipPercentages>("/api/ownership/percentages");

export const getCountries = () => get<Country[]>("/api/ownership/countries");

// ─── Simulation ───────────────────────────────────────────────────────────────

export const runCutSimulation = (cableId: string) =>
  post<SimulationResult>("/api/simulation/cut", { cable_id: cableId });

export const getSimulationScenarios = () =>
  get<SimulationScenario[]>("/api/simulation/scenarios");

export const getSimulationHistory = () =>
  get<SimulationResult[]>("/api/simulation/history");
