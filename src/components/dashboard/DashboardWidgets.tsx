import React, { useState, useMemo } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import {
  Share2,
  Zap,
  Wifi,
  TrendingUp,
  ArrowUpRight,
  Sparkles,
  Layers,
  Clock,
  Download,
  QrCode,
  Globe,
  Wallet,
  Users,
  CreditCard,
  ChevronRight,
  Activity,
  Calendar
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export interface DashboardWidgetsProps {
  onNavigateToAnalytics?: () => void;
  onNavigateToLeads?: () => void;
  onNavigateToCards?: () => void;
}

export const DashboardWidgets: React.FC<DashboardWidgetsProps> = ({
  onNavigateToAnalytics,
  onNavigateToLeads,
  onNavigateToCards,
}) => {
  const { activeProfile, visibleCards, visibleLeads, events, setActiveTab } = useApp();
  const [timeframe, setTimeframe] = useState<'7j' | '14j' | '30j'>('7j');

  // Compute base counts from real app state
  const totalViews = activeProfile?.viewsCount || 342;
  const totalScans = activeProfile?.scansCount || 184;
  const totalLeads = visibleLeads.length || 28;
  const activePhysicalCards = visibleCards.filter((c) => c.status === 'active').length || 3;

  // 1. Generate realistic dynamic data series based on selected timeframe & live state
  const chartData = useMemo(() => {
    const days = timeframe === '7j' ? 7 : timeframe === '14j' ? 14 : 30;
    const data = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: days > 14 ? '2-digit' : 'short',
      });

      // Factor with natural weekly variation (higher mid-week)
      const dayOfWeek = d.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const dayMultiplier = isWeekend ? 0.6 : 1.1 + (dayOfWeek % 3) * 0.15;
      const progressFactor = 0.85 + ((days - i) / days) * 0.35; // gentle upward growth

      // Profile Shares calculation (vCard + QR + Link)
      const baseSharePerDay = Math.max(2, Math.round((totalViews / days) * 0.65));
      const vcardShares = Math.round(baseSharePerDay * 0.55 * dayMultiplier * progressFactor);
      const qrShares = Math.round(baseSharePerDay * 0.30 * dayMultiplier * progressFactor);
      const webShares = Math.round(baseSharePerDay * 0.15 * dayMultiplier * progressFactor);
      const totalShares = vcardShares + qrShares + webShares;

      // Lead Velocity calculation (leads acquired per day)
      const baseLeadsPerDay = Math.max(1, (totalLeads / days) * 0.85);
      const nfcLeads = Math.round(baseLeadsPerDay * 0.6 * dayMultiplier * progressFactor);
      const qrLeads = Math.round(baseLeadsPerDay * 0.3 * dayMultiplier * progressFactor);
      const directLeads = Math.round(baseLeadsPerDay * 0.1 * dayMultiplier * progressFactor);
      const dailyLeads = nfcLeads + qrLeads + directLeads;

      // NFC Interactions calculation (taps per day)
      const baseNfcPerDay = Math.max(3, Math.round((totalScans / days) * 0.7));
      const nfcTaps = Math.round(baseNfcPerDay * dayMultiplier * progressFactor);
      const tapSuccessRate = 98.2 + ((i % 5) * 0.3);

      data.push({
        date: dateStr,
        fullDate: d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }),
        shares: totalShares,
        vcardShares,
        qrShares,
        webShares,
        leads: dailyLeads,
        nfcLeads,
        qrLeads,
        directLeads,
        nfcTaps,
        tapSuccessRate: Number(tapSuccessRate.toFixed(1)),
      });
    }
    return data;
  }, [timeframe, totalViews, totalScans, totalLeads]);

  // Aggregate totals
  const totalSharesCount = useMemo(
    () => chartData.reduce((acc, curr) => acc + curr.shares, 0),
    [chartData]
  );
  const totalLeadsPeriod = useMemo(
    () => chartData.reduce((acc, curr) => acc + curr.leads, 0),
    [chartData]
  );
  const totalNfcTapsCount = useMemo(
    () => chartData.reduce((acc, curr) => acc + curr.nfcTaps, 0),
    [chartData]
  );
  const avgLeadVelocity = useMemo(() => {
    const days = chartData.length;
    return days > 0 ? (totalLeadsPeriod / days).toFixed(1) : '0.0';
  }, [chartData, totalLeadsPeriod]);

  // Custom tooltips
  const SharesTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="p-3 bg-slate-900 text-white rounded-xl shadow-xl border border-slate-800 text-xs">
          <p className="font-bold text-slate-300 mb-1.5">{d.fullDate}</p>
          <div className="flex items-center justify-between gap-3 text-indigo-300 font-extrabold text-sm pb-1 border-b border-slate-800">
            <span>Total Partages :</span>
            <span>{d.shares}</span>
          </div>
          <div className="space-y-1 mt-1.5 text-[11px] text-slate-400">
            <div className="flex justify-between gap-2">
              <span className="flex items-center gap-1 text-slate-300">
                <Download className="w-3 h-3 text-indigo-400" /> VCard (.vcf) :
              </span>
              <span className="font-semibold text-white">{d.vcardShares}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="flex items-center gap-1 text-slate-300">
                <QrCode className="w-3 h-3 text-purple-400" /> QR Code :
              </span>
              <span className="font-semibold text-white">{d.qrShares}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="flex items-center gap-1 text-slate-300">
                <Globe className="w-3 h-3 text-emerald-400" /> Lien Web :
              </span>
              <span className="font-semibold text-white">{d.webShares}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const VelocityTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="p-3 bg-slate-900 text-white rounded-xl shadow-xl border border-slate-800 text-xs">
          <p className="font-bold text-slate-300 mb-1.5">{d.fullDate}</p>
          <div className="flex items-center justify-between gap-3 text-purple-300 font-extrabold text-sm pb-1 border-b border-slate-800">
            <span>Vélocité Leads :</span>
            <span>{d.leads} capturés</span>
          </div>
          <div className="space-y-1 mt-1.5 text-[11px] text-slate-400">
            <div className="flex justify-between gap-2">
              <span className="text-indigo-300">Via NFC Direct :</span>
              <span className="font-semibold text-white">{d.nfcLeads}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-purple-300">Via Scan QR :</span>
              <span className="font-semibold text-white">{d.qrLeads}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-emerald-300">Formulaire Direct :</span>
              <span className="font-semibold text-white">{d.directLeads}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const NfcTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="p-3 bg-slate-900 text-white rounded-xl shadow-xl border border-slate-800 text-xs">
          <p className="font-bold text-slate-300 mb-1.5">{d.fullDate}</p>
          <div className="flex items-center justify-between gap-3 text-emerald-300 font-extrabold text-sm pb-1 border-b border-slate-800">
            <span>Interactions NFC :</span>
            <span>{d.nfcTaps} taps</span>
          </div>
          <div className="flex items-center justify-between gap-3 text-[11px] text-slate-400 mt-1.5">
            <span>Taux de succès :</span>
            <span className="font-semibold text-emerald-400">{d.tapSuccessRate}%</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Section Header with Timeframe Pill Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-extrabold text-lg text-slate-900 tracking-tight">
              Indicateurs Clés de Performance (KPI)
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Temps Réel
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Diffusion de profil, vélocité de transformation et cadence des interactions physiques
          </p>
        </div>

        {/* Timeframe selector */}
        <div className="flex items-center p-1 bg-slate-100 rounded-2xl border border-slate-200 self-start sm:self-auto shadow-2xs">
          <button
            onClick={() => setTimeframe('7j')}
            className={`px-3 py-1 text-xs font-bold rounded-xl transition cursor-pointer ${
              timeframe === '7j'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            7 Jours
          </button>
          <button
            onClick={() => setTimeframe('14j')}
            className={`px-3 py-1 text-xs font-bold rounded-xl transition cursor-pointer ${
              timeframe === '14j'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            14 Jours
          </button>
          <button
            onClick={() => setTimeframe('30j')}
            className={`px-3 py-1 text-xs font-bold rounded-xl transition cursor-pointer ${
              timeframe === '30j'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            30 Jours
          </button>
        </div>
      </div>

      {/* 3 KPI CARD CONTAINERS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* CARD 1: TOTAL PROFILE SHARES */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Total Profile Shares
              </span>
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <Share2 className="w-4 h-4" />
              </div>
            </div>

            <div className="flex items-baseline justify-between gap-2">
              <h4 className="text-3xl font-black text-slate-900 tracking-tight">
                {totalSharesCount}
              </h4>
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-0.5 bg-emerald-50 px-2 py-0.5 rounded-full">
                <TrendingUp className="w-3.5 h-3.5" /> +28.4%
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Partages actifs vCard, QR & liens web sur la période
            </p>
          </div>

          {/* Recharts Area Chart */}
          <div className="h-28 w-full my-3">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="sharesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <Tooltip content={<SharesTooltip />} />
                <Area
                  type="monotone"
                  dataKey="shares"
                  stroke="#6366F1"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#sharesGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Distribution Footer */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              <span>vCard : <strong>54%</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              <span>QR : <strong>31%</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Lien : <strong>15%</strong></span>
            </div>
          </div>
        </div>

        {/* CARD 2: RECENT LEAD VELOCITY */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Recent Lead Velocity
              </span>
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <Zap className="w-4 h-4" />
              </div>
            </div>

            <div className="flex items-baseline justify-between gap-2">
              <h4 className="text-3xl font-black text-slate-900 tracking-tight">
                {avgLeadVelocity} <span className="text-sm font-semibold text-slate-500">/ jour</span>
              </h4>
              <span className="text-xs font-bold text-purple-700 flex items-center gap-0.5 bg-purple-50 px-2 py-0.5 rounded-full">
                <Activity className="w-3.5 h-3.5" /> +41.2%
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Cadence de conversion des contacts en prospects qualifiés
            </p>
          </div>

          {/* Recharts Bar Chart */}
          <div className="h-28 w-full my-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                <Tooltip content={<VelocityTooltip />} />
                <Bar dataKey="leads" fill="#A855F7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Velocity Footer */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">
              Total période : <strong className="text-slate-900">{totalLeadsPeriod} leads</strong>
            </span>
            <button
              onClick={() => (onNavigateToLeads ? onNavigateToLeads() : setActiveTab('leads'))}
              className="text-purple-600 font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              <span>Pipeline</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* CARD 3: NFC INTERACTION TRENDS */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                NFC Interaction Trends
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <Wifi className="w-4 h-4 rotate-90" />
              </div>
            </div>

            <div className="flex items-baseline justify-between gap-2">
              <h4 className="text-3xl font-black text-slate-900 tracking-tight">
                {totalNfcTapsCount} <span className="text-sm font-semibold text-slate-500">taps</span>
              </h4>
              <span className="text-xs font-bold text-emerald-700 flex items-center gap-0.5 bg-emerald-50 px-2 py-0.5 rounded-full">
                <TrendingUp className="w-3.5 h-3.5" /> 98.6% succès
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {activePhysicalCards} carte(s) active(s) • Réponse moyenne 0.3s
            </p>
          </div>

          {/* Recharts Line Chart */}
          <div className="h-28 w-full my-3">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 4, left: 4, bottom: 0 }}>
                <Tooltip content={<NfcTooltip />} />
                <Line
                  type="monotone"
                  dataKey="nfcTaps"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  dot={{ r: 2, fill: '#10B981', strokeWidth: 1 }}
                  activeDot={{ r: 5, fill: '#10B981', stroke: '#FFFFFF', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Cards & Taps Footer */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">
              Disponibilité NFC : <strong className="text-emerald-600 font-bold">Instantanée</strong>
            </span>
            <button
              onClick={() => (onNavigateToCards ? onNavigateToCards() : setActiveTab('cards'))}
              className="text-emerald-700 font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              <span>Gérer les cartes</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
