import React, { useState, useMemo, useEffect } from 'react';
import {
  ChennaiSafeRouteHeader,
  PlanRoutePanel,
  RoadRiskDrawer,
  EmergencyAccessView,
  RiskRoadsView,
  FloodMapView,
  HistoryView,
  NavigationMenuBar,
  SafeRouteMap,
  ChennaiWeatherForecastModal,
  LiveNavigationOverlay,
  ProjectExplainerModal
} from './components/navigation';
import {
  ActiveNavTab,
  RoutePreference,
  TransportMode,
  RoadRiskSegment,
  RouteOptionData,
  EmergencyFacility,
  PlaceSuggestion,
  DrainageChannel,
  WaterBody,
  HistoricalFloodPoint,
  ElevationBenchmark
} from './types/navigation';
import { ChennaiForecastResponse } from './types/weather';
import { fetchChennaiWeatherForecast } from './services/weatherService';
import {
  calculateDynamicRoadRisks,
  fetchRouteRecommendations,
  fetchHydrologyLayers,
  fetchElevationBenchmarks,
  fetchFullDrainageGeoJson,
  fetchFullWaterBodiesGeoJson
} from './services/routeService';
import {
  MOCK_EMERGENCY_FACILITIES,
  MOCK_DRAINAGE_CHANNELS,
  MOCK_WATER_BODIES,
  MOCK_HISTORICAL_FLOODS
} from './data/mockNavigationData';
import { ChevronUp, ChevronDown, X, Navigation } from 'lucide-react';
import { interpolateRouteProgress, NavPointState } from './utils/navigationSimulator';

export function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<ActiveNavTab>('route');

  // Real-time Meteorological & 7-Day Forecast State
  const [forecast, setForecast] = useState<ChennaiForecastResponse | null>(null);
  const [isLoadingForecast, setIsLoadingForecast] = useState<boolean>(false);
  const [showForecastModal, setShowForecastModal] = useState<boolean>(false);

  // Hydrology Background Data Layers
  const [drainageChannels, setDrainageChannels] = useState<DrainageChannel[]>(MOCK_DRAINAGE_CHANNELS);
  const [waterBodies, setWaterBodies] = useState<WaterBody[]>(MOCK_WATER_BODIES);
  const [historicalFloods, setHistoricalFloods] = useState<HistoricalFloodPoint[]>(MOCK_HISTORICAL_FLOODS);
  const [elevationBenchmarks, setElevationBenchmarks] = useState<ElevationBenchmark[]>([]);
  const [drainageGeoJson, setDrainageGeoJson] = useState<any | null>(null);
  const [waterBodiesGeoJson, setWaterBodiesGeoJson] = useState<any | null>(null);

  // Route Planning State & Coordinates
  const [origin, setOrigin] = useState('Current location (T. Nagar)');
  const [originCoords, setOriginCoords] = useState<[number, number]>([13.0418, 80.2341]);
  const [destination, setDestination] = useState('Phoenix Marketcity Velachery');
  const [destinationCoords, setDestinationCoords] = useState<[number, number]>([12.9912, 80.2170]);
  const [rainfallMm, setRainfallMm] = useState(150); // Default 150 mm / 6h
  const [preference, setPreference] = useState<RoutePreference>('balanced');
  const [transportMode, setTransportMode] = useState<TransportMode>('car');
  const [showExplainerModal, setShowExplainerModal] = useState<boolean>(false);
  const [isLoadingRoutes, setIsLoadingRoutes] = useState(false);
  const [hasSearched, setHasSearched] = useState(true);

  // GPS Location state (optional)
  const [userGpsCoords, setUserGpsCoords] = useState<[number, number] | null>(null);

  // Emergency Focus state
  const [focusedFacilityCoords, setFocusedFacilityCoords] = useState<[number, number] | null>(null);

  // Computed Routes
  const [routes, setRoutes] = useState<RouteOptionData[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>('route-balanced');

  // Selected Road Risk Segment for side drawer inspector
  const [selectedRoadSegment, setSelectedRoadSegment] = useState<RoadRiskSegment | null>(null);

  // Desktop sidebar & Mobile sheet visibility state
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState<boolean>(true);
  const [isMobilePanelOpen, setIsMobilePanelOpen] = useState<boolean>(false);

  // Real-time Moving Location Marker along route (Simulation & Navigation)
  const [isNavigating, setIsNavigating] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [navProgress, setNavProgress] = useState<number>(0); // 0 to 1
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1); // 1x, 2x, 4x
  const [autoCenter, setAutoCenter] = useState<boolean>(true);

  // Dynamically compute road risks when rainfall scenario changes
  const dynamicRoadSegments = useMemo(() => {
    return calculateDynamicRoadRisks(rainfallMm);
  }, [rainfallMm]);

  // Unified route calculator supporting immediate overrides (no React state lag)
  const handleFindRouteWithParams = async (overrides?: {
    newOrigin?: string;
    newDestination?: string;
    newRainfallMm?: number;
    newPreference?: RoutePreference;
    newTransportMode?: TransportMode;
    newOriginCoords?: [number, number];
    newDestinationCoords?: [number, number];
  }) => {
    setIsLoadingRoutes(true);
    const currentOrig = overrides?.newOrigin ?? origin;
    const currentDest = overrides?.newDestination ?? destination;
    const currentRain = overrides?.newRainfallMm ?? rainfallMm;
    const currentPref = overrides?.newPreference ?? preference;
    const currentMode = overrides?.newTransportMode ?? transportMode;
    const currentOrigCoords = overrides?.newOriginCoords ?? originCoords;
    const currentDestCoords = overrides?.newDestinationCoords ?? destinationCoords;

    try {
      const result = await fetchRouteRecommendations({
        origin: currentOrig,
        destination: currentDest,
        rainfallMm: currentRain,
        preference: currentPref,
        transportMode: currentMode,
        originCoords: currentOrigCoords,
        destinationCoords: currentDestCoords
      });
      setRoutes(result.routes);
      setHasSearched(true);
      const match = result.routes.find(r => r.type === currentPref) || result.routes[1] || result.routes[0];
      if (match) setSelectedRouteId(match.id);
    } finally {
      setIsLoadingRoutes(false);
    }
  };

  const handleFindRoute = () => handleFindRouteWithParams();

  // Refresh route calculation when transport mode changes
  useEffect(() => {
    if (hasSearched) {
      handleFindRouteWithParams({ newTransportMode: transportMode });
    }
  }, [transportMode]);

  // Run on mount once to pre-load default routes, fetch background hydrology layers, and live weather forecast
  useEffect(() => {
    handleFindRoute();
    fetchHydrologyLayers().then((layers) => {
      if (layers.drainageChannels?.length) setDrainageChannels(layers.drainageChannels);
      if (layers.waterBodies?.length) setWaterBodies(layers.waterBodies);
      if (layers.historicalFloods?.length) setHistoricalFloods(layers.historicalFloods);
    });
    fetchElevationBenchmarks().then((benchmarks) => {
      if (benchmarks && benchmarks.length > 0) {
        setElevationBenchmarks(benchmarks);
      }
    });
    fetchFullDrainageGeoJson().then((geo) => {
      if (geo) setDrainageGeoJson(geo);
    });
    fetchFullWaterBodiesGeoJson().then((geo) => {
      if (geo) setWaterBodiesGeoJson(geo);
    });
    
    // Fetch live weather & 7-day forecast
    setIsLoadingForecast(true);
    fetchChennaiWeatherForecast()
      .then((fc) => {
        if (fc) setForecast(fc);
      })
      .finally(() => setIsLoadingForecast(false));
  }, []);

  const handleRefreshForecast = async () => {
    setIsLoadingForecast(true);
    try {
      const fc = await fetchChennaiWeatherForecast();
      if (fc) setForecast(fc);
    } finally {
      setIsLoadingForecast(false);
    }
  };

  const handleApplyForecastToRoute = (precipMm: number, dayLabel: string) => {
    const mappedRainfall = Math.max(25, Math.round(precipMm * 15));
    setRainfallMm(mappedRainfall);
    handleFindRouteWithParams({ newRainfallMm: mappedRainfall });
  };

  // When rainfall slider moves, automatically refresh routes
  useEffect(() => {
    if (hasSearched) {
      handleFindRouteWithParams({ newRainfallMm: rainfallMm });
    }
  }, [rainfallMm]);

  // Current active route object
  const activeRoute = useMemo(() => {
    return routes.find(r => r.id === selectedRouteId) || routes[1] || routes[0] || null;
  }, [routes, selectedRouteId]);

  // Interpolate user moving position, bearing, elevation, remaining ETA along active route
  const navPointState = useMemo<NavPointState | null>(() => {
    if (!activeRoute || !activeRoute.coordinates || activeRoute.coordinates.length < 2) {
      return null;
    }
    return interpolateRouteProgress(
      activeRoute.coordinates,
      navProgress,
      activeRoute.distanceKm || 8,
      activeRoute.durationMinutes || 25,
      activeRoute.primaryRoads || ['Anna Salai Corridor', 'Inner Ring Elevated Link']
    );
  }, [activeRoute, navProgress]);

  // Smoothly move user current location along route when playback is active
  useEffect(() => {
    if (!isNavigating || !isPlaying || !activeRoute || !activeRoute.coordinates?.length) return;

    const distKm = activeRoute.distanceKm || 10;
    const baseSimDuration = Math.max(18, Math.min(60, distKm * 3.5));
    const durationSeconds = baseSimDuration / speedMultiplier;
    const tickMs = 60; // ~16 updates/sec for smooth movement
    const step = (tickMs / 1000) / durationSeconds;

    const interval = setInterval(() => {
      setNavProgress((prev) => {
        const next = prev + step;
        if (next >= 1) {
          setIsPlaying(false);
          return 1;
        }
        return next;
      });
    }, tickMs);

    return () => clearInterval(interval);
  }, [isNavigating, isPlaying, activeRoute, speedMultiplier]);

  // Keyboard shortcut Ctrl+B / Cmd+B for sidebar toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setIsDesktopSidebarOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleStartNavigation = () => {
    setIsNavigating(true);
    setIsPlaying(true);
    setIsMobilePanelOpen(false); // Map HUD takes precedence on mobile!
  };

  const handleExitNavigation = () => {
    setIsNavigating(false);
    setIsPlaying(false);
    setNavProgress(0);
  };

  const handleTogglePlay = () => {
    if (navProgress >= 1) {
      setNavProgress(0);
      setIsPlaying(true);
    } else {
      setIsPlaying((prev) => !prev);
    }
  };

  const handleResetNavigation = () => {
    setNavProgress(0);
    setIsPlaying(true);
  };

  const handleScrubProgress = (fraction: number) => {
    setNavProgress(Math.min(1, Math.max(0, fraction)));
  };

  // Quick action: use current GPS location if desired
  const handleUseCurrentLocation = () => {
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const isChennai = lat >= 12.6 && lat <= 13.5 && lng >= 79.8 && lng <= 80.5;
          const coords: [number, number] = isChennai ? [lat, lng] : [13.0418, 80.2341];
          const label = isChennai
            ? `Current location (${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E)`
            : `Current location (T. Nagar)`;

          setOrigin(label);
          setOriginCoords(coords);
          setUserGpsCoords(coords);

          handleFindRouteWithParams({
            newOrigin: label,
            newOriginCoords: coords
          });
        },
        (err) => {
          console.warn('Geolocation fallback:', err.message);
          const fallbackCoords: [number, number] = [13.0418, 80.2341];
          const fallbackLabel = 'Current location (T. Nagar)';
          setOrigin(fallbackLabel);
          setOriginCoords(fallbackCoords);
          setUserGpsCoords(fallbackCoords);

          handleFindRouteWithParams({
            newOrigin: fallbackLabel,
            newOriginCoords: fallbackCoords
          });
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      const fallbackCoords: [number, number] = [13.0418, 80.2341];
      const fallbackLabel = 'Current location (T. Nagar)';
      setOrigin(fallbackLabel);
      setOriginCoords(fallbackCoords);
      setUserGpsCoords(fallbackCoords);

      handleFindRouteWithParams({
        newOrigin: fallbackLabel,
        newOriginCoords: fallbackCoords
      });
    }
  };

  // Select place for origin from autocomplete
  const handleSelectOriginPlace = (place: PlaceSuggestion) => {
    setOrigin(place.name);
    setOriginCoords(place.coordinates);
    handleFindRouteWithParams({
      newOrigin: place.name,
      newOriginCoords: place.coordinates
    });
  };

  // Select place for destination from autocomplete
  const handleSelectDestinationPlace = (place: PlaceSuggestion) => {
    setDestination(place.name);
    setDestinationCoords(place.coordinates);
    handleFindRouteWithParams({
      newDestination: place.name,
      newDestinationCoords: place.coordinates
    });
  };

  // Swap starting location and destination anytime
  const handleSwapLocations = () => {
    const prevOrigin = origin;
    const prevOriginCoords = originCoords;
    const prevDest = destination;
    const prevDestCoords = destinationCoords;

    setOrigin(prevDest);
    setOriginCoords(prevDestCoords);
    setDestination(prevOrigin);
    setDestinationCoords(prevOriginCoords);

    handleFindRouteWithParams({
      newOrigin: prevDest,
      newOriginCoords: prevDestCoords,
      newDestination: prevOrigin,
      newDestinationCoords: prevOriginCoords
    });
  };

  // Handle clicking "View on map" from Risk Roads page
  const handleSelectSegmentFromList = (segment: RoadRiskSegment) => {
    const current = dynamicRoadSegments.find(s => s.id === segment.id) || segment;
    setSelectedRoadSegment(current);
    setIsMobilePanelOpen(false);
  };

  // Handle one-tap emergency navigation
  const handleNavigateToEmergency = (facility: EmergencyFacility) => {
    setDestination(facility.name);
    setDestinationCoords(facility.coordinates);
    setActiveTab('route');
    setPreference('safer');
    setIsMobilePanelOpen(false);
    setFocusedFacilityCoords(facility.coordinates);

    handleFindRouteWithParams({
      newDestination: facility.name,
      newDestinationCoords: facility.coordinates,
      newPreference: 'safer'
    });
  };

  // Re-run route from history
  const handleRerunHistory = (orig: string, dest: string) => {
    setOrigin(orig);
    setDestination(dest);
    setActiveTab('route');
    handleFindRouteWithParams({
      newOrigin: orig,
      newDestination: dest
    });
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-white text-slate-800 antialiased font-sans">
      {/* Top Header with thin saffron line and bespoke brand */}
      <ChennaiSafeRouteHeader 
        rainfallMm={rainfallMm} 
        forecast={forecast}
        onOpenForecastModal={() => setShowForecastModal(true)}
        isSidebarOpen={isDesktopSidebarOpen}
        onToggleSidebar={() => setIsDesktopSidebarOpen((prev) => !prev)}
        isMobilePanelOpen={isMobilePanelOpen}
        onToggleMobilePanel={() => setIsMobilePanelOpen((prev) => !prev)}
        onOpenExplainer={() => setShowExplainerModal(true)}
      />

      {/* Main Content Area: Map + Left Panel */}
      <div className="relative flex-1 flex overflow-hidden">
        {/* Desktop Left Slim Panel */}
        <aside
          className={`hidden md:flex flex-col border-r border-slate-200 bg-white z-20 shadow-xs h-full shrink-0 overflow-hidden transition-all duration-300 ease-in-out ${
            isDesktopSidebarOpen ? 'w-96 lg:w-104 opacity-100' : 'w-0 border-r-0 opacity-0 pointer-events-none'
          }`}
        >
          <div className="flex-1 overflow-hidden">
            {activeTab === 'route' && (
              <PlanRoutePanel
                origin={origin}
                setOrigin={setOrigin}
                destination={destination}
                setDestination={setDestination}
                rainfallMm={rainfallMm}
                setRainfallMm={setRainfallMm}
                preference={preference}
                setPreference={setPreference}
                selectedMode={transportMode}
                onSelectMode={setTransportMode}
                routes={routes}
                selectedRouteId={selectedRouteId}
                onSelectRoute={setSelectedRouteId}
                onFindRoute={handleFindRoute}
                isLoading={isLoadingRoutes}
                hasSearched={hasSearched}
                onSelectOriginPlace={handleSelectOriginPlace}
                onSelectDestinationPlace={handleSelectDestinationPlace}
                onSwapLocations={handleSwapLocations}
                onUseCurrentLocation={handleUseCurrentLocation}
                forecast={forecast}
                onOpenForecastModal={() => setShowForecastModal(true)}
                onStartNavigation={handleStartNavigation}
                isNavigating={isNavigating}
                onOpenExplainer={() => setShowExplainerModal(true)}
              />
            )}

            {activeTab === 'risk_roads' && (
              <RiskRoadsView
                roadSegments={dynamicRoadSegments}
                onSelectSegment={handleSelectSegmentFromList}
              />
            )}

            {activeTab === 'emergency' && (
              <EmergencyAccessView
                onNavigateToFacility={handleNavigateToEmergency}
                onSelectFacility={(fac) => setFocusedFacilityCoords(fac.coordinates)}
              />
            )}

            {activeTab === 'flood_map' && (
              <FloodMapView 
                rainfallMm={rainfallMm} 
                forecast={forecast}
                onOpenForecastModal={() => setShowForecastModal(true)}
              />
            )}

            {activeTab === 'history' && (
              <HistoryView onRerunRoute={handleRerunHistory} />
            )}
          </div>

          {/* Desktop Tab Switcher at bottom of left panel */}
          <div className="border-t border-slate-200 bg-white p-0.5 w-full shrink-0">
            <NavigationMenuBar
              activeTab={activeTab}
              onTabChange={(tab: ActiveNavTab) => {
                setActiveTab(tab);
                if (tab !== 'risk_roads' && tab !== 'route') {
                  setSelectedRoadSegment(null);
                }
              }}
              riskRoadCount={dynamicRoadSegments.filter(r => r.currentRisk >= 60).length}
            />
          </div>
        </aside>

        {/* Map View fills the entire remaining canvas */}
        <main className="flex-1 relative h-full w-full bg-slate-100 overflow-hidden">
          <SafeRouteMap
            roadSegments={dynamicRoadSegments}
            activeRoute={activeRoute}
            allRoutes={routes}
            selectedSegment={selectedRoadSegment}
            onSelectRoadSegment={(seg: RoadRiskSegment) => setSelectedRoadSegment(seg)}
            emergencyFacilities={MOCK_EMERGENCY_FACILITIES}
            activeTab={activeTab}
            onNavigateToFacility={handleNavigateToEmergency}
            userGpsCoords={userGpsCoords}
            focusedFacilityCoords={focusedFacilityCoords}
            drainageChannels={drainageChannels}
            waterBodies={waterBodies}
            historicalFloods={historicalFloods}
            elevationBenchmarks={elevationBenchmarks}
            drainageGeoJson={drainageGeoJson}
            waterBodiesGeoJson={waterBodiesGeoJson}
            isNavigating={isNavigating}
            navPointState={navPointState}
            autoCenter={autoCenter}
            onStartNavigation={handleStartNavigation}
            isSidebarCollapsed={!isDesktopSidebarOpen}
            onToggleSidebar={() => setIsDesktopSidebarOpen((prev) => !prev)}
            isMobilePanelOpen={isMobilePanelOpen}
            onToggleMobilePanel={() => setIsMobilePanelOpen((prev) => !prev)}
          />

          {/* Live Navigation Driving HUD & Interactive Scrubber Overlay */}
          {isNavigating && activeRoute && navPointState && (
            <LiveNavigationOverlay
              route={activeRoute}
              navState={navPointState}
              isPlaying={isPlaying}
              onTogglePlay={handleTogglePlay}
              speedMultiplier={speedMultiplier}
              onChangeSpeed={setSpeedMultiplier}
              onScrubProgress={handleScrubProgress}
              onResetNavigation={handleResetNavigation}
              onExitNavigation={handleExitNavigation}
              autoCenter={autoCenter}
              onToggleAutoCenter={() => setAutoCenter((prev) => !prev)}
              destinationName={destination}
            />
          )}

          {/* Road Risk Drawer (Slides in from the right when tapping a red road segment) */}
          <RoadRiskDrawer
            segment={selectedRoadSegment}
            onClose={() => setSelectedRoadSegment(null)}
            onAvoidSegment={() => {
              setPreference('safer');
              handleFindRoute();
            }}
          />

          {/* Mobile Collapsible Bottom Sheet */}
          <div
            className={`md:hidden absolute left-0 right-0 bottom-14 z-30 bg-white border-t border-slate-200 rounded-t-2xl shadow-2xl transition-all duration-300 flex flex-col ${
              isMobilePanelOpen
                ? 'h-[72vh] max-h-[75vh] translate-y-0 opacity-100'
                : 'h-0 -bottom-14 translate-y-full opacity-0 pointer-events-none'
            }`}
          >
            {/* Sheet Handle & Quick Close Header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 bg-slate-50/90 rounded-t-2xl shrink-0 select-none">
              <div className="flex items-center gap-2">
                <div className="w-8 h-1 bg-slate-300 rounded-full" />
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  {activeTab === 'route'
                    ? 'Route Planner'
                    : activeTab === 'risk_roads'
                    ? 'Risk Road Segments'
                    : activeTab === 'emergency'
                    ? 'Emergency Facilities'
                    : activeTab === 'flood_map'
                    ? 'Flood Map Intelligence'
                    : 'Recent Routes'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsMobilePanelOpen(false)}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-2.5 py-1 rounded-full shadow-2xs flex items-center gap-1 cursor-pointer transition-colors"
                title="Minimize panel to view full map"
              >
                <span>View Map</span>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Panel Content */}
            <div className="flex-1 overflow-y-auto px-4 pb-4 pt-2">
              {activeTab === 'route' ? (
                <PlanRoutePanel
                  origin={origin}
                  setOrigin={setOrigin}
                  destination={destination}
                  setDestination={setDestination}
                  rainfallMm={rainfallMm}
                  setRainfallMm={setRainfallMm}
                  preference={preference}
                  setPreference={setPreference}
                  selectedMode={transportMode}
                  onSelectMode={setTransportMode}
                  routes={routes}
                  selectedRouteId={selectedRouteId}
                  onSelectRoute={setSelectedRouteId}
                  onFindRoute={handleFindRoute}
                  isLoading={isLoadingRoutes}
                  hasSearched={hasSearched}
                  onSelectOriginPlace={handleSelectOriginPlace}
                  onSelectDestinationPlace={handleSelectDestinationPlace}
                  onSwapLocations={handleSwapLocations}
                  onUseCurrentLocation={handleUseCurrentLocation}
                  forecast={forecast}
                  onOpenForecastModal={() => setShowForecastModal(true)}
                  onStartNavigation={handleStartNavigation}
                  isNavigating={isNavigating}
                  onOpenExplainer={() => setShowExplainerModal(true)}
                />
              ) : activeTab === 'risk_roads' ? (
                <RiskRoadsView
                  roadSegments={dynamicRoadSegments}
                  onSelectSegment={handleSelectSegmentFromList}
                />
              ) : activeTab === 'emergency' ? (
                <EmergencyAccessView
                  onNavigateToFacility={handleNavigateToEmergency}
                  onSelectFacility={(fac) => setFocusedFacilityCoords(fac.coordinates)}
                />
              ) : activeTab === 'flood_map' ? (
                <FloodMapView 
                  rainfallMm={rainfallMm} 
                  forecast={forecast}
                  onOpenForecastModal={() => setShowForecastModal(true)}
                />
              ) : (
                <HistoryView onRerunRoute={handleRerunHistory} />
              )}
            </div>
          </div>

          {/* Floating Pill on mobile when panel is collapsed & not in driving mode */}
          {!isMobilePanelOpen && !isNavigating && (
            <div className="md:hidden absolute bottom-16 left-3 right-3 z-20 pointer-events-none flex justify-center animate-in fade-in slide-in-from-bottom-2 duration-200">
              <button
                type="button"
                onClick={() => setIsMobilePanelOpen(true)}
                className="pointer-events-auto bg-slate-900/90 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg backdrop-blur-sm border border-slate-700/80 flex items-center gap-2 active:scale-95 transition-all cursor-pointer"
              >
                <ChevronUp className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  Open {activeTab === 'route' ? 'Route Planner' : activeTab === 'risk_roads' ? 'Risk Roads' : activeTab === 'emergency' ? 'Emergency' : activeTab === 'flood_map' ? 'Flood Intel' : 'History'} Panel
                </span>
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation Menu Bar */}
      <div className="md:hidden z-40 bg-white border-t border-slate-200 shadow-xl">
        <NavigationMenuBar
          activeTab={activeTab}
          onTabChange={(tab: ActiveNavTab) => {
            if (activeTab === tab) {
              setIsMobilePanelOpen((prev) => !prev);
            } else {
              setActiveTab(tab);
              setIsMobilePanelOpen(true);
            }
          }}
          riskRoadCount={dynamicRoadSegments.filter(r => r.currentRisk >= 60).length}
        />
      </div>

      {/* Chennai Weather Forecast & 7-Day Simulation Modal */}
      {showForecastModal && (
        <ChennaiWeatherForecastModal
          forecast={forecast}
          isLoading={isLoadingForecast}
          onRefresh={handleRefreshForecast}
          onClose={() => setShowForecastModal(false)}
          onApplyForecastToRoute={handleApplyForecastToRoute}
        />
      )}

      {/* Interactive Project Explanation Guide Modal */}
      <ProjectExplainerModal
        isOpen={showExplainerModal}
        onClose={() => setShowExplainerModal(false)}
        onStartRoute={() => {
          setActiveTab('route');
          setIsMobilePanelOpen(true);
        }}
      />
    </div>
  );
}

export default App;
