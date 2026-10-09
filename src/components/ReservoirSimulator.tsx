import React from 'react';
import { SimulationParams, ReservoirData } from '../types';
import { Sliders, CloudRain, Waves, AlertOctagon, RotateCcw, Zap } from 'lucide-react';

interface ReservoirSimulatorProps {
  simulationParams: SimulationParams;
  setSimulationParams: React.Dispatch<React.SetStateAction<SimulationParams>>;
  reservoirs: ReservoirData[];
  onResetSimulation: () => void;
}

export const ReservoirSimulator: React.FC<ReservoirSimulatorProps> = ({
  simulationParams,
  setSimulationParams,
  reservoirs,
  onResetSimulation,
}) => {
  const { rainfallMm, chembarambakkamDischargeCusecs, redhillsDischargeCusecs, highTideActive } =
    simulationParams;

  // Calculated estimates based on simulation
  const adyarDischarge = chembarambakkamDischargeCusecs + rainfallMm * 45;
  const adyarCrestHeight = (3.5 + adyarDischarge / 4000).toFixed(1);
  const adyarStatus =
    adyarDischarge > 18000
      ? 'CATASTROPHIC OVERFLOW'
      : adyarDischarge > 10000
      ? 'DANGER LEVEL SURGE'
      : 'ELEVATED FLOW';

  const puzhalDischarge = redhillsDischargeCusecs + rainfallMm * 18;

  // Preset scenarios
  const applyPreset = (preset: 'normal' | 'heavy' | 'cyclone') => {
    if (preset === 'normal') {
      setSimulationParams({
        rainfallMm: 65,
        chembarambakkamDischargeCusecs: 2000,
        redhillsDischargeCusecs: 1000,
        highTideActive: false,
      });
    } else if (preset === 'heavy') {
      setSimulationParams({
        rainfallMm: 160,
        chembarambakkamDischargeCusecs: 9500,
        redhillsDischargeCusecs: 3000,
        highTideActive: false,
      });
    } else if (preset === 'cyclone') {
      setSimulationParams({
        rainfallMm: 310,
        chembarambakkamDischargeCusecs: 22000,
        redhillsDischargeCusecs: 5500,
        highTideActive: true,
      });
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/95 text-slate-100 rounded-xl border border-slate-800 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-sky-400" />
            <h2 className="font-semibold text-slate-100 text-sm tracking-wide">
              Hydro Surge & Reservoir Simulator
            </h2>
          </div>
          <button
            onClick={onResetSimulation}
            title="Reset baseline values"
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition text-xs flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Model how reservoir discharges (Chembarambakkam / Red Hills) and monsoon downpours impact
          basin overflow and urban access roads.
        </p>
      </div>

      {/* Preset Scenarios Buttons */}
      <div className="p-3 bg-slate-950/60 border-b border-slate-800">
        <div className="text-[11px] font-semibold text-slate-400 mb-2">Simulate Historical / Forecast Scenarios:</div>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <button
            onClick={() => applyPreset('normal')}
            className={`p-1.5 rounded text-center border font-medium transition cursor-pointer ${
              rainfallMm < 100
                ? 'bg-emerald-950 border-emerald-600 text-emerald-200'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            Seasonal (65mm)
          </button>
          <button
            onClick={() => applyPreset('heavy')}
            className={`p-1.5 rounded text-center border font-medium transition cursor-pointer ${
              rainfallMm >= 100 && rainfallMm < 250
                ? 'bg-amber-950 border-amber-600 text-amber-200'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            Heavy Monsoon (160mm)
          </button>
          <button
            onClick={() => applyPreset('cyclone')}
            className={`p-1.5 rounded text-center border font-medium transition cursor-pointer ${
              rainfallMm >= 250
                ? 'bg-rose-950 border-rose-600 text-rose-200'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            Cyclone Michaung (310mm)
          </button>
        </div>
      </div>

      {/* Interactive Controls */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Slider 1: 24h Monsoon Rainfall */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-200 flex items-center gap-1.5">
              <CloudRain className="w-4 h-4 text-sky-400" />
              24-Hour Cumulative Rainfall
            </span>
            <span className="font-mono font-bold text-sky-400 text-sm">{rainfallMm} mm</span>
          </div>
          <input
            type="range"
            min="20"
            max="380"
            step="10"
            value={rainfallMm}
            onChange={(e) =>
              setSimulationParams((prev) => ({ ...prev, rainfallMm: Number(e.target.value) }))
            }
            className="w-full accent-sky-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>20mm (Light)</span>
            <span>150mm (Heavy)</span>
            <span>380mm (Catastrophic)</span>
          </div>
        </div>

        {/* Slider 2: Chembarambakkam Outflow */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Waves className="w-4 h-4 text-rose-400" />
              Chembarambakkam Lake Discharge
            </span>
            <span className="font-mono font-bold text-rose-400 text-sm">
              {chembarambakkamDischargeCusecs.toLocaleString()} cusecs
            </span>
          </div>
          <input
            type="range"
            min="500"
            max="28000"
            step="500"
            value={chembarambakkamDischargeCusecs}
            onChange={(e) =>
              setSimulationParams((prev) => ({
                ...prev,
                chembarambakkamDischargeCusecs: Number(e.target.value),
              }))
            }
            className="w-full accent-rose-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>500 (Base)</span>
            <span>10,000 (Alert)</span>
            <span>28,000 cusecs (Full Sluice)</span>
          </div>
        </div>

        {/* Slider 3: Red Hills Outflow */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Waves className="w-4 h-4 text-amber-400" />
              Red Hills (Puzhal) Discharge
            </span>
            <span className="font-mono font-bold text-amber-400 text-sm">
              {redhillsDischargeCusecs.toLocaleString()} cusecs
            </span>
          </div>
          <input
            type="range"
            min="200"
            max="8000"
            step="200"
            value={redhillsDischargeCusecs}
            onChange={(e) =>
              setSimulationParams((prev) => ({
                ...prev,
                redhillsDischargeCusecs: Number(e.target.value),
              }))
            }
            className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
        </div>

        {/* Toggle: Coastal High Tide */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950/60 border border-slate-800">
          <div>
            <div className="text-xs font-semibold text-slate-200">Coastal Spring Tide Active</div>
            <div className="text-[10px] text-slate-400">
              Slows river discharge into Bay of Bengal, aggravating Buckingham Canal backflow
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={highTideActive}
              onChange={(e) =>
                setSimulationParams((prev) => ({ ...prev, highTideActive: e.target.checked }))
              }
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-500"></div>
          </label>
        </div>

        {/* Real-time Dynamic Impact Card */}
        <div className="bg-slate-950/80 p-3.5 rounded-lg border border-slate-800/90 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
              Simulated River Impact
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                adyarDischarge > 15000
                  ? 'bg-rose-950 text-rose-300 border border-rose-800'
                  : 'bg-amber-950 text-amber-300 border border-amber-800'
              }`}
            >
              {adyarStatus}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-900/90 p-2 rounded border border-slate-800">
              <div className="text-[10px] text-slate-400">Adyar Basin Inflow</div>
              <div className="text-sm font-bold text-slate-100 font-mono">
                {Math.round(adyarDischarge).toLocaleString()} cusecs
              </div>
              <div className="text-[10px] text-rose-400 mt-0.5">
                Crest: ~{adyarCrestHeight}m (Danger: 6.2m)
              </div>
            </div>
            <div className="bg-slate-900/90 p-2 rounded border border-slate-800">
              <div className="text-[10px] text-slate-400">Puzhal / North Surplus</div>
              <div className="text-sm font-bold text-slate-100 font-mono">
                {Math.round(puzhalDischarge).toLocaleString()} cusecs
              </div>
              <div className="text-[10px] text-amber-400 mt-0.5">Retteri & Kolathur affected</div>
            </div>
          </div>

          <div className="text-[11px] text-slate-300 bg-slate-900/60 p-2.5 rounded border border-slate-800/60 leading-relaxed">
            {adyarDischarge > 18000 ? (
              <span className="text-rose-300">
                🚨 <strong>Critical Warning:</strong> Saidapet Maraimalai Adigal Bridge,
                Jafferkhanpet riverbank, and Kotturpuram low-lying settlements face immediate
                inundation. MIOT Hospital lower ramp defense protocol must be triggered.
              </span>
            ) : adyarDischarge > 10000 ? (
              <span className="text-amber-300">
                ⚠️ <strong>High Flow Alert:</strong> Adyar river approaches high danger mark.
                Velachery, Madipakkam, and Mudichur feeder canals will experience backwater sluggishness.
              </span>
            ) : (
              <span className="text-emerald-300">
                ✅ <strong>Manageable Basin Capacity:</strong> Embankments holding safely. Localized
                waterlogging confined to micro-depressions and poorly drained subways.
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
