import React from 'react';
import { Eye } from 'lucide-react';
import { RoadRiskSegment } from '../../types/navigation';

interface RiskRoadsViewProps {
  roadSegments: RoadRiskSegment[];
  onSelectSegment: (segment: RoadRiskSegment) => void;
}

export const RiskRoadsView: React.FC<RiskRoadsViewProps> = ({
  roadSegments,
  onSelectSegment
}) => {
  const sortedRoads = [...roadSegments].sort((a, b) => b.currentRisk - a.currentRisk);

  return (
    <div className="flex flex-col h-full bg-white text-slate-800 p-5 overflow-y-auto space-y-5">
      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold tracking-wider text-slate-400 uppercase">
            RISK ROADS
          </h2>
          <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
            {sortedRoads.length} Monitored Segments
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          Priority flood vulnerability index across Chennai roadways
        </p>
      </div>

      <div className="space-y-2.5">
        {sortedRoads.map((road, idx) => {
          const indexNum = String(idx + 1).padStart(2, '0');
          const isCritical = road.currentRisk >= 80;
          const isHigh = road.currentRisk >= 60;

          return (
            <div
              key={road.id}
              className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60 transition-all group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-2.5">
                  <span className="font-mono text-xs font-bold text-slate-400 mt-0.5">
                    {indexNum}.
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-slate-900">
                        {road.code}
                      </span>
                      <span className="text-[10px] text-slate-400 uppercase font-medium">
                        {road.area}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 mt-0.5 font-medium line-clamp-1">
                      {road.name}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div
                    className={`font-mono text-sm font-bold ${
                      isCritical
                        ? 'text-red-600'
                        : isHigh
                        ? 'text-orange-600'
                        : 'text-amber-600'
                    }`}
                  >
                    {road.currentRisk}% risk
                  </div>
                  {road.waterDepthCm > 0 && (
                    <div className="text-[10px] text-slate-400 font-mono">
                      ~{road.waterDepthCm} cm depth
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                <div className="text-[11px] text-slate-500">
                  {road.factors.elevationDetails}
                </div>
                <button
                  type="button"
                  onClick={() => onSelectSegment(road)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 hover:text-slate-950 px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                  <span>View on map</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RiskRoadsView;

