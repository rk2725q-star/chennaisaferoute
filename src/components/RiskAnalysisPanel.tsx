import React, { useState } from 'react';
import { FloodZone, FloodRiskLevel } from '../types';
import { ShieldAlert, Search, Filter, Layers, Users, Droplets, ArrowUpRight, AlertCircle } from 'lucide-react';

interface RiskAnalysisPanelProps {
  zones: FloodZone[];
  selectedZone: FloodZone | null;
  onSelectZone: (zone: FloodZone) => void;
  showInundationPolygons: boolean;
  setShowInundationPolygons: (val: boolean) => void;
  showWaterways: boolean;
  setShowWaterways: (val: boolean) => void;
  showFacilities: boolean;
  setShowFacilities: (val: boolean) => void;
  showSubways: boolean;
  setShowSubways: (val: boolean) => void;
  showIncidents: boolean;
  setShowIncidents: (val: boolean) => void;
}

export const RiskAnalysisPanel: React.FC<RiskAnalysisPanelProps> = ({
  zones,
  selectedZone,
  onSelectZone,
  showInundationPolygons,
  setShowInundationPolygons,
  showWaterways,
  setShowWaterways,
  showFacilities,
  setShowFacilities,
  showSubways,
  setShowSubways,
  showIncidents,
  setShowIncidents,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRisk, setFilterRisk] = useState<FloodRiskLevel | 'all'>('all');

  const filteredZones = zones.filter((zone) => {
    const matchesSearch =
      zone.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      zone.borough.toLowerCase().includes(searchQuery.toLowerCase()) ||
      zone.drainageBasin.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRisk = filterRisk === 'all' || zone.riskLevel === filterRisk;
    return matchesSearch && matchesRisk;
  });

  const criticalCount = zones.filter((z) => z.riskLevel === 'critical').length;
  const highCount = zones.filter((z) => z.riskLevel === 'high').length;
  const blockedAccessCount = zones.filter((z) => z.accessStatus === 'blocked').length;
  const totalVulnerablePop = zones.reduce((sum, z) => sum + z.vulnerablePopulation, 0);

  return (
    <div className="flex flex-col h-full bg-slate-900/95 text-slate-100 rounded-xl border border-slate-800 shadow-xl overflow-hidden">
      {/* Header Metrics */}
      <div className="p-4 border-b border-slate-800 bg-slate-900">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-500" />
            <h2 className="font-semibold text-slate-100 text-sm tracking-wide">
              City Access Risk Assessment
            </h2>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-950/80 text-rose-300 border border-rose-800/80">
            Red Alert Active
          </span>
        </div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
            <div className="text-[10px] uppercase font-semibold text-slate-400">Critical Zones</div>
            <div className="text-xl font-bold text-rose-400 mt-0.5">{criticalCount}</div>
            <div className="text-[10px] text-slate-400">{highCount} High Risk</div>
          </div>
          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
            <div className="text-[10px] uppercase font-semibold text-slate-400">Corridors Cut</div>
            <div className="text-xl font-bold text-amber-400 mt-0.5">{blockedAccessCount}</div>
            <div className="text-[10px] text-slate-400">4 Subways Closed</div>
          </div>
          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
            <div className="text-[10px] uppercase font-semibold text-slate-400">Vulnerable Pop.</div>
            <div className="text-xl font-bold text-sky-400 mt-0.5">
              {(totalVulnerablePop / 100000).toFixed(1)}L
            </div>
            <div className="text-[10px] text-slate-400">Across 10 Basins</div>
          </div>
        </div>
      </div>

      {/* GIS Layers Control Toggles */}
      <div className="px-4 py-3 bg-slate-950/40 border-b border-slate-800/80">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-2">
          <span className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-sky-400" />
            GIS Active Layers
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5 text-xs">
          <button
            onClick={() => setShowInundationPolygons(!showInundationPolygons)}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition border ${
              showInundationPolygons
                ? 'bg-rose-950/60 border-rose-600 text-rose-200'
                : 'bg-slate-900 border-slate-800 text-slate-500 line-through'
            }`}
          >
            🌊 Flood Polygons
          </button>
          <button
            onClick={() => setShowWaterways(!showWaterways)}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition border ${
              showWaterways
                ? 'bg-sky-950/60 border-sky-600 text-sky-200'
                : 'bg-slate-900 border-slate-800 text-slate-500 line-through'
            }`}
          >
            🏞️ Rivers & Canals
          </button>
          <button
            onClick={() => setShowFacilities(!showFacilities)}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition border ${
              showFacilities
                ? 'bg-emerald-950/60 border-emerald-600 text-emerald-200'
                : 'bg-slate-900 border-slate-800 text-slate-500 line-through'
            }`}
          >
            🏥 Hospitals & Shelters
          </button>
          <button
            onClick={() => setShowSubways(!showSubways)}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition border ${
              showSubways
                ? 'bg-amber-950/60 border-amber-600 text-amber-200'
                : 'bg-slate-900 border-slate-800 text-slate-500 line-through'
            }`}
          >
            🚧 Submerged Subways
          </button>
          <button
            onClick={() => setShowIncidents(!showIncidents)}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition border ${
              showIncidents
                ? 'bg-purple-950/60 border-purple-600 text-purple-200'
                : 'bg-slate-900 border-slate-800 text-slate-500 line-through'
            }`}
          >
            📢 Citizen Alerts
          </button>
        </div>
      </div>

      {/* Zone Search & Filter */}
      <div className="p-3 border-b border-slate-800/80 bg-slate-900/60 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search locality (e.g., Velachery, Saidapet, Mudichur)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700/80 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>

        <select
          value={filterRisk}
          onChange={(e) => setFilterRisk(e.target.value as FloodRiskLevel | 'all')}
          className="bg-slate-950 border border-slate-700/80 rounded-lg px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-sky-500 cursor-pointer"
        >
          <option value="all">All Risks</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="moderate">Moderate</option>
        </select>
      </div>

      {/* Zone List Scrollable */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/50 p-2 space-y-1.5">
        {filteredZones.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400">
            No flood localities found matching your search.
          </div>
        ) : (
          filteredZones.map((zone) => {
            const isSelected = selectedZone?.id === zone.id;
            return (
              <div
                key={zone.id}
                id={`zone-item-${zone.id}`}
                onClick={() => onSelectZone(zone)}
                className={`p-3 rounded-lg cursor-pointer transition-all border ${
                  isSelected
                    ? 'bg-sky-950/40 border-sky-500/80 shadow-md'
                    : 'bg-slate-950/50 border-slate-800/60 hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-semibold text-slate-100 text-xs">{zone.name}</h3>
                      <span className="text-[10px] text-slate-400">Zone {zone.zoneNumber}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{zone.borough}</div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      zone.riskLevel === 'critical'
                        ? 'bg-rose-950/90 text-rose-300 border border-rose-700'
                        : zone.riskLevel === 'high'
                        ? 'bg-amber-950/90 text-amber-300 border border-amber-700'
                        : 'bg-yellow-950/90 text-yellow-300 border border-yellow-700'
                    }`}
                  >
                    {zone.riskLevel}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-800/60 text-[11px]">
                  <div className="flex items-center gap-1 text-slate-300">
                    <Droplets className="w-3 h-3 text-sky-400" />
                    <span>
                      Avg Depth: <strong className="text-white">{zone.waterDepthMeters}m</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-300">
                    <Users className="w-3 h-3 text-purple-400" />
                    <span>Pop: {(zone.vulnerablePopulation / 1000).toFixed(0)}k</span>
                  </div>
                </div>

                <div className="mt-2 text-[11px] text-slate-400 line-clamp-2">
                  {zone.criticalIssues}
                </div>

                <div className="mt-2 flex items-center justify-between text-[10px]">
                  <span className={`font-semibold ${
                    zone.accessStatus === 'blocked'
                      ? 'text-rose-400'
                      : zone.accessStatus === 'restricted'
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}>
                    Access: {zone.accessStatus.toUpperCase()}
                  </span>
                  <span className="text-sky-400 flex items-center gap-0.5 font-medium hover:underline">
                    View on Map <ArrowUpRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
