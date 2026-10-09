import React, { useState, useMemo } from 'react';
import {
  TransportMode,
  ChennaiLocationPreset,
  DynamicRouteResult,
  CHENNAI_LOCATION_PRESETS
} from '../utils/floodEngine';
import {
  Car,
  Bike,
  Footprints,
  ShieldAlert,
  ArrowUpDown,
  Search,
  Navigation,
  ShieldCheck,
  AlertTriangle,
  Clock,
  MapPin,
  ChevronDown,
  ChevronUp,
  X,
  CornerDownRight,
  Sparkles,
  Minimize2,
  Maximize2,
  Eye,
  SlidersHorizontal,
  TrendingUp,
  Share2
} from 'lucide-react';

interface GoogleMapsDirectionsCardProps {
  origin: ChennaiLocationPreset;
  destination: ChennaiLocationPreset;
  onSelectOrigin: (location: ChennaiLocationPreset) => void;
  onSelectDestination: (location: ChennaiLocationPreset) => void;
  onSwapLocations: () => void;
  selectedMode: TransportMode;
  onChangeMode: (mode: TransportMode) => void;
  routes: DynamicRouteResult[];
  selectedRoute: DynamicRouteResult | null;
  onSelectRoute: (route: DynamicRouteResult) => void;
  onOpenSimulation: () => void;
  onOpenRankings: () => void;
  rainfallRate: number;
}

// Key popular hubs for one-tap selection
const POPULAR_QUICK_HUBS = [
  'loc-greams-apollo',
  'loc-saidapet-metro',
  'loc-central-station',
  'loc-airport-meenambakkam',
  'loc-omr-sholinganallur',
  'loc-velachery-vijayanagar',
  'loc-marina-kamarajar',
  'loc-anna-nagar-roundtana',
  'loc-miot-ramapuram'
];

export const GoogleMapsDirectionsCard: React.FC<GoogleMapsDirectionsCardProps> = ({
  origin,
  destination,
  onSelectOrigin,
  onSelectDestination,
  onSwapLocations,
  selectedMode,
  onChangeMode,
  routes,
  selectedRoute,
  onSelectRoute,
  onOpenSimulation,
  onOpenRankings,
  rainfallRate
}) => {
  // 'expanded' (full card), 'compact' (slim floating strip), 'pill' (minimal search pill)
  const [displayMode, setDisplayMode] = useState<'expanded' | 'compact' | 'pill'>('compact');
  const [showOriginDropdown, setShowOriginDropdown] = useState(false);
  const [showDestDropdown, setShowDestDropdown] = useState(false);
  const [originSearch, setOriginSearch] = useState('');
  const [destSearch, setDestSearch] = useState('');
  const [showSteps, setShowSteps] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  const activeRoute = selectedRoute || routes[0];

  // Filtered preset lists for instantaneous searching
  const filteredOrigins = useMemo(() => {
    if (!originSearch.trim()) return CHENNAI_LOCATION_PRESETS;
    const query = originSearch.toLowerCase();
    return CHENNAI_LOCATION_PRESETS.filter(
      (loc) =>
        loc.name.toLowerCase().includes(query) ||
        loc.area.toLowerCase().includes(query) ||
        loc.shortName.toLowerCase().includes(query)
    );
  }, [originSearch]);

  const filteredDests = useMemo(() => {
    if (!destSearch.trim()) return CHENNAI_LOCATION_PRESETS;
    const query = destSearch.toLowerCase();
    return CHENNAI_LOCATION_PRESETS.filter(
      (loc) =>
        loc.name.toLowerCase().includes(query) ||
        loc.area.toLowerCase().includes(query) ||
        loc.shortName.toLowerCase().includes(query)
    );
  }, [destSearch]);

  // Quick preset items
  const popularPresets = useMemo(() => {
    return CHENNAI_LOCATION_PRESETS.filter((p) => POPULAR_QUICK_HUBS.includes(p.id));
  }, []);

  // ----------------------------------------------------
  // 1. MINIMAL PILL MODE: Takes < 40px, full map unobstructed
  // ----------------------------------------------------
  if (displayMode === 'pill') {
    return (
      <div className="absolute top-3 left-3 z-30 flex items-center gap-2 pointer-events-auto animate-fade-in">
        <button
          id="btn-show-directions-pill"
          onClick={() => setDisplayMode('compact')}
          className="h-10 px-3.5 rounded-full bg-white/95 dark:bg-slate-900/95 hover:bg-white dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-xl border border-slate-200/90 dark:border-slate-800 text-xs font-semibold flex items-center gap-2.5 transition cursor-pointer backdrop-blur-md group"
          title="Open Directions & Safe Corridors"
        >
          <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-extrabold shadow-sm">
            G
          </div>
          <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
            <Navigation className="w-3.5 h-3.5 text-blue-600" />
            <span>{activeRoute ? `${activeRoute.durationMinutes} min • ${activeRoute.summaryVia}` : 'Directions'}</span>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            {activeRoute ? `${activeRoute.safetyScorePercent}% Safe` : 'Route'}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 transition" />
        </button>

        <button
          id="btn-pill-change-route"
          onClick={() => setDisplayMode('expanded')}
          className="h-10 px-3 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-xl flex items-center gap-1.5 transition cursor-pointer"
          title="Plan or Search Routes"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Change Route</span>
        </button>
      </div>
    );
  }

  // ----------------------------------------------------
  // 2. COMPACT FLOATING STRIP: Sleek, minimalistic, maps-native
  // ----------------------------------------------------
  if (displayMode === 'compact') {
    return (
      <aside
        id="google-maps-directions-compact"
        aria-label="Route Summary"
        className="absolute top-3 left-3 z-30 max-w-[calc(100%-24px)] sm:max-w-[440px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/90 dark:border-slate-800 text-slate-800 dark:text-slate-100 overflow-hidden font-sans transition-all animate-fade-in pointer-events-auto"
      >
        <div className="p-2.5 flex items-center justify-between gap-2.5">
          {/* Active Route Quick Stats */}
          <div
            onClick={() => setDisplayMode('expanded')}
            className="flex-1 min-w-0 flex items-center gap-2.5 cursor-pointer group"
            title="Click to view alternate routes & guidance"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm shrink-0 border border-blue-200/80 dark:border-blue-900">
              {selectedMode === 'drive' ? (
                <Car className="w-4 h-4" />
              ) : selectedMode === 'bike' ? (
                <Bike className="w-4 h-4" />
              ) : selectedMode === 'walk' ? (
                <Footprints className="w-4 h-4" />
              ) : (
                <ShieldAlert className="w-4 h-4 text-rose-500" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                  {activeRoute?.durationMinutes || 9} min
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  ({activeRoute?.distanceKm || 8.7} km)
                </span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                    activeRoute?.isSafest
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  }`}
                >
                  {activeRoute?.safetyScorePercent || 99}% Safe
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 truncate font-medium">
                {activeRoute?.summaryVia || `${origin.shortName} → ${destination.shortName}`}
              </p>
            </div>
          </div>

          {/* Action Buttons: Expand & Minimize to Pill */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              id="btn-compact-expand"
              onClick={() => setDisplayMode('expanded')}
              className="px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1 transition shadow-xs cursor-pointer"
              title="Expand route details & inputs"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Details</span>
            </button>

            <button
              id="btn-compact-minimize"
              onClick={() => setDisplayMode('pill')}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Minimize to floating pill"
            >
              <Minimize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Origin & Destination Bar */}
        <div className="px-3 py-1.5 bg-slate-50/90 dark:bg-slate-950/70 border-t border-slate-200/70 dark:border-slate-800 text-[11px] flex items-center justify-between text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-1.5 truncate">
            <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0"></span>
            <span className="truncate max-w-[130px] font-medium text-slate-800 dark:text-slate-200">
              {origin.name}
            </span>
            <span className="text-slate-400 font-bold">→</span>
            <span className="w-2 h-2 rounded-full bg-red-600 shrink-0"></span>
            <span className="truncate max-w-[130px] font-medium text-slate-800 dark:text-slate-200">
              {destination.name}
            </span>
          </div>

          <div className="flex items-center gap-1 ml-2">
            <button
              onClick={onSwapLocations}
              title="Swap Start & Destination"
              className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <ArrowUpDown className="w-3 h-3" />
            </button>
            <button
              onClick={() => setDisplayMode('expanded')}
              className="text-[11px] text-blue-600 dark:text-blue-400 font-bold hover:underline shrink-0"
            >
              Edit
            </button>
          </div>
        </div>
      </aside>
    );
  }

  // ----------------------------------------------------
  // 3. EXPANDED PLANNING MODE: Minimalist & Clean
  // ----------------------------------------------------
  return (
    <aside
      id="google-maps-directions-card"
      aria-label="Route Planning & Navigation"
      className="absolute top-3 left-3 z-30 w-[calc(100%-24px)] sm:w-[380px] max-h-[calc(100vh-24px)] flex flex-col bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-800 text-slate-800 dark:text-slate-100 overflow-hidden font-sans transition-all animate-fade-in pointer-events-auto"
    >
      {/* 1. Header & Transport Mode Selector */}
      <div className="p-3 pb-2.5 bg-slate-50/90 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-black shadow-sm">
              G
            </div>
            <div>
              <span className="font-bold text-xs text-slate-900 dark:text-white tracking-tight">
                Chennai Flood Navigator
              </span>
              <span className="ml-1.5 text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                Safe Route
              </span>
            </div>
          </div>

          {/* Quick minimize / hide controls so map is NEVER trapped */}
          <div className="flex items-center gap-1">
            <button
              id="btn-collapse-directions"
              onClick={() => setDisplayMode('compact')}
              title="Minimize panel to view map"
              className="px-2 py-1 rounded-lg bg-slate-200/70 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span>Minimize</span>
            </button>

            <button
              id="btn-hide-directions"
              onClick={() => setDisplayMode('pill')}
              title="Hide panel to see full map"
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Transport Modes (Drive, Bike, Walk, Emergency) */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-slate-200/70 dark:bg-slate-800/80 rounded-xl">
          <button
            onClick={() => onChangeMode('drive')}
            className={`py-1.5 rounded-lg flex items-center justify-center gap-1 text-xs font-semibold transition cursor-pointer ${
              selectedMode === 'drive'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Car className="w-3.5 h-3.5" />
            <span>Drive</span>
          </button>

          <button
            onClick={() => onChangeMode('bike')}
            className={`py-1.5 rounded-lg flex items-center justify-center gap-1 text-xs font-semibold transition cursor-pointer ${
              selectedMode === 'bike'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Bike className="w-3.5 h-3.5" />
            <span>Bike</span>
          </button>

          <button
            onClick={() => onChangeMode('walk')}
            className={`py-1.5 rounded-lg flex items-center justify-center gap-1 text-xs font-semibold transition cursor-pointer ${
              selectedMode === 'walk'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Footprints className="w-3.5 h-3.5" />
            <span>Walk</span>
          </button>

          <button
            onClick={() => onChangeMode('emergency')}
            className={`py-1.5 rounded-lg flex items-center justify-center gap-1 text-xs font-semibold transition cursor-pointer ${
              selectedMode === 'emergency'
                ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-sm font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Rescue</span>
          </button>
        </div>
      </div>

      {/* 2. Minimalist Location Selector with Instant Search */}
      <div className="p-3 space-y-2 relative border-b border-slate-200 dark:border-slate-800">
        {/* Origin Row */}
        <div className="relative">
          <div className="flex items-center gap-2">
            <div className="w-5 flex justify-center">
              <div className="w-3 h-3 rounded-full border-[2.5px] border-blue-600 bg-white shadow-xs"></div>
            </div>
            <div
              onClick={() => {
                setShowOriginDropdown(!showOriginDropdown);
                setShowDestDropdown(false);
              }}
              className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 cursor-pointer flex items-center justify-between transition"
            >
              <span className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                {origin.name}
              </span>
              <span className="text-[10px] text-slate-400 shrink-0 ml-1 font-medium">
                {origin.elevationMsl}m MSL
              </span>
            </div>
          </div>

          {/* Searchable Origin Dropdown */}
          {showOriginDropdown && (
            <div className="absolute top-full left-7 right-0 mt-1 z-40 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 max-h-60 overflow-hidden flex flex-col animate-fade-in">
              <div className="p-2 border-b border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search origin in Chennai..."
                  value={originSearch}
                  onChange={(e) => setOriginSearch(e.target.value)}
                  className="w-full text-xs bg-transparent outline-none text-slate-800 dark:text-slate-100 placeholder-slate-400"
                  autoFocus
                />
                {originSearch && (
                  <button onClick={() => setOriginSearch('')} className="p-0.5 text-slate-400">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/60 max-h-48">
                {filteredOrigins.map((loc) => (
                  <div
                    key={loc.id}
                    onClick={() => {
                      onSelectOrigin(loc);
                      setShowOriginDropdown(false);
                      setOriginSearch('');
                    }}
                    className={`p-2.5 text-xs hover:bg-sky-50 dark:hover:bg-slate-700/80 cursor-pointer flex items-center justify-between ${
                      loc.id === origin.id ? 'bg-sky-50 dark:bg-slate-700 font-bold text-blue-600' : ''
                    }`}
                  >
                    <div>
                      <div className="font-medium text-slate-800 dark:text-slate-100">{loc.name}</div>
                      <div className="text-[10px] text-slate-400">{loc.area}</div>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded">
                      {loc.elevationMsl}m MSL
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick Swap Control */}
        <div className="flex items-center justify-between -my-1 pl-2.5 pr-1">
          <div className="w-5 flex justify-center">
            <div className="w-0.5 h-3 bg-slate-300 dark:bg-slate-700"></div>
          </div>
          <button
            onClick={onSwapLocations}
            title="Swap Origin & Destination"
            className="p-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition border border-slate-200 dark:border-slate-700 cursor-pointer"
          >
            <ArrowUpDown className="w-3 h-3" />
          </button>
        </div>

        {/* Destination Row */}
        <div className="relative">
          <div className="flex items-center gap-2">
            <div className="w-5 flex justify-center">
              <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0 fill-red-500" />
            </div>
            <div
              onClick={() => {
                setShowDestDropdown(!showDestDropdown);
                setShowOriginDropdown(false);
              }}
              className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 cursor-pointer flex items-center justify-between transition"
            >
              <span className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                {destination.name}
              </span>
              <span className="text-[10px] text-slate-400 shrink-0 ml-1 font-medium">
                {destination.elevationMsl}m MSL
              </span>
            </div>
          </div>

          {/* Searchable Destination Dropdown */}
          {showDestDropdown && (
            <div className="absolute top-full left-7 right-0 mt-1 z-40 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 max-h-60 overflow-hidden flex flex-col animate-fade-in">
              <div className="p-2 border-b border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search destination in Chennai..."
                  value={destSearch}
                  onChange={(e) => setDestSearch(e.target.value)}
                  className="w-full text-xs bg-transparent outline-none text-slate-800 dark:text-slate-100 placeholder-slate-400"
                  autoFocus
                />
                {destSearch && (
                  <button onClick={() => setDestSearch('')} className="p-0.5 text-slate-400">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/60 max-h-48">
                {filteredDests.map((loc) => (
                  <div
                    key={loc.id}
                    onClick={() => {
                      onSelectDestination(loc);
                      setShowDestDropdown(false);
                      setDestSearch('');
                    }}
                    className={`p-2.5 text-xs hover:bg-sky-50 dark:hover:bg-slate-700/80 cursor-pointer flex items-center justify-between ${
                      loc.id === destination.id ? 'bg-sky-50 dark:bg-slate-700 font-bold text-red-600' : ''
                    }`}
                  >
                    <div>
                      <div className="font-medium text-slate-800 dark:text-slate-100">{loc.name}</div>
                      <div className="text-[10px] text-slate-400">{loc.area}</div>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded">
                      {loc.elevationMsl}m MSL
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 1-Tap Popular Location Chips */}
        <div className="pt-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0">Quick:</span>
          {popularPresets.map((loc) => (
            <button
              key={loc.id}
              onClick={() => onSelectDestination(loc)}
              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap transition border shrink-0 ${
                destination.id === loc.id
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
              }`}
            >
              {loc.shortName}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Suggested Routes (Minimalist cards) */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 divide-y divide-slate-100 dark:divide-slate-800/80">
        <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400 pt-0.5">
          <span>Suggested Routes</span>
          <button
            onClick={() => setDisplayMode('compact')}
            className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold text-[11px]"
          >
            <Eye className="w-3 h-3" />
            <span>View on Map</span>
          </button>
        </div>

        {routes.map((route) => {
          const isSelected = activeRoute?.id === route.id;
          const isPassableForMode = route.passableForSelectedMode;

          return (
            <div
              key={route.id}
              onClick={() => onSelectRoute(route)}
              className={`pt-2.5 first:pt-0 rounded-xl p-3 transition border cursor-pointer ${
                isSelected
                  ? 'bg-blue-50/80 dark:bg-blue-950/30 border-blue-500 shadow-md shadow-blue-500/10'
                  : 'bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 border-slate-200 dark:border-slate-800'
              }`}
            >
              {/* Route Header */}
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                    route.isSafest
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                      : !isPassableForMode
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                      : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {route.isSafest ? (
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  ) : !isPassableForMode ? (
                    <AlertTriangle className="w-3 h-3 text-rose-500" />
                  ) : (
                    <Clock className="w-3 h-3 text-slate-500" />
                  )}
                  {route.recommendationTag}
                </span>

                <div className="text-right">
                  <span className="text-base font-extrabold text-slate-900 dark:text-white">
                    {route.durationMinutes} min
                  </span>
                  <span className="text-xs text-slate-400 ml-1.5 font-medium">
                    ({route.distanceKm} km)
                  </span>
                </div>
              </div>

              {/* Corridor */}
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                <span className="truncate">{route.summaryVia}</span>
              </div>

              {/* Hydro Metrics */}
              <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/60 text-[11px]">
                <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                  <span>Max Water:</span>
                  <strong
                    className={
                      route.maxWaterDepthCm > 35
                        ? 'text-rose-600 dark:text-rose-400 font-bold'
                        : route.maxWaterDepthCm > 12
                        ? 'text-amber-600 dark:text-amber-400 font-bold'
                        : 'text-emerald-600 dark:text-emerald-400 font-bold'
                    }
                  >
                    {route.maxWaterDepthCm} cm
                  </strong>
                </div>

                <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                  <span>Safety Score:</span>
                  <strong
                    className={
                      route.safetyScorePercent >= 80
                        ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                        : route.safetyScorePercent >= 50
                        ? 'text-amber-600 dark:text-amber-400 font-bold'
                        : 'text-rose-600 dark:text-rose-400 font-bold'
                    }
                  >
                    {route.safetyScorePercent}%
                  </strong>
                </div>
              </div>

              {!isPassableForMode && (
                <div className="mt-2 p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-[10px] text-rose-700 dark:text-rose-300 flex items-center gap-1.5 font-medium">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span>Water depth exceeds safe threshold for {selectedMode}!</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 4. Action Bar (Start Navigation & View Map) */}
      {activeRoute && (
        <div className="p-3 bg-slate-50/90 dark:bg-slate-950/70 border-t border-slate-200 dark:border-slate-800 space-y-2 shrink-0">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowSteps(!showSteps)}
              className="text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 flex items-center gap-1 transition cursor-pointer"
            >
              <span>Steps & Elevation</span>
              {showSteps ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setDisplayMode('compact')}
                className="px-2.5 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                title="View on Map"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Map</span>
              </button>

              <button
                onClick={() => {
                  setIsNavigating(true);
                  setDisplayMode('compact');
                }}
                className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-md shadow-blue-500/20 cursor-pointer"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Start</span>
              </button>
            </div>
          </div>

          {/* Turn-by-Turn Steps Accordion */}
          {showSteps && (
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2 animate-fade-in text-xs max-h-44 overflow-y-auto">
              <div className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                Turn-by-Turn Guidance ({activeRoute.steps.length} steps)
              </div>
              <div className="space-y-1.5 divide-y divide-slate-200/50 dark:divide-slate-800/50">
                {activeRoute.steps.map((step, sIdx) => (
                  <div key={sIdx} className="pt-1.5 first:pt-0 flex items-start gap-2 text-[11px]">
                    <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold shrink-0 mt-0.5">
                      <CornerDownRight className="w-3 h-3" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {step.instruction}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {step.distanceMeters}m • {step.elevationM}m MSL
                      </div>
                      {step.hazardWarning && (
                        <div className="text-[10px] text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1 mt-0.5">
                          <AlertTriangle className="w-3 h-3" />
                          {step.hazardWarning}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. Navigation HUD when active */}
      {isNavigating && activeRoute && (
        <div className="p-2.5 bg-blue-600 text-white flex items-center justify-between shadow-inner animate-fade-in shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-full bg-white text-blue-600 flex items-center justify-center font-bold shrink-0">
              <CornerDownRight className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <div className="text-[9px] uppercase font-bold text-blue-100">
                Active Safe Corridor
              </div>
              <div className="font-bold text-xs truncate">
                {activeRoute.steps[1]?.instruction || 'Proceed on safe corridor'}
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsNavigating(false)}
            className="px-2 py-1 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shrink-0 cursor-pointer"
          >
            Exit
          </button>
        </div>
      )}
    </aside>
  );
};
