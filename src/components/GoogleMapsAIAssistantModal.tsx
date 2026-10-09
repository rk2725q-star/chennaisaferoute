import React, { useState } from 'react';
import {
  Sparkles,
  MapPin,
  ExternalLink,
  Search,
  AlertTriangle,
  Hospital,
  ShieldCheck,
  Send,
  X,
  Compass,
  Navigation,
  Loader2
} from 'lucide-react';

interface MapLink {
  title: string;
  uri: string;
}

interface AssistantResponse {
  success: boolean;
  text: string;
  groundedWithGoogleMaps: boolean;
  mapLinks: MapLink[];
  note?: string;
}

interface GoogleMapsAIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  userCoords?: [number, number];
  onSelectDestinationName?: (name: string) => void;
}

export const GoogleMapsAIAssistantModal: React.FC<GoogleMapsAIAssistantModalProps> = ({
  isOpen,
  onClose,
  userCoords = [13.02, 80.21],
  onSelectDestinationName,
}) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<AssistantResponse | null>(null);

  const quickPrompts = [
    '🏥 Nearest elevated hospital with 24/7 power backup near Velachery',
    '🚗 Is Kathipara Grade Separator open and dry to Chennai Airport?',
    '🛡️ Official Greater Chennai Corporation flood relief shelters',
    '⛔ Which major subways (Saidapet, Vyasarpadi, Perambur) are blocked?'
  ];

  if (!isOpen) return null;

  const handleAsk = async (queryText?: string) => {
    const q = queryText || prompt;
    if (!q.trim()) return;

    setLoading(true);
    setResponse(null);

    try {
      const res = await fetch('/api/gemini/maps-grounding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: q,
          lat: userCoords[0],
          lng: userCoords[1],
        }),
      });

      const data: AssistantResponse = await res.json();
      setResponse(data);
    } catch (err) {
      console.error(err);
      setResponse({
        success: false,
        text: 'Unable to connect to Google Maps intelligence service. Please check your network or try again.',
        groundedWithGoogleMaps: false,
        mapLinks: [
          {
            title: 'Apollo Hospitals Greams Road',
            uri: 'https://maps.google.com/?q=Apollo+Hospitals+Greams+Road+Chennai',
          },
          {
            title: 'Rajiv Gandhi General Hospital',
            uri: 'https://maps.google.com/?q=Rajiv+Gandhi+Government+General+Hospital+Chennai',
          },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-sky-400 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Google Maps AI Intelligence
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  Maps Grounded
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Live place verification, flood-safe hospital access & elevated corridors
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Quick Prompts */}
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Quick Flood Queries
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {quickPrompts.map((qp, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setPrompt(qp);
                    handleAsk(qp);
                  }}
                  className="text-left text-xs p-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 hover:bg-sky-50 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer font-medium"
                >
                  {qp}
                </button>
              ))}
            </div>
          </div>

          {/* Search Input */}
          <div className="relative flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAsk();
                }}
                placeholder="Ask about high-ground roads, hospital access, or relief spots..."
                className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>

            <button
              onClick={() => handleAsk()}
              disabled={loading || !prompt.trim()}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer shrink-0"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>Ask</span>
            </button>
          </div>

          {/* Loading Indicator */}
          {loading && (
            <div className="p-8 flex flex-col items-center justify-center text-center space-y-2">
              <Loader2 className="w-7 h-7 text-blue-600 animate-spin" />
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Grounding with live Google Maps place data & Chennai hydrology...
              </p>
              <span className="text-[11px] text-slate-400">
                Evaluating terrain elevations, road closures, and shelter readiness
              </span>
            </div>
          )}

          {/* Assistant Response Card */}
          {response && (
            <div className="space-y-3 animate-fade-in">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Verified Chennai Flood Advisory</span>
                  </div>
                  {response.groundedWithGoogleMaps && (
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1">
                      <Compass className="w-3 h-3" />
                      Live Maps Grounded
                    </span>
                  )}
                </div>

                {/* Formatted Text Content */}
                <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap font-sans">
                  {response.text}
                </div>

                {/* Google Maps Place Links */}
                {response.mapLinks && response.mapLinks.length > 0 && (
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-700 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Google Maps Verified Locations
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {response.mapLinks.map((link, lIdx) => (
                        <a
                          key={lIdx}
                          href={link.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2.5 rounded-lg bg-white dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-blue-600 dark:text-blue-400 hover:underline transition group"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <MapPin className="w-3.5 h-3.5 shrink-0 text-red-500" />
                            <span className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">
                              {link.title}
                            </span>
                          </div>
                          <ExternalLink className="w-3.5 h-3.5 shrink-0 text-slate-400 group-hover:text-blue-600" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span>GCC Flood Cell: 1913 | State Toll-Free: 1070</span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 font-semibold cursor-pointer transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
