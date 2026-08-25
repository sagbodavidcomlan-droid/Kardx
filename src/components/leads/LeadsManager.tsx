import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Lead, LeadStatus, LeadSource } from '../../types';
import { LeadFilterState, SavedLeadFilter } from '../../types/savedFilters';
import { 
  DEFAULT_INITIAL_FILTER_STATE, 
  DEFAULT_SAVED_FILTERS, 
  loadSavedFiltersFromStorage, 
  saveSavedFiltersToStorage, 
  applyFilterStateToLeads, 
  countActiveFilters 
} from '../../utils/savedFiltersStorage';
import { exportLeadsToCsv } from '../../utils/export';
import { 
  triggerBrowserNotification, 
  formatReminderTime, 
  getNotificationPermission,
  requestNotificationPermission,
  isNotificationSupported 
} from '../../utils/browserNotifications';
import { ScheduleReminderModal } from './ScheduleReminderModal';
import { ScheduleAppointmentModal } from './ScheduleAppointmentModal';
import { LeadInteractionHistory } from './LeadInteractionHistory';
import { LeadRemindersCalendar } from './LeadRemindersCalendar';
import { LeadRemindersManager } from './LeadRemindersManager';
import { LeadRoutingRulesManager } from './LeadRoutingRulesManager';
import { RoutingSimulatorModal } from './RoutingSimulatorModal';
import { GoogleWorkspaceLeadBar } from './GoogleWorkspaceLeadBar';
import { GoogleMapsEmbed } from '../common/GoogleMapsEmbed';
import { ManualLeadModal } from './ManualLeadModal';
import { AdvancedFilterPanel } from './AdvancedFilterPanel';
import { SavedFiltersModal } from './SavedFiltersModal';
import { SavedFiltersView } from './SavedFiltersView';
import { ActiveFilterChips } from './ActiveFilterChips';
import { BulkActionsBar } from './BulkActionsBar';
import { BulkTagModal } from './BulkTagModal';
import { BulkDeleteModal } from './BulkDeleteModal';
import { 
  Users, 
  Search, 
  Filter, 
  Download, 
  Plus, 
  Trash2, 
  MessageSquare, 
  Mail, 
  Phone, 
  Star, 
  Tag, 
  ChevronRight, 
  X, 
  Building, 
  Briefcase, 
  Calendar, 
  CheckCircle, 
  Clock, 
  ShieldCheck, 
  Sparkles, 
  ExternalLink,
  Kanban,
  Table as TableIcon,
  Bell,
  BellRing,
  AlertCircle,
  CheckCircle2,
  CalendarClock,
  Route,
  UserCheck,
  MapPin,
  HelpCircle,
  Play,
  Zap,
  Bookmark,
  SlidersHorizontal,
  RotateCcw
} from 'lucide-react';

export const LeadsManager: React.FC = () => {
  const { 
    currentUser,
    visibleLeads, 
    users, 
    routingRules,
    integrations,
    syncLeadToCrm,
    profiles, 
    activeProfile,
    hasUserPermission,
    updateLeadStatus, 
    updateLeadDetails, 
    deleteLead, 
    addLeadTag, 
    toggleLeadFavorite,
    addNotification,
    showToast 
  } = useApp();

  const [isPushingCrm, setIsPushingCrm] = useState(false);
  const leads = visibleLeads;
  const canManageRouting = hasUserPermission('leads:assign') || currentUser.role !== 'collaborateur';
  const canExportLeads = hasUserPermission('leads:export');
  const canDeleteLeads = hasUserPermission('leads:delete');

  // Main tab: 'leads' vs 'routing'
  const [activeMainTab, setActiveMainTab] = useState<'leads' | 'routing'>('leads');

  // Advanced Filter and Saved Filters state
  const [filterState, setFilterState] = useState<LeadFilterState>(DEFAULT_INITIAL_FILTER_STATE);
  const [savedFilters, setSavedFilters] = useState<SavedLeadFilter[]>(() => loadSavedFiltersFromStorage());
  const [activeSavedFilterId, setActiveSavedFilterId] = useState<string | null>(null);
  const [isAdvancedFilterOpen, setIsAdvancedFilterOpen] = useState(false);
  const [isSaveFilterModalOpen, setIsSaveFilterModalOpen] = useState(false);

  const [viewMode, setViewMode] = useState<'table' | 'kanban' | 'calendar' | 'reminders' | 'saved_filters'>('table');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [newTagInput, setNewTagInput] = useState('');
  
  // Reminder modal state
  const [reminderModalLead, setReminderModalLead] = useState<Lead | null>(null);

  // Appointment scheduling modal state
  const [appointmentModalLead, setAppointmentModalLead] = useState<Lead | null>(null);
  
  // Simulator modal state for a specific lead
  const [testLeadSimulator, setTestLeadSimulator] = useState<Lead | null>(null);
  
  // Manual Lead creation modal state
  const [isManualLeadModalOpen, setIsManualLeadModalOpen] = useState(false);

  // Bulk Selection & Batch Operations state
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
  const [isBulkTagModalOpen, setIsBulkTagModalOpen] = useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const selectAllCheckboxRef = useRef<HTMLInputElement>(null);
  
  // Keep track of triggered lead IDs in this session to prevent duplicate alerts
  const triggeredLeadIdsRef = useRef<Set<string>>(new Set());

  // Background Reminder Monitoring Loop
  useEffect(() => {
    const checkReminders = () => {
      const now = Date.now();

      leads.forEach((lead) => {
        if (
          lead.reminderDate &&
          lead.reminderStatus === 'pending' &&
          !triggeredLeadIdsRef.current.has(lead.id)
        ) {
          const reminderTime = new Date(lead.reminderDate).getTime();
          // If within 2 minutes of now (or slightly past due)
          if (reminderTime <= now && now - reminderTime <= 24 * 60 * 60 * 1000) {
            triggeredLeadIdsRef.current.add(lead.id);

            // Trigger system browser notification
            triggerBrowserNotification({
              title: `🔔 Rappel Lead : ${lead.firstName} ${lead.lastName}`,
              body: `${lead.company ? `${lead.company} • ` : ''}${lead.reminderNote || 'Relance commerciale planifiée'}`,
              tag: `reminder-${lead.id}`,
            });

            // Also create in-app notification
            addNotification({
              type: 'lead_reminder',
              title: `Rappel : Relancer ${lead.firstName} ${lead.lastName}`,
              message: lead.reminderNote || `Rappel programmé pour ${lead.firstName} ${lead.lastName}${lead.company ? ` (${lead.company})` : ''}.`,
              linkTab: 'leads',
              metadata: {
                leadId: lead.id,
                contactName: `${lead.firstName} ${lead.lastName}`,
                company: lead.company,
              },
            });
          }
        }
      });
    };

    const interval = setInterval(checkReminders, 15000); // Check every 15s
    checkReminders(); // Initial check

    return () => clearInterval(interval);
  }, [leads, addNotification]);

  // Compute all available tags across all leads
  const allAvailableTags = useMemo(() => {
    const counts: Record<string, number> = {};
    leads.forEach((lead) => {
      (lead.tags || []).forEach((t) => {
        counts[t] = (counts[t] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
  }, [leads]);

  // Filter Leads dynamically with full criteria engine
  const filteredLeads = useMemo(() => {
    return applyFilterStateToLeads(leads, filterState);
  }, [leads, filterState]);

  // Count active filter conditions
  const activeFiltersCount = useMemo(() => {
    return countActiveFilters(filterState);
  }, [filterState]);

  // Selected Leads Array
  const selectedLeadsArray = useMemo(() => {
    return leads.filter((l) => selectedLeadIds.has(l.id));
  }, [leads, selectedLeadIds]);

  // Sync indeterminate state on the table select-all checkbox
  useEffect(() => {
    if (selectAllCheckboxRef.current) {
      const isSome = selectedLeadIds.size > 0 && selectedLeadIds.size < filteredLeads.length;
      selectAllCheckboxRef.current.indeterminate = isSome;
    }
  }, [selectedLeadIds, filteredLeads.length]);

  // Bulk Selection Handlers
  const handleToggleSelectLead = (leadId: string) => {
    setSelectedLeadIds((prev) => {
      const next = new Set(prev);
      if (next.has(leadId)) {
        next.delete(leadId);
      } else {
        next.add(leadId);
      }
      return next;
    });
  };

  const handleSelectAllFiltered = () => {
    setSelectedLeadIds(new Set(filteredLeads.map((l) => l.id)));
  };

  const handleClearSelection = () => {
    setSelectedLeadIds(new Set());
  };

  const handleBatchApplyTags = (tags: string[], mode: 'append' | 'replace' | 'remove') => {
    const count = selectedLeadIds.size;
    selectedLeadIds.forEach((leadId) => {
      const targetLead = leads.find((l) => l.id === leadId);
      if (!targetLead) return;
      const currentTags = targetLead.tags || [];
      let nextTags: string[] = [];

      if (mode === 'append') {
        const unique = new Set([...currentTags, ...tags]);
        nextTags = Array.from(unique);
      } else if (mode === 'replace') {
        nextTags = [...tags];
      } else if (mode === 'remove') {
        nextTags = currentTags.filter((t) => !tags.includes(t));
      }

      updateLeadDetails(leadId, { tags: nextTags });
      if (selectedLead && selectedLead.id === leadId) {
        setSelectedLead((prev) => (prev ? { ...prev, tags: nextTags } : null));
      }
    });

    showToast(`Tags mis à jour avec succès pour ${count} prospect(s) !`);
    setSelectedLeadIds(new Set());
  };

  const handleBatchStatusChange = (status: LeadStatus) => {
    const count = selectedLeadIds.size;
    selectedLeadIds.forEach((leadId) => {
      updateLeadStatus(leadId, status);
      if (selectedLead && selectedLead.id === leadId) {
        setSelectedLead((prev) => (prev ? { ...prev, status } : null));
      }
    });
    showToast(`Statut mis à jour (${status}) pour ${count} prospect(s) !`);
    setSelectedLeadIds(new Set());
  };

  const handleBatchAssignUser = (userId: string) => {
    const count = selectedLeadIds.size;
    const targetUser = users.find((u) => u.id === userId);
    selectedLeadIds.forEach((leadId) => {
      updateLeadDetails(leadId, {
        assignedUserId: userId || undefined,
        assignedAt: userId ? new Date().toISOString() : undefined,
      });
      if (selectedLead && selectedLead.id === leadId) {
        setSelectedLead((prev) => (prev ? {
          ...prev,
          assignedUserId: userId || undefined,
          assignedAt: userId ? new Date().toISOString() : undefined,
        } : null));
      }
    });
    showToast(
      targetUser
        ? `${count} prospect(s) assigné(s) à ${targetUser.name}`
        : `${count} prospect(s) désassigné(s)`
    );
    setSelectedLeadIds(new Set());
  };

  const handleBatchDelete = () => {
    const count = selectedLeadIds.size;
    selectedLeadIds.forEach((leadId) => {
      deleteLead(leadId);
      if (selectedLead && selectedLead.id === leadId) {
        setSelectedLead(null);
      }
    });
    showToast(`${count} prospect(s) supprimé(s) définitivement.`);
    setSelectedLeadIds(new Set());
  };

  const handleBatchExportCsv = () => {
    const leadsToExport = leads.filter((l) => selectedLeadIds.has(l.id));
    exportLeadsToCsv(
      leadsToExport,
      `kardx_leads_selection_${new Date().toISOString().slice(0, 10)}.csv`
    );
    showToast(`${leadsToExport.length} prospect(s) exporté(s) au format CSV !`);
  };

  // Saved Filters Handlers
  const handleApplySavedFilter = (savedFilter: SavedLeadFilter) => {
    setFilterState(savedFilter.filterState);
    setActiveSavedFilterId(savedFilter.id);
    if (viewMode === 'saved_filters') {
      setViewMode('table');
    }
    showToast(`Vue appliquée : ${savedFilter.name}`);
  };

  const handleSaveNewFilter = (newFilterData: Omit<SavedLeadFilter, 'id' | 'createdAt'>) => {
    const newFilter: SavedLeadFilter = {
      ...newFilterData,
      id: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    const updatedList = [newFilter, ...savedFilters];
    setSavedFilters(updatedList);
    saveSavedFiltersToStorage(updatedList);
    setActiveSavedFilterId(newFilter.id);
    showToast(`Filtre sauvegardé : ${newFilter.name}`);
  };

  const handleDeleteSavedFilter = (filterId: string) => {
    const updatedList = savedFilters.filter((f) => f.id !== filterId);
    setSavedFilters(updatedList);
    saveSavedFiltersToStorage(updatedList);
    if (activeSavedFilterId === filterId) {
      setActiveSavedFilterId(null);
    }
    showToast('Filtre supprimé');
  };

  const handleResetSavedFiltersToDefaults = () => {
    setSavedFilters(DEFAULT_SAVED_FILTERS);
    saveSavedFiltersToStorage(DEFAULT_SAVED_FILTERS);
    showToast('Filtres réinitialisés aux pré-réglages');
  };

  const handleResetAllFilters = () => {
    setFilterState(DEFAULT_INITIAL_FILTER_STATE);
    setActiveSavedFilterId(null);
    showToast('Tous les filtres ont été réinitialisés');
  };

  const handleExportCsv = () => {
    exportLeadsToCsv(filteredLeads, `kardx_leads_export_${new Date().toISOString().slice(0,10)}.csv`);
    showToast(`${filteredLeads.length} prospects exportés au format CSV !`);
  };

  const handleAddTag = (leadId: string) => {
    if (!newTagInput.trim()) return;
    addLeadTag(leadId, newTagInput.trim());
    if (selectedLead && selectedLead.id === leadId) {
      setSelectedLead({
        ...selectedLead,
        tags: selectedLead.tags.includes(newTagInput.trim()) ? selectedLead.tags : [...selectedLead.tags, newTagInput.trim()]
      });
    }
    setNewTagInput('');
  };

  const handleSaveReminder = (leadId: string, reminderDate?: string, reminderNote?: string) => {
    if (reminderDate) {
      updateLeadDetails(leadId, {
        reminderDate,
        reminderNote: reminderNote || 'Relance commerciale',
        reminderStatus: 'pending',
      });

      triggeredLeadIdsRef.current.delete(leadId);
      const timeInfo = formatReminderTime(reminderDate);
      showToast(`Rappel programmé : ${timeInfo.label}`);

      if (selectedLead && selectedLead.id === leadId) {
        setSelectedLead({
          ...selectedLead,
          reminderDate,
          reminderNote: reminderNote || 'Relance commerciale',
          reminderStatus: 'pending',
        });
      }
    } else {
      updateLeadDetails(leadId, {
        reminderDate: undefined,
        reminderNote: undefined,
        reminderStatus: undefined,
      });
      showToast('Rappel supprimé');

      if (selectedLead && selectedLead.id === leadId) {
        setSelectedLead({
          ...selectedLead,
          reminderDate: undefined,
          reminderNote: undefined,
          reminderStatus: undefined,
        });
      }
    }
  };

  const handleReassignLead = (leadId: string, newUserId: string) => {
    const targetUser = users.find((u) => u.id === newUserId);
    updateLeadDetails(leadId, {
      assignedUserId: newUserId || undefined,
      assignedAt: newUserId ? new Date().toISOString() : undefined,
    });

    if (selectedLead && selectedLead.id === leadId) {
      setSelectedLead({
        ...selectedLead,
        assignedUserId: newUserId || undefined,
        assignedAt: newUserId ? new Date().toISOString() : undefined,
      });
    }

    if (targetUser) {
      showToast(`Prospect réassigné à ${targetUser.name}`);
    } else {
      showToast('Prospect non assigné');
    }
  };

  const statusColumns: { id: LeadStatus; label: string; badgeClass: string; bgClass: string }[] = [
    { id: 'new', label: 'Nouveau Contact', badgeClass: 'bg-blue-50 text-blue-700 border-blue-200', bgClass: 'bg-blue-50/40' },
    { id: 'contacted', label: 'Contacté / Rappelé', badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200', bgClass: 'bg-indigo-50/40' },
    { id: 'qualified', label: 'Prospect Qualifié', badgeClass: 'bg-purple-50 text-purple-700 border-purple-200', bgClass: 'bg-purple-50/40' },
    { id: 'proposal', label: 'Devis / Proposition', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200', bgClass: 'bg-amber-50/40' },
    { id: 'won', label: 'Client Signé', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200', bgClass: 'bg-emerald-50/40' },
  ];

  const activeRemindersCount = leads.filter(l => !!l.reminderDate && l.reminderStatus !== 'completed').length;
  const activeRoutingRulesCount = routingRules.filter(r => r.active).length;

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 text-slate-800 flex flex-col gap-4 sm:gap-6">
      
      {/* MAIN TOP NAVIGATION BAR (LEADS vs ROUTING RULES) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 border-b border-slate-200 pb-3 sm:pb-4">
        <div>
          <div className="flex items-center gap-2.5 sm:gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Gestion Commerciale & CRM
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              {leads.length} contacts
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1">
            Capturez, routez intelligemment et suivez l'ensemble des opportunités de votre équipe.
          </p>
        </div>

        {/* Tab switcher: Leads vs Routing */}
        <div className="flex items-center p-1 bg-slate-100 rounded-2xl border border-slate-200/80 shadow-2xs overflow-x-auto no-scrollbar shrink-0 self-start md:self-auto">
          <button
            onClick={() => setActiveMainTab('leads')}
            className={`py-1.5 sm:py-2 px-3 sm:px-4 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeMainTab === 'leads'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>{currentUser.role === 'collaborateur' ? 'Mes Prospects' : 'Tous les Prospects'}</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
              {leads.length}
            </span>
          </button>

          {canManageRouting && (
            <button
              onClick={() => setActiveMainTab('routing')}
              className={`py-1.5 sm:py-2 px-3 sm:px-4 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                activeMainTab === 'routing'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Route className="w-4 h-4" />
              <span>Règles de Routage</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                activeMainTab === 'routing' ? 'bg-white text-indigo-700' : 'bg-indigo-100 text-indigo-700'
              }`}>
                {activeRoutingRulesCount}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* IF TAB IS ROUTING RULES MANAGER */}
      {activeMainTab === 'routing' && canManageRouting && (
        <LeadRoutingRulesManager />
      )}

      {/* IF TAB IS LEADS LIST */}
      {(activeMainTab === 'leads' || !canManageRouting) && (
        <>
          {/* LEADS HEADER CONTROLS */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap hidden sm:inline">
                Affichage :
              </span>
              {/* View mode toggle */}
              <div className="flex items-center p-1 rounded-xl bg-white border border-slate-200 shadow-xs flex-wrap md:flex-nowrap gap-1">
                <button
                  onClick={() => setViewMode('table')}
                  className={`py-1.5 px-2.5 sm:px-3 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                    viewMode === 'table' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Vue Tableau"
                >
                  <TableIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>Tableau</span>
                </button>
                <button
                  onClick={() => setViewMode('kanban')}
                  className={`py-1.5 px-2.5 sm:px-3 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                    viewMode === 'kanban' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Vue Pipeline Kanban"
                >
                  <Kanban className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>Pipeline</span>
                </button>
                <button
                  onClick={() => setViewMode('calendar')}
                  className={`py-1.5 px-2.5 sm:px-3 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                    viewMode === 'calendar' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Vue Calendrier des Rappels & Charge Hebdomadaire"
                >
                  <CalendarClock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>Calendrier</span>
                </button>
                <button
                  onClick={() => setViewMode('reminders')}
                  className={`py-1.5 px-2.5 sm:px-3 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                    viewMode === 'reminders' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Gestionnaire des Rappels & Tâches de Suivi"
                >
                  <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>Tâches & Rappels</span>
                  {activeRemindersCount > 0 && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      viewMode === 'reminders' ? 'bg-white text-indigo-700' : 'bg-indigo-100 text-indigo-700'
                    }`}>
                      {activeRemindersCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setViewMode('saved_filters')}
                  className={`py-1.5 px-2.5 sm:px-3 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                    viewMode === 'saved_filters' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Vues & Filtres Sauvegardés"
                >
                  <Bookmark className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Vues Sauvegardées</span>
                  <span className="sm:hidden">Vues</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    viewMode === 'saved_filters' ? 'bg-white text-indigo-700' : 'bg-indigo-100 text-indigo-700'
                  }`}>
                    {savedFilters.length}
                  </span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 self-start md:self-auto">
              <button
                onClick={() => setIsManualLeadModalOpen(true)}
                className="py-2 px-3.5 sm:py-2.5 sm:px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-semibold text-xs shadow-xs flex items-center gap-2 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Nouveau Prospect</span>
              </button>

              {canExportLeads && (
                <button
                  onClick={handleExportCsv}
                  className="py-2 px-3.5 sm:py-2.5 sm:px-4 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs border border-slate-200 shadow-xs flex items-center gap-2 transition active:scale-95 cursor-pointer"
                >
                  <Download className="w-4 h-4 text-emerald-600" />
                  <span className="hidden sm:inline">Exporter CSV</span>
                </button>
              )}
            </div>
          </div>

          {/* ENHANCED SEARCH & FILTER CONTROLS BAR */}
          {viewMode !== 'saved_filters' && (
            <div className="flex flex-col gap-2.5 sm:gap-3">
              <div className="p-3 sm:p-4 rounded-2xl sm:rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col xl:flex-row items-stretch xl:items-center gap-2.5 sm:gap-3">
                {/* Search Input with quick clear */}
                <div className="relative flex-1 w-full min-w-0">
                  <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Recherche : nom, email, société, ville, tag, note..."
                    value={filterState.searchQuery}
                    onChange={(e) => {
                      setFilterState((prev) => ({ ...prev, searchQuery: e.target.value }));
                      setActiveSavedFilterId(null);
                    }}
                    className="w-full pl-10 pr-9 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  />
                  {filterState.searchQuery && (
                    <button
                      onClick={() => setFilterState((prev) => ({ ...prev, searchQuery: '' }))}
                      className="absolute right-3 top-2.5 p-0.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Filters Dropdown Controls in responsive grid for tablets */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 xl:flex xl:items-center gap-2 sm:gap-2.5 w-full xl:w-auto shrink-0">
                  {/* Quick Saved Filters Dropdown */}
                  <div className="w-full xl:w-44">
                    <select
                      value={activeSavedFilterId || 'none'}
                      onChange={(e) => {
                        const selectedId = e.target.value;
                        if (selectedId === 'none') {
                          handleResetAllFilters();
                        } else {
                          const target = savedFilters.find((sf) => sf.id === selectedId);
                          if (target) {
                            handleApplySavedFilter(target);
                          }
                        }
                      }}
                      className="w-full px-2.5 sm:px-3 py-2 rounded-xl bg-indigo-50/70 border border-indigo-200 text-xs font-bold text-indigo-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 cursor-pointer truncate"
                    >
                      <option value="none">⚡ Vues ({savedFilters.length})</option>
                      {savedFilters.map((sf) => (
                        <option key={sf.id} value={sf.id}>
                          {sf.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Quick Source Filter */}
                  <select
                    value={filterState.sources.length === 1 ? filterState.sources[0] : filterState.sources.length > 1 ? 'multi' : 'all'}
                    onChange={(e) => {
                      const val = e.target.value;
                      setActiveSavedFilterId(null);
                      if (val === 'all') {
                        setFilterState((prev) => ({ ...prev, sources: [] }));
                      } else if (val !== 'multi') {
                        setFilterState((prev) => ({ ...prev, sources: [val] }));
                      }
                    }}
                    className="w-full px-2.5 sm:px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:bg-white focus:ring-2 focus:ring-indigo-500 cursor-pointer truncate"
                  >
                    <option value="all">Toutes sources</option>
                    <option value="nfc">⚡ NFC Tap</option>
                    <option value="qr">📱 QR Code</option>
                    <option value="card_scanner">📸 Scanner IA</option>
                    <option value="email_signature">✉️ Email</option>
                    <option value="direct_url">🌐 Direct</option>
                    <option value="manual">✍️ Manuel</option>
                    {filterState.sources.length > 1 && (
                      <option value="multi" disabled>
                        {filterState.sources.length} sources
                      </option>
                    )}
                  </select>

                  {/* Quick Status Filter */}
                  <select
                    value={filterState.statuses.length === 1 ? filterState.statuses[0] : filterState.statuses.length > 1 ? 'multi' : 'all'}
                    onChange={(e) => {
                      const val = e.target.value;
                      setActiveSavedFilterId(null);
                      if (val === 'all') {
                        setFilterState((prev) => ({ ...prev, statuses: [] }));
                      } else if (val !== 'multi') {
                        setFilterState((prev) => ({ ...prev, statuses: [val as LeadStatus] }));
                      }
                    }}
                    className="w-full px-2.5 sm:px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:bg-white focus:ring-2 focus:ring-indigo-500 cursor-pointer truncate"
                  >
                    <option value="all">Tous statuts</option>
                    <option value="new">Nouveau</option>
                    <option value="contacted">Contacté</option>
                    <option value="qualified">Qualifié</option>
                    <option value="proposal">Proposition</option>
                    <option value="won">Gagné</option>
                    <option value="lost">Perdu</option>
                    {filterState.statuses.length > 1 && (
                      <option value="multi" disabled>
                        {filterState.statuses.length} statuts
                      </option>
                    )}
                  </select>

                  {/* Filter by Assignee */}
                  <div className="w-full">
                    <select
                      value={filterState.selectedAssignee}
                      onChange={(e) => {
                        setFilterState((prev) => ({ ...prev, selectedAssignee: e.target.value }));
                        setActiveSavedFilterId(null);
                      }}
                      className="w-full px-2.5 sm:px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:bg-white focus:ring-2 focus:ring-indigo-500 cursor-pointer truncate"
                    >
                      <option value="all">Tous collaborateurs</option>
                      <option value="unassigned">Non assignés</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Advanced Filter Toggle Button */}
                <button
                  onClick={() => setIsAdvancedFilterOpen(!isAdvancedFilterOpen)}
                  className={`py-2 px-3 sm:px-3.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap shadow-2xs shrink-0 ${
                    isAdvancedFilterOpen || activeFiltersCount > 0
                      ? 'bg-slate-900 text-white hover:bg-slate-800'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                  title="Ouvrir le panneau de filtres avancés (Date, Tags, CRM, etc.)"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Filtres Avancés</span>
                  {activeFiltersCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-indigo-500 text-white ml-0.5">
                      {activeFiltersCount}
                    </span>
                  )}
                </button>
              </div>

              {/* QUICK FILTER PILLS BAR */}
              <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                  Accès :
                </span>

                <button
                  onClick={() => {
                    setFilterState((prev) => ({ ...prev, onlyFavorites: !prev.onlyFavorites }));
                    setActiveSavedFilterId(null);
                  }}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap border ${
                    filterState.onlyFavorites
                      ? 'bg-amber-100 border-amber-300 text-amber-900 shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Star className={`w-3 h-3 ${filterState.onlyFavorites ? 'fill-amber-500 text-amber-500' : 'text-slate-400'}`} />
                  <span>Favoris</span>
                </button>

                <button
                  onClick={() => {
                    const isNfc = filterState.sources.includes('nfc');
                    setFilterState((prev) => ({
                      ...prev,
                      sources: isNfc ? prev.sources.filter((s) => s !== 'nfc') : [...prev.sources, 'nfc'],
                    }));
                    setActiveSavedFilterId(null);
                  }}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap border ${
                    filterState.sources.includes('nfc')
                      ? 'bg-indigo-100 border-indigo-300 text-indigo-900 shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Zap className="w-3 h-3 text-indigo-600" />
                  <span>NFC Tap</span>
                </button>

                <button
                  onClick={() => {
                    const isScan = filterState.sources.includes('card_scanner');
                    setFilterState((prev) => ({
                      ...prev,
                      sources: isScan ? prev.sources.filter((s) => s !== 'card_scanner') : [...prev.sources, 'card_scanner'],
                    }));
                    setActiveSavedFilterId(null);
                  }}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap border ${
                    filterState.sources.includes('card_scanner')
                      ? 'bg-purple-100 border-purple-300 text-purple-900 shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Sparkles className="w-3 h-3 text-purple-600" />
                  <span>Scanner IA</span>
                </button>

                <button
                  onClick={() => {
                    setFilterState((prev) => ({ ...prev, hasReminder: !prev.hasReminder }));
                    setActiveSavedFilterId(null);
                  }}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap border ${
                    filterState.hasReminder
                      ? 'bg-rose-100 border-rose-300 text-rose-900 shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Clock className="w-3 h-3 text-rose-600" />
                  <span>Avec Rappel</span>
                </button>

                <button
                  onClick={() => {
                    const isUnassigned = filterState.selectedAssignee === 'unassigned';
                    setFilterState((prev) => ({
                      ...prev,
                      selectedAssignee: isUnassigned ? 'all' : 'unassigned',
                    }));
                    setActiveSavedFilterId(null);
                  }}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap border ${
                    filterState.selectedAssignee === 'unassigned'
                      ? 'bg-sky-100 border-sky-300 text-sky-900 shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <UserCheck className="w-3 h-3 text-sky-600" />
                  <span>Non assignés</span>
                </button>

                {allAvailableTags.slice(0, 4).map(({ tag, count }) => {
                  const isSelected = filterState.selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => {
                        setFilterState((prev) => ({
                          ...prev,
                          selectedTags: isSelected
                            ? prev.selectedTags.filter((t) => t !== tag)
                            : [...prev.selectedTags, tag],
                        }));
                        setActiveSavedFilterId(null);
                      }}
                      className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1 whitespace-nowrap border ${
                        isSelected
                          ? 'bg-purple-100 border-purple-300 text-purple-900 shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Tag className="w-3 h-3 text-purple-500" />
                      <span>#{tag}</span>
                      <span className="text-[10px] text-slate-400">({count})</span>
                    </button>
                  );
                })}
              </div>

              {/* ACTIVE FILTER CHIPS */}
              <ActiveFilterChips
                filterState={filterState}
                users={users}
                onUpdateFilter={(updater) => {
                  setFilterState(updater);
                  setActiveSavedFilterId(null);
                }}
                onResetAll={handleResetAllFilters}
                onOpenSaveModal={() => setIsSaveFilterModalOpen(true)}
                totalFilteredCount={filteredLeads.length}
                totalLeadsCount={leads.length}
              />

              {/* ADVANCED FILTER DRAWER / PANEL */}
              <AdvancedFilterPanel
                isOpen={isAdvancedFilterOpen}
                onClose={() => setIsAdvancedFilterOpen(false)}
                filterState={filterState}
                onUpdateFilter={(updater) => {
                  setFilterState(updater);
                  setActiveSavedFilterId(null);
                }}
                onResetAll={handleResetAllFilters}
                onOpenSaveModal={() => setIsSaveFilterModalOpen(true)}
                allAvailableTags={allAvailableTags}
                users={users}
                matchingCount={filteredLeads.length}
              />
            </div>
          )}

          {/* BULK ACTIONS TOOLBAR WHEN LEADS ARE SELECTED */}
          {selectedLeadIds.size > 0 && (
            <BulkActionsBar
              selectedLeadIds={selectedLeadIds}
              filteredLeads={filteredLeads}
              users={users}
              canDeleteLeads={canDeleteLeads}
              onSelectAll={handleSelectAllFiltered}
              onClearSelection={handleClearSelection}
              onOpenTagModal={() => setIsBulkTagModalOpen(true)}
              onOpenDeleteModal={() => setIsBulkDeleteModalOpen(true)}
              onBatchStatusChange={handleBatchStatusChange}
              onBatchAssignUser={handleBatchAssignUser}
              onBatchExportCsv={handleBatchExportCsv}
            />
          )}

          {/* VIEW: TABLE */}
          {viewMode === 'table' && (
            <div className="rounded-3xl bg-white border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="text-[11px] uppercase tracking-wider text-slate-500 bg-slate-50 border-b border-slate-200 font-semibold">
                    <tr>
                      <th className="py-3.5 px-3 w-10 text-center">
                        <input
                          type="checkbox"
                          ref={selectAllCheckboxRef}
                          checked={filteredLeads.length > 0 && selectedLeadIds.size === filteredLeads.length}
                          onChange={() => {
                            if (selectedLeadIds.size === filteredLeads.length) {
                              handleClearSelection();
                            } else {
                              handleSelectAllFiltered();
                            }
                          }}
                          className="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                          title="Tout sélectionner / Tout désélectionner"
                        />
                      </th>
                      <th className="py-3.5 px-4">Prospect</th>
                      <th className="py-3.5 px-4">Entreprise & Ville</th>
                      <th className="py-3.5 px-4">Tags</th>
                      <th className="py-3.5 px-4">Assignation & Routage</th>
                      <th className="py-3.5 px-4">Source</th>
                      <th className="py-3.5 px-4">Statut</th>
                      <th className="py-3.5 px-4">Rappel</th>
                      <th className="py-3.5 px-4">Date</th>
                      <th className="py-3.5 px-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredLeads.map((lead) => {
                      const isSelected = selectedLeadIds.has(lead.id);
                      const reminderInfo = lead.reminderDate ? formatReminderTime(lead.reminderDate) : null;
                      const assignee = users.find((u) => u.id === lead.assignedUserId);
                      const matchedRule = routingRules.find((r) => r.id === lead.routedByRuleId);

                      return (
                        <tr
                          key={lead.id}
                          onClick={() => setSelectedLead(lead)}
                          className={`transition cursor-pointer ${
                            isSelected
                              ? 'bg-purple-50/60 hover:bg-purple-50/90'
                              : 'hover:bg-slate-50/70'
                          }`}
                        >
                          {/* Selection Checkbox */}
                          <td className="py-4 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelectLead(lead.id)}
                              className="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                            />
                          </td>

                          {/* Name + Avatar */}
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleLeadFavorite(lead.id);
                                }}
                                className="text-slate-300 hover:text-amber-400 transition cursor-pointer"
                              >
                                <Star className={`w-4 h-4 ${lead.isFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
                              </button>
                              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                                {lead.firstName[0]}{lead.lastName[0]}
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <p className="font-bold text-slate-800 text-xs">
                                    {lead.firstName} {lead.lastName}
                                  </p>
                                  {lead.interactions && lead.interactions.length > 0 && (
                                    <span 
                                      className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100" 
                                      title={`${lead.interactions.length} interaction(s)`}
                                    >
                                      <MessageSquare className="w-2.5 h-2.5" />
                                      {lead.interactions.length}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-500">{lead.email}</p>
                              </div>
                            </div>
                          </td>

                          {/* Company & City */}
                          <td className="py-4 px-4">
                            <p className="font-semibold text-slate-800 text-xs">{lead.company || '—'}</p>
                            <div className="flex items-center gap-1 text-[11px] text-slate-500">
                              {lead.city && (
                                <span className="flex items-center gap-0.5 text-slate-600">
                                  <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                                  {lead.city}
                                </span>
                              )}
                              {lead.jobTitle && (
                                <span>• {lead.jobTitle}</span>
                              )}
                            </div>
                          </td>

                          {/* Tags */}
                          <td className="py-4 px-4" onClick={(e) => e.stopPropagation()}>
                            {lead.tags && lead.tags.length > 0 ? (
                              <div className="flex flex-wrap gap-1 max-w-[170px]">
                                {lead.tags.slice(0, 2).map((t) => (
                                  <span
                                    key={t}
                                    onClick={() => {
                                      setFilterState((prev) => ({
                                        ...prev,
                                        selectedTags: prev.selectedTags.includes(t) ? prev.selectedTags : [...prev.selectedTags, t],
                                      }));
                                      setActiveSavedFilterId(null);
                                    }}
                                    className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 cursor-pointer transition"
                                    title={`Filtrer par #${t}`}
                                  >
                                    #{t}
                                  </span>
                                ))}
                                {lead.tags.length > 2 && (
                                  <span 
                                    className="px-1.5 py-0.5 rounded text-[10px] font-semibold text-slate-500 bg-slate-100 border border-slate-200" 
                                    title={lead.tags.slice(2).map(t => `#${t}`).join(', ')}
                                  >
                                    +{lead.tags.length - 2}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400">—</span>
                            )}
                          </td>

                          {/* Assignee & Routing Rule */}
                          <td className="py-4 px-4" onClick={(e) => e.stopPropagation()}>
                            {assignee ? (
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-1.5">
                                  <img
                                    src={assignee.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                                    alt={assignee.name}
                                    className="w-5 h-5 rounded-full object-cover border border-indigo-300"
                                  />
                                  <span className="font-bold text-slate-800 text-xs">
                                    {assignee.name.split(' ')[0]}
                                  </span>
                                </div>
                                {lead.routedByRuleId ? (
                                  <span
                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 max-w-[150px] truncate"
                                    title={lead.routedReason || (matchedRule ? matchedRule.name : 'Auto-routé')}
                                  >
                                    <Sparkles className="w-2.5 h-2.5 text-indigo-600 shrink-0" />
                                    <span className="truncate">Auto-routé</span>
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-slate-400">Manuel</span>
                                )}
                              </div>
                            ) : (
                              <button
                                onClick={() => handleReassignLead(lead.id, users[0]?.id || '')}
                                className="px-2 py-1 rounded-lg text-[11px] font-semibold text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 border border-dashed border-slate-300 transition"
                              >
                                + Assigner
                              </button>
                            )}
                          </td>

                          {/* Source */}
                          <td className="py-4 px-4">
                            <span className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border ${
                              lead.source === 'nfc'
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                : lead.source === 'qr'
                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}>
                              {lead.source.toUpperCase()}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="py-4 px-4" onClick={(e) => e.stopPropagation()}>
                            <select
                              value={lead.status}
                              onChange={(e) => updateLeadStatus(lead.id, e.target.value as LeadStatus)}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-50 border border-slate-200 text-slate-700 focus:bg-white cursor-pointer"
                            >
                              <option value="new">Nouveau</option>
                              <option value="contacted">Contacté</option>
                              <option value="qualified">Qualifié</option>
                              <option value="proposal">Proposition</option>
                              <option value="won">Gagné</option>
                            </select>
                          </td>

                          {/* Reminder Column */}
                          <td className="py-4 px-4" onClick={(e) => e.stopPropagation()}>
                            {reminderInfo ? (
                              <button
                                onClick={() => setReminderModalLead(lead)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition cursor-pointer ${
                                  reminderInfo.isPast
                                    ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 animate-pulse'
                                    : reminderInfo.isToday
                                    ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                                    : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                                }`}
                                title={`Rappel : ${lead.reminderNote || 'Relance'}`}
                              >
                                <Bell className="w-3.5 h-3.5 shrink-0" />
                                <span>{reminderInfo.label}</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => setReminderModalLead(lead)}
                                className="px-2 py-1 rounded-lg text-[11px] font-semibold text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 border border-dashed border-slate-200 hover:border-indigo-200 transition flex items-center gap-1 cursor-pointer"
                              >
                                <Clock className="w-3 h-3" />
                                <span>Rappel</span>
                              </button>
                            )}
                          </td>

                          {/* Date */}
                          <td className="py-4 px-4 text-xs text-slate-500">
                            {new Date(lead.createdAt).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: 'short',
                            })}
                          </td>

                          {/* Actions */}
                          <td className="py-4 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setTestLeadSimulator(lead)}
                                className="p-2 rounded-xl bg-slate-50 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 border border-slate-200 transition cursor-pointer"
                                title="Tester le routage sur ce prospect"
                              >
                                <Route className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setSelectedLead(lead)}
                                className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition cursor-pointer"
                                title="Voir la fiche détaillée"
                              >
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredLeads.length === 0 && (
                      <tr>
                        <td colSpan={10} className="py-12 px-4 text-center">
                          <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto text-slate-500">
                            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                              <Filter className="w-6 h-6" />
                            </div>
                            <p className="font-bold text-slate-700 text-sm">Aucun prospect correspondant</p>
                            <p className="text-xs text-slate-500">
                              Modifiez vos filtres ou effectuez une nouvelle recherche pour afficher vos contacts.
                            </p>
                            {activeFiltersCount > 0 && (
                              <button
                                onClick={handleResetAllFilters}
                                className="mt-2 py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                              >
                                Réinitialiser les filtres
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VIEW: KANBAN PIPELINE */}
          {viewMode === 'kanban' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
              {statusColumns.map((col) => {
                const colLeads = filteredLeads.filter((l) => l.status === col.id);
                return (
                  <div key={col.id} className="p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col gap-2.5 sm:gap-3 min-h-[450px] sm:min-h-[500px]">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className={`text-[11px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full border ${col.badgeClass}`}>
                        {col.label}
                      </span>
                      <span className="text-xs font-bold text-slate-400">{colLeads.length}</span>
                    </div>

                    <div className="flex flex-col gap-2 sm:gap-2.5 overflow-y-auto flex-1">
                      {colLeads.map((lead) => {
                        const reminderInfo = lead.reminderDate ? formatReminderTime(lead.reminderDate) : null;
                        const assignee = users.find((u) => u.id === lead.assignedUserId);

                        return (
                          <div
                            key={lead.id}
                            onClick={() => setSelectedLead(lead)}
                            className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-slate-50/80 border border-slate-200/80 hover:bg-white hover:shadow-md transition cursor-pointer flex flex-col gap-2 sm:gap-2.5 group"
                          >
                            <div className="flex items-start justify-between gap-1">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <h4 className="font-bold text-slate-800 text-xs truncate">
                                  {lead.firstName} {lead.lastName}
                                </h4>
                                {lead.interactions && lead.interactions.length > 0 && (
                                  <span 
                                    className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 shrink-0" 
                                    title={`${lead.interactions.length} interaction(s)`}
                                  >
                                    <MessageSquare className="w-2.5 h-2.5" />
                                    {lead.interactions.length}
                                  </span>
                                )}
                              </div>
                              <span className="text-[9px] sm:text-[10px] font-medium text-slate-500 uppercase shrink-0">
                                {lead.source}
                              </span>
                            </div>

                            {lead.company && (
                              <p className="text-[11px] sm:text-xs text-slate-500 truncate">
                                {lead.jobTitle ? `${lead.jobTitle} • ` : ''}{lead.company}
                              </p>
                            )}

                            {/* Assignee & Routing Badge */}
                            {assignee && (
                              <div className="flex items-center justify-between text-[11px] pt-1">
                                <div className="flex items-center gap-1.5">
                                  <img
                                    src={assignee.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                                    alt={assignee.name}
                                    className="w-4 h-4 rounded-full object-cover"
                                  />
                                  <span className="text-slate-700 font-semibold text-[11px] truncate max-w-[100px]">
                                    {assignee.name}
                                  </span>
                                </div>
                                {lead.routedByRuleId && (
                                  <span className="text-[9px] text-indigo-700 font-bold bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200 shrink-0">
                                    🎯 Auto
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Reminder Badge if active */}
                            {reminderInfo && (
                              <div 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setReminderModalLead(lead);
                                }}
                                className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg text-[10px] sm:text-[11px] font-bold flex items-center gap-1.5 border transition cursor-pointer ${
                                  reminderInfo.isPast
                                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                                    : reminderInfo.isToday
                                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                                    : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                }`}
                              >
                                <Bell className="w-3 h-3 shrink-0" />
                                <span className="truncate">{reminderInfo.label}</span>
                              </div>
                            )}

                            {lead.tags && lead.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-0.5">
                                {lead.tags.slice(0, 2).map((t, idx) => (
                                  <span key={idx} className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100 font-medium truncate max-w-[110px]">
                                    #{t}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* VIEW: CALENDAR */}
          {viewMode === 'calendar' && (
            <LeadRemindersCalendar
              leads={filteredLeads}
              onSelectLead={(lead) => setSelectedLead(lead)}
              onOpenScheduleModal={(lead) => setReminderModalLead(lead)}
            />
          )}

          {/* VIEW: REMINDERS & FOLLOW-UP TASKS MANAGER */}
          {viewMode === 'reminders' && (
            <LeadRemindersManager
              leads={leads}
              onSelectLead={(lead) => setSelectedLead(lead)}
              onOpenScheduleModal={(lead) => setReminderModalLead(lead)}
            />
          )}

          {/* VIEW: SAVED FILTERS & SEGMENTS */}
          {viewMode === 'saved_filters' && (
            <SavedFiltersView
              savedFilters={savedFilters}
              allLeads={leads}
              currentFilterState={filterState}
              onApplyFilter={handleApplySavedFilter}
              onDeleteFilter={handleDeleteSavedFilter}
              onOpenSaveModal={() => setIsSaveFilterModalOpen(true)}
              onResetDefaults={handleResetSavedFiltersToDefaults}
            />
          )}
        </>
      )}

      {/* LEAD DETAIL DRAWER / MODAL */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-lg h-full bg-white border-l border-slate-200 p-6 sm:p-8 shadow-2xl text-slate-800 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
            
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center font-bold text-base">
                    {selectedLead.firstName[0]}{selectedLead.lastName[0]}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">
                      {selectedLead.firstName} {selectedLead.lastName}
                    </h3>
                    <p className="text-xs text-slate-500">{selectedLead.company || 'Particulier'}</p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedLead(null)}
                  className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status Selector */}
              <div className="my-5">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  Étape du Pipeline Commercial
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {statusColumns.map((st) => (
                    <button
                      key={st.id}
                      onClick={() => {
                        updateLeadStatus(selectedLead.id, st.id);
                        setSelectedLead({ ...selectedLead, status: st.id });
                      }}
                      className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                        selectedLead.status === st.id
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {st.label.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* DEDICATED ROUTING & ASSIGNATION SECTION */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 flex flex-col gap-3 my-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-indigo-600" />
                    <span>Attribution Commerciale</span>
                  </span>
                  {selectedLead.routedByRuleId && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 text-indigo-800 border border-indigo-200 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-indigo-600" />
                      <span>Routé par Règle</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-500 shrink-0 font-medium">Assigné à :</label>
                  <select
                    value={selectedLead.assignedUserId || ''}
                    onChange={(e) => handleReassignLead(selectedLead.id, e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Non assigné</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedLead.routedReason && (
                  <div className="p-2.5 rounded-xl bg-white border border-indigo-100 text-[11px] text-indigo-900 space-y-1">
                    <span className="font-bold block">Critère de ciblage validé :</span>
                    <p className="text-slate-600">{selectedLead.routedReason}</p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setTestLeadSimulator(selectedLead);
                    }}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <Route className="w-3.5 h-3.5" />
                    <span>Tester la règle de routage pour ce contact</span>
                  </button>
                </div>
              </div>

              {/* DEDICATED CRM & ERP SYNC SECTION */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 flex flex-col gap-3 my-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <span>Liaison CRM & Connecteurs</span>
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">
                    REST API v3
                  </span>
                </div>

                {/* CRM Badges */}
                <div className="flex flex-wrap gap-2">
                  {['hubspot', 'salesforce', 'pipedrive', 'zoho'].map((crmKey) => {
                    const int = integrations.find((i) => i.provider === crmKey);
                    const syncInfo = selectedLead.crmSyncStatus?.[crmKey as any];
                    const isSynced = syncInfo?.status === 'synced';
                    const logo = crmKey === 'hubspot' ? '🟠' : crmKey === 'salesforce' ? '☁️' : crmKey === 'pipedrive' ? '🟢' : '🔴';
                    const name = crmKey === 'hubspot' ? 'HubSpot' : crmKey === 'salesforce' ? 'Salesforce' : crmKey === 'pipedrive' ? 'Pipedrive' : 'Zoho';

                    if (!int || int.status !== 'connected') return null;

                    return (
                      <div
                        key={crmKey}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold border transition ${
                          isSynced
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}
                      >
                        <span>{logo}</span>
                        <span>{name}</span>
                        <span>{isSynced ? '✓ Synchronisé' : '○ En attente'}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-500">
                    Pousser ce contact immédiatement vers vos CRM connectés :
                  </span>
                  <button
                    type="button"
                    disabled={isPushingCrm}
                    onClick={async () => {
                      setIsPushingCrm(true);
                      try {
                        await syncLeadToCrm(selectedLead.id);
                        const updated = leads.find((l) => l.id === selectedLead.id);
                        if (updated) setSelectedLead(updated);
                      } finally {
                        setIsPushingCrm(false);
                      }
                    }}
                    className="py-1.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>{isPushingCrm ? 'Synchronisation...' : 'Pousser au CRM'}</span>
                  </button>
                </div>
              </div>

              {/* DEDICATED REMINDER & FOLLOW-UP SECTION */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50/70 to-purple-50/70 border border-indigo-100 flex flex-col gap-3 my-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-950 flex items-center gap-2">
                    <Bell className="w-4 h-4 text-indigo-600" />
                    Rappel de Relance Commerciale
                  </span>

                  {selectedLead.reminderDate && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white shadow-2xs">
                      {formatReminderTime(selectedLead.reminderDate).label}
                    </span>
                  )}
                </div>

                {selectedLead.reminderDate ? (
                  <div className="p-3 bg-white rounded-xl border border-indigo-100 text-xs flex flex-col gap-2 shadow-2xs">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-bold text-slate-800">
                          {new Date(selectedLead.reminderDate).toLocaleDateString('fr-FR', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                        {selectedLead.reminderNote && (
                          <p className="text-slate-600 text-[11px] mt-0.5">
                            Note : « {selectedLead.reminderNote} »
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => handleSaveReminder(selectedLead.id, undefined, undefined)}
                        className="text-slate-400 hover:text-rose-600 p-1 transition cursor-pointer"
                        title="Annuler ce rappel"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => setReminderModalLead(selectedLead)}
                        className="py-1.5 px-3 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Modifier l'heure</span>
                      </button>

                      <button
                        onClick={() => setAppointmentModalLead(selectedLead)}
                        className="py-1.5 px-3 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Fixer RDV (.ics / Agenda)</span>
                      </button>

                      <button
                        onClick={() => {
                          updateLeadDetails(selectedLead.id, { reminderStatus: 'completed' });
                          setSelectedLead({ ...selectedLead, reminderStatus: 'completed' });
                          showToast('Rappel marqué comme effectué !');
                        }}
                        className="py-1.5 px-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Marquer fait</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <p className="text-xs text-slate-600">
                      Planifiez un rappel navigateur ou générez une invitation de calendrier (.ics / Google / Outlook).
                    </p>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setAppointmentModalLead(selectedLead)}
                        className="py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Planifier RDV</span>
                      </button>
                      <button
                        onClick={() => setReminderModalLead(selectedLead)}
                        className="py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                      >
                        <Bell className="w-3.5 h-3.5" />
                        <span>Rappel</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* DEDICATED GOOGLE WORKSPACE ACTION BAR */}
              <div className="my-4">
                <GoogleWorkspaceLeadBar lead={selectedLead} />
              </div>

              {/* Coordinates details */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col gap-3.5 my-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-indigo-500" />
                    Email
                  </span>
                  <a href={`mailto:${selectedLead.email}`} className="font-semibold text-indigo-600 hover:underline">
                    {selectedLead.email}
                  </a>
                </div>

                {selectedLead.phone && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      Téléphone
                    </span>
                    <a href={`tel:${selectedLead.phone}`} className="font-semibold text-slate-800 hover:underline">
                      {selectedLead.phone}
                    </a>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 flex items-center gap-2">
                    <Building className="w-3.5 h-3.5 text-indigo-500" />
                    Société
                  </span>
                  <span className="font-semibold text-slate-800">{selectedLead.company || '—'}</span>
                </div>

                {selectedLead.city && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      Ville / Région
                    </span>
                    <span className="font-semibold text-slate-800">{selectedLead.city}{selectedLead.country ? `, ${selectedLead.country}` : ''}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 flex items-center gap-2">
                    <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
                    Poste / Fonction
                  </span>
                  <span className="font-semibold text-slate-800">{selectedLead.jobTitle || '—'}</span>
                </div>

                <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-200">
                  <span className="text-slate-500">Canal de capture</span>
                  <span className="font-bold uppercase text-indigo-600">{selectedLead.source}</span>
                </div>
              </div>

              {/* GOOGLE MAPS INTEGRATION */}
              {selectedLead.city && (
                <div className="my-4 flex flex-col gap-1.5">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-600" />
                    Localisation Google Maps
                  </span>
                  <GoogleMapsEmbed
                    city={selectedLead.city}
                    country={selectedLead.country || 'France'}
                    height="180px"
                  />
                </div>
              )}

              {/* Notes */}
              <div className="flex flex-col gap-3 my-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Notes de suivi internes</label>
                  <textarea
                    rows={3}
                    value={selectedLead.notes || ''}
                    onChange={(e) => {
                      const newNotes = e.target.value;
                      setSelectedLead({ ...selectedLead, notes: newNotes });
                      updateLeadDetails(selectedLead.id, { notes: newNotes });
                    }}
                    placeholder="Ajouter des remarques ou besoins spécifiques..."
                    className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Tags */}
              <div className="my-4">
                <label className="block text-xs font-bold text-slate-700 mb-2">Tags associés</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {selectedLead.tags?.map((tag, idx) => (
                    <span key={idx} className="text-xs px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100 font-medium">
                      #{tag}
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ajouter un tag..."
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag(selectedLead.id);
                      }
                    }}
                    className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    onClick={() => handleAddTag(selectedLead.id)}
                    className="px-3 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition cursor-pointer"
                  >
                    Ajouter
                  </button>
                </div>
              </div>

              {/* INTERACTION TIMELINE */}
              <div className="my-4 pt-4 border-t border-slate-200">
                <LeadInteractionHistory
                  lead={selectedLead}
                  onInteractionChange={() => {
                    const freshLead = leads.find((l) => l.id === selectedLead.id);
                    if (freshLead) {
                      setSelectedLead(freshLead);
                    }
                  }}
                />
              </div>
            </div>

            {/* Footer / Delete */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-4">
              <button
                onClick={() => {
                  if (confirm('Voulez-vous supprimer définitivement ce prospect ?')) {
                    deleteLead(selectedLead.id);
                    setSelectedLead(null);
                  }
                }}
                className="text-xs text-rose-600 hover:text-rose-800 flex items-center gap-1.5 font-semibold transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Supprimer ce prospect</span>
              </button>

              <button
                onClick={() => setSelectedLead(null)}
                className="py-2 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SCHEDULE REMINDER MODAL */}
      {reminderModalLead && (
        <ScheduleReminderModal
          lead={reminderModalLead}
          isOpen={!!reminderModalLead}
          onClose={() => setReminderModalLead(null)}
          onSaveReminder={(leadId, date, note) => {
            handleSaveReminder(leadId, date, note);
            setReminderModalLead(null);
          }}
          onSave={(date, note) => {
            handleSaveReminder(reminderModalLead.id, date, note);
            setReminderModalLead(null);
          }}
        />
      )}

      {/* SCHEDULE APPOINTMENT / CALENDAR EVENT MODAL */}
      {appointmentModalLead && (
        <ScheduleAppointmentModal
          lead={appointmentModalLead}
          isOpen={!!appointmentModalLead}
          onClose={() => setAppointmentModalLead(null)}
          onAppointmentScheduled={(updatedLead) => {
            if (selectedLead && selectedLead.id === updatedLead.id) {
              setSelectedLead(updatedLead);
            }
          }}
        />
      )}

      {/* ROUTING SIMULATOR FOR A SPECIFIC LEAD */}
      {testLeadSimulator && (
        <RoutingSimulatorModal
          isOpen={!!testLeadSimulator}
          onClose={() => setTestLeadSimulator(null)}
          initialLead={testLeadSimulator}
        />
      )}

      {/* MANUAL LEAD CREATION MODAL */}
      <ManualLeadModal
        isOpen={isManualLeadModalOpen}
        onClose={() => setIsManualLeadModalOpen(false)}
      />

      {/* SAVE FILTER MODAL */}
      <SavedFiltersModal
        isOpen={isSaveFilterModalOpen}
        onClose={() => setIsSaveFilterModalOpen(false)}
        currentFilterState={filterState}
        onSaveFilter={handleSaveNewFilter}
      />

      {/* BULK TAG ASSIGNMENT MODAL */}
      <BulkTagModal
        selectedLeads={selectedLeadsArray}
        allAvailableTags={allAvailableTags}
        isOpen={isBulkTagModalOpen}
        onClose={() => setIsBulkTagModalOpen(false)}
        onApplyTags={handleBatchApplyTags}
      />

      {/* BULK DELETION CONFIRMATION MODAL */}
      <BulkDeleteModal
        selectedLeads={selectedLeadsArray}
        isOpen={isBulkDeleteModalOpen}
        onClose={() => setIsBulkDeleteModalOpen(false)}
        onConfirmDelete={handleBatchDelete}
      />
    </div>
  );
};
