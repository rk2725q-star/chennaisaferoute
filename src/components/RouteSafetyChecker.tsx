import React, { useState } from 'react';
import { RouteOption } from '../types';
import { PRESET_ROUTES } from '../data/chennaiData';
import { Navigation, ShieldCheck, AlertTriangle, Clock, Gauge, ArrowRight, CheckCircle2, XCircle } from 'lucide-react';

interface RouteSafetyCheckerProps {
  selectedRoute: RouteOption | null;
  onSelectRoute: (route: RouteOption | null) => void;
}

export const RouteSafetyChecker: React.FC<RouteSafetyCheckerProps> = ({
  selectedRoute,
  onSelectRoute,
}) => {
  const [activeRouteId, setActiveRouteId] = useState<string>(
    selectedRoute?.id || PRESET_ROUTES[0].id
  );

  const currentRoute = PRESET_ROUTES.find((r) => r.id === activeRouteId) || PRESET_ROUTES[0];

  const handleRouteChange = (routeId: string) => {
    setActiveRouteId(routeId);
    const target = PRESET_ROUTES.find((r) => r.id === routeId);
    if (target) {
      onSelectRoute(target);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/95 text-slate-100 rounded-xl border border-slate-800 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Navigation className="w-5 h-5 text-sky-400" />
            <h2 className="font-semibold text-slate-100 text-sm tracking-wide">
              Emergency Access Route Planner
            </h2>
          </div>
          <span className="text-[11px] text-slate-400 font-medium bg-slate-800 px-2 py-0.5 rounded">
            GIS Path Analysis
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Analyzes real-time street water depth, impassable subways, and elevated corridor detours.
        </p>
      </div>

      {/* Route Selector Dropdown */}
      <div className="p-3 bg-slate-950/60 border-b border-slate-800 space-y-2">
        <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
          Select Mission / Evacuation Corridor:
        </label>
        <select
          value={activeRouteId}
          onChange={(e) => handleRouteChange(e.target.value)}
          className="w-full bg-slate-900 border border-slate-700/80 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-medium cursor-pointer"
        >
          {PRESET_ROUTES.map((route) => (
            <option key={route.id} value={route.id}>
              {route.originName} ➔ {route.destName} (
              {route.routeType === 'recommended_safe'
                ? '✅ Recommended Safe'
                : route.routeType === 'alternate_elevated'
                ? '🛡️ Elevated Detour'
                : '⚠️ Submerged Road Risk'}
              )
            </option>
          ))}
        </select>
      </div>

      {/* Active Route Details */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Origin to Destination Visual Card */}
        <div className="bg-slate-950/70 p-3.5 rounded-lg border border-slate-800/80 relative">
          <div className="flex items-center justify-between mb-3">
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                currentRoute.safetyScorePercent >= 80
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                  : currentRoute.safetyScorePercent >= 60
                  ? 'bg-amber-950 text-amber-300 border border-amber-700'
                  : 'bg-rose-950 text-rose-300 border border-rose-700'
              }`}
            >
              {currentRoute.routeType.replace('_', ' ')}
            </span>

            <div className="flex items-center gap-1 text-xs">
              <ShieldCheck
                className={`w-4 h-4 ${
                  currentRoute.safetyScorePercent >= 80 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              />
              <span className="font-bold text-white text-sm">
                {currentRoute.safetyScorePercent}%
              </span>
              <span className="text-[10px] text-slate-400">Safety Index</span>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px] border border-emerald-500/40">
                A
              </span>
              <div>
                <div className="text-[10px] text-slate-400">Origin / Residential Area</div>
                <div className="font-semibold text-slate-100">{currentRoute.originName}</div>
              </div>
            </div>

            <div className="pl-2.5 border-l-2 border-dashed border-slate-700 my-0.5 ml-2 h-4" />

            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-[10px] border border-rose-500/40">
                B
              </span>
              <div>
                <div className="text-[10px] text-slate-400">Destination / Hospital Facility</div>
                <div className="font-semibold text-slate-100">{currentRoute.destName}</div>
              </div>
            </div>
          </div>

          {/* Metrics Pill Grid */}
          <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-800 text-center">
            <div className="bg-slate-900/80 p-1.5 rounded">
              <div className="text-[10px] text-slate-400">Distance</div>
              <div className="text-xs font-bold text-slate-200">{currentRoute.distanceKm} km</div>
            </div>
            <div className="bg-slate-900/80 p-1.5 rounded">
              <div className="text-[10px] text-slate-400">Travel Time</div>
              <div className="text-xs font-bold text-slate-200">~{currentRoute.travelTimeMins} min</div>
            </div>
            <div className="bg-slate-900/80 p-1.5 rounded">
              <div className="text-[10px] text-slate-400">Max Water Depth</div>
              <div
                className={`text-xs font-bold ${
                  currentRoute.maxWaterDepthCm > 40 ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {currentRoute.maxWaterDepthCm} cm
              </div>
            </div>
          </div>
        </div>

        {/* Tactical Advice Card */}
        <div
          className={`p-3 rounded-lg border text-xs leading-relaxed ${
            currentRoute.safetyScorePercent >= 70
              ? 'bg-emerald-950/30 border-emerald-800/80 text-emerald-200'
              : 'bg-rose-950/30 border-rose-800/80 text-rose-200'
          }`}
        >
          <div className="font-semibold flex items-center gap-1.5 mb-1 text-white">
            {currentRoute.safetyScorePercent >= 70 ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-400" />
            )}
            Navigation Advisory
          </div>
          {currentRoute.safePassageAdvice}
        </div>

        {/* Flood Warnings */}
        <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800/80">
          <div className="text-[11px] font-semibold text-amber-300 flex items-center gap-1.5 mb-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            Specific Hazards Encountered ({currentRoute.warnings.length})
          </div>
          <ul className="space-y-1.5 text-[11px] text-slate-300">
            {currentRoute.warnings.map((warn, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-amber-500 font-bold">•</span>
                <span>{warn}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Action Button: Trace on Map */}
        <button
          onClick={() => onSelectRoute(currentRoute)}
          className="w-full py-2.5 px-4 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-sky-600/30 cursor-pointer"
        >
          <Navigation className="w-4 h-4" />
          Focus & Trace Route on Map
        </button>
      </div>
    </div>
  );
};
