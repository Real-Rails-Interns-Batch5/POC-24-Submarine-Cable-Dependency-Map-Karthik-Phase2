"use client";

import React from 'react';
import { LANDING_POINTS, CABLES, COUNTRIES, OWNERS } from '@/lib/constants';

const TIER_LABEL: Record<number, { label: string; color: string }> = {
  1: { label: 'Global Internet Hub',  color: '#36D6FF' },
  2: { label: 'Regional Hub',         color: '#5EEAD4' },
  3: { label: 'Landing Station',      color: '#94A3B8' },
};

const NETWORK_ROLE: Record<number, string> = {
  1: 'Primary aggregation node. Loss creates cascading regional impact across multiple cable corridors.',
  2: 'Regional distribution hub. Disruption forces traffic rerouting through adjacent corridors.',
  3: 'Standard termination station. Moderate resilience with established alternate routes.',
};

interface LandingPointPanelProps {
  landingPointId: string;
}

export function LandingPointPanel({ landingPointId }: LandingPointPanelProps) {
  const lp = LANDING_POINTS.find(p => p.id === landingPointId);
  if (!lp) return null;

  const country   = COUNTRIES.find(c => c.id === lp.countryId);
  const tier      = lp.tier ?? 3;
  const tierInfo  = TIER_LABEL[tier];

  // All cables that have this landing point
  const connectedCables = CABLES.filter(c => c.landingPoints.includes(lp.id));
  const totalCapacity   = connectedCables.reduce((sum, c) => sum + c.capacityTbps, 0);
  const activeCables    = connectedCables.filter(c => c.status === 'active');

  // Collect all unique owner IDs across connected cables
  const ownerIds  = Array.from(new Set(connectedCables.flatMap(c => c.owners)));
  const owners    = ownerIds.map(id => OWNERS.find(o => o.id === id)).filter(Boolean);

  return (
    <div className="flex flex-col h-full bg-[var(--surface)] text-[var(--text-primary)]">
      
      {/* Header */}
      <div className="p-5 border-b border-[var(--border)]">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h2 className="text-sm font-bold text-gray-100 uppercase tracking-widest pr-8">{lp.name}</h2>
            <span className="text-[9px] font-bold uppercase tracking-widest mt-1 block" style={{ color: tierInfo.color }}>
              {tierInfo.label}
            </span>
          </div>
        </div>

        {/* Core metrics grid */}
        <div className="grid grid-cols-2 gap-[1px] bg-[var(--border)] rounded overflow-hidden mt-3">
          <div className="bg-[var(--background)] p-3 flex flex-col">
            <span className="text-[9px] uppercase text-[var(--text-muted)] font-semibold tracking-wider mb-0.5">Country</span>
            <span className="text-sm font-bold text-gray-200">{country?.name ?? lp.countryId}</span>
          </div>
          <div className="bg-[var(--background)] p-3 flex flex-col">
            <span className="text-[9px] uppercase text-[var(--text-muted)] font-semibold tracking-wider mb-0.5">Tier</span>
            <span className="text-sm font-bold" style={{ color: tierInfo.color }}>{tier}</span>
          </div>
          <div className="bg-[var(--background)] p-3 flex flex-col">
            <span className="text-[9px] uppercase text-[var(--text-muted)] font-semibold tracking-wider mb-0.5">Connected Cables</span>
            <span className="text-sm font-bold text-gray-200">{connectedCables.length}</span>
          </div>
          <div className="bg-[var(--background)] p-3 flex flex-col">
            <span className="text-[9px] uppercase text-[var(--text-muted)] font-semibold tracking-wider mb-0.5">Total Capacity</span>
            <span className="text-sm font-bold text-gray-200">{totalCapacity} <span className="text-[10px] text-[#64748b]">Tbps</span></span>
          </div>
        </div>
      </div>

      {/* Connected Cables */}
      <div className="p-5 border-b border-[var(--border)]">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-3">Connected Cables</h3>
        <div className="flex flex-col gap-[1px] bg-[var(--border)] rounded overflow-hidden">
          {connectedCables.map(cable => (
            <div key={cable.id} className="bg-[var(--background)] p-2.5 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: cable.color }} />
                <span className="text-[11px] font-medium text-gray-200">{cable.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-[var(--text-muted)]">{cable.capacityTbps} Tbps</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide ${
                  cable.status === 'active'
                    ? 'bg-[#22c55e]/15 text-[#22c55e] border border-[#22c55e]/25'
                    : 'bg-[#f59e0b]/15 text-[#f59e0b] border border-[#f59e0b]/25'
                }`}>
                  {cable.status}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Active vs Planned summary */}
        <div className="flex gap-2 mt-3">
          <div className="flex-1 bg-[var(--background)] border border-[var(--border)] rounded p-2 text-center">
            <span className="block text-lg font-bold text-[#22c55e] leading-none">{activeCables.length}</span>
            <span className="text-[8px] uppercase tracking-wider text-[var(--text-muted)] font-semibold">Active</span>
          </div>
          <div className="flex-1 bg-[var(--background)] border border-[var(--border)] rounded p-2 text-center">
            <span className="block text-lg font-bold text-[#f59e0b] leading-none">{connectedCables.length - activeCables.length}</span>
            <span className="text-[8px] uppercase tracking-wider text-[var(--text-muted)] font-semibold">Planned</span>
          </div>
        </div>
      </div>

      {/* Ownership */}
      <div className="p-5 border-b border-[var(--border)]">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-3">Stakeholders</h3>
        <div className="flex flex-col gap-[1px] bg-[var(--border)] rounded overflow-hidden">
          {owners.map(owner => (
            <div key={owner!.id} className="bg-[var(--background)] p-2.5 flex justify-between items-center">
              <span className="text-[11px] font-medium text-gray-200">{owner!.name}</span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide ${
                owner!.type === 'private'
                  ? 'bg-[#36D6FF]/10 text-[#36D6FF] border border-[#36D6FF]/20'
                  : owner!.type === 'telecom'
                  ? 'bg-[#5EEAD4]/10 text-[#5EEAD4] border border-[#5EEAD4]/20'
                  : 'bg-[#94A3B8]/10 text-[#94A3B8] border border-[#94A3B8]/20'
              }`}>
                {owner!.type}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Network Role */}
      <div className="p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-3">Network Role</h3>
        <div className="border-l-2 pl-3 py-1" style={{ borderColor: tierInfo.color }}>
          <span className="block text-[9px] uppercase font-bold tracking-widest mb-1" style={{ color: tierInfo.color }}>
            Operational Context
          </span>
          <p className="text-[10px] text-[#94a3b8] leading-relaxed">{NETWORK_ROLE[tier]}</p>
        </div>
      </div>
    </div>
  );
}
