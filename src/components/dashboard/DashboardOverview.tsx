import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Lead, LeadTask, LeadTaskPriority, LeadTaskType } from '../../types';
import { 
  Eye, 
  Wifi, 
  QrCode, 
  Users, 
  TrendingUp, 
  ArrowUpRight, 
  MessageSquare, 
  Mail, 
  Phone, 
  Globe, 
  Download, 
  Calendar, 
  Share2, 
  Sparkles, 
  ChevronRight, 
  ShieldCheck, 
  CreditCard,
  Layers,
  Copy,
  Check,
  Shield,
  KeyRound,
  Bell,
  BellRing,
  AlertCircle,
  Clock,
  CheckCircle2,
  Plus,
  RotateCcw,
  Video,
  FileText,
  Flame,
  CalendarClock,
  LayoutDashboard,
  BarChart3,
  ListTodo,
  CheckSquare2,
  ExternalLink,
  Tag,
  Camera,
  Compass
} from 'lucide-react';
import { downloadVCard } from '../../utils/vcard';
import { getRoleBadge } from '../../utils/permissions';
import { formatReminderTime } from '../../utils/browserNotifications';
import { ScheduleReminderModal } from '../leads/ScheduleReminderModal';
import { CrossedDynamicChart } from '../analytics/CrossedDynamicChart';
import { AcquisitionDonutChart } from '../analytics/AcquisitionDonutChart';
import { ExecutiveDataBrief } from '../analytics/ExecutiveDataBrief';
import { DashboardWidgets } from './DashboardWidgets';

export const DashboardOverview: React.FC = () => {
  const { 
    currentUser, 
    currentOrg, 
    activeProfile, 
    visibleCards, 
    visibleLeads, 
    events, 
    setActiveTab, 
    setPublicProfileSlug, 
    setIsNfcSimModalOpen,
    setIsAuthModalOpen,
    toggleLeadTaskComplete,
    updateLeadDetails,
    setLeadReminder,
    showToast 
  } = useApp();

  // Tab View Mode: 'synthesis' | 'analytics' | 'tasks'
  const [dashboardView, setDashboardView] = useState<'synthesis' | 'analytics' | 'tasks'>('synthesis');
  const [period, setPeriod] = useState<'7j' | '30j' | '90j'>('30j');
  const [taskFilter, setTaskFilter] = useState<'all' | 'overdue' | 'today' | 'upcoming' | 'completed'>('all');
  const [copiedLink, setCopiedLink] = useState(false);
  const [selectedLeadForReminder, setSelectedLeadForReminder] = useState<Lead | null>(null);

  const roleBadge = getRoleBadge(currentUser.role);

  // Derived KPI computations based on scoped data
  const totalViews = activeProfile?.viewsCount || 0;
  const totalScans = activeProfile?.scansCount || 0;
  const totalLeads = visibleLeads.length;
  const conversionRate = totalViews > 0 ? ((totalLeads / totalViews) * 100).toFixed(1) : '0.0';

  // Compute all follow-up tasks & reminders across visible leads
  const reminderItems = useMemo(() => {
    const list: { task: LeadTask; lead: Lead }[] = [];

    visibleLeads.forEach((lead) => {
      if (lead.tasks && lead.tasks.length > 0) {
        lead.tasks.forEach((t) => {
          list.push({ task: t, lead });
        });
      } else if (lead.reminderDate) {
        const syntheticTask: LeadTask = {
          id: `legacy_${lead.id}`,
          leadId: lead.id,
          type: 'followup',
          title: lead.reminderNote || 'Relance commerciale',
          dueDate: lead.reminderDate,
          priority: 'medium',
          note: lead.reminderNote,
          status: (lead.reminderStatus as any) === 'completed' ? 'completed' : 'pending',
          assignedUserId: lead.assignedUserId,
          createdAt: lead.updatedAt || lead.createdAt,
        };
        list.push({ task: syntheticTask, lead });
      }
    });

    // Sort by due date ascending
    list.sort((a, b) => new Date(a.task.dueDate).getTime() - new Date(b.task.dueDate).getTime());
    return list;
  }, [visibleLeads]);

  // Tasks due today or overdue
  const urgentTasks = useMemo(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    return reminderItems.filter(({ task }) => {
      if (task.status === 'completed') return false;
      const dueTime = new Date(task.dueDate).getTime();
      return dueTime <= endOfToday.getTime();
    });
  }, [reminderItems]);

  const overdueTasks = useMemo(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    return reminderItems.filter(({ task }) => {
      return task.status !== 'completed' && new Date(task.dueDate).getTime() < startOfToday.getTime();
    });
  }, [reminderItems]);

  const upcomingTasks = useMemo(() => {
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    return reminderItems.filter(({ task }) => {
      return task.status !== 'completed' && new Date(task.dueDate).getTime() > endOfToday.getTime();
    });
  }, [reminderItems]);

  const completedTasks = useMemo(() => {
    return reminderItems.filter(({ task }) => task.status === 'completed');
  }, [reminderItems]);

  // Filtered tasks for the Tasks Tab
  const displayTasks = useMemo(() => {
    switch (taskFilter) {
      case 'overdue':
        return overdueTasks;
      case 'today':
        return urgentTasks.filter(t => !overdueTasks.some(o => o.task.id === t.task.id));
      case 'upcoming':
        return upcomingTasks;
      case 'completed':
        return completedTasks;
      default:
        return reminderItems;
    }
  }, [taskFilter, reminderItems, overdueTasks, urgentTasks, upcomingTasks, completedTasks]);

  const handleToggleTaskStatus = (lead: Lead, task: LeadTask) => {
    if (task.id.startsWith('legacy_')) {
      const isCompleted = task.status === 'completed';
      updateLeadDetails(lead.id, {
        reminderStatus: isCompleted ? 'pending' : 'completed',
      });
      showToast(isCompleted ? 'Rappel réactivé' : 'Rappel marqué comme effectué !');
    } else {
      toggleLeadTaskComplete(lead.id, task.id);
    }
  };

  const handleSnooze24h = (lead: Lead, task: LeadTask) => {
    const nextDate = new Date(task.dueDate);
    nextDate.setDate(nextDate.getDate() + 1);
    const newIso = nextDate.toISOString();

    if (task.id.startsWith('legacy_')) {
      updateLeadDetails(lead.id, {
        reminderDate: newIso,
        reminderStatus: 'pending',
      });
    } else {
      updateLeadDetails(lead.id, {
        tasks: (lead.tasks || []).map((t) =>
          t.id === task.id ? { ...t, dueDate: newIso, status: 'pending' } : t
        ),
        reminderDate: newIso,
        reminderStatus: 'pending',
      });
    }
    showToast('Relance reportée de 24h (+1 jour)');
  };

  const handleCopyLink = async () => {
    if (!activeProfile?.slug) return;
    const url = `${window.location.origin}/p/${activeProfile.slug}`;
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      showToast('Lien public copié dans le presse-papier !');
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const getTaskIcon = (type: LeadTaskType) => {
    switch (type) {
      case 'call':
        return <Phone className="w-3.5 h-3.5 text-blue-600" />;
      case 'email':
        return <Mail className="w-3.5 h-3.5 text-emerald-600" />;
      case 'meeting':
        return <Video className="w-3.5 h-3.5 text-purple-600" />;
      case 'quote':
        return <FileText className="w-3.5 h-3.5 text-amber-600" />;
      default:
        return <Bell className="w-3.5 h-3.5 text-indigo-600" />;
    }
  };

  const recentLeads = visibleLeads.slice(0, 4);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 flex flex-col gap-4 sm:gap-6 lg:gap-8 text-slate-800">
      
      {/* WELCOME HERO BANNER */}
      <div className="relative rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-8 bg-[#0F172A] text-white shadow-xl shadow-slate-950/20 overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-5 md:gap-6 border border-slate-800">
        <div className="relative z-10 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              {currentOrg.name} • Plan {currentOrg.plan.toUpperCase()}
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${roleBadge.color}`}>
              Espace {roleBadge.label}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Bonjour, {currentUser.name} 👋
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 sm:mt-1.5 leading-relaxed">
            {currentUser.role === 'collaborateur' ? (
              <>Votre espace personnel est synchronisé. Vous pilotez votre profil <span className="font-semibold text-white">{activeProfile?.firstName} {activeProfile?.lastName}</span>, vos cartes NFC et vos relances en cours.</>
            ) : (
              <>Tour de contrôle de votre organisation <span className="font-semibold text-white">{currentOrg.name}</span>. Profil actif : <span className="font-semibold text-white">{activeProfile?.firstName} {activeProfile?.lastName}</span>.</>
            )}
          </p>
        </div>

        {/* Action quick buttons */}
        <div className="relative z-10 flex flex-wrap items-center gap-2 sm:gap-2.5 shrink-0">
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="py-2 px-3 sm:px-3.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 flex items-center gap-2 transition active:scale-95 cursor-pointer shadow-xs"
            title="Gérer les rôles et permissions"
          >
            <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Mon Compte</span>
          </button>

          <button
            onClick={() => setIsNfcSimModalOpen(true)}
            className="py-2 px-3 sm:px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 flex items-center gap-2 transition active:scale-95 cursor-pointer shadow-xs"
          >
            <Wifi className="w-3.5 h-3.5 text-indigo-400 rotate-90" />
            <span>Tester Tap NFC</span>
          </button>

          {activeProfile && (
            <button
              onClick={() => setPublicProfileSlug(activeProfile.slug)}
              className="py-2 px-3.5 sm:px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-900/40 flex items-center gap-2 transition active:scale-95 cursor-pointer"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Voir profil public</span>
            </button>
          )}
        </div>
      </div>

      {/* DASHBOARD SEGMENTED VIEW SWITCHER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-3 p-1.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto p-0.5 no-scrollbar scroll-smooth">
          <button
            onClick={() => setDashboardView('synthesis')}
            className={`py-1.5 sm:py-2 px-3 sm:px-4 rounded-xl font-bold text-xs flex items-center gap-1.5 sm:gap-2 transition whitespace-nowrap cursor-pointer ${
              dashboardView === 'synthesis'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Synthèse & Actions</span>
          </button>

          <button
            onClick={() => setDashboardView('analytics')}
            className={`py-1.5 sm:py-2 px-3 sm:px-4 rounded-xl font-bold text-xs flex items-center gap-1.5 sm:gap-2 transition whitespace-nowrap cursor-pointer ${
              dashboardView === 'analytics'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Performance & Graphiques</span>
          </button>

          <button
            onClick={() => setDashboardView('tasks')}
            className={`py-1.5 sm:py-2 px-3 sm:px-4 rounded-xl font-bold text-xs flex items-center gap-1.5 sm:gap-2 transition whitespace-nowrap cursor-pointer relative ${
              dashboardView === 'tasks'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ListTodo className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Centre des Relances</span>
            {urgentTasks.length > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                dashboardView === 'tasks' ? 'bg-white text-indigo-700' : 'bg-rose-500 text-white'
              }`}>
                {urgentTasks.length}
              </span>
            )}
          </button>
        </div>

        {/* Global Period Filter */}
        <div className="flex items-center gap-1 self-start md:self-auto px-1 sm:px-2">
          {(['7j', '30j', '90j'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`py-1 px-2.5 rounded-lg text-[11px] sm:text-xs font-semibold transition cursor-pointer ${
                period === p
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              {p === '7j' ? '7 jours' : p === '30j' ? '30 jours' : '90 jours'}
            </button>
          ))}
        </div>
      </div>

      {/* KPI METRICS CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
        <div className="p-4 sm:p-5 lg:p-6 rounded-2xl sm:rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-indigo-200 transition">
          <div className="flex items-center justify-between text-slate-500 mb-2 sm:mb-3">
            <span className="text-[11px] sm:text-xs font-semibold">Vues totales</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div>
            <h4 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">{totalViews}</h4>
            <p className="text-[11px] sm:text-xs text-emerald-600 font-semibold flex items-center gap-1 mt-0.5 sm:mt-1">
              <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> +18.4% ce mois
            </p>
          </div>
        </div>

        <div className="p-4 sm:p-5 lg:p-6 rounded-2xl sm:rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-emerald-200 transition">
          <div className="flex items-center justify-between text-slate-500 mb-2 sm:mb-3">
            <span className="text-[11px] sm:text-xs font-semibold">Scans NFC & QR</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Wifi className="w-3.5 h-3.5 sm:w-4 sm:h-4 rotate-90" />
            </div>
          </div>
          <div>
            <h4 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">{totalScans}</h4>
            <p className="text-[11px] sm:text-xs text-emerald-600 font-semibold flex items-center gap-1 mt-0.5 sm:mt-1">
              <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> +24.1% d'engagement
            </p>
          </div>
        </div>

        <div className="p-4 sm:p-5 lg:p-6 rounded-2xl sm:rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-purple-200 transition">
          <div className="flex items-center justify-between text-slate-500 mb-2 sm:mb-3">
            <span className="text-[11px] sm:text-xs font-semibold">Prospects Qualifiés</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div>
            <h4 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">{totalLeads}</h4>
            <p className="text-[11px] sm:text-xs text-purple-600 font-semibold flex items-center gap-1 mt-0.5 sm:mt-1">
              <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> {conversionRate}% conv.
            </p>
          </div>
        </div>

        <div className="p-4 sm:p-5 lg:p-6 rounded-2xl sm:rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-amber-200 transition">
          <div className="flex items-center justify-between text-slate-500 mb-2 sm:mb-3">
            <span className="text-[11px] sm:text-xs font-semibold">Cartes Physiques</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div>
            <h4 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">{visibleCards.length}</h4>
            <p className="text-[11px] sm:text-xs text-slate-500 font-semibold flex items-center gap-1 mt-0.5 sm:mt-1">
              {visibleCards.filter(c => c.status === 'active').length} actives sur le terrain
            </p>
          </div>
        </div>
      </div>

      {/* VIEW 1: SYNTHESIS & IMMEDIATE ACTIONS */}
      {dashboardView === 'synthesis' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
          
          {/* LEFT 8 COLS: URGENT TASKS & RECENT ACTIVITY */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4 sm:gap-6">
            
            {/* URGENT RELANCES TODAY */}
            <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col gap-3 sm:gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                    <BellRing className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base text-slate-900 tracking-tight">
                      Relances Prioritaires
                    </h3>
                    <p className="text-[10px] sm:text-[11px] text-slate-500">
                      Opportunités à relancer aujourd'hui ou en retard
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setDashboardView('tasks')}
                  className="text-[11px] sm:text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
                >
                  <span>Voir tout ({reminderItems.length})</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {urgentTasks.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {urgentTasks.slice(0, 4).map(({ task, lead }) => {
                    const isOverdue = new Date(task.dueDate).getTime() < new Date().setHours(0, 0, 0, 0);
                    return (
                      <div key={task.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 p-2 rounded-2xl transition">
                        <div className="flex items-start gap-3 min-w-0">
                          <button
                            onClick={() => handleToggleTaskStatus(lead, task)}
                            className="mt-0.5 p-1 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition cursor-pointer"
                            title="Marquer comme effectué"
                          >
                            <CheckSquare2 className="w-4 h-4" />
                          </button>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-slate-900 truncate">
                                {lead.firstName} {lead.lastName}
                              </span>
                              {isOverdue ? (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-rose-100 text-rose-800">
                                  En retard
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-indigo-100 text-indigo-800">
                                  Aujourd'hui
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-600 truncate mt-0.5">
                              {task.title || task.note || 'Relance planifiée'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 self-end sm:self-auto">
                          {lead.email && (
                            <a
                              href={`mailto:${lead.email}`}
                              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                              title="Envoyer un email"
                            >
                              <Mail className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {lead.phone && (
                            <a
                              href={`tel:${lead.phone}`}
                              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                              title="Appeler"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <button
                            onClick={() => handleSnooze24h(lead, task)}
                            className="py-1 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition cursor-pointer"
                          >
                            +24h
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center flex flex-col items-center justify-center gap-2 text-slate-400">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                  <p className="text-xs font-bold text-slate-700">Toutes vos relances sont à jour !</p>
                  <p className="text-[11px] text-slate-500 max-w-xs">
                    Aucune opportunité urgente en attente. Vous pouvez planifier une nouvelle relance dès maintenant.
                  </p>
                </div>
              )}
            </div>

            {/* RECENT CAPTURED LEADS */}
            <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col gap-3 sm:gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                    <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base text-slate-900 tracking-tight">
                      Derniers Contacts Capturés
                    </h3>
                    <p className="text-[10px] sm:text-[11px] text-slate-500">
                      Scannés via vos cartes de visite NFC & QR codes
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('leads')}
                  className="text-[11px] sm:text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
                >
                  <span>Gérer CRM</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {recentLeads.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                  {recentLeads.map((lead) => (
                    <div
                      key={lead.id}
                      onClick={() => setActiveTab('leads')}
                      className="p-3 sm:p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/60 hover:border-indigo-300 hover:bg-white transition cursor-pointer flex items-center justify-between gap-2.5 sm:gap-3 shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                          {lead.firstName[0]}{lead.lastName[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-slate-900 truncate">
                            {lead.firstName} {lead.lastName}
                          </p>
                          <p className="text-[10px] text-slate-500 truncate">
                            {lead.company || lead.email}
                          </p>
                        </div>
                      </div>

                      <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase bg-slate-200 text-slate-700 shrink-0">
                        {lead.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-slate-400">
                  Aucun prospect pour le moment. Partagez votre profil ou utilisez le scanner IA.
                </div>
              )}
            </div>

          </div>

          {/* RIGHT 4 COLS: QUICK HUB & TOOLS */}
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-4 sm:gap-6">
            
            {/* Quick Acquisition Shortcuts */}
            <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col gap-3 sm:gap-4">
              <h3 className="font-extrabold text-sm text-slate-900 tracking-tight flex items-center gap-2">
                <Compass className="w-4 h-4 text-indigo-600" />
                <span>Raccourcis Rapides</span>
              </h3>

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setActiveTab('scanner')}
                  className="w-full p-2.5 sm:p-3 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 flex items-center justify-between text-left transition cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 group-hover:text-amber-700 truncate">
                        Scanner Carte Papier IA
                      </p>
                      <p className="text-[10px] text-slate-500 truncate">Numérisation OCR immédiate</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-amber-600 shrink-0" />
                </button>

                <button
                  onClick={() => setActiveTab('cards')}
                  className="w-full p-2.5 sm:p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 flex items-center justify-between text-left transition cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-700 truncate">
                        Mes Cartes NFC & QR
                      </p>
                      <p className="text-[10px] text-slate-500 truncate">Gérer et commander des cartes</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                </button>

                <button
                  onClick={handleCopyLink}
                  className="w-full p-2.5 sm:p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 flex items-center justify-between text-left transition cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center shrink-0 shadow-xs">
                      {copiedLink ? <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-700 truncate">
                        {copiedLink ? 'Lien copié !' : 'Partager Mon Profil'}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate">Copier l'URL publique KardX</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                </button>
              </div>
            </div>

            {/* Executive Data Brief mini */}
            <ExecutiveDataBrief />

          </div>

        </div>
      )}

      {/* VIEW 2: PERFORMANCE & CHARTS */}
      {dashboardView === 'analytics' && (
        <div className="space-y-6">
          <DashboardWidgets
            onNavigateToAnalytics={() => setActiveTab('analytics')}
            onNavigateToLeads={() => setActiveTab('leads')}
            onNavigateToCards={() => setActiveTab('cards')}
          />
        </div>
      )}

      {/* VIEW 3: FULL TASKS & REMINDERS CENTER */}
      {dashboardView === 'tasks' && (
        <div className="p-4 sm:p-6 lg:p-7 rounded-2xl sm:rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col gap-4 sm:gap-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-3 sm:pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-black text-base sm:text-lg text-slate-900 tracking-tight flex items-center gap-2">
                <ListTodo className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
                <span>Centre de Relances & Opportunités</span>
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                Pilotez vos appels, emails et rendez-vous commerciaux planifiés
              </p>
            </div>

            {visibleLeads[0] && (
              <button
                onClick={() => setSelectedLeadForReminder(visibleLeads[0])}
                className="py-2 px-3.5 sm:py-2.5 sm:px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-xs flex items-center gap-2 transition cursor-pointer self-start sm:self-auto shrink-0"
              >
                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Planifier une relance</span>
              </button>
            )}
          </div>

          {/* Sub-Filters Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setTaskFilter('all')}
              className={`py-1.5 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
                taskFilter === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tous ({reminderItems.length})
            </button>
            <button
              onClick={() => setTaskFilter('overdue')}
              className={`py-1.5 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
                taskFilter === 'overdue'
                  ? 'bg-rose-600 text-white'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
              }`}
            >
              🚨 En retard ({overdueTasks.length})
            </button>
            <button
              onClick={() => setTaskFilter('today')}
              className={`py-1.5 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
                taskFilter === 'today'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
              }`}
            >
              ⚡ Aujourd'hui ({urgentTasks.length})
            </button>
            <button
              onClick={() => setTaskFilter('upcoming')}
              className={`py-1.5 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
                taskFilter === 'upcoming'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              ⏳ À venir ({upcomingTasks.length})
            </button>
            <button
              onClick={() => setTaskFilter('completed')}
              className={`py-1.5 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
                taskFilter === 'completed'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              ✅ Terminés ({completedTasks.length})
            </button>
          </div>

          {/* Task Items Table / List */}
          {displayTasks.length > 0 ? (
            <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-2xl overflow-hidden bg-slate-50/40">
              {displayTasks.map(({ task, lead }) => {
                const isCompleted = task.status === 'completed';
                const isOverdue = !isCompleted && new Date(task.dueDate).getTime() < new Date().setHours(0, 0, 0, 0);

                return (
                  <div
                    key={task.id}
                    className={`p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 transition ${
                      isCompleted ? 'bg-slate-50/80 opacity-60' : 'hover:bg-white bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-3 sm:gap-3.5 min-w-0">
                      <button
                        onClick={() => handleToggleTaskStatus(lead, task)}
                        className={`mt-0.5 sm:mt-1 w-5 h-5 rounded-lg border flex items-center justify-center transition cursor-pointer shrink-0 ${
                          isCompleted
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : 'border-slate-300 hover:border-emerald-500'
                        }`}
                        title={isCompleted ? 'Marquer comme non fait' : 'Marquer comme fait'}
                      >
                        {isCompleted && <Check className="w-3.5 h-3.5" />}
                      </button>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                          <span className={`font-bold text-xs text-slate-900 ${isCompleted ? 'line-through' : ''}`}>
                            {task.title || task.note || 'Relance prospect'}
                          </span>
                          <span className="text-[10px] px-2 py-0.2 rounded-full font-bold bg-slate-100 text-slate-600 truncate max-w-[200px]">
                            {lead.firstName} {lead.lastName} {lead.company ? `(${lead.company})` : ''}
                          </span>
                          {isOverdue && (
                            <span className="text-[9px] font-black uppercase px-2 py-0.2 rounded bg-rose-100 text-rose-800">
                              En retard
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 mt-1 sm:mt-1.5 text-[10px] sm:text-[11px] text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {formatReminderTime(task.dueDate)}
                          </span>
                          {task.priority && (
                            <span className={`font-bold uppercase text-[9px] ${
                              task.priority === 'urgent' ? 'text-rose-600' : task.priority === 'high' ? 'text-amber-600' : 'text-slate-500'
                            }`}>
                              Priorité {task.priority}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                      {lead.email && (
                        <a
                          href={`mailto:${lead.email}`}
                          className="py-1 px-2.5 sm:py-1.5 sm:px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Email</span>
                        </a>
                      )}
                      {lead.phone && (
                        <a
                          href={`tel:${lead.phone}`}
                          className="py-1 px-2.5 sm:py-1.5 sm:px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Appel</span>
                        </a>
                      )}
                      {!isCompleted && (
                        <button
                          onClick={() => handleSnooze24h(lead, task)}
                          className="py-1 px-2.5 sm:py-1.5 sm:px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                        >
                          +24h
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
              <CheckSquare2 className="w-10 h-10 text-slate-300" />
              <p className="text-sm font-bold text-slate-700">Aucune tâche trouvée pour ce filtre</p>
            </div>
          )}

        </div>
      )}

      {/* Schedule Reminder Modal */}
      {selectedLeadForReminder && (
        <ScheduleReminderModal
          lead={selectedLeadForReminder}
          isOpen={Boolean(selectedLeadForReminder)}
          onClose={() => setSelectedLeadForReminder(null)}
          onSaveReminder={(dueDate, note, taskDetails) => {
            setLeadReminder(selectedLeadForReminder.id, dueDate, note, taskDetails);
            setSelectedLeadForReminder(null);
            showToast('Relance commerciale planifiée avec succès !');
          }}
        />
      )}

    </div>
  );
};
