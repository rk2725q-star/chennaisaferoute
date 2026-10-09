import React, { useState, useEffect } from 'react';
import { DynamicRouteResult, NavigationStep } from '../utils/floodEngine';
import {
  Navigation2,
  X,
  Volume2,
  VolumeX,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  ArrowUp,
  CornerUpRight,
  CornerUpLeft,
  ListOrdered,
  AlertTriangle,
  CloudRain,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  MapPin,
  CheckCircle2
} from 'lucide-react';

interface GoogleDriveNavigationOverlayProps {
  route: DynamicRouteResult;
  onExitNavigation: () => void;
  onStepChange?: (stepIndex: number) => void;
  rainfallRateMmHr?: number;
  alertThresholdMmHr?: number;
}

export const GoogleDriveNavigationOverlay: React.FC<GoogleDriveNavigationOverlayProps> = ({
  route,
  onExitNavigation,
  onStepChange,
  rainfallRateMmHr = 110,
  alertThresholdMmHr = 75
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [speedKmh, setSpeedKmh] = useState(38);
  const [showDirectionsList, setShowDirectionsList] = useState(false);
  
  // Severe Rainfall Automated Alert Toast State
  const isRainfallSevere = rainfallRateMmHr >= alertThresholdMmHr;
  const [showRainfallAlert, setShowRainfallAlert] = useState(isRainfallSevere);
  const [alertDismissed, setAlertDismissed] = useState(false);

  const steps = route.steps || [];
  const currentStep: NavigationStep | undefined = steps[currentStepIndex];
  const nextStep: NavigationStep | undefined = steps[currentStepIndex + 1];

  // Trigger alert if rainfall rate exceeds threshold and hasn't been explicitly dismissed
  useEffect(() => {
    if (isRainfallSevere && !alertDismissed) {
      setShowRainfallAlert(true);
    }
  }, [isRainfallSevere, alertDismissed, rainfallRateMmHr]);

  // Notify parent whenever currentStepIndex changes
  useEffect(() => {
    if (onStepChange) {
      onStepChange(currentStepIndex);
    }
  }, [currentStepIndex, onStepChange]);

  // Auto-progress simulation for navigation
  useEffect(() => {
    if (steps.length === 0) return;

    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < steps.length - 1) {
          return prev + 1;
        }
        return prev;
      });
      // Vary speed slightly for realism
      setSpeedKmh(Math.floor(32 + Math.random() * 12));
    }, 6000);

    return () => clearInterval(interval);
  }, [steps.length]);

  const getManeuverIcon = (instruction: string, sizeClass = "w-7 h-7") => {
    const text = instruction.toLowerCase();
    if (text.includes('right')) return <CornerUpRight className={`${sizeClass} text-white`} />;
    if (text.includes('left')) return <CornerUpLeft className={`${sizeClass} text-white`} />;
    if (text.includes('flyover') || text.includes('straight') || text.includes('continue') || text.includes('ramp')) {
      return <ArrowUp className={`${sizeClass} text-white`} />;
    }
    return <Navigation2 className={`${sizeClass} text-white rotate-45`} />;
  };

  const isLastStep = currentStepIndex >= steps.length - 1;

  return (
    <div className="pointer-events-none absolute inset-0 z-40 flex flex-col justify-between p-3 sm:p-5 select-none animate-fade-in overflow-hidden">
      
      {/* TOP REGION: Driving HUD Card & Severe Weather Toast Alert */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-3 w-full max-w-5xl mx-auto pointer-events-none">
        
        {/* Left: Main Google Maps Driving HUD Card */}
        <div className="pointer-events-auto max-w-md w-full shadow-2xl rounded-2xl overflow-hidden border border-emerald-400/50 backdrop-blur-md">
          {/* Main Turn Direction Banner (Google Maps Dark Green) */}
          <div className="bg-[#0f5132] text-white p-4 flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600/60 border border-emerald-400/40 flex items-center justify-center shrink-0 shadow-inner">
              {currentStep ? getManeuverIcon(currentStep.instruction) : <ArrowUp className="w-8 h-8 text-white" />}
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-emerald-200 uppercase tracking-wider flex items-center gap-1.5">
                <span>{isLastStep ? 'Arriving at Destination' : `In ${currentStep?.distanceMeters || 150}m`}</span>
                {currentStep && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/40 text-emerald-100">
                    Elev: {currentStep.elevationM}m MSL
                  </span>
                )}
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white leading-tight truncate">
                {currentStep?.instruction || 'Follow Safe Route'}
              </h2>
            </div>

            <div className="flex items-center gap-1">
              <button
                id="toggle-steps-btn"
                onClick={() => setShowDirectionsList(!showDirectionsList)}
                title={showDirectionsList ? "Hide Step-by-Step Directions" : "Show Step-by-Step Directions"}
                className={`p-2 rounded-xl transition cursor-pointer text-xs font-bold flex items-center gap-1 ${
                  showDirectionsList
                    ? 'bg-emerald-400 text-slate-900 shadow-md'
                    : 'bg-emerald-800/80 hover:bg-emerald-700 text-emerald-100'
                }`}
              >
                <ListOrdered className="w-4 h-4" />
                <span className="hidden sm:inline">Steps</span>
              </button>

              <button
                onClick={() => setIsMuted(!isMuted)}
                title={isMuted ? 'Unmute voice' : 'Mute voice'}
                className="p-2 rounded-full hover:bg-emerald-700/60 text-emerald-100 transition cursor-pointer"
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Next Turn Preview Bar */}
          {nextStep && (
            <div className="bg-[#146c43] text-emerald-100 px-4 py-2 text-xs flex items-center justify-between border-t border-emerald-500/30">
              <div className="flex items-center gap-2 truncate">
                <span className="text-emerald-300 font-medium">Then:</span>
                <span className="truncate font-semibold text-white">{nextStep.instruction}</span>
              </div>
              <span className="shrink-0 text-[11px] text-emerald-200">
                {nextStep.waterDepthCm === 0 ? '🟢 0cm Dry' : `⚠️ ${nextStep.waterDepthCm}cm`}
              </span>
            </div>
          )}
        </div>

        {/* Right: Automated Severe Rainfall Toast Notification */}
        {showRainfallAlert && (
          <div
            id="rainfall-rate-alert-toast"
            className="pointer-events-auto bg-slate-900/95 dark:bg-slate-950/95 text-white rounded-xl p-2 shadow-2xl border border-amber-500/80 backdrop-blur-xl animate-in slide-in-from-top-4 duration-300 flex items-center gap-3 w-fit"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/50 flex items-center justify-center shrink-0">
              <CloudRain className="w-4 h-4 text-amber-400 animate-bounce" />
            </div>
            
            <div className="flex-1 pr-4">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
                <span className="text-[10px] font-black text-amber-400 tracking-wide uppercase">Severe Downpour Advisory</span>
              </div>
              <div className="text-xs font-semibold text-white leading-tight">
                {rainfallRateMmHr} mm/hr • High-ground route active
              </div>
            </div>

            <button
              onClick={() => {
                setShowRainfallAlert(false);
                setAlertDismissed(true);
              }}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer shrink-0"
              title="Dismiss Alert"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Minimized Rainfall Warning Pill (when dismissed but threshold still exceeded) */}
        {!showRainfallAlert && isRainfallSevere && (
          <button
            onClick={() => setShowRainfallAlert(true)}
            title="Click to view Severe Rainfall Details"
            className="pointer-events-auto bg-amber-500/90 hover:bg-amber-500 text-slate-950 px-3 py-1.5 rounded-full font-black text-xs shadow-lg flex items-center gap-1.5 border border-amber-300 transition cursor-pointer"
          >
            <CloudRain className="w-3.5 h-3.5" />
            <span>{rainfallRateMmHr} mm/hr Rain Alert</span>
          </button>
        )}
      </div>

      {/* MIDDLE REGION: Expandable Turn-by-Turn Instruction List Drawer */}
      {showDirectionsList && (
        <div className="pointer-events-auto self-start max-w-md w-full my-2 bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-emerald-500/40 overflow-hidden flex flex-col max-h-[48vh] sm:max-h-[55vh] animate-in fade-in-50 zoom-in-95 duration-200">
          
          {/* Header */}
          <div className="bg-[#0f5132] px-4 py-3 text-white flex items-center justify-between border-b border-emerald-600/40">
            <div className="flex items-center gap-2">
              <ListOrdered className="w-5 h-5 text-emerald-300" />
              <div>
                <h3 className="text-sm font-black">Turn-by-Turn Route Itinerary</h3>
                <div className="text-[11px] text-emerald-200">
                  {steps.length} sequential steps · {route.distanceKm} km · {route.durationMinutes} min
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowDirectionsList(false)}
              className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-700/60 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Sequential Step List */}
          <div className="overflow-y-auto p-2.5 divide-y divide-slate-800 flex-1 custom-scrollbar">
            {steps.map((step, idx) => {
              const isActive = idx === currentStepIndex;
              const isPast = idx < currentStepIndex;

              return (
                <div
                  key={`step-${idx}`}
                  onClick={() => setCurrentStepIndex(idx)}
                  className={`p-2.5 rounded-xl transition cursor-pointer flex items-start gap-3 my-0.5 ${
                    isActive
                      ? 'bg-emerald-950/90 border border-emerald-500/70 shadow-lg ring-1 ring-emerald-500/30'
                      : isPast
                      ? 'opacity-60 hover:opacity-90 hover:bg-slate-800/40'
                      : 'hover:bg-slate-800/70'
                  }`}
                >
                  {/* Step Number & Maneuver Icon */}
                  <div className="flex flex-col items-center shrink-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shadow-md ${
                        isActive
                          ? 'bg-emerald-500 text-slate-950 ring-2 ring-emerald-400'
                          : isPast
                          ? 'bg-slate-800 text-slate-400'
                          : 'bg-[#146c43] text-white'
                      }`}
                    >
                      {getManeuverIcon(step.instruction, "w-5 h-5")}
                    </div>
                    <span className="text-[9px] font-bold text-slate-400 mt-1">#{idx + 1}</span>
                  </div>

                  {/* Step Information */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {step.roadName}
                      </span>
                      {isActive && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black border border-emerald-500/40">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                          CURRENT STEP
                        </span>
                      )}
                    </div>

                    <div className={`text-xs font-bold mt-0.5 ${isActive ? 'text-white text-sm' : 'text-slate-200'}`}>
                      {step.instruction}
                    </div>

                    {/* Step Metrics & Hydrology Badge */}
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[10px]">
                      <span className="text-slate-400 font-medium">
                        Distance: <strong>{step.distanceMeters >= 1000 ? `${(step.distanceMeters / 1000).toFixed(1)} km` : `${step.distanceMeters} m`}</strong>
                      </span>
                      <span className="text-slate-400 font-medium">
                        Elev: <strong>{step.elevationM}m MSL</strong>
                      </span>
                      <span className={`font-bold px-1.5 py-0.5 rounded ${
                        step.waterDepthCm === 0
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                          : 'bg-amber-950 text-amber-300 border border-amber-800/60'
                      }`}>
                        {step.waterDepthCm === 0 ? '🟢 0cm (Dry Safe)' : `⚠️ ${step.waterDepthCm}cm Water`}
                      </span>
                    </div>

                    {step.hazardWarning && (
                      <div className="mt-1.5 text-[10px] text-amber-300 bg-amber-950/40 border border-amber-800/50 p-1.5 rounded-lg flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 shrink-0 text-amber-400" />
                        <span>{step.hazardWarning}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Step Navigation Bar */}
          <div className="bg-slate-950 p-2 border-t border-slate-800 flex items-center justify-between text-xs">
            <button
              onClick={() => setCurrentStepIndex(Math.max(0, currentStepIndex - 1))}
              disabled={currentStepIndex === 0}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 font-bold flex items-center gap-1 transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <span className="text-[11px] text-slate-400 font-bold">
              Step {currentStepIndex + 1} of {steps.length}
            </span>

            <button
              onClick={() => setCurrentStepIndex(Math.min(steps.length - 1, currentStepIndex + 1))}
              disabled={currentStepIndex >= steps.length - 1}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold flex items-center gap-1 transition cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Floating Live Hydrology Safety Pill */}
      {!showDirectionsList && (
        <div className="pointer-events-auto self-center bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 py-2 rounded-full border border-emerald-500 shadow-xl flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-extrabold">
            <ShieldCheck className="w-4 h-4 text-emerald-500 animate-pulse" />
            <span>DRIVING SAFEST ROUTE: {route.title}</span>
          </div>
          <div className="h-3 w-px bg-slate-200 dark:bg-slate-700"></div>
          <span className="font-bold text-slate-800 dark:text-slate-200">
            Max Water: <strong className="text-emerald-600 font-extrabold">{route.maxWaterDepthCm} cm</strong>
          </span>
        </div>
      )}

      {/* BOTTOM REGION: Google Maps Driving Summary & Controls */}
      <div className="pointer-events-auto max-w-xl w-full mx-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
        {/* Speedometer & ETA */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center">
            <span className="text-xs font-black text-slate-900 dark:text-white leading-none">{speedKmh}</span>
            <span className="text-[8px] text-slate-500 uppercase font-bold leading-none mt-0.5">km/h</span>
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {route.durationMinutes} min
              </span>
              <span className="text-sm font-semibold text-slate-500">
                ({route.distanceKm} km)
              </span>
            </div>
            <div className="text-[11px] text-slate-500 font-medium truncate max-w-xs">
              ETA: {new Date(Date.now() + route.durationMinutes * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {route.summaryVia}
            </div>
          </div>
        </div>

        {/* Step Forward / Directions Toggle / Exit Navigation Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDirectionsList(!showDirectionsList)}
            title="Toggle Turn-by-Turn Instruction List"
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer text-xs font-bold flex items-center gap-1.5"
          >
            <ListOrdered className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline">Directions</span>
          </button>

          {!isLastStep && (
            <button
              onClick={() => {
                if (currentStepIndex < steps.length - 1) {
                  setCurrentStepIndex(currentStepIndex + 1);
                }
              }}
              title="Next step"
              className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 transition cursor-pointer text-xs font-bold flex items-center gap-1 border border-emerald-300 dark:border-emerald-700"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={onExitNavigation}
            className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-rose-600/30 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span>Exit</span>
          </button>
        </div>
      </div>
    </div>
  );
};
