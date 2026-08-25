import React, { useMemo, useState } from 'react';
import { Lead, Profile } from '../../types';
import { 
  Filter, 
  TrendingUp, 
  Wifi, 
  QrCode, 
  Users, 
  PhoneCall, 
  Award, 
  ArrowDown, 
  Percent, 
  Clock, 
  Sparkles, 
  ChevronRight, 
  Mail, 
  Globe, 
  CheckCircle2, 
  AlertTriangle,
  Flame,
  Layers,
  ArrowRight,
  Info
} from 'lucide-react';

interface ConversionFunnelSectionProps {
  leads: Lead[];
  profiles: Profile[];
  selectedProfileId: string;
  period: '7j' | '30j' | '90j';
  totalViews: number;
  totalNfc: number;
  totalQr: number;
}

export const ConversionFunnelSection: React.FC<ConversionFunnelSectionProps> = ({
  leads,
  profiles,
  selectedProfileId,
  period,
  totalViews,
  totalNfc,
  totalQr
}) => {
  const [selectedChannel, setSelectedChannel] = useState<'all' | 'nfc' | 'qr' | 'email' | 'direct'>('all');

  // Filter leads by selected profile
  const filteredLeads = useMemo(() => {
    let list = leads;
    if (selectedProfileId !== 'all') {
      list = list.filter((l) => l.profileId === selectedProfileId);
    }
    if (selectedChannel !== 'all') {
      list = list.filter((l) => l.source === selectedChannel);
    }
    return list;
  }, [leads, selectedProfileId, selectedChannel]);

  // Funnel calculations
  const funnelData = useMemo(() => {
    // Scaling coefficient based on period
    const periodMultiplier = period === '7j' ? 0.3 : period === '30j' ? 1 : 2.5;
    
    // Stage 1: Scans & Total Profile Visits
    const totalScans = Math.max(1, Math.round((totalNfc + totalQr || totalViews) * periodMultiplier));
    
    // Stage 2: Interactions & Actions (VCF download, WhatsApp click, etc.)
    const totalInteractions = Math.round(totalScans * 0.35);

    // Stage 3: Prospects Capturés (Leads in CRM)
    const capturedLeads = filteredLeads.length;

    // Stage 4: Suivis & Relances Réalisés (Leads with logged interactions or completed/scheduled follow-ups)
    const leadsWithFollowup = filteredLeads.filter(
      (l) => (l.interactions && l.interactions.length > 0) || l.reminderStatus === 'completed' || !!l.reminderDate
    ).length;

    // Stage 5: Clients Signés / Opportunités Gagnées (Won leads)
    const wonLeads = filteredLeads.filter((l) => l.status === 'won').length;

    // Conversion Ratios
    const scanToLeadRate = totalScans > 0 ? ((capturedLeads / totalScans) * 100).toFixed(1) : '0.0';
    const leadToFollowupRate = capturedLeads > 0 ? ((leadsWithFollowup / capturedLeads) * 100).toFixed(1) : '0.0';
    const followupToWonRate = leadsWithFollowup > 0 ? ((wonLeads / leadsWithFollowup) * 100).toFixed(1) : '0.0';
    const globalConversionRate = totalScans > 0 ? ((wonLeads / totalScans) * 100).toFixed(2) : '0.00';

    return {
      totalScans,
      totalInteractions,
      capturedLeads,
      leadsWithFollowup,
      wonLeads,
      scanToLeadRate,
      leadToFollowupRate,
      followupToWonRate,
      globalConversionRate,
    };
  }, [filteredLeads, period, totalNfc, totalQr]);

  // Channel breakdown metrics
  const channels = [
    {
      id: 'nfc',
      name: 'Cartes Physiques NFC',
      icon: Wifi,
      iconColor: 'text-indigo-600',
      bgColor: 'bg-indigo-50 border-indigo-200',
      scans: Math.round(totalNfc * (period === '7j' ? 0.3 : period === '30j' ? 1 : 2.5)),
      leads: leads.filter((l) => l.source === 'nfc').length,
      conversion: '4.8%',
      qualityScore: '98/100 (Très Haute)',
      tag: 'Canal #1 ROI Salons',
    },
    {
      id: 'qr',
      name: 'QR Codes Événements & Stands',
      icon: QrCode,
      iconColor: 'text-violet-600',
      bgColor: 'bg-violet-50 border-violet-200',
      scans: Math.round(totalQr * (period === '7j' ? 0.3 : period === '30j' ? 1 : 2.5)),
      leads: leads.filter((l) => l.source === 'qr').length,
      conversion: '3.1%',
      qualityScore: '86/100 (Haute)',
      tag: 'Volume & Événements',
    },
    {
      id: 'email',
      name: 'Signatures Email Interactives',
      icon: Mail,
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-50 border-blue-200',
      scans: Math.round(412 * (period === '7j' ? 0.3 : period === '30j' ? 1 : 2.5)),
      leads: leads.filter((l) => l.source === 'email').length,
      conversion: '5.4%',
      qualityScore: '92/100 (Très Haute)',
      tag: 'Flux Continu B2B',
    },
    {
      id: 'direct',
      name: 'Liens Directs & Partages Web',
      icon: Globe,
      iconColor: 'text-emerald-600',
      bgColor: 'bg-emerald-50 border-emerald-200',
      scans: Math.round(230 * (period === '7j' ? 0.3 : period === '30j' ? 1 : 2.5)),
      leads: leads.filter((l) => l.source === 'link' || l.source === 'direct').length,
      conversion: '2.9%',
      qualityScore: '74/100 (Moyenne)',
      tag: 'Réseaux & Inbound',
    },
  ];

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-200">
      
      {/* SUMMARY BANNER & RATIOS */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 text-white shadow-xl flex flex-col gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <Filter className="w-5 h-5" />
              </span>
              <h3 className="text-xl font-bold text-white tracking-tight">
                Entonnoir de Conversion Commerciale
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Analyse pas-à-pas de l'attrition et de la transformation : du scan physique de la carte KardX jusqu'à la signature finale.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600/30 text-indigo-300 border border-indigo-500/30">
              Taux Global Scan ➔ Vente : {funnelData.globalConversionRate} %
            </span>
          </div>
        </div>

        {/* 3 Main Ratio Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-800 relative z-10">
          
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold">1. Taux Scan ➔ Lead</span>
              <Wifi className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <p className="text-2xl font-black text-white">{funnelData.scanToLeadRate} %</p>
              <span className="text-[11px] text-emerald-400 font-semibold">+1.2% vs moy. secteur</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Visiteurs ayant validé leurs coordonnées
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold">2. Taux Lead ➔ Suivi</span>
              <PhoneCall className="w-4 h-4 text-blue-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <p className="text-2xl font-black text-white">{funnelData.leadToFollowupRate} %</p>
              <span className="text-[11px] text-indigo-300 font-semibold">Excellente réactivité</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Prospects ayant reçu au moins un appel/relance
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold">3. Taux Suivi ➔ Client Signé</span>
              <Award className="w-4 h-4 text-amber-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <p className="text-2xl font-black text-white">{funnelData.followupToWonRate} %</p>
              <span className="text-[11px] text-amber-400 font-semibold">{funnelData.wonLeads} deals closés</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Conversion des suivis en contrats signés
            </p>
          </div>

        </div>
      </div>

      {/* FULL STEP-BY-STEP FUNNEL VISUALIZATION */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/80 shadow-sm flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div>
            <h4 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              Tunnel Visuel d'Acquisition & Rétention
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Déperdition et efficacité à chaque étape du cycle de prospection
            </p>
          </div>
          
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <span>Période : <strong>{period === '7j' ? '7 derniers jours' : period === '30j' ? '30 derniers jours' : '90 derniers jours'}</strong></span>
          </div>
        </div>

        {/* STAGES */}
        <div className="flex flex-col gap-3">
          
          {/* Étape 1 : Scans & Vues Totales */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col gap-3 hover:border-indigo-300 transition">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                  1
                </div>
                <div>
                  <h5 className="text-sm font-bold text-slate-800">
                    Scans de Cartes & Vues de Profils
                  </h5>
                  <p className="text-xs text-slate-500">
                    Contacts initiés via cartes NFC, QR codes d'événements et signatures email
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-base font-black text-slate-900">{funnelData.totalScans.toLocaleString('fr-FR')}</p>
                <p className="text-[11px] font-bold text-blue-600">100 % (Base)</p>
              </div>
            </div>

            <div className="w-full h-3 rounded-full bg-slate-200 overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full" style={{ width: '100%' }}></div>
            </div>
          </div>

          {/* Transition Drop-off 1 -> 2 */}
          <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-400 py-0.5">
            <ArrowDown className="w-4 h-4 text-indigo-400" />
            <span>28 % d'engagement actif (-72% rebond immédiat)</span>
          </div>

          {/* Étape 2 : Interactions & Clics Actions */}
          <div className="p-5 rounded-2xl bg-indigo-50/50 border border-indigo-200 flex flex-col gap-3 ml-2 sm:ml-4 hover:border-indigo-400 transition">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                  2
                </div>
                <div>
                  <h5 className="text-sm font-bold text-slate-800">
                    Intérêt & Clics d'Action (VCF, WhatsApp, Liens)
                  </h5>
                  <p className="text-xs text-slate-500">
                    Visiteurs ayant téléchargé la vCard, cliqué pour appeler ou ouvert le formulaire
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-base font-black text-slate-900">{funnelData.totalInteractions.toLocaleString('fr-FR')}</p>
                <p className="text-[11px] font-bold text-indigo-600">28.0 % du trafic total</p>
              </div>
            </div>

            <div className="w-full h-3 rounded-full bg-indigo-200 overflow-hidden">
              <div className="h-full bg-indigo-600 rounded-full" style={{ width: '28%' }}></div>
            </div>
          </div>

          {/* Transition Drop-off 2 -> 3 */}
          <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-400 py-0.5">
            <ArrowDown className="w-4 h-4 text-violet-400" />
            <span>Capture de coordonnées : {funnelData.capturedLeads} fiches complètes générées</span>
          </div>

          {/* Étape 3 : Prospects Capturés (Leads) */}
          <div className="p-5 rounded-2xl bg-violet-50/60 border border-violet-200 flex flex-col gap-3 ml-4 sm:ml-8 hover:border-violet-400 transition">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-violet-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                  3
                </div>
                <div>
                  <h5 className="text-sm font-bold text-slate-800">
                    Prospects Capturés & Qualifiés (Leads CRM)
                  </h5>
                  <p className="text-xs text-slate-500">
                    Coordonnées validées dans le CRM avec email, téléphone et entreprise
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-base font-black text-slate-900">{funnelData.capturedLeads}</p>
                <p className="text-[11px] font-bold text-violet-600">{funnelData.scanToLeadRate} % des scans</p>
              </div>
            </div>

            <div className="w-full h-3 rounded-full bg-violet-200 overflow-hidden">
              <div 
                className="h-full bg-violet-600 rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(100, Math.max(10, (funnelData.capturedLeads / funnelData.totalScans) * 100 * 5))}%` }}
              ></div>
            </div>
          </div>

          {/* Transition Drop-off 3 -> 4 */}
          <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-400 py-0.5">
            <ArrowDown className="w-4 h-4 text-emerald-500" />
            <span>Taux d'activation commerciale : {funnelData.leadToFollowupRate}% traités</span>
          </div>

          {/* Étape 4 : Suivis Réalisés & Relances */}
          <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-300 flex flex-col gap-3 ml-6 sm:ml-12 hover:border-emerald-500 transition shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                  4
                </div>
                <div>
                  <h5 className="text-sm font-bold text-slate-800">
                    Suivis Réalisés & Relances Traitées
                  </h5>
                  <p className="text-xs text-slate-500">
                    Prospects ayant fait l'objet d'un appel téléphonique, email personnalisé ou RDV
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-base font-black text-slate-900">{funnelData.leadsWithFollowup}</p>
                <p className="text-[11px] font-bold text-emerald-700">{funnelData.leadToFollowupRate} % des prospects</p>
              </div>
            </div>

            <div className="w-full h-3 rounded-full bg-emerald-200 overflow-hidden">
              <div 
                className="h-full bg-emerald-600 rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(100, Math.max(12, (funnelData.leadsWithFollowup / Math.max(1, funnelData.capturedLeads)) * 100))}%` }}
              ></div>
            </div>
          </div>

          {/* Transition Drop-off 4 -> 5 */}
          <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-400 py-0.5">
            <ArrowDown className="w-4 h-4 text-amber-500" />
            <span>Closing : {funnelData.followupToWonRate}% des suivis convertis en contrats</span>
          </div>

          {/* Étape 5 : Clients Signés (Won) */}
          <div className="p-5 rounded-2xl bg-amber-50/80 border border-amber-300 flex flex-col gap-3 ml-8 sm:ml-16 hover:border-amber-500 transition shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                  5
                </div>
                <div>
                  <h5 className="text-sm font-bold text-slate-800">
                    Clients Signés & Deals Closés (Won)
                  </h5>
                  <p className="text-xs text-slate-500">
                    Objectif final : transformation réussie en chiffre d'affaires
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-base font-black text-amber-900">{funnelData.wonLeads} deals</p>
                <p className="text-[11px] font-bold text-amber-700">{funnelData.followupToWonRate} % de conversion finale</p>
              </div>
            </div>

            <div className="w-full h-3 rounded-full bg-amber-200 overflow-hidden">
              <div 
                className="h-full bg-amber-600 rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(100, Math.max(15, (funnelData.wonLeads / Math.max(1, funnelData.leadsWithFollowup)) * 100))}%` }}
              ></div>
            </div>
          </div>

        </div>
      </div>

      {/* CHANNEL BREAKDOWN & ACTIONABLE INSIGHTS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Performance par Support de Scan (7 cols) */}
        <div className="lg:col-span-7 p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/80 shadow-sm flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-base font-bold text-slate-800">
                Efficacité par Canal d'Émission
              </h4>
              <p className="text-xs text-slate-500">
                Comparez le taux de transformation selon le support de partage utilisé
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {channels.map((ch) => {
              const IconComp = ch.icon;
              const isSelected = selectedChannel === ch.id;

              return (
                <button
                  key={ch.id}
                  onClick={() => setSelectedChannel(isSelected ? 'all' : ch.id as any)}
                  className={`p-4 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between gap-3 ${
                    isSelected ? 'ring-2 ring-indigo-500 bg-indigo-50/50 border-indigo-300' : 'bg-slate-50/70 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2 rounded-xl bg-white border border-slate-200 ${ch.iconColor} shadow-2xs`}>
                        <IconComp className="w-4 h-4" />
                      </div>
                      <div>
                        <h5 className="font-bold text-xs text-slate-800 leading-snug">{ch.name}</h5>
                        <span className="text-[10px] text-slate-500 font-semibold">{ch.tag}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/80 text-xs">
                    <div>
                      <p className="text-[10px] text-slate-400 font-semibold">Scans estimés</p>
                      <p className="font-black text-slate-800">{ch.scans.toLocaleString('fr-FR')}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-semibold">Taux Scan ➔ Lead</p>
                      <p className="font-black text-emerald-600">{ch.conversion}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 bg-white p-1.5 rounded-lg border border-slate-200/60 font-medium">
                    <span>Qualité Lead :</span>
                    <strong className="text-slate-800">{ch.qualityScore}</strong>
                  </div>
                </button>
              );
            })}
          </div>

          {selectedChannel !== 'all' && (
            <button
              onClick={() => setSelectedChannel('all')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 text-center py-1 cursor-pointer"
            >
              Réinitialiser le filtre de canal
            </button>
          )}
        </div>

        {/* Optimisations & Conseils ROI (5 cols) */}
        <div className="lg:col-span-5 p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/80 shadow-sm flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h4 className="text-base font-bold text-slate-800">
              Recommandations d'Optimisation
            </h4>
          </div>
          <p className="text-xs text-slate-500">
            Conseils stratégiques pour réduire l'attrition et booster vos ventes.
          </p>

          <div className="flex flex-col gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-indigo-950">Relancer sous 24h à 48h</p>
                <p className="text-[11px] text-indigo-800 mt-0.5 leading-relaxed">
                  Le taux de closing augmente de <strong>+42%</strong> lorsque le premier rappel calendaire est effectué dans les 48 heures suivant le scan.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-emerald-950">Favoriser le tap NFC direct</p>
                <p className="text-[11px] text-emerald-800 mt-0.5 leading-relaxed">
                  Les cartes physiques NFC génèrent un taux de capture de coordonnées <strong>1.5x supérieur</strong> au QR code grâce à l'effet de surprise technologique.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-100 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-950">Qualifier immédiatement les notes</p>
                <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                  Ajouter une note de contexte directement après l'échange garantit un meilleur suivi d'équipe et accélère les signatures de contrat.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
