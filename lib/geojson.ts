import { Cable, LandingPoint } from './types';

let firstInvalidLogged = false;

function isValidCoordinate(coord: number[]): boolean {
  return Array.isArray(coord) &&
         coord.length === 2 &&
         typeof coord[0] === 'number' &&
         typeof coord[1] === 'number' &&
         !isNaN(coord[0]) &&
         !isNaN(coord[1]);
}

function logInvalid(id: string, coord: any, type: string) {
  if (!firstInvalidLogged) {
    console.error(`Invalid coordinate in ${type} ID: ${id}. Received:`, coord);
    firstInvalidLogged = true;
  }
}

// Catmull-Rom spline: generates smooth curves that pass through all waypoints.
// Each segment between p1→p2 uses p0 and p3 as tangent guides.
function catmullRomInterpolate(points: [number, number][], steps = 20): [number, number][] {
  if (points.length < 2) return points;
  const result: [number, number][] = [];

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    for (let s = 0; s < steps; s++) {
      const t  = s / steps;
      const t2 = t * t;
      const t3 = t2 * t;
      const lng =
        0.5 *
        (2 * p1[0] +
          (-p0[0] + p2[0]) * t +
          (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 +
          (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3);
      const lat =
        0.5 *
        (2 * p1[1] +
          (-p0[1] + p2[1]) * t +
          (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 +
          (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3);
      result.push([lng, lat]);
    }
  }

  result.push(points[points.length - 1]);
  return result;
}

/**
 * Split a polyline at the antimeridian (±180°) so cables that cross the
 * International Date Line render cleanly within a single world view.
 *
 * Returns an array of segments — most cables return exactly one segment,
 * transpacific cables return two (one each side of ±180°).
 */
function splitAtAntimeridian(path: [number, number][]): [number, number][][] {
  if (path.length < 2) return [path];

  const segments: [number, number][][] = [[]];
  let cur = segments[0];

  const wrapLng = (lng: number) => {
    let w = lng;
    while (w <= -180) w += 360;
    while (w > 180) w -= 360;
    return w;
  };

  let prevLng = path[0][0];
  cur.push([wrapLng(path[0][0]), path[0][1]]);

  for (let i = 1; i < path.length; i++) {
    const pt = path[i];
    const lng = pt[0];

    if (prevLng > -180 && lng <= -180) {
      // Crossing from East to West across the -180 line (e.g. US to Japan)
      const fraction = (-180 - prevLng) / (lng - prevLng);
      const crossLat = path[i-1][1] + fraction * (pt[1] - path[i-1][1]);
      
      cur.push([-180, crossLat]);
      segments.push([[180, crossLat]]);
      cur = segments[segments.length - 1];
    } else if (prevLng < 180 && lng >= 180) {
      // Crossing from West to East across the +180 line
      const fraction = (180 - prevLng) / (lng - prevLng);
      const crossLat = path[i-1][1] + fraction * (pt[1] - path[i-1][1]);
      
      cur.push([180, crossLat]);
      segments.push([[-180, crossLat]]);
      cur = segments[segments.length - 1];
    }

    cur.push([wrapLng(lng), pt[1]]);
    prevLng = lng;
  }

  return segments.filter(s => s.length >= 2);
}

export function cablesToGeoJSON(cables: Cable[]) {
  const features: any[] = [];

  cables.forEach((cable) => {
    let validPath = cable.path.filter(p => {
      if (isValidCoordinate(p)) return true;
      logInvalid(cable.id, p, 'Cable');
      return false;
    }) as [number, number][];

    if (validPath.length < 2) return;

    // Catmull-Rom smooth interpolation through ocean-following waypoints
    const smoothPath = catmullRomInterpolate(validPath, 20);

    // Split at the antimeridian — keeps all coordinates within -180/+180
    // and prevents the horizontal line artifact on transpacific cables.
    const segments = splitAtAntimeridian(smoothPath);

    const props = {
      id:           cable.id,
      name:         cable.name,
      capacityTbps: cable.capacityTbps,
      status:       cable.status,
      color:        cable.color,
      glowColor:    cable.glowColor,
      region:       cable.region,
      redundancy:   cable.landingPoints.length,
    };

    if (segments.length === 1) {
      // Single continuous route — emit one LineString Feature
      features.push({
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: segments[0] },
        properties: props,
      });
    } else {
      // Multi-segment transoceanic route — emit one MultiLineString Feature.
      // All segments share the same properties (same cable ID) so click/hover
      // events behave identically regardless of which segment is interacted with.
      features.push({
        type: 'Feature',
        geometry: { type: 'MultiLineString', coordinates: segments },
        properties: props,
      });
    }
  });

  return {
    type: 'FeatureCollection' as const,
    features,
  };
}

export function landingPointsToGeoJSON(points: LandingPoint[], activeCables: Cable[]) {
  const features = points.map((lp) => {
    if (!isValidCoordinate(lp.coordinates)) {
      logInvalid(lp.id, lp.coordinates, 'LandingPoint');
      return null;
    }

    // Calculate intelligence metrics for this landing point based on active cables
    const connectedCables = activeCables.filter(c => c.landingPoints.includes(lp.id));
    const capacityTbps = connectedCables.reduce((sum, c) => sum + c.capacityTbps, 0);
    const redundancyRating = connectedCables.length > 2 ? 'High' : connectedCables.length === 2 ? 'Medium' : 'Low';

    return {
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: lp.coordinates,
      },
      properties: {
        id:              lp.id,
        name:            lp.name,
        countryId:       lp.countryId,
        tier:            lp.tier ?? 3,
        connectedCables: connectedCables.length,
        capacityTbps:    capacityTbps,
        redundancy:      redundancyRating,
      },
    };
  }).filter(Boolean);

  return {
    type: 'FeatureCollection' as const,
    features: features as any[],
  };
}
