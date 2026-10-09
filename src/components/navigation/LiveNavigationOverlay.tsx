import React from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Compass,
  X,
  ShieldCheck,
  MapPin,
  CheckCircle2,
  Navigation as NavigationIcon,
  Crosshair
} from 'lucide-react';
import { NavPointState } from '../../utils/navigationSimulator';
import { RouteOptionData } from '../../types/navigation';

interface LiveNavigationOverlayProps {
  route: RouteOptionData;
  navState: NavPointState;
  isPlaying: boolean;
  onTogglePlay: () => void;
  speedMultiplier: number;
  onChangeSpeed: (speed: number) => void;
  onScrubProgress: (progressFraction: number) => void;
  onResetNavigation: () => void;
  onExitNavigation: () => void;
  autoCenter: boolean;
  onToggleAutoCenter: () => void;
  destinationName: string;
}

export const LiveNavigationOverlay: React.FC<LiveNavigationOverlayProps> = ({
  route,
  navState,
  isPlaying,
  onTogglePlay,
  speedMultiplier,
  onChangeSpeed,
  onScrubProgress,
  onResetNavigation,
  onExitNavigation,
  autoCenter,
  onToggleAutoCenter,
  destinationName
}) => {
  const isArrived = navState.percent >= 100;

  return (
    <div className="absolute inset-0 pointer-events-none z-30 flex flex-col justify-between p-3 sm:p-4 select-none">
      {/* TOP REGION: Driving Direction & Telemetry HUD */}
      <div className="w-full max-w-lg mx-auto pointer-events-auto animate-in slide-in-from-top-4 duration-300">
        <div className="bg-slate-900/95 text-white rounded-2xl shadow-2xl border border-slate-700/80 backdrop-blur-md overflow-hidden">
          {/* Main Direction Banner */}
          <div className="p-3 sm:p-4 flex items-center gap-3">
            {/* Maneuver / Bearing Icon */}
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0 shadow-md">
              <NavigationIcon
                className="w-6 h-6 sm:w-7 sm:h-7 text-white transition-transform duration-300"
                style={{ transform: `rotate(${navState.bearing}deg)` }}
              />
            </div>

            {/* Instruction Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10.5px] uppercase tracking-wider font-semibold text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {isArrived ? 'Destination Reached' : `${navState.distanceRemainingKm} km remaining`}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-sky-300 border border-slate-700">
                  {navState.elevationMsl}m MSL
                </span>
                {navState.isSafeElevation && (
                  <span className="text-[9.5px] font-semibold text-emerald-300 bg-emerald-950/80 border border-emerald-800/80 px-1.5 py-0.2 rounded">
                    Safe Ridge 🛡️
                  </span>
                )}
              </div>

              <h2 className="text-sm sm:text-base font-bold text-white leading-snug truncate mt-0.5">
                {navState.currentStepInstruction}
              </h2>

              {navState.nextStepInstruction && !isArrived && (
                <p className="text-[11px] text-slate-300 truncate mt-0.5 opacity-90">
                  {navState.nextStepInstruction}
                </p>
              )}
            </div>

            {/* Quick Action Buttons: Auto-center camera & Exit */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={onToggleAutoCenter}
                title={autoCenter ? 'Disable Auto-Follow Camera' : 'Center Camera on Vehicle'}
                className={`p-2 rounded-xl transition-all cursor-pointer ${
                  autoCenter
                    ? 'bg-sky-500/20 text-sky-400 border border-sky-400/40'
                    : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                }`}
              >
                <Crosshair className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onExitNavigation}
                title="Exit Live Navigation Mode"
                className="p-2 rounded-xl bg-slate-800 hover:bg-red-500/80 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Sub-bar with Live Route Safety Stats */}
          <div className="bg-slate-950/80 px-4 py-2 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-[11px]">Speed:</span>
              <span className="font-bold text-white">{isArrived ? 0 : navState.estimatedSpeedKmh} km/h</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-[11px]">ETA:</span>
              <span className="font-bold text-emerald-400">{navState.durationRemainingMinutes} min</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-[11px]">Flood Risk:</span>
              <span className="text-emerald-400 font-bold">Minimal (0 subways)</span>
            </div>
          </div>
        </div>
      </div>

      {/* ARRIVAL CELEBRATION MODAL (WHEN REACHING 100%) */}
      {isArrived && (
        <div className="pointer-events-auto max-w-md w-full mx-auto bg-white/95 backdrop-blur-md rounded-2xl p-5 shadow-2xl border border-emerald-300 text-center animate-in zoom-in-95 duration-200">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            Safely Arrived at Destination!
          </h3>
          <p className="text-xs text-slate-600 mt-1 max-w-xs mx-auto">
            Successfully navigated via elevated ridges to <strong className="text-slate-800">{destinationName}</strong> without entering flooded underpasses.
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={onResetNavigation}
              className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Replay Drive</span>
            </button>
            <button
              type="button"
              onClick={onExitNavigation}
              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors cursor-pointer shadow-sm"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* BOTTOM REGION: Interactive Scrubber & Simulation Controls */}
      <div className="w-full max-w-lg mx-auto pointer-events-auto animate-in slide-in-from-bottom-4 duration-300">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3.5 sm:p-4 shadow-2xl border border-slate-200/90 text-slate-800 space-y-3">
          {/* Header of controller: Live Progress & Scrubber Title */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isPlaying ? 'bg-emerald-400' : 'bg-amber-400'} opacity-75`} />
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isPlaying ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              </span>
              <span className="text-xs font-bold text-slate-900">
                {isPlaying ? 'Live Driving along Route' : 'Simulation Paused / Scrub Mode'}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                {navState.percent}%
              </span>
            </div>
          </div>

          {/* Interactive Route Scrubber (Move user point along route in real-time) */}
          <div className="space-y-1">
            <div className="relative flex items-center">
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={navState.percent}
                onChange={(e) => onScrubProgress(Number(e.target.value) / 100)}
                className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600 focus:outline-hidden"
                title="Drag to move user location point along route"
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-mono pt-0.5">
              <span>Start (0 km)</span>
              <span className="text-emerald-700 font-semibold">
                Drag slider to move location
              </span>
              <span>Dest ({route.distanceKm} km)</span>
            </div>
          </div>

          {/* Playback Controls & Speed Multipliers */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-100">
            <div className="flex items-center gap-1.5">
              {/* Play / Pause */}
              <button
                type="button"
                onClick={onTogglePlay}
                className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                  isPlaying
                    ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-xs'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                }`}
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-3.5 h-3.5 fill-current" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Drive</span>
                  </>
                )}
              </button>

              {/* Reset to Start */}
              <button
                type="button"
                onClick={onResetNavigation}
                title="Reset to Starting Location"
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              {/* Follow Camera toggle */}
              <button
                type="button"
                onClick={onToggleAutoCenter}
                title="Keep map centered on user position"
                className={`px-2 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                  autoCenter
                    ? 'bg-sky-50 text-sky-700 border border-sky-200'
                    : 'bg-slate-100 text-slate-500 hover:text-slate-800'
                }`}
              >
                <Crosshair className="w-3 h-3" />
                <span className="hidden sm:inline">Follow</span>
              </button>
            </div>

            {/* Speed Multiplier Pill */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[11px]">
              {[1, 2, 4].map((spd) => (
                <button
                  key={spd}
                  type="button"
                  onClick={() => onChangeSpeed(spd)}
                  className={`px-2 py-0.5 rounded font-semibold transition-all cursor-pointer ${
                    speedMultiplier === spd
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveNavigationOverlay;
