/**
 * Real-Time Telemetry Service for Greater Chennai
 * Unifies:
 * 1. WRD Reservoir Discharges (Chembarambakkam, Poondi, Red Hills)
 * 2. Bay of Bengal Tidal Backwater Locks (Chennai Port / Ennore Gauge)
 * 3. IoT Ultrasonic Water Level Sensors in Critical Railway Subways
 */

export interface ReservoirTelemetry {
  id: string;
  name: string;
  capacityMcft: number;
  currentStorageMcft: number;
  inflowCusecs: number;
  dischargeCusecs: number;
  shutterGatesOpen: number;
  dangerStatus: 'normal' | 'caution' | 'emergency_release';
}

export interface OceanTideTelemetry {
  station: string;
  astronomicalTideMeters: number;
  stormSurgeMeters: number;
  totalTideMslMeters: number;
  isHighTideLocked: boolean; // Backwater ocean block active (>1.05m MSL)
  nextPeakTime: string;
}

export interface SubwaySensorTelemetry {
  id: string;
  name: string;
  area: string;
  coords: [number, number];
  elevationMsl: number;
  waterDepthCm: number;
  rateOfRiseCmHr: number;
  pumpCapacityLps: number;
  pumpStatus: 'active' | 'overloaded' | 'power_trip';
  status: 'clear' | 'caution' | 'submerged_closed';
  alternateBypassName: string;
}

export interface UnifiedChennaiTelemetry {
  timestamp: string;
  reservoirs: ReservoirTelemetry[];
  tide: OceanTideTelemetry;
  subwaySensors: SubwaySensorTelemetry[];
  chembarambakkamDischargeCusecs: number;
  totalRiverOutflowCusecs: number;
  adyarRiverVulnerabilityFactor: number;
}

export const INITIAL_RESERVOIR_TELEMETRY: ReservoirTelemetry[] = [
  {
    id: 'res-chembarambakkam',
    name: 'Chembarambakkam Reservoir',
    capacityMcft: 3645,
    currentStorageMcft: 3210,
    inflowCusecs: 8400,
    dischargeCusecs: 6500,
    shutterGatesOpen: 5,
    dangerStatus: 'caution'
  },
  {
    id: 'res-poondi',
    name: 'Poondi Reservoir (Sathyamurthy Sagar)',
    capacityMcft: 3231,
    currentStorageMcft: 2890,
    inflowCusecs: 4200,
    dischargeCusecs: 3000,
    shutterGatesOpen: 3,
    dangerStatus: 'normal'
  },
  {
    id: 'res-redhills',
    name: 'Red Hills (Puzhal Lake)',
    capacityMcft: 3300,
    currentStorageMcft: 3040,
    inflowCusecs: 2100,
    dischargeCusecs: 1500,
    shutterGatesOpen: 2,
    dangerStatus: 'normal'
  },
  {
    id: 'res-cholavaram',
    name: 'Cholavaram Lake',
    capacityMcft: 1081,
    currentStorageMcft: 790,
    inflowCusecs: 900,
    dischargeCusecs: 500,
    shutterGatesOpen: 1,
    dangerStatus: 'normal'
  }
];

export const INITIAL_OCEAN_TIDE: OceanTideTelemetry = {
  station: 'Chennai Port Tidal Observatory (Bay of Bengal)',
  astronomicalTideMeters: 0.95,
  stormSurgeMeters: 0.28,
  totalTideMslMeters: 1.23,
  isHighTideLocked: true, // Prevents gravity discharge from Adyar/Cooum river mouths
  nextPeakTime: '03:45 AM IST'
};

export const INITIAL_SUBWAY_SENSORS: SubwaySensorTelemetry[] = [
  {
    id: 'sub-duraisamy',
    name: 'Duraisamy Subway (T. Nagar)',
    area: 'Central Commercial Hub',
    coords: [13.0375, 80.2305],
    elevationMsl: 1.8,
    waterDepthCm: 145,
    rateOfRiseCmHr: 22,
    pumpCapacityLps: 450,
    pumpStatus: 'overloaded',
    status: 'submerged_closed',
    alternateBypassName: 'Usman Road Elevated Flyover'
  },
  {
    id: 'sub-saidapet',
    name: 'Saidapet Riverbank Subway & Approach',
    area: 'Adyar River Corridor',
    coords: [13.0210, 80.2220],
    elevationMsl: 2.1,
    waterDepthCm: 110,
    rateOfRiseCmHr: 18,
    pumpCapacityLps: 600,
    pumpStatus: 'active',
    status: 'submerged_closed',
    alternateBypassName: 'Maraimalai Adigal Bridge (Anna Salai Flyover)'
  },
  {
    id: 'sub-ganesapuram',
    name: 'Ganesapuram Railway Underpass',
    area: 'Vyasarpadi / North Chennai',
    coords: [13.1090, 80.2610],
    elevationMsl: 1.1,
    waterDepthCm: 160,
    rateOfRiseCmHr: 26,
    pumpCapacityLps: 300,
    pumpStatus: 'power_trip',
    status: 'submerged_closed',
    alternateBypassName: 'Basin Bridge / Stephenson Road Elevated Span'
  },
  {
    id: 'sub-thillai-ganga',
    name: 'Thillai Ganga Nagar Subway',
    area: 'St. Thomas Mount / Alandur',
    coords: [12.9960, 80.1980],
    elevationMsl: 2.1,
    waterDepthCm: 85,
    rateOfRiseCmHr: 12,
    pumpCapacityLps: 500,
    pumpStatus: 'active',
    status: 'submerged_closed',
    alternateBypassName: 'Kathipara Grade Separator Elevated Loops'
  },
  {
    id: 'sub-perambur',
    name: 'Perambur Carriage Works Subway',
    area: 'North-West Rail Hub',
    coords: [13.1080, 80.2380],
    elevationMsl: 2.8,
    waterDepthCm: 32,
    rateOfRiseCmHr: 6,
    pumpCapacityLps: 400,
    pumpStatus: 'active',
    status: 'caution',
    alternateBypassName: 'Perambur High Road Flyover'
  }
];

/**
 * Computes Adyar River Vulnerability Multiplier based on Chembarambakkam outflow & Bay of Bengal Tide lock
 */
export function calculateAdyarSurgeMultiplier(dischargeCusecs: number, tideMsl: number): number {
  // Baseline is 1.0 (normal)
  // At >6000 cusecs, river reaches bank-full level
  // At >10000 cusecs, river spills into Jafferkhanpet, Saidapet, Kotturpuram
  const dischargeFactor = Math.max(1.0, dischargeCusecs / 4500);
  // Tide > 1.05m slows river discharge by up to 80%
  const tideFactor = tideMsl > 1.05 ? 1.0 + (tideMsl - 1.05) * 2.5 : 1.0;
  return Math.round(dischargeFactor * tideFactor * 100) / 100;
}
