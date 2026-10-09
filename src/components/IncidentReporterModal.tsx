import React, { useState } from 'react';
import { IncidentReport } from '../types';
import { X, Send, AlertTriangle, MapPin, LifeBuoy } from 'lucide-react';

interface IncidentReporterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitIncident: (incident: IncidentReport) => void;
}

export const IncidentReporterModal: React.FC<IncidentReporterModalProps> = ({
  isOpen,
  onClose,
  onSubmitIncident,
}) => {
  const [name, setName] = useState('');
  const [locality, setLocality] = useState('');
  const [category, setCategory] = useState<IncidentReport['category']>('stranded_people');
  const [depthFeet, setDepthFeet] = useState<number>(3);
  const [urgency, setUrgency] = useState<IncidentReport['urgency']>('urgent');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!locality.trim() || !description.trim()) return;

    // Approximate coordinates around Chennai center or selected locality
    const baseLat = 13.0400 + (Math.random() - 0.5) * 0.08;
    const baseLng = 80.2100 + (Math.random() - 0.5) * 0.08;

    const newReport: IncidentReport = {
      id: `inc-${Date.now()}`,
      reporterName: name.trim() || 'Citizen Volunteer',
      category,
      locationName: locality.trim(),
      coordinates: [baseLat, baseLng],
      waterDepthFeet: depthFeet,
      urgency,
      description: description.trim(),
      timestamp: 'Just now',
      verified: false,
      upvotes: 1,
    };

    onSubmitIncident(newReport);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden text-slate-100">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-850">
          <div className="flex items-center gap-2">
            <LifeBuoy className="w-5 h-5 text-amber-400" />
            <h2 className="font-semibold text-sm">Report Waterlogging or Rescue Request</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
          <div>
            <label className="font-semibold text-slate-300 block mb-1">Your Name / Organization</label>
            <input
              type="text"
              placeholder="e.g. Ramesh K. (Velachery Resident)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-300 block mb-1">
              Locality & Specific Street / Landmark <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 5th Main Road, Ram Nagar, Madipakkam"
              value={locality}
              onChange={(e) => setLocality(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-300 block mb-1">Issue Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as IncidentReport['category'])}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-sky-500 cursor-pointer"
              >
                <option value="stranded_people">Stranded Citizens / Need Boat</option>
                <option value="water_surge">Severe Water Stagnation</option>
                <option value="road_blocked">Road or Subway Inundated</option>
                <option value="medical_emergency">Medical / Dialysis Emergency</option>
                <option value="water_supply">Drinking Water Needed</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-300 block mb-1">Urgency Level</label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as IncidentReport['urgency'])}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-sky-500 cursor-pointer"
              >
                <option value="urgent">Urgent</option>
                <option value="life_threatening">Life Threatening</option>
                <option value="routine">Routine Observation</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-300">Estimated Water Depth (Feet)</label>
              <span className="font-bold text-amber-400">{depthFeet} Feet</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="8"
              step="0.5"
              value={depthFeet}
              onChange={(e) => setDepthFeet(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-300 block mb-1">
              Details / Special Needs (Elderly, Kids, Power Cut, Food) <span className="text-rose-400">*</span>
            </label>
            <textarea
              required
              rows={3}
              placeholder="Describe situation, exact house number or landmarks for rescue teams..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-sky-500 resize-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-600/30"
            >
              <Send className="w-3.5 h-3.5" />
              Submit Incident Pin
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
