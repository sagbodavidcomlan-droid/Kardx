import React, { useState, useMemo } from 'react';
import { Lead, Profile } from '../../types';
import { 
  getCityGeoData, 
  MAP_VIEWS, 
  projectCoordinates, 
  MapProjectionView,
  CityGeoData 
} from '../../utils/geoData';
import { 
  MapPin, 
  Globe, 
  Compass, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Wifi, 
  QrCode, 
  Mail, 
  Users, 
  ExternalLink, 
  Filter, 
  Download, 
  X, 
  Building, 
  Phone, 
  MessageSquare,
  Sparkles,
  Layers,
  Flame,
  CheckCircle2,
  Calendar
} from 'lucide-react';

interface GeographicDistributionMapProps {
  leads: Lead[];
  profiles: Profile[];
  selectedProfileId: string;
  onSelectLead?: (lead: Lead) => void;
}

interface CityCluster {
  geo: CityGeoData;
  leads: Lead[];
  leadCount: number;
  nfcCount: number;
  qrCount: number;
  emailCount: number;
  directCount: number;
  latestLeadDate: string;
  primarySource: string;
}

export const GeographicDistributionMap: React.FC<GeographicDistributionMapProps> = ({
  leads,
  profiles,
  selectedProfileId,
  onSelectLead,
}) => {
  const [activeViewId, setActiveViewId] = useState<'world' | 'europe' | 'africa'>('world');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedCityKey, setSelectedCityKey] = useState<string | null>(null);
  const [hoveredCityKey, setHoveredCityKey] = useState<string | null>(null);
  const [showArcs, setShowArcs] = useState(true);
  const [customZoom, setCustomZoom] = useState(1);

  // Filter leads based on selected profile, source, status
  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      if (selectedProfileId !== 'all' && l.profileId !== selectedProfileId) {
        return false;
      }
      if (sourceFilter !== 'all' && l.source !== sourceFilter) {
        return false;
      }
      if (statusFilter !== 'all' && l.status !== statusFilter) {
        return false;
      }
      return true;
    });
  }, [leads, selectedProfileId, sourceFilter, statusFilter]);

  // Aggregate leads by city
  const cityClusters = useMemo(() => {
    const map = new Map<string, CityCluster>();

    filteredLeads.forEach((lead) => {
      const geo = getCityGeoData(lead.city, lead.country);
      const key = `${geo.city.toLowerCase()}_${geo.countryCode.toLowerCase()}`;

      if (!map.has(key)) {
        map.set(key, {
          geo,
          leads: [lead],
          leadCount: 1,
          nfcCount: lead.source === 'nfc' ? 1 : 0,
          qrCount: lead.source === 'qr' ? 1 : 0,
          emailCount: lead.source === 'email_signature' ? 1 : 0,
          directCount: (lead.source === 'direct_url' || lead.source === 'apple_wallet' || lead.source === 'google_wallet') ? 1 : 0,
          latestLeadDate: lead.createdAt,
          primarySource: lead.source,
        });
      } else {
        const cluster = map.get(key)!;
        cluster.leads.push(lead);
        cluster.leadCount += 1;
        if (lead.source === 'nfc') cluster.nfcCount += 1;
        if (lead.source === 'qr') cluster.qrCount += 1;
        if (lead.source === 'email_signature') cluster.emailCount += 1;
        if (lead.source === 'direct_url') cluster.directCount += 1;
        if (new Date(lead.createdAt) > new Date(cluster.latestLeadDate)) {
          cluster.latestLeadDate = lead.createdAt;
        }

        // Determine dominant source
        const max = Math.max(cluster.nfcCount, cluster.qrCount, cluster.emailCount, cluster.directCount);
        if (cluster.nfcCount === max) cluster.primarySource = 'nfc';
        else if (cluster.qrCount === max) cluster.primarySource = 'qr';
        else if (cluster.emailCount === max) cluster.primarySource = 'email_signature';
        else cluster.primarySource = 'direct_url';
      }
    });

    return Array.from(map.entries())
      .map(([key, cluster]) => ({ key, ...cluster }))
      .sort((a, b) => b.leadCount - a.leadCount);
  }, [filteredLeads]);

  // Country breakdown
  const countryBreakdown = useMemo(() => {
    const map = new Map<string, { country: string; flag: string; count: number }>();
    cityClusters.forEach((c) => {
      const existing = map.get(c.geo.country) || { country: c.geo.country, flag: c.geo.flag, count: 0 };
      existing.count += c.leadCount;
      map.set(c.geo.country, existing);
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [cityClusters]);

  const activeView: MapProjectionView = MAP_VIEWS[activeViewId];
  const maxLeadsInCluster = Math.max(1, ...cityClusters.map((c) => c.leadCount));
  const selectedCluster = cityClusters.find((c) => c.key === selectedCityKey);

  // Headquarters (Paris) coordinates for connection arcs
  const hqGeo = getCityGeoData('Paris', 'France');
  const hqProj = projectCoordinates(hqGeo.lat, hqGeo.lng, activeView);

  const handleExportGeo = () => {
    const headers = ['Ville', 'Pays', 'Code Pays', 'Latitude', 'Longitude', 'Total Leads', 'NFC Scans', 'QR Scans', 'Email Signatures', 'Source Principale'];
    const rows = cityClusters.map((c) => [
      c.geo.city,
      c.geo.country,
      c.geo.countryCode,
      c.geo.lat.toFixed(4),
      c.geo.lng.toFixed(4),
      c.leadCount,
      c.nfcCount,
      c.qrCount,
      c.emailCount,
      c.primarySource,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.map((cell) => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kardx_distribution_geographique_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* TOP HEADER CONTROLS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-3xl bg-white border border-slate-200/80 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 tracking-tight">
                Distribution Géographique & Réseau d'Influence
              </h3>
              <p className="text-xs text-slate-500">
                Cartographie en temps réel des leads et points de contact capturés via vos cartes NFC et QR codes.
              </p>
            </div>
          </div>
        </div>

        {/* View Switcher Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200">
            {(['world', 'europe', 'africa'] as const).map((viewKey) => (
              <button
                key={viewKey}
                onClick={() => {
                  setActiveViewId(viewKey);
                  setSelectedCityKey(null);
                }}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeViewId === viewKey
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {MAP_VIEWS[viewKey].name}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportGeo}
            className="py-2 px-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
            title="Exporter les données géographiques en CSV"
          >
            <Download className="w-3.5 h-3.5 text-indigo-600" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* QUICK SUMMARY BADGES */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <p className="text-lg font-bold text-slate-800">{cityClusters.length}</p>
            <p className="text-[11px] text-slate-500 font-medium">Métropoles Actives</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <p className="text-lg font-bold text-slate-800">{countryBreakdown.length}</p>
            <p className="text-[11px] text-slate-500 font-medium">Pays Couverts</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Wifi className="w-5 h-5 rotate-90" />
          </div>
          <div>
            <p className="text-lg font-bold text-slate-800">
              {cityClusters.reduce((acc, c) => acc + c.nfcCount, 0)}
            </p>
            <p className="text-[11px] text-slate-500 font-medium">Captures NFC Physiques</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <p className="text-lg font-bold text-slate-800 truncate">
              {cityClusters[0]?.geo.city || 'Paris'} ({cityClusters[0]?.leadCount || 0})
            </p>
            <p className="text-[11px] text-slate-500 font-medium">Hub le plus actif</p>
          </div>
        </div>
      </div>

      {/* MAP & SIDEBAR CONTAINER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* INTERACTIVE MAP CONTAINER (8 cols) */}
        <div className="lg:col-span-8 rounded-3xl bg-slate-950 border border-slate-800 shadow-lg p-5 sm:p-6 relative overflow-hidden flex flex-col gap-4 text-white">
          
          {/* Map Subheader controls & Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3 z-10">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800/90 text-indigo-300 border border-indigo-500/30 backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                {filteredLeads.length} leads géolocalisés
              </span>

              <button
                type="button"
                onClick={() => setShowArcs(!showArcs)}
                className={`py-1 px-2.5 rounded-lg text-xs font-semibold border transition cursor-pointer flex items-center gap-1 ${
                  showArcs 
                    ? 'bg-indigo-900/60 text-indigo-200 border-indigo-500/40' 
                    : 'bg-slate-900/70 text-slate-400 border-slate-700'
                }`}
              >
                <Layers className="w-3 h-3" />
                <span>Flux de connexion</span>
              </button>
            </div>

            {/* Source Filter Selector */}
            <div className="flex items-center gap-2">
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="bg-slate-900/90 text-xs font-semibold text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1 focus:ring-1 focus:ring-indigo-400 cursor-pointer"
              >
                <option value="all">Toutes sources</option>
                <option value="nfc">Cartes NFC</option>
                <option value="qr">QR Codes</option>
                <option value="email_signature">Signature Email</option>
                <option value="direct_url">Lien Direct</option>
              </select>

              {/* Reset view / Zoom */}
              <button
                onClick={() => {
                  setCustomZoom(1);
                  setSelectedCityKey(null);
                }}
                className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700 transition cursor-pointer"
                title="Réinitialiser le centrage"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* MAP CANVAS (VECTOR SVG + DYNAMIC DOM HOTSPOTS) */}
          <div className="relative w-full aspect-16/10 sm:aspect-16/9 bg-slate-900/60 rounded-2xl border border-slate-800/80 overflow-hidden select-none">
            
            {/* Grid background lines */}
            <div 
              className="absolute inset-0 opacity-15 pointer-events-none"
              style={{
                backgroundImage: `radial-gradient(#6366f1 1px, transparent 1px), linear-gradient(to right, #334155 1px, transparent 1px), linear-gradient(to bottom, #334155 1px, transparent 1px)`,
                backgroundSize: '40px 40px, 40px 40px, 40px 40px',
              }}
            />

            {/* SVG MAP PROJECTION */}
            <svg 
              className="w-full h-full absolute inset-0 transition-transform duration-300"
              style={{ transform: `scale(${customZoom})` }}
              viewBox="0 0 1000 600" 
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#818cf8" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#c084fc" stopOpacity="0.2" />
                </linearGradient>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Continents simplified vector paths according to projection */}
              {activeViewId === 'world' && (
                <g fill="#1e293b" stroke="#334155" strokeWidth="1.2" opacity="0.85">
                  {/* Europe & North Eurasia */}
                  <path d="M 450,110 Q 520,90 600,100 Q 670,120 720,150 Q 680,210 590,200 Q 530,170 480,180 Z" />
                  {/* Western Europe & France */}
                  <path d="M 460,160 L 510,150 L 525,185 L 485,210 L 460,195 Z" fill="#2d3748" />
                  {/* Africa */}
                  <path d="M 470,230 Q 560,230 570,300 Q 550,420 500,470 Q 450,380 440,300 Q 430,260 470,230 Z" fill="#243248" />
                  {/* North America */}
                  <path d="M 120,110 Q 280,90 320,180 Q 290,270 200,290 Q 140,240 100,170 Z" />
                  {/* South America */}
                  <path d="M 230,300 Q 330,320 310,430 Q 280,520 230,510 Q 190,400 230,300 Z" />
                  {/* Asia & Middle East */}
                  <path d="M 570,170 Q 720,160 840,220 Q 860,340 760,380 Q 640,350 580,260 Z" />
                  {/* Australia & Oceania */}
                  <path d="M 760,400 Q 880,410 870,490 Q 780,510 750,450 Z" />
                </g>
              )}

              {activeViewId === 'europe' && (
                <g fill="#1e293b" stroke="#334155" strokeWidth="1.5">
                  {/* France & Surrounding Europe detailed silhouettes */}
                  <path d="M 300,150 Q 500,80 750,120 Q 820,300 700,480 Q 500,530 280,460 Q 200,320 300,150 Z" fill="#1e293b" />
                  {/* France boundary */}
                  <path d="M 400,220 L 530,210 L 580,290 L 560,390 L 460,420 L 380,330 Z" fill="#2d3748" stroke="#4f46e5" strokeWidth="1.5" />
                  {/* UK & Ireland */}
                  <path d="M 320,130 L 420,110 L 410,210 L 320,200 Z" fill="#243248" />
                  {/* Belgium & Netherlands */}
                  <path d="M 490,190 L 550,180 L 540,230 L 490,220 Z" fill="#312e81" />
                  {/* Switzerland */}
                  <path d="M 520,310 L 570,300 L 565,340 L 515,345 Z" fill="#312e81" />
                  {/* North Africa coastline */}
                  <path d="M 260,540 Q 550,510 850,530 L 850,600 L 260,600 Z" fill="#172033" />
                </g>
              )}

              {activeViewId === 'africa' && (
                <g fill="#1e293b" stroke="#334155" strokeWidth="1.5">
                  {/* West Africa & Central Africa zone */}
                  <path d="M 150,100 Q 400,60 700,90 Q 850,220 780,480 Q 600,560 380,540 Q 180,450 140,280 Z" fill="#1e293b" />
                  {/* Gulf of Guinea curve */}
                  <path d="M 240,280 Q 400,300 480,360 Q 550,450 540,540 L 350,520 Q 220,400 240,280 Z" fill="#283548" stroke="#4f46e5" strokeWidth="1.2" />
                  {/* Mediterranean / North Europe top */}
                  <path d="M 280,0 Q 500,40 700,10 L 700,60 L 280,60 Z" fill="#141c2e" />
                </g>
              )}

              {/* CONNECTION ARCS FROM PARIS HEADQUARTERS TO HUBS */}
              {showArcs && hqProj.inBounds && (
                <g className="transition-opacity duration-300">
                  {cityClusters.map((cluster) => {
                    const targetProj = projectCoordinates(cluster.geo.lat, cluster.geo.lng, activeView);
                    if (!targetProj.inBounds) return null;
                    if (cluster.geo.city.toLowerCase() === 'paris') return null;

                    const x1 = (hqProj.xPercent / 100) * 1000;
                    const y1 = (hqProj.yPercent / 100) * 600;
                    const x2 = (targetProj.xPercent / 100) * 1000;
                    const y2 = (targetProj.yPercent / 100) * 600;

                    // Curvature control point
                    const dx = x2 - x1;
                    const dy = y2 - y1;
                    const cx = (x1 + x2) / 2 - dy * 0.15;
                    const cy = (y1 + y2) / 2 + dx * 0.15;

                    return (
                      <g key={`arc_${cluster.key}`}>
                        <path
                          d={`M ${x1},${y1} Q ${cx},${cy} ${x2},${y2}`}
                          fill="none"
                          stroke="url(#arcGrad)"
                          strokeWidth="1.5"
                          strokeDasharray="4 4"
                          className="opacity-70"
                        />
                      </g>
                    );
                  })}
                </g>
              )}
            </svg>

            {/* DYNAMIC PINS / HOTSPOTS OVERLAY */}
            {cityClusters.map((cluster) => {
              const proj = projectCoordinates(cluster.geo.lat, cluster.geo.lng, activeView);
              if (!proj.inBounds) return null;

              const isSelected = selectedCityKey === cluster.key;
              const isHovered = hoveredCityKey === cluster.key;
              const isHq = cluster.geo.city.toLowerCase() === 'paris';

              return (
                <div
                  key={cluster.key}
                  style={{
                    left: `${proj.xPercent}%`,
                    top: `${proj.yPercent}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  className={`absolute z-20 transition-all duration-200 cursor-pointer group ${
                    isSelected ? 'z-40 scale-125' : isHovered ? 'z-30 scale-115' : 'scale-100'
                  }`}
                  onClick={() => setSelectedCityKey(isSelected ? null : cluster.key)}
                  onMouseEnter={() => setHoveredCityKey(cluster.key)}
                  onMouseLeave={() => setHoveredCityKey(null)}
                >
                  {/* Radar pulse effect on hot hubs */}
                  {cluster.leadCount >= 2 && (
                    <div className="absolute -inset-2 rounded-full bg-indigo-500/30 animate-ping pointer-events-none" />
                  )}

                  {/* Hotspot Pin Icon & Badge */}
                  <div className={`relative flex items-center justify-center p-1.5 rounded-full border-2 shadow-md transition ${
                    isSelected 
                      ? 'bg-amber-400 border-white text-slate-950 ring-4 ring-amber-400/40' 
                      : isHq
                      ? 'bg-indigo-600 border-indigo-300 text-white'
                      : 'bg-indigo-900 border-indigo-400 text-white hover:bg-indigo-600'
                  }`}>
                    {cluster.primarySource === 'nfc' ? (
                      <Wifi className="w-3.5 h-3.5 rotate-90" />
                    ) : cluster.primarySource === 'qr' ? (
                      <QrCode className="w-3.5 h-3.5" />
                    ) : (
                      <MapPin className="w-3.5 h-3.5" />
                    )}

                    {/* Count Pill */}
                    <span className="absolute -top-2 -right-2 px-1.5 py-0.2 rounded-full bg-rose-500 border border-white text-[9px] font-extrabold text-white shadow-xs">
                      {cluster.leadCount}
                    </span>
                  </div>

                  {/* Pin label */}
                  <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-900/90 border border-slate-700/80 px-2 py-0.5 rounded-md text-[10px] font-bold text-slate-200 backdrop-blur-sm pointer-events-none shadow-sm flex items-center gap-1">
                    <span>{cluster.geo.flag}</span>
                    <span>{cluster.geo.city}</span>
                  </div>

                  {/* TOOLTIP ON HOVER */}
                  {isHovered && !isSelected && (
                    <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-48 p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs shadow-2xl z-50 pointer-events-none flex flex-col gap-1.5 animate-in fade-in zoom-in-95">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                        <span className="font-bold text-indigo-300 flex items-center gap-1">
                          {cluster.geo.flag} {cluster.geo.city}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          {cluster.geo.country}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-300">
                        <strong className="text-white font-bold">{cluster.leadCount} lead{cluster.leadCount > 1 ? 's' : ''}</strong> capturé{cluster.leadCount > 1 ? 's' : ''}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                        <Wifi className="w-3 h-3 text-indigo-400 rotate-90" />
                        <span>{cluster.nfcCount} NFC</span>
                        <span className="text-slate-600">•</span>
                        <QrCode className="w-3 h-3 text-purple-400" />
                        <span>{cluster.qrCount} QR</span>
                      </div>
                    </div>
                  )}

                </div>
              );
            })}

            {/* Map Legend */}
            <div className="absolute bottom-3 left-3 bg-slate-950/85 backdrop-blur-md border border-slate-800 px-3 py-2 rounded-xl text-[11px] text-slate-300 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 border border-indigo-300"></span>
                <span>Hub Principal</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                <span>Nombre de contacts</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 border-t border-dashed border-indigo-400"></span>
                <span>Flux KardX</span>
              </div>
            </div>

          </div>

          {/* Quick instructions bar */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
            <span>Cliquez sur un marqueur pour afficher la liste des leads capturés dans cette ville.</span>
            <div className="flex items-center gap-1">
              <Compass className="w-3 h-3 text-indigo-400" />
              <span>Système de géolocalisation RGPD conforme</span>
            </div>
          </div>

        </div>

        {/* TOP CITIES & COUNTRIES RANKING SIDEBAR (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          
          {/* TOP CITIES CARD */}
          <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-2xs flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                Villes & Pôles d'Activité
              </h4>
              <span className="text-[11px] text-slate-400 font-semibold">
                {cityClusters.length} pôles
              </span>
            </div>

            <div className="flex flex-col gap-2 max-h-[290px] overflow-y-auto pr-1">
              {cityClusters.map((cluster, index) => {
                const isSelected = selectedCityKey === cluster.key;
                const percentage = Math.round((cluster.leadCount / filteredLeads.length) * 100) || 0;

                return (
                  <button
                    key={cluster.key}
                    onClick={() => setSelectedCityKey(isSelected ? null : cluster.key)}
                    className={`w-full text-left p-3 rounded-2xl border transition cursor-pointer flex flex-col gap-1.5 ${
                      isSelected
                        ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-200'
                        : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200/70'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{cluster.geo.flag}</span>
                        <div>
                          <p className="font-bold text-xs text-slate-800">
                            {cluster.geo.city}
                          </p>
                          <p className="text-[10px] text-slate-500 font-medium">
                            {cluster.geo.country}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-extrabold text-xs text-indigo-600">
                          {cluster.leadCount} lead{cluster.leadCount > 1 ? 's' : ''}
                        </span>
                        <p className="text-[10px] text-slate-400">{percentage}%</p>
                      </div>
                    </div>

                    {/* Mini progress bar */}
                    <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                      <div 
                        className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                        style={{ width: `${(cluster.leadCount / maxLeadsInCluster) * 100}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* REPARTITION PAR PAYS */}
          <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-2xs flex flex-col gap-3">
            <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-emerald-600" />
              Répartition par Pays
            </h4>

            <div className="flex flex-col gap-2">
              {countryBreakdown.map((item) => {
                const pct = Math.round((item.count / filteredLeads.length) * 100) || 0;
                return (
                  <div key={item.country} className="flex items-center justify-between text-xs py-1 border-b border-slate-100 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{item.flag}</span>
                      <span className="font-semibold text-slate-700">{item.country}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800">{item.count} leads</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                        {pct}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

      {/* SELECTED CITY LEADS FLYOUT / EXPANDED SECTION */}
      {selectedCluster && (
        <div className="p-6 rounded-3xl bg-indigo-50/50 border border-indigo-200/80 shadow-sm flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-indigo-200/60">
            <div className="flex items-center gap-3">
              <span className="text-2xl p-2 rounded-2xl bg-white shadow-2xs">{selectedCluster.geo.flag}</span>
              <div>
                <h4 className="text-base font-bold text-slate-800">
                  Leads capturés à {selectedCluster.geo.city}, {selectedCluster.geo.country}
                </h4>
                <p className="text-xs text-slate-600">
                  {selectedCluster.leadCount} contact{selectedCluster.leadCount > 1 ? 's' : ''} enregistré{selectedCluster.leadCount > 1 ? 's' : ''} dans cette zone géographique.
                </p>
              </div>
            </div>

            <button
              onClick={() => setSelectedCityKey(null)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-indigo-100/60 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cards grid of leads in this city */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {selectedCluster.leads.map((lead) => {
              const statusLabels: Record<string, { label: string; bg: string }> = {
                new: { label: 'Nouveau', bg: 'bg-blue-100 text-blue-800' },
                contacted: { label: 'Contacté', bg: 'bg-amber-100 text-amber-800' },
                qualified: { label: 'Qualifié', bg: 'bg-indigo-100 text-indigo-800' },
                proposal: { label: 'Proposition', bg: 'bg-purple-100 text-purple-800' },
                won: { label: 'Gagné', bg: 'bg-emerald-100 text-emerald-800' },
                lost: { label: 'Perdu', bg: 'bg-rose-100 text-rose-800' },
              };
              const st = statusLabels[lead.status] || statusLabels.new;

              return (
                <div 
                  key={lead.id}
                  className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:shadow-md transition flex flex-col justify-between gap-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h5 className="font-bold text-xs text-slate-800">
                        {lead.firstName} {lead.lastName}
                      </h5>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {lead.jobTitle ? `${lead.jobTitle} • ` : ''}{lead.company || 'Indépendant'}
                      </p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${st.bg}`}>
                      {st.label}
                    </span>
                  </div>

                  {lead.notes && (
                    <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100 line-clamp-2">
                      {lead.notes}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(lead.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                    </span>

                    <div className="flex items-center gap-2">
                      {lead.phone && (
                        <a
                          href={`tel:${lead.phone}`}
                          className="p-1 rounded-lg bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 transition"
                          title="Appeler"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {lead.email && (
                        <a
                          href={`mailto:${lead.email}`}
                          className="p-1 rounded-lg bg-slate-100 hover:bg-purple-50 text-slate-600 hover:text-purple-600 transition"
                          title="Envoyer un email"
                        >
                          <Mail className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};
