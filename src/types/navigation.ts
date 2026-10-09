export type RoutePreference = 'fastest' | 'balanced' | 'safer';

export type RiskLevel = 'low' | 'moderate' | 'high' | 'very_high';

export interface RoadRiskFactor {
  rainfall: 'Low' | 'Moderate' | 'High' | 'Severe';
  elevation: 'Low' | 'Moderate' | 'High';
  elevationDetails: string;
  drainage: 'Poor' | 'Moderate' | 'Adequate';
  drainageDetails: string;
  builtUpArea: 'Low' | 'Moderate' | 'High';
  builtUpDetails: string;
}

export interface RoadRiskSegment {
  id: string; // e.g. 'R1042'
  name: string; // e.g. 'Velachery Main Road (Vijayanagar Bus Stand section)'
  code: string;
  area: string;
  baseRisk: number; // 0-100 base percentage
  currentRisk: number; // dynamically computed based on rainfall slider
  riskLevel: RiskLevel;
  factors: RoadRiskFactor;
  advice: string;
  coordinates: [number, number][]; // lat, lng polyline
  waterDepthCm: number;
}

export type TransportMode = 'car' | 'two_wheeler' | 'walking' | 'transit' | 'emergency';

export interface RouteOptionData {
  id: string;
  type: RoutePreference;
  name: string;
  durationMinutes: number;
  distanceKm: number;
  exposurePercent: number;
  isRecommended: boolean;
  segmentsAvoidedCount: number;
  tagline: string;
  primaryRoads: string[];
  coordinates: [number, number][]; // route path
  color: string;
  transportMode?: TransportMode;
  maxWaterDepthCm?: number;
  clearanceStatus?: 'dry' | 'caution' | 'impassable';
  modeSpecificWarning?: string;
  elevationGainM?: number;
}

export type EmergencyCategory = 'hospital' | 'fire_station' | 'police' | 'shelter';

export interface EmergencyFacility {
  id: string;
  category: EmergencyCategory;
  name: string;
  distanceKm: number;
  durationMinutes: number;
  exposureLevel: 'LOW' | 'MODERATE' | 'HIGH';
  exposureNote: string;
  address: string;
  phone: string;
  coordinates: [number, number];
  operationalStatus: string;
}

export interface PlaceSuggestion {
  id: string;
  name: string;
  description: string;
  category: string;
  zone?: 'North Chennai' | 'Central Chennai' | 'South Chennai' | 'West Chennai' | 'Suburbs & Transit' | 'Hospitals & Relief';
  coordinates: [number, number];
}

export interface DrainageChannel {
  id: string;
  name: string;
  waterwayType: string;
  coordinates: [number, number][];
}

export interface WaterBody {
  id: string;
  name: string;
  category: string;
  waterType: string;
  coordinates: [number, number];
  areaHa?: number;
}

export interface HistoricalFloodPoint {
  id: string;
  eventName: string;
  locationName: string;
  severityClass: string;
  waterLevelM: number;
  rainfall24hMm: number;
  coordinates: [number, number];
}

export interface ElevationBenchmark {
  id: string;
  name: string;
  type: string;
  lat: number;
  lon: number;
  elevationM: number;
  terrainClass: string;
  riskCategory: 'critical_basin' | 'lowland' | 'mid_plain' | 'high_ground';
}

export interface BackgroundIntelligenceStats {
  monitoredRoadsCount: number;
  drainageChannelsCount: number;
  waterBodiesCount: number;
  historicalFloodEventsCount: number;
  elevationRangeMsl: string;
  modelEnsemble: string;
  activeWeatherStationsCount: number;
  timestamp: string;
}

export interface JourneyHistoryItem {
  id: string;
  timestamp: string;
  origin: string;
  destination: string;
  routeType: RoutePreference;
  durationMinutes: number;
  exposureAvoidedPercent: number;
  rainfallAtTime: string;
  status: 'completed' | 'diverted';
}

export type ActiveNavTab = 'route' | 'flood_map' | 'risk_roads' | 'emergency' | 'history';

