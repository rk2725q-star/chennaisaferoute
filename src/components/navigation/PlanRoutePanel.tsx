import React, { useState } from 'react';
import {
  MapPin,
  ArrowRight,
  Check,
  SlidersHorizontal,
  ArrowUpDown,
  Crosshair,
  Navigation,
  Info,
  Droplets,
  AlertTriangle,
  Clock,
  ShieldCheck,
  TrendingUp,
  X
} from 'lucide-react';
import { RoutePreference, RouteOptionData, PlaceSuggestion, TransportMode } from '../../types/navigation';
import { searchChennaiPlaces } from '../../services/routeService';
import { ChennaiForecastResponse } from '../../types/weather';
import { TransportModeSelector, TRANSPORT_MODES } from './TransportModeSelector';

interface PlanRoutePanelProps {
  origin: string;
  setOrigin: (val: string) => void;
  destination: string;
  setDestination: (val: string) => void;
  rainfallMm: number;
  setRainfallMm: (val: number) => void;
  preference: RoutePreference;
  setPreference: (val: RoutePreference) => void;
  selectedMode?: TransportMode;
  onSelectMode?: (mode: TransportMode) => void;
  routes: RouteOptionData[];
  selectedRouteId: string | null;
  onSelectRoute: (routeId: string) => void;
  onFindRoute: () => void;
  isLoading: boolean;
  hasSearched: boolean;
  onSelectOriginPlace?: (place: PlaceSuggestion) => void;
  onSelectDestinationPlace?: (place: PlaceSuggestion) => void;
  onSwapLocations?: () => void;
  onUseCurrentLocation?: () => void;
  forecast?: ChennaiForecastResponse | null;
  onOpenForecastModal?: () => void;
  onStartNavigation?: () => void;
  isNavigating?: boolean;
  onOpenExplainer?: () => void;
}

const POPULAR_DESTINATIONS = [
  'Apollo Hospital Greams Road (Thousand Lights)',
  'Chennai Central Railway Station (Park Town)',
  'Velachery (Vijayanagar Bus Stand)',
  'Koyambedu (CMBT Bus Terminus)',
  'Chennai International Airport (Meenambakkam)',
  'Kathipara Junction (Guindy Elevated Hub)',
  'Navalur / Siruseri (OMR IT Corridor)'
];

const RAIN_PRESETS = [
  { label: 'Dry', mm: 25, tip: 'Clear / Light Sprinkles' },
  { label: 'Moderate', mm: 80, tip: 'Seasonal Showers' },
  { label: 'Heavy Monsoon', mm: 160, tip: 'Waterlogging in Sinks' },
  { label: 'Extreme Downpour', mm: 300, tip: 'Severe Basin Inundation' }
];

export const PlanRoutePanel: React.FC<PlanRoutePanelProps> = ({
  origin,
  setOrigin,
  destination,
  setDestination,
  rainfallMm,
  setRainfallMm,
  preference,
  setPreference,
  selectedMode = 'car',
  onSelectMode,
  routes,
  selectedRouteId,
  onSelectRoute,
  onFindRoute,
  isLoading,
  hasSearched,
  onSelectOriginPlace,
  onSelectDestinationPlace,
  onSwapLocations,
  onUseCurrentLocation,
  forecast,
  onOpenForecastModal,
  onStartNavigation,
  isNavigating = false,
  onOpenExplainer
}) => {
  const [isSearchingOrigin, setIsSearchingOrigin] = useState(false);
  const [originSuggestions, setOriginSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isSearchingDest, setIsSearchingDest] = useState(false);
  const [destSuggestions, setDestSuggestions] = useState<PlaceSuggestion[]>([]);
  const [showAdvancedRain, setShowAdvancedRain] = useState(false);

  const handleOriginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setOrigin(val);
    setOriginSuggestions(searchChennaiPlaces(val));
    setIsSearchingOrigin(true);
  };

  const handleDestinationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDestination(val);
    setDestSuggestions(searchChennaiPlaces(val));
    setIsSearchingDest(true);
  };

  const selectOriginPlace = (place: PlaceSuggestion) => {
    setOrigin(place.name);
    setIsSearchingOrigin(false);
    if (onSelectOriginPlace) onSelectOriginPlace(place);
  };

  const selectDestPlace = (place: PlaceSuggestion) => {
    setDestination(place.name);
    setIsSearchingDest(false);
    if (onSelectDestinationPlace) onSelectDestinationPlace(place);
  };

  const activeRoute = routes.find(r => r.id === selectedRouteId) || routes[1] || routes[0] || null;
  const currentMode = TRANSPORT_MODES.find(m => m.id === selectedMode) || TRANSPORT_MODES[0];

  return (
    <div className="flex flex-col h-full bg-white text-slate-800 overflow-y-auto">
      {/* Sleek Top Bar with Project Info & Clear Status */}
      <div className="p-4 pb-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/60 sticky top-0 z-30 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-1.5">
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
              Monsoon Route Planner
            </h2>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
              Live Safe
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            Avoids flooded subways, dips & breached canals
          </p>
        </div>

        {onOpenExplainer && (
          <button
            type="button"
            onClick={onOpenExplainer}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-blue-200 bg-blue-50/80 hover:bg-blue-100 text-blue-700 font-semibold text-[11px] transition-colors cursor-pointer shadow-2xs"
            title="How ChennaiSafeRoute works"
          >
            <Info className="w-3.5 h-3.5" />
            <span>How It Works</span>
          </button>
        )}
      </div>

      <div className="p-4 space-y-4 flex-1">
        {/* 1. Mode of Transport Facility (Google Maps style) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Mode of Transport
            </span>
            <span className="text-[10px] text-slate-400">
              Adapts to vehicle water clearance
            </span>
          </div>
          <TransportModeSelector
            selectedMode={selectedMode}
            onSelectMode={(mode) => {
              if (onSelectMode) onSelectMode(mode);
            }}
            activeRoute={activeRoute}
            routes={routes}
          />
        </div>

        {/* 2. Google Maps Connected Dot Input Container */}
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/90 shadow-2xs space-y-2.5 relative">
          {/* Vertical Connecting Track Line (Google Maps style) */}
          <div className="absolute left-[23px] top-[28px] bottom-[28px] w-0.5 bg-slate-200 pointer-events-none" />

          {/* ORIGIN INPUT */}
          <div className="relative">
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl border border-slate-200 bg-white focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100 transition-all shadow-2xs">
              {/* Origin Green Dot */}
              <div className="w-3 h-3 rounded-full border-2 border-emerald-500 bg-emerald-100 shrink-0 z-10" />

              <input
                type="text"
                value={origin}
                onChange={handleOriginChange}
                onFocus={() => {
                  setOriginSuggestions(searchChennaiPlaces(origin));
                  setIsSearchingOrigin(true);
                }}
                placeholder="Starting location (e.g. T. Nagar, Adyar)"
                className="w-full text-xs font-semibold text-slate-800 bg-transparent border-none outline-hidden placeholder:text-slate-400"
              />

              {origin && (
                <button
                  type="button"
                  onClick={() => {
                    setOrigin('');
                    setOriginSuggestions(searchChennaiPlaces(''));
                    setIsSearchingOrigin(true);
                  }}
                  className="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                  title="Clear origin"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              {onUseCurrentLocation && (
                <button
                  type="button"
                  onClick={() => {
                    onUseCurrentLocation();
                    setIsSearchingOrigin(false);
                  }}
                  title="Use my current GPS location in Chennai"
                  className="text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 p-1 rounded-md transition-colors cursor-pointer shrink-0"
                >
                  <Crosshair className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Origin Autocomplete Popover */}
            {isSearchingOrigin && originSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden divide-y divide-slate-100 max-h-56 overflow-y-auto">
                {onUseCurrentLocation && (
                  <button
                    type="button"
                    onClick={() => {
                      onUseCurrentLocation();
                      setIsSearchingOrigin(false);
                    }}
                    className="w-full px-3 py-2 text-left bg-emerald-50/60 hover:bg-emerald-100/60 flex items-center gap-2 text-emerald-800 text-xs font-semibold cursor-pointer border-b border-emerald-100"
                  >
                    <Crosshair className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Use My Current Live Location</span>
                  </button>
                )}
                {originSuggestions.map((place) => (
                  <button
                    key={place.id}
                    type="button"
                    onClick={() => selectOriginPlace(place)}
                    className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-start gap-2.5 transition-colors cursor-pointer"
                  >
                    <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-semibold text-slate-900">{place.name}</span>
                        {place.zone && (
                          <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                            {place.zone}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate mt-0.5">{place.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Swap Button In-Between */}
          {onSwapLocations && (
            <div className="flex justify-end -my-1 pr-1 z-10 relative">
              <button
                type="button"
                onClick={onSwapLocations}
                title="Swap origin & destination"
                className="flex items-center gap-1 text-[10.5px] font-medium text-slate-500 hover:text-slate-900 bg-white hover:bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200 transition-colors cursor-pointer shadow-2xs"
              >
                <ArrowUpDown className="w-3 h-3 text-slate-500" />
                <span>Swap</span>
              </button>
            </div>
          )}

          {/* DESTINATION INPUT */}
          <div className="relative">
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl border border-slate-200 bg-white focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100 transition-all shadow-2xs">
              {/* Destination Red/Orange Pin */}
              <div className="w-3 h-3 rounded-full border-2 border-orange-500 bg-orange-100 shrink-0 z-10" />

              <input
                type="text"
                value={destination}
                onChange={handleDestinationChange}
                onFocus={() => {
                  setDestSuggestions(searchChennaiPlaces(destination));
                  setIsSearchingDest(true);
                }}
                placeholder="Search destination across Greater Chennai"
                className="w-full text-xs font-semibold text-slate-800 bg-transparent border-none outline-hidden placeholder:text-slate-400"
              />

              {destination && (
                <button
                  type="button"
                  onClick={() => {
                    setDestination('');
                    setDestSuggestions(searchChennaiPlaces(''));
                    setIsSearchingDest(true);
                  }}
                  className="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                  title="Clear destination"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Destination Autocomplete Popover */}
            {isSearchingDest && destSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden divide-y divide-slate-100 max-h-56 overflow-y-auto">
                {destSuggestions.map((place) => (
                  <button
                    key={place.id}
                    type="button"
                    onClick={() => selectDestPlace(place)}
                    className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-start gap-2.5 transition-colors cursor-pointer"
                  >
                    <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-semibold text-slate-900">{place.name}</span>
                        {place.zone && (
                          <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                            {place.zone}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate mt-0.5">{place.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Destination Chips */}
          {!destination && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {POPULAR_DESTINATIONS.slice(0, 4).map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setDestination(chip)}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-200 text-slate-700 hover:text-blue-800 transition-colors cursor-pointer shadow-2xs"
                >
                  {chip.split('(')[0].trim()}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 3. Rainfall & Meteorological Simulation Card */}
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Droplets className="w-4 h-4 text-sky-600" />
              <span className="text-xs font-bold text-slate-800">
                Rainfall Scenario
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-mono font-bold text-sky-900 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">
                {rainfallMm} mm / 6h
              </span>
              <button
                type="button"
                onClick={() => setShowAdvancedRain(prev => !prev)}
                className="text-[10px] text-slate-500 hover:text-slate-800 underline cursor-pointer"
              >
                {showAdvancedRain ? 'Simple' : 'Fine Tune'}
              </button>
            </div>
          </div>

          {/* Quick Rainfall Preset Buttons */}
          <div className="grid grid-cols-4 gap-1.5">
            {RAIN_PRESETS.map((p) => {
              const isSelected = Math.abs(rainfallMm - p.mm) <= 25;
              return (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setRainfallMm(p.mm)}
                  title={p.tip}
                  className={`py-1.5 px-1 text-center rounded-lg text-[10.5px] font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-sky-600 text-white shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700'
                  }`}
                >
                  <div className="truncate">{p.label}</div>
                  <div className={`text-[9px] font-mono ${isSelected ? 'text-sky-100' : 'text-slate-400'}`}>
                    {p.mm}mm
                  </div>
                </button>
              );
            })}
          </div>

          {/* Real-time Weather Sync */}
          {forecast && (
            <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
              <div className="flex items-center gap-1.5 text-slate-600">
                <span>Today's Live IMD:</span>
                <strong className="text-slate-900 font-mono">
                  {forecast.daily[0]?.precipSumMm || 0} mm
                </strong>
              </div>
              {onOpenForecastModal && (
                <button
                  type="button"
                  onClick={onOpenForecastModal}
                  className="text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                >
                  7-Day Weather ▾
                </button>
              )}
            </div>
          )}

          {/* Fine Tune Slider */}
          {showAdvancedRain && (
            <div className="pt-2 border-t border-slate-100 space-y-1 animate-in fade-in">
              <input
                type="range"
                min="10"
                max="350"
                step="10"
                value={rainfallMm}
                onChange={(e) => setRainfallMm(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
              />
              <div className="flex justify-between text-[9.5px] text-slate-400 font-mono">
                <span>10 mm (Drizzle)</span>
                <span>150 mm (Heavy)</span>
                <span>350 mm (Catastrophic)</span>
              </div>
            </div>
          )}
        </div>

        {/* 4. Preference Selector (Fastest, Balanced, Safer) */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Route Strategy
          </label>
          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200/80">
            {(['fastest', 'balanced', 'safer'] as RoutePreference[]).map((pref) => {
              const isSelected = preference === pref;
              const label =
                pref === 'fastest' ? 'Fastest' : pref === 'balanced' ? 'Balanced' : '100% Dry Ridge';
              return (
                <button
                  key={pref}
                  type="button"
                  onClick={() => setPreference(pref)}
                  className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white text-slate-950 shadow-xs border border-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 5. Calculate Route Action Button */}
        <div>
          <button
            type="button"
            onClick={onFindRoute}
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white text-xs font-bold tracking-wide transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
          >
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Analyzing 4,531 Chennai Road Levels...
              </span>
            ) : (
              <>
                <span>CALCULATE SAFE PATH</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* 6. Computed Route Options (Google Maps style card list) */}
        {hasSearched && routes.length > 0 && (
          <div className="space-y-3 pt-2 border-t border-slate-200 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Computed Safe Routes ({routes.length})
              </span>
              <span className="text-[11px] text-slate-400">
                Mode: {currentMode.label}
              </span>
            </div>

            <div className="space-y-2.5">
              {routes.map((route) => {
                const isSelected = selectedRouteId === route.id;
                const isImpassable = route.clearanceStatus === 'impassable';
                const isCaution = route.clearanceStatus === 'caution';

                return (
                  <div
                    key={route.id}
                    onClick={() => onSelectRoute(route.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/40 shadow-sm ring-2 ring-blue-500/20'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    {/* Header: Name, Duration & Distance */}
                    <div className="flex items-start justify-between">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-900">
                            {route.name}
                          </h3>
                          {route.isRecommended && (
                            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                              Recommended
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500">
                          {route.tagline}
                        </p>
                      </div>

                      <div className="text-right">
                        <div className="text-base font-bold text-slate-900 font-mono leading-tight">
                          {route.durationMinutes} min
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {route.distanceKm} km
                        </div>
                      </div>
                    </div>

                    {/* Mode Clearance Verdict Strip */}
                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5">
                        {isImpassable ? (
                          <div className="flex items-center gap-1 text-red-700 font-semibold bg-red-50 px-2 py-0.5 rounded-md border border-red-200">
                            <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                            <span>Impassable for {currentMode.shortLabel}</span>
                          </div>
                        ) : isCaution ? (
                          <div className="flex items-center gap-1 text-amber-800 font-semibold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>Minor Water (~{route.maxWaterDepthCm}cm)</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>100% Dry Ridge Corridor</span>
                          </div>
                        )}
                      </div>

                      {route.elevationGainM !== undefined && (
                        <div className="flex items-center gap-1 text-slate-500 font-mono text-[10.5px]">
                          <TrendingUp className="w-3 h-3 text-slate-400" />
                          <span>+{route.elevationGainM}m MSL Ridge</span>
                        </div>
                      )}
                    </div>

                    {/* Warning if water depth exceeds safe vehicle threshold */}
                    {route.modeSpecificWarning && isImpassable && (
                      <div className="mt-2 p-2 rounded-lg bg-red-50 border border-red-100 text-[11px] text-red-900 leading-normal">
                        {route.modeSpecificWarning}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Start Live Navigation Trigger (Google Maps Big Button) */}
            {onStartNavigation && activeRoute && (
              <div className="pt-2 sticky bottom-0 bg-white/95 backdrop-blur-xs pb-1 z-20">
                <button
                  type="button"
                  onClick={onStartNavigation}
                  className="w-full py-3.5 px-4 rounded-xl bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-[0.99] text-white text-xs font-bold tracking-wider transition-all shadow-lg shadow-emerald-700/25 flex items-center justify-center gap-2.5 cursor-pointer uppercase"
                >
                  <Navigation className="w-4 h-4 animate-pulse" />
                  <span>
                    {isNavigating ? 'Resume Navigation' : `Start Navigation (${activeRoute.durationMinutes} min)`}
                  </span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlanRoutePanel;
