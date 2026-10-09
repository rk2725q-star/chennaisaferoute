import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  Navigation,
  AlertTriangle,
  Sparkles,
  Bell,
  CloudRain,
  Compass,
  ArrowRight,
  ShieldCheck,
  Radio,
  ExternalLink,
  Layers,
  MapPin,
  RefreshCw
} from 'lucide-react';

import { SubwaySensorTelemetry } from '../utils/telemetryService';

interface ThreeDDigitalTwinProps {
  onSwitchTo2D?: () => void;
  onOpenSubwaySensors?: () => void;
  subwaySensors?: SubwaySensorTelemetry[];
}

interface NodeDef {
  n: string;
  x: number;
  z: number;
}

interface EdgeDef {
  a: number;
  b: number;
  n: string;
  d: number; // drainage capacity factor (0-1)
  len: number;
  elev: number;
  risk: number;
  mesh?: THREE.Group;
  mat?: THREE.MeshStandardMaterial;
  mid?: THREE.Vector3;
}

export const ThreeDDigitalTwin: React.FC<ThreeDDigitalTwinProps> = ({
  onSwitchTo2D,
  onOpenSubwaySensors,
  subwaySensors
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // App states
  const [rainfall, setRainfall] = useState<number>(40);
  const [activeTab, setActiveTab] = useState<'routes' | 'risk' | 'ai' | 'alerts'>('routes');
  const [fromNodeIdx, setFromNodeIdx] = useState<number>(12); // Airport (MAA)
  const [toNodeIdx, setToNodeIdx] = useState<number>(0);   // Chennai Central
  const [activeRouteInfo, setActiveRouteInfo] = useState<{
    fastestKm: number;
    fastestEta: number;
    fastestRisk: number;
    fastestVia: string;
    safeKm: number;
    safeEta: number;
    safeRisk: number;
    safeVia: string;
    isDiverted: boolean;
    diversionCount: number;
    isSame: boolean;
  } | null>(null);

  const [stats, setStats] = useState({ highRiskCount: 0, avgRisk: '0%', rainfall: 40 });
  const [rankedEdges, setRankedEdges] = useState<EdgeDef[]>([]);
  const [alertLogs, setAlertLogs] = useState<Array<{ id: string; time: string; text: string; isOk?: boolean }>>([
    { id: '1', time: new Date().toLocaleTimeString(), text: 'System online. 3D Digital Twin monitoring 24 Chennai corridors.', isOk: true }
  ]);
  const [isSyncingWeather, setIsSyncingWeather] = useState(false);
  const [aiCustomQuestion, setAiCustomQuestion] = useState('');
  const [aiCustomResponse, setAiCustomResponse] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // References for Three.js instance controls
  const sceneRef = useRef<THREE.Scene | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const goalTargetRef = useRef<THREE.Vector3 | null>(null);
  const edgesRef = useRef<EdgeDef[]>([]);
  const nodesRef = useRef<NodeDef[]>([]);
  const updateRiskVisualsRef = useRef<((rain: number) => void) | null>(null);
  const findRoutesRef = useRef<((s: number, d: number) => void) | null>(null);

  // 1. Terrain elevation mathematical model for Greater Chennai
  const terrainH = (x: number, z: number): number => {
    let base = (70 - x) * (x > 70 ? 0.18 : 0.08);
    base = Math.min(base, 9);
    const dzC = z - (-20 + 6 * Math.sin(x * 0.05)); // Cooum River alignment
    const dzA = z - (30 + 5 * Math.sin(x * 0.04 + 1)); // Adyar River alignment
    const dip1 = 3.4 * Math.exp(-(dzC * dzC) / 16);
    const dip2 = 3.4 * Math.exp(-(dzA * dzA) / 20);
    const vel = 2.6 * Math.exp(-(((x - 25) ** 2) + ((z - 45) ** 2)) / 350); // Velachery depression basin
    const noise = 0.65 * Math.sin(x * 0.13) * Math.cos(z * 0.11) + 0.35 * Math.sin(x * 0.31 + z * 0.17);
    return base - dip1 - dip2 - vel + noise;
  };

  const roadY = (x: number, z: number): number => {
    return Math.max(terrainH(x, z) + 0.45, 0.25 + 0.55);
  };

  // Sync with real Live Weather API
  const handleFetchLiveWeather = async () => {
    setIsSyncingWeather(true);
    try {
      const res = await fetch('/api/weather/live');
      const data = await res.json();
      if (data && data.stations && data.stations.length > 0) {
        // Average precipitation across Chennai stations
        const total = data.stations.reduce((sum: number, s: any) => sum + (s.precip24h || 0), 0);
        const avgLive = Math.round(total / data.stations.length) || 12;
        setRainfall(avgLive);
        if (updateRiskVisualsRef.current) {
          updateRiskVisualsRef.current(avgLive);
        }
        if (findRoutesRef.current) {
          findRoutesRef.current(fromNodeIdx, toNodeIdx);
        }
        setAlertLogs((prev) => [
          {
            id: String(Date.now()),
            time: new Date().toLocaleTimeString(),
            text: `Synced with Open-Meteo Live Radar: ${avgLive} mm/24h recorded across ${data.stations.length} Chennai stations.`,
            isOk: true
          },
          ...prev
        ]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSyncingWeather(false);
    }
  };

  // Ask real backend AI
  const handleAskAI = async () => {
    if (!aiCustomQuestion.trim()) return;
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/gemini/maps-grounding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiCustomQuestion, rain: rainfall })
      });
      const data = await res.json();
      setAiCustomResponse(data.text || 'Unable to retrieve AI analysis.');
    } catch {
      setAiCustomResponse('AI Commander offline. Using local physics heuristics.');
    } finally {
      setIsAiLoading(false);
    }
  };

  // Broadcast Alert Handler
  const handleBroadcastAlert = (roadName: string, riskPct: number) => {
    const time = new Date().toLocaleTimeString();
    setAlertLogs((prev) => [
      {
        id: String(Date.now()),
        time,
        text: `🚨 Flood alert broadcast for ${roadName} (${riskPct}% risk). Emergency dispatch & commuter SMS pushed.`
      },
      ...prev
    ]);
  };

  const handleBroadcastAll = () => {
    const critical = rankedEdges.filter((e) => e.risk > 0.65);
    if (critical.length === 0) {
      setAlertLogs((prev) => [
        {
          id: String(Date.now()),
          time: new Date().toLocaleTimeString(),
          text: '✅ All corridors currently below critical threshold (65%). No alert needed.',
          isOk: true
        },
        ...prev
      ]);
      return;
    }
    critical.forEach((e) => handleBroadcastAlert(e.n, Math.round(e.risk * 100)));
  };

  // Focus Camera on specific road segment
  const handleFocusRoad = (edge: EdgeDef) => {
    if (edge.mid) {
      goalTargetRef.current = edge.mid.clone();
    }
  };

  // Initialize Three.js Scene
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    // Dimensions
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // Scene & Fog
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x0e1626);
    scene.fog = new THREE.Fog(0x0e1626, 180, 420);

    // Camera
    const camera = new THREE.PerspectiveCamera(55, width / height, 0.5, 1200);
    camera.position.set(-65, 100, 135);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI / 2.12;
    controls.minDistance = 25;
    controls.maxDistance = 340;
    controls.target.set(15, 0, 15);

    // Lighting
    const hemi = new THREE.HemisphereLight(0xbfd8ff, 0x1a2438, 0.85);
    scene.add(hemi);

    const sun = new THREE.DirectionalLight(0xfff2d8, 1.1);
    sun.position.set(-80, 120, -40);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -140;
    sun.shadow.camera.right = 140;
    sun.shadow.camera.top = 140;
    sun.shadow.camera.bottom = -140;
    scene.add(sun);

    // 2. Procedural Terrain Mesh
    const TS = 240;
    const SEG = 110;
    const tGeo = new THREE.PlaneGeometry(TS, TS, SEG, SEG);
    tGeo.rotateX(-Math.PI / 2);
    const pos = tGeo.attributes.position;
    const cols: number[] = [];

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const h = terrainH(x, z);
      pos.setY(i, h);

      let c: THREE.Color;
      if (h < 0.25 + 0.15) {
        c = new THREE.Color(0x24405e); // Lowland tidal marsh
      } else if (h < 1.6) {
        c = new THREE.Color(0x3a5a40).lerp(new THREE.Color(0x588157), (h - 0.3) / 1.3);
      } else {
        c = new THREE.Color(0x588157).lerp(new THREE.Color(0x8a7f5c), Math.min(1, (h - 1.6) / 6));
      }
      cols.push(c.r, c.g, c.b);
    }
    tGeo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    tGeo.computeVertexNormals();

    const terrain = new THREE.Mesh(
      tGeo,
      new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92 })
    );
    terrain.receiveShadow = true;
    scene.add(terrain);

    // 3. Water Plane (animated surface)
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x1e6091,
      transparent: true,
      opacity: 0.82,
      roughness: 0.25,
      metalness: 0.35
    });
    const water = new THREE.Mesh(new THREE.PlaneGeometry(TS + 40, TS + 40), waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.y = 0.25;
    scene.add(water);

    // 4. Procedural Buildings
    const bMat1 = new THREE.MeshStandardMaterial({ color: 0x8892a6, roughness: 0.8 });
    const bMat2 = new THREE.MeshStandardMaterial({ color: 0x6b7688, roughness: 0.8 });
    for (let i = 0; i < 240; i++) {
      const bx = -70 + Math.random() * 130;
      const bz = -60 + Math.random() * 130;
      const bhVal = terrainH(bx, bz);
      if (bhVal < 1.2) continue;
      const centerBoost = Math.exp(-(((bx - 30) ** 2) + ((bz - -5) ** 2)) / 900);
      const bh = 1.5 + Math.random() * 3 + centerBoost * (4 + Math.random() * 8);
      const b = new THREE.Mesh(
        new THREE.BoxGeometry(1.6 + Math.random() * 2, bh, 1.6 + Math.random() * 2),
        Math.random() > 0.5 ? bMat1 : bMat2
      );
      b.position.set(bx, bhVal + bh / 2, bz);
      b.rotation.y = Math.random() * Math.PI;
      b.castShadow = true;
      scene.add(b);
    }

    // 5. Landmark Nodes
    const nodes: NodeDef[] = [
      { n: 'Chennai Central', x: 40, z: -25 },
      { n: 'Egmore', x: 32, z: -18 },
      { n: 'Anna Nagar', x: 0, z: -35 },
      { n: 'Koyambedu', x: -5, z: -12 },
      { n: 'Nungambakkam', x: 30, z: -6 },
      { n: 'T. Nagar', x: 22, z: 6 },
      { n: 'Porur', x: -22, z: 8 },
      { n: 'Guindy (Kathipara)', x: 18, z: 26 },
      { n: 'Mylapore', x: 48, z: 8 },
      { n: 'Marina Beach', x: 60, z: -8 },
      { n: 'Adyar', x: 44, z: 32 },
      { n: 'Velachery', x: 24, z: 46 },
      { n: 'Airport (MAA)', x: 0, z: 46 },
      { n: 'Tambaram', x: -24, z: 72 },
      { n: 'Sholinganallur (OMR)', x: 44, z: 76 },
      { n: 'Perambur', x: 22, z: -45 }
    ];
    nodesRef.current = nodes;

    // Helper for sprite labels
    const makeLabel = (txt: string) => {
      const c = document.createElement('canvas');
      c.width = 512;
      c.height = 112;
      const ctx = c.getContext('2d');
      if (ctx) {
        ctx.font = 'bold 44px Segoe UI, sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0,0,0,0.95)';
        ctx.shadowBlur = 12;
        ctx.fillStyle = '#ffffff';
        ctx.fillText(txt, 256, 68);
      }
      const s = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: new THREE.CanvasTexture(c),
          transparent: true,
          depthTest: false
        })
      );
      s.scale.set(16, 3.5, 1);
      return s;
    };

    nodes.forEach((nd) => {
      const ny = roadY(nd.x, nd.z);
      const pin = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.15, 2.6, 10),
        new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0x7a1010 })
      );
      pin.position.set(nd.x, ny + 1.4, nd.z);
      scene.add(pin);

      const lbl = makeLabel(nd.n);
      lbl.position.set(nd.x, ny + 5.2, nd.z);
      scene.add(lbl);
    });

    // 6. Road Corridors
    const edges: EdgeDef[] = [
      { a: 0, b: 1, n: 'EVR Periyar Salai', d: 0.6, len: 0, elev: 0, risk: 0 },
      { a: 1, b: 4, n: 'Pantheon Road', d: 0.5, len: 0, elev: 0, risk: 0 },
      { a: 4, b: 5, n: 'Anna Salai (North)', d: 0.55, len: 0, elev: 0, risk: 0 },
      { a: 5, b: 7, n: 'Anna Salai (South)', d: 0.5, len: 0, elev: 0, risk: 0 },
      { a: 7, b: 12, n: 'GST Road (North)', d: 0.45, len: 0, elev: 0, risk: 0 },
      { a: 12, b: 13, n: 'GST Road (South)', d: 0.5, len: 0, elev: 0, risk: 0 },
      { a: 7, b: 11, n: 'Velachery Main Rd', d: 0.22, len: 0, elev: 0, risk: 0 },
      { a: 11, b: 14, n: 'Velachery–OMR Link', d: 0.28, len: 0, elev: 0, risk: 0 },
      { a: 10, b: 14, n: 'OMR (Rajiv Gandhi Salai)', d: 0.6, len: 0, elev: 0, risk: 0 },
      { a: 7, b: 10, n: 'Sardar Patel Road', d: 0.55, len: 0, elev: 0, risk: 0 },
      { a: 10, b: 8, n: 'LB Road', d: 0.4, len: 0, elev: 0, risk: 0 },
      { a: 8, b: 9, n: 'Santhome High Rd', d: 0.35, len: 0, elev: 0, risk: 0 },
      { a: 9, b: 0, n: 'Kamarajar Salai', d: 0.5, len: 0, elev: 0, risk: 0 },
      { a: 8, b: 5, n: 'TTK / CIT Road', d: 0.45, len: 0, elev: 0, risk: 0 },
      { a: 3, b: 2, n: 'Inner Ring Road', d: 0.6, len: 0, elev: 0, risk: 0 },
      { a: 3, b: 4, n: 'Poonamallee High Rd', d: 0.5, len: 0, elev: 0, risk: 0 },
      { a: 2, b: 0, n: 'EVR High Road', d: 0.55, len: 0, elev: 0, risk: 0 },
      { a: 6, b: 3, n: 'Arcot Road', d: 0.45, len: 0, elev: 0, risk: 0 },
      { a: 6, b: 7, n: 'Mount–Poonamallee Rd', d: 0.5, len: 0, elev: 0, risk: 0 },
      { a: 11, b: 13, n: 'Tambaram–Velachery Rd', d: 0.32, len: 0, elev: 0, risk: 0 },
      { a: 0, b: 15, n: 'Perambur High Rd', d: 0.5, len: 0, elev: 0, risk: 0 },
      { a: 11, b: 10, n: 'Taramani Link Rd', d: 0.3, len: 0, elev: 0, risk: 0 },
      { a: 6, b: 12, n: 'Porur–Airport Rd', d: 0.5, len: 0, elev: 0, risk: 0 },
      { a: 5, b: 3, n: 'Usman Rd Corridor', d: 0.45, len: 0, elev: 0, risk: 0 }
    ];

    edges.forEach((e) => {
      const A = nodes[e.a];
      const B = nodes[e.b];
      e.len = Math.hypot(A.x - B.x, A.z - B.z);
      const hm = terrainH((A.x + B.x) / 2, (A.z + B.z) / 2);
      e.elev = Math.max(0, Math.min(1, ((terrainH(A.x, A.z) + terrainH(B.x, B.z)) / 2 * 0.5 + hm * 0.5) / 6));
      e.risk = 0;

      e.mat = new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x0a3d1c, emissiveIntensity: 0.6 });
      const g = new THREE.Group();
      const N = Math.max(4, Math.ceil(e.len / 3.2));
      for (let i = 0; i < N; i++) {
        const t0 = i / N;
        const t1 = (i + 1) / N;
        const x0 = A.x + (B.x - A.x) * t0;
        const z0 = A.z + (B.z - A.z) * t0;
        const x1 = A.x + (B.x - A.x) * t1;
        const z1 = A.z + (B.z - A.z) * t1;
        const y0 = roadY(x0, z0);
        const y1 = roadY(x1, z1);
        const segLen = Math.hypot(x1 - x0, z1 - z0, y1 - y0) + 0.15;
        const m = new THREE.Mesh(new THREE.BoxGeometry(segLen, 0.3, 1.5), e.mat);
        m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
        m.rotation.y = Math.atan2(-(z1 - z0), x1 - x0);
        m.rotation.z = Math.atan2(y1 - y0, Math.hypot(x1 - x0, z1 - z0));
        g.add(m);
      }
      e.mesh = g;
      scene.add(g);
      e.mid = new THREE.Vector3((A.x + B.x) / 2, roadY((A.x + B.x) / 2, (A.z + B.z) / 2), (A.z + B.z) / 2);
    });
    edgesRef.current = edges;

    // 7. Rain Particles
    const RAIN_N = 4200;
    const rGeo = new THREE.BufferGeometry();
    const rPos = new Float32Array(RAIN_N * 3);
    const rVel = new Float32Array(RAIN_N);
    for (let i = 0; i < RAIN_N; i++) {
      rPos[i * 3] = -120 + Math.random() * 240;
      rPos[i * 3 + 1] = Math.random() * 80;
      rPos[i * 3 + 2] = -120 + Math.random() * 240;
      rVel[i] = 0.7 + Math.random() * 0.9;
    }
    rGeo.setAttribute('position', new THREE.BufferAttribute(rPos, 3));
    const rainMat = new THREE.PointsMaterial({ color: 0x9db8ff, size: 0.5, transparent: true, opacity: 0.2 });
    const rainPoints = new THREE.Points(rGeo, rainMat);
    scene.add(rainPoints);

    // 8. Pulse Rings for flooded areas
    let pulseRings: THREE.Mesh[] = [];
    const rebuildPulses = () => {
      pulseRings.forEach((r) => scene.remove(r));
      pulseRings = [];
      edges.filter((e) => e.risk > 0.65).forEach((e) => {
        if (!e.mid) return;
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(1.2, 1.7, 32),
          new THREE.MeshBasicMaterial({ color: 0xff4444, transparent: true, opacity: 0.85, side: THREE.DoubleSide })
        );
        ring.rotation.x = -Math.PI / 2;
        ring.position.copy(e.mid).y += 0.4;
        scene.add(ring);
        pulseRings.push(ring);
      });
    };

    // 9. Dynamic Route Meshes & Markers
    let routeMeshes: THREE.Mesh[] = [];
    let routeMarkers: Array<{ mesh: THREE.Mesh; curve: THREE.CatmullRomCurve3; t: number }> = [];

    const clearRoutes = () => {
      routeMeshes.forEach((m) => scene.remove(m));
      routeMeshes = [];
      routeMarkers.forEach((m) => scene.remove(m.mesh));
      routeMarkers = [];
    };

    const drawRoute = (nodePath: number[], color: number, lift: number) => {
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i < nodePath.length - 1; i++) {
        const A = nodes[nodePath[i]];
        const B = nodes[nodePath[i + 1]];
        const N = 10;
        for (let j = 0; j < N; j++) {
          const t = j / N;
          const x = A.x + (B.x - A.x) * t;
          const z = A.z + (B.z - A.z) * t;
          pts.push(new THREE.Vector3(x, roadY(x, z) + lift, z));
        }
      }
      const last = nodes[nodePath[nodePath.length - 1]];
      pts.push(new THREE.Vector3(last.x, roadY(last.x, last.z) + lift, last.z));

      const curve = new THREE.CatmullRomCurve3(pts);
      const tube = new THREE.Mesh(
        new THREE.TubeGeometry(curve, 120, 0.55, 8),
        new THREE.MeshStandardMaterial({
          color,
          emissive: color,
          emissiveIntensity: 0.55,
          transparent: true,
          opacity: 0.95
        })
      );
      scene.add(tube);
      routeMeshes.push(tube);

      const marker = new THREE.Mesh(
        new THREE.SphereGeometry(1.1, 16, 16),
        new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: color, emissiveIntensity: 1 })
      );
      scene.add(marker);
      routeMarkers.push({ mesh: marker, curve, t: Math.random() });
    };

    // 10. Adjacency & Dijkstra Routing
    const adj: Array<Array<{ to: number; e: number }>> = nodes.map(() => []);
    edges.forEach((e, i) => {
      adj[e.a].push({ to: e.b, e: i });
      adj[e.b].push({ to: e.a, e: i });
    });

    const dijkstra = (src: number, dst: number, costFn: (edge: EdgeDef) => number) => {
      const dist = new Array(nodes.length).fill(Infinity);
      const prev = new Array(nodes.length).fill(-1);
      const prevE = new Array(nodes.length).fill(-1);
      const vis = new Array(nodes.length).fill(false);

      dist[src] = 0;
      for (let k = 0; k < nodes.length; k++) {
        let u = -1;
        let best = Infinity;
        for (let i = 0; i < nodes.length; i++) {
          if (!vis[i] && dist[i] < best) {
            best = dist[i];
            u = i;
          }
        }
        if (u === -1) break;
        vis[u] = true;
        adj[u].forEach(({ to, e }) => {
          const c = dist[u] + costFn(edges[e]);
          if (c < dist[to]) {
            dist[to] = c;
            prev[to] = u;
            prevE[to] = e;
          }
        });
      }
      if (dist[dst] === Infinity) return null;

      const path: number[] = [];
      const epath: number[] = [];
      let cur = dst;
      while (cur !== src) {
        path.unshift(cur);
        epath.unshift(prevE[cur]);
        cur = prev[cur];
      }
      path.unshift(src);
      return { path, epath };
    };

    const routeStats = (r: { path: number[]; epath: number[] }) => {
      let totalLen = 0;
      let riskSum = 0;
      let maxR = 0;
      r.epath.forEach((idx) => {
        totalLen += edges[idx].len;
        riskSum += edges[idx].risk * edges[idx].len;
        maxR = Math.max(maxR, edges[idx].risk);
      });
      const avg = riskSum / totalLen;
      const km = totalLen * 0.15; // km conversion
      const speed = 32 * (1 - 0.55 * avg);
      return { km, avg, maxR, eta: (km / speed) * 60 };
    };

    const findRoutes = (src: number, dst: number) => {
      if (src === dst) {
        setActiveRouteInfo(null);
        clearRoutes();
        return;
      }
      clearRoutes();
      const fast = dijkstra(src, dst, (e) => e.len);
      const safe = dijkstra(src, dst, (e) => e.len * (1 + 8 * e.risk * e.risk));
      if (!fast) return;

      const fs = routeStats(fast);
      const ss = safe ? routeStats(safe) : fs;
      const same = safe ? JSON.stringify(fast.epath) === JSON.stringify(safe.epath) : true;

      drawRoute(fast.path, 0x3b82f6, 0.7);
      if (!same && safe) {
        drawRoute(safe.path, 0x34d399, 1.15);
      }

      const highRiskInFast = fast.epath.filter((i) => edges[i].risk > 0.65).length;
      setActiveRouteInfo({
        fastestKm: fs.km,
        fastestEta: Math.round(fs.eta),
        fastestRisk: Math.round(fs.avg * 100),
        fastestVia: fast.epath.map((i) => edges[i].n).slice(0, 3).join(' ➜ '),
        safeKm: ss.km,
        safeEta: Math.round(ss.eta),
        safeRisk: Math.round(ss.avg * 100),
        safeVia: safe ? safe.epath.map((i) => edges[i].n).slice(0, 3).join(' ➜ ') : '',
        isDiverted: fs.maxR > 0.65 && !same,
        diversionCount: highRiskInFast,
        isSame: same
      });
    };
    findRoutesRef.current = findRoutes;

    // 11. Physics Risk Computation
    const riskColor = (r: number) => (r > 0.65 ? 0xef4444 : r > 0.35 ? 0xf59e0b : 0x22c55e);
    const riskEm = (r: number) => (r > 0.65 ? 0x5a0f0f : r > 0.35 ? 0x5c3a05 : 0x0a3d1c);

    const updateAll = (currentRain: number) => {
      const rN = currentRain / 200;
      edges.forEach((e) => {
        e.risk = Math.max(0, Math.min(1, rN * (1.15 - e.elev) * (1.35 - e.d) * 1.05));
        if (e.mat) {
          e.mat.color.setHex(riskColor(e.risk));
          e.mat.emissive.setHex(riskEm(e.risk));
        }
      });
      rebuildPulses();

      const high = edges.filter((e) => e.risk > 0.65);
      const avg = edges.reduce((s, e) => s + e.risk, 0) / edges.length;
      setStats({
        highRiskCount: high.length,
        avgRisk: `${Math.round(avg * 100)}%`,
        rainfall: currentRain
      });

      const sorted = [...edges].sort((a, b) => b.risk - a.risk);
      setRankedEdges(sorted);

      // Environmental atmosphere adjustment
      const tNorm = Math.min(1, currentRain / 250);
      rainMat.opacity = tNorm * 0.85;
      scene.background = new THREE.Color(0x0e1626).lerp(new THREE.Color(0x080c16), tNorm);
      scene.fog = new THREE.Fog(0x0e1626, 180, 420 - tNorm * 160);
      sun.intensity = 1.1 - tNorm * 0.75;
      hemi.intensity = 0.85 - tNorm * 0.35;
    };
    updateRiskVisualsRef.current = updateAll;

    // Initial pass
    updateAll(rainfall);
    findRoutes(fromNodeIdx, toNodeIdx);

    // 12. Animation Loop
    let flash = 0;
    const clock = new THREE.Clock();
    let animationId: number;

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.elapsedTime;

      // Rain animation
      const p = rGeo.attributes.position.array as Float32Array;
      const speed = 40 + rainfall * 0.4;
      for (let i = 0; i < RAIN_N; i++) {
        p[i * 3 + 1] -= rVel[i] * speed * dt;
        if (p[i * 3 + 1] < 0) {
          p[i * 3 + 1] = 70 + Math.random() * 15;
          p[i * 3] = -120 + Math.random() * 240;
          p[i * 3 + 2] = -120 + Math.random() * 240;
        }
      }
      rGeo.attributes.position.needsUpdate = true;

      // Water height oscillation with rainfall tide
      water.position.y = 0.25 + Math.sin(t * 1.2) * 0.05 + Math.min(1.4, (rainfall / 250) * 1.4);

      // Pulse ring expansion
      pulseRings.forEach((r, i) => {
        const s = 1 + (((t * 1.4 + i * 0.4) % 1) * 2.2);
        r.scale.set(s, s, s);
        (r.material as THREE.MeshBasicMaterial).opacity = 0.85 * (1 - ((t * 1.4 + i * 0.4) % 1));
      });

      // Route traversal beads
      routeMarkers.forEach((m) => {
        m.t = (m.t + dt * 0.06) % 1;
        m.mesh.position.copy(m.curve.getPointAt(m.t));
      });

      // Thunder flashes on extreme storms
      if (rainfall > 170 && Math.random() < 0.006) flash = 1;
      if (flash > 0) {
        hemi.intensity = 0.85 - Math.min(1, rainfall / 250) * 0.35 + flash * 2.4;
        flash -= dt * 4;
      }

      // Smooth camera interpolation to target
      if (goalTargetRef.current) {
        controls.target.lerp(goalTargetRef.current, 0.06);
        if (controls.target.distanceTo(goalTargetRef.current) < 0.5) {
          goalTargetRef.current = null;
        }
      }

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // Window Resize
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []);

  // Update when rainfall changes
  const handleRainSliderChange = (newVal: number) => {
    setRainfall(newVal);
    if (updateRiskVisualsRef.current) {
      updateRiskVisualsRef.current(newVal);
    }
    if (findRoutesRef.current) {
      findRoutesRef.current(fromNodeIdx, toNodeIdx);
    }
  };

  const handleRouteSearch = () => {
    if (findRoutesRef.current) {
      findRoutesRef.current(fromNodeIdx, toNodeIdx);
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0b1220] font-sans text-slate-100 select-none">
      {/* 3D WebGL Canvas Holder */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full z-0 cursor-grab active:cursor-grabbing" />

      {/* Floating Topbar */}
      <header className="fixed top-3.5 left-1/2 -translate-x-1/2 z-30 flex flex-wrap gap-2.5 items-center bg-slate-900/90 border border-slate-700/60 px-4 py-2.5 rounded-2xl shadow-2xl backdrop-blur-md max-w-[94vw]">
        <div className="flex items-center gap-2 pr-2 border-r border-slate-700">
          <span className="text-lg">🌊</span>
          <span className="font-extrabold text-sm tracking-wide text-white">
            Chennai <span className="text-sky-400">FloodSafe 3D</span>
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <label className="text-slate-400 text-[11px] font-medium hidden sm:inline">From:</label>
          <select
            value={fromNodeIdx}
            onChange={(e) => setFromNodeIdx(+e.target.value)}
            className="bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs outline-none cursor-pointer focus:border-sky-500"
          >
            {nodesRef.current.map((nd, idx) => (
              <option key={idx} value={idx}>
                {nd.n}
              </option>
            ))}
          </select>

          <span className="text-slate-500">➔</span>

          <label className="text-slate-400 text-[11px] font-medium hidden sm:inline">To:</label>
          <select
            value={toNodeIdx}
            onChange={(e) => setToNodeIdx(+e.target.value)}
            className="bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs outline-none cursor-pointer focus:border-sky-500"
          >
            {nodesRef.current.map((nd, idx) => (
              <option key={idx} value={idx}>
                {nd.n}
              </option>
            ))}
          </select>

          <button
            onClick={handleRouteSearch}
            className="bg-linear-to-r from-blue-600 to-sky-500 hover:brightness-110 text-white font-bold px-3.5 py-1.5 rounded-lg text-xs transition cursor-pointer shadow-md"
          >
            Find Safe Route
          </button>

          {/* Switch to 2D GIS Frontend Button */}
          {onSwitchTo2D && (
            <button
              onClick={onSwitchTo2D}
              className="ml-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-sky-300 font-semibold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition cursor-pointer"
              title="Open 2D GIS Live Google Maps View"
            >
              <Layers className="w-3.5 h-3.5 text-sky-400" />
              <span>🗺️ Switch to 2D GIS Map</span>
            </button>
          )}

          {/* Subway IoT Ultrasonic Sensor Quick Trigger */}
          {onOpenSubwaySensors && (
            <button
              onClick={onOpenSubwaySensors}
              className="ml-1 bg-rose-950/60 hover:bg-rose-900/80 border border-rose-700 text-rose-300 font-semibold px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition cursor-pointer"
              title="Open Subway IoT Ultrasonic Sensor Network"
            >
              <Radio className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
              <span>🚨 Subways ({subwaySensors?.filter((s) => s.status === 'submerged_closed').length ?? 4} Closed)</span>
            </button>
          )}
        </div>
      </header>

      {/* Floating Left Panel */}
      <aside className="fixed top-20 left-3.5 bottom-3.5 w-90 z-25 bg-slate-900/95 border border-slate-700/60 rounded-2xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-xl">
        {/* Navigation Tabs */}
        <nav className="flex border-b border-slate-800 bg-slate-950/40">
          <button
            onClick={() => setActiveTab('routes')}
            className={`flex-1 py-2.5 text-xs font-bold transition border-b-2 ${
              activeTab === 'routes'
                ? 'text-sky-400 border-sky-400 bg-slate-800/40'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            🧭 Routes
          </button>
          <button
            onClick={() => setActiveTab('risk')}
            className={`flex-1 py-2.5 text-xs font-bold transition border-b-2 ${
              activeTab === 'risk'
                ? 'text-sky-400 border-sky-400 bg-slate-800/40'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            ⚠ Risk Rank
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`flex-1 py-2.5 text-xs font-bold transition border-b-2 ${
              activeTab === 'ai'
                ? 'text-sky-400 border-sky-400 bg-slate-800/40'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            🤖 AI Insights
          </button>
          <button
            onClick={() => setActiveTab('alerts')}
            className={`flex-1 py-2.5 text-xs font-bold transition border-b-2 ${
              activeTab === 'alerts'
                ? 'text-sky-400 border-sky-400 bg-slate-800/40'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            🔔 Alerts
          </button>
        </nav>

        {/* Tab 1: Routes */}
        {activeTab === 'routes' && (
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
            {/* City Status Stats */}
            <div className="bg-slate-800/70 border border-slate-700/60 rounded-xl p-3">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-sky-400 mb-2">City Disruption Overview</h3>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-slate-900/80 rounded-lg p-2 text-center">
                  <div className={`text-lg font-black ${stats.highRiskCount > 0 ? 'text-rose-500' : 'text-emerald-400'}`}>
                    {stats.highRiskCount}
                  </div>
                  <div className="text-[10px] text-slate-400">HIGH-RISK ROADS</div>
                </div>
                <div className="bg-slate-900/80 rounded-lg p-2 text-center">
                  <div className="text-lg font-black text-white">{stats.avgRisk}</div>
                  <div className="text-[10px] text-slate-400">AVG RISK</div>
                </div>
                <div className="bg-slate-900/80 rounded-lg p-2 text-center">
                  <div className="text-lg font-black text-sky-400">{stats.rainfall}</div>
                  <div className="text-[10px] text-slate-400">MM / 24H</div>
                </div>
              </div>
            </div>

            {/* Route Cards */}
            {activeRouteInfo ? (
              <div className="space-y-2.5">
                {activeRouteInfo.isDiverted && (
                  <div className="bg-linear-to-br from-amber-950/80 to-rose-950/80 border border-amber-600/50 rounded-xl p-3 text-xs leading-relaxed text-amber-200">
                    ⚠️ <strong>DIVERSION ACTIVE:</strong> Fastest direct route crosses{' '}
                    <strong>{activeRouteInfo.diversionCount} high-risk corridor(s)</strong>. A safer elevated detour is
                    highlighted in green.
                  </div>
                )}

                <div className="bg-slate-800/70 border-l-4 border-blue-500 rounded-xl p-3 text-xs space-y-1">
                  <div className="font-extrabold text-sm text-white flex items-center justify-between">
                    <span>🔵 Fastest Route</span>
                    <span className="text-blue-400 font-bold">{activeRouteInfo.fastestKm.toFixed(1)} km</span>
                  </div>
                  <div className="text-slate-300">
                    ~{activeRouteInfo.fastestEta} min · Flood Risk Exposure:{' '}
                    <strong className={activeRouteInfo.fastestRisk > 60 ? 'text-rose-400' : 'text-emerald-400'}>
                      {activeRouteInfo.fastestRisk}%
                    </strong>
                  </div>
                  <div className="text-[11px] text-slate-400">Via: {activeRouteInfo.fastestVia}</div>
                </div>

                {!activeRouteInfo.isSame ? (
                  <div className="bg-slate-800/70 border-l-4 border-emerald-500 rounded-xl p-3 text-xs space-y-1">
                    <div className="font-extrabold text-sm text-emerald-400 flex items-center justify-between">
                      <span>🟢 Safe Alternate (Recommended)</span>
                      <span className="text-emerald-400 font-bold">{activeRouteInfo.safeKm.toFixed(1)} km</span>
                    </div>
                    <div className="text-slate-300">
                      ~{activeRouteInfo.safeEta} min · Flood Risk Exposure:{' '}
                      <strong className="text-emerald-400">{activeRouteInfo.safeRisk}%</strong>
                    </div>
                    <div className="text-[11px] text-slate-400">Via: {activeRouteInfo.safeVia}</div>
                    <div className="text-[11px] text-sky-400 pt-1 font-semibold">
                      +{Math.max(0, activeRouteInfo.safeKm - activeRouteInfo.fastestKm).toFixed(1)} km detour avoids submerged corridors.
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-800/70 border-l-4 border-emerald-500 rounded-xl p-3 text-xs text-emerald-300">
                    ✅ The fastest route is already the safest available corridor under current rainfall.
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3.5 text-xs text-slate-400 leading-relaxed">
                Select your origin and destination in the topbar, then click <strong>Find Safe Route</strong> to compute 3D
                risk-weighted routing over Chennai's terrain and drainage networks.
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Risk Rank */}
        {activeTab === 'risk' && (
          <div className="flex-1 overflow-y-auto p-3.5 space-y-2">
            <div className="text-[11px] text-slate-400 pb-1">Click any corridor to fly 3D camera to its location:</div>
            {rankedEdges.map((e, idx) => {
              const pct = Math.round(e.risk * 100);
              const badgeClass =
                pct > 65
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                  : pct > 35
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40';

              return (
                <div
                  key={idx}
                  onClick={() => handleFocusRoad(e)}
                  className="flex items-center gap-2.5 p-2.5 bg-slate-800/70 hover:bg-slate-800 border border-slate-700/60 rounded-xl cursor-pointer transition hover:border-sky-400 hover:translate-x-1"
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center font-extrabold text-xs text-slate-900 ${
                    pct > 65 ? 'bg-rose-500' : pct > 35 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}>
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-xs text-slate-200 truncate">{e.n}</div>
                    <div className="text-[10px] text-slate-400">
                      Elev: {(e.elev * 100).toFixed(0)}% · Drain Cap: {(e.d * 100).toFixed(0)}%
                    </div>
                  </div>
                  <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeClass}`}>{pct}%</div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 3: AI Insights */}
        {activeTab === 'ai' && (
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3 text-xs">
            <div className="bg-slate-800/70 border border-slate-700/60 rounded-xl p-3">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-sky-400 mb-2">
                🤖 AI Situation Assessment
              </h3>
              <p className="text-slate-300 leading-relaxed">
                Rainfall intensity is classified as{' '}
                <strong>{rainfall < 40 ? 'LIGHT' : rainfall < 110 ? 'MODERATE' : rainfall < 190 ? 'HEAVY' : 'EXTREME'}</strong>{' '}
                ({rainfall} mm/24h). The hydrodynamic physics engine predicts{' '}
                <strong className={stats.highRiskCount > 0 ? 'text-rose-400' : 'text-emerald-400'}>
                  {stats.highRiskCount} road segment(s)
                </strong>{' '}
                exceeding 65% disruption probability.
              </p>
              {rankedEdges[0] && rankedEdges[0].risk > 0.35 && (
                <div className="mt-2 text-slate-400 text-[11px]">
                  Highest vulnerability: <strong className="text-white">{rankedEdges[0].n}</strong> (
                  {Math.round(rankedEdges[0].risk * 100)}% risk) due to low-lying catchment bowl geometry.
                </div>
              )}
            </div>

            <div className="bg-slate-800/70 border border-slate-700/60 rounded-xl p-3 space-y-1.5">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-sky-400 mb-1">Recommended Actions</h3>
              <ul className="list-disc pl-4 space-y-1 text-slate-300 text-[11px]">
                {rainfall < 40 ? (
                  <>
                    <li>Maintain standard routine drainage monitoring.</li>
                    <li>Pre-position high-capacity pumps near Velachery Lake basin.</li>
                    <li>Verify storm-water drain intakes on OMR IT corridor are free of debris.</li>
                  </>
                ) : rainfall < 110 ? (
                  <>
                    <li>Advise commuters to divert towards <strong>Anna Salai / Inner Ring Road</strong> elevated spans.</li>
                    <li>Deploy traffic marshals at Velachery Main Road & Saidapet underpasses.</li>
                    <li>Issue yellow precipitation caution advisories to logistics fleets.</li>
                  </>
                ) : (
                  <>
                    <li><strong>Close</strong> road corridors exceeding 80% risk; mandate elevated diversions.</li>
                    <li>Activate SDRF rescue pumping units at Velachery & Tambaram corridors.</li>
                    <li>Broadcast cell-broadcast emergency alerts to low-lying riverbank zones.</li>
                  </>
                )}
              </ul>
            </div>

            {/* Tactical AI Grounding Input */}
            <div className="bg-slate-800/70 border border-slate-700/60 rounded-xl p-3 space-y-2">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-sky-400 flex items-center justify-between">
                <span>Ask Tactical AI Commander</span>
                <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              </h3>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  placeholder="e.g. Is Saidapet bridge safe right now?"
                  value={aiCustomQuestion}
                  onChange={(e) => setAiCustomQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAskAI()}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-sky-400"
                />
                <button
                  onClick={handleAskAI}
                  disabled={isAiLoading}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition cursor-pointer disabled:opacity-50"
                >
                  {isAiLoading ? '...' : 'Ask'}
                </button>
              </div>
              {aiCustomResponse && (
                <div className="bg-slate-950/80 p-2.5 rounded-lg text-[11px] text-slate-300 leading-relaxed border border-slate-800 max-h-40 overflow-y-auto">
                  {aiCustomResponse}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Alerts */}
        {activeTab === 'alerts' && (
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3 text-xs">
            <button
              onClick={handleBroadcastAll}
              className="w-full bg-linear-to-r from-rose-600 to-amber-600 hover:brightness-110 text-white font-bold py-2.5 px-3 rounded-xl text-xs transition cursor-pointer shadow-lg flex items-center justify-center gap-2"
            >
              <Radio className="w-4 h-4" />
              <span>Broadcast Alerts for High-Risk Corridors</span>
            </button>

            <div className="bg-slate-800/70 border border-slate-700/60 rounded-xl p-3">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-sky-400 mb-2">Individual Road Alerts</h3>
              <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                {rankedEdges.filter((e) => e.risk > 0.5).map((e, idx) => {
                  const pct = Math.round(e.risk * 100);
                  return (
                    <div key={idx} className="flex items-center justify-between p-1.5 bg-slate-900/60 rounded-lg">
                      <span className="text-[11px] font-medium text-slate-200">
                        {e.n} <strong className="text-rose-400">({pct}%)</strong>
                      </span>
                      <button
                        onClick={() => handleBroadcastAlert(e.n, pct)}
                        className="bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded transition cursor-pointer"
                      >
                        Push Alert
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-slate-800/70 border border-slate-700/60 rounded-xl p-3">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-sky-400 mb-2">Live Alert Broadcast Log</h3>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 font-mono text-[10px]">
                {alertLogs.map((log) => (
                  <div
                    key={log.id}
                    className={`p-2 rounded-lg bg-slate-900/80 border-l-3 ${
                      log.isOk ? 'border-emerald-500 text-slate-300' : 'border-rose-500 text-slate-200'
                    }`}
                  >
                    <span className="text-slate-500 font-bold">[{log.time}]</span> {log.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Floating Right Rainfall Simulator Card */}
      <div className="fixed top-20 right-3.5 z-25 w-68 bg-slate-900/95 border border-slate-700/60 rounded-2xl shadow-2xl p-3.5 text-slate-200 backdrop-blur-xl space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
            <CloudRain className="w-3.5 h-3.5 text-sky-400" />
            <span>Rainfall Simulator</span>
          </h3>
          <button
            onClick={handleFetchLiveWeather}
            disabled={isSyncingWeather}
            title="Sync with Live Open-Meteo Chennai Radar"
            className="text-[10px] bg-sky-950/80 hover:bg-sky-900 border border-sky-700/60 text-sky-300 px-2 py-0.5 rounded-lg flex items-center gap-1 transition cursor-pointer"
          >
            <RefreshCw className={`w-2.5 h-2.5 ${isSyncingWeather ? 'animate-spin' : ''}`} />
            <span>Live Weather</span>
          </button>
        </div>

        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl font-black text-white">{rainfall}</span>
          <span className="text-xs text-slate-400 font-medium">mm / 24h</span>
        </div>

        <input
          type="range"
          min="0"
          max="250"
          value={rainfall}
          onChange={(e) => handleRainSliderChange(+e.target.value)}
          className="w-full accent-sky-400 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
        />

        {/* Preset Buttons */}
        <div className="grid grid-cols-4 gap-1 pt-1">
          <button
            onClick={() => handleRainSliderChange(15)}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg py-1 text-[10px] font-semibold text-slate-300 transition cursor-pointer"
          >
            Light
          </button>
          <button
            onClick={() => handleRainSliderChange(80)}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg py-1 text-[10px] font-semibold text-slate-300 transition cursor-pointer"
          >
            Mod
          </button>
          <button
            onClick={() => handleRainSliderChange(160)}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg py-1 text-[10px] font-semibold text-slate-300 transition cursor-pointer"
          >
            Heavy
          </button>
          <button
            onClick={() => handleRainSliderChange(235)}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg py-1 text-[10px] font-semibold text-rose-400 transition cursor-pointer"
          >
            Extreme
          </button>
        </div>
      </div>

      {/* Floating Bottom-Right Legend */}
      <div className="fixed bottom-3.5 right-3.5 z-25 bg-slate-900/90 border border-slate-700/60 rounded-xl px-3 py-2 text-slate-300 text-[11px] backdrop-blur-md hidden sm:block shadow-lg space-y-1">
        <div className="font-bold text-white text-xs pb-0.5">3D Risk Legend</div>
        <div className="flex items-center gap-2">
          <span className="w-5 h-1.5 rounded-full bg-emerald-500"></span>
          <span>Low Risk — Passable</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-5 h-1.5 rounded-full bg-amber-500"></span>
          <span>Medium — Caution</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
          <span>High — Likely Flooded</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-5 h-1.5 rounded-full bg-blue-500"></span>
          <span>Fastest Route</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-5 h-1.5 rounded-full bg-emerald-400"></span>
          <span>Safe (Diverted) Route</span>
        </div>
      </div>

      {/* Floating 3D Navigation Hint */}
      <div className="fixed bottom-3.5 left-96 z-25 text-slate-400 text-[11px] bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-full backdrop-blur-md hidden md:block">
        Left-drag: Orbit · Scroll: Zoom · Right-drag: Pan · Click corridor to fly
      </div>
    </div>
  );
};
