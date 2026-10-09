import React, { useState } from 'react';
import { Phone, ShieldCheck, CloudRain, PanelLeftClose, PanelLeftOpen, Menu, Layers } from 'lucide-react';
import { ChennaiForecastResponse } from '../../types/weather';

interface HeaderProps {
  rainfallMm: number;
  forecast?: ChennaiForecastResponse | null;
  onOpenForecastModal?: () => void;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  isMobilePanelOpen?: boolean;
  onToggleMobilePanel?: () => void;
  onOpenExplainer?: () => void;
}

export const ChennaiSafeRouteHeader: React.FC<HeaderProps> = ({ 
  rainfallMm,
  forecast,
  onOpenForecastModal,
  isSidebarOpen = true,
  onToggleSidebar,
  isMobilePanelOpen = true,
  onToggleMobilePanel,
  onOpenExplainer
}) => {
  const [showMlModal, setShowMlModal] = useState(false);

  return (
    <header className="relative z-30 bg-white border-b border-slate-200/90 select-none">
      {/* Thin saffron line running directly beneath the header */}
      <div className="h-[2.5px] w-full bg-[#f97316]" />

      <div className="w-full px-3 sm:px-5 h-13 sm:h-14 flex items-center justify-between gap-2 overflow-hidden">
        {/* Brand Logo, Title & Sidebar Toggle */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Desktop Sidebar Toggle Button */}
          {onToggleSidebar && (
            <button
              type="button"
              onClick={onToggleSidebar}
              title={isSidebarOpen ? 'Collapse Sidebar (Ctrl + B)' : 'Expand Sidebar (Ctrl + B)'}
              className="hidden md:flex items-center justify-center w-8 h-8 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
            >
              {isSidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
            </button>
          )}

          {/* Mobile Panel Toggle Button */}
          {onToggleMobilePanel && (
            <button
              type="button"
              onClick={onToggleMobilePanel}
              title={isMobilePanelOpen ? 'Minimize Panel to View Map' : 'Open Navigation Panel'}
              className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer shrink-0"
            >
              {isMobilePanelOpen ? <Layers className="w-4 h-4 text-emerald-600" /> : <Menu className="w-4 h-4 text-slate-800" />}
            </button>
          )}

          {/* Bespoke Logo: A road with a drop of rain colored with green and navy */}
          <div className="flex items-center justify-center w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-lg bg-slate-50 border border-slate-200 shadow-xs shrink-0">
            <svg
              className="w-4.5 h-4.5 sm:w-5 sm:h-5"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M5 21L9.2 3H14.8L19 21"
                stroke="#0f172a"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <line
                x1="12"
                y1="3"
                x2="12"
                y2="21"
                stroke="#059669"
                strokeWidth="1.8"
                strokeDasharray="2 3"
                strokeLinecap="round"
              />
              <path
                d="M12 2.8C12 2.8 15 6.2 15 8.2C15 9.85 13.65 11.2 12 11.2C10.35 11.2 9 9.85 9 8.2C9 6.2 12 2.8 12 2.8Z"
                fill="#059669"
                fillOpacity="0.95"
              />
            </svg>
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-sm sm:text-base font-bold tracking-tight text-slate-900 font-sans truncate">
                ChennaiSafeRoute
              </span>
              <span className="hidden lg:inline-flex items-center px-1.5 py-0.5 rounded text-[10.5px] font-medium bg-slate-100 text-slate-600 border border-slate-200/80 shrink-0">
                Monsoon Navigation
              </span>
              <span className="hidden 2xl:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                4,531 Roads • 634 Drains • 1,215 Lakes • 158 DEM
              </span>
            </div>
          </div>
        </div>

        {/* Right Controls: Weather Forecast, Scenario status, ML notice, GCC contact */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Real-time Weather & 7-Day Forecast Button */}
          {onOpenForecastModal && (
            <button
              type="button"
              onClick={onOpenForecastModal}
              title="Open Real-Time & 7-Day Chennai Weather Forecast"
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-md bg-sky-50/90 hover:bg-sky-100 border border-sky-200/80 text-xs text-sky-900 transition-colors cursor-pointer shadow-2xs font-medium"
            >
              <span className="text-xs sm:text-sm leading-none">{forecast?.current?.icon || '⛅'}</span>
              <span className="font-bold text-slate-900 font-mono text-xs">
                {forecast?.current ? `${forecast.current.temperature}°C` : 'Weather'}
              </span>
              {forecast?.daily?.[0] && (
                <span className="text-sky-700 hidden md:inline text-[11px]">
                  • Today {forecast.daily[0].precipSumMm}mm
                </span>
              )}
              <span className="text-[9.5px] sm:text-[10px] text-sky-600 font-semibold px-1 rounded bg-white/80 border border-sky-200/60 ml-0.5">
                7-Day
              </span>
            </button>
          )}

          {/* Rainfall scenario indicator */}
          <div className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-xs text-slate-700">
            <CloudRain className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="font-bold text-slate-900 text-xs">{rainfallMm}mm</span>
            <span className="text-slate-400 hidden sm:inline text-[11px]">/6h</span>
          </div>

          {/* Model info button */}
          <button
            type="button"
            onClick={() => setShowMlModal(true)}
            className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200 cursor-pointer"
            title="View predictive risk estimation details"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden xl:inline">Physics Engine</span>
          </button>

          {/* How It Works Guide Button */}
          {onOpenExplainer && (
            <button
              type="button"
              onClick={onOpenExplainer}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer shadow-2xs"
              title="Learn how ChennaiSafeRoute predicts flood risk and guides vehicles safely"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">How It Works</span>
            </button>
          )}

          {/* GCC Helpline Quick Call */}
          <a
            href="tel:1913"
            title="Greater Chennai Corporation Flood Helpline 1913"
            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-xs"
          >
            <Phone className="w-3 h-3 text-orange-400 shrink-0" />
            <span>1913</span>
          </a>
        </div>
      </div>

      {showMlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-slate-200 text-slate-800 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Background Hydrology & ML Engine</h3>
                  <p className="text-xs text-slate-500">Live operational data pipeline & predictive modeling</p>
                </div>
              </div>
              <button
                onClick={() => setShowMlModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 text-sm rounded-md cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs leading-relaxed text-slate-600">
              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <span className="text-[10px] uppercase text-slate-400 font-bold block">Road Corridors</span>
                  <span className="text-sm font-bold text-slate-900">4,531 Segments</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-400 font-bold block">Drainage Network</span>
                  <span className="text-sm font-bold text-sky-700">634 Channels & Canals</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-400 font-bold block">Water Bodies</span>
                  <span className="text-sm font-bold text-sky-700">1,215 Lakes & Tanks</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-400 font-bold block">Model Validation</span>
                  <span className="text-sm font-bold text-emerald-700">99.05% ROC-AUC</span>
                </div>
              </div>

              <div className="p-3 bg-emerald-50/70 rounded-lg border border-emerald-200/80 text-emerald-900">
                <div className="font-semibold mb-1 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Live Operational Deployment
                </div>
                <p className="text-[11px] text-emerald-800 leading-normal">
                  All arterial routes are evaluated using 14 continuous physical factors including Copernicus GLO-90 DEM elevations, Height Above Nearest Drainage (HAND), Topographic Wetness Index (TWI), and live stormwater discharge.
                </p>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowMlModal(false)}
                  className="px-4 py-1.5 rounded-lg bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default ChennaiSafeRouteHeader;
