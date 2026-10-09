/**
 * Utility for real-time route navigation, coordinate interpolation,
 * bearing calculation, and simulated GPS progression across Greater Chennai.
 */

export interface NavPointState {
  coords: [number, number];
  bearing: number; // 0 to 360 degrees
  distanceTraveledKm: number;
  distanceRemainingKm: number;
  durationRemainingMinutes: number;
  percent: number; // 0 to 100
  currentStepIndex: number;
  currentStepInstruction: string;
  nextStepInstruction?: string;
  currentRoadName: string;
  estimatedSpeedKmh: number;
  elevationMsl: number;
  isSafeElevation: boolean;
  isArrived: boolean;
}

/**
 * Calculate Haversine distance in kilometers between two lat/lng pairs
 */
export function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371.0;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculate navigation bearing (heading) in degrees (0 - 360) from point A to point B
 */
export function calculateBearing(startLat: number, startLng: number, destLat: number, destLng: number): number {
  const startLatRad = (startLat * Math.PI) / 180;
  const startLngRad = (startLng * Math.PI) / 180;
  const destLatRad = (destLat * Math.PI) / 180;
  const destLngRad = (destLng * Math.PI) / 180;

  const y = Math.sin(destLngRad - startLngRad) * Math.cos(destLatRad);
  const x =
    Math.cos(startLatRad) * Math.sin(destLatRad) -
    Math.sin(startLatRad) * Math.cos(destLatRad) * Math.cos(destLngRad - startLngRad);

  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

/**
 * Precompute cumulative distance along a list of coordinates
 */
export function computeCumulativeDistances(coords: [number, number][]): number[] {
  if (!coords || coords.length === 0) return [0];
  const dists = [0];
  for (let i = 1; i < coords.length; i++) {
    const prev = coords[i - 1];
    const curr = coords[i];
    const segDist = getDistanceKm(prev[0], prev[1], curr[0], curr[1]);
    dists.push(dists[i - 1] + segDist);
  }
  return dists;
}

/**
 * Interpolate coordinate and state along route given a progress fraction t in [0, 1]
 */
export function interpolateRouteState(
  coords: [number, number][],
  t: number, // 0.0 to 1.0
  totalDistanceKm: number,
  totalDurationMinutes: number,
  primaryRoads: string[] = []
): NavPointState {
  const clampedT = Math.max(0, Math.min(1, t));

  if (!coords || coords.length === 0) {
    return {
      coords: [13.0418, 80.2341],
      bearing: 0,
      distanceTraveledKm: 0,
      distanceRemainingKm: totalDistanceKm,
      durationRemainingMinutes: totalDurationMinutes,
      percent: 0,
      currentStepIndex: 0,
      currentStepInstruction: 'Departing origin',
      currentRoadName: primaryRoads[0] || 'Arterial Road',
      estimatedSpeedKmh: 35,
      elevationMsl: 12.0,
      isSafeElevation: true,
      isArrived: false
    };
  }

  if (coords.length === 1 || clampedT === 0) {
    const bearing = coords.length > 1 ? calculateBearing(coords[0][0], coords[0][1], coords[1][0], coords[1][1]) : 0;
    return {
      coords: coords[0],
      bearing,
      distanceTraveledKm: 0,
      distanceRemainingKm: totalDistanceKm,
      durationRemainingMinutes: totalDurationMinutes,
      percent: 0,
      currentStepIndex: 0,
      currentStepInstruction: `Start navigation via ${primaryRoads[0] || 'Elevated Corridor'}`,
      nextStepInstruction: primaryRoads[1] ? `Prepare to merge onto ${primaryRoads[1]}` : undefined,
      currentRoadName: primaryRoads[0] || 'Origin Starting Point',
      estimatedSpeedKmh: 30,
      elevationMsl: 13.5,
      isSafeElevation: true,
      isArrived: false
    };
  }

  if (clampedT >= 1) {
    const lastIdx = coords.length - 1;
    const prevIdx = Math.max(0, lastIdx - 1);
    const bearing = calculateBearing(coords[prevIdx][0], coords[prevIdx][1], coords[lastIdx][0], coords[lastIdx][1]);
    return {
      coords: coords[lastIdx],
      bearing,
      distanceTraveledKm: totalDistanceKm,
      distanceRemainingKm: 0,
      durationRemainingMinutes: 0,
      percent: 100,
      currentStepIndex: coords.length - 1,
      currentStepInstruction: '🎉 You have safely arrived at your destination!',
      currentRoadName: 'Destination Reached',
      estimatedSpeedKmh: 0,
      elevationMsl: 14.8,
      isSafeElevation: true,
      isArrived: true
    };
  }

  const cumDists = computeCumulativeDistances(coords);
  const routeLen = cumDists[cumDists.length - 1] || totalDistanceKm;
  const targetDist = clampedT * routeLen;

  // Find segment
  let segIdx = 0;
  while (segIdx < cumDists.length - 1 && cumDists[segIdx + 1] < targetDist) {
    segIdx++;
  }

  const p1 = coords[segIdx];
  const p2 = coords[Math.min(coords.length - 1, segIdx + 1)];
  const segStartDist = cumDists[segIdx];
  const segEndDist = cumDists[Math.min(cumDists.length - 1, segIdx + 1)];
  const segLen = segEndDist - segStartDist;

  const segT = segLen > 0 ? (targetDist - segStartDist) / segLen : 0;
  const currLat = p1[0] + (p2[0] - p1[0]) * segT;
  const currLng = p1[1] + (p2[1] - p1[1]) * segT;
  const bearing = calculateBearing(p1[0], p1[1], p2[0], p2[1]);

  const distTraveled = Number(targetDist.toFixed(2));
  const distRemaining = Number(Math.max(0, routeLen - targetDist).toFixed(2));
  const timeRemaining = Math.max(1, Math.round((1 - clampedT) * totalDurationMinutes));

  // Determine realistic road name and step instructions based on segment progression
  const currentStep = segIdx;
  const roadIdx = Math.min(primaryRoads.length - 1, Math.floor(clampedT * primaryRoads.length));
  const currentRoad = primaryRoads[roadIdx] || 'Arterial Corridor';
  const nextRoad = primaryRoads[roadIdx + 1] || 'Safe High Ground Road';

  // Realistic MSL Elevation profile along typical Chennai ridge (10m to 19m MSL)
  const elevationMsl = Number((11.5 + 4.5 * Math.sin(clampedT * Math.PI * 1.5) + (segIdx % 3) * 0.8).toFixed(1));
  const isSafeElevation = elevationMsl >= 10.0;

  // Realistic speed variation
  const speed = Math.floor(32 + 8 * Math.sin(clampedT * Math.PI * 4));

  let instruction = `Continue on ${currentRoad}`;
  let nextInstruction = `In ${Math.round(distRemaining * 350 + 100)}m, follow ${nextRoad}`;

  if (clampedT < 0.15) {
    instruction = `Head towards ${currentRoad}`;
    nextInstruction = `Maintain elevated arterial route away from low-lying drains`;
  } else if (clampedT > 0.85) {
    instruction = `Approaching destination along ${currentRoad}`;
    nextInstruction = `Slow down; safe parking & relief entrance ahead`;
  } else if (segIdx % 2 === 1) {
    instruction = `Keep right on elevated bridge past water basin`;
    nextInstruction = `Continue onto ${nextRoad}`;
  }

  return {
    coords: [Number(currLat.toFixed(5)), Number(currLng.toFixed(5))],
    bearing: Math.round(bearing),
    distanceTraveledKm: distTraveled,
    distanceRemainingKm: distRemaining,
    durationRemainingMinutes: timeRemaining,
    percent: Math.round(clampedT * 100),
    currentStepIndex: currentStep,
    currentStepInstruction: instruction,
    nextStepInstruction: nextInstruction,
    currentRoadName: currentRoad,
    estimatedSpeedKmh: speed,
    elevationMsl,
    isSafeElevation,
    isArrived: false
  };
}

export const interpolateRouteProgress = interpolateRouteState;
