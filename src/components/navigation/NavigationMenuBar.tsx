import React from 'react';
import { Route, CloudRain, AlertTriangle, ShieldAlert, History } from 'lucide-react';
import { ActiveNavTab } from '../../types/navigation';

interface NavigationMenuBarProps {
  activeTab: ActiveNavTab;
  onTabChange: (tab: ActiveNavTab) => void;
  riskRoadCount?: number;
}

export const NavigationMenuBar: React.FC<NavigationMenuBarProps> = ({
  activeTab,
  onTabChange,
  riskRoadCount = 7
}) => {
  const tabs: Array<{
    id: ActiveNavTab;
    label: string;
    icon: React.ElementType;
    badge?: number | string;
  }> = [
    { id: 'route', label: 'Route', icon: Route },
    { id: 'flood_map', label: 'Flood Map', icon: CloudRain },
    { id: 'risk_roads', label: 'Risk Roads', icon: AlertTriangle, badge: riskRoadCount },
    { id: 'emergency', label: 'Emergency', icon: ShieldAlert },
    { id: 'history', label: 'History', icon: History }
  ];

  return (
    <nav className="w-full bg-white border-t border-slate-200 select-none shadow-xs">
      <div className="grid grid-cols-5 w-full gap-0.5 p-1 bg-white">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-center transition-all cursor-pointer relative ${
                isActive
                  ? 'bg-slate-100/90 text-slate-950 font-semibold border border-slate-200/80 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50/90'
              }`}
            >
              <div className="relative flex items-center justify-center mb-0.5">
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-slate-900 stroke-[2.2]' : 'text-slate-500 stroke-[1.7]'
                  }`}
                />
                {tab.badge !== undefined && (
                  <span className="absolute -top-1 -right-2.5 bg-[#f97316] text-white text-[9px] font-bold px-1 rounded-full leading-tight font-mono shadow-xs">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10.5px] leading-tight tracking-tight truncate w-full px-0.5">
                {tab.label}
              </span>

              {isActive && (
                <span className="w-3 h-0.5 rounded-full bg-[#f97316] mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default NavigationMenuBar;

