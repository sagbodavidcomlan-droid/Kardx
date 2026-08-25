import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Award, 
  Calendar, 
  Sparkles, 
  Eye, 
  Users, 
  ArrowUpRight, 
  Star, 
  Zap, 
  Flame, 
  Filter, 
  Sliders, 
  ChevronRight,
  Info
} from 'lucide-react';
import { ChartTimeframe } from './CrossedDynamicChart';

export interface DayPerformanceData {
  dateKey: string;
  dayLabel: string;
  dayOfWeek: string;
  fullDate: string;
  views: number;
  leads: number;
  conversionRate: number; // in %
  isTopVolumeDay?: boolean;
  isTopConversionDay?: boolean;
  isHighPerformer?: boolean;
  notes?: string;
}

interface ViewsVsConversionsBarChartProps {
  timeframe?: ChartTimeframe;
  onTimeframeChange?: (tf: ChartTimeframe) => void;
  baseViews?: number;
  baseLeads?: number;
  title?: string;
  subtitle?: string;
}

export const ViewsVsConversionsBarChart: React.FC<ViewsVsConversionsBarChartProps> = ({
  timeframe = '14j',
  onTimeframeChange,
  baseViews = 1240,
  baseLeads = 92,
  title = "Comparatif Croisé : Vues de Cartes vs Conversions de Prospects",
  subtitle = "Mise en parallèle côte à côte pour identifier instantanément vos journées de networking les plus rentables."
}) => {
  const [viewMode, setViewMode] = useState<'daily' | 'by_weekday'>('daily');
  const [selectedDay, setSelectedDay] = useState<DayPerformanceData | null>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [minConversionFilter, setMinConversionFilter] = useState<number>(0);

  // Generate day-by-day paired dataset
  const dailyData: DayPerformanceData[] = useMemo(() => {
    const daysCount = timeframe === '7j' ? 7 :
                      timeframe === '14j' ? 14 :
                      timeframe === '30j' ? 30 :
                      timeframe === '90j' ? 14 : 14;

    const now = new Date();
    const result: DayPerformanceData[] = [];
    const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    const fullDayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

    const avgDailyViews = baseViews / 30;
    const avgDailyLeads = baseLeads / 30;

    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);

      const dayIdx = d.getDay();
      const isWeekend = dayIdx === 0 || dayIdx === 6;
      const isPeakNetworkingDay = dayIdx === 2 || dayIdx === 4; // Tuesday or Thursday

      // Day specific multiplier
      const dayFactor = isPeakNetworkingDay ? 1.45 : isWeekend ? 0.45 : 1.05;
      const organicWave = Math.sin((daysCount - i) * 0.7) * 0.25;
      const noise = 0.88 + Math.abs(Math.sin((i + 5) * 1.3) * 0.24);

      const views = Math.max(12, Math.round(avgDailyViews * (1 + organicWave) * dayFactor * noise));
      
      // High networking days have better conversion ratio
      const baseConversionFactor = isPeakNetworkingDay ? 0.16 : isWeekend ? 0.06 : 0.10;
      const leads = Math.max(1, Math.round(views * baseConversionFactor * (noise * 1.1)));
      
      const convRate = views > 0 ? Math.round((leads / views) * 1000) / 10 : 0;

      const dayOfMonth = d.getDate().toString().padStart(2, '0');
      const month = (d.getMonth() + 1).toString().padStart(2, '0');

      result.push({
        dateKey: `${d.getFullYear()}-${month}-${dayOfMonth}`,
        dayLabel: `${dayNames[dayIdx]} ${dayOfMonth}`,
        dayOfWeek: fullDayNames[dayIdx],
        fullDate: `${fullDayNames[dayIdx]} ${dayOfMonth}/${month}/${d.getFullYear()}`,
        views,
        leads,
        conversionRate: convRate,
      });
    }

    // Determine Top Volume and Top Conversion days
    let maxViews = 0;
    let maxConv = 0;
    result.forEach(d => {
      if (d.views > maxViews) maxViews = d.views;
      if (d.conversionRate > maxConv) maxConv = d.conversionRate;
    });

    return result.map(d => {
      const isTopVolume = d.views === maxViews;
      const isTopConv = d.conversionRate === maxConv;
      const isHigh = d.conversionRate >= 14 || (d.views > 60 && d.leads >= 8);

      let notes = '';
      if (isTopConv) notes = 'Taux de transformation record';
      else if (isTopVolume) notes = 'Volume d\'échanges maximal';
      else if (isHigh) notes = 'Excellente session de networking';

      return {
        ...d,
        isTopVolumeDay: isTopVolume,
        isTopConversionDay: isTopConv,
        isHighPerformer: isHigh,
        notes,
      };
    });
  }, [timeframe, baseViews, baseLeads]);

  // Aggregate by Day-of-the-Week (Monday through Sunday)
  const weekdayAggregatedData: DayPerformanceData[] = useMemo(() => {
    const daysOrder = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
    const shortNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    
    return daysOrder.map((fullDay, idx) => {
      const matching = dailyData.filter(d => d.dayOfWeek === fullDay);
      const totalViews = matching.reduce((acc, d) => acc + d.views, 0) || (idx === 1 || idx === 3 ? 180 : idx >= 5 ? 45 : 120);
      const totalLeads = matching.reduce((acc, d) => acc + d.leads, 0) || (idx === 1 || idx === 3 ? 32 : idx >= 5 ? 4 : 14);
      const avgConv = totalViews > 0 ? Math.round((totalLeads / totalViews) * 1000) / 10 : 0;

      return {
        dateKey: `weekday_${idx}`,
        dayLabel: shortNames[idx],
        dayOfWeek: fullDay,
        fullDate: `Tous les ${fullDay}s de la période`,
        views: totalViews,
        leads: totalLeads,
        conversionRate: avgConv,
        isHighPerformer: idx === 1 || idx === 3, // Mardi ou Jeudi
        notes: idx === 3 ? 'Meilleur jour de closing B2B' : idx === 1 ? 'Pic d\'échanges & réunions' : undefined,
      };
    });
  }, [dailyData]);

  // Active dataset based on view mode
  const activeDataset = viewMode === 'daily' ? dailyData : weekdayAggregatedData;

  // Filtered dataset (by min conversion threshold)
  const displayData = useMemo(() => {
    return activeDataset.filter(d => d.conversionRate >= minConversionFilter);
  }, [activeDataset, minConversionFilter]);

  // Find max values for scaling
  const maxViewsVal = useMemo(() => Math.max(20, ...displayData.map(d => d.views)), [displayData]);
  const maxLeadsVal = useMemo(() => Math.max(5, ...displayData.map(d => d.leads)), [displayData]);

  // Global KPIs for this chart
  const summary = useMemo(() => {
    const totalV = activeDataset.reduce((acc, d) => acc + d.views, 0);
    const totalL = activeDataset.reduce((acc, d) => acc + d.leads, 0);
    const avgConv = totalV > 0 ? Math.round((totalL / totalV) * 1000) / 10 : 0;

    // Find best performing day
    let bestDay = activeDataset[0];
    activeDataset.forEach(d => {
      if (d.conversionRate > (bestDay?.conversionRate || 0)) {
        bestDay = d;
      }
    });

    const highPerformerCount = activeDataset.filter(d => d.isHighPerformer).length;

    return { totalV, totalL, avgConv, bestDay, highPerformerCount };
  }, [activeDataset]);

  // SVG dimensions
  const svgWidth = 840;
  const svgHeight = 280;
  const padding = { top: 35, right: 30, bottom: 45, left: 45 };
  const plotWidth = svgWidth - padding.left - padding.right;
  const plotHeight = svgHeight - padding.top - padding.bottom;

  // Compute bar positions
  const count = displayData.length;
  const groupWidth = count > 0 ? plotWidth / count : 1;
  const barWidth = Math.min(18, Math.max(6, groupWidth * 0.34));
  const barGap = 3;

  return (
    <div className="w-full bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-7 flex flex-col gap-6 select-none transition-all">
      
      {/* 1. HEADER WITH CONTROLS & TIMEFRAMES */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <Star className="w-3 h-3 text-emerald-600 fill-emerald-500" />
              <span>Analyse Croisée & Rentrabilité</span>
            </span>
            <span className="text-xs font-semibold text-slate-500">
              Barres doubles côte à côte (Vues 🔵 vs Leads 🟢)
            </span>
          </div>

          <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight mt-1">
            {title}
          </h3>
          <p className="text-xs text-slate-500 max-w-2xl mt-0.5">
            {subtitle}
          </p>
        </div>

        {/* View Mode Toggle & Timeframe Picker */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Daily vs Weekday Aggregation */}
          <div className="flex items-center p-1 bg-slate-100/90 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setViewMode('daily')}
              className={`py-1.5 px-2.5 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1 ${
                viewMode === 'daily' ? 'bg-indigo-600 text-white font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Jour par Jour</span>
            </button>

            <button
              onClick={() => setViewMode('by_weekday')}
              className={`py-1.5 px-2.5 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1 ${
                viewMode === 'by_weekday' ? 'bg-indigo-600 text-white font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-300" />
              <span>Par Jour Semaine</span>
            </button>
          </div>

          {/* Timeframe Switcher (only for daily) */}
          {viewMode === 'daily' && (
            <div className="flex items-center p-1 bg-slate-100/90 rounded-xl border border-slate-200 text-xs font-semibold">
              {(['7j', '14j', '30j'] as ChartTimeframe[]).map((tf) => (
                <button
                  key={tf}
                  onClick={() => onTimeframeChange && onTimeframeChange(tf)}
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
          )}
        </div>
      </div>

      {/* 2. EXECUTIVE HIGHLIGHT BANNER: BEST NETWORKING DAY */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center p-4 rounded-2xl bg-linear-to-r from-emerald-50/80 via-indigo-50/50 to-amber-50/60 border border-emerald-200/80">
        <div className="md:col-span-8 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-600/20 shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-emerald-950">
                🏆 Journée Championne : {summary.bestDay?.fullDate}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                {summary.bestDay?.conversionRate}% de conversion
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              <strong>{summary.bestDay?.leads} leads obtenus</strong> pour {summary.bestDay?.views} cartes scannées. Vos prospects ont été <strong>2.1x plus réceptifs</strong> qu'un jour moyen ({summary.avgConv}%).
            </p>
          </div>
        </div>

        <div className="md:col-span-4 flex items-center justify-end gap-3 text-right">
          <div className="p-2.5 rounded-xl bg-white/90 border border-slate-200/80 shadow-2xs">
            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Moyenne Période</span>
            <span className="text-base font-black text-slate-800">{summary.avgConv}% conv.</span>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-2xs">
            <span className="text-[10px] text-emerald-100 font-bold block uppercase tracking-wider">Jours Forts</span>
            <span className="text-base font-black text-white">{summary.highPerformerCount} jours clés</span>
          </div>
        </div>
      </div>

      {/* 3. INTERACTIVE PAIRED BAR CHART CANVAS */}
      <div className="relative w-full overflow-hidden bg-slate-50/50 rounded-2xl border border-slate-100 p-2 sm:p-4">
        
        {/* Legend */}
        <div className="flex items-center justify-between pb-3 px-2 border-b border-slate-100 flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-sm bg-blue-500 shadow-2xs"></span>
              <span className="font-bold text-slate-700">Vues de Cartes & Profils (Volume)</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-sm bg-emerald-500 shadow-2xs"></span>
              <span className="font-bold text-emerald-700">Leads & Contacts Gagnés (Closing)</span>
            </div>

            <div className="flex items-center gap-1.5 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 text-[11px] font-bold">
              <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
              <span>Journées Clés ({'>'}14% conv.)</span>
            </div>
          </div>

          <span className="text-[11px] text-slate-400 font-medium">
            Survolez ou cliquez sur une barre pour voir les détails
          </span>
        </div>

        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto overflow-visible select-none mt-2"
          onMouseLeave={() => setHoveredIdx(null)}
        >
          <defs>
            <linearGradient id="barGradViews" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#2563eb" />
            </linearGradient>

            <linearGradient id="barGradLeads" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>

            <linearGradient id="barGradHigh" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
          </defs>

          {/* Gridlines */}
          {[0, 0.25, 0.5, 0.75, 1.0].map((ratio, idx) => {
            const y = padding.top + plotHeight * (1 - ratio);
            const valViews = Math.round(maxViewsVal * ratio);

            return (
              <g key={idx}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={svgWidth - padding.right}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeDasharray={ratio === 0 ? 'none' : '3,3'}
                  strokeWidth="1"
                />
                <text
                  x={padding.left - 8}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="10"
                  fontWeight="600"
                  fill="#94a3b8"
                >
                  {valViews}
                </text>
              </g>
            );
          })}

          {/* PAIRED BARS GROUP */}
          {displayData.map((d, i) => {
            const groupCenterX = padding.left + (i + 0.5) * groupWidth;
            const bottomY = padding.top + plotHeight;

            // Heights normalized
            const heightViews = Math.max(4, (d.views / maxViewsVal) * plotHeight);
            
            // Leads scale relative to maxViews with visual boost so small lead counts are still clear and readable
            const heightLeads = Math.max(4, (d.leads / maxLeadsVal) * (plotHeight * 0.85));

            const isHovered = hoveredIdx === i;
            const isSelected = selectedDay?.dateKey === d.dateKey;

            const xViews = groupCenterX - barWidth - barGap / 2;
            const xLeads = groupCenterX + barGap / 2;

            return (
              <g 
                key={d.dateKey} 
                className="cursor-pointer transition-all"
                onMouseEnter={() => setHoveredIdx(i)}
                onClick={() => setSelectedDay(d)}
              >
                {/* Background Hover Highlight Column */}
                {(isHovered || isSelected) && (
                  <rect
                    x={groupCenterX - groupWidth / 2}
                    y={padding.top}
                    width={groupWidth}
                    height={plotHeight}
                    fill={d.isHighPerformer ? '#ecfdf5' : '#f1f5f9'}
                    opacity="0.75"
                    rx="6"
                  />
                )}

                {/* Star icon badge on high performance days */}
                {d.isHighPerformer && (
                  <g transform={`translate(${groupCenterX - 6}, ${padding.top - 18})`}>
                    <circle cx="6" cy="6" r="8" fill="#fef3c7" stroke="#f59e0b" strokeWidth="1" />
                    <text x="6" y="9.5" textAnchor="middle" fontSize="9">⭐</text>
                  </g>
                )}

                {/* 1. Bar: Card Views (Blue) */}
                <rect
                  x={xViews}
                  y={bottomY - heightViews}
                  width={barWidth}
                  height={heightViews}
                  rx="3"
                  fill="url(#barGradViews)"
                  opacity={isHovered || isSelected ? 1 : 0.88}
                  className="transition-all duration-200"
                />

                {/* 2. Bar: Lead Conversions (Emerald/Gold) */}
                <rect
                  x={xLeads}
                  y={bottomY - heightLeads}
                  width={barWidth}
                  height={heightLeads}
                  rx="3"
                  fill={d.isTopConversionDay ? 'url(#barGradHigh)' : 'url(#barGradLeads)'}
                  opacity={isHovered || isSelected ? 1 : 0.95}
                  className="transition-all duration-200"
                />

                {/* Conversion % Label on top of bars */}
                <text
                  x={groupCenterX}
                  y={bottomY - Math.max(heightViews, heightLeads) - 6}
                  textAnchor="middle"
                  fontSize="9"
                  fontWeight="800"
                  fill={d.isHighPerformer ? '#059669' : '#64748b'}
                >
                  {d.conversionRate}%
                </text>

                {/* X-Axis Date Label */}
                <text
                  x={groupCenterX}
                  y={bottomY + 16}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight={d.isHighPerformer ? '800' : '500'}
                  fill={d.isHighPerformer ? '#0f172a' : '#64748b'}
                >
                  {d.dayLabel}
                </text>
              </g>
            );
          })}
        </svg>

        {/* 4. FLOATING HOVER TOOLTIP */}
        {hoveredIdx !== null && displayData[hoveredIdx] && (
          <div
            className="absolute z-30 pointer-events-none transition-all duration-150 transform -translate-x-1/2 -translate-y-full"
            style={{
              left: `${((padding.left + (hoveredIdx + 0.5) * groupWidth) / svgWidth) * 100}%`,
              top: `${padding.top + 70}px`,
            }}
          >
            <div className="p-3.5 rounded-2xl bg-slate-900/95 text-white backdrop-blur-md shadow-2xl border border-slate-700 min-w-[220px] space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                <span className="text-xs font-bold text-white flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                  {displayData[hoveredIdx].fullDate}
                </span>
                {displayData[hoveredIdx].isHighPerformer && (
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-400 text-slate-950">
                    ⭐ TOP JOUR
                  </span>
                )}
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-blue-300">
                    <span className="w-2 h-2 rounded-full bg-blue-400"></span> Vues de Cartes :
                  </span>
                  <span className="font-black text-white">{displayData[hoveredIdx].views} vues</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-emerald-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Leads Capturés :
                  </span>
                  <span className="font-black text-emerald-400">{displayData[hoveredIdx].leads} leads</span>
                </div>

                <div className="pt-1.5 border-t border-slate-800 flex items-center justify-between font-bold">
                  <span className="text-slate-300">Taux de Closing :</span>
                  <span className="text-amber-400 text-sm font-black">{displayData[hoveredIdx].conversionRate}%</span>
                </div>
              </div>

              {displayData[hoveredIdx].notes && (
                <p className="text-[10px] text-emerald-300 font-semibold italic pt-0.5">
                  💡 {displayData[hoveredIdx].notes}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 5. HIGH-PERFORMING NETWORKING DAYS TABLE & TAKEAWAYS */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start pt-2 border-t border-slate-100">
        
        {/* Table of Top Days (7 cols) */}
        <div className="md:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Classement des Journées les plus Rentables
            </h4>
            <span className="text-[11px] text-slate-400">Triées par Taux de Conversion</span>
          </div>

          <div className="space-y-2">
            {[...displayData]
              .sort((a, b) => b.conversionRate - a.conversionRate)
              .slice(0, 4)
              .map((item, rank) => (
                <div
                  key={item.dateKey}
                  onClick={() => setSelectedDay(item)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    selectedDay?.dateKey === item.dateKey
                      ? 'bg-emerald-50/80 border-emerald-300 shadow-sm'
                      : 'bg-white border-slate-200/80 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center ${
                      rank === 0 ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                      rank === 1 ? 'bg-slate-200 text-slate-800' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      #{rank + 1}
                    </span>

                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        {item.fullDate}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {item.views} vues ➔ <strong>{item.leads} leads signés</strong>
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-black text-emerald-600 block">
                      {item.conversionRate}%
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">
                      Taux Closing
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Key Takeaways & Strategic Recommendation (5 cols) */}
        <div className="md:col-span-5 p-5 rounded-2xl bg-indigo-50/60 border border-indigo-200/70 space-y-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-indigo-600" />
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-indigo-950">
              Enseignements Stratégiques
            </h4>
          </div>

          <ul className="space-y-2 text-xs text-indigo-950 leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="text-indigo-600 font-black">•</span>
              <span><strong>Mardi & Jeudi</strong> concentrent <strong>58% des conversions</strong> de la semaine : programmez vos salons et rendez-vous physiques sur ces créneaux.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-600 font-black">•</span>
              <span>Les vendredis génèrent un volume de vues élevé mais un taux de closing différé au lundi matin.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-600 font-black">•</span>
              <span>L'activation des rappels automatiques 24h après une journée clé augmente la signature de <strong>+34%</strong>.</span>
            </li>
          </ul>
        </div>

      </div>

    </div>
  );
};
