import React from 'react';
import { EMERGENCY_CONTACTS } from '../data/chennaiData';
import { X, Phone, PhoneCall, AlertTriangle, ShieldCheck } from 'lucide-react';

interface EmergencyDirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmergencyDirectoryModal: React.FC<EmergencyDirectoryModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-slate-100 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-850">
          <div className="flex items-center gap-2">
            <PhoneCall className="w-5 h-5 text-emerald-400" />
            <h2 className="font-semibold text-sm">Chennai Emergency Flood Helplines</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Highlights */}
        <div className="p-4 bg-emerald-950/40 border-b border-emerald-900/60 flex items-center gap-3 text-xs text-emerald-200">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <strong>Greater Chennai Corporation (GCC) Primary Flood Helpline: 1913</strong>
            <p className="text-[11px] text-emerald-300/80">
              Free 24/7 helpline for tree falls, boat rescue requests, and inundated street pumps.
            </p>
          </div>
        </div>

        {/* Contact List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 divide-y divide-slate-800/60">
          {EMERGENCY_CONTACTS.map((item, idx) => (
            <div key={idx} className="pt-2.5 first:pt-0 flex items-center justify-between gap-3">
              <div>
                <h4 className="font-semibold text-slate-100 text-xs">{item.name}</h4>
                <p className="text-[11px] text-slate-400">{item.desc}</p>
                <div className="font-mono text-xs font-bold text-sky-400 mt-0.5">{item.phone}</div>
              </div>

              <a
                href={`tel:${item.phone.replace(/[^0-9+]/g, '')}`}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition flex items-center gap-1.5 shrink-0 shadow cursor-pointer"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call</span>
              </a>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950 text-[11px] text-slate-400 flex items-center justify-between">
          <span>In extreme danger, dial 108 (Ambulance) or 101 (Fire/Boats) directly.</span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
