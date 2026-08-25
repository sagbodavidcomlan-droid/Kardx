import React, { useState, useMemo } from 'react';
import { 
  Wifi, 
  QrCode, 
  Mail, 
  Globe, 
  Wallet, 
  Smartphone, 
  Sparkles,
  TrendingUp
} from 'lucide-react';

export interface AcquisitionSlice {
  id: string;
  label: string;
  count: number;
  color: string;
  gradientFrom: string;
  gradientTo: string;
  icon: any;
  conversionRate: number; // in %
}

interface AcquisitionDonutChartProps {
  nfcCount?: number;
  qrCount?: number;
  emailCount?: number;
  directCount?: number;
  walletCount?: number;
  title?: string;
  subtitle?: string;
}

export const AcquisitionDonutChart: React.FC<AcquisitionDonutChartProps> = ({
  nfcCount = 1840,
  qrCount = 2410,
  emailCount = 412,
  directCount = 230,
  walletCount = 158,
  title = "Répartition par Canal d'Acquisition",
  subtitle = "Identification précise de la rentabilité de chaque point de contact physique & digital."
}) => {
  const [hoveredSliceId, setHoveredSliceId] = useState<string | null>(null);

  const slices: AcquisitionSlice[] = useMemo(() => [
    {
      id: 'nfc',
      label: 'Cartes NFC Sans Contact',
      count: nfcCount,
      color: '#4f46e5',
      gradientFrom: '#6366f1',
      gradientTo: '#4338ca',
      icon: Wifi,
      conversionRate: 24.8,
    },
    {
      id: 'qr',
      label: 'QR Codes Événements & Stands',
      count: qrCount,
      color: '#8b5cf6',
      gradientFrom: '#a855f7',
      gradientTo: '#7e22ce',
      icon: QrCode,
      conversionRate: 16.2,
    },
    {
      id: 'email',
      label: 'Signatures Email HTML',
      count: emailCount,
      color: '#3b82f6',
      gradientFrom: '#60a5fa',
      gradientTo: '#2563eb',
      icon: Mail,
      conversionRate: 18.5,
    },
    {
      id: 'direct',
      label: 'Liens Directs & Réseaux',
      count: directCount,
      color: '#10b981',
      gradientFrom: '#34d399',
      gradientTo: '#059669',
      icon: Globe,
      conversionRate: 11.4,
    },
    {
      id: 'wallet',
      label: 'Pass Apple & Google Wallet',
      count: walletCount,
      color: '#f59e0b',
      gradientFrom: '#fbbf24',
      gradientTo: '#d97706',
      icon: Wallet,
      conversionRate: 29.3,
    },
  ], [nfcCount, qrCount, emailCount, directCount, walletCount]);

  const total = useMemo(() => {
    return slices.reduce((acc, s) => acc + s.count, 0);
  }, [slices]);

  // Compute SVG Donut Arc Paths
  const radius = 80;
  const innerRadius = 54;
  const cx = 110;
  const cy = 110;

  const arcData = useMemo(() => {
    let cumulativeAngle = -Math.PI / 2; // start from top (12 o'clock)

    return slices.map((slice) => {
      const percentage = total > 0 ? slice.count / total : 0;
      const angle = percentage * 2 * Math.PI;
      const startAngle = cumulativeAngle;
      const endAngle = cumulativeAngle + angle;
      cumulativeAngle += angle;

      // Arc coordinates
      const isHovered = hoveredSliceId === slice.id;
      const currentRadius = isHovered ? radius + 5 : radius;
      const currentInnerRadius = isHovered ? innerRadius - 2 : innerRadius;

      const x1 = cx + currentRadius * Math.cos(startAngle);
      const y1 = cy + currentRadius * Math.sin(startAngle);
      const x2 = cx + currentRadius * Math.cos(endAngle);
      const y2 = cy + currentRadius * Math.sin(endAngle);

      const x3 = cx + currentInnerRadius * Math.cos(endAngle);
      const y3 = cy + currentInnerRadius * Math.sin(endAngle);
      const x4 = cx + currentInnerRadius * Math.cos(startAngle);
      const y4 = cy + currentInnerRadius * Math.sin(startAngle);

      const largeArc = angle > Math.PI ? 1 : 0;

      const pathData = [
        `M ${x1} ${y1}`,
        `A ${currentRadius} ${currentRadius} 0 ${largeArc} 1 ${x2} ${y2}`,
        `L ${x3} ${y3}`,
        `A ${currentInnerRadius} ${currentInnerRadius} 0 ${largeArc} 0 ${x4} ${y4}`,
        'Z',
      ].join(' ');

      const formattedPct = (percentage * 100).toFixed(1);

      return {
        ...slice,
        pathData,
        percentage: formattedPct,
        rawPct: percentage,
      };
    });
  }, [slices, total, hoveredSliceId]);

  const activeHover = arcData.find((s) => s.id === hoveredSliceId) || arcData[0];

  return (
    <div className="w-full bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-7 flex flex-col gap-6">
      
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-violet-50 text-violet-700 border border-violet-200">
            Attribution Multi-Canale
          </span>
        </div>
        <h3 className="text-lg font-extrabold text-slate-900 tracking-tight mt-1">
          {title}
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          {subtitle}
        </p>
      </div>

      {/* Donut Canvas + Interactive Legend Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        
        {/* Left: Donut SVG + Center Highlight (5 cols) */}
        <div className="md:col-span-5 flex flex-col items-center justify-center relative">
          <svg viewBox="0 0 220 220" className="w-52 h-52 overflow-visible select-none">
            <defs>
              {arcData.map((slice) => (
                <linearGradient key={`grad_${slice.id}`} id={`donutGrad_${slice.id}`} x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor={slice.gradientFrom} />
                  <stop offset="100%" stopColor={slice.gradientTo} />
                </linearGradient>
              ))}
            </defs>

            {arcData.map((slice) => {
              const isHovered = hoveredSliceId === slice.id;
              return (
                <path
                  key={slice.id}
                  d={slice.pathData}
                  fill={`url(#donutGrad_${slice.id})`}
                  stroke="#ffffff"
                  strokeWidth={isHovered ? 2.5 : 1.5}
                  className="transition-all duration-200 cursor-pointer origin-center"
                  onMouseEnter={() => setHoveredSliceId(slice.id)}
                  onMouseLeave={() => setHoveredSliceId(null)}
                />
              );
            })}
          </svg>

          {/* Center Callout */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {activeHover ? activeHover.percentage + '%' : 'Total'}
            </span>
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              {activeHover ? activeHover.count.toLocaleString('fr-FR') : total.toLocaleString('fr-FR')}
            </span>
            <span className="text-[10px] font-semibold text-indigo-600 truncate max-w-[110px]">
              {activeHover ? activeHover.label.split(' ')[0] : 'Scans'}
            </span>
          </div>
        </div>

        {/* Right: Detailed Legend & Conversion KPIs (7 cols) */}
        <div className="md:col-span-7 flex flex-col gap-2.5">
          {arcData.map((slice) => {
            const Icon = slice.icon;
            const isHovered = hoveredSliceId === slice.id;

            return (
              <div
                key={slice.id}
                onMouseEnter={() => setHoveredSliceId(slice.id)}
                onMouseLeave={() => setHoveredSliceId(null)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isHovered
                    ? 'bg-slate-50 border-slate-300 shadow-sm scale-[1.01]'
                    : 'bg-white border-slate-100 hover:border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 shadow-2xs"
                    style={{ backgroundColor: slice.color }}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">
                      {slice.label}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {slice.count.toLocaleString('fr-FR')} scans ({slice.percentage}%)
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-black text-emerald-600 block">
                    {slice.conversionRate}% conv.
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {Math.round((slice.count * slice.conversionRate) / 100)} leads
                  </span>
                </div>
              </div>
            );
          })}
        </div>

      </div>

    </div>
  );
};
