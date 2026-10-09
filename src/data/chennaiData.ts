import { FloodZone, WaterBody, CriticalFacility, SubmergedRoadOrSubway, ReservoirData, IncidentReport, RouteOption } from '../types';

export const CHENNAI_CENTER: [number, number] = [13.0450, 80.2200];
export const CHENNAI_BOUNDS: [[number, number], [number, number]] = [
  [12.8200, 79.9800], // Southwest
  [13.2400, 80.3600], // Northeast
];

export const INITIAL_FLOOD_ZONES: FloodZone[] = [
  {
    id: 'zone-velachery',
    name: 'Velachery & Lake Environs',
    zoneNumber: 13,
    borough: 'South Chennai',
    riskLevel: 'critical',
    waterDepthMeters: 1.1,
    center: [12.9780, 80.2210],
    polygon: [
      [12.9900, 80.2100],
      [12.9920, 80.2300],
      [12.9810, 80.2380],
      [12.9660, 80.2320],
      [12.9640, 80.2120],
      [12.9750, 80.2050]
    ],
    vulnerablePopulation: 145000,
    drainageBasin: 'Pallikaranai & Buckingham Canal',
    accessStatus: 'blocked',
    criticalIssues: 'Severe inundation on 100 Feet Bypass Road & AGS Colony. Water entered ground floors.',
    safeEvacuationPoint: 'Guru Nanak College & Velachery Railway Station Flyover',
    lastUpdated: '10 mins ago'
  },
  {
    id: 'zone-mudichur',
    name: 'Mudichur & Varadharajapuram',
    zoneNumber: 4,
    borough: 'South-West Outskirts',
    riskLevel: 'critical',
    waterDepthMeters: 1.4,
    center: [12.9150, 80.0650],
    polygon: [
      [12.9280, 80.0520],
      [12.9300, 80.0780],
      [12.9180, 80.0820],
      [12.9020, 80.0710],
      [12.9000, 80.0500]
    ],
    vulnerablePopulation: 68000,
    drainageBasin: 'Adyar River Upstream Basin',
    accessStatus: 'blocked',
    criticalIssues: 'Adyar surplus overflow cuts off Mudichur Main Road. Inflatable boats deployed by SDRF.',
    safeEvacuationPoint: 'Mudichur Govt High School Relief Camp & Tambaram Railway Station',
    lastUpdated: '15 mins ago'
  },
  {
    id: 'zone-saidapet',
    name: 'Saidapet & Jafferkhanpet Riverbank',
    zoneNumber: 10,
    borough: 'Central Chennai',
    riskLevel: 'high',
    waterDepthMeters: 0.85,
    center: [13.0220, 80.2180],
    polygon: [
      [13.0320, 80.2080],
      [13.0340, 80.2280],
      [13.0180, 80.2310],
      [13.0120, 80.2150],
      [13.0150, 80.2050]
    ],
    vulnerablePopulation: 92000,
    drainageBasin: 'Adyar River Midstream',
    accessStatus: 'restricted',
    criticalIssues: 'Maraimalai Adigal Bridge approaches waterlogged. Riverbank settlements evacuated.',
    safeEvacuationPoint: 'Saidapet Govt Higher Secondary School Relief Camp',
    lastUpdated: '25 mins ago'
  },
  {
    id: 'zone-madipakkam',
    name: 'Madipakkam & Keelkattalai',
    zoneNumber: 14,
    borough: 'South Chennai',
    riskLevel: 'high',
    waterDepthMeters: 0.75,
    center: [12.9640, 80.1960],
    polygon: [
      [12.9750, 80.1850],
      [12.9770, 80.2050],
      [12.9550, 80.2080],
      [12.9510, 80.1870]
    ],
    vulnerablePopulation: 85000,
    drainageBasin: 'Keelkattalai Lake Overflow',
    accessStatus: 'restricted',
    criticalIssues: 'Kubera Nagar and Balaiah Garden streets submerged up to 2.5 feet.',
    safeEvacuationPoint: 'Keelkattalai Bus Terminus Relief Facility',
    lastUpdated: '18 mins ago'
  },
  {
    id: 'zone-vyasarpadi',
    name: 'Vyasarpadi & Perambur Lowlands',
    zoneNumber: 3,
    borough: 'North Chennai',
    riskLevel: 'critical',
    waterDepthMeters: 1.05,
    center: [13.1118, 80.2580],
    polygon: [
      [13.1230, 80.2450],
      [13.1250, 80.2720],
      [13.1020, 80.2700],
      [13.1000, 80.2470]
    ],
    vulnerablePopulation: 130000,
    drainageBasin: 'Otteri Nullah & Captain Cotton Canal',
    accessStatus: 'blocked',
    criticalIssues: 'Vyasarpadi Ganesapuram Subway completely submerged. Railway culvert backflow.',
    safeEvacuationPoint: 'Dr. Ambedkar College Grounds & Perambur Railway Hospital',
    lastUpdated: '12 mins ago'
  },
  {
    id: 'zone-kolathur',
    name: 'Kolathur & Retteri Junction',
    zoneNumber: 6,
    borough: 'North Chennai',
    riskLevel: 'high',
    waterDepthMeters: 0.65,
    center: [13.1230, 80.2110],
    polygon: [
      [13.1340, 80.2000],
      [13.1360, 80.2250],
      [13.1150, 80.2280],
      [13.1120, 80.2020]
    ],
    vulnerablePopulation: 75000,
    drainageBasin: 'Red Hills Surplus Canal',
    accessStatus: 'restricted',
    criticalIssues: 'Retteri surplus channel bank breaches causing standing water in surrounding layouts.',
    safeEvacuationPoint: 'Don Bosco School Relief Camp',
    lastUpdated: '30 mins ago'
  },
  {
    id: 'zone-tnagar',
    name: 'T. Nagar (Bazullah & Usman Rd)',
    zoneNumber: 9,
    borough: 'Central Chennai',
    riskLevel: 'moderate',
    waterDepthMeters: 0.45,
    center: [13.0410, 80.2330],
    polygon: [
      [13.0490, 80.2240],
      [13.0510, 80.2420],
      [13.0330, 80.2430],
      [13.0310, 80.2260]
    ],
    vulnerablePopulation: 60000,
    drainageBasin: 'Mambalam Canal',
    accessStatus: 'open',
    criticalIssues: 'Commercial shops dry-docked; Madley subway closed. Usman Road flyover passable.',
    safeEvacuationPoint: 'Panagal Park GCC Information Hub',
    lastUpdated: '5 mins ago'
  },
  {
    id: 'zone-perumbakkam',
    name: 'Perumbakkam & Semmancheri',
    zoneNumber: 15,
    borough: 'South OMR',
    riskLevel: 'high',
    waterDepthMeters: 0.9,
    center: [12.9010, 80.2080],
    polygon: [
      [12.9120, 80.1980],
      [12.9150, 80.2200],
      [12.8890, 80.2220],
      [12.8870, 80.2000]
    ],
    vulnerablePopulation: 110000,
    drainageBasin: 'Pallikaranai South Basin',
    accessStatus: 'restricted',
    criticalIssues: 'High-density resettlement tenements surrounded by standing rainwater. Mobile medical units active.',
    safeEvacuationPoint: 'Global Health City Relief Staging Hub',
    lastUpdated: '22 mins ago'
  },
  {
    id: 'zone-kotturpuram',
    name: 'Kotturpuram & Chitra Nagar',
    zoneNumber: 10,
    borough: 'Central Adyar',
    riskLevel: 'moderate',
    waterDepthMeters: 0.4,
    center: [13.0230, 80.2420],
    polygon: [
      [13.0300, 80.2350],
      [13.0320, 80.2500],
      [13.0170, 80.2520],
      [13.0150, 80.2370]
    ],
    vulnerablePopulation: 42000,
    drainageBasin: 'Adyar River Basin',
    accessStatus: 'open',
    criticalIssues: 'Flood walls holding back river surge. Low-lying huts near lock evacuated proactively.',
    safeEvacuationPoint: 'Anna Centenary Library High Ground Shelter',
    lastUpdated: '8 mins ago'
  },
  {
    id: 'zone-manali',
    name: 'Manali Industrial & CPCL Belt',
    zoneNumber: 2,
    borough: 'North Estuary',
    riskLevel: 'high',
    waterDepthMeters: 0.75,
    center: [13.1670, 80.2640],
    polygon: [
      [13.1800, 80.2500],
      [13.1820, 80.2800],
      [13.1550, 80.2820],
      [13.1530, 80.2520]
    ],
    vulnerablePopulation: 55000,
    drainageBasin: 'Kosasthalaiyar River Estuary',
    accessStatus: 'restricted',
    criticalIssues: 'Industrial storm-water run-off and tidal backwaters create high stagnant water on Manali Express Road.',
    safeEvacuationPoint: 'GCC Zonal Office II Emergency Staging Hub',
    lastUpdated: '40 mins ago'
  }
];

export const WATER_BODIES: WaterBody[] = [
  {
    id: 'water-adyar',
    name: 'Adyar River',
    type: 'river',
    coordinates: [
      [12.9980, 80.0550], // Chembarambakkam surplus exit
      [13.0080, 80.1200], // Nandambakkam
      [13.0150, 80.1850], // Jafferkhanpet
      [13.0210, 80.2220], // Saidapet
      [13.0240, 80.2450], // Kotturpuram
      [13.0180, 80.2650], // Malar Hospital
      [13.0116, 80.2740]  // Adyar Estuary (Bay of Bengal)
    ],
    currentLevelMeters: 5.6,
    dangerLevelMeters: 6.2,
    dischargeCusecs: 14500,
    status: 'rising',
    description: 'Receives surplus discharge from Chembarambakkam reservoir. Overflow risk high along Saidapet and Jafferkhanpet banks.'
  },
  {
    id: 'water-cooum',
    name: 'Cooum River',
    type: 'river',
    coordinates: [
      [13.0650, 80.1300], // Maduravoyal
      [13.0720, 80.1950], // Koyambedu
      [13.0760, 80.2180], // Aminjikarai
      [13.0750, 80.2450], // Chetpet
      [13.0770, 80.2700], // Egmore
      [13.0690, 80.2880]  // Napier Bridge Estuary
    ],
    currentLevelMeters: 4.2,
    dangerLevelMeters: 5.0,
    dischargeCusecs: 6200,
    status: 'rising',
    description: 'Flowing at 80% embankment capacity. High siltation near Chintadripet.'
  },
  {
    id: 'water-buckingham',
    name: 'Buckingham Canal (Central Corridor)',
    type: 'canal',
    coordinates: [
      [13.1800, 80.2900], // Ennore
      [13.1100, 80.2750], // Basin Bridge
      [13.0800, 80.2760], // Central
      [13.0300, 80.2580], // Mandaveli
      [12.9800, 80.2500], // Thiruvanmiyur
      [12.9000, 80.2300], // Sholinganallur
      [12.8200, 80.2100]  // Kelambakkam
    ],
    currentLevelMeters: 3.1,
    dangerLevelMeters: 3.5,
    status: 'rising',
    description: 'Manmade coastal canal serving as secondary flood drain. Tidal surge limits ocean outflow during high tide.'
  },
  {
    id: 'water-pallikaranai',
    name: 'Pallikaranai Freshwater Marshland',
    type: 'marshland',
    coordinates: [
      [12.9600, 80.2050],
      [12.9650, 80.2280],
      [12.9250, 80.2300],
      [12.9200, 80.2080]
    ],
    currentLevelMeters: 2.8,
    dangerLevelMeters: 3.0,
    status: 'danger_overflow',
    description: 'Last remaining natural wetland in South Chennai. Currently inundated at 110% typical storage capacity, spilling onto Velachery-Tambaram radial road.'
  }
];

export const CRITICAL_FACILITIES: CriticalFacility[] = [
  {
    id: 'fac-rgggh',
    name: 'Rajiv Gandhi Govt General Hospital (RGGGH)',
    type: 'hospital',
    coordinates: [13.0836, 80.2785],
    address: 'EVR Periyar Salai, Park Town, Near Chennai Central',
    contact: '044-25305000 / 108',
    accessStatus: 'fully_accessible',
    submergedDepthCm: 5,
    capacity: 2500,
    currentOccupancy: 2180,
    emergencyBeds: 140,
    generatorStatus: 'operational',
    notes: 'Major trauma hub. Elevated road approach on Poonamallee High Road fully open.'
  },
  {
    id: 'fac-apollo-greams',
    name: 'Apollo Hospitals - Greams Road',
    type: 'hospital',
    coordinates: [13.0583, 80.2528],
    address: '21 Greams Lane, Off Greams Road, Thousand Lights',
    contact: '044-28290200',
    accessStatus: 'fully_accessible',
    submergedDepthCm: 0,
    capacity: 600,
    currentOccupancy: 540,
    emergencyBeds: 35,
    generatorStatus: 'operational',
    notes: 'Internal driveway clear. Direct access via Mount Road / Anna Salai.'
  },
  {
    id: 'fac-miot',
    name: 'MIOT International Hospital',
    type: 'hospital',
    coordinates: [13.0185, 80.1764],
    address: '4/112 Mount Poonamallee Rd, Manapakkam',
    contact: '044-42002288',
    accessStatus: 'limited_access',
    submergedDepthCm: 35,
    capacity: 1000,
    currentOccupancy: 780,
    emergencyBeds: 50,
    generatorStatus: 'operational',
    notes: 'Flood gates deployed. Emergency vehicles only via elevated ramp. Avoid low service lane near Adyar bridge.'
  },
  {
    id: 'fac-kilpauk',
    name: 'Govt Kilpauk Medical College Hospital',
    type: 'hospital',
    coordinates: [13.0784, 80.2415],
    address: 'Poonamallee High Road, Kilpauk',
    contact: '044-28364951',
    accessStatus: 'fully_accessible',
    submergedDepthCm: 0,
    capacity: 1200,
    currentOccupancy: 950,
    emergencyBeds: 80,
    generatorStatus: 'operational',
    notes: 'Burn and trauma units fully staffed. Metro station subway direct entry open.'
  },
  {
    id: 'fac-tambaram-govt',
    name: 'Tambaram Taluk Govt Hospital',
    type: 'hospital',
    coordinates: [12.9510, 80.1412],
    address: 'GST Road, Chromepet',
    contact: '044-22382222',
    accessStatus: 'fully_accessible',
    submergedDepthCm: 10,
    capacity: 450,
    currentOccupancy: 410,
    emergencyBeds: 25,
    generatorStatus: 'operational',
    notes: 'GST Road corridor passable. Key hub for south suburbs.'
  },
  {
    id: 'fac-shelter-velachery',
    name: 'GCC Relief Camp - Guru Nanak College',
    type: 'shelter',
    coordinates: [12.9785, 80.2175],
    address: 'Velachery Bypass Road, Velachery',
    contact: '044-22451700 / GCC: 1913',
    accessStatus: 'limited_access',
    submergedDepthCm: 40,
    capacity: 1500,
    currentOccupancy: 1280,
    generatorStatus: 'operational',
    notes: 'NDRF boat transfer point. Cooked meals & clean drinking water pouches available.'
  },
  {
    id: 'fac-shelter-mudichur',
    name: 'GCC Evacuation Shelter - Mudichur Govt High School',
    type: 'shelter',
    coordinates: [12.9165, 80.0630],
    address: 'School Street, Mudichur',
    contact: 'GCC: 1913',
    accessStatus: 'submerged_access',
    submergedDepthCm: 60,
    capacity: 800,
    currentOccupancy: 760,
    generatorStatus: 'at_risk',
    notes: 'Approachable only via high-axle disaster trucks or rubber boats. Medical team stationed on 1st floor.'
  },
  {
    id: 'fac-shelter-saidapet',
    name: 'Saidapet Boys Higher Secondary School Relief Camp',
    type: 'shelter',
    coordinates: [13.0235, 80.2245],
    address: 'Jeany Road, Saidapet',
    contact: 'GCC: 1913',
    accessStatus: 'fully_accessible',
    submergedDepthCm: 5,
    capacity: 1000,
    currentOccupancy: 650,
    generatorStatus: 'operational',
    notes: 'Safe elevated ground. Medical screening camp and dry ration kit distribution active.'
  },
  {
    id: 'fac-water-central',
    name: 'Chennai Metro Water Emergency Distribution Base',
    type: 'water_distribution',
    coordinates: [13.0760, 80.2640],
    address: 'Metro Water Head Office, Chintadripet',
    contact: '044-45674567',
    accessStatus: 'fully_accessible',
    submergedDepthCm: 0,
    generatorStatus: 'operational',
    notes: '240 stainless steel water tankers operating on scheduled ward routes.'
  },
  {
    id: 'fac-metro-airport',
    name: 'Chennai Airport Relief Logistics Base',
    type: 'metro_station',
    coordinates: [12.9860, 80.1650],
    address: 'Meenambakkam, GST Road',
    contact: 'Air Traffic & Disaster Ops',
    accessStatus: 'fully_accessible',
    submergedDepthCm: 0,
    generatorStatus: 'operational',
    notes: 'Runways cleared. Indian Air Force & Coast Guard helicopter dropping food packets to cut-off pockets.'
  }
];

export const SUBMERGED_SUBWAYS: SubmergedRoadOrSubway[] = [
  {
    id: 'sub-gengu-reddy',
    name: 'Gengu Reddy Subway',
    type: 'subway',
    coordinates: [
      [13.0780, 80.2520],
      [13.0805, 80.2545]
    ],
    center: [13.0792, 80.2532],
    status: 'closed_submerged',
    waterDepthCm: 140,
    alternateRoute: 'Use Chetpet Railway Overbridge or EVR Periyar Salai',
    affectedCorridor: 'Egmore to Chetpet / Kilpauk link'
  },
  {
    id: 'sub-madley',
    name: 'Madley Subway',
    type: 'subway',
    coordinates: [
      [13.0385, 80.2280],
      [13.0400, 80.2310]
    ],
    center: [13.0392, 80.2295],
    status: 'closed_submerged',
    waterDepthCm: 110,
    alternateRoute: 'Use North Usman Road Flyover or CIT Nagar 1st Main Road',
    affectedCorridor: 'T. Nagar to West Mambalam'
  },
  {
    id: 'sub-duraisamy',
    name: 'Duraisamy Subway',
    type: 'subway',
    coordinates: [
      [13.0440, 80.2300],
      [13.0460, 80.2325]
    ],
    center: [13.0450, 80.2312],
    status: 'closed_submerged',
    waterDepthCm: 95,
    alternateRoute: 'Rangarajapuram Flyover',
    affectedCorridor: 'T. Nagar Panagal Park to Postal Colony'
  },
  {
    id: 'sub-vyasarpadi',
    name: 'Vyasarpadi Ganesapuram Subway',
    type: 'subway',
    coordinates: [
      [13.1120, 80.2600],
      [13.1145, 80.2630]
    ],
    center: [13.1132, 80.2615],
    status: 'closed_submerged',
    waterDepthCm: 180,
    alternateRoute: 'Murasoli Maran Flyover (Perambur) via Stephenson Road',
    affectedCorridor: 'Basin Bridge to Vyasarpadi & Kodungaiyur'
  },
  {
    id: 'sub-thillai-ganga',
    name: 'Thillai Ganga Nagar Subway',
    type: 'subway',
    coordinates: [
      [12.9970, 80.1980],
      [12.9995, 80.2010]
    ],
    center: [12.9982, 80.1995],
    status: 'waterlogged_passable',
    waterDepthCm: 40,
    alternateRoute: 'St. Thomas Mount Railway Overbridge',
    affectedCorridor: 'Nanganallur to GST Road'
  }
];

export const RESERVOIR_DATA: ReservoirData[] = [
  {
    id: 'res-chembarambakkam',
    name: 'Chembarambakkam Lake',
    fullCapacityMcft: 3645,
    currentStorageMcft: 3310,
    inflowCusecs: 11200,
    outflowCusecs: 9500,
    dangerThresholdPercent: 88,
    impactBasin: 'Adyar River (Manapakkam, Saidapet, Kotturpuram)',
    status: 'heavy_discharge',
    coordinates: [13.0089, 80.0573]
  },
  {
    id: 'res-redhills',
    name: 'Red Hills (Puzhal Lake)',
    fullCapacityMcft: 3300,
    currentStorageMcft: 2890,
    inflowCusecs: 4500,
    outflowCusecs: 3000,
    dangerThresholdPercent: 85,
    impactBasin: 'Surplus canal to Retteri, Kolathur, Buckingham Canal',
    status: 'alert',
    coordinates: [13.1870, 80.1800]
  },
  {
    id: 'res-poondi',
    name: 'Poondi Reservoir',
    fullCapacityMcft: 3231,
    currentStorageMcft: 2750,
    inflowCusecs: 6100,
    outflowCusecs: 4200,
    dangerThresholdPercent: 82,
    impactBasin: 'Kosasthalaiyar River (Ennore, Manali)',
    status: 'alert',
    coordinates: [13.1890, 79.8600]
  },
  {
    id: 'res-cholavaram',
    name: 'Cholavaram Lake',
    fullCapacityMcft: 1081,
    currentStorageMcft: 790,
    inflowCusecs: 1800,
    outflowCusecs: 800,
    dangerThresholdPercent: 75,
    impactBasin: 'North Chennai irrigation canals',
    status: 'normal',
    coordinates: [13.2350, 80.1500]
  }
];

export const INITIAL_INCIDENTS: IncidentReport[] = [
  {
    id: 'inc-1',
    reporterName: 'Karthik S. (Velachery Resident)',
    category: 'stranded_people',
    locationName: 'Ram Nagar South, Velachery',
    coordinates: [12.9735, 80.2185],
    waterDepthFeet: 4.2,
    urgency: 'urgent',
    description: 'Elderly couple and infant stranded on first floor. Ground floor inundated. Need rescue dinghy and drinking water.',
    timestamp: '14 mins ago',
    verified: true,
    upvotes: 42
  },
  {
    id: 'inc-2',
    reporterName: 'Dr. Priya V. (Medical Volunteer)',
    category: 'medical_emergency',
    locationName: 'Varadharajapuram, Mudichur',
    coordinates: [12.9120, 80.0610],
    waterDepthFeet: 3.8,
    urgency: 'life_threatening',
    description: 'Dialysis patient needs immediate transfer to Tambaram Taluk Hospital. Access road underwater.',
    timestamp: '28 mins ago',
    verified: true,
    upvotes: 67
  },
  {
    id: 'inc-3',
    reporterName: 'Selvam M. (Auto Driver)',
    category: 'road_blocked',
    locationName: 'Ganesapuram Subway, Vyasarpadi',
    coordinates: [13.1132, 80.2615],
    waterDepthFeet: 5.5,
    urgency: 'urgent',
    description: 'Underpass totally flooded. Bus trapped midway earlier, road blocked by barricades. Avoid completely.',
    timestamp: '35 mins ago',
    verified: true,
    upvotes: 29
  },
  {
    id: 'inc-4',
    reporterName: 'Anand Kumar (Ward 14 Volunteer)',
    category: 'water_supply',
    locationName: 'Madipakkam Main Road, Keelkattalai',
    coordinates: [12.9620, 80.1980],
    waterDepthFeet: 2.0,
    urgency: 'routine',
    description: 'Metro water tanker arrived at junction. Residents can collect chlorinated water in cans.',
    timestamp: '48 mins ago',
    verified: true,
    upvotes: 18
  },
  {
    id: 'inc-5',
    reporterName: 'Meena R. (Student)',
    category: 'water_surge',
    locationName: 'Saidapet Maraimalai Adigal Bridge',
    coordinates: [13.0210, 80.2220],
    waterDepthFeet: 2.5,
    urgency: 'urgent',
    description: 'Adyar river water level touching bottom of bridge girders. Police diverting two-wheelers towards Guindy.',
    timestamp: '52 mins ago',
    verified: true,
    upvotes: 53
  }
];

export const PRESET_ROUTES: RouteOption[] = [
  {
    id: 'route-velachery-apollo',
    originName: 'Velachery Bypass Road',
    originCoords: [12.9780, 80.2210],
    destName: 'Apollo Hospitals (Greams Road)',
    destCoords: [13.0583, 80.2528],
    routeType: 'recommended_safe',
    pathCoords: [
      [12.9780, 80.2210], // Origin
      [12.9920, 80.2080], // Guindy Race Course Flyover
      [13.0080, 80.2030], // Kathipara Grade Separator (Elevated)
      [13.0250, 80.2150], // Guindy Anna Salai
      [13.0420, 80.2370], // Nandanam Junction (Elevated High Ground)
      [13.0540, 80.2480], // Gemini Flyover
      [13.0583, 80.2528]  // Apollo Greams Rd
    ],
    distanceKm: 13.4,
    travelTimeMins: 38,
    safetyScorePercent: 91,
    floodZonesCrossed: ['Velachery (Edge)'],
    maxWaterDepthCm: 15,
    warnings: [
      'Avoid Inner Ring Road via Jafferkhanpet (submerged under 80cm water).',
      'Take Guindy Flyover and stick strictly to elevated Anna Salai / Mount Road corridor.'
    ],
    safePassageAdvice: 'High-axle vehicles and standard cars can pass via elevated Anna Salai without engine stall risk.'
  },
  {
    id: 'route-velachery-miot',
    originName: 'Velachery Bypass Road',
    originCoords: [12.9780, 80.2210],
    destName: 'MIOT International (Manapakkam)',
    destCoords: [13.0185, 80.1764],
    routeType: 'direct_flooded',
    pathCoords: [
      [12.9780, 80.2210],
      [12.9900, 80.2050],
      [13.0070, 80.1980], // Kathipara
      [13.0150, 80.1850], // Adyar river approach (Submerged)
      [13.0185, 80.1764]
    ],
    distanceKm: 9.2,
    travelTimeMins: 55,
    safetyScorePercent: 38,
    floodZonesCrossed: ['Velachery Lake', 'Adyar River Midstream'],
    maxWaterDepthCm: 75,
    warnings: [
      'CRITICAL: Adyar River overflowing onto Mount-Poonamallee approach road near Manapakkam bridge.',
      'Small passenger cars and two-wheelers will hydro-lock.'
    ],
    safePassageAdvice: 'Do NOT use this route. Seek alternate ambulance dispatch via Porur Tollway or divert to RGGGH.'
  },
  {
    id: 'route-mudichur-tambaram',
    originName: 'Mudichur Main Road',
    originCoords: [12.9150, 80.0650],
    destName: 'Tambaram Taluk Govt Hospital',
    destCoords: [12.9510, 80.1412],
    routeType: 'alternate_elevated',
    pathCoords: [
      [12.9150, 80.0650], // Mudichur
      [12.9050, 80.0820], // Bypass to Outer Ring Road (ORR) elevated ramp
      [12.9150, 80.1050], // Perungalathur Flyover
      [12.9300, 80.1250], // Tambaram Sanatorium elevated
      [12.9510, 80.1412]  // Chromepet Hospital
    ],
    distanceKm: 11.8,
    travelTimeMins: 32,
    safetyScorePercent: 86,
    floodZonesCrossed: ['Mudichur Outskirts'],
    maxWaterDepthCm: 20,
    warnings: [
      'Old Mudichur road is blocked under 1.4m water.',
      'Use Chennai Outer Ring Road (ORR) elevated embankment to bypass Perungalathur bottleneck.'
    ],
    safePassageAdvice: 'Passable for ambulances, relief trucks, and SUVs via ORR interchange.'
  },
  {
    id: 'route-vyasarpadi-rgggh',
    originName: 'Vyasarpadi Market',
    originCoords: [13.1118, 80.2580],
    destName: 'Rajiv Gandhi Govt General Hospital (RGGGH)',
    destCoords: [13.0836, 80.2785],
    routeType: 'recommended_safe',
    pathCoords: [
      [13.1118, 80.2580],
      [13.1100, 80.2450], // Detour west via Perambur Barracks Rd
      [13.0980, 80.2520], // Choolai High Road
      [13.0890, 80.2650], // Sydenhams Road
      [13.0836, 80.2785]  // Central RGGGH
    ],
    distanceKm: 5.6,
    travelTimeMins: 24,
    safetyScorePercent: 82,
    floodZonesCrossed: ['Vyasarpadi Outer'],
    maxWaterDepthCm: 25,
    warnings: [
      'Ganesapuram subway blocked by 1.8m water.',
      'Detour via Perambur Barracks Road and Sydenhams Road avoids railway subways.'
    ],
    safePassageAdvice: 'Clear route avoiding flooded railway subways. High ground along Perambur Barracks Road.'
  }
];

export const EMERGENCY_CONTACTS = [
  { name: 'Greater Chennai Corporation (GCC) Flood Control Room', phone: '1913', desc: '24x7 Tree falls, water stagnation, emergency relief' },
  { name: 'GCC WhatsApp Flood Complaint Line', phone: '+91 94454 77205', desc: 'Send geo-tagged photo with address' },
  { name: 'Disaster Management Helpline (State Control Room)', phone: '1070', desc: 'State-wide coordination, NDRF/SDRF deployment' },
  { name: 'District Emergency Operations Centre (Chennai)', phone: '1077', desc: 'Chennai Collectorate emergency command' },
  { name: 'Ambulance Emergency Service', phone: '108', desc: 'Water-ready emergency ambulance dispatch' },
  { name: 'Tamil Nadu Fire & Rescue Services (Boats)', phone: '101', desc: 'Inflatable boat rescue & evacuation' },
  { name: 'Police Emergency Response', phone: '100', desc: 'Patrol & traffic diversion updates' },
  { name: 'Chennai Metro Water Tanker Booking Helpline', phone: '044-45674567', desc: 'Emergency drinking water delivery' },
  { name: 'TANGEDCO Power Outage / Live Wire Alert', phone: '94987 94987', desc: 'Report submerged transformers / fallen wires' }
];
