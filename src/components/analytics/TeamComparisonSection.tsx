import React, { useMemo, useState } from 'react';
import { Lead, Profile, User, Team, PhysicalCard } from '../../types';
import { 
  Users, 
  Wifi, 
  QrCode, 
  TrendingUp, 
  Award, 
  ArrowUpDown, 
  Sparkles, 
  ChevronRight, 
  Filter, 
  Download, 
  CheckCircle2, 
  ArrowUpRight, 
  Clock, 
  PhoneCall, 
  Briefcase, 
  BarChart3, 
  PieChart, 
  Search, 
  ShieldCheck, 
  SlidersHorizontal,
  Layers,
  Flame,
  Star,
  Target,
  UserCheck,
  Zap,
  Info
} from 'lucide-react';

interface TeamComparisonSectionProps {
  profiles: Profile[];
  users: User[];
  teams: Team[];
  leads: Lead[];
  cards: PhysicalCard[];
  period: '7j' | '30j' | '90j';
  onSelectProfile?: (profileId: string) => void;
}

export const TeamComparisonSection: React.FC<TeamComparisonSectionProps> = ({
  profiles,
  users,
  teams,
  leads,
  cards,
  period,
  onSelectProfile
}) => {
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<'scans' | 'leads' | 'cvr' | 'followup' | 'won'>('leads');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Side-by-side comparison selection (2 or 3 member IDs)
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([
    profiles[0]?.id || '',
    profiles[1]?.id || profiles[0]?.id || ''
  ]);

  const periodMultiplier = period === '7j' ? 0.3 : period === '30j' ? 1 : 2.5;

  // Processed metrics per team member
  const memberMetrics = useMemo(() => {
    return profiles.map((prof) => {
      const user = users.find((u) => u.id === prof.userId);
      const team = teams.find((t) => t.id === user?.teamId);
      
      const memberLeads = leads.filter((l) => l.profileId === prof.id || l.assignedUserId === prof.userId);
      const memberCards = cards.filter((c) => c.profileId === prof.id || c.assignedToUser === prof.userId);
      
      const rawScans = prof.scansCount || 100;
      const scans = Math.round(rawScans * periodMultiplier);
      const views = Math.round((prof.viewsCount || 200) * periodMultiplier);
      
      // Leads count adjusted for period
      const capturedLeads = memberLeads.length;
      
      // Followed up leads
      const followedUpLeads = memberLeads.filter(
        (l) => (l.interactions && l.interactions.length > 0) || l.reminderStatus === 'completed' || !!l.reminderDate
      ).length;

      // Won deals
      const wonDeads = memberLeads.filter((l) => l.status === 'won').length;

      // Rates
      const conversionRate = scans > 0 ? (capturedLeads / scans) * 100 : 0;
      const followupRate = capturedLeads > 0 ? (followedUpLeads / capturedLeads) * 100 : 0;
      const wonRate = followedUpLeads > 0 ? (wonDeads / followedUpLeads) * 100 : 0;

      // Channel breakdown counts
      const nfcLeads = memberLeads.filter((l) => l.source === 'nfc').length;
      const qrLeads = memberLeads.filter((l) => l.source === 'qr').length;
      const emailLeads = memberLeads.filter((l) => l.source === 'email_signature' || l.source === 'direct_url').length;

      // Active cards count
      const activeCardsCount = memberCards.filter((c) => c.status === 'active').length;

      return {
        profile: prof,
        user,
        team,
        scans,
        views,
        leadsCount: capturedLeads,
        followedUpCount: followedUpLeads,
        wonCount: wonDeads,
        conversionRate,
        followupRate,
        wonRate,
        nfcLeads,
        qrLeads,
        emailLeads,
        activeCardsCount,
        cardMaterials: memberCards.map((c) => c.material),
      };
    });
  }, [profiles, users, teams, leads, cards, periodMultiplier]);

  // Filtered & Sorted members
  const filteredMembers = useMemo(() => {
    let list = memberMetrics.filter((m) => {
      const matchesTeam = selectedTeamFilter === 'all' || m.team?.id === selectedTeamFilter || m.profile.department?.includes(selectedTeamFilter);
      const fullName = `${m.profile.firstName} ${m.profile.lastName} ${m.profile.headline}`.toLowerCase();
      const matchesSearch = fullName.includes(searchTerm.toLowerCase());
      return matchesTeam && matchesSearch;
    });

    list.sort((a, b) => {
      let valA = 0;
      let valB = 0;

      if (sortBy === 'scans') {
        valA = a.scans;
        valB = b.scans;
      } else if (sortBy === 'leads') {
        valA = a.leadsCount;
        valB = b.leadsCount;
      } else if (sortBy === 'cvr') {
        valA = a.conversionRate;
        valB = b.conversionRate;
      } else if (sortBy === 'followup') {
        valA = a.followupRate;
        valB = b.followupRate;
      } else if (sortBy === 'won') {
        valA = a.wonCount;
        valB = b.wonCount;
      }

      return sortOrder === 'desc' ? valB - valA : valA - valB;
    });

    return list;
  }, [memberMetrics, selectedTeamFilter, searchTerm, sortBy, sortOrder]);

  // Aggregate stats
  const teamTotals = useMemo(() => {
    const totalScans = memberMetrics.reduce((acc, m) => acc + m.scans, 0);
    const totalLeads = memberMetrics.reduce((acc, m) => acc + m.leadsCount, 0);
    const totalWon = memberMetrics.reduce((acc, m) => acc + m.wonCount, 0);
    const avgCvr = totalScans > 0 ? ((totalLeads / totalScans) * 100).toFixed(1) : '0.0';
    const totalCards = memberMetrics.reduce((acc, m) => acc + m.activeCardsCount, 0);

    // Find champions
    const topScanner = [...memberMetrics].sort((a, b) => b.scans - a.scans)[0];
    const topLeadGen = [...memberMetrics].sort((a, b) => b.leadsCount - a.leadsCount)[0];
    const topConverter = [...memberMetrics].sort((a, b) => b.conversionRate - a.conversionRate)[0];

    return {
      totalScans,
      totalLeads,
      totalWon,
      avgCvr,
      totalCards,
      topScanner,
      topLeadGen,
      topConverter,
    };
  }, [memberMetrics]);

  // Toggle member selection for side-by-side comparison
  const toggleCompare = (profileId: string) => {
    if (selectedForCompare.includes(profileId)) {
      if (selectedForCompare.length > 1) {
        setSelectedForCompare(selectedForCompare.filter((id) => id !== profileId));
      }
    } else {
      if (selectedForCompare.length < 3) {
        setSelectedForCompare([...selectedForCompare, profileId]);
      } else {
        setSelectedForCompare([selectedForCompare[1], selectedForCompare[2], profileId]);
      }
    }
  };

  const comparedMembers = useMemo(() => {
    return memberMetrics.filter((m) => selectedForCompare.includes(m.profile.id));
  }, [memberMetrics, selectedForCompare]);

  // Handle sort column click
  const handleSort = (field: 'scans' | 'leads' | 'cvr' | 'followup' | 'won') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  // Export team comparison to CSV
  const handleExportTeamCsv = () => {
    const headers = [
      'Collaborateur',
      'Email',
      'Fonction',
      'Département',
      'Cartes Actives',
      'Cartes Scannées',
      'Prospects Capturés',
      'Taux de Conversion (%)',
      'Suivis Réalisés',
      'Taux de Suivi (%)',
      'Deals Gagnés'
    ];

    const rows = memberMetrics.map((m) => [
      `"${m.profile.firstName} ${m.profile.lastName}"`,
      `"${m.profile.contacts.email}"`,
      `"${m.profile.headline.replace(/"/g, '""')}"`,
      `"${m.profile.department || 'Commercial'}"`,
      m.activeCardsCount,
      m.scans,
      m.leadsCount,
      m.conversionRate.toFixed(2),
      m.followedUpCount,
      m.followupRate.toFixed(1),
      m.wonCount
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `kardx_team_comparison_${period}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-200">
      
      {/* MANAGER EXECUTIVE SUMMARY BANNER */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 text-white shadow-xl flex flex-col gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                <Users className="w-5 h-5" />
              </span>
              <h3 className="text-xl font-bold text-white tracking-tight">
                Comparatif & Performance de l'Équipe
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Analysez la productivité terrain de vos collaborateurs : ratio de cartes scannées vs contacts qualifiés capturés.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportTeamCsv}
              className="py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/10 flex items-center gap-2 transition cursor-pointer"
            >
              <Download className="w-4 h-4 text-blue-300" />
              <span>Exporter Rapport Équipe</span>
            </button>
          </div>
        </div>

        {/* 4 Team KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-800 relative z-10">
          
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex flex-col justify-between">
            <span className="text-xs text-slate-400 font-semibold flex items-center justify-between">
              Total Scans Équipe
              <Wifi className="w-4 h-4 text-blue-400" />
            </span>
            <div className="mt-2">
              <p className="text-2xl font-black text-white">{teamTotals.totalScans.toLocaleString('fr-FR')}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{teamTotals.totalCards} cartes NFC & QR actives</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex flex-col justify-between">
            <span className="text-xs text-slate-400 font-semibold flex items-center justify-between">
              Prospects CRM Capturés
              <Target className="w-4 h-4 text-emerald-400" />
            </span>
            <div className="mt-2">
              <p className="text-2xl font-black text-white">{teamTotals.totalLeads}</p>
              <p className="text-[11px] text-emerald-400 font-medium mt-0.5">Taux moyen : {teamTotals.avgCvr}%</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex flex-col justify-between">
            <span className="text-xs text-slate-400 font-semibold flex items-center justify-between">
              Deals & Contrats Gagnés
              <Award className="w-4 h-4 text-amber-400" />
            </span>
            <div className="mt-2">
              <p className="text-2xl font-black text-white">{teamTotals.totalWon} deals</p>
              <p className="text-[11px] text-amber-300 font-medium mt-0.5">Closing post-rencontre</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex flex-col justify-between">
            <span className="text-xs text-slate-400 font-semibold flex items-center justify-between">
              Top Performer Période
              <Flame className="w-4 h-4 text-rose-400" />
            </span>
            <div className="mt-2">
              <p className="text-sm font-bold text-white truncate">
                {teamTotals.topLeadGen?.profile.firstName} {teamTotals.topLeadGen?.profile.lastName}
              </p>
              <p className="text-[11px] text-rose-300 font-medium mt-0.5">
                {teamTotals.topLeadGen?.leadsCount} leads ({teamTotals.topLeadGen?.conversionRate.toFixed(1)}% CVR)
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* FILTER & COMPARISON TOOLBAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
        
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher un collaborateur..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span>Équipe :</span>
          </div>

          <select
            value={selectedTeamFilter}
            onChange={(e) => setSelectedTeamFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 shadow-2xs cursor-pointer"
          >
            <option value="all">Toutes les équipes ({profiles.length})</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* SIDE-BY-SIDE COMPARATOR (COMPARATEUR DIRECT) */}
      {comparedMembers.length >= 2 && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white border-2 border-indigo-100 shadow-sm flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                  <ArrowUpDown className="w-4 h-4" />
                </span>
                <h4 className="text-base font-bold text-slate-800">
                  Comparateur Direct Côte-à-Côte
                </h4>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Confrontation directe des indicateurs clés entre {comparedMembers.length} membres sélectionnés
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500">
                Sélectionnez jusqu'à 3 membres dans le tableau ci-dessous
              </span>
            </div>
          </div>

          {/* Side by side columns */}
          <div className={`grid grid-cols-1 ${comparedMembers.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'} gap-6`}>
            {comparedMembers.map((m) => {
              const isLeadLeader = m.leadsCount === Math.max(...comparedMembers.map(x => x.leadsCount));
              const isCvrLeader = m.conversionRate === Math.max(...comparedMembers.map(x => x.conversionRate));

              return (
                <div 
                  key={m.profile.id}
                  className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200 flex flex-col gap-5 relative hover:border-indigo-300 transition"
                >
                  {/* Header info */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={m.profile.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&h=400&q=80'}
                        alt={m.profile.firstName}
                        className="w-12 h-12 rounded-2xl object-cover border-2 border-white shadow-sm"
                      />
                      <div>
                        <h5 className="text-sm font-bold text-slate-900">
                          {m.profile.firstName} {m.profile.lastName}
                        </h5>
                        <p className="text-xs text-slate-500 line-clamp-1">{m.profile.headline}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-white text-indigo-700 border border-slate-200">
                          {m.profile.department || 'Commercial'}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => toggleCompare(m.profile.id)}
                      className="text-xs text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                      title="Retirer de la comparaison"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Metrics grid */}
                  <div className="grid grid-cols-2 gap-3">
                    
                    <div className="p-3 rounded-xl bg-white border border-slate-200/80">
                      <p className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                        <Wifi className="w-3 h-3 text-indigo-500" />
                        Cartes Scannées
                      </p>
                      <p className="text-lg font-black text-slate-800 mt-1">{m.scans.toLocaleString('fr-FR')}</p>
                      <p className="text-[10px] text-slate-500">{m.activeCardsCount} carte(s) active(s)</p>
                    </div>

                    <div className={`p-3 rounded-xl bg-white border ${isLeadLeader ? 'border-emerald-300 ring-1 ring-emerald-400' : 'border-slate-200/80'}`}>
                      <p className="text-[10px] text-slate-400 font-semibold flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Target className="w-3 h-3 text-emerald-500" />
                          Leads Capturés
                        </span>
                        {isLeadLeader && <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-1 rounded">#1</span>}
                      </p>
                      <p className="text-lg font-black text-slate-800 mt-1">{m.leadsCount}</p>
                      <p className="text-[10px] text-emerald-600 font-bold">{m.conversionRate.toFixed(1)}% CVR</p>
                    </div>

                    <div className="p-3 rounded-xl bg-white border border-slate-200/80">
                      <p className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                        <PhoneCall className="w-3 h-3 text-blue-500" />
                        Taux de Suivi
                      </p>
                      <p className="text-lg font-black text-slate-800 mt-1">{m.followupRate.toFixed(0)}%</p>
                      <p className="text-[10px] text-slate-500">{m.followedUpCount} relances faites</p>
                    </div>

                    <div className="p-3 rounded-xl bg-white border border-slate-200/80">
                      <p className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                        <Award className="w-3 h-3 text-amber-500" />
                        Deals Gagnés
                      </p>
                      <p className="text-lg font-black text-amber-900 mt-1">{m.wonCount}</p>
                      <p className="text-[10px] text-amber-700 font-semibold">{m.wonRate.toFixed(0)}% closing</p>
                    </div>

                  </div>

                  {/* Channel Mix Visual Bar */}
                  <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-200 text-xs">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                      <span>Mix Sources de capture</span>
                      <span>NFC / QR / Web</span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-slate-200 overflow-hidden flex">
                      <div 
                        className="bg-indigo-600 h-full" 
                        style={{ width: `${m.leadsCount > 0 ? (m.nfcLeads / m.leadsCount) * 100 : 50}%` }}
                        title={`NFC : ${m.nfcLeads} leads`}
                      ></div>
                      <div 
                        className="bg-violet-500 h-full" 
                        style={{ width: `${m.leadsCount > 0 ? (m.qrLeads / m.leadsCount) * 100 : 30}%` }}
                        title={`QR : ${m.qrLeads} leads`}
                      ></div>
                      <div 
                        className="bg-blue-400 h-full" 
                        style={{ width: `${m.leadsCount > 0 ? (m.emailLeads / m.leadsCount) * 100 : 20}%` }}
                        title={`Email/Web : ${m.emailLeads} leads`}
                      ></div>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* PERFORMANCE MATRIX TABLE (CARDS SCANNED VS LEADS CAPTURED) */}
      <div className="rounded-3xl bg-white border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
        
        <div className="p-6 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100">
          <div>
            <h4 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-600" />
              Tableau Comparatif des Performances Individuelles
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Cliquez sur les en-têtes de colonnes pour trier par volume de scans, conversion ou réactivité
            </p>
          </div>

          <span className="text-xs text-slate-400 font-semibold">
            {filteredMembers.length} collaborateur(s) listé(s)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-4 text-center w-10">Comp.</th>
                <th className="py-3.5 px-4">Collaborateur</th>
                <th className="py-3.5 px-4">Équipe / Rôle</th>
                <th 
                  onClick={() => handleSort('scans')}
                  className="py-3.5 px-4 cursor-pointer hover:text-slate-800 transition"
                >
                  <div className="flex items-center gap-1">
                    <span>Cartes Scannées</span>
                    <ArrowUpDown className={`w-3 h-3 ${sortBy === 'scans' ? 'text-indigo-600 font-bold' : 'text-slate-300'}`} />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('leads')}
                  className="py-3.5 px-4 cursor-pointer hover:text-slate-800 transition"
                >
                  <div className="flex items-center gap-1">
                    <span>Prospects Capturés</span>
                    <ArrowUpDown className={`w-3 h-3 ${sortBy === 'leads' ? 'text-indigo-600 font-bold' : 'text-slate-300'}`} />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('cvr')}
                  className="py-3.5 px-4 cursor-pointer hover:text-slate-800 transition"
                >
                  <div className="flex items-center gap-1">
                    <span>Taux de Conversion (CVR)</span>
                    <ArrowUpDown className={`w-3 h-3 ${sortBy === 'cvr' ? 'text-indigo-600 font-bold' : 'text-slate-300'}`} />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('followup')}
                  className="py-3.5 px-4 cursor-pointer hover:text-slate-800 transition"
                >
                  <div className="flex items-center gap-1">
                    <span>Suivis Réalisés</span>
                    <ArrowUpDown className={`w-3 h-3 ${sortBy === 'followup' ? 'text-indigo-600 font-bold' : 'text-slate-300'}`} />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('won')}
                  className="py-3.5 px-4 cursor-pointer hover:text-slate-800 transition"
                >
                  <div className="flex items-center gap-1">
                    <span>Deals Closés</span>
                    <ArrowUpDown className={`w-3 h-3 ${sortBy === 'won' ? 'text-indigo-600 font-bold' : 'text-slate-300'}`} />
                  </div>
                </th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredMembers.map((m, idx) => {
                const isSelected = selectedForCompare.includes(m.profile.id);

                return (
                  <tr 
                    key={m.profile.id}
                    className={`hover:bg-slate-50/80 transition ${
                      isSelected ? 'bg-indigo-50/30' : ''
                    }`}
                  >
                    {/* Checkbox for side by side compare */}
                    <td className="py-4 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleCompare(m.profile.id)}
                        className="rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        title="Comparer ce collaborateur"
                      />
                    </td>

                    {/* Member Name & Avatar */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={m.profile.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&h=400&q=80'}
                          alt={m.profile.firstName}
                          className="w-10 h-10 rounded-xl object-cover border border-slate-200 shadow-2xs"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-800 text-xs">
                              {m.profile.firstName} {m.profile.lastName}
                            </span>
                            {idx === 0 && sortBy === 'leads' && (
                              <span className="px-1.5 py-0.2 rounded-sm text-[9px] font-black bg-amber-100 text-amber-800">
                                #1 TOP
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 block truncate max-w-xs">
                            {m.profile.contacts.email}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Team & Department */}
                    <td className="py-4 px-4">
                      <p className="font-medium text-slate-700 text-xs line-clamp-1">{m.profile.headline}</p>
                      <span className="text-[10px] text-slate-400 font-semibold">{m.profile.department || 'Vente'}</span>
                    </td>

                    {/* Scans Metric */}
                    <td className="py-4 px-4">
                      <div>
                        <span className="font-black text-slate-900 text-sm">
                          {m.scans.toLocaleString('fr-FR')}
                        </span>
                        <div className="w-24 h-1.5 rounded-full bg-slate-200 mt-1 overflow-hidden">
                          <div 
                            className="bg-blue-600 h-full rounded-full" 
                            style={{ width: `${Math.min(100, (m.scans / Math.max(1, teamTotals.topScanner.scans)) * 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>

                    {/* Leads Metric */}
                    <td className="py-4 px-4">
                      <div>
                        <span className="font-black text-emerald-700 text-sm">
                          {m.leadsCount} leads
                        </span>
                        <div className="w-24 h-1.5 rounded-full bg-emerald-100 mt-1 overflow-hidden">
                          <div 
                            className="bg-emerald-600 h-full rounded-full" 
                            style={{ width: `${Math.min(100, (m.leadsCount / Math.max(1, teamTotals.topLeadGen.leadsCount)) * 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>

                    {/* Conversion Rate */}
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black ${
                        m.conversionRate >= 4 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : m.conversionRate >= 2.5
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {m.conversionRate.toFixed(1)} %
                      </span>
                    </td>

                    {/* Follow up Rate */}
                    <td className="py-4 px-4">
                      <span className="font-bold text-slate-800 text-xs">
                        {m.followedUpCount} / {m.leadsCount} ({m.followupRate.toFixed(0)}%)
                      </span>
                    </td>

                    {/* Won Deals */}
                    <td className="py-4 px-4">
                      <span className="font-black text-amber-900 text-xs">
                        {m.wonCount} signés
                      </span>
                    </td>

                    {/* Action button */}
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => toggleCompare(m.profile.id)}
                        className={`py-1.5 px-3 rounded-xl font-bold text-[11px] transition cursor-pointer ${
                          isSelected 
                            ? 'bg-indigo-600 text-white' 
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {isSelected ? 'Sélectionné' : 'Comparer'}
                      </button>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* COACHING & EFFICIENCY QUADRANT SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Department Comparison Bar */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/80 shadow-sm flex flex-col gap-5">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            <h4 className="text-base font-bold text-slate-800">
              Répartition par Département & Équipe
            </h4>
          </div>
          <p className="text-xs text-slate-500">
            Comparaison globale de la dynamique commerciale entre les divisions de l'entreprise.
          </p>

          <div className="flex flex-col gap-4 mt-2">
            {teams.map((t) => {
              const teamMembers = memberMetrics.filter((m) => m.team?.id === t.id);
              const teamScans = teamMembers.reduce((acc, m) => acc + m.scans, 0);
              const teamLeads = teamMembers.reduce((acc, m) => acc + m.leadsCount, 0);
              const teamCvr = teamScans > 0 ? ((teamLeads / teamScans) * 100).toFixed(1) : '0.0';

              return (
                <div key={t.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-bold text-xs text-slate-800">{t.name}</h5>
                      <span className="text-[11px] text-slate-500">{teamMembers.length} collaborateur(s)</span>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-indigo-100 text-indigo-800">
                      CVR : {teamCvr} %
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-200">
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold">Volume Scans</span>
                      <p className="font-bold text-slate-800">{teamScans.toLocaleString('fr-FR')}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold">Leads Générés</span>
                      <p className="font-bold text-emerald-600">{teamLeads} fiches CRM</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Manager Best Practices */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/80 shadow-sm flex flex-col gap-5">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            <h4 className="text-base font-bold text-slate-800">
              Conseils de Pilotage & Coaching Commercial
            </h4>
          </div>
          <p className="text-xs text-slate-500">
            Recommandations managériales basées sur l'analyse comparative des données.
          </p>

          <div className="flex flex-col gap-3 text-xs">
            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-blue-950">Homogénéiser l'usage du NFC</p>
                <p className="text-[11px] text-blue-800 mt-0.5 leading-relaxed">
                  Les collaborateurs ayant un ratio de cartes scannées supérieur à 1 000 génèrent <strong>2.8x plus d'opportunités qualifiées</strong>.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-emerald-950">Réactivité de suivi post-scan</p>
                <p className="text-[11px] text-emerald-800 mt-0.5 leading-relaxed">
                  Encouragez l'utilisation des rappels calendaires directement intégrés pour maintenir un taux de relance supérieur à <strong>80%</strong>.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-100 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-950">Valoriser les meilleurs convertisseurs</p>
                <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                  Partagez les bonnes pratiques d'échange et de pitch de vos tops performeurs lors des réunions d'équipe hebdomadaires.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
