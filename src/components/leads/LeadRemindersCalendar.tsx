import React, { useState, useMemo } from 'react';
import { Lead, Profile } from '../../types';
import { useApp } from '../../context/AppContext';
import { ScheduleAppointmentModal } from './ScheduleAppointmentModal';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Bell, 
  BellRing, 
  Plus, 
  User, 
  Building, 
  Phone, 
  Mail, 
  RotateCcw, 
  Check, 
  X, 
  CalendarClock, 
  Flame, 
  Sparkles, 
  ExternalLink, 
  Filter, 
  CheckCircle, 
  CalendarDays, 
  ListOrdered,
  CalendarPlus
} from 'lucide-react';

interface LeadRemindersCalendarProps {
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
  onOpenScheduleModal: (lead: Lead) => void;
}

export const LeadRemindersCalendar: React.FC<LeadRemindersCalendarProps> = ({
  leads,
  onSelectLead,
  onOpenScheduleModal,
}) => {
  const { updateLeadDetails, showToast } = useApp();

  // Current reference date for weekly navigation (defaults to today)
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const d = new Date();
    const day = d.getDay(); // 0 is Sunday
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday (make Monday start)
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  });

  const [calendarSubView, setCalendarSubView] = useState<'week' | 'agenda' | 'month'>('week');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'overdue' | 'completed'>('all');
  const [quickScheduleLeadId, setQuickScheduleLeadId] = useState<string>('');
  const [quickScheduleDate, setQuickScheduleDate] = useState<string>('');
  const [quickScheduleModalOpen, setQuickScheduleModalOpen] = useState(false);
  const [quickScheduleNote, setQuickScheduleNote] = useState('Relance commerciale de suivi');
  const [appointmentModalLead, setAppointmentModalLead] = useState<Lead | null>(null);

  // Compute the 7 days of current week (Monday to Sunday)
  const weekDays = useMemo(() => {
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(currentWeekStart);
      d.setDate(currentWeekStart.getDate() + i);
      days.push(d);
    }
    return days;
  }, [currentWeekStart]);

  // Compute week end date
  const weekEnd = useMemo(() => {
    const d = new Date(weekDays[6]);
    d.setHours(23, 59, 59, 999);
    return d;
  }, [weekDays]);

  // Helper to format date keys YYYY-MM-DD
  const formatDateKey = (d: Date) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // Group leads with reminders by date key
  const remindersByDate = useMemo(() => {
    const map = new Map<string, Lead[]>();

    leads.forEach((lead) => {
      if (!lead.reminderDate) return;

      // Filter by status if set
      const isOverdue = new Date(lead.reminderDate).getTime() < Date.now() && lead.reminderStatus === 'pending';
      if (filterStatus === 'overdue' && !isOverdue) return;
      if (filterStatus === 'pending' && lead.reminderStatus !== 'pending') return;
      if (filterStatus === 'completed' && lead.reminderStatus !== 'completed') return;

      const leadDate = new Date(lead.reminderDate);
      const key = formatDateKey(leadDate);

      const existing = map.get(key) || [];
      existing.push(lead);
      // Sort within the day by time
      existing.sort((a, b) => new Date(a.reminderDate!).getTime() - new Date(b.reminderDate!).getTime());
      map.set(key, existing);
    });

    return map;
  }, [leads, filterStatus]);

  // All reminders this week
  const weekReminders = useMemo(() => {
    const list: Lead[] = [];
    weekDays.forEach((day) => {
      const key = formatDateKey(day);
      const dayList = remindersByDate.get(key) || [];
      list.push(...dayList);
    });
    return list;
  }, [weekDays, remindersByDate]);

  // Workload statistics for this week
  const stats = useMemo(() => {
    let pending = 0;
    let overdue = 0;
    let completed = 0;

    const allLeadsWithReminders = leads.filter((l) => !!l.reminderDate);

    allLeadsWithReminders.forEach((l) => {
      const rTime = new Date(l.reminderDate!).getTime();
      if (l.reminderStatus === 'completed') {
        completed++;
      } else if (rTime < Date.now()) {
        overdue++;
      } else {
        pending++;
      }
    });

    // Workload level score for the week
    const countThisWeek = weekReminders.length;
    let loadLevel: 'low' | 'balanced' | 'heavy' = 'low';
    let loadLabel = 'Charge légère';
    let loadBadgeColor = 'bg-slate-100 text-slate-700';

    if (countThisWeek >= 6) {
      loadLevel = 'heavy';
      loadLabel = 'Charge intense';
      loadBadgeColor = 'bg-amber-100 text-amber-800 border-amber-200';
    } else if (countThisWeek >= 3) {
      loadLevel = 'balanced';
      loadLabel = 'Charge modérée';
      loadBadgeColor = 'bg-indigo-100 text-indigo-800 border-indigo-200';
    }

    return {
      totalThisWeek: countThisWeek,
      pending,
      overdue,
      completed,
      loadLevel,
      loadLabel,
      loadBadgeColor,
    };
  }, [leads, weekReminders]);

  // Navigation handlers
  const handlePrevWeek = () => {
    const prev = new Date(currentWeekStart);
    prev.setDate(prev.getDate() - 7);
    setCurrentWeekStart(prev);
  };

  const handleNextWeek = () => {
    const next = new Date(currentWeekStart);
    next.setDate(next.getDate() + 7);
    setCurrentWeekStart(next);
  };

  const handleToday = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    setCurrentWeekStart(monday);
  };

  const handleToggleComplete = (e: React.MouseEvent, lead: Lead) => {
    e.stopPropagation();
    const newStatus = lead.reminderStatus === 'completed' ? 'pending' : 'completed';
    updateLeadDetails(lead.id, {
      reminderStatus: newStatus,
    });
    showToast(
      newStatus === 'completed' 
        ? `✅ Rappel pour ${lead.firstName} ${lead.lastName} marqué comme terminé !` 
        : `Rappel rétabli en attente`
    );
  };

  const handleOpenQuickScheduleForDate = (date: Date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    setQuickScheduleDate(`${yyyy}-${mm}-${dd}T09:30`);
    setQuickScheduleModalOpen(true);
  };

  const handleSaveQuickSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickScheduleLeadId) {
      showToast('Veuillez sélectionner un prospect');
      return;
    }

    updateLeadDetails(quickScheduleLeadId, {
      reminderDate: new Date(quickScheduleDate).toISOString(),
      reminderNote: quickScheduleNote,
      reminderStatus: 'pending',
    });

    const targetLead = leads.find((l) => l.id === quickScheduleLeadId);
    showToast(`Rappel planifié pour ${targetLead ? `${targetLead.firstName} ${targetLead.lastName}` : 'le prospect'}`);
    setQuickScheduleModalOpen(false);
    setQuickScheduleLeadId('');
  };

  // Check if a date is today
  const isToday = (d: Date) => {
    const today = new Date();
    return (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    );
  };

  // Format hour / minute
  const formatTimeOnly = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const leadsWithoutReminders = leads.filter((l) => !l.reminderDate || l.reminderStatus === 'completed');

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-200">
      
      {/* CALENDAR HEADER & WORKLOAD SUMMARY BAR */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-2xs flex flex-col gap-5">
        
        {/* Top bar controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <CalendarClock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-800 tracking-tight">
                  Charge Hebdomadaire des Rappels
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${stats.loadBadgeColor}`}>
                  {stats.loadLabel} ({stats.totalThisWeek} rappel{stats.totalThisWeek > 1 ? 's' : ''})
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Visualisez vos relances commerciales et organisez votre emploi du temps prospection.
              </p>
            </div>
          </div>

          {/* Navigation and views */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Today Jump */}
            <button
              onClick={handleToday}
              className="py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
            >
              Aujourd'hui
            </button>

            {/* Week navigation buttons */}
            <div className="flex items-center rounded-xl border border-slate-200 bg-white p-0.5 shadow-2xs">
              <button
                onClick={handlePrevWeek}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition cursor-pointer"
                title="Semaine précédente"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <span className="px-3 py-1 text-xs font-bold text-slate-800">
                {weekDays[0].toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} — {weekDays[6].toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>

              <button
                onClick={handleNextWeek}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition cursor-pointer"
                title="Semaine suivante"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Sub-view toggle (Week vs Agenda) */}
            <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200">
              <button
                onClick={() => setCalendarSubView('week')}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  calendarSubView === 'week' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>Semaine</span>
              </button>
              <button
                onClick={() => setCalendarSubView('agenda')}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  calendarSubView === 'agenda' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
                }`}
              >
                <ListOrdered className="w-3.5 h-3.5" />
                <span>Agenda</span>
              </button>
            </div>

            {/* Quick schedule button */}
            <button
              onClick={() => handleOpenQuickScheduleForDate(new Date())}
              className="py-2 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Programmer un rappel</span>
            </button>
          </div>
        </div>

        {/* WORKLOAD METRICS STRIP */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
          
          <button
            onClick={() => setFilterStatus(filterStatus === 'all' ? 'all' : 'all')}
            className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
              filterStatus === 'all' ? 'bg-slate-50 border-slate-300 ring-1 ring-slate-300' : 'bg-white border-slate-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500">Total semaine</span>
              <CalendarIcon className="w-4 h-4 text-indigo-600" />
            </div>
            <p className="text-xl font-extrabold text-slate-800 mt-1">{weekReminders.length}</p>
            <p className="text-[10px] text-slate-400">Rappels cette semaine</p>
          </button>

          <button
            onClick={() => setFilterStatus(filterStatus === 'pending' ? 'all' : 'pending')}
            className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
              filterStatus === 'pending' ? 'bg-indigo-50 border-indigo-300 ring-1 ring-indigo-300' : 'bg-white border-slate-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-indigo-700">À venir / En attente</span>
              <Clock className="w-4 h-4 text-indigo-600" />
            </div>
            <p className="text-xl font-extrabold text-indigo-900 mt-1">{stats.pending}</p>
            <p className="text-[10px] text-indigo-500">Relances planifiées</p>
          </button>

          <button
            onClick={() => setFilterStatus(filterStatus === 'overdue' ? 'all' : 'overdue')}
            className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
              filterStatus === 'overdue' ? 'bg-rose-50 border-rose-300 ring-1 ring-rose-300' : 'bg-white border-slate-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-rose-700">En retard / Urgents</span>
              <AlertCircle className="w-4 h-4 text-rose-600" />
            </div>
            <p className="text-xl font-extrabold text-rose-800 mt-1">{stats.overdue}</p>
            <p className="text-[10px] text-rose-500">À traiter immédiatement</p>
          </button>

          <button
            onClick={() => setFilterStatus(filterStatus === 'completed' ? 'all' : 'completed')}
            className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
              filterStatus === 'completed' ? 'bg-emerald-50 border-emerald-300 ring-1 ring-emerald-300' : 'bg-white border-slate-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-700">Honorés / Effectués</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-xl font-extrabold text-emerald-800 mt-1">{stats.completed}</p>
            <p className="text-[10px] text-emerald-500">Relances réussies</p>
          </button>

        </div>

      </div>

      {/* WEEKLY 7-COLUMNS CALENDAR VIEW */}
      {calendarSubView === 'week' && (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3.5 items-start">
          {weekDays.map((day) => {
            const dateKey = formatDateKey(day);
            const dayLeads = remindersByDate.get(dateKey) || [];
            const dayIsToday = isToday(day);
            const dayName = day.toLocaleDateString('fr-FR', { weekday: 'short' });
            const dayNumber = day.getDate();
            const monthName = day.toLocaleDateString('fr-FR', { month: 'short' });

            // Load indicator for day
            let dayLoadBadge = { text: 'Libre', bg: 'text-slate-400 bg-slate-100' };
            if (dayLeads.length >= 3) {
              dayLoadBadge = { text: 'Intense', bg: 'text-amber-700 bg-amber-100 border border-amber-200' };
            } else if (dayLeads.length > 0) {
              dayLoadBadge = { text: 'Modéré', bg: 'text-indigo-700 bg-indigo-100 border border-indigo-200' };
            }

            return (
              <div
                key={dateKey}
                className={`rounded-3xl border transition flex flex-col min-h-[380px] shadow-2xs ${
                  dayIsToday
                    ? 'bg-indigo-50/40 border-indigo-300 ring-2 ring-indigo-200'
                    : 'bg-white border-slate-200/80 hover:border-slate-300'
                }`}
              >
                {/* Day Header */}
                <div className={`p-3.5 border-b rounded-t-3xl flex items-center justify-between ${
                  dayIsToday ? 'bg-indigo-600 text-white' : 'bg-slate-50/80 text-slate-700 border-slate-100'
                }`}>
                  <div className="flex items-center gap-2">
                    <span className={`w-7 h-7 rounded-xl flex items-center justify-center font-extrabold text-xs ${
                      dayIsToday ? 'bg-white text-indigo-700 shadow-xs' : 'bg-white text-slate-800 border border-slate-200'
                    }`}>
                      {dayNumber}
                    </span>
                    <div>
                      <p className="font-extrabold text-xs capitalize leading-tight">
                        {dayName}
                      </p>
                      <p className={`text-[10px] font-medium leading-none ${dayIsToday ? 'text-indigo-100' : 'text-slate-400'}`}>
                        {monthName}
                      </p>
                    </div>
                  </div>

                  <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${
                    dayIsToday ? 'bg-indigo-700/80 text-white' : dayLoadBadge.bg
                  }`}>
                    {dayLeads.length}
                  </span>
                </div>

                {/* Day Content / Reminders List */}
                <div className="p-2.5 flex-1 flex flex-col gap-2.5 overflow-y-auto max-h-[500px]">
                  {dayLeads.length > 0 ? (
                    dayLeads.map((lead) => {
                      const isOverdue = new Date(lead.reminderDate!).getTime() < Date.now() && lead.reminderStatus === 'pending';
                      const isCompleted = lead.reminderStatus === 'completed';

                      return (
                        <div
                          key={lead.id}
                          onClick={() => onSelectLead(lead)}
                          className={`p-3 rounded-2xl border transition cursor-pointer group relative flex flex-col gap-2 text-xs shadow-2xs hover:shadow-md ${
                            isCompleted
                              ? 'bg-slate-50/90 border-slate-200 opacity-60'
                              : isOverdue
                              ? 'bg-rose-50/70 border-rose-200 hover:bg-rose-50'
                              : 'bg-white border-slate-200/90 hover:border-indigo-300'
                          }`}
                        >
                          {/* Top Row: Time & Status */}
                          <div className="flex items-center justify-between">
                            <span className={`inline-flex items-center gap-1 font-extrabold text-[11px] px-2 py-0.5 rounded-lg ${
                              isCompleted
                                ? 'bg-emerald-100 text-emerald-800'
                                : isOverdue
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                            }`}>
                              <Clock className="w-3 h-3" />
                              {formatTimeOnly(lead.reminderDate!)}
                            </span>

                            <button
                              onClick={(e) => handleToggleComplete(e, lead)}
                              className={`p-1 rounded-lg transition cursor-pointer ${
                                isCompleted
                                  ? 'text-emerald-600 bg-emerald-100 hover:bg-emerald-200'
                                  : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                              }`}
                              title={isCompleted ? 'Marquer comme non terminé' : 'Marquer le rappel comme effectué'}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Contact Info */}
                          <div>
                            <p className={`font-bold text-xs leading-snug ${isCompleted ? 'line-through text-slate-400' : 'text-slate-800 group-hover:text-indigo-600'}`}>
                              {lead.firstName} {lead.lastName}
                            </p>
                            <p className="text-[10px] text-slate-500 font-medium truncate">
                              {lead.company || lead.jobTitle || 'Sans société'}
                            </p>
                          </div>

                          {/* Reminder Note */}
                          {lead.reminderNote && (
                            <p className="text-[10px] text-slate-600 bg-slate-50/90 p-1.5 rounded-lg border border-slate-100 line-clamp-2 leading-relaxed">
                              {lead.reminderNote}
                            </p>
                          )}

                          {/* Action shortcuts */}
                          <div className="flex items-center justify-between pt-1 border-t border-slate-100/80 text-[10px]">
                            <span className="text-slate-400 capitalize">
                              {lead.city || lead.source}
                            </span>

                            <div className="flex items-center gap-1">
                              {lead.phone && (
                                <a
                                  href={`tel:${lead.phone}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="p-1 rounded-md bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600"
                                  title="Appeler directement"
                                >
                                  <Phone className="w-3 h-3" />
                                </a>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setAppointmentModalLead(lead);
                                }}
                                className="p-1 rounded-md bg-purple-50 hover:bg-purple-100 text-purple-700"
                                title="Planifier un rendez-vous (générer .ics / Agenda)"
                              >
                                <CalendarPlus className="w-3 h-3" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onOpenScheduleModal(lead);
                                }}
                                className="p-1 rounded-md bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600"
                                title="Modifier la date ou l'heure du rappel"
                              >
                                <CalendarClock className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                        </div>
                      );
                    })
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-4 text-center text-slate-300 gap-2">
                      <Clock className="w-6 h-6 stroke-1 text-slate-300" />
                      <p className="text-[11px] font-medium text-slate-400">Aucun rappel</p>
                      <button
                        onClick={() => handleOpenQuickScheduleForDate(day)}
                        className="py-1 px-2.5 rounded-lg text-[10px] font-bold bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 border border-slate-200 transition flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Planifier</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Day Footer Add Button */}
                {dayLeads.length > 0 && (
                  <div className="p-2 border-t border-slate-100">
                    <button
                      onClick={() => handleOpenQuickScheduleForDate(day)}
                      className="w-full py-1.5 rounded-xl text-[11px] font-bold text-slate-500 hover:text-indigo-600 hover:bg-slate-50 transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Ajouter un rappel</span>
                    </button>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

      {/* AGENDA / LIST SUB-VIEW */}
      {calendarSubView === 'agenda' && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-2xs flex flex-col gap-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800">
              Vue Agenda Chronologique — {weekReminders.length} Rappels Prévus
            </h4>
            <span className="text-xs text-slate-500">
              Du {weekDays[0].toLocaleDateString('fr-FR')} au {weekDays[6].toLocaleDateString('fr-FR')}
            </span>
          </div>

          {weekReminders.length > 0 ? (
            <div className="flex flex-col gap-3">
              {weekReminders.map((lead) => {
                const dateObj = new Date(lead.reminderDate!);
                const isOverdue = dateObj.getTime() < Date.now() && lead.reminderStatus === 'pending';
                const isCompleted = lead.reminderStatus === 'completed';

                return (
                  <div
                    key={lead.id}
                    onClick={() => onSelectLead(lead)}
                    className={`p-4 rounded-2xl border transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isCompleted
                        ? 'bg-slate-50/70 border-slate-200 opacity-70'
                        : isOverdue
                        ? 'bg-rose-50/50 border-rose-200 hover:bg-rose-50'
                        : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl flex flex-col items-center justify-center shrink-0 min-w-[55px] ${
                        isCompleted ? 'bg-emerald-100 text-emerald-800' : isOverdue ? 'bg-rose-100 text-rose-800' : 'bg-indigo-50 text-indigo-700'
                      }`}>
                        <span className="text-xs font-bold uppercase">{dateObj.toLocaleDateString('fr-FR', { weekday: 'short' })}</span>
                        <span className="text-sm font-extrabold">{dateObj.getDate()}</span>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="font-bold text-sm text-slate-800">
                            {lead.firstName} {lead.lastName}
                          </h5>
                          <span className="text-xs text-slate-500 font-medium">
                            • {lead.company || lead.jobTitle || 'Sans société'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Prévu à <strong className="font-semibold text-slate-800">{formatTimeOnly(lead.reminderDate!)}</strong></span>
                          {lead.reminderNote && <span className="text-slate-400">— {lead.reminderNote}</span>}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={(e) => handleToggleComplete(e, lead)}
                        className={`py-1.5 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                          isCompleted
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{isCompleted ? 'Effectué' : 'Marquer fait'}</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenScheduleModal(lead);
                        }}
                        className="py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 text-xs font-semibold transition cursor-pointer"
                      >
                        Reprogrammer
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center gap-2">
              <CalendarClock className="w-8 h-8 text-slate-300" />
              <p className="text-xs font-bold text-slate-700">Aucun rappel planifié pour cette semaine</p>
              <p className="text-[11px] text-slate-400">Cliquez sur « Programmer un rappel » pour assigner des relances à vos prospects.</p>
            </div>
          )}
        </div>
      )}

      {/* QUICK SCHEDULE MODAL */}
      {quickScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md border border-slate-200 shadow-2xl flex flex-col gap-4">
            
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <CalendarClock className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-sm text-slate-800">
                  Planifier un rappel de contact
                </h4>
              </div>
              <button
                onClick={() => setQuickScheduleModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveQuickSchedule} className="flex flex-col gap-3.5">
              {/* Select Lead */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Prospect / Contact à relancer *
                </label>
                <select
                  required
                  value={quickScheduleLeadId}
                  onChange={(e) => setQuickScheduleLeadId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="">-- Choisir un prospect --</option>
                  {leads.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.firstName} {l.lastName} {l.company ? `(${l.company})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date & Time */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Date et heure du rappel *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={quickScheduleDate}
                  onChange={(e) => setQuickScheduleDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Note / Goal */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Objectif / Note du rappel
                </label>
                <input
                  type="text"
                  placeholder="Ex : Faire le point sur le devis, appel de suivi..."
                  value={quickScheduleNote}
                  onChange={(e) => setQuickScheduleNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setQuickScheduleModalOpen(false)}
                  className="py-2 px-3 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold transition cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Enregistrer le rappel</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* SCHEDULE APPOINTMENT / CALENDAR EVENT MODAL */}
      {appointmentModalLead && (
        <ScheduleAppointmentModal
          lead={appointmentModalLead}
          isOpen={!!appointmentModalLead}
          onClose={() => setAppointmentModalLead(null)}
        />
      )}

    </div>
  );
};
