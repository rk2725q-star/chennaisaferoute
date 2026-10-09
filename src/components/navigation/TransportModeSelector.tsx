import React from 'react';
import { Car, Bike, Footprints, Bus, ShieldAlert } from 'lucide-react';
import { TransportMode, RouteOptionData } from '../../types/navigation';

interface TransportModeSelectorProps {
  selectedMode: TransportMode;
  onSelectMode: (mode: TransportMode) => void;
  activeRoute?: RouteOptionData | null;
  routes?: RouteOptionData[];
}

interface ModeConfig {
  id: TransportMode;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  clearanceNote: string;
  safeDepthCm: number;
  description: string;
}

export const TRANSPORT_MODES: ModeConfig[] = [
  {
    id: 'car',
    label: 'Car / 4W',
    shortLabel: 'Drive',
    icon: Car,
    clearanceNote: 'Max ~28 cm',
    safeDepthCm: 28,
    description: 'Safe for cars & SUVs. Avoids low-lying subways & waterlogged arterial basins.'
  },
  {
    id: 'two_wheeler',
    label: 'Two-Wheeler',
    shortLabel: 'Bike',
    icon: Bike,
    clearanceNote: 'Max ~15 cm',
    safeDepthCm: 15,
    description: 'Highly vulnerable to deep puddles, manholes, and engine flooding. Re-routes via elevated service lanes.'
  },
  {
    id: 'walking',
    label: 'Walking',
    shortLabel: 'Walk',
    icon: Footprints,
    clearanceNote: 'Max ~20 cm',
    safeDepthCm: 20,
    description: 'Footpaths & pedestrian flyovers. Steers clear of open storm drains, fallen live cables, and slush.'
  },
  {
    id: 'transit',
    label: 'Bus & Metro',
    shortLabel: 'Transit',
    icon: Bus,
    clearanceNote: 'Max ~40 cm',
    safeDepthCm: 40,
    description: 'Chennai MTC arterial bus lanes & elevated CMRL Metro corridors. Reliable high-capacity transit.'
  },
  {
    id: 'emergency',
    label: 'Emergency / 4x4',
    shortLabel: 'Rescue',
    icon: ShieldAlert,
    clearanceNote: 'Max ~70 cm',
    safeDepthCm: 70,
    description: 'High-clearance rescue vehicles, ambulances, and NDRF trucks with priority corridor access.'
  }
];

export const TransportModeSelector: React.FC<TransportModeSelectorProps> = ({
  selectedMode,
  onSelectMode,
  activeRoute,
  routes = []
}) => {
  // Compute estimated duration preview per mode if active route is available
  const getModeDurationPreview = (modeId: TransportMode): string | null => {
    if (!activeRoute) return null;
    const dist = activeRoute.distanceKm || 8.5;
    if (modeId === 'car') return `${activeRoute.durationMinutes}m`;
    if (modeId === 'two_wheeler') return `${Math.max(12, Math.round(activeRoute.durationMinutes * 0.95))}m`;
    if (modeId === 'walking') {
      const walkMin = Math.round(dist * 12.5);
      if (walkMin >= 60) {
        const hrs = Math.floor(walkMin / 60);
        const mins = walkMin % 60;
        return `${hrs}h ${mins}m`;
      }
      return `${walkMin}m`;
    }
    if (modeId === 'transit') return `${Math.round(dist * 3.2)}m`;
    if (modeId === 'emergency') return `${Math.round(dist * 1.6)}m`;
    return null;
  };

  const currentModeConfig = TRANSPORT_MODES.find(m => m.id === selectedMode) || TRANSPORT_MODES[0];

  return (
    <div className="w-full space-y-2 select-none">
      {/* Google Maps Style Horizontal Capsule Tabs */}
      <div className="flex items-center justify-between gap-1 p-1 bg-slate-100/90 rounded-xl border border-slate-200/80 shadow-2xs">
        {TRANSPORT_MODES.map((mode) => {
          const Icon = mode.icon;
          const isSelected = selectedMode === mode.id;
          const durationStr = getModeDurationPreview(mode.id);

          return (
            <button
              key={mode.id}
              type="button"
              onClick={() => onSelectMode(mode.id)}
              title={`${mode.label}: ${mode.description}`}
              className={`flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all cursor-pointer relative ${
                isSelected
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80 ring-1 ring-slate-900/10'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-white/60'
              }`}
            >
              <div className="flex items-center gap-1">
                <Icon
                  className={`w-4 h-4 transition-transform ${
                    isSelected ? 'text-blue-600 scale-110 stroke-[2.2]' : 'text-slate-500 stroke-[1.8]'
                  }`}
                />
                <span className={`text-[11.5px] font-semibold hidden sm:inline ${isSelected ? 'text-slate-900' : 'text-slate-600'}`}>
                  {mode.shortLabel}
                </span>
              </div>

              {durationStr && (
                <span
                  className={`text-[10px] font-mono font-medium mt-0.5 leading-none ${
                    isSelected ? 'text-blue-600 font-bold' : 'text-slate-400'
                  }`}
                >
                  {durationStr}
                </span>
              )}

              {isSelected && (
                <span className="w-4 h-0.5 bg-blue-600 rounded-full mt-1 animate-in fade-in" />
              )}
            </button>
          );
        })}
      </div>

      {/* Mode Flood Clearance & Safety Indicator Strip */}
      <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-blue-50/70 border border-blue-100 text-[11px] text-blue-900">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-semibold text-slate-900 shrink-0">
            {currentModeConfig.label}:
          </span>
          <span className="text-slate-600 truncate">
            {currentModeConfig.description}
          </span>
        </div>
        <div className="ml-2 shrink-0 font-mono font-bold text-blue-700 bg-white px-1.5 py-0.5 rounded border border-blue-200 text-[10px] shadow-2xs">
          Safe depth: {currentModeConfig.clearanceNote}
        </div>
      </div>
    </div>
  );
};

export default TransportModeSelector;
