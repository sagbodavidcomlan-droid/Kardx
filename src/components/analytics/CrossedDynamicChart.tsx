import React, { useState, useMemo, useRef } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Eye, 
  Wifi, 
  QrCode, 
  Users, 
  Zap, 
  Calendar, 
  Layers, 
  BarChart2, 
  Sliders, 
  Info, 
  Maximize2, 
  Sparkles,
  Check
} from 'lucide-react';

export type ChartTimeframe = '7j' | '14j' | '30j' | '90j' | '12m';
export type ChartRenderMode = 'spline' | 'bars' | 'crossed_dual' | 'area';

export interface DataPoint {
  date: string;
  label: string;
  views: number;
  nfcScans: number;
  qrScans: number;
  totalScans: number;
  leads: number;
  conversionRate: number; // in %
  previousPeriodLeads?: number;
}

interface CrossedDynamicChartProps {
  timeframe?: ChartTimeframe;
  onTimeframeChange?: (tf: ChartTimeframe) => void;
  title?: string;
  subtitle?: string;
  height?: number;
  showMetricSelectors?: boolean;
  baseViews?: number;
  baseScans?: number;
  baseLeads?: number;
}

export const CrossedDynamicChart: React.FC<CrossedDynamicChartProps> = ({
  timeframe: externalTimeframe,
  onTimeframeChange,
  title = "Courbes Croisées & Dynamique d'Acquisition",
  subtitle = "Analysez la corrélation en temps réel entre le trafic généré, les scans physiques et la conversion en prospects.",
  height = 320,
  showMetricSelectors = true,
  baseViews = 1240,
  baseScans = 680,
  baseLeads = 92
}) => {
  const [internalTimeframe, setInternalTimeframe] = useState<ChartTimeframe>('30j');
  const timeframe = externalTimeframe || internalTimeframe;

  const handleTimeframeChange = (tf: ChartTimeframe) => {
    if (onTimeframeChange) {
      onTimeframeChange(tf);
    } else {
      setInternalTimeframe(tf);
    }
  };

  const [renderMode, setRenderMode] = useState<ChartRenderMode>('crossed_dual');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Active series toggles
  const [activeSeries, setActiveSeries] = useState({
    views: true,
    nfc: true,
    qr: true,
    leads: true,
    conversion: true,
  });

  const toggleSerie = (key: keyof typeof activeSeries) => {
    setActiveSeries(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      // Keep at least one active
      const anyActive = Object.values(updated).some(v => v);
      return anyActive ? updated : prev;
    });
  };

  // Generate realistic, smoothly correlated time series data based on selected timeframe
  const data: DataPoint[] = useMemo(() => {
    const pointsCount = timeframe === '7j' ? 7 :
                        timeframe === '14j' ? 14 :
                        timeframe === '30j' ? 30 :
                        timeframe === '90j' ? 12 : 12; // 12 weeks or 12 months

    const now = new Date();
    const result: DataPoint[] = [];

    const leadFactor = baseLeads / 30;
    const viewFactor = baseViews / 30;
    const scanFactor = baseScans / 30;

    for (let i = pointsCount - 1; i >= 0; i--) {
      const d = new Date(now);
      let dateLabel = '';
      let fullDate = '';

      if (timeframe === '7j' || timeframe === '14j' || timeframe === '30j') {
        d.setDate(d.getDate() - i);
        const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
        const dayOfWeek = dayNames[d.getDay()];
        const dayOfMonth = d.getDate().toString().padStart(2, '0');
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        
        dateLabel = timeframe === '7j' ? `${dayOfWeek} ${dayOfMonth}` : `${dayOfMonth}/${month}`;
        fullDate = `${dayOfWeek} ${dayOfMonth}/${month}/${d.getFullYear()}`;
      } else if (timeframe === '90j') {
        d.setDate(d.getDate() - i * 7);
        dateLabel = `S${Math.ceil((d.getDate() + d.getMonth() * 30) / 7)}`;
        fullDate = `Semaine du ${d.getDate()}/${d.getMonth() + 1}`;
      } else {
        d.setMonth(d.getMonth() - i);
        const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
        dateLabel = monthNames[d.getMonth()];
        fullDate = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      }

      // Sine wave seasonal oscillation + gentle upward trend + slight weekend dip
      const progress = (pointsCount - i) / pointsCount;
      const trendMultiplier = 0.75 + progress * 0.55;
      const dayIndex = d.getDay();
      const isWeekend = dayIndex === 0 || dayIndex === 6;
      const weekendDampener = isWeekend ? 0.6 : 1.15;
      const wave = Math.sin((pointsCount - i) * 0.45) * 0.25;

      const randomNoise = 0.85 + (Math.sin((i + 3) * 1.7) * 0.2 + 0.2);

      const rawViews = Math.max(8, Math.round(viewFactor * (1 + wave) * trendMultiplier * weekendDampener * randomNoise));
      const rawNfc = Math.max(3, Math.round(scanFactor * 0.6 * (1 + wave) * trendMultiplier * weekendDampener * randomNoise));
      const rawQr = Math.max(2, Math.round(scanFactor * 0.4 * (1 + wave) * trendMultiplier * weekendDampener * (randomNoise * 0.95)));
      const rawTotalScans = rawNfc + rawQr;
      
      const rawLeads = Math.max(1, Math.round(leadFactor * (1 + wave * 0.8) * trendMultiplier * weekendDampener * (randomNoise * 1.05)));
      const prevLeads = Math.max(0, Math.round(rawLeads * 0.82 - (Math.cos(i) * 0.4)));

      const convRate = rawViews > 0 
        ? Math.min(35, Math.max(4.5, Math.round((rawLeads / rawViews) * 1000) / 10))
        : 0;

      result.push({
        date: fullDate,
        label: dateLabel,
        views: rawViews,
        nfcScans: rawNfc,
        qrScans: rawQr,
        totalScans: rawTotalScans,
        leads: rawLeads,
        conversionRate: convRate,
        previousPeriodLeads: prevLeads,
      });
    }

    return result;
  }, [timeframe, baseViews, baseScans, baseLeads]);

  // SVG Dimension and Coordinates Calculation
  const svgWidth = 800;
  const svgHeight = height;
  const padding = { top: 30, right: 55, bottom: 40, left: 55 };
  const plotWidth = svgWidth - padding.left - padding.right;
  const plotHeight = svgHeight - padding.top - padding.bottom;

  // Find max values for Left Y-Axis (Volume) and Right Y-Axis (Conversion %)
  const maxVolume = useMemo(() => {
    let max = 10;
    data.forEach(d => {
      if (activeSeries.views && d.views > max) max = d.views;
      if (activeSeries.nfc && d.nfcScans > max) max = d.nfcScans;
      if (activeSeries.qr && d.qrScans > max) max = d.qrScans;
      if (activeSeries.leads && d.leads > max) max = d.leads;
    });
    // Add 15% headroom for clean aesthetic
    return Math.ceil(max * 1.15);
  }, [data, activeSeries]);

  const maxConversion = useMemo(() => {
    let max = 15;
    data.forEach(d => {
      if (d.conversionRate > max) max = d.conversionRate;
    });
    return Math.ceil(max * 1.25);
  }, [data]);

  // Coordinates mapping functions
  const getX = (index: number) => {
    if (data.length <= 1) return padding.left;
    return padding.left + (index / (data.length - 1)) * plotWidth;
  };

  const getYVolume = (val: number) => {
    return padding.top + plotHeight - (val / maxVolume) * plotHeight;
  };

  const getYConversion = (val: number) => {
    return padding.top + plotHeight - (val / maxConversion) * plotHeight;
  };

  // Helper for generating cubic Bezier smooth SVG curve
  const createSmoothPath = (points: { x: number; y: number }[]) => {
    if (points.length === 0) return '';
    if (points.length === 1) return `M ${points[0].x},${points[0].y}`;

    let path = `M ${points[0].x},${points[0].y}`;

    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i === 0 ? 0 : i - 1];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2 < points.length ? i + 2 : i + 1];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
    }

    return path;
  };

  // Prepare point arrays for each series
  const viewsPoints = useMemo(() => data.map((d, i) => ({ x: getX(i), y: getYVolume(d.views) })), [data, maxVolume]);
  const nfcPoints = useMemo(() => data.map((d, i) => ({ x: getX(i), y: getYVolume(d.nfcScans) })), [data, maxVolume]);
  const qrPoints = useMemo(() => data.map((d, i) => ({ x: getX(i), y: getYVolume(d.qrScans) })), [data, maxVolume]);
  const leadsPoints = useMemo(() => data.map((d, i) => ({ x: getX(i), y: getYVolume(d.leads) })), [data, maxVolume]);
  const convPoints = useMemo(() => data.map((d, i) => ({ x: getX(i), y: getYConversion(d.conversionRate) })), [data, maxConversion]);
  const prevLeadsPoints = useMemo(() => data.map((d, i) => ({ x: getX(i), y: getYVolume(d.previousPeriodLeads || 0) })), [data, maxVolume]);

  // SVG Paths
  const viewsPath = createSmoothPath(viewsPoints);
  const nfcPath = createSmoothPath(nfcPoints);
  const qrPath = createSmoothPath(qrPoints);
  const leadsPath = createSmoothPath(leadsPoints);
  const convPath = createSmoothPath(convPoints);
  const prevLeadsPath = createSmoothPath(prevLeadsPoints);

  // Closed Area for Leads (highlighted gradient)
  const leadsAreaPath = useMemo(() => {
    if (leadsPoints.length === 0) return '';
    const bottomY = padding.top + plotHeight;
    return `${leadsPath} L ${leadsPoints[leadsPoints.length - 1].x},${bottomY} L ${leadsPoints[0].x},${bottomY} Z`;
  }, [leadsPath, leadsPoints, plotHeight, padding.top]);

  const viewsAreaPath = useMemo(() => {
    if (viewsPoints.length === 0) return '';
    const bottomY = padding.top + plotHeight;
    return `${viewsPath} L ${viewsPoints[viewsPoints.length - 1].x},${bottomY} L ${viewsPoints[0].x},${bottomY} Z`;
  }, [viewsPath, viewsPoints, plotHeight, padding.top]);

  // Summary totals for the timeframe
  const totals = useMemo(() => {
    const totalV = data.reduce((acc, d) => acc + d.views, 0);
    const totalN = data.reduce((acc, d) => acc + d.nfcScans, 0);
    const totalQ = data.reduce((acc, d) => acc + d.qrScans, 0);
    const totalL = data.reduce((acc, d) => acc + d.leads, 0);
    const totalPrevL = data.reduce((acc, d) => acc + (d.previousPeriodLeads || 0), 0);
    const avgConv = totalV > 0 ? Math.round((totalL / totalV) * 1000) / 10 : 0;
    const leadsGrowth = totalPrevL > 0 ? Math.round(((totalL - totalPrevL) / totalPrevL) * 100) : 18;

    return { totalV, totalN, totalQ, totalL, avgConv, leadsGrowth };
  }, [data]);

  // Active hover point
  const currentHover = hoveredIndex !== null && data[hoveredIndex] ? data[hoveredIndex] : null;

  return (
    <div className="w-full bg-white rounded-3xl border border-slate-200 shadow-xs p-5 sm:p-7 flex flex-col gap-6 select-none transition-all">
      
      {/* 1. TOP HEADER: TITLE, SUMMARY PILLS & TIMEFRAME TOGGLE */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200/80 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-600" />
              <span>Multi-Courbes Dynamiques</span>
            </span>
            <span className="text-xs font-semibold text-slate-500">
              Double axe : Volume (gauche) & Taux % (droite)
            </span>
          </div>

          <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight mt-1">
            {title}
          </h3>
          <p className="text-xs text-slate-500 max-w-2xl mt-0.5">
            {subtitle}
          </p>
        </div>

        {/* Controls: Render Mode & Timeframe Switcher */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Render Mode Switcher */}
          <div className="flex items-center p-1 bg-slate-100/90 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setRenderMode('crossed_dual')}
              className={`py-1.5 px-2.5 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1 ${
                renderMode === 'crossed_dual' ? 'bg-indigo-600 text-white font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Courbes croisées avec axes normalisés"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Croisé</span>
            </button>

            <button
              onClick={() => setRenderMode('spline')}
              className={`py-1.5 px-2.5 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1 ${
                renderMode === 'spline' ? 'bg-indigo-600 text-white font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Lignes fluides continues"
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Lissé</span>
            </button>

            <button
              onClick={() => setRenderMode('bars')}
              className={`py-1.5 px-2.5 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1 ${
                renderMode === 'bars' ? 'bg-indigo-600 text-white font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Histogramme comparatif"
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Barres</span>
            </button>
          </div>

          {/* Timeframe Picker */}
          <div className="flex items-center p-1 bg-slate-100/90 rounded-xl border border-slate-200 text-xs font-semibold">
            {(['7j', '14j', '30j', '90j', '12m'] as ChartTimeframe[]).map((tf) => (
              <button
                key={tf}
                onClick={() => handleTimeframeChange(tf)}
                className={`py-1.5 px-2.5 rounded-lg transition cursor-pointer ${
                  timeframe === tf
                    ? 'bg-white text-indigo-700 font-extrabold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. INTERACTIVE SERIES TOGGLE CHIPS */}
      {showMetricSelectors && (
        <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1">
            <Sliders className="w-3 h-3" /> Séries actives :
          </span>

          {/* Views Series */}
          <button
            onClick={() => toggleSerie('views')}
            className={`py-1 px-2.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
              activeSeries.views
                ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-2xs'
                : 'bg-slate-50 text-slate-400 border-slate-200 line-through opacity-60'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-blue-200"></span>
            <span>Vues Totales ({totals.totalV})</span>
          </button>

          {/* NFC Scans Series */}
          <button
            onClick={() => toggleSerie('nfc')}
            className={`py-1 px-2.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
              activeSeries.nfc
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-2xs'
                : 'bg-slate-50 text-slate-400 border-slate-200 line-through opacity-60'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 ring-2 ring-indigo-200"></span>
            <span>Scans NFC ({totals.totalN})</span>
          </button>

          {/* QR Scans Series */}
          <button
            onClick={() => toggleSerie('qr')}
            className={`py-1 px-2.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
              activeSeries.qr
                ? 'bg-violet-50 text-violet-700 border-violet-200 shadow-2xs'
                : 'bg-slate-50 text-slate-400 border-slate-200 line-through opacity-60'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-violet-500 ring-2 ring-violet-200"></span>
            <span>QR Codes ({totals.totalQ})</span>
          </button>

          {/* Qualified Leads Series */}
          <button
            onClick={() => toggleSerie('leads')}
            className={`py-1 px-2.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
              activeSeries.leads
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-2xs ring-1 ring-emerald-400/30'
                : 'bg-slate-50 text-slate-400 border-slate-200 line-through opacity-60'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-200"></span>
            <span>🎯 Leads Qualifiés ({totals.totalL})</span>
            <span className="text-[10px] px-1 py-0.2 rounded bg-emerald-100 text-emerald-800 font-extrabold ml-0.5">
              +{totals.leadsGrowth}%
            </span>
          </button>

          {/* Conversion Rate Overlay */}
          <button
            onClick={() => toggleSerie('conversion')}
            className={`py-1 px-2.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
              activeSeries.conversion
                ? 'bg-amber-50 text-amber-800 border-amber-300 shadow-2xs'
                : 'bg-slate-50 text-slate-400 border-slate-200 line-through opacity-60'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-amber-200"></span>
            <span>⚡ Taux Conversion ({totals.avgConv}%)</span>
          </button>
        </div>
      )}

      {/* 3. MAIN INTERACTIVE SVG CHART CANVAS */}
      <div className="relative w-full overflow-hidden bg-slate-50/50 rounded-2xl border border-slate-100 p-2 sm:p-4">
        
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto overflow-visible select-none"
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <defs>
            {/* Gradient for Leads Area */}
            <linearGradient id="leadsAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>

            {/* Gradient for Views Area */}
            <linearGradient id="viewsAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
            </linearGradient>

            {/* Gradient for Conversion Curve */}
            <linearGradient id="convGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>

            <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.25" />
            </filter>
          </defs>

          {/* Horizontal Gridlines & Left Y-Axis labels (Volumes) */}
          {[0, 0.25, 0.5, 0.75, 1.0].map((ratio, idx) => {
            const y = padding.top + plotHeight * (1 - ratio);
            const val = Math.round(maxVolume * ratio);
            const convVal = (maxConversion * ratio).toFixed(1);

            return (
              <g key={idx} className="text-slate-300">
                <line
                  x1={padding.left}
                  y1={y}
                  x2={svgWidth - padding.right}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeDasharray={ratio === 0 ? 'none' : '4,4'}
                  strokeWidth="1"
                />
                
                {/* Left Y Axis Label (Volume) */}
                <text
                  x={padding.left - 10}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="10"
                  fontWeight="600"
                  fill="#94a3b8"
                >
                  {val}
                </text>

                {/* Right Y Axis Label (Conversion %) */}
                {activeSeries.conversion && (
                  <text
                    x={svgWidth - padding.right + 10}
                    y={y + 3}
                    textAnchor="start"
                    fontSize="10"
                    fontWeight="700"
                    fill="#d97706"
                  >
                    {convVal}%
                  </text>
                )}
              </g>
            );
          })}

          {/* X Axis Bottom Labels (Dates) */}
          {data.map((d, i) => {
            // Show fewer labels on narrow sets to avoid overlapping
            const step = data.length > 20 ? 4 : data.length > 10 ? 2 : 1;
            if (i % step !== 0 && i !== data.length - 1) return null;
            const x = getX(i);
            const y = padding.top + plotHeight + 20;

            return (
              <text
                key={i}
                x={x}
                y={y}
                textAnchor="middle"
                fontSize="10"
                fontWeight={i === data.length - 1 ? '700' : '500'}
                fill={i === data.length - 1 ? '#4338ca' : '#64748b'}
              >
                {d.label}
              </text>
            );
          })}

          {/* BAR RENDER MODE */}
          {renderMode === 'bars' && (
            <g className="bars-group">
              {data.map((d, i) => {
                const x = getX(i);
                const barWidth = Math.max(6, Math.min(22, plotWidth / data.length - 6));
                const startX = x - barWidth / 2;
                const bottomY = padding.top + plotHeight;
                const heightViews = (d.views / maxVolume) * plotHeight;
                const heightLeads = (d.leads / maxVolume) * plotHeight;

                return (
                  <g key={i}>
                    {/* Background Views Bar */}
                    {activeSeries.views && (
                      <rect
                        x={startX}
                        y={bottomY - heightViews}
                        width={barWidth}
                        height={heightViews}
                        rx="3"
                        fill="#93c5fd"
                        opacity={hoveredIndex === i ? 0.9 : 0.4}
                        className="transition-all"
                      />
                    )}

                    {/* Foreground Leads Bar */}
                    {activeSeries.leads && (
                      <rect
                        x={startX + 2}
                        y={bottomY - heightLeads}
                        width={Math.max(3, barWidth - 4)}
                        height={heightLeads}
                        rx="2"
                        fill="#10b981"
                        opacity={hoveredIndex === i ? 1 : 0.85}
                        className="transition-all"
                      />
                    )}
                  </g>
                );
              })}
            </g>
          )}

          {/* SPLINE & CROSSED CURVE PATHS */}
          {renderMode !== 'bars' && (
            <>
              {/* Views Area & Line */}
              {activeSeries.views && (
                <g>
                  <path d={viewsAreaPath} fill="url(#viewsAreaGradient)" />
                  <path
                    d={viewsPath}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="transition-all duration-300"
                  />
                </g>
              )}

              {/* QR Scans Line */}
              {activeSeries.qr && (
                <path
                  d={qrPath}
                  fill="none"
                  stroke="#8b5cf6"
                  strokeWidth="2"
                  strokeDasharray="4,3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* NFC Scans Line */}
              {activeSeries.nfc && (
                <path
                  d={nfcPath}
                  fill="none"
                  stroke="#4f46e5"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Qualified Leads Area & Solid Line */}
              {activeSeries.leads && (
                <g>
                  <path d={leadsAreaPath} fill="url(#leadsAreaGradient)" />
                  <path
                    d={leadsPath}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter="url(#glowEffect)"
                  />
                </g>
              )}

              {/* Conversion Rate Overlay (Dotted Gold Line) */}
              {activeSeries.conversion && (
                <path
                  d={convPath}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="3"
                  strokeDasharray="6,4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
            </>
          )}

          {/* INTERACTIVE HOVER TOUCH REGIONS & CROSSHAIR */}
          {data.map((d, i) => {
            const x = getX(i);
            const regionWidth = plotWidth / data.length;

            return (
              <rect
                key={i}
                x={x - regionWidth / 2}
                y={padding.top}
                width={regionWidth}
                height={plotHeight}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIndex(i)}
              />
            );
          })}

          {/* Hover Crosshair Vertical Line & Data Dot Markers */}
          {hoveredIndex !== null && currentHover && (
            <g>
              {/* Vertical Crosshair Guide */}
              <line
                x1={getX(hoveredIndex)}
                y1={padding.top}
                x2={getX(hoveredIndex)}
                y2={padding.top + plotHeight}
                stroke="#6366f1"
                strokeWidth="1.5"
                strokeDasharray="3,3"
              />

              {/* Highlight Dot on Views */}
              {activeSeries.views && (
                <circle
                  cx={getX(hoveredIndex)}
                  cy={getYVolume(currentHover.views)}
                  r="5"
                  fill="#3b82f6"
                  stroke="#ffffff"
                  strokeWidth="2.5"
                  className="animate-pulse"
                />
              )}

              {/* Highlight Dot on NFC */}
              {activeSeries.nfc && (
                <circle
                  cx={getX(hoveredIndex)}
                  cy={getYVolume(currentHover.nfcScans)}
                  r="5"
                  fill="#4f46e5"
                  stroke="#ffffff"
                  strokeWidth="2.5"
                />
              )}

              {/* Highlight Dot on Leads */}
              {activeSeries.leads && (
                <circle
                  cx={getX(hoveredIndex)}
                  cy={getYVolume(currentHover.leads)}
                  r="6.5"
                  fill="#10b981"
                  stroke="#ffffff"
                  strokeWidth="3"
                  filter="url(#glowEffect)"
                />
              )}

              {/* Highlight Dot on Conversion */}
              {activeSeries.conversion && (
                <circle
                  cx={getX(hoveredIndex)}
                  cy={getYConversion(currentHover.conversionRate)}
                  r="6"
                  fill="#f59e0b"
                  stroke="#ffffff"
                  strokeWidth="2.5"
                />
              )}
            </g>
          )}
        </svg>

        {/* 4. FLOATING GLASS TOOLTIP ON HOVER */}
        {hoveredIndex !== null && currentHover && (
          <div
            className="absolute z-30 pointer-events-none transition-all duration-150 transform -translate-x-1/2 -translate-y-full"
            style={{
              left: `${(getX(hoveredIndex) / svgWidth) * 100}%`,
              top: `${Math.min(padding.top + 70, Math.max(10, getYVolume(currentHover.leads) - 15))}px`,
            }}
          >
            <div className="p-3.5 rounded-2xl bg-slate-900/95 text-white backdrop-blur-md shadow-2xl border border-slate-700 min-w-[210px] space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                <span className="text-[11px] font-extrabold text-slate-300 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-indigo-400" />
                  {currentHover.date}
                </span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {currentHover.conversionRate}% conv.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-1 text-[11px]">
                    <span className="w-2 h-2 rounded-full bg-blue-400"></span> Vues :
                  </span>
                  <span className="font-extrabold text-white">{currentHover.views}</span>
                </div>

                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-1 text-[11px]">
                    <span className="w-2 h-2 rounded-full bg-indigo-400"></span> NFC :
                  </span>
                  <span className="font-extrabold text-white">{currentHover.nfcScans}</span>
                </div>

                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-1 text-[11px]">
                    <span className="w-2 h-2 rounded-full bg-violet-400"></span> QR :
                  </span>
                  <span className="font-extrabold text-white">{currentHover.qrScans}</span>
                </div>

                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-1 text-[11px]">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Leads :
                  </span>
                  <span className="font-black text-emerald-400">{currentHover.leads}</span>
                </div>
              </div>

              <div className="pt-1.5 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
                <span>Total scans : <strong>{currentHover.totalScans}</strong></span>
                <span className="text-amber-300 font-semibold">⚡ {currentHover.conversionRate}% transfo</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 5. DYNAMIC EXECUTIVE SUMMARY CALLOUTS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
        <div className="p-3 rounded-2xl bg-blue-50/60 border border-blue-100 flex flex-col">
          <span className="text-[11px] font-semibold text-blue-800 flex items-center gap-1">
            <Eye className="w-3.5 h-3.5 text-blue-600" /> Trafic Global
          </span>
          <span className="text-lg font-black text-blue-950 mt-0.5">{totals.totalV.toLocaleString('fr-FR')} vues</span>
          <span className="text-[10px] text-blue-700/80 mt-0.5">Visites de profils</span>
        </div>

        <div className="p-3 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex flex-col">
          <span className="text-[11px] font-semibold text-indigo-800 flex items-center gap-1">
            <Wifi className="w-3.5 h-3.5 text-indigo-600 rotate-90" /> Scans & Partages
          </span>
          <span className="text-lg font-black text-indigo-950 mt-0.5">{(totals.totalN + totals.totalQ).toLocaleString('fr-FR')} scans</span>
          <span className="text-[10px] text-indigo-700/80 mt-0.5">{totals.totalN} NFC • {totals.totalQ} QR</span>
        </div>

        <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex flex-col">
          <span className="text-[11px] font-semibold text-emerald-800 flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-emerald-600" /> Contacts Capturés
          </span>
          <span className="text-lg font-black text-emerald-950 mt-0.5">{totals.totalL.toLocaleString('fr-FR')} leads</span>
          <span className="text-[10px] text-emerald-700 font-bold mt-0.5">+{totals.leadsGrowth}% de vélocité</span>
        </div>

        <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-200 flex flex-col">
          <span className="text-[11px] font-semibold text-amber-800 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-amber-600" /> Taux de Transformation
          </span>
          <span className="text-lg font-black text-amber-950 mt-0.5">{totals.avgConv} %</span>
          <span className="text-[10px] text-amber-700/80 mt-0.5">Visiteurs ➔ Prospects</span>
        </div>
      </div>

    </div>
  );
};
