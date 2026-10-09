import React from 'react';
import { FloodZone, CriticalFacility, SubmergedRoadOrSubway, IncidentReport } from '../types';
import { X, Hospital, Home, AlertOctagon, Phone, MapPin, Zap, CheckCircle2, ShieldAlert, ArrowRight } from 'lucide-react';

interface FacilityInspectorProps {
  selectedZone: FloodZone | null;
  selectedFacility: CriticalFacility | null;
  selectedSubway: SubmergedRoadOrSubway | null;
  selectedIncident: IncidentReport | null;
  onClose: () => void;
}

export const FacilityInspector: React.FC<FacilityInspectorProps> = ({
  selectedZone,
  selectedFacility,
  selectedSubway,
  selectedIncident,
  onClose,
}) => {
  if (!selectedZone && !selectedFacility && !selectedSubway && !selectedIncident) {
    return null;
  }

  return (
    <div className="absolute bottom-4 right-16 z-30 w-96 max-w-[calc(100vw-5rem)] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xl overflow-hidden text-slate-800 dark:text-slate-100 animate-fade-in font-sans">
      {/* Header with Close */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50/90 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800">
        <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
          {selectedFacility
            ? `Critical Facility • ${selectedFacility.type.toUpperCase()}`
            : selectedSubway
            ? 'Subway / Road Closure'
            : selectedIncident
            ? 'Citizen SOS / Incident'
            : 'Locality Risk Profile'}
        </span>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-3 max-h-[75vh] overflow-y-auto">
        {/* Critical Facility Card */}
        {selectedFacility && (
          <>
            <div>
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-bold text-slate-100 text-sm">{selectedFacility.name}</h3>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    selectedFacility.accessStatus === 'fully_accessible'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                      : selectedFacility.accessStatus === 'limited_access'
                      ? 'bg-amber-950 text-amber-300 border border-amber-700'
                      : 'bg-rose-950 text-rose-300 border border-rose-700'
                  }`}
                >
                  {selectedFacility.accessStatus.replace('_', ' ')}
                </span>
              </div>
              <div className="text-xs text-slate-400 mt-1 flex items-start gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                <span>{selectedFacility.address}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {selectedFacility.emergencyBeds !== undefined && (
                <div className="bg-slate-950/70 p-2 rounded border border-slate-800">
                  <div className="text-[10px] text-slate-400">Emergency Beds</div>
                  <div className="font-bold text-emerald-400 text-sm">
                    {selectedFacility.emergencyBeds} Available
                  </div>
                </div>
              )}

              {selectedFacility.capacity !== undefined && (
                <div className="bg-slate-950/70 p-2 rounded border border-slate-800">
                  <div className="text-[10px] text-slate-400">Shelter Occupancy</div>
                  <div className="font-bold text-sky-400 text-sm">
                    {selectedFacility.currentOccupancy} / {selectedFacility.capacity}
                  </div>
                </div>
              )}

              <div className="bg-slate-950/70 p-2 rounded border border-slate-800">
                <div className="text-[10px] text-slate-400">Water Depth at Gate</div>
                <div className="font-bold text-slate-200 text-sm">
                  {selectedFacility.submergedDepthCm} cm
                </div>
              </div>

              <div className="bg-slate-950/70 p-2 rounded border border-slate-800">
                <div className="text-[10px] text-slate-400">Backup Generator</div>
                <div className="font-bold text-slate-200 text-sm flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span className="capitalize">{selectedFacility.generatorStatus}</span>
                </div>
              </div>
            </div>

            <div className="p-2.5 rounded bg-slate-950/50 border border-slate-800 text-xs text-slate-300">
              <strong className="text-slate-200 block mb-0.5">Operational Advisory:</strong>
              {selectedFacility.notes}
            </div>

            <a
              href={`tel:${selectedFacility.contact.split('/')[0].trim()}`}
              className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition"
            >
              <Phone className="w-3.5 h-3.5" />
              Call Emergency Desk ({selectedFacility.contact})
            </a>
          </>
        )}

        {/* Submerged Subway Card */}
        {selectedSubway && (
          <>
            <div>
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-bold text-slate-100 text-sm">{selectedSubway.name}</h3>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    selectedSubway.status === 'closed_submerged'
                      ? 'bg-rose-950 text-rose-300 border border-rose-700'
                      : 'bg-amber-950 text-amber-300 border border-amber-700'
                  }`}
                >
                  {selectedSubway.status.replace('_', ' ')}
                </span>
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Corridor: <strong>{selectedSubway.affectedCorridor}</strong>
              </div>
            </div>

            <div className="bg-rose-950/40 border border-rose-800/80 p-3 rounded-lg text-center">
              <div className="text-[11px] uppercase tracking-wider text-rose-300 font-semibold">
                Current Water Depth
              </div>
              <div className="text-3xl font-black text-rose-400 mt-0.5 font-mono">
                {selectedSubway.waterDepthCm} <span className="text-sm font-normal">cm</span>
              </div>
              <div className="text-[10px] text-rose-300/80 mt-1">
                Barricaded by Chennai Traffic Police
              </div>
            </div>

            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg text-xs space-y-1">
              <strong className="text-emerald-400 flex items-center gap-1">
                <ArrowRight className="w-3.5 h-3.5" /> Recommended Alternate Detour:
              </strong>
              <div className="text-slate-200 font-medium">{selectedSubway.alternateRoute}</div>
            </div>
          </>
        )}

        {/* Citizen Incident Card */}
        {selectedIncident && (
          <>
            <div>
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-bold text-slate-100 text-sm">{selectedIncident.locationName}</h3>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    selectedIncident.urgency === 'life_threatening'
                      ? 'bg-rose-950 text-rose-300 border border-rose-700'
                      : selectedIncident.urgency === 'urgent'
                      ? 'bg-amber-950 text-amber-300 border border-amber-700'
                      : 'bg-sky-950 text-sky-300 border border-sky-700'
                  }`}
                >
                  {selectedIncident.urgency.replace('_', ' ')}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Reported by {selectedIncident.reporterName} • {selectedIncident.timestamp}
              </div>
            </div>

            <div className="bg-slate-950/60 p-2.5 rounded border border-slate-800 text-xs">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Water Level</div>
              <div className="text-lg font-bold text-amber-400">
                {selectedIncident.waterDepthFeet} Feet
              </div>
            </div>

            <p className="text-xs text-slate-300 bg-slate-950/40 p-2.5 rounded border border-slate-800/80 leading-relaxed">
              {selectedIncident.description}
            </p>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Verified Field Report
              </span>
              <span>{selectedIncident.upvotes} Citizens confirmed</span>
            </div>
          </>
        )}

        {/* Locality / Flood Zone Card */}
        {selectedZone && !selectedFacility && !selectedSubway && !selectedIncident && (
          <>
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-slate-100 text-sm">{selectedZone.name}</h3>
                  <div className="text-xs text-slate-400">
                    Zone {selectedZone.zoneNumber} • {selectedZone.borough}
                  </div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    selectedZone.riskLevel === 'critical'
                      ? 'bg-rose-950 text-rose-300 border border-rose-700'
                      : selectedZone.riskLevel === 'high'
                      ? 'bg-amber-950 text-amber-300 border border-amber-700'
                      : 'bg-yellow-950 text-yellow-300 border border-yellow-700'
                  }`}
                >
                  {selectedZone.riskLevel} Risk
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-950/70 p-2 rounded border border-slate-800">
                <div className="text-[10px] text-slate-400">Inundation Depth</div>
                <div className="font-bold text-rose-400 text-sm">{selectedZone.waterDepthMeters} m</div>
              </div>
              <div className="bg-slate-950/70 p-2 rounded border border-slate-800">
                <div className="text-[10px] text-slate-400">Vulnerable Citizens</div>
                <div className="font-bold text-sky-400 text-sm">
                  {(selectedZone.vulnerablePopulation / 1000).toFixed(0)}k Residents
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-300 space-y-1.5 bg-slate-950/60 p-2.5 rounded border border-slate-800">
              <div>
                <strong className="text-slate-200">Drainage Basin:</strong> {selectedZone.drainageBasin}
              </div>
              <div>
                <strong className="text-slate-200">Critical Access Situation:</strong>{' '}
                {selectedZone.criticalIssues}
              </div>
              <div className="pt-1.5 border-t border-slate-800 text-emerald-400">
                <strong>Designated High Ground Evacuation:</strong> {selectedZone.safeEvacuationPoint}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
