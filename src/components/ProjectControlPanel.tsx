import React, { useState, useMemo } from 'react';
import {
  TransportMode,
  ChennaiLocationPreset,
  DynamicRouteResult,
  DynamicRoadSegment,
  CHENNAI_LOCATION_PRESETS
} from '../utils/floodEngine';
import {
  Navigation,
  Car,
  Bike,
  Footprints,
  ShieldAlert,
  ArrowUpDown,
  Search,
  ChevronLeft,
  Play,
  TrendingUp,
  X,
  ShieldCheck,
  Compass,
  Sparkles,
  CloudRain,
  PhoneCall,
  AlertTriangle,
  Waves,
  Radio
} from 'lucide-react';

interface ProjectControlPanelProps {
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
  onStartDrive: () => void;
  rankedRoads: DynamicRoadSegment[];
  onFocusRoadOnMap: (road: DynamicRoadSegment) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onOpenAIAssistant?: () => void;
  onOpenHydrology?: () => void;
  onOpenEmergency?: () => void;
  onOpenIncident?: () => void;
  onOpenSubwaySensors?: () => void;
}

export const ProjectControlPanel: React.FC<ProjectControlPanelProps> = ({
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
  onStartDrive,
  rankedRoads,
  onFocusRoadOnMap,
  isCollapsed,
  onToggleCollapse,
  onOpenAIAssistant,
  onOpenHydrology,
  onOpenEmergency,
  onOpenIncident,
  onOpenSubwaySensors
}) => {
  const [showOriginDropdown, setShowOriginDropdown] = useState(false);
  const [showDestDropdown, setShowDestDropdown] = useState(false);
  const [originSearch, setOriginSearch] = useState('');
  const [destSearch, setDestSearch] = useState('');

  // "More" Road Disruption Rankings Modal
  const [showMoreRankings, setShowMoreRankings] = useState(false);
  const [rankingSearch, setRankingSearch] = useState('');
  const [rankingFilter, setRankingFilter] = useState<'all' | 'high_risk' | 'safe'>('all');

  // Top 3 suggested alternative routes only
  const top3Routes = useMemo(() => routes.slice(0, 3), [routes]);
  const activeRoute = selectedRoute || top3Routes[0] || routes[0];

  // Filtered preset locations
  const filteredOrigins = useMemo(() => {
    if (!originSearch.trim()) return CHENNAI_LOCATION_PRESETS;
    const q = originSearch.toLowerCase();
    return CHENNAI_LOCATION_PRESETS.filter(
      (l) => l.name.toLowerCase().includes(q) || l.area.toLowerCase().includes(q) || l.shortName.toLowerCase().includes(q)
    );
  }, [originSearch]);

  const filteredDests = useMemo(() => {
    if (!destSearch.trim()) return CHENNAI_LOCATION_PRESETS;
    const q = destSearch.toLowerCase();
    return CHENNAI_LOCATION_PRESETS.filter(
      (l) => l.name.toLowerCase().includes(q) || l.area.toLowerCase().includes(q) || l.shortName.toLowerCase().includes(q)
    );
  }, [destSearch]);

  // Filtered roads for "More" modal
  const filteredRoads = useMemo(() => {
    return rankedRoads.filter((road) => {
      if (rankingSearch.trim()) {
        const q = rankingSearch.toLowerCase();
        if (!road.name.toLowerCase().includes(q) && !road.roadType.toLowerCase().includes(q)) {
          return false;
        }
      }
      if (rankingFilter === 'high_risk') {
        return road.riskLevel === 'critical' || road.riskLevel === 'high' || road.expectedDepthCm >= 25;
      }
      if (rankingFilter === 'safe') {
        return road.expectedDepthCm < 15;
      }
      return true;
    });
  }, [rankedRoads, rankingSearch, rankingFilter]);

  if (isCollapsed) {
    return (
      <div className="absolute top-4 left-4 z-30 flex flex-col items-center gap-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-2 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xl pointer-events-auto transition">
        <button
          onClick={onToggleCollapse}
          title="Open Routes Panel"
          className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center hover:bg-blue-500 shadow-md cursor-pointer transition"
        >
          <Navigation className="w-5 h-5" />
        </button>
        <button
          onClick={onStartDrive}
          title="Start Drive"
          className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-500 shadow-md cursor-pointer transition"
        >
          <Play className="w-4 h-4 fill-white" />
        </button>
      </div>
    );
  }

  return (
    <>
      <div
        id="google-maps-style-sidebar"
        className="absolute top-4 left-4 z-30 w-[calc(100vw-32px)] sm:w-95 max-h-[calc(100vh-32px)] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden text-slate-800 dark:text-slate-100 transition pointer-events-auto"
      >
        {/* Clean Sidebar Header */}
        <div className="px-4 py-2.5 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-950/60">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></div>
            <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
              Safe Routes
            </span>
          </div>
          <button
            onClick={onToggleCollapse}
            title="Collapse"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form & Routes */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {/* Location Picker (Your Location & Destination) */}
          <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/60 space-y-2">
            {/* Origin */}
            <div className="relative">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-600 border-2 border-white shadow-xs shrink-0"></div>
                <div
                  onClick={() => {
                    setShowOriginDropdown(!showOriginDropdown);
                    setShowDestDropdown(false);
                  }}
                  className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between cursor-pointer hover:border-blue-500 transition"
                >
                  <span className="truncate">{origin.shortName || origin.name}</span>
                  <span className="text-[10px] text-slate-400 ml-1 shrink-0">{origin.elevationMsl}m MSL</span>
                </div>
              </div>

              {showOriginDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-2 z-50 max-h-52 overflow-y-auto">
                  <input
                    type="text"
                    placeholder="Search start location..."
                    value={originSearch}
                    onChange={(e) => setOriginSearch(e.target.value)}
                    className="w-full px-2.5 py-1 text-xs rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 mb-2"
                    autoFocus
                  />
                  <div className="space-y-1">
                    {filteredOrigins.map((loc) => (
                      <div
                        key={loc.id}
                        onClick={() => {
                          onSelectOrigin(loc);
                          setShowOriginDropdown(false);
                        }}
                        className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/40 text-xs cursor-pointer flex items-center justify-between"
                      >
                        <span className="font-semibold truncate">{loc.name}</span>
                        <span className="text-[10px] text-slate-400 ml-1 shrink-0">{loc.elevationMsl}m</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Divider + Swap */}
            <div className="flex items-center justify-between pl-5 pr-2 -my-1">
              <div className="h-3 w-0.5 bg-slate-300 dark:bg-slate-700 ml-0.5"></div>
              <button
                onClick={onSwapLocations}
                title="Swap Start & Destination"
                className="p-1 rounded-full text-slate-400 hover:text-blue-600 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Destination */}
            <div className="relative">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-600 border-2 border-white shadow-xs shrink-0"></div>
                <div
                  onClick={() => {
                    setShowDestDropdown(!showDestDropdown);
                    setShowOriginDropdown(false);
                  }}
                  className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between cursor-pointer hover:border-rose-500 transition"
                >
                  <span className="truncate">{destination.shortName || destination.name}</span>
                  <span className="text-[10px] text-slate-400 ml-1 shrink-0">{destination.elevationMsl}m MSL</span>
                </div>
              </div>

              {showDestDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-2 z-50 max-h-52 overflow-y-auto">
                  <input
                    type="text"
                    placeholder="Search destination..."
                    value={destSearch}
                    onChange={(e) => setDestSearch(e.target.value)}
                    className="w-full px-2.5 py-1 text-xs rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 mb-2"
                    autoFocus
                  />
                  <div className="space-y-1">
                    {filteredDests.map((loc) => (
                      <div
                        key={loc.id}
                        onClick={() => {
                          onSelectDestination(loc);
                          setShowDestDropdown(false);
                        }}
                        className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs cursor-pointer flex items-center justify-between"
                      >
                        <span className="font-semibold truncate">{loc.name}</span>
                        <span className="text-[10px] text-slate-400 ml-1 shrink-0">{loc.elevationMsl}m</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mode Selector */}
          <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-800/70 p-1 rounded-xl">
            {[
              { id: 'drive', label: 'Car', icon: Car },
              { id: 'bike', label: 'Bike', icon: Bike },
              { id: 'walk', label: 'Walk', icon: Footprints },
              { id: 'emergency', label: '4x4', icon: ShieldAlert }
            ].map((mode) => {
              const Icon = mode.icon;
              const isSelected = selectedMode === mode.id;
              return (
                <button
                  key={mode.id}
                  onClick={() => onChangeMode(mode.id as TransportMode)}
                  className={`flex-1 py-1 px-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition cursor-pointer ${
                    isSelected
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{mode.label}</span>
                </button>
              );
            })}
          </div>

          {/* Direct START NAVIGATION Button */}
          <button
            id="btn-start-drive"
            onClick={onStartDrive}
            className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 active:scale-[0.98] transition cursor-pointer"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>START NAVIGATION (DRIVE)</span>
          </button>

          {/* TOP 3 SHORT, DIRECT ALTERNATE ROUTES */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between text-xs font-black text-slate-500 uppercase tracking-wide">
              <span>Alternative Routes (Top 3)</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">Auto Picked</span>
            </div>

            {top3Routes.map((route) => {
              const isSelected = activeRoute?.id === route.id;
              const isSafest = route.isSafest;
              const isSubmerged = route.maxWaterDepthCm > 35;

              return (
                <div
                  key={route.id}
                  onClick={() => onSelectRoute(route)}
                  className={`p-2.5 rounded-xl border transition cursor-pointer ${
                    isSelected
                      ? isSafest
                        ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-500 shadow-md ring-2 ring-emerald-500/30'
                        : 'bg-blue-50/90 dark:bg-blue-950/40 border-blue-500 shadow-md ring-2 ring-blue-500/30'
                      : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                          {route.title}
                        </span>
                        {isSafest && (
                          <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-600 text-white">
                            BEST & SAFEST
                          </span>
                        )}
                        {isSubmerged && (
                          <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-rose-600 text-white">
                            SUBMERGED
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate mt-0.5">
                        via {route.summaryVia}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-sm font-black text-slate-900 dark:text-white">
                        {route.durationMinutes} min
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {route.distanceKm} km
                      </div>
                    </div>
                  </div>

                  {/* Short & direct flood vs elevation facts */}
                  <div className="mt-2 pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[11px]">
                    <span className="font-bold flex items-center gap-1">
                      Water:
                      <strong className={route.maxWaterDepthCm === 0 ? 'text-emerald-600' : route.maxWaterDepthCm < 25 ? 'text-amber-600' : 'text-rose-600'}>
                        {route.maxWaterDepthCm === 0 ? '0cm (Dry)' : `${route.maxWaterDepthCm}cm`}
                      </strong>
                    </span>
                    <span className="text-slate-500">
                      Elev: <strong className="text-slate-800 dark:text-slate-200">{route.avgElevationMsl}m</strong>
                    </span>
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">
                      {isSelected ? '✓ Picked' : 'Select'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* MORE ROAD DISRUPTIONS RANKING TRIGGER */}
          <div className="pt-1">
            <button
              onClick={() => setShowMoreRankings(true)}
              className="w-full py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-extrabold flex items-center justify-between transition cursor-pointer border border-slate-200 dark:border-slate-700"
            >
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-500" />
                <span>More: Road Disruption Rankings ({rankedRoads.length})</span>
              </div>
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold">Open &gt;</span>
            </button>
          </div>

          {/* CHENNAI FLOOD AI TACTICAL ASSISTANT TRIGGER */}
          {onOpenAIAssistant && (
            <div className="pt-1">
              <button
                id="btn-open-ai-assistant"
                onClick={onOpenAIAssistant}
                className="w-full py-2.5 px-3 rounded-xl bg-linear-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-xs font-black flex items-center justify-between shadow-lg shadow-blue-500/20 active:scale-[0.98] transition cursor-pointer border border-blue-400/30"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-200 animate-pulse" />
                  <span>Chennai Flood AI Assistant</span>
                </div>
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-md font-bold">Ask AI &gt;</span>
              </button>
            </div>
          )}

          {/* QUICK FLOOD TOOLS ROW (HYDROLOGY, SUBWAYS, HELPLINES, SOS) */}
          <div className="pt-1 grid grid-cols-4 gap-1.5">
            {onOpenHydrology && (
              <button
                onClick={onOpenHydrology}
                title="Rainfall & Lake Surge Simulator"
                className="py-1.5 px-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold flex flex-col items-center justify-center gap-1 border border-slate-200/80 dark:border-slate-700/80 transition cursor-pointer"
              >
                <CloudRain className="w-3.5 h-3.5 text-blue-500" />
                <span className="truncate">Hydro</span>
              </button>
            )}
            {onOpenSubwaySensors && (
              <button
                onClick={onOpenSubwaySensors}
                title="Subway IoT Ultrasonic Depth Telemetry"
                className="py-1.5 px-1 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 text-[10px] font-bold flex flex-col items-center justify-center gap-1 border border-rose-200 dark:border-rose-900/60 transition cursor-pointer"
              >
                <Radio className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                <span className="truncate">Subways</span>
              </button>
            )}
            {onOpenEmergency && (
              <button
                onClick={onOpenEmergency}
                title="Emergency Helplines (GCC 1913, 1070)"
                className="py-1.5 px-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold flex flex-col items-center justify-center gap-1 border border-slate-200/80 dark:border-slate-700/80 transition cursor-pointer"
              >
                <PhoneCall className="w-3.5 h-3.5 text-emerald-500" />
                <span className="truncate">Helpline</span>
              </button>
            )}
            {onOpenIncident && (
              <button
                onClick={onOpenIncident}
                title="Report Field Flood Incident / SOS"
                className="py-1.5 px-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold flex flex-col items-center justify-center gap-1 border border-slate-200/80 dark:border-slate-700/80 transition cursor-pointer"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                <span className="truncate">SOS</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* "MORE" MODAL: ROAD DISRUPTION RANKINGS (SHORT & DIRECT TO POINT) */}
      {showMoreRankings && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full max-h-[85vh] border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-scale-in">
            {/* Modal Header */}
            <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-amber-500" />
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                  Road Disruption Rankings
                </h3>
              </div>
              <button
                onClick={() => setShowMoreRankings(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter toolbar */}
            <div className="p-3 border-b border-slate-200 dark:border-slate-800 space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search road or subway name..."
                  value={rankingSearch}
                  onChange={(e) => setRankingSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div className="flex items-center gap-2 text-xs">
                <button
                  onClick={() => setRankingFilter('all')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                    rankingFilter === 'all'
                      ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  All ({rankedRoads.length})
                </button>
                <button
                  onClick={() => setRankingFilter('high_risk')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                    rankingFilter === 'high_risk'
                      ? 'bg-rose-600 text-white'
                      : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                  }`}
                >
                  🔴 High Risk / Flooded
                </button>
                <button
                  onClick={() => setRankingFilter('safe')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                    rankingFilter === 'safe'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                  }`}
                >
                  🟢 Safe Passable
                </button>
              </div>
            </div>

            {/* Short & Direct Road Rankings List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {filteredRoads.map((road) => {
                const rankNum = rankedRoads.indexOf(road) + 1;
                const isFlooded = road.expectedDepthCm >= 30;

                return (
                  <div
                    key={road.id}
                    onClick={() => {
                      onFocusRoadOnMap(road);
                      setShowMoreRankings(false);
                    }}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between gap-2 cursor-pointer transition"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[10px] shrink-0 ${
                          rankNum <= 3
                            ? 'bg-rose-600 text-white'
                            : rankNum <= 7
                            ? 'bg-amber-600 text-white'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        #{rankNum}
                      </span>
                      <div className="min-w-0">
                        <div className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                          {road.name}
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-2">
                          <span>Elev: {road.elevationMsl}m MSL</span>
                          <span>·</span>
                          <span>Drain: {road.swdCapacityMmHr} mm/h</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div
                        className={`text-xs font-black ${
                          isFlooded
                            ? 'text-rose-600 dark:text-rose-400'
                            : road.expectedDepthCm > 10
                            ? 'text-amber-600'
                            : 'text-emerald-600'
                        }`}
                      >
                        {road.expectedDepthCm === 0 ? 'Dry (0cm)' : `${road.expectedDepthCm}cm`}
                      </div>
                      <div className="text-[9px] font-bold uppercase text-slate-400">
                        {road.expectedDepthCm >= 40 ? '⛔ BLOCKED' : road.expectedDepthCm >= 20 ? '⚠️ CAUTION' : '✅ SAFE'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-end">
              <button
                onClick={() => setShowMoreRankings(false)}
                className="px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 font-bold text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
