import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { User, Profile, Lead, PhysicalCard, Department, Team } from '../../types';
import confetti from 'canvas-confetti';
import { 
  Trophy, 
  Medal, 
  Crown, 
  Flame, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Users, 
  Filter, 
  Search, 
  Download, 
  Sparkles, 
  Share2, 
  QrCode, 
  Smartphone, 
  Target, 
  Award, 
  ChevronRight, 
  CheckCircle2, 
  ExternalLink, 
  Calendar, 
  Zap, 
  Eye, 
  BarChart3, 
  Mail, 
  Phone, 
  ShieldCheck, 
  Building,
  Star,
  PartyPopper,
  X
} from 'lucide-react';
import { getRoleBadge } from '../../utils/permissions';

export type LeaderboardMetric = 'leads' | 'shares' | 'conversion' | 'score';
export type LeaderboardTimeframe = 'today' | '7d' | '30d' | '90d' | 'ytd' | 'all';

interface MemberLeaderboardStats {
  user: User;
  profile?: Profile;
  department?: Department;
  team?: Team;
  rank: number;
  previousRank: number;
  trend: 'up' | 'down' | 'same';
  trendDelta: number;
  leadsCount: number;
  leadsWonCount: number;
  leadsBreakdown: {
    nfc: number;
    qr: number;
    direct: number;
    salon: number;
    wallet: number;
  };
  sharesCount: number;
  nfcScans: number;
  qrScans: number;
  viewsCount: number;
  conversionRate: number;
  kardxScore: number;
  badges: Array<{ id: string; label: string; icon: string; color: string }>;
  activeCardsCount: number;
}

export const TeamLeaderboard: React.FC = () => {
  const { 
    currentUser,
    users, 
    profiles, 
    leads, 
    cards, 
    visibleDepartments: departments, 
    visibleTeams: teams,
    currentOrg,
    showToast,
    setActiveTab,
    setPublicProfileSlug
  } = useApp();

  // Filter States
  const [metric, setMetric] = useState<LeaderboardMetric>('leads');
  const [timeframe, setTimeframe] = useState<LeaderboardTimeframe>('30d');
  const [selectedDeptId, setSelectedDeptId] = useState<string>('all');
  const [selectedTeamId, setSelectedTeamId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [teamMonthlyGoal, setTeamMonthlyGoal] = useState<number>(150);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [tempGoal, setTempGoal] = useState('150');
  
  // Selected Member for deep-dive detail modal
  const [selectedMemberStats, setSelectedMemberStats] = useState<MemberLeaderboardStats | null>(null);

  // Timeframe date filtering helper
  const timeframeFilterDates = useMemo(() => {
    const now = new Date();
    let startDate: Date;

    switch (timeframe) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'ytd':
        startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
        break;
      case 'all':
      default:
        startDate = new Date(2020, 0, 1);
        break;
    }
    return { startDate, endDate: now };
  }, [timeframe]);

  // Compute stats for all users based on selected timeframe
  const rawMemberStats = useMemo(() => {
    const { startDate, endDate } = timeframeFilterDates;
    const isAllTime = timeframe === 'all';
    
    // Multiplier for views/scans baseline when historical logs are proportional
    const timeframeRatio = timeframe === 'today' ? 0.08 :
                           timeframe === '7d' ? 0.28 :
                           timeframe === '30d' ? 1.0 :
                           timeframe === '90d' ? 2.4 :
                           timeframe === 'ytd' ? 4.5 : 5.0;

    return users.map((user) => {
      const userProfile = profiles.find((p) => p.userId === user.id);
      const userDepartment = departments.find((d) => d.id === user.departmentId);
      const userTeam = teams.find((t) => t.id === user.teamId);
      const userCards = cards.filter((c) => c.assignedToUser === user.id || (userProfile && c.profileId === userProfile.id));

      // Filter leads belonging to this user
      const userLeads = leads.filter((l) => {
        const belongsToUser = l.assignedUserId === user.id || (userProfile && l.profileId === userProfile.id);
        if (!belongsToUser) return false;
        
        if (isAllTime) return true;
        const leadDate = new Date(l.createdAt);
        return leadDate >= startDate && leadDate <= endDate;
      });

      // Leads Breakdown
      const nfcLeads = userLeads.filter((l) => l.source === 'nfc').length;
      const qrLeads = userLeads.filter((l) => l.source === 'qr').length;
      const directLeads = userLeads.filter((l) => l.source === 'direct_url' || l.source === 'email_signature').length;
      const salonLeads = userLeads.filter((l) => l.source === 'salon' || l.source === 'card_scanner').length;
      const walletLeads = userLeads.filter((l) => l.source === 'apple_wallet' || l.source === 'google_wallet').length;
      const leadsWon = userLeads.filter((l) => l.status === 'won').length;

      // Base scans and views computed from physical cards and profile
      let baseScans = 0;
      userCards.forEach((c) => {
        baseScans += c.scansCount || 0;
      });
      if (userProfile && userProfile.scansCount) {
        baseScans = Math.max(baseScans, userProfile.scansCount);
      }
      if (baseScans === 0 && userLeads.length > 0) {
        baseScans = userLeads.length * 4;
      }

      const rawViews = userProfile?.viewsCount || (baseScans * 1.5) || 50;

      // Adjusted metrics for timeframe
      const timeframeScans = Math.max(userLeads.length, Math.round(baseScans * timeframeRatio));
      const timeframeViews = Math.max(timeframeScans, Math.round(rawViews * timeframeRatio));
      const totalShares = timeframeScans + timeframeViews;

      const nfcScansCount = Math.round(timeframeScans * 0.65);
      const qrScansCount = timeframeScans - nfcScansCount;

      // Conversion Rate (Leads / Shares)
      const convRate = totalShares > 0 ? Math.min(100, Math.round((userLeads.length / totalShares) * 1000) / 10) : 0;

      // Gamified KardX Score (XP Calculation)
      // Leads (50 pts), Won Leads (100 pts), Scans (5 pts), Views (2 pts), High Conversion Bonus (50 pts)
      const kardxScore = 
        (userLeads.length * 50) + 
        (leadsWon * 100) + 
        (timeframeScans * 5) + 
        (timeframeViews * 2) + 
        (convRate > 15 ? 150 : convRate > 10 ? 80 : 0);

      // Distinctive badges earned
      const badges: Array<{ id: string; label: string; icon: string; color: string }> = [];
      if (userLeads.length >= 8) {
        badges.push({ id: 'lead_machine', label: 'Lead Magnet', icon: '🧲', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' });
      }
      if (nfcLeads >= 3 || nfcScansCount >= 20) {
        badges.push({ id: 'nfc_master', label: 'NFC Master', icon: '⚡', color: 'bg-amber-50 text-amber-700 border-amber-200' });
      }
      if (convRate >= 12) {
        badges.push({ id: 'top_closer', label: 'High Converter', icon: '🎯', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' });
      }
      if (leadsWon >= 1) {
        badges.push({ id: 'deal_maker', label: 'Deal Maker', icon: '🏆', color: 'bg-purple-50 text-purple-700 border-purple-200' });
      }
      if (userCards.filter((c) => c.status === 'active').length >= 2) {
        badges.push({ id: 'multi_card', label: 'Pro Networker', icon: '💳', color: 'bg-sky-50 text-sky-700 border-sky-200' });
      }

      // Pseudo-random but deterministic previous rank simulation for trending arrows
      const pseudoHash = user.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const trendSeed = (pseudoHash + (timeframe === '7d' ? 3 : timeframe === '30d' ? 7 : 1)) % 3;
      const trend: 'up' | 'down' | 'same' = trendSeed === 0 ? 'up' : trendSeed === 1 ? 'down' : 'same';
      const trendDelta = trend === 'same' ? 0 : ((pseudoHash % 3) + 1);

      return {
        user,
        profile: userProfile,
        department: userDepartment,
        team: userTeam,
        rank: 1, // calculated in sort step
        previousRank: 1,
        trend,
        trendDelta,
        leadsCount: userLeads.length,
        leadsWonCount: leadsWon,
        leadsBreakdown: {
          nfc: nfcLeads,
          qr: qrLeads,
          direct: directLeads,
          salon: salonLeads,
          wallet: walletLeads,
        },
        sharesCount: totalShares,
        nfcScans: nfcScansCount,
        qrScans: qrScansCount,
        viewsCount: timeframeViews,
        conversionRate: convRate,
        kardxScore,
        badges,
        activeCardsCount: userCards.filter((c) => c.status === 'active').length,
      };
    });
  }, [users, profiles, leads, cards, departments, teams, timeframe, timeframeFilterDates]);

  // Sort and assign ranks
  const rankedMembers = useMemo(() => {
    const sorted = [...rawMemberStats].sort((a, b) => {
      if (metric === 'leads') {
        if (b.leadsCount !== a.leadsCount) return b.leadsCount - a.leadsCount;
        return b.kardxScore - a.kardxScore;
      }
      if (metric === 'shares') {
        if (b.sharesCount !== a.sharesCount) return b.sharesCount - a.sharesCount;
        return b.leadsCount - a.leadsCount;
      }
      if (metric === 'conversion') {
        if (b.conversionRate !== a.conversionRate) return b.conversionRate - a.conversionRate;
        return b.leadsCount - a.leadsCount;
      }
      if (metric === 'score') {
        if (b.kardxScore !== a.kardxScore) return b.kardxScore - a.kardxScore;
        return b.leadsCount - a.leadsCount;
      }
      return 0;
    });

    return sorted.map((member, index) => {
      const rank = index + 1;
      let previousRank = rank;
      if (member.trend === 'up') {
        previousRank = rank + member.trendDelta;
      } else if (member.trend === 'down') {
        previousRank = Math.max(1, rank - member.trendDelta);
      }
      return {
        ...member,
        rank,
        previousRank,
      };
    });
  }, [rawMemberStats, metric]);

  // Apply filters (department, team, search)
  const filteredLeaderboard = useMemo(() => {
    return rankedMembers.filter((m) => {
      const matchesDept = selectedDeptId === 'all' || m.user.departmentId === selectedDeptId;
      const matchesTeam = selectedTeamId === 'all' || m.user.teamId === selectedTeamId;
      const matchesSearch = 
        m.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.user.position && m.user.position.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (m.department && m.department.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (m.team && m.team.name.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesDept && matchesTeam && matchesSearch;
    });
  }, [rankedMembers, selectedDeptId, selectedTeamId, searchQuery]);

  // Global collective totals
  const totalTeamLeads = useMemo(() => {
    return rawMemberStats.reduce((acc, m) => acc + m.leadsCount, 0);
  }, [rawMemberStats]);

  const totalTeamShares = useMemo(() => {
    return rawMemberStats.reduce((acc, m) => acc + m.sharesCount, 0);
  }, [rawMemberStats]);

  const averageConversionRate = useMemo(() => {
    if (totalTeamShares === 0) return 0;
    return Math.round((totalTeamLeads / totalTeamShares) * 1000) / 10;
  }, [totalTeamLeads, totalTeamShares]);

  // Top 3 Podium Members
  const top1 = filteredLeaderboard[0];
  const top2 = filteredLeaderboard[1];
  const top3 = filteredLeaderboard[2];

  // Highest metric value for relative bar filling
  const highestPrimaryValue = useMemo(() => {
    if (filteredLeaderboard.length === 0) return 1;
    if (metric === 'leads') return Math.max(1, ...filteredLeaderboard.map((m) => m.leadsCount));
    if (metric === 'shares') return Math.max(1, ...filteredLeaderboard.map((m) => m.sharesCount));
    if (metric === 'conversion') return Math.max(1, ...filteredLeaderboard.map((m) => m.conversionRate));
    if (metric === 'score') return Math.max(1, ...filteredLeaderboard.map((m) => m.kardxScore));
    return 1;
  }, [filteredLeaderboard, metric]);

  // Confetti celebration trigger
  const triggerConfettiCelebration = (memberName?: string) => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#4f46e5', '#3b82f6', '#10b981', '#f59e0b', '#ec4899'],
    });
    if (memberName) {
      showToast(`Bravo envoyé à ${memberName} ! 🎉`);
    } else {
      showToast('🎉 Félicitations à toute l\'équipe pour cette belle dynamique commerciale !');
    }
  };

  // Export Leaderboard to CSV
  const handleExportCsv = () => {
    const headers = [
      'Rang',
      'Nom',
      'Email',
      'Poste',
      'Département',
      'Équipe',
      'Leads Générés',
      'Leads NFC',
      'Leads QR',
      'Leads Direct/Salon',
      'Deals Gagnés',
      'Cartes Partagées & Scans',
      'Scans NFC',
      'Scans QR',
      'Taux Conversion (%)',
      'Score KardX (XP)'
    ];

    const rows = filteredLeaderboard.map((m) => [
      m.rank,
      `"${m.user.name}"`,
      `"${m.user.email}"`,
      `"${m.user.position || m.user.jobTitle || 'Collaborateur'}"`,
      `"${m.department?.name || 'Non assigné'}"`,
      `"${m.team?.name || 'Non assignée'}"`,
      m.leadsCount,
      m.leadsBreakdown.nfc,
      m.leadsBreakdown.qr,
      m.leadsBreakdown.direct + m.leadsBreakdown.salon,
      m.leadsWonCount,
      m.sharesCount,
      m.nfcScans,
      m.qrScans,
      `${m.conversionRate}%`,
      m.kardxScore
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + 
      [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `kardx_leaderboard_${timeframe}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Classement de l\'équipe exporté en CSV');
  };

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(tempGoal, 10);
    if (!isNaN(val) && val > 0) {
      setTeamMonthlyGoal(val);
      setIsEditingGoal(false);
      showToast(`Nouvel objectif d'équipe défini : ${val} leads`);
    }
  };

  const goalProgressPercentage = Math.min(100, Math.round((totalTeamLeads / teamMonthlyGoal) * 100));

  return (
    <div className="space-y-8 text-slate-800">
      
      {/* 1. TOP HERO: COLLECTIVE GOAL & TEAM PERFORMANCE KPI */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 text-white p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>Challenge & Performance Commerciale</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                {currentOrg.name}
              </span>
            </div>
            
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Tableau d'Honneur & Classement d'Équipe
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Suivez la conversion de chaque collaborateur en temps réel, stimulez l'émulation collective et récompensez les meilleurs networkers.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => triggerConfettiCelebration()}
              className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition cursor-pointer active:scale-95"
            >
              <PartyPopper className="w-4 h-4" />
              <span>Célébrer l'équipe 🎉</span>
            </button>

            <button
              onClick={handleExportCsv}
              className="py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/15 backdrop-blur-xs flex items-center gap-2 transition cursor-pointer active:scale-95"
            >
              <Download className="w-4 h-4 text-indigo-300" />
              <span>Exporter CSV</span>
            </button>
          </div>
        </div>

        {/* Collective Target Progress Bar */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-8 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 font-bold text-slate-200">
                <Target className="w-4 h-4 text-indigo-400" />
                <span>Objectif Collectif d'Équipe ({timeframe === '30d' ? 'Ce mois' : timeframe === '7d' ? 'Cette semaine' : 'Période'})</span>
                {!isEditingGoal ? (
                  <button
                    onClick={() => {
                      setTempGoal(teamMonthlyGoal.toString());
                      setIsEditingGoal(true);
                    }}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 underline cursor-pointer ml-1"
                  >
                    (Modifier la cible)
                  </button>
                ) : (
                  <form onSubmit={handleSaveGoal} className="inline-flex items-center gap-1.5 ml-1">
                    <input
                      type="number"
                      value={tempGoal}
                      onChange={(e) => setTempGoal(e.target.value)}
                      className="w-16 px-1.5 py-0.5 rounded bg-slate-800 text-white text-xs border border-slate-700 font-bold"
                      autoFocus
                    />
                    <button type="submit" className="text-[10px] bg-indigo-600 px-2 py-0.5 rounded text-white font-bold cursor-pointer">
                      OK
                    </button>
                    <button type="button" onClick={() => setIsEditingGoal(false)} className="text-[10px] text-slate-400 cursor-pointer">
                      Annuler
                    </button>
                  </form>
                )}
              </div>
              <span className="font-extrabold text-amber-400 text-sm">
                {totalTeamLeads} / {teamMonthlyGoal} Leads ({goalProgressPercentage}%)
              </span>
            </div>

            <div className="w-full h-3.5 bg-slate-800/90 rounded-full overflow-hidden p-0.5 border border-slate-700">
              <div 
                className="h-full bg-linear-to-r from-indigo-500 via-purple-500 to-amber-400 rounded-full transition-all duration-700 shadow-sm"
                style={{ width: `${goalProgressPercentage}%` }}
              ></div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>
                {totalTeamLeads >= teamMonthlyGoal ? (
                  <strong className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Objectif atteint avec succès ! 🎉
                  </strong>
                ) : (
                  <span>Encore <strong>{teamMonthlyGoal - totalTeamLeads} leads</strong> pour valider le défi d'équipe !</span>
                )}
              </span>
              <span>{users.length} collaborateurs actifs engagés</span>
            </div>
          </div>

          {/* Mini Summary Stats */}
          <div className="md:col-span-4 grid grid-cols-2 gap-3">
            <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-center">
              <span className="text-[11px] text-slate-400 block font-medium">Total Partages / Scans</span>
              <span className="text-lg font-black text-white">{totalTeamShares}</span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-center">
              <span className="text-[11px] text-slate-400 block font-medium">Taux de Conversion</span>
              <span className="text-lg font-black text-emerald-400">{averageConversionRate}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. FILTER & METRICS SELECTOR TOOLBAR */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 space-y-4">
        
        {/* Top Row: Metric Tabs & Timeframe Selector */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Metric Selector */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-2xl border border-slate-200/80 overflow-x-auto max-w-full">
            <button
              onClick={() => setMetric('leads')}
              className={`py-2 px-3.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                metric === 'leads'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Target className="w-3.5 h-3.5 text-indigo-600" />
              <span>Leads Capturés</span>
            </button>

            <button
              onClick={() => setMetric('shares')}
              className={`py-2 px-3.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                metric === 'shares'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Share2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>Cartes Partagées & Scans</span>
            </button>

            <button
              onClick={() => setMetric('conversion')}
              className={`py-2 px-3.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                metric === 'conversion'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Taux de Transformation (%)</span>
            </button>

            <button
              onClick={() => setMetric('score')}
              className={`py-2 px-3.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                metric === 'score'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              <span>Score KardX XP</span>
            </button>
          </div>

          {/* Timeframe Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 shrink-0 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Période :
            </span>
            <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
              {[
                { id: 'today', label: 'Jour J' },
                { id: '7d', label: '7 jours' },
                { id: '30d', label: '30 jours' },
                { id: '90d', label: 'Trimestre' },
                { id: 'ytd', label: '2026' },
                { id: 'all', label: 'Global' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTimeframe(t.id as LeaderboardTimeframe)}
                  className={`py-1.5 px-2.5 rounded-lg font-semibold transition cursor-pointer ${
                    timeframe === t.id
                      ? 'bg-indigo-600 text-white shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Row: Org Filter Dropdowns & Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 flex-wrap">
          <div className="flex items-center gap-2.5 flex-wrap w-full sm:w-auto">
            {/* Department Filter */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <Building className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedDeptId}
                onChange={(e) => {
                  setSelectedDeptId(e.target.value);
                  setSelectedTeamId('all');
                }}
                className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="all">Tous les Départements ({departments.length})</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            {/* Team Filter */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="all">Toutes les Équipes ({teams.length})</option>
                {(selectedDeptId === 'all' ? teams : teams.filter((t) => t.departmentId === selectedDeptId)).map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher collaborateur..."
              className="w-full pl-9 pr-4 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 shadow-2xs"
            />
          </div>
        </div>
      </div>

      {/* 3. VISUAL PODIUM: TOP 3 PERFORMERS */}
      {filteredLeaderboard.length >= 2 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end pt-4">
          
          {/* SILVER (2ND PLACE) */}
          {top2 && (
            <div className="order-2 md:order-1 relative rounded-3xl bg-linear-to-b from-slate-100 via-white to-slate-50 border border-slate-200/90 p-6 shadow-sm flex flex-col items-center text-center">
              <div className="absolute -top-4 w-9 h-9 rounded-full bg-slate-300 border-2 border-white shadow-md flex items-center justify-center font-black text-slate-700 text-sm">
                🥈
              </div>
              
              <div className="relative mt-2 mb-3">
                <img
                  src={top2.user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80'}
                  alt={top2.user.name}
                  className="w-20 h-20 rounded-full object-cover border-3 border-slate-300 shadow-sm"
                />
                <span className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-slate-200 text-slate-800 font-extrabold text-[11px] flex items-center justify-center border-2 border-white shadow-xs">
                  #2
                </span>
              </div>

              <h4 className="font-bold text-slate-800 text-base">{top2.user.name}</h4>
              <p className="text-xs text-slate-500 truncate max-w-full mb-3">
                {top2.user.position || top2.user.jobTitle || 'Collaborateur'}
              </p>

              {top2.department && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-200 text-slate-700 mb-3">
                  {top2.department.name}
                </span>
              )}

              {/* Stat Highlight */}
              <div className="w-full p-3 rounded-2xl bg-white border border-slate-200/80 mb-3">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  {metric === 'leads' ? 'Leads Générés' :
                   metric === 'shares' ? 'Partages & Scans' :
                   metric === 'conversion' ? 'Taux de Transformation' : 'Score KardX XP'}
                </span>
                <span className="text-2xl font-black text-slate-800">
                  {metric === 'leads' ? `${top2.leadsCount} leads` :
                   metric === 'shares' ? `${top2.sharesCount} partages` :
                   metric === 'conversion' ? `${top2.conversionRate}%` : `${top2.kardxScore} XP`}
                </span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  {top2.leadsWonCount > 0 ? `${top2.leadsWonCount} deal(s) closé(s)` : `${top2.sharesCount} interactions`}
                </span>
              </div>

              <button
                onClick={() => triggerConfettiCelebration(top2.user.name)}
                className="text-xs text-slate-600 hover:text-indigo-600 font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <span>Féliciter 👏</span>
              </button>
            </div>
          )}

          {/* GOLD (1ST PLACE - PODIUM CHAMPION) */}
          {top1 && (
            <div className="order-1 md:order-2 relative rounded-3xl bg-linear-to-b from-amber-50/80 via-white to-amber-50/30 border-2 border-amber-400/80 p-7 shadow-lg flex flex-col items-center text-center -translate-y-2">
              <div className="absolute -top-6 w-12 h-12 rounded-full bg-linear-to-tr from-amber-400 to-yellow-300 border-3 border-white shadow-lg flex items-center justify-center font-black text-slate-900 text-lg">
                <Crown className="w-6 h-6 text-amber-950 fill-amber-400" />
              </div>

              <span className="mt-2 px-3 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300 mb-2">
                Leader de l'Organisation 🥇
              </span>

              <div className="relative mb-3">
                <img
                  src={top1.user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=140&h=140&q=80'}
                  alt={top1.user.name}
                  className="w-24 h-24 rounded-full object-cover border-4 border-amber-400 shadow-md ring-4 ring-amber-100"
                />
                <span className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-amber-500 text-white font-black text-xs flex items-center justify-center border-2 border-white shadow-xs">
                  #1
                </span>
              </div>

              <h4 className="font-extrabold text-slate-900 text-lg">{top1.user.name}</h4>
              <p className="text-xs text-slate-500 truncate max-w-full mb-3 font-medium">
                {top1.user.position || top1.user.jobTitle || 'Collaborateur'}
              </p>

              {top1.department && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100/70 text-amber-800 border border-amber-200 mb-3">
                  {top1.department.name}
                </span>
              )}

              {/* Primary Score Box */}
              <div className="w-full p-4 rounded-2xl bg-amber-50/70 border border-amber-200 mb-4 shadow-2xs">
                <span className="text-[11px] font-extrabold text-amber-800 uppercase tracking-wider block">
                  {metric === 'leads' ? 'Total Leads Qualifiés' :
                   metric === 'shares' ? 'Total Partages & Scans' :
                   metric === 'conversion' ? 'Taux de Transformation' : 'Score Global KardX'}
                </span>
                <span className="text-3xl font-black text-amber-950 block my-0.5">
                  {metric === 'leads' ? `${top1.leadsCount} leads` :
                   metric === 'shares' ? `${top1.sharesCount} partages` :
                   metric === 'conversion' ? `${top1.conversionRate}%` : `${top1.kardxScore} XP`}
                </span>
                <div className="flex items-center justify-center gap-2 text-xs font-semibold text-amber-800">
                  <span>⚡ {top1.conversionRate}% conv.</span>
                  <span>•</span>
                  <span>💳 {top1.sharesCount} scans</span>
                </div>
              </div>

              <button
                onClick={() => triggerConfettiCelebration(top1.user.name)}
                className="w-full py-2 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                <span>Envoyer des félicitations</span>
              </button>
            </div>
          )}

          {/* BRONZE (3RD PLACE) */}
          {top3 && (
            <div className="order-3 relative rounded-3xl bg-linear-to-b from-amber-50/30 via-white to-slate-50 border border-amber-200/70 p-6 shadow-sm flex flex-col items-center text-center">
              <div className="absolute -top-4 w-9 h-9 rounded-full bg-amber-700/80 border-2 border-white shadow-md flex items-center justify-center font-black text-white text-sm">
                🥉
              </div>

              <div className="relative mt-2 mb-3">
                <img
                  src={top3.user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80'}
                  alt={top3.user.name}
                  className="w-20 h-20 rounded-full object-cover border-3 border-amber-600/60 shadow-sm"
                />
                <span className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-amber-700 text-white font-extrabold text-[11px] flex items-center justify-center border-2 border-white shadow-xs">
                  #3
                </span>
              </div>

              <h4 className="font-bold text-slate-800 text-base">{top3.user.name}</h4>
              <p className="text-xs text-slate-500 truncate max-w-full mb-3">
                {top3.user.position || top3.user.jobTitle || 'Collaborateur'}
              </p>

              {top3.department && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-200 text-slate-700 mb-3">
                  {top3.department.name}
                </span>
              )}

              {/* Stat Highlight */}
              <div className="w-full p-3 rounded-2xl bg-white border border-slate-200/80 mb-3">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  {metric === 'leads' ? 'Leads Générés' :
                   metric === 'shares' ? 'Partages & Scans' :
                   metric === 'conversion' ? 'Taux de Transformation' : 'Score KardX XP'}
                </span>
                <span className="text-2xl font-black text-slate-800">
                  {metric === 'leads' ? `${top3.leadsCount} leads` :
                   metric === 'shares' ? `${top3.sharesCount} partages` :
                   metric === 'conversion' ? `${top3.conversionRate}%` : `${top3.kardxScore} XP`}
                </span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  {top3.leadsWonCount > 0 ? `${top3.leadsWonCount} deal(s) closé(s)` : `${top3.sharesCount} interactions`}
                </span>
              </div>

              <button
                onClick={() => triggerConfettiCelebration(top3.user.name)}
                className="text-xs text-slate-600 hover:text-indigo-600 font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <span>Féliciter 👏</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* 4. FULL LEADERBOARD ROSTER TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        
        {/* Table Header Controls */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3 bg-slate-50/60">
          <div>
            <h4 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-600" />
              <span>Classement Exhaustif des Collaborateurs</span>
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Classement calculé sur la période ({timeframe === 'today' ? 'Aujourd\'hui' : timeframe === '7d' ? '7 derniers jours' : timeframe === '30d' ? '30 derniers jours' : timeframe === '90d' ? 'Trimestre' : timeframe === 'ytd' ? 'Année en cours' : 'Historique complet'}).
            </p>
          </div>

          <span className="text-xs text-slate-500 font-semibold">
            {filteredLeaderboard.length} collaborateur(s) classé(s)
          </span>
        </div>

        {/* Table Content */}
        {filteredLeaderboard.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="font-bold text-sm text-slate-700">Aucun collaborateur ne correspond à ces critères</p>
            <p className="text-xs text-slate-400 mt-1">Essayez d'ajuster votre recherche ou vos filtres de département.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4 text-center w-16">Rang</th>
                  <th className="py-3.5 px-4">Collaborateur</th>
                  <th className="py-3.5 px-4">Département & Équipe</th>
                  <th className="py-3.5 px-4 text-center">
                    {metric === 'leads' ? '🎯 Leads Capturés' :
                     metric === 'shares' ? '💳 Cartes & Scans' :
                     metric === 'conversion' ? '⚡ Taux Conversion' : '🏆 Score KardX XP'}
                  </th>
                  <th className="py-3.5 px-4 text-center">Répartition Canaux</th>
                  <th className="py-3.5 px-4 text-center">Badges Obtenus</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLeaderboard.map((m) => {
                  const isTop1 = m.rank === 1;
                  const isTop2 = m.rank === 2;
                  const isTop3 = m.rank === 3;
                  const primaryVal = metric === 'leads' ? m.leadsCount :
                                     metric === 'shares' ? m.sharesCount :
                                     metric === 'conversion' ? m.conversionRate : m.kardxScore;
                  
                  const barPercentage = Math.min(100, Math.max(8, Math.round((primaryVal / highestPrimaryValue) * 100)));

                  return (
                    <tr 
                      key={m.user.id} 
                      className={`hover:bg-slate-50/80 transition ${
                        isTop1 ? 'bg-amber-50/20' : ''
                      }`}
                    >
                      {/* Rank Column */}
                      <td className="py-4 px-4 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <span className={`w-8 h-8 rounded-2xl flex items-center justify-center font-black text-xs ${
                            isTop1 ? 'bg-amber-100 text-amber-900 border border-amber-300 font-extrabold shadow-xs' :
                            isTop2 ? 'bg-slate-200 text-slate-800 border border-slate-300 font-bold' :
                            isTop3 ? 'bg-amber-800/20 text-amber-900 border border-amber-700/30 font-bold' :
                            'bg-slate-100 text-slate-700 font-bold'
                          }`}>
                            {isTop1 ? '🥇' : isTop2 ? '🥈' : isTop3 ? '🥉' : `#${m.rank}`}
                          </span>

                          {/* Trend indicator */}
                          <div className="flex items-center gap-0.5 mt-1 text-[10px]">
                            {m.trend === 'up' && (
                              <span className="text-emerald-600 font-bold flex items-center">
                                <TrendingUp className="w-3 h-3" />+{m.trendDelta}
                              </span>
                            )}
                            {m.trend === 'down' && (
                              <span className="text-rose-500 font-bold flex items-center">
                                <TrendingDown className="w-3 h-3" />-{m.trendDelta}
                              </span>
                            )}
                            {m.trend === 'same' && (
                              <span className="text-slate-400 flex items-center">
                                <Minus className="w-3 h-3" />
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Member Info */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative shrink-0">
                            <img
                              src={m.user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&h=80&q=80'}
                              alt={m.user.name}
                              className="w-10 h-10 rounded-full object-cover border border-slate-200"
                            />
                            {m.activeCardsCount > 0 && (
                              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-indigo-600 text-white text-[9px] flex items-center justify-center font-bold" title={`${m.activeCardsCount} carte(s) active(s)`}>
                                {m.activeCardsCount}
                              </span>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-800 text-sm">{m.user.name}</span>
                              {m.user.id === currentUser.id && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] bg-indigo-100 text-indigo-700 font-bold">
                                  Vous
                                </span>
                              )}
                              {getRoleBadge(m.user.role)}
                            </div>
                            <p className="text-xs text-slate-500 truncate max-w-[200px]">
                              {m.user.position || m.user.jobTitle || 'Collaborateur'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Department & Team */}
                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-700">{m.department?.name || 'Général'}</span>
                          <span className="text-[11px] text-slate-400">{m.team?.name || 'Équipe principale'}</span>
                        </div>
                      </td>

                      {/* Primary Metric & Visual Bar */}
                      <td className="py-4 px-4">
                        <div className="flex flex-col gap-1 min-w-[140px]">
                          <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                            <span>
                              {metric === 'leads' ? `${m.leadsCount} leads` :
                               metric === 'shares' ? `${m.sharesCount} partages` :
                               metric === 'conversion' ? `${m.conversionRate}%` : `${m.kardxScore} XP`}
                            </span>
                            <span className="text-[10px] text-slate-400 font-normal">
                              {metric === 'leads' ? `(${m.sharesCount} scans)` :
                               metric === 'shares' ? `(${m.leadsCount} leads)` :
                               metric === 'conversion' ? `(${m.leadsCount}/${m.sharesCount})` : `${m.leadsCount} leads`}
                            </span>
                          </div>

                          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                isTop1 ? 'bg-amber-500' :
                                isTop2 ? 'bg-slate-400' :
                                isTop3 ? 'bg-amber-700' : 'bg-indigo-600'
                              }`}
                              style={{ width: `${barPercentage}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>

                      {/* Channels Breakdown */}
                      <td className="py-4 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5 text-[11px]">
                          <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-semibold" title={`${m.leadsBreakdown.nfc} leads via NFC Sans contact`}>
                            ⚡ {m.leadsBreakdown.nfc} NFC
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-semibold" title={`${m.leadsBreakdown.qr} leads via QR Code`}>
                            📱 {m.leadsBreakdown.qr} QR
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold" title={`${m.leadsBreakdown.direct + m.leadsBreakdown.salon} leads via Salons/Direct`}>
                            🌐 {m.leadsBreakdown.direct + m.leadsBreakdown.salon} Direct
                          </span>
                        </div>
                      </td>

                      {/* Badges */}
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center gap-1 flex-wrap max-w-[150px] mx-auto">
                          {m.badges.map((b) => (
                            <span
                              key={b.id}
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${b.color}`}
                              title={b.label}
                            >
                              {b.icon} {b.label}
                            </span>
                          ))}
                          {m.badges.length === 0 && (
                            <span className="text-[10px] text-slate-400">En cours...</span>
                          )}
                        </div>
                      </td>

                      {/* Action buttons */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => triggerConfettiCelebration(m.user.name)}
                            className="p-1.5 rounded-xl hover:bg-amber-50 text-slate-400 hover:text-amber-600 transition cursor-pointer"
                            title="Envoyer un bravo"
                          >
                            <Sparkles className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setSelectedMemberStats(m)}
                            className="py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 font-semibold text-xs transition cursor-pointer flex items-center gap-1"
                          >
                            <span>Détails</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. TEAM INSIGHTS & BEST PRACTICES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Insight 1: Best Channel */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h5 className="font-bold text-slate-800 text-sm">Canal N°1 de Conversion</h5>
              <span className="text-xs text-slate-400">Technologie Sans Contact NFC</span>
            </div>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Le tap NFC physique génère un taux de transformation moyen de <strong>24.8%</strong>, soit 2.5x plus que les QR codes imprimés sur papier.
          </p>
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-indigo-600 font-bold">
            <span>68% des leads proviennent du NFC</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        {/* Insight 2: Top Department */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h5 className="font-bold text-slate-800 text-sm">Département Leader</h5>
              <span className="text-xs text-slate-400">Direction Commerciale & Partenariats</span>
            </div>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Le département Commercial a généré <strong>{Math.round(totalTeamLeads * 0.55)} leads</strong> ce mois-ci, enregistrant la plus forte progression trimestrielle (+34%).
          </p>
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-emerald-600 font-bold">
            <span>Top volume de rendez-vous pris</span>
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>

        {/* Insight 3: Quick Action */}
        <div className="p-6 rounded-3xl bg-linear-to-br from-indigo-900 to-slate-900 text-white shadow-md flex flex-col justify-between gap-4">
          <div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 mb-2 inline-block">
              Conseil Coaching Manager
            </span>
            <h5 className="font-bold text-white text-base">Équiper les nouveaux arrivants</h5>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Assurez-vous que chaque collaborateur a configuré sa carte Apple/Google Wallet et sa signature email pour maximiser la portée.
            </p>
          </div>
          
          <button
            onClick={() => setActiveTab('cards')}
            className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-sm"
          >
            <Share2 className="w-4 h-4" />
            <span>Gérer le stock de cartes physiques</span>
          </button>
        </div>

      </div>

      {/* 6. MEMBER DETAIL DEEP-DIVE MODAL */}
      {selectedMemberStats && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="p-6 bg-slate-900 text-white relative flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <img
                  src={selectedMemberStats.user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80'}
                  alt={selectedMemberStats.user.name}
                  className="w-14 h-14 rounded-full object-cover border-2 border-indigo-400"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-lg font-bold text-white">{selectedMemberStats.user.name}</h4>
                    <span className="px-2 py-0.2 rounded-full text-xs font-black bg-amber-400 text-slate-950">
                      Rang #{selectedMemberStats.rank}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {selectedMemberStats.user.position || selectedMemberStats.user.jobTitle || 'Collaborateur'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedMemberStats(null)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs">
              
              {/* Stat Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-2xl bg-indigo-50 border border-indigo-100 text-center">
                  <span className="text-[10px] font-bold text-indigo-600 uppercase block">Leads</span>
                  <span className="text-xl font-black text-indigo-950">{selectedMemberStats.leadsCount}</span>
                </div>
                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-100 text-center">
                  <span className="text-[10px] font-bold text-amber-600 uppercase block">Scans / Vues</span>
                  <span className="text-xl font-black text-amber-950">{selectedMemberStats.sharesCount}</span>
                </div>
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-100 text-center">
                  <span className="text-[10px] font-bold text-emerald-600 uppercase block">Taux Conv.</span>
                  <span className="text-xl font-black text-emerald-950">{selectedMemberStats.conversionRate}%</span>
                </div>
                <div className="p-3 rounded-2xl bg-purple-50 border border-purple-100 text-center">
                  <span className="text-[10px] font-bold text-purple-600 uppercase block">Score XP</span>
                  <span className="text-xl font-black text-purple-950">{selectedMemberStats.kardxScore}</span>
                </div>
              </div>

              {/* Source Breakdown */}
              <div className="space-y-2">
                <h5 className="font-bold text-slate-800 flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-indigo-600" />
                  <span>Origine des contacts collectés</span>
                </h5>
                <div className="space-y-1.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5 text-indigo-600" /> NFC Sans contact
                    </span>
                    <strong className="text-slate-800">{selectedMemberStats.leadsBreakdown.nfc} leads</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 flex items-center gap-1.5">
                      <QrCode className="w-3.5 h-3.5 text-purple-600" /> Flash QR Code
                    </span>
                    <strong className="text-slate-800">{selectedMemberStats.leadsBreakdown.qr} leads</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 flex items-center gap-1.5">
                      <Share2 className="w-3.5 h-3.5 text-slate-600" /> Salons, Événements & URL Directe
                    </span>
                    <strong className="text-slate-800">{selectedMemberStats.leadsBreakdown.direct + selectedMemberStats.leadsBreakdown.salon} leads</strong>
                  </div>
                </div>
              </div>

              {/* Badges unlocked */}
              <div className="space-y-2">
                <h5 className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-500" />
                  <span>Badges & Distinctions Débloquées</span>
                </h5>
                <div className="flex flex-wrap gap-2">
                  {selectedMemberStats.badges.map((b) => (
                    <span key={b.id} className={`px-3 py-1 rounded-xl text-xs font-bold border flex items-center gap-1.5 ${b.color}`}>
                      <span>{b.icon}</span>
                      <span>{b.label}</span>
                    </span>
                  ))}
                  {selectedMemberStats.badges.length === 0 && (
                    <span className="text-slate-500 italic">Aucun badge particulier débloqué pour le moment.</span>
                  )}
                </div>
              </div>

              {/* Quick Actions inside modal */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    triggerConfettiCelebration(selectedMemberStats.user.name);
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Féliciter</span>
                </button>

                {selectedMemberStats.profile && (
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedMemberStats.profile) {
                        setPublicProfileSlug(selectedMemberStats.profile.slug);
                        setSelectedMemberStats(null);
                      }
                    }}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Voir sa carte KardX</span>
                  </button>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};
