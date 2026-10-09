import React, { useState } from 'react';
import { 
  CloudRain, 
  Wind, 
  Droplets, 
  Thermometer, 
  Calendar, 
  Compass, 
  CheckCircle2, 
  Navigation,
  RefreshCw,
  X
} from 'lucide-react';
import { ChennaiForecastResponse, DailyForecastItem } from '../../types/weather';

interface ChennaiWeatherForecastModalProps {
  forecast: ChennaiForecastResponse | null;
  isLoading: boolean;
  onRefresh: () => void;
  onClose: () => void;
  onApplyForecastToRoute: (rainfallMm: number, dayLabel: string) => void;
}

export const ChennaiWeatherForecastModal: React.FC<ChennaiWeatherForecastModalProps> = ({
  forecast,
  isLoading,
  onRefresh,
  onClose,
  onApplyForecastToRoute
}) => {
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);

  if (!forecast) {
    return null;
  }

  const selectedDay: DailyForecastItem = forecast.daily[selectedDayIndex] || forecast.daily[0];
  const isTodaySelected = selectedDayIndex === 0;

  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'EXTREME':
        return {
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
          label: 'Critical Inundation Risk',
          dot: 'bg-rose-500'
        };
      case 'HIGH':
        return {
          bg: 'bg-orange-50 text-orange-700 border-orange-200',
          label: 'High Flood Risk',
          dot: 'bg-orange-500'
        };
      case 'MODERATE':
        return {
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          label: 'Moderate Waterlogging Risk',
          dot: 'bg-amber-500'
        };
      default:
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          label: 'Low Flood Risk / Safe Transit',
          dot: 'bg-emerald-500'
        };
    }
  };

  const riskBadge = getRiskBadge(selectedDay.floodRiskLevel);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 text-slate-800 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center border border-sky-200/80">
              <CloudRain className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  Chennai Real-Time & 7-Day Weather Forecast
                </h3>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live WMO Radar
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                {forecast.city} • Telemetry updated {forecast.lastUpdated}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              title="Refresh latest meteorological feed"
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200/70 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-sky-600' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 rounded-lg transition-colors cursor-pointer text-base leading-none"
              title="Close forecast modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {/* Hero Selected Day Overview Banner */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 p-4 rounded-xl border border-slate-200 bg-linear-to-br from-slate-50 via-sky-50/30 to-slate-50 shadow-2xs">
            <div className="md:col-span-7 flex flex-col justify-between space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-sky-700 font-mono">
                      {selectedDay.dayName}
                    </span>
                    <span className="text-[11px] text-slate-500">({selectedDay.date})</span>
                  </div>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                      {isTodaySelected ? `${forecast.current.temperature}°C` : `${selectedDay.tempMax}°C`}
                    </span>
                    <span className="text-sm font-semibold text-slate-500">
                      / {selectedDay.tempMin}°C
                    </span>
                    <span className="text-xl ml-1">{selectedDay.icon}</span>
                  </div>
                  <div className="text-xs font-medium text-slate-700 mt-0.5">
                    {selectedDay.conditionText}
                  </div>
                </div>

                <div className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border flex items-center gap-1.5 ${riskBadge.bg}`}>
                  <span className={`w-2 h-2 rounded-full ${riskBadge.dot}`} />
                  {riskBadge.label}
                </div>
              </div>

              {/* Metrics Row */}
              <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-200/70 text-slate-600">
                <div className="bg-white/80 p-2 rounded-lg border border-slate-200/60">
                  <div className="flex items-center gap-1 text-[10px] text-slate-500 mb-0.5">
                    <CloudRain className="w-3 h-3 text-sky-600" />
                    <span>Rainfall</span>
                  </div>
                  <div className="text-xs font-bold text-slate-900 font-mono">
                    {selectedDay.precipSumMm} mm
                  </div>
                </div>

                <div className="bg-white/80 p-2 rounded-lg border border-slate-200/60">
                  <div className="flex items-center gap-1 text-[10px] text-slate-500 mb-0.5">
                    <Droplets className="w-3 h-3 text-blue-600" />
                    <span>Rain Prob.</span>
                  </div>
                  <div className="text-xs font-bold text-slate-900 font-mono">
                    {selectedDay.precipProbMax}%
                  </div>
                </div>

                <div className="bg-white/80 p-2 rounded-lg border border-slate-200/60">
                  <div className="flex items-center gap-1 text-[10px] text-slate-500 mb-0.5">
                    <Wind className="w-3 h-3 text-teal-600" />
                    <span>Wind Max</span>
                  </div>
                  <div className="text-xs font-bold text-slate-900 font-mono">
                    {selectedDay.windSpeedMax} km/h
                  </div>
                </div>

                <div className="bg-white/80 p-2 rounded-lg border border-slate-200/60">
                  <div className="flex items-center gap-1 text-[10px] text-slate-500 mb-0.5">
                    <Thermometer className="w-3 h-3 text-orange-600" />
                    <span>Feels Like</span>
                  </div>
                  <div className="text-xs font-bold text-slate-900 font-mono">
                    {isTodaySelected ? `${forecast.current.feelsLike}°C` : `${selectedDay.tempMax + 4}°C`}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Action Sidecard */}
            <div className="md:col-span-5 bg-white p-3.5 rounded-xl border border-slate-200 flex flex-col justify-between space-y-2.5">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  HYDROLOGY ENGINE SYNC
                </span>
                <p className="text-xs text-slate-600 leading-snug">
                  Simulate road network risk and route safety for <strong>{selectedDay.dayName}</strong> using its forecasted{' '}
                  <span className="font-bold text-sky-700 font-mono">{selectedDay.precipSumMm} mm</span> rainfall accumulation.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  onApplyForecastToRoute(selectedDay.precipSumMm, selectedDay.dayName);
                  onClose();
                }}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
              >
                <Navigation className="w-3.5 h-3.5 text-orange-400" />
                <span>Route with this Day ({selectedDay.precipSumMm} mm)</span>
              </button>
            </div>
          </div>

          {/* 7-Day Forecast Interactive Strip */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>7-Day Daily Forecast Timeline</span>
              </h4>
              <span className="text-[11px] text-slate-400">Click any day to inspect & simulate</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
              {forecast.daily.map((day, idx) => {
                const isSelected = selectedDayIndex === idx;
                const isToday = idx === 0;

                return (
                  <button
                    key={day.date}
                    type="button"
                    onClick={() => setSelectedDayIndex(idx)}
                    className={`flex flex-col items-center justify-between p-2.5 rounded-xl border text-center transition-all cursor-pointer relative ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-slate-900/20'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {isToday && (
                      <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded-full mb-1 ${
                        isSelected ? 'bg-orange-500 text-white' : 'bg-orange-100 text-orange-700'
                      }`}>
                        Live
                      </span>
                    )}

                    <span className={`text-xs font-bold leading-tight ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                      {day.dayName.split(',')[0]}
                    </span>
                    <span className={`text-[9px] mb-1.5 ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                      {day.date.slice(5)}
                    </span>

                    <span className="text-2xl my-0.5">{day.icon}</span>

                    <div className="text-[11px] font-mono font-bold mt-1">
                      {day.tempMax}° <span className={isSelected ? 'text-slate-400 font-normal' : 'text-slate-400 font-normal'}>{day.tempMin}°</span>
                    </div>

                    <div className="mt-1.5 w-full pt-1 border-t border-dashed border-slate-200/50 flex flex-col items-center">
                      <span className={`text-[10px] font-mono font-semibold ${
                        isSelected ? 'text-sky-300' : 'text-sky-700'
                      }`}>
                        {day.precipSumMm} mm
                      </span>
                      <span className={`text-[9px] ${
                        isSelected ? 'text-slate-300' : 'text-slate-500'
                      }`}>
                        {day.precipProbMax}% rain
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Today's 24-Hour Precipitation Timeline */}
          {isTodaySelected && forecast.hourlyToday && forecast.hourlyToday.length > 0 && (
            <div className="space-y-2 p-3.5 rounded-xl border border-slate-200 bg-slate-50/60">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Droplets className="w-3.5 h-3.5 text-blue-600" />
                  <span>Today's 24-Hour Hourly Rainfall Projection</span>
                </h4>
                <span className="text-[10px] font-mono text-slate-500">Asia/Kolkata (IST)</span>
              </div>

              <div className="overflow-x-auto pb-1">
                <div className="flex gap-2 min-w-max">
                  {forecast.hourlyToday.map((h) => {
                    const hasRain = h.precipMm > 0;
                    return (
                      <div
                        key={h.fullTime}
                        className={`flex flex-col items-center justify-between p-2 rounded-lg border text-center w-15 shrink-0 ${
                          hasRain
                            ? 'bg-blue-50/80 border-blue-200 text-blue-900'
                            : 'bg-white border-slate-200 text-slate-600'
                        }`}
                      >
                        <span className="text-[10px] font-mono font-semibold text-slate-500">{h.time}</span>
                        <span className="text-base my-1">{h.icon}</span>
                        <span className="text-xs font-bold text-slate-800 font-mono">{h.temp}°</span>
                        <span className={`text-[10px] font-mono font-bold mt-1 ${
                          hasRain ? 'text-blue-700' : 'text-slate-400'
                        }`}>
                          {h.precipMm} mm
                        </span>
                        <span className="text-[9px] text-slate-400 font-mono">{h.precipProb}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Regional Multi-Station Telemetry across Greater Chennai */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-slate-500" />
              <span>Multi-Station Radar Telemetry across Chennai Zones</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {forecast.zones.map((zone) => (
                <div
                  key={zone.id}
                  className="p-2.5 rounded-lg border border-slate-200 bg-white flex items-center justify-between hover:border-slate-300 transition-colors"
                >
                  <div>
                    <div className="text-xs font-semibold text-slate-900">{zone.name}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{zone.status}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-mono font-bold text-sky-700">{zone.precip24h} mm</div>
                    <div className="text-[10px] text-slate-400 font-mono">{zone.tempMax}°C</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Bottom Action Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Connected to Open-Meteo High-Resolution Numerical Weather Prediction</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                onApplyForecastToRoute(selectedDay.precipSumMm, selectedDay.dayName);
                onClose();
              }}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
            >
              <Navigation className="w-3 h-3 text-orange-400" />
              <span>Apply {selectedDay.dayName}'s Rainfall ({selectedDay.precipSumMm} mm)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
