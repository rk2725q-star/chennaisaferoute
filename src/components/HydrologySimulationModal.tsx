import React from 'react';
import { EngineParams } from '../utils/floodEngine';
import {
  Sliders,
  CloudRain,
  Waves,
  AlertTriangle,
  RefreshCw,
  Zap,
  Info,
  Compass,
  X
} from 'lucide-react';

interface HydrologySimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  params: EngineParams;
  onUpdateParams: (newParams: EngineParams) => void;
  onReset: () => void;
  criticalRoadsCount: number;
}

export const HydrologySimulationModal: React.FC<HydrologySimulationModalProps> = ({
  isOpen,
  onClose,
  params,
  onUpdateParams,
  onReset,
  criticalRoadsCount
}) => {
  if (!isOpen) return null;

  const handlePreset = (preset: 'normal' | 'cloudburst' | 'record_2015' | 'dry') => {
    switch (preset) {
      case 'cloudburst':
        onUpdateParams({
          rainfallRateMmHr: 180,
          cumulative24hMm: 340,
          stormCenter: [12.9800, 80.2200], // Velachery / South Chennai
          stormRadiusKm: 12,
          chembarambakkamDischargeCusecs: 14000,
          highTideActive: true
        });
        break;
      case 'record_2015':
        onUpdateParams({
          rainfallRateMmHr: 130,
          cumulative24hMm: 450,
          stormCenter: [13.0100, 80.0800], // Upstream catchment
          stormRadiusKm: 25,
          chembarambakkamDischargeCusecs: 29000,
          highTideActive: true
        });
        break;
      case 'normal':
        onUpdateParams({
          rainfallRateMmHr: 45,
          cumulative24hMm: 80,
          stormCenter: [13.0450, 80.2200],
          stormRadiusKm: 18,
          chembarambakkamDischargeCusecs: 4500,
          highTideActive: false
        });
        break;
      case 'dry':
        onUpdateParams({
          rainfallRateMmHr: 0,
          cumulative24hMm: 0,
          stormCenter: [13.0450, 80.2200],
          stormRadiusKm: 20,
          chembarambakkamDischargeCusecs: 800,
          highTideActive: false
        });
        break;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div
        id="hydrology-simulator-modal"
        className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-800 dark:text-slate-100 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-5 py-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-500/20">
              <CloudRain className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-slate-900 dark:text-white flex items-center gap-2">
                Hydrological Simulation Engine
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300 border border-sky-300 dark:border-sky-800">
                  Physics-Based
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Predicts road waterlogging from DEM elevation, drainage deficit, and rainfall
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

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Quick Preset Scenarios */}
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider block mb-2">
              Test Unseen Rainfall Scenarios
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handlePreset('cloudburst')}
                className="p-2.5 rounded-xl border border-rose-300 dark:border-rose-900 bg-rose-50/60 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition text-left cursor-pointer"
              >
                <div className="font-bold text-xs flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-rose-500" />
                  Cloudburst
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">180 mm/hr burst</div>
              </button>

              <button
                type="button"
                onClick={() => handlePreset('record_2015')}
                className="p-2.5 rounded-xl border border-amber-300 dark:border-amber-900 bg-amber-50/60 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition text-left cursor-pointer"
              >
                <div className="font-bold text-xs flex items-center gap-1">
                  <Waves className="w-3.5 h-3.5 text-amber-500" />
                  Extreme Surge
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">29k cusecs Adyar</div>
              </button>

              <button
                type="button"
                onClick={() => handlePreset('normal')}
                className="p-2.5 rounded-xl border border-sky-300 dark:border-sky-900 bg-sky-50/60 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/60 transition text-left cursor-pointer"
              >
                <div className="font-bold text-xs flex items-center gap-1">
                  <CloudRain className="w-3.5 h-3.5 text-sky-500" />
                  Moderate Rain
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">45 mm/hr steady</div>
              </button>

              <button
                type="button"
                onClick={() => handlePreset('dry')}
                className="p-2.5 rounded-xl border border-emerald-300 dark:border-emerald-900 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition text-left cursor-pointer"
              >
                <div className="font-bold text-xs flex items-center gap-1">
                  <RefreshCw className="w-3.5 h-3.5 text-emerald-500" />
                  Clear Dry
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Zero ponding</div>
              </button>
            </div>
          </div>

          {/* Sliders Grid */}
          <div className="space-y-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            {/* 1. Rainfall Intensity */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-semibold flex items-center gap-1.5 text-slate-700 dark:text-slate-200">
                  <CloudRain className="w-4 h-4 text-sky-500" />
                  Rainfall Intensity (mm/hr)
                </span>
                <span className="text-sm font-bold text-sky-600 dark:text-sky-400">
                  {params.rainfallRateMmHr} mm/hr
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="250"
                step="5"
                value={params.rainfallRateMmHr}
                onChange={(e) =>
                  onUpdateParams({
                    ...params,
                    rainfallRateMmHr: Number(e.target.value)
                  })
                }
                className="w-full accent-sky-500 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>0 mm/hr (Dry)</span>
                <span>35 mm/hr (SWD Limit)</span>
                <span>100 mm/hr (Severe)</span>
                <span>250 mm/hr (Catastrophic)</span>
              </div>
            </div>

            {/* 2. Cumulative 24h Rainfall */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-semibold flex items-center gap-1.5 text-slate-700 dark:text-slate-200">
                  <Sliders className="w-4 h-4 text-indigo-500" />
                  24-Hour Cumulative Rainfall (mm)
                </span>
                <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                  {params.cumulative24hMm} mm
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="500"
                step="10"
                value={params.cumulative24hMm}
                onChange={(e) =>
                  onUpdateParams({
                    ...params,
                    cumulative24hMm: Number(e.target.value)
                  })
                }
                className="w-full accent-indigo-500 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>0 mm</span>
                <span>150 mm (Heavy)</span>
                <span>300 mm (Very Heavy)</span>
                <span>500 mm (Historic Record)</span>
              </div>
            </div>

            {/* 3. Chembarambakkam Discharge */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-semibold flex items-center gap-1.5 text-slate-700 dark:text-slate-200">
                  <Waves className="w-4 h-4 text-teal-500" />
                  Chembarambakkam Adyar Discharge (cusecs)
                </span>
                <span className="text-sm font-bold text-teal-600 dark:text-teal-400">
                  {params.chembarambakkamDischargeCusecs.toLocaleString()} cusecs
                </span>
              </div>
              <input
                type="range"
                min="500"
                max="30000"
                step="500"
                value={params.chembarambakkamDischargeCusecs}
                onChange={(e) =>
                  onUpdateParams({
                    ...params,
                    chembarambakkamDischargeCusecs: Number(e.target.value)
                  })
                }
                className="w-full accent-teal-500 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>500 (Normal)</span>
                <span>8,000 (Alert)</span>
                <span>18,000 (Danger)</span>
                <span>30,000 (Maximum)</span>
              </div>
            </div>

            {/* 4. High Tide Lock */}
            <div className="flex items-center justify-between pt-1">
              <div>
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Bay of Bengal Spring High Tide
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Blocks Buckingham Canal ocean outflow, backing up stormwater into city roads
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={params.highTideActive}
                  onChange={(e) =>
                    onUpdateParams({
                      ...params,
                      highTideActive: e.target.checked
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
              </label>
            </div>
          </div>

          {/* Model Mathematical Principles Explainer */}
          <div className="p-3.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/60 text-xs text-slate-700 dark:text-slate-300 space-y-1.5">
            <div className="font-semibold text-sky-900 dark:text-sky-300 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-sky-500 shrink-0" />
              How It Computes for Unseen Rainfall Patterns:
            </div>
            <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
              Rather than hardcoded historical flooding, the model applies a mass-balance hydrodynamic equation:
              <br />
              <code className="bg-white/80 dark:bg-slate-900 px-1.5 py-0.5 rounded font-mono text-[10px] text-sky-600 dark:text-sky-300">
                Ponding = max(0, Rainfall - SWD_Capacity) × DepressionIndex + RiverBackwater - Embankment
              </code>
              <br />
              Flyovers (+5.5m) shed water immediately, while low depressions like subways (-3.5m MSL) funnel runoff from the surrounding basin.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
              <AlertTriangle className="w-3.5 h-3.5" />
              {criticalRoadsCount} High-Risk Corridors
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onReset}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
            >
              Reset Defaults
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-bold rounded-lg bg-sky-600 hover:bg-sky-500 text-white shadow-md shadow-sky-600/30 transition cursor-pointer"
            >
              Apply Simulation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
