import React from 'react';
import { RotateCcw } from 'lucide-react';
import { MOCK_JOURNEY_HISTORY } from '../../data/mockNavigationData';

interface HistoryViewProps {
  onRerunRoute?: (origin: string, destination: string) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ onRerunRoute }) => {
  return (
    <div className="flex flex-col h-full bg-white text-slate-800 p-5 overflow-y-auto space-y-6">
      <div>
        <h2 className="text-xs font-bold tracking-wider text-slate-400 uppercase">
          JOURNEY HISTORY
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Recorded monsoon transits and risk trade-off decisions
        </p>
      </div>

      <div className="space-y-3">
        {MOCK_JOURNEY_HISTORY.map((item) => (
          <div
            key={item.id}
            className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all space-y-2.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-400">
                {item.timestamp}
              </span>
              <span className="text-[10px] font-medium font-mono uppercase bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                {item.routeType} route
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-900">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                <span>{item.origin}</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-900">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-600 shrink-0" />
                <span>{item.destination}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <div className="text-slate-500">
                Duration: <strong className="text-slate-800">{item.durationMinutes} min</strong> • Weather: {item.rainfallAtTime}
              </div>
              {onRerunRoute && (
                <button
                  type="button"
                  onClick={() => onRerunRoute(item.origin, item.destination)}
                  className="flex items-center gap-1 text-[11px] font-semibold text-slate-700 hover:text-slate-950 px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Re-check</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HistoryView;

