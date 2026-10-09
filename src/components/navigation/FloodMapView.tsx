import { ChennaiForecastResponse } from '../../types/weather';
import { Calendar, CloudRain, ExternalLink } from 'lucide-react';

interface FloodMapViewProps {
  rainfallMm: number;
  onFocusWaterbody?: (name: string, coords: [number, number]) => void;
  forecast?: ChennaiForecastResponse | null;
  onOpenForecastModal?: () => void;
}

export const FloodMapView: React.FC<FloodMapViewProps> = ({
  rainfallMm,
  onFocusWaterbody,
  forecast,
  onOpenForecastModal
}) => {
  const criticalBasins = [
    {
      name: 'Adyar River Basin',
      status: rainfallMm >= 180 ? 'Alert Level' : 'Normal Flow',
      coords: [13.0067, 80.2206] as [number, number],
      discharge: '4,500 cusecs',
      affected: 'Saidapet, Kotturpuram, Jafferkhanpet'
    },
    {
      name: 'Cooum River Corridor',
      status: rainfallMm >= 200 ? 'Rising Bank' : 'Normal Flow',
      coords: [13.0732, 80.2609] as [number, number],
      discharge: '2,800 cusecs',
      affected: 'Chintadripet, Aminjikarai, Koyambedu'
    },
    {
      name: 'Buckingham Canal & Pallikaranai',
      status: 'High Water Table',
      coords: [12.9550, 80.2200] as [number, number],
      discharge: 'Runoff Sink',
      affected: 'Velachery, Perungudi, Thoraipakkam'
    }
  ];

  const subways = [
    { name: 'Usman Road Subway (T. Nagar)', status: 'Closed / Inundated', depth: '90 cm' },
    { name: 'Vyasarpadi Gengu Reddy Subway', status: 'Closed / Inundated', depth: '70 cm' },
    { name: 'Thillai Ganga Nagar Subway', status: 'Waterlogged - Single Lane', depth: '25 cm' },
    { name: 'RBI Subway (Parrys)', status: 'Open / Operational', depth: '0 cm' }
  ];

  return (
    <div className="flex flex-col h-full bg-white text-slate-800 p-5 overflow-y-auto space-y-5">
      <div>
        <h2 className="text-xs font-bold tracking-wider text-slate-400 uppercase">
          FLOOD MAP INTELLIGENCE
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Hydrological monitoring across drainage basins and subways
        </p>
      </div>

      {/* 7-Day Basin Rainfall Outlook if Forecast available */}
      {forecast && (
        <div className="p-3.5 rounded-xl border border-sky-200/80 bg-sky-50/50 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sky-900 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-sky-700" />
              <span>7-Day Meteorological Outlook</span>
            </span>
            {onOpenForecastModal && (
              <button
                type="button"
                onClick={onOpenForecastModal}
                className="text-[10px] font-semibold text-sky-800 hover:text-sky-950 flex items-center gap-1 cursor-pointer"
              >
                <span>Full Forecast</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {forecast.daily.slice(0, 4).map((d) => (
              <div
                key={d.date}
                className="p-1.5 rounded-lg bg-white/90 border border-sky-100 text-center"
              >
                <div className="text-[10px] font-bold text-slate-800">{d.dayName.split(',')[0]}</div>
                <div className="text-xs my-0.5">{d.icon}</div>
                <div className="text-[10.5px] font-mono font-bold text-sky-700">{d.precipSumMm}mm</div>
                <div className="text-[9px] text-slate-400">{d.precipProbMax}%</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/80 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700">Precipitation Accumulation</span>
          <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
            {rainfallMm} mm / 6h
          </span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Groundwater saturation is currently at {Math.min(98, Math.round(55 + (rainfallMm / 350) * 40))}%. Surface runoff velocity along Adyar basin has increased.
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
          Drainage Basins & River Basins
        </h3>
        <div className="space-y-2">
          {criticalBasins.map((basin) => (
            <div
              key={basin.name}
              className="p-3 rounded-lg border border-slate-200 bg-white hover:border-slate-300 transition-all flex items-center justify-between"
            >
              <div>
                <div className="text-xs font-semibold text-slate-900">{basin.name}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Flow: {basin.discharge} • {basin.affected}
                </div>
              </div>
              {onFocusWaterbody && (
                <button
                  type="button"
                  onClick={() => onFocusWaterbody(basin.name, basin.coords)}
                  className="text-xs font-medium text-slate-600 hover:text-slate-900 px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer shrink-0 ml-2"
                >
                  Locate
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
          Railway & Road Subways Status
        </h3>
        <div className="space-y-2">
          {subways.map((sub) => {
            const isClosed = sub.status.includes('Closed');
            return (
              <div
                key={sub.name}
                className="p-3 rounded-lg border border-slate-200 bg-white flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-semibold text-slate-800">{sub.name}</div>
                  <div className={`text-[11px] font-medium mt-0.5 ${isClosed ? 'text-red-600' : 'text-slate-500'}`}>
                    {sub.status}
                  </div>
                </div>
                <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded">
                  {sub.depth}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FloodMapView;

