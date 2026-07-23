import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Cable } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function redundancyColor(count: number): string {
  if (count >= 3) return 'var(--accent-green)';
  if (count === 2) return 'var(--accent-amber)';
  return 'var(--accent-red)';
}

export function redundancyLabel(count: number): string {
  if (count >= 3) return 'High Redundancy';
  if (count === 2) return 'Medium Redundancy';
  return 'Critical / Single Point of Failure';
}

export function formatTbps(capacity: number): string {
  return `${capacity} Tbps`;
}

export function getFilteredCables(cables: Cable[], filters: { region: string, capacity: string, status: string }): Cable[] {
  return cables.filter(cable => {
    // Region
    if (filters.region && filters.region !== 'all') {
      if (filters.region === 'indian-ocean') {
        if (cable.region !== 'emea' && cable.region !== 'intra-asia') return false;
      } else if (cable.region !== filters.region) {
        return false;
      }
    }
    
    // Status
    if (filters.status && filters.status !== 'all') {
      if (cable.status !== filters.status) return false;
    }
    
    // Capacity
    if (filters.capacity && filters.capacity !== 'all') {
      const cap = cable.capacityTbps;
      if (filters.capacity === '>100') {
        if (cap <= 100) return false;
      } else if (filters.capacity === '10-100') {
        if (cap < 10 || cap > 100) return false;
      } else if (filters.capacity === '<10') {
        if (cap >= 10) return false;
      }
    }
    
    return true;
  });
}

export function positionTooltip(x: number, y: number, offset = 15) {
  return {
    top: `${y + offset}px`,
    left: `${x + offset}px`,
  };
}
