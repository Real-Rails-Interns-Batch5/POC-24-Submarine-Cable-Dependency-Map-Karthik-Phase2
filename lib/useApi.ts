/**
 * lib/useApi.ts
 * Lightweight React hooks that wrap the API client.
 * Each hook handles loading / error state so components stay clean.
 */
"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getNetworkOverview,
  getAssessment,
  getCables,
  getCable,
  getOwners,
  getOwnership,
  getLandingPoints,
  runCutSimulation,
  getSimulationScenarios,
  NetworkOverview,
  NetworkAssessment,
  OwnershipPercentages,
  SimulationResult,
  SimulationScenario,
  CableFilters,
} from "./api";
import { Cable, LandingPoint, Owner } from "./types";

// Generic hook factory
function useQuery<T>(fetcher: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetcher()
      .then((d) => { if (!cancelled) { setData(d); setLoading(false); } })
      .catch((e) => { if (!cancelled) { setError(String(e)); setLoading(false); } });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error };
}

// ─── Exported hooks ──────────────────────────────────────────────────────────

export function useNetworkOverview() {
  return useQuery<NetworkOverview>(getNetworkOverview);
}

export function useAssessment() {
  return useQuery<NetworkAssessment>(getAssessment);
}

export function useCables(filters?: CableFilters) {
  return useQuery<Cable[]>(
    () => getCables(filters),
    [filters?.region, filters?.status, filters?.owner]
  );
}

export function useCable(id: string | null) {
  const [data, setData] = useState<Cable | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) { setData(null); setLoading(false); setError(null); return; }
    let cancelled = false;
    setLoading(true);
    getCable(id)
      .then((d) => { if (!cancelled) { setData(d); setLoading(false); } })
      .catch((e) => { if (!cancelled) { setError(String(e)); setLoading(false); } });
    return () => { cancelled = true; };
  }, [id]);

  return { data, loading, error };
}

export function useOwners() {
  return useQuery<Owner[]>(getOwners);
}

export function useOwnership() {
  return useQuery<OwnershipPercentages>(getOwnership);
}

export function useLandingPoints() {
  return useQuery<LandingPoint[]>(getLandingPoints);
}

export function useSimulationScenarios() {
  return useQuery<SimulationScenario[]>(getSimulationScenarios);
}

// Imperative hook – returns a trigger function and the last result
export function useRunSimulation() {
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async (cableId: string) => {
    setLoading(true);
    setError(null);
    try {
      const r = await runCutSimulation(cableId);
      setResult(r);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => { setResult(null); setError(null); }, []);

  return { result, loading, error, run, reset };
}
