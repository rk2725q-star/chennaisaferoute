import React, { useState } from 'react';
import { Hospital, Flame, Shield, Home, Navigation, CheckCircle, ArrowRight } from 'lucide-react';
import { EmergencyCategory, EmergencyFacility } from '../../types/navigation';
import { getEmergencyFacilityByCategory } from '../../services/routeService';

interface EmergencyAccessViewProps {
  onNavigateToFacility: (facility: EmergencyFacility) => void;
  onSelectFacility?: (facility: EmergencyFacility) => void;
}

export const EmergencyAccessView: React.FC<EmergencyAccessViewProps> = ({
  onNavigateToFacility,
  onSelectFacility
}) => {
  const [selectedCategory, setSelectedCategory] = useState<EmergencyCategory>('hospital');

  const categories: Array<{
    id: EmergencyCategory;
    label: string;
    icon: React.ElementType;
  }> = [
    { id: 'hospital', label: 'Hospital', icon: Hospital },
    { id: 'fire_station', label: 'Fire Station', icon: Flame },
    { id: 'police', label: 'Police', icon: Shield },
    { id: 'shelter', label: 'Shelter', icon: Home }
  ];

  const handleCategorySelect = (catId: EmergencyCategory) => {
    setSelectedCategory(catId);
    const fac = getEmergencyFacilityByCategory(catId);
    if (fac && onSelectFacility) {
      onSelectFacility(fac);
    }
  };

  const currentFacility = getEmergencyFacilityByCategory(selectedCategory);

  return (
    <div className="flex flex-col h-full bg-white text-slate-800 p-5 overflow-y-auto space-y-6">
      <div>
        <h2 className="text-xs font-bold tracking-wider text-slate-400 uppercase">
          EMERGENCY ACCESS
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          One-tap access to nearest flood-accessible public facilities
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleCategorySelect(cat.id)}
              className={`p-4 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between h-24 ${
                isSelected
                  ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-slate-900/10'
                  : 'bg-slate-50/90 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <Icon
                  className={`w-6 h-6 ${
                    isSelected ? 'text-white' : 'text-slate-600'
                  }`}
                />
                {isSelected && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                )}
              </div>
              <span className="text-sm font-semibold tracking-tight">
                {cat.label}
              </span>
            </button>
          );
        })}
      </div>

      {currentFacility && (
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-4 animate-in fade-in duration-200">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Nearest accessible facility
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-0.5">
              {currentFacility.name}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {currentFacility.address}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-150">
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-mono">Distance</div>
              <div className="text-sm font-bold text-slate-900 font-mono">
                {currentFacility.distanceKm} km
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-mono">Est. Time</div>
              <div className="text-sm font-bold text-slate-900 font-mono">
                {currentFacility.durationMinutes} min
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-mono">Road Exposure</div>
              <div className="text-sm font-bold text-emerald-700 font-mono">
                {currentFacility.exposureLevel}
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-600 bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100 flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span className="leading-relaxed">
              {currentFacility.exposureNote}
            </span>
          </div>

          <button
            type="button"
            onClick={() => onNavigateToFacility(currentFacility)}
            className="w-full py-3 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white text-xs font-bold tracking-wide transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <Navigation className="w-4 h-4 text-orange-400" />
            <span>NAVIGATE</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="pt-2 border-t border-slate-100">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
          Emergency Helplines
        </div>
        <div className="space-y-1.5 text-xs text-slate-600">
          <div className="flex items-center justify-between p-2 rounded bg-slate-50">
            <span>Greater Chennai Corp (GCC)</span>
            <a href="tel:1913" className="font-mono font-bold text-slate-900 hover:underline">
              1913
            </a>
          </div>
          <div className="flex items-center justify-between p-2 rounded bg-slate-50">
            <span>Disaster Management Cell</span>
            <a href="tel:1070" className="font-mono font-bold text-slate-900 hover:underline">
              1070
            </a>
          </div>
          <div className="flex items-center justify-between p-2 rounded bg-slate-50">
            <span>Ambulance & Trauma Care</span>
            <a href="tel:108" className="font-mono font-bold text-slate-900 hover:underline">
              108
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmergencyAccessView;

