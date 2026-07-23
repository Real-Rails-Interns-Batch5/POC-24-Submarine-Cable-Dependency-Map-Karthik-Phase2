import React from 'react';
import { Cable, LandingPoint } from '@/lib/types';
import { COUNTRIES, OWNERS, CABLES } from '@/lib/constants';
import { redundancyLabel, redundancyColor } from '@/lib/utils';

export interface TooltipState {
  show: boolean;
  x: number;
  y: number;
  type: 'cable' | 'lp' | null;
  data: Cable | LandingPoint | null;
}

export function MapTooltip({ tooltip }: { tooltip: TooltipState }) {
  if (!tooltip.show || !tooltip.data) return null;

  const { x, y, type, data } = tooltip;

  if (type === 'cable') {
    const cable = data as Cable;
    const ownersList = cable.owners.map(oid => OWNERS.find(o => o.id === oid)?.name).join(', ');
    const redundancy = cable.landingPoints.length;

    return (
      <div 
        className="absolute pointer-events-none bg-[var(--depth-3)] border border-[var(--border-default)] rounded-[9px] p-[11px_13px] shadow-[0_12px_32px_rgba(0,0,0,0.5)] z-50 w-[220px]"
        style={{ left: x + 15, top: y + 15 }}
      >
        <h3 className="text-[13px] font-bold text-[var(--text-primary)] mb-2">{cable.name}</h3>
        <div className="flex flex-col gap-1 text-[11px] text-[var(--text-muted)]">
          <div className="flex justify-between">
            <span>Capacity</span>
            <span className="text-[var(--text-primary)]">{cable.capacityTbps} Tbps</span>
          </div>
          <div className="flex justify-between">
            <span>Status</span>
            <span style={{ color: cable.status === 'active' ? '#22c55e' : cable.status === 'planned' ? '#14b8a6' : '#ef4444' }} className="capitalize">
              {cable.status.replace('_', ' ')}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Region</span>
            <span className="text-[var(--text-primary)] capitalize">{cable.region.replace('-', ' ')}</span>
          </div>
          <div className="flex justify-between">
            <span>Redundancy</span>
            <span style={{ color: redundancyColor(redundancy) }}>{redundancyLabel(redundancy)}</span>
          </div>
          <div className="flex justify-between mt-1 pt-1 border-t border-[var(--border-subtle)]">
            <span>Owners</span>
            <span className="text-[var(--text-primary)] text-right truncate ml-2" title={ownersList}>{ownersList}</span>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'lp') {
    const lp = data as LandingPoint;
    const country = COUNTRIES.find(c => c.id === lp.countryId);
    const connectedCables = CABLES.filter((c: Cable) => c.landingPoints.includes(lp.id));

    return (
      <div 
        className="absolute pointer-events-none bg-[var(--depth-3)] border border-[var(--border-default)] rounded-[9px] p-[11px_13px] shadow-[0_12px_32px_rgba(0,0,0,0.5)] z-50 w-[180px]"
        style={{ left: x + 15, top: y + 15 }}
      >
        <h3 className="text-[12px] font-bold text-[var(--text-primary)] mb-2">{lp.name}</h3>
        <div className="flex flex-col gap-1 text-[11px] text-[var(--text-muted)]">
          <div className="flex justify-between">
            <span>Country</span>
            <span className="text-[var(--text-primary)]">{country?.name}</span>
          </div>
          <div className="flex justify-between">
            <span>Node Type</span>
            <span className="text-[var(--text-primary)]">{connectedCables.length >= 3 ? 'Major' : connectedCables.length === 2 ? 'Mid' : 'Minor'}</span>
          </div>
          <div className="flex justify-between mb-1 pb-1 border-b border-[var(--border-subtle)]">
            <span>Cables</span>
            <span className="text-[var(--text-primary)]">{connectedCables.length}</span>
          </div>
          <div className="flex flex-col gap-0.5 text-[10px]">
            {connectedCables.map((c: Cable) => (
              <span key={c.id} style={{ color: c.color }}>• {c.name}</span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
