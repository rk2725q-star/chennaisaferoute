/**
 * Real-Time Doppler Weather Radar Service (RainViewer API)
 * Fetches live Doppler radar reflectivity scans and nowcasts for Chennai region
 */

export interface RadarFrame {
  time: number;
  path: string;
  url: string;
  timeLabel: string;
  isNowcast?: boolean;
}

export interface RadarData {
  host: string;
  generatedAt: number;
  frames: RadarFrame[];
  latestFrame: RadarFrame | null;
}

let cachedRadarData: RadarData | null = null;
let lastFetchTimestamp = 0;
const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes cache

/**
 * Fetches latest radar scan frames from RainViewer free API
 */
export async function fetchLiveRadarData(): Promise<RadarData> {
  const now = Date.now();
  if (cachedRadarData && now - lastFetchTimestamp < CACHE_TTL_MS) {
    return cachedRadarData;
  }

  try {
    const res = await fetch('https://api.rainviewer.com/public/weather-maps.json');
    if (!res.ok) {
      throw new Error(`RainViewer API error: ${res.status}`);
    }

    const data = await res.json();
    const host: string = data.host || 'https://tilecache.rainviewer.com';
    const pastFrames = data.radar?.past || [];
    const nowcastFrames = data.radar?.nowcast || [];

    const allFramesRaw = [
      ...pastFrames.map((f: any) => ({ ...f, isNowcast: false })),
      ...nowcastFrames.map((f: any) => ({ ...f, isNowcast: true }))
    ];

    const frames: RadarFrame[] = allFramesRaw.map((frame: any) => {
      const d = new Date(frame.time * 1000);
      const hours = d.getHours().toString().padStart(2, '0');
      const mins = d.getMinutes().toString().padStart(2, '0');
      const timeLabel = `${hours}:${mins} ${frame.isNowcast ? '(Forecast)' : 'IST'}`;
      // RainViewer v2 tile URL pattern: {host}{path}/256/{z}/{x}/{y}/2/1_1.png
      // Color scheme 2 = Universal radar palette (cyan -> blue -> green -> yellow -> red)
      const url = `${host}${frame.path}/256/{z}/{x}/{y}/2/1_1.png`;

      return {
        time: frame.time,
        path: frame.path,
        url,
        timeLabel,
        isNowcast: frame.isNowcast
      };
    });

    const latestFrame = frames.length > 0 ? frames[pastFrames.length > 0 ? pastFrames.length - 1 : frames.length - 1] : null;

    cachedRadarData = {
      host,
      generatedAt: data.generated || Math.floor(now / 1000),
      frames,
      latestFrame
    };
    lastFetchTimestamp = now;

    return cachedRadarData;
  } catch (err) {
    console.error('Failed to fetch live radar data:', err);
    // Return fallback cached or empty structure
    if (cachedRadarData) return cachedRadarData;

    return {
      host: 'https://tilecache.rainviewer.com',
      generatedAt: Math.floor(now / 1000),
      frames: [],
      latestFrame: null
    };
  }
}
