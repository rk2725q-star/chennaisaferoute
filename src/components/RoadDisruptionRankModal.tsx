import React, { useState, useMemo } from 'react';
import { DynamicRoadSegment, TransportMode } from '../utils/floodEngine';
import {
  BarChart3,
  Search,
  AlertTriangle,
  ShieldCheck,
  Navigation,
  Car,
  Bike,
  Footprints,
  ShieldAlert,
  ArrowUpDown,
  Filter,
  X,
  Waves,
  Maximize2
} from 'lucide-react';

interface RoadDisruptionRankModalProps {
  isOpen: boolean;
  onClose: () => void;
  rankedRoads: DynamicRoadSegment[];
  onFocusRoadOnMap?: (road: DynamicRoadSegment) => void;
  rainfallRate: number;
}

export const RoadDisruptionRankModal: React.FC<RoadDisruptionRankModalProps> = ({
  isOpen,
  onClose,
  rankedRoads,
  onFocusRoadOnMap,
  rainfallRate
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'critical' | 'subway' | 'passable'>('all');
  const [selectedVehicle, setSelectedVehicle] = useState<TransportMode>('drive');

  const filteredRoads = useMemo(() => {
    return rankedRoads.filter((road) => {
      const matchesSearch =
        road.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        road.roadType.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      if (filterType === 'critical') return road.riskLevel === 'critical' || road.riskLevel === 'high';
      if (filterType === 'subway') return road.roadType === 'subway';
      if (filterType === 'passable') return road.passableFor[selectedVehicle];
      return true;
    });
  }, [rankedRoads, searchTerm, filterType, selectedVehicle]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div
        id="road-disruption-ranking-modal"
        className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-800 dark:text-slate-100 flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="px-5 py-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-base text-slate-900 dark:text-white">
                  Road Disruption Rankings
                </h3>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {rankedRoads.length} Analyzed
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Sorted by predicted disruption score under current rain ({rainfallRate} mm/hr)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="p-4 bg-slate-100/70 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search road name, subway, highway..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-slate-100 placeholder-slate-400"
            />
          </div>

          {/* Vehicle Passability Selector */}
          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-300 dark:border-slate-700 text-xs">
            <span className="text-[10px] text-slate-400 px-1 font-semibold">Passable for:</span>
            <button
              onClick={() => setSelectedVehicle('drive')}
              className={`px-2 py-1 rounded-lg flex items-center gap-1 transition ${
                selectedVehicle === 'drive'
                  ? 'bg-sky-600 text-white font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title="Car / 4-Wheeler"
            >
              <Car className="w-3 h-3" />
              <span>Car</span>
            </button>
            <button
              onClick={() => setSelectedVehicle('bike')}
              className={`px-2 py-1 rounded-lg flex items-center gap-1 transition ${
                selectedVehicle === 'bike'
                  ? 'bg-sky-600 text-white font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title="Two-Wheeler (Stalls >18cm)"
            >
              <Bike className="w-3 h-3" />
              <span>Bike</span>
            </button>
            <button
              onClick={() => setSelectedVehicle('emergency')}
              className={`px-2 py-1 rounded-lg flex items-center gap-1 transition ${
                selectedVehicle === 'emergency'
                  ? 'bg-sky-600 text-white font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title="High Axle / Ambulance"
            >
              <ShieldAlert className="w-3 h-3" />
              <span>Rescue</span>
            </button>
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-1.5 text-xs">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                filterType === 'all'
                  ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900'
                  : 'bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-300'
              }`}
            >
              All Roads
            </button>
            <button
              onClick={() => setFilterType('critical')}
              className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                filterType === 'critical'
                  ? 'bg-rose-600 text-white'
                  : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 hover:bg-rose-200'
              }`}
            >
              High Risk / Flooded
            </button>
            <button
              onClick={() => setFilterType('subway')}
              className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                filterType === 'subway'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 hover:bg-indigo-200'
              }`}
            >
              Subways Only
            </button>
          </div>
        </div>

        {/* Ranked Road Cards List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredRoads.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              No road segments match your search criteria.
            </div>
          ) : (
            filteredRoads.map((road, idx) => {
              const rankNumber = rankedRoads.indexOf(road) + 1;
              const isPassable = road.passableFor[selectedVehicle];

              return (
                <div
                  key={road.id}
                  className={`p-3.5 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    road.riskLevel === 'critical'
                      ? 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-300 dark:border-rose-900/60'
                      : road.riskLevel === 'high'
                      ? 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-300 dark:border-amber-900/60'
                      : road.riskLevel === 'moderate'
                      ? 'bg-yellow-50/50 dark:bg-yellow-950/20 border-yellow-300 dark:border-yellow-900/40'
                      : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  {/* Left info */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                        rankNumber <= 3
                          ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                          : rankNumber <= 7
                          ? 'bg-amber-600 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      #{rankNumber}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                          {road.name}
                        </h4>
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          {road.roadType}
                        </span>
                        {!isPassable && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-600 text-white flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Blocked for {selectedVehicle}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-1">
                        {road.hydrologyExplanation}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                        <span>Elevation: <strong>{road.elevationMsl}m MSL</strong></span>
                        <span>SWD Drain: <strong>{road.swdCapacityMmHr} mm/hr</strong></span>
                        <span>Length: <strong>{road.lengthKm} km</strong></span>
                        <span>Speed: <strong>{road.effectiveSpeedKmh} km/h</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Right metrics & Actions */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">Predicted Water</div>
                        <div className={`text-base font-extrabold ${
                          road.expectedDepthCm > 40
                            ? 'text-rose-600 dark:text-rose-400'
                            : road.expectedDepthCm > 15
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}>
                          {road.expectedDepthCm} cm
                        </div>
                      </div>

                      <div className="text-right ml-2">
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">Disruption</div>
                        <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                          {road.disruptionScore}/100
                        </div>
                      </div>
                    </div>

                    {onFocusRoadOnMap && (
                      <button
                        onClick={() => {
                          onFocusRoadOnMap(road);
                          onClose();
                        }}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-sky-600 hover:text-white dark:hover:bg-sky-600 text-slate-700 dark:text-slate-200 transition flex items-center gap-1 cursor-pointer"
                      >
                        <Maximize2 className="w-3 h-3" />
                        <span>Locate</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div>
            Showing {filteredRoads.length} of {rankedRoads.length} road network segments
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold rounded-lg bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 hover:opacity-90 transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
