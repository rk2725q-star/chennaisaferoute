import {
  RoadRiskSegment,
  RouteOptionData,
  EmergencyFacility,
  PlaceSuggestion,
  JourneyHistoryItem,
  DrainageChannel,
  WaterBody,
  HistoricalFloodPoint,
  BackgroundIntelligenceStats
} from '../types/navigation';

export const CHENNAI_COORDINATES: [number, number] = [13.0450, 80.2250];

export const MOCK_PLACE_SUGGESTIONS: PlaceSuggestion[] = [
  // --- North Chennai ---
  {
    id: 'nc-central',
    name: 'Chennai Central Railway Station (Park Town)',
    description: 'Kannappar Thidal, Periamet, North Chennai',
    category: 'Transit',
    zone: 'North Chennai',
    coordinates: [13.0827, 80.2755]
  },
  {
    id: 'nc-vyasarpadi',
    name: 'Vyasarpadi (M.K.B. Nagar / Ganesapuram Subway)',
    description: 'Low-lying railway subway basin, North Chennai',
    category: 'Vulnerable Basin',
    zone: 'North Chennai',
    coordinates: [13.1118, 80.2587]
  },
  {
    id: 'nc-perambur',
    name: 'Perambur (Stephenson Road / Loco Works)',
    description: 'Madhavaram High Road corridor, North Chennai',
    category: 'Transit & Residential',
    zone: 'North Chennai',
    coordinates: [13.1090, 80.2372]
  },
  {
    id: 'nc-kolathur',
    name: 'Kolathur (Retteri Flyover Junction)',
    description: 'Jawaharlal Nehru Road / Inner Ring Road',
    category: 'Arterial Junction',
    zone: 'North Chennai',
    coordinates: [13.1250, 80.2080]
  },
  {
    id: 'nc-tondiarpet',
    name: 'Tondiarpet (Manali High Road / Tollgate)',
    description: 'Coastal North Chennai port corridor',
    category: 'Coastal Zone',
    zone: 'North Chennai',
    coordinates: [13.1280, 80.2890]
  },
  {
    id: 'nc-royapuram',
    name: 'Royapuram (Fishing Harbour & Bridge)',
    description: 'Surya Narayana Street, North Chennai',
    category: 'Coastal Landmark',
    zone: 'North Chennai',
    coordinates: [13.1095, 80.2940]
  },
  {
    id: 'nc-washermanpet',
    name: 'Washermanpet (Mint Junction / Metro)',
    description: 'Old Jail Road / Mint Clock Tower',
    category: 'Commercial & Metro',
    zone: 'North Chennai',
    coordinates: [13.1020, 80.2810]
  },
  {
    id: 'nc-ennore',
    name: 'Ennore (Express Highway / Port Terminal)',
    description: 'Ennore Creek & Thermal Station corridor',
    category: 'Port & Industrial',
    zone: 'North Chennai',
    coordinates: [13.2140, 80.3200]
  },
  {
    id: 'nc-manali',
    name: 'Manali (Industrial Basin / CPCL Corridor)',
    description: 'Kamarajar Salai industrial catchment',
    category: 'Industrial Catchment',
    zone: 'North Chennai',
    coordinates: [13.1670, 80.2600]
  },
  {
    id: 'nc-madhavaram',
    name: 'Madhavaram (Intercity Bus Terminus - MMBT)',
    description: 'GNT Road / Inner Ring Road Terminus',
    category: 'Intercity Bus Terminus',
    zone: 'North Chennai',
    coordinates: [13.1490, 80.2310]
  },
  {
    id: 'nc-georgetown',
    name: 'George Town (Parrys Corner / Madras High Court)',
    description: 'NSC Bose Road / Rajaji Salai',
    category: 'Administrative & Civic',
    zone: 'North Chennai',
    coordinates: [13.0880, 80.2885]
  },
  {
    id: 'nc-basinbridge',
    name: 'Basin Bridge Junction (Otteri Nullah)',
    description: 'Railway hub & Buckingham Canal confluence',
    category: 'Canal Confluence',
    zone: 'North Chennai',
    coordinates: [13.0970, 80.2690]
  },
  {
    id: 'nc-thiruvottiyur',
    name: 'Thiruvottiyur (High Road / Metro)',
    description: 'Wimco Nagar & Vadivudaiamman Koil',
    category: 'Coastal Transit',
    zone: 'North Chennai',
    coordinates: [13.1600, 80.3000]
  },
  {
    id: 'nc-pulianthope',
    name: 'Pulianthope (Dr. Ambedkar College Road)',
    description: 'Otteri Nullah flood catchment',
    category: 'Low-Lying Basin',
    zone: 'North Chennai',
    coordinates: [13.0980, 80.2680]
  },

  // --- Central Chennai ---
  {
    id: 'cc-egmore',
    name: 'Chennai Egmore Railway Station',
    description: 'Gandhi Irwin Road / Poonamallee High Rd',
    category: 'Railway Terminus',
    zone: 'Central Chennai',
    coordinates: [13.0790, 80.2610]
  },
  {
    id: 'cc-tnagar',
    name: 'T. Nagar (Panagal Park / Usman Road)',
    description: 'Commercial heart of Chennai, Central zone',
    category: 'Commercial Hub',
    zone: 'Central Chennai',
    coordinates: [13.0418, 80.2341]
  },
  {
    id: 'cc-nungambakkam',
    name: 'Nungambakkam (Sterling Road / High Road)',
    description: 'Loyola College & DPI Campus corridor',
    category: 'Urban Core',
    zone: 'Central Chennai',
    coordinates: [13.0610, 80.2440]
  },
  {
    id: 'cc-annasalai',
    name: 'Anna Salai (Mount Road / Thousand Lights)',
    description: 'High-elevation arterial spine (11m MSL)',
    category: 'Elevated Arterial Ridge',
    zone: 'Central Chennai',
    coordinates: [13.0580, 80.2540]
  },
  {
    id: 'cc-mylapore',
    name: 'Mylapore (Luz Corner / Kapaleeshwarar Temple)',
    description: 'RK Mutt Road / Kutchery Road',
    category: 'Cultural Landmark',
    zone: 'Central Chennai',
    coordinates: [13.0334, 80.2686]
  },
  {
    id: 'cc-triplicane',
    name: 'Triplicane (Ice House / Parthasarathy Temple)',
    description: 'Besant Road & Marina Beach margin',
    category: 'Coastal Urban',
    zone: 'Central Chennai',
    coordinates: [13.0540, 80.2780]
  },
  {
    id: 'cc-alwarpet',
    name: 'Alwarpet (TTK Road / Eldams Road)',
    description: 'Mid-elevation plain, Central Chennai',
    category: 'Residential & Commercial',
    zone: 'Central Chennai',
    coordinates: [13.0360, 80.2520]
  },
  {
    id: 'cc-gopalapuram',
    name: 'Gopalapuram (Cathedral Road)',
    description: 'Semmozhi Poonga / Stella Maris margin',
    category: 'Civic & Greenspace',
    zone: 'Central Chennai',
    coordinates: [13.0480, 80.2520]
  },
  {
    id: 'cc-royapettah',
    name: 'Royapettah (Express Avenue / Whites Road)',
    description: 'Whites Road / Royapettah High Road',
    category: 'Commercial Hub',
    zone: 'Central Chennai',
    coordinates: [13.0570, 80.2630]
  },
  {
    id: 'cc-kilpauk',
    name: 'Kilpauk (Medical College / Kellys)',
    description: 'Poonamallee High Road elevated corridor',
    category: 'Elevated Corridor',
    zone: 'Central Chennai',
    coordinates: [13.0820, 80.2430]
  },
  {
    id: 'cc-chetpet',
    name: 'Chetpet (Spur Tank Road / Harrington Road)',
    description: 'Cooum River margin & Eco Park',
    category: 'River Margin',
    zone: 'Central Chennai',
    coordinates: [13.0720, 80.2410]
  },
  {
    id: 'cc-shenoynagar',
    name: 'Shenoy Nagar (Thiru Vi Ka Park / Metro)',
    description: 'Elevated urban residential sector',
    category: 'Residential & Metro',
    zone: 'Central Chennai',
    coordinates: [13.0780, 80.2280]
  },
  {
    id: 'cc-marina',
    name: 'Marina Beach Promenade (Lighthouse)',
    description: 'Kamarajar Salai coastal spine',
    category: 'Coastal Arterial',
    zone: 'Central Chennai',
    coordinates: [13.0450, 80.2810]
  },
  {
    id: 'cc-kodambakkam',
    name: 'Kodambakkam (Arcot Road / Meenakshi College)',
    description: 'Kodambakkam bridge & suburban railway',
    category: 'Transit & Arterial',
    zone: 'Central Chennai',
    coordinates: [13.0520, 80.2250]
  },
  {
    id: 'cc-santhome',
    name: 'Santhome (Cathedral Basilica / Loop Road)',
    description: 'Coastal sea-facing corridor',
    category: 'Coastal Corridor',
    zone: 'Central Chennai',
    coordinates: [13.0330, 80.2780]
  },

  // --- South Chennai ---
  {
    id: 'sc-guindy',
    name: 'Guindy (Kathipara Multi-level Interchange)',
    description: '14.2m MSL dry elevated grade separator',
    category: 'Transit Interchange',
    zone: 'South Chennai',
    coordinates: [13.0080, 80.2070]
  },
  {
    id: 'sc-saidapet',
    name: 'Saidapet (Maraimalai Adigal Bridge / Bazar Rd)',
    description: 'Adyar River crossing point',
    category: 'River Crossing',
    zone: 'South Chennai',
    coordinates: [13.0220, 80.2220]
  },
  {
    id: 'sc-adyar',
    name: 'Adyar (Madhya Kailash Junction)',
    description: 'Sardar Patel Road / Rajiv Gandhi Salai (OMR)',
    category: 'Arterial Junction',
    zone: 'South Chennai',
    coordinates: [13.0067, 80.2570]
  },
  {
    id: 'sc-besantnagar',
    name: 'Besant Nagar (Elliot’s Beach / 6th Avenue)',
    description: 'Coastal high ground residential hub',
    category: 'Coastal Residential',
    zone: 'South Chennai',
    coordinates: [12.9980, 80.2710]
  },
  {
    id: 'sc-thiruvanmiyur',
    name: 'Thiruvanmiyur (Tidel Park / Beach Road)',
    description: 'OMR gateway & East Coast Road origin',
    category: 'Tech Gateway',
    zone: 'South Chennai',
    coordinates: [12.9860, 80.2580]
  },
  {
    id: 'sc-kotturpuram',
    name: 'Kotturpuram (Anna Centenary Library)',
    description: 'Gandhi Mandapam Road / Adyar bank',
    category: 'Civic Landmark',
    zone: 'South Chennai',
    coordinates: [13.0160, 80.2420]
  },
  {
    id: 'sc-velachery',
    name: 'Velachery (Vijayanagar Bus Stand)',
    description: 'Depression basin & chronic flood hotspot',
    category: 'Vulnerable Basin',
    zone: 'South Chennai',
    coordinates: [12.9780, 80.2200]
  },
  {
    id: 'sc-velachery-bypass',
    name: 'Velachery 100-ft Bypass Road',
    description: 'Phoenix Mall corridor & stormwater culvert',
    category: 'Chronic Inundation Corridor',
    zone: 'South Chennai',
    coordinates: [12.9890, 80.2180]
  },
  {
    id: 'sc-phoenix',
    name: 'Phoenix Marketcity Velachery',
    description: 'Velachery Road, South Chennai',
    category: 'Commercial Landmark',
    zone: 'South Chennai',
    coordinates: [12.9922, 80.2173]
  },
  {
    id: 'sc-madipakkam',
    name: 'Madipakkam (Koot Road / Lake View)',
    description: 'Madipakkam Lake overflow basin',
    category: 'Lowland Catchment',
    zone: 'South Chennai',
    coordinates: [12.9640, 80.1980]
  },
  {
    id: 'sc-pallikaranai',
    name: 'Pallikaranai (Marshland Wetland Corridor)',
    description: 'Natural drainage sink (2.8m MSL)',
    category: 'Natural Wetland Sink',
    zone: 'South Chennai',
    coordinates: [12.9350, 80.2180]
  },
  {
    id: 'sc-medavakkam',
    name: 'Medavakkam (Tambaram-Velachery Main Road)',
    description: 'Arterial link between GST Road and OMR',
    category: 'Arterial Link',
    zone: 'South Chennai',
    coordinates: [12.9180, 80.1910]
  },
  {
    id: 'sc-sholinganallur',
    name: 'Sholinganallur (ELCOT SEZ Junction)',
    description: 'OMR - Medavakkam Link Road hub',
    category: 'IT Hub & SEZ',
    zone: 'South Chennai',
    coordinates: [12.9010, 80.2280]
  },
  {
    id: 'sc-perungudi',
    name: 'Perungudi (OMR Toll Plaza)',
    description: 'Buckingham Canal crossing & IT corridor',
    category: 'Tech Corridor',
    zone: 'South Chennai',
    coordinates: [12.9650, 80.2430]
  },
  {
    id: 'sc-thoraipakkam',
    name: 'Thoraipakkam (200ft Radial Road Junction)',
    description: 'East-West link to Pallavaram GST Road',
    category: 'Radial Expressway',
    zone: 'South Chennai',
    coordinates: [12.9416, 80.2362]
  },
  {
    id: 'sc-navalur',
    name: 'Navalur / Siruseri (SIPCOT IT Park)',
    description: 'Southern tip of OMR tech expressway',
    category: 'Tech Park',
    zone: 'South Chennai',
    coordinates: [12.8360, 80.2220]
  },
  {
    id: 'sc-neelankarai',
    name: 'Neelankarai (East Coast Road - ECR)',
    description: 'Coastal highway & Buckingham buffer',
    category: 'Coastal Highway',
    zone: 'South Chennai',
    coordinates: [12.9480, 80.2570]
  },
  {
    id: 'sc-palavakkam',
    name: 'Palavakkam (ECR Coastal Link)',
    description: 'Sandy high-drainage coastal plain',
    category: 'Coastal Highway',
    zone: 'South Chennai',
    coordinates: [12.9620, 80.2580]
  },
  {
    id: 'sc-injambakkam',
    name: 'Injambakkam (Prarthana Beach / ECR)',
    description: 'South coastal belt, South Chennai',
    category: 'Coastal Belt',
    zone: 'South Chennai',
    coordinates: [12.9240, 80.2530]
  },
  {
    id: 'sc-kovalam',
    name: 'Kovalam (ECR Coast)',
    description: 'Muttukadu backwaters confluence',
    category: 'Estuary Margin',
    zone: 'South Chennai',
    coordinates: [12.7910, 80.2480]
  },

  // --- West Chennai ---
  {
    id: 'wc-annanagar',
    name: 'Anna Nagar (Roundtana / Tower Park)',
    description: 'Planned high-ground plateau (15m MSL)',
    category: 'High-Ground Plateau',
    zone: 'West Chennai',
    coordinates: [13.0850, 80.2100]
  },
  {
    id: 'wc-thirumangalam',
    name: 'Thirumangalam (Metro Station / 100ft Rd)',
    description: 'Jawaharlal Nehru Salai junction',
    category: 'Metro & Arterial',
    zone: 'West Chennai',
    coordinates: [13.0850, 80.1950]
  },
  {
    id: 'wc-koyambedu',
    name: 'Koyambedu (CMBT Intercity Bus Terminus)',
    description: 'Major transit terminal & Cooum margin',
    category: 'Intercity Bus Terminus',
    zone: 'West Chennai',
    coordinates: [13.0673, 80.1932]
  },
  {
    id: 'wc-vadapalani',
    name: 'Vadapalani (Murugan Temple / Forum Vijaya)',
    description: 'Arcot Road / 100-ft Inner Ring Road',
    category: 'Transit & Commercial',
    zone: 'West Chennai',
    coordinates: [13.0510, 80.2120]
  },
  {
    id: 'wc-porur',
    name: 'Porur (Porur Junction / Mount-Poonamallee Rd)',
    description: 'Major western transit chokepoint',
    category: 'Arterial Junction',
    zone: 'West Chennai',
    coordinates: [13.0360, 80.1580]
  },
  {
    id: 'wc-porurlake',
    name: 'Porur Lake Embankment',
    description: 'Chettiar Agaram Road & lake feeder',
    category: 'Reservoir Margin',
    zone: 'West Chennai',
    coordinates: [13.0340, 80.1499]
  },
  {
    id: 'wc-ambattur-ind',
    name: 'Ambattur Industrial Estate (South Phase)',
    description: 'Industrial basin near Cooum overflow',
    category: 'Industrial Catchment',
    zone: 'West Chennai',
    coordinates: [13.0980, 80.1620]
  },
  {
    id: 'wc-ambattur-ot',
    name: 'Ambattur OT (Old Terminus / MTH Road)',
    description: 'Madras-Tiruvallur High Road corridor',
    category: 'Commercial Arterial',
    zone: 'West Chennai',
    coordinates: [13.1140, 80.1540]
  },
  {
    id: 'wc-avadi',
    name: 'Avadi (Railway Station / HVF Road)',
    description: 'Western industrial & defence hub',
    category: 'Transit & Defence Hub',
    zone: 'West Chennai',
    coordinates: [13.1160, 80.1000]
  },
  {
    id: 'wc-poonamallee',
    name: 'Poonamallee (Bypass / Trunk Road)',
    description: 'Bengaluru Highway Gateway, West Chennai',
    category: 'Highway Gateway',
    zone: 'West Chennai',
    coordinates: [13.0480, 80.0980]
  },
  {
    id: 'wc-mogappair',
    name: 'Mogappair (Golden Flats / West Bus Stand)',
    description: 'Nolambur & Ambattur link corridor',
    category: 'Residential & Link',
    zone: 'West Chennai',
    coordinates: [13.0830, 80.1760]
  },
  {
    id: 'wc-valasaravakkam',
    name: 'Valasaravakkam (Arcot Road / Kesavardhini)',
    description: 'Mid-elevation plain (17m MSL)',
    category: 'Commercial Arterial',
    zone: 'West Chennai',
    coordinates: [13.0400, 80.1730]
  },
  {
    id: 'wc-ramapuram',
    name: 'Ramapuram (DLF IT Park / Mount-Poonamallee)',
    description: 'Adyar River proximity low-lying plain',
    category: 'Tech Park & River Buffer',
    zone: 'West Chennai',
    coordinates: [13.0300, 80.1800]
  },
  {
    id: 'wc-mangadu',
    name: 'Mangadu (Kamakshi Amman Temple Road)',
    description: 'Kundrahtur link corridor, West Chennai',
    category: 'Residential & Cultural',
    zone: 'West Chennai',
    coordinates: [13.0390, 80.1160]
  },

  // --- Suburbs & Periphery (South-West / GST) ---
  {
    id: 'sub-airport',
    name: 'Chennai International Airport (MAA Meenambakkam)',
    description: 'GST Road Terminal 1 & 2',
    category: 'International Airport',
    zone: 'Suburbs & Transit',
    coordinates: [12.9941, 80.1709]
  },
  {
    id: 'sub-pallavaram',
    name: 'Pallavaram (GST Road / Pammal Link)',
    description: 'Flyover interchange & hillock slopes',
    category: 'Transit & Arterial',
    zone: 'Suburbs & Transit',
    coordinates: [12.9680, 80.1480]
  },
  {
    id: 'sub-chromepet',
    name: 'Chromepet (MIT Bridge / GST Road)',
    description: 'Madras Institute of Technology corridor',
    category: 'Arterial Corridor',
    zone: 'Suburbs & Transit',
    coordinates: [12.9510, 80.1410]
  },
  {
    id: 'sub-sanatorium',
    name: 'Tambaram Sanatorium (MEPZ IT SEZ)',
    description: 'GST Road / Madras Export Processing Zone',
    category: 'SEZ & Transit',
    zone: 'Suburbs & Transit',
    coordinates: [12.9370, 80.1280]
  },
  {
    id: 'sub-tambaram',
    name: 'Tambaram Railway Junction (West & Bus Stand)',
    description: 'Southern gateway to Chennai & railway hub',
    category: 'Major Transit Hub',
    zone: 'Suburbs & Transit',
    coordinates: [12.9249, 80.1000]
  },
  {
    id: 'sub-vandalur',
    name: 'Vandalur (Arignar Anna Zoological Park / Crescent)',
    description: 'Outer Ring Road (ORR) Interchange',
    category: 'Outer Ring Road Hub',
    zone: 'Suburbs & Transit',
    coordinates: [12.8910, 80.0810]
  },
  {
    id: 'sub-perungalathur',
    name: 'Perungalathur (GST Highway / Bye-pass)',
    description: 'Major arterial highway bottleneck',
    category: 'Highway Chokepoint',
    zone: 'Suburbs & Transit',
    coordinates: [12.9050, 80.0920]
  },
  {
    id: 'sub-mudichur',
    name: 'Mudichur (Adyar River Basin Lowlands)',
    description: 'Chronic river flood inundation hotspot',
    category: 'Severe Flood Vulnerable Basin',
    zone: 'Suburbs & Transit',
    coordinates: [12.9080, 80.0710]
  },
  {
    id: 'sub-guduvanchery',
    name: 'Guduvanchery (GST Highway Corridor)',
    description: 'Southern suburban IT & residential belt',
    category: 'Suburban Corridor',
    zone: 'Suburbs & Transit',
    coordinates: [12.8450, 80.0610]
  },
  {
    id: 'sub-sriperumbudur',
    name: 'Sriperumbudur (Industrial Highway Hub)',
    description: 'Chennai-Bengaluru Highway NH48',
    category: 'Industrial Corridor',
    zone: 'Suburbs & Transit',
    coordinates: [12.9730, 79.9440]
  },

  // --- Hospitals & Relief Shelters ---
  {
    id: 'emg-gh',
    name: 'Government General Hospital (Rajiv Gandhi GH)',
    description: 'EVR Periyar Salai, Park Town, Central Chennai',
    category: 'Disaster Referral Hospital',
    zone: 'Hospitals & Relief',
    coordinates: [13.0805, 80.2798]
  },
  {
    id: 'emg-apollo',
    name: 'Apollo Hospital Greams Road (Thousand Lights)',
    description: 'High-elevation emergency trauma center (11.2m MSL)',
    category: 'Elevated Emergency Hospital',
    zone: 'Hospitals & Relief',
    coordinates: [13.0563, 80.2514]
  },
  {
    id: 'emg-stanley',
    name: 'Stanley Government Medical College Hospital',
    description: 'Old Jail Road, Royapuram / Washermanpet',
    category: 'North Chennai Referral Hospital',
    zone: 'Hospitals & Relief',
    coordinates: [13.1070, 80.2860]
  },
  {
    id: 'emg-kmc',
    name: 'Kilpauk Medical College Hospital (KMC)',
    description: 'Poonamallee High Road, Kilpauk',
    category: 'Elevated Corridor Hospital',
    zone: 'Hospitals & Relief',
    coordinates: [13.0810, 80.2420]
  },
  {
    id: 'emg-malar',
    name: 'Fortis Malar Hospital (Adyar)',
    description: 'Gandhi Nagar, 1st Main Road, Adyar',
    category: 'South Chennai Emergency Hospital',
    zone: 'Hospitals & Relief',
    coordinates: [13.0060, 80.2570]
  },
  {
    id: 'emg-miot',
    name: 'MIOT International Hospital (Manapakkam)',
    description: 'Mount-Poonamallee Road, Manapakkam',
    category: 'Trauma Care & High Risk River Margin',
    zone: 'Hospitals & Relief',
    coordinates: [13.0230, 80.1790]
  },
  {
    id: 'emg-sims',
    name: 'SIMS Hospital Vadapalani',
    description: 'Jawaharlal Nehru Salai (100ft Rd), Vadapalani',
    category: 'Multi-Super Specialty Hospital',
    zone: 'Hospitals & Relief',
    coordinates: [13.0515, 80.2115]
  },
  {
    id: 'emg-ramachandra',
    name: 'Sri Ramachandra Medical Centre (Porur)',
    description: 'Mount-Poonamallee Road, Porur',
    category: 'Western Medical University Hub',
    zone: 'Hospitals & Relief',
    coordinates: [13.0380, 80.1420]
  },
  {
    id: 'emg-jnstadium',
    name: 'Jawaharlal Nehru Stadium Flood Relief Camp',
    description: 'Sydenhams Road, Periamet, North-Central Chennai',
    category: 'Major GCC Relief Camp',
    zone: 'Hospitals & Relief',
    coordinates: [13.0840, 80.2740]
  },
  {
    id: 'emg-ripon',
    name: 'Ripon Building - GCC Disaster Command Headquarters',
    description: 'Sydenhams Road, Park Town, Chennai',
    category: 'GCC Disaster Command',
    zone: 'Hospitals & Relief',
    coordinates: [13.0820, 80.2760]
  }
];

export const MOCK_DRAINAGE_CHANNELS: DrainageChannel[] = [
  {
    id: 'drain-adyar',
    name: 'Adyar River Main Channel',
    waterwayType: 'river',
    coordinates: [
      [13.0079, 80.0507], // Chembarambakkam outflow
      [12.9538, 80.1235], // Tiruneermalai
      [13.0080, 80.1790], // Manapakkam
      [13.0180, 80.2100], // Jafferkhanpet
      [13.0220, 80.2220], // Saidapet Maraimalai Adigal Bridge
      [13.0160, 80.2420], // Kotturpuram
      [13.0067, 80.2570], // Adyar Bridge
      [13.0135, 80.2644]  // Estuary & Whale Island
    ]
  },
  {
    id: 'drain-cooum',
    name: 'Cooum River Channel',
    waterwayType: 'river',
    coordinates: [
      [13.0650, 80.1400], // Maduravoyal
      [13.0673, 80.1932], // Koyambedu
      [13.0720, 80.2250], // Aminjikarai
      [13.0720, 80.2410], // Chetpet
      [13.0780, 80.2600], // Egmore
      [13.0805, 80.2798], // Central / Park Town
      [13.0690, 80.2880]  // Bay of Bengal Outfall (Napier Bridge)
    ]
  },
  {
    id: 'drain-buckingham',
    name: 'Buckingham Canal (North to South Spine)',
    waterwayType: 'canal',
    coordinates: [
      [13.2140, 80.3200], // Ennore North
      [13.1280, 80.2890], // Tondiarpet
      [13.0970, 80.2690], // Basin Bridge
      [13.0690, 80.2800], // Chepauk / Triplicane
      [13.0330, 80.2680], // Mylapore
      [13.0067, 80.2570], // Adyar confluence
      [12.9650, 80.2430], // Perungudi
      [12.9010, 80.2280], // Sholinganallur
      [12.8360, 80.2220], // Navalur / Siruseri
      [12.7910, 80.2480]  // Kovalam Backwaters
    ]
  },
  {
    id: 'drain-otteri',
    name: 'Otteri Nullah Storm Drain',
    waterwayType: 'drain',
    coordinates: [
      [13.0980, 80.2000], // Villivakkam
      [13.1020, 80.2250], // Perambur
      [13.0980, 80.2430], // Otteri / Thiru-Vi-Ka Nagar
      [13.0970, 80.2690]  // Basin Bridge Buckingham outfall
    ]
  },
  {
    id: 'drain-mambalam',
    name: 'Mambalam Canal Drainage Cut',
    waterwayType: 'canal',
    coordinates: [
      [13.0480, 80.2200], // T. Nagar Valluvar Kottam
      [13.0418, 80.2341], // Panagal Park
      [13.0320, 80.2300], // CIT Nagar
      [13.0220, 80.2220]  // Saidapet Adyar outfall
    ]
  },
  {
    id: 'drain-veerangal',
    name: 'Veerangal Odai Surplus Channel',
    waterwayType: 'drain',
    coordinates: [
      [12.9882, 80.2115], // Velachery Lake surplus weir
      [12.9780, 80.2200], // Vijayanagar Bus Stand
      [12.9350, 80.2180]  // Pallikaranai Marshland Outfall
    ]
  },
  {
    id: 'drain-virugambakkam',
    name: 'Virugambakkam - Arumbakkam Canal',
    waterwayType: 'canal',
    coordinates: [
      [13.0400, 80.1730], // Valasaravakkam
      [13.0500, 80.1900], // Virugambakkam
      [13.0673, 80.1932], // Koyambedu / Cooum outfall
      [13.0720, 80.2100]  // Arumbakkam
    ]
  }
];

export const MOCK_WATER_BODIES: WaterBody[] = [
  {
    id: 'wb-chembarambakkam',
    name: 'Chembarambakkam Lake & Reservoir (Major Source)',
    category: 'Reservoir',
    waterType: 'reservoir',
    coordinates: [13.0079, 80.0507],
    areaHa: 2550
  },
  {
    id: 'wb-puzhal',
    name: 'Puzhal / Red Hills Reservoir (North Drinking Supply)',
    category: 'Reservoir',
    waterType: 'reservoir',
    coordinates: [13.1649, 80.1631],
    areaHa: 1800
  },
  {
    id: 'wb-porur',
    name: 'Porur Lake (West Chennai Flood Buffer)',
    category: 'Lake',
    waterType: 'lake',
    coordinates: [13.0340, 80.1499],
    areaHa: 200
  },
  {
    id: 'wb-velachery',
    name: 'Velachery Lake (South Low Basin)',
    category: 'Lake',
    waterType: 'lake',
    coordinates: [12.9882, 80.2115],
    areaHa: 55
  },
  {
    id: 'wb-ambattur',
    name: 'Ambattur Lake (Industrial Zone Basin)',
    category: 'Lake',
    waterType: 'lake',
    coordinates: [13.1063, 80.1423],
    areaHa: 160
  },
  {
    id: 'wb-retteri',
    name: 'Retteri Lake (North-West Inner Ring Buffer)',
    category: 'Lake',
    waterType: 'lake',
    coordinates: [13.1407, 80.2106],
    areaHa: 140
  },
  {
    id: 'wb-korattur',
    name: 'Korattur Lake',
    category: 'Lake',
    waterType: 'lake',
    coordinates: [13.1235, 80.1814],
    areaHa: 220
  },
  {
    id: 'wb-chitlapakkam',
    name: 'Chitlapakkam Lake (Tambaram Basin)',
    category: 'Lake',
    waterType: 'lake',
    coordinates: [12.9337, 80.1361],
    areaHa: 45
  },
  {
    id: 'wb-pallikaranai',
    name: 'Pallikaranai Marsh Wetland (Ramsar Site & Central Sink)',
    category: 'Wetland',
    waterType: 'wetland',
    coordinates: [12.9350, 80.2180],
    areaHa: 1200
  }
];

export const MOCK_HISTORICAL_FLOODS: HistoricalFloodPoint[] = [
  {
    id: 'fld-001',
    eventName: 'Cyclone Michaung (Dec 2023)',
    locationName: 'Velachery (Ram Nagar & AGS Colony)',
    severityClass: 'Catastrophic',
    waterLevelM: 1.95,
    rainfall24hMm: 468.0,
    coordinates: [12.9820, 80.2190]
  },
  {
    id: 'fld-002',
    eventName: 'Cyclone Michaung (Dec 2023)',
    locationName: 'Velachery 100-ft Bypass (Phoenix Mall Basin)',
    severityClass: 'Catastrophic',
    waterLevelM: 1.60,
    rainfall24hMm: 468.0,
    coordinates: [12.9910, 80.2170]
  },
  {
    id: 'fld-003',
    eventName: 'Cyclone Michaung (Dec 2023)',
    locationName: 'Pazhavanthangal Railway Subway (Airport)',
    severityClass: 'Catastrophic',
    waterLevelM: 2.30,
    rainfall24hMm: 445.0,
    coordinates: [12.9880, 80.1870]
  },
  {
    id: 'fld-004',
    eventName: 'December 2015 Flood',
    locationName: 'Chennai Airport Runway Culvert Submergence',
    severityClass: 'Catastrophic',
    waterLevelM: 2.40,
    rainfall24hMm: 490.0,
    coordinates: [12.9940, 80.1800]
  },
  {
    id: 'fld-005',
    eventName: 'Cyclone Michaung (Dec 2023)',
    locationName: 'Sholinganallur ELCOT SEZ / Wipro Basin',
    severityClass: 'Severe',
    waterLevelM: 1.65,
    rainfall24hMm: 435.0,
    coordinates: [12.9080, 80.2220]
  },
  {
    id: 'fld-006',
    eventName: 'Cyclone Michaung (Dec 2023)',
    locationName: 'Nungambakkam (Sterling Road / Loyola Subway)',
    severityClass: 'Severe',
    waterLevelM: 1.40,
    rainfall24hMm: 425.0,
    coordinates: [13.0640, 80.2370]
  },
  {
    id: 'fld-007',
    eventName: 'Cyclone Michaung (Dec 2023)',
    locationName: 'Ambattur Pattaravakkam Railway Subway',
    severityClass: 'Catastrophic',
    waterLevelM: 2.10,
    rainfall24hMm: 410.0,
    coordinates: [13.1090, 80.1710]
  },
  {
    id: 'fld-008',
    eventName: 'December 2015 Flood',
    locationName: 'Saidapet Maraimalai Adigal Bridge Inundation',
    severityClass: 'Catastrophic',
    waterLevelM: 2.80,
    rainfall24hMm: 494.0,
    coordinates: [13.0220, 80.2220]
  },
  {
    id: 'fld-009',
    eventName: 'Cyclone Michaung (Dec 2023)',
    locationName: 'Vyasarpadi Ganesapuram Subway',
    severityClass: 'Catastrophic',
    waterLevelM: 2.50,
    rainfall24hMm: 440.0,
    coordinates: [13.1118, 80.2587]
  },
  {
    id: 'fld-010',
    eventName: 'December 2015 Flood',
    locationName: 'Mudichur Basin (Adyar upstream breach)',
    severityClass: 'Catastrophic',
    waterLevelM: 3.10,
    rainfall24hMm: 490.0,
    coordinates: [12.9080, 80.0710]
  }
];

export const BACKGROUND_INTELLIGENCE_METRICS: BackgroundIntelligenceStats = {
  monitoredRoadsCount: 4531,
  drainageChannelsCount: 634,
  waterBodiesCount: 1215,
  historicalFloodEventsCount: 58,
  elevationRangeMsl: '0.5m – 58.0m MSL',
  modelEnsemble: 'Balanced Random Forest + HistGradientBoosting (99.05% ROC-AUC)',
  activeWeatherStationsCount: 6,
  timestamp: new Date().toISOString()
};


export const MOCK_ROAD_SEGMENTS: RoadRiskSegment[] = [
  {
    id: 'R1042',
    code: 'R1042',
    name: 'Velachery Main Road (Vijayanagar Bus Stand section)',
    area: 'Velachery',
    baseRisk: 87,
    currentRisk: 87,
    riskLevel: 'very_high',
    waterDepthCm: 65,
    factors: {
      rainfall: 'High',
      elevation: 'Low',
      elevationDetails: '4.2m MSL (depression basin)',
      drainage: 'Moderate',
      drainageDetails: 'Pallikaranai marsh runoff overflow',
      builtUpArea: 'High',
      builtUpDetails: 'Dense commercial concrete cover (88%)'
    },
    advice: 'Consider an alternate route. Divert via 100ft Elevated Bypass or Inner Ring Road.',
    coordinates: [
      [12.9785, 80.2190],
      [12.9810, 80.2220],
      [12.9840, 80.2255],
      [12.9875, 80.2285],
      [12.9910, 80.2260]
    ]
  },
  {
    id: 'R0871',
    code: 'R0871',
    name: 'Usman Road Subway & Duraisamy Rd Underpass',
    area: 'T. Nagar',
    baseRisk: 82,
    currentRisk: 82,
    riskLevel: 'very_high',
    waterDepthCm: 90,
    factors: {
      rainfall: 'High',
      elevation: 'Low',
      elevationDetails: 'Subway deck 2.1m below road surface',
      drainage: 'Poor',
      drainageDetails: 'Mambalam Canal back-surge',
      builtUpArea: 'High',
      builtUpDetails: 'Intense shopping district footprint'
    },
    advice: 'Subway closed to light vehicular traffic. Use Usman Road Elevated Flyover.',
    coordinates: [
      [13.0370, 80.2330],
      [13.0395, 80.2338],
      [13.0425, 80.2345],
      [13.0450, 80.2352]
    ]
  },
  {
    id: 'R1190',
    code: 'R1190',
    name: 'GST Road Underpass (St. Thomas Mount)',
    area: 'Guindy / St. Thomas Mount',
    baseRisk: 76,
    currentRisk: 76,
    riskLevel: 'high',
    waterDepthCm: 50,
    factors: {
      rainfall: 'High',
      elevation: 'Low',
      elevationDetails: '3.8m MSL natural slope dip',
      drainage: 'Moderate',
      drainageDetails: 'Adyar river channel proximity',
      builtUpArea: 'High',
      builtUpDetails: 'Highway intersection convergence'
    },
    advice: 'Stay on elevated Kathipara Grade Separator flyover spans.',
    coordinates: [
      [13.0030, 80.1980],
      [13.0065, 80.2015],
      [13.0090, 80.2050],
      [13.0115, 80.2085]
    ]
  },
  {
    id: 'R0512',
    code: 'R0512',
    name: 'Madipakkam Lake Link Road',
    area: 'Madipakkam',
    baseRisk: 74,
    currentRisk: 74,
    riskLevel: 'high',
    waterDepthCm: 45,
    factors: {
      rainfall: 'High',
      elevation: 'Low',
      elevationDetails: '3.4m MSL adjacent to lake weir',
      drainage: 'Poor',
      drainageDetails: 'Lake overflow into residential lanes',
      builtUpArea: 'High',
      builtUpDetails: 'Paved residential colony lanes'
    },
    advice: 'Waterlogging across both carriageways. Avoid low chassis sedans.',
    coordinates: [
      [12.9640, 80.1950],
      [12.9675, 80.1995],
      [12.9710, 80.2040],
      [12.9735, 80.2080]
    ]
  },
  {
    id: 'R0304',
    code: 'R0304',
    name: 'Vyasarpadi Gengu Reddy Subway',
    area: 'Vyasarpadi / North Chennai',
    baseRisk: 71,
    currentRisk: 71,
    riskLevel: 'high',
    waterDepthCm: 70,
    factors: {
      rainfall: 'High',
      elevation: 'Low',
      elevationDetails: 'Depressed railway crossing track',
      drainage: 'Poor',
      drainageDetails: 'Otteri Nullah water backup',
      builtUpArea: 'High',
      builtUpDetails: 'Dense northern railway freight hub'
    },
    advice: 'Subway completely barricaded. Traffic diverted to Perambur Bridge.',
    coordinates: [
      [13.1020, 80.2610],
      [13.1045, 80.2635],
      [13.1070, 80.2655]
    ]
  },
  {
    id: 'R0943',
    code: 'R0943',
    name: 'Perumbakkam Link Road & Global Hospital Rd',
    area: 'Perumbakkam / Sholinganallur',
    baseRisk: 68,
    currentRisk: 68,
    riskLevel: 'high',
    waterDepthCm: 35,
    factors: {
      rainfall: 'Moderate',
      elevation: 'Low',
      elevationDetails: '2.9m MSL flat marsh edge',
      drainage: 'Moderate',
      drainageDetails: 'Marsh discharge restriction',
      builtUpArea: 'Moderate',
      builtUpDetails: 'Suburban IT residential clusters'
    },
    advice: 'Ponding in slow lanes. Use central median lanes or OMR main highway.',
    coordinates: [
      [12.9050, 80.1980],
      [12.9090, 80.2050],
      [12.9130, 80.2120],
      [12.9160, 80.2180]
    ]
  },
  {
    id: 'R1420',
    code: 'R1420',
    name: 'Ambattur Industrial Estate 3rd Main Road',
    area: 'Ambattur',
    baseRisk: 65,
    currentRisk: 65,
    riskLevel: 'high',
    waterDepthCm: 30,
    factors: {
      rainfall: 'Moderate',
      elevation: 'Moderate',
      elevationDetails: '7.8m MSL plateau',
      drainage: 'Poor',
      drainageDetails: 'Industrial storm drain blockage',
      builtUpArea: 'High',
      builtUpDetails: 'Heavy manufacturing units footprint'
    },
    advice: 'Heavy vehicle transit only. Two-wheelers advised to take CTH Road.',
    coordinates: [
      [13.1010, 80.1550],
      [13.1040, 80.1600],
      [13.1070, 80.1650],
      [13.1090, 80.1700]
    ]
  },
  {
    id: 'R0115',
    code: 'R0115',
    name: 'Anna Salai (DMS to Saidapet Metro corridor)',
    area: 'Central Chennai',
    baseRisk: 28,
    currentRisk: 28,
    riskLevel: 'low',
    waterDepthCm: 5,
    factors: {
      rainfall: 'Moderate',
      elevation: 'High',
      elevationDetails: '11.5m MSL ridge alignment',
      drainage: 'Adequate',
      drainageDetails: 'Storm drain network newly augmented',
      builtUpArea: 'High',
      builtUpDetails: 'Wide 6-lane paved arterial'
    },
    advice: 'Safe and clear transit corridor. Speed limit 40 km/h in rainfall.',
    coordinates: [
      [13.0410, 80.2450],
      [13.0330, 80.2370],
      [13.0240, 80.2290],
      [13.0150, 80.2210]
    ]
  },
  {
    id: 'R0230',
    code: 'R0230',
    name: 'Poonamallee High Road (Central to Kilpauk)',
    area: 'Kilpauk / Periamet',
    baseRisk: 22,
    currentRisk: 22,
    riskLevel: 'low',
    waterDepthCm: 0,
    factors: {
      rainfall: 'Moderate',
      elevation: 'High',
      elevationDetails: '13.2m MSL natural high ridge',
      drainage: 'Adequate',
      drainageDetails: 'Direct gradient runoff to Cooum',
      builtUpArea: 'High',
      builtUpDetails: 'Hospital & institutional zone'
    },
    advice: 'Primary emergency evacuation corridor. All lanes open and dry.',
    coordinates: [
      [13.0820, 80.2740],
      [13.0800, 80.2600],
      [13.0780, 80.2460],
      [13.0760, 80.2320]
    ]
  }
];

export const MOCK_EMERGENCY_FACILITIES: EmergencyFacility[] = [
  {
    id: 'emg-hospital',
    category: 'hospital',
    name: 'Government General Hospital (Rajiv Gandhi GH)',
    distanceKm: 4.8,
    durationMinutes: 11,
    exposureLevel: 'LOW',
    exposureNote: 'Route via EVR Periyar Salai (Poonamallee High Rd) remains elevated & completely dry.',
    address: 'EVR Periyar Salai, Park Town, Chennai 600003',
    phone: '044-25305000 / 108',
    coordinates: [13.0805, 80.2798],
    operationalStatus: '24/7 Trauma Care Operational • Backup Power Active'
  },
  {
    id: 'emg-fire',
    category: 'fire_station',
    name: 'Egmore Fire & Rescue Operations Command HQ',
    distanceKm: 3.2,
    durationMinutes: 8,
    exposureLevel: 'LOW',
    exposureNote: 'Direct elevated corridor via Pantheon Road with zero waterlogging.',
    address: 'Pantheon Road, Egmore, Chennai 600008',
    phone: '101 / 044-28555101',
    coordinates: [13.0784, 80.2605],
    operationalStatus: 'Flood Rescue Inflatable Boats & Pumping Teams On Standby'
  },
  {
    id: 'emg-police',
    category: 'police',
    name: 'Vepery Commissionerate & Law Enforcement Post',
    distanceKm: 2.7,
    durationMinutes: 7,
    exposureLevel: 'LOW',
    exposureNote: 'EVR Salai and Vepery High Road ridge fully passable for emergency response.',
    address: 'Vepery High Road, Chennai 600007',
    phone: '100 / 044-23452359',
    coordinates: [13.0844, 80.2655],
    operationalStatus: 'Monsoon Traffic Control Room Active (Helpline 103)'
  },
  {
    id: 'emg-shelter',
    category: 'shelter',
    name: 'Ripon Building Community High-Ground Relief Camp',
    distanceKm: 3.9,
    durationMinutes: 9,
    exposureLevel: 'LOW',
    exposureNote: 'Designated GCC dry relief center with medical triage and community kitchen.',
    address: 'Sydenhams Road, Periamet, Chennai 600003',
    phone: '1913 (GCC Toll-Free)',
    coordinates: [13.0827, 80.2755],
    operationalStatus: 'Capacity: 1,200 Persons • Food, Clean Water & First Aid Ready'
  }
];

export const MOCK_ROUTES: RouteOptionData[] = [
  {
    id: 'route-fastest',
    type: 'fastest',
    name: 'Fastest',
    durationMinutes: 29,
    distanceKm: 11.4,
    exposurePercent: 61,
    isRecommended: false,
    segmentsAvoidedCount: 0,
    tagline: 'Direct arterial path through low-lying sectors',
    primaryRoads: ['Usman Road', 'Velachery Main Rd', 'GST Road dip'],
    color: '#ef4444', // red warning
    coordinates: [
      [13.0418, 80.2337], // T. Nagar origin
      [13.0370, 80.2330], // R0871 Usman subway
      [13.0250, 80.2280],
      [13.0100, 80.2200],
      [12.9980, 80.2150],
      [12.9850, 80.2230], // R1042 Velachery
      [12.9922, 80.2173]  // Phoenix / Velachery dest
    ]
  },
  {
    id: 'route-balanced',
    type: 'balanced',
    name: 'Balanced',
    durationMinutes: 34,
    distanceKm: 13.2,
    exposurePercent: 27,
    isRecommended: true,
    segmentsAvoidedCount: 3,
    tagline: '3 high-risk road segments avoided',
    primaryRoads: ['Usman Road Flyover', 'Anna Salai', 'Kathipara Grade Separator'],
    color: '#059669', // calm emerald/navy
    coordinates: [
      [13.0418, 80.2337], // T. Nagar origin
      [13.0400, 80.2400], // Bypass subway via Usman Flyover
      [13.0330, 80.2370], // Anna Salai dry corridor
      [13.0200, 80.2250],
      [13.0080, 80.2070], // Kathipara elevated loop
      [12.9980, 80.2120], // 100ft elevated bypass
      [12.9922, 80.2173]  // Phoenix dest
    ]
  },
  {
    id: 'route-safer',
    type: 'safer',
    name: 'Safer',
    durationMinutes: 39,
    distanceKm: 15.8,
    exposurePercent: 12,
    isRecommended: false,
    segmentsAvoidedCount: 5,
    tagline: 'Elevated flyovers & dry arterial corridors',
    primaryRoads: ['Inner Ring Road Elevated Corridor', 'Poonamallee High Rd', 'Guindy Flyover'],
    color: '#2563eb', // subtle blue
    coordinates: [
      [13.0418, 80.2337], // T. Nagar
      [13.0470, 80.2450],
      [13.0550, 80.2400],
      [13.0600, 80.2200],
      [13.0450, 80.2050], // Inner Ring elevated
      [13.0250, 80.2020],
      [13.0080, 80.2070], // Kathipara top ramp
      [12.9950, 80.2100],
      [12.9922, 80.2173]  // Phoenix dest
    ]
  }
];

export const MOCK_JOURNEY_HISTORY: JourneyHistoryItem[] = [
  {
    id: 'hist-1',
    timestamp: 'Today, 08:30 AM',
    origin: 'T. Nagar (Panagal Park)',
    destination: 'Chennai Central Railway Station',
    routeType: 'balanced',
    durationMinutes: 34,
    exposureAvoidedPercent: 42,
    rainfallAtTime: '150 mm / 6h',
    status: 'completed'
  },
  {
    id: 'hist-2',
    timestamp: 'Yesterday, 07:45 PM',
    origin: 'Guindy Industrial Estate',
    destination: 'Velachery Bypass Road',
    routeType: 'safer',
    durationMinutes: 41,
    exposureAvoidedPercent: 58,
    rainfallAtTime: '190 mm / 6h',
    status: 'completed'
  },
  {
    id: 'hist-3',
    timestamp: '08 Sep, 02:15 PM',
    origin: 'Anna Nagar West',
    destination: 'Apollo Hospital Greams Road',
    routeType: 'fastest',
    durationMinutes: 28,
    exposureAvoidedPercent: 24,
    rainfallAtTime: '80 mm / 6h',
    status: 'completed'
  }
];
