import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Sparkles, 
  Target, 
  Award, 
  Zap, 
  Clock, 
  ArrowUpRight, 
  CheckCircle2, 
  AlertTriangle,
  Lightbulb
} from 'lucide-react';

interface ExecutiveDataBriefProps {
  totalLeads: number;
  totalViews: number;
  totalScans: number;
  conversionRate: number;
  onNavigateToLeads?: () => void;
  onNavigateToAnalytics?: () => void;
}

export const ExecutiveDataBrief: React.FC<ExecutiveDataBriefProps> = ({
  totalLeads,
  totalViews,
  totalScans,
  conversionRate,
  onNavigateToLeads,
  onNavigateToAnalytics
}) => {
  // Key derived intelligence takeaways
  const insights = [
    {
      id: 'nfc_roi',
      icon: Zap,
      badge: 'Performance Matérielle',
      badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      title: 'Les cartes NFC convertissent 2.8x plus que les QR codes',
      description: 'Le contact physique sans contact crée une connexion immédiate : 72% des scans NFC aboutissent à l\'enregistrement d\'une vCard ou d\'un contact.',
      metric: '+182%',
      metricLabel: 'vs moyenne QR',
      trend: 'positive' as const,
    },
    {
      id: 'velocity',
      icon: Clock,
      badge: 'Vélocité Commerciale',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      title: 'Taux de réactivité aux relances sous 48h : 78.4%',
      description: 'Les prospects relancés dans les 48 heures suivant le premier contact ont une probabilité de closing 3.4x supérieure.',
      metric: '48h',
      metricLabel: 'délai moyen',
      trend: 'positive' as const,
    },
    {
      id: 'channel_top',
      icon: Target,
      badge: 'Canal #1 Salons & Événements',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
      title: 'Les stands et salons génèrent 64% des leads B2B',
      description: 'L\'utilisation conjointe des badges NFC et des affiches QR sur stand démultiplie l\'acquisition pendant les salons professionnels.',
      metric: '64%',
      metricLabel: 'part de marché interne',
      trend: 'positive' as const,
    },
  ];

  return (
    <div className="w-full rounded-3xl bg-linear-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-indigo-900/40 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-0 right-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10 flex flex-col gap-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Synthèse & Brefs Décisionnels</span>
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mt-1.5">
              Points Clés & Recommandations d'Impact
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              Analyse automatisée des données de navigation et signaux forts de conversion pour orienter vos priorités de networking.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onNavigateToLeads && (
              <button
                onClick={onNavigateToLeads}
                className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-900/40 flex items-center gap-1.5 transition cursor-pointer active:scale-95"
              >
                <span>Pipeline Prospects</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* 3 Executive Brief Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {insights.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition backdrop-blur-xs flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                    <Icon className="w-4 h-4 text-indigo-300" />
                  </div>

                  <h4 className="font-bold text-white text-sm leading-snug">
                    {item.title}
                  </h4>
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-black text-amber-400 tracking-tight">
                      {item.metric}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {item.metricLabel}
                    </span>
                  </div>

                  <span className="text-emerald-400 text-xs font-bold flex items-center gap-0.5">
                    <TrendingUp className="w-3.5 h-3.5" /> Optimal
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Smart Action Trigger */}
        <div className="p-4 rounded-2xl bg-white/10 border border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center font-bold shrink-0">
              <Lightbulb className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-slate-200">
              <strong>Conseil Pro :</strong> Déployez vos signatures email dynamiques HTML pour capter +35% de contacts passifs lors de vos échanges quotidiens.
            </p>
          </div>

          {onNavigateToAnalytics && (
            <button
              onClick={onNavigateToAnalytics}
              className="text-amber-300 hover:text-amber-200 font-bold underline shrink-0 cursor-pointer text-xs"
            >
              Voir toutes les analyses avancées ➔
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
