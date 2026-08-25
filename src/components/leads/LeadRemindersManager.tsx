import React, { useState, useMemo } from 'react';
import { Lead, LeadTask, LeadTaskPriority, LeadTaskType, User } from '../../types';
import { useApp } from '../../context/AppContext';
import { 
  Bell, 
  BellRing, 
  Calendar, 
  CalendarClock, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Phone, 
  Mail, 
  Plus, 
  Search, 
  Filter, 
  Check, 
  Trash2, 
  MoreVertical, 
  User as UserIcon, 
  Building, 
  Sparkles, 
  ExternalLink,
  ChevronRight,
  ArrowUpRight,
  Flame,
  CheckCircle,
  FileText,
  Video,
  Layers,
  RotateCcw,
  Tag
} from 'lucide-react';
import { formatReminderTime } from '../../utils/browserNotifications';

interface LeadRemindersManagerProps {
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
  onOpenScheduleModal: (lead: Lead) => void;
}

export const LeadRemindersManager: React.FC<LeadRemindersManagerProps> = ({
  leads,
  onSelectLead,
  onOpenScheduleModal,
}) => {
  const { 
    currentUser, 
    users, 
    updateLeadDetails, 
    toggleLeadTaskComplete, 
    deleteLeadTask, 
    addLeadTask, 
    showToast 
  } = useApp();

  const [activeFilter, setActiveFilter] = useState<'all' | 'today' | 'overdue' | 'upcoming' | 'completed'>('all');
  const [selectedTaskType, setSelectedTaskType] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Quick Task Creation Modal state
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [targetLeadId, setTargetLeadId] = useState<string>(leads[0]?.id || '');
  const [taskTitle, setTaskTitle] = useState('Relance téléphonique de suivi');
  const [taskType, setTaskType] = useState<LeadTaskType>('call');
  const [taskPriority, setTaskPriority] = useState<LeadTaskPriority>('high');
  const [taskDate, setTaskDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [taskTime, setTaskTime] = useState('10:00');
  const [taskNote, setTaskNote] = useState('');

  // Extract all tasks across leads + synthetic tasks from legacy reminderDate
  const allTasks = useMemo(() => {
    const list: { task: LeadTask; lead: Lead }[] = [];

    leads.forEach((lead) => {
      // 1. Explicit tasks in lead.tasks
      if (lead.tasks && lead.tasks.length > 0) {
        lead.tasks.forEach((t) => {
          list.push({ task: t, lead });
        });
      } 
      // 2. Fallback / legacy reminderDate if no explicit tasks
      else if (lead.reminderDate) {
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
  }, [leads]);

  // Summary statistics
  const stats = useMemo(() => {
    const now = Date.now();
    let todayCount = 0;
    let overdueCount = 0;
    let upcomingCount = 0;
    let completedCount = 0;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    allTasks.forEach(({ task }) => {
      if (task.status === 'completed') {
        completedCount++;
        return;
      }
      const dueTime = new Date(task.dueDate).getTime();
      if (dueTime < startOfToday.getTime()) {
        overdueCount++;
      } else if (dueTime <= endOfToday.getTime()) {
        todayCount++;
      } else {
        upcomingCount++;
      }
    });

    return {
      total: allTasks.length,
      today: todayCount,
      overdue: overdueCount,
      upcoming: upcomingCount,
      completed: completedCount,
      pending: todayCount + overdueCount + upcomingCount,
    };
  }, [allTasks]);

  // Filtered task list
  const filteredTasks = useMemo(() => {
    const now = Date.now();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    return allTasks.filter(({ task, lead }) => {
      const dueTime = new Date(task.dueDate).getTime();
      const isOverdue = task.status !== 'completed' && dueTime < startOfToday.getTime();
      const isToday = task.status !== 'completed' && dueTime >= startOfToday.getTime() && dueTime <= endOfToday.getTime();
      const isUpcoming = task.status !== 'completed' && dueTime > endOfToday.getTime();

      // Tab filter
      if (activeFilter === 'today' && !isToday) return false;
      if (activeFilter === 'overdue' && !isOverdue) return false;
      if (activeFilter === 'upcoming' && !isUpcoming) return false;
      if (activeFilter === 'completed' && task.status !== 'completed') return false;

      // Type filter
      if (selectedTaskType !== 'all' && task.type !== selectedTaskType) return false;

      // Priority filter
      if (selectedPriority !== 'all' && task.priority !== selectedPriority) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesLead = `${lead.firstName} ${lead.lastName}`.toLowerCase().includes(q) ||
          (lead.company && lead.company.toLowerCase().includes(q)) ||
          lead.email.toLowerCase().includes(q);
        const matchesTask = task.title.toLowerCase().includes(q) ||
          (task.note && task.note.toLowerCase().includes(q));
        if (!matchesLead && !matchesTask) return false;
      }

      return true;
    });
  }, [allTasks, activeFilter, selectedTaskType, selectedPriority, searchQuery]);

  const handleToggleTaskStatus = (lead: Lead, task: LeadTask) => {
    if (task.id.startsWith('legacy_')) {
      // Update legacy reminder
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
    showToast('Tâche reportée de 24 heures (+1j)');
  };

  const handleDeleteTask = (lead: Lead, task: LeadTask) => {
    if (task.id.startsWith('legacy_')) {
      updateLeadDetails(lead.id, {
        reminderDate: undefined,
        reminderNote: undefined,
        reminderStatus: undefined,
      });
    } else {
      deleteLeadTask(lead.id, task.id);
    }
    showToast('Rappel supprimé');
  };

  const handleCreateNewTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetLeadId || !taskTitle.trim() || !taskDate) return;

    const [yyyy, mm, dd] = taskDate.split('-').map(Number);
    const [hh, min] = taskTime.split(':').map(Number);
    const fullDate = new Date(yyyy, mm - 1, dd, hh || 9, min || 0, 0);

    addLeadTask(targetLeadId, {
      type: taskType,
      title: taskTitle.trim(),
      dueDate: fullDate.toISOString(),
      priority: taskPriority,
      note: taskNote.trim(),
      status: 'pending',
      assignedUserId: currentUser.id,
    });

    setIsCreateTaskOpen(false);
    setTaskTitle('Relance téléphonique de suivi');
    setTaskNote('');
  };

  const getTaskTypeBadge = (type: LeadTaskType) => {
    switch (type) {
      case 'call':
        return {
          icon: <Phone className="w-3.5 h-3.5 text-blue-600" />,
          label: 'Appel Téléphonique',
          badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
        };
      case 'email':
        return {
          icon: <Mail className="w-3.5 h-3.5 text-emerald-600" />,
          label: 'Email / Message',
          badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        };
      case 'meeting':
        return {
          icon: <Video className="w-3.5 h-3.5 text-purple-600" />,
          label: 'Rendez-vous / Visio',
          badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
        };
      case 'quote':
        return {
          icon: <FileText className="w-3.5 h-3.5 text-amber-600" />,
          label: 'Envoi Devis / Offre',
          badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
        };
      case 'demo':
        return {
          icon: <Sparkles className="w-3.5 h-3.5 text-indigo-600" />,
          label: 'Démonstration KardX',
          badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        };
      default:
        return {
          icon: <Bell className="w-3.5 h-3.5 text-slate-600" />,
          label: 'Relance commerciale',
          badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
        };
    }
  };

  const getPriorityBadge = (priority: LeadTaskPriority) => {
    switch (priority) {
      case 'high':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
            <Flame className="w-3 h-3 text-rose-600" />
            Urgente / Haute
          </span>
        );
      case 'low':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            Basse
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            Normale
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* KPI METRICS OVERVIEW CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* À traiter aujourd'hui */}
        <div 
          onClick={() => setActiveFilter('today')}
          className={`p-5 rounded-3xl border transition cursor-pointer flex flex-col justify-between ${
            activeFilter === 'today'
              ? 'bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-500/20'
              : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">À faire aujourd'hui</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-indigo-700 tracking-tight">
              {stats.today}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Relances programmées ce jour
            </p>
          </div>
        </div>

        {/* En retard / Alertes */}
        <div 
          onClick={() => setActiveFilter('overdue')}
          className={`p-5 rounded-3xl border transition cursor-pointer flex flex-col justify-between ${
            activeFilter === 'overdue'
              ? 'bg-rose-50/70 border-rose-300 ring-2 ring-rose-500/20'
              : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">En retard</span>
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-rose-600 tracking-tight">
              {stats.overdue}
            </p>
            <p className="text-xs text-rose-600/80 mt-1 font-medium">
              {stats.overdue > 0 ? 'Nécessite une action immédiate' : 'Aucun retard'}
            </p>
          </div>
        </div>

        {/* À venir */}
        <div 
          onClick={() => setActiveFilter('upcoming')}
          className={`p-5 rounded-3xl border transition cursor-pointer flex flex-col justify-between ${
            activeFilter === 'upcoming'
              ? 'bg-blue-50/70 border-blue-300 ring-2 ring-blue-500/20'
              : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">À venir</span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
              {stats.upcoming}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Planifiées les prochains jours
            </p>
          </div>
        </div>

        {/* Terminées */}
        <div 
          onClick={() => setActiveFilter('completed')}
          className={`p-5 rounded-3xl border transition cursor-pointer flex flex-col justify-between ${
            activeFilter === 'completed'
              ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-500/20'
              : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Réalisées</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 tracking-tight">
              {stats.completed}
            </p>
            <p className="text-xs text-emerald-600/80 mt-1 font-medium">
              Relances complétées
            </p>
          </div>
        </div>
      </div>

      {/* ACTION BAR & FILTER CONTROLS */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-4">
        
        {/* Filter Tabs */}
        <div className="flex items-center flex-wrap gap-1.5 w-full lg:w-auto">
          <button
            onClick={() => setActiveFilter('all')}
            className={`py-1.5 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Toutes ({stats.total})
          </button>
          <button
            onClick={() => setActiveFilter('today')}
            className={`py-1.5 px-3 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeFilter === 'today'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Aujourd'hui ({stats.today})</span>
          </button>
          <button
            onClick={() => setActiveFilter('overdue')}
            className={`py-1.5 px-3 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeFilter === 'overdue'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 hover:bg-rose-100 text-rose-700'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>En retard ({stats.overdue})</span>
          </button>
          <button
            onClick={() => setActiveFilter('upcoming')}
            className={`py-1.5 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeFilter === 'upcoming'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-blue-50 hover:bg-blue-100 text-blue-700'
            }`}
          >
            À venir ({stats.upcoming})
          </button>
          <button
            onClick={() => setActiveFilter('completed')}
            className={`py-1.5 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeFilter === 'completed'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
            }`}
          >
            Terminées ({stats.completed})
          </button>
        </div>

        {/* Search & New Task Button */}
        <div className="flex items-center gap-2.5 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Chercher une tâche ou un prospect..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition"
            />
          </div>

          <button
            onClick={() => setIsCreateTaskOpen(true)}
            className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs shadow-xs flex items-center gap-2 transition cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvelle Tâche</span>
          </button>
        </div>
      </div>

      {/* TASK LIST TABLE / CARDS */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {filteredTasks.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-1">
              {activeFilter === 'completed'
                ? 'Aucune tâche terminée dans cette sélection'
                : 'Aucune tâche de relance en attente'}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mb-6">
              {activeFilter === 'completed'
                ? 'Les tâches marquées comme faites s\'afficheront ici avec leur historique d\'exécution.'
                : 'Bravo ! Votre liste de rappels est à jour. Vous pouvez programmer une nouvelle tâche de suivi à tout moment.'}
            </p>
            <button
              onClick={() => setIsCreateTaskOpen(true)}
              className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-xs flex items-center gap-2 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Programmer une tâche de suivi</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredTasks.map(({ task, lead }) => {
              const dueInfo = formatReminderTime(task.dueDate);
              const typeBadge = getTaskTypeBadge(task.type);
              const isCompleted = task.status === 'completed';
              const assignedUser = users.find((u) => u.id === (task.assignedUserId || lead.assignedUserId));

              return (
                <div
                  key={task.id}
                  className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition hover:bg-slate-50/80 ${
                    isCompleted ? 'bg-slate-50/40 opacity-70' : dueInfo.isOverdue ? 'bg-rose-50/20' : ''
                  }`}
                >
                  {/* Left: Checkbox + Task Info + Lead Info */}
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    
                    {/* Checkbox Complete */}
                    <button
                      onClick={() => handleToggleTaskStatus(lead, task)}
                      className={`w-6 h-6 rounded-lg border flex items-center justify-center transition shrink-0 mt-0.5 cursor-pointer ${
                        isCompleted
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-slate-300 hover:border-indigo-500 bg-white'
                      }`}
                      title={isCompleted ? 'Marquer comme non fait' : 'Marquer comme fait'}
                    >
                      {isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>

                    <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                      {/* Title & Badges */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-sm font-bold ${isCompleted ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                          {task.title}
                        </span>

                        {/* Task Type Badge */}
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border flex items-center gap-1.5 ${typeBadge.badgeClass}`}>
                          {typeBadge.icon}
                          <span>{typeBadge.label}</span>
                        </span>

                        {/* Priority Badge */}
                        {getPriorityBadge(task.priority)}

                        {/* Due Badge */}
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 ${
                          isCompleted
                            ? 'bg-slate-100 text-slate-600'
                            : dueInfo.isOverdue
                            ? 'bg-rose-100 text-rose-800 font-extrabold animate-pulse'
                            : dueInfo.isToday
                            ? 'bg-amber-100 text-amber-800 font-bold'
                            : 'bg-indigo-50 text-indigo-700'
                        }`}>
                          <Clock className="w-3 h-3" />
                          <span>{dueInfo.label}</span>
                        </span>
                      </div>

                      {/* Associated Lead Card Chip */}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                        <button
                          onClick={() => onSelectLead(lead)}
                          className="flex items-center gap-1.5 font-bold text-indigo-700 hover:text-indigo-900 hover:underline cursor-pointer"
                        >
                          <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-extrabold">
                            {lead.firstName[0]}{lead.lastName[0]}
                          </div>
                          <span>{lead.firstName} {lead.lastName}</span>
                          {lead.company && <span className="font-normal text-slate-500">({lead.company})</span>}
                          <ArrowUpRight className="w-3 h-3 text-indigo-500" />
                        </button>

                        {assignedUser && (
                          <span className="flex items-center gap-1 text-[11px] text-slate-500">
                            <UserIcon className="w-3 h-3 text-slate-400" />
                            <span>Assigné : {assignedUser.name}</span>
                          </span>
                        )}
                      </div>

                      {/* Note snippet if present */}
                      {task.note && (
                        <p className="text-xs text-slate-500 italic bg-slate-50/80 p-2 rounded-xl border border-slate-100 mt-1">
                          "{task.note}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Quick Action Buttons */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    
                    {/* Quick Call */}
                    {lead.phone && (
                      <a
                        href={`tel:${lead.phone}`}
                        className="p-2 rounded-xl bg-white hover:bg-slate-100 text-blue-600 border border-slate-200 shadow-2xs transition"
                        title={`Appeler ${lead.firstName} (${lead.phone})`}
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                    )}

                    {/* Quick Email */}
                    <a
                      href={`mailto:${lead.email}?subject=Suite à notre échange KardX`}
                      className="p-2 rounded-xl bg-white hover:bg-slate-100 text-emerald-600 border border-slate-200 shadow-2xs transition"
                      title={`Envoyer un email à ${lead.email}`}
                    >
                      <Mail className="w-3.5 h-3.5" />
                    </a>

                    {/* Snooze +24h */}
                    {!isCompleted && (
                      <button
                        onClick={() => handleSnooze24h(lead, task)}
                        className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 shadow-2xs transition cursor-pointer text-xs font-semibold flex items-center gap-1"
                        title="Reporter la relance de 24h"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                        <span className="hidden md:inline">+24h</span>
                      </button>
                    )}

                    {/* Edit / Reschedule */}
                    <button
                      onClick={() => onOpenScheduleModal(lead)}
                      className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 shadow-2xs transition cursor-pointer"
                      title="Modifier la planification"
                    >
                      <CalendarClock className="w-3.5 h-3.5 text-indigo-600" />
                    </button>

                    {/* Delete Task */}
                    <button
                      onClick={() => handleDeleteTask(lead, task)}
                      className="p-2 rounded-xl bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 shadow-2xs transition cursor-pointer"
                      title="Supprimer la tâche"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* QUICK CREATE TASK MODAL */}
      {isCreateTaskOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Nouvelle tâche de suivi prospect
                  </h3>
                  <p className="text-xs text-slate-500">
                    Définissez un rappel et une action ciblée pour vos relances
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsCreateTaskOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateNewTask} className="p-5 overflow-y-auto flex flex-col gap-4">
              
              {/* Select Lead */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Prospect concerné *
                </label>
                <select
                  value={targetLeadId}
                  onChange={(e) => setTargetLeadId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  required
                >
                  {leads.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.firstName} {l.lastName} {l.company ? `(${l.company})` : ''} • {l.email}
                    </option>
                  ))}
                </select>
              </div>

              {/* Task Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Intitulé de la tâche *
                </label>
                <input
                  type="text"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="Ex: Relance proposition commerciale"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 font-medium"
                  required
                />
              </div>

              {/* Task Type & Priority Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Type d'action
                  </label>
                  <select
                    value={taskType}
                    onChange={(e) => setTaskType(e.target.value as LeadTaskType)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="call">📞 Appel téléphonique</option>
                    <option value="email">✉️ Envoi Email / Message</option>
                    <option value="meeting">📅 Rendez-vous / Visio</option>
                    <option value="quote">💼 Devis / Offre commerciale</option>
                    <option value="demo">🚀 Démonstration produit</option>
                    <option value="followup">🔔 Relance générale</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Priorité
                  </label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as LeadTaskPriority)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="high">🔥 Haute (Urgente)</option>
                    <option value="medium">⚡ Normale</option>
                    <option value="low">☕ Basse</option>
                  </select>
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Date de relance *
                  </label>
                  <input
                    type="date"
                    value={taskDate}
                    onChange={(e) => setTaskDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Heure
                  </label>
                  <input
                    type="time"
                    value={taskTime}
                    onChange={(e) => setTaskTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Note / Context */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Note d'instruction ou objectif de l'appel
                </label>
                <textarea
                  value={taskNote}
                  onChange={(e) => setTaskNote(e.target.value)}
                  placeholder="Ex: Rappeler pour valider les 85 cartes métalliques et envoyer le devis révisé."
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateTaskOpen(false)}
                  className="py-2.5 px-4 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-xs transition cursor-pointer flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Enregistrer la tâche</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
