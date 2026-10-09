import React from 'react';
import { X, ArrowRight } from 'lucide-react';
import { RoadRiskSegment } from '../../types/navigation';

interface RoadRiskDrawerProps {
  segment: RoadRiskSegment | null;
  onClose: () => void;
  onAvoidSegment?: (segmentId: string) => void;
}

export const RoadRiskDrawer: React.FC<RoadRiskDrawerProps> = ({
  segment,
  onClose,
  onAvoidSegment
}) => {
  if (!segment) return null;

  return (
    <aside className="fixed top-14 right-0 bottom-14 md:bottom-0 w-full sm:w-85 z-40 bg-white border-l border-slate-200 shadow-xl flex flex-col justify-between animate-in slide-in-from-right duration-200 select-none">
      <div className="p-5 border-b border-slate-150">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
              ROAD RISK
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-3 flex items-baseline justify-between">
          <div className="text-2xl font-black tracking-tight text-slate-900 font-mono">
            {segment.code}
          </div>
          <div className="text-xl font-bold text-red-600 font-mono">
            {segment.currentRisk}% Risk
          </div>
        </div>

        <div className="mt-1 text-xs text-slate-600 font-medium leading-snug">
          {segment.name}
        </div>
      </div>

      <div className="p-5 flex-1 overflow-y-auto space-y-5">
        <div>
          <h3 className="text-xs font-bold text-slate-900 mb-3 uppercase tracking-wide">
            Why this road is at risk
          </h3>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-150">
              <span className="text-xs text-slate-500">Rainfall</span>
              <span className="text-xs font-semibold text-slate-900">
                {segment.factors.rainfall}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-150">
              <span className="text-xs text-slate-500">Elevation</span>
              <span className="text-xs font-semibold text-slate-900">
                {segment.factors.elevation}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-150">
              <span className="text-xs text-slate-500">Drainage environment</span>
              <span className="text-xs font-semibold text-slate-900">
                {segment.factors.drainage}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-150">
              <span className="text-xs text-slate-500">Built-up area</span>
              <span className="text-xs font-semibold text-slate-900">
                {segment.factors.builtUpArea}
              </span>
            </div>
          </div>
        </div>

        {segment.waterDepthCm > 0 && (
          <div className="p-3 rounded-lg bg-red-50/70 border border-red-200 text-xs text-red-900">
            <div className="font-semibold flex items-center justify-between">
              <span>Predicted Water Depth:</span>
              <span className="font-mono text-sm font-bold">{segment.waterDepthCm} cm</span>
            </div>
            <p className="mt-1 text-[11px] text-red-700 leading-normal">
              Inundation reaches vehicle exhaust & wheel hubs. Light vehicles at severe stalling risk.
            </p>
          </div>
        )}

        <div className="p-3.5 rounded-lg bg-slate-100/90 border border-slate-200">
          <div className="text-xs font-bold text-slate-900">
            Consider an alternate route.
          </div>
          <p className="mt-1 text-xs text-slate-600 leading-relaxed">
            {segment.advice}
          </p>
        </div>
      </div>

      <div className="p-4 border-t border-slate-150 bg-slate-50/60 flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            if (onAvoidSegment) onAvoidSegment(segment.id);
            onClose();
          }}
          className="w-full py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
        >
          <span>Avoid this segment</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
};

export default RoadRiskDrawer;

