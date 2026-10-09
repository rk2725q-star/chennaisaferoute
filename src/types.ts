export type FloodRiskLevel = 'low' | 'moderate' | 'high' | 'critical';

export interface FloodZone {
  id: string;
  name: string;
  zoneNumber: number;
  borough: string; // North, Central, South
  riskLevel: FloodRiskLevel;
  waterDepthMeters: number;
  center: [number, number]; // [lat, lng]
  polygon: [number, number][]; // boundary coordinates
  vulnerablePopulation: number;
  drainageBasin: string;
  accessStatus: 'open' | 'restricted' | 'blocked';
  criticalIssues: string;
  safeEvacuationPoint: string;
  lastUpdated: string;
}

export interface WaterBody {
  id: string;
  name: string;
  type: 'river' | 'canal' | 'marshland' | 'lake';
  coordinates: [number, number][] | [number, number][][];
  currentLevelMeters: number;
  dangerLevelMeters: number;
  dischargeCusecs?: number;
  status: 'normal' | 'rising' | 'danger_overflow';
  description: string;
}

export type FacilityType = 'hospital' | 'shelter' | 'water_distribution' | 'fire_station' | 'metro_station';

export interface CriticalFacility {
  id: string;
  name: string;
  type: FacilityType;
  coordinates: [number, number];
  address: string;
  contact: string;
  accessStatus: 'fully_accessible' | 'limited_access' | 'submerged_access' | 'inaccessible';
  submergedDepthCm: number;
  capacity?: number;
  currentOccupancy?: number;
  emergencyBeds?: number;
  generatorStatus: 'operational' | 'at_risk' | 'failed';
  notes: string;
}

export interface SubmergedRoadOrSubway {
  id: string;
  name: string;
  type: 'road' | 'subway' | 'bridge';
  coordinates: [number, number][];
  center: [number, number];
  status: 'open' | 'waterlogged_passable' | 'closed_submerged';
  waterDepthCm: number;
  alternateRoute: string;
  affectedCorridor: string;
}

export interface ReservoirData {
  id: string;
  name: string;
  fullCapacityMcft: number;
  currentStorageMcft: number;
  inflowCusecs: number;
  outflowCusecs: number;
  dangerThresholdPercent: number;
  impactBasin: string;
  status: 'normal' | 'alert' | 'heavy_discharge';
  coordinates: [number, number];
}

export interface IncidentReport {
  id: string;
  reporterName: string;
  category: 'water_surge' | 'stranded_people' | 'road_blocked' | 'medical_emergency' | 'water_supply';
  locationName: string;
  coordinates: [number, number];
  waterDepthFeet: number;
  urgency: 'routine' | 'urgent' | 'life_threatening';
  description: string;
  timestamp: string;
  verified: boolean;
  upvotes: number;
}

export interface RouteOption {
  id: string;
  originName: string;
  originCoords: [number, number];
  destName: string;
  destCoords: [number, number];
  routeType: 'recommended_safe' | 'direct_flooded' | 'alternate_elevated';
  pathCoords: [number, number][];
  distanceKm: number;
  travelTimeMins: number;
  safetyScorePercent: number;
  floodZonesCrossed: string[];
  maxWaterDepthCm: number;
  warnings: string[];
  safePassageAdvice: string;
}

export interface SimulationParams {
  rainfallMm: number; // 0 to 400 mm
  chembarambakkamDischargeCusecs: number; // 500 to 30000 cusecs
  redhillsDischargeCusecs: number; // 200 to 10000 cusecs
  highTideActive: boolean;
}
