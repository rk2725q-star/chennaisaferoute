import React from 'react';
import {
  SubwaySensorTelemetry,
  INITIAL_SUBWAY_SENSORS
} from '../utils/telemetryService';
import {
  AlertTriangle,
  Waves,
  ShieldCheck,
  ShieldAlert,
  Gauge,
  ArrowUpRight,
  X,
  Radio,
  ExternalLink,
  Activity
} from 'lucide-react';

interface SubwaySensorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  subwaySensors?: SubwaySensorTelemetry[];
  onSelectSubway?: (sensor: SubwaySensorTelemetry) => void;
}

export const SubwaySensorDrawer: React.FC<SubwaySensorDrawerProps> = ({
  isOpen,
  onClose,
  subwaySensors = INITIAL_SUBWAY_SENSORS,
  onSelectSubway
}) => {
  if (!isOpen) return null;

  const submergedCount = subwaySensors.filter((s) => s.status === 'submerged_closed').length;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-slate-900/95 border-l border-slate-700/80 shadow-2xl backdrop-blur-xl flex flex-col text-slate-100 animate-in slide-in-from-right duration-200">
      {/* Drawer Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/60">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Radio className="w-5 h-5 text-rose-500 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          </div>
          <div>
            <h2 className="font-extrabold text-sm text-white">Subway IoT Ultrasonic Network</h2>
            <p className="text-[10px] text-slate-400">Live water level telemetry at Chennai railway underpasses</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Overview Status Banner */}
      <div className="p-4 border-b border-slate-800 bg-slate-850/40">
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
            <div className="text-rose-500 font-extrabold text-base">{submergedCount}</div>
            <div className="text-[10px] text-slate-400">SUBMERGED / CLOSED</div>
          </div>
          <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
            <div className="text-amber-400 font-extrabold text-base">
              {subwaySensors.filter((s) => s.status === 'caution').length}
            </div>
            <div className="text-[10px] text-slate-400">CAUTION (RISING)</div>
          </div>
          <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
            <div className="text-emerald-400 font-extrabold text-base">
              {subwaySensors.filter((s) => s.status === 'clear').length}
            </div>
            <div className="text-[10px] text-slate-400">CLEAR & DRY</div>
          </div>
        </div>
      </div>

      {/* Sensor List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {subwaySensors.map((sensor) => {
          const isClosed = sensor.status === 'submerged_closed';
          const isCaution = sensor.status === 'caution';

          return (
            <div
              key={sensor.id}
              className={`p-3.5 rounded-xl border transition ${
                isClosed
                  ? 'bg-rose-950/20 border-rose-800/60 hover:border-rose-500'
                  : isCaution
                  ? 'bg-amber-950/20 border-amber-800/60 hover:border-amber-500'
                  : 'bg-slate-800/60 border-slate-700/60 hover:border-slate-500'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-xs text-white">{sensor.name}</h3>
                  <p className="text-[10px] text-slate-400">{sensor.area} · Ground Elev: {sensor.elevationMsl}m MSL</p>
                </div>
                <span
                  className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    isClosed
                      ? 'bg-rose-500/30 text-rose-300 border border-rose-500/50'
                      : isCaution
                      ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50'
                      : 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50'
                  }`}
                >
                  {isClosed ? '⛔ BARRICADED' : isCaution ? '⚠️ WATERLOGGED' : '✅ PASSABLE'}
                </span>
              </div>

              {/* Water Depth Telemetry Meter */}
              <div className="mt-3 space-y-1.5">
                <div className="flex items-baseline justify-between text-xs">
                  <span className="text-[11px] text-slate-300 flex items-center gap-1">
                    <Waves className="w-3.5 h-3.5 text-sky-400" />
                    <span>Water Depth:</span>
                  </span>
                  <span className="font-mono font-black text-sm text-white">
                    <span className={isClosed ? 'text-rose-400' : isCaution ? 'text-amber-400' : 'text-emerald-400'}>
                      {sensor.waterDepthCm} cm
                    </span>{' '}
                    <span className="text-[10px] text-slate-400">({(sensor.waterDepthCm / 30.48).toFixed(1)} ft)</span>
                  </span>
                </div>

                {/* Progress Bar (capped at 200cm) */}
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      isClosed ? 'bg-rose-500' : isCaution ? 'bg-amber-400' : 'bg-emerald-400'
                    }`}
                    style={{ width: `${Math.min(100, (sensor.waterDepthCm / 200) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Rate of rise & Sump Pump details */}
              <div className="mt-2.5 pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-[10px] text-slate-400">
                <div>
                  Rate of Accumulation:{' '}
                  <strong className={sensor.rateOfRiseCmHr > 15 ? 'text-rose-400' : 'text-slate-200'}>
                    +{sensor.rateOfRiseCmHr} cm/hr
                  </strong>
                </div>
                <div>
                  Sump Pump:{' '}
                  <strong
                    className={
                      sensor.pumpStatus === 'active'
                        ? 'text-emerald-400'
                        : sensor.pumpStatus === 'overloaded'
                        ? 'text-amber-400'
                        : 'text-rose-400'
                    }
                  >
                    {sensor.pumpStatus.toUpperCase()} ({sensor.pumpCapacityLps} L/s)
                  </strong>
                </div>
              </div>

              {/* Recommended Bypass Route */}
              {sensor.alternateBypassName && (
                <div className="mt-2.5 p-2 bg-slate-900/90 rounded-lg flex items-center justify-between text-[11px] border border-slate-700/50">
                  <span className="text-slate-300">
                    Bypass via: <strong className="text-sky-300">{sensor.alternateBypassName}</strong>
                  </span>
                  {onSelectSubway && (
                    <button
                      onClick={() => onSelectSubway(sensor)}
                      className="text-[10px] bg-blue-600 hover:bg-blue-500 text-white font-bold px-2 py-1 rounded flex items-center gap-1 transition cursor-pointer"
                    >
                      <span>Show</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
