import React from 'react';
import {
  X,
  Compass,
  CloudRain,
  ShieldCheck,
  AlertTriangle,
  Car,
  Bike,
  Footprints,
  Bus,
  Layers,
  Phone,
  ArrowRight,
  Droplets,
  Mountain,
  Navigation
} from 'lucide-react';

interface ProjectExplainerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartRoute?: () => void;
}

export const ProjectExplainerModal: React.FC<ProjectExplainerModalProps> = ({
  isOpen,
  onClose,
  onStartRoute
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header with saffron accent bar */}
        <div className="h-1.5 w-full bg-[#f97316]" />

        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                How ChennaiSafeRoute Works
              </h2>
              <p className="text-xs text-slate-500">
                AI Monsoon Navigation & Flood Inundation Safety Guide
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-200/60 flex items-center justify-center transition-colors cursor-pointer"
            title="Close guide"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 text-slate-700 text-xs leading-relaxed">
          {/* Quick Summary Banner */}
          <div className="p-4 rounded-xl bg-linear-to-r from-blue-50 to-indigo-50 border border-blue-200/80 space-y-2">
            <div className="flex items-center gap-2 text-blue-900 font-bold text-sm">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Why standard GPS fails in Chennai monsoons:</span>
            </div>
            <p className="text-blue-950/90 text-xs leading-normal">
              Generic navigation apps only measure traffic congestion — leading unsuspecting motorists and bikers straight into 1.5-meter deep flooded railway subways and overflowing canals.
              <strong> ChennaiSafeRoute</strong> calculates elevation MSL, real-time rainfall runoff, and drainage choke-points to route you strictly along dry flyovers and elevated ridges.
            </p>
          </div>

          {/* 3 Step Quick Start Guide */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              3 STEPS TO SAFE MONSOON TRAVEL
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-blue-300 transition-all space-y-1.5 shadow-2xs">
                <div className="w-6 h-6 rounded-md bg-blue-100 text-blue-800 font-bold font-mono text-xs flex items-center justify-center">
                  1
                </div>
                <h4 className="font-bold text-slate-900 text-xs">Set Your Journey</h4>
                <p className="text-[11px] text-slate-500">
                  Pick your Origin & Destination or tap the GPS crosshair for your live Chennai location.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-blue-300 transition-all space-y-1.5 shadow-2xs">
                <div className="w-6 h-6 rounded-md bg-blue-100 text-blue-800 font-bold font-mono text-xs flex items-center justify-center">
                  2
                </div>
                <h4 className="font-bold text-slate-900 text-xs">Pick Vehicle & Rain</h4>
                <p className="text-[11px] text-slate-500">
                  Select Car, Two-Wheeler, Walk, or Transit. Adjust the rain slider to simulate live rainfall.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-blue-300 transition-all space-y-1.5 shadow-2xs">
                <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-800 font-bold font-mono text-xs flex items-center justify-center">
                  3
                </div>
                <h4 className="font-bold text-slate-900 text-xs">Follow Dry Ridge</h4>
                <p className="text-[11px] text-slate-500">
                  Select the 100% Dry Ridge or Balanced Safe route and tap Start Navigation to view turn-by-turn guidance.
                </p>
              </div>
            </div>
          </div>

          {/* Mode of Transport Breakdown */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              TRANSPORT-SPECIFIC FLOOD CLEARANCE
            </h3>
            <div className="space-y-2">
              <div className="flex items-start gap-3 p-2.5 rounded-lg border border-slate-100 bg-slate-50/70">
                <Car className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-xs">Car / 4-Wheeler</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 bg-blue-100 text-blue-800 rounded font-semibold">
                      Max Clearance: 28 cm
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Avoids submerged underpasses (e.g. Duraisamy, Villivakkam) where water intake causes engine hydro-lock.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-lg border border-slate-100 bg-slate-50/70">
                <Bike className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-xs">Two-Wheeler / Bike</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded font-semibold">
                      Max Clearance: 15 cm
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Guards against hidden open manholes, slippery silt, and low silencer submergence. Prioritizes elevated service roads.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-lg border border-slate-100 bg-slate-50/70">
                <Footprints className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-xs">Pedestrian Walking</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 bg-purple-100 text-purple-800 rounded font-semibold">
                      Max Clearance: 20 cm
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Routes exclusively via elevated walkways and footbridges, strictly steering clear of submerged live electrical poles.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-lg border border-slate-100 bg-slate-50/70">
                <Bus className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-xs">Bus & Metro Transit</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded font-semibold">
                      Max Clearance: 40 cm
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Focuses on heavy arterial MTC bus lanes and weather-proof elevated Chennai Metro (CMRL) corridors.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Map Color Coding Legend */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              HOW TO READ THE INTERACTIVE MAP
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div className="flex items-center gap-2 p-2 rounded-lg border border-slate-100 bg-slate-50">
                <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
                <span>
                  <strong className="text-slate-900">Green Roads:</strong> Safe & dry high-elevation ridge (&lt;10cm water)
                </span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg border border-slate-100 bg-slate-50">
                <span className="w-3 h-3 rounded-full bg-amber-500 shrink-0" />
                <span>
                  <strong className="text-slate-900">Yellow Roads:</strong> Moderate surface water (15–25cm) — caution
                </span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg border border-slate-100 bg-slate-50">
                <span className="w-3 h-3 rounded-full bg-red-500 shrink-0" />
                <span>
                  <strong className="text-slate-900">Red Roads:</strong> Deep inundation (&gt;30cm) — IMPASSABLE
                </span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg border border-slate-100 bg-slate-50">
                <span className="w-3 h-3 rounded-full bg-cyan-400 shrink-0" />
                <span>
                  <strong className="text-slate-900">Cyan Lines:</strong> 634 drainage canals & Buckingham Canal
                </span>
              </div>
            </div>
          </div>

          {/* Official Emergency Contact Banner */}
          <div className="p-3.5 rounded-xl bg-orange-50/80 border border-orange-200 text-orange-950 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <Phone className="w-4 h-4 text-orange-600 shrink-0" />
              <div>
                <div className="font-bold text-xs">Greater Chennai Corporation Emergency Control:</div>
                <div className="text-[11px] text-orange-800">
                  Toll-Free Helpline: <strong className="font-mono text-orange-950">1913</strong> • State Disaster: <strong className="font-mono text-orange-950">1070</strong>
                </div>
              </div>
            </div>
            <a
              href="tel:1913"
              className="px-3 py-1.5 rounded-lg bg-orange-600 text-white font-bold text-xs hover:bg-orange-700 transition-colors shrink-0 shadow-xs"
            >
              Call 1913
            </a>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-mono">
            Version 2.4 • Powered by 4,531 Chennai Road Corridors
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
            >
              Close
            </button>
            {onStartRoute && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onStartRoute();
                }}
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <span>Plan Safe Route</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectExplainerModal;
