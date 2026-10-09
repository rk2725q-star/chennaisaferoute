import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  FloodZone,
  WaterBody,
  CriticalFacility,
  SubmergedRoadOrSubway,
  IncidentReport,
  RouteOption,
  ReservoirData
} from '../types';
import {
  DynamicRouteResult,
  DynamicRoadSegment
} from '../utils/floodEngine';
import { fetchLiveRadarData, RadarData } from '../utils/liveRadarService';
import { SubwaySensorTelemetry } from '../utils/telemetryService';
import {
  Layers,
  ZoomIn,
  ZoomOut,
  Compass,
  AlertTriangle,
  ShieldCheck,
  Waves,
  Crosshair,
  SlidersHorizontal,
  TrendingUp,
  MapPin,
  Eye,
  EyeOff,
  Sparkles,
  Radio,
  Play,
  Pause,
  Activity,
  Gauge
} from 'lucide-react';

interface MapComponentProps {
  zones: FloodZone[];
  waterBodies: WaterBody[];
  facilities: CriticalFacility[];
  subways: SubmergedRoadOrSubway[];
  incidents: IncidentReport[];
  reservoirs: ReservoirData[];
  selectedRoute: RouteOption | null;
  dynamicRoute?: DynamicRouteResult | null;
  routes?: DynamicRouteResult[];
  onSelectRouteId?: (id: string) => void;
  originName?: string;
  destinationName?: string;
  originCoords?: [number, number];
  destinationCoords?: [number, number];
  dynamicRoads?: DynamicRoadSegment[];
  selectedZone: FloodZone | null;
  onSelectZone: (zone: FloodZone) => void;
  onSelectFacility: (facility: CriticalFacility) => void;
  onSelectSubway: (subway: SubmergedRoadOrSubway) => void;
  onSelectIncident: (incident: IncidentReport) => void;
  onSelectRoadSegment?: (road: DynamicRoadSegment) => void;
  showInundationPolygons: boolean;
  showWaterways: boolean;
  showFacilities: boolean;
  showSubways: boolean;
  showIncidents: boolean;
  showRoadRiskSegments?: boolean;
  onToggleInundation?: (val: boolean) => void;
  onToggleWaterways?: (val: boolean) => void;
  onToggleFacilities?: (val: boolean) => void;
  onToggleSubways?: (val: boolean) => void;
  onToggleIncidents?: (val: boolean) => void;
  onToggleRoadRiskSegments?: (val: boolean) => void;
  onOpenSimulation?: () => void;
  onOpenRankings?: () => void;
  onOpenAIAssistant?: () => void;
  showRadarLayer?: boolean;
  onToggleRadarLayer?: (val: boolean) => void;
  onOpenSubwaySensors?: () => void;
  subwaySensors?: SubwaySensorTelemetry[];
  onSelectSubwaySensor?: (sensor: SubwaySensorTelemetry) => void;
  rainfallRate?: number;
  stormCenter?: [number, number];
  stormRadiusKm?: number;
  focusedRoad?: DynamicRoadSegment | null;
  isDriving?: boolean;
  navigationStepIndex?: number;
}

export const MapComponent: React.FC<MapComponentProps> = ({
  zones,
  waterBodies,
  facilities,
  subways,
  incidents,
  reservoirs,
  selectedRoute,
  dynamicRoute,
  routes,
  onSelectRouteId,
  originName,
  destinationName,
  originCoords,
  destinationCoords,
  dynamicRoads,
  selectedZone,
  onSelectZone,
  onSelectFacility,
  onSelectSubway,
  onSelectIncident,
  onSelectRoadSegment,
  showInundationPolygons,
  showWaterways,
  showFacilities,
  showSubways,
  showIncidents,
  showRoadRiskSegments = true,
  onToggleInundation,
  onToggleWaterways,
  onToggleFacilities,
  onToggleSubways,
  onToggleIncidents,
  onToggleRoadRiskSegments,
  onOpenSimulation,
  onOpenRankings,
  onOpenAIAssistant,
  showRadarLayer,
  onToggleRadarLayer,
  onOpenSubwaySensors,
  subwaySensors,
  onSelectSubwaySensor,
  rainfallRate = 120,
  stormCenter,
  stormRadiusKm = 14,
  focusedRoad,
  isDriving = false,
  navigationStepIndex = 0
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const layersGroupRef = useRef<L.LayerGroup | null>(null);
  const roadsGroupRef = useRef<L.LayerGroup | null>(null);
  const routeLayerGroupRef = useRef<L.LayerGroup | null>(null);
  
  const [mapTheme, setMapTheme] = useState<'streets' | 'satellite' | 'terrain' | 'dark' | 'light'>('streets');
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [is3D, setIs3D] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const userLocationMarkerRef = useRef<L.Marker | null>(null);

  // Live Doppler Weather Radar (RainViewer) State
  const [isRadarActive, setIsRadarActive] = useState(false);
  const [radarData, setRadarData] = useState<RadarData | null>(null);
  const [currentRadarIndex, setCurrentRadarIndex] = useState<number>(0);
  const [isRadarPlaying, setIsRadarPlaying] = useState<boolean>(true);
  const [radarOpacity, setRadarOpacity] = useState<number>(0.7);
  const [isRadarLoading, setIsRadarLoading] = useState<boolean>(false);
  const radarTileLayerRef = useRef<L.TileLayer | null>(null);

  // Sync external radar toggle with internal state
  useEffect(() => {
    if (showRadarLayer !== undefined) {
      setIsRadarActive(showRadarLayer);
    }
  }, [showRadarLayer]);

  const handleToggleRadar = (val: boolean) => {
    setIsRadarActive(val);
    if (onToggleRadarLayer) onToggleRadarLayer(val);
  };

  // Load live RainViewer radar telemetry
  useEffect(() => {
    if (!isRadarActive) return;
    if (!radarData) {
      setIsRadarLoading(true);
      fetchLiveRadarData().then((data) => {
        setRadarData(data);
        setIsRadarLoading(false);
        if (data.frames.length > 0) {
          const pastFrames = data.frames.filter((f) => !f.isNowcast);
          const defaultIdx = pastFrames.length > 0 ? pastFrames.length - 1 : data.frames.length - 1;
          setCurrentRadarIndex(defaultIdx);
        }
      }).catch((err) => {
        console.error('Failed to load radar:', err);
        setIsRadarLoading(false);
      });
    }
  }, [isRadarActive, radarData]);

  // Leaflet tile layer binding for live Doppler frames
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (!isRadarActive || !radarData || radarData.frames.length === 0) {
      if (radarTileLayerRef.current) {
        radarTileLayerRef.current.remove();
        radarTileLayerRef.current = null;
      }
      return;
    }

    const activeFrame = radarData.frames[currentRadarIndex] || radarData.latestFrame;
    if (!activeFrame) return;

    if (radarTileLayerRef.current) {
      radarTileLayerRef.current.setUrl(activeFrame.url);
      radarTileLayerRef.current.setOpacity(radarOpacity);
    } else {
      const layer = L.tileLayer(activeFrame.url, {
        opacity: radarOpacity,
        zIndex: 350,
        maxZoom: 19,
        attribution: '&copy; RainViewer Doppler'
      }).addTo(map);
      radarTileLayerRef.current = layer;
    }
  }, [isRadarActive, radarData, currentRadarIndex, radarOpacity]);

  // Radar playback timeline animation
  useEffect(() => {
    if (!isRadarActive || !isRadarPlaying || !radarData || radarData.frames.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentRadarIndex((prev) => (prev + 1) % radarData.frames.length);
    }, 1400);
    return () => clearInterval(interval);
  }, [isRadarActive, isRadarPlaying, radarData]);

  // Reliable Basemap Tile Configurations (with subdomains, fast CDN, zero 403 blocks)
  const TILE_CONFIGS = {
    streets: {
      url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      subdomains: ['a', 'b', 'c', 'd'],
      maxZoom: 20,
      maxNativeZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
    },
    satellite: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      subdomains: undefined,
      maxZoom: 19,
      maxNativeZoom: 18,
      attribution: '&copy; Esri &mdash; Maxar, Earthstar Geographics'
    },
    terrain: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
      subdomains: undefined,
      maxZoom: 19,
      maxNativeZoom: 18,
      attribution: '&copy; Esri &mdash; USGS, NOAA'
    },
    dark: {
      url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      subdomains: ['a', 'b', 'c', 'd'],
      maxZoom: 20,
      maxNativeZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
    },
    light: {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      subdomains: ['a', 'b', 'c'],
      maxZoom: 19,
      maxNativeZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }
  };

  // Helper to create tile layer with fallback handler
  const createTileLayer = (theme: 'streets' | 'satellite' | 'terrain' | 'dark' | 'light') => {
    const cfg = TILE_CONFIGS[theme];
    const layer = L.tileLayer(cfg.url, {
      attribution: cfg.attribution,
      maxZoom: cfg.maxZoom,
      maxNativeZoom: cfg.maxNativeZoom,
      subdomains: cfg.subdomains || 'abc',
      keepBuffer: 6,
      updateWhenIdle: false,
      updateWhenZooming: true,
      crossOrigin: true
    });

    layer.on('tileerror', (errorTileEvent: any) => {
      const tileImg = errorTileEvent.tile as HTMLImageElement;
      if (tileImg && !tileImg.dataset.hasFallback) {
        tileImg.dataset.hasFallback = 'true';
        const { x, y, z } = errorTileEvent.coords;
        tileImg.src = `https://a.tile.openstreetmap.org/${z}/${x}/${y}.png`;
      }
    });

    return layer;
  };

  // Automatically activate 3D perspective mode when driving navigation starts
  useEffect(() => {
    if (isDriving) {
      setIs3D(true);
    }
  }, [isDriving]);

  const toggle3D = () => setIs3D(!is3D);
  const toggleLabels = () => setShowLabels(!showLabels);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Focused squarely on Greater Chennai
    const map = L.map(mapContainerRef.current, {
      center: [13.0400, 80.2200],
      zoom: 12,
      minZoom: 10,
      maxZoom: 19,
      zoomControl: false,
    });

    const initialTiles = createTileLayer(mapTheme).addTo(map);
    tileLayerRef.current = initialTiles;
    layersGroupRef.current = L.layerGroup().addTo(map);
    roadsGroupRef.current = L.layerGroup().addTo(map);
    routeLayerGroupRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    // Trigger immediate & progressive invalidateSize so container size settles perfectly
    setTimeout(() => map.invalidateSize(), 100);
    setTimeout(() => map.invalidateSize(), 400);
    setTimeout(() => map.invalidateSize(), 1000);

    // Google Maps interactive click: Set origin or destination directly from map
    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      const popupDiv = document.createElement('div');
      popupDiv.className = 'p-1 text-xs font-sans space-y-2';
      popupDiv.innerHTML = `
        <div class="font-bold text-slate-900 flex items-center justify-between border-b pb-1.5">
          <span>Selected Location</span>
          <span class="text-[10px] text-slate-500 font-normal">${lat.toFixed(4)}, ${lng.toFixed(4)}</span>
        </div>
        <div class="flex flex-col gap-1.5 pt-1">
          <button id="btn-map-set-origin" class="w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center gap-1.5 transition cursor-pointer">
            <span>🔵 Directions from here (Origin)</span>
          </button>
          <button id="btn-map-set-dest" class="w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-red-600 hover:bg-red-500 text-white flex items-center justify-center gap-1.5 transition cursor-pointer">
            <span>📍 Directions to here (Destination)</span>
          </button>
        </div>
      `;

      L.popup({ minWidth: 220 })
        .setLatLng(e.latlng)
        .setContent(popupDiv)
        .openOn(map);

      setTimeout(() => {
        const originBtn = document.getElementById('btn-map-set-origin');
        const destBtn = document.getElementById('btn-map-set-dest');
        if (originBtn && onSelectRoadSegment) {
          originBtn.onclick = () => {
            if ((window as any).__setOriginFromMap) {
              (window as any).__setOriginFromMap([lat, lng]);
            }
            map.closePopup();
          };
        }
        if (destBtn && onSelectRoadSegment) {
          destBtn.onclick = () => {
            if ((window as any).__setDestFromMap) {
              (window as any).__setDestFromMap([lat, lng]);
            }
            map.closePopup();
          };
        }
      }, 50);
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Ensure map adjusts seamlessly when container resizes or browser window dimensions change
  useEffect(() => {
    if (!mapContainerRef.current) return;
    const observer = new ResizeObserver(() => {
      mapInstanceRef.current?.invalidateSize({ debounceMoveend: true });
    });
    observer.observe(mapContainerRef.current);

    const handleWindowResize = () => {
      mapInstanceRef.current?.invalidateSize();
    };
    window.addEventListener('resize', handleWindowResize);
    window.addEventListener('orientationchange', handleWindowResize);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', handleWindowResize);
      window.removeEventListener('orientationchange', handleWindowResize);
    };
  }, []);

  // Invalidate map layout when 3D or Driving Mode transitions
  useEffect(() => {
    const timer = setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
    }, 250);
    return () => clearTimeout(timer);
  }, [is3D, isDriving]);

  // Update Tile Layer Theme cleanly without orphaned layers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const newTiles = createTileLayer(mapTheme).addTo(map);
    newTiles.bringToBack();
    tileLayerRef.current = newTiles;
  }, [mapTheme]);

  // Center on Selected Zone if changed
  useEffect(() => {
    if (selectedZone && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(selectedZone.center, 14, {
        duration: 1.2,
      });
    }
  }, [selectedZone]);

  // Center on Focused Road Segment if changed
  useEffect(() => {
    if (focusedRoad && mapInstanceRef.current && focusedRoad.coordinates.length > 0) {
      const midIdx = Math.floor(focusedRoad.coordinates.length / 2);
      mapInstanceRef.current.flyTo(focusedRoad.coordinates[midIdx], 14, {
        duration: 1.0,
      });
    }
  }, [focusedRoad]);

  // Draw Evaluated Road Network Segments with Real-Time Physics Risk
  useEffect(() => {
    const map = mapInstanceRef.current;
    const roadsGroup = roadsGroupRef.current;
    if (!map || !roadsGroup) return;

    roadsGroup.clearLayers();

    // In driving navigation mode, completely hide all red/orange road network risk overlays
    if (isDriving || !showRoadRiskSegments || !dynamicRoads) return;

    dynamicRoads.forEach((road) => {
      let color = '#10b981'; // safe
      let weight = 5;
      let dashArray: string | undefined = undefined;

      if (road.roadType === 'flyover') {
        color = '#0284c7'; // elevated flyover
        weight = 6;
      } else if (road.riskLevel === 'critical' || road.expectedDepthCm >= 55) {
        color = '#ef4444'; // critical submerged
        weight = 6;
        dashArray = '6, 6';
      } else if (road.riskLevel === 'high' || road.expectedDepthCm >= 25) {
        color = '#f97316'; // orange high risk
        weight = 5;
      } else if (road.riskLevel === 'moderate' || road.expectedDepthCm >= 12) {
        color = '#eab308'; // yellow moderate
        weight = 4;
      }

      // Casing polyline for high contrast
      const casing = L.polyline(road.coordinates, {
        color: '#ffffff',
        weight: weight + 3,
        opacity: 0.6,
        lineCap: 'round',
        lineJoin: 'round'
      });
      roadsGroup.addLayer(casing);

      const polyline = L.polyline(road.coordinates, {
        color,
        weight,
        opacity: 0.9,
        lineCap: 'round',
        lineJoin: 'round',
        dashArray
      });

      polyline.on('click', () => {
        if (onSelectRoadSegment) onSelectRoadSegment(road);
      });

      polyline.bindTooltip(`
        <div style="font-family: inherit; font-size: 11px; padding: 2px;">
          <strong style="color: ${color}; font-size: 12px;">${road.name}</strong><br/>
          Type: <strong style="text-transform: uppercase;">${road.roadType}</strong> | Elev: <strong>${road.elevationMsl}m MSL</strong><br/>
          Predicted Water: <strong style="color: ${color};">${road.expectedDepthCm} cm</strong> (${road.riskLevel.toUpperCase()})<br/>
          ${road.hydrologyExplanation}
        </div>
      `, { sticky: true });

      roadsGroup.addLayer(polyline);
    });
  }, [dynamicRoads, showRoadRiskSegments, onSelectRoadSegment, isDriving]);

  // Draw Main GIS Layers (Waterways, Inundation Zones, Facilities, Subways, Incidents)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layersGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    // In driving navigation mode, completely hide all red/orange flood zones, subways, and hazard pins
    if (isDriving) return;

    // 0. Draw Spatial Rainfall Precipitation Catchment (Rainfall Data Layer)
    if (stormCenter && rainfallRate > 0) {
      const stormCircle = L.circle(stormCenter, {
        radius: (stormRadiusKm || 14) * 1000,
        color: '#0284c7',
        fillColor: '#38bdf8',
        fillOpacity: Math.min(0.22, 0.05 + (rainfallRate / 250) * 0.18),
        weight: 2,
        dashArray: '5, 8'
      });
      stormCircle.bindTooltip(`
        <div style="font-size: 11px;">
          <strong style="color: #0284c7;">🌧️ Active Storm Footprint (Rainfall Layer)</strong><br/>
          Intensity: <strong>${rainfallRate} mm/hr</strong><br/>
          Catchment Radius: <strong>${stormRadiusKm || 14} km</strong>
        </div>
      `);
      layerGroup.addLayer(stormCircle);

      const stormIcon = L.divIcon({
        className: 'storm-epicenter-icon',
        html: `
          <div class="flex items-center justify-center w-7 h-7 rounded-full bg-sky-500/90 text-white text-xs border-2 border-white shadow-xl animate-pulse cursor-pointer">
            🌧️
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });
      const stormMarker = L.marker(stormCenter, { icon: stormIcon });
      stormMarker.bindTooltip(`<strong>🌧️ Storm Epicenter: ${rainfallRate} mm/hr</strong>`);
      layerGroup.addLayer(stormMarker);
    }

    // 1. Draw Waterways
    if (showWaterways) {
      waterBodies.forEach((body) => {
        if (body.type === 'marshland' && Array.isArray(body.coordinates)) {
          const polygon = L.polygon(body.coordinates as [number, number][], {
            color: '#0284c7',
            fillColor: '#0369a1',
            fillOpacity: 0.35,
            weight: 2,
            dashArray: '4, 6',
          });
          polygon.bindTooltip(`<strong>${body.name}</strong><br/>Status: ${body.status.replace('_', ' ').toUpperCase()}`, {
            direction: 'center',
            className: 'text-xs bg-slate-900/90 text-sky-200 border-sky-600 rounded p-1 shadow',
          });
          layerGroup.addLayer(polygon);
        } else if (Array.isArray(body.coordinates)) {
          const polyline = L.polyline(body.coordinates as [number, number][], {
            color: body.status === 'danger_overflow' ? '#ef4444' : '#0284c7',
            weight: body.name.includes('Adyar') ? 7 : 4,
            opacity: 0.85,
            lineCap: 'round',
            lineJoin: 'round',
          });
          
          polyline.bindTooltip(`
            <div style="font-family: inherit; font-size: 11px;">
              <strong style="color: #0284c7">${body.name}</strong><br/>
              Level: <strong>${body.currentLevelMeters}m</strong> (Danger: ${body.dangerLevelMeters}m)<br/>
              ${body.dischargeCusecs ? `Discharge: ${body.dischargeCusecs.toLocaleString()} cusecs` : ''}
            </div>
          `, { sticky: true });
          layerGroup.addLayer(polyline);
        }
      });
    }

    // 2. Draw Flood Inundation Zones with Unmistakable Safe vs Flood Styling
    if (showInundationPolygons) {
      zones.forEach((zone) => {
        const riskColors = {
          critical: { stroke: '#dc2626', fill: '#ef4444', opacity: 0.42, label: '🔴 SEVERELY FLOODED DANGER' },
          high: { stroke: '#ea580c', fill: '#f97316', opacity: 0.32, label: '🟠 HIGH FLOOD RISK' },
          moderate: { stroke: '#ca8a04', fill: '#eab308', opacity: 0.22, label: '🟡 MODERATE WATERLOGGING' },
          low: { stroke: '#059669', fill: '#10b981', opacity: 0.16, label: '🟢 SAFE ELEVATED HIGHLAND' },
        };

        const config = riskColors[zone.riskLevel];
        const isSafe = zone.riskLevel === 'low' || zone.waterDepthMeters === 0;

        const polygon = L.polygon(zone.polygon, {
          color: config.stroke,
          weight: selectedZone?.id === zone.id ? 3.5 : isSafe ? 1.5 : 2,
          fillColor: config.fill,
          fillOpacity: selectedZone?.id === zone.id ? 0.6 : config.opacity,
          dashArray: zone.riskLevel === 'critical' ? '4, 4' : undefined,
        });

        polygon.on('click', () => {
          onSelectZone(zone);
        });

        polygon.bindTooltip(`
          <div style="font-size: 11px; padding: 3px; font-family: inherit;">
            <div style="font-weight: 800; font-size: 12px; color: ${config.stroke}">${zone.name}</div>
            <div style="font-weight: 700; color: ${isSafe ? '#059669' : '#dc2626'}; margin-top: 2px;">
              ${config.label}
            </div>
            <div>Water Depth: <strong>${zone.waterDepthMeters > 0 ? `${zone.waterDepthMeters}m` : '0m (Dry Ground)'}</strong></div>
            <div>Road Access: <span style="text-transform: capitalize; font-weight: 600;">${zone.accessStatus.replace('_', ' ')}</span></div>
          </div>
        `, { sticky: true });

        layerGroup.addLayer(polygon);
      });
    }

    // 3. Draw Submerged Subways (with Live Ultrasonic IoT Sensor Data)
    if (showSubways) {
      subways.forEach((subway) => {
        const matchingSensor = subwaySensors?.find(
          (s) =>
            s.name.toLowerCase().includes(subway.name.toLowerCase()) ||
            subway.name.toLowerCase().includes(s.name.toLowerCase()) ||
            s.id.toLowerCase().includes(subway.id.toLowerCase())
        );
        const depthCm = matchingSensor ? matchingSensor.waterDepthCm : subway.waterDepthCm;
        const isClosed = matchingSensor ? matchingSensor.status === 'submerged_closed' : subway.status === 'closed_submerged';
        const isCaution = matchingSensor ? matchingSensor.status === 'caution' : subway.status === 'waterlogged_passable';

        const subwayIcon = L.divIcon({
          className: 'custom-subway-icon',
          html: `
            <div class="relative flex items-center justify-center w-7 h-7 rounded-full border-2 ${
              isClosed ? 'bg-red-600 border-white text-white animate-pulse' : isCaution ? 'bg-amber-500 border-white text-slate-900' : 'bg-emerald-600 border-white text-white'
            } shadow-lg cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
              <div class="absolute -bottom-4 bg-slate-900/90 text-white font-mono text-[9px] px-1 rounded whitespace-nowrap border border-slate-700 shadow">
                ${depthCm}cm
              </div>
            </div>
          `,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        const marker = L.marker(subway.center, { icon: subwayIcon });
        marker.on('click', () => {
          onSelectSubway(subway);
          if (matchingSensor && onSelectSubwaySensor) {
            onSelectSubwaySensor(matchingSensor);
          }
        });
        marker.bindTooltip(`
          <div style="font-size: 11px;">
            <strong style="color: ${isClosed ? '#ef4444' : isCaution ? '#f59e0b' : '#10b981'}">${subway.name}</strong><br/>
            Status: <strong>${isClosed ? '⛔ CLOSED / SUBMERGED' : isCaution ? '⚠️ WATERLOGGED' : '✅ CLEAR'}</strong><br/>
            Ultrasonic Depth: <strong>${depthCm} cm</strong> (${(depthCm / 30.48).toFixed(1)} ft)<br/>
            ${matchingSensor ? `Accumulation Rate: <strong>+${matchingSensor.rateOfRiseCmHr} cm/hr</strong><br/>Pump: <strong>${matchingSensor.pumpStatus.toUpperCase()} (${matchingSensor.pumpCapacityLps} L/s)</strong><br/>` : ''}
            Bypass: <strong>${matchingSensor?.alternateBypassName || subway.alternateRoute}</strong>
          </div>
        `);
        layerGroup.addLayer(marker);
      });
    }

    // 4. Draw Facilities (Hospitals & Relief Hubs)
    if (showFacilities) {
      facilities.forEach((facility) => {
        let iconBg = 'bg-blue-600';
        let badgeIcon = '+';
        if (facility.type === 'hospital') {
          iconBg = facility.accessStatus === 'fully_accessible' ? 'bg-emerald-600' : 'bg-rose-600';
          badgeIcon = 'H';
        } else if (facility.type === 'shelter') {
          iconBg = 'bg-orange-500';
          badgeIcon = '⛺';
        }

        const facilityIcon = L.divIcon({
          className: 'custom-facility-icon',
          html: `
            <div class="flex items-center justify-center w-6 h-6 rounded-full border-2 border-white text-white font-bold text-xs shadow-md ${iconBg} cursor-pointer hover:scale-110 transition-transform">
              ${badgeIcon}
            </div>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        const marker = L.marker(facility.coordinates, { icon: facilityIcon });
        marker.on('click', () => onSelectFacility(facility));
        marker.bindTooltip(`
          <div style="font-size: 11px;">
            <strong>${facility.name}</strong> (${facility.type.toUpperCase()})<br/>
            Access: <strong style="color: ${facility.accessStatus === 'fully_accessible' ? '#10b981' : '#ef4444'}">
              ${facility.accessStatus.replace('_', ' ').toUpperCase()}
            </strong>
          </div>
        `);
        layerGroup.addLayer(marker);
      });
    }

    // 5. Draw Citizen Incidents
    if (showIncidents) {
      incidents.forEach((inc) => {
        const incidentIcon = L.divIcon({
          className: 'custom-incident-icon',
          html: `
            <div class="relative flex items-center justify-center w-6 h-6 rounded-full bg-amber-500 border border-slate-900 text-slate-950 font-extrabold text-[11px] shadow-lg cursor-pointer">
              !
            </div>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        const marker = L.marker(inc.coordinates, { icon: incidentIcon });
        marker.on('click', () => onSelectIncident(inc));
        marker.bindTooltip(`
          <div style="font-size: 11px;">
            <strong style="color: #f59e0b">${inc.locationName}</strong><br/>
            Water: <strong>${inc.waterDepthFeet} ft</strong> | ${inc.category}
          </div>
        `);
        layerGroup.addLayer(marker);
      });
    }

  }, [
    zones,
    waterBodies,
    facilities,
    subways,
    incidents,
    reservoirs,
    selectedZone,
    showInundationPolygons,
    showWaterways,
    showFacilities,
    showSubways,
    showIncidents,
    subwaySensors,
    onSelectSubwaySensor,
    stormCenter,
    stormRadiusKm,
    rainfallRate,
    isDriving
  ]);

  // Draw Going Routes (Active & Alternatives) + Unique Origin/Destination Google Maps Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const routeGroup = routeLayerGroupRef.current;
    if (!map || !routeGroup) return;

    routeGroup.clearLayers();

    // Priority to dynamicRoute, fallback to selectedRoute
    const active = dynamicRoute;
    const pathCoords = active ? active.pathCoords : selectedRoute ? selectedRoute.pathCoords : null;
    if (!pathCoords || pathCoords.length === 0) return;

    // 1. Draw Alternative Going Routes ONLY when NOT in active navigation mode
    if (!isDriving && routes && routes.length > 1) {
      routes.forEach((altRoute) => {
        if (active && altRoute.id === active.id) return; // Skip currently active route

        // Alternative Route White Underlay Casing
        const altCasing = L.polyline(altRoute.pathCoords, {
          color: '#ffffff',
          weight: 7,
          opacity: 0.7,
          lineCap: 'round',
          lineJoin: 'round'
        });
        routeGroup.addLayer(altCasing);

        // Alternative Route Polyline
        const isDangerous = altRoute.maxWaterDepthCm > 45 || !altRoute.passable;
        const altColor = isDangerous ? '#f87171' : '#94a3b8';
        const altLine = L.polyline(altRoute.pathCoords, {
          color: altColor,
          weight: 4.5,
          opacity: 0.85,
          dashArray: '6, 6',
          lineCap: 'round',
          lineJoin: 'round'
        });

        altLine.on('click', () => {
          if (onSelectRouteId) onSelectRouteId(altRoute.id);
        });

        altLine.bindTooltip(`
          <div style="font-size: 11px; font-family: inherit; padding: 2px;">
            <div style="font-weight: 700; color: #334155;">Alternate: ${altRoute.title}</div>
            <div>Time: <strong>${altRoute.durationMinutes} min</strong> (${altRoute.distanceKm} km)</div>
            <div>Flood Risk: <strong style="color: ${isDangerous ? '#dc2626' : altRoute.isSafest ? '#16a34a' : '#ea580c'}">
              ${altRoute.isSafest ? '🟢 Safe' : `${altRoute.maxWaterDepthCm}cm Max Flood`}
            </strong></div>
            <div style="color: #2563eb; font-weight: 600; margin-top: 2px;">👉 Click to switch to this route</div>
          </div>
        `, { sticky: true });
        routeGroup.addLayer(altLine);
      });
    }

    // 2. Draw Active Going Route with Seamless, Continuous Polyline (ZERO IN-BETWEEN CUTS)
    if (isDriving) {
      // In Navigation Mode: Vibrant Google Maps Green line with radiant halo
      const outerGlow = L.polyline(pathCoords, {
        color: '#10b981',
        weight: 15,
        opacity: 0.35,
        lineCap: 'round',
        lineJoin: 'round'
      });
      routeGroup.addLayer(outerGlow);

      const whiteCasing = L.polyline(pathCoords, {
        color: '#ffffff',
        weight: 9,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round'
      });
      routeGroup.addLayer(whiteCasing);

      // Master continuous vibrant green polyline
      const navGreenLine = L.polyline(pathCoords, {
        color: '#00e676', // Google Maps vibrant navigation green
        weight: 6,
        opacity: 1,
        lineCap: 'round',
        lineJoin: 'round'
      });
      routeGroup.addLayer(navGreenLine);
    } else {
      // Planning Mode: Clean white casing polyline
      const casing = L.polyline(pathCoords, {
        color: '#ffffff',
        weight: 9,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round'
      });
      routeGroup.addLayer(casing);

      // Continuous base route polyline (guarantees no in-between cuts or breaks)
      const baseRouteColor = active?.isSafest ? '#10b981' : active && active.maxWaterDepthCm > 40 ? '#ef4444' : '#10b981';
      const baseLine = L.polyline(pathCoords, {
        color: baseRouteColor,
        weight: 6,
        opacity: 1,
        lineCap: 'round',
        lineJoin: 'round'
      });

      baseLine.bindTooltip(`
        <div style="font-family: inherit; font-size: 11px; padding: 2px;">
          <div style="font-weight: 800; color: ${baseRouteColor}; font-size: 12px;">${active?.title || 'Selected Route'}</div>
          <div>Time: <strong>${active?.durationMinutes} min</strong> (${active?.distanceKm} km)</div>
          <div>Flood Status: <strong style="color: ${active?.maxWaterDepthCm === 0 ? '#16a34a' : '#ea580c'}">
            ${active?.maxWaterDepthCm === 0 ? '🟢 0cm (Zero Flood Risk)' : `${active?.maxWaterDepthCm}cm Max Flood`}
          </strong></div>
          <div style="color: #64748b; margin-top: 2px;">${active?.explanation || ''}</div>
        </div>
      `, { sticky: true });

      routeGroup.addLayer(baseLine);
    }

    // 2b. Waypoint Landmark Name Chips along the Route (Controlled by showLabels toggle)
    if (showLabels && active && active.segments && active.segments.length > 0) {
      active.segments.forEach((seg, sIdx) => {
        if (seg.coordinates && seg.coordinates.length > 0) {
          const midPoint = seg.coordinates[Math.floor(seg.coordinates.length / 2)];
          const cleanName = seg.name.replace(/\(.*?\)/g, '').trim();
          
          const waypointIcon = L.divIcon({
            className: 'custom-waypoint-badge',
            html: `
              <div class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/95 dark:bg-slate-900/95 text-slate-800 dark:text-slate-100 text-[10px] font-extrabold shadow-md border border-slate-200 dark:border-slate-700 backdrop-blur-xs whitespace-nowrap pointer-events-none transform -translate-x-1/2 -translate-y-7 transition-all">
                <span class="w-1.5 h-1.5 rounded-full ${seg.roadType === 'flyover' ? 'bg-blue-600' : 'bg-emerald-600'}"></span>
                <span>${cleanName}</span>
              </div>
            `,
            iconSize: [0, 0],
            iconAnchor: [0, 0]
          });

          const labelMarker = L.marker(midPoint, { icon: waypointIcon, interactive: false, zIndexOffset: 500 });
          routeGroup.addLayer(labelMarker);
        }
      });
    }

    // 3. Compact Google Maps Origin Blue Puck Marker (Non-blocking, no bulky text box over roads)
    const startCoord = originCoords || pathCoords[0];
    const startTitle = originName || 'Your Location';
    const originIcon = L.divIcon({
      className: 'custom-unique-origin-marker',
      html: `
        <div class="relative flex items-center justify-center w-8 h-8 cursor-pointer">
          <span class="animate-ping absolute inline-flex h-7 w-7 rounded-full bg-blue-500 opacity-60"></span>
          <div class="w-6 h-6 rounded-full bg-blue-600 border-2 border-white shadow-xl flex items-center justify-center text-white">
            <div class="w-2 h-2 rounded-full bg-white"></div>
          </div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
    const originMarker = L.marker(startCoord, { icon: originIcon, zIndexOffset: 1000 });
    originMarker.bindTooltip(`<strong>📍 Origin / Your Location:</strong> ${startTitle}`);
    routeGroup.addLayer(originMarker);

    // 4. Compact Google Maps Red Destination Pin (Non-blocking, no bulky text box over roads)
    const endCoord = destinationCoords || pathCoords[pathCoords.length - 1];
    const endTitle = destinationName || 'Destination';
    const destIcon = L.divIcon({
      className: 'custom-unique-dest-marker',
      html: `
        <div class="relative flex flex-col items-center cursor-pointer">
          <div class="w-7 h-7 rounded-full bg-rose-600 border-2 border-white shadow-xl flex items-center justify-center text-white font-bold">
            <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          </div>
          <div class="w-1.5 h-1.5 bg-rose-600 -mt-0.5 rotate-45 border-r border-b border-white"></div>
        </div>
      `,
      iconSize: [28, 34],
      iconAnchor: [14, 32],
    });
    const destMarker = L.marker(endCoord, { icon: destIcon, zIndexOffset: 1000 });
    destMarker.bindTooltip(`<strong>🎯 Destination:</strong> ${endTitle}`);
    routeGroup.addLayer(destMarker);

    // 5. In Driving Mode: Render 3D Google Navigation Vehicle Marker
    if (isDriving) {
      const stepIdx = navigationStepIndex || 0;
      const totalPoints = pathCoords.length;
      const progressFraction = (active?.steps && active.steps.length > 0)
        ? Math.min(1, stepIdx / Math.max(1, active.steps.length - 1))
        : 0;
      const targetPointIdx = Math.min(totalPoints - 1, Math.floor(progressFraction * (totalPoints - 1)));
      const carCoord = pathCoords[targetPointIdx] || pathCoords[0];

      const carIcon = L.divIcon({
        className: 'custom-navigation-vehicle',
        html: `
          <div class="relative flex items-center justify-center w-11 h-11 pointer-events-none">
            <span class="animate-ping absolute inline-flex h-9 w-9 rounded-full bg-emerald-400 opacity-60"></span>
            <div class="w-9 h-9 rounded-full bg-emerald-500 border-2 border-white shadow-2xl flex items-center justify-center text-white">
              <svg class="w-5 h-5 drop-shadow transform rotate-45" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" />
              </svg>
            </div>
          </div>
        `,
        iconSize: [44, 44],
        iconAnchor: [22, 22]
      });

      const carMarker = L.marker(carCoord, { icon: carIcon, zIndexOffset: 2000 });
      routeGroup.addLayer(carMarker);

      // Smoothly pan camera to vehicle position
      map.panTo(carCoord, { animate: true, duration: 0.8 });
    } else {
      // Smooth fit bounds for route overview
      const bounds = L.latLngBounds(pathCoords);
      map.fitBounds(bounds, { padding: [80, 80], maxZoom: 14 });
    }

  }, [dynamicRoute, routes, selectedRoute, originName, destinationName, originCoords, destinationCoords, onSelectRouteId, isDriving, navigationStepIndex]);

  // Controls Handlers
  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();
  const handleResetView = () => {
    mapInstanceRef.current?.flyTo([13.0300, 80.2100], 12, { duration: 1 });
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      mapInstanceRef.current?.flyTo([13.0450, 80.2200], 13, { duration: 1 });
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const map = mapInstanceRef.current;
        if (!map) return;

        const userCoords: [number, number] = [pos.coords.latitude, pos.coords.longitude];

        if (userLocationMarkerRef.current) {
          userLocationMarkerRef.current.remove();
        }

        const userIcon = L.divIcon({
          className: 'custom-user-loc-icon',
          html: `
            <div class="relative flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 border-2 border-white shadow-xl">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <div class="w-2 h-2 rounded-full bg-white"></div>
            </div>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        const marker = L.marker(userCoords, { icon: userIcon }).addTo(map);
        marker.bindTooltip('<strong>Your Position</strong>', { permanent: false });
        userLocationMarkerRef.current = marker;

        map.flyTo(userCoords, 14, { duration: 1.2 });
      },
      () => {
        setIsLocating(false);
        mapInstanceRef.current?.flyTo([13.0450, 80.2200], 13, { duration: 1 });
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return (
    <div className={`relative w-full h-full min-h-105 overflow-hidden bg-slate-100 dark:bg-slate-950 font-sans select-none ${is3D ? 'map-3d-active' : ''}`}>
      {/* Map DOM Element */}
      <div ref={mapContainerRef} id="chennai-flood-map" className="w-full h-full z-10" />

      {/* Floating Live Doppler Radar Control & Timeline Scrubber HUD */}
      {isRadarActive && radarData && radarData.frames.length > 0 && (
        <div className="absolute top-3.5 left-1/2 -translate-x-1/2 z-30 pointer-events-auto bg-slate-950/92 border border-sky-500/40 backdrop-blur-xl px-3.5 py-2 rounded-2xl shadow-2xl flex flex-wrap items-center gap-2.5 text-white max-w-[94vw] sm:max-w-xl animate-fade-in">
          {/* Live Doppler Radar Pulse Badge */}
          <div className="flex items-center gap-2 pr-2 border-r border-slate-800">
            <div className="relative flex items-center justify-center w-3 h-3">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping absolute"></span>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </div>
            <div>
              <div className="text-[11px] font-black tracking-tight text-white flex items-center gap-1">
                <span>Doppler Radar</span>
                {isRadarLoading && <span className="text-[9px] text-sky-400 font-normal animate-pulse">Syncing...</span>}
              </div>
              <div className="text-[9px] text-slate-400">RainViewer Live Scan</div>
            </div>
          </div>

          {/* Play / Pause Toggle */}
          <button
            onClick={() => setIsRadarPlaying(!isRadarPlaying)}
            className="p-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white transition cursor-pointer shadow-xs"
            title={isRadarPlaying ? 'Pause Radar Loop' : 'Play Radar Loop'}
          >
            {isRadarPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>

          {/* Frame Timestamp & Forecast/Past badge */}
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-xs font-black text-sky-300">
              {radarData.frames[currentRadarIndex]?.timeLabel || 'Live'}
            </span>
            <span
              className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                radarData.frames[currentRadarIndex]?.isNowcast
                  ? 'bg-amber-500/30 text-amber-300 border border-amber-500/40'
                  : 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
              }`}
            >
              {radarData.frames[currentRadarIndex]?.isNowcast ? 'Nowcast' : 'Observed'}
            </span>
          </div>

          {/* Frame Step Scrubber / Dots */}
          <div className="flex items-center gap-1">
            {radarData.frames.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setCurrentRadarIndex(idx);
                  setIsRadarPlaying(false);
                }}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  idx === currentRadarIndex
                    ? 'w-4 bg-sky-400'
                    : 'w-1.5 bg-slate-700 hover:bg-slate-500'
                }`}
                title={`Frame ${idx + 1}/${radarData.frames.length}`}
              />
            ))}
          </div>

          {/* Opacity slider & Close */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
            <span className="text-[9px] text-slate-400 font-mono">{Math.round(radarOpacity * 100)}%</span>
            <input
              type="range"
              min="0.2"
              max="1"
              step="0.05"
              value={radarOpacity}
              onChange={(e) => setRadarOpacity(parseFloat(e.target.value))}
              className="w-12 accent-sky-400 cursor-pointer"
              title="Radar Layer Opacity"
            />
            <button
              onClick={() => handleToggleRadar(false)}
              className="p-1 text-slate-400 hover:text-white text-xs cursor-pointer ml-0.5"
              title="Close Radar"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Floating Bottom-Left Google Maps Layers Toggle Widget & Clean Legend */}
      <div className="absolute bottom-3 left-3 z-20 pointer-events-auto flex items-end gap-2.5">
        <div className="relative">
          {/* Authentic Google Maps Square "Layers" Button */}
          <button
            id="google-maps-layers-widget-btn"
            onClick={() => setShowLayerMenu(!showLayerMenu)}
            className="w-11 h-11 rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-lg border border-slate-200/90 dark:border-slate-800 flex flex-col items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer group"
            title="Layers & Map Details"
          >
            <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400 mb-0.5" />
            <span className="text-[8px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-tight">
              Layers
            </span>
          </button>

          {/* Expanded Google Maps Layers Drawer Menu */}
          {showLayerMenu && (
            <div className="absolute bottom-13 left-0 w-64 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-3 space-y-3 animate-fade-in z-30">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Map View & Layers
                </span>
                <button
                  onClick={() => setShowLayerMenu(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
                >
                  ✕
                </button>
              </div>

              {/* Basemap Switcher */}
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => setMapTheme('streets')}
                  className={`p-2 rounded-xl text-left text-xs font-semibold flex items-center gap-1.5 transition ${
                    mapTheme === 'streets'
                      ? 'bg-blue-600 text-white shadow-xs font-bold'
                      : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <span>Street Map</span>
                </button>
                <button
                  onClick={() => setMapTheme('satellite')}
                  className={`p-2 rounded-xl text-left text-xs font-semibold flex items-center gap-1.5 transition ${
                    mapTheme === 'satellite'
                      ? 'bg-blue-600 text-white shadow-xs font-bold'
                      : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <span>Satellite</span>
                </button>
                <button
                  onClick={() => setMapTheme('terrain')}
                  className={`p-2 rounded-xl text-left text-xs font-semibold flex items-center gap-1.5 transition ${
                    mapTheme === 'terrain'
                      ? 'bg-blue-600 text-white shadow-xs font-bold'
                      : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <span>Topography</span>
                </button>
                <button
                  onClick={() => setMapTheme('dark')}
                  className={`p-2 rounded-xl text-left text-xs font-semibold flex items-center gap-1.5 transition ${
                    mapTheme === 'dark'
                      ? 'bg-blue-600 text-white shadow-xs font-bold'
                      : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <span>Dark Ops</span>
                </button>
                <button
                  onClick={() => setMapTheme('light')}
                  className={`col-span-2 p-2 rounded-xl text-left text-xs font-semibold flex items-center gap-1.5 transition ${
                    mapTheme === 'light'
                      ? 'bg-blue-600 text-white shadow-xs font-bold'
                      : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <span>Clean OpenStreetMap</span>
                </button>
              </div>

              {/* GIS Flood & Safety Layers */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Active GIS Overlays
                </span>

                {onToggleRoadRiskSegments && (
                  <label className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-xs">
                    <span className="font-medium text-slate-700 dark:text-slate-200">
                      🛣️ Road Risk Network
                    </span>
                    <input
                      type="checkbox"
                      checked={showRoadRiskSegments}
                      onChange={(e) => onToggleRoadRiskSegments(e.target.checked)}
                      className="rounded accent-blue-600"
                    />
                  </label>
                )}

                {onToggleInundation && (
                  <label className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-xs">
                    <span className="font-medium text-slate-700 dark:text-slate-200">
                      🌊 Flood Zones (Polygons)
                    </span>
                    <input
                      type="checkbox"
                      checked={showInundationPolygons}
                      onChange={(e) => onToggleInundation(e.target.checked)}
                      className="rounded accent-blue-600"
                    />
                  </label>
                )}

                {onToggleWaterways && (
                  <label className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-xs">
                    <span className="font-medium text-slate-700 dark:text-slate-200">
                      💧 Rivers & Canals (Adyar/Cooum)
                    </span>
                    <input
                      type="checkbox"
                      checked={showWaterways}
                      onChange={(e) => onToggleWaterways(e.target.checked)}
                      className="rounded accent-blue-600"
                    />
                  </label>
                )}

                {onToggleSubways && (
                  <label className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-xs">
                    <span className="font-medium text-slate-700 dark:text-slate-200">
                      ⛔ Submerged Subways
                    </span>
                    <input
                      type="checkbox"
                      checked={showSubways}
                      onChange={(e) => onToggleSubways(e.target.checked)}
                      className="rounded accent-blue-600"
                    />
                  </label>
                )}

                {onToggleFacilities && (
                  <label className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-xs">
                    <span className="font-medium text-slate-700 dark:text-slate-200">
                      🏥 Critical Hospitals
                    </span>
                    <input
                      type="checkbox"
                      checked={showFacilities}
                      onChange={(e) => onToggleFacilities(e.target.checked)}
                      className="rounded accent-blue-600"
                    />
                  </label>
                )}

                {onToggleIncidents && (
                  <label className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-xs">
                    <span className="font-medium text-slate-700 dark:text-slate-200">
                      📢 Citizen Flood Reports
                    </span>
                    <input
                      type="checkbox"
                      checked={showIncidents}
                      onChange={(e) => onToggleIncidents(e.target.checked)}
                      className="rounded accent-blue-600"
                    />
                  </label>
                )}

                {/* Real-time Doppler Weather Radar Toggle */}
                <label className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-xs">
                  <span className="font-medium text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                      {isRadarActive && (
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      )}
                      <span
                        className={`relative inline-flex rounded-full h-2 w-2 ${
                          isRadarActive ? 'bg-emerald-500' : 'bg-slate-400'
                        }`}
                      ></span>
                    </span>
                    <span>📡 Live Doppler Radar</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={isRadarActive}
                    onChange={(e) => handleToggleRadar(e.target.checked)}
                    className="rounded accent-sky-500"
                  />
                </label>

                {/* Open Subway IoT Ultrasonic Sensor Drawer */}
                {onOpenSubwaySensors && (
                  <button
                    onClick={() => {
                      setShowLayerMenu(false);
                      onOpenSubwaySensors();
                    }}
                    className="w-full mt-1.5 py-1.5 px-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center justify-between transition cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <Radio className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                      <span>Subway IoT Sensors</span>
                    </span>
                    <span className="text-[10px] bg-rose-600 text-white px-1.5 py-0.2 rounded font-black">
                      {subwaySensors?.filter((s) => s.status === 'submerged_closed').length ?? 4} CLOSED
                    </span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Floating Comprehensive Flood & Route Safety Legend (Hidden in Driving Navigation Mode) */}
        {!isDriving && (
          <div className="hidden sm:flex items-center gap-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-md text-xs text-slate-700 dark:text-slate-300">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white text-[11px]">
              <span>Road & Route Safety:</span>
            </div>
            <div className="flex items-center gap-1" title="Safe elevated roads / Highland (0cm flood)">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs"></span>
              <span className="text-[10px] font-medium text-emerald-700 dark:text-emerald-400">Safe (Dry)</span>
            </div>
            <div className="flex items-center gap-1" title="Moderate waterlogging (12-25cm flood)">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-xs"></span>
              <span className="text-[10px] font-medium text-amber-700 dark:text-amber-400">12-25cm</span>
            </div>
            <div className="flex items-center gap-1" title="High risk flood (25-55cm flood)">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-xs"></span>
              <span className="text-[10px] font-medium text-orange-700 dark:text-orange-400">25-55cm</span>
            </div>
            <div className="flex items-center gap-1" title="Severe submerged danger (>55cm flood)">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse shadow-xs"></span>
              <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold">&gt;55cm Flooded</span>
            </div>

            <div className="h-3 w-px bg-slate-200 dark:bg-slate-700 mx-0.5"></div>

            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping"></span>
                Your Location
              </span>
              <span className="flex items-center gap-1 text-[10px] text-rose-600 dark:text-rose-400 font-medium">
                <span>🎯</span>
                Destination
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Floating Bottom-Right Controls */}
      <div className="absolute bottom-3 right-3 z-20 flex flex-col gap-2 pointer-events-auto">
        {/* Live Doppler Radar Quick Toggle Button */}
        <button
          id="toggle-radar-btn"
          onClick={() => handleToggleRadar(!isRadarActive)}
          title={isRadarActive ? "Hide Live Doppler Radar" : "Show Live Doppler Radar (RainViewer)"}
          className={`relative w-10 h-10 rounded-full font-bold text-xs shadow-lg border flex items-center justify-center transition cursor-pointer ${
            isRadarActive
              ? 'bg-sky-600 text-white border-sky-400 shadow-sky-500/30 ring-2 ring-sky-400/50'
              : 'bg-white/95 dark:bg-slate-900/95 text-slate-800 dark:text-slate-100 border-slate-200/90 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Radio className={`w-4 h-4 ${isRadarActive ? 'text-white animate-pulse' : 'text-sky-500'}`} />
          {isRadarActive && (
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-900"></span>
          )}
        </button>

        {/* Subway IoT Sensors Quick Trigger Button */}
        {onOpenSubwaySensors && (
          <button
            id="toggle-subway-sensors-btn"
            onClick={onOpenSubwaySensors}
            title="Open Subway IoT Water Level Sensors"
            className="relative w-10 h-10 rounded-full font-bold text-xs shadow-lg border bg-white/95 dark:bg-slate-900/95 text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-slate-800 flex items-center justify-center transition cursor-pointer"
          >
            <AlertTriangle className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 min-w-4.5 h-4.5 bg-rose-600 text-white rounded-full text-[9px] font-black flex items-center justify-center px-1 border border-white">
              {subwaySensors?.filter((s) => s.status === 'submerged_closed').length ?? 4}
            </span>
          </button>
        )}

        {/* 3D / 2D Perspective Toggle Button */}
        <button
          id="toggle-3d-btn"
          onClick={toggle3D}
          title={is3D ? "Switch to 2D Flat View" : "Switch to 3D Navigation Perspective"}
          className={`w-10 h-10 rounded-full font-black text-xs shadow-lg border flex items-center justify-center transition cursor-pointer ${
            is3D
              ? 'bg-blue-600 text-white border-blue-500 shadow-blue-500/30 ring-2 ring-blue-400/50'
              : 'bg-white/95 dark:bg-slate-900/95 text-slate-800 dark:text-slate-100 border-slate-200/90 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <span>{is3D ? '3D' : '2D'}</span>
        </button>

        {/* Show/Hide Route Landmark Labels Toggle */}
        <button
          id="toggle-labels-btn"
          onClick={toggleLabels}
          title={showLabels ? "Hide Route Labels" : "Show Route Labels"}
          className={`w-10 h-10 rounded-full shadow-lg border flex items-center justify-center transition cursor-pointer ${
            showLabels
              ? 'bg-white/95 dark:bg-slate-900/95 text-emerald-600 dark:text-emerald-400 border-emerald-400/80 shadow-emerald-500/20 ring-2 ring-emerald-400/30'
              : 'bg-white/95 dark:bg-slate-900/95 text-slate-400 border-slate-200/90 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          {showLabels ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </button>

        {/* Geolocation Button */}
        <button
          id="locate-me-btn"
          onClick={handleLocateMe}
          title="My Location"
          disabled={isLocating}
          className={`w-10 h-10 rounded-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md hover:bg-white dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-lg border border-slate-200/90 dark:border-slate-800 flex items-center justify-center transition cursor-pointer ${
            isLocating ? 'animate-pulse text-blue-600' : ''
          }`}
        >
          <Crosshair className={`w-4 h-4 ${isLocating ? 'animate-spin text-blue-600' : 'text-blue-600 dark:text-blue-400'}`} />
        </button>

        {/* Compass Reset */}
        <button
          id="reset-view-btn"
          onClick={handleResetView}
          title="Recenter Chennai"
          className="w-10 h-10 rounded-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md hover:bg-white dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-lg border border-slate-200/90 dark:border-slate-800 flex items-center justify-center transition cursor-pointer"
        >
          <Compass className="w-4 h-4 text-slate-600 dark:text-slate-300" />
        </button>

        {/* Zoom Controls Pill */}
        <div className="flex flex-col rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-lg border border-slate-200/90 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
          <button
            id="zoom-in-btn"
            onClick={handleZoomIn}
            title="Zoom In"
            className="w-10 h-10 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            id="zoom-out-btn"
            onClick={handleZoomOut}
            title="Zoom Out"
            className="w-10 h-10 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
