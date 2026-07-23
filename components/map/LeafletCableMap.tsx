"use client";

import React, { useMemo, useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAppState } from '@/components/providers/AppStateProvider';
import { CABLES, LANDING_POINTS } from '@/lib/constants';
import { getFilteredCables } from '@/lib/utils';
import { cablesToGeoJSON, landingPointsToGeoJSON } from '@/lib/geojson';

// ─── Map bounds: single world instance, no infinite scroll ───────────────────
// Network geographic extent (all landing points + cable arcs):
//   lng: -124° (Oregon) → +137° (Japan)   lat: -34° (S.Africa) → +52° (Pacific arc)
// WORLD_BOUNDS wraps the whole globe, used by TileLayer to prevent tile repetition.
// NETWORK_BOUNDS is used for fitBounds on initial load.
// MAX_BOUNDS adds generous padding so users can still pan/explore freely,
// but cannot scroll infinitely into empty repeated world copies.
const WORLD_BOUNDS    = L.latLngBounds(L.latLng(-85, -180), L.latLng(85, 180));
const NETWORK_BOUNDS  = L.latLngBounds(L.latLng(-42, -135), L.latLng(58, 150));
const MAX_BOUNDS      = L.latLngBounds(L.latLng(-85, -180), L.latLng(85, 180)); // Clamped strictly to tile bounds to eliminate black bands

// ─── Tier config ─────────────────────────────────────────────────────────────
const TIER_CONFIG = {
  1: { radius: 8,  strokeWidth: 2,   fillColor: '#0f1d38', strokeColor: '#38BDF8' },
  2: { radius: 5,  strokeWidth: 1.5, fillColor: '#0f1d38', strokeColor: '#818CF8' },
  3: { radius: 3,  strokeWidth: 1,   fillColor: '#0B1117', strokeColor: '#3d5a78' },
} as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Build a DivIcon for Tier 1 Global Hub nodes (supports CSS animation) */
function buildTier1Icon(isAffected: boolean, name: string): L.DivIcon {
  const color = isAffected ? '#ef4444' : '#38BDF8';
  const size = 16; // px — outer container
  const dot  = 6;

  return L.divIcon({
    className: '',
    iconSize:   [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `
      <div style="
        position: relative;
        width: ${size}px;
        height: ${size}px;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div class="hub-pulse-ring" style="width: ${size}px; height: ${size}px; top: 0; left: 0; border-color: ${color};"></div>
        <div class="hub-pulse-ring ring-2" style="width: ${size}px; height: ${size}px; top: 0; left: 0; border-color: ${color};"></div>
        <div style="width: ${dot}px; height: ${dot}px; border-radius: 50%; background: ${color}; box-shadow: 0 0 6px ${color}; position: relative; z-index: 2;"></div>
        <div class="lp-permanent-label">
          ${name}
          <span>Global Internet Hub</span>
        </div>
      </div>
    `,
  });
}

/** Build a DivIcon for Tier 2 Regional Hubs (conditional label based on zoom) */
function buildTier2Icon(isAffected: boolean, name: string, showLabel: boolean): L.DivIcon {
  const color = isAffected ? '#ef4444' : '#818CF8';
  const dot = 10; // 5px radius
  
  return L.divIcon({
    className: '',
    iconSize:   [dot, dot],
    iconAnchor: [dot / 2, dot / 2],
    html: `
      <div style="position: relative; width: ${dot}px; height: ${dot}px; display: flex; align-items: center; justify-content: center;">
        <div style="width: ${dot}px; height: ${dot}px; border-radius: 50%; background: #0f1d38; border: 1.5px solid ${color}; position: relative; z-index: 2;"></div>
        ${showLabel ? `
        <div class="lp-permanent-label" style="margin-left: 12px; margin-top: -6px;">
          ${name}
          <span style="color: #818CF8;">Regional Hub</span>
        </div>
        ` : ''}
      </div>
    `,
  });
}

// ─── Sub-component: fits map to cable network, enforces bounds on load ───────
function MapInitializer() {
  const map = useMap();
  useEffect(() => {
    // Enforce strict bounds — viscosity=1 means map snaps back instantly
    map.setMaxBounds(MAX_BOUNDS);
    map.options.maxBoundsViscosity = 1.0;

    const handleResize = () => {
      // Calculate minimum zoom needed to fill the viewport width horizontally
      // Tile size is 256px at zoom 0. We need 256 * 2^z >= mapWidth.
      const mapWidth = map.getSize().x;
      const minZoom = Math.log2(mapWidth / 256);
      map.setMinZoom(minZoom);
    };

    // Ensure size is computed correctly inside the flex container
    setTimeout(() => {
      map.invalidateSize();
      handleResize(); // Prevent zooming out into black edge bands
      map.fitBounds(NETWORK_BOUNDS, { padding: [24, 24], animate: false });
    }, 80);

    map.on('resize', handleResize);
    return () => { map.off('resize', handleResize); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

interface VisibleLayers {
  cables: boolean;
  landingPoints: boolean;
  ownership: boolean;
  risk: boolean;
  capacity: boolean;
}

// ─── Sub-component: Curated Labels ────────────────────────────────────────────
const CURATED_LABELS = [
  { name: 'North Atlantic Ocean', lat: 35, lng: -45, type: 'ocean' },
  { name: 'South Atlantic Ocean', lat: -20, lng: -15, type: 'ocean' },
  { name: 'North Pacific Ocean', lat: 30, lng: 160, type: 'ocean' },
  { name: 'South Pacific Ocean', lat: -20, lng: -130, type: 'ocean' },
  { name: 'Indian Ocean', lat: -10, lng: 80, type: 'ocean' },
  { name: 'North America', lat: 45, lng: -100, type: 'continent' },
  { name: 'South America', lat: -15, lng: -60, type: 'continent' },
  { name: 'Europe', lat: 50, lng: 15, type: 'continent' },
  { name: 'Africa', lat: 10, lng: 20, type: 'continent' },
  { name: 'Asia', lat: 45, lng: 90, type: 'continent' }
];

function CuratedLabelsLayer() {
  return (
    <>
      {CURATED_LABELS.map((label, i) => {
        const style = label.type === 'ocean' 
          ? 'color: rgba(148, 163, 184, 0.35); font-size: 13px; font-weight: 500; font-style: italic; letter-spacing: 2px; text-transform: uppercase; white-space: nowrap; transform: translate(-50%, -50%); pointer-events: none;'
          : 'color: rgba(71, 85, 105, 0.45); font-size: 16px; font-weight: 700; letter-spacing: 4px; text-transform: uppercase; white-space: nowrap; transform: translate(-50%, -50%); pointer-events: none;';
        
        return (
          <Marker
            key={i}
            position={[label.lat, label.lng]}
            icon={L.divIcon({
              className: 'curated-label-icon',
              html: `<div style="${style}">${label.name}</div>`,
              iconSize: [0, 0]
            })}
            interactive={false}
          />
        );
      })}
    </>
  );
}

// ─── Sub-component: Strategic Chokepoints ───────────────────────────────────
const CHOKEPOINTS = [
  { 
    name: 'Marseille', lat: 41.5, lng: 5.5, 
    importance: 'Critical Mediterranean Landing Hub', 
    corridors: 6, impact: 'High' 
  },
  { 
    name: 'Suez Corridor', lat: 27.5, lng: 34.0, 
    importance: 'Primary Asia-Europe Transit Route', 
    corridors: 14, impact: 'Critical' 
  },
  { 
    name: 'Strait of Malacca', lat: 4.5, lng: 99.0, 
    importance: 'Key Indo-Pacific Maritime Chokepoint', 
    corridors: 9, impact: 'High' 
  },
  { 
    name: 'Singapore Gateway', lat: 0.8, lng: 104.5, 
    importance: 'Major SE Asia Aggregation Hub', 
    corridors: 11, impact: 'Critical' 
  },
  { 
    name: 'English Channel', lat: 49.5, lng: -2.5, 
    importance: 'Primary UK-Europe Transit Route', 
    corridors: 8, impact: 'Medium' 
  }
];

function ChokepointsLayer() {
  const onEachChokepoint = (chokepoint: typeof CHOKEPOINTS[0]) => (node: any) => {
    if (!node) return;
    
    const impactColor = chokepoint.impact === 'Critical' ? '#ef4444' : 
                        chokepoint.impact === 'High' ? '#f97316' : '#f59e0b';
    
    node.bindTooltip(
      `<div class="lp-tooltip" style="border-left: 2px solid #f59e0b;">
         <div style="font-weight:bold; font-size:12px; margin-bottom:4px; color:#f59e0b; text-transform:uppercase; letter-spacing:1px;">${chokepoint.name}</div>
         <div style="color:#94a3b8; margin-bottom:8px; font-size:10px;">${chokepoint.importance}</div>
         <div style="display:flex; justify-content:space-between; width:160px; margin-bottom:2px;">
           <span style="color:#94a3b8;">Connected Corridors:</span> <span style="font-weight:600; color:#e2e8f0;">${chokepoint.corridors}</span>
         </div>
         <div style="display:flex; justify-content:space-between; width:160px;">
           <span style="color:#94a3b8;">Regional Impact:</span> <span style="color:${impactColor}; font-weight:600;">${chokepoint.impact}</span>
         </div>
       </div>`,
      { direction: 'top', offset: [0, -6], className: '' }
    );
  };

  return (
    <>
      {CHOKEPOINTS.map((chokepoint, i) => (
        <Marker
          key={i}
          position={[chokepoint.lat, chokepoint.lng]}
          icon={L.divIcon({
            className: '',
            iconSize: [100, 20],
            iconAnchor: [6, 10], // Anchor at the crosshair
            html: `
              <div style="display: flex; align-items: center; cursor: crosshair;">
                <div style="width: 12px; height: 12px; border: 1.5px solid rgba(245, 158, 11, 0.4); transform: rotate(45deg); display: flex; justify-content: center; align-items: center; position: relative;">
                  <div style="width: 2px; height: 2px; background: rgba(245, 158, 11, 0.8);"></div>
                </div>
                <div style="margin-left: 8px; font-size: 8px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; color: #f59e0b; opacity: 0.45; white-space: nowrap; pointer-events: none;">
                  ${chokepoint.name}
                </div>
              </div>
            `
          })}
          ref={onEachChokepoint(chokepoint)}
        />
      ))}
    </>
  );
}

// ─── Sub-component: cable GeoJSON layers (glow pass + main pass) ─────────────
interface CableLayersProps {
  geojsonCables: ReturnType<typeof cablesToGeoJSON>;
  selectedCable: string | null;
  hoveredCable: string | null;
  simCableId: string | null;
  visibleLayers: VisibleLayers;
  onCableClick: (id: string) => void;
  onCableHover: (id: string | null) => void;
}

function CableLayers({
  geojsonCables, selectedCable, hoveredCable, simCableId, visibleLayers, onCableClick, onCableHover,
}: CableLayersProps) {

  /** GLOW layer — thicker, semi-transparent, rendered below main layer */
  const glowStyle = (feature: any) => {
    if (!visibleLayers.cables) return { opacity: 0, weight: 0, fillOpacity: 0 };
    
    const id       = feature.properties.id;
    const isSelected  = selectedCable === id;
    const isHovered   = hoveredCable === id;
    const isSim       = simCableId === id;
    const glowColor   = isSim ? 'rgba(239,68,68,0.35)' : feature.properties.glowColor || 'rgba(56,189,248,0.25)';

    if (!isSelected && !isHovered) return { opacity: 0, weight: 0, fillOpacity: 0 };

    return {
      color:       glowColor,
      weight:      isSelected ? 18 : 10,
      opacity:     isSelected ? 0.3 : 0.2,
      fillOpacity: 0,
      lineCap:     'round' as const,
      lineJoin:    'round' as const,
    };
  };

  /** MAIN cable layer */
  const cableStyle = (feature: any) => {
    if (!visibleLayers.cables) return { opacity: 0, weight: 0, fillOpacity: 0 };
    
    const id        = feature.properties.id;
    const isSelected  = selectedCable === id;
    const isHovered   = hoveredCable === id;
    const isSim       = simCableId === id;
    const hasSelection = !!selectedCable || !!hoveredCable;

    let color = feature.properties.color || '#38BDF8';
    let weight   = 2;
    let opacity  = 0.75;
    
    if (visibleLayers.ownership) {
      // Simulate ownership coloring: Meta/Google = cyan, Telecom = amber
      const cable = CABLES.find(c => c.id === id);
      const isHyper = cable?.owners.some(o => ['o1', 'o2', 'o3', 'o4'].includes(o));
      color = isHyper ? '#38BDF8' : '#f59e0b';
    } else if (visibleLayers.risk) {
      // Simulate risk/redundancy: >2 LPs = high redundancy (green), else low (red)
      const lpCount = feature.properties.redundancy || 0;
      color = lpCount > 2 ? '#22c55e' : '#ef4444';
    }

    if (isSim) {
      color   = '#ef4444';
      weight  = isSelected ? 5 : 3;
      opacity = 1;
    } else if (isSelected) {
      weight  = 5;
      opacity = 1;
      if (!visibleLayers.ownership && !visibleLayers.risk) color = '#38BDF8';
    } else if (isHovered) {
      weight  = 3.5;
      opacity = 0.95;
    } else if (hasSelection) {
      // Dim all non-selected when something is selected
      opacity = 0.12;
      weight  = 1.5;
    } else if (visibleLayers.ownership || visibleLayers.risk) {
      // Enhance visibility slightly when in an analytical layer mode
      weight = 2.5;
      opacity = 0.9;
    }

    return {
      color,
      weight,
      opacity,
      fillOpacity: 0,
      lineCap:  'round' as const,
      lineJoin: 'round' as const,
    };
  };

  const onEachGlowFeature = (_feature: any, _layer: any) => {
    // Glow layer is purely decorative — no interaction
  };

  const onEachCableFeature = (feature: any, layer: any) => {
    const id = feature.properties.id;
    layer.on({
      click: () => onCableClick(id),
      mouseover: () => onCableHover(id),
      mouseout:  () => onCableHover(null),
    });
    // Rich tooltip
    layer.bindTooltip(
      `<div class="lp-tooltip">
        <strong>${feature.properties.name}</strong><br/>
        ${feature.properties.capacityTbps} Tbps &middot; ${feature.properties.region}
       </div>`,
      { sticky: true, className: '', offset: [8, 0] }
    );
  };

  const layerKey = `${selectedCable}-${hoveredCable}-${simCableId}-${geojsonCables.features.length}-${visibleLayers.cables}-${visibleLayers.ownership}-${visibleLayers.risk}`;

  return (
    <>
      {/* Glow pass */}
      <GeoJSON
        key={`glow-${layerKey}`}
        data={geojsonCables}
        style={glowStyle}
        onEachFeature={onEachGlowFeature}
      />
      {/* Main pass */}
      <GeoJSON
        key={`main-${layerKey}`}
        data={geojsonCables}
        style={cableStyle}
        onEachFeature={onEachCableFeature}
      />
    </>
  );
}

// ─── Sub-component: Landing point markers ────────────────────────────────────
interface LandingPointLayersProps {
  geojsonLPs: ReturnType<typeof landingPointsToGeoJSON>;
  simCableId: string | null;
  affectedLPIds: Set<string>;
  visibleLayers: VisibleLayers;
  onLPClick: (id: string) => void;
}

function LandingPointLayers({ geojsonLPs, affectedLPIds, visibleLayers, onLPClick }: LandingPointLayersProps) {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());
  
  useMapEvents({
    zoom: () => {
      setZoom(map.getZoom());
    }
  });

  if (!visibleLayers.landingPoints) return null;

  const pointToLayer = (feature: any, latlng: L.LatLng) => {
    const tier      = feature.properties.tier as 1 | 2 | 3;
    const isAffected = affectedLPIds.has(feature.properties.id);
    const name      = feature.properties.name;
    const cfg       = TIER_CONFIG[tier] || TIER_CONFIG[3];

    if (tier === 1) {
      // Tier 1: Always visible label with CSS pulse
      return L.marker(latlng, { icon: buildTier1Icon(isAffected, name) });
    }
    
    if (tier === 2) {
      // Tier 2: DivIcon with conditional label based on medium zoom (>= 4)
      return L.marker(latlng, { icon: buildTier2Icon(isAffected, name, zoom >= 4) });
    }

    // Tier 3: canvas CircleMarker, minimal glow
    const strokeColor = isAffected ? '#ef4444' : cfg.strokeColor;
    return L.circleMarker(latlng, {
      radius:      cfg.radius,
      fillColor:   cfg.fillColor,
      color:       strokeColor,
      weight:      cfg.strokeWidth,
      opacity:     1,
      fillOpacity: 0.95,
    });
  };

  const onEachLP = (feature: any, layer: any) => {
    const props = feature.properties;
    
    layer.on({
      click: () => onLPClick(props.id)
    });

    const tierLabel = props.tier === 1 ? 'Global Internet Hub' :
                      props.tier === 2 ? 'Regional Hub' : 'Landing Station';
                      
    const redundancyColor = props.redundancy === 'High' ? '#22c55e' : props.redundancy === 'Medium' ? '#f59e0b' : '#ef4444';

    layer.bindTooltip(
      `<div class="lp-tooltip">
         <div style="font-weight:bold; font-size:12px; margin-bottom:4px;">${props.name}</div>
         <div style="color:#818CF8; margin-bottom:6px; font-size:10px; text-transform:uppercase;">${tierLabel}</div>
         <div style="display:flex; justify-content:space-between; width:150px; margin-bottom:2px;">
           <span style="color:#94a3b8;">Connected Cables:</span> <span style="font-weight:600;">${props.connectedCables}</span>
         </div>
         <div style="display:flex; justify-content:space-between; width:150px; margin-bottom:2px;">
           <span style="color:#94a3b8;">Capacity:</span> <span style="font-weight:600;">${props.capacityTbps} Tbps</span>
         </div>
         <div style="display:flex; justify-content:space-between; width:150px;">
           <span style="color:#94a3b8;">Redundancy:</span> <span style="color:${redundancyColor}; font-weight:600;">${props.redundancy}</span>
         </div>
       </div>`,
      { direction: 'top', offset: [0, -6], className: '' }
    );
  };

  return (
    <GeoJSON
      key={`lps-${geojsonLPs.features.length}-${Array.from(affectedLPIds).join(',')}`}
      data={geojsonLPs}
      pointToLayer={pointToLayer}
      onEachFeature={onEachLP}
    />
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function LeafletCableMap() {
  const { state, dispatch, openPanel } = useAppState();
  const { filters, selectedCable, sim } = state;

  const [hoveredCable, setHoveredCable] = useState<string | null>(null);
  
  const [visibleLayers, setVisibleLayers] = useState<VisibleLayers>({
    cables: true,
    landingPoints: true,
    ownership: false,
    risk: false,
    capacity: false
  });

  const toggleLayer = (layer: keyof VisibleLayers) => {
    setVisibleLayers(prev => ({ ...prev, [layer]: !prev[layer] }));
  };

  const filteredCables = useMemo(() => getFilteredCables(CABLES, filters), [filters]);

  const geojsonCables = useMemo(() => cablesToGeoJSON(filteredCables), [filteredCables]);
  const geojsonLPs    = useMemo(() => {
    const lpIds = new Set(filteredCables.flatMap(c => c.landingPoints));
    return landingPointsToGeoJSON(LANDING_POINTS.filter(lp => lpIds.has(lp.id)), filteredCables);
  }, [filteredCables]);

  // Derive affected landing points from active simulation
  const affectedLPIds = useMemo<Set<string>>(() => {
    if (!sim.running || !sim.cableId) return new Set();
    const cable = CABLES.find(c => c.id === sim.cableId);
    return new Set(cable?.landingPoints ?? []);
  }, [sim]);

  const handleCableClick = (id: string) => {
    dispatch({ type: 'SET_SELECTED_CABLE', payload: id });
    dispatch({ type: 'SET_SELECTED_LANDING_POINT', payload: null });
    openPanel();
  };

  return (
    <div className="w-full h-full relative bg-[#030712] z-0">
      <MapContainer
        center={[28, 10]}
        zoom={2.4}
        minZoom={2}
        maxZoom={9}
        style={{ height: '100%', width: '100%', background: '#030712' }}
        preferCanvas={true}
        zoomControl={false}
        worldCopyJump={false}
        maxBounds={MAX_BOUNDS}
        maxBoundsViscosity={1.0}
      >
        {/* CartoDB Dark Matter — no authentication required */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
          noWrap={true}
          bounds={WORLD_BOUNDS}
        />

        <CableLayers
          geojsonCables={geojsonCables}
          selectedCable={selectedCable}
          hoveredCable={hoveredCable}
          simCableId={sim.running ? sim.cableId : null}
          visibleLayers={visibleLayers}
          onCableClick={handleCableClick}
          onCableHover={setHoveredCable}
        />

        <LandingPointLayers
          geojsonLPs={geojsonLPs}
          simCableId={sim.running ? sim.cableId : null}
          affectedLPIds={affectedLPIds}
          visibleLayers={visibleLayers}
          onLPClick={(id) => {
            dispatch({ type: 'SET_SELECTED_LANDING_POINT', payload: id });
            dispatch({ type: 'SET_SELECTED_CABLE', payload: null });
            openPanel();
          }}
        />

        <CuratedLabelsLayer />
        <ChokepointsLayer />

        {/* Initializer runs once: fitBounds to network + enforce constraints */}
        <MapInitializer />
      </MapContainer>

      {/* Map Tool Panel (Phase 5) */}
      <div className="absolute top-1/2 -translate-y-1/2 left-4 z-[1000] flex flex-col gap-2 bg-[#0B1117]/90 backdrop-blur-sm border border-[#1F2937] rounded-lg p-2 shadow-xl">
        <button className={`text-left text-xs px-3 py-2 rounded transition-colors ${visibleLayers.cables ? 'bg-[#38BDF8]/10 text-[#38BDF8]' : 'text-[#94a3b8] hover:text-gray-200'}`} onClick={() => toggleLayer('cables')}>
          <span className="mr-2 opacity-70">≈</span> Cables
        </button>
        <button className={`text-left text-xs px-3 py-2 rounded transition-colors ${visibleLayers.landingPoints ? 'bg-[#38BDF8]/10 text-[#38BDF8]' : 'text-[#94a3b8] hover:text-gray-200'}`} onClick={() => toggleLayer('landingPoints')}>
          <span className="mr-2 opacity-70">⚲</span> Landing Points
        </button>
        <div className="h-px w-full bg-[#1F2937] my-1"></div>
        <button className={`text-left text-xs px-3 py-2 rounded transition-colors ${visibleLayers.ownership ? 'bg-[#818CF8]/10 text-[#818CF8]' : 'text-[#94a3b8] hover:text-gray-200'}`} onClick={() => toggleLayer('ownership')}>
          <span className="mr-2 opacity-70">⊚</span> Ownership
        </button>
        <button className={`text-left text-xs px-3 py-2 rounded transition-colors ${visibleLayers.risk ? 'bg-[#22c55e]/10 text-[#22c55e]' : 'text-[#94a3b8] hover:text-gray-200'}`} onClick={() => toggleLayer('risk')}>
          <span className="mr-2 opacity-70">⚠</span> Risk
        </button>
        <button className={`text-left text-xs px-3 py-2 rounded transition-colors ${visibleLayers.capacity ? 'bg-[#f59e0b]/10 text-[#f59e0b]' : 'text-[#94a3b8] hover:text-gray-200'}`} onClick={() => toggleLayer('capacity')}>
          <span className="mr-2 opacity-70">⚡</span> Capacity
        </button>
      </div>

      {/* Network Overview Card (Phase 4 & 8) */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-[#0B1117]/90 backdrop-blur-sm border border-[#1F2937] rounded flex flex-col p-2 shadow-xl">
        <div className="text-[8px] font-bold text-[#64748b] uppercase tracking-widest mb-1.5 px-1 border-b border-[#1F2937]/50 pb-1">Network Status</div>
        <div className="grid grid-cols-2 gap-y-1.5 gap-x-6 px-1">
          <div className="flex flex-col">
            <span className="text-[8px] text-[#64748b] uppercase font-semibold leading-none mb-0.5">Active Cables</span>
            <span className="text-sm font-bold text-gray-200 leading-none">{filteredCables.filter(c => c.status === 'active').length}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[8px] text-[#64748b] uppercase font-semibold leading-none mb-0.5">Landing Points</span>
            <span className="text-sm font-bold text-gray-200 leading-none">{new Set(filteredCables.flatMap(c => c.landingPoints)).size}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[8px] text-[#64748b] uppercase font-semibold leading-none mb-0.5">Total Capacity</span>
            <span className="text-sm font-bold text-gray-200 leading-none">{filteredCables.reduce((sum, c) => sum + c.capacityTbps, 0)}<span className="text-[9px] font-medium text-gray-500 ml-0.5">Tbps</span></span>
          </div>
          <div className="flex flex-col">
            <span className="text-[8px] text-[#64748b] uppercase font-semibold leading-none mb-0.5">System Health</span>
            <span className={`text-sm font-bold leading-none ${sim.running ? 'text-[#ef4444]' : 'text-[#38BDF8]'}`}>
              {sim.running ? '74' : '92'}<span className="text-[9px] font-medium opacity-50 ml-0.5">/100</span>
            </span>
          </div>
        </div>
      </div>
      
      {/* Capacity Overlay Labels (Phase 3) */}
      {visibleLayers.capacity && (
        <div className="absolute top-1/4 right-1/4 z-[500] pointer-events-none">
          <div className="bg-[#f59e0b]/10 border border-[#f59e0b]/20 text-[#f59e0b] px-3 py-1 rounded text-xs font-bold tracking-widest uppercase">
            High Capacity Corridor
          </div>
        </div>
      )}

      {/* Sim badge overlay */}
      {sim.running && sim.cableId && (() => {
        const cable = CABLES.find(c => c.id === sim.cableId);
        return (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[500] px-4 py-2 rounded-md border border-[#ef4444]/40 bg-[#030712]/90 backdrop-blur-sm text-xs text-[#ef4444] font-medium tracking-wide animate-fade-in shadow-lg shadow-red-900/20">
            ⚠ SIMULATED CUT — {cable?.name} — {cable?.capacityTbps} Tbps offline
          </div>
        );
      })()}
    </div>
  );
}
